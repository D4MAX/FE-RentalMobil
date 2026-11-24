// Menampilkan galat dari API: daftar per field bila 422, selain itu pesan utamanya.
export default function Galat({ e }) {
  if (!e) return null;
  const baris = e.errors ? Object.values(e.errors).flat() : [e.message];
  return <div className="alert galat" role="alert">{baris.map((b, i) => <div key={i}>{b}</div>)}</div>;
}
