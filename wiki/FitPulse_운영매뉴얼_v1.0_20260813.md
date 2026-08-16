# 🛠️ FitPulse 운영 매뉴얼

| 항목 | 내용 |
|------|------|
| 문서 유형 | 운영 매뉴얼 (Operations Manual) |
| 버전 | v1.0 |
| 작성일 | 2026-08-13 |
| 갱신 주기 | 분기 1회 이상 + 장애 발생 후 회고 반영 |

---

## 1. 시스템 구성 및 인프라 현황

### 1.1 구성도

```
[사용자 앱] ──HTTPS──▶ [Nginx] ──▶ [fitpulse-api : 8080]
                                        │
        ┌───────────────┬───────────────┼───────────────┐
        ▼               ▼               ▼               ▼
   [MySQL 8.4]     [Redis 7.4]     [MinIO]      [Claude/OpenAI]
    :3306           :6379           :9000        (외부 HTTPS)
        │
   [Prometheus :9090] ──▶ [Grafana :3001] ──▶ Slack 알림
```

### 1.2 서비스 인벤토리

| 서비스 | 컨테이너 | 포트 | 데이터 볼륨 | 재시작 정책 |
|--------|----------|------|-------------|-------------|
| API | fitpulse-api | 8080 | - | unless-stopped |
| MySQL | fitpulse-mysql | 3306 | `mysql-data` | unless-stopped |
| Redis | fitpulse-redis | 6379 | `redis-data` | unless-stopped |
| MinIO | fitpulse-minio | 9000/9001 | `minio-data` | unless-stopped |
| Prometheus | fitpulse-prometheus | 9090 | - | unless-stopped |
| Grafana | fitpulse-grafana | 3001 | - | unless-stopped |

### 1.3 주요 경로

| 항목 | 경로 |
|------|------|
| 배포 디렉터리 | `/opt/fitpulse` |
| 환경 변수 | `/opt/fitpulse/.env` (chmod 600) |
| DB 백업 | `/opt/fitpulse/backup/` |
| 애플리케이션 로그 | `docker compose logs api` (JSON 구조화) |
| 모니터링 설정 | `/opt/fitpulse/monitoring/prometheus.yml` |

---

## 2. 정기 모니터링 항목 및 임계치

### 2.1 시스템 지표

| 지표 | 정상 | 주의 | 위험 | 확인 위치 |
|------|------|------|------|-----------|
| `api_response_time_p95` | < 300ms | 300ms~3s | > 3초 (5분) | Grafana 시스템 |
| `api_error_rate_5xx` | < 1% | 1~5% | > 5% (5분) | Grafana 시스템 |
| JVM Heap 사용률 | < 70% | 70~85% | > 85% | Grafana 시스템 |
| HikariCP 활성 커넥션 | < 60% max | 60~80% | > 80% max | Grafana 시스템 |
| CPU 사용률 | < 60% | 60~80% | > 80% | 호스트 |
| 디스크 사용률 | < 70% | 70~85% | > 85% | 호스트 |
| MySQL 슬로우 쿼리 | 0건/시 | 1~10건/시 | > 10건/시 | MySQL 로그 |

### 2.2 비즈니스 지표

| 지표 | 정상 | 위험 | 의미 |
|------|------|------|------|
| `sessions_completed_today` | 전일 대비 ±30% | -50% 이상 | 기록 기능 장애 가능 |
| `health_sync_success_rate` | ≥ 95% | < 90% | 동기화 파이프라인 문제 |
| `ai_job_success_rate` | ≥ 90% | < 70% | AI 파이프라인 문제 |
| `ai_job_avg_latency` | < 20초 | > 30초 | LLM 응답 지연 |
| `ai_exercise_mapping_failure_rate` | < 10% | > 30% | 프롬프트 품질 저하 |
| `ai_daily_cost_usd` | < $5 | > $10 | 비용 이상 (남용 가능) |
| `ai_fallback_triggered` | 0 | 발생 시 | 주 provider 장애 |
| `offline_ops_pending` (앱 집계) | - | 급증 | 서버 접속 장애 가능 |
| `daily_active_users` | 추세 유지 | 급감 | 앱 크래시·배포 문제 |

### 2.3 알림 규칙

