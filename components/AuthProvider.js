"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "@/lib/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    if (!getToken()) { setSiap(true); return; }
    api("/me").then((r) => setUser(r.data)).catch((e) => {
        // Admin dengan kata sandi sementara: boleh masuk, tetapi hanya ke halaman ganti kata sandi.
        if (e.code === "GANTI_PASSWORD_DULU") setUser({ nama: "Admin", role: "admin", wajib_ganti: true });
        else setToken(null);
      }).finally(() => setSiap(true));
  }, []);

  async function login(email, password) {
    const r = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(r.data.token);
    setUser({ ...r.data.user, wajib_ganti: r.data.wajib_ganti_password });
    return r.data;
  }
  async function logout() {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    setToken(null); setUser(null);
  }
  return <Ctx.Provider value={{ user, setUser, siap, login, logout }}>{children}</Ctx.Provider>;
}
