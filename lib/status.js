export const LABEL = { menunggu_pembayaran: "Menunggu pembayaran", dikonfirmasi: "Dikonfirmasi", berjalan: "Berjalan", selesai: "Selesai", pengajuan_pembatalan: "Pengajuan pembatalan", dibatalkan: "Dibatalkan" };
// kelas badge pada CSS prototipe
export const BADGE = { menunggu_pembayaran: "menunggu", dikonfirmasi: "dikonfirmasi", berjalan: "berjalan", selesai: "selesai", pengajuan_pembatalan: "pengajuan", dibatalkan: "dibatalkan" };
const URUT = ["menunggu_pembayaran", "dikonfirmasi", "berjalan", "selesai"];
// Tahapan yang menyala; pengajuan pembatalan dianggap masih di tahap dikonfirmasi, dibatalkan tidak ada yang menyala.
export const tahapAktif = (s) => (s === "pengajuan_pembatalan" ? 2 : s === "dibatalkan" ? 0 : URUT.indexOf(s) + 1);
export const TAHAP = ["Menunggu pembayaran", "Dikonfirmasi", "Berjalan", "Selesai"];
export const WA = "https://wa.me/6281234567890";

export const BBM = { penuh: "Penuh", tiga_perempat: "3/4", setengah: "1/2", seperempat: "1/4", hampir_kosong: "Hampir kosong" };
export const KONDISI = ["baik", "lecet", "penyok", "retak", "rusak"];
export const BAGIAN = { depan: "Depan (bumper dan kap)", belakang: "Belakang (bumper dan bagasi)", sisi_kiri: "Sisi kiri", sisi_kanan: "Sisi kanan", atap: "Atap", kaca_lampu: "Kaca dan lampu", ban_velg: "Ban dan velg", interior: "Interior" };
