// ADMIN_EMAILS（カンマ区切り）の解析と判定。
// pure 関数として切り出し、unit test 可能にする

export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

export function isAdminEmail(
  email: string | undefined,
  allowlist: string[],
): boolean {
  if (!email) return false
  return allowlist.includes(email.trim().toLowerCase())
}
