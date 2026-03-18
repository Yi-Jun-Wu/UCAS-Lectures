import { useState, useEffect, useCallback } from 'react';
import type { RawLectureResponse, AggregatedLectures } from '../types';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

interface UseLecturesDataReturn {
  data: AggregatedLectures | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: string | null;
}

// 缓存数据的完整结构
interface CachePayload {
  data: AggregatedLectures;
  generatedAt: string; // 记录这批缓存是何时生成/拉取的
}

export function useLecturesData(): UseLecturesDataReturn {
  const [data, setData] = useState<AggregatedLectures | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // 初始化：尝试从本地存储加载数据
  const loadFromCache = useCallback(() => {
    try {
      const cachedString = localStorage.getItem(STORAGE_KEYS.CACHED_LECTURES_DATA);
      if (cachedString) {
        const parsedCache: CachePayload = JSON.parse(cachedString);
        setData(parsedCache.data);
        setLastUpdated(parsedCache.generatedAt);
        return true;
      }
    } catch (e) {
      console.warn('缓存读取失败，将重新拉取:', e);
    }
    return false;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLectures = async () => {
      // 1. 先尝试加载缓存。如果缓存存在，UI 会立刻渲染，此时把 isLoading 设为假，但在后台继续 fetch
      const hasCache = loadFromCache();
      if (!hasCache) setIsLoading(true);
      setError(null);

      try {
        // 2. 并发请求两路数据
        const [scienceRes, humanityRes] = await Promise.all([
          fetch(API_ENDPOINTS.SCIENCE),
          fetch(API_ENDPOINTS.HUMANITY)
        ]);

        if (!scienceRes.ok || !humanityRes.ok) {
          throw new Error(`网络请求失败: Sci(${scienceRes.status}) Hum(${humanityRes.status})`);
        }

        const scienceJson: RawLectureResponse = await scienceRes.json();
        const humanityJson: RawLectureResponse = await humanityRes.json();

        // 3. 构建新的聚合数据。直接保留全部列表项，不做任何重复项过滤。
        const newData: AggregatedLectures = {
          science: scienceJson.lectures,
          humanity: humanityJson.lectures,
        };

        // 采用科学讲座和人文讲座中较新的生成时间作为总体更新时间
        const sciTime = new Date(scienceJson.generatedAt).getTime();
        const humTime = new Date(humanityJson.generatedAt).getTime();
        const latestTimeStr = sciTime > humTime ? scienceJson.generatedAt : humanityJson.generatedAt;

        if (isMounted) {
          // 4. 更新内存状态
          setData(newData);
          setLastUpdated(latestTimeStr);
          setIsLoading(false);

          // 5. 更新本地持久化缓存
          const cachePayload: CachePayload = {
            data: newData,
            generatedAt: latestTimeStr,
          };
          localStorage.setItem(STORAGE_KEYS.CACHED_LECTURES_DATA, JSON.stringify(cachePayload));
        }
      } catch (err: any) {
        if (isMounted) {
          // 如果有缓存，即使断网也只报 warning，不破坏现有数据展示
          if (!hasCache) {
            setError(err);
          } else {
            console.error('后台静默更新失败，继续使用本地缓存:', err);
          }
          setIsLoading(false);
        }
      }
    };

    fetchLectures();

    return () => {
      isMounted = false;
    };
  }, [loadFromCache]);

  return { data, isLoading, error, lastUpdated };
}