declare namespace Deno {
  const env: {
    get: (key: string) => string | undefined;
  };

  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: unknown): unknown;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export function createClient(url: string, key: string, options?: unknown): unknown;
}

