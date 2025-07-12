export interface User {
  id: string;
  email: string;
  nickname: string;
  money: number;
  fragments: number;
}

export interface Sword {
  id: string;
  user_id: string;
  level: number;
  is_active: boolean;
}

export interface EnhancementResult {
  success: boolean;
  newLevel: number;
  fragmentsGained?: number;
  moneySpent: number;
} 