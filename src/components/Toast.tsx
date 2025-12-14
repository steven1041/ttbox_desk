import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  isVisible,
  onClose
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // 等待动画完成
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const typeIcons = {
    info: '📢',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-md transform transition-all duration-300 z-50 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`p-4 rounded-md shadow-lg text-white flex items-center ${typeStyles[type]}`}
      >
        <span className="mr-3 text-xl">{typeIcons[type]}</span>
        <p className="flex-1">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-3 text-white hover:text-gray-200"
        >
          ✖
        </button>
      </div>
    </div>
  );
};

export default Toast;
