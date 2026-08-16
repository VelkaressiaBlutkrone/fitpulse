# 🧩 FitPulse 상세 설계서

| 항목 | 내용 |
|------|------|
| 문서 유형 | 상세 설계서 (Detailed Design) |
| 버전 | v2.0 |
| 작성일 | 2026-08-13 |
| 선행 문서 | 아키텍처 설계서 v2.0, ERD v2.0, API 명세 v2.0 |
| 변경 | v2.0 — community/moderation/admin 모듈 설계 추가 |

---

## 1. 모듈별 클래스 설계

### 1.1 workout 모듈

```
presentation/
  WorkoutSessionController        ← POST/GET /workout-sessions ...
  WorkoutBatchController          ← POST /workout-sessions/batch
  dto/ CreateSessionRequest, AddSetRequest, SessionDetailResponse, BatchRequest/Result

application/
  StartWorkoutSessionUseCase      ← 멱등 처리(clientId) + 세션 생성
  RecordSetUseCase                ← 세트 생성/수정/삭제 + SetModified 발행
  CompleteWorkoutSessionUseCase   ← 상태 전이 + WorkoutCompleted 발행
  ProcessBatchOperationsUseCase   ← $ref 치환, 의존성 순차 처리, 결과 집계
  WorkoutDerivedValueCalculator   ← 파생값 계산(이벤트 리스너에서 호출)

domain/
  WorkoutSession (Entity)
    - status: SessionStatus
    + complete(endedAt): void          // IN_PROGRESS만 허용
    + reopen(): void                   // 오프라인 지각 세트 수용
    + applyComputed(DerivedValues): void
  WorkoutExercise (Entity)
  WorkoutSet (Entity)
    + volume(): BigDecimal             // weight × reps (완료 세트만)
  DerivedValues (VO: durationMin, totalVolume, totalCalories)
  SessionStatus (Enum: IN_PROGRESS, COMPLETED, CANCELLED)
  WorkoutSessionRepository (Interface)

infrastructure/
  JpaWorkoutSessionRepository
  WorkoutEventListener            ← @TransactionalEventListener(AFTER_COMMIT)
  DerivedValueCorrectionScheduler ← 매일 04:00 computed_at 노후 건 재계산
```

**클래스 다이어그램 (핵심)**

```
┌────────────────────┐ 1      * ┌──────────────────┐ 1     * ┌─────────────┐
│  WorkoutSession    │─────────▶│ WorkoutExercise  │────────▶│ WorkoutSet  │
├────────────────────┤          ├──────────────────┤         ├─────────────┤
│ - userId           │          │ - exerciseId     │         │ - setNumber │
│ - status           │          │ - orderNum       │         │ - weightKg  │
│ - clientId (UK)    │          │ - restSeconds    │         │ - reps      │
│ - computedVolume   │          └──────────────────┘         │ - rpe       │
│ - computedAt       │                                       │ - clientId  │
├────────────────────┤                                       ├─────────────┤
│ + complete()       │                                       │ + volume()  │
│ + reopen()         │                                       └─────────────┘
│ + applyComputed()  │
└────────────────────┘
          △ 사용
          │
┌─────────┴──────────────────────┐
│ WorkoutDerivedValueCalculator  │
│ + calculate(sessionId): Derived│
└────────────────────────────────┘
```

### 1.2 health 모듈

```
presentation/  HealthSyncController, HealthDashboardController, BodyMetricController
application/   SyncHealthDataUseCase, GetDashboardUseCase, UpsertBodyMetricUseCase
domain/        HealthObservation, DailyHealthSummary, SyncCursor, DataType(Enum),
               HealthObservationRepository, DailySummaryAggregator
infrastructure/JpaHealthObservationRepository, HealthEventListener,
               HealthRetentionScheduler (90일 원본 정리)
```

### 1.3 recommendation 모듈 (AI)

```
presentation/  AiRoutineJobController
application/   RequestRoutineJobUseCase       ← Rate Limit + 동의 확인 + Job 생성(202)
               GenerateRoutineJobProcessor    ← @Async, 파이프라인 오케스트레이션
               AcceptRoutineUseCase           ← 루틴 저장 + 수정 내역 기록
domain/        AiJob, AiModelRun, RoutineDraft(VO), SafetyFlag(VO),
               RoutineSafetyValidator, VolumeLimitPolicy, ExerciseMatcher
infrastructure/AnthropicClient, OpenAiClient, TemplateRoutineProvider,
               LlmClientRouter (폴백 체인), PromptTemplateRepository,
               AiCostAggregator
```

**AI 파이프라인 클래스 협력**

```
GenerateRoutineJobProcessor
   ├─▶ PromptTemplateRepository.findActive(key)
   ├─▶ RuleBasedRangeCalculator.calc(goals, history)   // 볼륨 상한·금기 목록
   ├─▶ LlmClientRouter.generate(prompt)
   │      ├─ AnthropicClient      (primary, Resilience4j CB)
   │      ├─ OpenAiClient         (fallback)
   │      └─ TemplateRoutineProvider (final fallback)
   ├─▶ RoutineJsonSchemaValidator.validate(json)
   ├─▶ ExerciseMatcher.map(names)                       // 3단계 매핑
   ├─▶ RoutineSafetyValidator.validate(draft, goals)    // 금기·상한
   └─▶ AiCostAggregator.accumulate(job)
```

