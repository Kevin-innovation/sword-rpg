import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useGameState } from "@/store/useGameState";
import AuthForm from "@/components/auth/AuthForm";

export default function Login() {
  const router = useRouter();
  const user = useGameState((state) => state.user);

  useEffect(() => {
    // 이미 로그인된 사용자는 홈으로 리다이렉트
    if (user?.id) {
      router.replace("/");
    }
  }, [user, router]);

  // 로그인된 사용자는 빈 화면 (리다이렉트 중)
  if (user?.id) {
    return <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800"></div>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
      <AuthForm />
    </main>
  );
} 