// POST /api/predict — 한 개: {lux, noise_avg, noise_max, minute, after_lunch}
//                    여러 개: {rows: [ ... ]}  (F-01, F-03)
const { predict, validate } = require('../lib/model');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 쓸 수 있습니다' });
  const body = req.body || {};
  const batch = Array.isArray(body.rows);
  const rows = batch ? body.rows : [body];
  if (rows.length === 0 || rows.length > 2000) return res.status(400).json({ error: '행은 1~2000개여야 합니다' });
  for (let i = 0; i < rows.length; i++) {
    const err = validate(rows[i] || {});
    if (err) return res.status(400).json({ error: batch ? `${i + 1}번째 행: ${err}` : err });
  }
  const out = rows.map(predict);
  res.status(200).json(batch ? { results: out } : out[0]);
};
