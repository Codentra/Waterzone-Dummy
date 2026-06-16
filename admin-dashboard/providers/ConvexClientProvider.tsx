"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { getConvexUrl } from "@/lib/env";

const convex = new ConvexReactClient(getConvexUrl());

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
