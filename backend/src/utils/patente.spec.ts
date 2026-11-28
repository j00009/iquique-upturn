import { normalizarPatente, validarPatente } from './patente';

describe('patentes chilenas', () => {
  test('normaliza y valida los formatos antiguo y nuevo', () => {
    expect(normalizarPatente('ab-1234')).toBe('AB1234');
    expect(validarPatente('ab-1234')).toBe(true);
    expect(validarPatente('abcd12')).toBe(true);
  });

  test.each(['ABC123', 'ABCDE12', 'AB12CD', 'A12345', 'ABCD1'])('rechaza %s', (patente) => {
    expect(validarPatente(patente)).toBe(false);
  });
});
