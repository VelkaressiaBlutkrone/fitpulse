# 🚀 FitPulse 배포 가이드

| 항목 | 내용 |
|------|------|
| 문서 유형 | 배포 가이드 (Deployment Guide) |
| 버전 | v2.0 |
| 작성일 | 2026-08-13 |
| 대상 | 서버(Docker Compose), 모바일 앱(Google Play), **관리자 콘솔(admin-web)** |
| 전제 | 본 문서만 보고 신규 인원이 배포를 수행할 수 있어야 함 |

---

## 1. 배포 환경 요구사항

### 1.1 서버 호스트

| 항목 | 최소 | 권장 |
|------|------|------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| Memory | 4 GB | 8 GB |
| Disk | 50 GB SSD | 100 GB SSD |
| Docker | 24.x | 27.x |
| Docker Compose | v2.20+ | 최신 v2 |
| 네트워크 | 80/443 인바운드, 아웃바운드 HTTPS 허용 | 동일 |

### 1.2 로컬 개발자 도구

| 도구 | 버전 |
|------|------|
| JDK | 21 (Temurin 권장) |
| Flutter | 3.47 stable |
| Docker Desktop | 최신 |
| Git | 2.4x+ |

### 1.3 외부 서비스 준비

| 서비스 | 필요 항목 |
|--------|-----------|
| Google Cloud | OAuth 2.0 Client ID (Android + Web), Health Connect 정책 URL |
| Anthropic | `CLAUDE_API_KEY` |
| OpenAI | `OPENAI_API_KEY` (폴백용) |
| Google Play Console | 개발자 계정, 앱 등록, 서명 키 |

---

## 2. 배포 전 체크리스트

| # | 항목 | 확인 |
|---|------|------|
| 1 | 대상 커밋/태그가 `main`에 머지되어 있고 CI green | ☐ |
| 2 | 모든 테스트 통과 (`./gradlew test`) | ☐ |
| 3 | Flyway 마이그레이션이 backward-compatible한지 검토 | ☐ |
| 4 | `.env` 값 최신화 (신규 환경 변수 누락 없음) | ☐ |
| 5 | **DB 백업 완료** (아래 3.1) | ☐ |
| 6 | 릴리스 노트 작성 및 팀 공유 | ☐ |
| 7 | 점검 공지 (다운타임 예상 시) | ☐ |
| 8 | 롤백 대상 이미지 태그 확인 (직전 버전) | ☐ |
| 8-1 | ★v2.0 관리자 마이그레이션(V10~V13) 포함 여부 확인 | ☐ |
| 8-2 | ★v2.0 감사 로그 DB 권한(GRANT) 스크립트 적용 예정 확인 | ☐ |
| 9 | 모니터링 대시보드 열어둔 상태 | ☐ |
| 10 | 배포 담당자와 확인 담당자 2인 대기 | ☐ |

---

## 3. 서버 배포 절차

### 3.1 사전 백업 (필수)

```bash
# 작업 디렉터리 이동
cd /opt/fitpulse

# DB 백업 (타임스탬프 파일명)
docker compose exec -T mysql \
  mysqldump -u root -p"$DB_ROOT_PASSWORD" --single-transaction --routines fitpulse \
  > backup/fitpulse_$(date +%Y%m%d_%H%M%S).sql

# 백업 파일 확인 (0바이트가 아니어야 함)
ls -lh backup/ | tail -3
```

**예상 결과**: `fitpulse_20260813_140000.sql` 파일이 수십 MB 이상으로 생성됩니다.
**오류 시**: `Access denied` → `.env`의 `DB_ROOT_PASSWORD` 확인. 백업 실패 시 **배포를 중단**합니다.

### 3.2 소스 가져오기

```bash
cd /opt/fitpulse
git fetch --all --tags
git checkout v1.0.0        # 배포 대상 태그
git log -1 --oneline       # 커밋 확인
```

**예상 결과**: 배포하려는 커밋 해시가 출력됩니다.

### 3.3 환경 변수 설정

```bash
# 최초 1회
cp .env.example .env
vi .env
```

**필수 환경 변수**

