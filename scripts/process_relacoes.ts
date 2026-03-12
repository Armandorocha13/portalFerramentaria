
import * as fs from 'fs';
import * as path from 'path';

async function processRelacoes() {
    const supervisoresPath = 'c:/Users/user/Desktop/portalFerramentaria/updated_supervisores_lista.txt';
    const relacoesPath = 'c:/Users/user/Desktop/portalFerramentaria/relacoes.csv';
    const updateBaseSqlPath = 'c:/Users/user/Desktop/portalFerramentaria/scripts/sql/update_base_real.sql';

    // 1. Load Supervisores Map (Name -> Matricula)
    const supervisoresLines = fs.readFileSync(supervisoresPath, 'utf8').split('\n').filter(Boolean);
    const superMap = new Map<string, string>();
    supervisoresLines.forEach(line => {
        const [matricula, nome] = line.split('\t');
        if (matricula && nome) {
            superMap.set(nome.trim().toUpperCase(), matricula.trim());
        }
    });

    // 2. Load Technicians from update_base_real.sql to get their Matriculas
    // We need to parse: VALUES ('matricula', 'nome', ...
    const sqlContent = fs.readFileSync(updateBaseSqlPath, 'utf8');
    const tecMap = new Map<string, string>(); // Name -> Matricula
    const tecRegex = /VALUES\s*\(\s*'(\d+)'\s*,\s*'([^']+)'/g;
    let match;
    while ((match = tecRegex.exec(sqlContent)) !== null) {
        tecMap.set(match[2].trim().toUpperCase(), match[1].trim());
    }

    // 3. Process relacoes.csv
    const relacoesContent = fs.readFileSync(relacoesPath, 'utf8');
    const lines = relacoesContent.split(/\r?\n/).filter(Boolean);
    const header = lines[0].split(';');
    
    const matIdx = header.findIndex(h => h.trim().includes('Matricula'));
    const nameIdx = header.findIndex(h => h.trim().includes('Nome do Funcionário'));
    const supIdx = header.findIndex(h => h.trim().includes('Supervisão'));

    const csvPersonMap = new Map<string, string>();
    lines.forEach((line, idx) => {
        if (idx === 0) return;
        const parts = line.split(';');
        const m = parts[matIdx]?.trim();
        const n = parts[nameIdx]?.trim().toUpperCase();
        if (m && n) csvPersonMap.set(n, m);
    });

    const tecUpdates: string[] = [];
    const usedSupMatriculas = new Set<string>();
    const missingSups = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(';');
        const tecMatInput = parts[matIdx]?.trim();
        const tecName = parts[nameIdx]?.trim().toUpperCase();
        const supName = parts[supIdx]?.trim().toUpperCase();

        if (!tecMatInput || tecMatInput === '#N/A' || !supName || supName === 'AFASTADO INSS' || supName === 'ETN') continue;

        let supMat = superMap.get(supName) || csvPersonMap.get(supName);

        if (supMat) {
            tecUpdates.push(`UPDATE tecnicos SET supervisor_matricula = '${supMat}' WHERE matricula = '${tecMatInput}'; -- ${tecName} -> ${supName}`);
            usedSupMatriculas.add(supMat);
        } else {
            missingSups.add(supName);
        }
    }

    // 4. Generate Supervisor Inserts (to ensure FK exists)
    const supInserts: string[] = [];
    
    // Reverse Map for names
    const matToName = new Map<string, string>();
    // From updated_supervisores_lista.txt
    supervisoresLines.forEach(line => {
        const [m, n] = line.split('\t');
        if (m && n) matToName.set(m.trim(), n.trim());
    });
    // From CSV entries (if they are also supervisors)
    csvPersonMap.forEach((m, n) => {
        if (!matToName.has(m)) matToName.set(m, n);
    });

    usedSupMatriculas.forEach(mat => {
        const name = matToName.get(mat) || 'SUPERVISOR DESCONHECIDO';
        supInserts.push(`INSERT INTO supervisores (matricula, nome, senha) VALUES ('${mat}', '${name}', '${mat}') ON CONFLICT (matricula) DO NOTHING;`);
    });

    // 5. Build Final Script
    const finalSql = [
        '-- 1. ADICIONAR SUPERVISORES FALTANTES',
        ...supInserts,
        '',
        '-- 2. ATUALIZAR VINCULOS DE TECNICOS',
        ...tecUpdates
    ].join('\n');

    fs.writeFileSync('c:/Users/user/Desktop/portalFerramentaria/scripts/sql/update_relacoes_results.sql', finalSql);
    
    console.log(`Successfully mapped ${tecUpdates.length} relationships.`);
    console.log(`Supervisors to be ensured: ${usedSupMatriculas.size}`);
    console.log(`Missing Supervisors in any base: ${missingSups.size}`);

    if (missingSups.size > 0) {
        console.log("Missing Supervisors List:");
        console.log([...missingSups].join('\n'));
    }
}

processRelacoes();
