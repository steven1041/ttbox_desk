import { useState } from 'react';
import * as fs from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';

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

  // 写入文本文件
  const writeTextFile = async (path: string, content: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fs.writeTextFile(path, content);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 检查文件或目录是否存在
  const exists = async (path: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fs.exists(path);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 列出目录内容
  const readDir = async (path: string): Promise<fs.FileEntry[]> => {
    setLoading(true);
    setError(null);
    try {
      const entries = await fs.readDir(path);
      setLoading(false);
      return entries;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 创建目录
  const createDir = async (path: string, recursive: boolean = true): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fs.createDir(path, { recursive });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

  // 删除文件或目录
  const remove = async (path: string, recursive: boolean = false): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fs.remove(path, { recursive });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '未知错误');
      throw err;
    }
  };

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
        const entries = await fs.readDir(path);
        for (const entry of entries) {
          const fullPath = `${path}/${entry.name}`;
          if (entry.isDirectory) {
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

  return {
    loading,
    error,
    readTextFile,
    writeTextFile,
    exists,
    readDir,
    createDir,
    remove,
    selectFile,
    selectDirectory,
    saveFile,
    searchConfigFiles
  };
};
