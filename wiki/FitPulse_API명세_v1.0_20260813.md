# 🔌 FitPulse API 명세서

| 항목 | 내용 |
|------|------|
| 문서 유형 | API 명세 (API Specification) |
| 버전 | v1.0 (API `v1`) |
| 작성일 | 2026-08-13 |
| 표준 | OpenAPI 3.1 (SpringDoc 3.x 자동 생성) |
| Swagger UI | `http://localhost:8080/swagger-ui` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |

---

## 1. 기본 정보

### 1.1 Base URL

| 환경 | URL |
|------|-----|
| 로컬 | `http://localhost:8080/api/v1` |
| 개발 | `https://dev-api.fitpulse.app/api/v1` |
| 운영 | `https://api.fitpulse.app/api/v1` |

### 1.2 공통 헤더

| 헤더 | 필수 | 설명 |
|------|------|------|
| `Authorization` | 인증 API 제외 필수 | `Bearer {accessToken}` |
| `Content-Type` | 요청 본문 시 | `application/json` |
| `X-Client-Id` | 쓰기 요청 권장 | 멱등성 UUID (body.clientId로 대체 가능) |
| `X-Correlation-Id` | 선택 | 요청 추적 ID (미지정 시 서버 생성 후 응답 반환) |
| `X-Device-Id` | 인증 API 필수 | 기기 UUID |
| `If-Match` | 수정 요청 선택 | ETag 기반 낙관적 잠금 |

### 1.3 공통 응답 규약

**성공 (단건)**
```json
{
  "id": 42,
  "createdAt": "2026-08-13T09:30:00Z"
}
```

**성공 (목록, cursor 페이지네이션)**
```json
{
  "items": [ /* ... */ ],
  "nextCursor": "eyJpZCI6MTAyfQ==",
  "hasMore": true
}
```

**오류**
```json
{
  "code": "WORKOUT_NOT_FOUND",
  "message": "요청한 운동 세션을 찾을 수 없습니다.",
  "details": { "sessionId": 999 },
  "correlationId": "3f2a-..."
}
```

### 1.4 HTTP 상태 코드 정책

| 코드 | 사용 상황 |
|------|-----------|
| 200 | 조회/수정 성공 |
| 201 | 생성 성공 (Location 헤더 포함) |
| 202 | 비동기 작업 접수 (AI Job) |
| 204 | 삭제 성공 |
| 207 | 배치 부분 성공 (일부 실패 포함) |
| 400 | 유효성 오류 |
| 401 | 인증 실패/만료 |
| 403 | 권한 없음(타 사용자 리소스) |
| 404 | 리소스 없음 |
| 409 | 충돌 (버전 불일치, 중복) |
| 412 | If-Match 실패 |
| 429 | Rate Limit 초과 |
| 500 | 서버 오류 |
| 503 | 외부 의존 장애 (AI 전면 실패 등) |

### 1.5 에러 코드 목록

