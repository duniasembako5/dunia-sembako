import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateId } from "@/lib/generateId";

/**
 * ✅ GET: Fetches items with category name, pagination, and expanded search.
 * @param {Request} req - The incoming request object.
 * @example /api/barang?page=1&limit=10&search=Elektronik
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    const queryParams: (string | number)[] = [];

    let baseQuery = `
      FROM public.barang b
      LEFT JOIN public.kategori c ON b.kategori_id = c.id_kategori
    `;

    if (search) {
      queryParams.push(`%${search}%`);
      baseQuery += ` WHERE b.nama_barang ILIKE $1 OR c.nama_kategori ILIKE $1 OR b.kode_barang ILIKE $1`;
    }

    const countQuery = `SELECT COUNT(b.id_barang) ${baseQuery}`;
    const totalResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    queryParams.push(limit, offset);

    const dataQuery = `
      SELECT b.*, c.nama_kategori
      ${baseQuery} 
      ORDER BY b.created_at ASC 
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const { rows } = await pool.query(dataQuery, queryParams);

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
      { error: "Failed to fetch barang" },
      { status: 500 },
    );
  }
}

// ✅ POST: Creates a new item.
export async function POST(req: Request) {
  try {
    const { kode_barang, nama_barang, kategori_id, harga_jual, stok, satuan } =
      await req.json();

    const id_barang = generateId("ITM", false, 10);

    if (!nama_barang || !kategori_id || !harga_jual || !satuan) {
      return NextResponse.json(
        { error: "Isikan semua field!" },
        { status: 400 },
      );
    }

    const query = `
      INSERT INTO public.barang (id_barang, kode_barang, nama_barang, kategori_id, harga_jual, stok, satuan)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      id_barang,
      kode_barang || null,
      nama_barang,
      kategori_id,
      harga_jual,
      stok,
      satuan,
    ];

    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error(
      "POST /barang error:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Failed to create barang" },
      { status: 500 },
    );
  }
}

//  ✅ PUT: Updates an existing item.
export async function PUT(req: Request) {
  try {
    const {
      id_barang,
      kode_barang,
      nama_barang,
      kategori_id,
      harga_jual,
      stok,
      satuan,
    } = await req.json();

    if (!id_barang || !nama_barang || !kategori_id || !harga_jual || !satuan) {
      return NextResponse.json(
        { error: "Isikan semua field!" },
        { status: 400 },
      );
    }

    const query = `
      UPDATE public.barang
      SET kode_barang=$1, nama_barang=$2, kategori_id=$3, harga_jual=$4, stok=$5, satuan=$6, updated_at=NOW()
      WHERE id_barang=$7
      RETURNING *;
    `;
    const values = [
      kode_barang || null,
      nama_barang,
      kategori_id,
      harga_jual,
      stok,
      satuan,
      id_barang,
    ];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Barang tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(
      "PUT /barang error:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Gagal memperbarui barang" },
      { status: 500 },
    );
  }
}

// ✅ DELETE: Deletes an item by its ID.
export async function DELETE(req: Request) {
  try {
    // 1. Read the
    const { id_barang } = await req.json();

    // 2. Validate that the 'id' was provided in the body.
    if (!id_barang) {
      return NextResponse.json(
        { error: "ID barang tidak ada" },
        { status: 400 },
      );
    }

    const query = `DELETE FROM public.barang WHERE id_barang = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [id_barang]);

    // Check if any row was actually deleted.
    if (rows.length === 0) {
      return NextResponse.json({ error: "Barang not found" }, { status: 404 });
    }

    const deletedBarang = rows[0];

    // Return a success message.
    return NextResponse.json(
      {
        success: true,
        message: `${deletedBarang.nama_barang} berhasil dihapus!`,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("DELETE error:", err instanceof Error ? err.message : err);

    // Handle cases where the request body is not valid JSON.
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Body request tidak valid" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Gagal menghapus barang" },
      { status: 500 },
    );
  }
}
