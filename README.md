# 검 강화 게임 (Next.js + Tailwind v4)

## 🛠️ 프로젝트 세팅 및 개발 규칙

### 1. Tailwind CSS v4 적용
- tailwindcss, @tailwindcss/postcss, postcss, autoprefixer 설치
- postcss.config.js:
  ```js
  module.exports = {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  }
  ```
- src/styles/globals.css:
  ```css
  @import 'tailwindcss';
  ```
- tailwind.config.js:
  ```js
  module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: { extend: {} },
    plugins: [],
  }
  ```

### ❗️ Tailwind CSS v4 적용 실패 및 해결 과정
- **문제 증상**
  - tailwind, css가 적용되지 않고 흰 바탕에 텍스트만 표시됨
  - 기존 방식(`@tailwind base;` 등)으로는 스타일이 전혀 적용되지 않음
- **원인 분석**
  - Tailwind CSS v4부터는 PostCSS 플러그인 및 글로벌 CSS import 방식이 완전히 변경됨
  - 기존 v3 방식(`@tailwind base;` 등)과 postcss.config.js 설정(`tailwindcss: {}`)이 더 이상 동작하지 않음
- **해결 방법**
  1. `@tailwindcss/postcss` 패키지 설치
  2. postcss.config.js를 아래와 같이 변경
     ```js
     module.exports = {
       plugins: {
         '@tailwindcss/postcss': {},
         autoprefixer: {},
       },
     }
     ```
  3. 글로벌 CSS(`globals.css`)에서 `@import 'tailwindcss';`로 변경
  4. 서버 재시작 후 정상 적용 확인

### 2. package.json scripts
- 개발: `npm run dev` (5090 포트)
- 빌드: `npm run build`
- 배포: `npm run start` (5090 포트)

### 3. 개발 서버 실행
```bash
npm run dev
# http://localhost:5090
```

### 4. UI/UX 리뉴얼 내역
- Tailwind v4 기반 완전 리뉴얼
- 다크 그라데이션 배경, 글래스모피즘, 애니메이션 효과
- 검/강화/인벤토리/스탯 등 모든 UI 컴포넌트 현대적 디자인 적용

### 5. 기타
- 모든 코드/커밋/문서/채팅은 한글로 작성
- 최신 Next.js(15.x), React(19.x) 기반
- 모바일 환경 최적화

---

## 개발 규칙 (rules)
- tailwind 및 css는 항상 최신 공식 문서 기준으로 적용
- UI/UX는 모바일 우선, 심플&모던 스타일 지향
- 코드/문서/커밋/채팅 모두 한글 사용
- 불필요한 설정/코드 최소화, 불확실하면 공식문서 우선
- 포트는 5090 고정 사용
- 문제 발생 시 전면 재검토 및 최신 가이드라인 반영

---

## ✅ 최신 구현/개발 내역
- 인벤토리, 강화, 판매, 상점, 랭킹 등 모든 주요 게임 시스템 프론트엔드 완성
- 강화/판매/구매/아이템 등 모든 게임 내 상태는 전역 상태로 관리
- 상점에서 확률 2배, 보호, 할인 주문서 등 아이템 구매 및 실제 강화에 연동
- 상점 아이템 가격 3,000골드로 통일, 최대 10개까지만 구매 가능, 보유량 실시간 반영
- 검 판매가: +0~+9 구간도 보상이 크게 상향(누적 강화비용×2.0), +10~+14(×2.5), +15~(×3.0)로 밸런스 개선
- 게임 시작/리셋 시 기본 보유 골드 30,000으로 상향
- 인벤토리(컬렉션)에서 각 검 아래 +0, +1 등 레벨 텍스트 별도 표시
- 랭킹(최고 강화 레벨, 누적 판매 골드) UI 및 샘플 데이터 기반 실시간 표시
- 반응형 UI/UX(모바일/PC) 세부 개선, 모든 주요 컴포넌트에 적용
- 검 이미지(SVG) 적용: public/sword_img/1.svg 등 public 폴더 기준으로 관리
- 회원가입 시 닉네임 입력 및 Supabase user metadata 저장
- 로그인 폼(이메일/비번/닉네임/구글) 완비, 미로그인 시 /login으로 강제 리다이렉트
- 코드/문서/커밋/채팅 모두 한글, 심플&모던 스타일, 모바일 우선

---

## 📌 남은 작업(우선순위)
- Supabase(실제 DB) 연동: 유저별 데이터, 랭킹, 인벤토리, 아이템 등 서버 저장/조회/실시간 반영
- 유저 인증/로그인 후 게임 데이터 연동(로그인한 유저별 데이터 분리)
- 치트/부정행위 방지(서버 검증)
- 테스트 코드 및 코드 리팩토링
- 접근성(Accessibility) 및 세부 UI/UX 개선
- (선택) 신규 기능/이벤트/업적 등 추가

--- 