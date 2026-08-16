# ✅ FitPulse 테스트 케이스

| 항목 | 내용 |
|------|------|
| 문서 유형 | 테스트 케이스 (Test Case) |
| 버전 | v1.0 |
| 작성일 | 2026-08-13 |
| 추적 기준 | 요구사항 정의서 v1.0 (FR/NFR ID) |
| 도구 | JUnit 5 + Testcontainers(MySQL 8.4, Redis 7.4), flutter_test, k6(부하) |

---

## 1. 테스트 전략 요약

| 레벨 | 범위 | 도구 | 비중 |
|------|------|------|------|
| 단위 (UT) | 도메인 규칙, 계산 로직 | JUnit 5, Mockito, flutter_test | 50% |
| 통합 (IT) | API + DB + Redis 실제 연동 | Testcontainers | 35% |
| E2E | 실기기 시나리오 (오프라인, HC) | 수동 + integration_test | 10% |
| 성능 (PT) | SLA 검증 | k6 | 5% |

**분류 코드**

| 접두사 | 영역 |
|--------|------|
| TC-AUTH | 인증 |
| TC-USER | 사용자·동의 |
| TC-EXER | 운동 라이브러리 |
| TC-ROUT | 루틴 |
| TC-WKT | 운동 기록 |
| TC-SYNC | 오프라인 동기화 |
| TC-ANL | 분석 |
| TC-HC | Health Connect (클라이언트) |
| TC-HLT | 건강 서버 동기화 |
| TC-AI | AI 추천 |
| TC-PERF | 성능 |
| TC-SEC | 보안 |
| TC-REL | 신뢰성 |

---

## 2. 인증 (TC-AUTH)

| TC ID | 요구사항 | 레벨 | 사전 조건 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|-----------|
| TC-AUTH-001 | FR-001 | IT | 미가입 이메일 | POST /auth/signup (유효 값 + 필수 동의) | 201, accessToken/refreshToken 발급, users·user_consents 저장 |
| TC-AUTH-002 | FR-001 | IT | 동일 이메일 존재 | 동일 이메일로 재가입 | 409 `EMAIL_ALREADY_EXISTS` |
| TC-AUTH-003 | FR-001 | UT | - | password="1234" (경계값: 7자, 8자) | 7자 → 400 VALIDATION_FAILED / 8자+2종 → 통과 |
| TC-AUTH-004 | FR-003 | IT | Mock Google Token EP | 유효 code+verifier 전송 | 200, 신규 사용자 생성 + user_auth_accounts 저장 |
| TC-AUTH-005 | FR-004 | IT | ID Token `aud` 불일치 | 소셜 로그인 시도 | 401 `INVALID_ID_TOKEN`, 사용자 미생성 |
| TC-AUTH-006 | FR-004 | IT | `email_verified=false` | 소셜 로그인 시도 | 401 `INVALID_ID_TOKEN` |
| TC-AUTH-007 | FR-005 | IT | 유효 RT 보유 | POST /auth/refresh | 200, 새 RT 발급, 기존 RT `revoked_at` 설정, family_id 동일 |
| TC-AUTH-008 | FR-006 | IT | 이미 사용된 RT | 동일 RT 재제출 | 401 `REFRESH_TOKEN_REUSED`, 동일 family 전체 revoked |
| TC-AUTH-009 | FR-007 | IT | 활성 세션 5개 | 6번째 기기 로그인 | 200 + `revokedDevice` 포함, 최고령 세션만 폐기, 활성 5개 유지 |
| TC-AUTH-010 | FR-008 | IT | 세션 3개 | GET /users/me/devices | 3건 반환, 현재 기기 `isCurrent=true` |
| TC-AUTH-011 | FR-008 | IT | 타 기기 세션 | DELETE /users/me/devices/{id} | 204, 해당 RT로 refresh 시 401 |
| TC-AUTH-012 | FR-010 | UT(Flutter) | - | 로그인 후 저장소 검사 | RT는 secure_storage에만 존재, SharedPreferences에 토큰 없음 |
| TC-AUTH-013 | FR-002 | IT | 가입 계정 | 잘못된 비밀번호 10회 시도 | 10회차 이후 429 (Rate Limit) |

