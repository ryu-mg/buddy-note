#!/usr/bin/env bun
/**
 * LLM A/B benchmark harness for buddy-note.
 *
 * Drops 5-10 pet photos into ./photos/, calls GPT-4o / Claude Sonnet 4.6 /
 * Gemini 2.5 Flash in parallel with the same Korean 1인칭 일기 prompt, and
 * writes per-model outputs + a side-by-side comparison for manual rubric scoring.
 *
 * Self-contained: delete this directory to remove the harness completely.
 */

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname, dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";

// Load .env from this script's directory (not the caller's cwd).
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
loadEnv({ path: join(SCRIPT_DIR, ".env") });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PHOTOS_DIR = join(SCRIPT_DIR, "photos");
const RESULTS_DIR = join(SCRIPT_DIR, "results");

const SUPPORTED_EXTS = new Set([".jpg", ".jpeg", ".png"]);

const PROMPT = `당신은 반려동물의 1인칭 시점으로 일기를 쓰는 작가입니다.

이 강아지의 가상 성격: ENFP 푸들 (밝고 활발하며, 엄마 껌딱지, 산책광, 낯선 소리에는 살짝 겁이 많음).
이름: 마루.

다음 사진을 보고, 마루의 1인칭 시점으로 오늘의 짧은 일기를 작성하세요.
- 3-5 문장
- 반말, 강아지다운 말투
- 사진 속 장면의 구체적 디테일 1-2개 인용
- 자기 성격이 자연스럽게 드러나게
- "오늘은..."으로 시작하지 마세요 (cliché)`;

// Cost in USD per 1M tokens (input / output). As of 2026-04.
const PRICING = {
  "gpt-4o": { input: 2.5, output: 10.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
} as const;

type ModelKey = keyof typeof PRICING;

const MODELS: ModelKey[] = ["gpt-4o", "claude-sonnet-4-6", "gemini-2.5-flash"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModelResult {
  model: ModelKey;
  ok: boolean;
  text: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  error?: string;
}

interface PhotoRun {
  photoName: string;
  results: ModelResult[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mimeFromExt(ext: string): "image/jpeg" | "image/png" {
  return ext === ".png" ? "image/png" : "image/jpeg";
}

function estimateCost(model: ModelKey, inTok: number, outTok: number): number {
  const p = PRICING[model];
  return (inTok / 1_000_000) * p.input + (outTok / 1_000_000) * p.output;
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(6)}`;
}

function errResult(model: ModelKey, latencyMs: number, err: unknown): ModelResult {
  const message = err instanceof Error ? err.message : String(err);
  return {
    model,
    ok: false,
    text: "",
    latencyMs,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    error: message,
  };
}

// ---------------------------------------------------------------------------
// Model adapters
// ---------------------------------------------------------------------------

async function runOpenAI(imageB64: string, mime: string): Promise<ModelResult> {
  const model: ModelKey = "gpt-4o";
  const t0 = performance.now();
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: key });

    const resp = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${imageB64}` },
            },
          ],
        },
      ],
      max_tokens: 400,
    });

    const latencyMs = Math.round(performance.now() - t0);
    const text = resp.choices[0]?.message?.content ?? "";
    const inTok = resp.usage?.prompt_tokens ?? 0;
    const outTok = resp.usage?.completion_tokens ?? 0;

    return {
      model,
      ok: true,
      text,
      latencyMs,
      inputTokens: inTok,
      outputTokens: outTok,
      costUsd: estimateCost(model, inTok, outTok),
    };
  } catch (err) {
    return errResult(model, Math.round(performance.now() - t0), err);
  }
}

async function runAnthropic(imageB64: string, mime: string): Promise<ModelResult> {
  const model: ModelKey = "claude-sonnet-4-6";
  const t0 = performance.now();
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: key });

    const resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mime as "image/jpeg" | "image/png",
                data: imageB64,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const latencyMs = Math.round(performance.now() - t0);
    const textBlock = resp.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const inTok = resp.usage?.input_tokens ?? 0;
    const outTok = resp.usage?.output_tokens ?? 0;

    return {
      model,
      ok: true,
      text,
      latencyMs,
      inputTokens: inTok,
      outputTokens: outTok,
      costUsd: estimateCost(model, inTok, outTok),
    };
  } catch (err) {
    return errResult(model, Math.round(performance.now() - t0), err);
  }
}

