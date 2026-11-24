import Link from "next/link";

export default function Footer() {
  return (
<footer className="footer">
  <div className="footer-isi">
    <div className="footer-brand">
      <Link className="footer-logo" href="/"><img src="/img/gantengnyo.png" alt="Logo RentalMalang" /><span>GANTENGNYAJATIMGROUP</span></Link>
      <p>Layanan sewa mobil dengan sopir atau lepas kunci, siap menemani perjalananmu di Malang, Batu, dan sekitarnya.</p>
      <div className="footer-sosial">
        <Link href="https://wa.me/6281234567890" aria-label="WhatsApp"><img src="/img/ikon-wa.png" alt="WhatsApp" /></Link>
        <Link href="https://www.instagram.com/" aria-label="Instagram"><img src="/img/ig.png" alt="Instagram" /></Link>
      </div>
    </div>
    <div className="footer-kolom">
      <h4>Perusahaan</h4>
      <Link href="/about">Tentang Kami</Link>
      <Link href="/syarat">Syarat dan Ketentuan</Link>
      <Link href="/privasi">Kebijakan Privasi</Link>
    </div>
    <div className="footer-kolom">
      <h4>Bantuan</h4>
      <Link href="/faq">FAQ</Link>
      <Link href="https://wa.me/6281234567890">Hubungi Admin</Link>
      <Link href="/katalog">Katalog Mobil</Link>
    </div>
    <div className="footer-kolom">
      <h4>Kontak</h4>
      <p>PT GantengnyaJatim Group<br />Kota Malang, Jawa Timur</p>
      <p>WhatsApp: 0812-3456-7890<br />Email: gantengnyajatimgroupindonesia@gmail.com</p>
      <p>Jam operasional 07.00 sampai 21.00 setiap hari.</p>
    </div>
  </div>
  <div className="footer-bawah">© 2026 RentalMalang. Hak Cipta Dilindungi.</div>
</footer>
  );
}
