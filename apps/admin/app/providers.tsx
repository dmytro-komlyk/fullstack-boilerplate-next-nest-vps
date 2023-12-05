"use client";
import { NextUIProvider } from "@nextui-org/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import * as React from "react";

export function Providers({
  children,
  session,
}: React.PropsWithChildren<{ session: Session | null }>) {
  return (
    <NextUIProvider>
      <SessionProvider session={session}>{children}</SessionProvider>
    </NextUIProvider>
  );
}
