"use client";

import * as React from "react";
import { showError, showSuccess } from "@/lib/sonner-notification";
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
} from "@/components/ui/select";
import { toGMT7 } from "@/lib/formatDbDate";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type BarangMasuk = {
  barang_id: string;
  kode_barang: string;
  nama_barang: string;
  admin_name: string;
  quantity: string;
  created_at: string;
  id_barang_masuk: string;
};

type ApiResponse = {
  data: BarangMasuk[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export function TableBarangMasuk() {
  const [data, setData] = React.useState<BarangMasuk[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [totalPages, setTotalPages] = React.useState(1);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // === Delete confirmation ===
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [selected, setSelected] = React.useState<BarangMasuk | null>(null);

  // 🕐 debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // 🔄 fetch data setiap perubahan search / page
  React.useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/barang-masuk?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${encodeURIComponent(
          debouncedSearch,
        )}`,
      );
      if (!res.ok) throw new Error("Gagal mengambil data");

      const result: ApiResponse = await res.json();
      setData(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = (barang: BarangMasuk) => {
    setSelected(barang);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/barang-masuk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_barang_masuk: selected.id_barang_masuk }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus kategori");

      showSuccess("Data berhasil dihapus");
      fetchData();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus",
      );
    } finally {
      setIsDeleteOpen(false);
      setSelected(null);
      setDeleting(false);
    }
  };

  const columns: ColumnDef<BarangMasuk>[] = [
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
      cell: ({ getValue }) => <span>{toGMT7(getValue() as string)}</span>,
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteConfirm(category)}
            >
              Batalkan
            </Button>
          </div>
        );
      },
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

      {/* === Delete Confirmation === */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Batalkan Barang Masuk</DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin membatalkan{" "}
              <b>{selected?.nama_barang || "barang ini"}</b>?
              {" jumlah stok akan dikembalikan ke kondisi awal."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Tidak</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Membatalkan..." : "Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
