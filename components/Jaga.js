"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

// Menjaga rute per peran: belum login ke Login, peran salah ke beranda masing-masing.
export default function Jaga({ role, children }) {
  const { user, siap } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (!siap) return;
    if (!user) router.replace("/masuk");
    else if (user.wajib_ganti && path !== "/admin/ganti-sandi") router.replace("/admin/ganti-sandi");
    else if (user.role !== role) router.replace(user.role === "admin" ? "/admin" : "/");
  }, [siap, user, role, router, path]);
  const boleh = user?.role === role && (!user.wajib_ganti || path === "/admin/ganti-sandi");
  return siap && boleh ? children : null;
}
