
import * as fs from 'fs';
import * as path from 'path';

function escapeSql(val: string | null): string {
    if (!val || val === 'None' || val === '') return 'NULL';
    return `'${val.replace(/'/g, "''")}'`;
}

async function generateSql() {
    const csvPath = 'base_sincronizacao.csv';
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Pular cabeçalho: matricula;nome;cargo;supervisor_nome;supervisor_matricula
    const dataLines = lines.slice(1);
    
    const supervisorInserts: string[] = [];
    const tecnicoUpserts: string[] = [];
    
    // Conjunto para evitar duplicados de supervisores
    const seenSupervisors = new Set<string>();

    for (const line of dataLines) {
        const [mat, nome, cargo, supNome, supMat] = line.split(';').map(s => s.trim());
        
        // 1. Preparar Supervisores
        if (supMat && supMat !== '' && supMat !== 'None') {
            if (!seenSupervisors.has(supMat)) {
                supervisorInserts.push(
                    `INSERT INTO supervisores (matricula, nome) VALUES ('${supMat}', ${escapeSql(supNome)}) ON CONFLICT (matricula) DO UPDATE SET nome = EXCLUDED.nome;`
                );
                seenSupervisors.add(supMat);
            }
        }
        
        // 2. Preparar Técnicos
        if (mat && mat !== '' && mat !== 'None') {
            tecnicoUpserts.push(
                `INSERT INTO tecnicos (matricula, nome, cargo, supervisor_matricula) VALUES ('${mat}', ${escapeSql(nome)}, ${escapeSql(cargo)}, ${escapeSql(supMat)}) ON CONFLICT (matricula) DO UPDATE SET nome = EXCLUDED.nome, cargo = EXCLUDED.cargo, supervisor_matricula = EXCLUDED.supervisor_matricula;`
            );
        }
    }

    const finalSql = [
        '-- INICIO DA SINCRONIZACAO',
        'BEGIN;',
        '',
        '-- 1. ATUALIZAR SUPERVISORES',
        ...supervisorInserts,
        '',
        '-- 2. ATUALIZAR TECNICOS E RELACOES',
        ...tecnicoUpserts,
        '',
        'COMMIT;',
        '-- FIM DA SINCRONIZACAO'
    ].join('\n');

    fs.writeFileSync('scripts/sql/sincronizar_equipes.sql', finalSql);
    console.log(`SQL gerado com sucesso!`);
    console.log(`- ${supervisorInserts.length} Supervisores preparados.`);
    console.log(`- ${tecnicoUpserts.length} Técnicos preparados.`);
    console.log(`Arquivo salvo em: scripts/sql/sincronizar_equipes.sql`);
}

generateSql();
