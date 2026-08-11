/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { generateReply, handleLabChat, isConfigured, publicAgentList } from "./lab/agents";
import type { ChatTurn } from "./lab/agents";
import { actionPage, authorizeScan, handleInboxAction, inboxStatus, runInboxScan } from "./lab/inbox";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
// Cloud Run (and most PaaS hosts) inject the port to listen on via $PORT and
// health-check the container against it. Falling back to 3000 keeps local
// development unchanged.
const PORT = Number(process.env.PORT) || 3000;

/* The console's AI features go through the same provider layer as the public
   agents (lab/agents.ts), so the model and the key handling are chosen in
   exactly one place. */

app.use(express.json());

// Path to clients persistent store
const DATA_DIR = path.join(process.cwd(), "data");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const OWNERS_FILE = path.join(DATA_DIR, "owners.json");

// Define CoreOS default pre-seeded Business Owners
const DEFAULT_OWNERS = [
  {
    id: "owner-1",
    name: "Aland Ahmed",
    companyName: "Aland Logistics Corp",
    email: "aland@logistics.co",
    linkedClientId: "client-1",
    plan: "enterprise",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "owner-2",
    name: "Darya Goran",
    companyName: "Kurdish Telecom Solutions",
    email: "darya@kurdtelecom.iq",
    linkedClientId: "client-2",
    plan: "growth",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "owner-3",
    name: "Sardar Bakir",
    companyName: "Bakir Global Security",
    email: "sardar@bakir-sec.com",
    linkedClientId: "client-3",
    plan: "standard",
    status: "active",
    createdAt: new Date().toISOString()
  }
];

