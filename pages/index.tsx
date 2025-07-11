import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import GameBoard from "@/components/game/GameBoard";
import SwordDisplay from "@/components/game/SwordDisplay";
import StatsPanel from "@/components/game/StatsPanel";
import EnhanceButton from "@/components/game/EnhanceButton";
import Inventory from "@/components/ui/Inventory";
import Shop from "@/components/ui/Shop";
import Ranking from "@/components/ui/Ranking";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* 배경 애니메이션 요소들 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl animate-ping"></div>
      </div>

      <main className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-full md:max-w-lg space-y-6 md:space-y-8">
          <GameBoard>
            <SwordDisplay />
            <StatsPanel />
            <EnhanceButton />
          </GameBoard>
          {/* <Ranking /> */}
          <Inventory />
          <Shop />
        </div>
        
        <footer className="mt-8 text-center">
          <p className="text-sm text-white/60 backdrop-blur-sm bg-black/20 px-4 py-2 rounded-full">
            ⚔️ {new Date().getFullYear()} 검 강화 게임 - 모바일 최적화 ⚔️
          </p>
        </footer>
      </main>
    </div>
  );
} 