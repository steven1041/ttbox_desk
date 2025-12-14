# 天堂1配置仪表盘 - React + Tailwind CSS + Tauri

这个项目将原始的HTML配置仪表盘转换为了使用React、Tailwind CSS和shadcn/ui的现代化Tauri应用程序。

## 功能特点

### 1. 配置文件管理
- 自动搜索配置文件夹并查找所有.ini文件
- 加载和保存配置设置
- 友好的用户界面，带有Toast通知

### 2. 一键操作
- 一键无怪飞：输入飞行ID或选择预设路径
- 一键自动换头盔：设置力量、敏捷和挂机头盔
- 其他游戏功能快捷按钮

### 3. 文件系统操作
- 使用Tauri的fs插件进行文件操作
- 支持读取、写入和搜索文件
- 对话框支持选择文件和目录

## 技术栈

- **前端**: React 19 + TypeScript
- **样式**: Tailwind CSS + 自定义主题
- **UI组件**: shadcn/ui + Lucide图标
- **后端**: Tauri 2.0 + Rust
- **文件操作**: @tauri-apps/plugin-fs
- **对话框**: @tauri-apps/plugin-dialog

## 项目结构

```
ttbox/
├── src/
│   ├── components/
│   │   ├── ConfigDashboard.tsx  # 主配置仪表盘组件
│   │   └── Toast.tsx            # 通知组件
│   ├── hooks/
│   │   └── useFileSystem.ts      # 文件系统操作Hook
│   ├── lib/
│   │   └── utils.ts             # 工具函数
│   ├── App.tsx                  # 主应用组件
│   └── main.tsx                 # 应用入口点
├── src-tauri/
│   ├── src/
│   │   ├── main.rs              # 应用入口
│   │   └── lib.rs               # Tauri命令和插件初始化
│   ├── Cargo.toml               # Rust依赖
│   ├── tauri.conf.json          # Tauri配置
│   └── capabilities/
│       └── default.json         # 权限配置
├── package.json                 # Node.js依赖
├── tailwind.config.js           # Tailwind配置
└── postcss.config.js            # PostCSS配置
```

## 主要组件说明

### ConfigDashboard.tsx

主配置仪表盘组件，包含：

- 侧边导航栏
- 配置文件管理区
- 一键操作区
- 使用说明区
- Toast通知系统

```typescript
// 示例：搜索配置文件夹
const handleSearchConfigFolder = async () => {
  try {
    const selectedDir = await selectDirectory();
    if (!selectedDir) return;

    setConfigDir(selectedDir);
    addToast(`正在搜索配置文件在: ${selectedDir}`, "info");

    const files = await searchConfigFiles(selectedDir);
    if (files.length > 0) {
      setConfigFiles(files);
      setConfigFile(files[0]);
      addToast(`找到 ${files.length} 个配置文件`, "success");
    } else {
      addToast("未找到任何配置文件", "warning");
    }
  } catch (error) {
    addToast(`搜索配置文件失败: ${error}`, "error");
  }
};
```

### useFileSystem.ts

封装了所有文件系统操作的自定义Hook：

```typescript
export const useFileSystem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 读取文本文件
  const readTextFile = async (path: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const content = await fs.readTextFile(path);
      setLoading(false);
      return content;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 搜索配置文件
  const searchConfigFiles = async (dirPath: string, maxDepth: number = 5): Promise<string[]> => {
    const configFiles: string[] = [];
    // ... 递归搜索目录中的.ini文件
    return configFiles;
  };

  // 其他文件操作方法...
};
```

### Toast.tsx

简单的Toast通知组件，用于显示操作结果：

```typescript
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
  // 显示和隐藏动画逻辑
  return (
    <div className={`fixed top-4 right-4 max-w-md transform transition-all duration-300 z-50 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className={`p-4 rounded-md shadow-lg text-white flex items-center ${typeStyles[type]}`}>
        {/* 图标和消息内容 */}
      </div>
    </div>
  );
};
```

## 运行项目

1. 安装依赖：
   ```bash
   npm install
   ```

2. 运行开发服务器：
   ```bash
   npm run tauri dev
   ```

3. 构建应用：
   ```bash
   npm run tauri build
   ```

## 自定义主题

项目使用了自定义的Tailwind主题，包括：

- 深色模式背景和表面颜色
- 金色主题色
- 自定义阴影效果（如`shadow-ornate-gold`和`shadow-gold-glow`）
- 特殊的装饰性边框和分隔线样式

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: "#D4AF37", // 富金色
      "background-dark": "#2a2a2e", // 稍有纹理的深灰色
      "surface-dark": "#2C2C2C",
      "border-dark": "#444444",
      "text-dark-primary": "#FFFFFF",
      "text-dark-secondary": "#BDBDBD",
    },
    boxShadow: {
      'ornate-gold': '0 0 15px rgba(212, 175, 55, 0.3), 0 0 5px rgba(212, 175, 55, 0.5)',
      'gold-glow': '0 0 8px rgba(212, 175, 55, 0.4)'
    }
  },
},
```

## 权限配置

为了使用文件系统操作和对话框，在`src-tauri/capabilities/default.json`中配置了必要的权限：

```json
{
  "permissions": [
    "core:default",
    "opener:default",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-read-dir",
    "fs:allow-create-dir",
    "fs:allow-remove-file",
    "fs:allow-remove-dir",
    "fs:allow-exists",
    "fs:allow-copy-file",
    "fs:allow-rename",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

## 后续扩展

这个项目可以进一步扩展：

1. **更多游戏功能**：添加更多的游戏配置选项
2. **配置模板**：预设常用配置模板，一键应用
3. **备份与恢复**：配置文件的备份和恢复功能
4. **多语言支持**：添加英文或其他语言支持
5. **插件系统**：支持第三方插件扩展功能

这个项目展示了如何将传统的HTML页面转换为现代化的桌面应用，同时保持了原有的功能和设计风格。