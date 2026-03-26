// components/calendar/TimeIndicator.tsx
import React, { useState, useEffect } from 'react';
import { CALENDAR_CONFIG } from '../../constants/config';

interface TimeIndicatorProps {
  days: Date[];
  mode: 'complete' | 'rolling';
  offset: number;
}

export const TimeIndicator: React.FC<TimeIndicatorProps> = ({ days, mode, offset }) => {
  const [position, setPosition] = useState<{ top: number; outOfBounds: boolean } | null>(null);

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const totalMinutesPassed = (currentHour - CALENDAR_CONFIG.START_HOUR) * 60 + currentMinute;
      const totalCalendarMinutes = CALENDAR_CONFIG.TOTAL_HOURS * 60;
      
      let percentage = (totalMinutesPassed / totalCalendarMinutes) * 100;
      let outOfBounds = false;

      if (percentage <= 0.5) { percentage = 0.5; outOfBounds = true; } 
      else if (percentage >= 99.5) { percentage = 99.5; outOfBounds = true; }

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

  // 是否处于特殊的本周期循环模式
  const isSpecialRolling = mode === 'rolling' && offset === 0;

  return (
    <>
      {/* ========================================================= */}
      {/* 物理层 1: 底层实线 (z-index 0) */}
      {/* ========================================================= */}
      <div 
        className="absolute left-0 w-full flex pointer-events-none z-0"
        style={{ top: `${position.top}%` }}
      >
        {days.map((date, index) => {
          const diffDays = Math.round((date.getTime() - todayTime) / (1000 * 60 * 60 * 24));
          const isToday = diffDays === 0;

          // 今天由第二层统一渲染，底层留空
          if (isToday) {
            return <div key={index} className="flex-1"></div>;
          }

          // 计算透明度策略
          let opacityValue = 1;
          if (isSpecialRolling) {
            // 梯度衰减
            opacityValue = Math.max(0.1, 1 - Math.abs(diffDays) * 0.15);
          } else {
            // 绝对划分：过去极淡，未来正常细线
            opacityValue = diffDays < 0 ? 0.2 : 0.6;
          }

          return (
            <div key={index} className="flex-1 relative flex items-center h-[1.5px]">
              <div 
                className="absolute w-full h-[1.5px] bg-red-500 top-[0.5px] transition-opacity duration-300"
                style={{ opacity: opacityValue }}
              ></div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 物理层 2: 顶层点线与今日指示器 (z-index 50) */}
      {/* ========================================================= */}
      <div 
        className="absolute left-0 w-full flex pointer-events-none z-50"
        style={{ top: `${position.top}%` }}
      >
        {days.map((date, index) => {
          const diffDays = Math.round((date.getTime() - todayTime) / (1000 * 60 * 60 * 24));
          const isToday = diffDays === 0;
          
          if (isToday) {
            return (
              <div key={index} className="flex-1 relative flex items-center">
                {/* 今天：永远加粗发光，无视何种模式 */}
                <div className="w-full h-[2.5px] bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></div>
                {!position.outOfBounds && (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -left-[5px] shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
                )}
              </div>
            );
          }

          // 点线的透明度策略与实线同步，但加上微弱的基础缩放系数以模拟点状虚影
          let baseOpacity = 1;
          if (isSpecialRolling) {
            baseOpacity = Math.max(0.1, 1 - Math.abs(diffDays) * 0.15);
          } else {
            baseOpacity = diffDays < 0 ? 0.2 : 0.6;
          }
          const dottedOpacity = baseOpacity * 0.6;

          return (
            <div key={index} className="flex-1 relative flex items-center h-[2px]">
              <div 
                className="absolute w-full h-px border-t-[1.5px] border-dotted border-red-500 top-[0.5px] transition-opacity duration-300"
                style={{ opacity: dottedOpacity }}
              ></div>
            </div>
          );
        })}
      </div>
    </>
  );
};