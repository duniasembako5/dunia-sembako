"use client";

import * as React from "react";
import { showError, showSuccess } from "@/lib/sonner-notification";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search } from "lucide-react";

type Category = {
  id_kategori: string;
  nama_kategori: string;
  created_at?: string;
  updated_at?: string;
};

export function TableCategories() {
  const [data, setData] = React.useState<Category[]>([]);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = React.useState(1);

  // === Dialog states ===
  const [dialogType, setDialogType] = React.useState<"add" | "edit" | null>(
    null,
  );
  const [form, setForm] = React.useState<{
    id_kategori: string | null;
    nama_kategori: string;
  }>({
    id_kategori: null,
    nama_kategori: "",
  });
  const [initialForm, setInitialForm] = React.useState(form);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");

  // === Delete confirmation ===
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Category | null>(null);

  const hasChanges = React.useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  // === Debounce search (delay 400ms) ===
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // === Fetch data kategori berdasarkan pagination & search ===
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const page = pagination.pageIndex + 1;
      const limit = pagination.pageSize;
      const q = debouncedSearch
        ? `&search=${encodeURIComponent(debouncedSearch)}`
        : "";

      const res = await fetch(
        `/api/categories?page=${page}&limit=${limit}${q}`,
      );
      const result = await res.json();

      if (!res.ok)
        throw new Error(result.error || "Gagal memuat data kategori");

      setData(result.data || []);
      setTotalPages(result.pagination.totalPages || 1);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat data kategori",
      );
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // === Handle Add/Edit ===
  const handleOpenAdd = () => {
    setDialogType("add");
    const emptyForm = { id_kategori: null, nama_kategori: "" };
    setForm(emptyForm);
    setInitialForm(emptyForm);
    setError("");
  };

  const handleOpenEdit = (category: Category) => {
    setDialogType("edit");
    const f = {
      id_kategori: category.id_kategori,
      nama_kategori: category.nama_kategori,
    };
    setForm(f);
    setInitialForm(f);
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (form.nama_kategori.trim().length < 3) {
      setError("Nama kategori minimal 3 karakter");
      setSaving(false);
      return;
    }

    try {
      if (dialogType === "add") {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        showSuccess("Data berhasil ditambahkan");
      } else if (dialogType === "edit") {
        const res = await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        showSuccess("Data berhasil disimpan");
      }
      setDialogType(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = (category: Category) => {
    setSelected(category);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_kategori: selected.id_kategori }),
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

  const columns: ColumnDef<Category>[] = [
    {
      header: "No",
      cell: ({ row }) =>
        row.index + 1 + pagination.pageIndex * pagination.pageSize,
    },
    { accessorKey: "nama_kategori", header: "Nama Kategori" },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenEdit(category)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteConfirm(category)}
            >
              Hapus
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      {/* === Toolbar === */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <Button variant="main" onClick={handleOpenAdd}>
          Tambah Kategori
        </Button>

        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="w-full pl-8 md:w-64"
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
          {isLoading ? (
            Array.from({ length: pagination.pageSize }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                {Array.from({ length: columns.length }).map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-8 w-full rounded bg-gray-200"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-6 text-center">
                Tidak ada data
              </TableCell>
            </TableRow>
          )}
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

      {/* === Dialog Add/Edit === */}
      <Dialog
        open={!!dialogType}
        onOpenChange={(open) => !open && setDialogType(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {dialogType === "add"
                  ? "Tambah Kategori Baru"
                  : "Edit Kategori"}
              </DialogTitle>
              <DialogDescription>
                {dialogType === "add"
                  ? "Masukkan nama kategori baru."
                  : "Ubah nama kategori di bawah ini."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-3">
              <Label htmlFor="name">Nama Kategori</Label>
              <Input
                id="nama_kategori"
                value={form.nama_kategori}
                onChange={(e) =>
                  setForm({ ...form, nama_kategori: e.target.value })
                }
                disabled={saving}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="submit"
                variant="main"
                disabled={saving || (!hasChanges && dialogType === "edit")}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* === Delete Confirmation === */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin menghapus{" "}
              <b>{selected?.nama_kategori || "kategori ini"}</b>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
