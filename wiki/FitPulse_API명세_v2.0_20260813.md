# 🔌 FitPulse API 명세서

| 항목 | 내용 |
|------|------|
| 문서 유형 | API 명세 (API Specification) |
| 버전 | v2.0 (API `v1`) |
| 작성일 | 2026-08-13 |
| 표준 | OpenAPI 3.1 (SpringDoc 3.x 자동 생성) |
| Swagger UI | `http://localhost:8080/swagger-ui` (사용자 API) / `/swagger-ui?group=admin` (관리자 API) |
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
| `ROUTINE_NOT_PUBLIC` | 404 | 비공개 또는 심사 미통과 루틴 |
| `SELF_LIKE_NOT_ALLOWED` | 400 | 자기 루틴 좋아요 시도 |
| `ALREADY_REPORTED` | 409 | 동일 대상 중복 신고 |
| `CONTENT_BLINDED` | 403 | 신고 누적/제재로 블라인드된 콘텐츠 |
| `ACCOUNT_SUSPENDED` | 403 | 이용정지 상태 (`details.endsAt`, `details.reason`) |
| `PUBLISH_BANNED` | 403 | 공개 권한 정지 상태 |
| `MAINTENANCE_MODE` | 503 | 점검 중 (쓰기 API 차단, `details.message`) |
| `ADMIN_MFA_REQUIRED` | 401 | 관리자 TOTP 미인증 |
| `ADMIN_MFA_INVALID` | 401 | TOTP 코드 불일치 |
| `ADMIN_IP_NOT_ALLOWED` | 403 | 허용되지 않은 IP |
| `ADMIN_PERMISSION_DENIED` | 403 | 권한 코드 미보유 (`details.required`) |
| `ADMIN_ACCOUNT_LOCKED` | 423 | 로그인 5회 실패 잠금 (`details.lockedUntil`) |
| `ADMIN_SESSION_EXPIRED` | 401 | Idle 30분 또는 절대 8시간 만료 |
| `APPROVAL_REQUIRED` | 202 | 2인 승인 필요 (`details.approvalRequestId`) |
| `APPROVAL_SELF_NOT_ALLOWED` | 403 | 요청자 본인이 승인 시도 |
| `REASON_REQUIRED` | 400 | 민감 작업 사유 미입력 |

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
| POST | `/routines/{id}/start` | 루틴으로 세션 시작 | FR-307 |
| PUT | `/routines/{id}/publish` | 공개 전환 (심사 요청) | FR-308 |
| DELETE | `/routines/{id}/publish` | 비공개 전환 | FR-308 |
| GET | `/routines/public` | 공개 루틴 목록 | FR-309 |
| POST | `/routines/{id}/like` | 좋아요 토글 | FR-310 |
| GET | `/routines/ranking` | 인기 랭킹 | FR-312 |
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


### 5.1 커뮤니티 API 상세 ★ v2.0 (CR-013 복원)

**PUT /routines/{id}/publish** — 공개 전환

Request: `{ "publicName": "초보자 3분할", "publicDescription": "주 3회 기준" }`

Response 202
```json
{ "routineId": 305, "isPublic": false, "reviewStatus": "PENDING",
  "message": "공개 심사 요청이 접수되었습니다. 검토 후 공개됩니다." }
```
> `ROUTINE_PUBLIC_REVIEW_REQUIRED=false` 설정 시 즉시 `APPROVED` 처리됩니다. 공개 권한 정지 상태면 403 `PUBLISH_BANNED`.

**GET /routines/public** — 공개 루틴 목록

| Query | 값 | 설명 |
|-------|-----|------|
| `sort` | `POPULAR`(기본) / `RECENT` / `MOST_COPIED` | 정렬 |
| `goal` | MUSCLE_GAIN 등 | 목표 필터 |
| `level` | BEGINNER 등 | 난이도 필터 |
| `days` | 1~7 | 주간 일수 |
| `cursor` / `limit` | - | 페이지네이션 |

