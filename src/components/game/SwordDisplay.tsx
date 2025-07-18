import React, { useEffect, useRef } from "react";
import { useGameState } from "@/store/useGameState";
import { motion, useAnimation } from "framer-motion";
import { calculateSwordSellPrice } from "@/lib/gameLogic";

// CSS 애니메이션 정의
const particleStyles = `
  @keyframes convergeIn {
    0% {
      transform: rotate(var(--rotation)) translateY(var(--distance)) translate(-50%, -50%) scale(0);
      opacity: 0;
    }
    20% {
      opacity: 1;
      transform: rotate(var(--rotation)) translateY(var(--distance)) translate(-50%, -50%) scale(1);
    }
    80% {
      opacity: 1;
      transform: rotate(var(--rotation)) translateY(-8px) translate(-50%, -50%) scale(0.8);
    }
    100% {
      opacity: 0;
      transform: rotate(var(--rotation)) translateY(0px) translate(-50%, -50%) scale(0);
    }
  }
`;

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

  // 강화 단계에 따른 검 색상과 효과 (10단계 세분화)
  const getSwordStyle = () => {
    if (swordLevel >= 20) return "hue-rotate-300 saturate-200 brightness-125 drop-shadow-2xl contrast-125"; // 무지개빛 - 신화
    if (swordLevel >= 18) return "hue-rotate-270 saturate-150 brightness-110 drop-shadow-2xl contrast-110"; // 보라색 - 전설
    if (swordLevel >= 16) return "hue-rotate-240 saturate-150 brightness-110 drop-shadow-xl contrast-110"; // 진보라 - 고대
    if (swordLevel >= 14) return "hue-rotate-200 saturate-125 brightness-105 drop-shadow-xl contrast-105"; // 인디고 - 마스터
    if (swordLevel >= 12) return "hue-rotate-180 saturate-125 brightness-105 drop-shadow-lg contrast-105"; // 파란색 - 영웅
    if (swordLevel >= 10) return "hue-rotate-160 saturate-110 brightness-105 drop-shadow-lg"; // 하늘색 - 엘리트
    if (swordLevel >= 8) return "hue-rotate-120 saturate-110 brightness-105 drop-shadow-md"; // 에메랄드 - 상급
    if (swordLevel >= 6) return "hue-rotate-90 saturate-110 brightness-105 drop-shadow-md"; // 녹색 - 레어
    if (swordLevel >= 4) return "hue-rotate-60 saturate-110 brightness-105 drop-shadow-sm"; // 연두색 - 고급
    if (swordLevel >= 2) return "hue-rotate-30 saturate-110 brightness-105 drop-shadow-sm"; // 주황색 - 일반
    if (swordLevel >= 1) return "hue-rotate-15 saturate-105 brightness-102"; // 연주황 - 초급
    return ""; // 기본 색상
  };

  const getLevelColor = () => {
    if (swordLevel >= 20) return "text-transparent bg-gradient-to-r from-purple-500 via-pink-500 via-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text animate-pulse drop-shadow-2xl";
    if (swordLevel >= 18) return "text-purple-600 drop-shadow-2xl animate-pulse";
    if (swordLevel >= 16) return "text-violet-600 drop-shadow-xl";
    if (swordLevel >= 14) return "text-indigo-600 drop-shadow-xl";
    if (swordLevel >= 12) return "text-blue-600 drop-shadow-lg";
    if (swordLevel >= 10) return "text-sky-600 drop-shadow-lg";
    if (swordLevel >= 8) return "text-emerald-600 drop-shadow-md";
    if (swordLevel >= 6) return "text-green-600 drop-shadow-md";
    if (swordLevel >= 4) return "text-lime-600 drop-shadow-sm";
    if (swordLevel >= 2) return "text-orange-600 drop-shadow-sm";
    if (swordLevel >= 1) return "text-amber-600";
    return "text-gray-600";
  };

  const getBackgroundGlow = () => {
    if (swordLevel >= 20) return "bg-gradient-to-r from-purple-500/30 via-pink-500/30 via-red-500/30 via-yellow-500/30 via-green-500/30 via-blue-500/30 to-purple-500/30";
    if (swordLevel >= 18) return "bg-purple-500/30";
    if (swordLevel >= 16) return "bg-violet-500/25";
    if (swordLevel >= 14) return "bg-indigo-500/25";
    if (swordLevel >= 12) return "bg-blue-500/25";
    if (swordLevel >= 10) return "bg-sky-500/20";
    if (swordLevel >= 8) return "bg-emerald-500/20";
    if (swordLevel >= 6) return "bg-green-500/20";
    if (swordLevel >= 4) return "bg-lime-500/15";
    if (swordLevel >= 2) return "bg-orange-500/15";
    if (swordLevel >= 1) return "bg-amber-500/15";
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
          {/* 고급 레벨에서 추가 오라 효과 */}
          {swordLevel >= 15 && (
            <div className="absolute -inset-8 pointer-events-none">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`aura-${i}`}
                  className={`absolute w-full h-full rounded-full border-2 animate-ping ${
                    swordLevel >= 20 ? 'border-purple-400/20' :
                    'border-purple-500/30'
                  }`}
                  style={{
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '2s'
                  }}
                ></div>
              ))}
            </div>
          )}
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
          {/* CSS 스타일 주입 */}
          <style dangerouslySetInnerHTML={{ __html: particleStyles }} />
          
          {/* 강화 성공시 파티클 효과 - 안쪽으로 모이는 효과 */}
          {swordLevel > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{overflow: 'visible'}}>
              {/* 기본 파티클 - 안쪽으로 모이는 애니메이션 */}
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={`basic-${i}`}
                  className={`absolute w-1.5 h-1.5 rounded-full ${
                    swordLevel >= 18 ? 'bg-purple-400' :
                    swordLevel >= 15 ? 'bg-violet-400' :
                    swordLevel >= 10 ? 'bg-blue-400' :
                    swordLevel >= 5 ? 'bg-green-400' :
                    'bg-yellow-400'
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    '--rotation': `${i * 22.5}deg`,
                    '--distance': '-64px',
                    animation: `convergeIn 4s infinite ease-in-out`,
                    animationDelay: `${i * 0.2}s`
                  } as React.CSSProperties}
                ></div>
              ))}
              
              {/* 고급 파티클 (레벨 5+) - 더 촘촘하게 */}
              {swordLevel >= 5 && Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={`advanced-${i}`}
                  className={`absolute w-1 h-1 rounded-full opacity-80 ${
                    swordLevel >= 18 ? 'bg-purple-300' :
                    swordLevel >= 15 ? 'bg-violet-300' :
                    swordLevel >= 10 ? 'bg-blue-300' :
                    'bg-green-300'
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    '--rotation': `${i * 15}deg`,
                    '--distance': '-80px',
                    animation: `convergeIn 5s infinite ease-in-out`,
                    animationDelay: `${i * 0.15}s`
                  } as React.CSSProperties}
                ></div>
              ))}
              
              {/* 전설 파티클 (레벨 15+) */}
              {swordLevel >= 15 && Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={`legendary-${i}`}
                  className={`absolute w-2 h-2 rounded-full ${
                    swordLevel >= 18 ? 'bg-purple-500' : 'bg-violet-500'
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    '--rotation': `${i * 11.25}deg`,
                    '--distance': '-96px',
                    animation: `convergeIn 6s infinite ease-in-out`,
                    animationDelay: `${i * 0.12}s`
                  } as React.CSSProperties}
                ></div>
              ))}
              
              {/* 신화 파티클 (레벨 20+) - 가장 촘촘하게 */}
              {swordLevel >= 20 && Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={`mythic-${i}`}
                  className="absolute w-0.5 h-3 bg-gradient-to-t from-purple-500 via-pink-400 to-yellow-300 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    '--rotation': `${i * 7.5}deg`,
                    '--distance': '-112px',
                    animation: `convergeIn 7s infinite ease-in-out`,
                    animationDelay: `${i * 0.1}s`
                  } as React.CSSProperties}
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
          
          {/* 현재 가격 표시 */}
          <div className="text-sm font-semibold text-gray-700 mt-1">
            {swordLevel > 0 ? `현재 가격: ${calculateSwordSellPrice(swordLevel).toLocaleString()} G` : "판매 불가"}
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
        
        {/* 강화 단계 진행바 - 더 화려하게 */}
        <div className="mt-3 w-40 bg-gray-800 rounded-full h-3 overflow-hidden relative shadow-lg">
          <div 
            className={`h-full transition-all duration-500 rounded-full relative overflow-hidden ${
              swordLevel >= 18 ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600' :
              swordLevel >= 15 ? 'bg-gradient-to-r from-purple-500 to-violet-600' :
              swordLevel >= 10 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
              swordLevel >= 5 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
              'bg-gradient-to-r from-orange-500 to-red-500'
            }`}
            style={{ width: `${Math.min((swordLevel % 5) * 20 + 20, 100)}%` }}
          >
            {/* 빛나는 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
          {/* 반짝이는 효과 */}
          {swordLevel >= 10 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-ping"></div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 