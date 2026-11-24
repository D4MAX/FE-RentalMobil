"use client";
import "@/app/css/riwayat.css";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useCallback, useEffect, useState } from "react";
import { api, rupiah, tanggal, tglIso, unduh } from "@/lib/api";
import { BADGE, LABEL, WA } from "@/lib/status";
import Galat from "@/components/Galat";
import Jaga from "@/components/Jaga";
import Tahap from "@/components/Tahap";

const KOSONG_REK = { bank: "", no_rekening: "", nama_rekening: "" };

function Isi() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [galat, setGalat] = useState(null);
  const [modal, setModal] = useState(useSearchParams().get("nilai") ? "nilai" : null); // batal | ajukan | nilai
  const [proses, setProses] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [rek, setRek] = useState(KOSONG_REK);
  const [nilai, setNilai] = useState({ rating: "", komentar: "" });

  const muat = useCallback(() => api(`/pemesanan/${id}`).then((r) => setP(r.data)).catch(setGalat), [id]);
  useEffect(() => { muat(); }, [muat]);

  // Jalankan aksi lalu muat ulang detail; galat tampil di dalam pop-up.
  async function jalan(fn) {
    setGalat(null); setProses(true);
    try { await fn(); setModal(null); await muat(); } catch (e) { setGalat(e); } finally { setProses(false); }
  }
  const batalkan = () => jalan(() => api(`/pemesanan/${id}/batalkan`, { method: "POST" }));
  const ajukan = (e) => { e.preventDefault(); jalan(() => api(`/pemesanan/${id}/ajukan-pembatalan`, { method: "POST", body: { alasan, ...(butuhRek && rek) } })); };
  const kirimNilai = (e) => { e.preventDefault(); jalan(() => api(`/pemesanan/${id}/review`, { method: "POST", body: { rating: Number(nilai.rating), komentar: nilai.komentar || undefined } })); };
  const nota = () => unduh(`/pemesanan/${id}/nota`, `nota-${p.nomor}.pdf`).catch(setGalat);

  if (!p) return <main className="wrap">{galat ? <Galat e={galat} /> : <p>Memuat...</p>}</main>;

  const a = p.aksi;
  const ds = p.jenis_sewa === "dengan_sopir";
  const tarif = Math.round(p.total_biaya / p.durasi);
  const metode = p.pembayaran?.metode;
  const butuhRek = !!metode && metode !== "qris"; // refund virtual account ditransfer admin ke rekening ini
  const tambah = p.tagihan_tambahan;
  const perpanjang = new Date(new Date(p.tgl_kembali).getTime() + 864e5);
  const nama = (s) => s.replaceAll("_", " ");

  return (
    <main className="wrap">
      <p className="kecil"><Link className="tautan" href="/riwayat">← Riwayat Pemesanan</Link></p>
      <div className="kepala-detail"><div><h1>Pesanan {p.nomor}</h1></div><span className={`badge ${BADGE[p.status]}`}>{LABEL[p.status]}</span></div>
      {!modal && <Galat e={galat} />}

      <div className="kotak"><h3>Tindakan</h3>
        {p.status === "dikonfirmasi" && <p className="abu">Pembatalan hanya dapat diajukan sampai H-1. Plat nomor tampil setelah status Berjalan.</p>}
        {p.status === "berjalan" && <p className="abu">Perpanjang sewa lewat pesanan baru dari Katalog.</p>}
        {p.status === "pengajuan_pembatalan" && <div className="alert peringatan" style={{ margin: 0 }}>Pengajuan sedang diproses admin.</div>}
        {tambah && tambah.status !== "lunas" && <div className="alert peringatan" style={{ margin: 0 }}>Tagihan tambahan {rupiah(tambah.jumlah)}, hubungi admin untuk pembayaran.</div>}
        <div className="aksi-detail">
          {a.bisa_bayar && <Link className="btn" href={`/pembayaran/${id}`}>Bayar sekarang</Link>}
          {a.bisa_batalkan && <button className="btn bahaya" onClick={() => setModal("batal")}>Batalkan pesanan</button>}
          {a.bisa_ajukan_pembatalan && <button className="btn garis" onClick={() => setModal("ajukan")}>Ajukan pembatalan</button>}
          {a.bisa_review && <button className="btn" onClick={() => setModal("nilai")}>Beri penilaian</button>}
          {a.bisa_unduh_nota && <button className="btn garis" onClick={nota}>Unduh atau cetak nota</button>}
          {a.bisa_perpanjang && <Link className="btn" href={`/katalog?tgl_mulai=${tglIso(perpanjang)}`}>Perpanjang sewa</Link>}
          {a.bisa_pesan_lagi && <Link className="btn garis" href="/katalog">Pesan lagi</Link>}
          {["dikonfirmasi", "berjalan", "pengajuan_pembatalan", "selesai"].includes(p.status) && <a className="btn garis" href={WA}>Hubungi admin</a>}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="grid" style={{ alignContent: "start" }}>
          <div className="kotak"><h3>Tahapan</h3><Tahap status={p.status} /></div>
          <div className="kotak"><h3>Data Pesanan</h3><dl className="data-baris">
            <dt>Tipe</dt><dd>{p.tipe.nama}</dd><dt>Jenis sewa</dt><dd>{ds ? "Dengan sopir" : "Lepas kunci"}</dd>
            {p.transmisi && <><dt>Transmisi</dt><dd style={{ textTransform: "capitalize" }}>{p.transmisi}</dd></>}
            <dt>Tanggal</dt><dd>{tanggal(p.tgl_mulai)} sampai {tanggal(p.tgl_kembali)}</dd>
            <dt>{ds ? "Jam jemput" : "Jam serah"}</dt><dd>{p.jam_serah.replace(":", ".")}</dd><dt>Durasi</dt><dd>{p.durasi} hari</dd>
            <dt>Kembali paling lambat</dt><dd>{tanggal(p.tgl_kembali)}, 23.59</dd>
            {p.metode_ambil && <><dt>Pengambilan</dt><dd style={{ textTransform: "capitalize" }}>{nama(p.metode_ambil)}</dd></>}
            {p.lokasi_jemput && <><dt>Lokasi</dt><dd>{p.lokasi_jemput}</dd></>}
            {p.tujuan && <><dt>Tujuan</dt><dd>{p.tujuan}</dd></>}
            {p.plat_nomor && <><dt>Plat nomor</dt><dd>{p.plat_nomor}</dd></>}
          </dl></div>
          {p.pembayaran && <div className="kotak"><h3>Pembayaran</h3><dl className="data-baris">
            <dt>Metode</dt><dd>{metode ? metode.replaceAll("_", " ").toUpperCase() : "Belum dipilih"}</dd>
            <dt>Status</dt><dd style={{ textTransform: "capitalize" }}>{p.pembayaran.status}</dd>
            <dt>Nomor order</dt><dd>{p.pembayaran.order_id}</dd>
          </dl></div>}
        </div>
        <div className="grid" style={{ alignContent: "start" }}>
          <div className="kotak"><h3>Rincian Biaya</h3><table className="tabel"><thead><tr><th>Uraian</th><th className="angka">Jumlah</th></tr></thead><tbody>
            <tr><td>Sewa {rupiah(tarif)} × {p.durasi} hari</td><td className="angka">{rupiah(p.total_biaya)}</td></tr>
            <tr className="total"><td>Total sewa</td><td className="angka">{rupiah(p.total_biaya)}</td></tr></tbody></table>
            {tambah && <p className="tebal" style={{ marginTop: 12 }}>Tagihan tambahan: {rupiah(tambah.jumlah)} ({tambah.status})</p>}
          </div>
        </div>
      </div>

      <div className={`modal${modal === "batal" ? " tampil" : ""}`} role="dialog" aria-modal="true" aria-label="Batalkan pesanan?">
        <div className="isi"><h3>Batalkan pesanan?</h3><p>Yakin batalkan pesanan?</p>
          <Galat e={galat} />
          <div className="baris"><button className="btn garis sm" onClick={() => { setModal(null); setGalat(null); }}>Kembali</button><button className="btn bahaya kecil" disabled={proses} onClick={batalkan}>Ya, batalkan</button></div></div>
      </div>

      <div className={`modal${modal === "ajukan" ? " tampil" : ""}`} role="dialog" aria-modal="true" aria-label="Ajukan pembatalan?">
        <div className="isi"><h3>Ajukan pembatalan?</h3><p>Yakin ajukan pembatalan? Pengajuan diproses admin, dana kembali penuh.</p>
          <form onSubmit={ajukan}>
            <div className="field"><label htmlFor="alasan">Alasan</label><textarea id="alasan" required maxLength={500} value={alasan} onChange={(e) => setAlasan(e.target.value)} /></div>
            {butuhRek && ["bank", "no_rekening", "nama_rekening"].map((k) => (
              <div className="field" key={k}><label htmlFor={k}>{{ bank: "Bank tujuan refund", no_rekening: "Nomor rekening", nama_rekening: "Nama pemilik rekening" }[k]}</label>
                <input id={k} required value={rek[k]} onChange={(e) => setRek({ ...rek, [k]: e.target.value })} /></div>
            ))}
            <Galat e={galat} />
            <div className="baris"><button type="button" className="btn garis sm" onClick={() => { setModal(null); setGalat(null); }}>Kembali</button><button className="btn bahaya kecil" type="submit" disabled={proses}>Ya, ajukan</button></div>
          </form></div>
      </div>

      <div className={`modal${modal === "nilai" ? " tampil" : ""}`} role="dialog" aria-modal="true" aria-label="Beri penilaian">
        <div className="isi"><h3>Beri penilaian</h3><p className="abu kecil">Penilaian hanya dapat diberikan sekali.</p>
          <form onSubmit={kirimNilai}>
            <div className="field"><span className="label">Nilai</span><div className="bintang-pilih">
              {[5, 4, 3, 2, 1].map((n) => <Fragment key={n}><input type="radio" name="nilai" id={`s${n}`} value={n} required checked={nilai.rating === String(n)} onChange={(e) => setNilai({ ...nilai, rating: e.target.value })} /><label htmlFor={`s${n}`} title={`${n} bintang`}>★</label></Fragment>)}
            </div></div>
            <div className="field"><label htmlFor="ulasan">Ulasan (opsional)</label><textarea id="ulasan" maxLength={500} value={nilai.komentar} onChange={(e) => setNilai({ ...nilai, komentar: e.target.value })} /></div>
            <Galat e={galat} />
            <div className="baris"><button type="button" className="btn garis sm" onClick={() => { setModal(null); setGalat(null); }}>Batal</button><button className="btn sm" type="submit" disabled={proses}>Kirim</button></div>
          </form></div>
      </div>
    </main>
  );
}

export default function Detail() { return <Jaga role="user"><Suspense><Isi /></Suspense></Jaga>; }