| 변수 | 설명 | 예시 |
|------|------|------|
| `SPRING_PROFILES_ACTIVE` | 프로필 | `prod` |
| `DB_ROOT_PASSWORD` | MySQL root 비밀번호 | (강력한 임의 문자열) |
| `DB_PASSWORD` | 앱 DB 사용자 비밀번호 | (강력한 임의 문자열) |
| `SPRING_DATASOURCE_URL` | JDBC URL | `jdbc:mysql://mysql:3306/fitpulse` |
| `SPRING_DATA_REDIS_URL` | Redis URL | `redis://redis:6379` |
| `JWT_SECRET` | 토큰 서명 키 (32바이트 이상) | (임의 문자열) |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret | - |
| `CLAUDE_API_KEY` | Claude API 키 | `sk-ant-...` |
| `OPENAI_API_KEY` | 폴백 API 키 | `sk-...` |
| `MINIO_ENDPOINT` | MinIO 주소 | `http://minio:9000` |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | MinIO 자격 증명 | - |
| `AI_DAILY_COST_LIMIT_USD` | 일일 비용 알림 임계치 | `10` |
| `ADMIN_JWT_SECRET` ★v2.0 | **관리자 전용** 토큰 서명 키 (사용자용과 별개) | (임의 32바이트+) |
| `ADMIN_TOTP_ISSUER` ★v2.0 | TOTP 발급자 표시명 | `FitPulse Admin` |
| `ADMIN_MFA_SECRET_ENC_KEY` ★v2.0 | TOTP 시크릿 암호화 키(AES) | (임의 32바이트) |
| `ADMIN_ALLOWED_CIDRS` ★v2.0 | 관리자 API 허용 대역 (비우면 앱 레벨 제한만) | `10.0.0.0/8` |
| `ADMIN_WEB_ORIGIN` ★v2.0 | 관리자 콘솔 CORS 오리진 | `https://admin.fitpulse.app` |
| `SUPER_ADMIN_EMAIL` ★v2.0 | 최초 SUPER_ADMIN 부트스트랩 이메일 | `admin@fitpulse.app` |

```bash
# 권한 제한 (다른 사용자 읽기 금지)
chmod 600 .env
```

> ⚠️ `.env`는 **절대 Git에 커밋하지 않습니다**. `.gitignore`에 포함되어 있는지 확인하세요.

### 3.4 이미지 빌드

```bash
docker compose build api
```

**예상 결과**: `Successfully tagged fitpulse-api:latest`
**오류 시**: `./gradlew clean build -x test`로 로컬 빌드 오류를 먼저 확인합니다.

### 3.5 기동

```bash
docker compose up -d
docker compose ps
```

**예상 결과**: 모든 서비스가 `healthy` 또는 `running` 상태

```
NAME                STATUS
fitpulse-api        Up 40 seconds (healthy)
fitpulse-mysql      Up 1 minute (healthy)
fitpulse-redis      Up 1 minute (healthy)
fitpulse-minio      Up 1 minute (healthy)
fitpulse-prometheus Up 1 minute
fitpulse-grafana    Up 1 minute
```

**오류 시**

| 증상 | 확인 |
|------|------|
| api가 `unhealthy` | `docker compose logs -f api` — Flyway 실패, DB 접속 실패 여부 |
| mysql `unhealthy` | 볼륨 권한, `MYSQL_ROOT_PASSWORD` 변경 여부(기존 볼륨과 불일치 시 실패) |
| api가 재시작 반복 | 환경 변수 누락 (로그에 `Could not resolve placeholder`) |

### 3.6 DB 마이그레이션 확인

Flyway는 앱 기동 시 자동 실행됩니다.

```bash
docker compose logs api | grep -i flyway
docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" fitpulse \
  -e "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
```

**예상 결과**: 최신 버전까지 `success=1`
**오류 시**: `success=0`인 행이 있으면 즉시 중단하고 롤백(6장)합니다. 실패한 행은 `DELETE FROM flyway_schema_history WHERE success=0;` 후 원인 수정 → 재기동.

### 3.7 초기 데이터 시딩 (최초 배포 1회)

```bash
docker compose exec api java -jar app.jar --seed=exercises
# 또는 애플리케이션 프로필로 자동 시딩되는 경우 로그 확인
docker compose logs api | grep -i "ExerciseDataSeeder"
```

**예상 결과**: 운동 100건 이상 시딩 완료 로그
**검증**: `SELECT COUNT(*) FROM exercises;` → 100 이상


### 3.8 관리자 감사 로그 권한 설정 (V11 적용 후 1회) ★ v2.0

Flyway가 테이블을 만든 뒤, **애플리케이션 DB 계정에서 감사 로그 수정·삭제 권한을 회수**합니다. 이 단계를 빠뜨리면 감사 로그의 불변성이 보장되지 않습니다.

```bash
docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" <<'SQL'
-- 감사 로그는 기록과 조회만 허용
REVOKE UPDATE, DELETE ON fitpulse.admin_audit_logs FROM 'fitpulse'@'%';
GRANT  INSERT, SELECT ON fitpulse.admin_audit_logs TO 'fitpulse'@'%';
FLUSH PRIVILEGES;
SQL
```

