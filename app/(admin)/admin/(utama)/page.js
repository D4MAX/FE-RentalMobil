"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BADGE, LABEL } from "@/lib/status";
import Galat from "@/components/Galat";

const JENIS = { pengajuan_pembatalan: "Proses pengajuan pembatalan", refund_transfer: "Transfer refund", serahkan_unit: "Serahkan unit", pengembalian_jatuh_tempo: "Selesaikan pesanan", tagihan_belum_dibayar: "Tagih tagihan tambahan", jaminan_siap_dikembalikan: "Kembalikan jaminan" };
const STATUS_SERVIS = { perlu_servis: ["perlu", "Perlu servis"], segera: ["segera", "Segera"], aman: ["aman", "Aman"] };

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [galat, setGalat] = useState(null);
  useEffect(() => { api("/admin/dashboard").then((r) => setD(r.data)).catch(setGalat); }, []);

  const h = d?.hitungan;
  return (
    <>
      <header><h1>Dashboard Admin</h1><p>Ringkasan operasional hari ini.</p></header>
      <Galat e={galat} />
      {!d && !galat && <p>Memuat...</p>}
      {d && (
        <>
          <div className="grid grid-4">
            {["menunggu_pembayaran", "dikonfirmasi", "berjalan", "pengajuan_pembatalan"].map((s) => (
              <div className="kartu stat" key={s}><div className="label">{LABEL[s]}</div><div className="angka">{h[s]}</div></div>
            ))}
          </div>
          <div className="grid grid-2 jarak">
            <div className="kartu stat"><div className="label">Unit tersedia</div><div className="angka">{h.unit_tersedia}</div><p className="ket">siap dipesan</p></div>
            <div className="kartu stat"><div className="label">Unit dalam servis</div><div className="angka">{h.unit_dalam_servis}</div><p className="ket">tidak muncul di katalog</p></div>
          </div>
          <section className="kartu jarak"><h2>Perlu tindakan</h2><p className="ket">Pesanan yang menunggu keputusan atau pengerjaan admin.</p>
            {d.tugas_admin.length === 0 ? <p className="abu">Tidak ada tindakan yang tertunda.</p> : (
              <div className="tabel-bungkus"><table className="tabel"><thead><tr><th>Tindakan</th><th>Keterangan</th><th></th></tr></thead><tbody>
                {d.tugas_admin.map((t, i) => (
                  <tr key={i}><td className="tebal">{JENIS[t.jenis] || t.jenis.replaceAll("_", " ")}</td><td>{t.keterangan}</td><td><Link className="tautan" href={`/admin/pesanan/${t.id}`}>Buka</Link></td></tr>
                ))}
              </tbody></table></div>
            )}
          </section>
          <section className="kartu"><h2>Pengingat servis</h2><p className="ket">Status dihitung dari odometer dan jadwal servis. <Link className="tautan" href="/admin/servis">Buka halaman Servis</Link></p>
            {d.pengingat_servis.length === 0 ? <p className="abu">Semua unit aman.</p> : (
              <div className="tabel-bungkus"><table className="tabel"><tbody>
                {d.pengingat_servis.map((s) => (
                  <tr key={s.id_kendaraan}><td className="tebal"><span className="plat">{s.plat_nomor}</span></td><td><span className={`badge ${STATUS_SERVIS[s.status]?.[0]}`}>{STATUS_SERVIS[s.status]?.[1] || s.status}</span></td></tr>
                ))}
              </tbody></table></div>
            )}
          </section>
        </>
      )}
    </>
  );
}
