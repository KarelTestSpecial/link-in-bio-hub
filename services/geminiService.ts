import axios from 'axios';
import { AppData, Link } from "../types";

const API_BASE_URL = 'https://europe-west3-link-in-bio-hub.cloudfunctions.net/api';

const aiBackendApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const getAuthToken = () => localStorage.getItem('authToken');

aiBackendApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

const createAIRequestHandler = (endpoint: string, errorMessage: string) => async (payload: any) => {
  if (!getAuthToken()) throw new Error("Authentication required for AI features.");
  try {
    const response = await aiBackendApi.post(endpoint, payload);
    return response.data;
  } catch (error: any) {
    console.error(`Error proxying ${endpoint}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || errorMessage);
  }
};

export const generateTheme = createAIRequestHandler('/ai/generate-theme', "Failed to generate theme from the AI.");
export const generateBio = createAIRequestHandler('/ai/generate-bio', "Failed to generate bio from the AI.");
export const generateLinkGroups = createAIRequestHandler('/ai/generate-link-groups', "Failed to generate link groups from the AI.");
export const generateLinkTitle = createAIRequestHandler('/ai/generate-link-title', "Failed to generate link title from the AI.");

export const askQuestionStream = async (
  question: string,
  influencerName: string,
  influencerBio: string
): Promise<AsyncGenerator<{ text: string }>> => {
  if (!getAuthToken()) throw new Error("Authentication required for AI features.");
  try {
    const response = await aiBackendApi.post(
      '/ai/ask-question-stream',
      { question, influencerName, influencerBio },
      { responseType: 'stream' }
    );
    const reader = response.data.getReader();
    return (async function*() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield { text: new TextDecoder().decode(value) };
      }
    })();
  } catch (error: any) {
    console.error("Error proxying askQuestionStream:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to get a response from the AI.");
  }
};

export interface AIGroupSuggestion {
    groupTitle: string;
    linkIds: string[];
}
