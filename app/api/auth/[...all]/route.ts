import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Delega login, cadastro, logout e gerenciamento de sessão ao Better Auth.
export const { GET, POST } = toNextJsHandler(auth);
