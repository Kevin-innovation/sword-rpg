import React, { useState, useEffect } from "react";
import { useGameState } from "@/store/useGameState";
import { calculateEnhanceChance, calculateEnhanceCost, calculateFragmentsOnFail, calculateSwordSellPrice, FRAGMENT_BOOST_OPTIONS, canUseFragments, calculateBoostedChance } from "@/lib/gameLogic";
import { useGameData } from "@/hooks/useGameData";
import { apiRequest } from "@/lib/apiUtils";
import { motion } from "framer-motion";

export default function EnhanceButton() {
  const { money, swordLevel, setMoney, setSwordLevel, setEnhanceChance, setEnhanceCost, fragments, setFragments, refreshRanking } = useGameState();
  const { loading: dataLoading, updateUserData, updateSwordLevel } = useGameData();
  const [result, setResult] = useState<null | "success" | "fail">(null);
  const [anim, setAnim] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // 중복 요청 방지
  const [lastClickTime, setLastClickTime] = useState(0); // 디바운싱용
  const [isSelling, setIsSelling] = useState(false); // 판매 중 상태
  // 강화 게이지 애니메이션 상태
  const [showGauge, setShowGauge] = useState(false);
  const [gaugeProgress, setGaugeProgress] = useState(0);
  const [gaugeResult, setGaugeResult] = useState<'success' | 'fail' | null>(null);
  const items = useGameState((s) => s.items);
  const setItems = useGameState((s) => s.setItems);
  const foundSwords = useGameState((s) => s.foundSwords);
  const setFoundSwords = useGameState((s) => s.setFoundSwords);
  const loadUserAchievements = useGameState((s) => s.loadUserAchievements);
  const user = useGameState((s) => s.user);
  // 아이템 사용 상태
  const [useDoubleChance, setUseDoubleChance] = useState(false);
  const [useProtect, setUseProtect] = useState(false);
  const [useDiscount, setUseDiscount] = useState(false);
  // 조각 사용 상태
  const [selectedFragmentBoost, setSelectedFragmentBoost] = useState<number | null>(null);
  // 이스터에그: 7을 7번 연속 입력하면 77777골드 지급
  const [eggSeq, setEggSeq] = useState<number[]>([]);
  useEffect(() => {
    if (eggSeq.length >= 7 && eggSeq.slice(-7).every(n => n === 7)) {
      setMoney(money + 77777);
      setEggSeq([]);
      alert("77777 골드 이스터에그!");
    }
  }, [eggSeq]);
  // 키 입력 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "7") {
        setEggSeq(seq => [...seq, 7]);
      } else {
        setEggSeq([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEnhanceInternal = async () => {
    const now = Date.now();
    
    // 중복 요청 완전 차단 + 50ms 디바운싱으로 단축
    if (disabled || isProcessing || (now - lastClickTime < 50)) return;
    
    setLastClickTime(now);
    setIsProcessing(true);
    setDisabled(true);
    setAnim(true);
    
    if (!user?.id) {
      alert("로그인이 필요합니다!");
      setDisabled(false);
      setAnim(false);
      setIsProcessing(false);
      return;
    }

    // 강화 게이지 애니메이션 시작
    setShowGauge(true);
    setGaugeProgress(0);
    setGaugeResult(null);
    
    // 게이지가 천천히 올라가는 애니메이션 (1.5초)
    const gaugeInterval = setInterval(() => {
      setGaugeProgress(prev => {
        if (prev >= 100) {
          clearInterval(gaugeInterval);
          return 100;
        }
        return prev + 2; // 50번에 걸쳐 100%까지
      });
    }, 30); // 30ms마다 업데이트
    
    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentLevel: swordLevel,
          useDoubleChance,
          useProtect,
          useDiscount,
          useFragmentBoost: selectedFragmentBoost
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status}:`, errorText);
        throw new Error(`서버 오류 (${response.status})`);
      }
      
      const data = await response.json();
      if (data.error) {
        console.error('API Error:', data.error);
        alert(`오류: ${data.error}`);
        setDisabled(false);
        setAnim(false);
        return;
      }
      
      // 게이지 애니메이션 결과 표시
      if (data.success) {
        setGaugeResult('success');
        // 성공 시 게이지 완료 후 결과 처리
        setTimeout(() => {
          setSwordLevel(data.newLevel);
          setResult("success");
          // 성공시 업적 실시간 업데이트
          if (user?.id) {
            loadUserAchievements(user.id);
          }
          // 성공시 랭킹 새로고침 트리거
          refreshRanking();
        }, 500);
      } else {
        setGaugeResult('fail');
        // 실패 시 게이지가 급락한 후 결과 처리
        setTimeout(() => {
          setGaugeProgress(0); // 게이지 급락
        }, 200);
        setTimeout(() => {
          setSwordLevel(data.newLevel);
          setResult("fail");
          // 실패시 조각 업데이트
          if (data.fragmentsGained > 0) {
            setFragments(data.newFragments);
            alert(`강화 실패! 레벨 0으로 초기화되었지만 조각 ${data.fragmentsGained}개를 획득했습니다.`);
          } else {
            alert("강화 실패! 레벨 0으로 초기화");
          }
        }, 700);
      }
      
      // 돈과 조각 상태 업데이트
      if (data.newMoney !== undefined) setMoney(data.newMoney);
      if (data.newFragments !== undefined) setFragments(data.newFragments);
      
      // 아이템 수량 업데이트 (서버에서 받은 업데이트된 수량으로)
      if (data.updatedItems) {
        setItems({
          ...items,
          ...data.updatedItems
        });
      }
      
      // 조각 사용 상태 리셋
      setSelectedFragmentBoost(null);
      
      // API 응답 후 즉시 버튼 활성화 (애니메이션은 계속 유지)
      setDisabled(false);
      setIsProcessing(false);
      
    } catch (e) {
      console.error("강화 오류:", e);
      
      let errorMessage = "통신 오류가 발생했습니다";
      if (e.message.includes('timeout') || e.message.includes('aborted')) {
        errorMessage = "서버 응답 시간 초과";
      } else if (e.message.includes('network') || e.message.includes('fetch')) {
        errorMessage = "네트워크 연결 오류";
      } else if (e.message.includes('Client error')) {
        errorMessage = "요청 오류가 발생했습니다";
      } else if (e.message.includes('Server error')) {
        errorMessage = "서버 오류가 발생했습니다";
      }
      
      alert(errorMessage);
      setDisabled(false);
      setAnim(false);
      setIsProcessing(false);
    }
    
    // 게이지 애니메이션과 기존 애니메이션 종료 처리
    setTimeout(() => {
      setShowGauge(false);
      setGaugeProgress(0);
      setGaugeResult(null);
      setAnim(false);
      setResult(null);
    }, 2000); // 게이지 애니메이션이 완료된 후 정리
  };

  const handleEnhance = () => {
    handleEnhanceInternal();
  };

  const sellPrice = calculateSwordSellPrice(swordLevel);
  const handleSell = async () => {
    if (!user?.id) {
      alert('로그인이 필요합니다!');
      return;
    }
    
    if (swordLevel === 0) {
      alert('판매할 검이 없습니다.');
      return;
    }
    
    if (isSelling) return;
    
    setIsSelling(true);
    
    try {
      const response = await fetch('/api/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          swordLevel: swordLevel
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '판매 실패');
      }
      
      // 상태 업데이트
      setMoney(data.newMoney);
      setSwordLevel(data.newLevel);
      
      // 랭킹 새로고침 (골드 변경으로 인한)
      refreshRanking();
      
      alert(data.message || '판매 완료!');
      
    } catch (error) {
      console.error('판매 오류:', error);
      alert(error.message || '판매 중 오류가 발생했습니다.');
    } finally {
      setIsSelling(false);
    }
  };

  const cost = calculateEnhanceCost(swordLevel);
  const canAfford = money >= cost;

  return (
    <div className="w-full space-y-3">
      {/* 강화 정보 표시 */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-3 md:p-4 border border-slate-200">
        <div className="flex justify-between items-center text-xs md:text-sm text-slate-600 mb-1">
          <span>다음 강화</span>
          <span className={canAfford ? "text-green-600" : "text-red-500"}>
            {cost.toLocaleString()} G
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((money / cost) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2 md:gap-3">
        {/* 강화 게이지 애니메이션 */}
        {showGauge && (
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-200 rounded-full ${
                gaugeResult === 'success' 
                  ? 'bg-gradient-to-r from-green-400 to-green-600' 
                  : gaugeResult === 'fail'
                    ? 'bg-gradient-to-r from-red-400 to-red-600'
                    : 'bg-gradient-to-r from-blue-400 to-purple-600'
              }`}
              style={{ width: `${gaugeProgress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow">
                {gaugeResult === 'success' ? '성공!' : gaugeResult === 'fail' ? '실패!' : '강화 중...'}
              </span>
            </div>
            {/* 반짝이는 효과 */}
            {gaugeProgress > 0 && gaugeResult === null && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            )}
          </div>
        )}
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          className={`w-full relative p-5 md:p-6 rounded-2xl font-bold text-lg md:text-xl shadow-2xl transition-all duration-300 select-none overflow-hidden group
            ${result === "success" 
              ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white" 
              : result === "fail" 
                ? "bg-gradient-to-r from-red-400 to-red-500 text-white"
                : canAfford
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600"
                  : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600"
            }
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
          `}
          onClick={handleEnhance}
          disabled={disabled || !canAfford}
        >
          {/* 배경 효과 */}
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* 스파크 효과 */}
          {anim && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-ping"></div>
          )}
          
          <div className="relative z-10 flex items-center justify-center gap-2">
            {result === "success" ? (
              <>
                <span className="text-2xl">✨</span>
                <span>강화 성공!</span>
                <span className="text-2xl">✨</span>
              </>
            ) : result === "fail" ? (
              <>
                <span className="text-2xl">💥</span>
                <span>강화 실패</span>
                <span className="text-2xl">💥</span>
              </>
            ) : !canAfford ? (
              <>
                <span className="text-xl">🚫</span>
                <span>골드 부족</span>
              </>
            ) : (
              <>
                <span className="text-xl">⚔️</span>
                <span>강화하기</span>
                <span className="text-xl">⚡</span>
              </>
            )}
          </div>
          
          {/* 하단 그라데이션 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </motion.button>
        {/* 아이템 사용 UI */}
        <div className="flex gap-2 md:gap-3 w-full justify-between">
          <button
            className={`flex-1 px-2 md:px-3 py-1 md:py-2 rounded bg-blue-100 text-blue-700 text-xs md:text-sm font-semibold border border-blue-300 transition disabled:opacity-40 disabled:cursor-not-allowed ${useDoubleChance ? 'ring-2 ring-blue-400' : ''}`}
            disabled={items.doubleChance === 0 || disabled}
            onClick={() => setUseDoubleChance(v => !v)}
          >
            확률2배({items.doubleChance})
          </button>
          <button
            className={`flex-1 px-2 md:px-3 py-1 md:py-2 rounded bg-green-100 text-green-700 text-xs md:text-sm font-semibold border border-green-300 transition disabled:opacity-40 disabled:cursor-not-allowed ${useProtect ? 'ring-2 ring-green-400' : ''}`}
            disabled={items.protect === 0 || disabled}
            onClick={() => setUseProtect(v => !v)}
          >
            보호({items.protect})
          </button>
          <button
            className={`flex-1 px-2 md:px-3 py-1 md:py-2 rounded bg-yellow-100 text-yellow-700 text-xs md:text-sm font-semibold border border-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed ${useDiscount ? 'ring-2 ring-yellow-400' : ''}`}
            disabled={items.discount === 0 || disabled}
            onClick={() => setUseDiscount(v => !v)}
          >
            할인({items.discount})
          </button>
        </div>
        
        {/* 조각 사용 UI */}
        <div className="w-full">
          <div className="text-xs text-gray-600 mb-2 text-center">🧩 강화조각 사용 (보유: {fragments}개)</div>
          <div className="flex gap-1 md:gap-2 w-full justify-between">
            {FRAGMENT_BOOST_OPTIONS.map((option, index) => {
              const canUse = canUseFragments(fragments, option.fragments);
              const isSelected = selectedFragmentBoost === index;
              
              return (
                <button
                  key={index}
                  className={`flex-1 px-1 md:px-2 py-1 md:py-2 rounded text-[10px] md:text-xs font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected 
                      ? 'bg-purple-200 text-purple-800 border-purple-400 ring-2 ring-purple-400' 
                      : 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                  }`}
                  disabled={!canUse || disabled}
                  onClick={() => setSelectedFragmentBoost(isSelected ? null : index)}
                >
                  <div className="flex flex-col items-center">
                    <span>{option.boost}%</span>
                    <span className="text-[8px] md:text-[10px] opacity-70">({option.fragments}개)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {/* 판매하기 버튼 */}
        <button
          className={`w-full px-2 md:px-3 py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-xl transition-all duration-300 select-none bg-orange-400 text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
          onClick={handleSell}
          disabled={swordLevel === 0 || isSelling}
        >
          <div className="flex flex-col items-center">
            <span>{isSelling ? '판매 중...' : '판매하기'}</span>
            <span className="text-xs font-normal mt-1">{swordLevel > 0 ? `${sellPrice.toLocaleString()} G` : "-"}</span>
          </div>
        </button>
      </div>
    </div>
  );
} 