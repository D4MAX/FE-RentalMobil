"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

function Isi() {
  const token = useSearchParams().get("token");
  const [s, setS] = useState({ st: "proses", pesan: "" });

  useEffect(() => {
    if (!token) { setS({ st: "gagal", pesan: "Tautan tidak lengkap." }); return; }
    api("/auth/verifikasi-email", { method: "POST", body: { token } })
      .then(() => setS({ st: "ok" }))
      .catch((e) => setS({ st: "gagal", pesan: e.message }));
  }, [token]);

  return (
    <>
      <section className="hero banner"><h1>VERIFIKASI <span>EMAIL</span></h1></section>
      <main className="wrap wrap-form"><div className="kotak kartu-akun"><h1>Verifikasi email</h1>
        <div className="tengah">
          <div className="kosong" style={{ padding: "8px 0 16px" }}><div className="ikon" aria-hidden="true">{{ proses: "⏳", ok: "✅", gagal: "⚠️" }[s.st]}</div></div>
          {s.st === "proses" && <p>Memverifikasi email...</p>}
          {s.st === "ok" && <><div className="alert sukses">Email terverifikasi, silakan masuk.</div><Link className="btn blok" href="/masuk">Login</Link></>}
          {s.st === "gagal" && <><div className="alert galat" role="alert">{s.pesan} Tautan mungkin sudah dipakai atau lewat 12 jam.</div><Link className="btn blok" href="/cek-email">Kirim ulang</Link></>}
        </div>
      </div></main>
    </>
  );
}
export default function VerifikasiEmail() { return <Suspense><Isi /></Suspense>; }
