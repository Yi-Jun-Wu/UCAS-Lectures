import React, { useMemo } from 'react';
import type { AppLecture } from '../../types';
import { calculateDayLayout, calculateCongestionBadges } from '../../utils/overlapEngine';
import { LectureBlock } from './LectureBlock'; // 下方提供的简易子组件

interface ColumnDayProps {
  date: Date;
  lectures: AppLecture[];
  isToday: boolean;
  onLectureClick: (ids: string[]) => void;
  onHoverEnter: (ids: string[], x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverLeave: () => void;
}

export const ColumnDay: React.FC<ColumnDayProps> = (
  { date, lectures, isToday, onLectureClick, onHoverEnter, onHoverMove, onHoverLeave }
) => {
  // 1. 通过排版引擎计算每个讲座的绝对坐标
  const uiLectures = useMemo(() => calculateDayLayout(lectures), [lectures]);
  
  // 2. 计算需要显示的拥挤度指示器 (比如右上角的数字 "3")
  const congestionBadges = useMemo(() => calculateCongestionBadges(lectures), [lectures]);

  return (
    <div 
      className={`flex-1 relative border-r border-slate-100 min-h-full ${
        isToday ? 'border-l-4 border-l-blue-500 bg-blue-50/10 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.05)]' : ''
      }`}
    >
      {/* 渲染讲座区块 */}
      {uiLectures.map(uiLecture => (
        <LectureBlock 
          key={uiLecture.id} 
          lecture={uiLecture} 
          onClick={onLectureClick}
          onHoverEnter={onHoverEnter}
          onHoverLeave={onHoverLeave}
          onHoverMove={onHoverMove}
        />
      ))}

      {/* 渲染拥挤度指示器 */}
      {congestionBadges.map((badge, index) => (
        <div 
          key={`badge-${index}`}
          className="absolute right-1 w-5 h-5 bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center rounded-md z-20 shadow-sm opacity-80 pointer-events-none"
          style={{ top: badge.top }}
          title={`该时间段有 ${badge.count} 个重叠讲座`}
        >
          {badge.count}
        </div>
      ))}
    </div>
  );
};