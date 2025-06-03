// hooks/useBlobUrlManager.js
import { useRef, useCallback, useEffect } from 'react';

export const useBlobUrlManager = () => {
  // 使用 useRef 存储 Blob URL 的 Map，避免在每次渲染时重新创建
  const blobUrlsRef = useRef(new Map());

  /**
   * 创建一个 Blob URL 并存储起来，如果相同 ID 的 URL 已存在则先释放。
   * @param {Blob} blob - 要创建 URL 的 Blob 对象。
   * @param {string | number} id - 唯一标识符，用于管理和释放。
   * @returns {string} 创建的 Blob URL。
   */
  const createAndStoreBlobUrl = useCallback((blob, id) => {
    const url = URL.createObjectURL(blob);
    if (blobUrlsRef.current.has(id)) {
      URL.revokeObjectURL(blobUrlsRef.current.get(id));
      blobUrlsRef.current.delete(id); // 确保旧的 ID 被移除
    }
    blobUrlsRef.current.set(id, url);
    return url;
  }, []);

  /**
   * 释放指定 ID 的 Blob URL。
   * @param {string | number} id - 要释放的 Blob URL 的唯一标识符。
   */
  const revokeBlobUrl = useCallback((id) => {
    if (blobUrlsRef.current.has(id)) {
      URL.revokeObjectURL(blobUrlsRef.current.get(id));
      blobUrlsRef.current.delete(id);
    }
  }, []);

  /**
   * 释放所有存储的 Blob URL。
   */
  const clearAllBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, []);

  // 组件卸载时清理所有 Blob URLs
  useEffect(() => {
    return () => {
      clearAllBlobUrls();
    };
  }, [clearAllBlobUrls]); // 依赖 clearAllBlobUrls 确保其稳定性

  return { createAndStoreBlobUrl, revokeBlobUrl, clearAllBlobUrls };
};
