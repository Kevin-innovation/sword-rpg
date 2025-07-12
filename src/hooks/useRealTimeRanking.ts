// 실시간 랭킹 훅 구현
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
      if (isLoading) return; // 이미 로딩 중이면 중단
      
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
      }
    };
    
    fetchRanking();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return ranking;
} 