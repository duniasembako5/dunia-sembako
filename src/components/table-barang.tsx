"use client";

import * as React from "react";
import { showSuccess, showError } from "@/lib/sonner-notification";
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
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah, parseRupiah } from "@/lib/formatRupiah";
import { Search } from "lucide-react";

type Kategori = { id_kategori: string; nama_kategori: string };
type Barang = {
  id_barang: string | null;
  kode_barang: string | null;
  nama_barang: string;
  kategori_id: string;
  kategori_name: string;
  harga_jual: number;
  stok: string | number;
  satuan: string;
};

export function TableBarang() {
  const [data, setData] = React.useState<Barang[]>([]);
  const [kategori, setKategori] = React.useState<Kategori[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = React.useState(1);

  const [dialogType, setDialogType] = React.useState<"add" | "edit" | null>(
    null,
  );

  const [dialogAddStockOpen, setDialogAddStockOpen] = React.useState(false);
  const [formAddStock, setFormAddStock] = React.useState({
    id_barang: null as string | null,
    nama_barang: "",
    stok: "",
    satuan: "",
  });

  const [form, setForm] = React.useState({
    id_barang: null as string | null,
    kode_barang: "",
    nama_barang: "",
    kategori_id: "",
    harga_jual: "",
    stok: "",
    satuan: "",
  });

  const [initialForm, setInitialForm] = React.useState(form);
  const [saving, setSaving] = React.useState(false);
  const [savingAddStock, setSavingAddStock] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Barang | null>(null);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  // === Debounce search (delay 400ms) ===
  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // === Fetch data barang berdasarkan pagination & search ===
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const page = pagination.pageIndex + 1;
      const limit = pagination.pageSize;
      const q = debouncedSearch
        ? `&search=${encodeURIComponent(debouncedSearch)}`
        : "";
      const res = await fetch(`/api/barang?page=${page}&limit=${limit}${q}`);
      const result = await res.json();

      if (!res.ok)
        throw new Error(result.message || "Gagal memuat data barang");

      setData(result.data || []);
      setTotalPages(result.pagination.totalPages || 0);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat data barang";
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // === Fetch kategori sekali ===
  const fetchKategori = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal memuat kategori");

      setKategori(data.data || []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat kategori";
      showError(message);
    }
  };

  // === useEffect: ambil data setiap pagination/search berubah ===
  React.useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  React.useEffect(() => {
    fetchKategori();
  }, []);

  // === Form dialog handler ===
  const handleOpenAdd = () => {
    setDialogType("add");
    const empty = {
      id_barang: "",
      kode_barang: "",
      nama_barang: "",
      kategori_id: "",
      harga_jual: "",
      stok: "",
      satuan: "",
    };
    setForm(empty);
    setInitialForm(empty);
    setError("");
  };

  const handleOpenAddStock = (b: Barang) => {
    setDialogAddStockOpen(true);
    const f = {
      id_barang: b.id_barang,
      nama_barang: b.nama_barang,
      stok: "0",
      satuan: b.satuan,
    };
    setFormAddStock(f);
    setError("");
  };

  const handleOpenEdit = (b: Barang) => {
    setDialogType("edit");
    const f = {
      id_barang: b.id_barang,
      kode_barang: b.kode_barang || "",
      nama_barang: b.nama_barang,
      kategori_id: b.kategori_id,
      harga_jual: formatRupiah(b.harga_jual),
      stok: String(b.stok),
      satuan: b.satuan,
    };
    setForm(f);
    setInitialForm(f);
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.nama_barang.trim()) {
      setError("Nama barang wajib diisi");
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      harga_jual: parseRupiah(form.harga_jual),
      stok: parseFloat(form.stok),
      kategori_id: form.kategori_id,
    };

    try {
      const res = await fetch("/api/barang", {
        method: dialogType === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan data");

      fetchData();
      showSuccess(result.message || "Data berhasil disimpan");
      setDialogType(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan data";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/barang", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_barang: selected.id_barang }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal menghapus barang");

      // ✅ Update state lokal langsung
      setData((prev) => prev.filter((b) => b.id_barang !== selected.id_barang));

      showSuccess(result.message || "Barang berhasil dihapus");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus";
      showError(message);
    } finally {
      setSelected(null);
      setIsDeleteOpen(false);
      setDeleting(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddStock(true);
    setError("");

    if (!formAddStock.id_barang) {
      setError("Data barang tidak valid");
      setSavingAddStock(false);
      return;
    }

    const jumlahTambah = parseFloat(formAddStock.stok);
    if (isNaN(jumlahTambah) || jumlahTambah <= 0) {
      setError("Jumlah stok harus lebih besar dari 0");
      setSavingAddStock(false);
      return;
    }

    try {
      const res = await fetch("/api/add-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_barang: formAddStock.id_barang,
          jumlah_tambah: jumlahTambah,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal menambah stok");

      showSuccess(result.message || "Stok berhasil ditambahkan");

      // refresh data tabel
      await fetchData();

      setDialogAddStockOpen(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menambah stok";
      showError(message);
      setError(message);
    } finally {
      setSavingAddStock(false);
    }
  };

  // === Kolom tabel ===
  const columns: ColumnDef<Barang>[] = [
    {
      header: "No",
      cell: ({ row }) =>
        row.index + 1 + pagination.pageIndex * pagination.pageSize,
    },
    { accessorKey: "kode_barang", header: "Kode" },
    { accessorKey: "nama_barang", header: "Nama Barang" },
    { accessorKey: "nama_kategori", header: "Kategori" },
    {
      accessorKey: "harga_jual",
      header: "Harga Jual",
      cell: ({ row }) => formatRupiah(row.original.harga_jual),
    },
    {
      accessorKey: "stok",
      header: "Stok",
      cell: ({ row }) => {
        const raw = row.original.stok;
        const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
        if (Number.isNaN(n)) return "-";
        return Number.isInteger(n)
          ? n.toString()
          : n.toFixed(2).replace(/\.00$/, "");
      },
    },
    { accessorKey: "satuan", header: "Satuan" },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={"main"}
              onClick={() => handleOpenAddStock(b)}
            >
              Tambah Stok
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenEdit(b)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setSelected(b);
                setIsDeleteOpen(true);
              }}
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
    pageCount: totalPages,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      {/* === Toolbar === */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <Button variant="main" onClick={handleOpenAdd}>
          Tambah Barang Baru
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 })); // reset ke page 1
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
          {isLoading ? ( // Skeleton
            Array.from({ length: pagination.pageSize }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="animate-pulse">
                {Array.from({ length: table.getAllColumns().length }).map(
                  (_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <div className="h-8 w-full rounded bg-gray-200"></div>
                    </TableCell>
                  ),
                )}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-3 text-center text-gray-500">
                Tidak ada hasil ditemukan
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
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
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {dialogType === "add" ? "Tambah Barang Baru" : "Edit Barang"}
              </DialogTitle>
              <DialogDescription>
                {dialogType === "add"
                  ? "Masukkan data barang baru."
                  : "Ubah data barang di bawah ini."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-3">
              <Label>Kode Barang</Label>
              <Input
                value={form.kode_barang}
                onChange={(e) =>
                  setForm({ ...form, kode_barang: e.target.value })
                }
                disabled={saving}
              />
              <Label>Nama Barang</Label>
              <Input
                value={form.nama_barang}
                onChange={(e) =>
                  setForm({ ...form, nama_barang: e.target.value })
                }
                disabled={saving}
              />
              <Label>Kategori</Label>
              <Select
                value={form.kategori_id}
                onValueChange={(v) => setForm({ ...form, kategori_id: v })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {kategori.map((k) => (
                    <SelectItem key={k.id_kategori} value={k.id_kategori}>
                      {k.nama_kategori}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Harga Jual</Label>
              <Input
                value={form.harga_jual}
                onChange={(e) => {
                  const num = parseInt(
                    e.target.value.replace(/[^0-9]/g, "") || "0",
                  );
                  setForm({ ...form, harga_jual: formatRupiah(num) });
                }}
                disabled={saving}
              />
              <Label>Stok</Label>
              <Input
                type="number"
                step="1"
                disabled={dialogType === "edit" || saving} // disable for edit
                value={form.stok}
                onChange={(e) => setForm({ ...form, stok: e.target.value })}
              />
              <Label>Satuan</Label>
              <Input
                value={form.satuan}
                onChange={(e) => setForm({ ...form, satuan: e.target.value })}
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

      {/* === Dialog Add Stock === */}
      <Dialog open={dialogAddStockOpen} onOpenChange={setDialogAddStockOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleAddStock}>
            <DialogHeader>
              <DialogTitle>Tambah Stok</DialogTitle>
              <DialogDescription>
                Masukkan jumlah stok yang ingin ditambahkan.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-3">
              <Label>Nama Barang</Label>
              <Input
                value={formAddStock.nama_barang}
                onChange={(e) =>
                  setFormAddStock({
                    ...formAddStock,
                    nama_barang: e.target.value,
                  })
                }
                disabled
              />
              <div className="grid grid-cols-2 gap-3">
                <Label>Jumlah Stok Bertambah</Label>
                <Label>Satuan</Label>
                <Input
                  type="number"
                  step="1"
                  disabled={dialogType === "edit" || savingAddStock} // disable for edit
                  value={formAddStock.stok}
                  onChange={(e) =>
                    setFormAddStock({ ...formAddStock, stok: e.target.value })
                  }
                />
                <Input
                  value={formAddStock.satuan}
                  onChange={(e) =>
                    setFormAddStock({ ...formAddStock, satuan: e.target.value })
                  }
                  disabled
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <DialogFooter className="mt-4">
              <Button type="submit" variant="main" disabled={savingAddStock}>
                {savingAddStock ? "Memproses..." : "Tambah Stok"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* === Delete Confirmation === */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Hapus Barang</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus <b>{selected?.nama_barang}</b>?
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
