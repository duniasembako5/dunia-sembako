import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "10");
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * limit;

  try {
    const client = await pool.connect();

    // 🔍 Total data (dengan filter search)
    const totalResult = await client.query(
      `
        SELECT COUNT(*) AS total
        FROM barang_transaksi bt
        JOIN barang b ON bt.barang_id = b.id_barang
        JOIN transaksi t ON bt.transaksi_id = t.id_transaksi
        JOIN admin a ON t.admin_id = a.id_admin
        WHERE 
          b.nama_barang ILIKE $1 OR
          b.kode_barang ILIKE $1 OR
          a.name ILIKE $1
      `,
      [`%${search}%`],
    );
    const totalItems = parseInt(totalResult.rows[0].total);
    const totalPages = Math.ceil(totalItems / limit);

    // 🔹 Data utama
    const result = await client.query(
      `
        SELECT
          bt.barang_id,
          b.kode_barang,
          b.nama_barang,
          a.name AS admin_name,
          bt.quantity,
          b.satuan,
          t.created_at
        FROM barang_transaksi bt
        JOIN barang b ON bt.barang_id = b.id_barang
        JOIN transaksi t ON bt.transaksi_id = t.id_transaksi
        JOIN admin a ON t.admin_id = a.id_admin
        WHERE 
          b.nama_barang ILIKE $1 OR
          b.kode_barang ILIKE $1 OR
          a.name ILIKE $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [`%${search}%`, limit, offset],
    );

    client.release();

    return NextResponse.json(
      {
        data: result.rows,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching barang keluar:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data barang keluar" },
      { status: 500 },
    );
  }
}
