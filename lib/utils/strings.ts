/** Escapa caracteres especiais do operador ilike do PostgreSQL */
export function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida e retorna email ou null. Lança erro se formato inválido. */
export function validateEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!EMAIL_RE.test(trimmed)) throw new Error("E-mail inválido");
  return trimmed;
}
