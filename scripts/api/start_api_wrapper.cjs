const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando Ponte API Ferramentaria...');

const ls = spawn('cmd.exe', ['/c', 'npx', 'tsx', 'scripts/api_server.ts'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

ls.on('close', (code) => {
  console.log(`Processo finalizado com código ${code}`);
});
