import { NextResponse } from "next/server";
import pool from "@/lib/db";
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

  const body = await req.json();
  const { items, keterangan, tunai } = body;

  if (!items || items.length === 0) {
    return NextResponse.json(
      { success: false, message: "Tidak ada item yang dikirim." },
      { status: 400 },
    );
  }

  const client = await pool.connect();

  try {
    const id_transaksi = generateId("TRX", true, 6);
    const tanggal = new Date();

    await client.query("BEGIN");

    // 🧾 1️⃣ Buat transaksi utama
    await client.query(
      `
      INSERT INTO public.transaksi (id_transaksi, admin_id, keterangan, tunai, created_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [id_transaksi, user.id, keterangan || "", tunai, tanggal],
    );

    const itemsDetail = [];

    // 🔁 2️⃣ Loop tiap item transaksi
    for (const item of items) {
      const id_barang_transaksi = generateId("ITR", false, 8);

      // 🔍 Ambil data harga & stok barang (FOR UPDATE agar aman)
      const { rows } = await client.query(
        `
        SELECT nama_barang, harga_jual, stok, satuan
        FROM public.barang 
        WHERE id_barang = $1 
        FOR UPDATE
        `,
        [item.id_barang],
      );

      if (rows.length === 0) {
        throw new Error(`Barang dengan ID ${item.id_barang} tidak ditemukan.`);
      }

      const { nama_barang, harga_jual, stok, satuan } = rows[0];

      // 🚫 Cegah stok negatif
      if (stok < item.quantity) {
        throw new Error(
          `Stok barang "${nama_barang}" tidak mencukupi. Tersisa: ${Number(stok)}, dibutuhkan: ${item.quantity}`,
        );
      }

      // 🧾 Insert ke tabel barang_transaksi
      await client.query(
        `
        INSERT INTO public.barang_transaksi 
        (id_barang_transaksi, transaksi_id, barang_id, quantity, harga_jual)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          id_barang_transaksi,
          id_transaksi,
          item.id_barang,
          item.quantity,
          harga_jual,
        ],
      );

      // 📦 Update stok barang
      await client.query(
        `UPDATE public.barang SET stok = stok - $1 WHERE id_barang = $2`,
        [item.quantity, item.id_barang],
      );

      // 💾 Simpan detail untuk dikembalikan ke frontend
      itemsDetail.push({
        id_barang_transaksi,
        nama_barang,
        quantity: item.quantity,
        harga_jual,
        satuan,
        subtotal: item.quantity * harga_jual,
      });
    }

    await client.query("COMMIT");

    // 🧾 Hitung total harga
    const total_harga = itemsDetail.reduce((sum, i) => sum + i.subtotal, 0);

    // ✅ Kirim data lengkap ke frontend
    return NextResponse.json({
      success: true,
      message: `Transaksi ${id_transaksi} berhasil disimpan.`,
      transaction: {
        id_transaksi,
        keterangan,
        admin_name: user.name,
        created_at: tanggal,
        total_harga,
        tunai,
        details: itemsDetail,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat membuat transaksi.";

    return NextResponse.json({ success: false, message }, { status: 400 });
  } finally {
    client.release();
  }
}
