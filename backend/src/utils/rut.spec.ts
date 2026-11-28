import { normalizarRut, validarRut } from './rut';

describe('RUT chileno', () => {
  test.each([
    ['12.345.678-5', '12345678-5'],
    ['12345678-5', '12345678-5'],
    ['123456785', '12345678-5'],
    ['15.432.109-8', '15432109-8'],
    ['8.765.432-k', '8765432-K'],
  ])('normaliza %s', (entrada, esperado) => {
    expect(normalizarRut(entrada)).toBe(esperado);
    expect(validarRut(entrada)).toBe(true);
  });

  test.each(['12.345.678-9', '123', 'abcdefgh-k', '123456789'])('rechaza %s', (entrada) => {
    expect(validarRut(entrada)).toBe(false);
  });
});
