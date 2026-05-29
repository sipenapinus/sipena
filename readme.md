LANJUTKAN DAN KEMBANGKAN aplikasi existing bernama “SIPENA PINUS” (Sistem Monitoring dan Pengendalian Produksi Getah).



PENTING:

\- JANGAN membuat project baru dari nol.

\- Gunakan project existing sebagai dasar pengembangan.

\- Pertahankan UI, flow utama, dan konsep existing.

\- Fokus pada refactor arsitektur data, sistem monitoring, dashboard, histori, dan pelaporan.

\- Sistem harus realistis digunakan operasional Perhutani.

\- Sistem harus ringan, mobile friendly, scalable, dan mudah digunakan di lapangan.

\- Pertahankan sistem offline existing dan kembangkan menjadi lebih stabil.



====================================================

KONSEP UTAMA SISTEM

====================================================



SIPENA PINUS adalah:



“Sistem Monitoring, Pengendalian, Histori, dan Pelaporan Produksi Getah Berbasis Hierarki Wilayah dan Periode Produksi Perhutani.”



Sistem digunakan untuk:

\- monitoring produksi getah,

\- monitoring target vs realisasi,

\- monitoring aktivitas penyadap,

\- pengendalian operasional produksi,

\- histori produksi,

\- dashboard monitoring,

\- pelaporan produksi,

\- digitalisasi operasional produksi getah Perhutani.



====================================================

KONSEP PERIODE PRODUKSI

====================================================



Dalam 1 bulan terdapat 2 periode produksi:



PERIODE 1

Tanggal 1 – 15



PERIODE 2

Tanggal 16 – akhir bulan



Semua data:

\- target produksi,

\- RO,

\- realisasi,

\- dashboard,

\- histori,

\- laporan,

harus berbasis periode produksi.



====================================================

KONSEP ALUR PRODUKSI

====================================================



====================================================

1\. TOP DOWN (Perencanaan / Target / RO)

====================================================



ASPER/BKPH

↓

KRPH/RPH

↓

TPG

↓

Mandor

↓

Penyadap



RO dan target produksi turun dari atas ke bawah.



====================================================

2\. BOTTOM UP (Realisasi Produksi)

====================================================



Penyadap

↓

Mandor

↓

TPG

↓

KRPH/RPH

↓

ASPER/BKPH



Realisasi produksi naik dari bawah ke atas secara otomatis.



====================================================

KONSEP TARGET PRODUKSI

====================================================



RO dapat diinput:

\- di awal periode berjalan,

ATAU

\- di akhir periode sebelumnya untuk periode berikutnya.



RO tersedia pada level:

\- penyadap,

\- mandor,

\- TPG,

\- KRPH/RPH,

\- Asper/BKPH.



Sistem harus:

\- menghitung total otomatis,

\- melakukan agregasi otomatis,

\- membandingkan target vs realisasi,

\- menghitung persentase capaian,

\- menampilkan subtotal otomatis per wilayah.



====================================================

STRUKTUR HIERARKI WILAYAH

====================================================



Gunakan struktur wilayah operasional Perhutani:



BKPH

→ RPH

→ TPG

→ Petak

→ Anak Petak

→ Penyadap



Semua transaksi wajib terhubung ke struktur wilayah tersebut.



====================================================

CONTOH STRUKTUR NYATA

====================================================



BKPH Bantarkawung



RPH Cikuning

TPG:

\- Cikuning

\- Terlaya

\- Jipang

\- Bangbayang

\- Mayana



RPH TB. Serang

TPG:

\- Legok

\- Cukanggaleh

\- Bantarkawung

\- Samudra

\- Tegongan

\- Lemahngebul



RPH Telaga

TPG:

\- Parasi

\- Tanjung



RPH Banjarsari

TPG:

\- Banjarsari



RPH Kalinusu

TPG:

\- Kalijurang

\- Karangdempul

\- Hilir



Gunakan struktur wilayah dinamis dan scalable.



====================================================

MASTER DATA

====================================================



Semua master data:

\- editable,

\- fleksibel,

\- memiliki histori,

\- tidak dihapus permanen,

\- menggunakan status aktif/nonaktif.



====================================================

MASTER BKPH

====================================================



Field:

\- id\_bkph

\- kode\_bkph

\- nama\_bkph

