import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useGameState } from "@/store/useGameState";

export function useGameData() {
  const { user, setMoney, setSwordLevel, setFragments, setItems } = useGameState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 데이터 실시간 로드
  const loadUserData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('money, fragments')
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      
      // 검 정보 가져오기
      const { data: swordData, error: swordError } = await supabase
        .from('swords')
        .select('level')
        .eq('user_id', user.id)
        .single();
      
      if (swordError) throw swordError;
      
      // 상태 업데이트
      if (userData) {
        setMoney(userData.money || 30000);
        setFragments(userData.fragments || 0);
      }
      
      if (swordData) {
        setSwordLevel(swordData.level || 0);
      }
      
      // 아이템 정보 가져오기 (추후 구현)
      // const { data: itemData } = await supabase
      //   .from('inventories')
      //   .select('*, items(*)')
      //   .eq('user_id', user.id);
      
    } catch (err) {
      console.error('게임 데이터 로드 오류:', err);
      setError('게임 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
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

  // 사용자 변경시 데이터 로드
  useEffect(() => {
    if (user?.id) {
      loadUserData();
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