**검증**
```bash
docker compose exec -T mysql mysql -u fitpulse -p"$DB_PASSWORD" fitpulse   -e "UPDATE admin_audit_logs SET reason='x' WHERE id=1;" 2>&1 | grep -i denied
```
**예상 결과**: `UPDATE command denied to user 'fitpulse'@...` — 오류가 나야 정상입니다.
**오류가 나지 않으면**: 권한 회수가 적용되지 않은 것이므로 배포를 중단하고 재적용합니다.

### 3.9 최초 SUPER_ADMIN 생성 (최초 1회) ★ v2.0

```bash
docker compose exec api java -jar app.jar --bootstrap-admin
```

**예상 결과**: 콘솔에 초대 링크와 1회용 토큰이 출력됩니다.

```
[BOOTSTRAP] SUPER_ADMIN invited: admin@fitpulse.app
[BOOTSTRAP] Invite URL: https://admin.fitpulse.app/accept-invite?token=...
[BOOTSTRAP] Expires: 2026-08-16T09:00:00Z
```

1. 링크로 접속해 비밀번호를 설정합니다 (12자 이상)
2. TOTP QR을 등록하고 **백업 코드 10개를 안전한 곳에 보관**합니다
3. 이후 다른 관리자는 콘솔에서 초대로만 추가합니다 (자가 가입 경로 없음)

> ⚠️ 부트스트랩 명령은 **관리자가 0명일 때만** 동작합니다. 이미 존재하면 오류로 종료됩니다.

### 3.10 관리자 콘솔(admin-web) 배포 ★ v2.0 (V1.1)

```bash
cd fitpulse-admin-web
npm ci
npm run build          # 산출물: dist/
docker compose build admin-web
docker compose up -d admin-web
```

**Nginx 설정 예시** (`/etc/nginx/conf.d/admin.conf`)

```nginx
server {
    listen 443 ssl;
    server_name admin.fitpulse.app;

    # 내부망/VPN 대역만 허용
    allow 10.0.0.0/8;
    allow 192.168.0.0/16;
    deny  all;

    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://api.fitpulse.app" always;

    location / {
        proxy_pass http://127.0.0.1:3002;   # admin-web 컨테이너
    }
    location /api/v1/admin/ {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

```bash
sudo nginx -t && sudo nginx -s reload
```

**검증**
```bash
# 내부망에서
curl -sI https://admin.fitpulse.app | head -1        # 200

# 외부망에서 (차단 확인)
curl -sI https://admin.fitpulse.app | head -1        # 403
```

---

## 4. 배포 검증

### 4.1 헬스 체크

```bash
curl -s http://localhost:8080/actuator/health/liveness
# {"status":"UP"}

curl -s http://localhost:8080/actuator/health/readiness
# {"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"}}}

curl -s http://localhost:8080/actuator/info
```

### 4.2 스모크 테스트

```bash
BASE=http://localhost:8080/api/v1

# ① 운동 목록 (인증 불필요 API가 없다면 로그인 토큰 사용)
curl -s "$BASE/exercise-categories" | head

# ② 로그인
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${DEV_USER_EMAIL:?set DEV_USER_EMAIL}\",\"password\":\"${DEV_USER_PASSWORD:?set DEV_USER_PASSWORD}\",\"device\":{\"deviceId\":\"smoke-test-uuid\",\"platform\":\"ANDROID\"}}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')
echo "${TOKEN:0:20}..."

# ③ 세션 생성 (멱등성 확인: 2회 실행 시 동일 id)
curl -s -X POST "$BASE/workout-sessions" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"clientId":"smoke-0001","startedAt":"2026-08-13T09:00:00Z"}'

# ④ 대시보드
curl -s "$BASE/health/dashboard" -H "Authorization: Bearer $TOKEN"

# ⑤ ★v2.0 공개 루틴 목록 (커뮤니티)
curl -s "$BASE/routines/public?sort=POPULAR&limit=5" -H "Authorization: Bearer $TOKEN"

# ⑥ ★v2.0 사용자 토큰으로 관리자 API 호출 → 401이어야 정상
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/admin/users" -H "Authorization: Bearer $TOKEN"

