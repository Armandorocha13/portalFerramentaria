import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Mock do módulo do Supabase para não conectar no banco real durante os testes
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    },
}));

describe('AuthContext - Segurança e Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Usamos fake timers para simular a passagem de 5 minutos do bloqueio de rate limit
        vi.useFakeTimers();
    });

    it('deve retornar erro se usuário estiver vazio', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        let res: { success: boolean; error?: string } | undefined;
        await act(async () => {
            res = await result.current.login('', '');
        });

        expect(res?.success).toBe(false);
        expect(res?.error).toBe('Preencha matrícula e senha.');
    });

    it('deve bloquear após 5 tentativas inválidas e liberar após 5 minutos', async () => {
        // Configuramos o mock do RPC para SEMPRE retornar array vazio (falha no login)
        (supabase.rpc as any).mockResolvedValue({ data: [], error: null });

        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        // Tenta 4 vezes - ainda permitido
        for (let i = 0; i < 4; i++) {
            let res: { success: boolean; error?: string } | undefined;
            await act(async () => {
                res = await result.current.login('INVALIDO', '123');
            });
            expect(res?.success).toBe(false);
            expect(res?.error).toMatch(/tentativas? restante/);
        }

        // 5º vez - O Bloqueio!
        let blockRes: { success: boolean; error?: string } | undefined;
        await act(async () => {
            blockRes = await result.current.login('INVALIDO', '123');
        });
        expect(blockRes?.success).toBe(false);
        expect(blockRes?.error).toContain('Acesso bloqueado por 5 minutos');

        // Se tentar imediatamente após, deve rejeitar na hora por causa da trava do Rate Limit
        let lockedRes: { success: boolean; error?: string } | undefined;
        await act(async () => {
            lockedRes = await result.current.login('QUALQUER', 'COISA');
        });
        expect(lockedRes?.success).toBe(false);
        expect(lockedRes?.error).toContain('Muitas tentativas. Aguarde 5 minutos');

        // SIMULANDO A PASSAGEM DO TEMPO (5 minutos depois...)
        vi.advanceTimersByTime(5 * 60 * 1000 + 1000); // 5 min e 1 seg

        // Depois do tempo ter passado, tenta novamente. Deveria permitir tentar de novo,
        // mas como não é o usuário certo, dá erro de senha inválida (e não mais de bloqueio).
        let unlockRes: { success: boolean; error?: string } | undefined;
        await act(async () => {
            unlockRes = await result.current.login('INVALIDO', '123');
        });
        expect(unlockRes?.success).toBe(false);
        expect(unlockRes?.error).not.toContain('Acesso bloqueado');
        expect(unlockRes?.error).toMatch(/4 tentativas? restante/);
    });
});
