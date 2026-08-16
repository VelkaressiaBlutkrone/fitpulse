# 🗂️ FitPulse ERD 설계서

| 항목 | 내용 |
|------|------|
| 문서 유형 | ERD (Entity Relationship Diagram) |
| 버전 | v1.0 |
| 작성일 | 2026-08-13 |
| DBMS | MySQL 8.4 (InnoDB, utf8mb4_0900_ai_ci) |
| 마이그레이션 | Flyway (`ddl-auto=validate`) |

**명명 규칙**

| 대상 | 규칙 | 예 |
|------|------|-----|
| 테이블 | snake_case 복수형 | `workout_sessions` |
| 컬럼 | snake_case, 단위 접미사 | `weight_kg`, `duration_sec` |
| PK | `id` BIGINT AUTO_INCREMENT | - |
| FK | `{단수테이블}_id` | `user_id` |
| 인덱스 | `idx_{약어}_{컬럼들}` | `idx_ws_user_status` |
| UNIQUE | `uk_{약어}_{컬럼들}` | `uk_ws_user_client` |
| 불리언 | `is_` 접두사 | `is_completed` |
| 시각 | `_at` 접미사 (UTC 저장) | `started_at` |

---

## 1. 엔티티 목록

| # | 도메인 | 테이블 | 설명 | 예상 규모(1년) |
|---|--------|--------|------|----------------|
| 1 | 사용자 | `users` | 계정 | 10K |
| 2 | 사용자 | `user_profiles` | 프로필 (1:1) | 10K |
| 3 | 사용자 | `user_auth_accounts` | 소셜 연동 | 8K |
| 4 | 사용자 | `user_devices` | 기기 | 15K |
| 5 | 사용자 | `refresh_sessions` | 리프레시 세션 | 50K |
| 6 | 사용자 | `push_tokens` | 푸시 토큰 (V1.1) | 15K |
| 7 | 사용자 | `user_consents` | 동의 이력 | 50K |
| 8 | 사용자 | `fitness_goals` | 운동 목표 | 10K |
| 9 | 운동 | `exercise_categories` | 카테고리 | 20 |
| 10 | 운동 | `exercises` | 운동 라이브러리 | 1K |
| 11 | 루틴 | `routines` | 루틴 | 30K |
| 12 | 루틴 | `routine_versions` | 루틴 버전 | 90K |
| 13 | 루틴 | `routine_days` | 루틴 일자 | 400K |
| 14 | 루틴 | `routine_exercises` | 일자별 운동 | 2M |
| 15 | 루틴 | `routine_schedules` | 요일 배정 | 60K |
| 16 | 기록 | `workout_sessions` | 세션 | 1M |
| 17 | 기록 | `workout_exercises` | 세션 내 종목 | 6M |
| 18 | 기록 | `workout_sets` | 세트 | 25M |
| 19 | 건강 | `health_observations` | 원본 건강 관측치 | 50M (90일 보관) |
| 20 | 건강 | `health_sync_cursors` | 동기화 커서 | 70K |
| 21 | 건강 | `health_sync_jobs` | 동기화 작업 이력 | 3M |
| 22 | 건강 | `daily_health_summaries` | 일별 집계 | 3.6M |
| 23 | 건강 | `body_metrics` | 체성분 | 500K |
| 24 | AI | `ai_jobs` | AI 작업 | 100K |
| 25 | AI | `ai_model_runs` | 모델 호출 이력 | 150K |
| 26 | AI | `ai_exercise_mappings` | 운동명 매핑 학습 | 5K |
| 27 | AI | `prompt_templates` | 프롬프트 버전 | 100 |
| 28 | AI | `ai_routine_modifications` | 사용자 수정 추적 | 300K |

---

## 2. 논리 ERD

### 2.1 사용자·인증 도메인

```
                       ┌──────────┐
                       │  users   │
                       └────┬─────┘
       ┌──────────┬─────────┼─────────┬──────────┬──────────┐
       │1:1       │1:N      │1:N      │1:N       │1:N       │1:1
 ┌─────▼──────┐ ┌─▼────────┐ ┌▼───────┐ ┌▼────────┐ ┌▼───────┐ ┌▼──────────┐
 │user_profil-│ │user_auth_│ │user_   │ │refresh_ │ │user_   │ │fitness_   │
 │es          │ │accounts  │ │devices │ │sessions │ │consents│ │goals      │
 └────────────┘ └──────────┘ └───┬────┘ └─────────┘ └────────┘ └───────────┘
                                 │1:N
                            ┌────▼──────┐
                            │push_tokens│ (V1.1)
                            └───────────┘

refresh_sessions.device_id ──▶ user_devices.device_id (논리 참조)
```

