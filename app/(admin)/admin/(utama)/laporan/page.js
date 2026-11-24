"use client";
import { useEffect, useState } from "react";
import { api, rupiah, tanggal, unduh } from "@/lib/api";
import { BADGE, LABEL } from "@/lib/status";
import Galat from "@/components/Galat";

const PERIODE = { 7: "7 hari terakhir", 30: "30 hari terakhir", bulan_ini: "Bulan ini", bulan_lalu: "Bulan lalu" };

export default function Laporan() {
  const [q, setQ] = useState({ periode: "7", status: "" });
  const [cari, setCari] = useState(q);
  const [d, setD] = useState(null);
  const [galat, setGalat] = useState(null);

  useEffect(() => { setD(null); setGalat(null); api("/admin/laporan", { query: cari }).then((r) => setD(r.data)).catch(setGalat); }, [cari]);

  const kosong = d && d.data.length === 0;
  const perStatus = d ? Object.entries(d.ringkasan.per_status || {}) : [];
  return (
    <>
      <header><h1>Laporan Transaksi</h1><p>Semua pendapatan dari pesanan yang sudah dikonfirmasi.</p></header>
      <form className="kartu filter" onSubmit={(e) => { e.preventDefault(); setCari(q); }}>
        <div><label htmlFor="per">Periode (menurut tanggal mulai sewa)</label><select id="per" value={q.periode} onChange={(e) => setQ({ ...q, periode: e.target.value })}>{Object.entries(PERIODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="st">Status</label><select id="st" value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })}><option value="">Semua</option>{Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><button className="btn" type="submit">Terapkan</button></div>
        <div style={{ marginLeft: "auto" }}><button type="button" className="btn garis" disabled={!d || kosong} onClick={() => unduh("/admin/laporan/pdf", "laporan.pdf", cari).catch(setGalat)}>Unduh PDF</button></div>
      </form>
      <Galat e={galat} />
      {!d && !galat && <p>Memuat...</p>}
      {d && (
        <>
          <p className="abu">Periode: {tanggal(d.periode.dari)} sampai {tanggal(d.periode.sampai)} ({PERIODE[cari.periode]}).</p>
          {kosong ? (
            <div className="kartu kosong"><div className="ikon" aria-hidden="true">📄</div><p className="abu">Tidak ada data pada periode ini. Pilih periode lain.</p></div>
          ) : (
            <>
              <div className="grid grid-3">
                <div className="kartu stat warna"><div className="label">Total pendapatan</div><div className="angka">{rupiah(d.ringkasan.total_pendapatan)}</div><p className="ket">Dikonfirmasi, Berjalan, dan Selesai; sewa ditambah tagihan tambahan</p></div>
                <div className="kartu stat"><div className="label">Jumlah transaksi</div><div className="angka">{d.ringkasan.jumlah_transaksi}</div></div>
                <div className="kartu stat"><div className="label">Dibatalkan</div><div className="angka">{d.ringkasan.jumlah_dibatalkan}</div></div>
              </div>
              <p className="jarak">Rincian per status: {perStatus.map(([s, n]) => <span key={s}><span className={`badge ${BADGE[s]}`}>{LABEL[s]} {n}</span> </span>)}</p>
              <section className="kartu"><h2>Pesanan pada periode ini</h2><div className="tabel-bungkus"><table className="tabel"><thead><tr><th>No</th><th>Tanggal mulai</th><th>Pesanan</th><th>Pelanggan</th><th>Unit</th><th>Status</th><th className="angka">Sewa</th><th className="angka">Tagihan tambahan</th></tr></thead><tbody>
                {d.data.map((r, i) => (
                  <tr key={r.nomor}><td>{i + 1}</td><td>{tanggal(r.tgl_mulai)}</td><td className="tebal">{r.nomor}</td><td>{r.pelanggan}</td><td>{r.unit}</td>
                    <td><span className={`badge ${BADGE[r.status]}`}>{LABEL[r.status]}</span></td><td className="angka">{rupiah(r.sewa)}</td><td className="angka">{r.tagihan_tambahan ? rupiah(r.tagihan_tambahan) : "-"}</td></tr>
                ))}</tbody></table></div></section>
            </>
          )}
        </>
      )}
    </>
  );
}