---

## 3. 사용자·동의 (TC-USER)

| TC ID | 요구사항 | 레벨 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|
| TC-USER-001 | FR-101 | IT | GET /users/me | 프로필 반환, 타 사용자 정보 미포함 |
| TC-USER-002 | FR-102 | IT | PUT /users/me/goals (injury_notes 포함) | 200, fitness_goals 갱신 |
| TC-USER-003 | FR-102 | UT | weeklyWorkoutDays=0 / 8 (경계값) | 둘 다 400, 1~7만 허용 |
| TC-USER-004 | FR-103 | IT | 가입 시 TERMS 미동의 | 400 VALIDATION_FAILED |
| TC-USER-005 | FR-104 | IT | HEALTH_DATA 동의 철회 | 200, `revoked_at` 기록, 응답에 `healthDataDeletionRequired=true` |
| TC-USER-006 | FR-105 | IT | DELETE /auth/account | 202, status=WITHDRAWAL_PENDING, permanentDeleteAt = +30일 |
| TC-USER-007 | FR-105 | IT | 유예 중 재로그인 | 계정 복구, status=ACTIVE |
| TC-USER-008 | FR-105 | IT | 31일 경과 후 삭제 배치 실행 | 사용자 및 연관 데이터 완전 삭제 |
| TC-USER-009 | FR-106 | IT | GET /users/me/data-export | JSON 다운로드, 운동·건강·프로필 포함, 타 사용자 데이터 미포함 |

---

## 4. 운동 라이브러리 (TC-EXER)

| TC ID | 요구사항 | 레벨 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|
| TC-EXER-001 | FR-206 | IT | 시딩 후 count 조회 | 100건 이상 |
| TC-EXER-002 | FR-202 | IT | `?q=벤치` | 한글 부분 일치 결과 반환 |
| TC-EXER-003 | FR-202 | IT | `?q=bench` | 영문 부분 일치 결과 반환 |
| TC-EXER-004 | FR-202 | IT | `?muscle=CHEST&equipment=BARBELL` | 두 조건 AND 적용 |
| TC-EXER-005 | FR-201 | IT | `?limit=20` 후 nextCursor로 재요청 | 중복·누락 없이 이어짐, 마지막 페이지 `hasMore=false` |
| TC-EXER-006 | FR-205 | IT | 커스텀 운동 등록 후 타 사용자로 조회 | 등록자에게만 노출, 타 사용자 결과에 미포함 |

---

## 5. 루틴 (TC-ROUT)

| TC ID | 요구사항 | 레벨 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|
| TC-ROUT-001 | FR-301 | IT | 루틴 생성 (days 3개) | 201, version=1 생성 |
| TC-ROUT-002 | FR-302 | IT | 루틴 수정 | 새 routine_versions(version=2) 생성, version=1 내용 그대로 조회 가능 |
| TC-ROUT-003 | FR-302 | IT | 오래된 ETag로 If-Match 수정 | 409 `ROUTINE_VERSION_CONFLICT` |
| TC-ROUT-004 | FR-303 | IT | isRestDay=true 일자 포함 생성 | 휴식일에 exercises 비어도 정상 저장 |
| TC-ROUT-005 | FR-305 | IT | day_of_week=0 / 8 (경계값) | 400, 1~7만 허용 |
| TC-ROUT-006 | FR-306 | IT | 공개 루틴 복사 | 내 루틴으로 신규 생성, 원본 불변 |
| TC-ROUT-007 | FR-307 | IT | 루틴으로 세션 시작 | 세션에 routine_id + routine_version 스냅샷 저장 |
| TC-ROUT-008 | NFR-102 | IT | 타 사용자 루틴 수정 시도 | 403 `FORBIDDEN_RESOURCE` |

---

## 6. 운동 기록 (TC-WKT)

