import React, { useMemo, useState } from 'react';
import { type AppLecture, type TooltipState } from '../../types';
import { CALENDAR_CONFIG } from '../../constants/config';
import { formatDayHeader, getGridDays, groupLecturesByDay, isSameDay, isSameWeekday } from '../../utils/dateHelpers';
import { ColumnDay } from './ColumnDay';
import { TimeIndicator } from './TimeIndicator';
import { HoverTooltip } from '../ui/HoverTooltip';

interface CalendarGridProps {
  lectures: AppLecture[];
  mode: 'complete' | 'rolling';
  offset: number;
  setMode: (mode: 'complete' | 'rolling') => void;
  setOffset: (offset: number) => void;
  onLectureClick: (ids: string[]) => void;
}

function mapping_offset(offset: number, from: 'rolling' | 'complete', to: 'rolling' | 'complete'): number {
  if (from === to)
    return offset;
  switch (from) {
    case 'rolling':
      return offset;
    case 'complete':
      return Math.min(Math.max(offset, -1), 1);
  }
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ lectures, mode, offset, setMode, setOffset, onLectureClick }) => {
  // ==========================================
  // 状态机跃迁控制矩阵
  // ==========================================

  const handlePrev = () => {
    if (mode === 'rolling') {
      if (offset === 1) setOffset(0);
      else if (offset === 0) setOffset(-1);
      else if (offset === -1) {
        setMode('complete');
        setOffset(-1); // 越过边界，跌入完整周-1
      }
    } else {
      setOffset(offset - 1);
    }
  };

  const handleNext = () => {
    if (mode === 'rolling') {
      if (offset === -1) setOffset(0);
      else if (offset === 0) setOffset(1);
      else if (offset === 1) {
        setMode('complete');
        setOffset(2); // 越过边界，跃升至完整周2
      }
    } else {
      setOffset(offset + 1);
    }
  };

  const handleToggleMode = (_mode: 'rolling' | 'complete') => {
    setMode(_mode);
    setOffset(mapping_offset(offset, mode, _mode));
  };


  // 获取当前状态的提示文本
  const getNavText = (_mode = mode) => {
    const _offset = mapping_offset(offset, mode, _mode);
    if (_mode === 'rolling') {
      if (_offset === -1) return '过去 7 天';
      if (_offset === 0) return '近期 7 天';
      if (_offset === 1) return '未来 7 天';
    } else {
      if (_offset === -1) return '上一周';
      if (_offset === 0) return '本周';
      if (_offset === 1) return '下一周';
      if (_offset < -1) return `${Math.abs(offset)} 周前`;
      if (_offset > 1) return `${offset} 周后`;
    }
    return '';
  };


  // ==========================================
  // 数据与网格计算
  // ==========================================
  const daysArray = useMemo(() => {
    return getGridDays(mode, offset);
  }, [mode, offset]);

  const groupedLectures = useMemo(() => {
    return groupLecturesByDay(lectures, daysArray);
  }, [lectures, daysArray]);

  const hours = Array.from(
    { length: CALENDAR_CONFIG.TOTAL_HOURS + 1 },
    (_, i) => CALENDAR_CONFIG.START_HOUR + i
  );

  const todayDate = new Date();

  // 悬浮状态管理 
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  const hoveredLectures = useMemo(() => {
    if (!tooltipState) return [];
    return tooltipState.ids
      .map(id => lectures.find(l => l.id === id))
      .filter((l): l is AppLecture => l !== undefined);
  }, [tooltipState, lectures]);


  // ==========================================
  // 渲染层
  // ==========================================
  return (
    <div
      className="flex-1 flex flex-col min-w-[1000px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative"
      onClick={() => onLectureClick([])}
    >
      {/* 1. 紧凑型导航控制区 (Sub-header) */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50/80 select-none">

        {/* 左侧向左按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          title="向过去追溯"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 中央模式切换与文本标识 */}
        <div
          className="flex items-center gap-3 px-3 py-1 rounded-full hover:bg-slate-200/50 cursor-pointer transition-colors"
          onClick={(e) => { e.stopPropagation(); handleToggleMode(mode === 'rolling' ? 'complete' : 'rolling'); }}
          title="点击切换：循环模式 / 完整自然周"
        >
          <span title='完整周' className={`text-xs font-bold w-16 text-right transition-colors ${mode === 'complete' ? 'text-blue-600' : 'text-slate-400'}`}>
            {getNavText('complete')}
          </span>

          {/* iOS 风格微型 Switch 开关 */}
          <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${mode === 'rolling' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${mode === 'rolling' ? 'translate-x-4' : 'translate-x-0'}`}></div>
          </div>

          <span title='循环模式' className={`text-xs font-bold w-16 text-left transition-colors ${mode === 'rolling' ? 'text-indigo-600' : 'text-slate-400'}`}>
            {getNavText('rolling')}
          </span>
        </div>

        {/* 右侧向右按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          title="向未来前瞻"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 2. 顶部日期表头 */}
      <div className="flex border-b border-slate-200 bg-slate-50 z-10">
        <div className="w-16 shrink-0 border-r border-slate-200">
          {/* 这里可以放一个小日历 Icon 点缀 */}
          <div className="h-full w-full flex items-center justify-center opacity-20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
        {daysArray.map((date, index) => {
          const isToday = isSameDay(date, todayDate);
          const isHighlightLeft = mode === 'rolling' && isSameWeekday(date, todayDate);
          const isPastDays = date.getTime() < todayDate.getTime();
          return (
            <div
              key={index}
              className={`flex-1 py-3 text-center text-sm font-semibold ${isToday ?
                'text-blue-600 bg-blue-50/50 font-bold' :
                isPastDays ? 'text-slate-400 font-thin' : 'text-slate-600 '
                } ${isHighlightLeft ? "border-l-4 border-l-blue-500 bg-blue-50/10 z-20 shadow-[-25px_0_20px_-5px_rgba(255,255,255,0.85)] ring-1 ring-blue-500/10" : ""}`}
            >
              {formatDayHeader(date)}
            </div>
          );
        })}
      </div>

      {/* 3. 日历主网格区 */}
      <div className="flex-1 flex relative">

        {/* 左侧时间轴 */}
        <div className="w-16 shrink-0 flex flex-col border-r border-slate-200 bg-slate-50 relative z-10">
          {hours.map((hour, index) => (
            <div
              key={hour}
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
          <div className="absolute inset-0 pointer-events-none flex flex-col z-0">
            {Array.from({ length: CALENDAR_CONFIG.TOTAL_HOURS }).map((_, i) => (
              <div key={i} className="flex-1 border-t border-slate-100 w-full"></div>
            ))}
          </div>

          {daysArray.map((date, index) => (
            <ColumnDay
              key={index}
              date={date}
              // 关键修复：计算是否处于循环断层，只在 rolling 模式且这一天不连续时渲染蓝线
              // 简化的逻辑是让 ColumnDay 知道整个 App 的 mode 是什么，或者在里面判断。
              // 为了解耦，这里可以通过判定 mode === 'rolling' 来让 ColumnDay 去画阴影
              isHighlightLeft={mode === 'rolling' && isSameWeekday(date, todayDate)}
              lectures={groupedLectures[index] || []}
              onLectureClick={onLectureClick}
              onHoverEnter={(ids, x, y) => setTooltipState({ ids, x, y })}
              onHoverMove={(x, y) => setTooltipState(prev => prev ? { ...prev, x, y } : null)}
              onHoverLeave={() => setTooltipState(null)}
            />
          ))}

          {/* 全局时间红线 */}
          <TimeIndicator days={daysArray} mode={mode} offset={offset} />
        </div>
      </div>

      {/* 挂载悬浮窗 */}
      <HoverTooltip
        lectures={hoveredLectures}
        x={tooltipState?.x || 0}
        y={tooltipState?.y || 0}
      />
    </div>
  );
};