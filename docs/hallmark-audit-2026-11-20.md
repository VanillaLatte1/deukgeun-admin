# Hallmark 화면 감사 — 2026-11-20

Hallmark 2.0.0을 프로젝트 전용으로 설치하고, 로컬 서버에서 정상 로그인한 뒤
관리자 화면을 점검했다. **모바일 공통 레이아웃과 대시보드 표 잘림을 먼저 수정해야 한다.**
이번 작업은 설치와 감사다. 애플리케이션 소스·업무 데이터는 수정하지 않았다.

- 목적: 운영진이 회원별 목표와 운동 인증을 확인하고 처리하는 업무 화면이다.
- 유지할 점: 녹색 브랜드, SUIT/Paperlogy 글꼴, 한국어 메뉴, 명시적인 폼 레이블,
  공통 컴포넌트, 주차 필터와 기존 업무 흐름.
- 시각적 개선점: 반복되는 영문 보조 제목, 여러 겹의 카드, 넓은 안내 영역이 실제
  표·입력보다 먼저 눈에 들어온다. 이는 사용성·디자인 판단이며 모두 기능 오류는 아니다.
- 재현된 결함: 모바일 본문 폭, 표 열 잘림, 모달 포커스 이탈, 날짜 hydration 오류,
  모바일 메뉴 컴포넌트 경고, 필터 안내 불일치, 흐린 로그인 입력 경계.

## 설치와 적용 범위