| 조건 | 등급 | 채널 | 대응 시간 |
|------|------|------|-----------|
| 5xx > 5% (5분) | 🔴 P1 | Slack `#fitpulse-alert` | 즉시 |
| readiness DOWN (2분) | 🔴 P1 | Slack | 즉시 |
| P95 > 3초 (5분) | 🟠 P2 | Slack | 30분 내 |
| HikariCP > 80% max | 🟠 P2 | Slack | 30분 내 |
| `health_sync_success_rate` < 90% | 🟠 P2 | Slack | 30분 내 |
| `ai_job_success_rate` < 70% | 🟡 P3 | Slack | 당일 |
| `ai_exercise_mapping_failure_rate` > 30% | 🟡 P3 | Slack | 당일 |
| `ai_daily_cost_usd` > $10 | 🟡 P3 | Slack | 당일 |
| `ai_fallback_triggered` | 🟡 P3 | Slack | 당일 |
| 디스크 > 85% | 🟡 P3 | Email | 당일 |

### 2.4 점검 주기

| 주기 | 항목 |
|------|------|
| 실시간 | Prometheus 알림 (자동) |
| 일 1회 | Grafana 대시보드 육안 확인, 백업 성공 여부, ERROR 로그 검토 |
| 주 1회 | 디스크 사용량, 슬로우 쿼리 리뷰, AI 비용 추이 |
| 월 1회 | 백업 복원 테스트, 보안 패치 확인, 미사용 이미지 정리 |
| 분기 1회 | 본 매뉴얼 갱신, 장애 대응 훈련, 용량 산정 재검토 |

---

## 3. 정기 작업

### 3.1 일일 백업 (cron)

```bash
# crontab -e
0 4 * * * /opt/fitpulse/scripts/backup.sh >> /var/log/fitpulse-backup.log 2>&1
```

`/opt/fitpulse/scripts/backup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/fitpulse
source .env
TS=$(date +%Y%m%d_%H%M%S)

docker compose exec -T mysql \
  mysqldump -u root -p"$DB_ROOT_PASSWORD" --single-transaction --routines fitpulse \
  | gzip > "backup/fitpulse_${TS}.sql.gz"

# 14일 초과 백업 삭제
find backup/ -name 'fitpulse_*.sql.gz' -mtime +14 -delete
echo "[$(date)] backup done: fitpulse_${TS}.sql.gz"
```

**소요 시간**: 약 1~5분 (DB 크기 비례)

### 3.2 애플리케이션 배치 작업 (자동)

| 작업 | 시각 | 내용 | 확인 방법 |
|------|------|------|-----------|
| 파생값 보정 | 매일 04:00 | `computed_at` 노후 세션 재계산 | 로그 `DerivedValueCorrectionScheduler` |
| 계정 완전 삭제 | 매일 05:00 | `withdrawal_at + 30일` 경과 계정 삭제 | 로그 `AccountDeletionScheduler` |
| 건강 원본 정리 | 매일 05:30 | 90일 초과 원본 → 일별 집계 후 삭제 | 로그 `HealthRetentionScheduler` |
| 폐기 세션 정리 | 매일 06:00 | 90일 초과 revoked 세션 삭제 | 로그 |
| AI 비용 집계 | 매일 09:00 | 전일 비용 합산 및 알림 판정 | Grafana `ai_daily_cost_usd` |

### 3.3 로그 관리

```bash
# Docker 로그 크기 제한 (daemon.json)
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "100m", "max-file": "5" }
}
```

```bash
# 디스크 정리 (월 1회)
docker system prune -af --volumes=false
docker image prune -af --filter "until=720h"
```

> ⚠️ `--volumes` 옵션은 **절대 사용하지 않습니다** (DB 데이터 삭제 위험).

### 3.4 보안 패치

```bash
# 월 1회
sudo apt update && sudo apt upgrade -y
docker compose pull        # 베이스 이미지 갱신 확인
# 갱신 시 개발 환경 검증 후 배포 절차(배포 가이드 3장) 따름
```

---

## 4. 장애 대응 절차 (Runbook)

### 4.1 대응 플로우