Response 200
```json
{
  "items": [
    { "routineId": 305, "name": "초보자 3분할", "ownerNickname": "헬린이",
      "goal": "MUSCLE_GAIN", "level": "BEGINNER", "dayCount": 3,
      "likeCount": 128, "copyCount": 41, "isLikedByMe": false, "publishedAt": "2026-08-01T00:00:00Z" }
  ],
  "nextCursor": "eyJzIjo5OC41fQ==", "hasMore": true
}
```
> 조회 조건은 항상 `is_public=true AND review_status='APPROVED'`입니다(D-19). 블라인드 처리된 루틴은 목록과 상세 모두에서 제외되며, 직접 ID로 접근 시 403 `CONTENT_BLINDED`를 반환합니다.

**POST /routines/{id}/like** — 좋아요 토글 (멱등)

Request: `{ "liked": true }`

Response 200
```json
{ "routineId": 305, "liked": true, "likeCount": 129 }
```

| 상황 | 응답 |
|------|------|
| 이미 좋아요한 상태에서 `liked=true` | 200 (변화 없음, 멱등) |
| 자기 루틴 | 400 `SELF_LIKE_NOT_ALLOWED` |
| 비공개·미승인 루틴 | 404 `ROUTINE_NOT_PUBLIC` |
| 단시간 반복 호출 (10회/분 초과) | 429 |

**GET /routines/ranking** — 인기 랭킹

Query: `?period=WEEKLY|ALL_TIME&limit=50`

Response 200
```json
{
  "period": "WEEKLY",
  "calculatedAt": "2026-08-13T09:00:00Z",
  "items": [
    { "rank": 1, "routineId": 305, "name": "초보자 3분할", "score": 981.0,
      "likeCount": 128, "copyCount": 41 }
  ]
}
```
> 점수 = 좋아요×3 + 복사×5 + 조회×1. Redis Sorted Set에서 실시간 조회하며, Redis 장애 시 최신 `routine_ranking_snapshots`로 폴백합니다(응답 `calculatedAt`이 과거 시각으로 표시됨).

**POST /reports** — 신고

Request
```json
{ "targetType": "ROUTINE", "targetId": 305, "reasonCode": "DANGEROUS",
  "detail": "초보자에게 위험한 중량을 권장합니다" }
```
Response 201: `{ "reportId": 88, "status": "PENDING" }`
Errors: `ALREADY_REPORTED`(409)

**GET /users/me/sanctions** — 내 제재 현황

```json
{ "items": [ { "actionType": "PUBLISH_BAN", "reason": "부적절한 루틴 반복 게시",
  "startsAt": "2026-08-10T00:00:00Z", "endsAt": "2026-08-17T00:00:00Z",
  "appealStatus": "NONE", "appealable": true } ] }
```

**POST /users/me/sanctions/{id}/appeal** — 이의제기 (1회)
Request: `{ "message": "해당 루틴은 중급자 대상임을 명시했습니다" }` → 200 `{ "appealStatus": "REQUESTED" }`

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

## 10. 관리자 API ★ v2.0 (CR-014)

### 10.0 공통 규약 (사용자 API와의 차이)

| 항목 | 사용자 API | 관리자 API |
|------|-----------|-----------|
| Base Path | `/api/v1/**` | `/api/v1/admin/**` |
| 인증 주체 | `users` | **`admins` (별도 테이블·별도 토큰)** |
| 토큰 헤더 | `Authorization: Bearer {userToken}` | `Authorization: Bearer {adminToken}` |
| 추가 인증 | - | **TOTP 2FA 필수** |
| 세션 수명 | Access 15분 | Access 30분 / Idle 30분 / 절대 8시간 |
| 인가 | 소유권(user_id) 검사 | **permission 코드 검사** |
| 감사 | 일반 로그 | **쓰기·민감 조회 100% `admin_audit_logs` 기록** |
| 네트워크 | 공개 | 내부망 또는 IP 허용 목록 (운영) |

