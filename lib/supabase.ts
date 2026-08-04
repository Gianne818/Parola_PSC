import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A dummy client that returns a chainable proxy to prevent errors but logs warnings
const createDummyClient = () => {
  if (typeof window !== 'undefined') {
    // Supabase credentials missing or invalid.
  }
  const handler: ProxyHandler<any> = {
    get(target: any, prop: string): any {
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

