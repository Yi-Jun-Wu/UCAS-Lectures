import React, { useState, useEffect } from 'react';
import { CALENDAR_CONFIG } from '../../constants/config';

interface TimeIndicatorProps {
  days: Date[]; // 传入 getWrappingWeekDays 生成的 7 天
}

export const TimeIndicator: React.FC<TimeIndicatorProps> = ({ days }) => {
  const [position, setPosition] = useState<{ top: number; outOfBounds: boolean } | null>(null);

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      const currentHour = now.getHours() - 4;
      const currentMinute = now.getMinutes();
      
      const totalMinutesPassed = (currentHour - CALENDAR_CONFIG.START_HOUR) * 60 + currentMinute;
      const totalCalendarMinutes = CALENDAR_CONFIG.TOTAL_HOURS * 60;
      
      let percentage = (totalMinutesPassed / totalCalendarMinutes) * 100;
      let outOfBounds = false;

      // 超出范围时，钳制在顶部 (0%) 或底部 (100%)，并标记
      if (percentage <= 0) {
        percentage = 0;
        outOfBounds = true;
      } else if (percentage >= 100) {
        percentage = 100;
        outOfBounds = true;
      }

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
    <div 
      className="absolute left-0 w-full flex pointer-events-none z-30"
      style={{ top: `${position.top}%` }}
    >
      {days.map((date, index) => {
        const dateTime = date.getTime();
        // 计算这是未来第几天 (0 代表今天，6 代表第六天后)
        const diffDays = Math.round((dateTime - todayTime) / (1000 * 60 * 60 * 24));
        const isToday = diffDays === 0;

        // 如果出现了不可预见的负数(按理说不存在)，做个安全回退
        if (diffDays < 0) return <div key={index} className="flex-1"></div>;

        if (isToday) {
          return (
            <div key={index} className="flex-1 relative flex items-center z-[200]">
              {/* 今天：两倍粗(2px)，且不受上下边界隐藏点的影响 */}
              <div className="w-full h-[2px] bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></div>
              {/* 左侧的红色基准点，仅在未越界时显示 */}
              {!position.outOfBounds && (
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -left-[5px] shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
              )}
            </div>
          );
        }

        // 未来 1-6 天：根据相差天数计算透明度衰减
        // diffDays=1 -> 0.85, ..., diffDays=6 -> 0.1
        const opacityValue = Math.max(0.1, 1 - diffDays * 0.15);

        return (
          <div key={index} className="flex-1 relative flex items-center h-[2px]">
            {/* 魔法双层渲染：底层实线(z-30)，顶层半透明点线(z-200) */}
            
            {/* 1. 底层实线 (会被讲座卡片遮挡) */}
            <div 
              className="absolute w-full h-[1.5px] bg-red-500 top-[0.5px] z-30"
              style={{ opacity: opacityValue }}
            ></div>
            
            {/* 2. 顶层点线 (永远在卡片之上，平时与实线重叠看不出，被遮挡时显现) */}
            <div 
              className="absolute w-full h-[1.5px] border-t border-dashed border-red-500 top-[0.5px] z-[200]"
              style={{ opacity: opacityValue }}
            ></div>
          </div>
        );
      })}
    </div>
  );

  // return (
  //   <div 
  //     className="absolute left-0 w-full h-px bg-red-500 z-30 pointer-events-none"
  //     style={{ top: `${topPercentage}%` }}
  //   >
  //     {/* 左侧的红点修饰 */}
  //     <div className="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-[3px]"></div>
  //   </div>
  // );
};