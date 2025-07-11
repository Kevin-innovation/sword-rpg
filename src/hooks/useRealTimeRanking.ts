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
          .from("swords")
          .select(`
            level,
            users!inner(nickname, money)
          `)
          .order("level", { ascending: false })
          .limit(10);
        
        if (error) {
          console.error("Ranking fetch error:", error);
          return;
        }
        
        const mapped = (data || []).map((row: any) => ({
          nickname: row.users?.nickname || "익명",
          maxLevel: row.level || 0,
          totalGold: row.users?.money || 0,
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