| TC ID | 요구사항 | 레벨 | 사전 조건 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|-----------|
| TC-WKT-001 | FR-401 | IT | - | POST /workout-sessions (clientId=A) | 201, status=IN_PROGRESS |
| TC-WKT-002 | FR-401 | IT | clientId=A 세션 존재 | 동일 clientId 재전송 | **중복 생성 없이 기존 세션 반환**, DB count 1 |
| TC-WKT-003 | FR-403 | IT | 종목 존재 | 세트 3건 기록 | 201×3, set_number 1~3 |
| TC-WKT-004 | FR-403 | UT | - | weight=-1 / reps=-1 / rpe=0 / rpe=11 (경계) | 모두 400 |
| TC-WKT-005 | FR-403 | UT | - | rpe=1 / rpe=10 (경계 유효값) | 정상 저장 |
| TC-WKT-006 | FR-403 | IT | set_number=1 존재 | 동일 set_number 재전송 | 중복 저장 안 됨 (UNIQUE) |
| TC-WKT-007 | FR-405 | IT | 세트 3건 (80×10, 80×8, 70×10) | 세션 완료 | computed_total_volume = 2140.0, **세트 합계와 일치** |
| TC-WKT-008 | FR-406 | IT | 완료된 세션 | 세트 수정 (80×10 → 90×10) | SetModified 이벤트 → computed_total_volume 재계산, computed_at 갱신 |
| TC-WKT-009 | FR-406 | IT | computed_at이 24시간 이상 과거 | 보정 스케줄러 실행 | 파생값 재계산, 값 정합 |
| TC-WKT-010 | FR-409 | E2E | IN_PROGRESS 세션 존재 | 앱 강제 종료 후 재실행 | 진행 중 세션 자동 복구, 입력한 세트 유지 |
| TC-WKT-011 | FR-408 | IT | 세션 30건 | 이력 조회 cursor 3페이지 | 중복·누락 없음 |
| TC-WKT-012 | FR-407 | E2E | 세트 완료 | 휴식 타이머 시작 후 앱 백그라운드 전환 | 복귀 시 남은 시간 정확, 종료 시 알림 |
| TC-WKT-013 | NFR-102 | IT | 타 사용자 세션 | GET /workout-sessions/{id} | 403 `FORBIDDEN_RESOURCE` |

---

## 7. 오프라인 동기화 (TC-SYNC)

| TC ID | 요구사항 | 레벨 | 사전 조건 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|-----------|
| TC-SYNC-001 | FR-501 | UT(Flutter) | 오프라인 | 세트 추가 | pending_operations에 PENDING 저장 |
| TC-SYNC-002 | FR-502 | UT(Flutter) | 오프라인 | 세트 추가 | UI에 즉시 반영 (낙관적 갱신), 지연 없음 |
| TC-SYNC-003 | FR-503 | UT(Flutter) | Op1(세션)·Op2(세트, depends_on=Op1) | 큐 처리 | Op1 SYNCED 이후에만 Op2 전송 |
| TC-SYNC-004 | FR-504 | UT(Flutter) | Op1 serverId=42 | Op2 payload `$ref:sess-001` | 전송 시 `sessionId=42`로 치환 |
| TC-SYNC-005 | FR-505 | IT | 동일 세션 Op 10건 | 온라인 복구 | HTTP 요청 **1~2회**로 처리 완료 |
| TC-SYNC-006 | FR-506 | UT(Flutter) | - | 각 결과별 상태 전이 확인 | SUCCESS→SYNCED, 4xx→FAILED, 충돌→CONFLICT |
| TC-SYNC-007 | FR-507 | UT(Flutter) | 5xx 응답 mock | 큐 처리 | 1→2→4→8s 백오프, 최대 5회 후 FAILED |
| TC-SYNC-008 | FR-507 | UT(Flutter) | 400 응답 mock | 큐 처리 | 재시도 없이 즉시 FAILED |
| TC-SYNC-009 | FR-508 | IT | 세션 COMPLETED 상태 | ADD_SET Op 전송 | 재오픈 → 적용 → 재완료, `reopened=true` |
| TC-SYNC-010 | FR-508 | IT | 세션 삭제됨 | ADD_SET Op 전송 | CONFLICT 반환, 앱에 선택 UI 표시 |
| TC-SYNC-011 | FR-508 | IT | 이미 삭제된 세트 | DELETE_SET 재전송 | SUCCESS (멱등, 무시) |
| TC-SYNC-012 | FR-509 | UT(Flutter) | SYNCED 1200건 | 큐 정리 실행 | 1000건 이하 유지, 오래된 SYNCED부터 삭제 |
| TC-SYNC-013 | FR-509 | UT(Flutter) | PENDING 501건 | 화면 진입 | 경고 배너 노출 |
| TC-SYNC-014 | FR-511 | E2E | 오프라인 Op 20건 | 비행기 모드 해제 | 자동 동기화 시작, 전량 SYNCED |
| TC-SYNC-015 | FR-505 | IT | Op1 실패 + Op2 depends_on=Op1 | 배치 전송 | Op2는 SKIPPED, 다음 사이클 재시도 |

