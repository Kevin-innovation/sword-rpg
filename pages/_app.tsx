import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameState } from '@/store/useGameState';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }: AppProps) {
  const setUser = useGameState((state) => state.setUser);
  const reset = useGameState((state) => state.reset);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const { id, email, user_metadata } = session.user;
        setUser({ id, email, nickname: user_metadata?.nickname });
      } else {
        reset();
      }
    });

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { id, email, user_metadata } = session.user;
          setUser({ id, email, nickname: user_metadata?.nickname });
        } else if (event === 'SIGNED_OUT') {
          reset();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, reset]);

  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
} 