| code | HTTP | 설명 |
|------|------|------|
| `VALIDATION_FAILED` | 400 | 요청 필드 유효성 오류 (`details.fields`) |
| `EMAIL_ALREADY_EXISTS` | 409 | 이메일 중복 |
| `INVALID_CREDENTIALS` | 401 | 이메일/비밀번호 불일치 |
| `INVALID_ID_TOKEN` | 401 | Google ID Token 검증 실패 |
| `TOKEN_EXPIRED` | 401 | Access Token 만료 |
| `REFRESH_TOKEN_REUSED` | 401 | 재사용 감지 → family 전체 폐기됨 |
| `SESSION_LIMIT_EXCEEDED` | 200(안내) | 5대 초과로 최고령 세션 폐기됨 (응답 `revokedDevice` 포함) |
| `FORBIDDEN_RESOURCE` | 403 | 타 사용자 리소스 접근 |
| `WORKOUT_NOT_FOUND` | 404 | 세션 없음 |
| `SET_NOT_FOUND` | 404 | 세트 없음 |
| `EXERCISE_NOT_FOUND` | 404 | 운동 없음 |
| `ROUTINE_VERSION_CONFLICT` | 409 | 루틴 버전 충돌 |
| `SESSION_ALREADY_COMPLETED` | 409 | 완료된 세션에 대한 잘못된 조작 |
| `DUPLICATE_CLIENT_ID` | 200(멱등) | 기존 리소스 반환 (오류 아님) |
| `HEALTH_SYNC_PARTIAL_FAILURE` | 207 | 배치 일부 실패 |
| `CONSENT_REQUIRED` | 403 | 필요한 동의 미획득 (`details.consentType`) |
| `AI_RATE_LIMIT_EXCEEDED` | 429 | AI 일일 10회 초과 |
| `AI_VALIDATION_FAILED` | 200(Job 상태) | 생성 루틴이 검증 실패 |
| `AI_ALL_PROVIDERS_FAILED` | 503 | 폴백까지 전부 실패 (템플릿도 불가한 경우만) |

---

## 2. 인증 API

### 2.1 엔드포인트 목록

| Method | Endpoint | 인증 | 설명 | 요구사항 |
|--------|----------|------|------|----------|
| POST | `/auth/signup` | - | 이메일 가입 | FR-001 |
| POST | `/auth/login` | - | 이메일 로그인 | FR-002 |
| POST | `/auth/social/google` | - | Google PKCE 로그인 | FR-003~004 |
| POST | `/auth/refresh` | - | 토큰 회전 | FR-005~006 |
| POST | `/auth/logout` | ✔ | 현재 기기 로그아웃 | FR-009 |
| DELETE | `/auth/account` | ✔ | 계정 삭제 (30일 유예) | FR-105 |

### 2.2 POST /auth/signup

