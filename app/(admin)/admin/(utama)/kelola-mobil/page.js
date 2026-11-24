"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, rupiah } from "@/lib/api";
import Galat from "@/components/Galat";
import ModalAdmin from "@/components/ModalAdmin";

const STATUS_UNIT = { tersedia: ["tersedia", "Tersedia"], disewa: ["disewa", "Disewa"], dalam_perawatan: ["servis", "Dalam servis"], tidak_tersedia: ["netral", "Tidak tersedia"] };

export default function KelolaMobil() {
  const [tipe, setTipe] = useState(null);
  const [unit, setUnit] = useState(null);
  const [galat, setGalat] = useState(null);
  const [aksi, setAksi] = useState(null); // { jenis: "tipe"|"unit"|"status", item, konfirmasi }
  const [proses, setProses] = useState(false);

  const muat = useCallback(() => {
    api("/admin/tipe", { query: { per_page: 100 } }).then((r) => setTipe(r.data)).catch(setGalat);
    api("/admin/unit", { query: { per_page: 100 } }).then((r) => setUnit(r.data)).catch(setGalat);
  }, []);
  useEffect(() => { muat(); }, [muat]);

  async function jalankan(konfirmasi) {
    const { jenis, item } = aksi;
    setProses(true); setGalat(null);
    try {
      if (jenis === "tipe") await api(`/admin/tipe/${item.id}`, { method: "DELETE" });
      else if (jenis === "unit") await api(`/admin/unit/${item.id}`, { method: "DELETE", body: konfirmasi ? { konfirmasi: true } : undefined });
      else await api(`/admin/unit/${item.id}/status`, { method: "PATCH", body: { status: item.status === "tersedia" ? "tidak_tersedia" : "tersedia", konfirmasi: konfirmasi || undefined } });
      setAksi(null); muat();
    } catch (e) {
      if (e.code === "PESANAN_TERDAMPAK") setAksi({ ...aksi, terdampak: e.body.pesanan_terdampak || [], pesan: e.message });
      else { setGalat(e); setAksi(null); }
    } finally { setProses(false); }
  }

  const judul = { tipe: "Hapus tipe?", unit: "Hapus unit?", status: "Ubah status unit?" }[aksi?.jenis];
  return (
    <>
      <header><h1>Kelola Mobil</h1><p>Menambahkan atau mengedit info mobil.</p></header>
      <div className="baris" style={{ marginBottom: 16 }}>
        <Link className="btn" href="/admin/tipe/baru">Tambah tipe</Link>
        <Link className="btn garis" href="/admin/unit/baru">Tambah unit</Link>
        <Link className="btn garis" href="/admin/sampah">Tempat sampah</Link>
      </div>
      <Galat e={galat} />
      <section className="kartu"><h2>Tipe mobil</h2><p className="ket">Tarif per hari. Tipe yang masih punya unit atau pemesanan tidak bisa dihapus.</p>
        <div className="tabel-bungkus"><table className="tabel"><thead><tr><th></th><th>Tipe</th><th>Merk</th><th>Kursi</th><th>BBM</th><th className="angka">Dengan sopir</th><th className="angka">Lepas kunci manual</th><th className="angka">Lepas kunci matic</th><th>Unit</th><th></th></tr></thead><tbody>
          {!tipe && <tr><td colSpan={10}>Memuat...</td></tr>}
          {tipe?.map((t) => (
            <tr key={t.id}>
              <td>{t.foto[0] && <img className="thumb" src={t.foto[0].url} alt="" />}</td>
              <td className="tebal">{t.nama}</td><td>{t.merk}</td><td>{t.kursi}</td><td style={{ textTransform: "capitalize" }}>{t.bahan_bakar}</td>
              <td className="angka">{t.harga_sopir_per_hari ? rupiah(t.harga_sopir_per_hari) : "-"}</td>
              <td className="angka">{t.harga_lepas_kunci_manual ? rupiah(t.harga_lepas_kunci_manual) : "-"}</td>
              <td className="angka">{t.harga_lepas_kunci_matic ? rupiah(t.harga_lepas_kunci_matic) : "-"}</td>
              <td>{t.jumlah_unit}</td>
              <td><Link className="tautan" href={`/admin/tipe/${t.id}`}>Ubah</Link> · <a className="tautan" href="#" onClick={(e) => { e.preventDefault(); setAksi({ jenis: "tipe", item: t }); }}>Hapus</a></td>
            </tr>
          ))}
        </tbody></table></div>
      </section>
      <section className="kartu"><h2>Unit mobil</h2><p className="ket">Status Disewa mengikuti pesanan Berjalan. Unit yang sedang disewa tidak bisa diubah statusnya.</p>
        <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Plat nomor</th><th>Tipe</th><th>Tahun</th><th>Warna</th><th>Transmisi</th><th className="angka">Odometer</th><th>Status</th><th></th></tr></thead><tbody>
          {!unit && <tr><td colSpan={8}>Memuat...</td></tr>}
          {unit?.map((u) => {
            const [kelas, label] = STATUS_UNIT[u.status_tampil] || ["netral", u.status_tampil];
            const bisaUbah = u.status === "tersedia" || u.status === "tidak_tersedia";
            return (
              <tr key={u.id}>
                <td><span className="plat">{u.plat_nomor}</span></td><td>{u.tipe.nama}</td><td>{u.tahun}</td><td>{u.warna}</td><td style={{ textTransform: "capitalize" }}>{u.transmisi}</td>
                <td className="angka">{Number(u.km_terakhir).toLocaleString("id-ID")} km</td><td><span className={`badge ${kelas}`}>{label}</span></td>
                <td><Link className="tautan" href={`/admin/unit/${u.id}`}>Ubah</Link>
                  {bisaUbah && !u.sedang_disewa && <> · <a className="tautan" href="#" onClick={(e) => { e.preventDefault(); setAksi({ jenis: "status", item: u }); }}>{u.status === "tersedia" ? "Tandai tidak tersedia" : "Tandai tersedia"}</a></>}
                  {" · "}<a className="tautan" href="#" onClick={(e) => { e.preventDefault(); setAksi({ jenis: "unit", item: u }); }}>Hapus</a></td>
              </tr>
            );
          })}
        </tbody></table></div>
      </section>

      <ModalAdmin open={!!aksi} judul={judul}>
        {aksi?.terdampak ? (
          <>
            <p>{aksi.pesan}</p>
            <ul>{aksi.terdampak.map((p) => <li key={p.id}>{p.nama} ({p.tgl_mulai} sampai {p.tgl_kembali})</li>)}</ul>
            <p>Tetap lanjutkan?</p>
          </>
        ) : <p>{aksi?.jenis === "tipe" ? "Yakin hapus tipe ini? Tipe yang masih punya unit atau pemesanan ditolak." : aksi?.jenis === "unit" ? "Yakin hapus unit ini? Data masuk ke tempat sampah dan bisa dipulihkan." : `Ubah status ${aksi?.item.plat_nomor}?`}</p>}
        <div className="baris"><button className="btn garis sm" onClick={() => setAksi(null)}>Kembali</button><button className="btn bahaya sm" disabled={proses} onClick={() => jalankan(!!aksi?.terdampak)}>{aksi?.terdampak ? "Ya, lanjutkan" : "Ya"}</button></div>
      </ModalAdmin>
    </>
  );
}
