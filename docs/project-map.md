# 프로젝트 지도와 업무 규칙

2026-11-20 로컬 소스 `674e40d`를 기준으로 분석했다. 이 문서는 현재 코드의 설명이며
운영 정책 승인이나 실제 DB·배포 상태의 증거가 아니다. 관련 구현이 바뀌면 함께 갱신한다.
작업 규칙은 [AGENTS.md](../AGENTS.md), 명령과 검증 사례는 [검증 절차](verification.md)를 따른다.

## 구조

- 단일 Next.js 애플리케이션이다. 별도 API 서버나 모노레포 구성은 없다.
- `package.json`: Next.js 16.1.6, React 19.2.3, TypeScript 5 계열,
  Tailwind CSS 4 계열, Supabase JS, Base UI/shadcn, react-select, lucide-react.
- 설치 명세는 `package-lock.json`, 타입 설정은 `tsconfig.json`, 린트는
  `eslint.config.mjs`다. 프로젝트 자체 Node 버전 고정 파일과 `engines` 지정은 없다.
- `next.config.ts`는 Turbopack root와 Server Action 요청 크기 한도 `10mb`를 설정한다.
- 조회는 서버 페이지 → `data.ts` → Supabase, 변경은 클라이언트 폼 → Server Action →
  Supabase → 경로 재검증으로 이어진다. 이미지 원본은 비공개 Storage에 저장한다.
- 전역 레이아웃은 `src/app/layout.tsx`, 앱 프레임은 `app-chrome.tsx`,
  메뉴는 `sidebar-menu.tsx`다. 로그인 화면은 공통 프레임에서 별도 분기한다.

## 기능별 진입점

경로는 저장소 루트 기준이다.

| 기능/URL | 먼저 읽을 파일 | 연결된 코드 |
| --- | --- | --- |
| 대시보드 `/` | `src/app/page.tsx` | `src/lib/data.ts`의 `getDashboardData`, `src/lib/progress.ts` |
| 회원 `/members`, `/members/new`, `/members/[id]/edit` | `src/app/members/actions.ts`, 각 `page.tsx` | `src/components/member-detail-form.tsx`, `member-goal-settlement-fields.tsx`, `members-manager.tsx` |
| 인증 등록 `/workouts` | `src/app/workouts/page.tsx`, `actions.ts` | `src/components/workout-entry-form.tsx`, `file-input-field.tsx`, `src/lib/workout-policy.ts` |
| 인증 조회·수정·삭제 `/workout-records` | `src/app/workout-records/page.tsx` | `src/components/workout-manage-table.tsx`, `src/app/workouts/actions.ts` |
| 주간 제외 `/weekly-exceptions` | `src/app/weekly-exceptions/page.tsx`, `actions.ts` | `src/components/weekly-exception-manager.tsx`, `src/lib/data.ts` |
| 벌금 문서 `/penalty-documents` | `src/app/penalty-documents/page.tsx` | `src/lib/data.ts`의 `getPenaltyDocumentData`, `src/lib/settlement-period.ts`, `src/components/penalty-document-filter-form.tsx` |
| 로그인·로그아웃 | `src/app/login/page.tsx`, `src/app/auth/login/route.ts`, `src/app/auth/logout/route.ts` | `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/admin-auth.ts` |
| 공통 UI·인쇄 | `src/app/layout.tsx`, `src/app/globals.css`, `src/app/refinement.css` | `src/components/ui`, `modal.tsx`, `form-select-field.tsx`, `select-styles.ts` |
| OCR 유틸리티 | `src/lib/workout-ocr.ts` | Tesseract 의존성은 있으나 현재 `src`의 다른 파일에서 호출하지 않음 |

## 데이터와 인증

| 데이터 | 주요 의미 | 정의/변경 파일 |
| --- | --- | --- |
| `members` | 이름·성별, 최종 목표 달성 여부, 개인 설정 벌금, 월말 증적 | `supabase/schema.sql`, `sql/goal_penalty_fields.sql` |
| `weekly_goals` | 회원별 주간 목표 회차·시간; `(member_id, week_start)` 유일 키 | `supabase/schema.sql`, `sql/weekly_goals_unique_constraint.sql` |
| `workout_sessions` | 날짜·회차·운동 유형·시간·인증 경로 | `supabase/schema.sql` |
| `weekly_exceptions` | 회원·주차별 제외와 사유; `(member_id, week_start)` 유일 키 | `sql/weekly_exceptions.sql` |
| `admin_accounts` | 운영진 ID, 비밀번호 해시, 활성 여부 | `sql/admin_accounts.sql` |
| Storage `workout-proofs` | 비공개 인증 이미지 | `supabase/schema.sql`, `src/app/workouts/actions.ts` |

