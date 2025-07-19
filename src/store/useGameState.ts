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
    magic_stone: number;
    purification_water: number;
    legendary_essence: number;
    advanced_protection: number;
    blessing_scroll: number;
  };
  foundSwords: boolean[];
  isLoadingAchievements: boolean;
  rankingRefreshTrigger: number; // 랭킹 새로고침 트리거
  setUser: (user: { id: string; email?: string; nickname?: string } | null) => void;
  setItems: (items: GameState["items"]) => void;
  reset: () => void;
  setMoney: (money: number) => void;
  setSwordLevel: (level: number) => void;
  setSwordLevelOnly: (level: number) => void;
  setFragments: (fragments: number) => void;
  setEnhanceChance: (chance: number) => void;
  setEnhanceCost: (cost: number) => void;
  setIsEnhancing: (is: boolean) => void;
  setFoundSwords: (found: boolean[]) => void;
  loadUserAchievements: (userId: string) => Promise<void>;
  refreshRanking: () => void; // 랭킹 새로고침 함수
};

// Global cache to prevent duplicate achievement loads
const achievementCache = new Map<string, { data: boolean[], timestamp: number }>();
const CACHE_DURATION = 5000; // 5초로 단축 (더 빠른 동기화)
const activeRequests = new Set<string>();
const lastLoadTime = new Map<string, number>(); // 마지막 로드 시간 추적

export const useGameState = create<GameState>((set, get) => ({
  user: null,
  money: 0, // 초기값 0으로 설정, 실제 데이터 로드 전까지 기다림
  swordLevel: 0,
  fragments: 0,
  enhanceChance: 0, // 초기값 0, 실제 데이터 로드 후 설정
  enhanceCost: 0, // 초기값 0, 실제 데이터 로드 후 설정
  isEnhancing: false,
  items: {
    doubleChance: 0,
    protect: 0,
    discount: 0,
    magic_stone: 0,
    purification_water: 0,
    legendary_essence: 0,
    advanced_protection: 0,
    blessing_scroll: 0,
  },
  foundSwords: (() => { const arr = Array(21).fill(false); arr[0] = true; return arr; })(),
  isLoadingAchievements: false,
  rankingRefreshTrigger: 0,
  setUser: (user) => set({ user }),
  setItems: (items) => set({ items }),
  reset: () => set({
    user: null,
    money: 0, // 로그아웃시 0으로 리셋
    swordLevel: 0,
    fragments: 0,
    enhanceChance: 0, // 리셋시 0으로 설정
    enhanceCost: 0, // 리셋시 0으로 설정
    isEnhancing: false,
    items: {
      doubleChance: 0,
      protect: 0,
      discount: 0,
      magic_stone: 0,
      purification_water: 0,
      legendary_essence: 0,
      advanced_protection: 0,
      blessing_scroll: 0,
    }
  }),
  setMoney: (money) => set({ money }),
  setSwordLevel: (swordLevel) => set({
    swordLevel,
    enhanceChance: calculateEnhanceChance(swordLevel),
    enhanceCost: calculateEnhanceCost(swordLevel)
  }),
  setSwordLevelOnly: (swordLevel) => set({
    swordLevel,
    enhanceCost: calculateEnhanceCost(swordLevel)
    // enhanceChance는 건드리지 않음 (커스텀 확률 유지)
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
    
    // 캐시 확인 (5초 이내 데이터가 있으면 사용, 단 사용자 변경시는 무시)
    const cached = achievementCache.get(userId);
    const now = Date.now();
    const isFromUserChange = !lastLoadTime.has(`user-${userId}`) || (now - (lastLoadTime.get(`user-${userId}`) || 0)) < 2000;
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION && !isFromUserChange) {
      console.log('Using cached achievement data for user:', userId);
      set({ foundSwords: cached.data });
      return;
    }
    
    // 사용자 로드 시간 기록
    lastLoadTime.set(`user-${userId}`, now);
    
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
        console.log('No achievement data found for user, setting defaults:', userId);
        const defaultSwords = Array(21).fill(false);
        defaultSwords[0] = true;
        achievementCache.set(userId, { data: defaultSwords, timestamp: now });
        set({ foundSwords: defaultSwords });
      } else if (error) {
        // 다른 종류의 에러 로깅
        console.error('Achievement load error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId: userId
        });
        // 에러 발생시에도 기본값 설정
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
  refreshRanking: () => {
    set((state) => ({ rankingRefreshTrigger: state.rankingRefreshTrigger + 1 }));
  },
})); 