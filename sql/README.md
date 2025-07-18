# 검 RPG 게임 데이터베이스 설정

이 폴더에는 검 RPG 게임의 데이터베이스 설정을 위한 SQL 파일들이 포함되어 있습니다.

## 🚀 빠른 시작 (권장)

데이터베이스를 완전히 새로 설정하려면 다음 파일만 실행하면 됩니다:

```sql
-- 1. 통합 설정 파일 (모든 것을 한 번에 설정)
\i sql/setup_database.sql
```

이 파일은 다음을 모두 포함합니다:
- 모든 테이블 생성
- 인덱스 생성
- RLS 비활성화
- 기본 아이템 데이터 삽입
- 모든 필요한 함수 생성

## 📁 파일 구조

### 주요 파일 (개별 실행 시)
```
sql/
├── setup_database.sql      # 🌟 통합 설정 파일 (권장)
├── 01_create_tables.sql    # 기본 테이블 생성
├── 03_create_shop_functions.sql  # 상점 구매 함수
├── 04_create_sell_functions.sql  # 검 판매 함수
├── 08_disable_all_rls.sql        # RLS 비활성화
├── 09_add_special_items.sql      # 특수 아이템 추가
└── 11_create_item_cooldown_system.sql  # 쿨타임 시스템
```

### 유틸리티 파일
```
├── 00_drop_all_tables.sql         # 개발용 테이블 삭제
├── 05_create_missing_achievements.sql  # 기존 사용자 업적 생성
├── 12_cleanup_rls_policies.sql    # RLS 정책 정리 (보안 경고 해결)
├── 13_verify_rls_cleanup.sql      # RLS 정리 검증
├── RLS_FIX_INSTRUCTIONS.md        # RLS 문제 해결 가이드
└── README.md                      # 이 파일
```

## 🔧 개별 파일 실행 순서

개별 파일을 실행하고 싶다면 다음 순서를 따라주세요:

```bash
# 1. 기본 테이블 생성
psql $DATABASE_URL -f sql/01_create_tables.sql

# 2. RLS 비활성화
psql $DATABASE_URL -f sql/08_disable_all_rls.sql

# 3. 특수 아이템 추가
psql $DATABASE_URL -f sql/09_add_special_items.sql

# 4. 상점 기능 추가
psql $DATABASE_URL -f sql/03_create_shop_functions.sql

# 5. 판매 기능 추가
psql $DATABASE_URL -f sql/04_create_sell_functions.sql

# 6. 쿨타임 시스템 추가
psql $DATABASE_URL -f sql/11_create_item_cooldown_system.sql

# 7. 기존 사용자 업적 생성 (선택사항)
psql $DATABASE_URL -f sql/05_create_missing_achievements.sql
```

## 🗑️ 데이터베이스 초기화

모든 것을 삭제하고 새로 시작하려면:

```bash
# 모든 테이블 삭제
psql $DATABASE_URL -f sql/00_drop_all_tables.sql

# 통합 설정 파일 실행
psql $DATABASE_URL -f sql/setup_database.sql
```

## 🎮 게임 기능별 설명

### 핵심 테이블
- **users**: 사용자 정보 (골드, 조각 등)
- **swords**: 검 정보 (레벨 등)
- **items**: 아이템 정보 (주문서, 재료 등)
- **inventories**: 사용자 아이템 보유량
- **rankings**: 랭킹 정보
- **user_achievements**: 사용자 업적
- **item_cooldowns**: 아이템 쿨타임

### 주요 함수
- **handle_item_purchase()**: 상점에서 아이템 구매
- **handle_sword_sale()**: 검 판매
- **check_item_cooldown()**: 아이템 쿨타임 확인
- **record_item_usage()**: 아이템 사용 기록
- **create_user_if_not_exists()**: 사용자 생성 (RLS 우회)

### 게임 밸런스
- 주문서 구매 제한: 3개까지
- 재료 구매 제한: 10개까지
- 아이템 쿨타임: 15-45분
- 필수 재료: 10강+(마력석), 15강+(정화수+고급보호권), 20강+(전설의정수)

## 🛠️ 문제 해결

### RLS 보안 경고 해결
Supabase Security Advisor에서 RLS 관련 경고가 나타나는 경우:

```bash
# 자동 스크립트 실행 (권장)
./scripts/fix_rls_security.sh

# 또는 수동으로 SQL 실행
```

자세한 내용은 [RLS_FIX_INSTRUCTIONS.md](./RLS_FIX_INSTRUCTIONS.md)를 참고하세요.

### 권한 오류
모든 테이블에서 RLS(Row Level Security)가 비활성화되어 있어 권한 문제가 발생하지 않아야 합니다.

### 중복 실행
모든 SQL 파일은 `IF NOT EXISTS` 또는 `ON CONFLICT` 구문을 사용하여 중복 실행에 안전합니다.

### 데이터 손실
`setup_database.sql`은 기존 데이터를 보존합니다. 완전 초기화가 필요한 경우에만 `00_drop_all_tables.sql`을 사용하세요.

## 📊 데이터베이스 상태 확인

```sql
-- 테이블 목록 확인
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 아이템 목록 확인
SELECT * FROM items;

-- 사용자 수 확인
SELECT COUNT(*) FROM users;

-- 함수 목록 확인
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

## 🎯 마이그레이션 가이드

기존 데이터베이스를 새 버전으로 업그레이드하는 경우:

1. 백업 생성
2. `setup_database.sql` 실행 (기존 데이터 보존)
3. 게임 테스트
4. 문제 발생 시 백업 복원

---

문제가 발생하면 모든 파일을 삭제하고 `setup_database.sql`만 실행하는 것이 가장 확실한 해결책입니다.