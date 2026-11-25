// 내 컴퓨터에서 미리 돌려 보기:  node dev-server.js  →  http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path');
const handler = require('./api/predict');
const TYPES = { '.html': 'text/html; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.js': 'text/javascript' };
http.createServer((req, res) => {
  res.status = c => { res.statusCode = c; return res; };
  res.json = o => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); };
  if (req.url.startsWith('/api/predict')) {
    let b = ''; req.on('data', c => b += c);
    req.on('end', () => { try { req.body = b ? JSON.parse(b) : {}; } catch { return res.status(400).json({ error: 'JSON 형식이 아닙니다' }); } handler(req, res); });
    return;
  }
  const f = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { res.statusCode = 404; return res.end('not found'); } res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream'); res.end(d); });
}).listen(process.env.PORT || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000)));