### 1.4 user 모듈

```
presentation/  AuthController, UserController, DeviceController, ConsentController
application/   SignUpUseCase, LoginUseCase, GoogleLoginUseCase,
               RotateRefreshTokenUseCase, RevokeDeviceSessionUseCase,
               UpdateConsentUseCase, WithdrawAccountUseCase, ExportUserDataUseCase
domain/        User, UserProfile, RefreshSession, Consent, FitnessGoal,
               TokenFamily(VO), SessionLimitPolicy(최대 5)
infrastructure/JpaUserRepository, RedisRefreshTokenStore, GoogleIdTokenVerifier,
               AccountDeletionScheduler (30일 경과 완전 삭제)
```


### 1.6 community 모듈 ★ v2.0

```
presentation/  PublicRoutineController, RoutineLikeController, RoutineRankingController,
               ReportController
application/   PublishRoutineUseCase       ← 공개 요청 → 심사 대기 전환
               ToggleRoutineLikeUseCase    ← 멱등 토글 + 이벤트 발행
               GetPublicRoutinesUseCase    ← 인기/최신 정렬 + 블라인드 제외
               GetRankingUseCase           ← Redis ZSET 조회, 실패 시 스냅샷 폴백
               SubmitReportUseCase         ← 중복 신고 차단 + 이벤트 발행
domain/        RoutineLike, RoutineStats, RankingScorePolicy, Report, ReportReason
               PublicRoutineVisibilityPolicy   ← is_public && APPROVED && !blinded
infrastructure/JpaRoutineLikeRepository, RedisRankingStore,
               RankingSnapshotScheduler (매시 정각), StatsReconcileScheduler (새벽)
```

### 1.7 moderation 모듈 ★ v2.0

```
presentation/  AdminReportController, AdminSanctionController, AppealController
application/   HandleReportUseCase, ExecuteSanctionUseCase, RevokeSanctionUseCase,
               ReviewAppealUseCase, AutoBlindListener
domain/        Report, ModerationAction, SanctionType, SanctionPolicy,
               RepeatOffenseEscalationPolicy   ← 반복 위반 시 가중 제안
infrastructure/JpaReportRepository, SanctionNotifier
```

### 1.8 admin 모듈 ★ v2.0

```
presentation/  AdminAuthController, AdminAccountController, AdminUserController,
               AdminContentController, AdminAiOpsController, AdminStatsController,
               AdminSettingController, AdminAuditController, AdminApprovalController
application/   AdminLoginUseCase, VerifyMfaUseCase, InviteAdminUseCase,
               SearchUsersUseCase, UnmaskUserPiiUseCase, SuspendUserUseCase,
               ActivatePromptUseCase, VerifyMappingUseCase, ToggleKillSwitchUseCase,
               UpdateSettingUseCase, RequestApprovalUseCase, ApproveRequestUseCase
domain/        Admin, AdminRole, Permission, AdminSession, AuditLog,
               PermissionPolicy, SensitiveActionPolicy, ApprovalPolicy,
               PiiMaskingPolicy, SystemSetting
infrastructure/JpaAdminRepository, TotpVerifier, AdminSessionStore(Redis+DB),
               JpaAuditLogRepository(append-only), SettingProvider(캐시 30초)
```

**관리자 인가 구현**

```java
// 권한 선언 어노테이션
@Target(ElementType.METHOD) @Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
  String[] value();                       // 예: "USER_SUSPEND"
  boolean requireReason() default false;  // X-Admin-Reason 필수 여부
  boolean requireApproval() default false;// 2인 승인 대상 여부
}

@RestController
@RequestMapping("/api/v1/admin/users")
class AdminUserController {

  @PatchMapping("/{id}/status")
  @RequirePermission(value = "USER_SUSPEND", requireReason = true)
  ResponseEntity<?> suspend(@PathVariable Long id, @RequestBody SuspendRequest req) { }

  @PostMapping("/{id}/hard-delete")
  @RequirePermission(value = "USER_HARD_DELETE", requireReason = true, requireApproval = true)
  ResponseEntity<?> hardDelete(@PathVariable Long id) { }   // → 202 APPROVAL_REQUIRED
}
```

**감사 기록 Aspect**

```java
@Aspect @Component
class AdminAuditAspect {

  @Around("@annotation(requirePermission)")
  Object audit(ProceedingJoinPoint pjp, RequirePermission requirePermission) throws Throwable {
    AdminContext ctx = AdminContextHolder.get();
    Object before = snapshotResolver.before(pjp);   // 대상의 변경 전 상태
    String result = "SUCCESS";
    try {
      Object ret = pjp.proceed();
      auditRepository.save(AuditLog.of(ctx, pjp, before, snapshotResolver.after(ret),
                                       result, ctx.reason()));   // 같은 트랜잭션
      return ret;
    } catch (PermissionDeniedException e) { result = "DENIED"; throw e; }
      catch (Exception e)                 { result = "FAILED"; throw e; }
      finally { if (!"SUCCESS".equals(result)) auditRepository.save(/* 실패도 기록 */); }
  }
}
```

