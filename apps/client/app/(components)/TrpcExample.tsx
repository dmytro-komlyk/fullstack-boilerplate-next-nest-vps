'use client';

import { trpc } from '../(utils)/trpc/client';

const TrpcExample = ({ initialText }: { initialText: any }) => {
  const getExampleTrpc = trpc.example.getById.useQuery(initialText.id, {
    initialData: initialText,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  return <p>{getExampleTrpc?.data?.text}</p>;
};

export default TrpcExample;