async function runGemini(imageB64: string, mime: string): Promise<ModelResult> {
  const model: ModelKey = "gemini-2.5-flash";
  const t0 = performance.now();
  try {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("GOOGLE_API_KEY not set");

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const client = new GoogleGenerativeAI(key);
    const m = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const resp = await m.generateContent([
      { inlineData: { data: imageB64, mimeType: mime } },
      { text: PROMPT },
    ]);

    const latencyMs = Math.round(performance.now() - t0);
    const text = resp.response.text();
    const usage = resp.response.usageMetadata;
    const inTok = usage?.promptTokenCount ?? 0;
    const outTok = usage?.candidatesTokenCount ?? 0;

    return {
      model,
      ok: true,
      text,
      latencyMs,
      inputTokens: inTok,
      outputTokens: outTok,
      costUsd: estimateCost(model, inTok, outTok),
    };
  } catch (err) {
    return errResult(model, Math.round(performance.now() - t0), err);
  }
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

async function runOnePhoto(photoPath: string): Promise<PhotoRun> {
  const photoName = basename(photoPath);
  const ext = extname(photoPath).toLowerCase();
  const mime = mimeFromExt(ext);
  const buf = await readFile(photoPath);
  const imageB64 = buf.toString("base64");

  console.log(`  [${photoName}] dispatching 3 models in parallel...`);

  const results = await Promise.all([
    runOpenAI(imageB64, mime),
    runAnthropic(imageB64, mime),
    runGemini(imageB64, mime),
  ]);

  for (const r of results) {
    const status = r.ok ? "ok" : `ERR: ${r.error}`;
    console.log(`    - ${r.model}: ${r.latencyMs}ms, ${status}`);
  }

  return { photoName, results };
}

async function writePerPhotoResults(run: PhotoRun, outDir: string) {
  const stem = run.photoName.replace(/\.[^.]+$/, "");
  const dir = join(outDir, stem);
  await mkdir(dir, { recursive: true });

  for (const r of run.results) {
    const header = [
      `# ${r.model} — ${run.photoName}`,
      "",
      "## Metadata",
      `- latency: ${r.latencyMs} ms`,
      `- input tokens: ${r.inputTokens}`,
      `- output tokens: ${r.outputTokens}`,
      `- cost (est): ${fmtUsd(r.costUsd)}`,
      `- status: ${r.ok ? "ok" : "error"}`,
      "",
      "## Diary",
      "",
    ].join("\n");
    const body = r.ok ? r.text : `**ERROR:** ${r.error ?? "unknown"}`;
    await writeFile(join(dir, `${r.model}.md`), `${header}${body}\n`, "utf8");
  }
}

function comparisonMarkdown(runs: PhotoRun[]): string {
  const lines: string[] = [];
  lines.push(`# LLM Benchmark Comparison`);
  lines.push("");
  lines.push(`- 생성 시각: ${new Date().toISOString()}`);
  lines.push(`- 사진 수: ${runs.length}`);
  lines.push(`- 모델: ${MODELS.join(", ")}`);
  lines.push("");

  // Summary table: latency / tokens / cost per photo × model.
  lines.push("## 요약 테이블 (레이턴시 / 토큰 / 비용)");
  lines.push("");
  lines.push(`| 사진 | ${MODELS.map((m) => `${m} ms`).join(" | ")} | ${MODELS.map((m) => `${m} $`).join(" | ")} |`);
  lines.push(
    `| --- | ${MODELS.map(() => "---:").join(" | ")} | ${MODELS.map(() => "---:").join(" | ")} |`,
  );
  for (const r of runs) {
    const byModel = new Map(r.results.map((x) => [x.model, x]));
    const latencyCells = MODELS.map((m) => {
      const x = byModel.get(m);
      return x ? (x.ok ? `${x.latencyMs}` : "ERR") : "-";
    });
    const costCells = MODELS.map((m) => {
      const x = byModel.get(m);
      return x && x.ok ? fmtUsd(x.costUsd) : "-";
    });
    lines.push(`| ${r.photoName} | ${latencyCells.join(" | ")} | ${costCells.join(" | ")} |`);
  }
  lines.push("");

  // Totals.
  lines.push("## 모델별 합계");
  lines.push("");
  lines.push(`| 모델 | 총 레이턴시 ms | 평균 ms | 총 input tok | 총 output tok | 총 비용 |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const m of MODELS) {
    const all = runs.flatMap((r) => r.results.filter((x) => x.model === m && x.ok));
    const totLat = all.reduce((s, x) => s + x.latencyMs, 0);
    const avgLat = all.length ? Math.round(totLat / all.length) : 0;
    const totIn = all.reduce((s, x) => s + x.inputTokens, 0);
    const totOut = all.reduce((s, x) => s + x.outputTokens, 0);
    const totCost = all.reduce((s, x) => s + x.costUsd, 0);
    lines.push(`| ${m} | ${totLat} | ${avgLat} | ${totIn} | ${totOut} | ${fmtUsd(totCost)} |`);
  }
  lines.push("");

  // Side-by-side diary outputs.
  lines.push("## 사진별 출력 비교");
  lines.push("");
  for (const r of runs) {
    lines.push(`### ${r.photoName}`);
    lines.push("");
    for (const m of MODELS) {
      const x = r.results.find((y) => y.model === m);
      lines.push(`#### ${m}`);
      lines.push("");
      if (!x) {
        lines.push("_(누락)_");
      } else if (!x.ok) {
        lines.push(`> ERROR: ${x.error ?? "unknown"}`);
      } else {
        lines.push("> " + x.text.replace(/\n/g, "\n> "));
      }
      lines.push("");
    }
  }

  // Manual rubric section.
  lines.push("## 수동 채점 루브릭 (각 축 1–5점)");
  lines.push("");
  lines.push(
    "축 정의: **창의성** (상투적이지 않고 신선한가), **페르소나 적합성** (ENFP 푸들 '마루' 성격이 드러나는가), **한국어 자연스러움** (반말·문장 구조·어휘), **디테일 근거** (사진의 구체적 디테일을 실제로 인용하는가).",
  );
  lines.push("");
  lines.push("각 사진별로 채점 후, 아래 평균 표에 기입하세요.");
  lines.push("");

  for (const r of runs) {
    lines.push(`### ${r.photoName} 채점`);
    lines.push("");
    lines.push(`| 모델 | 창의성 | 페르소나 | 한국어 | 디테일 근거 | 평균 | 메모 |`);
    lines.push(`| --- | ---: | ---: | ---: | ---: | ---: | --- |`);
    for (const m of MODELS) {
      lines.push(`| ${m} |  |  |  |  |  |  |`);
    }
    lines.push("");
  }

  lines.push("## 최종 모델별 평균 (사진 전체)");
  lines.push("");
  lines.push(`| 모델 | 창의성 | 페르소나 | 한국어 | 디테일 근거 | 종합 평균 |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const m of MODELS) {
    lines.push(`| ${m} |  |  |  |  |  |`);
  }
  lines.push("");
  lines.push("**판정 기준:** 종합 평균 4.0 이상 모델 중 비용/속도 최선을 v1으로 선택.");
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Discover photos.
  if (!existsSync(PHOTOS_DIR)) {
    await mkdir(PHOTOS_DIR, { recursive: true });
  }
  const entries = await readdir(PHOTOS_DIR);
  const photos = entries
    .filter((f) => SUPPORTED_EXTS.has(extname(f).toLowerCase()))
    .sort()
    .map((f) => join(PHOTOS_DIR, f));

  if (photos.length === 0) {
    console.log("no photos found, drop photos into ./photos/ (jpg/jpeg/png) and re-run.");
    process.exit(0);
  }

  console.log(`Found ${photos.length} photo(s). Running ${MODELS.length} models in parallel per photo.`);
  console.log(`Prompt: (${PROMPT.length} chars, Korean)`);
  console.log("");

  await mkdir(RESULTS_DIR, { recursive: true });

  const runs: PhotoRun[] = [];
  for (const p of photos) {
    const run = await runOnePhoto(p);
    await writePerPhotoResults(run, RESULTS_DIR);
    runs.push(run);
  }

  // Comparison file.
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const comparisonPath = join(RESULTS_DIR, `comparison-${ts}.md`);
  await writeFile(comparisonPath, comparisonMarkdown(runs), "utf8");

  console.log("");
  console.log(`Done.`);
  console.log(`  per-photo results: ${resolve(RESULTS_DIR)}/<photo>/<model>.md`);
  console.log(`  comparison:        ${resolve(comparisonPath)}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
