import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔍 Ambil query parameters
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // 🔹 Query utama dengan filter pencarian
    const query = `
      SELECT 
        bm.barang_id,
        b.kode_barang,
        b.nama_barang,
        a.name AS admin_name,
        bm.quantity,
        b.satuan,
        bm.created_at
      FROM public.barang_masuk bm
      LEFT JOIN public.barang b ON bm.barang_id = b.id_barang
      LEFT JOIN public.admin a ON bm.admin_id = a.id_admin
      WHERE 
        b.nama_barang ILIKE $1
        OR b.kode_barang ILIKE $1
        OR a.name ILIKE $1
      ORDER BY bm.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM public.barang_masuk bm
      LEFT JOIN public.barang b ON bm.barang_id = b.id_barang
      LEFT JOIN public.admin a ON bm.admin_id = a.id_admin
      WHERE 
        b.nama_barang ILIKE $1
        OR b.kode_barang ILIKE $1
        OR a.name ILIKE $1
    `;

    const values = [`%${search}%`, limit, offset];
    const countValues = [`%${search}%`];

    // Jalankan query paralel biar cepat
    const [dataRes, countRes] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues),
    ]);

    const total = parseInt(countRes.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        data: dataRes.rows,
        pagination: {
          total,
          page,
          totalPages,
          limit,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("GET barang_masuk error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data barang masuk" },
      { status: 500 },
    );
  }
}
