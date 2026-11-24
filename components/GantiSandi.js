"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import Galat from "./Galat";

// Form ganti kata sandi (PUT /profil/password), dipakai di Profil dan halaman admin.
export default function GantiSandi({ onSukses, judul = "Ganti kata sandi", admin = false }) {
  const kosong = { password_lama: "", password_baru: "", konfirmasi: "" };
  const [f, setF] = useState(kosong);
  const [galat, setGalat] = useState(null);
  const [ok, setOk] = useState(false);
  const [proses, setProses] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const pola = "(?=.*\\d).{8,}";

  async function kirim(e) {
    e.preventDefault();
    setGalat(null); setOk(false); setProses(true);
    try { await api("/profil/password", { method: "PUT", body: f }); setF(kosong); setOk(true); onSukses?.(); }
    catch (err) { setGalat(err); } finally { setProses(false); }
  }

  return (
    <div className={admin ? "kartu" : "kotak"}>
      <h3>{judul}</h3>
      <form onSubmit={kirim}>
        <div className="field"><label htmlFor="lama">Kata sandi lama</label><input id="lama" type="password" required autoComplete="current-password" value={f.password_lama} onChange={set("password_lama")} /></div>
        <div className="field"><label htmlFor="baru">Kata sandi baru</label><input id="baru" type="password" required pattern={pola} minLength={8} title="Minimal 8 karakter dan mengandung angka" autoComplete="new-password" value={f.password_baru} onChange={set("password_baru")} /><p className="hint">Minimal 8 karakter dan ada angka.</p></div>
        <div className="field"><label htmlFor="baru2">Konfirmasi kata sandi baru</label><input id="baru2" type="password" required pattern={pola} minLength={8} title="Minimal 8 karakter dan mengandung angka" autoComplete="new-password" value={f.konfirmasi} onChange={set("konfirmasi")} /></div>
        <Galat e={galat} />
        {ok && <div className="alert sukses">Kata sandi berhasil diganti.</div>}
        <button className="btn" type="submit" disabled={proses}>{proses ? "Memproses..." : "Simpan Kata Sandi"}</button>
      </form>
    </div>
  );
}
