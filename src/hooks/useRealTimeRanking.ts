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

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        // 단순화된 쿼리 - 조인 없이 별도로 조회
        const { data: swords, error: swordError } = await supabase
          .from("swords")
          .select("level, user_id")
          .order("level", { ascending: false })
          .limit(10);
        
        if (swordError || !swords) {
          console.error("Sword ranking fetch error:", swordError);
          return;
        }
        
        // 사용자 정보 별도 조회
        const userIds = swords.map(s => s.user_id);
        const { data: users, error: userError } = await supabase
          .from("users")
          .select("id, email, money, fragments")
          .in("id", userIds);
        
        if (userError) {
          console.error("User info fetch error:", userError);
          return;
        }
        
        // 데이터 매핑 및 정렬
        const mapped = swords.map(sword => {
          const user = users?.find(u => u.id === sword.user_id);
          return {
            nickname: user?.email?.split('@')[0] || "익명",
            maxLevel: sword.level || 0,
            totalGold: user?.money || 0,
            fragments: user?.fragments || 0,
          };
        }).sort((a, b) => {
          // 1순위: 최고 레벨, 2순위: 골드
          if (a.maxLevel !== b.maxLevel) {
            return b.maxLevel - a.maxLevel;
          }
          return b.totalGold - a.totalGold;
        });
        
        setRanking(mapped);
      } catch (err) {
        console.error("Ranking error:", err);
      }
    };
    fetchRanking();
  }, []);

  return ranking;
} 