> **설계 의도**: 감사 로그를 별도 트랜잭션이나 비동기로 처리하면 "작업은 됐는데 기록이 없는" 구간이 생깁니다. 감사 기록을 같은 트랜잭션에 두어, 기록 실패 시 작업도 롤백되게 했습니다. 성능보다 추적성을 우선한 선택입니다.

### 1.5 Flutter 계층 설계

```
core/network/      DioClient, AuthInterceptor(401→refresh 재시도), ErrorMapper
core/storage/      AppDatabase(drift), SecureTokenStorage
core/auth/         TokenManager, AuthStateNotifier
core/health/       HealthConnectService (권한/토큰/변경조회)
core/sync/         OperationQueueEngine, ConflictResolver, RefResolver
features/*/data/   Repository (서버 + 로컬 큐 동시 사용)
features/*/domain/ 모델, OneRmCalculator
features/*/presentation/ Page, Widget, Riverpod Notifier
```

---

## 2. 주요 시퀀스 다이어그램

### 2.1 세트 기록 (온라인)

```
사용자    UI(SetRow)   WorkoutSessionNotifier   OpQueueEngine   API      DB
  │  탭      │                 │                    │           │        │
  │─────────▶│  addSet(data)   │                    │           │        │
  │          │────────────────▶│                    │           │        │
  │          │                 │ ① Optimistic UI 갱신│           │        │
  │          │◀────────────────│                    │           │        │
  │◀─ 즉시 반영                │                    │           │        │
  │          │                 │ ② enqueue(ADD_SET) │           │        │
  │          │                 │───────────────────▶│           │        │
  │          │                 │                    │ ③ drift 저장(PENDING)
  │          │                 │                    │ ④ 온라인 → 전송     │
  │          │                 │                    │──────────▶│        │
  │          │                 │                    │           │ ⑤ clientId 멱등 확인
  │          │                 │                    │           │───────▶│
  │          │                 │                    │◀── 201 ───│        │
  │          │                 │                    │ ⑥ SYNCED + serverId 저장
```

### 2.2 세션 완료 → 파생값 계산

```
API Controller   CompleteSessionUseCase   Session(Entity)   EventPublisher   Listener   DB
      │  PUT /complete    │                     │                 │             │       │
      │──────────────────▶│                     │                 │             │       │
      │                   │ ① 소유권·상태 검사   │                 │             │       │
      │                   │────────────────────▶│ complete()      │             │       │
      │                   │ ② 커밋               │                 │             │       │
      │                   │──────────────────────────────────────▶│ publish(WorkoutCompleted)
      │                   │                     │                 │ AFTER_COMMIT│       │
      │                   │                     │                 │────────────▶│       │
      │                   │                     │                 │             │ ③ 세트 집계
      │                   │                     │                 │             │──────▶│
      │                   │                     │                 │             │ ④ computed_* + computed_at UPDATE
      │◀── 200 (computed 값 포함) ──────────────────────────────────────────────────────│
```

> 이벤트 처리 실패에 대비해 매일 04:00 보정 스케줄러가 `computed_at IS NULL OR computed_at < updated_at`인 세션을 재계산합니다.

### 2.3 오프라인 → 온라인 배치 동기화

```
Connectivity   OpQueueEngine        RefResolver   API(batch)   ConflictResolver   UI
     │ 온라인 복구   │                    │            │              │            │
     │─────────────▶│                    │            │              │            │
     │              │ ① PENDING 조회(의존성 위상 정렬)│              │            │
     │              │ ② 같은 세션 Op 묶기 │            │              │            │
     │              │───────────────────▶│ $ref 치환  │              │            │
     │              │                    │───────────▶│              │            │
     │              │                    │            │ ③ 순차 처리   │            │
     │              │◀────────── 207 results ─────────│              │            │
     │              │ ④ SUCCESS → SYNCED(serverId 저장)│              │            │
     │              │ ⑤ CONFLICT ────────────────────────────────────▶│           │
     │              │                                 │              │ ⑥ 선택 UI ─▶│
     │              │ ⑦ FAILED(4xx) → 재시도 안 함     │              │            │
```

### 2.4 Health Connect 증분 동기화

```
앱 진입/BG Observer  HealthConnectService   HC(OS)   OpQueue/Api   Server
        │ trigger          │                  │           │           │
        │─────────────────▶│ ① token 유효?     │           │           │
        │                  │─────────────────▶│           │           │
        │                  │◀── changes(500) ─│           │           │
        │                  │ ② sourceApp=FitPulse 제외    │           │
        │                  │ ③ 500건 배치 구성 │           │           │
        │                  │─────────────────────────────▶│ POST /health/sync
        │                  │                              │──────────▶│
        │                  │                              │◀─ 200/207 │
        │                  │ ④ nextToken 저장, hasMore면 ①로 반복      │
        │                  │ ⑤ TOKEN_EXPIRED면 fullResync(90일) 후 새 토큰
```

