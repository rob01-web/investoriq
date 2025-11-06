import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcvuxtnuoidakzjqewfb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdnV4dG51b2lkYWt6anFld2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzQ5MTgsImV4cCI6MjA3NzQxMDkxOH0.-mFSXjjMuqHJb3e6xe-aDv30njGV2VY-B7qZyqgAA3Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);