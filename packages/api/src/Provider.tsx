'use client';

import { useConfigStore } from '@package/store/config-web';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createWSClient, httpBatchLink, loggerLink, splitLink, wsLink } from '@trpc/client';
import { useSession } from 'next-auth/react';
import React from 'react';

import { useState } from 'react';
import { trpc } from './client';
import { queryClient } from './query-client';

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { ensureClientId } = useConfigStore();

  const [client] = useState(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_TRPC_URL as string;
    const wsUrl = serverUrl.replace(/^http/, 'ws');

    const wsClient =
      typeof window !== 'undefined'
        ? createWSClient({
            url: wsUrl,
            retryDelayMs: () => 3000,
          })
        : null;

    return trpc.createClient({
      links: [
        loggerLink({ enabled: () => process.env.NODE_ENV === 'development' }),
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: wsClient
            ? wsLink({ client: wsClient })
            : httpBatchLink({
                url: serverUrl,
              }),
          false: httpBatchLink({
            url: serverUrl,
            headers() {
              const clientId = ensureClientId();
              return {
                ...(session?.user ? { 'x-session-token': session?.user?.sessionToken } : {}),
                'x-client-id': clientId,
                'x-locale': window.location.pathname.split('/')[1] || 'uk',
              };
            },
            async fetch(url, options) {
              const response = await fetch(url, {
                ...options,
                credentials: 'include',
                signal: options?.signal ?? null,
              });
              if (response.status === 401 && typeof window !== 'undefined') {
                // can be signOut() from next-auth/react
              }
              return response;
            },
          }),
        }),
        // httpBatchLink({
        //   url: process.env.NEXT_PUBLIC_SERVER_TRPC_URL as string,
        //   headers() {
        //     const clientId = ensureClientId();

        //     return {
        //       ...(session?.user ? { 'x-session-token': session?.user?.sessionToken } : {}),
        //       'x-client-id': clientId,
        //     };
        //   },
        //   async fetch(url, options) {
        //     const response = await fetch(url, {
        //       ...options,
        //       credentials: 'include',
        //       signal: options?.signal ?? null,
        //     });
        //     if (response.status === 401 && typeof window !== 'undefined') {
        //       // can be signOut() from next-auth/react
        //     }
        //     return response;
        //   },
        // }),
      ],
    });
  });

  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
