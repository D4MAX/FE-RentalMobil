"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, tanggal } from "@/lib/api";
import { BADGE, LABEL } from "@/lib/status";
import Galat from "@/components/Galat";

export default function Pesanan() {
  const [q, setQ] = useState({ status: "", q: "" });
  const [cari, setCari] = useState({ status: "", q: "" }); // nilai yang sudah diterapkan
  const [page, setPage] = useState(1);
  const [d, setD] = useState(null);
  const [galat, setGalat] = useState(null);

  useEffect(() => {
    setD(null); setGalat(null);
    api("/admin/pemesanan", { query: { ...cari, page } }).then(setD).catch(setGalat);
  }, [cari, page]);

  const meta = d?.meta;
  return (
    <>
      <header><h1>Pesanan</h1><p>Kelola serah terima dan penyelesaian pesanan.</p></header>
      <form className="kartu filter" onSubmit={(e) => { e.preventDefault(); setPage(1); setCari(q); }}>
        <div><label htmlFor="st">Status</label><select id="st" value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })}><option value="">Semua</option>{Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="cari">Nomor atau nama pelanggan</label><input id="cari" value={q.q} onChange={(e) => setQ({ ...q, q: e.target.value })} /></div>
        <div><button className="btn" type="submit">Terapkan</button></div>
      </form>
      <Galat e={galat} />
      <section className="kartu">
        {!d && !galat && <p>Memuat...</p>}
        {d && d.data.length === 0 && <div className="kosong"><div className="ikon" aria-hidden="true">🧾</div><p className="abu">Tidak ada pesanan dengan filter ini.</p></div>}
        {d && d.data.length > 0 && (
          <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Tanggal mulai</th><th>Pesanan</th><th>Pelanggan</th><th>Unit</th><th>Status</th><th></th></tr></thead><tbody>
            {d.data.map((p) => (
              <tr key={p.id}><td>{tanggal(p.tgl_mulai)}</td><td className="tebal">{p.nomor}</td><td>{p.pelanggan.nama}</td>
                <td>{p.tipe.nama}{p.plat_nomor && <> · <span className="plat">{p.plat_nomor}</span></>}</td>
                <td><span className={`badge ${BADGE[p.status]}`}>{LABEL[p.status]}</span></td>
                <td><Link className="tautan" href={`/admin/pesanan/${p.id}`}>Lihat detail</Link></td></tr>
            ))}
          </tbody></table></div>
        )}
        <p className="kecil abu" style={{ margin: "12px 0 0" }}>Daftar hanya menampilkan status. Semua tindakan ada di halaman detail pesanan.</p>
        {meta && meta.total > meta.per_page && (
          <div className="baris" style={{ marginTop: 12 }}>
            <button className="btn garis sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
            <span className="kecil">Halaman {page} dari {Math.ceil(meta.total / meta.per_page)}</span>
            <button className="btn garis sm" disabled={page * meta.per_page >= meta.total} onClick={() => setPage(page + 1)}>Berikutnya</button>
          </div>
        )}
      </section>
    </>
  );
}
