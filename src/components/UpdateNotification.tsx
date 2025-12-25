import React from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

interface UpdateNotificationProps {
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  isInstallingUpdate: boolean;
  onCheckUpdate: () => void;
  onInstallUpdate: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  updateAvailable,
  isCheckingUpdate,
  isInstallingUpdate,
  onCheckUpdate,
  onInstallUpdate,
  onDismiss,
  isVisible
}) => {
  if (!isVisible || (!updateAvailable && !isCheckingUpdate)) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-green-600/90 border border-green-500/70 rounded-lg shadow-lg p-4 text-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isCheckingUpdate ? (
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-sm font-medium">正在检查更新...</span>
            </div>
          ) : updateAvailable ? (
            <div>
              <h4 className="text-sm font-semibold mb-1">发现新版本</h4>
              <p className="text-xs opacity-90 mb-3">点击下方按钮下载并安装最新版本</p>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-xs transition-colors"
                  onClick={onInstallUpdate}
                  disabled={isInstallingUpdate}
                >
                  <Download size={12} className={isInstallingUpdate ? 'animate-bounce' : ''} />
                  {isInstallingUpdate ? '安装中...' : '立即更新'}
                </button>
                <button
                  className="bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-xs transition-colors"
                  onClick={onDismiss}
                >
                  稍后提醒
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {!isCheckingUpdate && (
          <button
            className="ml-2 text-white/70 hover:text-white"
            onClick={onDismiss}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default UpdateNotification;