"use client";

import React from "react";

type TransactionDetail = {
  nama_barang: string;
  quantity: number;
  harga_jual: number;
};

export type Transaction = {
  id_transaksi: string;
  keterangan: string;
  admin_name: string;
  created_at: string;
  total_harga: string;
  details: TransactionDetail[];
};

const formatCurrency = (value: number | string) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(numericValue);
};

export const Receipt = React.forwardRef<
  HTMLDivElement,
  { transaction: Transaction }
>(({ transaction }, ref) => {
  const tanggal = new Date(transaction.created_at).toLocaleString("id-ID", {
    dateStyle: "medium",
  });

  const jam = new Date(transaction.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div ref={ref} className="w-[300px] p-4 font-mono text-xs text-gray-800">
      <h2 className="text-center text-sm font-bold">DUNIA SEMBAKO</h2>
      <p className="text-center">Jl. Contoh Raya No. 123</p>
      <p className="mb-2 text-center">Telp: 0812-3456-7890</p>
      <hr className="mb-2 border-gray-800" />

      <div className="mb-1 flex justify-between text-[11px]">
        <span>{transaction.id_transaksi}</span>
        <span>{tanggal}</span>
      </div>

      <div className="mb-1 flex justify-between text-[11px]">
        <span>Kasir: {transaction.admin_name}</span>
        <span>{jam}</span>
      </div>
      {transaction.keterangan && (
        <div className="mb-1 flex justify-between text-[11px]">
          <span>Ket : {transaction.keterangan}</span>
        </div>
      )}
      <hr className="my-2 border-gray-800" />
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left">Barang</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Harga</th>
            <th className="text-right">Sub</th>
          </tr>
        </thead>
        <tbody>
          {transaction.details.map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="text-left align-top">{item.nama_barang}</td>
              <td className="px-[2px] text-center align-top">
                {item.quantity}
              </td>
              <td className="px-[2px] text-right align-top">
                {formatCurrency(item.harga_jual)}
              </td>
              <td className="px-[2px] text-right align-top">
                {formatCurrency(item.harga_jual * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-2 border-gray-800" />
      <div className="flex justify-between text-sm font-semibold">
        <span>Total</span>
        <span>{formatCurrency(transaction.total_harga)}</span>
      </div>
      <p className="mt-4 text-center text-[11px]">
        Terima kasih atas kunjungan Anda!
      </p>
    </div>
  );
});
Receipt.displayName = "Receipt";
