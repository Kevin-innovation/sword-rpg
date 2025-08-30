import React, { useState } from "react";
import { useGameState } from "@/store/useGameState";
import { ORDER_COST, ITEM_LIMITS } from "@/lib/gameLogic";
import { apiRequest } from "@/lib/apiUtils";

const initialItems = [
  // 기본 주문서류 - 2배 주문서 삭제됨
  {
    id: "protect",
    name: "보호 주문서",
    desc: "강화 실패 시 레벨 하락/초기화 방지 (1회)",
    price: ORDER_COST.protect,
    category: "basic"
  },
  {
    id: "discount",
    name: "비용 절약 주문서",
    desc: "다음 강화 비용 50% 할인",
    price: ORDER_COST.discount,
    category: "basic"
  },
  
  // 특수 재료류 (구간별 차별화)
  {
    id: "magic_stone",
    name: "🔮 마력석",
    desc: "10강 이상 강화에 필수! 신비한 마법의 힘",
    price: ORDER_COST.magic_stone,
    category: "material",
    requiredLevel: 10
  },
  {
    id: "purification_water",
    name: "💧 정화수",
    desc: "15강 이상 강화에 필수! 성스러운 정화의 물",
    price: ORDER_COST.purification_water,
    category: "material",
    requiredLevel: 15
  },
  {
    id: "legendary_essence",
    name: "⭐ 전설의 정수",
    desc: "20강 이상 강화에 필수! 극희귀 전설 재료",
    price: ORDER_COST.legendary_essence,
    category: "material",
    requiredLevel: 20
  },
  
  // 고급 주문서류
  {
    id: "advanced_protection",
    name: "🛡️ 고급 보호권",
    desc: "15강 이상 전용! 강화된 보호 효과",
    price: ORDER_COST.advanced_protection,
    category: "advanced",
    requiredLevel: 15
  },
  {
    id: "blessing_scroll",
    name: "✨ 축복서",
    desc: "연속 성공 시 보너스 확률 증가! (최대 +15%)",
    price: ORDER_COST.blessing_scroll,
    category: "special"
  },
];

const Shop = () => {
  const money = useGameState((s) => s.money);
  const setMoney = useGameState((s) => s.setMoney);
  const items = useGameState((s) => s.items);
  const setItems = useGameState((s) => s.setItems);
  const user = useGameState((s) => s.user);
  const swordLevel = useGameState((s) => s.swordLevel);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  // 카테고리별 아이템 분류 - 2배 주문서 제외
  const categorizedItems = {
    basic: initialItems.filter(item => item.category === "basic" && item.id !== "doubleChance"),
    material: initialItems.filter(item => item.category === "material"),
    advanced: initialItems.filter(item => item.category === "advanced"),
    special: initialItems.filter(item => item.category === "special")
  };

  const handleBuy = async (id: string, price: number) => {
    if (!user?.id) {
      alert('로그인이 필요합니다!');
      return;
    }
    
    // 레벨 제한 확인
    const item = initialItems.find(item => item.id === id);
    if (item?.requiredLevel && swordLevel < item.requiredLevel) {
      alert(`${item.requiredLevel}강 이상에서 구매할 수 있습니다!`);
      return;
    }
    
    // 아이템별 최대 보유량 확인
    const maxQuantity = ITEM_LIMITS.maxQuantity[id] || 10;
    if ((items[id] || 0) >= maxQuantity) {
      alert(`최대 ${maxQuantity}개까지만 보유할 수 있습니다!`);
      return;
    }
    
    if (money < price) {
      alert('골드가 부족합니다!');
      return;
    }
    
    setPurchasing(id);
    
    try {
      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          itemType: id,
          price: price
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '구매 실패');
      }
      
      // 상태 업데이트
      setMoney(data.newMoney);
      setItems({ ...items, [id]: data.newItemCount });
      alert(data.message || '구매 완료!');
      
    } catch (error) {
      console.error('구매 오류:', error);
      alert(error.message || '구매 중 오류가 발생했습니다.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-slate-200/50 p-6 md:p-8 w-full mt-4">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-gradient bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">상점</h2>
      <div className="mb-3 text-right text-sm md:text-base text-slate-600">
        보유 골드: <span className="font-bold text-yellow-600">{money.toLocaleString()} G</span>
      </div>
      <div className="space-y-3 md:space-y-4">
        {initialItems.filter(item => item.id !== "doubleChance").map((item) => {
          const isLevelLocked = item.requiredLevel && swordLevel < item.requiredLevel;
          const isMaxQuantity = (items[item.id] || 0) >= (ITEM_LIMITS.maxQuantity[item.id] || 10);
          const canAfford = money >= item.price;
          
          return (
            <div key={item.id} className={`flex flex-col md:flex-row md:items-center justify-between rounded-xl p-3 md:p-4 border ${
              isLevelLocked ? 'bg-gray-100 border-gray-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className={`font-semibold text-base md:text-lg ${
                  isLevelLocked ? 'text-gray-500' : 'text-slate-800'
                }`}>
                  {item.name}
                  {isLevelLocked && <span className="ml-2 text-xs text-red-500">(🔒 {item.requiredLevel}강 필요)</span>}
                </div>
                <div className={`text-xs md:text-sm mb-1 ${
                  isLevelLocked ? 'text-gray-400' : 'text-slate-500'
                }`}>{item.desc}</div>
                <div className={`text-xs md:text-sm ${
                  isLevelLocked ? 'text-gray-400' : 'text-slate-400'
                }`}>보유: {(items[item.id] || 0)}/{ITEM_LIMITS.maxQuantity[item.id] || 10}</div>
              </div>
              <button
                className={`mt-2 md:mt-0 px-3 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLevelLocked 
                    ? 'bg-gray-300 text-gray-600' 
                    : 'bg-orange-400 text-white hover:bg-orange-500'
                }`}
                onClick={() => handleBuy(item.id, item.price)}
                disabled={isLevelLocked || !canAfford || isMaxQuantity || purchasing === item.id}
              >
                {purchasing === item.id ? '구매중...' : 
                 isLevelLocked ? '잠금' :
                 `${item.price.toLocaleString()} G 구매`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Shop; 