"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import Galat from "@/components/Galat";

function Isi() {
  const q = useSearchParams();
  const router = useRouter();
  const [f, setF] = useState({ password: "", konfirmasi: "" });
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setGalat(null); setProses(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: { email: q.get("email"), token: q.get("token"), ...f } });
      router.push("/masuk");
    } catch (err) { setGalat(err); } finally { setProses(false); }
  }
  const sandi = "(?=.*\\d).{8,}";
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <section className="hero banner"><h1>PASSWORD <span>BARU</span></h1></section>
      <main className="wrap wrap-form"><div className="kotak kartu-akun"><h1>Buat Password Baru</h1>
        <form onSubmit={kirim}>
          <div className="field"><label htmlFor="sandi">Kata sandi baru</label>
            <input id="sandi" type="password" required pattern={sandi} minLength={8} title="Minimal 8 karakter dan mengandung angka" autoComplete="new-password" value={f.password} onChange={set("password")} />
            <p className="hint">Minimal 8 karakter dan ada angka.</p></div>
          <div className="field"><label htmlFor="sandi2">Ulangi kata sandi</label>
            <input id="sandi2" type="password" required pattern={sandi} minLength={8} title="Minimal 8 karakter dan mengandung angka" autoComplete="new-password" value={f.konfirmasi} onChange={set("konfirmasi")} /></div>
          <Galat e={galat} />
          {(galat?.code === "TOKEN_RESET_TIDAK_VALID" || galat?.code === "TOKEN_RESET_KEDALUWARSA") && <p className="tengah"><Link className="tautan" href="/lupa-sandi">Minta tautan reset baru</Link></p>}
          <button className="btn blok" type="submit" disabled={proses}>{proses ? "Memproses..." : "Simpan"}</button>
        </form>
      </div></main>
    </>
  );
}
export default function ResetPassword() { return <Suspense><Isi /></Suspense>; }
