import { describe, it, expect } from 'vitest';
import { calcularPrazoD1 } from '../mocks/database'; // Importamos de onde a função foi documentada

describe('calcularPrazoD1', () => {
    it('deve adicionar 1 dia útil a uma terça-feira', () => {
        // Segunda: 2025-11-17 -> Terça: 2025-11-18
        const resultado = calcularPrazoD1('2025-11-17');
        expect(resultado).toBe('2025-11-18');
    });

    it('deve pular o fim de semana quando a solicitação for na sexta-feira', () => {
        // Sexta: 2025-11-21 -> Segunda: 2025-11-24
        const resultado = calcularPrazoD1('2025-11-21');
        expect(resultado).toBe('2025-11-24');
    });

    it('deve ir para segunda se a solicitação for no sábado', () => {
        // Sábado: 2025-11-22 -> Segunda: 2025-11-24
        const resultado = calcularPrazoD1('2025-11-22');
        expect(resultado).toBe('2025-11-24');
    });

    it('deve ir para segunda se a solicitação for no domingo', () => {
        // Domingo: 2025-11-23 -> Segunda: 2025-11-24
        const resultado = calcularPrazoD1('2025-11-23');
        expect(resultado).toBe('2025-11-24');
    });
});
