// 실시간 랭킹 훅 구현
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useGameState } from "@/store/useGameState";

// Global protection against spam requests
let isGloballyLoading = false;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 3000; // 3초로 단축 (너무 길었음)

export type RankingEntry = {
  nickname: string;
  maxLevel: number;
  totalGold: number;
  fragments: number;
};

export function useRealTimeRanking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useGameState((state) => state.user);
  const rankingRefreshTrigger = useGameState((state) => state.rankingRefreshTrigger);

  const fetchRanking = async (forceRefresh = false) => {
    if (isLoading || isGloballyLoading) return;
    
    // 강제 새로고침이 아니면 쿨다운 체크
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime < FETCH_COOLDOWN)) {
      console.log('Ranking fetch cooldown active');
      return;
    }
    
    isGloballyLoading = true;
    lastFetchTime = now;
    setIsLoading(true);
      try {
        // rankings 테이블에서 최고 레벨 기록 조회
        const { data: rankings, error: rankingError } = await supabase
          .from("rankings")
          .select("user_id, max_sword_level, total_gold")
          .order("max_sword_level", { ascending: false })
          .order("total_gold", { ascending: false })
          .limit(10);
        
        if (rankingError || !rankings) {
          console.error("Ranking fetch error:", rankingError);
          return;
        }
        
        // 사용자 정보 별도 조회
        const userIds = rankings.map(r => r.user_id);
        const { data: users, error: userError } = await supabase
          .from("users")
          .select("id, email, fragments")
          .in("id", userIds);
        
        if (userError) {
          console.error("User info fetch error:", userError);
          return;
        }
        
        // 데이터 매핑 및 정렬
        const mapped = rankings.map(ranking => {
          const user = users?.find(u => u.id === ranking.user_id);
          return {
            nickname: user?.email?.split('@')[0] || "익명",
            maxLevel: ranking.max_sword_level || 0,
            totalGold: ranking.total_gold || 0,
            fragments: user?.fragments || 0,
          };
        }).sort((a, b) => {
          // 1순위: 최고 레벨, 2순위: 골드
          if (a.maxLevel !== b.maxLevel) {
            return b.maxLevel - a.maxLevel;
          }
          return b.totalGold - a.totalGold;
        });
        
        if (isMounted) {
          setRanking(mapped);
        }
      } catch (err) {
        console.error("Ranking error:", err);
      } finally {
        setIsLoading(false);
        isGloballyLoading = false;
      }
  };

  // 컴포넌트 마운트시 초기 로드
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRanking();
    }, 500); // 500ms로 단축
    
    return () => clearTimeout(timeoutId);
  }, []);

  // 사용자 로그인/로그아웃시 랭킹 새로고침
  useEffect(() => {
    if (user?.id) {
      console.log('User logged in, refreshing ranking');
      fetchRanking(true);
    }
  }, [user?.id]);

  // 랭킹 새로고침 트리거 감지 (강화 성공 후 등)
  useEffect(() => {
    if (rankingRefreshTrigger > 0) {
      console.log('Ranking refresh triggered:', rankingRefreshTrigger);
      fetchRanking(true);
    }
  }, [rankingRefreshTrigger]);

  // 수동 새로고침 함수도 반환
  return { ranking, refreshRanking: () => fetchRanking(true), isLoading };
} 