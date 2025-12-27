import React, { useEffect, useState } from "react";
import ConfigDashboard from "./components/ConfigDashboard";
import UpdateNotification from "./components/UpdateNotification";
import { useAppUpdater } from "./hooks/useAppUpdater";
import "./App.css";

function App() {
  const [showUpdateNotification, setShowUpdateNotification] = useState(true);
  const { updateAvailable, isCheckingUpdate, isInstallingUpdate, checkForUpdates, installUpdate } = useAppUpdater();

  useEffect(() => {
    // 初始化Tauri API
    const initTauriAPI = async () => {
      try {
        // 动态导入Tauri API以确保已加载
        const tauri = await import("@tauri-apps/api");
        console.log("Tauri API initialized successfully 2");
        
        // 将Tauri API对象暴露到全局，以便其他组件可以访问
        window.__TAURI_API__ = tauri;
      } catch (error) {
        console.error("Failed to initialize Tauri API:", error);
      }
    };

    // 给一些时间让Tauri环境完全加载
    const timer = setTimeout(() => initTauriAPI(), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismissUpdateNotification = () => {
    setShowUpdateNotification(false);
  };

  return (
    <div className="h-screen bg-background-dark font-sans text-text-dark-primary">
      <ConfigDashboard />
      <UpdateNotification
        updateAvailable={updateAvailable}
        isCheckingUpdate={isCheckingUpdate}
        isInstallingUpdate={isInstallingUpdate}
        onCheckUpdate={checkForUpdates}
        onInstallUpdate={installUpdate}
        onDismiss={handleDismissUpdateNotification}
        isVisible={showUpdateNotification}
      />
    </div>
  );
}

export default App;
