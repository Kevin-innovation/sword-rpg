import React from "react";
import { useGameState } from "@/store/useGameState";

export default function StatsPanel() {
  const money = useGameState((s) => s.money);
  const fragments = useGameState((s) => s.fragments);
  const enhanceChance = useGameState((s) => s.enhanceChance);
  const enhanceCost = useGameState((s) => s.enhanceCost);
  
  const stats = [
    { 
      icon: "💰", 
      label: "보유 골드", 
      value: `${money.toLocaleString()} G`, 
      color: "from-yellow-400 to-orange-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800"
    },
    { 
      icon: "🧩", 
      label: "강화 조각", 
      value: fragments.toString(), 
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-800"
    },
    { 
      icon: "🎲", 
      label: "기본 성공 확률", 
      value: `${enhanceChance}%`, 
      color: "from-purple-400 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-800"
    },
    { 
      icon: "💸", 
      label: "강화 비용", 
      value: `${enhanceCost.toLocaleString()} G`, 
      color: "from-pink-400 to-pink-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-800"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-2xl p-4 border border-white/50 shadow-lg backdrop-blur-sm relative overflow-hidden group transition-all duration-300`}>
          {/* 글로우 효과 */}
          <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5 rounded-2xl`}></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs font-medium text-gray-600 opacity-80">{stat.label}</span>
            </div>
            <div className={`font-bold text-sm ${stat.textColor} truncate`}>
              {stat.value}
            </div>
          </div>
          
          {/* 호버 효과 */}
          <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}></div>
        </div>
      ))}
    </div>
  );
} 