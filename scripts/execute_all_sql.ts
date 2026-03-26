
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFiles() {
  const scriptsDir = path.join(__dirname, 'sql_batches');
  if (!fs.existsSync(scriptsDir)) {
      console.error(`Directory ${scriptsDir} does not exist.`);
      process.exit(1);
  }

  const files = fs.readdirSync(scriptsDir)
    .filter(f => f.startsWith('combined_batch_') && f.endsWith('.sql'))
    .sort((a, b) => {
      const matchA = a.match(/\d+/);
      const matchB = b.match(/\d+/);
      const numA = matchA ? parseInt(matchA[0]) : 0;
      const numB = matchB ? parseInt(matchB[0]) : 0;
      return numA - numB;
    });

  console.log(`Found ${files.length} SQL files to execute.`);

  for (const file of files) {
    const filePath = path.join(scriptsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Executing ${file}...`);
    // Note: This uses standard REST execution if possible via supabase.postgrest.base.query
    // Actually, supabase client doesn't expose a direct 'execute raw sql' easily without RPC.
    // However, I can use a simple trick if the 'execute_sql' RPC is not there.
    
    const { error } = await supabase.rpc('execute_sql_query', { sql_query: sql });
    
    if (error) {
      if (error.message.includes('function "execute_sql_query" does not exist')) {
          console.error(`ERROR: RPC 'execute_sql_query' does not exist in your database.`);
          console.log(`Please create this function in your Supabase SQL Editor:
          
          CREATE OR REPLACE FUNCTION execute_sql_query(sql_query text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql_query;
          END;
          $$;
          `);
          process.exit(1);
      }
      console.error(`Error executing ${file}:`, error);
    } else {
      console.log(`Successfully executed ${file}.`);
    }
  }
}

executeSqlFiles();
