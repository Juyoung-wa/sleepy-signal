# 졸음 신호등 (Sleepy Signal) v1.0

교실 센서 값으로 지금 교실이 **졸음 의심** 상태인지와 교사가 할 일(불 켜기·활동 전환)을 알려 주는 웹 서비스.
JOINT 연합프로젝트 Rx 23 졸음 유발 환경 · PPSD (HAIP·PPSD 겸임)

## 폴더 구성
| 경로 | 내용 | 기능 |
|---|---|---|
| `public/index.html` | 화면 (지금 교실 / 하루 리포트) | F-01~F-06 |
| `public/sample_data.csv` | DS 예시 데이터 500행 | F-03 |
| `api/predict.js` | Vercel 서버 함수 `POST /api/predict` | F-01, F-03 |
| `lib/model.js` | HAIP 모델 계산 + 입력 검사 + 행동 안내 | F-01, F-02, N-3 |
| `model.json` | HAIP M2 모델 숫자 (pkl에서 변환) | — |
| `tests/run-tests.js` | 자동 테스트 T1~T6 | — |
| `dev-server.js` | 내 컴퓨터에서 미리 실행 | — |

## API
| 방식 | 주소 | 요청 → 응답 |
|---|---|---|
| GET | `/` | 화면 |
| POST | `/api/predict` | `{lux, noise_avg, noise_max, minute, after_lunch}` → `{drowsy, prob, tip}` |
| POST | `/api/predict` | `{rows: [...]}` → `{results: [...]}` (최대 2000행) |

입력 범위: lux 0~1023, noise_avg·noise_max 0~255, minute 0~60, after_lunch 0 또는 1. 벗어나면 400.

## 1. 내 컴퓨터에서 실행 (Node.js 필요)
```
node dev-server.js      → 브라우저에서 http://localhost:3000
node tests/run-tests.js → 자동 테스트 6개
```

## 2. Vercel에 배포 (약 10분)
1. **GitHub**에서 새 저장소(New repository)를 만든다. 이름 예: `sleepy-signal`, Public.
2. 저장소 화면의 **Add file → Upload files**에 이 폴더 안의 파일과 폴더를 **통째로** 끌어다 놓고 Commit.
   (압축 파일이 아니라 압축을 푼 내용을 올린다. `api`, `lib`, `public`, `tests` 폴더가 보여야 한다.)
3. **vercel.com**에 GitHub 계정으로 로그인 → **Add New… → Project** → 방금 만든 저장소 **Import**.
4. Framework Preset은 **Other**, Build Command·Output Directory는 **비워 둔 채** **Deploy**.
5. 배포 주소(`https://….vercel.app`)를 열어 확인한다.
   - "지금 교실"에서 **화 5교시 25분째**를 누르면 빨간 **졸음 의심 93%**가 나와야 한다.
   - "하루 리포트"에서 **예시 파일로 보기**를 누르면 **11/19(목) 6교시 — 68%**가 나와야 한다.
   - 화면 맨 아래에 **이 화면이 열린 시간 ○.○○초**가 나온다 (N-1 측정용).
6. GitHub 저장소의 **Releases → Create a new release**에서 태그 `v1.0`을 만든다.

## 3. 수정 버전 v1.1
사용자 테스트 피드백으로 고친 뒤 GitHub에 다시 올리면 Vercel이 자동으로 다시 배포한다. 화면 아래 `v1.0`을 `v1.1`로 바꾸고 태그 `v1.1`을 만든다.

## 모델 정보 (HAIP에서 받은 것)
- `drowsiness_model.pkl` (로지스틱 회귀 M2) → JavaScript에서 pkl을 읽을 수 없어 숫자만 `model.json`으로 옮김. 500행 판정이 pkl과 100% 같음 (T1).
- 목요일 시험 F1 0.843. "졸음 의심"은 움직임이 오전 평균의 절반(7.5) 미만인 상태로 정의한 **추정**이다.
- 한 교실·이틀 데이터로 학습했고, 평균 소음의 영향이 가장 크다.
