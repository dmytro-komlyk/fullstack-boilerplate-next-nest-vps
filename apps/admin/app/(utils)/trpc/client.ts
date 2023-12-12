import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "@server/trpc/trpc.router";

export const trpc = createTRPCReact<AppRouter>({});
