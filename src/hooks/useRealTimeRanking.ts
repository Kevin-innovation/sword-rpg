// 실시간 랭킹 훅 구현
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type RankingEntry = {
  nickname: string;
  maxLevel: number;
  totalGold: number;
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
          .select("id, nickname, money")
          .in("id", userIds);
        
        if (userError) {
          console.error("User info fetch error:", userError);
          return;
        }
        
        // 데이터 매핑
        const mapped = swords.map(sword => {
          const user = users?.find(u => u.id === sword.user_id);
          return {
            nickname: user?.nickname || "익명",
            maxLevel: sword.level || 0,
            totalGold: user?.money || 0,
          };
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