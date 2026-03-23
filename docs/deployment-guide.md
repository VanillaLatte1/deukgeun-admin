# 배포 가이드

이 문서는 로컬에서 작업한 내용을 Vercel에 배포하는 기본 흐름을 정리한 문서입니다.

## 1. 사전 준비

필수 도구:
- Node.js / npm
- Vercel 계정
- Vercel CLI

필수 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

로그인 계정 정보는 환경 변수가 아니라 DB의 `admin_accounts` 테이블에서 관리합니다.

## 2. 로컬 개발

의존성 설치:

```powershell
npm install
```

개발 서버 실행:

```powershell
npm run dev
```

확인 주소:
- `http://localhost:3000`
- `http://localhost:3000/login`

배포 전 빌드 확인:

```powershell
npm run build
```

선택 점검:

```powershell
npm run lint
```

## 3. Vercel 최초 설정

로그인:

```powershell
npx vercel login
```

프로젝트 연결:

```powershell
npx vercel link
```

연결이 끝나면 `.vercel/project.json` 파일이 생성됩니다.

## 4. Vercel 환경 변수 설정

현재 등록된 값 확인:

```powershell
npx vercel env ls
```

필수 환경 변수 등록:

```powershell
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

값 변경 시:

```powershell
npx vercel env rm SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

주의:
- `NEXT_PUBLIC_*` 값은 브라우저에서 노출될 수 있습니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 값입니다.

## 5. 프로덕션 배포

직접 배포:

```powershell
npx vercel deploy --prod --yes
```

배포 스크립트 사용:

```powershell
npm run deploy:prod
```

별칭까지 같이 연결:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vercel.ps1 -Alias deukgeun-admin.vercel.app
```

## 6. 배포 스크립트 동작

`scripts/deploy-vercel.ps1`는 아래 순서로 동작합니다.

1. `.env` 파일 존재 여부 확인
2. `npm run build` 실행
3. `npx vercel deploy --prod --yes` 실행
4. `-Alias` 값이 있으면 alias 연결

이 스크립트는 Vercel 환경 변수를 자동 등록하지 않습니다.
아래 작업은 먼저 끝나 있어야 합니다.

- `npx vercel login`
- `npx vercel link`
- `npx vercel env add ...`

## 7. 배포 체크리스트

배포 전:
- `.env` 값이 최신인지 확인
- `npm run build` 성공 확인
- Vercel production 환경 변수가 최신인지 확인

배포 후:
- 운영 URL 접속 확인
- `/login` 로그인 확인
- 주요 화면 동작 확인

## 8. Alias 관리

alias 연결:

```powershell
npx vercel alias set <deployment-url> deukgeun-admin.vercel.app
```

alias 목록:

```powershell
npx vercel alias list
```

alias 제거:

```powershell
npx vercel alias remove <alias-domain> --yes
```
