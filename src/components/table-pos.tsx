"use client";
import { showError, showInfo, showSuccess } from "@/lib/sonner-notification";
import { useReactToPrint } from "react-to-print";
import { Receipt, Transaction } from "@/components/Receipt";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, CreditCard } from "lucide-react";
import { formatRupiah } from "@/lib/formatRupiah";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/lib/useDebounce";
import { Input } from "@/components/ui/input"; // <-- 1. IMPORT TAMBAHAN
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Barang = {
  id_barang: string;
  kode_barang: string;
  nama_barang: string;
  harga_jual: number | string;
  satuan: string;
  stok: number | string;
  quantity: number; // Tipe data 'number' sudah tepat
};

export function TablePOS() {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Barang[]>([]);
  const [keranjang, setKeranjang] = useState<Barang[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [keterangan, setKeterangan] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>({
    id_transaksi: "",
    keterangan: "",
    admin_name: "",
    created_at: "",
    total_harga: "",
    details: [],
  });

  const printRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 400);

  // ... (useEffect untuk auto-fokus dan auto-scroll tetap sama) ...
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isAdding && tableRef.current) {
      tableRef.current.scrollTo({
        top: tableRef.current.scrollHeight,
        behavior: "smooth",
      });
      setIsAdding(false);
      showSuccess("Barang berhasil ditambahkan ke keranjang");
    }
  }, [keranjang, isAdding]);

  // ... (useEffect untuk fetchBarang dan handleKeyPress tetap sama) ...
  useEffect(() => {
    const fetchBarang = async () => {
      if (!debouncedSearch.trim()) {
        setSuggestions([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const res = await fetch(
          `/api/barang?search=${encodeURIComponent(debouncedSearch)}`,
        );
        const json = await res.json();
        setSuggestions(json.data || []);

        if (/^\d{6,}$/.test(debouncedSearch) && json.data?.length === 1) {
          addToCart(json.data[0]);
          setSearch("");
        }
      } catch (err) {
        console.error("Gagal fetch barang:", err);
        setSuggestions([]);
      } finally {
        setLoadingSearch(false);
      }
    };
    fetchBarang();
  }, [debouncedSearch]);

  useEffect(() => {
    let buffer = "";
    let timer: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer.length >= 6) {
          setSearch(buffer);
        }
        buffer = "";
        return;
      }
      if (/^[0-9a-zA-Z]$/.test(e.key)) {
        buffer += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => (buffer = ""), 300);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);

  const addToCart = (barang: Barang) => {
    setKeranjang((prev) => {
      const existing = prev.find((b) => b.id_barang === barang.id_barang);
      if (existing) {
        // Jika sudah ada, tambahkan 1 ke quantity yang sudah ada
        return prev.map((b) =>
          b.id_barang === barang.id_barang
            ? { ...b, quantity: b.quantity + 1 }
            : b,
        );
      }
      return [...prev, { ...barang, quantity: 1 }];
    });
    setIsAdding(true);
    setSearch("");
    setSuggestions([]);
  };

  const handleRemoveItem = (id_barang: string) =>
    setKeranjang((prev) => prev.filter((b) => b.id_barang !== id_barang));

  const handleReset = () => {
    setKeranjang([]);
    showSuccess("Keranjang berhasil direset");
  };

  // <-- 2. HANDLER BARU UNTUK UBAH QTY -->
  const handleQtyChange = (id_barang: string, newQtyStr: string) => {
    let newQty = parseFloat(newQtyStr);

    // Jika input tidak valid (kosong, "abc", atau negatif), anggap 0
    if (isNaN(newQty) || newQty < 0) {
      newQty = 0;
    }

    setKeranjang((prev) =>
      prev.map((b) =>
        b.id_barang === id_barang ? { ...b, quantity: newQty } : b,
      ),
    );
  };

  // <-- 3. HANDLER BARU UNTUK ONBLUR (UX) -->
  // Hapus item jika qty 0 saat input tidak lagi difokus
  const handleQtyBlur = (barang: Barang) => {
    if (barang.quantity <= 0) {
      handleRemoveItem(barang.id_barang);
    }
  };

  const totalHarga = keranjang.reduce(
    (acc, b) => acc + Number(b.harga_jual) * b.quantity,
    0,
  );

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleTransaksi = async () => {
    // <-- 4. MODIFIKASI: FILTER QTY 0 SAAT SUBMIT -->
    const itemsToSubmit = keranjang.filter((b) => b.quantity > 0);

    if (itemsToSubmit.length === 0) return showInfo("Keranjang kosong!");
    setLoadingSubmit(true);

    try {
      const data = {
        items: itemsToSubmit.map((b) => ({
          id_barang: b.id_barang,
          quantity: b.quantity,
        })),
        keterangan,
      };

      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json(); // ← ambil JSON responsenya

      if (!res.ok) {
        // kalau gagal, tampilkan pesan error dari server jika ada
        const msg = json?.message || "Gagal menyimpan transaksi";
        throw new Error(msg);
      }

      // kalau sukses, tampilkan pesan sukses dari server
      showSuccess(json?.message || "Transaksi berhasil disimpan");
      setKeranjang([]); // reset keranjang

      // Simpan detail transaksi untuk nota
      setSelectedTransaction(json.transaction);

      // Auto-print setelah sedikit delay (render dulu)
      setTimeout(() => {
        handlePrint();
      }, 200);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      showError(
        err instanceof Error ? err.message : "Terjadi kesalahan tak terduga",
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col overflow-hidden">
      {/* SEARCH BAR */}
      <div className="sticky top-0 z-20 flex flex-col gap-3 border-b bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex w-full md:w-1/2 lg:w-1/3">
          <Command className="w-full rounded-md border shadow-sm">
            <CommandInput
              ref={inputRef}
              placeholder="Scan barcode atau ketik nama barang..."
              value={search}
              onValueChange={setSearch}
              className="h-11 pr-10 text-base sm:text-sm"
            />

            {/* LOADING SPINNER */}
            {loadingSearch && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
                <svg
                  className="h-5 w-5 animate-spin text-gray-400"
                  xmlns="http://www.w.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              </div>
            )}

            {suggestions.length > 0 && (
              <CommandList className="max-h-56 overflow-y-auto">
                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {suggestions.map((b) => (
                    <CommandItem
                      key={b.id_barang}
                      value={b.nama_barang}
                      onSelect={() => addToCart(b)}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div>
                          <div className="font-medium">{b.nama_barang}</div>
                          <div className="text-xs text-gray-500">
                            {b.kode_barang}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {formatRupiah(Number(b.harga_jual))} /{b.satuan}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </div>
      </div>

      {/* TABLE */}
      <div ref={tableRef} className="flex-1 overflow-y-auto">
        <Table className="w-full overflow-hidden rounded-lg border-b">
          <TableHeader className="sticky top-0 z-10 bg-gray-50 text-gray-700">
            <TableRow>
              <TableHead className="w-12 text-center">No</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead className="w-32 text-center">Qty</TableHead>
              {/* Beri lebar */}
              <TableHead className="text-center">Satuan</TableHead>
              <TableHead className="text-center">Harga</TableHead>
              <TableHead className="text-center">Subtotal</TableHead>
              <TableHead className="w-16 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keranjang.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-6 text-center text-gray-400"
                >
                  Belum ada barang ditambahkan
                </TableCell>
              </TableRow>
            ) : (
              keranjang.map((b, i) => (
                <TableRow
                  key={b.id_barang}
                  className="transition hover:bg-gray-50"
                >
                  <TableCell className="text-center">{i + 1}</TableCell>
                  <TableCell>{b.kode_barang}</TableCell>
                  <TableCell className="font-medium">{b.nama_barang}</TableCell>

                  {/* <-- 5. MODIFIKASI: GANTI TEXT DENGAN INPUT --> */}
                  <TableCell className="w-32 text-center">
                    <Input
                      type="number"
                      // 'step="any"' mengizinkan desimal berapapun
                      step="any"
                      min="0"
                      value={b.quantity}
                      onChange={(e) =>
                        handleQtyChange(b.id_barang, e.target.value)
                      }
                      onBlur={() => handleQtyBlur(b)} // Hapus jika qty 0
                      className="h-9 text-center"
                    />
                  </TableCell>
                  {/* ------------------------------------------- */}

                  <TableCell className="text-center">{b.satuan}</TableCell>
                  <TableCell className="text-center">
                    {formatRupiah(Number(b.harga_jual))}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-green-600">
                    {formatRupiah(Number(b.harga_jual) * b.quantity)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(b.id_barang)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* TOTAL */}
      <div className="sticky bottom-0 z-20 flex flex-col gap-4 border-t bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">Total Pembayaran</span>
          <span className="text-5xl font-bold text-green-600">
            {formatRupiah(totalHarga)}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="destructive"
            onClick={handleReset}
            className="px-6 text-base"
            disabled={keranjang.length === 0 || loadingSubmit}
          >
            Reset
          </Button>
          <Button
            variant="main"
            disabled={keranjang.length === 0 || loadingSubmit}
            onClick={() => setIsSubmitOpen(true)}
            className="px-6 text-base"
          >
            {loadingSubmit ? (
              <>Memproses...</>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Proses
              </>
            )}
          </Button>
        </div>
      </div>

      {/* === Submit Confirmation === */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Transaksi</DialogTitle>
            <DialogDescription>
              Yakin ingin melakukan transaksi?
            </DialogDescription>
          </DialogHeader>

          {/* Tambahan input keterangan */}
          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Keterangan (opsional)
            </label>
            <input
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Masukkan keterangan tambahan (opsional)"
              type="text"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTransaksi();
                  setIsSubmitOpen(false);
                }
              }}
            />
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              variant="main"
              onClick={() => {
                handleTransaksi();
                setIsSubmitOpen(false);
              }}
              disabled={loadingSubmit}
            >
              {loadingSubmit ? (
                <>Memproses...</>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Bayar Sekarang
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Area tersembunyi untuk struk */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>
          <Receipt transaction={selectedTransaction} />
        </div>
      </div>
    </div>
  );
}