\- status



1 BKPH memiliki banyak RPH.



====================================================

MASTER RPH

====================================================



Field:

\- id\_rph

\- kode\_rph

\- nama\_rph

\- id\_bkph

\- status



1 RPH terhubung ke 1 BKPH.

1 RPH memiliki banyak TPG.



====================================================

MASTER TPG

====================================================



Field:

\- id\_tpg

\- kode\_tpg

\- nama\_tpg

\- id\_rph

\- status



1 TPG terhubung ke 1 RPH.



====================================================

MASTER PETAK

====================================================



Field:

\- id\_petak

\- nomor\_petak

\- anak\_petak

\- luas

\- id\_tpg

\- status



1 Petak terhubung ke 1 TPG.



====================================================

MASTER MANDOR

====================================================



Field:

\- id\_mandor

\- nama\_mandor

\- id\_tpg

\- nomor\_hp

\- status



1 Mandor terhubung ke 1 TPG.



====================================================

MASTER PENYADAP

====================================================



Field:

\- id\_penyadap

\- nama\_penyadap

\- id\_mandor

\- id\_petak

\- status



1 Penyadap terhubung ke:

\- mandor,

\- petak.



====================================================

MASTER TARGET PRODUKSI

====================================================



Field:

\- id\_target

\- tahun

\- bulan

\- periode

\- id\_bkph

\- id\_rph

\- id\_tpg

\- target\_ro

\- target\_rkap

\- target\_rtt

\- status



====================================================

MASTER USER

====================================================



Field:

\- id\_user

\- nama

\- username

\- password

\- role

\- wilayah\_akses

\- status



====================================================

SISTEM USER \& ROLE

====================================================



Gunakan role-based access control.



====================================================

1\. ADMIN BKPH

====================================================



Hak akses:

\- full akses

\- kelola master data

\- upload excel

\- edit data

\- dashboard

\- laporan

\- histori

\- manajemen user

\- monitoring seluruh wilayah



====================================================

2\. KRPH / ASPER

====================================================



Hak akses:

\- monitoring wilayah

\- dashboard

\- laporan

\- histori

\- monitoring target vs realisasi



====================================================

3\. MANDOR

====================================================



Hak akses:

\- input RO

\- input realisasi produksi

\- input absensi

\- input aktivitas lapangan

\- histori wilayah sendiri



====================================================

4\. PIMPINAN

====================================================



Hak akses:

\- dashboard monitoring

\- laporan

\- histori

\- read only



====================================================

FITUR IMPORT EXCEL

====================================================



Tambahkan fitur upload/import Excel untuk:

\- master penyadap

\- master petak

\- target produksi

\- wilayah

\- master user



Fitur:

\- preview data sebelum import

\- validasi data

\- import massal

\- update otomatis

\- notifikasi sukses/gagal



====================================================

FORM INPUT RO

====================================================



Mandor dapat menginput RO:

\- di awal periode berjalan,

ATAU

\- di akhir periode sebelumnya untuk periode berikutnya.



Field:

\- tanggal\_input

\- periode

\- bulan

\- tahun

\- BKPH

\- RPH

\- TPG

\- mandor

\- penyadap

\- target\_ro

\- catatan



Gunakan dropdown cascading:

Pilih BKPH → tampil RPH terkait

Pilih RPH → tampil TPG terkait

Pilih TPG → tampil Petak terkait

Pilih Petak → tampil Penyadap terkait



====================================================

FORM INPUT REALISASI PRODUKSI

====================================================



Field:

\- tanggal

\- periode

\- bulan

\- tahun

\- BKPH

\- RPH

\- TPG

\- petak

\- anak\_petak

\- mandor

\- penyadap

\- target\_ro

\- realisasi\_produksi

\- kondisi\_lapangan

\- kendala

\- catatan



====================================================

FORM ABSENSI PENYADAP

====================================================



Field:

\- tanggal

\- periode

\- penyadap

\- wilayah

\- status\_kehadiran

\- aktivitas\_kerja



Status:

\- hadir

\- izin

\- sakit

\- tidak\_hadir



====================================================

AGREGASI DATA OTOMATIS

====================================================



Realisasi produksi dari penyadap otomatis:

→ dijumlah ke mandor

→ dijumlah ke TPG

→ dijumlah ke RPH

