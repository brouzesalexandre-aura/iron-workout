/* ---------- Helpers ---------- */
const APP_VERSION = '@@VERSION@@';
const uid = () => 'x' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const IMG = (folder, n) => `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folder}/${n}.jpg`;
const clone = o => JSON.parse(JSON.stringify(o));
const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const round = (n, p = 0) => { const f = Math.pow(10, p); return Math.round(n * f) / f; };
