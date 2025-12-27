import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface UpdateState {
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  isInstallingUpdate: boolean;
}

interface UpdateActions {
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

export const useAppUpdater = (): UpdateState & UpdateActions => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);

  const checkForUpdates = useCallback(async () => {
    if (isCheckingUpdate) return;
    
    setIsCheckingUpdate(true);
    try {
      console.log("开始检查更新...");
      // 使用 Tauri v2 的 invoke 方法调用后端命令
      const hasUpdate = await invoke<boolean>('check_for_updates');
      
      if (hasUpdate) {
        setUpdateAvailable(true);
        console.log("发现新版本，可以点击更新按钮进行升级");
      } else {
        setUpdateAvailable(false);
        console.log("当前已是最新版本");
      }
    } catch (error) {
      console.error(`检查更新失败: ${error}`);
      setUpdateAvailable(false);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []); // 移除 isCheckingUpdate 依赖，防止无限循环

  const installUpdate = useCallback(async () => {
    if (isInstallingUpdate || !updateAvailable) return;
    
    setIsInstallingUpdate(true);
    try {
      // 使用 Tauri v2 的 invoke 方法调用后端命令
      await invoke('install_update');
      
      console.log("更新已开始下载和安装，完成后应用将自动重启");
    } catch (error) {
      console.error(`安装更新失败: ${error}`);
    } finally {
      setIsInstallingUpdate(false);
    }
  }, [isInstallingUpdate, updateAvailable]);

  // 应用启动时检查更新
  useEffect(() => {
    // 延迟3秒后自动检查更新，避免影响应用启动速度
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []); // 移除 checkForUpdates 依赖，防止无限循环

  return {
    updateAvailable,
    isCheckingUpdate,
    isInstallingUpdate,
    checkForUpdates,
    installUpdate
  };
};