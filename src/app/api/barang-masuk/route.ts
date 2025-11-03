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
        bm.id_barang_masuk,
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

export async function DELETE(req: Request) {
  const client = await pool.connect();

  try {
    const { id_barang_masuk } = await req.json();

    if (!id_barang_masuk) {
      return NextResponse.json(
        { success: false, message: "ID barang masuk wajib diisi" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // 1️⃣ ambil data barang_masuk (biar tahu barang_id & quantity)
    const result = await client.query(
      `SELECT barang_id, quantity FROM public.barang_masuk WHERE id_barang_masuk = $1`,
      [id_barang_masuk],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, message: "Data barang masuk tidak ditemukan" },
        { status: 404 },
      );
    }

    const { barang_id, quantity } = result.rows[0];

    // 2️⃣ ambil stok lama dari tabel barang
    const stokResult = await client.query(
      "SELECT stok FROM public.barang WHERE id_barang = $1",
      [barang_id],
    );

    if (stokResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, message: "Barang tidak ditemukan" },
        { status: 404 },
      );
    }

    const stokLama = parseFloat(stokResult.rows[0].stok);
    const stokBaru = stokLama - parseFloat(quantity);

    // 3️⃣ update stok barang (kurangi kembali)
    await client.query(
      "UPDATE public.barang SET stok = $1, updated_at = NOW() WHERE id_barang = $2",
      [stokBaru, barang_id],
    );

    // 4️⃣ hapus data barang_masuk
    await client.query(
      `DELETE FROM public.barang_masuk WHERE id_barang_masuk = $1`,
      [id_barang_masuk],
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Barang masuk dibatalkan & stok dikembalikan",
        stok_baru: stokBaru,
      },
      { status: 200 },
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DELETE error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus barang masuk" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
