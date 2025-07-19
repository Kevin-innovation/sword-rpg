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
  
  @keyframes subtleShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-1px); }
    75% { transform: translateX(1px); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes scan {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
  
  @keyframes sweep {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(200%) rotate(45deg); }
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes spinReverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
  
  @keyframes explode {
    0% { transform: scale(0); opacity: 1; }
    100% { transform: scale(3); opacity: 0; }
  }
  
  @keyframes implode {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(0.3); opacity: 0; }
  }
  
  @keyframes cosmic {
    0% { transform: rotate(0deg) scale(1); opacity: 0.8; }
    25% { transform: rotate(90deg) scale(1.1); opacity: 1; }
    50% { transform: rotate(180deg) scale(1.2); opacity: 0.9; }
    75% { transform: rotate(270deg) scale(1.1); opacity: 1; }
    100% { transform: rotate(360deg) scale(1); opacity: 0.8; }
  }
  
  @keyframes aurora {
    0% { transform: translateX(-100%) rotate(0deg); opacity: 0; }
    25% { transform: translateX(-50%) rotate(180deg); opacity: 1; }
    50% { transform: translateX(0%) rotate(360deg); opacity: 0.8; }
    75% { transform: translateX(50%) rotate(540deg); opacity: 1; }
    100% { transform: translateX(100%) rotate(720deg); opacity: 0; }
  }
  
  @keyframes plasma {
    0% { transform: scale(0.8) rotate(0deg); opacity: 0.3; }
    33% { transform: scale(1.2) rotate(120deg); opacity: 0.8; }
    66% { transform: scale(0.9) rotate(240deg); opacity: 0.6; }
    100% { transform: scale(0.8) rotate(360deg); opacity: 0.3; }
  }
  
  @keyframes hologram {
    0% { transform: skewX(0deg) translateZ(0); opacity: 0.7; }
    25% { transform: skewX(5deg) translateZ(10px); opacity: 1; }
    50% { transform: skewX(-5deg) translateZ(20px); opacity: 0.8; }
    75% { transform: skewX(3deg) translateZ(10px); opacity: 1; }
    100% { transform: skewX(0deg) translateZ(0); opacity: 0.7; }
  }
  
  @keyframes vortex {
    0% { transform: rotate(0deg) scale(1); border-radius: 50%; }
    25% { transform: rotate(90deg) scale(1.1); border-radius: 30%; }
    50% { transform: rotate(180deg) scale(1.2); border-radius: 20%; }
    75% { transform: rotate(270deg) scale(1.1); border-radius: 30%; }
    100% { transform: rotate(360deg) scale(1); border-radius: 50%; }
  }
  
  @keyframes lightning {
    0% { transform: translateX(0) rotate(0deg); opacity: 0; }
    10% { transform: translateX(-10px) rotate(45deg); opacity: 1; }
    20% { transform: translateX(10px) rotate(-45deg); opacity: 0.8; }
    30% { transform: translateX(-5px) rotate(90deg); opacity: 1; }
    40% { transform: translateX(5px) rotate(-90deg); opacity: 0.6; }
    50% { transform: translateX(0) rotate(180deg); opacity: 1; }
    100% { transform: translateX(0) rotate(360deg); opacity: 0; }
  }
  
  @keyframes starBurst {
    0% { transform: scale(0) rotate(0deg); opacity: 0; }
    20% { transform: scale(1) rotate(72deg); opacity: 1; }
    40% { transform: scale(1.2) rotate(144deg); opacity: 0.8; }
    60% { transform: scale(1.1) rotate(216deg); opacity: 1; }
    80% { transform: scale(1.3) rotate(288deg); opacity: 0.6; }
    100% { transform: scale(0) rotate(360deg); opacity: 0; }
  }
  
  .animate-subtle-shake { animation: subtleShake 2s ease-in-out infinite; }
  .animate-float { animation: float 3s ease-in-out infinite; }
  .animate-scan { animation: scan 2s ease-in-out infinite; }
  .animate-sweep { animation: sweep 2s ease-in-out infinite; }
  .animate-twinkle { animation: twinkle 1.5s ease-in-out infinite; }
  .animate-spin-slow { animation: spinSlow 4s linear infinite; }
  .animate-spin-reverse { animation: spinReverse 6s linear infinite; }
  .animate-explode { animation: explode 0.6s ease-out forwards; }
  .animate-implode { animation: implode 0.6s ease-in forwards; }
  .animate-cosmic { animation: cosmic 8s ease-in-out infinite; }
  .animate-aurora { animation: aurora 6s ease-in-out infinite; }
  .animate-plasma { animation: plasma 4s ease-in-out infinite; }
  .animate-hologram { animation: hologram 3s ease-in-out infinite; }
  .animate-vortex { animation: vortex 5s ease-in-out infinite; }
  .animate-lightning { animation: lightning 2s ease-in-out infinite; }
  .animate-star-burst { animation: starBurst 3s ease-in-out infinite; }
`;

export default function SwordDisplay() {
  const swordLevel = useGameState((s) => s.swordLevel);
  const prevLevel = useRef(swordLevel);
  const controls = useAnimation();
  
  // 추가 상태 변수
  const [result, setResult] = React.useState<null | "success" | "fail">(null);
  
  // 결과 상태 관리
  React.useEffect(() => {
    if (swordLevel > prevLevel.current) {
      setResult("success");
      setTimeout(() => setResult(null), 2000);
    } else if (swordLevel === 0 && prevLevel.current > 0) {
      setResult("fail");
      setTimeout(() => setResult(null), 2000);
    }
  }, [swordLevel]);

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
  
  // 새로운 헬퍼 함수들
  const getAuraEffect = () => {
    if (swordLevel >= 20) return "drop-shadow-[0_0_60px_rgba(255,0,128,0.8)] filter brightness-110";
    if (swordLevel >= 15) return "drop-shadow-[0_0_40px_rgba(139,92,246,0.8)] filter brightness-108";
    if (swordLevel >= 10) return "drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] filter brightness-106";
    if (swordLevel >= 5) return "drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] filter brightness-104";
    return "drop-shadow-lg";
  };
  
  const getParticleCount = () => {
    if (swordLevel >= 20) return 32;
    if (swordLevel >= 15) return 24;
    if (swordLevel >= 10) return 16;
    if (swordLevel >= 5) return 8;
    return 0;
  };
  
  const getFloatingRunes = () => {
    if (swordLevel >= 20) return ['⚡', '🔥', '❄️', '🌟', '💫', '✨'];
    if (swordLevel >= 15) return ['⚡', '🔥', '❄️', '🌟'];
    if (swordLevel >= 10) return ['⚡', '🔥', '❄️'];
    if (swordLevel >= 5) return ['⚡', '🔥'];
    return [];
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
        {/* 검 이미지 - 모든 효과 통합 */}
        <div className="relative mb-4 w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
          
          {/* 우주적 배경 효과 (20강+) */}
          {swordLevel >= 20 && (
            <div className="absolute -inset-8 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-radial from-purple-900/40 via-pink-900/30 via-blue-900/20 to-transparent animate-cosmic rounded-full"></div>
              <div className="absolute w-3/4 h-3/4 bg-gradient-radial from-yellow-400/20 via-orange-500/15 to-transparent animate-plasma rounded-full"></div>
            </div>
          )}
          
          {/* 오로라 효과 (18강+) */}
          {swordLevel >= 18 && (
            <div className="absolute -inset-6 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-blue-500/30 via-purple-600/20 to-pink-500/20 animate-aurora"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-cyan-400/15 via-violet-500/25 to-yellow-400/15 animate-aurora" style={{animationDelay: '2s'}}></div>
            </div>
          )}
          
          {/* 펄스 웨이브 효과 */}
          {swordLevel >= 5 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-blue-400/20 rounded-full animate-ping"></div>
              <div className="absolute w-16 h-16 bg-purple-400/20 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute w-12 h-12 bg-pink-400/20 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              {/* 추가 펄스 (15강+) */}
              {swordLevel >= 15 && (
                <>
                  <div className="absolute w-24 h-24 bg-yellow-400/15 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                  <div className="absolute w-28 h-28 bg-cyan-400/10 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
                </>
              )}
            </div>
          )}
          
          {/* 회전하는 에너지 링 */}
          {swordLevel >= 5 && (
            <div className="absolute inset-0 animate-spin-slow">
              <div className="w-full h-full rounded-full border-2 border-blue-400/30 border-dashed"></div>
            </div>
          )}
          {swordLevel >= 10 && (
            <div className="absolute inset-0 animate-spin-reverse">
              <div className="w-full h-full rounded-full border border-purple-400/40 border-dotted"></div>
            </div>
          )}
          {swordLevel >= 15 && (
            <div className="absolute inset-0 animate-spin-slow" style={{animationDuration: '3s'}}>
              <div className="w-full h-full rounded-full border border-pink-400/50 border-double"></div>
            </div>
          )}
          
          {/* 에너지 충전 효과 */}
          {swordLevel >= 10 && (
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent rotate-45 animate-sweep"></div>
            </div>
          )}
          
          {/* 홀로그램 스캔 효과 */}
          {swordLevel >= 15 && (
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent -skew-x-12 animate-scan"></div>
            </div>
          )}
          
          {/* 강화 성공/실패 특수 효과 */}
          {result === "success" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full bg-gradient-radial from-yellow-400/80 via-orange-500/60 to-transparent animate-explode rounded-full"></div>
            </div>
          )}
          {result === "fail" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full bg-gradient-radial from-red-500/80 via-gray-500/60 to-transparent animate-implode rounded-full"></div>
            </div>
          )}
          
          {/* 플로팅 룬 문자 */}
          {getFloatingRunes().map((rune, i) => (
            <div key={`rune-${i}`} 
                 className="absolute text-lg animate-float opacity-60 pointer-events-none"
                 style={{
                   top: `${20 + i * 12}%`,
                   left: `${10 + i * 15}%`,
                   animationDelay: `${i * 0.5}s`
                 }}>
              {rune}
            </div>
          ))}
          
          {/* 트윙클 파티클 */}
          {Array.from({length: getParticleCount()}).map((_, i) => (
            <div key={`particle-${i}`} 
                 className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-twinkle pointer-events-none" 
                 style={{
                   top: `${Math.random() * 100}%`,
                   left: `${Math.random() * 100}%`,
                   animationDelay: `${Math.random() * 2}s`
                 }} />
          ))}
          
          {/* 검 이미지 (메인) */}
          <div className={`select-none transition-all duration-500 ${getSwordStyle()} relative z-10`}>
            <img 
              src={`/images/swords/${(() => {
                if (swordLevel <= 13) return Math.min(swordLevel + 1, 14);
                // 14강 이상: 15.png, 16.png, 17.png, 18.png, 19.png 순환
                return 15 + ((swordLevel - 14) % 5);
              })()}.png`} 
              alt={swordNames[swordLevel] || "미지의 검"} 
              className={`w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto transition-all duration-300 ${getAuraEffect()} ${
                swordLevel >= 15 ? 'animate-subtle-shake' : ''
              }`}
              onError={(e) => {
                e.currentTarget.src = "/sword_img/1.svg";
              }}
            />
          </div>
        </div>
        
        {/* CSS 스타일 주입 */}
        <style dangerouslySetInnerHTML={{ __html: particleStyles }} />
        
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