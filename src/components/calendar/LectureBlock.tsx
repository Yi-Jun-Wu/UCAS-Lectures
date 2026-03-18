import React from 'react';
import type { UILecture } from '../../types';

interface LectureBlockProps {
  lecture: UILecture;
  onClick: (ids: string[]) => void;
  onHoverEnter: (ids: string[], x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverLeave: () => void;
}

export const LectureBlock: React.FC<LectureBlockProps> = ({ 
  lecture, onClick, onHoverEnter, onHoverMove, onHoverLeave
}) => {
  // 根据类型和是否加星标来决定颜色样式
  const getThemeStyles = () => {
    if (lecture.isStarred) {
      return lecture.type === 'science' 
        ? 'bg-blue-100 border-orange-400 border-2 shadow-md z-[100]' // 加星科学
        : 'bg-green-100 border-orange-400 border-2 shadow-md z-[100]'; // 加星人文
    }
    return lecture.type === 'science'
      ? 'bg-blue-50 border-blue-300 border hover:bg-blue-100'        // 普通科学
      : 'bg-emerald-50 border-emerald-300 border hover:bg-emerald-100'; // 普通人文
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation(); // 防止点击穿透触发网格的其他事件
        onClick(lecture.overlappingIds);
      }}
      // ---> 绑定悬浮事件 <---
      onMouseEnter={(e) => onHoverEnter(lecture.overlappingIds, e.clientX, e.clientY)}
      onMouseMove={(e) => onHoverMove(e.clientX, e.clientY)}
      onMouseLeave={onHoverLeave}
      className={`absolute rounded-md p-1.5 cursor-pointer overflow-hidden transition-colors ${getThemeStyles()}`}
      style={{
        top: lecture.renderTop,
        height: lecture.renderHeight,
        left: lecture.renderLeft,
        width: lecture.renderWidth,
        zIndex: lecture.zIndex,
      }}
    >
      {/* 卡片内部内容，超出部分隐藏 */}
      <div className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">
        {lecture.isStarred && <span className="text-orange-500 mr-1">★</span>}
        {lecture.title}
      </div>
      <div className="text-[10px] text-slate-500 mt-1 truncate">
        {lecture.speaker}
      </div>
      <div className="text-[10px] text-slate-400 truncate">
        {lecture.mainVenue}
      </div>
    </div>
  );
};