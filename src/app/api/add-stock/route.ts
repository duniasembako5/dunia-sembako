import { NextResponse } from "next/server";
import pool from "@/lib/db"; // pastikan kamu udah punya koneksi ke PostgreSQL di sini
import { generateId } from "@/lib/generateId";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User belum login." },
      { status: 401 },
    );
  }

  const client = await pool.connect();

  try {
    const body = await req.json();
    const id_barang_masuk = generateId("STK-IN", true, 6);
    const { id_barang, jumlah_tambah } = body;

    if (!id_barang || !jumlah_tambah) {
      return NextResponse.json(
        { message: "ID barang dan jumlah_tambah wajib diisi" },
        { status: 400 },
      );
    }

    // 1️⃣ ambil stok lama
    const result = await client.query(
      "SELECT stok FROM barang WHERE id_barang = $1",
      [id_barang],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Barang tidak ditemukan" },
        { status: 404 },
      );
    }

    const stokLama = parseFloat(result.rows[0].stok);
    const stokBaru = stokLama + parseFloat(jumlah_tambah);

    // 2️⃣ update stok di tabel barang
    await client.query(
      "UPDATE barang SET stok = $1, updated_at = NOW() WHERE id_barang = $2",
      [stokBaru, id_barang],
    );

    // 3️⃣ simpan juga ke tabel barang_masuk (riwayat)
    await client.query(
      `INSERT INTO barang_masuk (id_barang_masuk, barang_id, admin_id, quantity, created_at, updated_at)
       VALUES ($1, $2 , $3 , $4, NOW() , NOW())`,
      [id_barang_masuk, id_barang, user.id, jumlah_tambah],
    );

    await client.query("COMMIT");

    return NextResponse.json({
      message: "Stok berhasil ditambahkan",
      stok_baru: stokBaru,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menambah stok" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
