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
      const { data, error } = await supabase
        .from("rankings")
        .select("max_sword_level, total_gold, users(nickname)")
        .order("max_sword_level", { ascending: false })
        .order("total_gold", { ascending: false })
        .limit(10);
      if (error) return;
      const mapped = (data || []).map((row: any) => ({
        nickname: row.users?.nickname || "-",
        maxLevel: row.max_sword_level,
        totalGold: row.total_gold,
      }));
      setRanking(mapped);
    };
    fetchRanking();
  }, []);

  return ranking;
} 