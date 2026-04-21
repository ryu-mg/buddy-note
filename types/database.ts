/**
 * Hand-written initial database types for buddy-note.
 *
 * REGENERATE with the Supabase CLI once you're connected to a project:
 *
 *   supabase gen types typescript --local > types/database.ts
 *
 * Keeping this file hand-written for Week 1 so we can start typed queries
 * before the CLI is wired up. Keep in sync with:
 *   supabase/migrations/20260419000001_initial_schema.sql
 *   supabase/migrations/20260419000002_rls_policies.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// -----------------------------------------------------------------------------
// Domain enums (not enforced at DB level for all; see comments)
// -----------------------------------------------------------------------------

export type PetSpecies = 'dog';

/**
 * Log tag vocabulary. DB column is text[] with no enum check — the LLM
 * tool_use schema (lib/llm/schema.ts) is the source of truth. Keep this
 * union in sync with that schema.
 */
export type LogTag =
  | 'meal'
  | 'walk'
  | 'bathroom'
  | 'play'
  | 'sleep'
  | 'outing'
  | 'bath'
  | 'snack';

export type MemoryUpdateQueueStatus =
  | 'pending'
  | 'processing'
  | 'done'
  | 'failed';

/**
 * Entry in pet_memory_summary.recent_callbacks (jsonb).
 * referenceDate is ISO 8601 date (YYYY-MM-DD).
 * Source of truth: lib/llm/memory-schemas.ts#recentCallbackSchema
 */
export interface RecentCallback {
  note: string;
  source: 'log' | 'diary';
  referenceDate: string;
}

/**
 * pets.persona_answers jsonb shape. Q1-Q4 from lib/pet-mbti.ts.
 */
export interface PersonaAnswers {
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
}

// -----------------------------------------------------------------------------
// Table row types
// -----------------------------------------------------------------------------

export interface PetRow {
  id: string;
  user_id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  guardian_relationship: string | null;
  personality_code: string | null;
  personality_label: string | null;
  persona_answers: PersonaAnswers;
  persona_prompt_fragment: string | null;
  slug: string;
  is_public: boolean;
  /** v2 memorial support; null in v1. */
  deceased_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PetInsert = Omit<
  PetRow,
  'id' | 'created_at' | 'updated_at' | 'is_public' | 'persona_answers' | 'deceased_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  is_public?: boolean;
  guardian_relationship?: string | null;
  personality_code?: string | null;
  personality_label?: string | null;
  persona_answers?: PersonaAnswers;
  deceased_at?: string | null;
};

export type PetUpdate = Partial<PetInsert>;

export interface LogRow {
  id: string;
  pet_id: string;
  photo_url: string;
  photo_storage_path: string;
  tags: LogTag[];
  memo: string | null;
  log_date: string;
  created_at: string;
}

export type LogInsert = Omit<LogRow, 'id' | 'created_at' | 'tags' | 'log_date'> & {
  id?: string;
  created_at?: string;
  tags?: LogTag[];
  log_date?: string;
};

export type LogUpdate = Partial<LogInsert>;

export interface DiaryRow {
  id: string;
  log_id: string;
  pet_id: string;
  title: string;
  body: string;
  image_url_916: string | null;
  image_url_45: string | null;
  image_url_11: string | null;
  is_fallback: boolean;
  model_used: string | null;
  latency_ms: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  created_at: string;
}

export type DiaryInsert = Omit<
  DiaryRow,
  'id' | 'created_at' | 'is_fallback'
> & {
  id?: string;
  created_at?: string;
  is_fallback?: boolean;
};

export type DiaryUpdate = Partial<DiaryInsert>;

export interface PetMemorySummaryRow {
  pet_id: string;
  tone_description: string | null;
  recurring_habits: string[];
  favorite_things: string[];
  recent_callbacks: RecentCallback[];
  version: number;
  updated_at: string;
}

export type PetMemorySummaryInsert = Omit<
  PetMemorySummaryRow,
  'updated_at' | 'version' | 'recurring_habits' | 'favorite_things' | 'recent_callbacks'
> & {
  updated_at?: string;
  version?: number;
  recurring_habits?: string[];
  favorite_things?: string[];
  recent_callbacks?: RecentCallback[];
};

export type PetMemorySummaryUpdate = Partial<PetMemorySummaryInsert>;

export interface MemoryUpdateQueueRow {
  id: number;
  pet_id: string;
  log_id: string;
  status: MemoryUpdateQueueStatus;
  attempts: number;
  last_error: string | null;
  locked_until: string | null;
  created_at: string;
}

export type MemoryUpdateQueueInsert = Omit<
  MemoryUpdateQueueRow,
  'id' | 'created_at' | 'status' | 'attempts' | 'last_error' | 'locked_until'
> & {
  id?: number;
  created_at?: string;
  status?: MemoryUpdateQueueStatus;
  attempts?: number;
  last_error?: string | null;
  locked_until?: string | null;
};

export type MemoryUpdateQueueUpdate = Partial<MemoryUpdateQueueInsert>;

export interface SlugReservedRow {
  slug: string;
}

export type SlugReservedInsert = SlugReservedRow;
export type SlugReservedUpdate = Partial<SlugReservedRow>;

// -----------------------------------------------------------------------------
// Aggregate Database shape — compatible with @supabase/supabase-js createClient<Database>()
// -----------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      pets: {
        Row: PetRow;
        Insert: PetInsert;
        Update: PetUpdate;
      };
      logs: {
        Row: LogRow;
        Insert: LogInsert;
        Update: LogUpdate;
      };
      diaries: {
        Row: DiaryRow;
        Insert: DiaryInsert;
        Update: DiaryUpdate;
      };
      pet_memory_summary: {
        Row: PetMemorySummaryRow;
        Insert: PetMemorySummaryInsert;
        Update: PetMemorySummaryUpdate;
      };
      memory_update_queue: {
        Row: MemoryUpdateQueueRow;
        Insert: MemoryUpdateQueueInsert;
        Update: MemoryUpdateQueueUpdate;
      };
      slug_reserved: {
        Row: SlugReservedRow;
        Insert: SlugReservedInsert;
        Update: SlugReservedUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