// Define CoreOS default pre-seeded clients to give the user a ready-to-use setup
const DEFAULT_CLIENTS = [
  {
    id: "client-1",
    name: "Aether Omni (CoreOS Prime)",
    description: "Primary B2B core workflow driver, reasoning agent and logical processor.",
    websiteUrl: "https://coreos-ai-1022619878110.europe-west2.run.app/cargo",
    logoUrl: "ship",
    status: "active",
    needs: "Help users check logistics tracking, analyze system logs, and answer complex reasoning requirements in a highly professional and analytical tone.",
    aiConfig: {
      model: "coreos-prime",
      systemInstruction: "You are Aether Omni (CoreOS Prime). Your goal is to provide deep strategic advice, parse complex dataset requests, and construct logical summaries.\n\nGuidelines:\n1. Keep answers comprehensive yet clear.\n2. Present comparative tables in beautifully formatted markdown tables.\n3. Maintain an intellectual, technical, yet elegant executive tone.",
      temperature: 0.7,
      topP: 0.9,
      safetySettings: "standard",
      customVariables: {
        "Company": "CoreOS Enterprise Nodes",
        "SupportEmail": "support@coreosomni.io",
        "WarrantyPeriod": "3-Year Premium Gold"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-2",
    name: "Vanguard Voice (CoreOS Interactive)",
    description: "Tuned low-latency chat agent and instant text responder for messaging channels.",
    websiteUrl: "https://coreos-ai-1022619878110.europe-west2.run.app/concierge",
    logoUrl: "laptop",
    status: "active",
    needs: "Formulate instant customer support chat replies, answer frequent questions under 1.5 seconds latency, and explain services concisely with helpful highlights.",
    aiConfig: {
      model: "coreos-creative",
      systemInstruction: "You are Vanguard Voice (CoreOS Interactive), designed for micro-second interactive dialogs.\n\nInstructions:\n- Keep all replies extremely brief, clean, and interactive.\n- Prioritize short, crisp bullet points over long dense paragraphs.\n- Present technical configurations in small tabular outlines.",
      temperature: 0.9,
      topP: 0.95,
      safetySettings: "standard",
      customVariables: {
        "BrandPartner": "Amd & Intel Official",
        "WarrantyPeriod": "3-Year Gold Care"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-3",
    name: "Vesper Shield (CoreOS Sentinel)",
    description: "Privacy-guard sentinel, telemetry auditor and log file compliance agent.",
    websiteUrl: "https://coreos-ai-1022619878110.europe-west2.run.app/quill",
    logoUrl: "shield",
    status: "active",
    needs: "Audit incoming transcripts and documents for potential PII (Personally Identifiable Information) breaches, and redact sensitive tokens.",
    aiConfig: {
      model: "coreos-precise",
      systemInstruction: "You are Vesper Shield (CoreOS Sentinel). You run in high-alert privacy auditing mode.\n\nStrict Rules:\n1. Clean inputs of any clear credential paths or PII leak tokens.\n2. Output brief auditing status markers indicating system posture.\n3. Present reports cleanly styled in monospace markdown blocks.",
      temperature: 0.2,
      topP: 0.8,
      safetySettings: "strict",
      customVariables: {
        "ComplianceLevel": "SOC-2 Standard Audited",
        "FormatStyle": "Ultra-concise"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-4",
    name: "Lumina Creative (CoreOS Copywriter)",
    description: "Enterprise brand copywriter and creative content synthesizer.",
    logoUrl: "sparkles",
    status: "active",
    needs: "Formulate catchy product marketing slogans, newsletter outlines, and high engagement advertising copies.",
    aiConfig: {
      model: "coreos-creative",
      systemInstruction: "You are Lumina Creative (CoreOS Copywriter). You specialize in engaging corporate marketing copy.",
      temperature: 0.85,
      topP: 0.9,
      safetySettings: "standard",
      customVariables: {
        "BrandVoice": "Vibrant and Inspirational"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-5",
    name: "Chronos Vision (CoreOS Analyzer)",
    description: "Multi-spectral computer vision analyzer and visual sensor data scanner.",
    logoUrl: "eye",
    status: "active",
    needs: "Analyze visual descriptors, OCR transcripts, and structural camera configurations.",
    aiConfig: {
      model: "coreos-precise",
      systemInstruction: "You are Chronos Vision (CoreOS Analyzer). Analyze the provided input schema or visual details and extract precise coordinate grids.",
      temperature: 0.4,
      topP: 0.85,
      safetySettings: "standard",
      customVariables: {
        "SpectralResolution": "Infrared & Visible UV"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-6",
    name: "Helix Coder (CoreOS Compiler)",
    description: "Self-refining coding assistant, compiler advisor and refactoring engine.",
    logoUrl: "terminal",
    status: "active",
    needs: "Construct clean TypeScript algorithms, review code blocks for security anti-patterns, and write automated tests.",
    aiConfig: {
      model: "coreos-precise",
      systemInstruction: "You are Helix Coder (CoreOS Compiler). Format all output blocks in clean styled markdown code containers with explanatory comments.",
      temperature: 0.3,
      topP: 0.8,
      safetySettings: "standard",
      customVariables: {
        "DevFramework": "React 19 & Tailwind v4"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-7",
    name: "Scribe Summary (CoreOS Scriptor)",
    description: "Executive meeting summarizer and transcription optimizer.",
    logoUrl: "pencil",
    status: "active",
    needs: "Distill high-volume corporate discussions, meetings audio transcripts, and dense developer debug files.",
    aiConfig: {
      model: "coreos-precise",
      systemInstruction: "You are Scribe Summary (CoreOS Scriptor). Extract critical milestones, timeline dates, and action items with zero fluff.",
      temperature: 0.2,
      topP: 0.9,
      safetySettings: "standard",
      customVariables: {
        "FormatStyle": "Bullet-point Summary"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-8",
    name: "Hermes Global (CoreOS Translator)",
    description: "Multilingual B2B localization translator and geo-dialect auditor.",
    logoUrl: "globe",
    status: "active",
    needs: "Translate complex SaaS platform strings and localized copywriting files to guarantee cultural compliance.",
    aiConfig: {
      model: "coreos-prime",
      systemInstruction: "You are Hermes Global (CoreOS Translator). Seamlessly translate target dialogs while retaining original brand tones.",
      temperature: 0.5,
      topP: 0.9,
      safetySettings: "standard",
      customVariables: {
        "RegionScope": "EMEA, APAC & LATAM"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-9",
    name: "Atlas Sales (CoreOS Outreach)",
    description: "Cold outbound outreach copywriting specialist and leads converter.",
    logoUrl: "trending-up",
    status: "active",
    needs: "Write persuasive cold engagement B2B outreach messaging, refine sales frameworks, and convert targets.",
    aiConfig: {
      model: "coreos-creative",
      systemInstruction: "You are Atlas Sales (CoreOS Outreach). Structure enticing B2B offerings focusing on real economic values.",
      temperature: 0.8,
      topP: 0.9,
      safetySettings: "standard",
      customVariables: {
        "SaaSValueProp": "Save 45% Ops Surcharges"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-10",
    name: "Zephyr HR (CoreOS Recruiter)",
    description: "SaaS recruiter, corporate trainer and internal policy assistant.",
    logoUrl: "users",
    status: "active",
    needs: "Translate internal compliance guidelines into clear training workflows and employee interactive quizzes.",
    aiConfig: {
      model: "coreos-prime",
      systemInstruction: "You are Zephyr HR (CoreOS Recruiter). Explain internal policy codes with extreme warmth and structured lessons.",
      temperature: 0.7,
      topP: 0.9,
      safetySettings: "standard",
      customVariables: {
        "WorkingCulture": "Remote-First Trust"
      }
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "client-11",
    name: "Aether Voice Link (CoreOS Audio)",
    description: "Instant conversational relay and billing vocal assistant.",
    logoUrl: "phone",
    status: "active",
    needs: "Run seamless speech-like conversation answers and calculate instant bill estimates orally.",
    aiConfig: {
      model: "coreos-prime",
      systemInstruction: "You are Aether Voice Link (CoreOS Audio). Standardize text inputs to sound perfectly natural when spoken aloud.",
      temperature: 0.6,
      topP: 0.9,
      safetySettings: "standard",
      customVariables: {
        "AetherVoiceVibe": "Bilingual Friendly"
      }
    },
    createdAt: new Date().toISOString()
  }
];

interface Customer {
  id: string;
  name: string;
  email: string;
  sentencesUsed: number;
  sentenceLimit: number;
  charLimitPerSentence: number;
  status: 'active' | 'suspended';
}

function getDefaultCustomers(clientId: string, sentenceLimit = 70, charLimitPerSentence = 115): Customer[] {
  return [
    {
      id: `${clientId}-cust-1`,
      name: "Karwan Hewleri (Zanyar Tech)",
      email: "karwan@zanyartech.iq",
      sentencesUsed: Math.min(52, sentenceLimit),
      sentenceLimit: sentenceLimit,
      charLimitPerSentence: charLimitPerSentence,
      status: "active"
    },
    {
      id: `${clientId}-cust-2`,
      name: "Dara Al-Azzawi (Iraq Logistics)",
      email: "dara@iraqlogistics.com",
      sentencesUsed: sentenceLimit, // Exhausted sentences limit!
      sentenceLimit: sentenceLimit,
      charLimitPerSentence: charLimitPerSentence,
      status: "active"
    },
    {
      id: `${clientId}-cust-3`,
      name: "Samantha Vance (Apex Global)",
      email: "samantha@apex.uk",
      sentencesUsed: Math.min(15, sentenceLimit),
      sentenceLimit: sentenceLimit,
      charLimitPerSentence: charLimitPerSentence,
      status: "active"
    }
  ];
}

function countSentences(text: string): number {
  if (!text || !text.trim()) return 0;
  // Splitting by typical sentence endings (.!? or Arabic/Kurdish punctuation)
  const punctuationSplit = text.split(/[.!?؟]+/).map(s => s.trim()).filter(Boolean);
  return punctuationSplit.length || 1;
}

// Helper to load client list from JSON
function getClients(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CLIENTS_FILE)) {
      // Seed default clients initially
      const seeded = DEFAULT_CLIENTS.map(c => ({
        ...c,
        language: "english",
        customers: getDefaultCustomers(c.id)
      }));
      fs.writeFileSync(CLIENTS_FILE, JSON.stringify(seeded, null, 2), "utf8");
      return seeded;
    }
    const data = fs.readFileSync(CLIENTS_FILE, "utf8");
    const parsed = JSON.parse(data);
    
    // Auto-migrate to support language and customers
    let migrated = false;
    const updated = parsed.map((c: any) => {
      let changed = false;
      if (!c.language) {
        c.language = "english";
        changed = true;
      }
      if (!c.customers || c.customers.length === 0) {
        c.customers = getDefaultCustomers(c.id);
        changed = true;
      }
      if (changed) migrated = true;
      return c;
    });
    
    if (migrated) {
      fs.writeFileSync(CLIENTS_FILE, JSON.stringify(updated, null, 2), "utf8");
    }
    return updated;
  } catch (error) {
    console.error("Error reading clients store, returning defaults:", error);
    return DEFAULT_CLIENTS;
  }
}

// Helper to save client list to JSON
function saveClients(clients: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving clients store:", error);
  }
}

// Helpers for Business Owners persistent storage
function getOwners(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(OWNERS_FILE)) {
      fs.writeFileSync(OWNERS_FILE, JSON.stringify(DEFAULT_OWNERS, null, 2), "utf8");
      return DEFAULT_OWNERS;
    }
    const data = fs.readFileSync(OWNERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading owners store, returning defaults:", error);
    return DEFAULT_OWNERS;
  }
}

function saveOwners(owners: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(OWNERS_FILE, JSON.stringify(owners, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving owners store:", error);
  }
}

const CHATS_FILE = path.join(DATA_DIR, "chats.json");

function getChats(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CHATS_FILE)) {
      fs.writeFileSync(CHATS_FILE, JSON.stringify([], null, 2), "utf8");
      return [];
    }
    const data = fs.readFileSync(CHATS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading chats store:", error);
    return [];
  }
}

function saveChats(chats: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving chats store:", error);
  }
}

function recordChatInteraction(clientId: string, clientName: string, modelUsed: string, userText: string, assistantText: string, channel: string = "Sandbox") {
  try {
    const chats = getChats();
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    
    // Find active session for same client / channel within last 15 mins
    let sessionIndex = chats.findIndex(s => s.clientId === clientId && s.channel === channel && new Date(s.updatedAt).getTime() > fifteenMinutesAgo);
    
    const userMsg = {
      id: "hist-msg-" + Math.random() + "-" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    
    const botMsg = {
      id: "hist-msg-" + Math.random() + "-" + Date.now(),
      sender: "assistant",
      text: assistantText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    if (sessionIndex !== -1) {
      chats[sessionIndex].messages.push(userMsg, botMsg);
      chats[sessionIndex].updatedAt = new Date().toISOString();
      // Move this session to top of the list
      const updatedSession = chats.splice(sessionIndex, 1)[0];
      chats.unshift(updatedSession);
    } else {
      const newSession = {
        id: "session-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now(),
        clientId,
        clientName,
        modelUsed,
        channel,
        messages: [userMsg, botMsg],
        updatedAt: new Date().toISOString()
      };
      chats.unshift(newSession);
    }
    
    // Keep only the last 50 sessions
    if (chats.length > 50) {
      chats.splice(50);
    }
    
    saveChats(chats);
  } catch (err) {
    console.error("Failed to record chat interaction:", err);
  }
}

/* =========================================================================
   API ENDPOINTS
   ========================================================================= */

// API Status indicator
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: isConfigured(),
    timestamp: new Date().toISOString()
  });
});

// GET all chat sessions
app.get("/api/chats", (req, res) => {
  const chats = getChats();
  res.json(chats);
});

// DELETE a single chat session
app.delete("/api/chats/:id", (req, res) => {
  let chats = getChats();
  const exists = chats.some(c => c.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ error: "Session not found" });
  }
  chats = chats.filter(c => c.id !== req.params.id);
  saveChats(chats);
  res.json({ success: true, message: "Session deleted from audit ledger." });
});

// DELETE all chat sessions
app.delete("/api/chats", (req, res) => {
  saveChats([]);
  res.json({ success: true, message: "All session history cleared." });
});

// GET all clients
app.get("/api/clients", (req, res) => {
  const clients = getClients();
  res.json(clients);
});

// GET the capability tiers a client profile can be assigned to
app.get("/api/models", (req, res) => {
  // CoreOS publishes capability tiers, not engine names. Every tier runs the
  // same model; the tier sets how much latitude the agent is given.
  const models = [
    {
      name: "coreos-prime",
      displayName: "CoreOS AI Prime (Balanced)",
      version: "1",
      description: "Recommended by default. Fast, capable responses for everyday client chat.",
      supportedFeatures: ["Text Generation", "System Instructions", "Fast Inference"],
      inputTypes: ["Text"],
      outputTypes: ["Text"],
      releaseDate: "24/7 Active Stable",
      isCustom: false
    },
    {
      name: "coreos-precise",
      displayName: "CoreOS AI Precise (Literal)",
      version: "1",
      description: "Lowest variation. Best where wording and figures must stay consistent.",
      supportedFeatures: ["Deterministic Tone", "System Instructions"],
      inputTypes: ["Text"],
      outputTypes: ["Text"],
      releaseDate: "Active Stable",
      isCustom: false
    },
    {
      name: "coreos-creative",
      displayName: "CoreOS AI Creative (Expressive)",
      version: "1",
      description: "More varied phrasing, for marketing copy and brainstorming.",
      supportedFeatures: ["High Variation", "System Instructions"],
      inputTypes: ["Text"],
      outputTypes: ["Text"],
      releaseDate: "Active Stable",
      isCustom: false
    }
  ];

  res.json({ models, isLive: isConfigured() });
});

// CREATE a new client AI profile
app.post("/api/clients", (req, res) => {
  const clients = getClients();
  const generatedId = "client-" + Math.floor(Math.random() * 10000000);
  const newClient = {
    id: generatedId,
    name: req.body.name || "New Client AI Portal",
    description: req.body.description || "Custom SaaS AI application portal.",
    websiteUrl: req.body.websiteUrl || "",
    logoUrl: req.body.logoUrl || "bot",
    status: req.body.status || "configuring",
    needs: req.body.needs || "Please summarize our clients needs.",
    aiConfig: {
      model: req.body.aiConfig?.model || "coreos-prime",
      systemInstruction: req.body.aiConfig?.systemInstruction || "You are a helpful SaaS client assistant.",
      temperature: Number(req.body.aiConfig?.temperature) ?? 0.7,
      topP: Number(req.body.aiConfig?.topP) ?? 0.9,
      safetySettings: req.body.aiConfig?.safetySettings || "standard",
      customVariables: req.body.aiConfig?.customVariables || {}
    },
    charLimit: req.body.charLimit !== undefined ? Number(req.body.charLimit) : 1000,
    monitoredChars: req.body.monitoredChars !== undefined ? req.body.monitoredChars : "aeiou",
    limitType: req.body.limitType || "all",
    language: req.body.language || "english",
    customers: req.body.customers || getDefaultCustomers(
      generatedId,
      req.body.defaultSentenceLimit !== undefined ? Number(req.body.defaultSentenceLimit) : 70,
      req.body.defaultCharLimitPerSentence !== undefined ? Number(req.body.defaultCharLimitPerSentence) : 115
    ),
    createdAt: new Date().toISOString()
  };

  clients.unshift(newClient);
  saveClients(clients);
  res.status(201).json(newClient);
});

// UPDATE a client AI profile ("Adjust client needs")
app.put("/api/clients/:id", (req, res) => {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Client not found" });
  }

  const existing = clients[index];
  const updatedClient = {
    ...existing,
    name: req.body.name ?? existing.name,
    description: req.body.description ?? existing.description,
    websiteUrl: req.body.websiteUrl ?? existing.websiteUrl,
    logoUrl: req.body.logoUrl ?? existing.logoUrl,
    status: req.body.status ?? existing.status,
    needs: req.body.needs ?? existing.needs,
    aiConfig: {
      model: req.body.aiConfig?.model ?? existing.aiConfig.model,
      systemInstruction: req.body.aiConfig?.systemInstruction ?? existing.aiConfig.systemInstruction,
      temperature: Number(req.body.aiConfig?.temperature ?? existing.aiConfig.temperature),
      topP: Number(req.body.aiConfig?.topP ?? existing.aiConfig.topP),
      safetySettings: req.body.aiConfig?.safetySettings ?? existing.aiConfig.safetySettings,
      customVariables: req.body.aiConfig?.customVariables ?? existing.aiConfig.customVariables ?? {}
    },
    charLimit: req.body.charLimit !== undefined ? Number(req.body.charLimit) : (existing.charLimit ?? 100),
    monitoredChars: req.body.monitoredChars !== undefined ? req.body.monitoredChars : (existing.monitoredChars ?? "aeiou"),
    limitType: req.body.limitType ?? (existing.limitType ?? "all"),
    language: req.body.language ?? existing.language ?? "english",
    customers: req.body.customers ?? existing.customers ?? getDefaultCustomers(existing.id)
  };

  clients[index] = updatedClient;
  saveClients(clients);
  res.json(updatedClient);
});

// DELETE client profile
app.delete("/api/clients/:id", (req, res) => {
  let clients = getClients();
  const exists = clients.some(c => c.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ error: "Client not found" });
  }
  clients = clients.filter(c => c.id !== req.params.id);
  saveClients(clients);
  res.json({ success: true, message: "Client deleted." });
});

/* =========================================================================
   BUSINESS OWNERS & AI TENANTS CRUD API
   ========================================================================= */

// GET all business owners
app.get("/api/owners", (req, res) => {
  const owners = getOwners();
  res.json(owners);
});

// CREATE a new business owner
app.post("/api/owners", (req, res) => {
  const owners = getOwners();
  const id = "owner-" + Math.floor(Math.random() * 10000000);
  const newOwner = {
    id,
    name: req.body.name || "New Business Owner",
    companyName: req.body.companyName || "SaaS Company",
    email: req.body.email || "",
    linkedClientId: req.body.linkedClientId || "",
    plan: req.body.plan || "standard",
    status: req.body.status || "active",
    createdAt: new Date().toISOString()
  };
  owners.unshift(newOwner);
  saveOwners(owners);
  res.status(201).json(newOwner);
});

// UPDATE an existing business owner
app.put("/api/owners/:id", (req, res) => {
  const owners = getOwners();
  const index = owners.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Owner not found" });
  }
  const existing = owners[index];
  const updated = {
    ...existing,
    name: req.body.name ?? existing.name,
    companyName: req.body.companyName ?? existing.companyName,
    email: req.body.email ?? existing.email,
    linkedClientId: req.body.linkedClientId ?? existing.linkedClientId,
    plan: req.body.plan ?? existing.plan,
    status: req.body.status ?? existing.status
  };
  owners[index] = updated;
  saveOwners(owners);
  res.json(updated);
});

// DELETE a business owner
app.delete("/api/owners/:id", (req, res) => {
  let owners = getOwners();
  const exists = owners.some(o => o.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ error: "Owner not found" });
  }
  owners = owners.filter(o => o.id !== req.params.id);
  saveOwners(owners);
  res.json({ success: true, message: "Owner deleted successfully." });
});

// GENERATE perfect system persona prompt ("Fill client needs")
app.post("/api/generate-instruction", async (req, res) => {
  const { clientName, description, needs, customVariables } = req.body;
  if (!needs) {
    return res.status(400).json({ error: "Needs statement is required to build instructions" });
  }

  const prompt = `Write a professional system instruction/persona prompt for a customized CoreOS AI chatbot integration.
The target website is CoreOS SaaS. The client is:
Client Name: "${clientName}"
Client Description: "${description || 'None'}"
Core Client Needs: "${needs}"
Any Custom Config Variables available: ${JSON.stringify(customVariables || {})}

Write a robust, clearly formatted, single-persona instruction for the systemInstruction configuration parameter of the model. 
Focus strictly on:
- Brand identification (as this client's brand built on CoreOS)
- Specific instructions on how to address the 'Core Client Needs'
- Tone guidance (professional, warm, technical, or supportive)
- Guidelines on safety limitations and guardrails (e.g. do not invent status reports)
- Formatting outputs cleanly (using sleek tables, dividers, and list markdowns)

Respond ONLY with the complete, fully written system instruction text block. Do not write introductory words like "Here are the instructions:" or place markdown backticks around the instruction itself. Offer direct, high-quality content.`;

  if (!isConfigured()) {
    // Elegant fallback simulation is keys are not set
    const mockInstruction = `You are the specialized AI Assistant for ${clientName || 'our CoreOS Client'}.

## Core Mandates:
1. Support client needs directly: "${needs}"
2. Present details in structured tables or bullet listings with generous spacing.
3. Be supportive, knowledgeable, and state that support logs are updated 24/7.
4. Keep answers focused on resolving client inquiries. Avoid conversational fillers.`;
    return res.json({ instruction: mockInstruction, isFallback: true });
  }

  try {
    const { text: instruction } = await generateReply({
      system: "You are an expert prompt engineering systems architect. You generate structured, rich, and highly effective persona system instructions.",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 4096,
    });

    res.json({ instruction, isFallback: false });
  } catch (error: any) {
    console.error("Failed to generate instructions:", error?.message || error);
    res.status(500).json({ error: error.message });
  }
});

// SIMULATE live conversation with client configured AI ("Adjust current settings")
app.post("/api/chat/simulate", async (req, res) => {
  const { id, message, history, aiConfig, customerId } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const clients = getClients();
  const activeClient = clients.find(c => c.id === id);

  // Status-based security authorization check (Yes, yes you can use it vs No, no you can't!)
  if (activeClient && activeClient.status === "deactivated") {
    return res.status(403).json({
      error: "AI_ACCESS_REVOKED",
      message: `Access authorization revoked for node node: "${activeClient.name}". The system administrator has deactivated this AI node.`
    });
  }

  // Find the customer being simulated
  let customer: Customer | null = null;
  let customerIndex = -1;
  
  if (activeClient && activeClient.customers) {
    const targetId = customerId || (activeClient.customers[0] ? activeClient.customers[0].id : "");
    customerIndex = activeClient.customers.findIndex((c: any) => c.id === targetId);
    if (customerIndex !== -1) {
      customer = activeClient.customers[customerIndex];
    }
  }

  // Get dynamic limits (or default to 115 characters and 70 sentences)
  const charLimit = customer ? (customer.charLimitPerSentence || 115) : 115;
  const sentenceLimit = customer ? (customer.sentenceLimit || 70) : 70;

  // 1. Core Sentence and Character Limits Check
  // Check if current message is strictly under characters cap
  if (message.length > charLimit) {
    return res.json({
      text: `❌ **Character Limit Exceeded**\nYour sentence contains **${message.length} characters**, which exceeds the strict individual threshold limit of **${charLimit} characters**.\n\n*Please shorten your sentence so the business customer AI node can process it or contact the administrator to adjust credits.*`,
      limitExceeded: true,
      errorCode: "CHAR_LIMIT_EXCEEDED"
    });
  }

  if (customer) {
    // If sentences are already up to limit:
    if (customer.sentencesUsed >= sentenceLimit) {
      return res.json({
        text: `🚨 **[USAGE LIMIT EXCEEDED]**\nYou have reached the limit of **${customer.sentencesUsed}/${sentenceLimit} sentences** with **${charLimit} characters** limit per phrase.\n\n**To continue using this AI service, please contact the business owner to refill your allowance or adjust your plan.**\n\n*Business Owners: Refill quota or update subscription credits dynamically.*`,
        limitExceeded: true,
        errorCode: "SENTENCE_LIMIT_EXCEEDED"
      });
    }

    // Calculate sentences in current message
    const sentencesAdded = countSentences(message);
    if (customer.sentencesUsed + sentencesAdded > sentenceLimit) {
      return res.json({
        text: `🚨 **[USAGE LIMIT EXCEEDED]**\nSubmitting this query would add **${sentencesAdded} sentences**, putting you over your remaining budget. (${customer.sentencesUsed} used of ${sentenceLimit} allowed).\n\n**To continue using this AI service, please contact the business owner to refill your allowance.**`,
        limitExceeded: true,
        errorCode: "SENTENCE_LIMIT_EXCEEDED"
      });
    }

    // Increment and save customer usage!
    customer.sentencesUsed += sentencesAdded;
    activeClient.customers[customerIndex] = customer;
    const clientIdx = clients.findIndex(c => c.id === activeClient.id);
    if (clientIdx !== -1) {
      clients[clientIdx] = activeClient;
      saveClients(clients);
    }
  }

  const clientName = activeClient ? activeClient.name : "Custom AI Integration";
  const clientNeeds = activeClient ? activeClient.needs : "Direct AI responses configured via CoreOS system instructions.";
  const clientDescription = activeClient ? activeClient.description : "SaaS custom AI application portal.";
  const clientLanguage = (activeClient && activeClient.language) ? activeClient.language : "english";

  const config = aiConfig || {};
  const systemInstruction = config.systemInstruction || "You are a helpful assistant.";
  const temperature = Number(config.temperature ?? 0.7);
  const customVariables = config.customVariables || {};

  /* Every agent now runs on one model, so the client's configured tier is a
     label rather than a route. It is kept for the audit log so historical
     entries stay meaningful, including ones naming long-retired engines. */
  const configuredTier = config.model || "coreos-prime";

  // Inject custom variables and brand details
  let compiledInstruction = `Your brand name/agent identity is: "${clientName}". ${systemInstruction}`;
  Object.entries(customVariables).forEach(([key, val]) => {
    compiledInstruction = compiledInstruction.replace(new RegExp(`{${key}}`, 'gi'), String(val));
    compiledInstruction += `\n[Context Data Option: ${key} = ${val}]`;
  });

  // Inject the language restriction into the compiled system instruction
  compiledInstruction += `\nStrict Constraint: You MUST communicate and reply exclusively in the ${clientLanguage.toUpperCase()} language. If Kurdish (Sorani/Kurmanji) is requested, use Kurdish characters. If Arabic is requested, use Arabic characters. Keep responses compliant.`;

  if (!isConfigured()) {
    // Simulate responses translated or formatted based on chosen Language
    setTimeout(() => {
      let greeting = `🤖 **[SYSTEM CORE PROTOCOL ACTIVE]**\n**Persona Node**: ${clientName}\n**Target Model Core**: ${configuredTier.toUpperCase()} (Tuned Temp: ${temperature})\n\n`;
      let bodyText = "";
      const msgLower = message.toLowerCase();

      // Translate headings/replies based on configured language
      if (clientLanguage === "kurdish") {
        greeting = `🤖 **[سیستەمی ناوەکی ئەکتیڤە]**\n**ناوی براند**: ${clientName}\n**مۆدێلی کارا**: ${configuredTier.toUpperCase()}\n\n`;
        
        if (msgLower.includes("track") || msgLower.includes("where") || msgLower.includes("package") || msgLower.includes("ناردن")) {
          bodyText = `### 📦 زانیاری گواستنەوەی بار بە زمانی کوردی\nوەک براندی **${clientName}**، لێرە زانیاری بارەکانت بۆ پیشان دەدەین:\n\n- **کۆدی بار**: AERO-928-X\n- **بار**: کەرەستەی بازرگانی\n- **دۆخ**: 🟢 لە ڕێگادایە - دەگاتە کاتژمێر ١٨:٣٠\n\n*ئایا دەتەوێت بیمە بکەیت یان شوێنەکە بگۆڕیت کاروان؟*`;
        } else {
          bodyText = `سڵاو و بەخێربێن! من یاریدەدەری زیرەکی براندی **${clientName}**م بۆ خزمەتگوزارییەکانتان.\n\nمن یارمەتیت دەدەم لەم بوارانەدا:\n١. چارەسەرکردنی کێشەکان بە شێوازێکی خێرا\n٢. پێدانی ڕاپۆرت لەسەر بنەمای زانیارییەکان\n\nچۆن دەتوانم ئەمڕۆ یارمەتیت بدەم؟`;
        }
      } else if (clientLanguage === "arabic") {
        greeting = `🤖 **[بروتوكول النظام الأساسي نشط]**\n**هوية العميل**: ${clientName}\n**النموذج المستخدم**: ${configuredTier.toUpperCase()}\n\n`;
        
        if (msgLower.includes("track") || msgLower.includes("where") || msgLower.includes("أين") || msgLower.includes("شحن")) {
          bodyText = `### 📦 الاستعلام عن تتبع الشحنات اللوجستية باللغة العربية\nبصفتي متخصص **${clientName}**، قمت بالاستعلام لك عن الشحنة:\n\n- **رمز التتبع**: AERO-928-X\n- **حالة الشحنة**: 🟢 في الطريق - ميعاد الوصول المتوقع 18:30\n\n*هل تود حجز مساحة شحن جديدة مع منصة CoreOS اليوم؟*`;
        } else {
          bodyText = `أهلاً ومرحباً بك! أنا المساعد الذكي لعلامتك التجارية **${clientName}** المخصص للمساعدة ومحاكاة الردود.\n\nيسعدني خدمتك بخصوص:\n١. الإجابة عن التساؤلات الفنية والمعلوماتية.\n٢. تقديم الأسعار وتفاصيل المعاملات.\n\nكيف يمكنني مساعدتك اليوم بخصوص نظامنا؟`;
        }
      } else {
        // English Default
        if (clientName.toLowerCase().includes("aero") || clientNeeds.toLowerCase().includes("logistic") || clientNeeds.toLowerCase().includes("track") || clientNeeds.toLowerCase().includes("cargo") || clientNeeds.toLowerCase().includes("ship")) {
          if (msgLower.includes("track") || msgLower.includes("where") || msgLower.includes("package") || msgLower.includes("code")) {
            bodyText = `### 📦 Real-Time Logistics Track Query\nAs the **${clientName}** specialist, I have queried our CoreOS active air-freight registers.\n\n| Tracking Code | Consignment Cargo | Route Transit | Transit Status |\n| :--- | :--- | :--- | :--- |\n| **AERO-928-X** | Automated Heavy Parts | London (LHR) ➔ Paris (CDG) | 🟢 In Transit - Arriving 18:30 |\n\n*Would you like me to book cargo space or compute insurance coverage options?*`;
          } else {
            bodyText = `Greetings! I am **${clientName}**, your B2B logistics manager.\n\nI help guide operations regarding:\n1. **Shipping Rates & Quotation Computations**\n2. **Transit Tracker Audits**\n\nHow can I speed up your cargo workflow today?`;
          }
        } else {
          bodyText = `Welcome! I am **${clientName}**, your professional AI assistant.\n\nI am configured on CoreOS to fulfill your business goals:\n> "${clientNeeds}"\n\nHow can I assist you today?`;
        }
      }

      let reply = `${greeting}${bodyText}\n\n---\n*💡 Developer Notice: Set OPENROUTER_API_KEY and OPENROUTER_MODEL in this deployment's environment variables to run real live conversations in ${clientLanguage.toUpperCase()} against the actual model.*`;
      recordChatInteraction(id, clientName, configuredTier, message, reply, req.body.channel || "Sandbox Simulator");
      res.json({ text: reply, isFallback: true, customerUsage: customer });
    }, 750);
    return;
  }

  try {
    const contentHistory: ChatTurn[] = [];

    if (history && history.length > 0) {
      history.forEach((h: any) => {
        if (!h || typeof h.text !== "string" || !h.text.trim()) return;
        if (h.sender === "user") {
          contentHistory.push({ role: "user", content: h.text });
        } else if (h.sender === "assistant") {
          contentHistory.push({ role: "assistant", content: h.text });
        }
      });
    }

    contentHistory.push({ role: "user", content: message });

    const { text: replyText } = await generateReply({
      system: compiledInstruction,
      messages: contentHistory,
      temperature,
    });

    recordChatInteraction(id, clientName, configuredTier, message, replyText, req.body.channel || "Sandbox Simulator");
    res.json({ text: replyText, isFallback: false, customerUsage: customer });
  } catch (err: any) {
    console.error("Simulator error:", err);
    res.status(500).json({ error: err.message });
  }
});


/* =========================================================================
   PUBLIC AI TESTING LAB (Express transport)

   The roster, the charter and the answering logic live in lab/agents.ts so the
   serverless deployments share them. This file adds only what is specific to
   running as a long-lived server: routing and in-memory rate limiting.
   ========================================================================= */

app.get("/api/lab/agents", (req, res) => {
  res.json({ agents: publicAgentList(), live: isConfigured() });
});

/* Coarse per-IP throttle. The endpoint is unauthenticated by design, so it
   needs some ceiling; in-memory is enough for a single-instance deployment. */
const LAB_WINDOW_MS = 60 * 60 * 1000;
const LAB_MAX_PER_WINDOW = 60;
const labUsage = new Map<string, { count: number; resetAt: number }>();

function labRateLimit(ip: string): { ok: boolean; retryInMin: number } {
  const now = Date.now();
  const entry = labUsage.get(ip);
  if (!entry || now > entry.resetAt) {
    labUsage.set(ip, { count: 1, resetAt: now + LAB_WINDOW_MS });
    return { ok: true, retryInMin: 0 };
  }
  if (entry.count >= LAB_MAX_PER_WINDOW) {
    return { ok: false, retryInMin: Math.ceil((entry.resetAt - now) / 60000) };
  }
  entry.count += 1;
  return { ok: true, retryInMin: 0 };
}

// Drop expired throttle entries hourly so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of labUsage) {
    if (now > entry.resetAt) labUsage.delete(ip);
  }
}, LAB_WINDOW_MS).unref?.();

