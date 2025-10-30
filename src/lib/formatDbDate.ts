/**
 * Format timestamp DB menjadi readable tanpa mengubah jam
 * @param dbTimestamp - string dari DB, misal '2025-10-26T06:36:30.249Z' atau '2025-10-26 06:36:30'
 */
export function formatDbTimeExact(dbTimestamp?: string | null) {
  if (!dbTimestamp) return "-";

  // Ambil tanggal dan jam
  let datePart = "";
  let timePart = "";

  if (dbTimestamp.includes("T")) {
    // ISO string
    [datePart, timePart] = dbTimestamp.split("T");
  } else if (dbTimestamp.includes(" ")) {
    [datePart, timePart] = dbTimestamp.split(" ");
  } else {
    return dbTimestamp; // fallback
  }

  // Ambil yyyy, mm, dd
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return dbTimestamp;

  // Ambil hh:mm
  const [hour, minute] = timePart.split(":");
  if (!hour || !minute) return dbTimestamp;

  // Format bulan ke bahasa Indonesia
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  return `${day} ${months[Number(month) - 1]} ${year}, ${hour}:${minute}`;
}

export function toGMT7(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const gmt7 = new Date(date.getTime());

  return gmt7.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
