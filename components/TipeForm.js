"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Galat from "./Galat";
import ModalAdmin from "./ModalAdmin";
import PopupSampah from "./PopupSampah";

const AWAL = { nama: "", merk: "", kursi: "", bahan_bakar: "bensin", harga_sopir_per_hari: "", harga_lepas_kunci_manual: "", harga_lepas_kunci_matic: "" };

export default function TipeForm({ id }) {
  const router = useRouter();
  const [f, setF] = useState(AWAL);
  const [fotoLama, setFotoLama] = useState([]);
  const [berkas, setBerkas] = useState([null, null, null]);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!id) return;
    api(`/admin/tipe/${id}`).then(({ data: t }) => { setF(Object.fromEntries(Object.keys(AWAL).map((k) => [k, t[k] ?? ""]))); setFotoLama(t.foto); }).catch(setGalat);
  }, [id]);

  async function simpan() {
    setGalat(null); setProses(true);
    try {
      const body = new FormData();
      Object.entries(f).forEach(([k, v]) => v !== "" && body.append(k, v));
      berkas.filter(Boolean).forEach((b) => body.append("foto[]", b));
      await api(id ? `/admin/tipe/${id}` : "/admin/tipe", { method: "POST", body });
      router.push("/admin/kelola-mobil");
    } catch (e) { setGalat(e); } finally { setProses(false); setKonfirmasi(false); }
  }
  async function hapusFoto(fid) {
    setGalat(null);
    try { await api(`/admin/tipe/${id}/foto/${fid}`, { method: "DELETE" }); setFotoLama(fotoLama.filter((x) => x.id !== fid)); } catch (e) { setGalat(e); }
  }
  const sisa = 3 - fotoLama.length;

  return (
    <>
      <Link className="kembali" href="/admin/kelola-mobil">← Kembali ke Kelola Mobil</Link>
      <div className="kepala-halaman"><div><h1>Tipe mobil</h1><span className="abu">{id ? "Ubah tipe." : "Tambah tipe."}</span></div></div>
      <form onSubmit={(e) => { e.preventDefault(); setKonfirmasi(true); }}>
        <section className="kartu"><h2>Data tipe</h2>
          <div className="kolom-2">
            <div><label htmlFor="nama">Nama tipe</label><input id="nama" maxLength={100} required value={f.nama} onChange={set("nama")} /></div>
            <div><label htmlFor="merk">Merk</label><input id="merk" maxLength={50} required value={f.merk} onChange={set("merk")} /></div>
            <div><label htmlFor="kursi">Jumlah kursi</label><input id="kursi" type="number" min="2" max="60" required value={f.kursi} onChange={set("kursi")} /></div>
            <div><label htmlFor="bbm">Bahan bakar</label><select id="bbm" required value={f.bahan_bakar} onChange={set("bahan_bakar")}><option value="bensin">Bensin</option><option value="diesel">Diesel</option></select></div>
          </div></section>
        <section className="kartu"><h2>Tarif per hari</h2>
          <div className="kolom-3">
            <div><label htmlFor="t1">Dengan sopir (Rp)</label><input id="t1" type="number" min="0" step="1000" value={f.harga_sopir_per_hari} onChange={set("harga_sopir_per_hari")} /></div>
            <div><label htmlFor="t2">Lepas kunci manual (Rp)</label><input id="t2" type="number" min="0" step="1000" value={f.harga_lepas_kunci_manual} onChange={set("harga_lepas_kunci_manual")} /></div>
            <div><label htmlFor="t3">Lepas kunci matic (Rp)</label><input id="t3" type="number" min="0" step="1000" value={f.harga_lepas_kunci_matic} onChange={set("harga_lepas_kunci_matic")} /></div>
          </div><p className="hint">Minimal satu tarif diisi. Kosongkan bila tipe tidak disewakan dengan cara itu. Perubahan tarif hanya berlaku untuk pesanan baru.</p></section>
        <section className="kartu"><h2>Foto</h2><p className="ket">Sampai 3 foto, jpg atau png, maksimal 2 MB.</p>
          {fotoLama.length > 0 && <div className="baris" style={{ marginBottom: 12 }}>{fotoLama.map((x) => (
            <div key={x.id}><img className="thumb" src={x.url} alt="" style={{ width: 96, height: 64 }} /><br /><a className="tautan" href="#" onClick={(e) => { e.preventDefault(); confirm("Foto dihapus permanen. Lanjutkan?") && hapusFoto(x.id); }}>Hapus</a></div>
          ))}</div>}
          <div className="kolom-3">{Array.from({ length: Math.max(sisa, 0) }, (_, i) => (
            <div key={i}><label htmlFor={`f${i}`}>Foto baru {i + 1}</label><input id={`f${i}`} type="file" accept="image/jpeg,image/png" onChange={(e) => setBerkas(berkas.map((b, j) => (j === i ? e.target.files[0] || null : b)))} /></div>
          ))}</div></section>
        <Galat e={galat?.code?.endsWith("_ADA_DI_SAMPAH") ? null : galat} />
        <div className="baris"><button className="btn" type="submit">Simpan</button><Link className="btn garis" href="/admin/kelola-mobil">Batal</Link></div>
      </form>
      <ModalAdmin open={konfirmasi} judul="Data sudah benar?"><p>Tipe akan disimpan dan katalog diperbarui.</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setKonfirmasi(false)}>Kembali</button><button className="btn sm" disabled={proses} onClick={simpan}>Ya, simpan</button></div></ModalAdmin>
      <PopupSampah e={galat} onTutup={() => setGalat(null)} onPulih={() => router.push("/admin/kelola-mobil")} onUlang={simpan} />
    </>
  );
}