---

## 8. 분석 (TC-ANL)

| TC ID | 요구사항 | 레벨 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|
| TC-ANL-001 | FR-601 | UT | weight=100, reps=5 | Epley 1RM = 116.67 (±0.01) |
| TC-ANL-002 | FR-601 | UT | reps=13 세트 | 1RM 계산 대상에서 제외 |
| TC-ANL-003 | FR-601 | UT | WARMUP/DROP 세트 | 1RM 계산 대상에서 제외 |
| TC-ANL-004 | FR-602 | IT | 2주간 세션 데이터 | granularity=WEEK 볼륨 시계열 정확 |
| TC-ANL-005 | FR-603 | IT | 가슴 4회·등 2회 세션 | 부위별 빈도 CHEST=4, BACK=2 |
| TC-ANL-006 | FR-605 | UT | 어제까지 5일 연속, 오늘 미운동 | currentStreak=5 (당일 미운동은 유지) |
| TC-ANL-007 | FR-605 | UT | 그제까지 연속, 어제·오늘 미운동 | currentStreak=0 |
| TC-ANL-008 | FR-604 | IT | 30일 데이터 | 캘린더 응답에 운동일만 표시, 강도 단계 포함 |

---

## 9. Health Connect 클라이언트 (TC-HC)

| TC ID | 요구사항 | 레벨 | 사전 조건 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|-----------|
| TC-HC-001 | FR-701 | E2E | 최초 실행 | 건강 연동 화면 진입 | 목적 3종 설명 + "나중에 하기" 노출 |
| TC-HC-002 | FR-702 | E2E | 권한 거부 | 건강 탭 진입 | 동기화 비활성 + 수동 입력 안내, 크래시 없음 |
| TC-HC-003 | FR-703 | E2E(실기기) | 권한 허용 | 최초 동기화 | 걸음수·심박·수면 레코드 수신 |
| TC-HC-004 | FR-703 | E2E(실기기) | 토큰 보유 | 새 데이터 발생 후 재동기화 | 변경분만 수신, 기존 재전송 없음 |
| TC-HC-005 | FR-705 | E2E | 토큰 만료 mock | 동기화 시도 | TOKEN_EXPIRED 감지 → 90일 fullResync + 새 토큰 발급 |
| TC-HC-006 | FR-706 | E2E | FitPulse가 HC에 기록 | 동기화 실행 | sourceApp=FitPulse 레코드 제외, 무한 루프 없음 |
| TC-HC-007 | FR-707 | UT(Flutter) | 1200건 변경 | 동기화 | 500건씩 3회 분할 처리, 누락 없음 |
| TC-HC-008 | FR-704 | E2E(실기기, Android 14+) | BG Observer 등록 | 타 앱이 HC에 기록 | WorkManager 태스크 실행, 동기화 수행 |
| TC-HC-009 | FR-716 | E2E(Android 13) | BG 미지원 기기 | 앱 포그라운드 진입 | 포그라운드 동기화로 폴백 |
| TC-HC-010 | FR-715 | E2E | 연동 후 철회 | 설정에서 연동 해제 | 동기화 중단 + 기존 데이터 삭제 여부 확인 다이얼로그 |