**공통 헤더**

| 헤더 | 필수 | 설명 |
|------|------|------|
| `Authorization` | ✔ | `Bearer {adminToken}` |
| `X-Admin-Reason` | 민감 작업 시 ✔ | 사유 (감사 로그 `reason`에 기록). 미입력 시 400 `REASON_REQUIRED` |
| `X-Correlation-Id` | 선택 | 추적 |

**사용자 토큰으로 관리자 API 호출 시**: 401 (토큰 발급자 불일치). 반대도 동일합니다.

---

### 10.1 관리자 인증

| Method | Endpoint | 권한 | 설명 | 요구사항 |
|--------|----------|------|------|----------|
| POST | `/admin/auth/login` | - | 1단계: 이메일+비밀번호 | FR-901 |
| POST | `/admin/auth/mfa/verify` | - | 2단계: TOTP 검증 | FR-905 |
| POST | `/admin/auth/mfa/setup` | 본인 | TOTP 최초 등록 | FR-905 |
| POST | `/admin/auth/refresh` | - | 세션 갱신 | FR-907 |
| POST | `/admin/auth/logout` | 본인 | 로그아웃 | FR-907 |
| POST | `/admin/auth/accept-invite` | - | 초대 수락·비밀번호 설정 | FR-902 |
| PUT | `/admin/auth/password` | 본인 | 비밀번호 변경 | FR-910 |

**POST /admin/auth/login**

Request: `{ "email": "ops@fitpulse.app", "password": "..." }`

Response 200 (MFA 미완료 상태)
```json
{ "mfaRequired": true, "mfaToken": "임시토큰(5분)", "mfaEnrolled": true }
```
> 이 단계의 `mfaToken`으로는 어떤 기능 API도 호출할 수 없습니다.

**POST /admin/auth/mfa/verify**

Request: `{ "mfaToken": "...", "code": "123456" }` (또는 `"backupCode": "..."`)

Response 200
```json
{
  "adminId": 3, "name": "김운영", "role": "OPERATOR",
  "permissions": ["USER_READ", "EXERCISE_WRITE", "REPORT_HANDLE", "ROUTINE_REVIEW"],
  "accessToken": "...", "expiresIn": 1800,
  "absoluteExpiresAt": "2026-08-13T17:00:00Z"
}
```

**Errors**: `ADMIN_MFA_INVALID`(401), `ADMIN_ACCOUNT_LOCKED`(423), `ADMIN_IP_NOT_ALLOWED`(403)

---