app.post("/api/lab/chat", async (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "unknown";
  const limit = labRateLimit(ip);
  if (!limit.ok) {
    const arabic = req.body?.lang !== "en";
    return res.status(429).json({
      error: "RATE_LIMITED",
      message: arabic
        ? `لقد بلغت حد بيئة الاختبار وهو ${LAB_MAX_PER_WINDOW} رسالة في الساعة. حاول بعد نحو ${limit.retryInMin} دقيقة، أو تواصل معنا لنفتح لك تجربة كاملة.`
        : `You've reached the sandbox limit of ${LAB_MAX_PER_WINDOW} messages an hour. Try again in about ${limit.retryInMin} minutes, or get in touch and we'll open a proper trial.`,
    });
  }

  const { slug, message, history, lang } = req.body || {};
  const { status, body } = await handleLabChat({ slug, message, history, lang });
  res.status(status).json(body);
});


/* =========================================================================
   INBOX RESPONDER (Express transport)

   The pipeline lives in lab/inbox.ts so the serverless deployments share it.
   Three routes: one the scheduler pokes, one the notification's links open,
   and one to see what the thing is doing.
   ========================================================================= */

app.get("/api/inbox/status", async (_req, res) => {
  try {
    res.json(await inboxStatus());
  } catch (err: any) {
    console.error("Inbox status failed:", err?.message || err);
    res.status(500).json({ error: "STATUS_FAILED" });
  }
});

