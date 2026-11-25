// 자동 테스트: node tests/run-tests.js  (포스터 ⑥ 테스트 표의 T1~T4)
const { predict, probability } = require('../lib/model');
const handler = require('../api/predict');
const ref = require('./reference.json');   // HAIP pkl로 계산한 500행 정답

function call(body, method = 'POST') {      // Vercel 서버 함수를 흉내 내어 호출
  let code = 200, out;
  const res = { status(c) { code = c; return this; }, json(o) { out = o; } };
  handler({ method, body }, res);
  return { code, out };
}
const rows = [];
function check(id, what, ok, result) { rows.push({ id, what, result, pass: ok ? '통과' : '실패' }); }

// T1 F-01 [AI]: HAIP 모델과 판정 일치
let same = 0, maxDiff = 0;
for (const r of ref) {
  const p = probability(r); maxDiff = Math.max(maxDiff, Math.abs(p - r.prob));
  if ((p >= 0.5) === (r.prob >= 0.5)) same++;
}
check('T1', 'F-01 HAIP 모델(pkl)과 판정 일치 (500행)', same === 500, `${same}/500 일치, 확률 최대 차이 ${maxDiff.toExponential(1)}`);

// T2a F-01·F-04: 대표 장면
const a = call({ lux: 433, noise_avg: 9, noise_max: 32, minute: 25, after_lunch: 1 }).out;
const b = call({ lux: 969, noise_avg: 15, noise_max: 70, minute: 10, after_lunch: 0 }).out;
check('T2a', 'F-01 화 5교시 25분째 / 화 1교시 10분째', a.drowsy && !b.drowsy, `졸음 의심 ${a.prob} / 깨어있음 ${b.prob}`);

// T2b F-02: 행동 안내 규칙
const dark = predict({ lux: 437, noise_avg: 9, noise_max: 29, minute: 15, after_lunch: 1 }).tip;
const bright = predict({ lux: 973, noise_avg: 7, noise_max: 30, minute: 45, after_lunch: 0 });
check('T2b', 'F-02 어두우면 불 켜기, 밝으면 활동 전환', dark === 'light' && (!bright.drowsy || bright.tip === 'activity'), `어두움→${dark}, 밝음→${bright.tip}`);

// T3 F-03: 일괄 판정 500행
const batch = call({ rows: ref.map(({ prob, ...r }) => r) });
check('T3', 'F-03 일괄 판정 500행', batch.code === 200 && batch.out.results.length === 500, `${batch.code}, ${batch.out.results ? batch.out.results.length : 0}행`);

// T4 N-3: 잘못된 입력 거부
const bad1 = call({ lux: '어두움', noise_avg: 9, noise_max: 32, minute: 25, after_lunch: 1 });
const bad2 = call({ lux: 5000, noise_avg: 9, noise_max: 32, minute: 25, after_lunch: 1 });
const bad3 = call({}, 'GET');
check('T4', 'N-3 잘못된 입력·방식 거부', bad1.code === 400 && bad2.code === 400 && bad3.code === 405, `${bad1.code} / ${bad2.code} / ${bad3.code}`);

// 추가: 서버 계산 속도 (500행)
// T5 N-1(열림 시간)과 T6 US1(사용자 과제)은 배포 후 사람이 직접 잰다
const t0 = process.hrtime.bigint(); call({ rows: ref.map(({ prob, ...r }) => r) });
const ms = Number(process.hrtime.bigint() - t0) / 1e6;
check('추가', '서버 계산 시간 (500행)', ms < 100, `${ms.toFixed(1)} ms`);

console.table(rows);
process.exit(rows.every(r => r.pass === '통과') ? 0 : 1);
