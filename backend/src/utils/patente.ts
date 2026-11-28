export function normalizarPatente(valor: string): string {
  return valor.replace(/[\s-]/g, '').toUpperCase();
}

/** Valida los formatos chilenos antiguos (AB1234) y nuevos (ABCD12). */
export function validarPatente(valor: string): boolean {
  const patente = normalizarPatente(valor);
  return /^(?:[A-Z]{2}\d{4}|[A-Z]{4}\d{2})$/.test(patente);
}
