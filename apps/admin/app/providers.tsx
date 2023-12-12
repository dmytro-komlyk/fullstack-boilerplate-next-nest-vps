"use client";
import { NextUIProvider } from "@nextui-org/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { TrpcProvider } from "./(utils)/trpc/Provider";

export function Providers({
  children,
  session,
}: React.PropsWithChildren<{ session: Session | null }>) {
  return (
    <TrpcProvider>
      <NextUIProvider>
        <SessionProvider session={session}>{children}</SessionProvider>
      </NextUIProvider>
    </TrpcProvider>
  );
}
