import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateId } from "@/lib/generateId";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    // Query untuk ambil data admin dengan pencarian
    const query = `
      SELECT id_admin, name, username, role
      FROM public.admin
      WHERE name ILIKE $1 OR username ILIKE $1 OR role ILIKE $1
      ORDER BY id_admin ASC
      LIMIT $2 OFFSET $3
    `;
    const values = [`%${search}%`, limit, offset];
    const { rows } = await pool.query(query, values);

    // Hitung total data
    const countQuery = `
      SELECT COUNT(*) 
      FROM public.admin 
      WHERE name ILIKE $1 OR username ILIKE $1 OR role ILIKE $1
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
      { error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { name, username, password, role } = await req.json();

  const id_admin = generateId("ADM", false, 6);

  // 🔒 Validasi username
  if (!username || username.length < 3) {
    return NextResponse.json(
      { error: "Username minimal 3 karakter" },
      { status: 400 },
    );
  }

  // 🔒 Validasi password
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password minimal 8 karakter" },
      { status: 400 },
    );
  }

  try {
    const check = await pool.query(
      `SELECT 1 FROM public.admin WHERE username=$1`,
      [username],
    );
    if (check?.rowCount && check.rowCount > 0) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      `INSERT INTO public.admin(id_admin, name, username, role, password) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id_admin, name, username, role`,
      [id_admin, name, username, role, hash],
    );

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const { id_admin, name, username, role, password, changePassword } =
    await req.json();

  // 🔒 Validasi username
  if (!username || username.length < 3) {
    return NextResponse.json(
      { error: "Username minimal 3 karakter" },
      { status: 400 },
    );
  }

  // 🔒 Validasi password jika diubah
  if (changePassword && password && password.length < 8) {
    return NextResponse.json(
      { error: "Password minimal 8 karakter" },
      { status: 400 },
    );
  }

  try {
    // ✅ Cek username duplikat (kecuali dirinya sendiri)
    const check = await pool.query(
      `SELECT 1 FROM public.admin WHERE username = $1 AND id_admin <> $2`,
      [username, id_admin],
    );

    if (check?.rowCount && check.rowCount > 0) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 },
      );
    }

    let query;
    let params;

    if (changePassword && password) {
      const hash = await bcrypt.hash(password, 10);
      query = `
        UPDATE public.admin 
        SET name = $1, username = $2, role = $3, password = $4, updated_at = NOW()
        WHERE id_admin = $5 
        RETURNING id_admin, name, username, role, updated_at
      `;
      params = [name, username, role, hash, id_admin];
    } else {
      query = `
        UPDATE public.admin
        SET name = $1, username = $2, role = $3, updated_at = NOW()
        WHERE id_admin = $4 
        RETURNING id_admin, name, username, role, updated_at
      `;
      params = [name, username, role, id_admin];
    }

    const res = await pool.query(query, params);

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id_admin } = await req.json();

    // 🧩 Validasi input
    if (!id_admin) {
      return NextResponse.json(
        { success: false, message: "ID admin wajib diisi" },
        { status: 400 },
      );
    }

    // 🚀 Hapus data dan ambil data yang dihapus
    const query = `DELETE FROM public.admin WHERE id_admin = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [id_admin]);

    // ⚠️ Cek apakah admin ditemukan
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Admin tidak ditemukan" },
        { status: 404 },
      );
    }

    const deletedAdmin = rows[0];

    // ✅ Respons sukses
    return NextResponse.json(
      {
        success: true,
        message: `Admin "${deletedAdmin.name}" berhasil dihapus!`,
        deleted: deletedAdmin,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("DELETE error:", err instanceof Error ? err.message : err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Body request tidak valid" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Gagal menghapus admin" },
      { status: 500 },
    );
  }
}