# ⑦ ★v2.0 관리자 로그인 1단계 (MFA 요구 확인)
curl -s -X POST "$BASE/admin/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"${DEV_ADMIN_EMAIL:?set DEV_ADMIN_EMAIL}\",\"password\":\"${DEV_ADMIN_PASSWORD:?set DEV_ADMIN_PASSWORD}\"}"
# → {"mfaRequired":true,...} 이어야 정상 (이 토큰으로는 기능 API 호출 불가)
```

### 4.3 검증 체크리스트

| # | 항목 | 기준 | 확인 |
|---|------|------|------|
| 1 | liveness / readiness | 둘 다 UP | ☐ |
| 2 | Flyway 이력 | 최신 버전 success=1 | ☐ |
| 3 | 로그인 | 200 + 토큰 발급 | ☐ |
| 4 | 세션 생성 멱등성 | 2회 호출 시 동일 id | ☐ |
| 5 | Swagger (dev만) | 접속 가능 | ☐ |
| 6 | Prometheus 타깃 | `api` UP | ☐ |
| 7 | Grafana 대시보드 | 데이터 수신 | ☐ |
| 8 | 에러 로그 | 배포 후 5분간 ERROR 없음 | ☐ |
| 9 | 앱 연동 | 실기기에서 로그인·기록 정상 | ☐ |
| 10 ★v2.0 | 감사 로그 UPDATE 시도 | 권한 오류 발생 | ☐ |
| 11 ★v2.0 | 사용자 토큰으로 `/api/v1/admin/users` 호출 | 401 | ☐ |
| 12 ★v2.0 | 관리자 로그인 → TOTP → 기능 API | 정상 | ☐ |
| 13 ★v2.0 | 외부 IP에서 관리자 콘솔 접근 | 403 | ☐ |
| 14 ★v2.0 | `system_settings` 시드 7건 존재 | 확인 | ☐ |

---

## 5. Blue-Green 배포 (프로덕션 확장 시)

MVP는 단일 인스턴스이지만, 무중단이 필요해지면 아래 절차를 사용합니다.

```bash
# ① Green 인스턴스 기동 (다른 포트)
docker compose -f docker-compose.green.yml up -d api-green

# ② Green 준비 상태 확인 (readiness UP까지 대기)
until curl -sf http://localhost:8081/actuator/health/readiness; do sleep 3; done

# ③ 트래픽 전환 (Nginx upstream 변경 후 무중단 리로드)
sudo sed -i 's/server 127.0.0.1:8080/server 127.0.0.1:8081/' /etc/nginx/conf.d/fitpulse.conf
sudo nginx -t && sudo nginx -s reload

# ④ Blue 드레인 (진행 중 요청 완료 대기)
sleep 30

# ⑤ Blue 종료
docker compose stop api
```

**전제 조건**

| 항목 | 요건 |
|------|------|
| DDL | backward-compatible만 (컬럼 추가는 nullable/default, 삭제는 2-phase) |
| API | 새 필드 추가만, 기존 필드 즉시 삭제 금지 |
| 세션 | Redis 기반 (서버 stateless) |
| 파일 | MinIO (서버 로컬 파일 없음) |
| 설정 | 환경 변수 기반 프로필 분리 |

---

## 6. 롤백 절차

### 6.1 애플리케이션 롤백 (마이그레이션 없는 경우)

```bash
cd /opt/fitpulse
git checkout v0.9.0          # 직전 안정 태그
docker compose build api
docker compose up -d api
curl -s http://localhost:8080/actuator/health/readiness
```

**소요 시간**: 약 3~5분

### 6.2 마이그레이션 포함 롤백

Flyway는 자동 down 마이그레이션을 지원하지 않으므로 **수동 절차**를 따릅니다.

```bash
# ① 서비스 중지
docker compose stop api

# ② DB 복원 (배포 전 백업 사용)
docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" fitpulse \
  < backup/fitpulse_20260813_140000.sql

# ③ 이전 버전으로 되돌려 기동
git checkout v0.9.0
docker compose build api
docker compose up -d api

# ④ 검증
curl -s http://localhost:8080/actuator/health/readiness
```

**소요 시간**: 약 10~20분 (DB 크기에 비례)

### 6.3 롤백 판단 기준

| 상황 | 조치 |
|------|------|
| readiness가 5분 이상 DOWN | 즉시 롤백 |
| 5xx 오류율 > 5% (5분 지속) | 즉시 롤백 |
| Flyway 마이그레이션 실패 | 즉시 롤백 (6.2) |
| 특정 기능만 오류, 우회 가능 | 핫픽스 우선 검토 |
| 성능 저하만 관찰 | 모니터링 후 판단 |

---

## 7. 모바일 앱 배포

### 7.1 빌드 준비

```bash
cd fitpulse-app
flutter --version                 # 3.47 stable 확인
flutter clean
flutter pub get
flutter analyze                   # 경고 0 확인
flutter test
```

### 7.2 릴리스 빌드

```bash
# 버전 갱신: pubspec.yaml의 version: 1.0.0+12

