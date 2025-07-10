import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@databuddy/rpc";

export const trpc = createTRPCReact<AppRouter>(); 