### 10.2 관리자 계정·권한 관리

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/admin/accounts` | `ADMIN_ACCOUNT_MANAGE` | 관리자 목록 |
| POST | `/admin/accounts/invite` | `ADMIN_ACCOUNT_MANAGE` | 초대 발송 |
| PATCH | `/admin/accounts/{id}/role` | `ADMIN_ROLE_MANAGE` | 역할 변경 |
| PATCH | `/admin/accounts/{id}/status` | `ADMIN_ACCOUNT_MANAGE` | 활성/잠금해제/비활성 |
| DELETE | `/admin/accounts/{id}/sessions` | `ADMIN_ACCOUNT_MANAGE` | 강제 로그아웃 |
| GET | `/admin/roles` | `ADMIN_ROLE_MANAGE` | 역할·권한 매트릭스 |

**POST /admin/accounts/invite**

Request: `{ "email": "new@fitpulse.app", "name": "이신입", "roleCode": "SUPPORT" }`
Response 201: `{ "adminId": 7, "status": "INVITED", "inviteExpiresAt": "2026-08-16T09:00:00Z" }`

> 초대 링크는 이메일로만 전달되며 응답에 토큰을 포함하지 않습니다. 72시간 후 만료되며 재발송 시 이전 토큰은 폐기됩니다.

**PATCH /admin/accounts/{id}/status**

Request: `{ "status": "DISABLED" }` + 헤더 `X-Admin-Reason: 퇴사 처리`
Response 200: `{ "adminId": 7, "status": "DISABLED", "revokedSessions": 2 }`

> 관리자 계정은 **삭제되지 않습니다**(D-18). 비활성화만 가능하며 감사 로그 추적성을 위해 레코드가 보존됩니다.

---

### 10.3 회원 관리

| Method | Endpoint | 권한 | 설명 | 요구사항 |
|--------|----------|------|------|----------|
| GET | `/admin/users` | `USER_READ` | 회원 검색 (마스킹) | FR-921, 923 |
| GET | `/admin/users/{id}` | `USER_READ` | 회원 상세 (마스킹) | FR-922 |
| POST | `/admin/users/{id}/unmask` | `USER_PII_UNMASK` | 개인정보 마스킹 해제 | FR-923 |
| PATCH | `/admin/users/{id}/status` | `USER_SUSPEND` | 이용정지/해제 | FR-924 |
| DELETE | `/admin/users/{id}/sessions` | `USER_FORCE_LOGOUT` | 강제 로그아웃 | FR-925 |
| POST | `/admin/users/{id}/hard-delete` | `USER_HARD_DELETE` ⚠️ | 즉시 삭제 (2인 승인) | FR-926 |
| POST | `/admin/users/{id}/data-export` | `USER_DATA_EXPORT` ⚠️ | 내보내기 대행 (2인 승인) | FR-927 |
| GET | `/admin/users/{id}/activities` | `USER_READ` | 활동 이력 | FR-928 |

**GET /admin/users** — Response 200 (기본 마스킹)
```json
{
  "items": [
    { "userId": 1024, "email": "ho***@gm***.com", "name": "홍*동", "nickname": "헬린이",
      "status": "ACTIVE", "provider": "GOOGLE", "createdAt": "2026-03-01T00:00:00Z",
      "lastSeenAt": "2026-08-13T07:20:00Z", "sessionCount": 42, "masked": true }
  ],
  "nextCursor": "...", "hasMore": true, "totalEstimate": 10432
}
```

**POST /admin/users/{id}/unmask**

Request: `{ "reason": "고객센터 문의 #4821 본인 확인" }`
Response 200: `{ "userId": 1024, "email": "hong@gmail.com", "name": "홍길동", "masked": false, "auditLogId": 90211 }`

> 마스킹 해제는 **읽기 행위이지만 감사 대상**입니다(FR-914). 응답에 감사 로그 ID를 반환해 추적 가능하게 합니다.

**PATCH /admin/users/{id}/status**

Request
```json
{ "status": "SUSPENDED", "reason": "위험한 루틴 반복 게시 (신고 3건 수용)",
  "endsAt": "2026-08-20T00:00:00Z", "notifyUser": true }
```
Response 200
```json
{ "userId": 1024, "status": "SUSPENDED", "endsAt": "2026-08-20T00:00:00Z",
  "revokedSessions": 3, "moderationActionId": 55 }
```

> 정지 시 전 세션이 즉시 폐기됩니다. 이후 해당 사용자의 API 호출은 403 `ACCOUNT_SUSPENDED`(사유·종료일 포함)를 받습니다.

**영구정지·하드 삭제 (2인 승인)** — 최초 호출 시 즉시 실행되지 않습니다.

Response 202
```json
{ "status": "APPROVAL_REQUIRED", "approvalRequestId": 31,
  "message": "다른 관리자의 승인이 필요합니다.", "expiresAt": "2026-08-14T09:00:00Z" }
