"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Sub({ children }) {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/admin"><img src="/img/logo.png" alt="Dashboard admin" /></Link>
        <span className="peran">Admin Rental</span>
        <button className="btn garis sm" onClick={async () => { await logout(); router.push("/masuk"); }}>Keluar</button>
      </header>
      <main className="halaman">{children}</main>
    </>
  );
}
