import { AppRouter } from "@server/trpc/trpc.router";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_SERVER}${process.env.NEXT_PUBLIC_API}`,
    }),
  ],
});
