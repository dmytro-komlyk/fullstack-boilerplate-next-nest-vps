import { appRouter } from "@server/trpc/trpc.router";
import { httpBatchLink } from "@trpc/client";

import { Backend_URL, Trpc } from "../../(lib)/constants";

const url = Backend_URL + Trpc;

export const serverClient = appRouter.createCaller({
  links: [
    httpBatchLink({
      url,
    }),
  ],
});
