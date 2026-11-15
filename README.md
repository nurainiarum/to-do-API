# 📋 Todo API: Manajemen Tugas Berbasis RESTful API

[![CI Status](https://github.com/nurainiarum/to-do-API/actions/workflows/ci.yml/badge.svg)](https://github.com/nurainiarum/to-do-API/actions)

> **Mata Kuliah: Rekayasa API (F09252013)**  
> **Kelompok 1:**  
> 1. Nur'aini Asmaningrum (F5512520081) — *Penyusun Workflow CI*  
> 2. Muh. Zarhan Ali (F5512520087) — *Penguji (Tester) & Pembuat Skenario Gagal*  
> 3. Dimas Maulana Yusuf (F5512520085) — *Dokumentasi & Pelaporan*  
> 4. Sean Christian Korompu (F5512520095) — *Koordinator & Manajemen Repositori*  

---

## 📖 Deskripsi Proyek
Aplikasi **Todo API** merupakan RESTful web service untuk manajemen tugas harian yang dibangun menggunakan arsitektur modular Node.js murni (*native HTTP & FS module*). API ini menyediakan operasi CRUD (Create, Read, Update, Delete) data tugas secara persisten pada file `data/tasks.json` serta integrasi pengecekan hari libur nasional via Public API Nager.Date.

> **Catatan Tahap Build:**  
> Proyek ini menggunakan bahasa pemrograman JavaScript pada runtime Node.js yang bersifat *interpreted*, sehingga tidak memerlukan tahap kompilasi/build biner terpisah. Tahap *Build & Verification* dipenuhi melalui verifikasi instalasi dependensi (`npm ci`) dan eksekusi pengujian otomatis (`npm test`).

---

## 🛠️ Cara Menjalankan di Lokal

### 1. Prasyarat Lingkungan
- Node.js versi 20 LTS atau yang lebih baru
- NPM versi 10 atau yang lebih baru

### 2. Instalasi Dependensi
```bash
npm ci
```

### 3. Menjalankan Server API
```bash
npm start
# atau: node server.js
```
Server akan aktif di `http://localhost:3000`.

### 4. Menjalankan Pengujian Otomatis (Unit Test)
```bash
npm test
```
Perintah ini akan menjalankan 5 skenario pengujian integritas database, validasi format data, aturan validasi judul, dan status tugas menggunakan test runner bawaan Node.js (`node --test`).

### 5. Pengujian dengan Client Console
```bash
node client.js
```

---

## ⚙️ Penjelasan Pipeline CI (.github/workflows/ci.yml)

Pipeline Continuous Integration (CI) pada GitHub Actions dikonfigurasi untuk menguji setiap perubahan kode secara otomatis:

1. **Trigger / Pemicu:**
   - `push` ke branch `main`: Memvalidasi stabilitas kode pada cabang utama.
   - `pull_request` ke branch `main`: Menguji usulan perubahan kode sebelum digabungkan (*merge*).

2. **Lingkungan Runner:**
   - Sistem Operasi: `ubuntu-latest`
   - Runtime: Node.js versi 20 LTS dengan fitur *caching* dependensi npm.

3. **Tahapan Pekerjaan (Job Steps):**
   - **Checkout Repository:** Mengambil kode sumber dari repositori menggunakan `actions/checkout@v4`.
   - **Setup Node.js:** Menyiapkan runtime Node.js 20 menggunakan `actions/setup-node@v4`.
   - **Install Dependensi:** Menjalankan `npm ci` untuk instalasi dependensi yang bersih, cepat, dan deterministik.
   - **Jalankan Unit Test:** Menjalankan `npm test` untuk memverifikasi seluruh skenario pengujian passed (Exit Code 0).
