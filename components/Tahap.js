import { TAHAP, tahapAktif } from "@/lib/status";

export default function Tahap({ status }) {
  const n = tahapAktif(status);
  return <div className="tahap" aria-label="Tahapan pesanan">{TAHAP.map((t, i) => <span key={t}><i className={i < n ? "on" : undefined}></i>{t}</span>)}</div>;
}
