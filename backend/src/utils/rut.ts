/** Devuelve un RUT canónico: cuerpo sin separadores, guion y dígito verificador. */
export function normalizarRut(valor: string): string {
  const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

export function validarRut(valor: string): boolean {
  const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;

  const cuerpo = limpio.slice(0, -1);
  const digitoIngresado = limpio.slice(-1);
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return digitoIngresado === esperado;
}

/** Mantiene la escritura parcial del usuario y elimina formato para búsquedas parciales. */
export function normalizarRutBusqueda(valor: string): { canonico: string; compacto: string } {
  const compacto = valor.replace(/[.\s-]/g, '').toUpperCase();
  const canonico = validarRut(compacto) ? normalizarRut(compacto) : valor.trim().toUpperCase();
  return { canonico, compacto };
}
