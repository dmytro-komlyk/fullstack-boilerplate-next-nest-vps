'use client';

import { useConfigStore } from '@package/store/config-web';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createWSClient, httpBatchLink, loggerLink, splitLink, wsLink } from '@trpc/client';
import { useSession } from 'next-auth/react';
import React, { useMemo, useRef } from 'react';
import { trpc } from './client';
import { queryClient } from './query-client';

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { ensureClientId } = useConfigStore();

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const client = useMemo(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_TRPC_URL as string;
    const wsUrl = serverUrl.replace(/^http/, 'ws');
    const clientId = ensureClientId();

    const wsClient =
      typeof window !== 'undefined'
        ? createWSClient({
            url: () => {
              const params = new URLSearchParams();
              const token = sessionRef.current?.user?.sessionToken;
              if (token) params.append('sessionToken', token);
              if (clientId) params.append('clientId', clientId);
              params.append('locale', window.location.pathname.split('/')[1] || 'uk');

              return `${wsUrl}?${params.toString()}`;
            },
            retryDelayMs: () => 3000,
          })
        : null;

    return trpc.createClient({
      links: [
        loggerLink({ enabled: () => process.env.NODE_ENV === 'development' }),
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: wsClient ? wsLink({ client: wsClient }) : httpBatchLink({ url: serverUrl }),
          false: httpBatchLink({
            url: serverUrl,
            headers() {
              const token = sessionRef.current?.user?.sessionToken;
              return {
                ...(token ? { 'x-session-token': token } : {}),
                'x-client-id': clientId,
                'x-locale': window.location.pathname.split('/')[1] || 'uk',
              };
            },
          }),
        }),
      ],
    });
  }, [ensureClientId]);

  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
