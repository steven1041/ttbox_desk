import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Settings,
  BookOpen,
  Gavel,
  MessageSquare,
  Megaphone,
  Settings2,
  Lock,
  Unlock,
  Zap,
  Folder,
  FolderOpen,
  ChevronDown,
  Save,
  Upload,
  Search,
} from "lucide-react";
import { useFileSystem } from "../hooks/useFileSystem";
import Toast from "./Toast";

interface ToastMessage {
  id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

const ConfigDashboard: React.FC = () => {
  const [configFile, setConfigFile] = useState("打钱_亚丁.ini");
  const [configFiles, setConfigFiles] = useState<string[]>([]);
  const [configDir, setConfigDir] = useState<string>("");
  const [flightId, setFlightId] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [strHelmet, setStrHelmet] = useState("");
  const [agiHelmet, setAgiHelmet] = useState("");
  const [afkHelmet, setAfkHelmet] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [nextToastId, setNextToastId] = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    loading: fsLoading,
    error,
    selectDirectory,
    searchConfigFiles,
    readTextFile,
    writeTextFile,
  } = useFileSystem();

  const menuItems = [
    { icon: LayoutDashboard, label: "仪表盘", active: false },
    { icon: Settings2, label: "自动挂机设置", active: true },
    { icon: BookOpen, label: "指南与攻略", active: false },
    { icon: Gavel, label: "道具拍卖", active: false },
    { icon: MessageSquare, label: "社区论坛", active: false },
    { icon: Megaphone, label: "游戏公告", active: false },
    { icon: Settings, label: "应用设置", active: false },
  ];

  const flightPaths = [
    "路径：奇岩城镇广场",
    "路径：说话之岛码头",
    "路径：银骑士村庄",
  ];