**Request**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd123",
  "name": "홍길동",
  "device": { "deviceId": "8f14e45f-...", "platform": "ANDROID", "appVersion": "1.0.0", "osVersion": "14" },
  "consents": [
    { "consentType": "TERMS", "version": "1.0", "agreed": true },
    { "consentType": "PRIVACY", "version": "1.0", "agreed": true },
    { "consentType": "HEALTH_DATA", "version": "1.0", "agreed": false }
  ]
}
```

| 필드 | 타입 | 필수 | 유효성 |
|------|------|------|--------|
| email | string | ✔ | RFC 5322, 최대 255자, 중복 불가 |
| password | string | ✔ | 8자 이상, 영문/숫자/특수문자 중 2종 이상 |
| name | string | ✔ | 1~50자 |
| device.deviceId | uuid | ✔ | - |
| consents | array | ✔ | TERMS, PRIVACY 필수 동의 |

**Response 201**
```json
{
  "userId": 1,
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "9f8c...",
  "accessTokenExpiresIn": 900
}
```

**Errors**: `VALIDATION_FAILED`(400), `EMAIL_ALREADY_EXISTS`(409)

### 2.3 POST /auth/social/google

**Request**
```json
{
  "code": "4/0AY0e-g7...",
  "codeVerifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
  "device": { "deviceId": "8f14e45f-...", "platform": "ANDROID", "appVersion": "1.0.0", "osVersion": "14" }
}
```

**처리 절차**
1. Google Token Endpoint에 `code` + `codeVerifier` 교환 → ID Token
2. ID Token 검증: `iss=accounts.google.com`, `aud`=자사 client_id, `exp > now`, `email_verified=true`
3. `sub`로 `user_auth_accounts` 조회 (없으면 사용자 생성 + 연동)
4. Access(15분) + Refresh 발급, 세션 상한 5개 적용

**Response 200**
```json
{
  "userId": 1,
  "isNewUser": false,
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "9f8c...",
  "accessTokenExpiresIn": 900,
  "revokedDevice": { "deviceId": "old-uuid", "reason": "SESSION_LIMIT_EXCEEDED" }
}
```

**Errors**: `INVALID_ID_TOKEN`(401), `VALIDATION_FAILED`(400)

### 2.4 POST /auth/refresh

**Request**
```json
{ "refreshToken": "9f8c...", "deviceId": "8f14e45f-..." }
```

**Response 200**
```json
{ "accessToken": "eyJ...", "refreshToken": "새로운값", "accessTokenExpiresIn": 900 }
```

**동작**: 기존 Refresh 즉시 폐기 후 신규 발급(같은 family_id 유지). 이미 폐기된 토큰이 제출되면 도난으로 간주해 동일 family 전체를 폐기하고 `REFRESH_TOKEN_REUSED`(401) 반환.

### 2.5 DELETE /auth/account

**Request**: `{ "reason": "사용 빈도 낮음" }`
**Response 202**
```json
{ "status": "WITHDRAWAL_PENDING", "withdrawalAt": "2026-08-13T09:00:00Z", "permanentDeleteAt": "2026-09-12T09:00:00Z" }
```
유예 기간 내 재로그인 시 자동 복구됩니다.

---

## 3. 사용자 API

| Method | Endpoint | 설명 | 요구사항 |
|--------|----------|------|----------|
| GET | `/users/me` | 프로필 조회 | FR-101 |
| PUT | `/users/me` | 프로필 수정 | FR-101 |
| GET | `/users/me/goals` | 목표 조회 | FR-102 |
| PUT | `/users/me/goals` | 목표 수정 | FR-102 |
| GET | `/users/me/consents` | 동의 현황 | FR-103 |
| PUT | `/users/me/consents` | 동의/철회 | FR-103~104 |
| GET | `/users/me/devices` | 기기 목록 | FR-008 |
| DELETE | `/users/me/devices/{deviceId}` | 기기 세션 폐기 | FR-008 |
| GET | `/users/me/data-export` | 데이터 내보내기 | FR-106 |

**PUT /users/me/goals — Request**
```json
{
  "goalType": "MUSCLE_GAIN",
  "targetWeight": 78.0,
  "weeklyWorkoutDays": 4,
  "experienceLevel": "INTERMEDIATE",
  "availableEquipment": ["BARBELL", "DUMBBELL", "MACHINE"],
  "injuryNotes": "왼쪽 어깨 회전근개 통증, 오버헤드 프레스 회피"
}
```

**GET /users/me/devices — Response 200**
```json
{
  "items": [
    { "deviceId": "8f14...", "platform": "ANDROID", "appVersion": "1.0.0", "lastSeenAt": "2026-08-13T08:00:00Z", "isCurrent": true }
  ]
}
```

**PUT /users/me/consents — Request**
```json
{ "consents": [ { "consentType": "HEALTH_DATA", "version": "1.0", "agreed": false } ] }
```
> `HEALTH_DATA` 철회 시 응답에 `healthDataDeletionRequired: true`를 포함하며, 앱은 기존 데이터 삭제 여부를 사용자에게 확인합니다.

---

## 4. 운동 라이브러리 API

| Method | Endpoint | 설명 | 요구사항 |
|--------|----------|------|----------|
| GET | `/exercise-categories` | 카테고리 목록 | FR-203 |
| GET | `/exercises` | 운동 목록 (cursor) | FR-201 |
| GET | `/exercises/search` | 검색·필터 | FR-202 |
| GET | `/exercises/{id}` | 상세 | FR-204 |
| POST | `/exercises/custom` | 커스텀 등록 | FR-205 |

**GET /exercises/search — Query**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `q` | string | 이름 부분 일치 (한/영) |
| `muscle` | string | 주동근 |
| `equipment` | string | 장비 |
| `difficulty` | string | BEGINNER/INTERMEDIATE/ADVANCED |
| `type` | string | WEIGHT/BODYWEIGHT/CARDIO/STRETCH/MACHINE |
| `cursor` / `limit` | string / int | 페이지네이션 (limit 기본 20, 최대 100) |

**Response 200**
```json
{
  "items": [
    { "id": 101, "name": "바벨 벤치프레스", "nameEn": "Barbell Bench Press",
      "type": "WEIGHT", "primaryMuscle": "CHEST", "difficulty": "INTERMEDIATE",
      "equipment": "BARBELL", "imageUrl": "https://.../bench.png", "isCustom": false }
  ],
  "nextCursor": "eyJpZCI6MTAxfQ==",
  "hasMore": true
}
```

---

## 5. 루틴 API

| Method | Endpoint | 설명 | 요구사항 |
|--------|----------|------|----------|
| POST | `/routines` | 루틴 생성 | FR-301 |
| GET | `/routines` | 내 루틴 목록 | FR-301 |
| GET | `/routines/{id}` | 상세 (current_version 기준) | FR-302 |
| GET | `/routines/{id}/versions` | 버전 목록 | FR-302 |
| GET | `/routines/{id}/versions/{version}` | 특정 버전 상세 | FR-302 |
| PUT | `/routines/{id}` | 수정 (새 버전 생성) | FR-302 |
| DELETE | `/routines/{id}` | 삭제 | FR-301 |
| POST | `/routines/{id}/copy` | 복사 | FR-306 |
| GET | `/routines/public` | 공개 루틴 | FR-306 |
| GET/PUT | `/routines/{id}/schedules` | 요일 배정 | FR-305 |

**POST /routines — Request**
```json
{
  "name": "5분할 상하체",
  "description": "주 5회 분할",
  "type": "USER",
  "goal": "MUSCLE_GAIN",
  "level": "INTERMEDIATE",
  "days": [
    {
      "sequenceNo": 1, "name": "가슴/삼두", "isRestDay": false,
      "exercises": [
        { "exerciseId": 101, "orderNum": 1, "targetSets": 4, "targetReps": "8-12", "restSeconds": 120, "memo": "" }
      ]
    },
    { "sequenceNo": 2, "name": "휴식", "isRestDay": true, "exercises": [] }
  ]
}
```

**PUT /routines/{id}** — 수정 시 새 `routine_versions` 레코드를 생성하고 `current_version`을 증가시킵니다. `If-Match: "v3"` 불일치 시 `ROUTINE_VERSION_CONFLICT`(409).

---

## 6. 운동 기록 API

| Method | Endpoint | 설명 | 요구사항 |
|--------|----------|------|----------|
| POST | `/workout-sessions` | 세션 시작 | FR-401 |
| POST | `/workout-sessions/batch` | 배치 Op 처리 | FR-505 |
| GET | `/workout-sessions` | 이력 (cursor) | FR-408 |
| GET | `/workout-sessions/active` | 진행 중 세션 | FR-409 |
| GET | `/workout-sessions/{id}` | 상세 | FR-408 |
| PUT | `/workout-sessions/{id}/complete` | 완료 | FR-405 |
| PUT | `/workout-sessions/{id}/cancel` | 취소 | FR-401 |
| POST | `/workout-sessions/{id}/exercises` | 종목 추가 | FR-402 |
| POST | `/workout-exercises/{id}/sets` | 세트 기록 | FR-403 |
| PUT | `/workout-sets/{id}` | 세트 수정 | FR-404 |
| DELETE | `/workout-sets/{id}` | 세트 삭제 | FR-404 |

### 6.1 POST /workout-sessions

**Request**
```json
{
  "clientId": "5c3a1e2b-...",
  "routineId": 12,
  "routineVersion": 3,
  "title": "가슴/삼두",
  "startedAt": "2026-08-13T09:00:00Z"
}
```

**Response 201**
```json
{ "id": 42, "clientId": "5c3a1e2b-...", "status": "IN_PROGRESS", "startedAt": "2026-08-13T09:00:00Z" }
```

> **멱등성**: 동일 `clientId` 재전송 시 새 리소스를 만들지 않고 기존 세션을 200으로 반환합니다.

### 6.2 POST /workout-exercises/{id}/sets

**Request**
```json
{
  "clientId": "9d0b-...",
  "setNumber": 1,
  "setType": "NORMAL",
  "weightKg": 80.0,
  "reps": 10,
  "rpe": 8,
  "isCompleted": true
}
```

| 필드 | 유효성 |
|------|--------|
| weightKg | ≥ 0 |
| reps | ≥ 0 |
| durationSec | ≥ 0 (유산소/시간 기반) |
| rpe | 1~10 |
| setNumber | 종목 내 유일 |

**Response 201**: `{ "id": 307, "clientId": "9d0b-...", "setNumber": 1 }`

### 6.3 PUT /workout-sessions/{id}/complete

**Request**: `{ "endedAt": "2026-08-13T10:12:00Z", "memo": "컨디션 좋음", "mood": "GOOD" }`

**Response 200**
```json
{
  "id": 42, "status": "COMPLETED",
  "computedDurationMin": 72,
  "computedTotalVolume": 7420.0,
  "computedTotalCalories": 430,
  "computedAt": "2026-08-13T10:12:01Z"
}
```

### 6.4 POST /workout-sessions/batch (오프라인 큐 전송)

**Request**
```json
{
  "batchId": "b1f0-...",
  "operations": [
    { "clientId": "sess-001", "opType": "CREATE_SESSION", "payload": { "startedAt": "2026-08-13T09:00:00Z", "routineId": 12 } },
    { "clientId": "wex-001", "opType": "ADD_EXERCISE", "dependsOn": "sess-001", "payload": { "sessionId": "$ref:sess-001", "exerciseId": 101, "orderNum": 1 } },
    { "clientId": "set-001", "opType": "ADD_SET", "dependsOn": "wex-001", "payload": { "workoutExerciseId": "$ref:wex-001", "setNumber": 1, "weightKg": 80, "reps": 10 } },
    { "clientId": "sess-001-c", "opType": "COMPLETE_SESSION", "dependsOn": "sess-001", "payload": { "sessionId": "$ref:sess-001", "endedAt": "2026-08-13T10:12:00Z" } }
  ]
}
```

**Response 207 (부분 성공 포함)**
```json
{
  "batchId": "b1f0-...",
  "results": [
    { "clientId": "sess-001", "status": "SUCCESS", "serverId": 42 },
    { "clientId": "wex-001", "status": "SUCCESS", "serverId": 88 },
    { "clientId": "set-001", "status": "SUCCESS", "serverId": 307 },
    { "clientId": "sess-001-c", "status": "CONFLICT", "code": "SESSION_ALREADY_COMPLETED",
      "resolution": "REOPEN_REQUIRED", "serverState": { "status": "COMPLETED" } }
  ],
  "successCount": 3,
  "failureCount": 1
}
```

**서버 처리 규칙**
- `operations`는 배열 순서대로 순차 처리하되, `dependsOn`이 실패하면 해당 후속 Op는 `SKIPPED` 처리
- `$ref:{clientId}`는 같은 배치 내 선행 Op의 `serverId`로 치환
- 전체 성공 시 200, 일부 실패 시 207

### 6.5 충돌 해결 매트릭스 (서버 응답 기준)

| 상황 | 서버 처리 | 응답 status |
|------|-----------|-------------|
| ADD_SET + 세션 정상 | 적용 | SUCCESS |
| ADD_SET + 세션 COMPLETED | 재오픈 → 적용 → 재완료 | SUCCESS (`reopened: true`) |
| ADD_SET + 세션 삭제됨 | 적용 불가 | CONFLICT |
| UPDATE_SET + 세트 삭제됨 | 적용 불가 | CONFLICT |
| DELETE_SET + 이미 삭제 | 무시 (멱등) | SUCCESS |
| CREATE_SESSION + clientId 존재 | 기존 반환 (멱등) | SUCCESS |
| COMPLETE_SESSION + 이미 완료 | 무시 (멱등) | SUCCESS |
| 소유자 불일치 | 거부 | FAILED (`FORBIDDEN_RESOURCE`) |

---

## 7. 건강 데이터 API

| Method | Endpoint | 설명 | 요구사항 |
|--------|----------|------|----------|
| POST | `/health/sync` | 동기화 배치 업로드 | FR-708~710 |
| GET | `/health/sync/cursors` | 커서 조회 | FR-703 |
| GET | `/health/dashboard` | 대시보드 요약 | FR-713 |
| GET | `/health/steps` | 걸음수 시계열 | FR-713 |
| GET | `/health/heart-rate` | 심박 시계열 | FR-713 |
| GET | `/health/sleep` | 수면 시계열 | FR-713 |
| POST | `/health/body-metrics` | 체성분 입력 | FR-714 |
| GET | `/health/body-metrics` | 체성분 추이 | FR-714 |
| DELETE | `/health/observations` | 건강 데이터 일괄 삭제(연동 해제 시) | FR-715 |

### 7.1 POST /health/sync

**Request**
```json
{
  "clientBatchId": "e77c-...",
  "source": "HEALTH_CONNECT",
  "fullResync": false,
  "upserts": [
    { "sourceRecordId": "hc-rec-9981", "sourceApp": "com.google.android.apps.fitness",
      "dataType": "STEPS", "startAtUtc": "2026-08-13T00:00:00Z", "endAtUtc": "2026-08-13T01:00:00Z",
      "timezoneOffset": 540, "numericValue": 1240, "unit": "count", "sourceUpdatedAt": "2026-08-13T01:00:05Z" },
    { "sourceRecordId": "hc-rec-9982", "sourceApp": "com.samsung.health",
      "dataType": "HEART_RATE", "startAtUtc": "2026-08-13T01:05:00Z", "endAtUtc": null,
      "timezoneOffset": 540, "numericValue": 72, "unit": "bpm" }
  ],
  "deletes": ["hc-rec-9800", "hc-rec-9801"]
}
```

| 필드 | 설명 |
|------|------|
| `clientBatchId` | 배치 멱등 키 |
| `fullResync` | true면 해당 user+platform 기존 데이터와 비교 병합 |
| `upserts` | 최대 500건 (초과 시 400) |
| `deletes` | sourceRecordId 배열 → soft delete |

**Response 200 / 207**
```json
{
  "syncJobId": 5521,
  "recordsSynced": 498,
  "recordsSkipped": 2,
  "recordsDeleted": 2,
  "failed": [ { "sourceRecordId": "hc-rec-9977", "code": "VALIDATION_FAILED", "message": "numericValue must be >= 0" } ],
  "summariesUpdated": ["2026-08-13"]
}
```

**동작 규칙**
- 트랜잭션 경계 = 배치 1건(최대 500건). 부분 실패 시 성공분은 커밋하고 실패 목록을 반환 → 클라이언트가 실패 건만 재시도
- `UNIQUE(user_id, source_platform, source_record_id)` 기준 upsert (중복 저장 없음)
- `sourceApp`이 FitPulse인 레코드는 클라이언트에서 이미 제외하지만, 서버도 방어적으로 스킵
- 처리 후 `HealthDataSynced` 이벤트 → `daily_health_summaries` 갱신

### 7.2 GET /health/dashboard

**Query**: `?date=2026-08-13` (기본 오늘)

**Response 200**
```json
{
  "date": "2026-08-13",
  "steps": { "total": 8421, "goal": 10000 },
  "activeCalories": 412,
  "heartRate": { "avg": 68, "min": 52, "max": 148 },
  "sleep": { "durationMin": 412, "qualityScore": 78 },
  "distanceKm": 6.2,
  "lastSyncedAt": "2026-08-13T08:55:00Z",
  "notice": "ℹ️ 참고용 피트니스 인사이트이며, 의학적 진단이 아닙니다."
}
```

### 7.3 POST /health/body-metrics

**Request**: `{ "clientId": "bm-001", "weightKg": 76.4, "bodyFatPct": 15.2, "muscleMass": 34.1, "measuredAt": "2026-08-13T07:00:00Z" }`
**Response 201**: `{ "id": 91, "bmi": 24.1 }`

---

## 8. 분석 API

| Method | Endpoint | 설명 | 요구사항 |
|--------|----------|------|----------|
| GET | `/analytics/1rm/{exerciseId}` | 1RM 추이 | FR-601 |
| GET | `/analytics/volume` | 볼륨 추이 | FR-602 |
| GET | `/analytics/frequency` | 부위별 빈도 | FR-603 |
| GET | `/analytics/calendar` | 캘린더(잔디) | FR-604 |
| GET | `/analytics/streak` | 스트릭 | FR-605 |

**공통 Query**: `from`, `to` (ISO date), `granularity` = `DAY` / `WEEK` / `MONTH`

**GET /analytics/volume — Response**
```json
{
  "granularity": "WEEK",
  "series": [
    { "period": "2026-W31", "totalVolume": 28400.0, "sessionCount": 4 },
    { "period": "2026-W32", "totalVolume": 31250.5, "sessionCount": 5 }
  ]
}
```

**GET /analytics/1rm/{exerciseId} — Response**
```json
{
  "exerciseId": 101,
  "formula": "EPLEY",
  "series": [ { "date": "2026-08-05", "estimated1rm": 104.0, "bestSet": { "weightKg": 80, "reps": 9 } } ]
}
```
> 1RM은 `reps ≤ 12`인 완료 세트만 대상으로 하며 추정치입니다.

**GET /analytics/streak — Response**
```json
{ "currentStreakDays": 5, "longestStreakDays": 23, "lastWorkoutDate": "2026-08-13" }
```

---

## 9. AI 추천 API

| Method | Endpoint | 설명 | 요구사항 |
|--------|----------|------|----------|
| POST | `/ai/routine-jobs` | 루틴 생성 요청 (비동기) | FR-801 |
| GET | `/ai/routine-jobs/{jobId}` | 상태·결과 조회 | FR-802 |
| GET | `/ai/routine-jobs` | 내 AI 요청 이력 | FR-802 |
| POST | `/ai/routine-jobs/{jobId}/accept` | 루틴 확정 저장 | FR-811~812 |
| POST | `/ai/routine-jobs/{jobId}/reject` | 거절 | FR-811 |

### 9.1 POST /ai/routine-jobs

**Request**
```json
{
  "clientId": "aij-001",
  "preferences": { "weeklyDays": 4, "sessionMinutes": 60, "focusMuscles": ["CHEST", "BACK"] }
}
```
> 서버가 `fitness_goals`, 최근 30일 운동 이력, 1RM·볼륨을 **비식별 요약**으로 구성합니다. 이름·이메일은 전송되지 않습니다.

**Response 202**
```json
{ "jobId": 771, "status": "PENDING", "pollAfterMs": 2000 }
```

**Errors**: `AI_RATE_LIMIT_EXCEEDED`(429, `details.resetAt`), `CONSENT_REQUIRED`(403, `details.consentType="AI_PROCESSING"`)

### 9.2 GET /ai/routine-jobs/{jobId}

**Response 200 (진행 중)**
```json
{ "jobId": 771, "status": "RUNNING", "requestedAt": "2026-08-13T09:00:00Z" }
```

**Response 200 (완료)**
```json
{
  "jobId": 771,
  "status": "COMPLETED",
  "provider": "anthropic",
  "fallbackUsed": false,
  "result": {
    "name": "AI 추천 4분할",
    "days": [
      { "sequenceNo": 1, "name": "가슴/삼두",
        "exercises": [
          { "exerciseId": 101, "name": "바벨 벤치프레스", "targetSets": 4, "targetReps": "8-12", "restSeconds": 120 }
        ] }
    ],
    "rationale": "최근 4주 가슴 볼륨이 등 대비 낮은 편이라 상체 밀기 비중을 조정했습니다.",
    "safetyFlags": [ { "type": "INJURY_AVOIDED", "detail": "어깨 부상 메모로 오버헤드 프레스 제외" } ]
  },
  "notice": "ℹ️ 참고용 피트니스 인사이트이며, 의학적 진단이 아닙니다."
}
```

**Response 200 (검증 실패)**
```json
{ "jobId": 771, "status": "VALIDATION_FAILED", "errorCode": "AI_VALIDATION_FAILED",
  "details": { "mappingFailureRate": 0.42, "retried": true } }