---

## 10. 건강 서버 동기화 (TC-HLT)

| TC ID | 요구사항 | 레벨 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|
| TC-HLT-001 | FR-709 | IT | 동일 sourceRecordId 2회 전송 | 저장 1건, `recordsSkipped=1` |
| TC-HLT-002 | FR-710 | IT | deletes에 기존 recordId 전달 | `deleted_at` 설정 (물리 삭제 아님) |
| TC-HLT-003 | FR-708 | IT | upserts 500건 | 200, 전량 저장, 3초 이내 |
| TC-HLT-004 | FR-708 | IT | 501건 전송 | 400 VALIDATION_FAILED |
| TC-HLT-005 | FR-708 | IT | 500건 중 2건 유효성 오류 | 207, 498건 커밋 + `failed` 2건 반환 |
| TC-HLT-006 | FR-712 | IT | 걸음수 3건 동기화 | daily_health_summaries.total_steps 갱신, `summariesUpdated` 반환 |
| TC-HLT-007 | FR-705 | IT | fullResync=true | 기존 데이터와 병합, 중복 미생성 |
| TC-HLT-008 | FR-713 | IT | 데이터 존재 | GET /health/dashboard | 요약 반환 + 면책 문구 포함 |
| TC-HLT-009 | FR-714 | IT | 체성분 입력 | 201, BMI 자동 계산 |
| TC-HLT-010 | FR-711 | IT | 7개 data_type 각각 전송 | 모두 정상 저장, 단위 매핑 정확 |
| TC-HLT-011 | NFR-505 | IT | 91일 이전 원본 존재 | 보관 배치 실행 | 일별 집계 유지, 원본 삭제 |

---

## 11. AI 추천 (TC-AI)

| TC ID | 요구사항 | 레벨 | 사전 조건 | 실행 절차 | 예상 결과 |
|-------|----------|------|-----------|-----------|-----------|
| TC-AI-001 | FR-801 | IT | AI_PROCESSING 동의 | POST /ai/routine-jobs | 202 + jobId, ai_jobs=PENDING |
| TC-AI-002 | FR-801 | IT | AI_PROCESSING 미동의 | 동일 요청 | 403 `CONSENT_REQUIRED` |
| TC-AI-003 | FR-815 | IT | 당일 10회 요청 완료 | 11번째 요청 | 429 `AI_RATE_LIMIT_EXCEEDED` + resetAt |
| TC-AI-004 | FR-803 | UT | - | 프롬프트 입력 생성 | 이름·이메일 미포함 검증 |
| TC-AI-005 | FR-807 | IT | Mock LLM: 필수 필드 누락 | Job 처리 | status=VALIDATION_FAILED |
| TC-AI-006 | FR-807 | IT | Mock LLM: targetSets=25 | Job 처리 | Schema 위반(1~20) → VALIDATION_FAILED |
| TC-AI-007 | FR-808 | IT | Mock LLM: 정확 명칭 반환 | Job 처리 | **모든 운동이 실제 exercises.id를 가짐** |
| TC-AI-008 | FR-808 | IT | Mock LLM: 오타 명칭("Bench Pres") | Job 처리 | Fuzzy 매칭(>0.8)으로 매핑 성공 |
| TC-AI-009 | FR-808 | IT | Mock LLM: 존재하지 않는 운동 50% | Job 처리 | 실패율>30% → 폐기 후 1회 재생성 |
| TC-AI-010 | FR-809 | IT | 이전에 매핑된 ai_name | 동일 명칭 재등장 | 학습 테이블에서 즉시 매핑 (LLM 재호출 없음) |
| TC-AI-011 | FR-810 | IT | injury_notes="어깨 회전근개" | Job 처리 | 오버헤드 프레스 미포함, safetyFlags=INJURY_AVOIDED |
| TC-AI-012 | FR-810 | IT | experienceLevel=BEGINNER | Job 처리 | ADVANCED 운동 미포함, 주간 부위별 세트 ≤ 12 |
| TC-AI-013 | FR-805 | IT | Claude Mock 타임아웃 | Job 처리 | OpenAI로 폴백, `provider=openai`, `fallbackUsed=true` |
| TC-AI-014 | FR-805 | IT | Claude·OpenAI 모두 실패 | Job 처리 | 템플릿 루틴 반환, 안내 메시지 포함 |
| TC-AI-015 | FR-806 | IT | 연속 실패로 CB OPEN | 신규 요청 | Claude 호출 없이 즉시 폴백 |
| TC-AI-016 | FR-814 | IT | 2회 run 발생 | Job 완료 | total_estimated_cost_usd = run 합계 |
| TC-AI-017 | FR-813 | IT | 새 프롬프트 version 활성화 | Job 실행 | **재배포 없이** 새 버전 사용, ai_model_runs에 버전 기록 |
| TC-AI-018 | FR-813 | IT | 이전 version is_active 전환 | Job 실행 | 롤백 적용 |
| TC-AI-019 | FR-812 | IT | 수정 2건 포함 accept | POST accept | routine 저장 + ai_routine_modifications 2건 기록 |
| TC-AI-020 | FR-816 | IT | Job 완료 응답 | 응답 텍스트 검사 | 진단성 표현 없음, 면책 문구 포함 |

