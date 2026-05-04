'use client';

import { useAuthStore } from '@package/store/auth-native';
import { useConfigStore } from '@package/store/config-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import * as Device from 'expo-device';
import React, { useState } from 'react';

import { trpc } from './client';
import { queryClient } from './query-client-native';

export function TrpcNativeProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => __DEV__ }),
        httpBatchLink({
          url: process.env.EXPO_PUBLIC_HTTP_URL as string,
          headers() {
            const { accessToken, sessionToken } = useAuthStore.getState();
            const clientId = useConfigStore.getState().ensureClientId();

            return {
              'x-client-id': clientId,
              'user-agent': `${Device.osName} ${Device.osVersion}`,
              ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
