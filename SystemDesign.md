# UCAS 讲座周历 (UCAS Lectures Calendar) - 系统设计文档

## 1. 架构与技术栈
* **框架**: React 18 + Vite (构建极速，适合 SPA)。
* **样式**: Tailwind CSS (用于快速实现无响应式限制的绝对定位、卡片样式、主题色)。
* **路由**: 由于是单一视图，可以不引入 React Router，用简单的状态变量控制侧边栏的开闭即可。
* **数据缓存**: `SWR` 或 `React Query` (处理数据抓取、缓存、后台更新) + `localStorage` (存储用户配置和星标)。
* **PWA 支持**: `vite-plugin-pwa` (生成 Service Worker，缓存静态资源，实现真正的离线访问)。
* **部署**: GitHub Pages (通过 GitHub Actions 自动构建部署)。

---

## 2. 数据与网络策略

### 2.1 数据源与抓取限制
* **URL**: `raw.githubusercontent.com/...`
* **速率限制问题**: GitHub Raw 不像 API 有严格的 `60次/小时` 限制，它是通过 Fastly CDN 分发的。只要你不是在做高频轮询（例如每秒请求一次），仅在用户打开页面时请求，**完全不会触发封禁**。
* **离线与缓存策略 (Stale-While-Revalidate)**:
    1.  用户打开页面：优先从本地 `IndexedDB` 或 `localStorage` 读取上一次缓存的 JSON 数据，瞬间渲染页面。
    2.  后台发起 `fetch` 请求最新数据。
    3.  请求成功后，比对 `generatedAt`，如果有更新，则静默更新状态，React 会自动重绘 UI。

### 2.2 数据模型扩展 (Frontend State)
除了你提供的 `MergedLecture`，在前端我们需要增加几个辅助字段用于渲染：
```typescript
interface DataFile {
  generatedAt: string// "2026-03-18T11:07:49.746Z",
  total: number, // length
  lectures: MergedLecture[],
}

interface MergedLecture {
  id: string;                 // 纯字母特征码 (例如: AJFNKQLB)
  seriesName: string;         // 讲座系列
  title: string;              // 讲座名称 (映射自 lectureName)
  creditHours: string;        // 学时
  department: string;         // 主办部门
  targetAudience: string;     // 面向对象 (映射自 targetedObjects)
  speaker: string;            // 主讲人 (映射自 lecturer)
  isAppointmentRequired: boolean; // 是否需要预约
  sourceUrl: string;          // 详情页地址 (映射自 detailUrl)

  // 统一处理后的绝对时间 (解决原始数据格式混乱问题)
  startTimestamp: number;     // 毫秒时间戳
  endTimestamp: number;       // 毫秒时间戳
  rawTimeStr: string;         // 保留原始时间字符串备用

  // 详情信息 (初始可能为空)
  mainVenue: string;          // 主会场
  parallelVenue: string;      // 分会场 (映射自 venueOfParallelSessions)
  introduction: string;       // 讲座简介

  // 元数据
  lastUpdatedAt: string;      // ISO 时间戳
}

interface UILecture extends MergedLecture {
    isStarred: boolean;  // 是否被加星
    type: 'science' | 'humanity'; // 讲座类型
    // --- 渲染计算属性 ---
    columnDayIndex: number; // 0-6，代表属于哪一列（0为今天）
    renderTop: string;      // Y轴绝对定位 (e.g., '25.5%')
    renderHeight: string;   // 高度 (e.g., '10%')
    renderLeft: string;     // X轴偏移 (e.g., '10px')
    renderWidth: string;    // 宽度 (e.g., 'calc(100% - 20px)')
    zIndex: number;         // 层级控制
}
```

---

## 3. 核心算法：日程重叠与布局计算 (The Overlap Algorithm)

这是本项目最复杂的部分。我们需要计算出每个讲座区块的绝对位置（绝对定位 `position: absolute`）。

### 3.1 基础坐标计算
* **Y轴 (时间)**: 假设日历显示从早 08:00 到晚 22:00（共14小时）。
    * 总高度为 `100%`。
    * `Top %` = `(讲座开始时间 - 08:00) / 14小时 * 100%`
    * `Height %` = `(讲座结束时间 - 开始时间) / 14小时 * 100%`

### 3.2 冲突处理 (层叠与错位)
**规则解析**：
1. **普通重叠**：X轴错开，按开始时间排序，后开始的压在先开始的上，左侧露出边缘。
2. **相同开始时间**：Y轴稍微错开，结束早的压在结束晚的上（多露边缘）。
3. **星标置顶**：加星的永远在最上层。

