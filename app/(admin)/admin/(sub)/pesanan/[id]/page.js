"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import { api, rupiah, tanggal } from "@/lib/api";
import { BADGE, LABEL, WA } from "@/lib/status";
import Galat from "@/components/Galat";
import ModalAdmin from "@/components/ModalAdmin";
import Tahap from "@/components/Tahap";

const wkt = (d) => new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(":", ".");
const nama = (s) => String(s).replaceAll("_", " ");
const JAMINAN = { ktp_asli: "KTP asli", sim_c_asli: "SIM C asli", motor_stnk: "Sepeda motor dan STNK", booking_transportasi: "Bukti booking transportasi", booking_hotel: "Bukti booking hotel" };

export default function DetailPesanan() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [galat, setGalat] = useState(null);
  const [modal, setModal] = useState(null); // setujui | tolak | lunas | jaminan
  const [metode, setMetode] = useState("tunai");
  const [catatan, setCatatan] = useState("");
  const [simpanOk, setSimpanOk] = useState(false);
  const [proses, setProses] = useState(false);

  const muat = useCallback(() => api(`/admin/pemesanan/${id}`).then((r) => { setP(r.data); setCatatan(r.data.catatan_admin || ""); }).catch(setGalat), [id]);
  useEffect(() => { muat(); }, [muat]);

  async function jalan(fn) {
    setGalat(null); setProses(true);
    try { await fn(); setModal(null); await muat(); } catch (e) { setGalat(e); setModal(null); } finally { setProses(false); }
  }
  const post = (aksi, body) => () => jalan(() => api(`/admin/pemesanan/${id}/${aksi}`, { method: "POST", body }));
  const simpanCatatan = async (e) => {
    e.preventDefault(); setSimpanOk(false); setGalat(null);
    try { await api(`/admin/pemesanan/${id}/catatan`, { method: "PUT", body: { catatan_admin: catatan } }); setSimpanOk(true); } catch (err) { setGalat(err); }
  };

  if (!p) return <>{galat ? <Galat e={galat} /> : <p>Memuat...</p>}</>;
  const a = p.aksi;
  const ds = p.jenis_sewa === "dengan_sopir";
  const dom = { malang_raya: "Malang Raya", luar_malang_raya: "Luar Malang Raya" }[p.domisili] || p.domisili;
  const tarif = Math.round(p.total_biaya / p.durasi);
  const pg = p.pengembalian;
  const menunggu = p.refund_menunggu || [];
  const pembayaran = p.pembayaran;

  return (
    <>
      <Link className="kembali" href="/admin/pesanan">← Kembali ke pesanan</Link>
      <div className="kepala-halaman"><div><h1>{p.nomor}</h1><span className="abu">Dibuat pada {tanggal(p.tgl_pesan)}</span></div><span className={`badge ${BADGE[p.status]}`}>{LABEL[p.status]}</span></div>
      <Galat e={galat} />

      <section className="kartu"><h2>Tindakan</h2>
        {p.status === "dikonfirmasi" && <p>{p.metode_ambil === "diantar" || ds ? <>Sebelum menyerahkan unit, periksa lokasi {ds ? "jemput" : "antar"}: <b>{p.lokasi_jemput}</b>. Jika di luar batas Tlogomas, hubungi pelanggan lewat WhatsApp untuk biaya antar.</> : "Unit diambil di kantor."}{ds && p.tujuan && <> Tujuan: <b>{p.tujuan}</b> (periksa apakah semua di Malang dan Batu).</>}</p>}
        {p.status === "pengajuan_pembatalan" && <div className="alert peringatan">Pelanggan mengajukan pembatalan{p.alasan_pengajuan && <>: <b>{p.alasan_pengajuan}</b></>}. Setujui bila sesuai ketentuan, dana kembali penuh.</div>}
        {p.status === "dibatalkan" && p.alasan_pembatalan && <div className="alert galat"><strong>Alasan pembatalan</strong>{nama(p.alasan_pembatalan)}</div>}
        {p.tagihan_tambahan && p.tagihan_tambahan.status !== "lunas" && <div className="alert peringatan">Tagihan tambahan {rupiah(p.tagihan_tambahan.jumlah)} belum dibayar.</div>}
        <div className="aksi">
          {a.bisa_serahkan && <Link className="btn" href={`/admin/pesanan/${id}/serahkan`}>Serahkan unit</Link>}
          {a.bisa_selesaikan && <Link className="btn" href={`/admin/pesanan/${id}/selesai`}>Selesaikan pesanan</Link>}
          {a.bisa_setujui && <button className="btn" onClick={() => setModal("setujui")}>Setujui pembatalan</button>}
          {a.bisa_tolak && <button className="btn bahaya" onClick={() => setModal("tolak")}>Tolak pembatalan</button>}
          {a.bisa_refund_selesai && menunggu.map((r) => <button key={r.id_pembayaran} className="btn garis" onClick={post("refund-selesai", { id_pembayaran: r.id_pembayaran })}>Refund selesai ditransfer ({rupiah(r.jumlah)})</button>)}
          {a.bisa_tandai_lunas && <button className="btn" onClick={() => setModal("lunas")}>Tandai tagihan lunas</button>}
          {a.bisa_kembalikan_jaminan && <button className="btn" onClick={() => setModal("jaminan")}>Kembalikan jaminan</button>}
        </div>
        <p className="kecil" style={{ margin: "12px 0 0" }}><a className="tautan" href={WA} target="_blank" rel="noopener">Hubungi pelanggan</a></p>
      </section>

      <section className="kartu"><h2>Tahapan</h2><Tahap status={p.status} /></section>

      <div className="grid grid-2 mulai">
        <div>
          <section className="kartu"><h2>Data Pesanan</h2><dl className="data-baris">
            <dt>Tipe</dt><dd>{p.tipe.nama}</dd><dt>Jenis sewa</dt><dd>{ds ? "Dengan sopir" : "Lepas kunci"}</dd>
            {p.transmisi && <><dt>Transmisi</dt><dd style={{ textTransform: "capitalize" }}>{p.transmisi}</dd></>}
            <dt>Plat nomor</dt><dd>{p.plat_nomor || "Belum ditetapkan (diisi saat Serahkan unit)"}</dd>
            <dt>Tanggal</dt><dd>{tanggal(p.tgl_mulai)} sampai {tanggal(p.tgl_kembali)}</dd>
            <dt>{ds ? "Jam jemput" : "Jam serah"}</dt><dd>{p.jam_serah.replace(":", ".")}</dd><dt>Durasi</dt><dd>{p.durasi} hari</dd>
            <dt>Kembali paling lambat</dt><dd>{tanggal(p.tgl_kembali)}, 23.59</dd>
            {p.metode_ambil && <><dt>Pengambilan</dt><dd style={{ textTransform: "capitalize" }}>{nama(p.metode_ambil)}</dd></>}
            {p.lokasi_jemput && <><dt>Lokasi</dt><dd>{p.lokasi_jemput}</dd></>}
            {p.tujuan && <><dt>Tujuan</dt><dd>{p.tujuan}</dd></>}
            {p.catatan && <><dt>Catatan pelanggan</dt><dd>{p.catatan}</dd></>}
          </dl></section>
          <section className="kartu"><h2>Pembayaran</h2><dl className="data-baris">
            <dt>Metode, status</dt><dd>{pembayaran ? `${pembayaran.metode ? nama(pembayaran.metode).toUpperCase() : "belum dipilih"}, ${pembayaran.status}` : "-"}</dd>
            <dt>Nomor order</dt><dd>{pembayaran?.order_id || "-"}</dd></dl>
            {p.riwayat_pembayaran?.filter((r) => r.order_id && r.jenis === "sewa").length > 1 && <p className="kecil abu">Percobaan: {p.riwayat_pembayaran.filter((r) => r.order_id && r.jenis === "sewa").map((r) => `${r.order_id} (${r.jenis}, ${r.status})`).join("; ")}</p>}
            {p.refund && <p className="kecil" style={{ margin: "8px 0 0" }}>Refund {rupiah(p.refund.jumlah)} via {nama(p.refund.cara)}: {p.refund.selesai ? "selesai" : "menunggu"}{p.refund.bank && <>. Rekening: {p.refund.bank} {p.refund.no_rekening} a.n. {p.refund.nama_rekening}</>}</p>}
          </section>
          {p.jaminan && <section className="kartu"><h2>Jaminan</h2><p className="kecil abu">Status: {p.jaminan.status}</p>
            <ul className="daftar-tanda">{p.jaminan.daftar.map((j) => <li key={j.jenis}>{JAMINAN[j.jenis] || `Dokumen tambahan (${j.jenis.split(":")[1]?.toUpperCase()})`} {j.dikembalikan ? "(dikembalikan)" : "(ditahan)"}</li>)}</ul></section>}
          <section className="kartu"><h2>Riwayat Aktivitas</h2><ol className="timeline">{p.log_aktivitas.map((l, i) => <li key={i}>{l.aksi} <span className="abu">oleh {l.oleh}</span><time>{wkt(l.waktu)}</time></li>)}</ol></section>
        </div>
        <div>
          <section className="kartu"><h2>Data Pelanggan</h2><dl className="data-baris">
            <dt>Nama</dt><dd>{p.pelanggan.nama}</dd><dt>WhatsApp</dt><dd>{p.pelanggan.no_hp}</dd><dt>Email</dt><dd>{p.pelanggan.email}</dd>
            <dt>Asal</dt><dd>{p.pelanggan.kota}, {p.pelanggan.provinsi}</dd><dt>Domisili pesanan</dt><dd>{dom}</dd>
            {p.pelanggan.no_identitas && <><dt>No. identitas</dt><dd>{p.pelanggan.no_identitas}</dd></>}
          </dl></section>
          <section className="kartu"><h2>Rincian Biaya</h2><div className="tabel-bungkus"><table className="tabel"><tbody>
            <tr><td>Sewa {rupiah(tarif)} × {p.durasi} hari</td><td className="angka">{rupiah(p.total_biaya)}</td></tr>
            {pg?.denda_keterlambatan > 0 && <tr><td>Denda keterlambatan ({pg.hari_terlambat} hari)</td><td className="angka">{rupiah(pg.denda_keterlambatan)}</td></tr>}
            {pg?.biaya_kekurangan_bbm > 0 && <tr><td>Kekurangan BBM</td><td className="angka">{rupiah(pg.biaya_kekurangan_bbm)}</td></tr>}
            {pg?.kondisi.filter((k) => k.biaya > 0).map((k) => <tr key={k.bagian}><td>Kerusakan: {nama(k.bagian)} ({k.kondisi})</td><td className="angka">{rupiah(k.biaya)}</td></tr>)}
            {pg?.biaya_tambahan.map((b, i) => <tr key={i}><td>{nama(b.jenis)}</td><td className="angka">{rupiah(b.jumlah ?? b.biaya)}</td></tr>)}
            <tr className="total"><td>Total sewa</td><td className="angka">{rupiah(p.total_biaya)}</td></tr></tbody></table></div>
            {p.tagihan_tambahan && <p className="tebal" style={{ marginTop: 12 }}>Tagihan tambahan: {rupiah(p.tagihan_tambahan.jumlah)} ({p.tagihan_tambahan.status})</p>}
          </section>
          {p.serah_terima && <section className="kartu"><h2>Serah Terima</h2><dl className="data-baris">
            <dt>Waktu</dt><dd>{wkt(p.serah_terima.tgl_serah)}</dd><dt>Unit</dt><dd>{p.serah_terima.plat_nomor}</dd>
            {p.serah_terima.odometer_awal != null && <><dt>Odometer awal</dt><dd>{p.serah_terima.odometer_awal} km</dd></>}
            {p.serah_terima.bbm_awal && <><dt>BBM awal</dt><dd>{nama(p.serah_terima.bbm_awal)}</dd></>}
            {p.serah_terima.catatan_kondisi && <><dt>Catatan kondisi</dt><dd>{p.serah_terima.catatan_kondisi}</dd></>}
            <dt>Petugas</dt><dd>{p.serah_terima.admin}</dd></dl></section>}
          {pg && <section className="kartu"><h2>Hasil Pengembalian</h2><dl className="data-baris">
            <dt>Kembali</dt><dd>{tanggal(pg.tgl_kembali)}, {pg.jam_kembali}</dd>
            {pg.odometer_akhir != null && <><dt>Odometer akhir</dt><dd>{pg.odometer_akhir} km</dd><dt>BBM akhir</dt><dd>{nama(pg.bbm_akhir)}</dd><dt>Kebersihan</dt><dd>{nama(pg.kebersihan)}</dd></>}
            {pg.kondisi.filter((k) => k.kondisi !== "baik").map((k) => <Fragment key={k.bagian}><dt>{nama(k.bagian)}</dt><dd>{k.kondisi}{k.keterangan && `, ${k.keterangan}`}</dd></Fragment>)}
            {pg.catatan_admin && <><dt>Catatan</dt><dd>{pg.catatan_admin}</dd></>}</dl></section>}
          {p.review && <section className="kartu"><h2>Ulasan Pelanggan</h2><p>{"★".repeat(p.review.rating)}{"☆".repeat(5 - p.review.rating)}</p>{p.review.komentar && <p>{p.review.komentar}</p>}
            <div className="cek"><input type="checkbox" id="tampil" checked={p.review.tampil_di_katalog} onChange={(e) => jalan(() => api(`/admin/review/${p.review.id}`, { method: "PATCH", body: { tampil_di_katalog: e.target.checked } }))} /><label htmlFor="tampil">Tampilkan di katalog</label></div></section>}
          <section className="kartu"><h2>Catatan Admin</h2><p className="ket kecil abu">Hanya terlihat oleh admin.</p>
            <form onSubmit={simpanCatatan}><label htmlFor="cat">Catatan</label><textarea id="cat" maxLength={500} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misalnya: bukti booking sudah dicek" />
              {simpanOk && <div className="alert sukses">Catatan disimpan.</div>}<button className="btn sm" type="submit">Simpan catatan</button></form></section>
        </div>
      </div>

      <ModalAdmin open={modal === "setujui"} judul="Setujui pembatalan?"><p>Pesanan dibatalkan, unit dilepas, dan dana dikembalikan penuh. Lanjutkan?</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setModal(null)}>Kembali</button><button className="btn sm" disabled={proses} onClick={post("setujui-pembatalan")}>Ya, setujui</button></div></ModalAdmin>
      <ModalAdmin open={modal === "tolak"} judul="Tolak pembatalan?"><p>Pesanan kembali ke status sebelumnya. Lanjutkan?</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setModal(null)}>Kembali</button><button className="btn bahaya sm" disabled={proses} onClick={post("tolak-pembatalan")}>Ya, tolak</button></div></ModalAdmin>
      <ModalAdmin open={modal === "lunas"} judul="Tandai tagihan lunas?"><label htmlFor="metode">Dibayar dengan</label>
        <select id="metode" value={metode} onChange={(e) => setMetode(e.target.value)}><option value="tunai">Tunai</option><option value="transfer">Transfer</option></select>
        <div className="baris"><button className="btn garis sm" onClick={() => setModal(null)}>Kembali</button><button className="btn sm" disabled={proses} onClick={post("tagihan/lunas", { metode })}>Ya, sudah lunas</button></div></ModalAdmin>
      <ModalAdmin open={modal === "jaminan"} judul="Kembalikan jaminan?"><p>Pastikan jaminan sudah diserahkan kembali ke pelanggan.</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setModal(null)}>Kembali</button><button className="btn sm" disabled={proses} onClick={post("jaminan/kembalikan")}>Ya, kembalikan</button></div></ModalAdmin>
    </>
  );
}
