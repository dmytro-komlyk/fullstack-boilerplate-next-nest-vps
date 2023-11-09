"use client";
import { NextUIProvider } from "@nextui-org/react";
import { SessionProvider } from "next-auth/react";
import * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <SessionProvider>{children}</SessionProvider>
    </NextUIProvider>
  );
}
