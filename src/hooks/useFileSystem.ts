import { useState } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { homeDir, documentDir, desktopDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';


export const useFileSystem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // 通过文件对话框选择文件
  const selectFile = async (filters?: Array<{ name: string, extensions: string[] }>): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const selected = await open({
        multiple: false,
        filters
      });
      setLoading(false);
      return Array.isArray(selected) ? selected[0] || null : selected;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 通过文件对话框选择目录
  const selectDirectory = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const selected = await open({
        directory: true,
        multiple: false
      });
      setLoading(false);
      return Array.isArray(selected) ? selected[0] || null : selected;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 通过文件对话框保存文件
  const saveFile = async (defaultPath?: string, filters?: Array<{ name: string, extensions: string[] }>): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const saved = await save({
        defaultPath,
        filters
      });
      setLoading(false);
      return saved;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 搜索目录中的配置文件
  const searchConfigFiles = async (dirPath: string, maxDepth: number = 5): Promise<string[]> => {
    const configFiles: string[] = [];
    const searchDir = async (path: string, depth: number): Promise<void> => {
      if (depth > maxDepth) return;

      try {
        const entries = await readDirViaRust(path);
        for (const entry of entries) {
          const fullPath = `${path}/${entry.name}`;
          if (entry.is_dir) {
            await searchDir(fullPath, depth + 1);
          } else if (entry.name.endsWith('.ini')) {
            configFiles.push(fullPath);
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
        console.warn(`无法访问目录: ${path}`, error);
      }
    };

    await searchDir(dirPath, 0);
    return configFiles;
  };

  // 搜索PSS目录 - 使用文件对话框让用户选择
  const searchLineageConfigDir = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // 直接使用文件对话框让用户选择PSS目录
      const selectedDir = await selectDirectory();
      if (!selectedDir) {
        setLoading(false);
        return null;
      }
      
      // 统一路径分隔符为 /
      const normalizedDir = selectedDir.replace(/\\/g, '/');
      
      // 检查用户选择的目录是否是PSS目录
      if (normalizedDir.endsWith('PSS') || normalizedDir.includes('/PSS')) {
        // 如果是PSS目录，返回其父目录（Lineage目录）
        const parentDir = normalizedDir.replace(/\/PSS$/, '');
        setLoading(false);
        return parentDir;
      }
      
      // 如果当前目录不是PSS，检查其子目录
      try {
        const entries = await readDirViaRust(normalizedDir);
        for (const entry of entries) {
          if (entry.is_dir && entry.name === 'PSS') {
            // 找到PSS子目录，返回当前目录
            setLoading(false);
            return normalizedDir;
          }
        }
      } catch (err) {
        console.warn('无法读取目录内容:', err);
      }
      
      setLoading(false);
      return null;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 使用Rust后端读取文件（绕过前端权限限制）
  const readTextFileViaRust = async (path: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const content = await invoke<string>('read_file_content', { filePath: path });
      setLoading(false);
      return content;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 使用Rust后端写入文件（绕过前端权限限制）
  const writeTextFileViaRust = async (path: string, content: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await invoke('write_file_content', { filePath: path, content });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 使用Rust后端检查文件是否存在（绕过前端权限限制）
  const existsViaRust = async (path: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<boolean>('check_file_exists', { filePath: path });
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 使用Rust后端读取目录（绕过前端权限限制）
  const readDirViaRust = async (path: string): Promise<any[]> => {
    setLoading(true);
    setError(null);
    try {
      const entries = await invoke<any[]>('read_directory', { dirPath: path });
      setLoading(false);
      return entries;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 使用Rust后端设置文件只读/可写状态
  const setFileReadonly = async (path: string, readonly: boolean): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await invoke('set_file_readonly', { filePath: path, readonly });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 使用Rust后端检查文件是否为只读状态
  const isFileReadonly = async (path: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<boolean>('is_file_readonly', { filePath: path });
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 使用Rust后端写入文件（使用GBK编码）
  const writeTextFileViaRustWithGBK = async (path: string, content: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await invoke('write_file_content_gbk', { filePath: path, content });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  return {
    loading,
    error,
    selectFile,
    selectDirectory,
    saveFile,
    searchConfigFiles,
    searchLineageConfigDir,
    readTextFileViaRust,
    writeTextFileViaRust,
    writeTextFileViaRustWithGBK,
    existsViaRust,
    readDirViaRust,
    setFileReadonly,
    isFileReadonly
  };
};
