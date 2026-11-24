"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, tanggal } from "@/lib/api";
import Galat from "@/components/Galat";

const KOMPONEN = ["Oli mesin", "Filter oli", "Filter udara", "Rem", "Ban", "Aki", "Kampas kopling", "Lainnya"];

export default function ServisSelesai() {
  const { id } = useParams();
  const router = useRouter();
  const [s, setS] = useState(null);
  const [pilih, setPilih] = useState([]);
  const [f, setF] = useState({ biaya_bengkel: "", km_saat_ini: "" });
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);

  // Tidak ada GET servis tunggal: ambil dari daftar yang sedang servis.
  useEffect(() => {
    api("/admin/servis").then((r) => { const x = r.data.sedang_servis.find((v) => String(v.id) === id); x ? setS(x) : setGalat(new Error("Servis ini tidak sedang berlangsung.")); }).catch(setGalat);
  }, [id]);

  async function kirim(e) {
    e.preventDefault();
    if (pilih.length === 0) return setGalat(new Error("Pilih minimal satu komponen yang dikerjakan."));
    setGalat(null); setProses(true);
    try {
      const body = new FormData();
      pilih.forEach((k) => body.append("komponen[]", k));
      body.append("biaya_bengkel", f.biaya_bengkel); body.append("km_saat_ini", f.km_saat_ini);
      await api(`/admin/servis/${id}/selesai`, { method: "POST", body });
      router.push("/admin/servis");
    } catch (err) { setGalat(err); } finally { setProses(false); }
  }

  if (!s) return <>{galat ? <Galat e={galat} /> : <p>Memuat...</p>}</>;
  return (
    <>
      <Link className="kembali" href="/admin/servis">← Kembali ke Servis</Link>
      <div className="kepala-halaman"><div><h1>Selesai servis</h1><span className="abu"><span className="plat">{s.plat_nomor}</span> {s.unit} · masuk {tanggal(s.tgl_perawatan)} · {s.bengkel}</span></div></div>
      <form onSubmit={kirim}>
        <section className="kartu"><h2>Komponen yang dikerjakan</h2><p className="ket">Pilih satu atau lebih.</p>
          <div className="kolom-2">{KOMPONEN.map((k, i) => (
            <div className="cek" key={k}><input type="checkbox" id={`c${i}`} checked={pilih.includes(k)} onChange={(e) => setPilih(e.target.checked ? [...pilih, k] : pilih.filter((x) => x !== k))} /><label htmlFor={`c${i}`}>{k}</label></div>
          ))}</div></section>
        <section className="kartu"><h2>Biaya dan odometer</h2>
          <div className="kolom-2">
            <div><label htmlFor="bk">Biaya bengkel (Rp)</label><input id="bk" type="number" min="0" step="1000" required value={f.biaya_bengkel} onChange={(e) => setF({ ...f, biaya_bengkel: e.target.value })} /></div>
            <div><label htmlFor="odo">Odometer (km)</label><input id="odo" type="number" min={s.km_saat_ini || 0} step="1" required value={f.km_saat_ini} onChange={(e) => setF({ ...f, km_saat_ini: e.target.value })} /></div>
          </div>
          <div className="ringkasan"><div className="baris"><span>Biaya ditagih ke penyewa</span><span>dihitung sistem (dari kerusakan pengembalian)</span></div><div className="baris"><span>Jadwal servis berikutnya</span><span>dihitung dari odometer dan interval</span></div></div>
          <Galat e={galat} />
          <div className="baris jarak"><button className="btn" type="submit" disabled={proses}>Selesai servis</button><Link className="btn garis" href="/admin/servis">Batal</Link></div>
        </section>
      </form>
    </>
  );
}
