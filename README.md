# UCAS-Lectures
A database storing lectures arrangements of UCAS. Also provide a website to deploy online Weekly Schedule

分析我的详细需求, 思考结构与逻辑, 以及各种细节的实现. 给出详细的设计文档.
我初步的打算是在 GitHub Pages 上做一个日历(vite + react + tailwindcss), 仅显示一周内的所有讲座和时间地点(七列的表, 从上到下是时间, 用明显的线标出当前的时间, 今天的列左边线是明显的分割线, 右侧是将来几天, 左侧是下周同一时间), 讲座在表上占据一定时间区块, 如果同一时间段内有多个讲座, 则略微缩小宽度, 按开始时间排序, 后者压在前者上面, 仅在左侧露出一点边缘(因此要在x方向稍微错开一定), 如果两个(或多个)讲座开始时间一致, y坐标也稍微错开一点(相当于稍微错开开始时间和结束时间, 结束早的压住结束晚的, 尽量多露出区块的边缘). 对于时间重叠的段, 会在右上角显示数字代表当前时间段有几个重叠(可以不附在卡片上而是日程表列上).鼠标移到任何区域都会出现悬浮卡片简述内容, 点击会在侧边栏展开详细内容(以及每一个讲座的信息), 并且可以星标某个讲座. 加星标的讲座会显示在最上层, 且改变颜色: (共四种颜色, 科学讲座和人文讲座, 以及分别加星的).
最上方是页面标题, 下面有一些其它信息如显示当前数据同步时间, 筛选显示讲座类型. 下面是周历, 保证周历最小有一定宽度和高度, 不要让周历自己内部出现滚动 如果屏幕较大可以放大, 但也要有尺寸上限. 不要去做小屏适应, 让页面可以上下左右滚动如果超出尺寸. 左右滚动不影响标题和侧边栏, 上下滚动仅影响标题, 不影响侧边栏. 侧边栏内部如果显示不下可以在内部独立上下滚动. 单击侧边栏其它位置会自动收回. 

我希望页面和数据是可离线加载的(数据用最新抓取的). 用户的星标也同样可以被记住(localStorage or indexedStorage?)

数据结构为 json, 需要从公开的 github 仓库抓取, (公共 ip 是否会触发速率限制?).
路径为 `https://raw.githubusercontent.com/Yi-Jun-Wu/UCAS-Lectures/refs/heads/main/science/latest.json` 与 `humanity/latest.json`

```ts
{
  "generatedAt": "2026-03-18T11:07:49.746Z",
  "total": 21,
  "lectures": []
}
export interface MergedLecture {
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
```