`supabase-server.ts`는 `server-only`이며 `NEXT_PUBLIC_SUPABASE_URL`과
`SUPABASE_SERVICE_ROLE_KEY`로 서버 클라이언트를 생성한다.
`NEXT_PUBLIC_SUPABASE_ANON_KEY`는 기존 README에 있지만 현재 `src`/`scripts`에서
사용하지 않는다. 설정 제거 여부는 다른 배포 소비처까지 확인한 뒤 판단한다.

로그인은 `admin_accounts`의 활성 계정을 조회해 SHA-256 해시를 비교한다.
`auth.ts`는 만료 시각에 HMAC-SHA-256 서명을 붙인 8시간 쿠키
`workout_admin_session`을 생성·검증한다. `ADMIN_SESSION_SECRET`이 없으면 service role
키를 서명에 사용한다. 쿠키에는 관리자 ID나 역할이 포함되지 않는다.
이는 현재 구현 설명이며 비밀번호 저장 방식이나 키 공유에 대한 권장 설계가 아니다.

`proxy.ts`는 로그인·auth·정적 경로를 통과시키고 나머지 대상의 쿠키를 검증한다.
matcher는 `/api`로 시작하는 경로를 제외한다. 현재 업무 Actions에는 독립적인 세션
검증 호출이 없으므로 새 진입점을 추가할 때 보호 범위를 따로 확인해야 한다.
기본 스키마는 주요 업무 테이블의 RLS를 활성화하지만 서버 service role 접근을 사용한다.
`weekly_exceptions.sql`에는 RLS 설정이 없으며 실제 DB 정책은 확인하지 않았다.

## 현재 업무 계산

### 주차와 목표

- `data.ts`의 `getCurrentWeekStart`는 일요일을 주 시작일로 잡는다.
  주간 조회는 시작일 포함, 다음 일요일 미포함이다. 모임 시작 주차는 `2026-02-01`이다.
- 회원 저장의 `saveFixedWeeklyGoal`은 시작 주차에 목표를 저장한다.
  조회의 `listFixedGoals`는 회원별 `week_start`가 가장 최신인 행을 고른다.
  선택 주차에 유효했던 과거 목표를 복원하는 구조는 아니다.
- 대시보드는 조회된 인증 행 수와 시간을 합산한다. 주간 제외 회원의 목표 회차는
  표시용으로 `-1`을 사용한다. `progress.ts`에서 음수 목표는 제외, 0은 진행 중이다.
- 주간 제외는 벌금 계산의 대상 주차에서도 빠지지만 인증 기록 자체를 지우지 않는다.

### 인증

| 유형 | 기본 시간 | 서버 최소 시간 | 선택 가능한 사진 |
| --- | --- | --- | --- |
| 일반 `general` | 60분 | 1분 | 시작·종료 각 1장 |
| 러닝 `running` | 30분 | 30분 | 인증 사진 1장 |

- 사진은 모두 선택 사항이다. 시작 사진이 없을 때 기존 NOT NULL 제약에 맞춰 빈 경로를 저장한다.

- `toWorkoutType`은 `running` 이외 값을 `general`로 정규화한다.
- 회차는 UI에서 1–5를 사용하고 서버도 같은 범위로 정규화한다.
  등록·수정은 같은 회원·주차·회차를 조회해 중복을 막으며 수정 시 자신의 ID는 제외한다.
  스키마에는 이에 대응하는 유일 제약이 없어 동시 요청의 중복 방지까지 보장하지 않는다.
- 이미지 경로는 회원/날짜 아래에 생성된다. 조회 시 1시간 유효한 서명 URL을 발급한다.
- 이미지 업로드 후 DB 저장이 실패하면 새 이미지가 남을 수 있다.
  수정은 DB 갱신 후 기존 이미지를 제거하지만 삭제 오류를 별도로 검사하지 않는다.
  인증 삭제 Action은 DB 행만 지운다. Storage까지 정리됐다고 보고하지 않는다.
- 이관 SQL은 실제 이미지 대신 placeholder 경로를 사용한다. 그 SQL의 중복 기준은
  회원·날짜·회차로, 현재 Action의 회원·주차·회차 기준과 다르다.
