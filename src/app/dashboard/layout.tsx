// app/dashboard/layout.tsx
import type { Metadata } from "next";
import DashboardLayoutClient from "./layout-client";
import { getCurrentUser } from "@/lib/getCurrentUser";

export const metadata: Metadata = {
  title: "Dunia Sembako",
  description: "Aplikasi kasir",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🧩 Ambil data user dari cookie session
  const user = await getCurrentUser();

  if (!user) {
    // bisa redirect ke /login kalau belum login
    return <div>Unauthorized</div>;
  }

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>;
}
