export function generateId(
  prefix: string,
  date: boolean = false,
  length: number = 6,
  timezone: string = "Asia/Jakarta",
) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < length; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  if (!date) return `${prefix}-${randomPart}`;

  // Ambil waktu sesuai timezone yang diberikan
  const now = new Date();
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));

  const year = tzDate.getFullYear();
  const month = String(tzDate.getMonth() + 1).padStart(2, "0");
  const day = String(tzDate.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;

  return `${prefix}-${datePart}-${randomPart}`;
}
