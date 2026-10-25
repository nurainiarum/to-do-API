// ============================================================
// KELOMPOK 1 — Rekayasa API (F09252013)
// 1. Nur'aini Asmaningrum (F5512520081)
// 2. Muh. Zarhan Ali (F5512520087)
// 3. Dimas Maulana Yusuf (F5512520085)
// 4. Sean Christian Korompu (F5512520095)
// CLIENT CONSOLE — Manajemen Tugas (Todo) API
// Program ini memanggil API kelompok via HTTP (module http)
// Jalankan: node client.js
// Pastikan server sudah berjalan: node server.js
// ============================================================
'use strict';

const http = require('http');

const HOST = 'localhost';
const PORT = 3000;

// ─── Helper: HTTP request ─────────────────────────────────────

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname : HOST,
      port     : PORT,
      path,
      method,
      headers  : {
        'Content-Type'  : 'application/json',
        'Content-Length': payload ? Buffer.byteLength(payload) : 0,
      },
    };

    const req = http.request(options, res => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', err => {
      // Tangani error koneksi tanpa menampilkan stack trace
      reject(new Error(
        `Gagal terhubung ke server (${HOST}:${PORT}). ` +
        `Pastikan server.js sedang berjalan.\nDetail: ${err.message}`
      ));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Helper: tampilkan hasil ──────────────────────────────────

function line(char = '─', len = 60) {
  return char.repeat(len);
}

function printResult(label, result) {
  const icon = result.status >= 400 ? '✗' : '✓';
  console.log(`\n${line()}`);
  console.log(`${icon}  ${label}`);
  console.log(`   Status HTTP : ${result.status}`);
  console.log('   Response   :');
  const formatted = JSON.stringify(result.body, null, 4)
    .split('\n')
    .map(l => `     ${l}`)
    .join('\n');
  console.log(formatted);
}

// ─── Demo utama ───────────────────────────────────────────────

async function main() {
  console.log(line('═'));
  console.log('   📋  CLIENT CONSOLE — Manajemen Tugas (Todo) API');
  console.log(`   Server target: http://${HOST}:${PORT}`);
  console.log(line('═'));

  let taskId1 = null;
  let taskId2 = null;

  try {

    // ── 1. GET /tasks — daftar awal (mungkin kosong) ──────────
    const r1 = await request('GET', '/tasks');
    printResult('[GET /tasks] Ambil semua tugas (awal)', r1);


    // ── 2. POST /tasks — buat tugas 1 ─────────────────────────
    const r2 = await request('POST', '/tasks', {
      title       : 'Kerjakan laporan Rekayasa API',
      description : 'Buat laporan PDF proyek kelompok Sub-CPMK 4',
      priority    : 'high',
      deadline    : '2026-10-29',   // sesuai due date tugas
      tags        : ['laporan', 'kuliah', 'kelompok'],
    });
    printResult('[POST /tasks] Buat tugas baru (berhasil)', r2);
    if (r2.body.data) taskId1 = r2.body.data.id;


    // ── 3. POST /tasks — buat tugas 2 ─────────────────────────
    const r3 = await request('POST', '/tasks', {
      title    : 'Persiapan demo aplikasi di kelas',
      priority : 'high',
      deadline : '2026-11-10',
      tags     : ['demo', 'presentasi'],
    });
    printResult('[POST /tasks] Buat tugas kedua (berhasil)', r3);
    if (r3.body.data) taskId2 = r3.body.data.id;


    // ── 4. POST /tasks — GAGAL: title kosong ──────────────────
    const r4 = await request('POST', '/tasks', {
      description : 'Tugas tanpa judul',
      priority    : 'low',
    });
    printResult('[POST /tasks] GAGAL — title tidak diisi (400)', r4);


    // ── 5. POST /tasks — GAGAL: priority tidak valid ──────────
    const r5 = await request('POST', '/tasks', {
      title    : 'Tugas dengan priority salah',
      priority : 'ultra',
    });
    printResult('[POST /tasks] GAGAL — priority tidak valid (400)', r5);


    // ── 6. GET /tasks — filter berdasarkan status ─────────────
    const r6 = await request('GET', '/tasks?status=pending');
    printResult('[GET /tasks?status=pending] Filter status pending', r6);


    if (taskId1) {
      // ── 7. GET /tasks/:id — detail tugas ──────────────────────
      const r7 = await request('GET', `/tasks/${taskId1}`);
      printResult(`[GET /tasks/${taskId1}] Detail tugas`, r7);


      // ── 8. GET /tasks/:id — GAGAL: id tidak ada ───────────────
      const r8 = await request('GET', '/tasks/task-id-tidak-ada-999');
      printResult('[GET /tasks/task-id-tidak-ada-999] GAGAL — tidak ditemukan (404)', r8);


      // ── 9. PUT /tasks/:id — update status & priority ──────────
      const r9 = await request('PUT', `/tasks/${taskId1}`, {
        status      : 'in-progress',
        description : 'Sudah mulai dikerjakan bersama anggota kelompok',
      });
      printResult(`[PUT /tasks/${taskId1}] Update status → in-progress`, r9);


      // ── 10. PUT /tasks/:id — GAGAL: status tidak valid ────────
      const r10 = await request('PUT', `/tasks/${taskId1}`, {
        status : 'completed',  // bukan salah satu dari enum
      });
      printResult(`[PUT /tasks/${taskId1}] GAGAL — status tidak valid (400)`, r10);


      // ── 11. GET /tasks/:id/deadline-info — PUBLIC API ─────────
      console.log(`\n${line()}`);
      console.log('⏳  Mengambil data hari libur dari Nager.Date API...');
      const r11 = await request('GET', `/tasks/${taskId1}/deadline-info`);
      printResult(`[GET /tasks/${taskId1}/deadline-info] Info deadline + hari libur (Public API)`, r11);
    }


    if (taskId2) {
      // ── 12. DELETE /tasks/:id — hapus tugas ───────────────────
      const r12 = await request('DELETE', `/tasks/${taskId2}`);
      printResult(`[DELETE /tasks/${taskId2}] Hapus tugas kedua`, r12);


      // ── 13. DELETE /tasks/:id — GAGAL: sudah dihapus ──────────
      const r13 = await request('DELETE', `/tasks/${taskId2}`);
      printResult(`[DELETE /tasks/${taskId2}] GAGAL — sudah dihapus (404)`, r13);
    }


    // ── 14. GET /tasks — daftar akhir ─────────────────────────
    const r14 = await request('GET', '/tasks');
    printResult('[GET /tasks] Daftar tugas akhir setelah semua operasi', r14);


    // ── 15. GET — endpoint tidak ada ──────────────────────────
    const r15 = await request('GET', '/projects');
    printResult('[GET /projects] GAGAL — endpoint tidak dikenal (404)', r15);


    console.log(`\n${line('═')}`);
    console.log('   ✅  Demo client selesai — semua endpoint telah diuji');
    console.log(line('═') + '\n');

  } catch (err) {
    // Tampilkan pesan error yang ramah tanpa stack trace
    console.error(`\n${line('═')}`);
    console.error('   ❌  ERROR KONEKSI');
    console.error(`   ${err.message}`);
    console.error(line('═') + '\n');
  }
}

main();
