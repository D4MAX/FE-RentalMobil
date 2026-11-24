"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { WILAYAH } from "@/lib/wilayah";
import { useAuth } from "@/components/AuthProvider";
import Galat from "@/components/Galat";
import GantiSandi from "@/components/GantiSandi";

function Isi() {
  const { user, setUser } = useAuth();
  const admin = user.role === "admin";
  const [f, setF] = useState(null);
  const [foto, setFoto] = useState(null);
  const [hapusFoto, setHapusFoto] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState(null);
  const [ok, setOk] = useState(false);
  const [proses, setProses] = useState(false);

  useEffect(() => { api("/profil").then((r) => setF(r.data)).catch(setGalat); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value, ...(k === "provinsi" && { kota: "" }) });

  async function simpan() {
    setGalat(null); setOk(false); setProses(true);
    try {
      const body = new FormData();
      body.append("nama", f.nama);
      if (!admin) ["no_hp", "provinsi", "kota"].forEach((k) => body.append(k, f[k] || ""));
      if (foto) body.append("foto", foto);
      else if (hapusFoto) body.append("hapus_foto", "true");
      const r = (await api("/profil", { method: "POST", body })).data;
      setF(r); setUser({ ...user, ...r }); setFoto(null); setHapusFoto(false); setOk(true);
    } catch (err) { setGalat(err); } finally { setProses(false); setKonfirmasi(false); }
  }

  if (!f) return <main className="wrap wrap-sempit">{galat ? <Galat e={galat} /> : <p>Memuat...</p>}</main>;
  const inisial = f.nama?.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <main className="wrap wrap-sempit">
      <div className="kotak">
        <form onSubmit={(e) => { e.preventDefault(); setKonfirmasi(true); }}>
          <div className="baris" style={{ marginBottom: 16 }}>
            {f.foto && !hapusFoto
              ? <img src={f.foto} alt="Foto profil" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <span className="avatar" style={{ width: 72, height: 72, fontSize: 24, flexShrink: 0 }}>{inisial}</span>}
            <div className="field" style={{ margin: 0 }}><label htmlFor="foto">Ganti Foto</label>
              <input id="foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFoto(e.target.files[0] || null)} />
              <p className="hint">jpg, png, atau webp, maksimal 2 MB.</p>
              {f.foto && <label className="cek"><input type="checkbox" checked={hapusFoto} onChange={(e) => setHapusFoto(e.target.checked)} /> Hapus foto</label>}</div>
          </div>
          <div className="field"><label htmlFor="nama">Nama lengkap</label><input id="nama" type="text" maxLength={100} required value={f.nama} onChange={set("nama")} /></div>
          <div className="field"><span className="label">Email</span><p style={{ margin: 0 }}>{f.email}</p><p className="hint">Email tidak bisa diubah.</p></div>
          {!admin && (
            <>
              <div className="field"><label htmlFor="wa">Nomor WhatsApp</label><input id="wa" type="tel" required pattern="(08|\+62)[0-9]{8,13}" title="Nomor Indonesia, diawali 08 atau +62" value={f.no_hp || ""} onChange={set("no_hp")} /></div>
              <div className="field"><label htmlFor="provinsi">Provinsi</label>
                <select id="provinsi" required value={f.provinsi || ""} onChange={set("provinsi")}><option value="">Pilih provinsi</option>{Object.keys(WILAYAH).map((p) => <option key={p}>{p}</option>)}</select></div>
              <div className="field"><label htmlFor="kota">Kota / Kabupaten</label>
                <select id="kota" required value={f.kota || ""} onChange={set("kota")}><option value="">Pilih kota</option>{(WILAYAH[f.provinsi] || []).map((k) => <option key={k}>{k}</option>)}</select>
                <p className="hint">Menentukan syarat jaminan untuk sewa lepas kunci.</p></div>
            </>
          )}
          <Galat e={galat} />
          {ok && <div className="alert sukses">Profil diperbarui.</div>}
          <div className="baris"><button className="btn" type="submit">Simpan Perubahan</button><Link className="btn garis" href={admin ? "/admin" : "/"}>Batal</Link></div>
        </form>
      </div>
      <GantiSandi />
      <div className={`modal${konfirmasi ? " tampil" : ""}`} role="dialog" aria-modal="true" aria-label="Konfirmasi simpan">
        <div className="isi"><h3>Simpan perubahan?</h3><p>Yakin simpan perubahan?</p>
          <div className="baris"><button className="btn garis sm" onClick={() => setKonfirmasi(false)}>Kembali</button><button className="btn sm" disabled={proses} onClick={simpan}>Ya, simpan</button></div></div>
      </div>
    </main>
  );
}

export default function Profil() {
  const { user, siap } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (siap && !user) router.replace("/masuk");
    else if (user?.wajib_ganti) router.replace("/admin/ganti-sandi");
  }, [siap, user, router]);
  return user && !user.wajib_ganti ? <Isi /> : null;
}
