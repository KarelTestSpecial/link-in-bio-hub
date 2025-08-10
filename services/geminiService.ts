// --- START OF FILE geminiService.ts (CORRECTED VERSION) ---

import axios from 'axios';
import { AppData, Link } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

// Deze generieke handler was de bron van het probleem.
// We maken nu specifieke functies om de payload correct te formateren.

const handleAIRequest = async (endpoint: string, payload: object, errorMessage: string) => {
    if (!getAuthToken()) throw new Error("Authentication required for AI features.");
    try {
        const response = await aiBackendApi.post(endpoint, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error proxying ${endpoint}:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || errorMessage);
    }
};

// Specifieke functies die de payload correct opbouwen
export const generateTheme = (prompt: string) => {
    return handleAIRequest('/ai/generate-theme', { prompt }, "Failed to generate theme from the AI.");
};

export const generateBio = (keywords: string, name: string) => {
    return handleAIRequest('/ai/generate-bio', { keywords, name }, "Failed to generate bio from the AI.");
};

export const generateLinkGroups = (links: Link[]) => {
    return handleAIRequest('/ai/generate-link-groups', { links }, "Failed to generate link groups from the AI.");
};

export const generateLinkTitle = (title: string) => {
    return handleAIRequest('/ai/generate-link-title', { title }, "Failed to generate link title from the AI.");
};


export const askQuestionStream = async (
  question: string,
  influencerName: string,
  influencerBio: string
): Promise<AsyncGenerator<{ text: string }>> => {
  if (!getAuthToken()) throw new Error("Authentication required for AI features.");
  
  try {
    const response = await fetch(`${API_BASE_URL}/ai/ask-question-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ question, influencerName, influencerBio }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to get a response from the AI. Status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return (async function*() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield { text: decoder.decode(value) };
      }
    })();
    
  } catch (error: any) {
    console.error("Error in askQuestionStream:", error);
    throw new Error("Failed to get a response from the AI.");
  }
};

export interface AIGroupSuggestion {
    groupTitle: string;
    linkIds: string[];
}