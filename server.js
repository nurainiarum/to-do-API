console.log(
  "Kelompok 1\n" +
  "1. Nur'aini Asmaningrum (F5512520081)\n" +
  "2. Muh. Zarhan Ali (F5512520087)\n" +
  "3. Dimas Maulana Yusuf (F5512520085)\n" +
  "4. Sean Christian Korompu (F5512520095)"
);
'use strict';

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT      = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// ─── Storage helpers ─────────────────────────────────────────

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── HTTP helpers ────────────────────────────────────────────

function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => (raw += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Body bukan JSON yang valid'));
      }
    });
    req.on('error', reject);
  });
}

// ─── Public API: Nager.Date — holiday checker ────────────────
// Dipakai untuk memperkaya data tugas:
// endpoint GET /tasks/:id/deadline-info mengembalikan info
// apakah deadline tugas jatuh pada hari libur nasional Indonesia.

function fetchHolidays(year) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'date.nager.at',
      path: `/api/v3/PublicHolidays/${year}/ID`,
      method: 'GET',
      headers: { Accept: 'application/json' },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => (raw += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error('Gagal mem-parse respons Nager.Date'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(7000, () => {
      req.destroy(new Error('Timeout menghubungi Nager.Date'));
    });
    req.end();
  });
}

// ─── Validation ──────────────────────────────────────────────

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES   = ['pending', 'in-progress', 'done'];

function validateTask(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      errors.push('title: wajib diisi dan harus berupa string tidak kosong');
    }
  }

  if (!isUpdate || data.priority !== undefined) {
    if (data.priority !== undefined && !VALID_PRIORITIES.includes(data.priority)) {
      errors.push(`priority: harus salah satu dari [${VALID_PRIORITIES.join(', ')}]`);
    }
  }

  if (!isUpdate || data.status !== undefined) {
    if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
      errors.push(`status: harus salah satu dari [${VALID_STATUSES.join(', ')}]`);
    }
  }

  if (data.deadline !== undefined) {
    const d = new Date(data.deadline);
    if (isNaN(d.getTime())) {
      errors.push('deadline: format tanggal tidak valid (gunakan YYYY-MM-DD)');
    }
  }

  return errors;
}

// ─── ID generator ────────────────────────────────────────────