```

> ⚠️ **관리자는 회원의 운동 기록·건강 데이터를 수정할 수 없습니다**(FR-929). 해당 API는 설계상 존재하지 않으며, 데이터 정정이 필요한 경우 회원 본인이 앱에서 수정하도록 안내합니다.

---

### 10.4 콘텐츠 관리

| Method | Endpoint | 권한 | 설명 | 요구사항 |
|--------|----------|------|------|----------|
| POST | `/admin/exercises` | `EXERCISE_WRITE` | 운동 등록 | FR-931 |
| PUT | `/admin/exercises/{id}` | `EXERCISE_WRITE` | 운동 수정 | FR-931 |
| PATCH | `/admin/exercises/{id}/archive` | `EXERCISE_WRITE` | 보관 처리 | FR-931 |
| POST | `/admin/exercises/bulk-import` | `EXERCISE_BULK_IMPORT` | CSV 일괄 등록 | FR-933 |
| POST | `/admin/exercises/{id}/promote` | `EXERCISE_WRITE` | 커스텀 → 공용 승격 | FR-934 |
| GET/POST/PUT | `/admin/exercise-categories` | `EXERCISE_WRITE` | 카테고리 관리 | FR-932 |
| POST | `/admin/media/upload` | `EXERCISE_WRITE` | 이미지·영상 업로드 | FR-935 |
| GET | `/admin/routines/review-queue` | `ROUTINE_REVIEW` | 공개 심사 대기 목록 | FR-937 |
| PATCH | `/admin/routines/{id}/review` | `ROUTINE_REVIEW` | 승인/반려/블라인드 | FR-937 |
| POST | `/admin/routines/system` | `EXERCISE_WRITE` | 시스템 루틴 생성 | FR-936 |
| GET/POST/PUT | `/admin/announcements` | `ANNOUNCEMENT_WRITE` | 공지 관리 | FR-938 |

**PATCH /admin/exercises/{id}/archive** — 운동은 **물리 삭제하지 않습니다**. 과거 운동 기록이 참조하므로 `status=ARCHIVED`로만 전환하며, 신규 검색 결과에서 제외되고 기존 기록 조회는 그대로 유지됩니다.

**POST /admin/exercises/bulk-import**

`multipart/form-data`: `file` (CSV, UTF-8, 최대 5MB), `dryRun` (기본 true)

Response 200 (dryRun)
```json
{
  "totalRows": 120, "validRows": 117, "invalidRows": 3,
  "errors": [ { "row": 14, "field": "primary_muscle", "message": "허용되지 않은 값: 'CHESTT'" } ],
  "importToken": "imp-3f2a"
}
```
확정: `POST /admin/exercises/bulk-import/confirm` `{ "importToken": "imp-3f2a" }`

**PATCH /admin/routines/{id}/review**

Request: `{ "decision": "REJECTED", "note": "부상 위험이 큰 중량 구성" }`
Response 200: `{ "routineId": 305, "reviewStatus": "REJECTED", "isPublic": false, "ownerNotified": true }`

**POST /admin/announcements**

```json
{ "title": "8/20 정기 점검 안내", "content": "02:00~04:00 서비스 이용이 제한됩니다.",
  "type": "MAINTENANCE", "targetPlatform": "ALL", "isPinned": true,
  "publishAt": "2026-08-17T00:00:00Z", "unpublishAt": "2026-08-20T05:00:00Z" }