```
                    알림 수신 / 사용자 제보
                            │
                            ▼
                ┌───────────────────────┐
                │ ① 영향 범위 파악 (5분) │
                │  readiness / 5xx / DAU │
                └───────────┬───────────┘
                            ▼
            ┌───────────────────────────────┐
            │ 전체 장애?                     │
            └───┬───────────────────────┬───┘
             YES│                    NO │
                ▼                       ▼
      ┌──────────────────┐   ┌────────────────────┐
      │ P1 선언 + 공지    │   │ 기능별 Runbook 수행 │
      │ 원인 격리 (10분)  │   │ (4.3~4.8)          │
      └────────┬─────────┘   └─────────┬──────────┘
               ▼                       │
    ┌──────────────────────┐           │
    │ 최근 배포가 원인?     │           │
    └──┬────────────────┬──┘           │
   YES │             NO │              │
       ▼                ▼              │
  ┌─────────┐   ┌──────────────┐       │
  │ 즉시 롤백│   │ 컴포넌트 진단 │       │
  │ (10분)  │   │ (DB/Redis/외부)│      │
  └────┬────┘   └───────┬──────┘       │
       └────────────────┴──────────────┘
                        ▼
              ┌───────────────────┐
              │ ② 복구 확인 (5분)  │
              │ ③ 사후 공지        │
              │ ④ 포스트모템(24h)  │
              └───────────────────┘
```

### 4.2 등급 정의

| 등급 | 정의 | 초기 대응 | 보고 |
|------|------|-----------|------|
| P1 | 전체 서비스 불가, 데이터 유실 위험 | 즉시 (24시간) | PO 즉시 |
| P2 | 주요 기능 저하, 우회 가능 | 30분 내 (업무시간) | 일일 보고 |
| P3 | 부분 기능 이상, 사용자 영향 제한적 | 당일 | 주간 보고 |

### 4.3 Runbook: API 응답 없음 (P1)

| 단계 | 조치 | 명령 | 예상 시간 |
|------|------|------|-----------|
| 1 | 상태 확인 | `docker compose ps` | 1분 |
| 2 | 헬스 확인 | `curl -s localhost:8080/actuator/health/readiness` | 1분 |
| 3 | 로그 확인 | `docker compose logs --tail=200 api` | 3분 |
| 4 | OOM 여부 | 로그에 `OutOfMemoryError` 검색 | 1분 |
| 5 | 재시작 | `docker compose restart api` | 2분 |
| 6 | 복구 안 되면 롤백 | 배포 가이드 6장 | 10분 |

**원인별 조치**

| 로그 패턴 | 원인 | 조치 |
|-----------|------|------|
| `Could not resolve placeholder` | 환경 변수 누락 | `.env` 보완 후 재기동 |
| `Communications link failure` | DB 연결 실패 | 4.4 수행 |
| `OutOfMemoryError` | 힙 부족 | `-Xmx` 상향 후 재기동, 이후 쿼리·캐시 점검 |
| `Flyway migration failed` | 마이그레이션 오류 | 즉시 롤백 (배포 가이드 6.2) |

### 4.4 Runbook: DB 장애 (P1)

| 단계 | 조치 | 명령 |
|------|------|------|
| 1 | 컨테이너 상태 | `docker compose ps mysql` |
| 2 | 접속 테스트 | `docker compose exec mysql mysqladmin ping -h localhost` |
| 3 | 로그 확인 | `docker compose logs --tail=200 mysql` |
| 4 | 디스크 확인 | `df -h` (풀이면 로그·백업 정리) |
| 5 | 커넥션 확인 | `SHOW PROCESSLIST;` / `SHOW STATUS LIKE 'Threads_connected';` |
| 6 | 재시작 | `docker compose restart mysql` → api 재시작 |
| 7 | 데이터 손상 시 | 최신 백업으로 복원 (배포 가이드 6.2) |

**예상 복구 시간**: 재시작 5분 / 백업 복원 10~20분

### 4.5 Runbook: Redis 장애 (P2)

Redis 장애 시 세션 갱신이 실패하지만 앱은 오프라인 모드로 기록을 유지합니다.

| 단계 | 조치 |
|------|------|
| 1 | `docker compose exec redis redis-cli ping` → PONG 확인 |
| 2 | 메모리 확인: `redis-cli info memory` (`used_memory` vs `maxmemory`) |
| 3 | `docker compose restart redis` |
| 4 | 재시작 후 refresh 토큰 저장소 상태 확인 (사용자 재로그인 필요할 수 있음) |
| 5 | 사용자 공지: "재로그인이 필요할 수 있습니다" |

### 4.6 Runbook: 건강 동기화 성공률 저하 (P2)