---

## 12. 성능 (TC-PERF)

| TC ID | 요구사항 | 시나리오 | 부하 | 합격 기준 |
|-------|----------|----------|------|-----------|
| TC-PERF-001 | NFR-001 | 세트 기록 | 동시 50, 5분 | P95 < 200ms, 오류율 0% |
| TC-PERF-002 | NFR-002 | 세션 목록 | 동시 100, 5분 | P95 < 300ms |
| TC-PERF-003 | NFR-003 | 건강 동기화 500건 | 동시 20 | P95 < 3초 |
| TC-PERF-004 | NFR-004 | 건강 대시보드 | 동시 100 | P95 < 500ms |
| TC-PERF-005 | NFR-005 | AI Job 접수 | 동시 10 | P95 < 500ms (접수만) |
| TC-PERF-006 | NFR-006 | AI Job 완료 | - | < 30초 |
| TC-PERF-007 | NFR-007 | 1RM/볼륨 분석 | 동시 50 | P95 < 500ms |
| TC-PERF-008 | NFR-008 | 운동 검색 | 동시 100 | P95 < 300ms |
| TC-PERF-009 | NFR-009 | 컨테이너 기동 | - | 30초 내 readiness 통과 |
| TC-PERF-010 | NFR-301 | 장시간 부하 | 동시 50, 30분 | HikariCP 사용률 < 80%, 메모리 누수 없음 |

**데이터 조건**: 사용자 1,000명 / 세션 100,000건 / 세트 2,500,000건 / 건강 관측치 5,000,000건 시드

---

## 13. 보안 (TC-SEC)

| TC ID | 요구사항 | 실행 절차 | 예상 결과 |
|-------|----------|-----------|-----------|
| TC-SEC-001 | NFR-101 | Authorization 헤더 없이 보호 API 호출 | 401 |
| TC-SEC-002 | NFR-102 | 타 사용자 리소스 ID로 조회/수정/삭제 (IDOR) | 전부 403 |
| TC-SEC-003 | NFR-103 | DB `refresh_sessions` 직접 조회 | 평문 토큰 없음, 해시만 존재 |
| TC-SEC-004 | NFR-104 | 앱 저장소 덤프 | 토큰이 secure storage 외 위치에 없음 |
| TC-SEC-005 | NFR-105 | DB `users.password` 조회 | BCrypt 해시 형식(`$2a$`) |
| TC-SEC-006 | NFR-107 | AI 요청 로그·input_summary 검사 | 이름·이메일·프롬프트 원문 없음 |
| TC-SEC-007 | NFR-106 | 저장소 커밋 이력 스캔 | API 키·DB 비밀번호 미포함 |
| TC-SEC-008 | NFR-101 | 만료된 Access Token 사용 | 401 `TOKEN_EXPIRED` |
| TC-SEC-009 | - | SQL Injection 시도 (`' OR 1=1--`) | 파라미터 바인딩으로 무해, 500 없음 |

