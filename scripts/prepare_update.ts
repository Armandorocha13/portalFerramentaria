import XLSX from 'xlsx';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const SB_URL = process.env.VITE_SUPABASE_URL!;
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY!; // We'll use direct SQL instead of SDK for speed if we can, but let's see

const filePath = 'ANIEL_Saldo Volante.xlsx';

function normalizeNumber(str: any): number {
    if (!str) return 0;
    const clean = String(str).replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

function normalizeText(str: any): string {
    return str ? String(str).trim() : '';
}

async function run() {
    console.log('Reading Excel...');
    const b = fs.readFileSync(filePath);
    const w = XLSX.read(b);
    const s = w.Sheets[w.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(s);
    console.log(`Loaded ${rows.length} rows.`);

    // Map rows to our target format
    const cargaRecords = rows.map(r => ({
        contrato_origem: normalizeText(r['Contrato']),
        matricula_tecnico: normalizeText(r['Nº F.R.E.']),
        nome_tecnico: normalizeText(r['Nome da Equipe']),
        codigo_material: normalizeText(r['Cód. Material']),
        descricao_material: normalizeText(r['Desc. Material']),
        unidade: normalizeText(r['Unidade']),
        saldo: normalizeText(r['Saldo']), // Keeping as text if the DB is text
        valor_total: normalizeText(r['Total R$']),
        valor: normalizeNumber(r['Valor Unit.']),
        created_at: new Date().toISOString()
    }));

    // Group by matricula so we can delete them first
    const matriculasToUpdate = Array.from(new Set(cargaRecords.map(r => r.matricula_tecnico)));
    console.log(`Found ${matriculasToUpdate.length} unique technicians in spreadsheet.`);

    // Generate SQL script to clear and then insert
    // Since we are using MCP tool mcp_supabase_execute_sql, we'll output the SQL or execute in blocks.
    console.log('Generating SQL commands...');
    
    // We'll perform this in batches of 1000 records to avoid size limits
    const BATCH_SIZE = 1000;
    
    // First, clear existing data for those technicians
    // But wait, the user said "Atualiza a carga". If I clear it all, I might lose data from technicians NOT in the sheet.
    // So only delete for the matriculas that are actually in the sheet.
    
    const chunks: string[] = [];
    
    // Batch deletion might be too big for a single SQL call if there are many matriculas
    // We'll do it by segmenting the matriculas list
    const mChunks = [];
    for (let i = 0; i < matriculasToUpdate.length; i += 100) {
        mChunks.push(matriculasToUpdate.slice(i, i + 100));
    }
    
    for (const mList of mChunks) {
        const mStr = mList.map(m => `'${m}'`).join(',');
        chunks.push(`DELETE FROM public.carga_tecnicos WHERE matricula_tecnico IN (${mStr});`);
    }

    // Now insert the new records
    for (let i = 0; i < cargaRecords.length; i += BATCH_SIZE) {
        const batch = cargaRecords.slice(i, i + BATCH_SIZE);
        const values = batch.map(r => {
            const row = [
                r.contrato_origem, r.matricula_tecnico, r.nome_tecnico, r.codigo_material,
                r.descricao_material, r.unidade, r.saldo, r.valor_total, r.valor
            ].map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(',');
            return `(${row})`;
        }).join(',');
        
        chunks.push(`INSERT INTO public.carga_tecnicos (contrato_origem, matricula_tecnico, nome_tecnico, codigo_material, descricao_material, unidade, saldo, valor_total, valor) VALUES ${values};`);
    }

    console.log(`Generated ${chunks.length} SQL blocks.`);
    
    // Save to a file so we can run them sequentially
    fs.writeFileSync('scripts/update_payload.sql', chunks.join('\n'));
    console.log('SQL payload saved to scripts/update_payload.sql');
}

run();
