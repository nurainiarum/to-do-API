# 📋 Todo API — Manajemen Tugas Berbasis RESTful API

> **Rekayasa API (F09252013) — Sub-CPMK 4**  
> **Kelompok 1**  
> 1. Nur'aini Asmaningrum (F5512520081)  
> 2. Muh. Zarhan Ali (F5512520087)  
> 3. Dimas Maulana Yusuf (F5512520085)  
> 4. Sean Christian Korompu (F5512520095)  

---

## Struktur Proyek

```
todo-api/
├── server.js                            ← API server (module http, tanpa framework)
├── client.js                            ← Client console (memanggil API via HTTP)
├── Todo_API.postman_collection.json     ← Koleksi Postman 14 skenario uji lengkap
├── bruno/                               ← Koleksi pengujian Bruno
├── data/
│   └── tasks.json                       ← Penyimpanan persisten (module fs)
└── README.md
```

---

## Cara Menjalankan

**1. Jalankan server (terminal):**
```bash
node server.js
```

**2. Pengujian dengan Postman:**
1. Buka aplikasi **Postman**.
2. Klik tombol **Import** (di kiri atas).
3. Pilih file `Todo_API.postman_collection.json`.
4. Koleksi **Todo API — Rekayasa API (Kelompok 1)** akan muncul dengan 14 request siap pakai.
5. Klik dan kirim (**Send**) setiap request secara berurutan untuk keperluan screenshot laporan!

**3. Pengujian dengan Client Console:**
```bash
node client.js
```

---

## Deskripsi Aplikasi

Aplikasi **Manajemen Tugas (Todo)** memungkinkan pengguna mengelola daftar tugas harian. Pengguna dapat membuat, membaca, memperbarui, dan menghapus tugas. Setiap tugas memiliki judul, deskripsi, prioritas, status, deadline, dan tag.

**Fitur unggulan:** Endpoint `/tasks/:id/deadline-info` mengintegrasikan **Nager.Date Public Holiday API** untuk mengecek apakah deadline tugas jatuh pada hari libur nasional Indonesia — data hari libur benar-benar diproses (bukan ditampilkan mentah) untuk memberikan peringatan dan daftar 3 hari libur terdekat.

---

## Endpoint API

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/tasks` | Ambil semua tugas (support filter `?status=` & `?priority=`) |
| GET | `/tasks/:id` | Ambil detail satu tugas |
| POST | `/tasks` | Buat tugas baru |
| PUT | `/tasks/:id` | Perbarui tugas |
| DELETE | `/tasks/:id` | Hapus tugas |
| GET | `/tasks/:id/deadline-info` | Info deadline + hari libur (Public API) |

---

## Schema Task

```json
{
  "id":          "task-<timestamp>-<random>",
  "title":       "string (wajib)",
  "description": "string",
  "priority":    "low | medium | high",
  "status":      "pending | in-progress | done",
  "deadline":    "YYYY-MM-DD | null",
  "tags":        ["string"],
  "createdAt":   "ISO 8601",
  "updatedAt":   "ISO 8601"
}
```

---

## Validasi

| Field | Aturan |
|-------|--------|
| `title` | Wajib, string tidak kosong |
| `priority` | Harus `low`, `medium`, atau `high` |
| `status` | Harus `pending`, `in-progress`, atau `done` |
| `deadline` | Format YYYY-MM-DD (opsional) |

---

## Tabel Test Case (untuk laporan)

| No | Endpoint | Method | Skenario | Request Body / Param | Status Diharapkan | Status Aktual |
|----|----------|--------|----------|----------------------|-------------------|---------------|
| 1 | `/tasks` | GET | Berhasil — ambil semua tugas | — | 200 | ✅ 200 |
| 2 | `/tasks` | GET | Berhasil — filter `?status=pending` | `?status=pending` | 200 | ✅ 200 |
| 3 | `/tasks` | POST | Berhasil — buat tugas baru | `{title, priority, deadline, tags}` | 201 | ✅ 201 |
| 4 | `/tasks` | POST | Gagal — tanpa `title` | `{description: "..."}` | 400 | ✅ 400 |
| 5 | `/tasks` | POST | Gagal — `priority` tidak valid | `{title:"x", priority:"ultra"}` | 400 | ✅ 400 |
| 6 | `/tasks/:id` | GET | Berhasil — ambil detail tugas ada | id valid | 200 | ✅ 200 |
| 7 | `/tasks/:id` | GET | Gagal — id tidak ditemukan | id tidak ada | 404 | ✅ 404 |
| 8 | `/tasks/:id` | PUT | Berhasil — update status | `{status: "in-progress"}` | 200 | ✅ 200 |
| 9 | `/tasks/:id` | PUT | Gagal — `status` tidak valid | `{status: "completed"}` | 400 | ✅ 400 |
| 10 | `/tasks/:id` | PUT | Gagal — id tidak ditemukan | id tidak ada | 404 | ✅ 404 |
| 11 | `/tasks/:id` | DELETE | Berhasil — hapus tugas | id valid | 200 | ✅ 200 |
| 12 | `/tasks/:id` | DELETE | Gagal — sudah dihapus | id sama | 404 | ✅ 404 |
| 13 | `/tasks/:id/deadline-info` | GET | Berhasil — deadline bukan hari libur | id dengan deadline | 200 | ✅ 200 |
| 14 | `/tasks/:id/deadline-info` | GET | Gagal — id tidak ditemukan | id tidak ada | 404 | ✅ 404 |

---

## Integrasi Public API

**API:** [Nager.Date Public Holiday API](https://date.nager.at)  
**Endpoint yang dipakai:** `GET https://date.nager.at/api/v3/PublicHolidays/{year}/ID`  
**Alasan pemilihan:** Gratis, tanpa API key, data hari libur Indonesia resmi  
**Field yang diambil:** `date`, `localName`, `name`, `countryCode`, `types`  
**Cara data dipakai:**
- Membandingkan `deadline` tugas dengan setiap tanggal libur
- Menentukan apakah deadline jatuh pada hari libur (`isHoliday: true/false`)
- Menampilkan peringatan jika `isHoliday` bernilai `true`
- Menghitung 3 hari libur terdekat dari deadline (sorted by `Math.abs(diff)`)

---

## Susunan Sistem

```
client.js  →  server.js (localhost:3000)  →  data/tasks.json
(Node.js)     (module http, no framework)    (module fs)
                     ↓
          Nager.Date API (data tambahan)
          date.nager.at/api/v3/...
```

---

## Identitas Kode (baris pertama server.js)

```javascript
console.log(
  "Kelompok 1\n" +
  "1. Nur'aini Asmaningrum (F5512520081)\n" +
  "2. Muh. Zarhan Ali (F5512520087)\n" +
  "3. Dimas Maulana Yusuf (F5512520085)\n" +
  "4. Sean Christian Korompu (F5512520095)"
);
```

Muncul setiap kali `node server.js` dijalankan.
