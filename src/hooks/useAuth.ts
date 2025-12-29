import { useState, useEffect, useCallback } from 'react';
import { AuthState, User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';
import { getApiUrl, API_CONFIG } from '../config/api';

const STORAGE_KEY = 'ttbox_auth_user';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  });

  // 初始化时检查本地存储的登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setAuthState({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // 登录函数
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '请输入有效的邮箱地址'
        }));
        return false;
      }

      // 验证密码长度
      if (credentials.password.length !== 8) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '密码必须是8位'
        }));
        return false;
      }

      // 使用配置文件中的 API 地址
      const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.LOGIN);

      // 使用 HTTP API 调用登录接口
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.code === 200 && data.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
        setAuthState({
          isAuthenticated: true,
          user: data.data,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data.msg || '登录失败'
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  // 注册函数
  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '请输入有效的邮箱地址'
        }));
        return false;
      }

      // 验证密码长度
      if (credentials.password.length !== 8) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '密码必须是8位'
        }));
        return false;
      }

      // 验证密码确认
      if (credentials.password !== credentials.confirmPassword) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '两次输入的密码不一致'
        }));
        return false;
      }

      // 使用配置文件中的 API 地址
      const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.REGISTER);

      // 使用 HTTP API 调用注册接口
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.code === 200 && data.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
        setAuthState({
          isAuthenticated: true,
          user: data.data,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data.msg || '注册失败'
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  // 登出函数
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    clearError,
  };
};