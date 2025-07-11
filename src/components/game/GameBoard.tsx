import React from "react";

export default function GameBoard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-8 w-full min-h-[480px] border border-white/20 relative overflow-hidden">
      {/* 글로우 효과 */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl"></div>
      
      {/* 상단 장식 */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <span className="text-2xl">⚡</span>
        </div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-8 mt-4">
        {children}
      </div>
      
      {/* 하단 장식 패턴 */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-b-3xl"></div>
    </div>
  );
} 