### 2.2 운동·루틴 도메인

```
┌───────────────────┐        ┌───────────┐
│exercise_categories│──1:N──▶│ exercises │◀──── users (is_custom 시 created_by)
└───────────────────┘        └─────┬─────┘
                                   │ 1:N (참조)
┌─────────┐   1:N   ┌──────────────▼──┐   1:N   ┌──────────────┐   1:N   ┌───────────────────┐
│routines │────────▶│routine_versions │────────▶│ routine_days │────────▶│routine_exercises  │
└────┬────┘         └─────────────────┘         └──────────────┘         └───────────────────┘
     │ 1:N
┌────▼──────────────┐
│ routine_schedules │  (user_id, day_of_week 1~7)
└───────────────────┘
```

### 2.3 운동 기록 도메인

```
users ──1:N──▶ workout_sessions ──1:N──▶ workout_exercises ──1:N──▶ workout_sets
                      │                          │
                      │ (선택) routine_id        │ exercise_id
                      ▼                          ▼
                  routines                   exercises

멱등성 키:
  workout_sessions : UNIQUE(user_id, client_id)
  workout_sets     : UNIQUE(client_id), UNIQUE(workout_exercise_id, set_number)
```

### 2.4 건강 도메인

```
users ──1:N──▶ health_observations      (원본, soft delete)
      ──1:N──▶ health_sync_cursors      (user × platform × data_type)
      ──1:N──▶ health_sync_jobs         (동기화 실행 이력)
      ──1:N──▶ daily_health_summaries   (일별 집계, 이벤트 갱신)
      ──1:N──▶ body_metrics             (체성분)

health_observations ──[HealthDataSynced 이벤트]──▶ daily_health_summaries
```

### 2.5 AI 도메인

```
users ──1:N──▶ ai_jobs ──1:N──▶ ai_model_runs
                  │                   │ prompt_template_ver
                  │                   ▼
                  │             prompt_templates
                  │ 1:N
                  ▼
        ai_routine_modifications ──▶ routines

exercises ◀──N:1── ai_exercise_mappings (ai_name → exercise_id, 학습 테이블)
```

---

## 3. 물리 테이블 정의서

### 3.1 users

| 컬럼 | 타입 | Null | 기본값 | 제약 | 설명 |
|------|------|------|--------|------|------|
| id | BIGINT | N | AUTO_INC | PK | 사용자 ID |
| email | VARCHAR(255) | N | - | UNIQUE | 이메일 |
| password | VARCHAR(255) | Y | NULL | - | BCrypt 해시 (소셜 전용은 NULL) |
| name | VARCHAR(50) | N | - | - | 이름 |
| role | VARCHAR(20) | N | 'USER' | - | USER / ADMIN |
| status | VARCHAR(20) | N | 'ACTIVE' | - | ACTIVE / WITHDRAWAL_PENDING / DELETED |
| withdrawal_at | DATETIME | Y | NULL | - | 탈퇴 요청 시각 (+30일 후 완전 삭제) |
| created_at | DATETIME | N | NOW() | - | 생성 |
| updated_at | DATETIME | N | NOW() | - | 수정 |

### 3.2 user_profiles

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| user_id | BIGINT | N | PK, FK→users | 사용자 |
| nickname | VARCHAR(30) | Y | - | 닉네임 |
| avatar_url | VARCHAR(500) | Y | - | MinIO URL |
| gender | VARCHAR(10) | Y | - | MALE/FEMALE/OTHER |
| birth_year | SMALLINT | Y | - | 출생연도 |
| height_cm | DECIMAL(5,1) | Y | - | 키 |

### 3.3 user_auth_accounts

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| id | BIGINT | N | PK | - |
| user_id | BIGINT | N | FK→users | 사용자 |
| provider | VARCHAR(20) | N | - | GOOGLE / APPLE |
| provider_subject | VARCHAR(255) | N | UNIQUE(provider, provider_subject) | ID Token `sub` |
| provider_email | VARCHAR(255) | Y | - | 제공자 이메일 |
| connected_at | DATETIME | N | - | 연동 시각 |

