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
        const { data, error } = await supabase
          .from("users")
          .select(`
            nickname,
            money,
            fragments,
            swords!inner(level)
          `)
          .order("swords.level", { ascending: false })
          .limit(10);
        
        if (error) {
          console.error("Ranking fetch error:", error);
          return;
        }
        
        const mapped = (data || []).map((row: any) => ({
          nickname: row.nickname || "익명",
          maxLevel: row.swords?.level || 0,
          totalGold: row.money || 0,
        }));
        setRanking(mapped);
      } catch (err) {
        console.error("Ranking error:", err);
      }
    };
    fetchRanking();
  }, []);

  return ranking;
} 