| 단계 | 조치 |
|------|------|
| 1 | `health_sync_jobs`에서 최근 실패 사유 집계: `SELECT error_message, COUNT(*) FROM health_sync_jobs WHERE status='FAILED' AND started_at > NOW() - INTERVAL 1 HOUR GROUP BY 1;` |
| 2 | 유효성 오류 다수 → 앱 버전별 분포 확인, 특정 버전이면 앱 핫픽스 |
| 3 | 타임아웃 다수 → 배치 크기(500) 및 DB 부하 확인 |
| 4 | 특정 사용자 편중 → 해당 사용자 fullResync 유도 (앱 재연동 안내) |
| 5 | 중복 키 충돌 → upsert 로직 점검 |

### 4.7 Runbook: AI 파이프라인 이상 (P3)

| 증상 | 확인 | 조치 |
|------|------|------|
| 성공률 < 70% | `ai_model_runs.validation_status` 분포 | 실패 유형별 대응 (아래) |
| Schema 실패 다수 | 최근 프롬프트 버전 변경 여부 | `prompt_templates` **이전 버전으로 롤백** (배포 불필요) |
| 매핑 실패율 > 30% | `ai_exercise_mappings` 미등록 명칭 확인 | 자주 나오는 명칭을 수동 매핑 등록(`verified=true`) |
| fallback 빈발 | provider 상태 페이지 확인 | 주 provider 장애면 대기, 지속 시 기본 provider 전환 검토 |
| 비용 > $10/일 | 사용자별 요청 수 확인 | 남용 계정 확인, Rate Limit 조정 |

**프롬프트 롤백 절차 (배포 불필요)**

```sql
-- 현재 활성 버전 확인
SELECT id, template_key, version, is_active FROM prompt_templates
 WHERE template_key='routine_generation' ORDER BY version DESC;

-- 롤백 (트랜잭션으로)
START TRANSACTION;
UPDATE prompt_templates SET is_active=false WHERE template_key='routine_generation' AND is_active=true;
UPDATE prompt_templates SET is_active=true  WHERE template_key='routine_generation' AND version=<이전버전>;
COMMIT;
```
적용 확인: 이후 생성된 `ai_model_runs.prompt_template_ver`가 롤백 버전인지 확인 (예상 소요 5분)

### 4.8 Runbook: 디스크 부족 (P3 → 방치 시 P1)

| 단계 | 조치 | 명령 |
|------|------|------|
| 1 | 사용량 확인 | `df -h`, `du -sh /var/lib/docker/* \| sort -h` |
| 2 | Docker 로그 정리 | `docker compose logs --tail=0` 확인 후 로그 rotate 설정 검토 |
| 3 | 오래된 이미지 정리 | `docker image prune -af --filter "until=720h"` |
| 4 | 오래된 백업 정리 | `find backup/ -mtime +14 -delete` |
| 5 | 건강 원본 정리 확인 | `HealthRetentionScheduler` 정상 동작 여부 |
| 6 | 그래도 부족하면 | 볼륨 증설 요청 |

### 4.9 Runbook: 보안 사고 의심 (P1)

| 단계 | 조치 |
|------|------|
| 1 | 영향 파악: `REFRESH_TOKEN_REUSED` 로그 급증 여부 확인 |
| 2 | 해당 사용자 세션 전체 폐기: `UPDATE refresh_sessions SET revoked_at=NOW() WHERE user_id=?;` |
| 3 | 필요 시 전체 세션 폐기 + 재로그인 유도 |
| 4 | `JWT_SECRET` 교체 검토 (교체 시 전체 로그아웃 발생) |
| 5 | 접근 로그 보존 후 원인 분석 |
| 6 | 개인정보 유출 정황 시 PO 즉시 보고 → 관련 법령상 신고 의무 검토 |

---

## 5. 데이터 복구 절차

### 5.1 전체 복원

```bash
cd /opt/fitpulse
docker compose stop api
gunzip -c backup/fitpulse_20260813_040000.sql.gz | \
  docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" fitpulse
docker compose start api
curl -s localhost:8080/actuator/health/readiness
```

**소요 시간**: 10~20분

### 5.2 특정 테이블만 복원

```bash
# 백업에서 해당 테이블 구간만 추출
gunzip -c backup/fitpulse_20260813_040000.sql.gz | \
  sed -n '/-- Table structure for table `workout_sets`/,/-- Table structure for table `workout_sessions`/p' \
  > /tmp/workout_sets.sql

# 검토 후 적용 (반드시 사전 확인)
docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" fitpulse < /tmp/workout_sets.sql
```