```
Response 201: `{ "announcementId": 12, "status": "SCHEDULED" }`

---

### 10.5 신고·제재 관리

| Method | Endpoint | 권한 | 설명 | 요구사항 |
|--------|----------|------|------|----------|
| GET | `/admin/reports` | `REPORT_READ` | 신고 큐 | FR-941 |
| GET | `/admin/reports/{id}` | `REPORT_READ` | 신고 상세 (동일 대상 병합 표시) | FR-942 |
| PATCH | `/admin/reports/{id}` | `REPORT_HANDLE` | 수용/기각 | FR-942 |
| POST | `/admin/sanctions` | `SANCTION_EXECUTE` | 제재 집행 | FR-943 |
| DELETE | `/admin/sanctions/{id}` | `SANCTION_EXECUTE` | 제재 해제 | FR-945 |
| GET | `/admin/users/{id}/sanctions` | `REPORT_READ` | 제재 이력 | FR-944 |
| GET | `/admin/appeals` | `REPORT_HANDLE` | 이의제기 큐 | FR-945 |
| PATCH | `/admin/appeals/{id}` | `SANCTION_EXECUTE` | 재심 (유지/해제) | FR-945 |

**GET /admin/reports** — Query: `?status=PENDING&targetType=ROUTINE&sort=OLDEST`

```json
{
  "items": [
    { "reportId": 88, "targetType": "ROUTINE", "targetId": 305,
      "targetSummary": "초보자 3분할", "reasonCode": "DANGEROUS",
      "duplicateCount": 4, "autoBlinded": false, "status": "PENDING",
      "createdAt": "2026-08-12T10:00:00Z", "ageHours": 23 }
  ],
  "pendingTotal": 17
}
```

**POST /admin/sanctions**

```json
{ "reportId": 88, "targetType": "USER", "targetId": 1024,
  "actionType": "PUBLISH_BAN", "reason": "위험한 루틴 반복 게시",
  "endsAt": "2026-08-20T00:00:00Z" }
```
Response 201: `{ "sanctionId": 55, "appliedAt": "2026-08-13T09:00:00Z", "userNotified": true }`

> `ACCOUNT_PERMANENT_BAN`은 2인 승인 대상입니다(202 `APPROVAL_REQUIRED`).

---

### 10.6 AI 운영

| Method | Endpoint | 권한 | 설명 | 요구사항 |
|--------|----------|------|------|----------|
| GET | `/admin/ai/prompts` | `AI_JOB_READ` | 템플릿 버전 목록 | FR-951 |
| POST | `/admin/ai/prompts` | `AI_PROMPT_WRITE` | 새 버전 작성 | FR-951 |
| POST | `/admin/ai/prompts/{id}/dry-run` | `AI_PROMPT_WRITE` | 시험 실행 | FR-952 |
| POST | `/admin/ai/prompts/{id}/activate` | `AI_PROMPT_ACTIVATE` ⚠️ | 활성화 | FR-951 |
| POST | `/admin/ai/prompts/{id}/rollback` | `AI_PROMPT_ACTIVATE` ⚠️ | 이전 버전 롤백 | FR-951 |
| GET | `/admin/ai/jobs` | `AI_JOB_READ` | Job 모니터링 | FR-953 |
| GET | `/admin/ai/mappings/unverified` | `AI_MAPPING_VERIFY` | 미검증 매핑 | FR-954 |
| PATCH | `/admin/ai/mappings/{id}` | `AI_MAPPING_VERIFY` | 승인/수정/삭제 | FR-954 |
| GET | `/admin/ai/costs` | `AI_JOB_READ` | 비용 대시보드 | FR-955 |
| PUT | `/admin/ai/rate-limit` | `SETTING_WRITE` ⚠️ | 한도 변경 | FR-956 |
| PUT | `/admin/ai/kill-switch` | `AI_KILL_SWITCH` ⚠️ | 긴급 차단 | FR-957 |
| GET | `/admin/ai/modification-patterns` | `AI_JOB_READ` | 수정 패턴 분석 | FR-958 |

**POST /admin/ai/prompts/{id}/dry-run**

Request: `{ "sampleUserId": 1024, "provider": "anthropic" }`
Response 200
```json
{ "validationStatus": "PASSED", "mappingFailureRate": 0.05,
  "safetyFlags": [], "latencyMs": 8420, "estimatedCostUsd": 0.031,
  "resultPreview": { "days": 4, "totalExercises": 18 } }
