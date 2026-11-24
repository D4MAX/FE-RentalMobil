"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import Galat from "@/components/Galat";

export default function LupaSandi() {
  const [email, setEmail] = useState("");
  const [terkirim, setTerkirim] = useState(false);
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setGalat(null); setProses(true);
    try { await api("/auth/lupa-password", { method: "POST", body: { email } }); setTerkirim(true); }
    catch (err) { setGalat(err); } finally { setProses(false); }
  }

  return (
    <>
      <section className="hero banner"><h1>LUPA <span>KATA SANDI</span></h1></section>
      <main className="wrap wrap-form"><div className="kotak kartu-akun">
        {terkirim ? (
          <>
            <h1>Cek email Anda</h1>
            <div className="alert sukses">Jika <b>{email}</b> terdaftar, tautan reset dikirim dan berlaku 1 jam.</div>
            <Link className="btn garis blok" href="/masuk">Kembali ke Login</Link>
          </>
        ) : (
          <>
            <h1>Lupa Kata Sandi</h1>
            <p className="abu tengah">Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru.</p>
            <form onSubmit={kirim}>
              <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <Galat e={galat} />
              <button className="btn blok" type="submit" disabled={proses}>{proses ? "Memproses..." : "Kirim Tautan Reset"}</button>
              <p className="tengah" style={{ marginTop: 12 }}><Link className="tautan" href="/masuk">Kembali ke Login</Link></p>
            </form>
          </>
        )}
      </div></main>
    </>
  );
}