### 3.4 user_devices

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| id | BIGINT | N | PK | - |
| user_id | BIGINT | N | FK→users | 사용자 |
| device_id | CHAR(36) | N | UNIQUE(user_id, device_id) | 클라이언트 생성 UUID |
| platform | VARCHAR(20) | N | - | ANDROID / IOS |
| app_version | VARCHAR(20) | Y | - | 앱 버전 |
| os_version | VARCHAR(20) | Y | - | OS 버전 |
| last_seen_at | DATETIME | Y | - | 최근 사용 |

### 3.5 refresh_sessions

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| id | BIGINT | N | PK | - |
| user_id | BIGINT | N | FK→users | 사용자 |
| device_id | CHAR(36) | N | - | 기기 |
| token_hash | CHAR(64) | N | UNIQUE | SHA-256 해시 (평문 미저장) |
| family_id | CHAR(36) | N | INDEX | 토큰 계보 (도난 시 일괄 폐기) |
| expires_at | DATETIME | N | - | 만료 |
| revoked_at | DATETIME | Y | - | 폐기 시각 |
| created_at | DATETIME | N | - | 발급 |

> **세션 상한 규칙**: `user_id`당 유효 세션 최대 5개. 6번째 로그인 시 `created_at` 최소 세션을 `revoked_at` 처리하고 해당 기기에 알림.

### 3.6 user_consents

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| id | BIGINT | N | PK | - |
| user_id | BIGINT | N | FK→users | 사용자 |
| consent_type | VARCHAR(30) | N | - | TERMS / PRIVACY / HEALTH_DATA / AI_PROCESSING / MARKETING |
| version | VARCHAR(20) | N | - | 약관 버전 |
| agreed_at | DATETIME | N | - | 동의 시각 |
| revoked_at | DATETIME | Y | - | 철회 시각 |

### 3.7 fitness_goals

| 컬럼 | 타입 | Null | 설명 |
|------|------|------|------|
| user_id | BIGINT | N | PK, FK→users |
| goal_type | VARCHAR(30) | N | MUSCLE_GAIN / FAT_LOSS / STRENGTH / MAINTENANCE |
| target_weight | DECIMAL(5,1) | Y | 목표 체중(kg) |
| weekly_workout_days | TINYINT | Y | 주간 운동일 (1~7) |
| experience_level | VARCHAR(20) | N | BEGINNER / INTERMEDIATE / ADVANCED |
| available_equipment | JSON | Y | 보유 장비 목록 |
| injury_notes | TEXT | Y | 부상 메모 (AI 금기 판정 입력) |
| updated_at | DATETIME | N | 수정 |

### 3.8 exercises

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| id | BIGINT | N | PK | - |
| category_id | BIGINT | N | FK→exercise_categories | 카테고리 |
| name | VARCHAR(100) | N | INDEX | 한글명 |
| name_en | VARCHAR(100) | N | INDEX | 영문명 (AI 매핑 1단계 키) |
| type | VARCHAR(20) | N | - | WEIGHT / BODYWEIGHT / CARDIO / STRETCH / MACHINE |
| primary_muscle | VARCHAR(30) | N | INDEX | 주동근 |
| secondary_muscle | VARCHAR(100) | Y | - | 협응근 |
| description | TEXT | Y | - | 설명 |
| video_url | VARCHAR(500) | Y | - | 영상 |
| image_url | VARCHAR(500) | Y | - | 이미지 |
| difficulty | VARCHAR(20) | N | - | BEGINNER / INTERMEDIATE / ADVANCED |
| equipment | VARCHAR(50) | Y | - | 필요 장비 |
| is_custom | BOOLEAN | N | DEFAULT false | 커스텀 여부 |
| created_by | BIGINT | Y | FK→users | 등록자 (커스텀) |
| status | VARCHAR(20) | N | 'ACTIVE' | ACTIVE / ARCHIVED |
| created_at | DATETIME | N | - | 생성 |

### 3.9 routines / routine_versions / routine_days / routine_exercises

**routines**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT PK | - |
| user_id | BIGINT FK | 소유자 |
| name | VARCHAR(100) | 루틴명 |
| description | TEXT | 설명 |
| type | VARCHAR(20) | SYSTEM / USER / AI_GENERATED |
| goal | VARCHAR(30) | 목표 |
| level | VARCHAR(20) | 난이도 |
| current_version | INT | 현재 버전 번호 |
| created_at | DATETIME | 생성 |