### 2.5 AI 루틴 생성 (폴백 포함)

```
App    API   RequestUseCase  JobProcessor  LlmRouter  Validator  Matcher   DB
 │POST  │         │               │            │          │        │       │
 │─────▶│────────▶│ ① RateLimit·동의 확인       │          │        │       │
 │      │         │ ② ai_jobs INSERT(PENDING)  │          │        │       │
 │◀─202 jobId ────│               │            │          │        │       │
 │      │         │ ③ @Async 시작 │───────────▶│          │        │       │
 │      │         │               │ ④ Claude 호출          │        │       │
 │      │         │               │   실패 → OpenAI        │        │       │
 │      │         │               │   실패 → Template      │        │       │
 │      │         │               │───────────▶│ ⑤ Schema 검증     │       │
 │      │         │               │            │─────────▶│ ⑥ 3단계 매핑   │
 │      │         │               │            │          │ 실패율>30% → 폐기·1회 재생성
 │      │         │               │            │ ⑦ 안전성 검증(금기·볼륨)  │
 │      │         │               │ ⑧ ai_model_runs·비용 기록 ──────────────▶│
 │      │         │               │ ⑨ status=COMPLETED                      │
 │GET /jobs/{id} (폴링) ─────────────────────────────────────────────────▶ │
 │◀─ result + safetyFlags + 면책 고지 ─────────────────────────────────────│
```

### 2.6 Rotational Refresh + 도난 감지

```
App        API        RefreshSessionRepo
 │ POST /auth/refresh(RT_1)     │
 │──────────▶│ ① hash(RT_1) 조회 │
 │           │─────────────────▶│
 │           │ ② revoked_at 존재? │
 │           │   YES → family 전체 폐기 → 401 REFRESH_TOKEN_REUSED
 │           │   NO  → ③ RT_1 폐기 + RT_2 발급(같은 family_id)
 │◀─ AT_2, RT_2 ─────────────────│
```


### 2.7 좋아요 토글 + 랭킹 반영 ★ v2.0

```
App    API    ToggleLikeUseCase   LikeRepo   EventPub   StatsListener   Redis ZSET
 │POST /like  │                     │           │            │              │
 │───────────▶│ ① 공개·승인 루틴인가 │           │            │              │
 │            │ ② 자기 루틴인가 → 400│           │            │              │
 │            │ ③ 기존 like 조회 ───▶│           │            │              │
 │            │   있음 & liked=true → 변화 없이 200 (멱등)   │              │
 │            │   없음 → INSERT     │           │            │              │
 │            │ ④ 커밋 ────────────────────────▶│ RoutineLiked              │
 │◀── 200 {likeCount} ──────────────│           │───────────▶│ ⑤ stats.like_count++
 │            │                     │           │            │─────────────▶│ ZINCRBY +3
 │            │                     │           │            │ ⑥ 스냅샷은 매시 정각 배치
```

### 2.8 신고 → 자동 블라인드 → 관리자 심사 ★ v2.0

```
사용자   API    ReportUseCase   EventPub  AutoBlindListener  관리자   AdminAPI
  │POST /reports │                 │            │              │         │
  │─────────────▶│ ① 중복 신고 검사(UNIQUE)      │              │         │
  │              │ ② reports INSERT│            │              │         │
  │◀─ 201 ───────│ ③ 커밋 ────────▶│ RoutineReported            │         │
  │              │                 │───────────▶│ ④ report_count++        │
  │              │                 │            │ ⑤ 임계치(5) 도달?        │
  │              │                 │            │   YES → review_status=BLINDED
  │              │                 │            │        + 공개 목록 즉시 제외
  │              │                 │            │        + Slack 알림      │
  │              │                 │            │              │ ⑥ 신고 큐 확인
  │              │                 │            │              │────────▶│
  │              │                 │            │              │ ⑦ 수용/기각 판정
  │              │                 │            │              │ ⑧ 제재 집행(선택)
  │◀── 처리 결과 통지 ──────────────────────────────────────────────────│
```

### 2.9 관리자 민감 작업 (2인 승인) ★ v2.0

```
관리자A   AdminAPI   ApprovalGate   ApprovalRepo   관리자B   UseCase   AuditRepo
   │ POST hard-delete │                │             │         │          │
   │─────────────────▶│ ① 권한 확인     │             │         │          │
   │                  │ ② X-Admin-Reason 존재 확인    │         │          │
   │                  │ ③ requireApproval=true       │         │          │
   │                  │───────────────▶│ PENDING 생성(24h)     │          │
   │◀─ 202 {approvalRequestId:31} ─────│             │         │          │
   │                  │                │  ④ 승인 대기 알림 ──▶ │          │
   │                  │                │             │ POST /approvals/31/approve
   │                  │                │◀────────────│         │          │
   │                  │ ⑤ 요청자≠승인자 검증 (같으면 403)       │          │
   │                  │ ⑥ 실행 ─────────────────────────────▶ │          │
   │                  │ ⑦ 감사 기록 (요청자·승인자 모두 기록) ──────────▶│
   │                  │ ⑧ status=EXECUTED                     │          │
```

