import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // 初始化状态时，惰性读取 localStorage，避免每次渲染都执行昂贵的 IO 操作
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`读取 localStorage 键 "${key}" 失败:`, error);
      return initialValue;
    }
  });

  // 包装 setState 函数，使其在更新 React 状态的同时写入 localStorage
  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      // 兼容传入回调函数的情况 (e.g., setStarred(prev => [...prev, id]))
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`设置 localStorage 键 "${key}" 失败:`, error);
    }
  };

  return [storedValue, setValue];
}