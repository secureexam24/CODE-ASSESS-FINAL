// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xlsllxgpcixigcvvxbmn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc2xseGdwY2l4aWdjdnZ4Ym1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNzUwNjIsImV4cCI6MjA2MzY1MTA2Mn0.Hrmtx2ZreybCpTDSz7khGN8EguJeJenuDsNOQa4cpqI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);