### 2.10 관리자 로그인 (2FA) ★ v2.0

```
관리자   AdminAuthAPI   AdminRepo   TotpVerifier   SessionStore
  │ ① email+pw │            │            │             │
  │───────────▶│ IP 허용 확인 → 불일치 403             │
  │            │───────────▶│ locked_until > now → 423 │
  │            │ BCrypt 검증 실패 → failed_count++ (5회 시 30분 잠금)
  │◀─ mfaToken(5분) ────────│            │             │
  │ ② TOTP 코드 │            │            │             │
  │───────────▶│───────────────────────▶│ ±30초 윈도우 검증
  │            │            │            │ 실패 → 401 ADMIN_MFA_INVALID
  │            │ ③ 동시 세션 2개 초과 시 최고령 폐기 ───▶│
  │◀─ adminToken(30분, 절대 8h) ─────────────────────────│
```

---

## 3. 핵심 알고리즘

### 3.1 파생값 계산

```
입력: sessionId
① 세션의 완료 세트 조회 (is_completed = true)
② totalVolume = Σ (weight_kg × reps)      // weight/reps NULL이면 0 처리
③ durationMin = (ended_at - started_at) 분, ended_at NULL이면 NULL
④ totalCalories = round(MET × 3.5 × bodyWeightKg / 200 × durationMin)
     MET: 근력 운동 기본 5.0, 유산소 종목 포함 시 종목별 가중 평균
     bodyWeightKg: 최근 body_metrics, 없으면 프로필 추정치, 그래도 없으면 계산 생략
⑤ computed_* 필드 UPDATE + computed_at = now()
```

### 3.2 1RM 추정 (Epley)

```
estimated1RM = weight × (1 + reps / 30)

유효 조건:
  - is_completed = true
  - set_type ∈ {NORMAL, FAILURE}   // WARMUP, DROP 제외
  - 1 ≤ reps ≤ 12                   // 12회 초과는 오차 과다로 제외
  - weight_kg > 0

일자별 대표값 = 해당 일자 세트 중 estimated1RM 최댓값
표시 시 "추정치" 라벨 필수
```

### 3.3 스트릭 계산

```
입력: userId, 오늘(사용자 로컬 날짜)
① 완료 세션의 로컬 날짜 집합 D 조회 (started_at + timezone_offset)
② currentStreak: 오늘부터 하루씩 거슬러 D에 존재하는 동안 +1
   - 오늘 기록이 없으면 어제부터 시작 (당일 미운동은 스트릭 유지)
   - 어제도 없으면 currentStreak = 0
③ longestStreak: D를 정렬 후 연속 구간 최대 길이
```

### 3.4 Operation Queue 처리

```
processQueue():
  if (offline) return
  ops = SELECT * FROM pending_operations
        WHERE status IN ('PENDING','FAILED' AND retry_count < 5)
        ORDER BY id ASC

  // ① 위상 정렬: depends_on이 아직 SYNCED가 아니면 대기
  ready = ops.where(op => op.dependsOn == null
                       || findByClientId(op.dependsOn).status == 'SYNCED')

  // ② 세션 단위로 그룹핑하여 배치 구성 (최대 50 Op / 배치)
  for (batch in groupBySession(ready)):
      mark(batch, 'SYNCING')
      payloads = batch.map(op => resolveRefs(op.payload))   // $ref → serverId
      result = POST /workout-sessions/batch { operations: payloads }
      for (r in result.results):
          switch (r.status):
            SUCCESS  → update(status='SYNCED', server_id=r.serverId, synced_at=now)
            CONFLICT → update(status='CONFLICT', error_msg=r.code) → UI 알림
            FAILED   → if (4xx) status='FAILED'
                       else retry_count++, backoff(2^n s, 최대 5회), status='PENDING'
            SKIPPED  → status='PENDING' (다음 사이클에서 재시도)

resolveRefs(payload):
  payload 내 "$ref:{clientId}" 값을 findByClientId(clientId).server_id 로 치환
  치환 대상이 아직 없으면 해당 Op는 이번 사이클에서 제외

큐 관리:
  총 건수 > 1000 → 오래된 SYNCED 삭제
  PENDING > 500  → 경고 배너 표시
  DB 파일 > 50MB → SYNCED 전량 정리
```

### 3.5 AI exercise 3단계 매핑

```
map(aiName):
  ① 학습 테이블 조회: ai_exercise_mappings WHERE ai_name = aiName (verified 우선)
     → hit이면 exercise_id 반환 (confidence 1.0)
  ② 정확 매칭: exercises WHERE LOWER(name_en) = LOWER(aiName) OR LOWER(name) = LOWER(aiName)
     → hit이면 매핑 저장 후 반환
  ③ Fuzzy 매칭: trigram/Levenshtein 유사도 계산, 최고 점수 s
     → s > 0.8 이면 매핑 저장(confidence = s, verified = false) 후 반환
  ④ 실패 → null (해당 운동 제거)

후처리:
  failureRate = 제거 수 / 전체 운동 수
  if (failureRate > 0.30):
      루틴 폐기 → 프롬프트에 "DB 운동명 후보 목록" 포함해 1회 재생성
      재생성도 실패 → status = VALIDATION_FAILED
```

