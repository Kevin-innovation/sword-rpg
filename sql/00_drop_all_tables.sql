-- 00_drop_all_tables.sql
-- 모든 테이블, 함수, 트리거, 정책 완전 삭제(초기화용)

DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS rankings CASCADE;
DROP TABLE IF EXISTS swords CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- 필요시 추가 테이블/뷰/함수/트리거/정책도 여기에 추가 