**routine_versions**: `id, routine_id FK, version INT, change_note VARCHAR(200), created_at` — `UNIQUE(routine_id, version)`
**routine_days**: `id, routine_version_id FK, sequence_no INT, name VARCHAR(50), is_rest_day BOOLEAN`
**routine_exercises**: `id, routine_day_id FK, exercise_id FK, order_num INT, target_sets INT, target_reps VARCHAR(20) ("8-12"), rest_seconds INT, memo VARCHAR(200)`
**routine_schedules**: `id, routine_id FK, user_id FK, day_of_week TINYINT CHECK(1~7), sequence_no INT, start_date DATE, end_date DATE`

### 3.10 workout_sessions

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| id | BIGINT | N | PK | - |
| user_id | BIGINT | N | FK→users | 사용자 |
| routine_id | BIGINT | Y | FK→routines | 참조 루틴 |
| routine_version | INT | Y | - | 시작 시점 버전 스냅샷 |
| title | VARCHAR(100) | Y | - | 세션명 |
| started_at | DATETIME | N | - | 시작 |
| ended_at | DATETIME | Y | - | 종료 |
| computed_duration_min | INT | Y | - | 파생: 소요 시간 |
| computed_total_volume | DECIMAL(10,2) | Y | - | 파생: Σ(weight×reps) |
| computed_total_calories | INT | Y | - | 파생: 추정 칼로리 |
| computed_at | DATETIME | Y | - | 마지막 계산 시각 (보정 배치 기준) |
| memo | TEXT | Y | - | 메모 |
| mood | VARCHAR(20) | Y | - | GREAT/GOOD/NORMAL/TIRED/BAD |
| photo_url | VARCHAR(500) | Y | - | 사진 |
| status | VARCHAR(20) | N | - | IN_PROGRESS / COMPLETED / CANCELLED |
| client_id | CHAR(36) | N | UNIQUE(user_id, client_id) | 멱등성 키 |
| created_at | DATETIME | N | - | 생성 |

### 3.11 workout_exercises

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK | - |
| session_id | BIGINT | FK→workout_sessions | 세션 |
| exercise_id | BIGINT | FK→exercises | 운동 |
| order_num | INT | - | 순서 |
| rest_seconds | INT | - | 휴식 |
| memo | VARCHAR(200) | - | 메모 |

### 3.12 workout_sets

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| id | BIGINT | N | PK | - |
| workout_exercise_id | BIGINT | N | FK | 종목 |
| set_number | INT | N | UNIQUE(workout_exercise_id, set_number) | 세트 번호 |
| set_type | VARCHAR(20) | N | - | NORMAL / WARMUP / DROP / FAILURE |
| weight_kg | DECIMAL(6,2) | Y | CHECK(>=0) | 중량 |
| reps | INT | Y | CHECK(>=0) | 반복 |
| duration_sec | INT | Y | CHECK(>=0) | 시간 (유산소/플랭크) |
| distance_km | DECIMAL(6,2) | Y | CHECK(>=0) | 거리 |
| is_completed | BOOLEAN | N | DEFAULT false | 완료 여부 |
| rpe | TINYINT | Y | CHECK(1~10) | 주관적 강도 |
| client_id | CHAR(36) | N | UNIQUE | 멱등성 키 |
| created_at | DATETIME | N | - | 생성 |

### 3.13 health_observations

| 컬럼 | 타입 | Null | 제약 | 설명 |
|------|------|------|------|------|
| id | BIGINT | N | PK | - |
| user_id | BIGINT | N | FK→users | 사용자 |
| source_platform | VARCHAR(20) | N | - | HEALTH_CONNECT / HEALTHKIT / MANUAL |
| source_app | VARCHAR(100) | Y | - | 원 기록 앱 (자사 필터용) |
| source_record_id | VARCHAR(200) | N | UNIQUE(user_id, source_platform, source_record_id) | 원본 레코드 ID |
| data_type | VARCHAR(30) | N | - | STEPS/HEART_RATE/SLEEP/ACTIVE_CALORIES/WEIGHT/BODY_FAT/SPO2/DISTANCE |
| start_at_utc | DATETIME | N | - | 시작 (UTC) |
| end_at_utc | DATETIME | Y | - | 종료 (UTC) |
| timezone_offset | SMALLINT | N | - | 분 단위 오프셋 |
| numeric_value | DECIMAL(12,3) | Y | - | 측정값 |
| unit | VARCHAR(20) | Y | - | 단위 |
| metadata_json | JSON | Y | - | 수면 단계 등 부가 정보 |
| source_updated_at | DATETIME | Y | - | 원본 수정 시각 |
| synced_at | DATETIME | N | - | 동기화 시각 |
| deleted_at | DATETIME | Y | - | soft delete |
| created_at | DATETIME | N | - | 생성 |

