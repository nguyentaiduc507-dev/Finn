import React from 'react';
import { Flame } from 'lucide-react';
import type { StreakStats } from '../types/index';

interface FlameStreakBadgeProps {
  streak: StreakStats | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const FlameStreakBadge: React.FC<FlameStreakBadgeProps> = ({
  streak,
  size = 'md',
  showLabel = true,
}) => {
  const count = streak?.currentStreak || 0;
  const isPending = streak?.todayPending;
  const isCompleted = streak?.todayCompleted;

  let sizeClasses = 'text-sm px-3 py-1.5 gap-1.5';
  let iconSize = 18;
  if (size === 'sm') {
    sizeClasses = 'text-xs px-2 py-1 gap-1';
    iconSize = 15;
  } else if (size === 'lg') {
    sizeClasses = 'text-lg px-4 py-2.5 gap-2.5 font-bold';
    iconSize = 26;
  }

  // Flame color styling
  let containerStyle = 'bg-amber-500/15 border-amber-500/30 text-amber-400';
  let flameColor = 'text-amber-500 fill-amber-500';
  let animationClass = 'animate-pulse';

  if (count === 0) {
    containerStyle = 'bg-slate-800 border-slate-700 text-slate-400';
    flameColor = 'text-slate-500 fill-slate-500';
    animationClass = '';
  } else if (isCompleted) {
    containerStyle = 'bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-yellow-500/20 border-orange-500/40 text-orange-300 shadow-lg shadow-orange-500/10';
    flameColor = 'text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]';
    animationClass = 'animate-bounce';
  } else if (isPending) {
    containerStyle = 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/30';
    flameColor = 'text-amber-400 fill-amber-400 animate-pulse';
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border transition-all ${containerStyle} ${sizeClasses}`}
      title={
        isCompleted
          ? `Đã hoàn thành mục tiêu hôm nay! Chuỗi hiện tại: ${count} ngày`
          : isPending
          ? `Hôm nay còn bài tập chưa làm! Làm bài trước 23:59 để không bị mất chuỗi ${count} ngày`
          : `Chuỗi học tập hiện tại: ${count} ngày`
      }
    >
      <div className={`relative flex items-center justify-center ${animationClass}`}>
        <Flame size={iconSize} className={flameColor} />
      </div>
      <span className="font-extrabold tracking-tight">{count}</span>
      {showLabel && (
        <span className="font-medium text-xs opacity-90 hidden sm:inline">
          {count >= 1 ? 'ngày chuỗi' : 'bắt đầu chuỗi'}
        </span>
      )}
    </div>
  );
};