  // 添加Toast通知
  const addToast = (
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
  ) => {
    const id = nextToastId;
    setNextToastId((prevId) => prevId + 1);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  // 移除Toast通知
  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // 搜索配置文件夹
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

  // 保存配置
  const handleSaveConfig = async () => {
    if (!configFile) {
      addToast("请先选择一个配置文件", "warning");
      return;
    }

    try {
      // 这里构建配置内容
      const configContent = `
# 自动换头盔设置
力量头盔=${strHelmet}
敏捷头盔=${agiHelmet}
挂机头盔=${afkHelmet}

# 飞行设置
飞行ID=${flightId}
挂机路径=${selectedPath}
      `.trim();

      await writeTextFile(configFile, configContent);
      addToast(`配置已自动保存到: ${configFile}`, "success");
    } catch (error) {
      addToast(`保存配置失败: ${error}`, "error");
    }
  };

  // 加载配置
  const handleLoadConfig = async () => {
    if (!configFile) {
      addToast("请先选择一个配置文件", "warning");
      return;
    }

    try {
      const content = await readTextFile(configFile);

      // 解析配置内容
      const lines = content.split("\n");
      const config: Record<string, string> = {};

      lines.forEach((line) => {
        const parts = line.split("=");
        if (parts.length === 2) {
          config[parts[0].trim()] = parts[1].trim();
        }
      });

      // 设置表单值
      if (config["力量头盔"]) setStrHelmet(config["力量头盔"]);
      if (config["敏捷头盔"]) setAgiHelmet(config["敏捷头盔"]);
      if (config["挂机头盔"]) setAfkHelmet(config["挂机头盔"]);
      if (config["飞行ID"]) setFlightId(config["飞行ID"]);
      if (config["挂机路径"]) setSelectedPath(config["挂机路径"]);

      addToast(`配置已从 ${configFile} 加载`, "success");
    } catch (error) {
      addToast(`加载配置失败: ${error}`, "error");
    }
  };

  // 当选择配置文件时，自动加载
  useEffect(() => {
    if (configFile && configFiles.length > 0) {
      handleLoadConfig();
    }
  }, [configFile]);

  // 当表单值变化时，自动保存
  useEffect(() => {
    const autoSaveTimeout = setTimeout(() => {
      if (
        configFile &&
        (strHelmet || agiHelmet || afkHelmet || flightId || selectedPath)
      ) {
        handleSaveConfig();
      }
    }, 1000); // 延迟1秒保存，避免频繁保存

    return () => clearTimeout(autoSaveTimeout);
  }, [strHelmet, agiHelmet, afkHelmet, flightId, selectedPath]);

  // 处理锁定配置
  const handleLockConfig = () => {
    addToast("配置已锁定", "success");
    // 这里可以添加实际的配置锁定逻辑
  };

  // 处理解锁配置
  const handleUnlockConfig = () => {
    addToast("配置已解锁", "success");
    // 这里可以添加实际的配置解锁逻辑
  };

  // 处理启用飞行
  const handleEnableFlight = () => {
    if (!flightId && !selectedPath) {
      addToast("请输入飞行ID或选择挂机路径", "warning");
      return;
    }
    addToast(`已启用飞行: ${flightId || selectedPath}`, "success");
    // 这里可以添加实际的飞行逻辑
  };

  // 处理启用自动换头盔
  const handleEnableHelmetSwap = () => {
    if (!strHelmet && !agiHelmet && !afkHelmet) {
      addToast("请至少设置一个头盔", "warning");
      return;
    }
    addToast("已启用自动换头盔", "success");
    // 这里可以添加实际的自动换头盔逻辑
  };

  // 处理自动施放光箭
  const handleAutoLightArrow = () => {
    addToast("已启用自动施放光箭", "success");
    // 这里可以添加实际的自动施放光箭逻辑
  };

  // 获取文件夹显示名称
  const getFolderName = () => {
    if (!configDir) return "一键自动搜索";

    // 在Windows和Unix路径中都能正确获取文件夹名
    const parts = configDir.split(/[/\\]/);
    return parts[parts.length - 1] || configDir;
  };

  return (
    <div className="flex min-h-screen bg-background-dark font-sans text-text-dark-primary">
      {/* Sidebar */}
      <aside className="w-1/4 min-w-[280px] flex flex-col glassmorphism separator-engraved">
        <nav className="p-6 h-full">
          <div className="mb-6">
            <h1 className="font-display text-2xl text-primary">天堂1配置</h1>
          </div>
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  className={`flex items-center gap-4 p-3 rounded-md transition-colors duration-200 ${
                    item.active
                      ? "bg-primary/20 text-primary border-l-4 border-primary"
                      : "text-text-dark-secondary hover:bg-primary hover:text-black"
                  }`}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <item.icon size={20} />
                  <span className="font-semibold">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="p-6 space-y-8 h-full">
          {/* Configuration Management Section */}
          <section>
            <h2 className="text-2xl font-display text-primary mb-4">
              配置管理
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* 配置文件夹选择按钮 - 现在在左边 */}
              <div>
                <label className="block text-sm font-medium text-text-dark-secondary mb-1">
                  配置文件夹
                </label>
                <button
                  className="w-full flex items-center justify-center gap-3 bg-surface-dark border border-border-dark text-text-dark-primary rounded-md hover:bg-primary/20 hover:border-primary/70 focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 px-3 py-2 h-10 text-sm"
                  onClick={handleSearchConfigFolder}
                  disabled={fsLoading}
                >
                  {fsLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : (
                    <Search size={16} className="text-primary" />
                  )}
                  <span>{getFolderName()}</span>
                </button>
              </div>

              {/* 配置文件下拉框 - 现在在右边 */}
              <div>
                <label
                  className="block text-sm font-medium text-text-dark-secondary mb-1"
                  htmlFor="config-file"
                >
                  选择配置文件
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-dark/50 border border-border-dark text-text-dark-primary rounded-md focus:ring-primary focus:border-primary px-3 py-2 h-10 appearance-none text-sm"
                    id="config-file"
                    name="config-file"
                    value={configFile}
                    onChange={(e) => setConfigFile(e.target.value)}
                  >
                    {configFiles.length === 0 && (
                      <option value="">请先搜索配置文件</option>
                    )}
                    {configFiles.map((file, index) => (
                      <option key={index} value={file}>
                        {file}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-text-dark-secondary"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {/* Config Status */}
            {configFile && (
              <div className="mt-4 flex items-center gap-2">
                <FolderOpen size={16} className="text-primary" />
                <span className="text-sm text-text-dark-secondary">
                  当前配置文件: {configFile}
                </span>
                <span className="text-xs text-green-400 ml-2">
                  (自动保存已启用)
                </span>
              </div>
            )}
          </section>

          {/* One-Click Operations Section */}
          <section>
            <h3 className="text-xl font-display text-primary mb-4">一键操作</h3>
            <div className="space-y-6">
              {/* Flight Options */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-black/20 rounded-lg border border-border-dark">
                <div className="flex-grow">
                  <label
                    className="font-semibold text-text-dark-primary block"
                    htmlFor="flight-id"
                  >
                    一键无怪飞
                  </label>
                  <p className="text-sm text-text-dark-secondary">
                    立即使用卷轴飞到安全区。
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0 w-full flex-wrap sm:flex-nowrap sm:w-auto">
                  <input
                    className="w-full sm:w-48 bg-surface-dark border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 placeholder:text-text-dark-secondary/70 px-3 py-2 text-sm"
                    id="flight-id"
                    placeholder="输入飞行ID"
                    type="text"
                    value={flightId}
                    onChange={(e) => setFlightId(e.target.value)}
                  />
                  <div className="relative">
                    <select
                      className="w-full sm:w-auto bg-surface-dark border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 appearance-none px-3 py-2 pr-8 text-sm"
                      name="afk-path"
                      value={selectedPath}
                      onChange={(e) => setSelectedPath(e.target.value)}
                    >
                      <option value="">选择挂机路径</option>
                      {flightPaths.map((path, index) => (
                        <option key={index} value={path}>
                          {path}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
                      size={16}
                    />
                  </div>
                  <button
                    className="w-full sm:w-auto flex-shrink-0 bg-primary text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition-colors duration-200 shadow-ornate-gold"
                    onClick={handleEnableFlight}
                  >
                    启用
                  </button>
                </div>
              </div>

              {/* Helmet Options */}
              <div className="p-4 bg-black/20 rounded-lg border border-border-dark">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <p className="font-semibold text-text-dark-primary">
                      一键自动换头盔
                    </p>
                    <p className="text-sm text-text-dark-secondary">
                      定义头盔以便根据情况快速切换。
                    </p>
                  </div>
                  <button
                    className="w-full sm:w-auto flex-shrink-0 bg-primary text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition-colors duration-200 shadow-ornate-gold"
                    onClick={handleEnableHelmetSwap}
                  >
                    启用
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-text-dark-secondary mb-1"
                      htmlFor="str-helmet"
                    >
                      力量头盔
                    </label>
                    <input
                      className="w-full bg-surface-dark border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 placeholder:text-text-dark-secondary/70 px-3 py-2 text-sm"
                      id="str-helmet"
                      placeholder="例如：钢铁头盔"
                      type="text"
                      value={strHelmet}
                      onChange={(e) => setStrHelmet(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-text-dark-secondary mb-1"
                      htmlFor="agi-helmet"
                    >
                      敏捷头盔
                    </label>
                    <input
                      className="w-full bg-surface-dark border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 placeholder:text-text-dark-secondary/70 px-3 py-2 text-sm"
                      id="agi-helmet"
                      placeholder="例如：精灵头盔"
                      type="text"
                      value={agiHelmet}
                      onChange={(e) => setAgiHelmet(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-text-dark-secondary mb-1"
                      htmlFor="afk-helmet"
                    >
                      挂机头盔
                    </label>
                    <input
                      className="w-full bg-surface-dark border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 placeholder:text-text-dark-secondary/70 px-3 py-2 text-sm"
                      id="afk-helmet"
                      placeholder="例如：秘银头盔"
                      type="text"
                      value={afkHelmet}
                      onChange={(e) => setAfkHelmet(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 text-text-dark-primary font-bold py-3 px-4 rounded-md hover:bg-gray-500 transition-colors duration-200"
                  onClick={handleLockConfig}
                >
                  <Lock size={18} /> 锁定配置
                </button>
                <button
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 text-text-dark-primary font-bold py-3 px-4 rounded-md hover:bg-gray-500 transition-colors duration-200"
                  onClick={handleUnlockConfig}
                >
                  <Unlock size={18} /> 解锁配置
                </button>
                <button
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 text-text-dark-primary font-bold py-3 px-4 rounded-md hover:bg-gray-500 transition-colors duration-200 col-span-1 sm:col-span-2 lg:col-span-1"
                  onClick={handleAutoLightArrow}
                >
                  <Zap size={18} /> 自动施放光箭
                </button>
              </div>
            </div>
          </section>

          {/* Instructions Section */}
          <section>
            <h3 className="text-xl font-display text-primary mb-4">使用说明</h3>
            <div className="p-6 bg-black/20 rounded-lg border border-border-dark space-y-4 text-text-dark-secondary">
              <div>
                <h4 className="font-semibold text-text-dark-primary mb-1">
                  配置文件
                </h4>
                <p className="text-sm">
                  选择一个角色配置文件和一个配置文件（.ini）以加载特定设置。当前激活的配置文件将是机器人使用的。您可以为不同的活动（如打钱、狩猎首领或练级）创建不同的
                  .ini 文件。
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-text-dark-primary mb-1">
                  一键操作
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>无怪飞：</strong>{" "}
                    输入有效的飞行卷轴ID（例如，`scroll_of_escape_giran`）或从下拉菜单中选择一个预定义的挂机路径。点击"启用"将立即使用该物品。这对于快速逃脱或移动到安全区很有用。
                  </li>
                  <li>
                    <strong>自动换头盔：</strong>{" "}
                    输入您的力量、敏捷和挂机头盔在游戏中的确切名称。启用此功能后，机器人将根据战斗状态或您是否挂机自动切换头盔。
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-text-dark-primary mb-1">
                  常规控制
                </h4>
                <p className="text-sm">
                  使用"锁定配置"按钮以防止在机器人运行时意外更改。点击"解锁配置"进行调整。其他按钮为您
                  .ini 文件中定义的常用增益或操作提供快速切换。
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ConfigDashboard;
