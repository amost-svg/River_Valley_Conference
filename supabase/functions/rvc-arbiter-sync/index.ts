import { createHandler } from '../_shared/arbiter-handler.ts';
Deno.serve(createHandler((key) => Deno.env.get(key)));
