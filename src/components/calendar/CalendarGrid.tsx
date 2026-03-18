import React, { useMemo, useState } from 'react';
import { type AppLecture, type TooltipState } from '../../types';
import { CALENDAR_CONFIG } from '../../constants/config';
import { getNextSevenDays, groupLecturesByDay, formatDayHeader } from '../../utils/dateHelpers';
import { ColumnDay } from './ColumnDay';
import { TimeIndicator } from './TimeIndicator';
import { HoverTooltip } from '../ui/HoverTooltip';

interface CalendarGridProps {
  lectures: AppLecture[];
  onLectureClick: (ids: string[]) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ lectures, onLectureClick }) => {
  // 1. 生成未来 7 天的日期序列
  const daysArray = useMemo(() => {
    const today = new Date();
    return getNextSevenDays(today);
  }, []);

  // 2. 将讲座数据按天进行分组
  // groupedLectures 是一个长度为 7 的二维数组，索引与 daysArray 对应
  const groupedLectures = useMemo(() => {
    return groupLecturesByDay(lectures, daysArray);
  }, [lectures, daysArray]);

  // 3. 生成左侧时间轴的整点数组 [8, 9, 10, ..., 22]
  const hours = Array.from(
    { length: CALENDAR_CONFIG.TOTAL_HOURS + 1 }, 
    (_, i) => CALENDAR_CONFIG.START_HOUR + i
  );

  // ---> 新增悬浮状态管理 <---
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  // ---> 计算当前悬浮的讲座列表 <---
  const hoveredLectures = useMemo(() => {
    if (!tooltipState) return [];
    return lectures
      .filter(l => tooltipState.ids.includes(l.id))
      .sort((a, b) => a.startTimestamp - b.startTimestamp);
  }, [tooltipState, lectures]);

  return (
    <div 
      className="flex-1 flex flex-col min-w-[1000px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative"
      onClick={() => onLectureClick([])}
    >
      
      {/* 顶部日期表头 */}
      <div className="flex border-b border-slate-200 bg-slate-50 z-10">
        <div className="w-16 shrink-0 border-r border-slate-200"></div> {/* 左上角留白 */}
        {daysArray.map((date, index) => {
          const isToday = index === 0;
          return (
            <div 
              key={index} 
              className={`flex-1 py-3 text-center font-medium text-sm ${
                isToday ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
              }`}
            >
              {formatDayHeader(date)}
            </div>
          );
        })}
      </div>

      {/* 日历主网格区 */}
      <div className="flex-1 flex relative">
        
        {/* 左侧时间轴 */}
        <div className="w-16 shrink-0 flex flex-col border-r border-slate-200 bg-slate-50 relative z-10">
          {hours.map((hour, index) => (
            <div 
              key={hour} 
              // 最后一个刻度不需要占据高度，只是为了标出 22:00 的底线
              className={`relative ${index === hours.length - 1 ? 'h-0' : 'flex-1'}`}
            >
              <span className="absolute -top-3 left-0 w-full text-center text-xs text-slate-400 font-medium">
                {`${hour.toString().padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>

        {/* 7天的列容器 */}
        <div className="flex-1 flex relative">
          {/* 渲染全局的水平网格线 (每小时一条)，给 ColumnDay 提供视觉对齐参考 */}
          <div className="absolute inset-0 pointer-events-none flex flex-col z-0">
             {Array.from({ length: CALENDAR_CONFIG.TOTAL_HOURS }).map((_, i) => (
               <div key={i} className="flex-1 border-t border-slate-100 w-full"></div>
             ))}
          </div>

          {/* 渲染 7 个具体的每一天 */}
          {daysArray.map((date, index) => (
            <ColumnDay
              key={index}
              date={date}
              isToday={index === 0}
              lectures={groupedLectures[index] || []}
              onLectureClick={onLectureClick}
              onHoverEnter={(ids, x, y) => setTooltipState({ ids, x, y })}
              onHoverMove={(x, y) => setTooltipState(prev => prev ? { ...prev, x, y } : null)}
              onHoverLeave={() => setTooltipState(null)}
            />
          ))}

          {/* 全局时间红线 (跨越 7 列) */}
          <TimeIndicator />
        </div>
      </div>
      {/* ---> 挂载悬浮窗 <--- */}
      <HoverTooltip
        lectures={hoveredLectures} 
        x={tooltipState?.x || 0} 
        y={tooltipState?.y || 0} 
      />
    </div>
  );
};