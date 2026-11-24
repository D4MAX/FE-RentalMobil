"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import Galat from "@/components/Galat";

function Isi() {
  const email = useSearchParams().get("email") || "";
  const [tunggu, setTunggu] = useState(60); // jeda kirim ulang; server membatasi 3 kali per jam
  const [galat, setGalat] = useState(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (tunggu <= 0) return;
    const t = setTimeout(() => setTunggu(tunggu - 1), 1000);
    return () => clearTimeout(t);
  }, [tunggu]);

  async function kirimUlang() {
    setGalat(null); setOk(false);
    try {
      await api("/auth/kirim-ulang-verifikasi", { method: "POST", body: { email } });
      setOk(true); setTunggu(60);
    } catch (err) { setGalat(err); }
  }
  const mm = `00:${String(tunggu).padStart(2, "0")}`;

  return (
    <>
      <section className="hero banner"><h1>CEK <span>EMAIL</span></h1></section>
      <main className="wrap wrap-form"><div className="kotak kartu-akun"><h1>Cek email Anda</h1>
        <div className="tengah">
          <div className="kosong" style={{ padding: "8px 0 16px" }}><div className="ikon" aria-hidden="true">✉️</div></div>
          <p>Kami mengirim tautan verifikasi ke <b>{email}</b>. Tautan berlaku 12 jam.</p>
          {ok && <div className="alert sukses">Tautan baru sudah dikirim.</div>}
          <Galat e={galat} />
          {galat?.code === "EMAIL_SUDAH_TERVERIFIKASI" && <Link className="btn blok" href="/masuk">Login</Link>}
          <button className="btn garis" onClick={kirimUlang} disabled={tunggu > 0 || !email}>{tunggu > 0 ? `Kirim ulang (tunggu ${mm})` : "Kirim ulang"}</button>
          <p className="hint kecil abu" style={{ marginTop: 8 }}>Kirim ulang maksimal 3 kali per jam.</p>
        </div>
      </div></main>
    </>
  );
}
export default function CekEmail() { return <Suspense><Isi /></Suspense>; }
