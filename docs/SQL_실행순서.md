# SQL 파일 실행 순서

## 🚨 반드시 이 순서대로 실행하세요!

### 1단계: `database_setup.sql` 
- 테이블 생성 및 기본 설정
- 가장 먼저 실행

### 2단계: `02_disable_rls.sql`
- RLS(Row Level Security) 비활성화  
- 401 Unauthorized 오류 해결

### 3단계: `03_fix_email_confirmation.sql`
- 이메일 확인 문제 해결
- "email not confirmed" 오류 해결

## ✅ 실행 후 확인사항
1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
2. 시크릿 모드에서 테스트
3. 새로운 이메일로 회원가입 테스트
4. 기존 계정으로 로그인 테스트

## 🔧 추가 설정 (Supabase Dashboard)
Authentication > Settings에서:
- ❌ "Enable email confirmations" 체크 해제
- ❌ "Enable email change confirmations" 체크 해제  
- ❌ "Secure email change" 체크 해제

## 📝 주의사항
- 이 설정들은 개발/테스트용입니다
- 프로덕션에서는 보안 설정을 다시 활성화하세요