```
> **활성화 전 dry-run 통과를 강력히 권장**합니다. 프롬프트 변경은 전 사용자에게 즉시 영향을 주기 때문입니다.

**POST /admin/ai/prompts/{id}/rollback**

Response 200: `{ "activeVersion": 3, "previousVersion": 4, "effectiveImmediately": true }`
> **재배포 없이 즉시 적용**됩니다(FR-951). 이후 생성되는 `ai_model_runs.prompt_template_ver`로 적용 여부를 확인합니다.

**PUT /admin/ai/kill-switch**

Request: `{ "enabled": true, "reason": "Claude·OpenAI 동시 장애로 비용 폭증 방지" }`
Response 200: `{ "enabled": true, "fallbackMode": "TEMPLATE_ONLY", "affectedPendingJobs": 4 }`
> 활성화 시 신규 AI 요청은 LLM 호출 없이 템플릿 루틴만 반환합니다. 사용자에게는 기존 폴백 안내 문구가 그대로 노출됩니다.

**GET /admin/ai/mappings/unverified**
```json
{ "items": [ { "id": 412, "aiName": "Incline DB Press", "mappedExerciseId": 118,
  "mappedExerciseName": "인클라인 덤벨 프레스", "confidence": 0.86,
  "usageCount": 27, "createdAt": "2026-08-01T00:00:00Z" } ] }
```
`PATCH /admin/ai/mappings/412` → `{ "action": "APPROVE" }` 또는 `{ "action": "REMAP", "exerciseId": 119 }` / `{ "action": "DELETE" }`

---

### 10.7 통계·운영 도구

| Method | Endpoint | 권한 | 설명 | 요구사항 |
|--------|----------|------|------|----------|
| GET | `/admin/stats/overview` | `STATS_READ` | DAU/MAU·가입·세션·리텐션 | FR-961 |
| GET | `/admin/stats/features` | `STATS_READ` | 동기화·AI·오프라인 지표 | FR-962 |
| GET | `/admin/stats/export` | `STATS_READ` | CSV 내보내기 | FR-963 |
| POST | `/admin/ops/batch/{jobName}/run` | `BATCH_TRIGGER` | 배치 수동 실행 | FR-964 |
| POST | `/admin/ops/cache/evict` | `BATCH_TRIGGER` | 캐시 무효화 | FR-965 |
| GET/PUT | `/admin/settings` | `SETTING_READ` / `SETTING_WRITE` ⚠️ | 런타임 설정 | FR-966 |
| GET | `/admin/approvals` | (본인 관련) | 2인 승인 대기 목록 | FR-967 |
| POST | `/admin/approvals/{id}/approve` | 요청과 동일 권한 | 승인 후 실행 | FR-967 |
| POST | `/admin/approvals/{id}/reject` | 요청과 동일 권한 | 반려 | FR-967 |
| GET | `/admin/audit-logs` | `AUDIT_READ` | 감사 로그 검색 | FR-913 |
| GET | `/admin/audit-logs/export` | `AUDIT_READ` | CSV 내보내기 | FR-913 |

**GET /admin/stats/overview**
```json
{
  "date": "2026-08-13",
  "dau": 842, "mau": 6120, "newSignups": 37,
  "sessionsCompleted": 519,
  "retention": { "d1": 0.42, "d7": 0.23, "d30": 0.11 },
  "comparedToPrevDay": { "dau": 0.03, "sessionsCompleted": -0.08 }
}
```

**PUT /admin/settings** — Request: `{ "key": "MAINTENANCE_MODE", "value": "true" }` + `X-Admin-Reason: 8/20 정기 점검`

Response 200 또는 202 (`is_sensitive=true`이고 요청자가 SUPER_ADMIN이 아니면 승인 필요)
```json
{ "key": "MAINTENANCE_MODE", "previousValue": "false", "value": "true",
  "effectiveImmediately": true, "auditLogId": 90233 }
