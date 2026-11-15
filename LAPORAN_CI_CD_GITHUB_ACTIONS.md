# LAPORAN PRAKTIKUM IMPLEMENTASI CI/CD (GITHUB ACTIONS)
**Mata Kuliah:** Rekayasa API (F09252013)  
**Tautan Repositori:** [https://github.com/nurainiarum/to-do-API](https://github.com/nurainiarum/to-do-API)  

---

### Disusun oleh Kelompok 1:
1. **Nur'aini Asmaningrum** (F5512520081) — *Penyusun Workflow*
2. **Muh. Zarhan Ali** (F5512520087) — *Penguji (Tester)*
3. **Dimas Maulana Yusuf** (F5512520085) — *Dokumentasi*
4. **Sean Christian Korompu** (F5512520095) — *Koordinator & Reviewer*

---

## 1. Informasi Repositori & Spesifikasi Lingkungan
- **URL Repositori GitHub:** `https://github.com/nurainiarum/to-do-API`
- **Lokasi Berkas Workflow:** `.github/workflows/ci.yml`
- **Bahasa / Runtime:** Node.js (v20 LTS / v24)
- **Virtual Runner:** Ubuntu Latest (`ubuntu-latest`)
- **Automated Test Runner:** Node.js Native Test Runner (`node --test`)

---

## 2. Penjelasan Konfigurasi Workflow CI (`ci.yml`)
Pipeline CI dirancang untuk menjalankan pengujian otomatis secara kontinu dengan aturan:

### A. Trigger Event:
1. **`push`** ke branch `main`: Memastikan kode yang masuk ke branch utama selalu stabil dan lulus uji.
2. **`pull_request`** ke branch `main`: Melakukan verifikasi otomatis sebelum kode dari branch pengembang digabungkan (*merge*).

### B. Tahapan Job (`build-test`):
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Jalankan Unit Test
        run: npm test
```
- **Step 1 (`actions/checkout@v4`):** Mengunduh repositori proyek ke dalam runner GitHub Actions.
- **Step 2 (`actions/setup-node@v4`):** Menyiapkan lingkungan runtime Node.js v20.
- **Step 3 (`npm test`):** Menjalankan rangkaian unit test otomatis (`test/api.test.js`) untuk memvalidasi struktur data dan logika bisnis aplikasi.

---

## 3. Bukti Pengujian Pipeline (Run Sukses & Run Gagal)

### A. Bukti Run Sukses (Passed Run)
> *(Tempelkan screenshot halaman detail Actions yang berstatus hijau centang di sini)*

- **URL Run Sukses:** `https://github.com/nurainiarum/to-do-API/actions`
- **Branch:** `main`
- **Status:** **Success (Exit Code 0)**
- **Hasil:** Semua step (Checkout, Setup Node.js, dan npm test) sukses dieksekusi. Seluruh skenario pengujian passed 100%.

---

### B. Bukti Run Gagal (Failed Run) & Penanganan Error
> *(Tempelkan screenshot halaman detail Actions berstatus merah silang dan log error di sini)*

- **Branch Simulasi:** `test-failure`
- **Penyebab Kegagalan (Root Cause):**  
  Pada skenario pengujian `test/api.test.js`, dilakukan simulasi error pada logika validasi input task baru tanpa judul (`title`). Assertion sengaja dipasang mengharapkan nilai `true` untuk kondisi yang seharusnya `false`.
- **Log Error:**
  ```text
  ✖ Uji logika validasi task baru (title wajib ada)
    AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    false !== true
      operator: '=='
  ```
- **Langkah Perbaikan:**  
  Mengubah ekspektasi assertion pada berkas `test/api.test.js` kembali ke logika yang valid:
  ```javascript
  assert.equal(isValid, false, 'Task tanpa title seharusnya tidak valid');
  ```
- **Commit Perbaikan:** `fix: perbaiki kondisi assert validasi task`
- **Hasil Setelah Perbaikan:** Pipeline kembali dijalankan otomatis dan berstatus hijau (Success).

---

## 4. Pembagian Peran Anggota Tim

| No | Nama Anggota | NIM | Peran | Rincian Tugas yang Dilakukan |
|---|---|---|---|---|
| 1 | **Nur'aini Asmaningrum** | F5512520081 | Penyusun Workflow | Mengonfigurasi berkas `.github/workflows/ci.yml`, menentukan trigger `push`/`pull_request`, dan runner. |
| 2 | **Muh. Zarhan Ali** | F5512520087 | Penguji (Tester) | Mengembangkan skrip unit test (`test/api.test.js`) dan membuat skenario simulasi test gagal. |
| 3 | **Dimas Maulana Yusuf** | F5512520085 | Dokumentasi | Mengambil tangkapan layar (screenshot) log error dan sukses, serta menyusun format laporan ini. |
| 4 | **Sean Christian Korompu** | F5512520095 | Koordinator | Melakukan peninjauan (*code review*) pada Pull Request, memvalidasi kriteria penilaian, dan finalisasi repositori. |