### 3.6 안전성 검증

```
validate(draft, goals, history):
  flags = []

  // ① 부상 금기 교차
  banned = InjuryRuleTable.lookup(goals.injuryNotes)   // 예: 어깨 → 오버헤드 프레스, 비하인드 넥
  for (ex in draft.exercises):
      if (ex in banned) → 제거 + flags += INJURY_AVOIDED

  // ② 경험 수준
  if (goals.experienceLevel == BEGINNER):
      고급(difficulty=ADVANCED) 운동 제거 + flags += LEVEL_ADJUSTED

  // ③ 주간 볼륨 상한 (부위별 주간 세트 수)
  limit = { BEGINNER: 12, INTERMEDIATE: 18, ADVANCED: 24 }   // 부위당 주간 세트
  for (muscle, sets in draft.weeklySetsByMuscle()):
      if (sets > limit[level]) → 세트 축소 + flags += VOLUME_CAPPED

  // ④ 급증 방지
  if (draft.totalWeeklySets > history.avgWeeklySets × 1.5)
      → 축소 + flags += PROGRESSION_LIMITED

  // ⑤ 장비 가용성
  draft에서 goals.availableEquipment에 없는 장비 운동 → 대체 또는 제거

  return (draft, flags)
```

### 3.7 세션 상한 처리

```
onLogin(userId, deviceId):
  active = SELECT * FROM refresh_sessions
           WHERE user_id = ? AND revoked_at IS NULL AND expires_at > now()
           ORDER BY created_at ASC
  if (active.size >= 5):
      oldest = active[0]
      oldest.revoked_at = now()
      notify(oldest.device_id, "다른 기기에서 로그인되어 로그아웃됩니다.")   // V1.1 푸시, MVP는 401 응답 안내
  insert(new session)
```


### 3.8 랭킹 점수 계산 ★ v2.0

```
score(routine) = like_count × 3 + copy_count × 5 + view_count × 1

시간 가중 (WEEKLY):
  weeklyScore = Σ (해당 이벤트 가중치 × decay)
  decay = 0.5 ^ (경과일 / 3)      // 3일 반감기 → 최신 인기 반영

저장:
  실시간  : Redis ZSET  ranking:routine:weekly  (ZINCRBY, TTL 8일)
            Redis ZSET  ranking:routine:all
  영속화  : 매시 정각 상위 100건 → routine_ranking_snapshots

조회 폴백:
  Redis 조회 실패 → 최신 스냅샷 반환 + 응답 calculatedAt을 스냅샷 시각으로 표기

어뷰징 필터 (FR-313):
  - 자기 루틴 좋아요 차단
  - 동일 사용자 10회/분 초과 → 429
  - 동일 IP에서 24시간 내 20개 이상 계정이 같은 루틴에 좋아요 → 점수 제외 + 관리자 검토 큐
  - 정지 상태 사용자의 좋아요는 점수 미반영
```

### 3.9 자동 블라인드 판정 ★ v2.0

```
onRoutineReported(routineId):
  stats.report_count += 1
  threshold = settings.getInt('ROUTINE_AUTO_BLIND_THRESHOLD')   // 기본 5
  if (stats.report_count >= threshold && routine.review_status == 'APPROVED'):
      routine.review_status = 'BLINDED'
      routine.review_note = '신고 누적 자동 처리 (관리자 심사 대기)'
      publish(SlackAlert, P3)
      // 소유자에게 통지, 이의제기 가능
  ※ 자동 블라인드는 '임시 조치'이며 관리자 심사로 확정/해제된다
  ※ 동일인 중복 신고는 UNIQUE 제약으로 집계되지 않는다
```

### 3.10 개인정보 마스킹 ★ v2.0

```
mask(email):  로컬파트 앞 2자 + '***' + '@' + 도메인 앞 2자 + '***' + TLD
              hong@gmail.com → ho***@gm***.com
mask(name):   첫 글자 + '*'×(길이-1)        홍길동 → 홍**
mask(phone):  중간 4자리 마스킹

해제 조건 (FR-923):
  ① USER_PII_UNMASK 권한 보유
  ② reason 입력 (10자 이상)
  ③ 시간당 30회 이내
  → 통과 시 원본 반환 + admin_audit_logs(action='USER_PII_UNMASK') 기록
  → 30회 초과 시 429 + Slack 알림(내부자 대량 열람 탐지)
```

### 3.11 관리자 세션 만료 판정 ★ v2.0

