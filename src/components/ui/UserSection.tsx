import React from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { useGameState } from "@/store/useGameState";

const UserSection = () => {
  const router = useRouter();
  const { user, setUser, reset } = useGameState();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      reset(); // 전체 상태 리셋 (골드, 레벨, 업적 등 모두 초기화)
      router.replace("/login");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  if (!user) {
    return (
      <div className="bg-white/90 rounded-2xl shadow-xl border border-slate-200/50 p-4 w-full">
        <div className="text-center">
          <p className="text-red-500 font-medium">로그인이 필요합니다</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            로그인 하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-slate-200/50 p-4 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-700">
              {user.nickname || user.email?.split("@")[0] || "유저"}
            </p>
            <p className="text-sm text-slate-500">
              {user.email || "이메일 없음"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default UserSection;