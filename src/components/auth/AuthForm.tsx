"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { useGameState } from "@/store/useGameState";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nickname, setNickname] = useState("");
  const router = useRouter();
  const setUser = useGameState((s) => s.setUser);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // 유저 정보 zustand에 저장
        const { id, email, user_metadata } = session.user;
        setUser({ id, email, nickname: user_metadata?.nickname });
        
        // users 테이블에 사용자 레코드 생성/업데이트 (닉네임 우선 처리)
        const { error } = await supabase
          .from('users')
          .upsert({
            id: id,
            email: email,
            nickname: user_metadata?.nickname || email?.split('@')[0] || '유저',
            money: 30000,
            fragments: 0
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        // swords 테이블에 기본 검 레코드 생성 (없으면 생성)
        await supabase
          .from('swords')
          .upsert({
            user_id: id,
            level: 0
          }, {
            onConflict: 'user_id'
          });
        
        router.replace("/");
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router, setUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    if (data.user) {
      // 유저 정보 zustand에 저장
      const { id, email, user_metadata } = data.user;
      setUser({ id, email, nickname: user_metadata?.nickname });
      
      // users 테이블에 사용자 레코드 생성/업데이트 (닉네임 우선 처리)
      await supabase
        .from('users')
        .upsert({
          id: id,
          email: email,
          nickname: user_metadata?.nickname || email?.split('@')[0] || '유저',
          money: 30000,
          fragments: 0
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      // swords 테이블에 기본 검 레코드 생성 (없으면 생성)
      await supabase
        .from('swords')
        .upsert({
          user_id: id,
          level: 0
        }, {
          onConflict: 'user_id'
        });
      
      router.replace("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!nickname.trim()) {
      setError("닉네임을 입력하세요.");
      setLoading(false);
      return;
    }
    const { error, data } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { 
        data: { nickname },
        emailRedirectTo: window.location.origin 
      } 
    });
    if (error) setError(error.message);
    if (data.user) {
      const { id, email, user_metadata } = data.user;
      setUser({ id, email, nickname: user_metadata?.nickname });
      
      // users 테이블에 사용자 레코드 생성 (닉네임 우선 처리)
      await supabase
        .from('users')
        .upsert({
          id: id,
          email: email,
          nickname: user_metadata?.nickname || nickname,
          money: 30000,
          fragments: 0
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      // swords 테이블에 기본 검 레코드 생성
      await supabase
        .from('swords')
        .upsert({
          user_id: id,
          level: 0
        }, {
          onConflict: 'user_id'
        });
      
      router.replace("/");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    // 구글 로그인은 리다이렉트 후 onAuthStateChange에서 처리
    setLoading(false);
  };

  return (
    <div className="max-w-sm w-full mx-auto p-6 bg-white/90 rounded-2xl shadow-2xl flex flex-col gap-6 mt-12 sm:mt-24">
      <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-2 tracking-tight">
        {mode === "login" ? "로그인" : "회원가입"}
      </h2>
      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="flex flex-col gap-4">
        {mode === "signup" && (
          <input
            className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition"
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            required
            maxLength={16}
            autoComplete="nickname"
          />
        )}
        <input
          className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 text-slate-900 placeholder:text-slate-400 transition"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button
          className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-lg shadow-md transition disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>
      <button
        className="w-full p-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold text-lg shadow-md transition disabled:opacity-60"
        onClick={handleGoogle}
        disabled={loading}
      >
        Google로 계속하기
      </button>
      <div className="text-center">
        <button
          className="text-blue-600 hover:underline font-medium text-sm"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "회원가입" : "로그인"}으로 전환
        </button>
      </div>
      {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
    </div>
  );
} 