/** Gera data D+N (próximo dia útil simplificado) */
export function calcularPrazo(dataSolicitacao: string, diasAdicionais = 1): string {
    // Força o horário para o meio-dia UTC para evitar problemas de fuso (-3h) caindo no dia anterior
    const data = new Date(dataSolicitacao.split('T')[0] + 'T12:00:00Z');

    let diasContados = 0;
    while (diasContados < diasAdicionais) {
        data.setUTCDate(data.getUTCDate() + 1);
        const diaSemana = data.getUTCDay(); // 0=Domingo, 6=Sábado
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasContados++;
        }
    }

    return data.toISOString().split('T')[0];
}

export function calcularPrazoD1(dataSolicitacao: string): string {
    return calcularPrazo(dataSolicitacao, 1);
}

export function isAfter15() {
    return new Date().getHours() >= 15;
}

export function isRequestAfter15(dataSolicitacao: string) {
    return new Date(dataSolicitacao).getHours() >= 15;
}
