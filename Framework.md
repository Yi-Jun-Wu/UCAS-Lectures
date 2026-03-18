以下是 `src` 目录的完整规范化设计：

```text
src/
├── assets/                  # 静态资源 (如图标, 默认背景等)
├── types/                   # 全局 TypeScript 类型定义
│   └── index.ts
├── constants/               # 全局常量配置
│   └── config.ts
├── utils/                   # 纯函数工具库 (无副作用, 易于单元测试)
│   ├── overlapEngine.ts     # [核心] 日程重叠与坐标计算算法
│   └── dateHelpers.ts       # 日期/时间格式化及边界计算工具
├── hooks/                   # 自定义 React Hooks (处理状态与副作用)
│   ├── useLecturesData.ts   # 远程数据拉取与合并逻辑
│   └── useLocalStorage.ts   # 本地存储封装 (用于星标)
├── components/              # UI 组件库
│   ├── layout/              # 布局级组件
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── calendar/            # 日历专属业务组件
│   │   ├── CalendarGrid.tsx
│   │   ├── ColumnDay.tsx
│   │   ├── LectureBlock.tsx
│   │   └── TimeIndicator.tsx
│   └── ui/                  # 通用基础组件 (可选)
│       └── HoverTooltip.tsx
├── App.tsx                  # 根组件 (应用总控与状态派发)
├── main.tsx                 # React 挂载入口
└── index.css                # Tailwind 全局样式
```

---

### 详细文件功能与依赖说明

按照自底向上（从底层依赖到顶层视图）的顺序，各文件的内部结构如下：

#### 1. 类型与配置层 (`types/`, `constants/`)
* **`types/index.ts`**
    * **功能**: 定义所有核心数据接口。
    * **内容**: `MergedLecture` (原始数据)、`UILecture` (附加了 `isStarred`, `top`, `height` 等渲染属性的扩展接口)、`FilterState` (筛选器状态接口)。
* **`constants/config.ts`**
    * **功能**: 集中管理魔法字符串和硬编码配置。
    * **内容**: 导出 GitHub Raw URLs (`SCIENCE_DATA_URL`, `HUMANITY_DATA_URL`)、日历时间边界 (`DAY_START_HOUR = 8`, `DAY_END_HOUR = 22`)。

#### 2. 工具与算法层 (`utils/`)
* **`utils/dateHelpers.ts`**
    * **功能**: 处理纯粹的日期转换。
    * **函数**:
        * `getWeekWindow(baseDate)`: 返回当前视口 7 天的起止时间戳。
        * `getDayIndex(timestamp, windowStart)`: 计算某时间戳属于 0-6 中的哪一列。
        * `formatTimeStr(timestamp)`: 将时间戳转为 `HH:mm` 格式。
* **`utils/overlapEngine.ts`**
    * **功能**: **项目的核心大脑**。负责将一天内的数据转换为绝对定位坐标。
    * **函数**:
        * `calculateDayLayout(lectures: MergedLecture[]): UILecture[]`
    * **逻辑**: 对传入的单日讲座进行排序、分组（冲突检测）、计算 X 轴偏移宽度、计算 Y 轴高度与时间重叠错位修正，最后返回带有 `renderTop`, `renderHeight` 等属性的新数组。
    * **依赖**: `types/index.ts`, `constants/config.ts` (获取一天总时长以计算百分比)。

#### 3. 状态管理层 (`hooks/`)
* **`hooks/useLocalStorage.ts`**
    * **功能**: 提供对 localStorage 的响应式读写。
    * **函数**: `useLocalStorage<T>(key, initialValue)` -> `[storedValue, setValue]`。
* **`hooks/useLecturesData.ts`**
    * **功能**: 负责离线优先的数据拉取机制。
    * **函数**: `useLecturesData()` -> 返回 `{ data, isLoading, error, lastUpdated }`。
    * **逻辑**: 使用 `fetch` 并发请求科学和人文数据，处理 JSON 解析，捕获异常。如果配合 SWR 库，这里就是一层简单的 Fetcher 封装。
    * **依赖**: `constants/config.ts`, `types/index.ts`。

#### 4. 视图组件层 (`components/`)

**布局组件 (`components/layout/`)**
* **`Header.tsx`**
    * **功能**: 顶部状态栏。
    * **接收 Props**: `lastUpdated` (字符串), `filters` (当前筛选状态), `onFilterChange` (回调)。
    * **依赖**: Tailwind 样式。
* **`Sidebar.tsx`**
    * **功能**: 详情抽屉面板。
    * **接收 Props**: `selectedLecture` (选中数据), `isStarred` (布尔值), `onClose` (关闭回调), `onToggleStar` (切换星标回调)。

**日历核心组件 (`components/calendar/`)**
* **`CalendarGrid.tsx`**
    * **功能**: 渲染左侧的“时间轴列”（08:00 - 22:00），并将过滤后的一周数据按天拆分，分发给 7 个 `ColumnDay`。
    * **接收 Props**: `visibleLectures` (本周所有要显示的讲座数组), `onLectureClick` (回调)。
    * **依赖**: `ColumnDay.tsx`, `TimeIndicator.tsx`, `utils/dateHelpers.ts` (用于将总数据按天归类)。
* **`ColumnDay.tsx`**
    * **功能**: 渲染**单天**的一整列，包含背景网格和重叠度角标。
    * **接收 Props**: `dayLectures` (单天的原始数据数组), `isToday` (布尔值，用于加深左侧边框), `onLectureClick`。
    * **内部逻辑**: 在渲染前，调用 `calculateDayLayout(dayLectures)` 获取带有坐标的数据，然后 map 渲染 `LectureBlock`。
    * **依赖**: `utils/overlapEngine.ts`, `LectureBlock.tsx`。
* **`LectureBlock.tsx`**
    * **功能**: 具体的讲座卡片。
    * **接收 Props**: `lecture` (单条 `UILecture` 数据), `onClick`。
    * **内部逻辑**: 读取 `lecture.renderTop` 等属性直接赋值给元素的 `style`。处理悬浮态展示。
    * **依赖**: `ui/HoverTooltip.tsx`。
* **`TimeIndicator.tsx`**
    * **功能**: 全局红色时间线。
    * **内部逻辑**: 使用 `setInterval` 每分钟更新内部状态，计算当前时间相对于 08:00-22:00 的百分比并渲染一条绝对定位的红线。

#### 5. 顶层总控 (`App.tsx`)
* **功能**: 组装所有零件，管理全局唯一真理状态 (SSOT)。
* **内部状态**:
    * `filters`: `{ showScience: true, showHumanity: true }`
    * `selectedLectureId`: 当前侧边栏展示的讲座 ID。
    * 使用 `useLocalStorage` 获取 `starredIds` (字符串数组)。
    * 使用 `useLecturesData` 获取远程 `rawLectures`。
* **内部逻辑 (派生状态)**:
    * 使用 `useMemo` 监听上述状态，合成最终的 `visibleLectures` 数组（例如：剔除被 filter 关掉的类型，为含有对应 ID 的对象打上 `isStarred = true` 标签）。
* **依赖**: 引入所有的 hooks 和顶层布局/日历组件。
