export * from "./schema";

import type { User as BaseUser } from "./schema";

/**
 * The legacy article list still renders an author username, while the users
 * table now stores the display value in `name`. Keeping this optional field in
 * the compile-time compatibility type allows the legacy screen to build until
 * it is fully retired in favor of the Supabase conference workspace.
 */
export type User = BaseUser & { username?: string };
