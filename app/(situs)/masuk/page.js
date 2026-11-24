"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Galat from "@/components/Galat";

export default function Masuk() {
  const { login } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ email: "", password: "" });
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setGalat(null); setProses(true);
    try {
      const d = await login(f.email, f.password);
      if (d.wajib_ganti_password) router.push("/admin/ganti-sandi");
      else router.push(d.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setGalat(err);
    } finally { setProses(false); }
  }

  return (
    <>
      <section className="hero banner"><h1>MASUK</h1></section>
      <main className="wrap wrap-form">
        <div className="kotak kartu-akun">
          <div className="tab-akun"><Link className="aktif" href="/masuk">Login</Link><Link href="/daftar">Register</Link></div>
          <h1>Masuk</h1>
          <form onSubmit={kirim}>
            <div className="field"><label htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="field"><label htmlFor="sandi">Kata sandi</label>
              <input id="sandi" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
              <p className="hint"><Link className="tautan" href="/lupa-sandi">Lupa Kata Sandi?</Link></p></div>
            <Galat e={galat} />
            {galat?.code === "EMAIL_BELUM_TERVERIFIKASI" && <p><Link className="tautan" href={`/cek-email?email=${encodeURIComponent(f.email)}`}>Kirim ulang email verifikasi</Link></p>}
            <button className="btn blok" type="submit" disabled={proses}>{proses ? "Memproses..." : "Login"}</button>
          </form>
        </div>
      </main>
    </>
  );
}
