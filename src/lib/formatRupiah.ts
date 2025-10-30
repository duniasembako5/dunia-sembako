export function formatRupiah(value: number | string): string {
  const num = Number(value);
  if (isNaN(num)) return "Rp 0";
  return num.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });
}

// untuk parsing input “Rp 10.000” jadi angka
export function parseRupiah(value: string): number {
  return Number(value.replace(/[^0-9,-]+/g, "").replace(",", "."));
}
