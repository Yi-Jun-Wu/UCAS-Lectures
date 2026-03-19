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
  
  // 优化后的主题样式计算
  const getThemeStyles = () => {
    if (lecture.isStarred) {
      // 金色高亮：使用 amber-400 边框和 amber-50 的渐变底色
      return lecture.type === 'science' 
        ? 'bg-gradient-to-br from-blue-50 to-amber-50 border-amber-400 border-2 shadow-md hover:shadow-lg' 
        : 'bg-gradient-to-br from-emerald-50 to-amber-50 border-amber-400 border-2 shadow-md hover:shadow-lg';
      // 星标状态：极致高亮，带渐变背景、粗边框和强阴影
      // return lecture.type === 'science' 
      //   ? 'bg-gradient-to-br from-blue-50 to-orange-50 border-orange-400 border-2 shadow-md hover:shadow-lg' 
      //   : 'bg-gradient-to-br from-emerald-50 to-orange-50 border-orange-400 border-2 shadow-md hover:shadow-lg';
    }
    // 普通状态：半透明背景(配合底部的网格线透视)，柔和边框
    return lecture.type === 'science'
      ? 'bg-blue-50/90 backdrop-blur-sm border-blue-200 border hover:bg-blue-100 hover:shadow shadow-sm'        
      : 'bg-emerald-50/90 backdrop-blur-sm border-emerald-200 border hover:bg-emerald-100 hover:shadow shadow-sm'; 
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(lecture.overlappingIds);
      }}
      onMouseEnter={(e) => onHoverEnter(lecture.overlappingIds, e.clientX, e.clientY)}
      onMouseMove={(e) => onHoverMove(e.clientX, e.clientY)}
      onMouseLeave={onHoverLeave}
      // 核心排版变动：加入 flex flex-col
      className={`absolute rounded-lg p-2 cursor-pointer overflow-hidden transition-all duration-200 flex flex-col group ${getThemeStyles()}`}
      style={{
        top: lecture.renderTop,
        height: lecture.renderHeight,
        left: lecture.renderLeft,
        width: lecture.renderWidth,
        zIndex: lecture.zIndex,
      }}
    >
      {/* --- 顶部区域：标题与星标 --- */}
      <div className="text-xs font-bold text-slate-800 leading-snug line-clamp-3">
        {lecture.isStarred && (
          // 放大星标 (text-sm 相对于 text-xs 更大)，加入阴影和微小动画
          // <span className="text-orange-500 text-sm mr-1.5 drop-shadow-sm inline-block group-hover:scale-110 transition-transform">
          <span className="text-amber-500 text-sm mr-1.5 drop-shadow-sm inline-block group-hover:scale-110 transition-transform">
            ★
          </span>
        )}
        {lecture.title}
      </div>

      {/* --- 底部区域：主讲人与地点 (利用 mt-auto 强行推到底部) --- */}
      <div className="mt-auto pt-1.5 flex flex-col gap-1">
        
        {lecture.speaker && (
          <div className="text-[10px] text-slate-500 truncate font-medium flex items-center gap-1.5 opacity-90">
            {/* 用户微图标 */}
            <svg className="w-3 h-3 shrink-0 opacity-70" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{lecture.speaker}</span>
          </div>
        )}
        
        {lecture.mainVenue && (
          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
            {/* 地点微图标 */}
            <svg className="w-3 h-3 shrink-0 opacity-70" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{lecture.mainVenue}</span>
          </div>
        )}

      </div>
    </div>
  );
};