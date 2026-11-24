"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import Galat from "@/components/Galat";
import ModalAdmin from "@/components/ModalAdmin";

const tgl = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function Sampah() {
  const [d, setD] = useState(null);
  const [galat, setGalat] = useState(null);
  const [hapus, setHapus] = useState(null); // { jenis, item }
  const [proses, setProses] = useState(false);
  const muat = useCallback(() => api("/admin/sampah").then((r) => setD(r.data)).catch(setGalat), []);
  useEffect(() => { muat(); }, [muat]);

  async function jalan(fn) {
    setGalat(null); setProses(true);
    try { await fn(); setHapus(null); await muat(); } catch (e) { setGalat(e); setHapus(null); } finally { setProses(false); }
  }
  const pulihkan = (jenis, id) => jalan(() => api(`/admin/${jenis}/${id}/pulihkan`, { method: "POST" }));
  const hapusPermanen = () => jalan(() => api(`/admin/sampah/${hapus.jenis}/${hapus.item.id}`, { method: "DELETE", query: { konfirmasi: "true" } }));
  const sisa = (x) => (x.sisa_hari == null ? "Tidak dibuang otomatis" : `${x.sisa_hari} hari lagi`);
  const aksi = (jenis, x) => (
    <td><a className="tautan" href="#" onClick={(e) => { e.preventDefault(); pulihkan(jenis, x.id); }}>Pulihkan</a>
      {!x.punya_riwayat && jenis === "unit" || jenis === "tipe" ? <> · <a className="tautan" href="#" onClick={(e) => { e.preventDefault(); setHapus({ jenis, item: x }); }}>Hapus permanen</a></> : null}</td>
  );

  return (
    <>
      <header><h1>Tempat Sampah</h1><p>Tipe dan unit yang dihapus bisa dipulihkan{d && ` sebelum dibuang otomatis setelah ${d.hari_sampah} hari`}.</p></header>
      <Galat e={galat} />
      {!d && !galat && <p>Memuat...</p>}
      {d && (
        <>
          <section className="kartu"><h2>Tipe</h2>
            {d.tipe.length === 0 ? <p className="abu">Tidak ada tipe di tempat sampah.</p> : (
              <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Tipe</th><th>Merk</th><th>Unit di sampah</th><th>Dihapus</th><th>Sisa</th><th></th></tr></thead><tbody>
                {d.tipe.map((t) => <tr key={t.id}><td className="tebal">{t.nama}</td><td>{t.merk}</td><td>{t.jumlah_unit_di_sampah}</td><td>{tgl(t.dihapus_pada)}</td><td>{sisa(t)}</td>{aksi("tipe", t)}</tr>)}
              </tbody></table></div>
            )}
          </section>
          <section className="kartu"><h2>Unit</h2>
            {d.unit.length === 0 ? <p className="abu">Tidak ada unit di tempat sampah.</p> : (
              <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Plat nomor</th><th>Tipe</th><th>Tahun</th><th>Dihapus</th><th>Sisa</th><th></th></tr></thead><tbody>
                {d.unit.map((u) => <tr key={u.id}><td><span className="plat">{u.plat_nomor}</span></td><td>{u.tipe.nama}{u.tipe.terhapus && " (di sampah)"}</td><td>{u.tahun}</td><td>{tgl(u.dihapus_pada)}</td><td>{sisa(u)}</td>{aksi("unit", u)}</tr>)}
              </tbody></table></div>
            )}
            <p className="hint">Unit yang pernah dipakai pesanan, serah terima, atau servis tidak bisa dihapus permanen.</p>
          </section>
        </>
      )}
      <ModalAdmin open={!!hapus} judul="Hapus permanen?">
        <p>{hapus && (hapus.jenis === "tipe" ? `${hapus.item.merk} ${hapus.item.nama}` : hapus.item.plat_nomor)} akan dihapus permanen dan <b>tidak bisa dibatalkan</b>.</p>
        <div className="baris"><button className="btn garis sm" onClick={() => setHapus(null)}>Kembali</button><button className="btn bahaya sm" disabled={proses} onClick={hapusPermanen}>Ya, hapus permanen</button></div>
      </ModalAdmin>
    </>
  );
}