→ dijumlah ke BKPH



Sistem harus melakukan agregasi realtime otomatis.



====================================================

SISTEM PERHITUNGAN

====================================================



Persentase capaian =

(Realisasi / RO) × 100



Gunakan indikator warna:

\- hijau = target tercapai

\- kuning = mendekati target

\- merah = target rendah



====================================================

DASHBOARD OPERASIONAL

====================================================



Pertahankan dashboard existing lalu upgrade menjadi dashboard operasional produksi.



Dashboard menampilkan:

\- total target

\- total realisasi

\- persentase capaian

\- grafik produksi

\- monitoring wilayah

\- monitoring RPH

\- monitoring TPG

\- ranking produksi

\- tren produksi

\- histori capaian



====================================================

FILTER DASHBOARD

====================================================



Tambahkan filter:

\- tanggal

\- periode

\- bulan

\- tahun

\- BKPH

\- RPH

\- TPG

\- mandor

\- penyadap



====================================================

HISTORY DATA

====================================================



Semua data transaksi harus tersimpan permanen.



Tambahkan:

\- histori per tanggal

\- histori per periode

\- histori per bulan

\- histori per tahun

\- histori target produksi

\- histori realisasi

\- histori perubahan master data



Jangan overwrite histori lama.



====================================================

SISTEM LAPORAN

====================================================



Tambahkan modul laporan profesional.



Jenis laporan:

\- laporan harian

\- laporan periode

\- laporan bulanan

\- laporan tahunan

\- laporan per BKPH

\- laporan per RPH

\- laporan per TPG

\- laporan per mandor

\- laporan per penyadap

\- laporan target vs realisasi



Fitur:

\- preview laporan

\- export PDF

\- export Excel

\- print laporan



====================================================

OFFLINE SYSTEM

====================================================



Pertahankan sistem offline existing.



Tambahkan:

\- local storage

\- offline cache

\- auto synchronization saat online

\- indikator status jaringan



Aplikasi harus tetap dapat digunakan di area minim sinyal.



====================================================

STRUKTUR DATABASE

====================================================



Pisahkan database menjadi:



1\. MASTER DATA

\- wilayah

\- penyadap

\- mandor

\- target

\- user



2\. TRANSAKSI

\- RO

\- realisasi produksi

\- absensi

\- aktivitas lapangan



3\. OUTPUT

\- dashboard

\- histori

\- laporan



Gunakan relational database scalable.

Gunakan ID relasi antar tabel.

Jangan gunakan hardcoded text berulang.



====================================================

FITUR KEAMANAN

====================================================



Tambahkan:

\- login session

\- validasi input

\- role access

\- audit log sederhana

\- proteksi akses data



====================================================

UI / UX

====================================================



Pertahankan desain existing lalu upgrade bertahap.



Gunakan tampilan:

\- modern

\- clean

\- profesional

\- ringan

\- mobile friendly

\- mudah digunakan mandor lapangan



Gunakan nuansa:

\- hijau hutan

\- putih

\- abu modern

\- forestry digital system



Tambahkan:

\- sidebar modern

\- dashboard cards

\- tabel modern

\- grafik interaktif

\- loading ringan



====================================================

TEKNOLOGI

====================================================



Frontend:

\- HTML

\- CSS

\- JavaScript modern



Backend:

\- PHP atau Node.js



Database:

\- MySQL atau Firebase



Support:

\- Progressive Web App (PWA)

\- offline mode

\- auto sync



====================================================

ARSITEKTUR KODE

====================================================



Rapikan struktur project:

\- modular

\- scalable

\- maintainable



Pisahkan:

\- authentication

\- services

\- database

\- reporting

\- dashboard

\- master data



Tambahkan komentar kode yang jelas.



====================================================

FOKUS PENGEMBANGAN

====================================================



Jangan membuat sistem terlalu kompleks seperti ERP besar.



Fokus utama:

\- implementatif

\- realistis

\- ringan

\- stabil

\- mudah digunakan

\- cocok untuk operasional produksi getah Perhutani



Utamakan:

\- kesederhanaan,

\- kestabilan,

\- kemudahan implementasi lapangan,

\- kemudahan monitoring produksi,

\- kemudahan pencarian histori data,

\- dan efisiensi pelaporan operasional.

