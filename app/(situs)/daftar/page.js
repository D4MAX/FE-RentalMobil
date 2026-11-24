"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { WILAYAH } from "@/lib/wilayah";
import Galat from "@/components/Galat";

export default function Daftar() {
  const router = useRouter();
  const [f, setF] = useState({ nama: "", email: "", no_hp: "", provinsi: "", kota: "", password: "", password_confirmation: "" });
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value, ...(k === "provinsi" && { kota: "" }) });

  async function kirim(e) {
    e.preventDefault();
    setGalat(null); setProses(true);
    try {
      const body = new FormData();
      Object.entries(f).forEach(([k, v]) => body.append(k, v));
      await api("/auth/register", { method: "POST", body });
      router.push(`/cek-email?email=${encodeURIComponent(f.email)}`);
    } catch (err) { setGalat(err); } finally { setProses(false); }
  }

  const sandi = "(?=.*\\d).{8,}";
  return (
    <>
      <section className="hero banner"><h1>DAFTAR</h1></section>
      <main className="wrap wrap-form"><div className="kotak kartu-akun">
        <div className="tab-akun"><Link href="/masuk">Login</Link><Link className="aktif" href="/daftar">Register</Link></div>
        <h1>Daftar</h1>
        <form onSubmit={kirim}>
          <div className="field"><label htmlFor="nama">Nama lengkap</label><input id="nama" type="text" maxLength={100} required autoComplete="name" value={f.nama} onChange={set("nama")} /></div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" value={f.email} onChange={set("email")} /></div>
          <div className="field"><label htmlFor="wa">Nomor WhatsApp</label><input id="wa" type="tel" required pattern="(08|\+62)[0-9]{8,13}" title="Nomor Indonesia, diawali 08 atau +62" placeholder="08xxxxxxxxxx" value={f.no_hp} onChange={set("no_hp")} /></div>
          <div className="field"><label htmlFor="provinsi">Provinsi</label>
            <select id="provinsi" required value={f.provinsi} onChange={set("provinsi")}><option value="">Pilih provinsi</option>{Object.keys(WILAYAH).map((p) => <option key={p}>{p}</option>)}</select></div>
          <div className="field"><label htmlFor="kota">Kota / Kabupaten</label>
            <select id="kota" required value={f.kota} onChange={set("kota")} disabled={!f.provinsi}><option value="">Pilih kota</option>{(WILAYAH[f.provinsi] || []).map((k) => <option key={k}>{k}</option>)}</select>
            <p className="hint">Menentukan syarat jaminan untuk sewa lepas kunci.</p></div>
          <div className="field"><label htmlFor="sandi">Kata sandi</label>
            <input id="sandi" type="password" required pattern={sandi} minLength={8} title="Minimal 8 karakter dan mengandung angka" autoComplete="new-password" value={f.password} onChange={set("password")} />
            <p className="hint">Minimal 8 karakter dan ada angka.</p></div>
          <div className="field"><label htmlFor="sandi2">Konfirmasi kata sandi</label>
            <input id="sandi2" type="password" required pattern={sandi} minLength={8} title="Minimal 8 karakter dan mengandung angka" autoComplete="new-password" value={f.password_confirmation} onChange={set("password_confirmation")} />
            <p className="hint">Harus sama dengan kata sandi di atas.</p></div>
          <Galat e={galat} />
          <button className="btn blok" type="submit" disabled={proses}>{proses ? "Memproses..." : "Daftar"}</button>
        </form>
      </div></main>
    </>
  );
}
