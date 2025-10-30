"use client";

import * as React from "react";
import {
  LayoutDashboard,
  LayoutList,
  Package,
  PackageMinus,
  PackagePlus,
  ScrollText,
  Store,
  UserRound,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { NavStock } from "@/components/nav-stock";
import { NavLaporan } from "@/components/nav-laporan";
import { NavAdmin } from "@/components/nav-admin";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const menuData = {
  main: [
    // {
    //   name: "Dashboard",
    //   url: "/dashboard",
    //   icon: LayoutDashboard,
    // },
    {
      name: "Point of Sale",
      url: "/dashboard/pos",
      icon: Store,
    },
  ],
  stock: [
    {
      name: "Stock Barang",
      url: "/dashboard/stock/barang",
      icon: Package,
    },
    {
      name: "Kategori",
      url: "/dashboard/stock/kategori",
      icon: LayoutList,
    },
  ],
  laporan: [
    {
      name: "Barang Masuk",
      url: "/dashboard/laporan/barang-masuk",
      icon: PackagePlus,
    },
    {
      name: "Barang Keluar",
      url: "/dashboard/laporan/barang-keluar",
      icon: PackageMinus,
    },
    {
      name: "Penjualan",
      url: "/dashboard/laporan/penjualan",
      icon: ScrollText,
    },
  ],
  admin: [
    {
      name: "Employees",
      url: "/dashboard/admin/employees",
      icon: UserRound,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
}) {
  // Pilih menu sesuai role
  const isAdmin = user?.role === "admin";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-500">
            <Store className="w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate text-lg font-medium">Dunia Sembako</span>
            <span className="truncate text-xs">Pacitan</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain main={menuData.main} />

        {isAdmin && (
          <>
            <NavStock stock={menuData.stock} />
            <NavLaporan laporan={menuData.laporan} />
            <NavAdmin admin={menuData.admin} />
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
