import type { AppRouter } from "@server/trpc/trpc.router";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { tap } from "@trpc/server/observable";
import { Backend_URL, Trpc } from "../(lib)/constants";

const url = Backend_URL + Trpc;

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    () =>
      ({ op, next }) => {
        // console.log('->', op.type, op.path, op.input)

        return next(op).pipe(
          tap({
            next(result) {
              // console.log('<-', op.type, op.path, op.input, ':', result)

              return result;
            },
          })
        );
      },
    httpBatchLink({ url }),
  ],
});