> ⚠️ 부분 복원은 참조 무결성을 깨뜨릴 수 있습니다. 반드시 테크리드 승인 후 수행합니다.

### 5.3 월 1회 복원 훈련

운영 DB가 아닌 별도 컨테이너에 백업을 복원해 **백업이 실제로 복원 가능한지** 검증하고 결과를 기록합니다.

| 일자 | 백업 파일 | 복원 성공 | 소요 시간 | 담당 |
|------|-----------|-----------|-----------|------|
| | | | | |

---

## 6. 비상 연락망 및 에스컬레이션

### 6.1 연락망

| 역할 | 담당 | 연락처 | 대응 시간 |
|------|------|--------|-----------|
| 1차 대응 (서버) | 테크리드 | (등록 필요) | 24시간 (P1) |
| 1차 대응 (앱) | 모바일 담당 | (등록 필요) | 업무시간 |
| 의사결정 | PO | (등록 필요) | 24시간 (P1) |
| 인프라/호스팅 | (제공업체) | (등록 필요) | SLA 기준 |

### 6.2 에스컬레이션 체계

```
알림/제보
   │
   ▼
1차: 담당자 (15분 내 응답)
   │  미응답 or 30분 내 미복구
   ▼
2차: 테크리드 (P1은 즉시 병행 호출)
   │  1시간 내 미복구 또는 데이터 유실 위험
   ▼
3차: PO (대외 공지·서비스 중단 결정)
   │  개인정보 유출 정황
   ▼
4차: 법무·규제 대응 검토
```

### 6.3 사용자 공지 기준

| 상황 | 공지 여부 | 채널 | 시점 |
|------|-----------|------|------|
| 30분 이상 전체 장애 | 필수 | 앱 내 공지 + 스토어 | 발생 30분 내 |
| 계획된 점검 | 필수 | 앱 내 공지 | 3일 전 |
| 부분 기능 장애 (AI 등) | 권장 | 앱 내 배너 | 발생 1시간 내 |
| 데이터 유실 발생 | 필수 | 앱 내 + 이메일 | 확인 즉시 |

**공지 문구 예시**
> 현재 일시적인 서버 문제로 일부 기능 이용이 원활하지 않습니다. 이 기간 동안 기록한 운동은 기기에 안전하게 저장되며, 복구 후 자동으로 동기화됩니다. 빠르게 조치하겠습니다.

---

## 7. 장애 기록 및 포스트모템

### 7.1 장애 기록 대장

| ID | 발생일시 | 등급 | 증상 | 원인 | 조치 | 복구 시간 | 재발 방지 |
|----|----------|------|------|------|------|-----------|-----------|
| INC-001 | | | | | | | |

### 7.2 포스트모템 템플릿 (P1·P2 필수, 24시간 내 작성)

```markdown
# 포스트모템: INC-{번호} {제목}

## 요약
- 발생: YYYY-MM-DD HH:MM ~ HH:MM (총 N분)
- 등급: P1/P2
- 영향: 영향 받은 사용자 수 / 기능

## 타임라인
| 시각 | 사건 |
|------|------|
| HH:MM | 최초 알림 |
| HH:MM | 원인 파악 |
| HH:MM | 조치 적용 |
| HH:MM | 복구 확인 |

## 근본 원인
(비난 없이 시스템·프로세스 관점으로 기술)

## 잘 된 점
## 아쉬운 점
## 재발 방지 조치
| # | 조치 | 담당 | 기한 | 상태 |
|---|------|------|------|------|

## 문서 반영
- [ ] 운영 매뉴얼 Runbook 추가/수정
- [ ] 알림 임계치 조정
- [ ] 테스트 케이스 추가
```

> 포스트모템은 **책임 추궁이 아닌 시스템 개선**을 목적으로 합니다. 도출된 조치는 반드시 담당자와 기한을 지정하고 주간 리뷰에서 추적합니다.

---

## 8. 문서 갱신 이력

| 버전 | 일자 | 작성/검토 | 변경 내용 |
|------|------|-----------|-----------|
| v1.0 | 2026-08-13 | 테크리드 | 최초 작성 |

> 본 매뉴얼은 **운영 담당자가 직접 검토**하고, 분기 1회 이상 및 실제 장애 후 회고를 반영해 갱신합니다.
