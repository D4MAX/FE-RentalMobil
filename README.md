# FE Rental Mobil (Next.js, JavaScript)

Tampilan mengikuti repo HTML-RentalMobil (CSS disalin apa adanya ke `app/css`, gambar ke `public/`), data dari API Laravel (`BE-RentalMobil`).

## Menjalankan
    npm install
    cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
    npm run dev                        # http://localhost:3000

Di BE: `FRONTEND_URL=http://localhost:3000` dan izinkan origin itu di `config/cors.php`.

## Sudah ada
- Layout (Navbar, Footer), Beranda, Masuk (login Sanctum), Katalog (cari ke `/katalog/tipe`)
- `lib/api.js` (pemanggil API + token), `components/AuthProvider.js` (login, logout, `/me`)

## Aturan CSS
`index.css` dimuat global di `app/layout.js`; CSS lain (katalog, pesan, riwayat, admin) diimpor di halaman masing-masing karena beberapa berisi aturan `.menu` yang bentrok bila dimuat bersamaan.

## Berikutnya (urut)
daftar + verifikasi email, lupa/reset sandi, detail & form pesan (`/pesan/[id]`, POST `/pemesanan`), pembayaran Midtrans, riwayat + detail, profil, lalu admin.
