import fs from 'fs';
import path from 'path';

const supabaseJsPath = path.join(process.cwd(), 'dist', 'supabase.js');

if (fs.existsSync(supabaseJsPath)) {
  let content = fs.readFileSync(supabaseJsPath, 'utf8');
  let updated = false;

  // Replace default Supabase URL if provided in environment
  if (process.env.VITE_SUPABASE_URL) {
    const cleanUrl = process.env.VITE_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').trim();
    console.log(`[Post-Build] Injecting custom Supabase URL: ${cleanUrl}`);
    content = content.replace('https://vrmjdbwdilqitdttzrcq.supabase.co', cleanUrl);
    updated = true;
  }

  // Replace default Supabase Key if provided in environment
  if (process.env.VITE_SUPABASE_ANON_KEY) {
    const cleanKey = process.env.VITE_SUPABASE_ANON_KEY.trim();
    console.log(`[Post-Build] Injecting custom Supabase Anon Key`);
    content = content.replace('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybWpkYndkaWxxaXRkdHR6cmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzkzOTUsImV4cCI6MjA5NzE1NTM5NX0.1XPYA4LAyQOBL1WCKC-oIbsSLYcw3s5W9znimDXqmL4', cleanKey);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(supabaseJsPath, content, 'utf8');
    console.log('[Post-Build] Successfully updated dist/supabase.js with custom credentials!');
  } else {
    console.log('[Post-Build] No custom Supabase environment variables detected. Using default fallback credentials.');
  }
} else {
  console.error('[Post-Build] Error: Could not find dist/supabase.js');
}