function generateId() {
  return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// ─── Router ──────────────────────────────────────────────────

async function router(req, res) {
  const { method } = req;
  const urlObj   = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname.replace(/\/$/, '') || '/';
  const segments = pathname.split('/').filter(Boolean);
  // segments[0] = 'tasks', segments[1] = :id, segments[2] = sub-resource

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // ── GET /tasks ─────────────────────────────────────────────
    if (method === 'GET' && segments[0] === 'tasks' && !segments[1]) {
      const tasks    = readData();
      const status   = urlObj.searchParams.get('status');
      const priority = urlObj.searchParams.get('priority');

      let result = tasks;
      if (status)   result = result.filter(t => t.status   === status);
      if (priority) result = result.filter(t => t.priority === priority);

      return sendJSON(res, 200, {
        success : true,
        total   : result.length,
        filters : { status: status || null, priority: priority || null },
        data    : result,
      });
    }

    // ── GET /tasks/:id ─────────────────────────────────────────
    if (method === 'GET' && segments[0] === 'tasks' && segments[1] && !segments[2]) {
      const task = readData().find(t => t.id === segments[1]);
      if (!task) {
        return sendJSON(res, 404, { success: false, message: `Tugas dengan id '${segments[1]}' tidak ditemukan` });
      }
      return sendJSON(res, 200, { success: true, data: task });
    }

    // ── GET /tasks/:id/deadline-info  (Public API integration) ─
    if (method === 'GET' && segments[0] === 'tasks' && segments[1] && segments[2] === 'deadline-info') {
      const task = readData().find(t => t.id === segments[1]);
      if (!task) {
        return sendJSON(res, 404, { success: false, message: `Tugas dengan id '${segments[1]}' tidak ditemukan` });
      }

      if (!task.deadline) {
        return sendJSON(res, 200, {
          success : true,
          task    : { id: task.id, title: task.title },
          message : 'Tugas ini tidak memiliki deadline yang ditentukan',
          holidayInfo: null,
        });
      }

      const deadlineDate = new Date(task.deadline);
      const year         = deadlineDate.getFullYear();

      let holidays;
      try {
        holidays = await fetchHolidays(year);
      } catch (err) {
        return sendJSON(res, 200, {
          success     : true,
          task        : { id: task.id, title: task.title, deadline: task.deadline },
          holidayInfo : null,
          warning     : `Tidak dapat mengambil data hari libur: ${err.message}`,
          source      : 'Nager.Date Public Holiday API (date.nager.at)',
        });
      }

      // Cari apakah deadline tepat jatuh pada hari libur
      const match = holidays.find(h => h.date === task.deadline);

      // Ambil 3 hari libur terdekat sebelum/sesudah deadline
      const deadlineMs = deadlineDate.getTime();
      const nearbyHolidays = holidays
        .map(h => ({ ...h, diff: Math.abs(new Date(h.date).getTime() - deadlineMs) }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 3)
        .map(({ diff, ...rest }) => rest);

      return sendJSON(res, 200, {
        success     : true,
        task        : { id: task.id, title: task.title, deadline: task.deadline, status: task.status },
        isHoliday   : !!match,
        holidayName : match ? match.localName : null,
        warning     : match ? `⚠️  Deadline jatuh pada hari libur nasional: ${match.localName}` : null,
        nearbyHolidaysIndonesia: nearbyHolidays,
        source      : `Nager.Date Public Holiday API — Hari Libur Nasional Indonesia ${year}`,
      });
    }

    // ── POST /tasks ────────────────────────────────────────────
    if (method === 'POST' && segments[0] === 'tasks' && !segments[1]) {
      let body;
      try { body = await parseBody(req); }
      catch (e) { return sendJSON(res, 400, { success: false, message: e.message }); }

      const errors = validateTask(body);
      if (errors.length) {
        return sendJSON(res, 400, { success: false, message: 'Validasi gagal', errors });
      }

      const tasks   = readData();
      const newTask = {
        id          : generateId(),
        title       : body.title.trim(),
        description : body.description ? body.description.trim() : '',
        priority    : VALID_PRIORITIES.includes(body.priority) ? body.priority : 'medium',
        status      : 'pending',
        deadline    : body.deadline || null,
        tags        : Array.isArray(body.tags) ? body.tags : [],
        createdAt   : new Date().toISOString(),
        updatedAt   : new Date().toISOString(),
      };

      tasks.push(newTask);
      writeData(tasks);

      return sendJSON(res, 201, {
        success : true,
        message : 'Tugas berhasil dibuat',
        data    : newTask,
      });
    }

    // ── PUT /tasks/:id ─────────────────────────────────────────
    if (method === 'PUT' && segments[0] === 'tasks' && segments[1] && !segments[2]) {
      let body;
      try { body = await parseBody(req); }
      catch (e) { return sendJSON(res, 400, { success: false, message: e.message }); }

      const tasks = readData();
      const index = tasks.findIndex(t => t.id === segments[1]);
      if (index === -1) {
        return sendJSON(res, 404, { success: false, message: `Tugas dengan id '${segments[1]}' tidak ditemukan` });
      }

      const errors = validateTask(body, true);
      if (errors.length) {
        return sendJSON(res, 400, { success: false, message: 'Validasi gagal', errors });
      }

      const old = tasks[index];
      tasks[index] = {
        ...old,
        title       : body.title       !== undefined ? body.title.trim()       : old.title,
        description : body.description !== undefined ? body.description.trim() : old.description,
        priority    : body.priority    !== undefined ? body.priority            : old.priority,
        status      : body.status      !== undefined ? body.status              : old.status,
        deadline    : body.deadline    !== undefined ? body.deadline            : old.deadline,
        tags        : body.tags        !== undefined ? body.tags                : old.tags,
        updatedAt   : new Date().toISOString(),
      };

      writeData(tasks);
      return sendJSON(res, 200, {
        success : true,
        message : 'Tugas berhasil diperbarui',
        data    : tasks[index],
      });
    }

    // ── DELETE /tasks/:id ──────────────────────────────────────
    if (method === 'DELETE' && segments[0] === 'tasks' && segments[1] && !segments[2]) {
      const tasks = readData();
      const index = tasks.findIndex(t => t.id === segments[1]);
      if (index === -1) {
        return sendJSON(res, 404, { success: false, message: `Tugas dengan id '${segments[1]}' tidak ditemukan` });
      }

      const [deleted] = tasks.splice(index, 1);
      writeData(tasks);

      return sendJSON(res, 200, {
        success : true,
        message : 'Tugas berhasil dihapus',
        data    : deleted,
      });
    }

    // ── 404 fallback ───────────────────────────────────────────
    return sendJSON(res, 404, {
      success : false,
      message : `Endpoint ${method} ${pathname} tidak ditemukan`,
      hint    : 'Endpoint tersedia: GET|POST /tasks, GET|PUT|DELETE /tasks/:id, GET /tasks/:id/deadline-info',
    });

  } catch (err) {
    console.error('[Server Error]', err.message);
    return sendJSON(res, 500, { success: false, message: 'Terjadi kesalahan internal pada server' });
  }
}

// ─── Start server ─────────────────────────────────────────────

// Buat direktori data jika belum ada
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
// Inisialisasi file JSON jika belum ada
if (!fs.existsSync(DATA_FILE)) {
  writeData([]);
}

const server = http.createServer(router);
server.listen(PORT, () => {
  console.log(`\n  Server aktif → http://localhost:${PORT}`);
  console.log('  Tekan Ctrl+C untuk menghentikan server.\n');
});
