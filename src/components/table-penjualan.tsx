"use client";

import * as React from "react";
import { useReactToPrint } from "react-to-print";
import { Receipt } from "@/components/Receipt";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  ExpandedState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toGMT7 } from "@/lib/formatDbDate";

// === 1. Definisikan Tipe Data ===
type TransactionDetail = {
  nama_barang: string;
  quantity: number;
  satuan: string;
  harga_jual: number;
};

type Transaction = {
  id_transaksi: string;
  keterangan: string;
  admin_name: string;
  created_at: string;
  total_harga: string;
  tunai: string;
  details: TransactionDetail[];
};

// === 2. Helper format rupiah ===
const formatCurrency = (value: number | string) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "Invalid Number";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(numericValue);
};

// === 3. Subtable ===
function SubTableDetail({ details }: { details: TransactionDetail[] }) {
  if (!details || details.length === 0)
    return (
      <p className="p-4 text-center text-sm text-gray-500">
        Tidak ada detail barang untuk transaksi ini.
      </p>
    );

  return (
    <div className="bg-gray-50 p-4">
      <h4 className="mb-2 text-sm font-semibold">Detail Barang:</h4>
      <Table className="rounded-md border bg-white">
        <TableHeader>
          <TableRow>
            <TableCell className="font-semibold">Nama Barang</TableCell>
            <TableCell className="text-right font-semibold">Qty</TableCell>
            <TableCell className="text-right font-semibold">
              Harga Satuan
            </TableCell>
            <TableCell className="text-right font-semibold">Subtotal</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.nama_barang}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.harga_jual)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.quantity * item.harga_jual)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// === 4. Komponen Utama ===
export function TablePenjualan() {
  const [data, setData] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [totalPages, setTotalPages] = React.useState(1);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<Transaction | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const handleCetak = (transaction: Transaction) =>
    setSelectedTransaction(transaction);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Struk Transaksi",
  });

  React.useEffect(() => {
    fetchData(pagination.pageIndex + 1);
  }, [pagination.pageIndex, pagination.pageSize]);

  const fetchData = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/penjualan?page=${page}&limit=${pagination.pageSize}`,
      );
      const result = await res.json();
      setData(result.data);
      setPagination((prev) => ({
        ...prev,
        totalItems: result.pagination.totalItems,
        totalPages: result.pagination.totalPages,
      }));
      setTotalPages(result.pagination.totalPages || 0);
    } catch (error) {
      console.error("Gagal mengambil data transaksi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={row.getToggleExpandedHandler()}
          disabled={!row.getCanExpand()}
          className="w-8 p-0"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "id_transaksi",
      header: "ID Transaksi",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.id_transaksi}</span>
      ),
    },
    { accessorKey: "admin_name", header: "Kasir" },
    {
      accessorKey: "total_harga",
      header: "Total Harga",
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency(row.original.total_harga)}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Tanggal Transaksi",
      cell: ({ getValue }) => toGMT7(getValue() as string),
    },
    { accessorKey: "keterangan", header: "Keterangan" },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCetak(row.original)}
        >
          Cetak
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    pageCount: totalPages,
    manualPagination: true,
    onPaginationChange: setPagination,
    state: { expanded, pagination },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id_transaksi,
    getRowCanExpand: (row) =>
      row.original.details && row.original.details.length > 0,
  });

  return (
    <div className="space-y-4">
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
                {Array.from({ length: table.getAllColumns().length }).map(
                  (_, j) => (
                    <TableCell key={j}>
                      <div className="h-8 w-full rounded bg-gray-200"></div>
                    </TableCell>
                  ),
                )}
              </TableRow>
            ))
          ) : data.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <TableRow
                  className="hover:bg-gray-50"
                  data-state={row.getIsExpanded() && "selected"}
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
                {row.getIsExpanded() && (
                  <TableRow>
                    <TableCell colSpan={table.getAllColumns().length}>
                      <SubTableDetail details={row.original.details} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                Tidak ada data transaksi.
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

      {/* Modal Cetak */}
      <Dialog
        open={!!selectedTransaction}
        onOpenChange={() => setSelectedTransaction(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cetak Struk</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <>
              <div ref={printRef}>
                <Receipt transaction={selectedTransaction} />
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="main" onClick={handlePrint}>
                  Print
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
