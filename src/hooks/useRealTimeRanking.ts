// 실시간 랭킹 훅 구현
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Global protection against spam requests
let isGloballyLoading = false;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 10000; // 10초 쿨다운

export type RankingEntry = {
  nickname: string;
  maxLevel: number;
  totalGold: number;
  fragments: number;
};

export function useRealTimeRanking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchRanking = async () => {
      if (isLoading || isGloballyLoading) return; // 로딩 중이면 중단
      
      // 쿨다운 체크
      const now = Date.now();
      if (now - lastFetchTime < FETCH_COOLDOWN) {
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
        if (isMounted) {
          setIsLoading(false);
        }
        isGloballyLoading = false;
      }
    };
    
    // 1초 지연 후 랭킹 로드 (스팸 방지)
    const timeoutId = setTimeout(() => {
      fetchRanking();
    }, 1000);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return ranking;
} 