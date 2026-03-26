
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFiles() {
  const scriptsDir = __dirname;
  const files = fs.readdirSync(scriptsDir)
    .filter(f => f.startsWith('batch_') && f.endsWith('.sql'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

  console.log(`Found ${files.length} SQL files to execute.`);

  for (const file of files) {
    const filePath = path.join(scriptsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Executing ${file}...`);
    const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
      // If RPC fails, try generic REST exec if available or log error
      console.error(`Error executing ${file}:`, error);
      // Fallback: Some Supabase projects don't have execute_sql RPC by default.
      // But the MCP tool uses a similar mechanism.
      // If it fails, I might need to use the MCP tool instead or a different method.
    } else {
      console.log(`Successfully executed ${file}.`);
    }
  }
}

executeSqlFiles();
