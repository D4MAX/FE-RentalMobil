"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import Galat from "./Galat";
import ModalAdmin from "./ModalAdmin";

// Pop-up tiga pilihan saat data bentrok dengan data di tempat sampah (TIPE_ADA_DI_SAMPAH / UNIT_ADA_DI_SAMPAH).
// onPulih: data lama dipulihkan, tidak perlu simpan ulang. onUlang: data lama dihapus permanen, kirim ulang permintaan.
export default function PopupSampah({ e, onPulih, onUlang, onTutup }) {
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const d = e?.body?.detail;
  const buka = !!d && (e.code === "TIPE_ADA_DI_SAMPAH" || e.code === "UNIT_ADA_DI_SAMPAH");

  async function jalan(fn, lanjut) {
    setGalat(null); setProses(true);
    try { await fn(); lanjut(); } catch (err) { setGalat(err); } finally { setProses(false); }
  }
  const pulihkan = () => jalan(() => api(`/admin/${d.jenis}/${d.id}/pulihkan`, { method: "POST" }), onPulih);
  const hapus = () => jalan(() => api(`/admin/sampah/${d.jenis}/${d.id}`, { method: "DELETE", query: { konfirmasi: "true" } }), onUlang);

  return (
    <ModalAdmin open={buka} judul="Data lama ada di tempat sampah">
      {buka && (
        <>
          <p>{e.message}</p>
          <p className="kecil abu">{d.jenis === "tipe" ? `${d.merk} ${d.nama}` : d.plat_nomor} dihapus {new Date(d.dihapus_pada).toLocaleDateString("id-ID")}{d.sisa_hari != null && `, sisa ${d.sisa_hari} hari sebelum dibuang permanen`}.</p>
          <Galat e={galat} />
          <div className="baris">
            <button className="btn garis sm" onClick={onTutup}>Batal</button>
            {!d.punya_riwayat && <button className="btn bahaya sm" disabled={proses} onClick={() => confirm("Hapus permanen tidak bisa dibatalkan. Lanjutkan?") && hapus()}>Hapus permanen lalu buat baru</button>}
            <button className="btn sm" disabled={proses} onClick={pulihkan}>Pulihkan data lama</button>
          </div>
        </>
      )}
    </ModalAdmin>
  );
}
