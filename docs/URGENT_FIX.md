# 긴급 수정: Email Confirmation 비활성화

## 1. Supabase Dashboard에서 즉시 수정
1. **Authentication > Settings**로 이동
2. **User sign-up** 섹션에서:
   - ❌ **"Enable email confirmations" 체크 해제** (현재 체크되어 있음)
   - ❌ **"Enable email change confirmations" 체크 해제**
   - ❌ **"Secure email change" 체크 해제**

## 2. 기존 사용자 수동 확인 (필요시)
Supabase SQL Editor에서 실행:
```sql
-- 기존 사용자들의 이메일을 수동으로 확인 처리
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

## 3. 추가 인증 설정 완화
Authentication > Settings에서:
- **Password requirements**: 모든 체크박스 해제
- **Minimum password length**: 6으로 설정
- **Additional factor timeout**: 600

## 4. 완전한 개발 모드 설정
SQL Editor에서 실행:
```sql
-- 개발용: 모든 사용자 자동 확인
UPDATE auth.users SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  phone_confirmed_at = COALESCE(phone_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL OR phone_confirmed_at IS NULL;

-- 개발용: 인증 관련 제약 완화
ALTER TABLE auth.users ALTER COLUMN email_confirmed_at SET DEFAULT NOW();
```

## 5. 즉시 테스트
설정 변경 후:
1. 새로운 이메일로 회원가입 시도
2. 이메일 확인 없이 바로 로그인 가능한지 확인
3. 기존 계정으로도 로그인 시도

**중요**: 위 설정들은 개발/테스트용입니다. 프로덕션에서는 이메일 확인을 다시 활성화하세요!