```
validate(session):
  if (session.revoked_at != null)                       → 401
  if (now > session.absolute_expires_at)                → 401 (발급 +8h)
  if (now - session.last_activity_at > 30분)            → 401 (Idle)
  if (!session.mfa_verified)                            → 401 ADMIN_MFA_REQUIRED
  if (admin.status != 'ACTIVE')                         → 401 (비활성화 즉시 반영)
  if (admin.allowed_ip_cidrs != null && !match(ip))     → 403
  else → last_activity_at = now (슬라이딩 갱신)
```

---

## 4. 공통 컴포넌트

### 4.1 서버 공통

| 컴포넌트 | 책임 |
|----------|------|
| `GlobalExceptionHandler` | 도메인 예외 → `{code, message, details, correlationId}` 변환 |
| `BusinessException` | code + httpStatus + details 보유 기반 예외 |
| `CorrelationIdFilter` | `X-Correlation-Id` 생성/전파 + MDC 주입 |
| `IdempotencyResolver` | clientId 기반 기존 리소스 조회·반환 |
| `OwnershipChecker` | 리소스 user_id 검사 (IDOR 방지) |
| `CursorCodec` | cursor 인코딩/디코딩 (Base64 JSON) |
| `RateLimiter` | Redis 기반 슬라이딩 윈도우 |
| `EventPublisher` | ApplicationEvent 래퍼 (AFTER_COMMIT 보장) |
| `ApiResponseAdvice` | ETag 생성, Sunset 헤더 부착 |
| `SettingProvider` ★v2.0 | `system_settings` 조회 + 30초 캐시, 점검 모드·AI 킬스위치 판정 |
| `MaintenanceModeFilter` ★v2.0 | 점검 모드 시 사용자 쓰기 API 503 차단 (읽기·관리자 API는 통과) |
| `SanctionCheckFilter` ★v2.0 | 유효 제재 확인 후 403 `ACCOUNT_SUSPENDED` / `PUBLISH_BANNED` |
| `AdminAuthFilter` ★v2.0 | adminToken 검증, 발급자·세션 정책·IP 검사 |
| `PermissionAspect` ★v2.0 | `@RequirePermission` 처리, 사유·승인 게이트 |
| `AdminAuditAspect` ★v2.0 | 감사 로그 동기 기록 (before/after 스냅샷) |
| `PiiMasker` ★v2.0 | 이메일·이름 마스킹 및 해제 정책 |

### 4.2 클라이언트 공통

| 컴포넌트 | 책임 |
|----------|------|
| `AuthInterceptor` | Access Token 주입, 401 시 refresh 후 1회 재시도 |
| `ErrorMapper` | 서버 code → 사용자 메시지(`toUserMessage()`) |
| `AppDatabase` | drift 스키마·마이그레이션 |
| `SecureTokenStorage` | Refresh Token 저장(Keystore), Access는 메모리 |
| `OperationQueueEngine` | 큐 적재·전송·재시도·정리 |
| `ConflictResolver` | 충돌 유형별 사용자 선택 UI 연결 |
| `ErrorView / EmptyState / AppShimmer` | 3상태 UI 표준 위젯 |

### 4.3 Riverpod 상태 관리 표준

```dart
@riverpod
class WorkoutSession extends _$WorkoutSession {
  @override
  Future<WorkoutSessionState> build() async {
    final draft = await ref.read(workoutRepoProvider).getActiveDraft();
    return draft ?? WorkoutSessionState.idle();
  }

  Future<void> addSet(SetData data) async {
    // ① Optimistic Update
    state = AsyncData(state.value!.withNewSet(data));
    // ② Operation Queue 적재
    await ref.read(opQueueProvider).enqueue(
      OpType.addSet, data.toJson(),
      clientId: data.clientId,
      dependsOn: state.value!.sessionClientId,
    );
  }
}

// Error Boundary: 모든 AsyncValue 소비는 .when() 3상태 강제
sessionProvider.when(
  data: (s) => SessionView(s),
  loading: () => const WorkoutShimmer(),
  error: (e, st) => ErrorView(
    message: e.toUserMessage(),
    onRetry: () => ref.invalidate(sessionProvider),
  ),
);

// 온라인 복구 시 자동 동기화
@riverpod
Stream<ConnectivityResult> connectivity(ref) => Connectivity().onConnectivityChanged;
```

---

## 5. 상태 전이 정의

### 5.1 WorkoutSession

```
        create
           ▼
     ┌────────────┐  complete   ┌───────────┐
     │IN_PROGRESS │────────────▶│ COMPLETED │
     └─────┬──────┘             └─────┬─────┘
           │ cancel                   │ reopen (오프라인 지각 세트)
           ▼                          │
     ┌────────────┐                   ▼
     │ CANCELLED  │             ┌────────────┐
     └────────────┘             │IN_PROGRESS │→ 재완료
                                └────────────┘
```

### 5.2 Operation (클라이언트 큐)

```
                 ┌─────────┐
                 │ PENDING │ ← 생성 / 재시도 대기
                 └────┬────┘
                      │ 온라인 감지
                      ▼
                 ┌─────────┐
          ┌──────│ SYNCING │──────┐
          │      └────┬────┘      │
     ┌────▼────┐ ┌────▼────┐ ┌────▼─────┐
     │ FAILED  │ │ SYNCED  │ │ CONFLICT │
     └────┬────┘ └─────────┘ └────┬─────┘
          │ 수동 재시도/폐기         │ 사용자 선택(수정/폐기)
          └──────────────────────────┘
```

