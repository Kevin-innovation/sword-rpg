import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useGameState } from "@/store/useGameState";

// Global protection against duplicate loads
const activeLoads = new Set<string>();
const lastLoadTime = new Map<string, number>();
const LOAD_COOLDOWN = 5000; // 5초 쿨다운

export function useGameData() {
  const { user, setMoney, setSwordLevel, setFragments, setItems, loadUserAchievements } = useGameState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 데이터 실시간 로드
  const loadUserData = async () => {
    if (!user?.id || loading) return; // 이미 로딩 중이면 중단
    
    // 중복 로드 완전 차단
    if (activeLoads.has(user.id)) {
      console.log('Data load already active for user:', user.id);
      return;
    }
    
    // 쿨다운 체크
    const lastLoad = lastLoadTime.get(user.id);
    const now = Date.now();
    if (lastLoad && (now - lastLoad) < LOAD_COOLDOWN) {
      console.log('Data load cooldown active for user:', user.id);
      return;
    }
    
    activeLoads.add(user.id);
    lastLoadTime.set(user.id, now);
    setLoading(true);
    setError(null);
    
    try {
      // 사용자 정보 가져오기 - 없으면 생성
      let userData = null;
      let { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('money, fragments, nickname')
        .eq('id', user.id)
        .single();
      
      if (userError || !existingUser) {
        // 사용자가 없으면 생성
        console.log('Creating missing user in loadUserData:', user.id);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            nickname: user.nickname || user.email?.split('@')[0] || '유저',
            money: 30000,
            fragments: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('money, fragments, nickname')
          .single();
        
        if (createError) throw createError;
        userData = newUser;
      } else {
        userData = existingUser;
      }
      
      // 검 정보 가져오기 - 없으면 생성
      let swordData = null;
      let { data: existingSword, error: swordError } = await supabase
        .from('swords')
        .select('level')
        .eq('user_id', user.id)
        .single();
      
      if (swordError || !existingSword) {
        // 검이 없으면 생성
        console.log('Creating missing sword in loadUserData:', user.id);
        const { data: newSword, error: createSwordError } = await supabase
          .from('swords')
          .insert({
            user_id: user.id,
            level: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('level')
          .single();
        
        if (createSwordError) throw createSwordError;
        swordData = newSword;
      } else {
        swordData = existingSword;
      }
      
      // 상태 업데이트 - 실제 데이터 우선 사용
      if (userData) {
        console.log('사용자 데이터 로드 완료:', {
          userId: user.id,
          money: userData.money,
          fragments: userData.fragments
        });
        setMoney(userData.money || 30000); // 데이터베이스에서 로드된 실제 골드 사용
        setFragments(userData.fragments || 0);
      }
      
      if (swordData) {
        setSwordLevel(swordData.level || 0);
      }
      
      // 업적 정보 로드 (사용자 변경시 강제 새로고침)
      console.log('사용자 데이터 로드 중 업적 로드:', user.id);
      lastLoadTime.set(`achievements-${user.id}`, now);
      await loadUserAchievements(user.id);
      
      // 아이템 정보 가져오기 (추후 구현)
      // const { data: itemData } = await supabase
      //   .from('inventories')
      //   .select('*, items(*)')
      //   .eq('user_id', user.id);
      
    } catch (err) {
      console.error('게임 데이터 로드 오류:', err);
      setError('게임 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      activeLoads.delete(user.id);
      setLoading(false);
    }
  };

  // 사용자 데이터 실시간 업데이트
  const updateUserData = async (updates: {
    money?: number;
    fragments?: number;
  }) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // 로컬 상태 업데이트
      if (updates.money !== undefined) setMoney(updates.money);
      if (updates.fragments !== undefined) setFragments(updates.fragments);
      
    } catch (err) {
      console.error('사용자 데이터 업데이트 오류:', err);
      setError('데이터 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 검 레벨 업데이트
  const updateSwordLevel = async (level: number) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('swords')
        .update({
          level: level,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // 로컬 상태 업데이트
      setSwordLevel(level);
      
    } catch (err) {
      console.error('검 레벨 업데이트 오류:', err);
      setError('검 레벨 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 사용자 변경시 데이터 로드 (디바운싱 적용)
  useEffect(() => {
    if (user?.id) {
      // 500ms 디바운싱으로 중복 호출 방지
      const timeoutId = setTimeout(() => {
        loadUserData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id]);

  return {
    loading,
    error,
    loadUserData,
    updateUserData,
    updateSwordLevel
  };
}