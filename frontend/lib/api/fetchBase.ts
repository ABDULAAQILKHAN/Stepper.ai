import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';


// Define a type for your API response structure (modify as needed)
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
}

// Define a type for error responses
interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

// Create an Axios instance with TypeScript
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000', 
  timeout: 10000, 
  headers: {
    //'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token if available)
api.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle errors globally)
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: AxiosError<ApiError>): Promise<AxiosError> => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      //window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function for typed API calls
// export const fetchData = async <T>(
//   config: AxiosRequestConfig
// ): Promise<ApiResponse<T>> => {
//   try {
//     const response = await api(config);
//     return response;
//   } catch (error) {
//     return Promise.reject(error as AxiosError<ApiError>);
//     throw error as AxiosError<ApiError>;
//   }
// };
export const fetchData = async <T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  try {
    const response = await api(config);
    return response;
  } catch (error: any) {
    // Axios attaches server response object under error.response
    if (error.response) {
      console.error("API returned error:", error.response.data);
      return error.response; // or throw error.response.data for the message
    } else {
      console.error(error.message);
      throw error;
    }
  }
};

export default api;