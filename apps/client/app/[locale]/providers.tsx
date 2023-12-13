"use client";

import { NextUIProvider } from "@nextui-org/react";
import * as React from "react";
import { TrpcProvider } from "../(utils)/trpc/Provider";

export async function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <NextUIProvider>{children}</NextUIProvider>
    </TrpcProvider>
  );
}
