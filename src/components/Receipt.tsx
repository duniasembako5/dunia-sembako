"use client";

import React from "react";

type TransactionDetail = {
  nama_barang: string;
  quantity: number;
  satuan: string;
  harga_jual: number;
};

export type Transaction = {
  id_transaksi: string;
  keterangan: string;
  admin_name: string;
  created_at: string;
  total_harga: string;
  tunai: string;
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
    second: "2-digit",
  });

  return (
    <div ref={ref} className="w-[300px] p-4 font-mono text-xs text-gray-800">
      <h2 className="text-center text-sm font-bold">DUNIA SEMBAKO MART</h2>
      <p className="text-center">RT. 01 RW. 18 NGAMBAR KALIKUNING</p>
      <p className="mb-2 text-center">Telp: 0813-9082-5800</p>

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
      <hr className="mb-2 border-dashed border-black" />
      <table className="w-full text-[11px]">
        <thead>
          <tr className="">
            <th className="text-left">Barang</th>
            <th className="text-center">Qty</th>
            <th></th>
            <th></th>
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
              <td className="px-[2px]">{item.satuan}</td>
              <td> </td>
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
      <hr className="my-2 border-dashed border-black" />
      <div className="flex justify-between text-sm font-semibold">
        <span></span>
        <span>{formatCurrency(transaction.total_harga)}</span>
      </div>
      <div className="flex justify-between text-sm font-semibold">
        <span>Tunai</span>
        <span>{formatCurrency(transaction.tunai)}</span>
      </div>
      <hr className="my-2 border-dashed border-black" />
      <div className="flex justify-between text-sm font-semibold">
        <span>Kembali</span>
        <span>
          {formatCurrency(
            Number(transaction.tunai) - Number(transaction.total_harga),
          )}
        </span>
      </div>
      <p className="mt-4 text-left text-[11px]">
        Barang yang telah dibeli tidak dapat dikembalikan kecuali ada
        perjanjian.
      </p>
    </div>
  );
});
Receipt.displayName = "Receipt";