```

> 점검 모드가 켜지면 사용자 **쓰기 API는 503 `MAINTENANCE_MODE`**를 반환하고, 읽기 API와 앱의 오프라인 큐는 정상 동작합니다. 즉 점검 중에도 사용자는 운동을 기록할 수 있고, 종료 후 자동 동기화됩니다.

**POST /admin/approvals/{id}/approve**

Response 200: `{ "approvalRequestId": 31, "status": "EXECUTED", "executedAt": "...", "result": { "userId": 1024, "status": "PERMANENT_BANNED" } }`
Errors: `APPROVAL_SELF_NOT_ALLOWED`(403) — 요청자 본인은 승인할 수 없습니다.

**GET /admin/audit-logs**

Query: `?adminId=3&action=USER_SUSPEND&targetType=USER&from=2026-08-01&to=2026-08-13&cursor=&limit=50`

```json
{
  "items": [
    { "id": 90211, "adminEmail": "ops@fitpulse.app", "action": "USER_PII_UNMASK",
      "targetType": "USER", "targetId": "1024", "reason": "고객센터 문의 #4821 본인 확인",
      "result": "SUCCESS", "ipAddress": "10.0.3.12",
      "createdAt": "2026-08-13T09:12:00Z" }
  ],
  "nextCursor": "...", "hasMore": true
}
```
> 기간 필터(`from`/`to`)는 **필수**입니다(무제한 조회 시 성능 저하). 최대 조회 범위는 90일이며, 그 이상은 CSV 내보내기를 사용합니다.

---

### 10.8 관리자 API Rate Limit

| 대상 | 한도 | 비고 |
|------|------|------|
| 관리자 로그인 | 계정당 5회/10분 | 초과 시 계정 잠금(423) |
| 회원 검색 | 관리자당 300회/분 | - |
| 마스킹 해제 | 관리자당 **30회/시간** | 대량 조회 방지, 초과 시 Slack 알림 |
| 감사 로그 조회 | 관리자당 60회/분 | - |
| 일반 관리자 API | 관리자당 600회/분 | - |

---

## 11. 시스템 API

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| GET | `/actuator/health/liveness` | - | 프로세스 생존 (ping) |
| GET | `/actuator/health/readiness` | - | 트래픽 수용 가능 (db, redis) |
| GET | `/actuator/info` | - | 빌드 정보 |
| GET | `/actuator/prometheus` | 내부망 | 메트릭 스크랩 |

---

## 12. Rate Limit 정책

| 대상 | 한도 | 초과 응답 |
|------|------|-----------|
| AI 루틴 요청 | 사용자당 10회/일 | 429 `AI_RATE_LIMIT_EXCEEDED` |
| 로그인 시도 | IP+계정당 10회/10분 | 429 |
| 건강 동기화 | 사용자당 60회/시간 | 429 |
| 일반 API | 사용자당 600회/분 | 429 |

응답 헤더: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 13. API 버전 정책

- 버전은 URI 기반 (`/api/v1/`)
- Breaking change 발생 시 `/api/v2/` 신설, 기존 버전 **6개월 병행**
- 중단 예정 엔드포인트는 `Sunset: Wed, 01 Mar 2027 00:00:00 GMT` 헤더와 `Deprecation: true` 반환
- 하위 호환 변경(필드 추가)은 버전 유지

---

## 14. 테스트 지원

| 항목 | 제공 |
|------|------|
| Swagger UI | `/swagger-ui` (dev 프로필에서만 노출) |
| Postman Collection | `docs/postman/FitPulse.postman_collection.json` (사용자) / `FitPulse_Admin.postman_collection.json` (관리자) |
| 관리자 시드 계정 | 환경별 `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`로 주입; TOTP 시드는 계정별 무작위 생성하고 고정 기본값 금지 |
| 환경 변수 | `{{baseUrl}}`, `{{accessToken}}`, `{{deviceId}}` |
| 시드 계정 | 환경별 `DEV_USER_EMAIL` / `DEV_USER_PASSWORD`로 주입; 고정 기본값 금지 |

---

## 15. 승인

| 구분 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자 | | | |
| 검토자 | | | |
| 승인자 | | | |
