# samsigi-sync

'건강한 세 끼' 앱에서 직접 추가한 레시피를 동기화 코드로 여러 기기에 맞추는 Cloudflare Worker.

- 주소: https://samsigi-sync.iamsunghan.workers.dev
- 저장소: Workers KV `samsigi-sync` (키 `v1:<코드>`, 2년 동안 안 쓰면 자동 삭제)
- 받는 데이터: 사용자가 만든 레시피와 삭제 기록뿐 (프로필·건강 정보·식단은 받지 않음)
- 요청 허용 사이트: `cloudflare.config.ts`의 `ALLOWED_ORIGINS`

| 요청 | 설명 |
| --- | --- |
| `POST /v1/codes` | 새 동기화 코드 만들기 |
| `GET /v1/sync/:code` | 저장된 레시피 받기 |
| `PUT /v1/sync/:code` | `{ recipes, deleted }`를 보내 서버 것과 합치기 (레시피마다 더 최근 것 우선) |

배포: `cd sync-worker && npm install && cf deploy`
