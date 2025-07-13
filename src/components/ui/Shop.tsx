import React, { useState } from "react";
import { useGameState } from "@/store/useGameState";
import { ORDER_COST } from "@/lib/gameLogic";
import { apiRequest } from "@/lib/apiUtils";

const initialItems = [
  // 기본 주문서류
  {
    id: "doubleChance",
    name: "확률 2배 주문서",
    desc: "다음 강화 성공 확률이 2배로 증가",
    price: ORDER_COST.doubleChance,
    category: "basic"
  },
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
  
  // 카테고리별 아이템 분류
  const categorizedItems = {
    basic: initialItems.filter(item => item.category === "basic"),
    material: initialItems.filter(item => item.category === "material"),
    advanced: initialItems.filter(item => item.category === "advanced"),
    special: initialItems.filter(item => item.category === "special")
  };

  const handleBuy = async (id: string, price: number) => {
    if (!user?.id) {
      alert('로그인이 필요합니다!');
      return;
    }
    
    if ((items[id] || 0) >= 10) {
      alert('최대 10개까지만 보유할 수 있습니다!');
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
        {initialItems.map((item) => (
          <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50 rounded-xl p-3 md:p-4 border border-slate-200">
            <div>
              <div className="font-semibold text-slate-800 text-base md:text-lg">{item.name}</div>
              <div className="text-xs md:text-sm text-slate-500 mb-1">{item.desc}</div>
              <div className="text-xs md:text-sm text-slate-400">보유: {(items[item.id] || 0)}/10</div>
            </div>
            <button
              className={`mt-2 md:mt-0 px-3 md:px-4 py-1.5 md:py-2 rounded bg-orange-400 text-white text-xs md:text-sm font-semibold shadow hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={() => handleBuy(item.id, item.price)}
              disabled={money < item.price || (items[item.id] || 0) >= 10 || purchasing === item.id}
            >
              {purchasing === item.id ? '구매중...' : `${item.price.toLocaleString()} G 구매`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop; 