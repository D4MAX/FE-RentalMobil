"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import GantiSandi from "@/components/GantiSandi";

export default function GantiSandiAdmin() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  return (
    <div className="halaman" style={{ maxWidth: 480, padding: 0 }}>
      {user.wajib_ganti && <div className="alert info">Anda masuk dengan kata sandi sementara. Buat kata sandi baru sebelum melanjutkan.</div>}
      <GantiSandi admin judul="Ganti kata sandi" onSukses={() => { setUser({ ...user, wajib_ganti: false }); setTimeout(() => router.push("/admin"), 800); }} />
    </div>
  );
}
