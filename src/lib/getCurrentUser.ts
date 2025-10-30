import { cookies } from "next/headers";
import { decrypt } from "./session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  const payload = await decrypt(session);
  if (!payload || new Date(payload.expiresAt) < new Date()) return null;

  return {
    id: payload.id,
    username: payload.username,
    name: payload.name,
    role: payload.role,
  };
}
