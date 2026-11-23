# Workout Admin Backoffice

운동 모임 운영진을 위한 백오피스입니다.

## 개발 작업 하네스

- [AGENTS.md](./AGENTS.md): 작업 시작, 구현 규칙, 데이터·외부 작업 경계
- [프로젝트 지도](./docs/project-map.md): 기능별 코드 위치, 업무 계산, 현재 구현의 한계
- [검증 절차](./docs/verification.md): 작업별 L0–L3 선택, 실행 명령, 회귀 확인과 오류 복구
- [Hallmark 화면 감사](./docs/hallmark-audit-2026-11-20.md): 프로젝트 전용 설치 정보, 실제 화면 점검 결과와 수정 우선순위

## 주요 기능
- 운영진 로그인
- 회원 등록 및 수정
- 회원별 주간 목표 관리
- 운동 기록 등록
- 주간 진행 현황 확인

## 기술 스택
- Next.js App Router
- Supabase
- Vercel

## 환경 변수
프로젝트 루트의 `.env` 파일에 아래 값을 설정합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SESSION_SECRET` (선택, 32자 이상의 무작위 문자열 권장. 미설정 시 service role key 사용)

예시 파일:
- `.env.example`

## DB 설정
Supabase SQL Editor에서 아래 파일들을 실행합니다.

- `supabase/schema.sql`
- `sql/admin_accounts.sql`

`admin_accounts` 테이블에 로그인 가능한 운영진 계정이 저장됩니다.

## 로컬 실행
의존성 설치:

```bash
npm install
```

개발 서버 실행:

```bash
npm run dev
```

접속 주소:
- `http://localhost:3000`
- `http://localhost:3000/login`

## 배포
자세한 절차는 아래 문서를 참고하세요.

- [docs/deployment-guide.md](./docs/deployment-guide.md)

빠른 배포:

```powershell
npm run deploy:prod
```

별칭까지 함께 연결:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vercel.ps1 -Alias deukgeun-admin.vercel.app
```

## 운영 참고
- 운영진 로그인 정보는 환경 변수가 아니라 `admin_accounts` 테이블에서 관리합니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 비밀값이므로 클라이언트에 노출되면 안 됩니다.