**算法步骤 (针对每一天的列独立计算)**：
1. **排序**：对当天的讲座进行排序。
    * 主要按 `startTimestamp` 升序。
    * 如果 `startTimestamp` 相同，按 `endTimestamp` **降序**（持续时间长的在下面）。
2. **分组 (Collision Groups)**：将有时间重叠的讲座分到一个组中。
3. **计算偏移**：
    * 遍历分组内的讲座。假设组内有 $N$ 个讲座，当前讲座是第 $i$ 个 (0-based)。
    * **X轴偏移**：`left = i * 12px`，`width = calc(100% - ${i * 12}px)`。
    * **Y轴偏移 (同时间)**：检查它前面的讲座，如果 `startTimestamp` 完全相同，则 `top = 原始top + (重名计数 * 4px)`，同时对应的调整 `height` 减去这 4px 以保证底部对齐。
    * **Z-Index**：基础 `z-index = i`。如果 `isStarred` 为 true，`z-index += 100`。

### 3.3 拥挤度数字指示器
在列的背景网格中绘制。
* 将一天划分为半小时的区块（共28块）。
* 计算每个区块包含的讲座数量。
* 如果数量 $\ge 2$，则在该网格右上角绝对定位一个小的数字 Badge（例如 `<div class="absolute top-1 right-1 text-xs text-gray-400">3</div>`）。

---

## 4. UI 布局与滚动策略 (Tailwind 实现)

根据你的要求：“不适应小屏，允许页面整体滚动，左右滚动不影响标题和侧边栏，上下滚动不影响侧边栏”。

### 4.1 布局结构
```html
<div class="w-screen h-screen overflow-hidden flex bg-gray-50">
  
  <!-- 主内容区：允许产生全局的滚动条 -->
  <div class="flex-1 overflow-auto relative" id="main-scroll-container">
    
    <!-- 头部：随Y轴滚动消失，随X轴滚动保持固定 (Sticky 方案) -->
    <header class="sticky left-0 top-0 w-max min-w-full px-8 py-4 bg-white shadow z-40">
       <h1 class="text-2xl font-bold">UCAS 讲座周历</h1>
       <div class="filters">...同步时间, 科学/人文筛选...</div>
    </header>

    <!-- 日历主体：设置最小尺寸，撑开父容器产生滚动条 -->
    <main class="min-w-[1200px] min-h-[800px] w-max p-8 relative flex">
       <!-- 时间轴列 -->
       <div class="w-16 flex flex-col">...08:00 到 22:00...</div>
       
       <!-- 7天列 (今天, 明天... 下周同天) -->
       <div class="flex-1 flex border-l-4 border-blue-500 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.1)]"> 
           <!-- 左边线加粗且有内阴影凸显“今天”的分界 -->
           <!-- 渲染 7 个 Column -->
       </div>

       <!-- 当前时间红线 (跨越整个周历绝对定位) -->
       <div class="absolute w-full h-px bg-red-500 z-30" style="top: {currentTimeY}%; pointer-events: none;">
          <div class="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-1"></div>
       </div>
    </main>
  </div>

  <!-- 侧边栏：固定在右侧，内部独立滚动 -->
  <aside class="w-80 h-full bg-white shadow-xl flex flex-col shrink-0 transform transition-transform border-l">
    <!-- 内部：overflow-y-auto -->
  </aside>

</div>
```

### 4.2 悬浮卡片 (Hover Card)
* **交互**：`onMouseEnter` 和 `onMouseLeave` 触发。
* **组件**：可以使用如 `@floating-ui/react` 库来计算卡片位置，防止卡片被视口边缘遮挡。卡片需要有高 `z-index`。

### 4.3 颜色主题定义
在 `tailwind.config.js` 中定义：
* **人文讲座 (Humanity)**：浅绿色背景，深绿色边框。
* **科学讲座 (Science)**：浅蓝色背景，深蓝色边框。
* **加星人文 (Starred Humanity)**：亮金/橘色边框，背景色加深，带有阴影。
* **加星科学 (Starred Science)**：亮金/橘色边框，背景色加深，带有阴影。

---

## 5. 组件划分

1.  **`App`**: 顶级组件，负责拉取数据、合并数据、管理全局状态（过滤条件、选中的讲座 ID、星标列表）。
2.  **`Header`**: 包含标题、最后更新时间、复选框（科学/人文）。
3.  **`Calendar`**: 接收过滤后的数据，计算当前时间线，渲染网格和列。
4.  **`ColumnDay`**: 渲染特定的一天，接收该天的所有讲座数据，**执行重叠算法**，渲染背景格子和重叠数字。
5.  **`LectureBlock`**: 具体的讲座色块。处理 Hover 事件、Click 事件、根据传入的算法结果进行绝对定位。
6.  **`HoverTooltip`**: 悬浮提示框，Portal 到 body 以免被 `overflow-hidden` 截断。
7.  **`Sidebar`**: 展示详情，包含星标按钮（点亮/取消）。
8.  **`CurrentTimeIndicator`**: 一个使用 `useEffect` 设置 `setInterval` (每分钟更新一次) 的红线组件。

