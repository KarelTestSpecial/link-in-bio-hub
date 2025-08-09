import axios from 'axios';
import { AppData } from '../types';
import * as geminiService from './geminiService';

const API_BASE_URL = 'https://europe-west3-link-in-bio-2.cloudfunctions.net/api';

const backendApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getToken = () => localStorage.getItem('authToken');
const getUsername = () => localStorage.getItem('loggedInUsername');

backendApiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

const auth = {
  register: (userData: any) => backendApiClient.post('/users/register', userData),
  login: (credentials: any) => backendApiClient.post('/users/login', credentials),
};

const appData = {
  getAppData: (username: string) => backendApiClient.get<AppData>(`/users/${username}/appData`),
  updateAppData: (username: string, data: AppData) => backendApiClient.put(`/users/${username}/appData`, data),
  exportAppData: (username: string) => backendApiClient.get(`/users/${username}/export`, { responseType: 'blob' }),
  importAppData: (username: string, data: AppData) => backendApiClient.post(`/users/${username}/import`, data),
};

const analytics = {
  registerClick: (linkId: string, ownerUsername: string) => backendApiClient.post(`/links/${linkId}/click`, { ownerUsername }),
  getAnalytics: (username: string) => backendApiClient.get(`/users/${username}/analytics`),
};

const saveToken = (token: string) => localStorage.setItem('authToken', token);
const saveUsername = (username: string) => localStorage.setItem('loggedInUsername', username);
const clearToken = () => localStorage.removeItem('authToken');
const clearUsername = () => localStorage.removeItem('loggedInUsername');

const backendApi = {
  auth,
  appData,
  analytics,
  ai: { ...geminiService },
  getToken,
  saveToken,
  clearToken,
  getUsername,
  saveUsername,
  clearUsername,
};

export default backendApi;
