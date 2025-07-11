import React, { useState } from "react";
import { useGameState } from "@/store/useGameState";
import { ORDER_COST } from "@/lib/gameLogic";

const initialItems = [
  {
    id: "doubleChance",
    name: "확률 2배 주문서",
    desc: "다음 강화 성공 확률이 2배로 증가",
    price: ORDER_COST.doubleChance,
  },
  {
    id: "protect",
    name: "보호 주문서",
    desc: "강화 실패 시 레벨 하락/초기화 방지 (1회)",
    price: ORDER_COST.protect,
  },
  {
    id: "discount",
    name: "비용 절약 주문서",
    desc: "다음 강화 비용 50% 할인",
    price: ORDER_COST.discount,
  },
];

const Shop = () => {
  const money = useGameState((s) => s.money);
  const setMoney = useGameState((s) => s.setMoney);
  const items = useGameState((s) => s.items);
  const setItems = useGameState((s) => s.setItems);
  // 간단한 상태로 아이템 보유 수량 관리 (실제 게임에서는 전역/서버로 관리)
  const [itemCounts, setItemCounts] = useState<{ [id: string]: number }>({});

  const handleBuy = (id: string, price: number) => {
    if ((items[id] || 0) >= 10) return alert("최대 10개까지만 보유할 수 있습니다!");
    if (money < price) return alert("골드가 부족합니다!");
    setMoney(money - price);
    setItems({ ...items, [id]: (items[id] || 0) + 1 });
    setItemCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    alert("구매 완료!");
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
              disabled={money < item.price || (items[item.id] || 0) >= 10}
            >
              {item.price.toLocaleString()} G 구매
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop; 