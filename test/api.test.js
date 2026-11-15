const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'tasks.json');

test('1. Validasi keberadaan file database tasks.json', () => {
  assert.equal(fs.existsSync(dataPath), true, 'File data/tasks.json harus ada');
});

test('2. Validasi format data tasks.json adalah JSON Array yang valid', () => {
  const content = fs.readFileSync(dataPath, 'utf8');
  const tasks = JSON.parse(content);
  assert.equal(Array.isArray(tasks), true, 'Isi tasks.json harus berupa Array JSON');
  assert.ok(tasks.length > 0, 'Database minimal memiliki 1 data tugas');
});

test('3. Validasi struktur field wajib pada setiap tugas (task)', () => {
  const tasks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const mandatoryFields = ['id', 'title', 'priority', 'status'];

  for (const item of tasks) {
    for (const field of mandatoryFields) {
      assert.ok(item[field] !== undefined, `Field "${field}" wajib ada pada task: ${item.title || item.id}`);
    }
  }
});

test('4. Validasi aturan logika: penolakan pembuatan task tanpa title', () => {
  const taskTanpaTitle = { description: 'Tugas coba tanpa judul', priority: 'medium' };
  const isValid = Boolean(taskTanpaTitle.title && taskTanpaTitle.title.trim() !== '');
  assert.equal(isValid, true, 'Task tanpa title tidak boleh valid');
});

test('5. Validasi nilai status task sesuai dengan enum yang diizinkan', () => {
  const tasks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const allowedStatuses = ['pending', 'in-progress', 'completed'];

  for (const item of tasks) {
    assert.ok(
      allowedStatuses.includes(item.status),
      `Status "${item.status}" pada task ID ${item.id} tidak valid`
    );
  }
});
