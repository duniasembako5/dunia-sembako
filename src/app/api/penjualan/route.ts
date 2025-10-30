import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/transaksi?page=1&limit=10
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const query = `
      WITH TransactionDetails AS (
        SELECT
          bt.transaksi_id,
          json_agg(
            json_build_object(
              'nama_barang', b.nama_barang,
              'quantity', bt.quantity,
              'harga_jual', bt.harga_jual
            )
          ) AS details,
          SUM(bt.quantity * bt.harga_jual) AS total_harga
        FROM public.barang_transaksi bt
        JOIN public.barang b ON bt.barang_id = b.id_barang
        GROUP BY bt.transaksi_id
      )
      SELECT
        t.id_transaksi,
        t.keterangan,
        a.name AS admin_name,
        t.created_at,
        COALESCE(td.total_harga, 0) AS total_harga,
        COALESCE(td.details, '[]') AS details
      FROM public.transaksi t
      JOIN public.admin a ON t.admin_id = a.id_admin
      LEFT JOIN TransactionDetails td ON t.id_transaksi = td.transaksi_id
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const countQuery = `SELECT COUNT(*) FROM public.transaksi;`;

    const [result, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery),
    ]);

    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (err) {
    console.error("GET error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi" },
      { status: 500 },
    );
  }
}