### 3.14 기타 건강 테이블

**health_sync_cursors**: `user_id, source_platform, data_type, last_synced_at, last_record_time, updated_at` — `UNIQUE(user_id, source_platform, data_type)`
**health_sync_jobs**: `id, user_id, source_platform, status(RUNNING/SUCCESS/FAILED/RETRYING), records_synced, records_skipped, error_message, started_at, ended_at`
**daily_health_summaries**: `user_id, summary_date, total_steps, total_calories, avg_heart_rate, max_heart_rate, min_heart_rate, sleep_duration_min, sleep_quality_score, distance_km, updated_at` — `UNIQUE(user_id, summary_date)`
**body_metrics**: `id, user_id FK, weight_kg, body_fat_pct, muscle_mass, bmi, photo_url, source(MANUAL/HEALTH_CONNECT), measured_at, created_at`

### 3.15 AI 테이블

**ai_jobs**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT PK | - |
| user_id | BIGINT FK | 요청자 |
| job_type | VARCHAR(30) | ROUTINE_GENERATION |
| status | VARCHAR(30) | PENDING/RUNNING/COMPLETED/FAILED/VALIDATION_FAILED |
| input_summary | JSON | **비식별 요약만** (이름·이메일 제외) |
| total_estimated_cost_usd | DECIMAL(10,6) | run 비용 합산 |
| requested_at / completed_at | DATETIME | 시각 |
| error_code / error_message | VARCHAR | 실패 정보 |

**ai_model_runs**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT PK | - |
| job_id | BIGINT FK | 소속 Job |
| provider | VARCHAR(20) | anthropic / openai / template |
| model | VARCHAR(50) | 모델명 |
| prompt_template_ver | INT | 사용 프롬프트 버전 |
| prompt_tokens / completion_tokens | INT | 토큰 사용량 |
| estimated_cost_usd | DECIMAL(10,6) | run 비용 |
| latency_ms | INT | 지연 |
| validation_status | VARCHAR(20) | PASSED / FAILED / PARTIAL |
| validation_errors | JSON | 검증 실패 상세 |
| safety_flags | JSON | 금기·볼륨 경고 |
| created_at | DATETIME | - |

**ai_exercise_mappings**: `id, ai_name VARCHAR(150) UNIQUE, exercise_id FK, confidence DECIMAL(4,3), verified BOOLEAN, created_at`
**prompt_templates**: `id, template_key, version INT, template_text TEXT, variables JSON, model_config JSON, is_active BOOLEAN, change_note, created_by, created_at` — `UNIQUE(template_key, version)`
**ai_routine_modifications**: `id, ai_job_id FK, routine_id FK, user_id FK, modification_type(EXERCISE_REPLACED/SET_CHANGED/EXERCISE_REMOVED/EXERCISE_ADDED), original_value JSON, modified_value JSON, created_at`

---

## 4. 인덱스 설계

### 4.1 비즈니스 인덱스

| 인덱스명 | 테이블 | 컬럼 | 지원 쿼리 |
|----------|--------|------|-----------|
| `idx_ws_user_status` | workout_sessions | (user_id, status, started_at DESC) | 진행 중/완료 세션 목록 |
| `idx_ws_user_date` | workout_sessions | (user_id, started_at DESC) | 날짜별 운동 이력, 캘린더 |
| `idx_wset_exercise` | workout_sets | (workout_exercise_id, set_number) | 세션 상세 세트 정렬 |
| `idx_wex_session` | workout_exercises | (session_id, order_num) | 세션 종목 정렬 |
| `idx_ho_user_type_date` | health_observations | (user_id, data_type, start_at_utc DESC) | 유형별 시계열 조회 |
| `uk_ho_source_record` | health_observations | (user_id, source_platform, source_record_id) UNIQUE | 동기화 중복 방지 |
| `idx_dhs_user_date` | daily_health_summaries | (user_id, summary_date DESC) | 대시보드 |
| `idx_ex_search` | exercises | (status, primary_muscle, difficulty) | 운동 필터 검색 |
| `idx_ex_name` | exercises | (name), (name_en) | 이름 검색 + AI 매핑 |
| `idx_rs_user_day` | routine_schedules | (user_id, day_of_week) | 오늘의 루틴 |
| `idx_aij_user_date` | ai_jobs | (user_id, requested_at DESC) | AI 이력·Rate Limit 계산 |
| `idx_rfs_user_active` | refresh_sessions | (user_id, revoked_at, created_at) | 세션 상한 판정 |

