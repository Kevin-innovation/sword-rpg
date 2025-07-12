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

// Global cache to prevent duplicate achievement loads
const achievementCache = new Map<string, { data: boolean[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30초 캐시
const activeRequests = new Set<string>();

export const useGameState = create<GameState>((set, get) => ({
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
    
    // 중복 요청 완전 차단
    if (activeRequests.has(userId)) {
      console.log('Achievement request already active for user:', userId);
      return;
    }
    
    // 캐시 확인 (30초 이내 데이터가 있으면 사용)
    const cached = achievementCache.get(userId);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached achievement data for user:', userId);
      set({ foundSwords: cached.data });
      return;
    }
    
    activeRequests.add(userId);
    set({ isLoadingAchievements: true });
    
    try {
      console.log('Loading fresh achievement data for user:', userId);
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
        
        // 캐시에 저장
        achievementCache.set(userId, { data: foundSwords, timestamp: now });
        set({ foundSwords });
      } else if (error?.code === 'PGRST116') {
        // 데이터가 없으면 기본값 설정 (에러 무시)
        const defaultSwords = Array(21).fill(false);
        defaultSwords[0] = true;
        achievementCache.set(userId, { data: defaultSwords, timestamp: now });
        set({ foundSwords: defaultSwords });
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
      // 에러 발생시 기본값 설정
      const defaultSwords = Array(21).fill(false);
      defaultSwords[0] = true;
      set({ foundSwords: defaultSwords });
    } finally {
      activeRequests.delete(userId);
      set({ isLoadingAchievements: false });
    }
  },
})); 