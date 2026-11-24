"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const MENU = [["/admin", "Dashboard"], ["/admin/kelola-mobil", "Kelola Mobil"], ["/admin/pesanan", "Pesanan"], ["/admin/servis", "Servis"], ["/admin/laporan", "Laporan"], ["/admin/sampah", "Sampah"]];

export default function Utama({ children }) {
  const path = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const aktif = (h) => (h === "/admin" ? path === h : path.startsWith(h));
  return (
    <div className="app">
      <aside className="side">
        <Link className="brand" href="/admin"><img src="/img/logo.png" alt="" /><span>Gantengnya Admin<small>Rental Mobil</small></span></Link>
        <nav aria-label="Menu admin">{MENU.map(([h, t]) => <Link key={h} className={aktif(h) ? "aktif" : undefined} href={h}>{t}</Link>)}</nav>
        <div className="keluar"><a href="/" onClick={async (e) => { e.preventDefault(); await logout(); router.push("/masuk"); }}>Keluar</a></div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