### 5.3 AiJob

```
PENDING ──▶ RUNNING ──┬──▶ COMPLETED
                      ├──▶ VALIDATION_FAILED   (Schema/매핑/안전성 실패, 재생성 1회 후에도 실패)
                      └──▶ FAILED              (전 provider 실패 + 템플릿 매칭 불가)
```


### 5.4 Report / ModerationAction ★ v2.0

```
[신고]  PENDING ──▶ IN_REVIEW ──┬──▶ ACCEPTED (제재 집행)
                                └──▶ REJECTED (기각, 신고자 통지)

[루틴]  NONE ──publish──▶ PENDING ──┬──▶ APPROVED ──신고누적/직권──▶ BLINDED
                                     └──▶ REJECTED                    │
                                                          심사 해제 ◀──┘

[제재]  ACTIVE ──기간만료──▶ EXPIRED
             └──이의제기 수용/직권──▶ REVOKED
        이의제기: NONE → REQUESTED → UPHELD(유지) / OVERTURNED(해제)
```

### 5.5 Admin 계정 ★ v2.0

```
INVITED ──초대수락──▶ ACTIVE ──5회 실패──▶ LOCKED ──30분경과/SUPER_ADMIN해제──▶ ACTIVE
                        │
                        └──퇴사·역할종료──▶ DISABLED (전 세션 폐기, 삭제 불가)
```

### 5.6 ApprovalRequest ★ v2.0

```
PENDING ──승인(요청자≠승인자)──▶ APPROVED ──실행──▶ EXECUTED
      ├──반려──▶ REJECTED
      └──24시간 경과──▶ EXPIRED
```

---

## 6. 트랜잭션 경계

| 유스케이스 | 경계 | 비고 |
|-----------|------|------|
| 세션 시작 | UseCase 1건 | clientId 중복 시 조회 후 반환 (신규 트랜잭션 없음) |
| 세트 기록 | UseCase 1건 | 이벤트는 AFTER_COMMIT |
| 세션 완료 | UseCase 1건 | 파생값 계산은 별도 트랜잭션(리스너) |
| 배치 Op | **Op 단위 개별 트랜잭션** | 부분 성공 허용 (207) |
| 건강 동기화 | **배치(최대 500건) 단위** | 부분 실패 시 성공분 커밋 |
| AI Job 생성 | Job INSERT만 | 실제 생성은 @Async 별도 트랜잭션 |
| AI 결과 저장 | 루틴+수정내역 1건 | 원자적 저장 |
| 좋아요 토글 ★v2.0 | UseCase 1건 | stats·랭킹 갱신은 AFTER_COMMIT |
| 신고 접수 ★v2.0 | UseCase 1건 | 자동 블라인드 판정은 AFTER_COMMIT |
| 제재 집행 ★v2.0 | 제재+세션폐기+감사 1건 | 원자적 (부분 적용 금지) |
| **관리자 쓰기 작업** ★v2.0 | **작업 + 감사 로그 동일 트랜잭션** | 감사 실패 시 작업도 롤백 |
| 2인 승인 실행 ★v2.0 | 승인상태 전이 + 실제 작업 + 감사 1건 | 원자적 |

---

## 7. 로깅·관측 설계

| 항목 | 규칙 |
|------|------|
| 형식 | JSON 구조화 로그 (timestamp, level, correlationId, userId, module, message) |
| MDC | `correlationId`, `userId`, `deviceId` |
| 마스킹 | 이메일·토큰·프롬프트 원문 로깅 금지 |
| AI 로그 | jobId, provider, model, promptVersion, tokens, latency, cost (프롬프트 내용 제외) |
| 커스텀 메트릭 | `sessions_completed_today`, `health_sync_success_rate`, `ai_job_success_rate`, `ai_exercise_mapping_failure_rate`, `ai_daily_cost_usd`, `offline_ops_pending`, ★v2.0 `reports_pending`, `routines_auto_blinded_today`, `admin_pii_unmask_count`, `admin_login_failed_count`, `approval_requests_pending` |
| 관리자 로그 ★v2.0 | 감사 로그와 별개로 접근 로그 기록. `before/after` 값에 비밀번호·토큰·TOTP 시크릿은 저장 금지(마스킹 후 기록) |
| 실행 시간 측정 | AOP `@Timed`로 UseCase 단위 수집 |

---

## 8. 설계 변경 관리

- 설계 변경 시 본 문서와 코드를 **동일 PR**에서 갱신합니다.
- API 시그니처 변경은 API 명세서 + Postman Collection도 함께 갱신합니다.
- 아키텍처 수준 결정은 ADR을 새로 작성하고, 기존 ADR은 "대체됨"으로 표시합니다.

---

## 9. 승인

| 구분 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자 | | | |
| 검토자 | | | |
| 승인자 | | | |
