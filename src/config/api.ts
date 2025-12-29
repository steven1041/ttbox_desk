// API 配置（开发环境直接写死，打包后手动修改）
export const API_CONFIG = {
  BASE_URL: 'https://ttboxdesk.stone09.com',
  ENDPOINTS: {
    LOGIN: '/api/login',
    REGISTER: '/api/users',
    USERS: '/api/users'
  }
};

// 获取完整的 API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};