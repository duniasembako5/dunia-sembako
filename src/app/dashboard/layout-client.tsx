"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Clock } from "lucide-react";
import { tr } from "zod/v4/locales";

// Komponen waktu khusus (client-only)
function ClockDisplay() {
  const [waktu, setWaktu] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setWaktu(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateTime(); // render awal
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xl font-medium text-gray-600">
      <Clock className="h-5 w-5 text-gray-500" />
      <span suppressHydrationWarning>{waktu}</span>
    </div>
  );
}

export default function DashboardLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
}) {
  const pathname = usePathname();

  const pageNames: Record<string, string> = {
    // Main
    "/dashboard": "Dashboard",
    "/dashboard/pos": "Point of Sale",

    // Stock Management
    "/dashboard/stock/barang": "Stock Barang",
    "/dashboard/stock/kategori": "Kategori",

    // Laporan
    "/dashboard/laporan/barang-masuk": "Barang Masuk",
    "/dashboard/laporan/barang-keluar": "Barang Keluar",
    "/dashboard/laporan/penjualan": "Penjualan",

    // Admin Management
    "/dashboard/admin/employees": "Employees",
  };

  const pageName = pageNames[pathname] || "Halaman";

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar user={user} />

      <SidebarInset>
        {/* HEADER FIXED */}
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 bg-white px-4">
          {/* Kiri: Sidebar trigger + page name */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-lg font-semibold">{pageName}</h1>
          </div>

          {/* Kanan: Waktu */}
          <ClockDisplay />
        </header>

        {/* SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
