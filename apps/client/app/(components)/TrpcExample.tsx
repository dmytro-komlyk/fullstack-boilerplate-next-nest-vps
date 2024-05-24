"use client";

import { trpc } from "../(utils)/trpc/client";
import { serverClient } from "../(utils)/trpc/serverClient";

const TrpcExample = ({
  initialText,
}: {
  initialText: Awaited<ReturnType<(typeof serverClient)["example"]["getById"]>>;
}) => {
  const getExampleTrpc = trpc.example.getById.useQuery(initialText.id, {
    initialData: initialText,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  return <p>{getExampleTrpc?.data?.text}</p>;
};

export default TrpcExample;
