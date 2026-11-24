"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Galat from "./Galat";
import ModalAdmin from "./ModalAdmin";
import PopupSampah from "./PopupSampah";

const AWAL = { id_tipe: "", plat_nomor: "", tahun: "", warna: "", transmisi: "manual", km_terakhir: "" };
const DETAIL = { nama_pemilik: "", status_kepemilikan: "milik_perusahaan", no_rangka: "", no_mesin: "", no_bpkb: "", masa_berlaku_stnk: "", catatan: "" };

export default function UnitForm({ id }) {
  const router = useRouter();
  const [f, setF] = useState(AWAL);
  const [d, setD] = useState(DETAIL);
  const [tipe, setTipe] = useState([]);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setDet = (k) => (e) => setD({ ...d, [k]: e.target.value });

  useEffect(() => {
    api("/admin/tipe", { query: { per_page: 100 } }).then((r) => setTipe(r.data)).catch(setGalat);
    if (!id) return;
    api(`/admin/unit/${id}`).then(({ data: u }) => {
      setF(Object.fromEntries(Object.keys(AWAL).map((k) => [k, u[k] ?? ""])));
      setD(Object.fromEntries(Object.keys(DETAIL).map((k) => [k, u.detail?.[k] ?? DETAIL[k]])));
    }).catch(setGalat);
  }, [id]);

  async function simpan() {
    setGalat(null); setProses(true);
    // Field opsional yang kosong tidak dikirim
    const detail = Object.fromEntries(Object.entries(d).filter(([, v]) => v !== ""));
    try {
      await api(id ? `/admin/unit/${id}` : "/admin/unit", { method: id ? "PUT" : "POST", body: { ...f, km_terakhir: Number(f.km_terakhir), detail } });
      router.push("/admin/kelola-mobil");
    } catch (e) { setGalat(e); } finally { setProses(false); setKonfirmasi(false); }
  }

  return (
    <>
      <Link className="kembali" href="/admin/kelola-mobil">← Kembali ke Kelola Mobil</Link>
      <div className="kepala-halaman"><div><h1>Unit mobil</h1><span className="abu">{id ? "Ubah unit." : "Tambah unit."}</span></div></div>
      <form onSubmit={(e) => { e.preventDefault(); setKonfirmasi(true); }}>
        <section className="kartu"><h2>Data unit</h2>
          <div className="kolom-2">
            <div><label htmlFor="tipe">Tipe</label><select id="tipe" required value={f.id_tipe} onChange={set("id_tipe")}><option value="">Pilih tipe</option>{tipe.map((t) => <option key={t.id} value={t.id}>{t.merk} {t.nama}</option>)}</select></div>
            <div><label htmlFor="plat">Plat nomor</label><input id="plat" required maxLength={12} pattern="[A-Z]{1,2} [0-9]{1,4} [A-Z]{1,3}" title="Format: N 1234 AB" style={{ textTransform: "uppercase" }} placeholder="N 1234 AB" value={f.plat_nomor} onChange={(e) => setF({ ...f, plat_nomor: e.target.value.toUpperCase() })} /><p className="hint">Plat nomor harus unik.</p></div>
            <div><label htmlFor="thn">Tahun</label><input id="thn" type="number" min="1990" max={new Date().getFullYear() + 1} required value={f.tahun} onChange={set("tahun")} /></div>
            <div><label htmlFor="warna">Warna</label><input id="warna" maxLength={30} required value={f.warna} onChange={set("warna")} /></div>
            <div><label htmlFor="trans">Transmisi</label><select id="trans" required value={f.transmisi} onChange={set("transmisi")}><option value="manual">Manual</option><option value="matic">Matic</option></select></div>
            <div><label htmlFor="odo">Odometer (km)</label><input id="odo" type="number" min="0" step="1" required value={f.km_terakhir} onChange={set("km_terakhir")} /></div>
          </div><p className="hint">Unit baru berstatus Tersedia. Status diubah dari halaman Kelola Mobil atau Servis.</p></section>
        <section className="kartu"><h2>Detail internal</h2><p className="ket">Hanya terlihat oleh admin.</p>
          <div className="kolom-2">
            <div><label htmlFor="pemilik">Nama pemilik</label><input id="pemilik" maxLength={100} required value={d.nama_pemilik} onChange={setDet("nama_pemilik")} /></div>
            <div><label htmlFor="milik">Status kepemilikan</label><select id="milik" value={d.status_kepemilikan} onChange={setDet("status_kepemilikan")}><option value="milik_perusahaan">Milik perusahaan</option><option value="titipan">Titipan</option></select></div>
            <div><label htmlFor="rangka">No. rangka</label><input id="rangka" maxLength={30} required value={d.no_rangka} onChange={setDet("no_rangka")} /></div>
            <div><label htmlFor="mesin">No. mesin</label><input id="mesin" maxLength={30} required value={d.no_mesin} onChange={setDet("no_mesin")} /></div>
            <div><label htmlFor="bpkb">No. BPKB</label><input id="bpkb" maxLength={30} value={d.no_bpkb} onChange={setDet("no_bpkb")} /></div>
            <div><label htmlFor="stnk">Masa berlaku STNK</label><input id="stnk" type="date" value={d.masa_berlaku_stnk} onChange={setDet("masa_berlaku_stnk")} /></div>
          </div>
          <label htmlFor="cat">Catatan</label><textarea id="cat" maxLength={300} value={d.catatan} onChange={setDet("catatan")} /></section>
        <Galat e={galat?.code?.endsWith("_ADA_DI_SAMPAH") ? null : galat} />
        <div className="baris"><button className="btn" type="submit">Simpan</button><Link className="btn garis" href="/admin/kelola-mobil">Batal</Link></div>
      </form>
      <ModalAdmin open={konfirmasi} judul="Data sudah benar?"><p>Unit akan disimpan dan daftar unit diperbarui.</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setKonfirmasi(false)}>Kembali</button><button className="btn sm" disabled={proses} onClick={simpan}>Ya, simpan</button></div></ModalAdmin>
      <PopupSampah e={galat} onTutup={() => setGalat(null)} onPulih={() => router.push("/admin/kelola-mobil")} onUlang={simpan} />
    </>
  );
}
