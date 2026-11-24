// Pop-up gaya admin.css (di sana hanya ada :target), ditampilkan lewat prop open.
export default function ModalAdmin({ open, judul, children }) {
  return (
    <div className="modal" style={open ? { display: "flex" } : undefined} role="dialog" aria-modal="true" aria-label={judul}>
      <div className="isi"><h3>{judul}</h3>{children}</div>
    </div>
  );
}
