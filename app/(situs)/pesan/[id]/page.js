"use client";
import "@/app/css/pesan.css";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, rupiah, tanggal, tglIso } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import Galat from "@/components/Galat";
import Jaga from "@/components/Jaga";

const MALANG_RAYA = ["kota malang", "kabupaten malang", "kota batu"];
const hariIni = new Date();
const besok = tglIso(new Date(hariIni.getTime() + 864e5));
const maks = tglIso(new Date(hariIni.getTime() + 30 * 864e5));

function Isi() {
  const { id } = useParams();
  const q = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [m, setM] = useState(null);
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const [f, setF] = useState({
    jenis_sewa: "dengan_sopir", transmisi: "manual", tgl_mulai: q.get("tgl_mulai") || "", durasi: q.get("durasi") || "1",
    jam_serah: "", tujuan: "", dalam_wilayah: "Ya", lokasi_jemput: "", metode_ambil: "ambil_di_kantor", catatan: "",
    setuju_syarat: false, setuju_syarat_jaminan: false,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  useEffect(() => {
    api(`/katalog/tipe/${id}`, { query: { tgl_mulai: q.get("tgl_mulai"), durasi: q.get("durasi") } })
      .then((r) => {
        setM(r.data);
        const t = r.data.tarif;
        // Pilihan awal mengikuti tarif yang ada pada tipe ini
        setF((x) => ({ ...x, jenis_sewa: t.dengan_sopir ? x.jenis_sewa : "lepas_kunci", transmisi: t.lepas_kunci_manual ? "manual" : "matic" }));
      })
      .catch(setGalat);
  }, [id, q]);

  if (!m) return <main className="wrap">{galat ? <Galat e={galat} /> : <p>Memuat...</p>}</main>;

  const ds = f.jenis_sewa === "dengan_sopir";
  const tarif = ds ? m.tarif.dengan_sopir : m.tarif[`lepas_kunci_${f.transmisi}`];
  const durasi = Math.max(1, Number(f.durasi) || 1);
  const kembali = f.tgl_mulai ? new Date(new Date(f.tgl_mulai).getTime() + (durasi - 1) * 864e5) : null;
  const antar = !ds && f.metode_ambil === "diantar";
  const malang = MALANG_RAYA.includes((user?.kota || "").toLowerCase());
  const trans = [m.tarif.lepas_kunci_manual && "Manual", m.tarif.lepas_kunci_matic && "Matic"].filter(Boolean).join(" / ");

  async function kirim(e) {
    e.preventDefault();
    setGalat(null); setProses(true);
    const body = { id_tipe: m.id, jenis_sewa: f.jenis_sewa, tgl_mulai: f.tgl_mulai, durasi, jam_serah: f.jam_serah, catatan: f.catatan || undefined, setuju_syarat: f.setuju_syarat };
    if (ds) Object.assign(body, { tujuan: f.tujuan, lokasi_jemput: f.lokasi_jemput });
    else Object.assign(body, { transmisi: f.transmisi, metode_ambil: f.metode_ambil, lokasi_jemput: antar ? f.lokasi_jemput : undefined, setuju_syarat_jaminan: f.setuju_syarat_jaminan });
    try { router.push(`/pembayaran/${(await api("/pemesanan", { method: "POST", body })).data.id}`); }
    catch (err) { setGalat(err); setProses(false); }
  }

  return (
    <>
      <section className="hero banner"><h1>PESAN <span>{m.nama.toUpperCase()}</span></h1></section>
      <main className="wrap">
        <Link className="kembali" href="/katalog">← Kembali ke katalog</Link>
        <div className="dua-kolom">
          <section aria-label="Detail mobil">
            <div className="kotak">
              {m.foto.length > 0 && (
                <>
                  {m.foto.map((_, i) => <input key={i} className="radio-foto" type="radio" name="foto" id={`foto${i}`} defaultChecked={i === 0} />)}
                  <div className="foto-besar">{m.foto.map((u, i) => <img key={i} className={`fu fu${i}`} src={u} alt={`${m.nama} foto ${i + 1}`} loading="lazy" />)}</div>
                  <div className="galeri-kecil">{m.foto.map((u, i) => <label key={i} className={`kecil-foto kf${i}`} htmlFor={`foto${i}`}><img src={u} alt={`Foto ${i + 1}`} loading="lazy" /></label>)}</div>
                </>
              )}
              <h2 style={{ marginBottom: 4 }}>{m.merk} {m.nama}</h2>
              {m.tarif.dengan_sopir && <p><b>Dengan sopir:</b> {rupiah(m.tarif.dengan_sopir)}/hari.</p>}
              {trans && <p><b>Lepas kunci:</b> {rupiah(m.tarif.lepas_kunci_manual || m.tarif.lepas_kunci_matic)}/hari.</p>}
              <table className="spek-tabel"><tbody>
                <tr><td>Kursi</td><td>{m.kursi} kursi</td></tr>
                <tr><td>Bahan bakar</td><td style={{ textTransform: "capitalize" }}>{m.bahan_bakar}</td></tr>
                {trans && <tr><td>Transmisi</td><td>{trans}</td></tr>}
                {m.sisa_unit != null && <tr><td>Sisa unit</td><td>{m.sisa_unit}</td></tr>}
              </tbody></table>
              {ds && (
                <>
                  <div className="grid grid-2">
                    <div><p className="tebal">Termasuk:</p><ul className="daftar-tanda"><li>Mobil</li><li>Sopir</li><li>BBM</li></ul></div>
                    <div><p className="tebal">Ditanggung penyewa:</p><ul className="daftar-tanda tidak"><li>Makan sopir</li><li>Tol</li><li>Parkir</li><li>Penginapan sopir</li></ul></div>
                  </div>
                  <p className="kecil abu">Hanya untuk tujuan di Malang dan Batu.</p>
                </>
              )}
            </div>
            <h3 className="jarak-kecil">Ulasan</h3>
            {m.review.length === 0 && <div className="kotak ulasan"><p className="abu">Belum ada ulasan.</p></div>}
            {m.review.map((r, i) => (
              <div className="kotak ulasan" key={i}>
                <div className="bintang">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                {r.komentar && <p>{r.komentar}</p>}
                <div className="penulis"><span className="avatar">{r.nama?.[0]}</span><b>{r.nama}</b></div>
              </div>
            ))}
          </section>

          <form className="kotak" onSubmit={kirim} aria-label="Form pesan">
            <h2 style={{ fontSize: 22 }}>Form Pesan</h2>
            {m.tarif.dengan_sopir && trans ? (
              <div className="field"><label htmlFor="jenis">Jenis sewa</label>
                <select id="jenis" value={f.jenis_sewa} onChange={set("jenis_sewa")}><option value="dengan_sopir">Dengan sopir</option><option value="lepas_kunci">Lepas kunci</option></select></div>
            ) : <p className="kecil">Jenis sewa: <b>{ds ? "Dengan sopir" : "Lepas kunci"}</b></p>}
            <div className="field baris-2">
              <div><label htmlFor="tgl">Tanggal mulai</label><input id="tgl" type="date" min={besok} max={maks} required value={f.tgl_mulai} onChange={set("tgl_mulai")} /></div>
              <div><label htmlFor="dur">Durasi (hari)</label><input id="dur" type="number" min="1" max="30" step="1" required value={f.durasi} onChange={set("durasi")} /></div>
            </div>
            {!ds && trans.includes("/") && (
              <div className="field"><label htmlFor="trans">Transmisi</label>
                <select id="trans" value={f.transmisi} onChange={set("transmisi")}><option value="manual">Manual</option><option value="matic">Matic</option></select></div>
            )}
            {!ds && (
              <div className="field"><label htmlFor="ambil">Pengambilan</label>
                <select id="ambil" value={f.metode_ambil} onChange={set("metode_ambil")}><option value="ambil_di_kantor">Ambil di kantor</option><option value="diantar">Diantar</option></select></div>
            )}
            <div className="field"><label htmlFor="jam">{ds ? "Jam jemput" : antar ? "Jam antar" : "Jam ambil"}</label>
              <input id="jam" type="time" required value={f.jam_serah} onChange={set("jam_serah")} {...(!ds && { min: "07:00", max: "21:00" })} />
              {!ds && <p className="hint">Antara 07.00 dan 21.00.</p>}</div>
            {ds && (
              <>
                <div className="field"><label htmlFor="tujuan">Tujuan perjalanan</label>
                  <input id="tujuan" type="text" maxLength={200} required placeholder="Batu, Malang kota" value={f.tujuan} onChange={set("tujuan")} />
                  <p className="hint">Boleh lebih dari satu, pisahkan dengan koma.</p></div>
                <div className="field"><label htmlFor="wilayah">Semua tujuan di Malang dan Batu?</label>
                  <select id="wilayah" value={f.dalam_wilayah} onChange={set("dalam_wilayah")}><option>Ya</option><option>Tidak</option></select>
                  <p className="hint">Jika tidak, hubungi admin lewat <a className="tautan" href="https://wa.me/6281234567890">WhatsApp</a>.</p></div>
              </>
            )}
            {(ds || antar) && <div className="field"><label htmlFor="lokasi">{ds ? "Lokasi jemput" : "Lokasi antar"}</label><input id="lokasi" type="text" maxLength={200} required placeholder="Alamat lengkap" value={f.lokasi_jemput} onChange={set("lokasi_jemput")} /></div>}
            {!ds && (
              <>
                <div className="syarat"><p className="tebal">Syarat jaminan lepas kunci</p>
                  <ol className="daftar huruf"><li>Menyertakan jaminan KTP asli.</li><li>Menyertakan jaminan SIM C asli.</li><li>Menyertakan jaminan KTM, KK, NPWP, BPJS, atau paspor.</li>
                    <li>{malang ? "Menyertakan sepeda motor dan STNK (khusus penyewa domisili Malang)." : "Menyertakan bukti booking transportasi dan hotel (khusus penyewa domisili luar kota)."}</li></ol>
                  <p className="kecil abu">Butir terakhir berlaku karena domisili profil Anda: {user?.kota}. <Link className="tautan" href="/profil">Ubah di Profil</Link>. Admin memeriksa dokumen fisik saat serah terima.</p></div>
                <div className="cek"><input type="checkbox" id="setuju-jaminan" required checked={f.setuju_syarat_jaminan} onChange={set("setuju_syarat_jaminan")} /><label htmlFor="setuju-jaminan">Saya sanggup memenuhi syarat jaminan di atas.</label></div>
              </>
            )}
            <div className="field"><label htmlFor="catatan">Catatan (opsional)</label><textarea id="catatan" maxLength={300} value={f.catatan} onChange={set("catatan")} /></div>
            <div className="cek"><input type="checkbox" id="setuju-sk" required checked={f.setuju_syarat} onChange={set("setuju_syarat")} /><label htmlFor="setuju-sk">Saya menyetujui <Link className="tautan" href="/syarat" target="_blank" rel="noopener">Syarat dan Ketentuan</Link>.</label></div>
            <div className="ringkasan" aria-label="Ringkasan biaya">
              <div className="baris"><span>Tarif × durasi</span><span>{rupiah(tarif)} × {durasi} hari</span></div>
              <div className="baris"><span>Tanggal kembali</span><span>{kembali ? `${tanggal(kembali)}, 23.59` : "-"}</span></div>
              <div className="baris total"><span>Total</span><span>{rupiah(tarif * durasi)}</span></div>
            </div>
            <Galat e={galat} />
            {galat?.code === "PESANAN_MENUNGGU_ADA" && <p><Link className="tautan" href="/riwayat">Lihat pesanan yang menunggu pembayaran</Link></p>}
            {galat?.code === "TAGIHAN_BELUM_LUNAS" && <p><Link className="tautan" href="/riwayat">Lihat tagihan di riwayat</Link></p>}
            <button className="btn blok" type="submit" disabled={proses || (ds && f.dalam_wilayah === "Tidak")}>{proses ? "Memproses..." : "Buat Pesanan"}</button>
            <p className="hint kecil abu" style={{ marginTop: 8 }}>Metode pembayaran dipilih di pop-up pembayaran.</p>
          </form>
        </div>
      </main>
    </>
  );
}

export default function Pesan() { return <Jaga role="user"><Suspense><Isi /></Suspense></Jaga>; }
