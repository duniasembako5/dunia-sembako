"use client";

import * as React from "react";
import { showError } from "@/lib/sonner-notification";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toGMT7 } from "@/lib/formatDbDate";

type BarangKeluar = {
  barang_id: string;
  kode_barang: string;
  nama_barang: string;
  admin_name: string;
  quantity: string;
  created_at: string;
};

type ApiResponse = {
  data: BarangKeluar[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export function TableBarangKeluar() {
  const [data, setData] = React.useState<BarangKeluar[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [totalPages, setTotalPages] = React.useState(1);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // 🔁 Debounce effect (delay 500ms setelah user berhenti mengetik)
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // 🔄 Fetch data tiap kali pagination atau search berubah
  React.useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/barang-keluar?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${encodeURIComponent(
          debouncedSearch,
        )}`,
      );
      if (!res.ok) throw new Error("Gagal mengambil data");

      const result: ApiResponse = await res.json();
      setData(result.data);
      setPagination((prev) => ({
        ...prev,
        totalItems: result.pagination.totalItems,
        totalPages: result.pagination.totalPages,
      }));
      setTotalPages(result.pagination.totalPages || 0);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<BarangKeluar>[] = [
    {
      header: "No",
      cell: ({ row }) =>
        pagination.pageIndex * pagination.pageSize + row.index + 1,
    },
    { accessorKey: "kode_barang", header: "Kode Barang" },
    { accessorKey: "nama_barang", header: "Nama Barang" },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ getValue }) => (
        <span>{Number(getValue()).toLocaleString("id-ID")}</span>
      ),
    },
    {
      accessorKey: "satuan",
      header: "Satuan",
    },
    { accessorKey: "admin_name", header: "Admin" },
    {
      accessorKey: "created_at",
      header: "Tanggal",
      cell: ({ getValue }) => toGMT7(getValue() as string),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    pageCount: totalPages,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      {/* 🔍 Search dan Refresh */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat...
            </>
          ) : (
            "Refresh"
          )}
        </Button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari barang / admin..."
              className="w-64 pl-8"
              value={search}
              onChange={(e) => {
                setPagination((p) => ({ ...p, pageIndex: 0 }));
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      {/* === Table === */}
      <Table className="w-full overflow-hidden rounded-lg border">
        <TableHeader className="sticky top-0 z-10 bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableCell key={h.id} className="font-semibold">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: pagination.pageSize }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="animate-pulse">
                  {Array.from({ length: table.getAllColumns().length }).map(
                    (_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <div className="h-6 w-full rounded bg-gray-200"></div>
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))
            : table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {/* === Pagination === */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
          <span className="text-sm">
            Halaman {pagination.pageIndex + 1} dari {table.getPageCount()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Tampilkan:</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(v) =>
              setPagination((p) => ({
                ...p,
                pageSize: Number(v),
                pageIndex: 0,
              }))
            }
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
