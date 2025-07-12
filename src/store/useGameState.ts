import { create } from 'zustand';
import { calculateEnhanceChance, calculateEnhanceCost } from '@/lib/gameLogic';
import { supabase } from '@/lib/supabase';

export type GameState = {
  user: { id: string; email?: string; nickname?: string } | null;
  money: number;
  swordLevel: number;
  fragments: number;
  enhanceChance: number;
  enhanceCost: number;
  isEnhancing: boolean;
  // 아이템 보유 수량
  items: {
    doubleChance: number;
    protect: number;
    discount: number;
  };
  foundSwords: boolean[];
  isLoadingAchievements: boolean;
  setUser: (user: { id: string; email?: string; nickname?: string } | null) => void;
  setItems: (items: GameState["items"]) => void;
  reset: () => void;
  setMoney: (money: number) => void;
  setSwordLevel: (level: number) => void;
  setFragments: (fragments: number) => void;
  setEnhanceChance: (chance: number) => void;
  setEnhanceCost: (cost: number) => void;
  setIsEnhancing: (is: boolean) => void;
  setFoundSwords: (found: boolean[]) => void;
  loadUserAchievements: (userId: string) => Promise<void>;
};

export const useGameState = create<GameState>((set) => ({
  user: null,
  money: 30000,
  swordLevel: 0,
  fragments: 0,
  enhanceChance: 100,
  enhanceCost: 100,
  isEnhancing: false,
  items: {
    doubleChance: 0,
    protect: 0,
    discount: 0,
  },
  foundSwords: (() => { const arr = Array(21).fill(false); arr[0] = true; return arr; })(),
  isLoadingAchievements: false,
  setUser: (user) => set({ user }),
  setItems: (items) => set({ items }),
  reset: () => set({
    user: null,
    money: 30000,
    swordLevel: 0,
    fragments: 0,
    enhanceChance: 100,
    enhanceCost: 100,
    isEnhancing: false
  }),
  setMoney: (money) => set({ money }),
  setSwordLevel: (swordLevel) => set({
    swordLevel,
    enhanceChance: calculateEnhanceChance(swordLevel),
    enhanceCost: calculateEnhanceCost(swordLevel)
  }),
  setFragments: (fragments) => set({ fragments }),
  setEnhanceChance: (enhanceChance) => set({ enhanceChance }),
  setEnhanceCost: (enhanceCost) => set({ enhanceCost }),
  setIsEnhancing: (isEnhancing) => set({ isEnhancing }),
  setFoundSwords: (found) => set({ foundSwords: found }),
  loadUserAchievements: async (userId: string) => {
    const { isLoadingAchievements } = get();
    if (isLoadingAchievements) return; // 이미 로딩 중이면 중단
    
    set({ isLoadingAchievements: true });
    
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('unlocked_swords')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        // 잠금 해제된 검 레벨을 boolean 배열로 변환
        const unlockedLevels = data.unlocked_swords || ['0'];
        const foundSwords = Array(21).fill(false);
        unlockedLevels.forEach((level: string) => {
          const levelNum = parseInt(level, 10);
          if (levelNum >= 0 && levelNum < 21) {
            foundSwords[levelNum] = true;
          }
        });
        set({ foundSwords });
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      set({ isLoadingAchievements: false });
    }
  },
})); 