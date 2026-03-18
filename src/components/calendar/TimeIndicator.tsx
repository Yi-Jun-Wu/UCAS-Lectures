// components/calendar/TimeIndicator.tsx
import React, { useState, useEffect } from 'react';
import { CALENDAR_CONFIG } from '../../constants/config';
import { isSameDay } from '../../utils/dateHelpers';

interface TimeIndicatorProps {
  days: Date[];
}

export const TimeIndicator: React.FC<TimeIndicatorProps> = ({ days }) => {
  const [position, setPosition] = useState<{ top: number; outOfBounds: boolean } | null>(null);

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      // const currentHour = now.getHours();
      const currentHour = 19;
      const currentMinute = 0;//now.getMinutes();
      
      const totalMinutesPassed = (currentHour - CALENDAR_CONFIG.START_HOUR) * 60 + currentMinute;
      const totalCalendarMinutes = CALENDAR_CONFIG.TOTAL_HOURS * 60;
      
      let percentage = (totalMinutesPassed / totalCalendarMinutes) * 100;
      let outOfBounds = false;

      if (percentage <= 1) { percentage = 1; outOfBounds = true; } 
      else if (percentage >= 99) { percentage = 99; outOfBounds = true; }

      setPosition({ top: percentage, outOfBounds });
    };

    calculatePosition();
    const intervalId = setInterval(calculatePosition, 60000);
    return () => clearInterval(intervalId);
  }, []);

  if (!position) return null;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayTime = todayDate.getTime();

  return (
    <>
      {/* ========================================================= */}
      {/* 物理层 1: 底层实线 (z-index 0) */}
      {/* 位于 ColumnDay (z-10/20) 之下。会被不透明的卡片完美遮挡 */}
      {/* ========================================================= */}
      <div 
        className="absolute left-0 w-full flex pointer-events-none z-0"
        style={{ top: `${position.top}%` }}
      >
        {days.map((date, index) => {
          const diffDays = Math.round((date.getTime() - todayTime) / (1000 * 60 * 60 * 24));
          const isToday = diffDays === 0;

          if (isToday) {
            return <div key={index} className="flex-1"></div>;
          }

          const opacityValue = Math.max(0.1, 1 - Math.abs(diffDays) * 0.15);
          return (
            <div key={index} className="flex-1 relative flex items-center h-[1.5px]">
              {/* 这里只有实线 */}
              <div 
                className="absolute w-full h-px bg-red-500 top-[0.5px]"
                style={{ opacity: opacityValue }}
              ></div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 物理层 2: 顶层点线 (z-index 50) */}
      {/* 位于所有组件之上。平时与实线视觉重合，被遮盖时凸显点线 */}
      {/* ========================================================= */}
      <div 
        className="absolute left-0 w-full flex pointer-events-none z-50"
        style={{ top: `${position.top}%` }}
      >
        {days.map((date, index) => {
          const diffDays = Math.round((date.getTime() - todayTime) / (1000 * 60 * 60 * 24));
          
          // 今天不需要点线补充，直接返回空占位
          if (diffDays === 0) return (
              <div key={index} className="flex-1 relative flex items-center">
                {/* 今天: 完整的红线与红点。因为今天是 z-20，如果这条线也被遮了，你需要把这部分移到顶层 */}
                <div className="w-full h-[2px] bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></div>
                {!position.outOfBounds && (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -left-[5px] shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
                )}
              </div>
            );

          const opacityValue = Math.max(0.1, 1 - Math.abs(diffDays) * 0.15);
          return (
            <div key={index} className="flex-1 relative flex items-center h-[2px]">
              {/* 这里只有点线 */}
              <div 
                className="absolute w-full h-px border-1 border-t border-dotted border-red-500 top-[0.5px]"
                style={{ opacity: opacityValue }}
              ></div>
            </div>
          );
        })}
      </div>
    </>
  );
};