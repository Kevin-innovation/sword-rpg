import * as React from "react";
import { useRealTimeRanking } from "@/hooks/useRealTimeRanking";

const Ranking = () => {
  const { ranking, refreshRanking, isLoading } = useRealTimeRanking();
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-slate-200/50 p-6 md:p-8 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-center text-gradient bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">실시간 랭킹</h2>
        <button
          onClick={refreshRanking}
          disabled={isLoading}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? '로딩...' : '새로고침'}
        </button>
      </div>
      <table className="w-full text-sm md:text-base text-center">
        <thead>
          <tr className="text-slate-500 border-b">
            <th className="py-2 md:py-3">순위</th>
            <th className="py-2 md:py-3">닉네임</th>
            <th className="py-2 md:py-3">최고 강화</th>
            <th className="py-2 md:py-3">골드</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  랭킹 로딩 중...
                </div>
              </td>
            </tr>
          ) : ranking.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-slate-400">
                랭킹 데이터가 없습니다
              </td>
            </tr>
          ) : (
            ranking.map((entry, idx) => (
              <tr key={`${entry.nickname}-${idx}`} className={idx === 0 ? "bg-yellow-100 font-bold" : ""}>
                <td className="py-2 md:py-3">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                </td>
                <td className="py-2 md:py-3">{entry.nickname}</td>
                <td className="py-2 md:py-3">+{entry.maxLevel}</td>
                <td className="py-2 md:py-3">{entry.totalGold.toLocaleString()} G</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Ranking; 