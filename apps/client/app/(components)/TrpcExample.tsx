"use client";

import { trpc } from "../(utils)/trpc/client";
import { serverClient } from "../(utils)/trpc/serverClient";

const TrpcExample = ({
  initialText,
}: {
  initialText: Awaited<ReturnType<(typeof serverClient)["getExampleTrpc"]>>;
}) => {
  const getExampleTrpc = trpc.getExampleTrpc.useQuery(
    { id: "65731bc5fce8c87e24fd4361" },
    {
      initialData: initialText,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  return <p>{getExampleTrpc?.data?.text}</p>;
};

export default TrpcExample;
