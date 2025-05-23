import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  lastName: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  lastName: string;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

interface AuthResponseData {
  token: string;
  user: UserProfile;
}

class AuthService {
  private static instance: AuthService;
  private axiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      // Guardar en localStorage
      localStorage.setItem('token', token);
      // Guardar en cookies con httpOnly
      Cookies.set('token', token, {
        expires: 7, // 7 días
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      // Configurar headers de axios
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      Cookies.remove('token', { path: '/' });
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  public async login(credentials: LoginData): Promise<ApiResponse<AuthResponseData>> {
    try {
      const { data } = await this.axiosInstance.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);

      if (data.data && data.data.token) {
        this.setToken(data.data.token);
      }

      return data;
    } catch (error: any) {
      this.removeToken(); // Limpiar token en caso de error
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Error en el inicio de sesión');
    }
  }

  public async register(userData: RegisterData): Promise<ApiResponse<UserProfile>> {
    try {
      const { data } = await this.axiosInstance.post<ApiResponse<UserProfile>>('/auth/register', userData);
      return data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Error en el registro');
    }
  }
}

export const authService = AuthService.getInstance();