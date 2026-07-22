# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

<!-- convex-ai-start -->

이 프로젝트는 백엔드로 [Convex](https://convex.dev)를 사용합니다.

Convex 코드를 작업할 때는 **반드시 먼저 `convex/_generated/ai/guidelines.md`를
읽으세요.** 이 파일에는 Convex API와 패턴을 올바르게 사용하는 방법에 대한 중요한
가이드라인이 들어 있으며, 학습 데이터로 알고 있는 Convex 지식보다 우선합니다.

자주 쓰는 작업을 위한 Convex 에이전트 스킬은 `npx convex ai-files install`
명령으로 설치할 수 있습니다.

<!-- convex-ai-end -->

## 프로젝트 현황

이 저장소는 `npm create convex -- -t nextjs-clerk`로 생성한, 이제 막 스캐폴딩된
Convex + Next.js + Clerk 앱입니다. "쇼핑몰(shop)" 도메인 로직은 아직 구현되지
않았습니다 — `convex/schema.ts`, `convex/myFunctions.ts`, `app/` 하위 페이지들은
여전히 템플릿의 예제용 `numbers` 카운터와 리소스 카드 UI 그대로입니다. 기존
파일들은 참고할 확립된 패턴이 아니라 교체 대상인 시작점으로 취급하세요.

Clerk ↔ Convex 데이터베이스 연동은 [공식 가이드](https://docs.convex.dev/auth/database-auth)의
두 패턴을 함께 사용합니다:

1. **Client-side mutation** (기본 흐름): `convex/users.ts`의 `getOrCreateUser(ctx)`
   헬퍼가 `tokenIdentifier` 기준으로 `users` 행을 upsert합니다. `store` mutation은
   이 헬퍼를 감싼 public 진입점이고, `hooks/useStoreUserEffect.ts`가 로그인 직후
   `store`를 호출해 Convex DB 저장이 끝날 때까지 기다립니다. `app/page.tsx`는 이
   훅의 `isLoading`/`isAuthenticated`/`userId`를 기준으로 로딩/로그인 폼/인증된
   콘텐츠를 분기합니다. 새 인증이 필요한 화면은 `<Authenticated>`/`<Unauthenticated>`
   대신 이 훅을 재사용하세요.
2. **웹훅 동기화** (`convex/http.ts`): Clerk 대시보드에서 유저를 직접
   생성/수정/삭제해도 Convex `users` 테이블이 따라가도록, `/clerk-users-webhook`
   경로에서 `@clerk/backend/webhooks`의 `verifyWebhook()`으로 서명을 검증한 뒤
   `internal.users.upsertFromClerk` / `deleteFromClerk`를 호출합니다. 이
   internalMutation들은 `externalId`(=Clerk의 raw user id, `identity.subject`와
   동일)로 유저를 찾습니다.

두 흐름이 같은 사람을 서로 다른 행으로 만들지 않도록, `users` 테이블은
`tokenIdentifier`(로그인 기준 키)와 `externalId`(웹훅 기준 키)를 모두 가지고
있고, `getOrCreateUser`는 `tokenIdentifier`로 못 찾으면 `externalId`로 한 번 더
찾아서 같은 행에 합칩니다(웹훅이 먼저 유저를 만든 뒤에 그 사람이 처음
로그인하는 경우를 위함). 새 필드나 조회 로직을 추가할 때 이 이중 키 구조를
깨지 않도록 주의하세요.

실제로 로그인이 동작하려면 `convex/auth.config.ts`의 `domain`이 진짜 Clerk JWT
issuer 도메인(`CLERK_JWT_ISSUER_DOMAIN` 환경변수, Convex 배포에 설정 필요)을
가리켜야 하고, 웹훅이 동작하려면 Clerk 대시보드에 `/clerk-users-webhook`
엔드포인트를 등록하고 `CLERK_WEBHOOK_SIGNING_SECRET`을 Convex 배포 환경변수로
설정해야 합니다 — 아직 연결하지 않았다면 `convex/README.md`와 `convex/http.ts`의
주석을 참고하세요.

## 명령어

- `npm run dev` — `npm-run-all`을 통해 프론트엔드(`next dev`)와 백엔드
  (`convex dev`)를 동시에 실행합니다. 평소 개발 시 사용하는 기본 명령입니다.
- `npm run dev:frontend` / `npm run dev:backend` — Next.js 개발 서버 또는
  `convex dev`만 단독으로 실행합니다.
- `npm run build` — Next.js 프로덕션 빌드.
- `npm run lint` — ESLint (flat config: `eslint-config-next` +
  `@convex-dev/eslint-plugin`, `convex/_generated`는 lint 제외).
- `package.json`에 별도로 구성된 테스트 러너는 없습니다.
- `convex dev`가 실행 중인 동안 Convex 함수는 dev 배포에 자동으로 반영되므로,
  개발 중 별도의 수동 배포 단계는 필요 없습니다.

## 아키텍처

- **백엔드**: 모든 Convex 코드는 `convex/`에 있습니다. `convex/schema.ts`가
  테이블을 정의하고, `convex/_generated/`는 자동 생성 파일이므로 직접 수정하지
  않으며 lint 대상에서도 제외됩니다. 함수(`query`/`mutation`/`action`)는 파일
  단위로 정의되며(예: `convex/myFunctions.ts`), `convex/_generated/api`의
  `api`를 통해 클라이언트에 노출됩니다.
- **인증 흐름**: Clerk가 프론트엔드에서 로그인/회원가입을 처리합니다
  (`@clerk/nextjs`). Convex 클라이언트는 `ConvexProviderWithClerk`
  (`components/ConvexClientProvider.tsx`)로 감싸져 있어 Clerk 세션을 Convex로
  전달하고, 그 결과 Convex 함수 내에서 `ctx.auth.getUserIdentity()`가
  동작합니다. `convex/auth.config.ts`는 Convex가 신뢰할 Clerk JWT issuer를
  지정합니다. `convex/users.ts`의 `store` mutation은 `tokenIdentifier`를 키로
  `users` 행을 upsert하고, `hooks/useStoreUserEffect.ts`가 로그인 후 클라이언트에서
  이를 호출해 Convex DB 저장이 끝난 뒤에야 `isAuthenticated: true`를 반환합니다
  (`app/page.tsx`에서 사용). 새 인증이 필요한 화면은 `<Authenticated>`/
  `<Unauthenticated>` 대신 이 훅을 재사용하세요.
- **라우트 보호**: `proxy.ts`(Next.js 미들웨어)는 `clerkMiddleware` +
  `createRouteMatcher`를 사용해 특정 라우트(현재는 `/server`)를
  `auth.protect()`로 보호합니다. 새로 보호할 라우트는 `isProtectedRoute`의
  matcher 목록에 추가하세요.
- **데이터 로딩 패턴**: 두 가지 방식이 공존합니다 —
  - 클라이언트 측/반응형: `"use client"` 컴포넌트 안에서 `convex/react`의
    `useQuery`/`useMutation` 사용 (`app/page.tsx` 참고).
  - 서버 측 프리로드: 서버 컴포넌트에서 `convex/nextjs`의
    `preloadQuery`/`preloadedQueryResult`를 사용하고, 이를 하위로 전달하여
    클라이언트 자식 컴포넌트에서 `usePreloadedQuery`로 재수화 (`app/server/page.tsx`
    + `app/server/inner.tsx` 참고). 화면 깜빡임 없이 서버 렌더링된 데이터가
    이후 클라이언트에서 실시간/반응형으로 전환되어야 할 때 이 패턴을 사용하세요.
- **스타일링**: `@tailwindcss/postcss`를 통한 Tailwind v4 (`app/globals.css`,
  `postcss.config.mjs` 참고). 별도로 설정된 컴포넌트 라이브러리는 없습니다.

## Convex 관련 참고사항

- Convex 함수를 작성하거나 수정하기 전에는 매번 `convex/_generated/ai/guidelines.md`를
  다시 읽으세요 — HTTP 엔드포인트는 `convex/http.ts`에서 `httpAction`으로
  정의해야 한다는 점, `v.object(...).pick/.omit/.partial/.extend`를 통한
  validator 조합, discriminated union 스키마 등 학습 데이터로 알고 있는 일반적인
  Convex 지식보다 우선하는 필수 문법이 정리되어 있습니다.
- Convex 에이전트 스킬(`.claude/skills/`, `.agents/skills/`에 설치되어 있고
  `skills-lock.json`에 기록됨)은 자주 하는 작업을 다룹니다:
  `convex-quickstart`, `convex-setup-auth`, `convex-create-component`,
  `convex-migration-helper`, `convex-performance-audit`. 즉흥적으로 처리하기보다
  해당하는 스킬을 우선 호출하세요.
