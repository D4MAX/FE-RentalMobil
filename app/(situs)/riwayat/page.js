"use client";
import "@/app/css/riwayat.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, rupiah, tanggal, unduh } from "@/lib/api";
import { BADGE, LABEL, WA } from "@/lib/status";
import Galat from "@/components/Galat";
import Jaga from "@/components/Jaga";
import Tahap from "@/components/Tahap";

function Isi() {
  const [tab, setTab] = useState("berlangsung");
  const [page, setPage] = useState(1);
  const [d, setD] = useState(null);
  const [galat, setGalat] = useState(null);

  useEffect(() => {
    setD(null); setGalat(null);
    api("/pemesanan", { query: { tab, page } }).then(setD).catch(setGalat);
  }, [tab, page]);

  const ganti = (t) => () => { setTab(t); setPage(1); };
  const unduhNota = (p) => unduh(`/pemesanan/${p.id}/nota`, `nota-${p.nomor}.pdf`).catch(setGalat);
  const tombol = (p) => {
    if (p.aksi_utama === "bayar") return <Link className="btn sm" href={`/pembayaran/${p.id}`}>Bayar sekarang</Link>;
    if (p.aksi_utama === "beri_review") return <Link className="btn sm" href={`/riwayat/${p.id}?nilai=1`}>Beri penilaian</Link>;
    if (p.aksi_utama === "pesan_lagi") return <Link className="btn sm" href="/katalog">Pesan lagi</Link>;
    if (p.status === "dikonfirmasi") return <button className="btn sm" onClick={() => unduhNota(p)}>Unduh nota</button>;
    if (p.status === "berjalan" || p.status === "pengajuan_pembatalan") return <a className="btn sm" href={WA}>Hubungi admin</a>;
    return null;
  };
  const meta = d?.meta;
  const akhir = meta && page * meta.per_page >= meta.total;

  return (
    <>
      <section className="hero banner"><h1>RIWAYAT <span>PEMESANAN</span></h1></section>
      <main className="wrap">
        <input className="tab-radio" type="radio" name="tab-riwayat" id="tab-1" checked={tab === "berlangsung"} onChange={ganti("berlangsung")} />
        <input className="tab-radio" type="radio" name="tab-riwayat" id="tab-2" checked={tab === "riwayat"} onChange={ganti("riwayat")} />
        <div className="tab-bar"><label className="tab" htmlFor="tab-1">Berlangsung</label><label className="tab" htmlFor="tab-2">Riwayat</label></div>
        <Galat e={galat} />
        <div className={`panel ${tab === "berlangsung" ? "p-1" : "p-2"}`}>
          {!d && !galat && <p>Memuat...</p>}
          {d && d.data.length === 0 && (
            <div className="kotak kosong"><div className="ikon" aria-hidden="true">🧾</div><h2>Belum ada pesanan</h2><p className="abu">Belum ada pesanan. Mulai dari Katalog.</p><Link className="btn" href="/katalog">Buka Katalog</Link></div>
          )}
          {d?.data.map((p) => (
            <div className="kartu" key={p.id}>
              <div className="detail">
                <b>{p.tipe.nama}</b> · {p.nomor} <span className={`badge ${BADGE[p.status]}`}>{LABEL[p.status]}</span><br />
                {tanggal(p.tgl_mulai)} · {p.durasi} hari · {rupiah(p.total_biaya)}
                <Tahap status={p.status} />
                {tombol(p)}
                <Link className="tautan" href={`/riwayat/${p.id}`}>Lihat detail</Link>
              </div>
            </div>
          ))}
        </div>
        {meta && meta.total > meta.per_page && (
          <p className="kecil">
            <button className="btn garis sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>{" "}
            Halaman {page} · <button className="btn garis sm" disabled={akhir} onClick={() => setPage(page + 1)}>Berikutnya</button>
          </p>
        )}
        <p className="kecil abu">Menampilkan {meta?.per_page || 10} pesanan per halaman.</p>
      </main>
    </>
  );
}

export default function Riwayat() { return <Jaga role="user"><Isi /></Jaga>; }