---

## 14. 신뢰성 (TC-REL)

| TC ID | 요구사항 | 실행 절차 | 예상 결과 |
|-------|----------|-----------|-----------|
| TC-REL-001 | NFR-201 | AI 전 provider 차단 상태에서 요청 | 템플릿 루틴 반환, 기능 중단 없음 |
| TC-REL-002 | NFR-202 | 비행기 모드에서 세션 전체 수행 후 복구 | 기록 유실 0건 |
| TC-REL-003 | NFR-203 | 동일 배치 2회 전송 | 중복 저장 0건 |
| TC-REL-004 | NFR-204 | DB 컨테이너 중지 | readiness FAIL, liveness OK |
| TC-REL-005 | NFR-205 | 컨테이너 healthcheck 실패 유도 | 자동 재시작 확인 |
| TC-REL-006 | NFR-201 | Redis 중지 | 연결 타임아웃 3초 내 실패, 앱 크래시 없음 |

---

## 15. 통합 테스트 코드 예시

```java
@SpringBootTest
@Testcontainers
class WorkoutIntegrationTest {

  @Container
  static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
      .withDatabaseName("fitpulse_test");

  @Container
  static GenericContainer<?> redis = new GenericContainer<>("redis:7.4-alpine")
      .withExposedPorts(6379);

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry reg) {
    reg.add("spring.datasource.url", mysql::getJdbcUrl);
    reg.add("spring.data.redis.url",
        () -> "redis://localhost:" + redis.getMappedPort(6379));
  }

  @Test // TC-WKT-002
  void 동일_clientId_재전송_시_중복_저장되지_않는다() { }

  @Test // TC-WKT-007
  void 세션_완료_후_볼륨_합계가_세트_합계와_일치한다() { }

  @Test // TC-WKT-008
  void 세트_수정_후_파생값이_재계산된다() { }
}

class HealthSyncIntegrationTest {
  @Test void 동일_sourceRecordId_재전송_시_중복_없다() { }        // TC-HLT-001
  @Test void 삭제된_레코드가_soft_delete된다() { }                 // TC-HLT-002
  @Test void daily_summaries가_동기화_후_갱신된다() { }            // TC-HLT-006
}

class AiRoutineIntegrationTest {   // Mock LLM 사용
  @Test void 모든_운동이_exercises_테이블에_존재하는_id를_갖는다() { } // TC-AI-007
  @Test void injury_notes_금기_운동이_포함되지_않는다() { }           // TC-AI-011
  @Test void 주간_볼륨_상한_초과하지_않는다() { }                     // TC-AI-012
  @Test void JSON_Schema_위반_시_VALIDATION_FAILED() { }             // TC-AI-005
  @Test void primary_실패_시_fallback_provider_사용된다() { }        // TC-AI-013
}
```

---

## 16. 커버리지 요약

| 영역 | TC 수 | 대응 요구사항 |
|------|-------|---------------|
| 인증 | 13 | FR-001~010 |
| 사용자·동의 | 9 | FR-101~106 |
| 운동 라이브러리 | 6 | FR-201~206 |
| 루틴 | 8 | FR-301~307 |
| 운동 기록 | 13 | FR-401~410 |
| 오프라인 동기화 | 15 | FR-501~511 |
| 분석 | 8 | FR-601~605 |
| Health Connect | 10 | FR-701~707, 715~716 |
| 건강 서버 | 11 | FR-708~714 |
| AI | 20 | FR-801~816 |
| 성능 | 10 | NFR-001~010 |
| 보안 | 9 | NFR-101~108 |
| 신뢰성 | 6 | NFR-201~205 |
| **합계** | **138** | **요구사항 커버리지 100%** |

---

## 17. 승인

| 구분 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자 | | | |
| 검토자 | | | |
| 승인자 | | | |
