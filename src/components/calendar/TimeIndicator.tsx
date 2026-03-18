import React, { useState, useEffect } from 'react';
import { CALENDAR_CONFIG } from '../../constants/config';

export const TimeIndicator: React.FC = () => {
  const [topPercentage, setTopPercentage] = useState<number | null>(null);

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const totalMinutesPassed = (currentHour - CALENDAR_CONFIG.START_HOUR) * 60 + currentMinute;
      const totalCalendarMinutes = CALENDAR_CONFIG.TOTAL_HOURS * 60;

      // 如果当前时间在 08:00 到 22:00 之间，计算百分比；否则隐藏红线
      if (totalMinutesPassed >= 0 && totalMinutesPassed <= totalCalendarMinutes) {
        setTopPercentage((totalMinutesPassed / totalCalendarMinutes) * 100);
      } else {
        setTopPercentage(null);
      }
    };

    // 初始化计算一次
    calculatePosition();
    
    // 每分钟更新一次
    const intervalId = setInterval(calculatePosition, 60000);
    return () => clearInterval(intervalId);
  }, []);

  if (topPercentage === null) return null;

  return (
    <div 
      className="absolute left-0 w-full h-px bg-red-500 z-30 pointer-events-none"
      style={{ top: `${topPercentage}%` }}
    >
      {/* 左侧的红点修饰 */}
      <div className="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-[3px]"></div>
    </div>
  );
};