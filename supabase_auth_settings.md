# Supabase Authentication 설정 가이드

## 1. Authentication Settings 수정
Supabase Dashboard > Authentication > Settings에서:

### General Settings
- **Site URL**: `https://your-vercel-domain.vercel.app` (실제 Vercel 도메인)
- **Additional Redirect URLs**: 
  ```
  https://your-vercel-domain.vercel.app
  https://your-vercel-domain.vercel.app/login
  http://localhost:5090
  http://localhost:5090/login
  ```

### Email Settings
- **Enable email confirmations**: ❌ **체크 해제** (개발용)
- **Enable email change confirmations**: ❌ **체크 해제** (개발용)
- **Secure email change**: ❌ **체크 해제** (개발용)

### Password Settings
- **Minimum password length**: 6
- **Password requirements**: 모두 체크 해제 (개발용)

### Advanced Settings
- **JWT expiry**: 3600 (1시간)
- **Refresh token rotation**: ✅ 체크
- **Reuse interval**: 10
- **Additional factor timeout**: 600

## 2. Database Settings 확인
Supabase Dashboard > Settings > Database에서:

### Connection Pooling
- **Pool Mode**: Session
- **Pool Size**: 15
- **Max Client Connections**: 200

## 3. API Settings 확인
Supabase Dashboard > Settings > API에서:
- **Auto-generated API documentation** 확인
- **anon key**와 **service_role key** 값 확인

## 4. 문제 해결 순서
1. SQL 스크립트 실행 (`database_complete_fix.sql`)
2. Authentication 설정 변경
3. Vercel 환경변수 재설정
4. Vercel 재배포
5. 테스트

## 5. 디버깅 팁
- Browser Dev Tools > Network 탭에서 실제 요청 확인
- Supabase Dashboard > Logs에서 에러 로그 확인
- Authentication > Users에서 생성된 사용자 확인