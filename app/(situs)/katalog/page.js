"use client";
import "@/app/css/katalog.css";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, rupiah } from "@/lib/api";

const fmt = (d) => d.toISOString().slice(0, 10);
const hariIni = new Date();
const besok = new Date(hariIni.getTime() + 864e5);
const maks = new Date(hariIni.getTime() + 30 * 864e5);

function Isi() {
  const awal = useSearchParams().get("tgl_mulai") || "";
  const [q, setQ] = useState({ tgl_mulai: awal, durasi: "", kursi: "any", transmisi: "any" });
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState("");

  async function cari(e) {
    e.preventDefault();
    setGalat("");
    try { setHasil((await api("/katalog/tipe", { query: q })).data); }
    catch (err) { setGalat(err.message); setHasil(null); }
  }
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });

  return (
    <>
      <section className="hero banner"><h1>KATALOG <span>MOBIL</span></h1></section>
      <main className="wrap">
        <form className="kotak pencarian" onSubmit={cari}>
          <div><label htmlFor="tgl">Tanggal mulai</label><input id="tgl" type="date" required min={fmt(besok)} max={fmt(maks)} value={q.tgl_mulai} onChange={set("tgl_mulai")} /></div>
          <div><label htmlFor="dur">Durasi (hari)</label><input id="dur" type="number" required min="1" max="30" value={q.durasi} onChange={set("durasi")} /></div>
          <div><label htmlFor="kursi">Kursi</label><select id="kursi" value={q.kursi} onChange={set("kursi")}><option value="any">Semua</option><option value="5">5 kursi</option><option value="7">7 kursi</option></select></div>
          <div><label htmlFor="trans">Transmisi</label><select id="trans" value={q.transmisi} onChange={set("transmisi")}><option value="any">Semua</option><option value="manual">Manual</option><option value="matic">Matic</option></select></div>
          <div><button className="btn" type="submit">Cari</button></div>
        </form>
        <p className="kecil">Tanggal mulai paling cepat besok dan paling jauh 30 hari. Durasi 1 sampai 30 hari.</p>
        {galat && <p className="galat">{galat}</p>}
        {hasil && hasil.length === 0 && <div className="kotak"><p>Tidak ada mobil tersedia pada tanggal itu.</p></div>}
        {hasil && (
          <div className="grid grid-3">
            {hasil.map((m) => (
              <div className="kotak" key={m.id}>
                <img src={m.foto?.[0]} alt={m.nama} style={{ width: "100%", borderRadius: 10 }} />
                <h3>{m.merk} {m.nama}</h3>
                <p className="kecil">{m.kursi} kursi · sisa {m.sisa_unit} unit</p>
                <p>Dengan sopir: <b>{rupiah(m.tarif.dengan_sopir)}</b>/hari</p>
                <p>Lepas kunci: <b>{rupiah(m.tarif.lepas_kunci_manual || m.tarif.lepas_kunci_matic)}</b>/hari</p>
                <Link className="btn" href={`/pesan/${m.id}?tgl_mulai=${q.tgl_mulai}&durasi=${q.durasi}`}>Pesan</Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default function Katalog() { return <Suspense><Isi /></Suspense>; }