- OCR 함수는 두 사진의 시각으로 시간을 추정하고 자정 경과를 보정한다.
  현재 등록·수정 화면은 이 함수를 호출하지 않으므로 OCR 자동 판정을 전제하지 않는다.

### 벌금과 정산 기간

- `getActiveSettlementPeriod()`는 현재 **2026년 상반기**로 고정되어 있다.
  회원 입력의 증적 기간과 벌금 문서의 기본 필터에 사용한다. 날짜가 바뀌어도 자동 전환되지 않는다.
- 2026년 상반기 운동 집계 종료일은 `2026-06-27`이고 최종 마감은 `2026-06-30`이다.
  일반 반기의 증적 월은 6월 또는 12월이다. `june_goal_proof_*`라는 DB 이름은 유지된다.
- 문서는 모임 시작일과 반기 시작일 중 늦은 날부터 선택 주차의 끝까지 집계하며,
  운동 집계 종료일을 넘지 않는다. 기준 주차 목록은 현재 날짜도 고려한다.
- 주간 벌금은 **제외되지 않은 목표 미달 주 수 × 10,000원**이다.
  부족한 인증 횟수당 10,000원이 아니다. 목표 회차가 0이면 미달 주를 만들지 않는다.
- 최종 목표를 달성했다면 최종 벌금은 0원이다. 미달성이고 해당 반기 증적 월 안의
  증적 여부·날짜가 유효하면 개인 설정 벌금의 50%, 그 외에는 100%다.
  기본 개인 설정 벌금은 100,000원이며 총액은 주간 벌금과 최종 벌금의 합이다.
- 최종 달성 여부·개인 벌금·증적은 `members`의 현재 값이다. 반기별 별도 스냅샷이
  없으므로 과거 반기를 선택해도 당시 회원 상태를 복원한다고 보장할 수 없다.

## 수정 전 알아둘 한계

다음은 소스에서 확인한 상태이며, 이번 하네스 작성으로 해결한 항목은 아니다.

- **구스키마 fallback:** 회원 조회·저장에 누락 컬럼 대응이 있고 목표 upsert는 `42P10`
  발생 시 조회 후 update/insert로 전환한다. 저장 성공만으로 모든 입력 필드가 보존됐다고
  단정하지 않는다. 회원 저장 후 목표 저장 실패도 가능하므로 재등록 전에 부분 성공을 확인한다.
- **조회 오류와 빈 데이터:** 주간 제외 조회는 오류를 로그에 남기고 빈 배열을 반환한다.
  제외가 없다는 계산 결과가 실제로는 조회 실패일 수 있다.
- **시간대:** 로컬 `Date`, `new Date(dateText)`, `toISOString()`이 혼재한다.
  한국 시간대와 UTC 실행 환경의 주 경계가 일치하는지는 실행 검증이 필요하다.
- **DB 적용:** SQL 파일은 있지만 자동 migration runner와 적용 이력 관리는 없다.
  `schema.sql`에는 중복 목표 삭제·제약 변경도 있다. 파일 존재와 운영 적용은 별개다.
- **로컬 준비:** 분석 시 `.env`, `node_modules`, `.next`가 없었다.
  README가 안내하는 `.env.example`도 추적 파일에 없다. 비밀값을 추정해 채우지 않는다.
- **검증 기반:** 테스트 파일·러너·`test`/`typecheck` npm 스크립트와 저장소 CI 구성이 없다.
  `build`·`lint` 명령이 있는 것과 실행 성공 여부를 구분한다.

## 배포와 운영 파일

- 절차: [deployment-guide.md](deployment-guide.md).
- `scripts/deploy-vercel.ps1`: `.env` 확인 → 로컬 빌드 → Vercel production 배포 →
  선택적 alias 변경. 검증 전용 스크립트가 아니며 환경 변수를 자동 등록하지 않는다.
- `scripts/seed-members.mjs`: `.env`를 읽어 실제 회원을 생성/수정하고 목표를 upsert한다.
  테스트 fixture 생성기나 dry-run 도구가 아니다.
- `sql/admin_accounts.sql`: 테이블 생성뿐 아니라 예시 관리자 계정 insert도 포함한다.
  실제 계정 정책을 검토하지 않은 상태로 적용하지 않는다.
- `sql/import_kakao_workout_sessions_2026.sql`: 과거 인증 데이터를 이름으로 회원과 연결해
  넣는다. 이관 대상·이름 매칭·중복 기준·사진 부재를 검토해야 하며 자동 재실행하지 않는다.