---

## 6. 状态管理与数据流

使用原生的 React Hooks 即可：

```typescript
// App.tsx
const [scienceData, setScienceData] = useState<MergedLecture[]>([]);
const [humanityData, setHumanityData] = useState<MergedLecture[]>([]);
const [filters, setFilters] = useState({ showScience: true, showHumanity: true });
const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);

// 使用自定义 Hook 管理 localStorage 中的星标
const [starredIds, setStarredIds] = useLocalStorage<string[]>('ucas-starred-lectures', []);

// 派生状态 (Derived State)
const visibleLectures = useMemo(() => {
   // 1. 合并两个数组并打上 type 标签
   // 2. 根据 filters 过滤
   // 3. 过滤出时间在 "今天 00:00" 到 "下周同天 23:59" 范围内的数据
   // 4. 打上 isStarred 标签
}, [scienceData, humanityData, filters, starredIds]);
```

## 7. “今天与未来7天” 的时间戳边界逻辑
既然是“右侧是将来几天，左侧是下周同一时间”，其实这就是一个严格的 **未来 7 天滚动窗口**。
假设今天是周三：
* 列 0 (今天): 周三
* 列 1: 周四
* ...
* 列 6: 下周二
这个逻辑在实现上最简单：获取今天零点的时间戳 `todayStart`，获取 7 天后零点的时间戳 `endWindow`。遍历数据，把讲座扔进 `Math.floor((lecture.startTimestamp - todayStart) / 86400000)` 对应的列即可。

## 8. 总结与开发建议

1.  **从重叠算法开始写起**：这个是最难调试的。可以先 mock 几条数据（包括同时开始的、部分重叠的、完全包围的），写一个纯函数来输出算好的 `{ top, left, width, height, zIndex }`，并通过单元测试验证，再接入 UI。
2.  **绝对定位的坑**：讲座块必须放在以 `position: relative` 为基础的 Column 容器内，这样 `top` 和 `height` 的百分比才能精准对应这一天的高度。
3.  **PWA 配置**：在 `vite.config.ts` 中引入 `VitePWA` 插件，设置 `registerType: 'autoUpdate'`，这会让你的应用像原生 App 一样，即便在没网的情况下，只要之前打开过，就能直接看到最后一次抓取的周历，完美满足你在校园里随时查看的需求。

## 9. 附录

### 需求描述(供参考)

我打算在 GitHub Pages 上做一个日历(vite + react + tailwindcss), 仅显示一周内的所有讲座和时间地点(七列的表, 从上到下是时间, 用明显的线标出当前的时间, 今天的列左边线是明显的分割线, 右侧是将来几天, 左侧是下周同一时间), 讲座在表上占据一定时间区块, 如果同一时间段内有多个讲座, 则略微缩小宽度, 按开始时间排序, 后者压在前者上面, 仅在左侧露出一点边缘(因此要在x方向稍微错开一定), 如果两个(或多个)讲座开始时间一致, y坐标也稍微错开一点(相当于稍微错开开始时间和结束时间, 结束早的压住结束晚的, 尽量多露出区块的边缘). 对于时间重叠的段, 会在右上角显示数字代表当前时间段有几个重叠(可以不附在卡片上而是日程表列上).鼠标移到任何区域都会出现悬浮卡片简述内容, 点击会在侧边栏展开详细内容(以及每一个讲座的信息), 并且可以星标某个讲座. 加星标的讲座会显示在最上层, 且改变颜色: (共四种颜色, 科学讲座和人文讲座, 以及分别加星的).

最上方是页面标题, 下面有一些其它信息如显示当前数据同步时间, 筛选显示讲座类型. 下面是周历, 保证周历最小有一定宽度和高度, 不要让周历自己内部出现滚动 如果屏幕较大可以放大, 但也要有尺寸上限. 不要去做小屏适应, 让页面可以上下左右滚动如果超出尺寸. 左右滚动不影响标题和侧边栏, 上下滚动仅影响标题, 不影响侧边栏. 侧边栏内部如果显示不下可以在内部独立上下滚动. 单击侧边栏其它位置会自动收回.

我希望页面和数据是可离线加载的(数据用最新抓取的). 用户的星标也同样可以被记住.
讲座数据结构为 json, 需要从公开的 github 仓库抓取, 路径为 `https://raw.githubusercontent.com/Yi-Jun-Wu/UCAS-Lectures/refs/heads/main/science/latest.json` 与 `humanity/latest.json`