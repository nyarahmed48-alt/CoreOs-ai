/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AIConfig {
  model: string;
  systemInstruction: string;
  temperature: number;
  topP: number;
  topK?: number;
  maxOutputTokens?: number;
  safetySettings: 'standard' | 'strict' | 'relaxed';
  customVariables: Record<string, string>;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  sentencesUsed: number;
  sentenceLimit: number; // e.g. 70
  charLimitPerSentence: number; // e.g. 115
  status: 'active' | 'suspended';
}

export interface Client {
  id: string;
  name: string;
  description: string;
  websiteUrl?: string;
  logoUrl?: string;
  status: 'active' | 'configuring' | 'paused' | 'deactivated' | string;
  needs: string; // The core needs/goals statement of the client
  aiConfig: AIConfig;
  createdAt: string;
  charLimit?: number;
  monitoredChars?: string;
  limitType?: 'all' | 'specific';
  language?: 'english' | 'arabic' | 'kurdish' | string;
  customers?: Customer[];
}

export interface ModelItem {
  name: string;
  displayName: string;
  version?: string;
  description?: string;
  supportedFeatures?: string[];
  inputTypes?: string[];
  outputTypes?: string[];
  releaseDate?: string;
  isCustom?: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

export interface SimulationSession {
  clientId: string;
  history: Message[];
}

export interface BusinessOwner {
  id: string;
  name: string;
  companyName: string;
  email: string;
  linkedClientId: string; // ID of the owned/managed client AI
  plan: 'standard' | 'growth' | 'enterprise';
  status: 'active' | 'suspended';
  createdAt: string;
}
