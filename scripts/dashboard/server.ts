
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');

const app = express();
const PORT = 3005;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper para rodar scripts e transmitir o log via SSE (Server-Sent Events)
function runScript(command: string, res: any) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const args = command.split(' ');
    const cmd = args.shift() || '';
    
    // Ajuste para rodar python via venv se existir
    let finalCmd = cmd;
    if (cmd === 'python') {
        finalCmd = path.join(rootDir, 'venv_mcp', 'Scripts', 'python.exe');
    }

    const childProcess = spawn(finalCmd, args, { 
        cwd: rootDir, 
        shell: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    childProcess.stdout.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ log: data.toString() })}\n\n`);
    });

    childProcess.stderr.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ log: data.toString(), type: 'error' })}\n\n`);
    });

    childProcess.on('close', (code) => {
        res.write(`data: ${JSON.stringify({ log: `\n--- PROCESSO CONCLUÍDO (Código: ${code}) ---`, type: 'info' })}\n\n`);
        res.end();
    });
}

// Endpoints atualizados com os novos caminhos organizados
app.get('/api/run/consolidar', (req, res) => {
    runScript('python scripts/python/atualizar_logins.py', res);
});

app.get('/api/run/preparar-csv', (req, res) => {
    runScript('python scripts/python/gerar_csv_sync.py', res);
});

app.get('/api/run/sincronizar', (req, res) => {
    runScript('npx ts-node --esm scripts/database/executar_sync.ts', res);
});

app.get('/api/run/all', (req, res) => {
     res.setHeader('Content-Type', 'text/event-stream');
     res.setHeader('Cache-Control', 'no-cache');

     const runStep = (cmd: string): Promise<number> => {
         return new Promise((resolve) => {
             const args = cmd.split(' ');
             const c = args.shift() || '';
             let finalCmd = c;
             if (c === 'python') finalCmd = path.join(rootDir, 'venv_mcp', 'Scripts', 'python.exe');
             
             res.write(`data: ${JSON.stringify({ log: `\n>>> EXECUTANDO: ${cmd}\n`, type: 'header' })}\n\n`);
             
             const p = spawn(finalCmd, args, { 
                 cwd: rootDir, 
                 shell: true,
                 env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
             });
             p.stdout.on('data', (d) => res.write(`data: ${JSON.stringify({ log: d.toString() })}\n\n`));
             p.stderr.on('data', (d) => res.write(`data: ${JSON.stringify({ log: d.toString(), type: 'error' })}\n\n`));
             p.on('close', resolve);
         });
     };

     async function run() {
         await runStep('python scripts/python/atualizar_logins.py');
         await runStep('python scripts/python/gerar_csv_sync.py');
         await runStep('npx ts-node --esm scripts/database/executar_sync.ts');
         res.write(`data: ${JSON.stringify({ log: `\n✅ PIPELINE COMPLETA CONCLUÍDA!`, type: 'info' })}\n\n`);
         res.end();
     }

     run();
});

app.listen(PORT, () => {
    console.log(`\n🖥️ Dashboard de Sincronização rodando em: http://localhost:${PORT}`);
    console.log(`Pressione Ctrl+C para encerrar.\n`);
});
