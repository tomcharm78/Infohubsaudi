import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmngkwvhvfdrjqyslhow.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbmdrd3ZodmZkcmpxeXNsaG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTc0NjQsImV4cCI6MjA5MDY3MzQ2NH0.yX6NjXX3O9aUg80HhwTIK2sVTe4o7H7jKeEJtgG5Tl0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
