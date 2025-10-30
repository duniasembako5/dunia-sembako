import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

// Halaman publik (tanpa login)
const publicRoutes = ["/about"];

// Halaman login
const authRoutes = ["/login"];

// Halaman yang butuh login
const protectedRoutes = [
  "/dashboard",
  "/dashboard/pos",
  "/dashboard/stock/barang",
  "/dashboard/stock/kategori",
  "/dashboard/laporan/barang-masuk",
  "/dashboard/laporan/barang-keluar",
  "/dashboard/laporan/penjualan",
  "/dashboard/admin/employees",

  "/api/employees",
  "/api/categories",
  "/api/barang",
  "/api/transaksi",
  "/api/penjualan",
  "/api/add-stock",
  "/api/barang-masuk",
  "/api/barang-keluar",
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Ambil session
  const cookie = req.cookies.get("session")?.value;
  let session = null;

  try {
    session = await decrypt(cookie);
  } catch (e) {
    console.warn("Session decrypt failed:", e);
  }

  const isProtected = protectedRoutes.some((r) => path.startsWith(r));
  const isAuth = authRoutes.includes(path);

  // ✅ Kalau halaman butuh login tapi belum login
  if (isProtected && !session?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ✅ Kalau udah login tapi coba buka /login
  if (isAuth && session?.id) {
    return NextResponse.redirect(new URL("/dashboard/pos", req.url));
  }

  // ✅ Role-based route guard
  if (path.startsWith("/dashboard/admin") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard/pos", req.url));
  }

  if (path.startsWith("/dashboard/laporan") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard/pos", req.url));
  }

  if (path.startsWith("/dashboard/stock") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard/pos", req.url));
  }

  // ✅ Kalau route tidak cocok dengan daftar public/protected/auth, anggap 404 → redirect ke dashboard
  const allRoutes = [...publicRoutes, ...authRoutes, ...protectedRoutes];
  const isKnownRoute = allRoutes.includes(path);

  if (!isKnownRoute) {
    return NextResponse.redirect(new URL("/dashboard/pos", req.url));
  }

  return NextResponse.next();
}

// Jalankan middleware di semua halaman kecuali file statis
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
