"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const cls = (p) => (path === p ? "aktif" : undefined);
  const inisial = user?.nama?.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <nav className="nav">
      <Link className="logo" href="/"><img src="/img/logo.png" alt="Logo RentalMalang" /> GANTENGNYAJATIMGROUP</Link>
      <input type="checkbox" id="burger-cek" className="burger-cek" aria-hidden="true" />
      <label className="burger" htmlFor="burger-cek" aria-label="Buka menu">☰</label>
      <div className="menu" id="menu">
        <Link className={cls("/")} href="/">Home</Link>
        <Link className={cls("/about")} href="/about">About Us</Link>
        <Link className={cls("/katalog")} href="/katalog">Car</Link>
        {user && <Link className={cls("/riwayat")} href="/riwayat">Riwayat Pemesanan</Link>}
        <div className="kanan">
          {user ? (
            <>
              <Link className="nama-user" href="/profil"><span className="avatar">{inisial}</span>{user.nama}</Link>
              <button className="btn garis" onClick={logout}>Keluar</button>
            </>
          ) : (
            <>
              <Link className="btn garis" href="/masuk">Masuk</Link>
              <Link className="btn" href="/daftar">Daftar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