app.post("/api/inbox/scan", async (req, res) => {
  const presented = req.headers["x-inbox-secret"] || req.query.secret;
  const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress || "");
  if (!authorizeScan(Array.isArray(presented) ? presented[0] : presented, local)) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    const report = await runInboxScan();
    if (report.ran) {
      console.log(
        `Inbox scan: examined ${report.examined}, drafted ${report.drafted}, sent ${report.sent}, escalated ${report.escalated}, ignored ${report.ignored}`,
      );
    }
    res.json(report);
  } catch (err: any) {
    console.error("Inbox scan failed:", err?.message || err);
    res.status(500).json({ error: "SCAN_FAILED", message: err?.message || "unknown error" });
  }
});

/* Opened from an email client, so it answers with a page rather than JSON. */
app.get("/api/inbox/action", async (req, res) => {
  try {
    const outcome = await handleInboxAction(req.query.id, req.query.do, req.query.t);
    res.status(outcome.status).type("html").send(actionPage(outcome));
  } catch (err: any) {
    console.error("Inbox action failed:", err?.message || err);
    res
      .status(500)
      .type("html")
      .send(actionPage({ status: 500, title: "That didn't work", message: "Something went wrong. Open the draft in Gmail instead." }));
  }
});


/* =========================================================================
   VITE DEVELOPMENTS / STATIC SERVING
   ========================================================================= */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CoreOS SaaS Manager running at http://localhost:${PORT}`);
  });
}

startServer();
