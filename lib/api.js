const BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export function getToken() {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("token"); } catch { return null; }
}
export function setToken(t) {
  try { t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); } catch {}
}

// Satu pintu untuk semua panggilan ke Laravel. Galat dilempar sebagai Error
// berisi status, code, dan errors (422) sesuai Spek_API.
export async function api(path, { method = "GET", body, query, token } = {}) {
  const url = new URL(BASE + path);
  if (query) Object.entries(query).forEach(([k, v]) => v !== "" && v != null && url.searchParams.set(k, v));
  const headers = { Accept: "application/json" };
  const t = token ?? getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(url, { method, headers, body: payload, cache: "no-store" });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Token kedaluwarsa atau dicabut: bersihkan dan kembali ke Login.
    if (res.status === 401 && t && typeof window !== "undefined") { setToken(null); window.location.href = "/masuk"; }
    const err = new Error(json.message || "Terjadi kesalahan");
    err.status = res.status; err.code = json.code; err.errors = json.errors; err.body = json; // body: detail, pesanan_terdampak, dst.
    throw err;
  }
  return json;
}

export const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

export const tanggal = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
export const tglIso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

// Unduh berkas (PDF nota atau laporan) dengan token, lalu simpan lewat tautan sementara.
export async function unduh(path, nama, query) {
  const url = new URL(BASE + path);
  if (query) Object.entries(query).forEach(([k, v]) => v !== "" && v != null && url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/pdf" } });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const err = new Error(j.message || "Gagal mengunduh"); err.status = res.status; err.code = j.code;
    throw err;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(await res.blob()); a.download = nama; a.click();
  URL.revokeObjectURL(a.href);
}
