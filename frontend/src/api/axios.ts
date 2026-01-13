import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// baseURL 정규화: 끝의 슬래시 제거
const normalizeBaseURL = (url: string): string => {
  return url.replace(/\/+$/, '');
};

// 환경 변수 또는 기본값 사용
const getApiBaseURL = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // 개발 환경 감지 (vite dev server)
  const isDevelopment = import.meta.env.DEV;
  
  // 개발 환경이고 환경 변수가 없으면 vite proxy를 사용하기 위해 /api 사용
  if (isDevelopment && !envUrl) {
    return '/api';
  }
  
  // 환경 변수가 있으면 사용, 없으면 프로덕션 기본값으로 서버 주소 사용
  return envUrl || 'https://dev-leo.site/api';
};

const API_BASE_URL = normalizeBaseURL(getApiBaseURL());

// URL 조합 유틸리티: 슬래시 중복 방지
export const combineURL = (baseURL: string, path: string): string => {
  const normalizedBase = normalizeBaseURL(baseURL);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 모든 요청에 JWT 토큰 자동 추가 및 로깅
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // URL 정규화: 이중 슬래시 제거
    // baseURL과 url을 조합할 때 이중 슬래시가 발생하지 않도록 처리
    if (config.baseURL) {
      // baseURL 정규화 (끝의 슬래시 제거)
      config.baseURL = normalizeBaseURL(config.baseURL);
    }
    
    if (config.url) {
      // url 정규화 (앞의 슬래시는 하나만 유지, 이중 슬래시 제거)
      config.url = config.url.replace(/^\/+/, '/');
    }

    // 요청 로깅
    const timestamp = new Date().toISOString();
    console.group(`🚀 [API Request] ${timestamp}`);
    console.log(`Method: ${config.method?.toUpperCase()}`);
    console.log(`URL: ${config.baseURL}${config.url}`);
    if (config.params) {
      console.log('Params:', config.params);
    }
    if (config.data) {
      console.log('Request Body:', config.data);
    }
    if (token) {
      console.log('Token:', token.substring(0, 20) + '...');
    }
    console.groupEnd();

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: 응답 로깅 및 401 에러 시 로그인 페이지로 리다이렉트
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답 로깅
    const timestamp = new Date().toISOString();
    console.group(`✅ [API Response Success] ${timestamp}`);
    console.log(`URL: ${response.config.baseURL}${response.config.url}`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response Data:', response.data);
    console.groupEnd();

    return response;
  },
  (error: AxiosError) => {
    // 에러 응답 로깅
    const timestamp = new Date().toISOString();
    console.group(`❌ [API Response Error] ${timestamp}`);
    console.log(`URL: ${error.config?.baseURL}${error.config?.url}`);
    console.log(`Status: ${error.response?.status || 'No Response'}`);
    console.log('Error Message:', error.message);
    if (error.response?.data) {
      console.log('Error Data:', error.response.data);
    }
    console.groupEnd();

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

