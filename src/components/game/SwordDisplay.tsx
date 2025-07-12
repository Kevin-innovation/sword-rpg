import React, { useEffect, useRef } from "react";
import { useGameState } from "@/store/useGameState";
import { motion, useAnimation } from "framer-motion";

export default function SwordDisplay() {
  const swordLevel = useGameState((s) => s.swordLevel);
  const prevLevel = useRef(swordLevel);
  const controls = useAnimation();

  useEffect(() => {
    if (swordLevel > prevLevel.current) {
      // 성공 애니메이션
      controls.start({ 
        scale: [1, 1.3, 1], 
        rotate: [0, -10, 10, 0],
        boxShadow: [
          "0 0 0px rgba(34, 197, 94, 0)", 
          "0 0 50px rgba(34, 197, 94, 0.8)", 
          "0 0 0px rgba(34, 197, 94, 0)"
        ],
        transition: { duration: 0.8 }
      });
    } else if (swordLevel === 0 && prevLevel.current > 0) {
      // 실패 애니메이션
      controls.start({ 
        x: [0, -20, 20, -10, 10, 0], 
        scale: [1, 0.9, 1],
        filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(0deg)"],
        transition: { duration: 0.6 }
      });
    }
    prevLevel.current = swordLevel;
  }, [swordLevel, controls]);

  // 강화 단계에 따른 검 색상과 효과
  const getSwordStyle = () => {
    if (swordLevel >= 15) return "hue-rotate-270 drop-shadow-lg"; // 보라색 - 전설
    if (swordLevel >= 10) return "hue-rotate-180 drop-shadow-lg"; // 파란색 - 영웅
    if (swordLevel >= 5) return "hue-rotate-90 drop-shadow-md"; // 녹색 - 레어
    if (swordLevel >= 1) return "hue-rotate-45 drop-shadow-sm"; // 주황색 - 일반
    return ""; // 기본 색상
  };

  const getLevelColor = () => {
    if (swordLevel >= 15) return "text-purple-600 drop-shadow-lg";
    if (swordLevel >= 10) return "text-blue-600 drop-shadow-lg";
    if (swordLevel >= 5) return "text-green-600 drop-shadow-md";
    if (swordLevel >= 1) return "text-orange-600 drop-shadow-sm";
    return "text-gray-600";
  };

  const getBackgroundGlow = () => {
    if (swordLevel >= 15) return "bg-purple-500/20";
    if (swordLevel >= 10) return "bg-blue-500/20";
    if (swordLevel >= 5) return "bg-green-500/20";
    if (swordLevel >= 1) return "bg-orange-500/20";
    return "bg-gray-500/10";
  };

  // 검 강화 레벨별 이름 테이블
  const swordNames = [
    "녹슨 검",      // +0
    "견고한 검",    // +1
    "빛나는 검",    // +2
    "기사도의 검",  // +3
    "불꽃의 검",    // +4
    "용맹의 검",    // +5
    "신비의 검",    // +6
    "영웅의 검",    // +7
    "전설의 검",    // +8
    "신화의 검",    // +9
    "초월의 검",    // +10
    "심연의 검",    // +11
    "창공의 검",    // +12
    "태초의 검",    // +13
    "무한의 검",    // +14
    "신성의 검",    // +15
    "절대자의 검",  // +16
    "운명의 검",    // +17
    "파멸의 검",    // +18
    "창세의 검",    // +19
    "영원의 검",    // +20
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full relative">
      {/* 배경 글로우 효과 */}
      <div className={`absolute inset-0 ${getBackgroundGlow()} rounded-full blur-3xl scale-150 animate-pulse`}></div>
      
      <motion.div 
        animate={controls} 
        className="flex flex-col items-center justify-center relative z-10"
      >
        {/* 검 이미지 */}
        <div className="relative mb-4">
          <div className={`select-none transition-all duration-500 ${getSwordStyle()}`}>
            <img 
              src={`/images/swords/${Math.min(swordLevel + 1, 10)}.png`} 
              alt={swordNames[swordLevel] || "미지의 검"} 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto drop-shadow-lg"
              onError={(e) => {
                // 이미지 로드 실패시 폴백
                e.currentTarget.src = "/sword_img/1.svg";
              }}
            />
          </div>
          {/* 강화 성공시 파티클 효과 */}
          {swordLevel > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{overflow: 'visible'}}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${i * 60}deg) translateY(-48px) translate(-50%, -50%)`,
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
        {/* 강화 레벨 및 검 이름 표시 */}
        <div className="relative flex flex-col items-center">
          <div className={`font-black text-2xl sm:text-3xl transition-all duration-500 ${getLevelColor()}`}>
            +{swordLevel} {swordNames[swordLevel] || "미지의 검"}
          </div>
          
          {/* 레벨에 따른 타이틀 */}
          {swordLevel >= 15 && (
            <div className="text-xs text-purple-500 font-bold tracking-wider animate-pulse">
              ✨ 전설의 검 ✨
            </div>
          )}
          {swordLevel >= 10 && swordLevel < 15 && (
            <div className="text-xs text-blue-500 font-bold tracking-wider">
              ⭐ 영웅의 검 ⭐
            </div>
          )}
          {swordLevel >= 5 && swordLevel < 10 && (
            <div className="text-xs text-green-500 font-bold tracking-wider">
              💎 레어 검 💎
            </div>
          )}
        </div>
        
        {/* 강화 단계 진행바 */}
        <div className="mt-3 w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
            style={{ width: `${(swordLevel % 5) * 20 + 20}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {swordLevel % 5 + 1}/5 단계
        </div>
      </motion.div>
    </div>
  );
} 