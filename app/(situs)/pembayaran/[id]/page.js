"use client";
import "@/app/css/pesan.css";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, rupiah, tanggal } from "@/lib/api";
import Galat from "@/components/Galat";
import Jaga from "@/components/Jaga";

const SNAP = "https://app.sandbox.midtrans.com/snap/snap.js";
const jam = (d) => [Math.floor(d / 3600), Math.floor(d / 60) % 60, d % 60].map((n) => String(n).padStart(2, "0")).join(":");

function muatSnap() {
  return new Promise((ok, gagal) => {
    if (window.snap) return ok();
    const s = document.createElement("script");
    s.src = SNAP;
    s.dataset.clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    s.onload = ok; s.onerror = () => gagal(new Error("Gagal memuat Midtrans"));
    document.body.appendChild(s);
  });
}

function Isi() {
  const { id } = useParams();
  const router = useRouter();
  const [p, setP] = useState(null);
  const [bayar, setBayar] = useState(null); // { snap_token, batas }
  const [sisa, setSisa] = useState(null);
  const [kedaluwarsa, setKedaluwarsa] = useState(false);
  const [galat, setGalat] = useState(null);

  const buka = useCallback(async (token) => {
    try {
      await muatSnap();
      window.snap.pay(token, {
        onSuccess: () => router.push(`/riwayat/${id}`),
        onPending: () => router.push(`/riwayat/${id}`),
        onError: () => setGalat(new Error("Pembayaran gagal, coba lagi.")),
      });
    } catch (e) { setGalat(e); }
  }, [id, router]);

  useEffect(() => {
    (async () => {
      try {
        const d = (await api(`/pemesanan/${id}`)).data;
        if (d.status !== "menunggu_pembayaran") return router.replace(`/riwayat/${id}`);
        setP(d);
        const r = (await api(`/pemesanan/${id}/pembayaran`, { method: "POST" })).data;
        setBayar({ token: r.snap_token, batas: new Date(r.batas_pembayaran).getTime() });
        buka(r.snap_token);
      } catch (e) { e.code === "PEMBAYARAN_KEDALUWARSA" ? setKedaluwarsa(true) : setGalat(e); }
    })();
  }, [id, router, buka]);

  useEffect(() => {
    if (!bayar) return;
    const t = setInterval(() => {
      const s = Math.round((bayar.batas - Date.now()) / 1000);
      if (s <= 0) { clearInterval(t); setKedaluwarsa(true); } else setSisa(s);
    }, 1000);
    return () => clearInterval(t);
  }, [bayar]);

  if (kedaluwarsa) return (
    <>
      <section className="hero banner"><h1>PEMBAYARAN</h1></section>
      <main className="wrap wrap-sempit"><div className="kotak kosong">
        <div className="ikon" aria-hidden="true">⌛</div>
        <div className="alert galat" role="alert">Pembayaran tidak diterima dalam 1 jam, pesanan dibatalkan.</div>
        <Link className="btn" href="/katalog">Pesan ulang</Link>
      </div></main>
    </>
  );

  return (
    <>
      <section className="hero banner"><h1>PEMBAYARAN</h1></section>
      <main className="wrap wrap-sempit latar-bayar"><div className="kotak">
        <h1 style={{ fontSize: 24 }}>Pembayaran</h1>
        {!p ? <Galat e={galat} /> : (
          <>
            <p>Pesanan <b>{p.nomor}</b> sudah dibuat. Selesaikan pembayaran dalam:</p>
            <p className="countdown" aria-label="Sisa waktu">{sisa == null ? "--:--:--" : jam(sisa)}</p>
            <dl className="data-baris">
              <dt>Mobil</dt><dd>{p.tipe.nama} ({p.jenis_sewa === "dengan_sopir" ? "dengan sopir" : "lepas kunci"})</dd>
              <dt>Tanggal</dt><dd>{tanggal(p.tgl_mulai)} sampai {tanggal(p.tgl_kembali)}, {p.durasi} hari</dd>
              <dt>Total</dt><dd>{rupiah(p.total_biaya)}</dd>
            </dl>
            <Galat e={galat} />
            {bayar && <button className="btn blok" onClick={() => buka(bayar.token)}>Bayar sekarang</button>}
            <p className="tengah" style={{ marginTop: 12 }}><Link className="tautan" href={`/riwayat/${id}`}>Bayar nanti, lihat detail pesanan</Link></p>
          </>
        )}
      </div></main>
    </>
  );
}

export default function Pembayaran() { return <Jaga role="user"><Isi /></Jaga>; }
