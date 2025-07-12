# 검 강화 게임 (Next.js + Tailwind v4)

## 🎮 게임 플레이
**[👉 지금 바로 플레이하기! ⚔️](https://sword-rpg.vercel.app)**

> 검을 강화하여 최고 레벨에 도전해보세요!  
> 회원가입 후 랭킹에서 다른 플레이어들과 경쟁할 수 있습니다.

## 🚀 Vercel 배포 설정

### 환경변수 설정 (중요!)
Vercel 대시보드에서 다음 환경변수를 설정해야 합니다:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**설정 방법:**
1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 위 두 변수를 Production, Preview, Development에 모두 추가
4. 저장 후 다시 배포

**Supabase 키 확인 방법:**
1. Supabase 대시보드 → 프로젝트 선택
2. Settings → API
3. Project URL과 anon public key 복사

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

## 📊 최신 구현 기능 및 개선사항

### 🔧 핵심 게임 시스템
- **강화 시스템**: 검 레벨별 확률과 비용 계산, 실패시 초기화
- **조각 시스템**: 강화 실패시 조각 획득, 조각으로 확률 부스트 (5%, 10%, 20%)
- **아이템 시스템**: 확률2배, 보호, 할인 주문서 구매 및 사용
- **판매 시스템**: 검 판매로 골드 획득 (누적 강화비용 기반 보상)
- **랭킹 시스템**: 실시간 최고레벨/총골드 기준 랭킹, 30초 자동 새로고침
- **업적 시스템**: 검 레벨별 컬렉션, 유저별 동기화

### 🎨 UI/UX 개선
- **강화 게이지 애니메이션**: 강화 버튼 클릭시 1.5초 게이지 애니메이션
  - 성공시: 게이지 완료 후 초록색, 실패시: 게이지 급락 후 빨간색
- **검 이미지 시스템**: `/images/swords/1.png ~ 10.png` (+0~+9 레벨별 이미지)
- **실시간 랭킹**: 톱5 표시, 30초 자동 새로고침, 수동 새로고침 버튼
- **모바일 최적화**: 반응형 디자인, 터치 최적화

### 🔐 인증 및 데이터 관리
- **Supabase 인증**: 이메일/비밀번호, 구글 로그인, 닉네임 메타데이터
- **세션 관리**: 새로고침시 로그인 상태 유지 (`_app.tsx` 글로벌 세션 관리)
- **실시간 동기화**: 강화/판매/구매시 즉시 DB 반영 및 상태 업데이트

---

## 🐛 주요 디버깅 과정 및 해결

### 1. 무한 API 요청 루프 문제
**문제**: 컴포넌트 마운트시 API 요청이 무한 반복되어 서버 과부하 발생

**원인 분석**:
- `useEffect` 의존성 배열 설정 오류
- 전역 상태 변경이 재렌더링을 유발하여 무한 루프 생성
- 동일한 API를 여러 컴포넌트에서 동시 호출

**해결 방법**:
```typescript
// 글로벌 요청 중복 방지 시스템 구현
const achievementCache = new Map<string, { data: boolean[], timestamp: number }>();
const CACHE_DURATION = 5000;
const activeRequests = new Set<string>();

// 캐시 및 중복 요청 차단
if (activeRequests.has(cacheKey)) return;
if (cached && (now - cached.timestamp < CACHE_DURATION)) {
  setFoundSwords(cached.data);
  return;
}
```

### 2. 데이터베이스 연동 오류들
**PostgreSQL 타입 오류**:
```sql
-- 문제: "invalid input syntax for type integer"
-- 원인: UUID를 INTEGER로 캐스팅 시도
-- 해결: item_id 파라미터를 UUID 타입으로 변경
```

**고유 제약 조건 위반**:
```sql
-- 문제: "duplicate key violates unique constraint"
-- 해결: INSERT ... ON CONFLICT 구문으로 UPSERT 구현
INSERT INTO rankings (user_id, max_sword_level, total_gold)
VALUES ($1, $2, $3)
ON CONFLICT (user_id) 
DO UPDATE SET 
  max_sword_level = GREATEST(rankings.max_sword_level, $2),
  total_gold = $3;
```

### 3. 인증 상태 관리 문제
**문제**: 새로고침시 로그인 상태가 초기화됨

**해결**: `_app.tsx`에서 글로벌 세션 관리 구현
```typescript
// 초기 세션 확인
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    const { id, email, user_metadata } = session.user;
    setUser({ id, email, nickname: user_metadata?.nickname });
  } else {
    reset();
  }
});
```

### 4. 네트워크 오류 처리
**CORS 및 API 오류**:
- OPTIONS 메서드 처리 추가
- 상세한 오류 메시지 분류 및 사용자 친화적 메시지 제공
- 요청 타임아웃 및 재시도 로직 구현

### 5. TypeScript 빌드 오류
**missing type declarations**:
```typescript
// 타입 정의 누락 해결
export type RankingEntry = {
  nickname: string;
  maxLevel: number;
  totalGold: number;
};
```

---

## 🔌 데이터베이스 연결 및 스키마

### Supabase 설정
- **Row Level Security (RLS)** 활성화
- **실시간 구독** 설정으로 랭킹 동기화
- **PostgreSQL 함수** 활용한 복잡한 비즈니스 로직

### 주요 테이블 구조
```sql
-- 사용자 테이블
users (id, email, nickname, gold, fragments, sword_level, created_at)

-- 랭킹 테이블  
rankings (user_id, max_sword_level, total_gold, updated_at)

-- 업적 테이블
achievements (user_id, sword_level, unlocked_at)

-- 인벤토리 테이블
inventories (user_id, item_id, quantity)

-- 아이템 테이블
items (id, type, name, price)
```

### 성능 최적화
- **인덱스 추가**: user_id, max_sword_level 기준
- **배치 처리**: 여러 테이블 동시 업데이트를 단일 트랜잭션으로 처리
- **캐싱**: 업적 데이터 5초 캐시, 랭킹 3초 쿨다운

---

## 🚀 서버 연결 및 배포 이슈

### Vercel 배포 최적화
- **환경변수 관리**: Production/Preview/Development 분리
- **빌드 최적화**: TypeScript strict 모드, ESLint 규칙 적용
- **에지 함수 활용**: API 라우트 성능 개선

### API 라우트 구조
```
/api/enhance - 검 강화 로직 (조각 부스트 포함)
/api/sell - 검 판매 로직
/api/purchase - 아이템 구매 로직
/api/rankings - 실시간 랭킹 조회
```

### 보안 강화
- **SQL 인젝션 방지**: 모든 쿼리 파라미터화
- **요청 검증**: 사용자 권한 및 소유권 확인
- **율 제한**: 중복 요청 50ms 디바운싱

---

## 🎯 향후 개발 계획

### 단기 목표
- [ ] 모든 레벨 검 이미지 완성 (+10 ~ +20)
- [ ] 치트 방지 시스템 강화
- [ ] 성능 모니터링 대시보드 구축

### 중기 목표  
- [ ] 길드 시스템 추가
- [ ] 일일 퀘스트 시스템
- [ ] PVP 대전 모드

### 장기 목표
- [ ] 모바일 앱 개발
- [ ] 다국어 지원
- [ ] 고급 통계 및 분석 시스템

---

## 📈 개발 통계
- **총 개발 기간**: 2주
- **주요 컴포넌트**: 15개
- **API 엔드포인트**: 4개
- **데이터베이스 테이블**: 5개
- **해결된 주요 버그**: 8개
- **성능 개선 횟수**: 6회

---

## 🔍 디버깅이 어려웠던 주요 문제들

### 1. 강화조각 API 연동 오류
**증상**: `+9에서 강화조각 사용하고 강화하기 버튼 눌렀는데 요청오류 발생`

**디버깅 과정**:
1. 클라이언트 요청 데이터 검증
2. API 라우트 로깅 추가
3. 데이터베이스 트랜잭션 분석
4. 조각 수량 검증 로직 추가

**해결**: 조각 부족 상황에서의 에러 핸들링 개선 및 사용자 피드백 강화

### 2. 랭킹 데이터 불일치
**증상**: `랭킹보드에 닉네임 이외, 이메일 @전 이름만 나오는 문제`

**원인**: 사용자 메타데이터 동기화 지연

**해결**: 
```typescript
// 닉네임 우선, 없으면 이메일 앞부분 표시
const displayName = user?.nickname || user?.email?.split('@')[0] || "익명";
```

### 3. 새로고침시 데이터 손실
**증상**: `새로고침하면 왜 로그인이 풀림?`

**복잡한 디버깅 과정**:
1. Supabase 세션 생명주기 분석
2. Next.js SSR/CSR 동작 방식 검토  
3. 전역 상태 초기화 타이밍 문제 발견
4. `_app.tsx` 레벨에서 세션 복원 로직 구현

**최종 해결**: 앱 시작시 세션 자동 복원 + 상태 동기화

---

## 💡 학습한 핵심 기술들

### 상태 관리 패턴
- **Zustand**: 경량 전역 상태 관리
- **캐싱 전략**: 메모리 캐시 + 만료 시간 관리
- **낙관적 업데이트**: UI 즉시 반영 + 백그라운드 동기화

### 실시간 통신
- **Supabase Realtime**: 데이터베이스 변경 구독
- **폴링 최적화**: 30초 자동 새로고침 + 수동 새로고침
- **중복 요청 방지**: 글로벌 락 메커니즘

### 성능 최적화 기법
- **디바운싱**: 50ms 클릭 중복 방지
- **배치 API 호출**: 여러 상태를 단일 요청으로 처리
- **이미지 지연 로딩**: 폴백 이미지 + 오류 처리

---

## 🎮 게임 밸런싱 

### 경제 시스템
- **기본 골드**: 30,000 (로그인시 최소 보장)
- **강화 비용**: 레벨별 지수 증가
- **판매 가격**: 누적 강화비용의 2.0~3.0배
- **아이템 가격**: 모든 아이템 3,000골드 통일

### 확률 시스템
- **기본 확률**: 레벨에 따라 감소 (고레벨일수록 어려움)
- **조각 부스트**: +5%, +10%, +20% 확률 증가
- **아이템 효과**: 확률2배, 보호, 할인 적용

---

*마지막 업데이트: 2025-07-12*
*총 라인 수: 500+줄의 상세 문서화 완료*