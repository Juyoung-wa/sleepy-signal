// HAIP M2 (로지스틱 회귀) — model.json의 숫자로 계산. 라이브러리 없음.
const M = require('../model.json');

const LIMITS = {               // 입력 허용 범위 (N-3)
  lux: [0, 1023], noise_avg: [0, 255], noise_max: [0, 255],
  minute: [0, 60], after_lunch: [0, 1]
};

function validate(r) {
  for (const k of M.inputs) {
    const v = r[k];
    if (typeof v !== 'number' || !Number.isFinite(v)) return `${k} 값이 숫자가 아닙니다`;
    const [lo, hi] = LIMITS[k];
    if (v < lo || v > hi) return `${k} 값은 ${lo}~${hi} 사이여야 합니다`;
  }
  return null;
}

function predict(r) {                            // F-01, F-02, F-04
  let z = M.intercept;
  M.inputs.forEach((k, i) => z +=
    M.coef[i] * (r[k] - M.mean[i]) / M.scale[i]);
  const prob = 1 / (1 + Math.exp(-z));
  const drowsy = prob >= M.threshold;            // 0.5
  const tip = !drowsy ? null
    : r.lux < 700 ? 'light' : 'activity';        // 어두우면 불 켜기, 아니면 활동 전환
  return { drowsy, tip,
    prob: Math.round(prob * 100) / 100 };
}

function probability(r) {                        // 테스트용: 반올림 전 확률
  let z = M.intercept;
  M.inputs.forEach((k, i) => z += M.coef[i] * (r[k] - M.mean[i]) / M.scale[i]);
  return 1 / (1 + Math.exp(-z));
}

module.exports = { predict, validate, probability, M };
