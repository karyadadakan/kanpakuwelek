V70 OFFLINE FIX

PENTING: deploy semua file, terutama sw.js.

Setelah deploy:
1. Buka HTTPS situs saat online.
2. DevTools > Application > Service Workers.
3. Centang Update on reload.
4. Reload.
5. Pastikan sw.js v70 aktif.
6. Application > Cache Storage harus menampilkan catatan-shopiput-v70.
7. Di cache tersebut harus ada URL root situs (/).
8. Baru centang Offline dan reload.

V70 tidak bergantung pada /index.html harus bisa diakses terpisah oleh Cloudflare.
Service worker mengambil URL root yang benar-benar dilayani Worker lalu menyimpannya.
Aset tambahan dicache satu per satu agar satu aset yang gagal tidak menggagalkan install.