# App Bundle (Play 스토어 제출용)
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.fitpulse.app/api/v1

# 산출물: build/app/outputs/bundle/release/app-release.aab

# APK (사내 테스트용)
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.fitpulse.app/api/v1
```

### 7.3 서명

`android/key.properties` (Git 커밋 금지)

```properties
storePassword=***
keyPassword=***
keyAlias=fitpulse
storeFile=/secure/path/fitpulse-release.jks
```

> 🔐 키스토어와 비밀번호는 별도 안전한 저장소에 보관합니다. **분실 시 동일 앱으로 업데이트할 수 없습니다.**

### 7.4 Play Console 제출

1. Play Console → FitPulse → 프로덕션 → 새 버전 만들기
2. `app-release.aab` 업로드
3. 릴리스 노트 입력 (한국어 필수)
4. **데이터 보안 섹션** 갱신
   - 수집 항목: 이메일, 건강·피트니스 데이터, 기기 ID
   - 목적: 앱 기능 제공 (광고·중개 목적 사용 없음)
   - 전송 시 암호화: 예 / 삭제 요청 가능: 예
5. Health Connect 관련 선언 확인 (권한 사용 목적, 개인정보처리방침 URL)
6. 단계적 출시 권장: 10% → 50% → 100%
7. 검토 제출

### 7.5 앱 배포 체크리스트

| # | 항목 | 확인 |
|---|------|------|
| 1 | `version` 코드 증가 확인 | ☐ |
| 2 | API_BASE_URL이 운영 주소인지 확인 | ☐ |
| 3 | 디버그 로그·테스트 계정 제거 | ☐ |
| 4 | 실기기 스모크 테스트 (로그인·기록·오프라인·HC) | ☐ |
| 5 | 데이터 보안 양식 최신화 (**사용자 생성 콘텐츠 항목 포함**) | ☐ |
| 5-1 | ★v2.0 UGC 정책: 신고·차단 수단 제공 명시 (스토어 심사 요건) | ☐ |
| 6 | 개인정보처리방침 URL 접속 가능 | ☐ |
| 7 | 서버가 앱 버전과 호환되는지 확인 (API 하위 호환) | ☐ |

> 📌 **배포 순서 원칙**: 항상 **서버 먼저, 앱 나중**입니다. API는 하위 호환을 유지하므로 구버전 앱도 신버전 서버에서 동작합니다.

---

## 8. 배포 이력

| 버전 | 일자 | 담당 | 내용 | 롤백 여부 |
|------|------|------|------|-----------|
| v1.0.0 | | | MVP 최초 배포 | |
| v1.1.0 | | | 커뮤니티 (A1) | |
| v1.2.0 | | | 관리자 기반 (A2) — V10~V13 + 감사 GRANT + 부트스트랩 | |
| v1.3.0 | | | 관리자 운영·AI (A3~A4) | |
| v1.4.0 | | | 관리자 콘솔 UI (V1.1) | |
| | | | | |

---

## 9. 부록: docker-compose.yml 참조

```yaml
services:
  api:
    build: ./fitpulse-api
    ports: ["8080:8080"]
    depends_on:
      mysql: { condition: service_healthy }
      redis: { condition: service_healthy }
    environment:
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-dev}
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/fitpulse
      SPRING_DATASOURCE_USERNAME: fitpulse
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_URL: redis://redis:6379
      CLAUDE_API_KEY: ${CLAUDE_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      MINIO_ENDPOINT: http://minio:9000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health/readiness"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  mysql:
    image: mysql:8.4
    volumes: [mysql-data:/var/lib/mysql]
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: fitpulse
      MYSQL_USER: fitpulse
      MYSQL_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.4-alpine
    volumes: [redis-data:/data]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes: [minio-data:/data]

  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes: ["./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml"]

  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]

  # ★ v2.0 관리자 콘솔 (V1.1)
  admin-web:
    build: ./fitpulse-admin-web
    ports: ["3002:80"]
    environment:
      VITE_API_BASE_URL: ${ADMIN_WEB_API_BASE_URL:-http://localhost:8080/api/v1/admin}
    depends_on:
      api: { condition: service_healthy }

volumes:
  mysql-data:
  redis-data:
  minio-data:
```

**application.yml (Actuator 부분)**

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, prometheus
  endpoint:
    health:
      show-details: when_authorized
      group:
        readiness:
          include: db, redis
        liveness:
          include: ping
```

---

## 10. 승인

| 구분 | 성명 | 서명 | 일자 |
|------|------|------|------|
| 작성자 | | | |
| 검토자 | | | |
| 승인자 | | | |
