import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const rawKey = process.env.SESSION_SECRET || "default-secret-key";
const encodedKey = new TextEncoder().encode(rawKey);

export type SessionPayload = JWTPayload & {
  id: string;
  username: string;
  name: string;
  role: string;
  expiresAt: string;
};

// 🔐 Buat session JWT
export async function createSession(user: {
  id: string | number;
  username: string;
  name: string;
  role: string;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 hari

  const payload: SessionPayload = {
    id: String(user.id),
    username: user.username,
    name: user.name,
    role: user.role,
    expiresAt: expiresAt.toISOString(),
  };

  const session = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(encodedKey);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// ❌ Hapus session
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// 🔓 Dekripsi JWT
export async function decrypt(
  session?: string | null,
): Promise<SessionPayload | null> {
  if (!session || !session.includes(".")) return null;

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (err) {
    console.error("❌ jwtVerify failed:", err);
    return null;
  }
}
