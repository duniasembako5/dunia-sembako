"use server";

import { z } from "zod";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username minimal 3 karakter" }),
  password: z.string().min(8, { message: "Password minimal 8 karakter" }),
});

type LoginState =
  | {
      errors?: Record<string, string[]>;
    }
  | undefined;

export async function login(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = loginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const { username, password } = result.data;

  try {
    const res = await pool.query(
      `SELECT id_admin, username, password, role, name FROM public.admin WHERE username = $1`,
      [username],
    );

    if (res.rowCount === 0)
      return { errors: { password: ["Username atau password salah"] } };

    const user = res.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return { errors: { password: ["Username atau password salah"] } };

    // ✅ Buat session lengkap
    await createSession({
      id: user.id_admin,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return { errors: { username: ["Kesalahan server"] } };
  }

  redirect("/dashboard/pos");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
