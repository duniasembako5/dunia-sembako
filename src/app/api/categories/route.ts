import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateId } from "@/lib/generateId";

// ✅ GET semua kategori
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Query dengan search opsional
    const query = `
      SELECT * FROM public.kategori
      WHERE LOWER(nama_kategori) LIKE LOWER($1)
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(query, [`%${search}%`, limit, offset]);

    // Hitung total data (untuk pagination)
    const countQuery = `
      SELECT COUNT(*) FROM public.kategori
      WHERE LOWER(nama_kategori) LIKE LOWER($1)
    `;
    const countResult = await pool.query(countQuery, [`%${search}%`]);
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      data: rows,
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
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

// ✅ POST tambah kategori
export async function POST(req: NextRequest) {
  try {
    const { nama_kategori } = await req.json();
    const id_kategori = generateId("KAT", false, 6);
    if (!nama_kategori)
      return NextResponse.json(
        { error: "Nama kategori wajib diisi" },
        { status: 400 },
      );

    const check = await pool.query(
      `SELECT id_kategori FROM public.kategori WHERE nama_kategori = $1`,
      [nama_kategori],
    );
    if (check.rowCount && check.rowCount > 0) {
      return NextResponse.json(
        { error: "Kategori sudah ada" },
        { status: 400 },
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO public.kategori (id_kategori, nama_kategori)
        VALUES ($1, $2) RETURNING *`,
      [id_kategori, nama_kategori],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("POST error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Gagal menambahkan kategori" },
      { status: 500 },
    );
  }
}

// ✅ PUT update kategori
export async function PUT(req: NextRequest) {
  try {
    const { id_kategori, nama_kategori } = await req.json();
    if (!id_kategori || !nama_kategori)
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      );

    const { rows } = await pool.query(
      `UPDATE public.kategori SET nama_kategori = $1, updated_at = NOW() WHERE id_kategori = $2 RETURNING *`,
      [nama_kategori, id_kategori],
    );

    if (!rows.length)
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 },
      );

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("PUT error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

// ✅ [OKE] DELETE hapus kategori
export async function DELETE(req: NextRequest) {
  try {
    const { id_kategori } = await req.json();

    if (!id_kategori) {
      return NextResponse.json(
        { success: false, message: "ID kategori wajib diisi" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `DELETE FROM public.kategori WHERE id_kategori = $1 RETURNING *`,
      [id_kategori],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Kategori berhasil dihapus" },
      { status: 200 },
    );
  } catch (err) {
    console.error("DELETE error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus kategori" },
      { status: 500 },
    );
  }
}
