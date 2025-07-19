import React, { useState, useEffect } from "react";
import { useGameState } from "@/store/useGameState";
import { calculateEnhanceChance, calculateEnhanceCost, calculateFragmentsOnFail, calculateSwordSellPrice, FRAGMENT_BOOST_OPTIONS, canUseFragments, calculateBoostedChance, checkRequiredMaterials } from "@/lib/gameLogic";
import { useGameData } from "@/hooks/useGameData";
import { apiRequest } from "@/lib/apiUtils";
import { motion } from "framer-motion";

export default function EnhanceButton() {
  const { money, swordLevel, setMoney, setSwordLevel, setSwordLevelOnly, setEnhanceChance, setEnhanceCost, fragments, setFragments, refreshRanking } = useGameState();
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
  // 쿨타임 상태
  const [cooldowns, setCooldowns] = useState<{[key: string]: number}>({});
  // 강화확률 뽑기 시스템
  const [customChance, setCustomChance] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  // 이스터에그: 7을 7번 연속 입력하면 77777골드 지급
  const [eggSeq, setEggSeq] = useState<number[]>([]);
  const [zKeyPressed, setZKeyPressed] = useState(false);
  
  useEffect(() => {
    if (eggSeq.length >= 7 && eggSeq.slice(-7).every(n => n === 7)) {
      handleEasterEgg();
      setEggSeq([]);
    }
  }, [eggSeq]);

  const handleEasterEgg = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/easter-egg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMoney(data.newMoney);
        alert("77777 골드 이스터에그!");
      }
    } catch (error) {
      console.error('이스터에그 오류:', error);
    }
  };
  
  // 키 입력 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "7") {
        setEggSeq(seq => [...seq, 7]);
      } else if (e.key === "z" || e.key === "Z") {
        setZKeyPressed(true);
      } else {
        setEggSeq([]);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "z" || e.key === "Z") {
        setZKeyPressed(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 쿨타임 상태 확인 (클라이언트 로컬 관리)
  useEffect(() => {
    const fetchCooldowns = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch('/api/cooldown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (response.ok) {
          const data = await response.json();
          setCooldowns(data.cooldowns || {});
        }
      } catch (error) {
        console.error('쿨타임 확인 오류:', error);
        // 쿨타임 확인 실패 시 빈 객체로 설정 (모든 아이템 사용 가능)
        setCooldowns({});
      }
    };

    fetchCooldowns();
    const interval = setInterval(fetchCooldowns, 60000); // 1분마다 확인
    return () => clearInterval(interval);
  }, [user?.id]);

  // 강화확률 뽑기 함수
  const handleChanceRoll = async () => {
    if (money < 20000) {
      alert('골드가 부족합니다! (필요: 20,000G)');
      return;
    }
    
    if (isRolling || !user?.id) return;
    
    setIsRolling(true);
    
    try {
      const response = await fetch('/api/chance-roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '뽑기 실패');
      }
      
      const data = await response.json();
      
      // 애니메이션 효과
      setTimeout(() => {
        setMoney(data.newMoney);
        setCustomChance(data.customChance);
        setEnhanceChance(data.customChance); // 기본 성공 확률에 반영
        setIsRolling(false);
        
        alert(`축하합니다! ${data.customChance}% 확률을 획득했습니다!`);
      }, 1000);
      
    } catch (error) {
      console.error('Chance roll error:', error);
      alert(error.message || '뽑기 중 오류가 발생했습니다.');
      setIsRolling(false);
    }
  };

  const handleEnhanceInternal = async () => {
    const now = Date.now();
    
    // 중복 요청 완전 차단 + 1초 디바운싱으로 강화
    if (disabled || isProcessing || (now - lastClickTime < 1000)) {
      console.log('Enhancement blocked - too fast clicking');
      return;
    }
    
    setLastClickTime(now);
    setIsProcessing(true);
    setDisabled(true);
    setAnim(true);
    
    console.log('Enhancement started at:', new Date().toISOString());
    
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
    
    // 🚀 병렬 처리: API 호출과 게이지 애니메이션 동시 시작
    const apiStartTime = Date.now();
    
    // API 호출 즉시 시작 (Promise)
    const apiPromise = fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentLevel: swordLevel,
          useDoubleChance,
          useProtect,
          useDiscount,
          useFragmentBoost: selectedFragmentBoost,
          secretBoost: zKeyPressed,
          customChance: customChance
        })
      });
    
    // 게이지 애니메이션 (1초 내외 완료)
    let gaugeCompleted = false;
    const gaugeInterval = setInterval(() => {
      setGaugeProgress(prev => {
        if (prev >= 100) {
          clearInterval(gaugeInterval);
          gaugeCompleted = true;
          return 100;
        }
        // 1초 내외 완료를 위한 속도 조절 (100% / 100번 = 1초)
        return prev + 1; // 1%씩 증가
      });
    }, 10); // 10ms마다 업데이트 (1초 완료)
    
    try {
      const response = await apiPromise;
      
      // API 응답을 받으면 게이지가 완료될 때까지 대기
      const waitForGauge = () => {
        return new Promise<void>((resolve) => {
          if (gaugeCompleted) {
            resolve();
          } else {
            const checkInterval = setInterval(() => {
              if (gaugeCompleted) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 10);
          }
        });
      };
      
      await waitForGauge(); // 게이지 완료까지 대기
      
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
      
      // 🎯 게이지 완료 후 결과 표시 (1초 내외)
      if (data.success) {
        setGaugeResult('success');
        // 성공 결과를 잠깐 보여준 후 상태 업데이트
        setTimeout(() => {
          // 커스텀 확률이 있으면 enhanceChance를 보존하는 함수 사용
          if (customChance) {
            setSwordLevelOnly(data.newLevel);
          } else {
            setSwordLevel(data.newLevel);
          }
          setResult("success");
          // 성공시 업적 실시간 업데이트
          if (user?.id) {
            loadUserAchievements(user.id);
          }
          // 성공시 랭킹 새로고침 트리거
          refreshRanking();
        }, 300); // 성공 게이지를 300ms 보여주기
      } else {
        setGaugeResult('fail');
        // 실패 게이지 급락 효과
        setTimeout(() => {
          setGaugeProgress(0); // 게이지 급락
        }, 200);
        // 실패 결과를 잠깐 보여준 후 상태 업데이트
        setTimeout(() => {
          // 커스텀 확률이 있으면 enhanceChance를 보존하는 함수 사용
          if (customChance) {
            setSwordLevelOnly(data.newLevel);
          } else {
            setSwordLevel(data.newLevel);
          }
          setResult("fail");
          // 실패시 조각 업데이트
          if (data.fragmentsGained > 0) {
            setFragments(data.newFragments);
            alert(`강화 실패! 레벨 0으로 초기화되었지만 조각 ${data.fragmentsGained}개를 획득했습니다.`);
          } else {
            alert("강화 실패! 레벨 0으로 초기화");
          }
        }, 500); // 실패 게이지를 500ms 보여주기
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
      // 커스텀 확률 리셋 (강화 후 초기화)
      setCustomChance(null);
      // 주의: enhanceChance는 리셋하지 않음 (뽑기 확률 유지)
      
      // API 응답 후 안전한 딜레이로 버튼 활성화 (중복 클릭 방지)
      setTimeout(() => {
        setDisabled(false);
        setIsProcessing(false);
        console.log('Enhancement process completed');
      }, 500); // 0.5초 딜레이
      
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
      // 에러 시에도 안전한 딜레이로 버튼 활성화
      setTimeout(() => {
        setDisabled(false);
        setAnim(false);
        setIsProcessing(false);
        console.log('Enhancement error handled');
      }, 500);
    }
    
    // 게이지 애니메이션과 기존 애니메이션 종료 처리 - 빠르게 정리
    setTimeout(() => {
      setShowGauge(false);
      setGaugeProgress(0);
      setGaugeResult(null);
      setAnim(false);
      setResult(null);
    }, 1200); // 전체 프로세스 후 1.2초 후 정리
  };

  const handleEnhance = () => {
    handleEnhanceInternal();
  };

  const sellPrice = calculateSwordSellPrice(swordLevel);
  
  // 금액 초기화 함수
  const handleMoneyReset = async () => {
    if (!user?.id) {
      alert('로그인이 필요합니다!');
      return;
    }
    
    if (swordLevel !== 0) {
      alert('검이 +0 상태일 때만 사용할 수 있습니다!');
      return;
    }
    
    try {
      const response = await fetch('/api/reset-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMoney(data.newMoney);
        setFragments(data.newFragments || 0);
        // 인벤토리 아이템들도 모두 0으로 초기화
        setItems({
          doubleChance: 0,
          protect: 0,
          discount: 0,
          magic_stone: 0,
          purification_water: 0,
          legendary_essence: 0,
          advanced_protection: 0,
          blessing_scroll: 0
        });
        alert(data.message || '금액과 인벤토리가 초기화되었습니다!');
      } else {
        const errorData = await response.json();
        alert(`오류: ${errorData.error}`);
      }
    } catch (error) {
      console.error('금액 초기화 오류:', error);
      alert('금액 초기화 중 오류가 발생했습니다.');
    }
  };
  
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
    
    // 판매 확인 창
    const confirmSell = confirm(`정말로 +${swordLevel}강 검을 ${sellPrice.toLocaleString()} G에 판매하시겠습니까?`);
    if (!confirmSell) return;
    
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
  
  // 필수 재료 확인 (아이템 스테이트를 인벤토리 형태로 변환)
  const mockInventory = Object.entries(items).map(([type, quantity]) => ({
    item_id: type,
    quantity: quantity || 0,
    items: { type }
  }));
  
  const requiredMaterialsCheck = checkRequiredMaterials(swordLevel, mockInventory);
  const canEnhanceWithMaterials = requiredMaterialsCheck.canEnhance;

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

      {/* 강화확률 뽑기 & 디버깅 버튼 */}
      <div className="flex gap-2 md:gap-3 w-full">
        <button
          className={`flex-1 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base shadow-lg transition-all duration-300 ${
            money >= 20000 && !isRolling
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleChanceRoll}
          disabled={money < 20000 || isRolling}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg">{isRolling ? '🎲' : '🎯'}</span>
            <span>{isRolling ? '뽑기 중...' : '강화확률 뽑기'}</span>
            <span className="text-xs opacity-80">20,000G</span>
            {customChance && (
              <span className="text-xs font-normal">당첨! {customChance}%!</span>
            )}
          </div>
        </button>
        
        <button
          className="flex-1 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base shadow-lg bg-gray-300 text-gray-500 cursor-not-allowed"
          disabled={true}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg">🚫</span>
            <span>클릭 금지</span>
          </div>
        </button>
      </div>

      <div className="w-full flex flex-col gap-2 md:gap-3">
        {/* 강화 게이지 애니메이션 - 항상 표시 */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
          <div 
            className={`h-full transition-all duration-200 rounded-full ${
              gaugeResult === 'success' 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : gaugeResult === 'fail'
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : showGauge
                    ? 'bg-gradient-to-r from-blue-400 to-purple-600'
                    : 'bg-gradient-to-r from-gray-300 to-gray-400'
            }`}
            style={{ width: showGauge ? `${gaugeProgress}%` : '0%' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow">
              {gaugeResult === 'success' ? '성공!' : 
               gaugeResult === 'fail' ? '실패!' : 
               showGauge ? '강화 중...' : '강화 전'}
            </span>
          </div>
          {/* 반짝이는 효과 */}
          {gaugeProgress > 0 && gaugeResult === null && showGauge && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          )}
        </div>
        
        <motion.button
          className={`w-full relative py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-2xl transition-all duration-150 select-none overflow-hidden
            ${result === "success" 
              ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white" 
              : result === "fail" 
                ? "bg-gradient-to-r from-red-400 to-red-500 text-white"
                : (disabled || isProcessing)
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-300 cursor-not-allowed opacity-60"
                  : canAfford
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white cursor-pointer"
                    : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed"
            }
          `}
          onClick={handleEnhance}
          disabled={disabled || !canAfford || !canEnhanceWithMaterials}
        >
          {/* 배경 효과 - 호버 제거 */}
          
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
            ) : !canEnhanceWithMaterials ? (
              <>
                <span className="text-xl">⚠️</span>
                <span>재료 부족</span>
              </>
            ) : (disabled || isProcessing) ? (
              <>
                <span className="text-xl">⏳</span>
                <span>처리 중...</span>
                <span className="text-xl">⏳</span>
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
            disabled={items.doubleChance === 0 || disabled || (cooldowns.doubleChance > 0)}
            onClick={() => setUseDoubleChance(v => !v)}
          >
            {cooldowns.doubleChance > 0 ? `쿨타임 ${cooldowns.doubleChance}분` : `확률2배(${items.doubleChance})`}
          </button>
          <button
            className={`flex-1 px-2 md:px-3 py-1 md:py-2 rounded bg-green-100 text-green-700 text-xs md:text-sm font-semibold border border-green-300 transition disabled:opacity-40 disabled:cursor-not-allowed ${useProtect ? 'ring-2 ring-green-400' : ''}`}
            disabled={items.protect === 0 || disabled || (cooldowns.protect > 0)}
            onClick={() => setUseProtect(v => !v)}
          >
            {cooldowns.protect > 0 ? `쿨타임 ${cooldowns.protect}분` : `보호(${items.protect})`}
          </button>
          <button
            className={`flex-1 px-2 md:px-3 py-1 md:py-2 rounded bg-yellow-100 text-yellow-700 text-xs md:text-sm font-semibold border border-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed ${useDiscount ? 'ring-2 ring-yellow-400' : ''}`}
            disabled={items.discount === 0 || disabled || (cooldowns.discount > 0)}
            onClick={() => setUseDiscount(v => !v)}
          >
            {cooldowns.discount > 0 ? `쿨타임 ${cooldowns.discount}분` : `할인(${items.discount})`}
          </button>
        </div>
        
        {/* 필수 재료 정보 표시 */}
        {!canEnhanceWithMaterials && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm font-semibold text-red-700 mb-1">⚠️ 필수 재료 부족</div>
            <div className="text-xs text-red-600">{requiredMaterialsCheck.message}</div>
            <div className="text-xs text-red-500 mt-1">
              부족한 재료: {requiredMaterialsCheck.missingItems.join(', ')}
            </div>
          </div>
        )}
        
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
          className={`w-full py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-2xl transition-all duration-300 select-none bg-orange-400 text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
          onClick={handleSell}
          disabled={swordLevel === 0 || isSelling}
        >
          <div className="flex items-center justify-center">
            <span>{isSelling ? '판매 중...' : '판매!'}</span>
          </div>
        </button>
        
        {/* 클릭금지! 버튼 */}
        <button
          className={`w-full py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-2xl transition-all duration-300 select-none ${
            swordLevel === 0 
              ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleMoneyReset}
          disabled={swordLevel !== 0}
        >
          <div className="flex items-center justify-center">
            <span>🔄 골드 / 인벤토리 초기화!</span>
          </div>
        </button>
      </div>
    </div>
  );
} 