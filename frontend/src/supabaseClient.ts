// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efsfwmmkmqzcqybyvsif.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmc2Z3bW1rbXF6Y3F5Ynl2c2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA5ODYzOCwiZXhwIjoyMDYwNjc0NjM4fQ.vkvgwpkuZFeqEeKZHzwDUN60TgN-3H4vsKwKrBL8nFQ'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
