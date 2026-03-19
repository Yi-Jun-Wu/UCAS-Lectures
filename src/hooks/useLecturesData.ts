import { useState, useEffect, useCallback } from 'react';
import type { RawLectureResponse, AggregatedLectures, SyncStatus } from '../types';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

interface UseLecturesDataReturn {
  data: AggregatedLectures | null;
  syncStatus: SyncStatus;
  lastUpdated: string | null;       // 数据源更新时间
  localSyncTime: number | null;     // 本地实际拉取时间
  refetch: (isManual?: boolean) => Promise<void>;     // 暴露的手动刷新方法
}

interface CachePayload {
  data: AggregatedLectures;
  generatedAt: string;
  localSyncTime: number;
}

export function useLecturesData(): UseLecturesDataReturn {
  const [data, setData] = useState<AggregatedLectures | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [localSyncTime, setLocalSyncTime] = useState<number | null>(null);

  // 初始化：同步读取本地缓存
  const loadFromCache = useCallback(() => {
    try {
      const cachedString = localStorage.getItem(STORAGE_KEYS.CACHED_LECTURES_DATA);
      if (cachedString) {
        const parsedCache: CachePayload = JSON.parse(cachedString);
        setData(parsedCache.data);
        setLastUpdated(parsedCache.generatedAt);
        setLocalSyncTime(parsedCache.localSyncTime || null);
        return true;
      }
    } catch (e) {
      console.warn('读取本地缓存失败:', e);
    }
    return false;
  }, []);

  // 核心抓取逻辑 (可被自动或手动调用)
  // src/hooks/useLecturesData.ts

  // ---> 找到原先的 refetch 函数，替换为以下代码 <---
  const refetch = useCallback(async (isManual: boolean = false) => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('fetching');

    try {
      // 如果是手动刷新，追加时间戳参数击穿 CDN 缓存，并指示浏览器不使用本地缓存
      const fetchOptions: RequestInit = isManual ? { cache: 'no-store' } : {};
      const cacheBuster = isManual ? `?t=${Date.now()}` : '';

      const [scienceRes, humanityRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.SCIENCE}${cacheBuster}`, fetchOptions),
        fetch(`${API_ENDPOINTS.HUMANITY}${cacheBuster}`, fetchOptions),
      ]);

      if (!scienceRes.ok || !humanityRes.ok) {
        throw new Error('网络请求异常');
      }

      const scienceJson: RawLectureResponse = await scienceRes.json();
      const humanityJson: RawLectureResponse = await humanityRes.json();

      const newData: AggregatedLectures = {
        science: scienceJson.lectures,
        humanity: humanityJson.lectures,
      };

      const sciTime = new Date(scienceJson.generatedAt).getTime();
      const humTime = new Date(humanityJson.generatedAt).getTime();
      const latestTimeStr = sciTime > humTime ? scienceJson.generatedAt : humanityJson.generatedAt;
      const currentLocalTime = Date.now();

      // 更新状态 (React 的 setState 引用是稳定的，不需要加入依赖数组)
      setData(newData);
      setLastUpdated(latestTimeStr);
      setLocalSyncTime(currentLocalTime);
      setSyncStatus('success');

      const cachePayload: CachePayload = {
        data: newData,
        generatedAt: latestTimeStr,
        localSyncTime: currentLocalTime,
      };
      localStorage.setItem(STORAGE_KEYS.CACHED_LECTURES_DATA, JSON.stringify(cachePayload));

    } catch (err) {
      console.error('拉取最新讲座数据失败:', err);
      // 不依赖 state 中的 data，直接向底层的 localStorage 要真相
      // 这样既能实现准确的降级判断，又能斩断 useCallback 的依赖闭包
      const hasCache = !!localStorage.getItem(STORAGE_KEYS.CACHED_LECTURES_DATA);
      setSyncStatus(hasCache ? 'offline' : 'error');
    }
  }, []); // 依赖数组彻底清空！

  // 首次挂载时的执行序列与全局网络事件监听
  useEffect(() => {
    // 尝试优先使用缓存，保证页面瞬间渲染
    loadFromCache();

    // 立即在后台静默发起一次同步
    refetch();

    // 监听浏览器的网络连通性变化
    const handleOnline = () => refetch(); // 网络恢复时自动再拉一次
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadFromCache, refetch]);

  return { data, syncStatus, lastUpdated, localSyncTime, refetch };
}