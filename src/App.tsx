import React, { useEffect, useState } from "react";
import ConfigDashboard from "./components/ConfigDashboard";
import UpdateNotification from "./components/UpdateNotification";
import AuthForm from "./components/AuthForm";
import { useAppUpdater } from "./hooks/useAppUpdater";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

function App() {
  const [showUpdateNotification, setShowUpdateNotification] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { updateAvailable, isCheckingUpdate, isInstallingUpdate, downloadProgress, checkForUpdates, installUpdate } = useAppUpdater();
  const { isAuthenticated, user, isLoading: authLoading, login, register, logout, clearError, error: authError } = useAuth();

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

  const handleAuth = async (credentials: any) => {
    let success = false;
    if (isLoginMode) {
      success = await login(credentials);
    } else {
      success = await register(credentials);
    }
    
    if (success) {
      clearError();
    }
    
    return success;
  };

  // 如果未认证，显示登录/注册表单
  if (!isAuthenticated) {
    return (
      <AuthForm
        isLogin={isLoginMode}
        onToggleMode={() => setIsLoginMode(!isLoginMode)}
        onSubmit={handleAuth}
        isLoading={authLoading}
        error={authError}
        clearError={clearError}
      />
    );
  }

  // 已认证，显示主界面
  return (
    <div className="h-screen bg-background-dark font-sans text-text-dark-primary">
      <div className="relative">
        {/* 用户信息栏 */}
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-white text-sm">
            欢迎, {user?.email}
          </span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            退出登录
          </button>
        </div>
        
        <ConfigDashboard />
        
        <UpdateNotification
          updateAvailable={updateAvailable}
          isCheckingUpdate={isCheckingUpdate}
          isInstallingUpdate={isInstallingUpdate}
          downloadProgress={downloadProgress}
          onCheckUpdate={checkForUpdates}
          onInstallUpdate={installUpdate}
          onDismiss={handleDismissUpdateNotification}
          isVisible={showUpdateNotification}
        />
      </div>
    </div>
  );
}

export default App;
