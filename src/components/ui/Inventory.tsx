import { useEffect } from "react";
import { useGameState } from "@/store/useGameState";
import { calculateSwordSellPrice } from "@/lib/gameLogic";
import { supabase } from "@/lib/supabase";

const swordNames = [
  "녹슨 검", "견고한 검", "빛나는 검", "기사도의 검", "불꽃의 검", "용맹의 검", "신비의 검", "영웅의 검", "전설의 검", "신화의 검", "초월의 검", "심연의 검", "창공의 검", "태초의 검", "무한의 검", "신성의 검", "절대자의 검", "운명의 검", "파멸의 검", "창세의 검", "영원의 검"
];
const swordImgs = Array.from({length: 21}, (_, i) => `/sword_img/${i+1}.svg`);

const Inventory = () => {
  const foundSwords = useGameState((s) => s.foundSwords);
  const swordLevel = useGameState((s) => s.swordLevel);
  const setSwordLevel = useGameState((s) => s.setSwordLevel);
  const money = useGameState((s) => s.money);
  const setMoney = useGameState((s) => s.setMoney);
  const user = useGameState((s) => s.user);
  const setItems = useGameState((s) => s.setItems);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("inventories")
        .select("quantity, item_id, items!inner(type)")
        .eq("user_id", user.id);
      if (error) return;
      // type별로 매핑
      const itemsObj = { doubleChance: 0, protect: 0, discount: 0 };
      data?.forEach((row: any) => {
        let type: string | undefined;
        if (Array.isArray(row.items)) {
          type = row.items[0]?.type;
        } else if (row.items && typeof row.items === 'object') {
          type = (row.items as any).type;
        }
        if (type && (type === 'doubleChance' || type === 'protect' || type === 'discount')) {
          itemsObj[type as keyof typeof itemsObj] = row.quantity;
        }
      });
      setItems(itemsObj);
    };
    fetchInventory();
  }, [user?.id, setItems]);

  const sellPrice = calculateSwordSellPrice(swordLevel);

  const handleSell = () => {
    if (swordLevel === 0) return alert("판매할 검이 없습니다.");
    setMoney(money + sellPrice);
    setSwordLevel(0);
    alert(`검을 ${sellPrice.toLocaleString()} G에 판매했습니다!`);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 md:p-8 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
          <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          검 업적 컬렉션
        </h2>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3 md:gap-4">
        {foundSwords.map((found, i) => (
          <div key={i} className="relative aspect-square bg-gradient-to-b from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-2 md:p-3 overflow-hidden">
            {found ? (
              <>
                <img
                  src={swordImgs[i]}
                  alt={swordNames[i]}
                  className="w-14 h-14 md:w-20 md:h-20 object-contain mb-2 drop-shadow"
                  onError={e => { (e.target as HTMLImageElement).src = '/sword_img/1.svg'; }}
                />
                <span className="block w-full text-[11px] md:text-xs text-slate-700 font-semibold text-center whitespace-nowrap overflow-hidden text-ellipsis">
                  {swordNames[i]}
                </span>
                <span className="block w-full text-[10px] md:text-xs text-slate-500 text-center mt-0.5">
                  +{i}
                </span>
              </>
            ) : (
              <span className="text-3xl md:text-4xl text-slate-300">?</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center text-sm md:text-base text-slate-600">
          <span>사용 중: 1/12</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            빈 슬롯: 11개
          </span>
        </div>
      </div>
    </div>
  );
};

export default Inventory; 