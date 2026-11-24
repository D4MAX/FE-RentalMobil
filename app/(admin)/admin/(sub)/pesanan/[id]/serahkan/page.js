"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, rupiah, tanggal } from "@/lib/api";
import { BBM } from "@/lib/status";
import Galat from "@/components/Galat";
import ModalAdmin from "@/components/ModalAdmin";

export default function Serahkan() {
  const { id } = useParams();
  const router = useRouter();
  const [p, setP] = useState(null);
  const [unit, setUnit] = useState(null);
  const [f, setF] = useState({ id_kendaraan: "", no_identitas: "", domisili_disesuaikan: "", dokumen: "ktm", odometer_awal: "", bbm_awal: "penuh", catatan_kondisi: "" });
  const [foto, setFoto] = useState({}); // foto_jaminan per jenis
  const [fotoKondisi, setFotoKondisi] = useState([]);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    api(`/admin/pemesanan/${id}`).then((r) => setP(r.data)).catch(setGalat);
    api(`/admin/pemesanan/${id}/unit-tersedia`).then((r) => setUnit(r.data.unit)).catch(setGalat);
  }, [id]);

  if (!p) return <>{galat ? <Galat e={galat} /> : <p>Memuat...</p>}</>;
  const lk = p.jenis_sewa === "lepas_kunci";
  const dom = f.domisili_disesuaikan || p.domisili;
  const berkas = [["ktp_asli", "a. Foto KTP asli"], ["sim_c_asli", "b. Foto SIM C asli"], ["dokumen_tambahan", "c. Foto dokumen tambahan"],
    ...(dom === "malang_raya" ? [["motor_stnk", "d. Foto sepeda motor dan STNK"]] : [["booking_transportasi", "e. Foto bukti booking transportasi umum"], ["booking_hotel", "e. Foto bukti booking hotel"]])];

  async function kirim() {
    setGalat(null); setProses(true);
    try {
      const body = new FormData();
      body.append("id_kendaraan", f.id_kendaraan);
      if (f.catatan_kondisi) body.append("catatan_kondisi", f.catatan_kondisi);
      fotoKondisi.forEach((b) => body.append("foto_kondisi[]", b));
      if (lk) {
        body.append("no_identitas", f.no_identitas); body.append("odometer_awal", f.odometer_awal); body.append("bbm_awal", f.bbm_awal);
        body.append("jaminan[dokumen_tambahan]", f.dokumen);
        if (f.domisili_disesuaikan) body.append("domisili_disesuaikan", f.domisili_disesuaikan);
        berkas.forEach(([k]) => foto[k] && body.append(`foto_jaminan[${k}]`, foto[k]));
      }
      await api(`/admin/pemesanan/${id}/serah-terima`, { method: "POST", body });
      router.push(`/admin/pesanan/${id}`);
    } catch (e) { setGalat(e); } finally { setProses(false); setKonfirmasi(false); }
  }

  return (
    <>
      <Link className="kembali" href={`/admin/pesanan/${id}`}>← Kembali ke pesanan</Link>
      <div className="kepala-halaman"><div><h1>Serah Terima Unit</h1>
        <span className="abu">{p.nomor} · {p.pelanggan.nama}. Catat {lk && "jaminan dan "}kondisi awal, lalu serahkan unit. Status pesanan menjadi Berjalan.</span></div></div>
      <form onSubmit={(e) => { e.preventDefault(); setKonfirmasi(true); }}>
        <section className="kartu"><h2>Data Pesanan</h2>
          <div className="kolom-4">
            <div><span className="kecil abu">Pelanggan</span><br /><b>{p.pelanggan.nama}</b></div><div><span className="kecil abu">Tipe</span><br /><b>{p.tipe.nama}</b></div>
            <div><span className="kecil abu">Jenis</span><br /><b>{lk ? "Lepas kunci" : "Dengan sopir"}</b></div><div><span className="kecil abu">Tarif per hari</span><br /><b>{rupiah(Math.round(p.total_biaya / p.durasi))}</b></div>
          </div>
          <div className="kolom-4 jarak">
            <div><span className="kecil abu">Durasi</span><br /><b>{p.durasi} hari</b></div><div><span className="kecil abu">Lokasi</span><br /><b>{p.lokasi_jemput || "Ambil di kantor"}</b></div>
            <div><span className="kecil abu">Tanggal kembali</span><br /><b>{tanggal(p.tgl_kembali)}, 23.59</b></div><div><span className="kecil abu">Domisili pesanan</span><br /><b>{p.domisili === "malang_raya" ? "Malang Raya" : "Luar Malang Raya"}</b></div>
          </div>
          {p.lokasi_jemput && <div className="alert peringatan jarak" style={{ marginBottom: 0 }}>Periksa lokasi: jika di luar batas Tlogomas, hubungi pelanggan lewat WhatsApp untuk biaya antar.</div>}
        </section>
        <section className="kartu"><h2>Unit yang Diserahkan</h2><p className="ket">Daftar hanya berisi unit tipe ini yang kosong pada tanggal sewa.</p>
          <label htmlFor="plat">Plat nomor</label>
          <select id="plat" required value={f.id_kendaraan} onChange={set("id_kendaraan")}><option value="">Pilih unit</option>{unit?.map((u) => <option key={u.id} value={u.id}>{u.plat_nomor} · {u.warna} · {Number(u.km_terakhir).toLocaleString("id-ID")} km</option>)}</select>
          {unit?.length === 0 && <div className="alert galat" style={{ marginTop: 8 }}>Tidak ada unit tersedia. Periksa status unit (tidak tersedia atau servis).</div>}
        </section>
        {lk && (
          <section className="kartu"><h2>Jaminan Diterima</h2><p className="ket">Admin memeriksa dokumen fisik dan mencocokkan nama dengan KTP, lalu mengunggah fotonya.</p>
            <div className="kolom-2">
              <div><label htmlFor="identitas">No. identitas penyewa</label><input id="identitas" inputMode="numeric" pattern="[0-9]{16}" title="16 digit sesuai KTP" required value={f.no_identitas} onChange={set("no_identitas")} /></div>
              <div><label htmlFor="dom">Domisili sesuai KTP</label><select id="dom" value={f.domisili_disesuaikan} onChange={set("domisili_disesuaikan")}><option value="">Sama dengan pesanan ({p.domisili === "malang_raya" ? "Malang Raya" : "Luar Malang Raya"})</option><option value="malang_raya">Malang Raya</option><option value="luar_malang_raya">Luar Malang Raya</option></select>
                <p className="hint">Sesuaikan jika KTP berbeda. Menentukan foto yang wajib dan dicatat di riwayat aktivitas.</p></div>
              <div><label htmlFor="dokumen">Jenis dokumen tambahan (butir c)</label><select id="dokumen" value={f.dokumen} onChange={set("dokumen")}>{["ktm", "kk", "npwp", "bpjs", "paspor"].map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}</select></div>
            </div>
            <div className="kolom-2 jarak">{berkas.map(([k, t]) => (
              <div key={k}><label htmlFor={`j-${k}`}>{t}</label><input id={`j-${k}`} type="file" accept="image/jpeg,image/png" required onChange={(e) => setFoto({ ...foto, [k]: e.target.files[0] })} /></div>
            ))}</div>
            <p className="hint">jpg atau png, maksimal 2 MB per berkas. Untuk butir e, cocokkan nama dengan KTP, tanggal dengan masa sewa, dan kode booking ke sumbernya, lalu catat hasilnya di catatan admin.</p>
          </section>
        )}
        <section className="kartu"><h2>Kondisi Awal Unit</h2>
          <div className="kolom-3">
            {lk && <>
              <div><label htmlFor="odo">Odometer awal (km)</label><input id="odo" type="number" min="0" step="1" required value={f.odometer_awal} onChange={set("odometer_awal")} /></div>
              <div><label htmlFor="bbm">BBM awal</label><select id="bbm" required value={f.bbm_awal} onChange={set("bbm_awal")}>{Object.entries(BBM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </>}
            <div><label htmlFor="foto">Foto kondisi (opsional, maks 10)</label><input id="foto" type="file" accept="image/jpeg,image/png" multiple onChange={(e) => setFotoKondisi([...e.target.files].slice(0, 10))} /></div>
          </div>
          <label htmlFor="kondisi">Catatan kondisi awal</label><textarea id="kondisi" maxLength={1000} value={f.catatan_kondisi} onChange={set("catatan_kondisi")} placeholder="Ringkas: lecet, kelengkapan, kebersihan" />
        </section>
        <Galat e={galat} />
        <div className="baris"><button className="btn" type="submit">Serahkan unit</button><Link className="btn garis" href={`/admin/pesanan/${id}`}>Batal</Link></div>
      </form>
      <ModalAdmin open={konfirmasi} judul="Serahkan unit?"><p>Status pesanan menjadi Berjalan{lk && " dan jaminan dicatat ditahan"}. Lanjutkan?</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setKonfirmasi(false)}>Kembali</button><button className="btn sm" disabled={proses} onClick={kirim}>Ya, serahkan</button></div></ModalAdmin>
    </>
  );
}