### 4.2 인덱스 원칙

- 모든 FK 컬럼에 기본 인덱스 (JOIN 성능)
- 최신 우선 조회 패턴에는 `created_at DESC` 또는 `started_at DESC` 포함
- 카디널리티 높은 컬럼을 복합 인덱스 선두에 (`user_id` 우선)
- 커버링 인덱스가 필요한 분석 쿼리는 W13 부하 테스트 결과로 추가 판단
- 인덱스 추가/삭제는 Flyway 마이그레이션으로만, 대용량 테이블은 `ALGORITHM=INPLACE` 확인

### 4.3 파티셔닝 검토 (향후)

`health_observations`, `workout_sets`가 각각 5천만 건을 넘길 경우 `start_at_utc` / `created_at` 기준 RANGE 파티셔닝 검토. MVP 범위 제외.

---

## 5. 데이터 정합성 규칙

| # | 규칙 | 강제 수단 |
|---|------|-----------|
| D-01 | 세션 총 볼륨 = Σ(완료 세트 weight×reps) | 이벤트 계산 + 새벽 보정 배치 + 통합 테스트 |
| D-02 | 동일 clientId 재전송 시 중복 저장 없음 | UNIQUE 제약 + upsert 처리 |
| D-03 | 세트 번호는 종목 내 유일 | UNIQUE(workout_exercise_id, set_number) |
| D-04 | 건강 원본 레코드는 사용자·플랫폼 내 유일 | UNIQUE(user_id, source_platform, source_record_id) |
| D-05 | 건강 데이터 삭제는 물리 삭제 금지 | `deleted_at` soft delete |
| D-06 | 루틴 수정 시 이전 버전 보존 | routine_versions append-only |
| D-07 | 음수 중량·반복 불가 | CHECK 제약 |
| D-08 | RPE 1~10 | CHECK 제약 |
| D-09 | 탈퇴 유예 30일 경과 시 완전 삭제 | 일 1회 Scheduler |
| D-10 | 건강 원본 90일 초과분은 일별 집계로 대체 | 일 1회 Scheduler (집계 후 원본 삭제) |

---

## 6. 데이터 보관 정책

| 데이터 | 보관 기간 | 이후 처리 |
|--------|-----------|-----------|
| 운동 기록 | 계정 유지 기간 | 탈퇴 30일 후 삭제 |
| 건강 원본(분 단위) | 90일 | 일별 집계로 대체 후 삭제 |
| 일별 건강 집계 | 계정 유지 기간 | 탈퇴 시 삭제 |
| AI Job / model runs | 1년 | 익명 통계만 보존 |
| refresh_sessions (폐기분) | 90일 | 삭제 |
| health_sync_jobs | 30일 | 삭제 |

---

## 7. Flyway 마이그레이션 계획

| 버전 | 파일 | 내용 | 주차 |
|------|------|------|------|
| V1 | `V1__init_user_auth.sql` | users, profiles, auth_accounts, devices, refresh_sessions, consents, fitness_goals | W2 |
| V2 | `V2__exercise_library.sql` | exercise_categories, exercises | W3 |
| V3 | `V3__routine.sql` | routines, versions, days, exercises, schedules | W4 |
| V4 | `V4__workout.sql` | sessions, exercises, sets + 인덱스 | W5 |
| V5 | `V5__health.sql` | observations, cursors, sync_jobs, daily_summaries, body_metrics | W9 |
| V6 | `V6__ai.sql` | ai_jobs, model_runs, exercise_mappings, prompt_templates | W10 |
| V7 | `V7__ai_modifications.sql` | ai_routine_modifications | W12 |
| V8 | `V8__perf_indexes.sql` | 부하 테스트 결과 반영 인덱스 | W13 |

**정책**: backward-compatible DDL만 사용. 컬럼 추가는 nullable 또는 default 지정, 컬럼 삭제는 2단계(사용 중지 배포 → 다음 릴리스에서 삭제).

---

## 8. 승인

| 구분 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자 | | | |
| 검토자 | | | |
| 승인자 | | | |
