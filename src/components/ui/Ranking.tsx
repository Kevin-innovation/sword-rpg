import * as React from "react";
import { useRealTimeRanking } from "@/hooks/useRealTimeRanking";

const Ranking = () => {
  const ranking = useRealTimeRanking();
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-slate-200/50 p-6 md:p-8 w-full">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-gradient bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">실시간 랭킹</h2>
      <table className="w-full text-sm md:text-base text-center">
        <thead>
          <tr className="text-slate-500 border-b">
            <th className="py-2 md:py-3">순위</th>
            <th className="py-2 md:py-3">닉네임</th>
            <th className="py-2 md:py-3">최고 강화</th>
            <th className="py-2 md:py-3">골드</th>
            <th className="py-2 md:py-3">조각</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 text-center text-slate-400">
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
                <td className="py-2 md:py-3">{entry.fragments || 0}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Ranking; 