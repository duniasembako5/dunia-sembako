"use client";

import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function NavLaporan({
  laporan,
}: {
  laporan: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Laporan</SidebarGroupLabel>
      <SidebarMenu>
        {laporan.map((item) => {
          // Active jika path sekarang = url atau subroute dari url
          const isActive = pathname === item.url;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                tooltip={item.name}
                className={clsx(
                  "flex items-center gap-2 rounded-md px-2 py-1 transition-colors",
                  isActive
                    ? "bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
