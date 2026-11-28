import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function normalizarRut(valor: string): string {
  const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
  return /^\d{7,8}[0-9K]$/.test(limpio) ? `${limpio.slice(0, -1)}-${limpio.slice(-1)}` : limpio;
}

export function validarRut(valor: string): boolean {
  const rut = valor.replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;
  const cuerpo = rut.slice(0, -1);
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return rut.endsWith(dv);
}

export const rutBusquedaValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = String(control.value ?? '').trim();
  if (!valor || !/^[\d.kK\-\s]+$/.test(valor)) return null;
  return validarRut(valor) ? null : { rutInvalido: true };
};
