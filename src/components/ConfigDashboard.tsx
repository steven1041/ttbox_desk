import React, { useState, useEffect } from "react";
import {
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


const ConfigDashboard: React.FC = () => {
  const [configFile, setConfigFile] = useState("");
  const [configFiles, setConfigFiles] = useState<string[]>([]);
  const [configDir, setConfigDir] = useState<string>("");
  const [characterFolders, setCharacterFolders] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [flightId, setFlightId] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [strHelmet, setStrHelmet] = useState("");
  const [agiHelmet, setAgiHelmet] = useState("");
  const [afkHelmet, setAfkHelmet] = useState("");
  const [strHelmetLevel, setStrHelmetLevel] = useState("+0");
  const [agiHelmetLevel, setAgiHelmetLevel] = useState("+0");
  const [loading, setLoading] = useState(false);
  const [pathRecords, setPathRecords] = useState<string[]>([]);
  const [isConfigLocked, setIsConfigLocked] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const {
    loading: fsLoading,
    error,
    selectDirectory,
    searchLineageConfigDir,
    readTextFileViaRust,
    writeTextFileViaRust,
    writeTextFileViaRustWithGBK,
    existsViaRust,
    readDirViaRust,
    setFileReadonly,
    isFileReadonly,
  } = useFileSystem();

  const menuItems = [
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



  // 显示通知
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
    
    // 3秒后自动隐藏
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };


  // 读取配置文件中的路径记录
  const readPathRecords = async (filePath: string) => {
    try {
      console.log(`正在读取路径记录: ${filePath}`);
      const content = await readTextFileViaRust(filePath);
      console.log(`文件内容长度: ${content.length} 字符`);
      
      // 尝试解析JSON文件
      try {
        const config = JSON.parse(content);
        if (config.PathCfg && config.PathCfg.pathRecords && Array.isArray(config.PathCfg.pathRecords)) {
          const pathNamePromises = config.PathCfg.pathRecords.map(async (record: any) => {
              // 处理可能的编码问题
              let name = record.name || '';
              // 如果名称包含乱码字符，使用后端进行GBK解码
              if (name && typeof name === 'string') {
                // 检查是否包含乱码字符
                if (name.includes('�') || name.includes('?') || /[^\x00-\x7F\u4e00-\u9fa5]/.test(name)) {
                  console.log(`检测到乱码字符: ${name}`);
                  
                  // 使用后端进行GBK解码
                  try {
                    const { invoke } = window.__TAURI__.core;
                    const decodedName = await invoke('decode_gbk_text', { text: name });
                    name = decodedName;
                    console.log(`后端GBK解码结果: ${name}`);
                  } catch (decodeError) {
                    console.warn(`后端GBK解码失败: ${decodeError}`);
                    // 如果解码失败，至少移除明显的乱码字符
                    name = name.replace(/[^\x00-\x7F\u4e00-\u9fa5]/g, '').trim();
                  }
                }
                
                // 如果清理后为空，使用默认名称
                if (!name) {
                  name = `路径${config.PathCfg.pathRecords.indexOf(record) + 1}`;
                }
              }
              return name;
            });
            
          const pathNames = (await Promise.all(pathNamePromises)).filter((name: string) => name); // 过滤掉空名称
          
          console.log(`JSON解析找到 ${pathNames.length} 个路径名称:`, pathNames);
          setPathRecords(pathNames);
          return pathNames;
        } else {
          console.warn("JSON中没有找到PathCfg.pathRecords或pathRecords不是数组");
        }
      } catch (jsonError) {
        console.warn(`JSON解析失败: ${jsonError}`);
      }
      
      // 如果都没有找到，返回空数组
      console.warn("未找到任何路径记录");
      setPathRecords([]);
      return [];
    } catch (error) {
      console.error(`读取路径记录失败: ${error}`);
      showToast(`读取路径记录失败: ${error}`, 'error');
      return [];
    }
  };

  // 搜索配置文件夹
  const handleSearchConfigFolder = async () => {
    try {
      console.log("请选择 PSS 目录...");
      
      // 使用文件对话框让用户选择PSS目录
      const lineageDir = await searchLineageConfigDir();
      
      if (!lineageDir) {
        console.warn("未选择有效的 PSS 配置目录");
        return;
      }
      
      setConfigDir(lineageDir);
      console.log(`找到 PSS 配置目录: ${lineageDir}`);
      
      // 处理找到的配置目录
      await processConfigDirectory(lineageDir);
    } catch (error) {
      console.error(`搜索配置文件夹失败: ${error}`);
      showToast(`搜索配置文件夹失败: ${error}`, 'error');
    }
  };

  // 处理配置目录的通用函数
  const processConfigDirectory = async (baseDir: string) => {
    try {
      // 获取PSS文件夹下的角色文件夹
      let pssDir: string;
      
      // 检查baseDir是否已经是PSS目录
      if (baseDir.endsWith('PSS') || baseDir.includes('/PSS') || baseDir.includes('\\PSS')) {
        pssDir = baseDir;
      } else {
        // 处理Windows路径
        if (baseDir.includes('\\')) {
          pssDir = `${baseDir}\\Config\\PSS`;
        } else {
          pssDir = `${baseDir}/Config/PSS`;
        }
      }

      // 检查并修复路径中的重复Config问题
      const normalizedPath = pssDir.replace(/\/Config\/Config\//g, '/Config/').replace(/\\Config\\Config\\/g, '\\Config\\');
      
      console.log(`正在读取PSS目录: ${normalizedPath}`);

      const entries = await readDirViaRust(normalizedPath);
      const characterFolders = entries
        .filter((entry) => entry.is_dir)
        .map((entry) => entry.name);

      if (characterFolders.length > 0) {
        setCharacterFolders(characterFolders);
        setSelectedCharacter(characterFolders[0]);

        // 获取第一个角色文件夹中的配置文件
        const characterDir = `${normalizedPath}/${characterFolders[0]}`;
        
        console.log(`正在读取角色目录: ${characterDir}`);
        
        try {
          const configEntries = await readDirViaRust(characterDir);
          const cfgFiles = configEntries
            .filter(
              (entry) => !entry.is_dir && entry.name.endsWith(".cfg"),
            )
            .map((entry) => entry.name);

          setConfigFiles(cfgFiles);
          if (cfgFiles.length > 0) {
            setConfigFile(cfgFiles[0]);
          }

          console.log(
            `找到 ${characterFolders.length} 个角色文件夹和 ${cfgFiles.length} 个配置文件`,
          );
        } catch (configError) {
          console.error(`读取角色配置文件失败: ${configError}`);
          setConfigFiles([]);
        }
      } else {
        console.warn("未找到任何角色文件夹");
      }
    } catch (dirError) {
      console.error(`读取PSS目录失败: ${dirError}`);
    }
  };

  // 处理角色选择变化
  const handleCharacterChange = async (characterName: string) => {
    setSelectedCharacter(characterName);
    
    if (configDir) {
      // 确保使用正确的路径分隔符，避免重复的Config
      let characterDir: string;
      if (configDir.includes('\\')) {
        characterDir = `${configDir}\\PSS\\${characterName}`;
      } else {
        characterDir = `${configDir}/PSS/${characterName}`;
      }
      
      console.log(`正在读取角色目录: ${characterDir}`);
      
      try {
        const entries = await readDirViaRust(characterDir);
        const cfgFiles = entries
          .filter((entry) => !entry.is_dir && entry.name.endsWith(".cfg"))
          .map((entry) => entry.name);

        setConfigFiles(cfgFiles);
        if (cfgFiles.length > 0) {
          setConfigFile(cfgFiles[0]);
          console.log(`找到 ${cfgFiles.length} 个配置文件`);
          
          // 读取第一个配置文件中的路径记录
          let firstConfigPath: string;
          if (characterDir.includes('\\')) {
            firstConfigPath = `${characterDir}\\${cfgFiles[0]}`;
          } else {
            firstConfigPath = `${characterDir}/${cfgFiles[0]}`;
          }
          await readPathRecords(firstConfigPath);
        } else {
          console.warn(`角色 ${characterName} 中没有找到 .cfg 配置文件`);
        }
      } catch (error) {
        console.error(`读取角色 ${characterName} 的配置文件失败: ${error}`);
        setConfigFiles([]);
      }
    }
  };


  // 加载配置
  const handleLoadConfig = async () => {
    if (!configFile || !selectedCharacter || !configDir) {
      console.warn("请先选择一个配置文件");
      return;
    }

    try {
      // 构建完整的配置文件路径
      let configFilePath: string;
      if (configDir.includes('\\')) {
        configFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${configFile}`;
      } else {
        configFilePath = `${configDir}/PSS/${selectedCharacter}/${configFile}`;
      }

      // 自动将文件设置为可写状态，允许用户进行操作
      await setFileReadonly(configFilePath, false);
      
      // 提示用户记得在编辑完成后锁定配置
      showToast("配置文件已设置为可写状态，编辑完成后请记得点击锁定配置按钮", 'info');

      let content = await readTextFileViaRust(configFilePath);
      let config: any;

      try {
        // 尝试直接解析JSON
        config = JSON.parse(content);
      } catch (jsonError) {
        console.warn("直接解析JSON失败，尝试移除注释后解析:", jsonError);
        
        // 如果直接解析失败，尝试移除注释后再解析
        try {
          // 移除单行注释 (// 注释)
          let cleanedContent = content.replace(/\/\/.*$/gm, '');
          // 移除多行注释 (/* 注释 */)
          cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
          // 移除以#开头的注释
          cleanedContent = cleanedContent.replace(/^#.*$/gm, '');
          
          // 再次尝试解析
          config = JSON.parse(cleanedContent);
          console.log("移除注释后成功解析JSON");
        } catch (cleanedError) {
          console.error("移除注释后仍然无法解析JSON:", cleanedError);
          throw new Error(`配置文件格式错误，无法解析为JSON: ${cleanedError}`);
        }
      }

      // 检查文件的实际只读状态
      const fileReadonly = await isFileReadonly(configFilePath);
      
      // 检查配置是否被锁定（仅用于显示状态）
      const configLocked = config.ConfigLock && config.ConfigLock.locked;
      
      // 只有当文件实际为只读时，才设置界面锁定状态
      // 如果只是配置标记为锁定但文件可写，不自动锁定界面
      if (fileReadonly) {
        setIsConfigLocked(true);
        showToast("配置文件为只读状态，已自动解锁以供编辑", 'info');
      } else {
        // 不管配置之前是否被锁定，都设置为未锁定状态
        // 用户选择配置文件就是为了操作，不应该自动锁定
        setIsConfigLocked(false);
      }

      // 加载头盔配置
      if (config.ItemCfg && config.ItemCfg.HelmetSwap) {
        // 解析力量头盔
        const strHelmetFull = config.ItemCfg.HelmetSwap.strHelmet || "";
        if (strHelmetFull) {
          const strMatch = strHelmetFull.match(/^(\+\d+)\s+(.+)$/);
          if (strMatch) {
            setStrHelmetLevel(strMatch[1]);
          } else {
            // 如果没有匹配到格式，设置为默认值
            setStrHelmetLevel("+0");
          }
        }
        
        // 解析敏捷头盔
        const agiHelmetFull = config.ItemCfg.HelmetSwap.agiHelmet || "";
        if (agiHelmetFull) {
          const agiMatch = agiHelmetFull.match(/^(\+\d+)\s+(.+)$/);
          if (agiMatch) {
            setAgiHelmetLevel(agiMatch[1]);
          } else {
            // 如果没有匹配到格式，设置为默认值
            setAgiHelmetLevel("+0");
          }
        }
        
        setAfkHelmet(config.ItemCfg.HelmetSwap.afkHelmet || "");
      }

      // 加载路径记录
      if (config.PathCfg && config.PathCfg.pathRecords) {
        const pathNamePromises = config.PathCfg.pathRecords.map(async (record: any) => {
          // 处理可能的编码问题
          let name = record.name || '';
          // 如果名称包含乱码字符，使用后端进行GBK解码
          if (name && typeof name === 'string') {
            // 检查是否包含乱码字符
            if (name.includes('�') || name.includes('?') || /[^\x00-\x7F\u4e00-\u9fa5]/.test(name)) {
              console.log(`加载配置时检测到乱码字符: ${name}`);
              
              // 使用后端进行GBK解码
              try {
                const { invoke } = window.__TAURI__.core;
                const decodedName = await invoke('decode_gbk_text', { text: name });
                name = decodedName;
                console.log(`加载配置后端GBK解码结果: ${name}`);
              } catch (decodeError) {
                console.warn(`加载配置后端GBK解码失败: ${decodeError}`);
                // 如果解码失败，至少移除明显的乱码字符
                name = name.replace(/[^\x00-\x7F\u4e00-\u9fa5]/g, '').trim();
              }
            }
            
            // 如果清理后为空，使用默认名称
            if (!name) {
              name = `路径${config.PathCfg.pathRecords.indexOf(record) + 1}`;
            }
          }
          return name;
        });
        
        const pathNames = (await Promise.all(pathNamePromises)).filter((name: string) => name);
        setPathRecords(pathNames);
      }

      console.log(`配置已从 ${selectedCharacter}/${configFile} 加载，文件已设置为可写状态`);
    } catch (error) {
      console.error(`加载配置失败: ${error}`);
      showToast(`加载配置失败: ${error}`, 'error');
    }
  };

  // 当选择配置文件时，读取路径记录
  useEffect(() => {
    if (configFile && selectedCharacter && configFiles.length > 0) {
      let configFilePath: string;
      if (configDir.includes('\\')) {
        configFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${configFile}`;
      } else {
        configFilePath = `${configDir}/PSS/${selectedCharacter}/${configFile}`;
      }
      readPathRecords(configFilePath);
    }
  }, [configFile, selectedCharacter]);

  // 当选择角色或配置文件时，自动加载
  useEffect(() => {
    if (configFile && selectedCharacter && configFiles.length > 0) {
      handleLoadConfig();
    }
  }, [configFile, selectedCharacter]);

  // 当表单值变化时，自动保存
  useEffect(() => {
    const autoSaveTimeout = setTimeout(() => {
      if (
        configFile &&
        (strHelmet || agiHelmet || afkHelmet || flightId || selectedPath)
      ) {
        // 自动保存功能已移除，因为配置文件是JSON格式，不是INI格式
        // handleSaveConfig();
      }
    }, 1000); // 延迟1秒保存，避免频繁保存

    return () => clearTimeout(autoSaveTimeout);
  }, [strHelmet, agiHelmet, afkHelmet, flightId, selectedPath, configFile]);

  // 处理锁定配置
  const handleLockConfig = async () => {
    if (!configFile || !selectedCharacter || !configDir) {
      showToast("请先选择配置文件", 'warning');
      return;
    }
    
    try {
      // 构建完整的配置文件路径
      let configFilePath: string;
      if (configDir.includes('\\')) {
        configFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${configFile}`;
      } else {
        configFilePath = `${configDir}/PSS/${selectedCharacter}/${configFile}`;
      }
      
      // 先确保文件是可写的，以便更新配置
      await setFileReadonly(configFilePath, false);
      
      // 读取当前配置文件
      let content = await readTextFileViaRust(configFilePath);
      let config: any;

      try {
        // 尝试直接解析JSON
        config = JSON.parse(content);
      } catch (jsonError) {
        console.warn("直接解析JSON失败，尝试移除注释后解析:", jsonError);
        
        // 如果直接解析失败，尝试移除注释后再解析
        try {
          // 移除单行注释 (// 注释)
          let cleanedContent = content.replace(/\/\/.*$/gm, '');
          // 移除多行注释 (/* 注释 */)
          cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
          // 移除以#开头的注释
          cleanedContent = cleanedContent.replace(/^#.*$/gm, '');
          
          // 再次尝试解析
          config = JSON.parse(cleanedContent);
          console.log("移除注释后成功解析JSON");
        } catch (cleanedError) {
          console.error("移除注释后仍然无法解析JSON:", cleanedError);
          throw new Error(`配置文件格式错误，无法解析为JSON: ${cleanedError}`);
        }
      }
      
      // 添加锁定标记
      config.ConfigLock = {
        locked: true,
        lockTime: new Date().toISOString(),
        lockReason: "用户手动锁定"
      };
      
      // 保存更新后的配置
      const updatedContent = JSON.stringify(config, null, 2);
      await writeTextFileViaRustWithGBK(configFilePath, updatedContent);
      
      // 实际设置文件为只读状态
      await setFileReadonly(configFilePath, true);
      
      setIsConfigLocked(true);
      showToast("配置已锁定，文件已设置为只读状态", 'success');
      console.log("配置已锁定，文件已设置为只读状态");
    } catch (error) {
      console.error(`锁定配置失败: ${error}`);
      showToast(`锁定配置失败: ${error}`, 'error');
    }
  };

  // 处理解锁配置
  const handleUnlockConfig = async () => {
    if (!configFile || !selectedCharacter || !configDir) {
      showToast("请先选择配置文件", 'warning');
      return;
    }
    
    try {
      // 构建完整的配置文件路径
      let configFilePath: string;
      if (configDir.includes('\\')) {
        configFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${configFile}`;
      } else {
        configFilePath = `${configDir}/PSS/${selectedCharacter}/${configFile}`;
      }
      
      // 设置文件为可写状态
      await setFileReadonly(configFilePath, false);
      
      // 读取当前配置文件
      let content = await readTextFileViaRust(configFilePath);
      let config: any;

      try {
        // 尝试直接解析JSON
        config = JSON.parse(content);
      } catch (jsonError) {
        console.warn("直接解析JSON失败，尝试移除注释后解析:", jsonError);
        
        // 如果直接解析失败，尝试移除注释后再解析
        try {
          // 移除单行注释 (// 注释)
          let cleanedContent = content.replace(/\/\/.*$/gm, '');
          // 移除多行注释 (/* 注释 */)
          cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
          // 移除以#开头的注释
          cleanedContent = cleanedContent.replace(/^#.*$/gm, '');
          
          // 再次尝试解析
          config = JSON.parse(cleanedContent);
          console.log("移除注释后成功解析JSON");
        } catch (cleanedError) {
          console.error("移除注释后仍然无法解析JSON:", cleanedError);
          throw new Error(`配置文件格式错误，无法解析为JSON: ${cleanedError}`);
        }
      }
      
      // 移除锁定标记
      config.ConfigLock = {
        locked: false,
        unlockTime: new Date().toISOString(),
        unlockReason: "用户手动解锁"
      };
      
      // 保存更新后的配置
      const updatedContent = JSON.stringify(config, null, 2);
      await writeTextFileViaRustWithGBK(configFilePath, updatedContent);
      
      setIsConfigLocked(false);
      showToast("配置已解锁，文件已保持为可写状态以便编辑", 'info');
      console.log("配置已解锁，文件已保持为可写状态以便编辑");
    } catch (error) {
      console.error(`解锁配置失败: ${error}`);
      showToast(`解锁配置失败: ${error}`, 'error');
    }
  };

  // 处理启用飞行
  const handleEnableFlight = async () => {
    if (!flightId && !selectedPath) {
      showToast("请先设置飞行ID或选择挂机路径", 'warning');
      return;
    }
    
    if (!configFile || !selectedCharacter || !configDir) {
      showToast("请先选择配置文件", 'warning');
      return;
    }
    
    try {
      // 构建完整的配置文件路径
      let configFilePath: string;
      if (configDir.includes('\\')) {
        configFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${configFile}`;
      } else {
        configFilePath = `${configDir}/PSS/${selectedCharacter}/${configFile}`;
      }
      
      // 自动将文件设置为可写状态
      await setFileReadonly(configFilePath, false);
      
      // 提示用户记得在编辑完成后锁定配置
      showToast("配置文件已设置为可写状态，编辑完成后请记得点击锁定配置按钮", 'info');
      
      // 读取当前配置文件
      let content = await readTextFileViaRust(configFilePath);
      let config: any;

      try {
        // 尝试直接解析JSON
        config = JSON.parse(content);
      } catch (jsonError) {
        console.warn("直接解析JSON失败，尝试移除注释后解析:", jsonError);
        
        // 如果直接解析失败，尝试移除注释后再解析
        try {
          // 移除单行注释 (// 注释)
          let cleanedContent = content.replace(/\/\/.*$/gm, '');
          // 移除多行注释 (/* 注释 */)
          cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
          // 移除以#开头的注释
          cleanedContent = cleanedContent.replace(/^#.*$/gm, '');
          
          // 再次尝试解析
          config = JSON.parse(cleanedContent);
          console.log("移除注释后成功解析JSON");
        } catch (cleanedError) {
          console.error("移除注释后仍然无法解析JSON:", cleanedError);
          throw new Error(`配置文件格式错误，无法解析为JSON: ${cleanedError}`);
        }
      }
      
      // 检查配置文件结构
      if (!config.PathCfg || !config.PathCfg.pathRecords) {
        showToast("配置文件格式不正确，缺少PathCfg或pathRecords", 'error');
        return;
      }
      
      // 查找选择的路径记录
      const selectedPathRecord = config.PathCfg.pathRecords.find(
        (record: any) => record.name === selectedPath
      );
      
      if (!selectedPathRecord) {
        showToast(`在配置文件中找不到路径: ${selectedPath}`, 'error');
        return;
      }
      
      // 构建新的攻击路径列表
      const newAttackPathList = [
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": -1,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "TELEPORT",
          "strValue": "瞬间移动卷轴",
          "id": parseInt(flightId),
          "bless": "NORMAL"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        },
        {
          "map": 283,
          "pos": {
            "x": 0,
            "y": 0
          },
          "type": "PATH"
        }
      ];
      
      // 更新选定路径的attackpathlist
      selectedPathRecord.attackpathlist = newAttackPathList;
      
      // 保存更新后的配置
      const updatedContent = JSON.stringify(config, null, 2);
      await writeTextFileViaRustWithGBK(configFilePath, updatedContent);
      
      showToast(`已成功启用一键无怪飞功能，飞行ID: ${flightId}`, 'success');
      console.log(`已成功更新路径 ${selectedPath} 的攻击路径配置`);
    } catch (error) {
      console.error(`启用一键无怪飞失败: ${error}`);
      showToast(`启用一键无怪飞失败: ${error}`, 'error');
    }
  };

  // 处理启用自动换头盔
  const handleEnableHelmetSwap = async () => {
    if (!afkHelmet || afkHelmet.trim() === "") {
      showToast("挂机头盔为必填项，请输入挂机头盔名称", 'warning');
      return;
    }
    
    if (!configFile || !selectedCharacter || !configDir) {
      showToast("请先选择配置文件", 'warning');
      return;
    }
    
    try {
      // 构建完整的配置文件路径
      let configFilePath: string;
      if (configDir.includes('\\')) {
        configFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${configFile}`;
      } else {
        configFilePath = `${configDir}/PSS/${selectedCharacter}/${configFile}`;
      }
      
      // 自动将文件设置为可写状态
      await setFileReadonly(configFilePath, false);
      
      // 提示用户记得在编辑完成后锁定配置
      showToast("配置文件已设置为可写状态，编辑完成后请记得点击锁定配置按钮", 'info');
      
      // 读取当前配置文件
      let content = await readTextFileViaRust(configFilePath);
      let config: any;

      try {
        // 尝试直接解析JSON
        config = JSON.parse(content);
      } catch (jsonError) {
        console.warn("直接解析JSON失败，尝试移除注释后解析:", jsonError);
        
        // 如果直接解析失败，尝试移除注释后再解析
        try {
          // 移除单行注释 (// 注释)
          let cleanedContent = content.replace(/\/\/.*$/gm, '');
          // 移除多行注释 (/* 注释 */)
          cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
          // 移除以#开头的注释
          cleanedContent = cleanedContent.replace(/^#.*$/gm, '');
          
          // 再次尝试解析
          config = JSON.parse(cleanedContent);
          console.log("移除注释后成功解析JSON");
        } catch (cleanedError) {
          console.error("移除注释后仍然无法解析JSON:", cleanedError);
          throw new Error(`配置文件格式错误，无法解析为JSON: ${cleanedError}`);
        }
      }
      
      // 检查配置文件结构
      if (!config.ItemCfg) {
        config.BuffCfg = {};
      }
      
      // 创建头盔名称（用于BuffSpells）
      const strHelmetName = strHelmetLevel === "+0" ? "力量魔法头盔" : `${strHelmetLevel} 力量魔法头盔`;
      const agiHelmetName = agiHelmetLevel === "+0" ? "敏捷魔法头盔" : `${agiHelmetLevel} 敏捷魔法头盔`;
      
      // 直接替换BuffSpells内容
      config.BuffCfg.BuffSpells = [
        {
          "condition": {
            "state": "BUFF",
            "value": 9,
            "activate": true,
            "operator": "EQUAL",
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": strHelmetName,
            "icon": 170,
            "slotType": "ITEM",
            "bless": "NORMAL"
          }
        },
        {
          "condition": {
            "state": "BUFF",
            "value": 9,
            "activate": true,
            "operator": "EQUAL",
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": "体魄强健术",
            "icon": 409,
            "slotType": "SKILL"
          }
        },
        {
          "condition": {
            "state": "BUFF",
            "value": 10,
            "activate": true,
            "operator": "EQUAL",
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": agiHelmetName,
            "icon": 168,
            "slotType": "ITEM",
            "bless": "NORMAL"
          }
        },
        {
          "condition": {
            "state": "BUFF",
            "value": 10,
            "activate": true,
            "operator": "EQUAL",
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": "通畅气脉术",
            "icon": 399,
            "slotType": "SKILL"
          }
        },
        {
          "condition": {
            "state": "BUFF",
            "value": 0,
            "activate": true,
            "operator": "EQUAL",
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": agiHelmetName,
            "icon": 168,
            "slotType": "ITEM",
            "bless": "NORMAL"
          }
        },
        {
          "condition": {
            "state": "BUFF",
            "value": 0,
            "activate": true,
            "operator": "EQUAL",
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": "加速术",
            "icon": 410,
            "slotType": "SKILL"
          }
        },
        {
          "condition": {
            "state": "BUFF",
            "value": 11,
            "activate": true,
            "operator": "EQUAL",
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": afkHelmet,
            "icon": 2259,
            "slotType": "ITEM",
            "bless": "NORMAL"
          }
        }
      ];
      
      console.log("替换后的BuffSpells:", JSON.stringify(config.ItemCfg.BuffSpells, null, 2));
      
      // 保存更新后的配置
      const updatedContent = JSON.stringify(config, null, 2);
      console.log("保存更新后的配置:", updatedContent);
      
      await writeTextFileViaRustWithGBK(configFilePath, updatedContent);
      
      showToast("已成功启用自动换头盔功能", 'success');
      console.log("自动换头盔配置已保存");
    } catch (error) {
      console.error(`启用自动换头盔失败: ${error}`);
      showToast(`启用自动换头盔失败: ${error}`, 'error');
    }
  };

  // 处理自动施放光箭
  const handleAutoLightArrow = async () => {
    if (!configFile || !selectedCharacter || !configDir) {
      showToast("请先选择配置文件", 'warning');
      return;
    }
    
    try {
      // 构建完整的配置文件路径
      let configFilePath: string;
      if (configDir.includes('\\')) {
        configFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${configFile}`;
      } else {
        configFilePath = `${configDir}/PSS/${selectedCharacter}/${configFile}`;
      }
      
      // 自动将文件设置为可写状态
      await setFileReadonly(configFilePath, false);
      
      // 提示用户记得在编辑完成后锁定配置
      showToast("配置文件已设置为可写状态，编辑完成后请记得点击锁定配置按钮", 'info');
      
      // 读取当前配置文件
      let content = await readTextFileViaRust(configFilePath);
      let config: any;

      try {
        // 尝试直接解析JSON
        config = JSON.parse(content);
      } catch (jsonError) {
        console.warn("直接解析JSON失败，尝试移除注释后解析:", jsonError);
        
        // 如果直接解析失败，尝试移除注释后再解析
        try {
          // 移除单行注释 (// 注释)
          let cleanedContent = content.replace(/\/\/.*$/gm, '');
          // 移除多行注释 (/* 注释 */)
          cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');
          // 移除以#开头的注释
          cleanedContent = cleanedContent.replace(/^#.*$/gm, '');
          
          // 再次尝试解析
          config = JSON.parse(cleanedContent);
          console.log("移除注释后成功解析JSON");
        } catch (cleanedError) {
          console.error("移除注释后仍然无法解析JSON:", cleanedError);
          throw new Error(`配置文件格式错误，无法解析为JSON: ${cleanedError}`);
        }
      }
      
      // 检查配置文件结构
      if (!config.AttackCfg) {
        config.AttackCfg = {};
      }
      
      // 设置MPSpell字段，配置MP大于40%时使用光箭
      config.AttackCfg.MPSpell = [
        {
          "condition": {
            "state": "NONE",
            "value": 0,
            "activate": false,
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": "",
            "icon": -1,
            "slotType": "UNKNOWN"
          }
        },
        {
          "condition": {
            "state": "MP",
            "value": 40,
            "activate": true,
            "operator": "GREATER_EQUAL",
            "strValue": [],
            "itemInfo": []
          },
          "slot": {
            "desc": "光箭",
            "icon": 386,
            "slotType": "SKILL"
          }
        }
      ];
      
      // 保存更新后的配置
      const updatedContent = JSON.stringify(config, null, 2);
      await writeTextFileViaRustWithGBK(configFilePath, updatedContent);
      
      showToast("已成功启用自动光箭功能，MP大于40%时使用光箭", 'success');
      console.log("自动光箭配置已保存");
    } catch (error) {
      console.error(`启用自动光箭失败: ${error}`);
      showToast(`启用自动光箭失败: ${error}`, 'error');
    }
  };

  // 处理备份配置
  const handleBackupConfig = async () => {
    if (!configFile || !selectedCharacter || !configDir) {
      showToast("请先选择配置文件", 'warning');
      return;
    }
    
    try {
      // 构建完整的配置文件路径
      let configFilePath: string;
      let backupFilePath: string;
      if (configDir.includes('\\')) {
        configFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${configFile}`;
        // 创建备份文件名（添加时间戳，格式：yyyy_mm_dd_hh_mm_ss）
        const now = new Date();
        const year = now.getFullYear().toString(); // 完整年份
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份，补零
        const day = now.getDate().toString().padStart(2, '0'); // 日，补零
        const hours = now.getHours().toString().padStart(2, '0'); // 小时，补零
        const minutes = now.getMinutes().toString().padStart(2, '0'); // 分钟，补零
        const seconds = now.getSeconds().toString().padStart(2, '0'); // 秒，补零
        const timestamp = `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
        const backupFileName = `${configFile}.backup.${timestamp}`;
        backupFilePath = `${configDir}\\PSS\\${selectedCharacter}\\${backupFileName}`;
      } else {
        configFilePath = `${configDir}/PSS/${selectedCharacter}/${configFile}`;
        // 创建备份文件名（添加时间戳，格式：yyyy_mm_dd_hh_mm_ss）
        const now = new Date();
        const year = now.getFullYear().toString(); // 完整年份
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份，补零
        const day = now.getDate().toString().padStart(2, '0'); // 日，补零
        const hours = now.getHours().toString().padStart(2, '0'); // 小时，补零
        const minutes = now.getMinutes().toString().padStart(2, '0'); // 分钟，补零
        const seconds = now.getSeconds().toString().padStart(2, '0'); // 秒，补零
        const timestamp = `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
        const backupFileName = `${configFile}.backup.${timestamp}`;
        backupFilePath = `${configDir}/PSS/${selectedCharacter}/${backupFileName}`;
      }
      
      // 自动将文件设置为可写状态（虽然只是读取，但保持一致性）
      await setFileReadonly(configFilePath, false);
      
      // 提示用户记得在编辑完成后锁定配置
      showToast("配置文件已设置为可写状态，编辑完成后请记得点击锁定配置按钮", 'info');
      
      // 读取当前配置文件
      const content = await readTextFileViaRust(configFilePath);
      
      // 写入备份文件（使用GBK编码）
      await writeTextFileViaRustWithGBK(backupFilePath, content);
      
      const backupFileName = backupFilePath.split(/[\\/]/).pop() || 'backup';
      showToast(`配置已备份为: ${backupFileName}`, 'success');
      console.log(`配置已备份到: ${backupFilePath}`);
    } catch (error) {
      console.error(`备份配置失败: ${error}`);
      showToast(`备份配置失败: ${error}`, 'error');
    }
  };

  // 处理恢复配置
  const handleRestoreConfig = async () => {
    if (!configFile || !selectedCharacter || !configDir) {
      showToast("请先选择配置文件", 'warning');
      return;
    }
    
    try {
      // 获取备份文件列表
      let characterDir: string;
      if (configDir.includes('\\')) {
        characterDir = `${configDir}\\PSS\\${selectedCharacter}`;
      } else {
        characterDir = `${configDir}/PSS/${selectedCharacter}`;
      }
      
      const entries = await readDirViaRust(characterDir);
      
      // 筛选备份文件
      const backupFiles = entries
        .filter((entry) => !entry.is_dir && entry.name.includes('.backup.'))
        .map((entry) => entry.name)
        .sort(); // 按名称排序
        
      if (backupFiles.length === 0) {
        showToast("没有找到备份文件", 'warning');
        return;
      }
      
      // 使用最新的备份文件（假设按名称排序后最新的在最后）
      const latestBackup = backupFiles[backupFiles.length - 1];
      let backupFilePath: string;
      if (characterDir.includes('\\')) {
        backupFilePath = `${characterDir}\\${latestBackup}`;
      } else {
        backupFilePath = `${characterDir}/${latestBackup}`;
      }
      
      // 读取备份文件内容
      const backupContent = await readTextFileViaRust(backupFilePath);
      
      // 构建当前配置文件路径
      let configFilePath: string;
      if (characterDir.includes('\\')) {
        configFilePath = `${characterDir}\\${configFile}`;
      } else {
        configFilePath = `${characterDir}/${configFile}`;
      }
      
      // 自动将文件设置为可写状态
      await setFileReadonly(configFilePath, false);
      
      // 提示用户记得在编辑完成后锁定配置
      showToast("配置文件已设置为可写状态，编辑完成后请记得点击锁定配置按钮", 'info');
      
      // 恢复配置（使用GBK编码）
      await writeTextFileViaRustWithGBK(configFilePath, backupContent);
      
      showToast(`已从备份恢复: ${latestBackup}`, 'success');
      console.log(`配置已从备份恢复: ${backupFilePath}`);
      
      // 重新加载配置
      await handleLoadConfig();
    } catch (error) {
      console.error(`恢复配置失败: ${error}`);
      showToast(`恢复配置失败: ${error}`, 'error');
    }
  };

  // 获取文件夹显示名称
  const getFolderName = () => {
    if (!configDir) return "选择 PSS 目录";

    // 在Windows和Unix路径中都能正确获取文件夹名
    const parts = configDir.split(/[/\\]/);
    const dirName = parts[parts.length - 1] || configDir;

    // 如果已选择角色，显示角色信息
    if (selectedCharacter) {
      // 如果已选择配置文件，显示完整路径
      if (configFile) {
        return `${dirName}/PSS/${selectedCharacter}/${configFile}`;
      }
      return `${dirName}/PSS/${selectedCharacter}`;
    }

    return dirName;
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
            {menuItems.map((item) => (
              <li key={`menu-${item.label}`}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {/* 配置文件夹选择按钮 - 现在在左边 */}
              <div>
                <label className="block text-sm font-medium text-text-dark-secondary mb-1">
                  PSS 配置目录
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

              {/* 角色选择下拉框 */}
              <div>
                <label
                  className="block text-sm font-medium text-text-dark-secondary mb-1"
                  htmlFor="character-select"
                >
                  选择角色
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-dark/50 border border-border-dark text-text-dark-primary rounded-md focus:ring-primary focus:border-primary px-3 py-2 h-10 appearance-none text-sm"
                    id="character-select"
                    name="character-select"
                    value={selectedCharacter}
                    onChange={(e) => handleCharacterChange(e.target.value)}
                    disabled={characterFolders.length === 0}
                  >
                    {characterFolders.length === 0 && (
                      <option value="">请先搜索配置文件夹</option>
                    )}
                    {characterFolders.map((folder) => (
                      <option key={`char-${folder}`} value={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-text-dark-secondary"
                    size={16}
                  />
                </div>
              </div>

              {/* 配置文件下拉框 */}
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
                    disabled={configFiles.length === 0}
                  >
                    {configFiles.length === 0 ? (
                      <option value="">请先选择角色</option>
                    ) : (
                      configFiles.map((file) => (
                        <option key={`cfg-${file}`} value={file}>
                          {file}
                        </option>
                      ))
                    )}
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
                {isConfigLocked && (
                  <div className="flex items-center gap-1 ml-4 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-md">
                    <Lock size={12} className="text-red-400" />
                    <span className="text-xs text-red-400">配置已锁定</span>
                  </div>
                )}
                {!isConfigLocked && configFile && (
                  <div className="flex items-center gap-1 ml-4 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-md">
                    <Unlock size={12} className="text-green-400" />
                    <span className="text-xs text-green-400">配置已解锁</span>
                  </div>
                )}
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
                    当攻击范围内没有怪时，自动用白瞬飞卷轴。
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0 w-full flex-wrap sm:flex-nowrap sm:w-auto">
                  <input
                    className="w-full sm:w-48 bg-surface-dark border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 placeholder:text-text-dark-secondary/70 px-3 py-2 text-sm disabled:opacity-50"
                    id="flight-id"
                    placeholder="输入飞行ID"
                    type="text"
                    value={flightId}
                    onChange={(e) => setFlightId(e.target.value)}
                    disabled={isConfigLocked}
                  />
                  <div className="relative">
                    <select
                      className="w-full sm:w-auto bg-surface-dark border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 appearance-none px-3 py-2 pr-8 text-sm disabled:opacity-50"
                      name="afk-path"
                      value={selectedPath}
                      onChange={(e) => setSelectedPath(e.target.value)}
                      disabled={isConfigLocked}
                    >
                      <option value="">选择挂机路径</option>
                      {pathRecords.map((path) => (
                        <option key={`path-${path}`} value={path}>
                          {path}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-text-dark-secondary"
                      size={16}
                    />
                  </div>
                  <button
                    className="w-full sm:w-auto bg-surface-dark border border-border-dark text-text-dark-primary rounded-md hover:bg-primary/20 hover:border-primary/70 focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 px-3 py-2 text-sm font-medium disabled:opacity-50"
                    onClick={handleEnableFlight}
                    disabled={isConfigLocked}
                  >
                    启用
                  </button>
                </div>
              </div>

              {/* Helmet Swap Options */}
              <div className="p-4 bg-black/20 rounded-lg border border-border-dark">
                <h4 className="font-semibold text-text-dark-primary mb-3">
                  近战自动加体魄通畅加速
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-text-dark-secondary mb-1"
                      htmlFor="str-helmet"
                    >
                      力量头盔
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-surface-dark/50 border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 appearance-none px-3 py-2 h-10 text-sm disabled:opacity-50"
                        value={strHelmetLevel}
                        onChange={(e) => setStrHelmetLevel(e.target.value)}
                        disabled={isConfigLocked}
                      >
                        <option value="+0">+0</option>
                        <option value="+1">+1</option>
                        <option value="+2">+2</option>
                        <option value="+3">+3</option>
                        <option value="+4">+4</option>
                        <option value="+5">+5</option>
                        <option value="+6">+6</option>
                        <option value="+7">+7</option>
                        <option value="+8">+8</option>
                        <option value="+9">+9</option>
                      </select>
                      <ChevronDown
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-text-dark-secondary"
                        size={16}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-text-dark-secondary mb-1"
                      htmlFor="agi-helmet"
                    >
                      敏捷头盔
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-surface-dark/50 border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 appearance-none px-3 py-2 h-10 text-sm disabled:opacity-50"
                        value={agiHelmetLevel}
                        onChange={(e) => setAgiHelmetLevel(e.target.value)}
                        disabled={isConfigLocked}
                      >
                        <option value="+0">+0</option>
                        <option value="+1">+1</option>
                        <option value="+2">+2</option>
                        <option value="+3">+3</option>
                        <option value="+4">+4</option>
                        <option value="+5">+5</option>
                        <option value="+6">+6</option>
                        <option value="+7">+7</option>
                        <option value="+8">+8</option>
                        <option value="+9">+9</option>
                      </select>
                      <ChevronDown
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-text-dark-secondary"
                        size={16}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-text-dark-secondary mb-1"
                      htmlFor="afk-helmet"
                    >
                      挂机头盔
                    </label>
                    <input
                      className="w-full bg-surface-dark border border-border-dark text-text-dark-primary rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 placeholder:text-text-dark-secondary/70 px-3 py-2 text-sm disabled:opacity-50"
                      id="afk-helmet"
                      placeholder="挂机头盔名称"
                      type="text"
                      value={afkHelmet}
                      onChange={(e) => setAfkHelmet(e.target.value)}
                      disabled={isConfigLocked}
                    />
                  </div>
                </div>
                <button
                  className="w-full sm:w-auto bg-surface-dark border border-border-dark text-text-dark-primary rounded-md hover:bg-primary/20 hover:border-primary/70 focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 px-3 py-2 text-sm font-medium disabled:opacity-50"
                  onClick={handleEnableHelmetSwap}
                  disabled={isConfigLocked}
                >
                  启用自动换头盔
                </button>
                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                  <p className="text-xs text-yellow-300">
                    <strong>重要提示：</strong>启动后，游戏内挂中的特殊增益设置里，第一格和加速术后面一格不能放其它物品或魔法
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  className="flex items-center gap-2 bg-surface-dark border border-border-dark text-text-dark-primary rounded-md hover:bg-primary/20 hover:border-primary/70 focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 px-3 py-2 text-sm font-medium"
                  onClick={handleLockConfig}
                  disabled={isConfigLocked}
                >
                  <Lock size={16} />
                  锁定配置
                </button>
                <button
                  className="flex items-center gap-2 bg-surface-dark border border-border-dark text-text-dark-primary rounded-md hover:bg-primary/20 hover:border-primary/70 focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 px-3 py-2 text-sm font-medium disabled:opacity-50"
                  onClick={handleUnlockConfig}
                  disabled={!isConfigLocked}
                >
                  <Unlock size={16} />
                  解锁配置
                </button>
                <button
                  className="flex items-center gap-2 bg-surface-dark border border-border-dark text-text-dark-primary rounded-md hover:bg-primary/20 hover:border-primary/70 focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 px-3 py-2 text-sm font-medium disabled:opacity-50"
                  onClick={handleAutoLightArrow}
                  disabled={isConfigLocked}
                >
                  <Zap size={16} />
                  MP大于40%自动光箭
                </button>
                <button
                  className="flex items-center gap-2 bg-surface-dark border border-border-dark text-text-dark-primary rounded-md hover:bg-primary/20 hover:border-primary/70 focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 px-3 py-2 text-sm font-medium"
                  onClick={handleBackupConfig}
                >
                  <Save size={16} />
                  备份配置
                </button>
                <button
                  className="flex items-center gap-2 bg-surface-dark border border-border-dark text-text-dark-primary rounded-md hover:bg-primary/20 hover:border-primary/70 focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-gold-glow transition-all duration-200 px-3 py-2 text-sm font-medium"
                  onClick={handleRestoreConfig}
                >
                  <Upload size={16} />
                  恢复配置
                </button>
              </div>
            </div>
          </section>

          {/* Help Section */}
          <section>
            <h3 className="text-xl font-display text-primary mb-4">帮助信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <h4 className="font-semibold text-text-dark-primary mb-2">
                  一键操作
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-text-dark-secondary">
                  <li>
                    <strong className="text-text-dark-primary">无怪瞬飞：</strong>{" "}
                    输入有效的瞬间移动卷轴ID（获取自己角色瞬飞ID方法可以在说话岛助手小程序内找到），从下拉菜单中选择一个预定义的挂机路径。点击启用后，系统会自动将瞬间移动卷轴配置添加到选定路径的attackpathlist中。
                  </li>
                  <li>
                    <strong className="text-text-dark-primary">近战自动加体魄通畅：</strong>{" "}
                    选择力量和敏捷头盔的等级（+0到+9），输入挂机头盔的确切名称。点击启用后，系统会自动配置BuffSpells，实现近战时自动加体魄强健术和通畅气脉术。
                  </li>
                  <li>
                    <strong className="text-text-dark-primary">MP大于40%自动光箭：</strong>{" "}
                    点击启用后，系统会配置AttackCfg.MPSpell，设置当MP大于40%时自动使用光箭技能。
                  </li>
                  <li>
                    <strong className="text-text-dark-primary">配置备份与恢复：</strong>{" "}
                    使用"备份配置"按钮可以创建当前配置的备份副本，包含时间戳。使用"恢复配置"按钮可以从之前的备份中恢复配置，防止意外修改导致的数据丢失。
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <h4 className="font-semibold text-text-dark-primary mb-2">
                  配置锁定机制
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-text-dark-secondary">
                  <li>
                    <strong className="text-text-dark-primary">锁定配置：</strong>将配置文件设置为只读状态，防止游戏运行时意外修改配置。
                  </li>
                  <li>
                    <strong className="text-text-dark-primary">解锁配置：</strong>将配置文件设置为可写状态，允许进行配置修改。
                  </li>
                  <li>
                    <strong className="text-text-dark-primary">自动解锁：</strong>选择配置文件时，系统会自动将文件设置为可写状态，并提示用户记得在完成后锁定。
                  </li>
                  <li>
                    <strong className="text-text-dark-primary">状态指示：</strong>界面上会显示当前配置文件的锁定状态（红色表示已锁定，绿色表示已解锁）。
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="font-semibold text-blue-400 mb-2">
                使用建议
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-300">
                <li>在修改配置前，建议先备份当前配置，以便出现问题时可以快速恢复。</li>
                <li>配置完成后，记得点击"锁定配置"按钮，防止游戏运行时配置被意外修改。</li>
                <li>修改且锁定配置文件后，在游戏内挂中切换一次配置文件，修改的内容就会生效。</li>
                <li>如果配置文件中包含中文路径名称，系统会自动处理编码问题。</li>
                <li>所有配置文件都以GBK编码保存，确保与游戏客户端兼容。</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default ConfigDashboard;
