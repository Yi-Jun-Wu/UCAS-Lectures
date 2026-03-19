import { useState, useEffect, useCallback } from 'react';
import type { RawLectureResponse, AggregatedLectures, SyncStatus } from '../types';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

interface UseLecturesDataReturn {
  data: AggregatedLectures | null;
  syncStatus: SyncStatus;
  lastUpdated: string | null;       // 数据源更新时间
  localSyncTime: number | null;     // 本地实际拉取时间
  refetch: () => Promise<void>;     // 暴露的手动刷新方法
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
  const refetch = useCallback(async () => {
    // 1. 网络状态前置检查
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('fetching');

    try {
      const [scienceRes, humanityRes] = await Promise.all([
        fetch(API_ENDPOINTS.SCIENCE),
        fetch(API_ENDPOINTS.HUMANITY)
      ]);

      if (!scienceRes.ok || !humanityRes.ok) {
        throw new Error('网络请求异常');
      }

      const scienceJson: RawLectureResponse = await scienceRes.json();
      const humanityJson: RawLectureResponse = await humanityRes.json();

      // 组装数据，严格保留所有重复项，不做过滤
      const newData: AggregatedLectures = {
        science: scienceJson.lectures,
        humanity: humanityJson.lectures,
      };

      const sciTime = new Date(scienceJson.generatedAt).getTime();
      const humTime = new Date(humanityJson.generatedAt).getTime();
      const latestTimeStr = sciTime > humTime ? scienceJson.generatedAt : humanityJson.generatedAt;
      const currentLocalTime = Date.now();

      // 更新内存状态
      setData(newData);
      setLastUpdated(latestTimeStr);
      setLocalSyncTime(currentLocalTime);
      setSyncStatus('success');

      // 更新持久化缓存
      const cachePayload: CachePayload = {
        data: newData,
        generatedAt: latestTimeStr,
        localSyncTime: currentLocalTime,
      };
      localStorage.setItem(STORAGE_KEYS.CACHED_LECTURES_DATA, JSON.stringify(cachePayload));

    } catch (err) {
      console.error('拉取最新讲座数据失败:', err);
      // 如果报错时用户本身就有数据(缓存)，降级为 offline 提示；否则判定为 error
      setSyncStatus(data ? 'offline' : 'error');
    }
  }, [data]);

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