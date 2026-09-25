import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A dummy client used only when Supabase env vars are missing.
// In production it throws on any use (fail closed); in development it
// returns error-shaped results so the UI can still render.
const isProduction = process.env.NODE_ENV === 'production';

function missingConfigError(): Error {
  return new Error(
    'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

let warnedOnce = false;
function warnMissingConfig(): void {
  if (warnedOnce) return;
  warnedOnce = true;
  console.warn(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or invalid. ' +
      'Using a dummy client for development only.'
  );
}

const createDummyClient = () => {
  const handler: ProxyHandler<any> = {
    get(target: any, prop: string): any {
      if (isProduction) throw missingConfigError();
      warnMissingConfig();
      if (prop === 'auth') {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithPassword: async () => ({ data: { session: null, user: null }, error: new Error("Credentials missing") }),
          signUp: async () => ({ data: { session: null, user: null }, error: new Error("Credentials missing") }),
          signOut: async () => ({ error: null }),
        };
      }
      
      // Return a function that returns another proxy for query building
      const dummyFunc = () => new Proxy(dummyFunc, handler);
      
      // If we are trying to resolve a promise (e.g. await supabase.from('...').select('*'))
      if (prop === 'then') {
        return (resolve: any) => resolve({ data: null, error: { message: "Supabase credentials missing" } });
      }
      
      return new Proxy(dummyFunc, handler);
    },
    apply() {
      if (isProduction) throw missingConfigError();
      warnMissingConfig();
      const dummyFunc = () => new Proxy(dummyFunc, handler);
      return new Proxy(dummyFunc, handler);
    }
  };
  return new Proxy({}, handler) as any;
};

const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : createDummyClient();

export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  const isServerConfigured = supabaseUrl && serviceRoleKey && supabaseUrl.startsWith('http');
  return isServerConfigured 
    ? createClient(supabaseUrl, serviceRoleKey) 
    : createDummyClient();
}

