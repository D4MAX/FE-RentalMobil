"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, rupiah, tanggal, tglIso } from "@/lib/api";
import { BAGIAN, BBM, KONDISI } from "@/lib/status";
import Galat from "@/components/Galat";
import ModalAdmin from "@/components/ModalAdmin";

const TAMBAHAN = { cuci: "Cuci", kelengkapan_hilang: "Kelengkapan hilang", biaya_antar: "Biaya antar", lainnya: "Lainnya" };
const RINGKAS = { biaya_sewa: "Biaya sewa", denda_keterlambatan: "Denda keterlambatan", kekurangan_bbm: "Kekurangan BBM", biaya_kerusakan: "Biaya kerusakan", biaya_lain: "Biaya lain", tagihan_tambahan: "Tagihan tambahan", total_akhir: "Total akhir" };
const awalBagian = Object.fromEntries(Object.keys(BAGIAN).map((b) => [b, { kondisi: "baik", biaya: "", ket: "", foto: null }]));

export default function Selesai() {
  const { id } = useParams();
  const router = useRouter();
  const [p, setP] = useState(null);
  const [f, setF] = useState({ tgl_kembali: tglIso(new Date()), jam_kembali: "", odometer_akhir: "", bbm_akhir: "penuh", biaya_kekurangan_bbm: "0", kebersihan: "bersih", status_pembayaran_tagihan: "belum_dibayar", catatan_admin: "", disetujui_penyewa: false, unit_perlu_servis: false, servis_tingkat: "ringan", servis_keperluan: "" });
  const [bagian, setBagian] = useState(awalBagian);
  const [tambahan, setTambahan] = useState({});
  const [ringkasan, setRingkasan] = useState(null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const setB = (b, k, v) => setBagian({ ...bagian, [b]: { ...bagian[b], [k]: v } });

  useEffect(() => { api(`/admin/pemesanan/${id}`).then((r) => setP(r.data)).catch(setGalat); }, [id]);
  const lk = p?.jenis_sewa === "lepas_kunci";

  // Susun body multipart yang sama untuk preview dan simpan
  function susun() {
    const body = new FormData();
    ["tgl_kembali", "jam_kembali", "catatan_admin", "status_pembayaran_tagihan"].forEach((k) => f[k] && body.append(k, f[k]));
    if (lk) ["odometer_akhir", "bbm_akhir", "biaya_kekurangan_bbm", "kebersihan"].forEach((k) => f[k] !== "" && body.append(k, f[k]));
    Object.entries(bagian).forEach(([b, v]) => {
      body.append(`kondisi[${b}]`, v.kondisi);
      if (v.kondisi !== "baik") body.append(`biaya[${b}]`, v.biaya || "0");
      if (v.ket) body.append(`keterangan[${b}]`, v.ket);
      if (v.foto) body.append(`foto[${b}]`, v.foto);
    });
    Object.entries(tambahan).forEach(([j, v]) => { if (Number(v.biaya) > 0) { body.append(`biaya_tambahan[${j}]`, v.biaya); v.ket && body.append(`keterangan_tambahan[${j}]`, v.ket); } });
    body.append("disetujui_penyewa", String(f.disetujui_penyewa));
    body.append("unit_perlu_servis", String(f.unit_perlu_servis));
    if (f.unit_perlu_servis) { body.append("servis[tingkat]", f.servis_tingkat); body.append("servis[keperluan]", f.servis_keperluan); }
    return body;
  }

  // Ringkasan biaya dihitung server dan diperbarui saat form berubah (galat validasi sementara diabaikan).
  const kunciPreview = useMemo(() => JSON.stringify([f, Object.values(bagian).map((v) => [v.kondisi, v.biaya]), tambahan]), [f, bagian, tambahan]);
  useEffect(() => {
    if (!p || !f.tgl_kembali || !f.jam_kembali) return;
    const t = setTimeout(() => {
      api(`/admin/pemesanan/${id}/pengembalian/preview`, { method: "POST", body: susun() }).then((r) => setRingkasan(r.data.ringkasan || r.data)).catch(() => setRingkasan(null));
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunciPreview, p]);

  async function simpan() {
    setGalat(null); setProses(true);
    try { await api(`/admin/pemesanan/${id}/pengembalian`, { method: "POST", body: susun() }); router.push(`/admin/pesanan/${id}`); }
    catch (e) { setGalat(e); } finally { setProses(false); setKonfirmasi(false); }
  }

  if (!p) return <>{galat ? <Galat e={galat} /> : <p>Memuat...</p>}</>;
  const tarif = Math.round(p.total_biaya / p.durasi);

  return (
    <>
      <Link className="kembali" href={`/admin/pesanan/${id}`}>← Kembali ke pesanan</Link>
      <div className="kepala-halaman"><div><h1>Pengembalian dan pemeriksaan unit</h1>
        <span className="abu">{p.nomor} · {p.pelanggan.nama}. Isi setelah mobil kembali, lalu catat kondisi dan biaya tambahan.</span></div></div>
      <form onSubmit={(e) => { e.preventDefault(); setKonfirmasi(true); }}>
        <section className="kartu"><div className="kolom-4">
          <div><span className="kecil abu">Pelanggan</span><br /><b>{p.pelanggan.nama}</b></div><div><span className="kecil abu">Unit</span><br /><b>{p.tipe.nama} · {p.plat_nomor}</b></div>
          <div><span className="kecil abu">Tarif per hari</span><br /><b>{rupiah(tarif)}</b></div><div><span className="kecil abu">Kembali paling lambat</span><br /><b>{tanggal(p.tgl_kembali)}, 23.59</b></div></div></section>

        <section className="kartu"><div className="langkah-judul"><span className="no">1</span><h2>Pengembalian</h2></div>
          <p className="ket">Pelanggan boleh mengembalikan sampai pukul 23.59 tanggal kembali. Lewat itu dihitung 1 hari terlambat (dihitung otomatis dari tanggal kembali aktual).</p>
          <div className="kolom-2">
            <div><label htmlFor="tglk">Tanggal kembali</label><input id="tglk" type="date" required value={f.tgl_kembali} onChange={set("tgl_kembali")} /></div>
            <div><label htmlFor="jamk">Jam kembali</label><input id="jamk" type="time" required value={f.jam_kembali} onChange={set("jam_kembali")} /></div>
            {lk && <>
              <div><label htmlFor="odoz">Odometer akhir (km)</label><input id="odoz" type="number" min="0" step="1" required value={f.odometer_akhir} onChange={set("odometer_akhir")} /><p className="hint">Tidak boleh lebih kecil dari odometer awal.</p></div>
              <div><label htmlFor="bbmk">BBM saat kembali</label><select id="bbmk" required value={f.bbm_akhir} onChange={set("bbm_akhir")}>{Object.entries(BBM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label htmlFor="kurang">Biaya kekurangan BBM (Rp)</label><input id="kurang" type="number" min="0" step="1000" required value={f.biaya_kekurangan_bbm} onChange={set("biaya_kekurangan_bbm")} /></div>
              <div><label htmlFor="bersih">Kebersihan</label><select id="bersih" required value={f.kebersihan} onChange={set("kebersihan")}><option value="bersih">Bersih</option><option value="kotor_biasa">Kotor biasa</option><option value="sangat_kotor">Sangat kotor</option></select></div>
            </>}
          </div></section>

        <section className="kartu"><div className="langkah-judul"><span className="no">2</span><h2>Pemeriksaan Kondisi</h2></div>
          <p className="ket">Isi tiap bagian. Biaya dan foto wajib jika kondisi tidak baik.</p>
          <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Bagian</th><th>Kondisi</th><th>Biaya perbaikan (Rp)</th><th>Foto</th><th>Keterangan</th></tr></thead><tbody>
            {Object.entries(BAGIAN).map(([b, t]) => {
              const v = bagian[b]; const rusak = v.kondisi !== "baik";
              return (
                <tr key={b}><td className="tebal">{t}</td>
                  <td><select aria-label={`Kondisi ${t}`} value={v.kondisi} onChange={(e) => setB(b, "kondisi", e.target.value)}>{KONDISI.map((k) => <option key={k} value={k} style={{ textTransform: "capitalize" }}>{k[0].toUpperCase() + k.slice(1)}</option>)}</select></td>
                  <td><input type="number" min="0" step="1000" aria-label={`Biaya ${t}`} disabled={!rusak} required={rusak} value={rusak ? v.biaya : ""} onChange={(e) => setB(b, "biaya", e.target.value)} /></td>
                  <td><input type="file" accept="image/jpeg,image/png" aria-label={`Foto ${t}`} required={rusak} onChange={(e) => setB(b, "foto", e.target.files[0] || null)} /></td>
                  <td><input maxLength={150} aria-label={`Keterangan ${t}`} placeholder="Opsional" value={v.ket} onChange={(e) => setB(b, "ket", e.target.value)} /></td></tr>
              );
            })}
          </tbody></table></div></section>

        <section className="kartu"><div className="langkah-judul"><span className="no">3</span><h2>Biaya Tambahan Lain</h2></div>
          <p className="ket">Isi hanya yang berlaku. Tol dan parkir dibayar langsung oleh penyewa, tidak dicatat.</p>
          <div className="kolom-4">{Object.entries(TAMBAHAN).map(([j, t]) => (
            <div key={j}><label htmlFor={`l-${j}`}>{t} (Rp)</label><input id={`l-${j}`} type="number" min="0" step="1000" value={tambahan[j]?.biaya || ""} onChange={(e) => setTambahan({ ...tambahan, [j]: { ...tambahan[j], biaya: e.target.value } })} />
              <input aria-label={`Keterangan ${t}`} maxLength={150} placeholder="Keterangan" style={{ marginTop: 6 }} value={tambahan[j]?.ket || ""} onChange={(e) => setTambahan({ ...tambahan, [j]: { ...tambahan[j], ket: e.target.value } })} /></div>
          ))}</div></section>

        <section className="kartu"><div className="langkah-judul"><span className="no">4</span><h2>Penutup</h2></div>
          <div className="kolom-2">
            <div><label htmlFor="bayar">Status pembayaran tagihan</label><select id="bayar" value={f.status_pembayaran_tagihan} onChange={set("status_pembayaran_tagihan")}><option value="belum_dibayar">Belum dibayar</option><option value="tunai">Lunas tunai</option><option value="transfer">Lunas transfer</option></select>
              {lk && <p className="hint">Jaminan otomatis dikembalikan bila tagihan nol atau langsung lunas; selain itu ditahan sampai tagihan lunas.</p>}</div>
            <div><label htmlFor="cat">Catatan admin</label><textarea id="cat" maxLength={2000} value={f.catatan_admin} onChange={set("catatan_admin")} /></div>
          </div>
          <div className="cek"><input type="checkbox" id="servis" checked={f.unit_perlu_servis} onChange={set("unit_perlu_servis")} /><label htmlFor="servis">Unit perlu servis (unit masuk status Dalam servis)</label></div>
          {f.unit_perlu_servis && <div className="kolom-2">
            <div><label htmlFor="tingkat">Tingkat servis</label><select id="tingkat" value={f.servis_tingkat} onChange={set("servis_tingkat")}><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="perlu_bengkel">Perlu bengkel</option></select></div>
            <div><label htmlFor="perlu">Keperluan servis</label><input id="perlu" required maxLength={100} value={f.servis_keperluan} onChange={set("servis_keperluan")} /></div></div>}
          <div className="cek"><input type="checkbox" id="setuju" required checked={f.disetujui_penyewa} onChange={set("disetujui_penyewa")} /><label htmlFor="setuju">Penyewa menyetujui hasil pemeriksaan di atas.</label></div>
        </section>

        <section className="kartu"><h2>Ringkasan biaya</h2>
          {ringkasan ? <div className="ringkasan">{Object.entries(RINGKAS).filter(([k]) => ringkasan[k] != null).map(([k, t]) => (
            <div className={`baris${k === "total_akhir" ? " total" : ""}`} key={k}><span>{t}{k === "denda_keterlambatan" && ` (${ringkasan.hari_terlambat} hari)`}</span><span>{rupiah(ringkasan[k])}</span></div>
          ))}</div> : <p className="abu">Ringkasan muncul setelah tanggal dan jam kembali (dan data wajib) terisi.</p>}
        </section>
        <Galat e={galat} />
        <div className="baris"><button className="btn" type="submit">Selesaikan pesanan</button><Link className="btn garis" href={`/admin/pesanan/${id}`}>Batal</Link></div>
      </form>
      <ModalAdmin open={konfirmasi} judul="Selesaikan pesanan?"><p>Pesanan ditutup dan tagihan tambahan dicatat{ringkasan && <>: <b>{rupiah(ringkasan.tagihan_tambahan)}</b></>}. Tidak bisa diubah setelahnya.</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setKonfirmasi(false)}>Kembali</button><button className="btn sm" disabled={proses} onClick={simpan}>Ya, selesaikan</button></div></ModalAdmin>
    </>
  );
}
