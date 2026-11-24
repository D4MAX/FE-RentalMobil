"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, rupiah, tanggal, tglIso } from "@/lib/api";
import Galat from "@/components/Galat";
import ModalAdmin from "@/components/ModalAdmin";

const STATUS = { perlu_servis: ["perlu", "Perlu servis"], segera: ["segera", "Segera"], aman: ["aman", "Aman"] };
const TINGKAT = { ringan: "Ringan", sedang: "Sedang", perlu_bengkel: "Perlu bengkel" };
const km = (n) => (n == null ? "-" : `${Number(n).toLocaleString("id-ID")} km`);
const AWAL = { id_kendaraan: "", jenis_servis: "Servis berkala", tingkat_servis: "ringan", tgl_perawatan: tglIso(new Date()), bengkel: "", km_saat_ini: "", catatan: "" };

export default function Servis() {
  const [d, setD] = useState(null);
  const [status, setStatus] = useState([]);
  const [unit, setUnit] = useState([]);
  const [f, setF] = useState(AWAL);
  const [interval, setInterval] = useState("5000");
  const [galat, setGalat] = useState(null);
  const [ok, setOk] = useState("");
  const [terdampak, setTerdampak] = useState(null); // galat PESANAN_TERDAMPAK menunggu konfirmasi
  const [batal, setBatal] = useState(null);
  const [proses, setProses] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const muat = useCallback(() => {
    api("/admin/servis").then((r) => setD(r.data)).catch(setGalat);
    api("/admin/servis/status-unit").then((r) => setStatus(r.data)).catch(setGalat);
    api("/admin/unit", { query: { per_page: 100 } }).then((r) => setUnit(r.data.filter((u) => u.status === "tersedia" || u.status === "tidak_tersedia"))).catch(setGalat);
  }, []);
  useEffect(() => { muat(); }, [muat]);

  async function catat(konfirmasi) {
    setGalat(null); setOk(""); setProses(true);
    try {
      await api("/admin/servis", { method: "POST", body: { ...f, km_saat_ini: f.km_saat_ini === "" ? undefined : Number(f.km_saat_ini), catatan: f.catatan || undefined, konfirmasi: konfirmasi || undefined } });
      setF(AWAL); setTerdampak(null); setOk("Servis dicatat."); muat();
    } catch (e) { e.code === "PESANAN_TERDAMPAK" ? setTerdampak(e) : setGalat(e); } finally { setProses(false); }
  }
  async function simpanInterval(e) {
    e.preventDefault(); setGalat(null); setOk("");
    try { await api("/admin/servis/interval", { method: "PUT", body: { interval_km: Number(interval) } }); setOk("Interval disimpan."); muat(); } catch (err) { setGalat(err); }
  }
  async function batalkan() {
    setProses(true); setGalat(null);
    try { await api(`/admin/servis/${batal.id}/batal`, { method: "POST" }); setBatal(null); muat(); } catch (e) { setGalat(e); setBatal(null); } finally { setProses(false); }
  }

  const r = d?.ringkasan;
  return (
    <>
      <header><h1>Servis Unit</h1><p>Catat dan pantau perawatan tiap unit.</p></header>
      <Galat e={galat} />
      {ok && <div className="alert sukses">{ok}</div>}
      {r && (
        <div className="grid grid-4">
          <div className="kartu stat"><div className="label">Unit dalam servis</div><div className="angka">{r.unit_dalam_servis}</div></div>
          <div className="kartu stat"><div className="label">Unit tersedia</div><div className="angka">{r.unit_tersedia}</div></div>
          <div className="kartu stat"><div className="label">Biaya bengkel</div><div className="angka">{rupiah(r.total_biaya_bengkel)}</div></div>
          <div className="kartu stat"><div className="label">Ditanggung perusahaan</div><div className="angka">{rupiah(r.total_ditanggung_perusahaan)}</div><p className="ket">ditagih ke penyewa {rupiah(r.total_ditagih)}</p></div>
        </div>
      )}
      <section className="kartu jarak"><h2>Catat servis</h2><p className="ket">Servis juga dibuat otomatis dari pengembalian bila &quot;unit perlu servis&quot; dicentang.</p>
        <form onSubmit={(e) => { e.preventDefault(); catat(false); }}>
          <div className="kolom-3">
            <div><label htmlFor="unit">Unit</label><select id="unit" required value={f.id_kendaraan} onChange={set("id_kendaraan")}><option value="">Pilih unit</option>{unit.map((u) => <option key={u.id} value={u.id}>{u.plat_nomor} · {u.tipe.nama}</option>)}</select></div>
            <div><label htmlFor="jenis">Jenis servis</label><input id="jenis" required maxLength={100} value={f.jenis_servis} onChange={set("jenis_servis")} /></div>
            <div><label htmlFor="tingkat">Tingkat</label><select id="tingkat" required value={f.tingkat_servis} onChange={set("tingkat_servis")}>{Object.entries(TINGKAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label htmlFor="tgl">Tanggal masuk</label><input id="tgl" type="date" required value={f.tgl_perawatan} onChange={set("tgl_perawatan")} /></div>
            <div><label htmlFor="bengkel">Bengkel</label><input id="bengkel" required maxLength={100} value={f.bengkel} onChange={set("bengkel")} /></div>
            <div><label htmlFor="odo">Odometer (km)</label><input id="odo" type="number" min="0" step="1" value={f.km_saat_ini} onChange={set("km_saat_ini")} /><p className="hint">Tidak boleh lebih kecil dari odometer sebelumnya.</p></div>
          </div>
          <label htmlFor="ket">Keterangan</label><textarea id="ket" maxLength={300} value={f.catatan} onChange={set("catatan")} />
          <button className="btn" type="submit" disabled={proses}>Catat servis</button>
        </form></section>

      <section className="kartu"><h2>Sedang servis</h2>
        {d?.sedang_servis.length === 0 && <p className="abu">Tidak ada unit yang sedang servis.</p>}
        {d?.sedang_servis.length > 0 && <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Unit</th><th>Jenis</th><th>Tingkat</th><th>Masuk</th><th>Bengkel</th><th></th></tr></thead><tbody>
          {d.sedang_servis.map((s) => (
            <tr key={s.id}><td>{s.unit}</td><td>{s.jenis_servis}{s.asal_pesanan && <span className="kecil abu"> (dari pengembalian)</span>}</td><td>{TINGKAT[s.tingkat_servis]}</td><td>{tanggal(s.tgl_perawatan)}</td><td>{s.bengkel}</td>
              <td><Link className="tautan" href={`/admin/servis/${s.id}/selesai`}>Selesai</Link> · <a className="tautan" href="#" onClick={(e) => { e.preventDefault(); setBatal(s); }}>Batal</a></td></tr>
          ))}</tbody></table></div>}</section>

      <section className="kartu"><h2>Pengingat berkala</h2><p className="ket">Status dihitung tiap halaman dibuka dari odometer dan jadwal servis.</p>
        <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Unit</th><th className="angka">Odometer</th><th className="angka">Servis terakhir</th><th className="angka">Jadwal berikutnya</th><th>Status</th></tr></thead><tbody>
          {status.map((s) => (
            <tr key={s.id_kendaraan}><td>{s.unit}</td><td className="angka">{km(s.km_terakhir)}</td><td className="angka">{s.servis_terakhir ? tanggal(s.servis_terakhir) : "-"}</td>
              <td className="angka">{km(s.km_berikutnya)} / {s.tgl_berikutnya ? tanggal(s.tgl_berikutnya) : "-"}</td><td><span className={`badge ${STATUS[s.status]?.[0]}`}>{STATUS[s.status]?.[1] || s.status}</span></td></tr>
          ))}</tbody></table></div>
        <form className="filter jarak" onSubmit={simpanInterval}><div><label htmlFor="interval">Interval servis (km)</label><input id="interval" type="number" min="1" step="500" required value={interval} onChange={(e) => setInterval(e.target.value)} /></div>
          <div><button className="btn garis" type="submit">Simpan interval</button></div></form></section>

      <section className="kartu"><h2>Riwayat servis</h2>
        <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Unit</th><th>Jenis</th><th>Tanggal</th><th>Bengkel</th><th className="angka">Biaya bengkel</th><th className="angka">Ditagih</th><th className="angka">Ditanggung</th><th>Status</th></tr></thead><tbody>
          {d?.riwayat.map((s) => (
            <tr key={s.id}><td>{s.unit}</td><td>{s.jenis_servis}</td><td>{tanggal(s.tgl_perawatan)}</td><td>{s.bengkel || "-"}</td>
              <td className="angka">{s.biaya_bengkel == null ? "-" : rupiah(s.biaya_bengkel)}</td><td className="angka">{rupiah(s.biaya_ditagih_ke_penyewa)}</td><td className="angka">{s.biaya_ditanggung_perusahaan == null ? "-" : rupiah(s.biaya_ditanggung_perusahaan)}</td><td style={{ textTransform: "capitalize" }}>{s.status}</td></tr>
          ))}</tbody></table></div></section>

      <ModalAdmin open={!!batal} judul="Batalkan servis?"><p>Servis dicatat dibatalkan dan unit kembali Tersedia.</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setBatal(null)}>Kembali</button><button className="btn bahaya sm" disabled={proses} onClick={batalkan}>Ya, batalkan</button></div></ModalAdmin>
      <ModalAdmin open={!!terdampak} judul="Ada pesanan terdampak"><p>{terdampak?.message}</p>
        <ul>{terdampak?.body.pesanan_terdampak?.map((p) => <li key={p.id}>{p.nama} ({p.tgl_mulai} sampai {p.tgl_kembali})</li>)}</ul><p>Tetap catat servis?</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setTerdampak(null)}>Kembali</button><button className="btn sm" disabled={proses} onClick={() => catat(true)}>Ya, tetap catat</button></div></ModalAdmin>
    </>
  );
}
