import { useState, useEffect, useCallback } from 'react';

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
      // 使用 Tauri 的 invoke 方法调用后端命令
      const { invoke } = window.__TAURI__.core;
      const hasUpdate = await invoke('check_for_updates');
      
      if (hasUpdate) {
        setUpdateAvailable(true);
        console.log("发现新版本，可以点击更新按钮进行升级");
      } else {
        setUpdateAvailable(false);
        console.log("当前已是最新版本");
      }
    } catch (error) {
      console.error(`检查更新失败: ${error}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [isCheckingUpdate]);

  const installUpdate = useCallback(async () => {
    if (isInstallingUpdate || !updateAvailable) return;
    
    setIsInstallingUpdate(true);
    try {
      // 使用 Tauri 的 invoke 方法调用后端命令
      const { invoke } = window.__TAURI__.core;
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
  }, [checkForUpdates]);

  return {
    updateAvailable,
    isCheckingUpdate,
    isInstallingUpdate,
    checkForUpdates,
    installUpdate
  };
};