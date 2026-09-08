import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

// ponytail: no `baseURL` — better-auth defaults to the origin the page is
// already served from, which is the only one whose cookies it can read.
// Reading NEXT_PUBLIC_SITE_URL here broke login whenever it drifted off the
// served host (apex vs `www`, preview aliases): the cross-origin POST hit a
// 308 and the CORS preflight refused to follow it.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