```

**Response 200 (템플릿 폴백)**
```json
{ "jobId": 772, "status": "COMPLETED", "provider": "template", "fallbackUsed": true,
  "message": "AI 추천을 생성할 수 없어 기본 루틴을 제안합니다.", "result": { /* ... */ } }
```

### 9.3 POST /ai/routine-jobs/{jobId}/accept

**Request** (사용자 수정본 포함 가능)
```json
{
  "routineName": "내 4분할",
  "modifications": [
    { "modificationType": "EXERCISE_REPLACED", "originalValue": { "exerciseId": 140 }, "modifiedValue": { "exerciseId": 152 } },
    { "modificationType": "SET_CHANGED", "originalValue": { "targetSets": 4 }, "modifiedValue": { "targetSets": 3 } }
  ]
}
```
**Response 201**: `{ "routineId": 305, "version": 1 }`
> `modifications`는 `ai_routine_modifications`에 저장되어 프롬프트 개선 데이터로 활용됩니다.

---

## 10. 시스템 API

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| GET | `/actuator/health/liveness` | - | 프로세스 생존 (ping) |
| GET | `/actuator/health/readiness` | - | 트래픽 수용 가능 (db, redis) |
| GET | `/actuator/info` | - | 빌드 정보 |
| GET | `/actuator/prometheus` | 내부망 | 메트릭 스크랩 |

---

## 11. Rate Limit 정책

| 대상 | 한도 | 초과 응답 |
|------|------|-----------|
| AI 루틴 요청 | 사용자당 10회/일 | 429 `AI_RATE_LIMIT_EXCEEDED` |
| 로그인 시도 | IP+계정당 10회/10분 | 429 |
| 건강 동기화 | 사용자당 60회/시간 | 429 |
| 일반 API | 사용자당 600회/분 | 429 |

응답 헤더: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 12. API 버전 정책

- 버전은 URI 기반 (`/api/v1/`)
- Breaking change 발생 시 `/api/v2/` 신설, 기존 버전 **6개월 병행**
- 중단 예정 엔드포인트는 `Sunset: Wed, 01 Mar 2027 00:00:00 GMT` 헤더와 `Deprecation: true` 반환
- 하위 호환 변경(필드 추가)은 버전 유지

---

## 13. 테스트 지원

| 항목 | 제공 |
|------|------|
| Swagger UI | `/swagger-ui` (dev 프로필에서만 노출) |
| Postman Collection | `docs/postman/FitPulse.postman_collection.json` |
| 환경 변수 | `{{baseUrl}}`, `{{accessToken}}`, `{{deviceId}}` |
| 시드 계정 | 환경별 `DEV_USER_EMAIL` / `DEV_USER_PASSWORD`로 주입; 고정 기본값 금지 |

---

## 14. 승인

| 구분 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자 | | | |
| 검토자 | | | |
| 승인자 | | | |
