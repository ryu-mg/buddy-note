export function buildDeleteConfirmationText(petName: string | null) {
  const name = petName?.trim() || '반려동물'

  return `${name}과의 추억 삭제`
}
