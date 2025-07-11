import { create } from "zustand";
import { User, Sword } from "@/lib/types";

interface GameState {
  user: User | null;
  money: number;
  fragments: number;
  sword: Sword | null;
  setUser: (user: User) => void;
  setMoney: (money: number) => void;
  setFragments: (fragments: number) => void;
  setSword: (sword: Sword) => void;
  reset: () => void;
}

export const useGameState = create<GameState>((set) => ({
  user: null,
  money: 0,
  fragments: 0,
  sword: null,
  setUser: (user) => set({ user, money: user.money, fragments: user.fragments }),
  setMoney: (money) => set({ money }),
  setFragments: (fragments) => set({ fragments }),
  setSword: (sword) => set({ sword }),
  reset: () => set({ user: null, money: 0, fragments: 0, sword: null }),
})); 