| 항목 | 결과 |
| --- | --- |
| 원본 | [nutlope/hallmark](https://github.com/nutlope/hallmark) |
| 고정 커밋 | `04977e15f3dfd6ee4b74c887dac3eb52665d6c92` |
| 설치 위치 | [`.agents/skills/hallmark/SKILL.md`](../.agents/skills/hallmark/SKILL.md) |
| 구성 | `skills/hallmark` 디렉터리와 동봉 LICENSE·참조·스크립트, 187개 파일, 약 6.75 MiB |
| 출처 기록 | [`.agents/hallmark-source.json`](../.agents/hallmark-source.json) |
| 적용 | 기존 브랜드를 보존한 `audit`, `--scope app`, 장르는 운영 도구에 따라 `modern-minimal`로 추론 |
| 저장소 연결 | 루트 AGENTS.md와 README에 사용 경로·감사 경계를 연결 |

원본 저장소 전체 clone이나 npm 애플리케이션 의존성 추가는 필요하지 않았다.
전역 스킬·훅·MCP 설정은 바꾸지 않았다. 새 세션에서는 프로젝트 스킬 검색으로 사용할 수
있으며, 이번 세션에서는 설치된 SKILL.md를 직접 읽고 적용했다.

## 확인한 범위

자동 검사와 실제 로그인 후 점검의 범위는 다르다.

| 방식 | 대상과 상태 | 화면 폭 |
| --- | --- | --- |
| Hallmark 정적 검사 | `src`의 TSX/CSS 37개 파일 | 해당 없음 |
| Hallmark 렌더 검사 | `/login`, `/login?error=1` 두 상태 | 320, 375, 414, 768, 1024, 1280, 1440, 1920px |
| 로그인 후 직접 점검 | `/`, `/members`, `/members/new`, `/members/[id]/edit`, `/workouts`, `/workout-records`, `/weekly-exceptions`, `/penalty-documents` | 1440×900, 375×800 |
| 추가 재현 | 대시보드 표 잘림 | 1280×800 |
| 상호작용 | 정상 로그인, 모바일 메뉴 열기·이동, 회원 수정 진입, 과거 주차 검색, 인증 수정 모달 열기·닫기와 Tab | 각 해당 화면 |

현재 주차의 빈 기록과 과거 주차의 데이터가 있는 기록을 모두 확인했다. 과거 주차 검색은
39건이 표시됐으며 이미지도 렌더됐다. 회원/운동/제외 저장·삭제, 이미지 교체·업로드,
벌금 출력·PDF 인쇄, 정산 계산 정확성, 운영 배포는 이번 검증에 포함하지 않았다.

처음 발생한 로그인 HTTP 500은 Supabase 환경 변수 누락 때문이었고, 제공받은 설정을
Git에서 제외된 `.env.local`에 적용한 뒤 정상 로그인했다. 보고서에는 환경 변수 값을
기록하지 않는다. 이 감사에 필요하지 않은 추가 API 키는 저장하거나 사용하지 않았다.

## 우선 수정할 재현 결함

P1은 화면 이용에 직접 영향을 주는 우선 수정 항목, P2는 다음 수정 묶음이다.
아래는 Hallmark 원시 경고의 개수와 별도로 사람이 재현·확인한 결과다.

| 우선순위 | 발견 및 근거 | 코드 위치 | 가장 작은 수정 방향 |
| --- | --- | --- | --- |
| P1 | **모바일 본문이 256px로 고정된다.** 375px에서 `.app-shell` 계산값은 `256px 79px`, 본문은 256px다. 오른쪽에 빈 공간이 생기고 모든 내부 화면의 폼·표가 좁아진다. | `src/app/refinement.css:47`, `:732`; `src/app/globals.css:2547`; CSS 로드 순서 `src/app/layout.tsx:4` | polish: 뒤에 로드되는 refinement의 모바일 규칙에 단일 열을 명시한다. 기존 globals의 단일 열 선언을 기본 2열 규칙이 덮는 충돌을 해소한다. |
| P1 | **대시보드 표 마지막 열이 잘린다.** 1440px에서 표 780px/패널 734px, 1280px에서 표 780px/패널 628px. 패널 `overflow-x:hidden`으로 상태 열을 볼 수 없다. | `src/app/globals.css:933`; `src/app/refinement.css:427`; `src/app/page.tsx:286` | polish: 표를 담은 영역에 가로 스크롤을 제공하거나 열 폭을 조정한다. 모바일에만 있는 `overflow-x:auto`를 데스크톱에도 필요한 조건에 적용한다. |
| P2 | **모달이 키보드 포커스를 가두지 않는다.** 인증 수정의 마지막 `수정 저장`에서 Tab을 누르면 열린 dialog 밖 BODY로 이동하고, 다음 Tab은 개발 도구 포털로 이동했다. | `src/components/modal.tsx:39`, `:45`, `:64` | polish: 기존 Base UI Dialog 등으로 포커스 순환·배경 비활성화를 보장한다. 현재 구현은 초기 포커스/복귀/Escape만 처리한다. |
| P2 | **기록 날짜의 서버·브라우저 표기가 달라 hydration 오류가 발생한다.** 데이터가 있는 과거 주차에서 서버 `PM`, 브라우저 `오후` 차이가 콘솔 오류에 표시됐다. | `src/components/workout-manage-table.tsx:129` | 국소 동작 수정: 동일한 타임존과 결정적인 날짜 문자열을 서버/클라이언트에 전달한다. `suppressHydrationWarning`으로 숨기는 방식은 피한다. 이 실행 환경에서 확인했으며 운영 재현은 미검증이다. |
| P2 | **모바일 메뉴가 Base UI 버튼 의미 규칙을 위반한다.** 메뉴를 열고 이동할 때 SheetClose의 `nativeButton` 오류가 콘솔에 기록됐다. 메뉴 이동 자체는 성공했다. | `src/components/sidebar-menu.tsx:88` | polish: Link를 render하는 SheetClose에 비버튼 렌더 계약을 명시하고 링크 키보드 동작을 재확인한다. |
| P2 | **필터 안내와 실제 적용 시점이 다르다.** 화면은 조건을 바꾸면 바로 정리된다고 안내하지만, 주차 select 변경만으로 기록·날짜 요약은 바뀌지 않고 `검색` 클릭 후 갱신된다. | `src/app/workout-records/page.tsx:100`, `:123`, `:148` | polish: 현재 GET 검색 동작을 유지하면서 안내를 “조건 선택 후 검색”으로 맞추는 것이 가장 작다. 자동 조회로 바꾸는 것은 별도 동작 변경이다. |
| P2 | **로그인 입력 경계가 흐리다.** 렌더 검사에서 입력 테두리 대비 1.30:1로 측정돼 Hallmark 기준 3:1 미달이며 화면에서도 약하게 보인다. | `src/app/globals.css:2513`; 공통 입력 `src/app/refinement.css:316` | polish: 입력 경계·배경 토큰을 조정하고 기본/hover/focus 상태를 함께 확인한다. 이 수치만으로 전체 WCAG 적합성을 판정하지 않는다. |

첫 두 항목은 화면 증거와 계산된 DOM 치수, 다음 네 항목은 실제 상호작용과 소스를
대조했다. 대비 항목은 Hallmark 측정 및 스크린샷에 근거한다. 저장을 동반하는 검증은 하지 않았다.

## Hallmark 기준별 판정

원시 결과는 **Floor FAIL 573 / Reflex 199 / WARN 30**이다. 같은 CSS 선언의 반복,
페이지 상태 간 중복과 오탐을 포함하므로 **802개의 사용자 결함을 뜻하지 않는다.**
`--before`는 기준선을 기록하고 종료하며, 종료 코드 0도 감사 통과를 의미하지 않는다.

| 계층·게이트 | 원시 결과와 검토 | 권장 깊이 |
| --- | --- | --- |
| Floor 48 — 토큰 | 색상/글꼴 리터럴 544건. 토큰이 이미 있지만 두 CSS에 리터럴 선언이 많이 남아 있다. 예: `globals.css:58`, `refinement.css:92`. 유지보수 문제로 묶어서 처리할 항목이다. | polish: 기존 토큰 이름으로 통합 |
| Floor 54/67 — 영문 보조 제목 | eyebrow 11건, 자간/대문자 레이블 10건. `page.tsx:133`, `refinement.css:174`, `:636` 등의 작은 영문 제목이 한국어 제목과 반복된다. | polish: 보조 제목을 줄이고 레이블 크기·자간 정리 |
| Floor 10a — transition-all | 3건. `globals.css:272`, `:3054`, `components/ui/button.tsx:8`. | polish: 변화할 속성만 나열 |
| Floor 39a/40 — 포커스·대비 | border-focus 정적 지적 2건과 로그인 입력 대비 실패 2건. 뒤쪽 focus-visible 스타일도 존재하므로 전체 입력에 포커스가 없다고 단정하지 않는다. 실제 모달 포커스 결함은 위 표처럼 별도 재현했다. | polish: 최종 cascade 기준으로 상태 정리 |
| Floor 34 — overflow | html/body의 `overflow-x:clip` 누락 1건. 검사한 화면에 문서 전체 가로 넘침은 확인되지 않았다. 실제 문제는 좁은 본문과 내부 표 clipping이다. | 정책 차이로 기록; 실제 원인 수정 우선 |
| Reflex 24b — 간격 | 4px 배수 밖 간격 197건. 기존 체계와 반응형 디자인을 검토하며 통합할 항목이고 개별 장애는 아니다. | 선택적 restyle; 단순 감사만으로 일괄 변경하지 않음 |
| Reflex 23 — 강조색 | 로그인 accent coverage 약 100% 경고 2건. 연녹색 배경까지 집계하는 휴리스틱이므로 불투명 녹색 면적 100%라는 사실로 사용하지 않는다. | 시각 판단: 큰 녹색 로그인 패널의 강도 조정은 선택 |
| Judged Floor 4 — 카드 중첩 | 회원/운동 폼과 조회 필터에서 패널→안내/섹션 카드→입력 카드가 반복된다. 인증 기록은 900px 높이에서도 첫 데이터가 화면 하단에 도달한다. | 기능 오류 수정 이후 검토. 영역 재배치는 별도 앱 화면 full 범위, 색상·선·그림자만 줄이면 restyle |
| Finish/기타 WARN | 숫자 정렬, 그림자+테두리, 유리 효과, pill, caret 등은 디자인 개선 후보다. `refinement.css:920`에 reduced-motion 대응은 존재한다. Next 개발 콘솔의 로고 크기·LCP 경고도 추후 최적화 후보이며 성능 지표는 측정하지 않았다. | polish/restyle 선택 |

### 제외하거나 확정하지 않은 경고

- F18의 빈 `slot "label"` 4건은 shadcn `data-slot="label"`
  (`src/components/ui/label.tsx:11`)을 이미지 슬롯으로 오인한 결과다. 이미지 누락으로 보고하지 않는다.
- 녹색 그라데이션 위 흰색 “로그인”의 1.08:1 경고는 도구의 배경색 추정과 실제 배경이
  일치하는지 확정하지 못했다. 실제 입력 테두리 대비와 구분한다.
- 일반 텍스트 대비 WARN 15건은 정적/렌더 후보가 섞여 있다. 낮은 대비가 의심되는
  작은 보조 글자를 개선 후보로 남기되, 모두 확정 위반으로 계산하지 않는다.
- 로그인 오류 모달은 `?error=1` 상태로 확인했다. 잘못된 비밀번호에 따른 서버 검증,
  로그인 만료와 쿠키 변조까지 검사했다는 뜻은 아니다.
- stock 렌더 검사는 로그인 두 상태만 실행했다. 인증 후 화면을 8개 폭에서 자동
  검사한 결과로 확대 해석하지 않는다. 인증 화면은 직접 로그인한 브라우저 점검이다.

## 수정 순서 제안

1. 공통 모바일 grid와 대시보드 표 overflow를 먼저 고친다. 기존 디자인을 유지하는 polish로 충분하다.
2. 공통 모달, 날짜 표기, SheetClose 계약, 필터 안내, 입력 대비를 국소 수정한다.
3. 반복 영문 보조 제목·토큰·transition을 정리한다. 이 단계도 기존 브랜드를 보존한다.
4. 이후 필요할 때 표와 입력이 더 빨리 보이도록 안내 영역과 카드 구조를 재배치한다.
   이는 별도 디자인 변경 범위이며 이번 감사에서는 수행하지 않았다.

전체 재설계를 먼저 시작할 필요는 없다. 위 1–3번을 고친 뒤 실제 사용 밀도를 보고
추가 레이아웃 변경 여부를 판단하는 것이 적절하다.

## 증거와 재실행

아래 산출물은 로컬 전용이며 `.hallmark/.gitignore`로 제외된다. 인증 화면 캡처에는
회원 정보가 포함될 수 있으므로 Git이나 공유 보고서에 그대로 넣지 않는다.

- `.hallmark/preflight.json`: 프로젝트·브랜드 사전 분석
- `.hallmark/audit-results.json`: Hallmark 원시 결과
- `.hallmark/before.json`, `.hallmark/before/`: 로그인 기준선과 캡처
- `.hallmark/authenticated/evidence.json`: 화면 크기·표 치수·모달 포커스 관측
- `.hallmark/authenticated/console-findings.json`: 콘솔 경고/오류 첫 문장 요약
- [모바일 공통 폭 증거](../.hallmark/authenticated/mobile-layout-evidence.jpg)
- [데스크톱 대시보드](../.hallmark/authenticated/dashboard-1440.jpg)
- [과거 인증 기록](../.hallmark/authenticated/records-history-1440.jpg)

앱 의존성은 기존 lockfile로 `npm ci --no-audit --no-fund`를 실행했다.
렌더 도구 `puppeteer-core`는 앱 package.json을 바꾸지 않고 `.hallmark/tools` 아래에만
설치했다. 사용한 로컬 서버 주소는 `http://localhost:3017`이다.

비로그인 브라우저를 사용하는 Hallmark 렌더 기준선 재실행 예:

```powershell
# 먼저 필요한 환경 변수와 로컬 서버를 준비한다. 자격 증명은 명령 인수에 넣지 않는다.
$env:HALLMARK_PUPPETEER = (Resolve-Path '.hallmark/tools').Path
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node .agents/skills/hallmark/scripts/sloplint.mjs src --genre modern-minimal --scope app --render --before --url http://localhost:3017/login --url 'http://localhost:3017/login?error=1' --json
```

이번 기준선은 같은 서버의 `127.0.0.1:3017` 로그인 URL로 캡처했다. 인증 후에는
`localhost`로 호스트를 통일했다. 호스트가 다르면 로그인 쿠키가 공유되지 않는다.
기존 `.hallmark/before*`를 덮어쓰므로 비교가 필요하면 재실행 전에 증거를 보존한다.

후속 작업은 “Hallmark audit로 현재 화면 재확인” 또는 “위 P1/P2 항목을 polish 범위로
수정”처럼 요청할 수 있다. 이번에는 수정 후 검증·프로덕션 빌드·전체 lint를 실행하지
않았으며, 감사 결과는 **수정 전 기준선**이다.
