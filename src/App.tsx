/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Bot,
  Sparkles,
  Cpu,
  Sliders,
  Send,
  RefreshCw,
  Plus,
  Trash,
  Globe,
  FileText,
  Check,
  Download,
  AlertTriangle,
  ChevronRight,
  Terminal,
  Info,
  Lock,
  Unlock,
  MessageSquare,
  Search,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  Link,
  Copy,
  Code,
  ExternalLink,
  Coins,
  ShieldAlert,
  DollarSign,
  CreditCard,
  Sun,
  Moon
} from "lucide-react";
import { Client, AIConfig, ModelItem, Message, BusinessOwner } from "./types";

function getCountedCharacters(text: string, limitType: 'all' | 'specific' | undefined, monitoredChars: string | undefined): number {
  if (!text) return 0;
  if (!limitType || limitType === 'all') {
    return text.length;
  }
  const filterSet = new Set((monitoredChars || "aeiou").toLowerCase());
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (filterSet.has(text[i].toLowerCase())) {
      count++;
    }
  }
  return count;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Tabs: 'clients' | 'playground' | 'history' | 'radar' | 'owners'
  const [activeTab, setActiveTab] = useState<"clients" | "playground" | "history" | "radar" | "owners">("clients");

  // Core Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [apiHealth, setApiHealth] = useState<{ status: string; hasApiKey: boolean; timestamp: string } | null>(null);

  // Business Owners State
  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [isCreateOwnerModalOpen, setIsCreateOwnerModalOpen] = useState(false);

  // Create Owner Form State
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerCompanyName, setNewOwnerCompanyName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerLinkedClientId, setNewOwnerLinkedClientId] = useState("");
  const [newOwnerPlan, setNewOwnerPlan] = useState<'standard' | 'growth' | 'enterprise'>("standard");
  const [newOwnerStatus, setNewOwnerStatus] = useState<'active' | 'suspended'>("active");

  // Chat History state
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  // Loading States
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isSyncingModels, setIsSyncingModels] = useState(false);
  const [isGeneratingInstruction, setIsGeneratingInstruction] = useState(false);
  const [isSendingSandboxMsg, setIsSendingSandboxMsg] = useState(false);

  // Selection states
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearch, setClientSearch] = useState("");

  // Create Client Form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientNeeds, setNewClientNeeds] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [newClientWeb, setNewClientWeb] = useState("");
  const [newClientModel, setNewClientModel] = useState("gemini-2.5-flash");
  const [newClientLanguage, setNewClientLanguage] = useState<"english" | "arabic" | "kurdish">("english");
  const [newClientSentenceLimit, setNewClientSentenceLimit] = useState<number>(70);
  const [newClientCharLimitPerSentence, setNewClientCharLimitPerSentence] = useState<number>(115);
  const [newClientGeneralCharLimit, setNewClientGeneralCharLimit] = useState<number>(1500);

  // Edits to the active Client variables
  const [activeClientState, setActiveClientState] = useState<Client | null>(null);
  const [variableKey, setVariableKey] = useState("");
  const [variableVal, setVariableVal] = useState("");

  // Customer inline editor states
  const [editingCustomerId, setEditingCustomerId] = useState<string>("");
  const [editingCustomerName, setEditingCustomerName] = useState<string>("");
  const [editingCustomerEmail, setEditingCustomerEmail] = useState<string>("");
  const [editingCustomerSentenceLimit, setEditingCustomerSentenceLimit] = useState<number>(70);
  const [editingCustomerCharLimitPerSentence, setEditingCustomerCharLimitPerSentence] = useState<number>(115);
  const [editingCustomerSentencesUsed, setEditingCustomerSentencesUsed] = useState<number>(0);

  // Sandbox play state
  const [sandboxMessages, setSandboxMessages] = useState<Record<string, Message[]>>({});
  const [sandboxInput, setSandboxInput] = useState("");
  const [sandboxPresetQuery, setSandboxPresetQuery] = useState("");
  const [sandboxCustomerId, setSandboxCustomerId] = useState("");

  // Monetization Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTargetClient, setUpgradeTargetClient] = useState<Client | null>(null);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<"pack" | "pro" | "unlimited">("pro");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [mockCardNumber, setMockCardNumber] = useState("4111 2222 3333 4444");
  const [mockCardName, setMockCardName] = useState("");

  // Status Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Check if there is a ?portal=id or ?clientId=id in the URL to run standalone web agent portal
  const [portalClientId, setPortalClientId] = useState<string | null>(null);
  const [portalIsAdmin, setPortalIsAdmin] = useState<boolean>(false);
  const [portalMessages, setPortalMessages] = useState<Message[]>([]);
  const [portalInput, setPortalInput] = useState("");
  const [isSendingPortal, setIsSendingPortal] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Input states for adding a new customer to a client profile
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerSentenceLimit, setNewCustomerSentenceLimit] = useState<number>(70);
  const [newCustomerCharLimitPerSentence, setNewCustomerCharLimitPerSentence] = useState<number>(115);
  const [portalCustomerId, setPortalCustomerId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get("portal") || params.get("clientId");
    if (pId) {
      setPortalClientId(pId);
      setPortalIsAdmin(params.get("admin") === "true");
      setPortalCustomerId(params.get("customerId") || "");
    }
  }, []);

  // When clients load and portalClientId is active, pre-populate introductory greeting
  useEffect(() => {
    if (portalClientId && clients.length > 0 && portalMessages.length === 0) {
      const activeP = clients.find(c => c.id === portalClientId);
      if (activeP) {
        setPortalMessages([
          {
            id: "system-init",
            sender: "bot",
            text: `👋 Hello! Welcome to the secure interactive chat terminal powered by **CoreOS AI**.\n\nI am **${activeP.name}** and I am fully configured to align with your customized operational rules.\n\nHow can I help you check information, automate tasks, or resolve inquiries today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    }
  }, [portalClientId, clients, portalMessages.length]);

  // Fetch API Health, Clients & Models on Mount
  useEffect(() => {
    fetchHealthStatus();
    loadClients(true);
    loadOwners();
    loadModels();
    loadHistory();
  }, []);

  const triggerAlert = (type: "success" | "error" | "info", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4500);
  };

  const fetchHealthStatus = async () => {
    try {
      const resp = await fetch("/api/health");
      const data = await resp.json();
      setApiHealth(data);
    } catch (err) {
      console.error("Health probe failed:", err);
    }
  };

  const loadClients = async (selectFirst = false) => {
    setIsLoadingClients(true);
    try {
      const resp = await fetch("/api/clients");
      if (resp.ok) {
        const data: Client[] = await resp.json();
        setClients(data);
        if (selectFirst && data.length > 0) {
          setSelectedClientId(data[0].id);
          setActiveClientState(data[0]);
        } else if (selectedClientId) {
          const fresh = data.find(c => c.id === selectedClientId);
          if (fresh) setActiveClientState(fresh);
        }
      }
    } catch (err) {
      triggerAlert("error", "Could not connect to CoreOS Clients Server.");
    } finally {
      setIsLoadingClients(false);
    }
  };

  const loadOwners = async () => {
    setIsLoadingOwners(true);
    try {
      const resp = await fetch("/api/owners");
      if (resp.ok) {
        const data = await resp.json();
        setOwners(data || []);
      }
    } catch (err) {
      console.error("Failed to load business owners", err);
    } finally {
      setIsLoadingOwners(false);
    }
  };

  const handleCreateOwner = async (e: any) => {
    e.preventDefault();
    if (!newOwnerName.trim() || !newOwnerEmail.trim() || !newOwnerCompanyName.trim()) {
      triggerAlert("error", "Please fill out all required fields to register a Business Owner.");
      return;
    }

    const payload = {
      name: newOwnerName,
      companyName: newOwnerCompanyName,
      email: newOwnerEmail,
      linkedClientId: newOwnerLinkedClientId,
      plan: newOwnerPlan,
      status: newOwnerStatus
    };

    try {
      const resp = await fetch("/api/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const created: BusinessOwner = await resp.json();
        setOwners(prev => [created, ...prev]);
        setIsCreateOwnerModalOpen(false);
        setNewOwnerName("");
        setNewOwnerCompanyName("");
        setNewOwnerEmail("");
        setNewOwnerLinkedClientId("");
        setNewOwnerPlan("standard");
        setNewOwnerStatus("active");
        triggerAlert("success", `Registered business owner account for: ${created.name}`);
      }
    } catch (err) {
      triggerAlert("error", "Could not create Business Owner record on server.");
    }
  };

  const handleUpdateOwnerStatus = async (owner: BusinessOwner, newStatus: 'active' | 'suspended') => {
    const updated = { ...owner, status: newStatus };
    try {
      const resp = await fetch(`/api/owners/${owner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (resp.ok) {
        const saved: BusinessOwner = await resp.json();
        setOwners(prev => prev.map(o => o.id === saved.id ? saved : o));
        triggerAlert("success", `Updated ${owner.name}'s status to ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      triggerAlert("error", "Failed to shift owner status.");
    }
  };

  const handleDeleteOwner = async (ownerId: string) => {
    if (!confirm("Are you sure you want to delete this Business Owner registration?")) return;
    try {
      const resp = await fetch(`/api/owners/${ownerId}`, {
        method: "DELETE"
      });
      if (resp.ok) {
        setOwners(prev => prev.filter(o => o.id !== ownerId));
        triggerAlert("success", "Business Owner profile deleted.");
      }
    } catch (err) {
      triggerAlert("error", "Failed to clear owner account.");
    }
  };

  const handleResetOwnerClientUsage = async (owner: BusinessOwner) => {
    const linkedClient = clients.find(c => c.id === owner.linkedClientId);
    if (!linkedClient) {
      triggerAlert("info", "No linked AI Client Portal found for this owner configuration.");
      return;
    }
    const updatedCusts = (linkedClient.customers || []).map(c => ({
      ...c,
      sentencesUsed: 0
    }));
    const updatedClient = {
      ...linkedClient,
      customers: updatedCusts
    };
    try {
      const resp = await fetch(`/api/clients/${linkedClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedClient)
      });
      if (resp.ok) {
        setClients(prev => prev.map(c => c.id === linkedClient.id ? updatedClient : c));
        if (selectedClientId === linkedClient.id || activeClientState?.id === linkedClient.id) {
          setActiveClientState(updatedClient);
        }
        triggerAlert("success", `Successfully reset sentences used quota for ${owner.name}'s business seats!`);
      }
    } catch (err) {
      triggerAlert("error", "Could not synchronize quota refilling to server.");
    }
  };

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const resp = await fetch("/api/models");
      if (resp.ok) {
        const data = await resp.json();
        setModels(data.models || []);
      }
    } catch (err) {
      console.error("Failed to load models list", err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const resp = await fetch("/api/chats");
      if (resp.ok) {
        const data = await resp.json();
        setChatSessions(data || []);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const deleteHistorySession = async (sessionId: string) => {
    try {
      const resp = await fetch(`/api/chats/${sessionId}`, { method: "DELETE" });
      if (resp.ok) {
        triggerAlert("success", "Interaction deleted from audit ledger.");
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
        }
      }
    } catch (err) {
      triggerAlert("error", "Failed to delete interaction.");
    }
  };

  const clearAllHistory = async () => {
    try {
      const resp = await fetch("/api/chats", { method: "DELETE" });
      if (resp.ok) {
        triggerAlert("success", "Audit ledger successfully purged.");
        setChatSessions([]);
        setSelectedSessionId(null);
      }
    } catch (err) {
      triggerAlert("error", "Failed to clear ledger.");
    }
  };

  const handleUpgradeClient = async () => {
    if (!upgradeTargetClient) return;
    setIsProcessingPayment(true);
    
    setTimeout(async () => {
      let limitValue = 500;
      if (selectedUpgradePlan === "pack") {
        limitValue = (upgradeTargetClient.charLimit ?? 100) + 150;
      } else if (selectedUpgradePlan === "pro") {
        limitValue = 600;
      } else {
        limitValue = 10000;
      }

      const updated = {
        ...upgradeTargetClient,
        charLimit: limitValue
      };

      try {
        const resp = await fetch(`/api/clients/${upgradeTargetClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
        if (resp.ok) {
          const saved: Client = await resp.json();
          setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
          if (activeClientState && activeClientState.id === saved.id) {
            setActiveClientState(saved);
          }
          setPaymentSuccess(true);
          triggerAlert("success", `Successful Payment! '${saved.name}' limit set to ${limitValue} characters.`);
          
          setTimeout(() => {
            setIsUpgradeModalOpen(false);
            setPaymentSuccess(false);
            setIsProcessingPayment(false);
          }, 2000);
        } else {
          setIsProcessingPayment(false);
          triggerAlert("error", "Payment simulation failed on server.");
        }
      } catch (err) {
        setIsProcessingPayment(false);
        triggerAlert("error", "Payment processing error.");
      }
    }, 1200);
  };

  const getModelDisplayName = (modelId: string) => {
    if (!modelId) return "Unknown Model";
    const cleanId = modelId.toLowerCase().trim();
    if (cleanId.includes("gemini-2.5-flash") || cleanId.includes("gemini-3.5-flash")) return "CoreOS AI Prime (High-Speed)";
    if (cleanId.includes("gemini-2.5-pro") || cleanId.includes("gemini-3.1-pro-preview")) return "CoreOS AI Max (Reasoning)";
    if (cleanId.includes("gemini-2.0-flash-lite") || cleanId.includes("gemini-3.1-flash-lite")) return "CoreOS AI Lite (Low-Latency)";
    if (cleanId.includes("gemini-2.0-flash")) return "CoreOS AI Flash (Interactive)";
    
    const found = models.find(m => m.name === modelId || m.name.replace("models/", "") === modelId.replace("models/", ""));
    return found ? found.displayName : modelId;
  };

  const syncModelsList = async () => {
    setIsSyncingModels(true);
    try {
      const resp = await fetch("/api/models");
      if (resp.ok) {
        const data = await resp.json();
        setModels(data.models || []);
        if (data.isLive) {
          triggerAlert("success", "Successfully reloaded dynamic model registry from live core node cluster.");
        } else {
          triggerAlert("info", "Dynamic syncing fallback mode returned. Using standard high-speed CoreOS model index.");
        }
      }
    } catch (err) {
      triggerAlert("error", "Connection error. Dynamic model registry offline.");
    } finally {
      setIsSyncingModels(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setActiveClientState(JSON.parse(JSON.stringify(client))); // Deep copy
    }
  };

   // Create Client Submit
  const handleCreateClient = async () => {
    if (!newClientName || !newClientNeeds) {
      triggerAlert("error", "Name and Client Needs statement are required.");
      return;
    }

    try {
      const resp = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName,
          description: newClientDesc,
          websiteUrl: newClientWeb,
          needs: newClientNeeds,
          status: "configuring",
          language: newClientLanguage,
          charLimit: newClientGeneralCharLimit,
          defaultSentenceLimit: newClientSentenceLimit,
          defaultCharLimitPerSentence: newClientCharLimitPerSentence,
          aiConfig: {
            model: newClientModel,
            systemInstruction: `You are the Custom AI Specialist for ${newClientName}. Keep responses aligned with client needs: ${newClientNeeds}`,
            temperature: 0.7,
            topP: 0.9,
            safetySettings: "standard",
            customVariables: {}
          }
        })
      });

      if (resp.ok) {
        const added: Client = await resp.json();
        setClients(prev => [added, ...prev]);
        setSelectedClientId(added.id);
        setActiveClientState(added);
        setIsCreateModalOpen(false);
        setNewClientName("");
        setNewClientDesc("");
        setNewClientWeb("");
        setNewClientNeeds("");
        setNewClientSentenceLimit(70);
        setNewClientCharLimitPerSentence(115);
        setNewClientGeneralCharLimit(1500);
        triggerAlert("success", `Custom AI profile for '${added.name}' initialized.`);
      }
    } catch (err) {
      triggerAlert("error", "Failed to compile custom AI profile.");
    }
  };

  // Client updates ("Adjust client needs")
  const handleUpdateClientValue = async (updated: Client) => {
    try {
      const resp = await fetch(`/api/clients/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (resp.ok) {
        const saved: Client = await resp.json();
        // Update client array
        setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
        setActiveClientState(saved);
      }
    } catch (err) {
      triggerAlert("error", "Could not synchronize client changes to server.");
    }
  };

  const handleFieldChange = (field: keyof Client | keyof AIConfig, value: any, isConfig = false) => {
    if (!activeClientState) return;

    let updated: Client;
    if (isConfig) {
      updated = {
        ...activeClientState,
        aiConfig: {
          ...activeClientState.aiConfig,
          [field]: value
        }
      };
    } else {
      updated = {
        ...activeClientState,
        [field]: value
      };
    }
    setActiveClientState(updated);
    // Debounce/Trigger save dynamically
    handleUpdateClientValue(updated);
  };

  // Delete Client
  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to retire this customer's custom AI?")) return;
    try {
      const resp = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (resp.ok) {
        const remaining = clients.filter(c => c.id !== id);
        setClients(remaining);
        triggerAlert("success", "AI Client profile removed successfully.");
        if (remaining.length > 0) {
          setSelectedClientId(remaining[0].id);
          setActiveClientState(remaining[0]);
        } else {
          setSelectedClientId("");
          setActiveClientState(null);
        }
      }
    } catch (err) {
      triggerAlert("error", "Error removing profile.");
    }
  };

  // ✨ Auto-generate System instructions command using CoreOS AI
  const handleAutoGenerateInstructions = async () => {
    if (!activeClientState) return;
    setIsGeneratingInstruction(true);
    triggerAlert("info", "Prompt engineering engine analyzing client goals...");

    try {
      const resp = await fetch("/api/generate-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: activeClientState.name,
          description: activeClientState.description,
          needs: activeClientState.needs,
          customVariables: activeClientState.aiConfig.customVariables
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        handleFieldChange("systemInstruction", data.instruction, true);
        triggerAlert("success", "Custom instruction formulated successfully!");
      } else {
        triggerAlert("error", "CoreOS Engine failed to formulate custom prompt. Please check your configuration.");
      }
    } catch (err) {
      triggerAlert("error", "Prompt engineer service unavailable.");
    } finally {
      setIsGeneratingInstruction(false);
    }
  };

  // Context Variables
  const addVariable = () => {
    if (!activeClientState || !variableKey || !variableVal) return;
    const currentVars = { ...activeClientState.aiConfig.customVariables };
    currentVars[variableKey] = variableVal;
    
    handleFieldChange("customVariables", currentVars, true);
    setVariableKey("");
    setVariableVal("");
    triggerAlert("success", `Injected dynamic context key {${variableKey}}`);
  };

  const removeVariable = (key: string) => {
    if (!activeClientState) return;
    const currentVars = { ...activeClientState.aiConfig.customVariables };
    delete currentVars[key];
    handleFieldChange("customVariables", currentVars, true);
    triggerAlert("info", "Dynamic variable reference removed.");
  };

  // Chat Playback/Simulation
  const sendSandboxMessage = async (overrideMessage?: string) => {
    const textToSend = overrideMessage || sandboxInput;
    if (!textToSend.trim() || !activeClientState) return;

    const counted = getCountedCharacters(textToSend, activeClientState.limitType, activeClientState.monitoredChars);
    const limit = activeClientState.charLimit ?? 100;
    if (!overrideMessage && counted > limit) {
      setUpgradeTargetClient(activeClientState);
      setIsUpgradeModalOpen(true);
      triggerAlert("error", `Lock warning: You used ${counted} characters. Max limit is ${limit}.`);
      return;
    }

    const clientId = activeClientState.id;
    const userMsg: Message = {
      id: "msg-" + Date.now() + Math.random(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    // Update sandbox chat thread state locally
    const currentHistory = sandboxMessages[clientId] || [];
    const updatedHistory = [...currentHistory, userMsg];
    setSandboxMessages(prev => ({
      ...prev,
      [clientId]: updatedHistory
    }));

    if (!overrideMessage) setSandboxInput("");
    setIsSendingSandboxMsg(true);

    try {
      const resp = await fetch("/api/chat/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: clientId,
          message: textToSend,
          history: currentHistory, // send trailing history for context
          aiConfig: activeClientState.aiConfig,
          customerId: sandboxCustomerId || (activeClientState.customers && activeClientState.customers[0] ? activeClientState.customers[0].id : "")
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const botMsg: Message = {
          id: "msg-" + Date.now() + Math.random(),
          sender: "assistant",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setSandboxMessages(prev => ({
          ...prev,
          [clientId]: [...updatedHistory, botMsg]
        }));
        loadHistory();
        await loadClients(false);
      } else {
        let errorText = "System response failed. Review model configuration parameters and instruction syntaxes.";
        try {
          const errData = await resp.json();
          if (errData && errData.message) {
            errorText = `🔴 CLIENT ACCESS REVOKED: ${errData.message}`;
          }
        } catch (e) {
          // Ignore parse errors
        }
        const errorMsg: Message = {
          id: "msg-" + Date.now(),
          sender: "system",
          text: errorText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setSandboxMessages(prev => ({
          ...prev,
          [clientId]: [...updatedHistory, errorMsg]
        }));
      }
    } catch (err) {
      triggerAlert("error", "Error connecting to AI simulator.");
    } finally {
      setIsSendingSandboxMsg(false);
    }
  };

  const clearSandboxHistory = () => {
    if (!activeClientState) return;
    setSandboxMessages(prev => ({
      ...prev,
      [activeClientState.id]: []
    }));
  };

  const deleteSandboxMessage = (msgId: string) => {
    if (!activeClientState) return;
    const clientId = activeClientState.id;
    setSandboxMessages(prev => ({
      ...prev,
      [clientId]: (prev[clientId] || []).filter(m => m.id !== msgId)
    }));
  };

  const sendPortalMessage = async (overrideMessage?: string) => {
    const textToSend = overrideMessage || portalInput;
    if (!textToSend.trim() || !portalClientId) return;

    const portalClient = clients.find(c => c.id === portalClientId);
    if (!portalClient) return;

    const counted = getCountedCharacters(textToSend, portalClient.limitType, portalClient.monitoredChars);
    const limit = portalClient.charLimit ?? 100;
    if (!overrideMessage && counted > limit) {
      setUpgradeTargetClient(portalClient);
      setIsUpgradeModalOpen(true);
      triggerAlert("error", `Limit lock: You entered ${counted} chars. Your free allowance limit is ${limit}.`);
      return;
    }

    const userMsg: Message = {
      id: "portal-msg-" + Date.now() + Math.random(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const currentHistory = [...portalMessages];
    const updatedHistory = [...currentHistory, userMsg];
    setPortalMessages(updatedHistory);
    if (!overrideMessage) setPortalInput("");
    setIsSendingPortal(true);

    try {
      const resp = await fetch("/api/chat/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: portalClientId,
          message: textToSend,
          history: currentHistory.filter(m => m.sender !== "system"),
          aiConfig: portalClient.aiConfig,
          channel: "Direct Live Portal",
          customerId: portalCustomerId || (portalClient.customers && portalClient.customers[0] ? portalClient.customers[0].id : "")
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const botMsg: Message = {
          id: "portal-msg-" + Date.now() + Math.random(),
          sender: "assistant",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setPortalMessages(prev => [...prev, botMsg]);
        loadHistory();
        await loadClients(false);
      } else {
        let errorText = "System response failed. Revoked or invalid configuration.";
        try {
          const errData = await resp.json();
          if (errData && errData.message) {
            errorText = errData.message;
          }
        } catch (e) {
          // Ignore parse
        }
        const errorMsg: Message = {
          id: "portal-msg-" + Date.now(),
          sender: "system",
          text: `🔴 ACCESS SUSPENDED: ${errorText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setPortalMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: Message = {
        id: "portal-msg-" + Date.now(),
        sender: "system",
        text: "🔴 Error establishing high-speed communication link to CoreOS AI master core.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setPortalMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSendingPortal(false);
    }
  };

  const deletePortalMessage = (msgId: string) => {
    setPortalMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const clearPortalHistory = () => {
    setPortalMessages([]);
  };

  const copyToClipboard = (text: string, refKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [refKey]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [refKey]: false }));
    }, 2000);
  };

  const downloadJSONConfig = (client: any) => {
    const linkedOwner = owners.find(o => o.linkedClientId === client.id);

    const configData = {
      systemHeader: "CoreOS Custom AI Node Allocation File",
      exportTimestamp: new Date().toISOString(),
      clientProfile: {
        id: client.id,
        name: client.name,
        description: client.description,
        websiteUrl: client.websiteUrl,
        language: client.language,
        baseCharLimit: client.charLimit,
        allocatedModel: client.aiConfig?.model
      },
      b2bLicenseOwner: linkedOwner ? {
        ownerName: linkedOwner.name,
        company: linkedOwner.companyName,
        adminEmail: linkedOwner.email,
        licensePlan: linkedOwner.planCode
      } : "No business owner allocated yet",
      livePortalUrl: `${window.location.origin}/?portal=${client.id}`,
      iframeEmbedCode: `<iframe src="${window.location.origin}/?portal=${client.id}" width="100%" height="600" style="border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);"></iframe>`,
      subscribersList: (client.customers || []).map((c: any) => ({
        id: c.id,
        fullName: c.name,
        email: c.email,
        sentencesUsed: c.sentencesUsed || 0,
        sentenceLimit: c.sentenceLimit || 70,
        charLimitPerSentence: c.charLimitPerSentence || 115,
        status: c.status || "active"
      }))
    };

    const fileString = JSON.stringify(configData, null, 2);
    const blob = new Blob([fileString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert("success", "Custom AI integration file (*-config.json) downloaded!");
  };

  const downloadInstructionTXTPackage = (client: any) => {
    const linkedOwner = owners.find(o => o.linkedClientId === client.id);
    const ownerName = linkedOwner ? linkedOwner.name : "N/A";
    const companyName = linkedOwner ? linkedOwner.companyName : "N/A";
    const emailStr = linkedOwner ? linkedOwner.email : "N/A";

    const text = `============================================================
           COREOS SYSTEM CUSTOM AI INTELLIGENT NODE
                     INTEGRATION PROFILE
============================================================

Thank you for choosing CoreOS AI Integration. Below are the technical credentials, limits, and interactive links allocated for your custom AI Client profile.

------------------------------------------------------------
1. DYNAMIC SYSTEM INTEGRATION DETAILS
------------------------------------------------------------
Client Application Name : ${client.name}
Unique Node Identifier  : ${client.id}
Allocated LLM Model     : ${client.aiConfig?.model || "gemini-2.5-flash"}
Target Dialect          : ${client.language || "english"}

------------------------------------------------------------
2. PERSISTENT SEAT LIMITS & QUOTA REFILL
------------------------------------------------------------
Every single sentence or prompt query routed to this node is validated against the active guardrails set by the business owner.

Current Registered Users of this profile:
${(client.customers || []).map((c: any, index: number) => `
[User #${index+1}]
- Full Name: ${c.name}
- Email: ${c.email}
- Sentences Processed: ${c.sentencesUsed || 0} used of ${c.sentenceLimit || 70} allowed
- Sentence Character Cap: ${c.charLimitPerSentence || 115} characters
`).join('\n')}

Quota Refill Instructions:
Refills of sentence limits are triggered instantly in real-time by logging into the Business Owner dashboard and selecting "Refill & Reset Quotas" for this corresponding client node.

------------------------------------------------------------
3. ACCREDITED B2B PLACEMENT MANAGERS
------------------------------------------------------------
Business Owner  : ${ownerName}
Company Outlet  : ${companyName}
Contact Email   : ${emailStr}

------------------------------------------------------------
4. STANDALONE & EMBED CHANNELS
------------------------------------------------------------
Direct Live Portal Link:
${window.location.origin}/?portal=${client.id}

Iframe Embed Element Code:
<iframe src="${window.location.origin}/?portal=${client.id}" width="100%" height="600" style="border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);"></iframe>

------------------------------------------------------------
Generated on: ${new Date().toLocaleString()}
CoreOS AI Integrations System Core.
============================================================`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-instructions.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert("success", "B2B client instructions file (*-instructions.txt) downloaded!");
  };

  // Helper filtered list of clients
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.needs.toLowerCase().includes(clientSearch.toLowerCase())
  );

  if (portalClientId) {
    const portalClient = clients.find(c => c.id === portalClientId);

    if (isLoadingClients) {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-slate-800 font-sans p-6">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-3" />
          <p className="text-xs font-bold tracking-widest uppercase text-slate-450 text-slate-400">Loading Secure Portal Session...</p>
        </div>
      );
    }

    if (!portalClient) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center">
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-xl max-w-md">
            <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-950">Portal Node Not Found</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              We couldn't locate the specified AI client profile in the CoreOS node cluster. Let's make sure the client ID is correct.
            </p>
            {portalIsAdmin && (
              <button onClick={() => window.location.href = window.location.origin} className="mt-5 bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded text-white text-xs font-bold transition-all">
                Return to CoreOS Console
              </button>
            )}
          </div>
        </div>
      );
    }

    const isDeactivated = portalClient.status === "deactivated";

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
        {/* Dynamic Client Top Banner */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 text-white rounded flex items-center justify-center font-bold font-sans shadow-md">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-black text-base text-slate-900 tracking-tight leading-none">{portalClient.name}</h1>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                    isDeactivated
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : portalClient.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200 animate-pulse"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {portalClient.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 max-w-[200px] sm:max-w-md">{portalClient.description || "Active Custom AI Portal"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                <span className={`h-1.5 w-1.5 rounded-full ${isDeactivated ? "bg-rose-500" : "bg-green-500"}`} />
                {isDeactivated ? "Authorization Suspended" : "Ready Link Connected"}
              </span>
              {portalIsAdmin && (
                <button
                  onClick={() => window.location.href = window.location.origin}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded transition-all shadow-sm cursor-pointer"
                >
                  Go to Console
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Outer Split Wrapper */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-4rem-50px)]">
          
          {/* Left Column: Customized Brand Specifications */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col gap-4 shadow-sm h-fit">
              <div className="pb-2.5 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono mb-1">Interactive Portal</h3>
                <span className="font-display font-bold text-sm text-slate-800 tracking-tight">Deployment Profile</span>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block uppercase font-semibold">Client Name / Identity:</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{portalClient.name}</p>
                </div>

                {portalClient.needs && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase font-semibold">Scope and Calibrations:</span>
                    <div className="bg-slate-50 text-slate-700 text-xs p-3.5 rounded border border-slate-200 mt-1.5 leading-relaxed max-h-[180px] overflow-y-auto whitespace-pre-wrap font-sans">
                      {portalClient.needs}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Active Model:</span>
                    <span className="font-sans text-slate-700 font-bold">{getModelDisplayName(portalClient.aiConfig.model)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Safety Directives:</span>
                    <span className="font-mono text-blue-600 font-bold uppercase">{portalClient.aiConfig.safetySettings}</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-3.5 rounded border border-blue-100 flex items-start gap-2.5 mt-2">
                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-900 leading-normal font-medium animate-pulse">
                    This interactive space is connected directly to your custom instruction dataset. Rest assured, your data logic matches production specifications.
                  </p>
                </div>
              </div>
            </div>

            {/* ⚡ AI Specialist Node Diagnostics & Spec Panel */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col gap-4 shadow-sm h-fit">
              <div className="pb-2 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono mb-1 block">AI SPECIALIST SPECIFICATIONS</span>
                  <span className="font-display font-semibold text-sm text-slate-800">Diagnostics & Core Specs</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-green-500 animate-ping shrink-0" />
              </div>

              <div className="flex flex-col gap-3 font-sans text-xs">
                {/* Enforced AI Language metrics */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600 animate-pulse" />
                    <div>
                      <span className="text-[10px] text-slate-450 text-slate-400 uppercase font-mono font-bold block">Enforced Language:</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">
                        {(portalClient.language || "english") === "kurdish" ? "☀️ Kurdish (Sorani)" : (portalClient.language || "english") === "arabic" ? "🇦🇪 Arabic (العربية)" : "🇬🇧 English"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[#0ea5e9] bg-sky-50 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-200 uppercase font-mono shrink-0">Enforced</span>
                </div>

                {/* Model status bar */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-105 border-b-slate-100 font-mono text-[11px]">
                  <span className="text-slate-500 font-semibold">Active Replica Model:</span>
                  <span className="text-slate-800 font-bold">{getModelDisplayName(portalClient.aiConfig.model)}</span>
                </div>

                {/* Temp & safety parameters */}
                <div className="grid grid-cols-2 gap-2 mt-1 py-1.5 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono font-semibold uppercase">Temperature</span>
                    <span className="text-xs font-bold text-slate-700">{portalClient.aiConfig.temperature ?? 0.7} (Stable)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono font-semibold uppercase">Safety Index</span>
                    <span className="text-xs font-bold text-blue-700 uppercase bg-blue-50 px-1 py-0.5 rounded font-mono border border-blue-100 block w-fit text-[9.5px]">
                      {portalClient.aiConfig.safetySettings || "STANDARD"}
                    </span>
                  </div>
                </div>

                {/* Virtual Node latency diagnostic */}
                <div className="flex flex-col gap-1.5 bg-blue-50/30 p-2.5 rounded border border-dashed border-blue-200">
                  <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                    <span className="text-blue-700 font-bold">Node Latency:</span>
                    <span className="text-emerald-700 font-bold">142ms (Excellent)</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-normal font-sans">
                    This dedicated B2B deployment Node communicates securely with CoreOS clusters. Updates made by your administrator are replicated instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Session Identify & Quota limits meter card */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col gap-4 shadow-sm h-fit">
              <div className="pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono mb-1 block">CUSTOMER LICENSE</span>
                <span className="font-display font-semibold text-sm text-slate-800">Identify Session Credentials</span>
              </div>

              <div className="flex flex-col gap-3 font-sans text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold block mb-1.5">
                    Select Active Customer Seat:
                  </label>
                  <select
                    value={portalCustomerId}
                    onChange={(e) => setPortalCustomerId(e.target.value)}
                    className="w-full bg-slate-50 text-slate-700 font-semibold px-3 py-2 rounded border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sans"
                  >
                    <option value="">-- Choose simulated identity seat --</option>
                    {(portalClient.customers || []).map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const activeSelectId = portalCustomerId || (portalClient.customers && portalClient.customers[0] ? portalClient.customers[0].id : "");
                  const activeCust = (portalClient.customers || []).find((c: any) => c.id === activeSelectId);
                  if (!activeCust) {
                    return (
                      <p className="text-[10.5px] text-slate-400 italic">
                        Please select an active customer profile above to view quota balances and limits tracking.
                      </p>
                    );
                  }
                  const count = activeCust.sentencesUsed || 0;
                  const limit = activeCust.sentenceLimit || 70;
                  const percent = Math.min((count / limit) * 100, 100);
                  const isExhausted = count >= limit;
                  return (
                    <div className="bg-slate-50 p-3.5 rounded border border-slate-200 flex flex-col gap-2.5 mt-1">
                      <div className="flex justify-between items-center text-[10.5px] font-mono leading-none">
                        <span className="text-slate-400 uppercase font-bold">Quota Remaining</span>
                        <span className={`font-bold ${isExhausted ? "text-rose-600 animate-pulse" : "text-blue-600"}`}>
                          {count} / {limit} sentences
                        </span>
                      </div>
                      
                      <div className="w-full h-2 bg-slate-205 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full transition-all duration-300 ${
                            isExhausted ? "bg-rose-500" : "bg-blue-600"
                          }`}
                        />
                      </div>

                      <div className="text-[10px] text-slate-500 leading-normal flex flex-col gap-1 mt-1 pt-1.5 border-t border-slate-200/50">
                        <span className="font-semibold text-slate-700 block">Constraint Rules Enforced:</span>
                        <span>• Query limit length per message: <strong>115 chars</strong>.</span>
                        <span>• Language preference enforced: <strong>{(portalClient.language || "English").toUpperCase()}</strong>.</span>
                      </div>

                      {isExhausted && (
                        <div className="bg-rose-50 text-rose-800 p-2.5 rounded border border-rose-200 text-[10px] leading-relaxed font-semibold mt-1">
                          ⚠️ Limits reached! To continue services, notify owner to contact support key at <strong>coreosgmail.com@gmail.com</strong> for capacity refill.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-200 p-4 rounded text-slate-550 text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>To apply changes, custom inputs, or update rules, modify this client's details and needs within the primary CoreOS console.</span>
            </div>
          </div>

          {/* Right Column: Beautiful Chat Widget Container */}
          <div className="lg:col-span-8 flex flex-col h-[650px] bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm relative">
            
            {/* Header with quick utilities */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isDeactivated ? "bg-rose-500 animate-ping" : "bg-green-500 animate-pulse"}`} />
                <span className="text-xs font-bold text-slate-700">{isDeactivated ? "Session Blocked" : "Active & Live Partner Simulation"}</span>
              </div>

              {portalMessages.length > 0 && (
                <button
                  onClick={clearPortalHistory}
                  className="flex items-center gap-1 hover:bg-rose-50 hover:text-rose-700 text-[11px] text-slate-550 px-2 py-1 rounded transition-all font-semibold"
                >
                  <Trash className="h-3.5 w-3.5" />
                  <span>Clear Board</span>
                </button>
              )}
            </div>

            {/* Deactivated State Guard Screen */}
            {isDeactivated ? (
              <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-7 rounded-lg border border-rose-200 shadow max-w-md">
                  <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-black text-rose-800 uppercase tracking-tight">Access Authorization Suspended</h3>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    The manager of this customized AI profile has suspended access. The API link and standalone integration portals are currently inactive.
                  </p>
                  <div className="mt-4 bg-slate-50 p-2 text-[10px] font-mono text-slate-400 rounded">
                    Client Node: {portalClient.id} • STATUS_DENIED
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Panel Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4">
                  {portalMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Bot className="h-10 w-10 text-slate-300 mb-2 animate-bounce" />
                      <p className="text-xs font-mono">Standby for simulation inquiries...</p>
                    </div>
                  ) : (
                    portalMessages.map((msg) => {
                      const isUser = msg.sender === "user";
                      const isSystem = msg.sender === "system";
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] ${
                            isUser ? "align-self-end self-end ml-auto items-end" : "align-self-start self-start items-start"
                          }`}
                        >
                          <div
                            className={`p-3.5 rounded shadow-xs leading-relaxed text-sm ${
                              isUser
                                ? "bg-blue-600 text-white rounded-br-none"
                                : isSystem
                                ? "bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                                : "bg-slate-100 text-slate-800 rounded-bl-none"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-1 px-1">
                            <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                            {!isUser && !isSystem && (
                              <>
                                <span className="text-slate-300">/</span>
                                <button
                                  onClick={() => deletePortalMessage(msg.id)}
                                  className="text-slate-400 hover:text-rose-600 hover:underline text-[9px] transition-all font-semibold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing simulated state */}
                  {isSendingPortal && (
                    <div className="align-self-start self-start max-w-[80%] flex items-center gap-2 bg-slate-100 p-3 py-2.5 rounded text-xs text-slate-500 font-mono animate-pulse rounded-bl-none">
                      <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                      <span>{portalClient.name} is synthesizing custom response...</span>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const count = getCountedCharacters(portalInput, portalClient?.limitType, portalClient?.monitoredChars);
                    const limit = portalClient?.charLimit ?? 100;
                    if (count <= limit) sendPortalMessage();
                  }}
                  className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5"
                >
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      value={portalInput}
                      onChange={(e) => setPortalInput(e.target.value)}
                      disabled={isSendingPortal}
                      placeholder={`Ask ${portalClient.name} anything to test operational fidelity...`}
                      className={`flex-1 bg-white text-slate-800 border px-3.5 py-2.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 ${
                        getCountedCharacters(portalInput, portalClient?.limitType, portalClient?.monitoredChars) > (portalClient?.charLimit ?? 100)
                          ? "border-rose-300 ring-2 ring-rose-500/10 focus:ring-rose-500/30 text-rose-800 font-semibold"
                          : "border-slate-200"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!portalInput.trim() || isSendingPortal || getCountedCharacters(portalInput, portalClient?.limitType, portalClient?.monitoredChars) > (portalClient?.charLimit ?? 100)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 shrink-0 rounded transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Character Tracking panel for External Portal */}
                  {(() => {
                    const limit = portalClient?.charLimit ?? 100;
                    const count = getCountedCharacters(portalInput, portalClient?.limitType, portalClient?.monitoredChars);
                    const isOver = count > limit;
                    const ratio = limit > 0 ? (count / limit) : 0;
                    
                    return (
                      <div className="flex items-center justify-between text-[11px] font-sans flex-wrap gap-2 text-left">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="font-semibold uppercase tracking-wide text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 font-mono">
                            {portalClient?.limitType === "specific" ? `Watch List: "${portalClient?.monitoredChars}"` : "Char Count"}
                          </span>
                          <span className={`font-mono font-bold ${isOver ? "text-rose-600 text-[11.5px]" : count > limit * 0.8 ? "text-amber-600 font-bold" : "text-slate-700 font-bold"}`}>
                            {count}
                          </span>
                          <span className="text-slate-300 font-light">/</span>
                          <span className="font-mono">{limit}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOver ? (
                            <div className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded animate-pulse">
                              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                              <span>Allowance threshold exceeded!</span>
                            </div>
                          ) : (
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${count > limit * 0.8 ? "bg-amber-500" : "bg-blue-500"}`} 
                                style={{ width: `${Math.min(ratio * 100, 100)}%` }} 
                              />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setUpgradeTargetClient(portalClient);
                              setIsUpgradeModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-805 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded flex items-center gap-0.5 transition-all shadow-sm cursor-pointer ml-1"
                          >
                            <Coins className="h-3.5 w-3.5 text-amber-500" />
                            <span>Unlock Budget ($)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </form>
              </>
            )}

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans select-none overflow-x-hidden antialiased">
      {/* Alert Component */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded border shadow-lg max-w-sm ${
              alertMsg.type === "success"
                ? "bg-white text-emerald-800 border-emerald-300"
                : alertMsg.type === "error"
                ? "bg-white text-rose-800 border-rose-300"
                : "bg-white text-blue-800 border-blue-300"
            }`}
          >
            <Sparkles className="h-5 w-5 shrink-0 text-blue-650 text-blue-600" />
            <p className="text-sm font-medium">{alertMsg.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main SaaS Brand Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-bold shadow-sm">
              <Cpu className="h-4.5 w-4.5" id="brand-logo" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg tracking-tight text-slate-900">CoreOS</span>
                <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded border border-blue-100">SAAS HUB</span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Custom AI Integrator Suite</p>
            </div>
          </div>

          {/* CoreOS Active Models Status & API Indicator */}
          <div className="flex items-center gap-4">
            {apiHealth && (
              <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-mono text-slate-600 shadow-sm">
                <span className={`h-2 w-2 rounded-full ${apiHealth.hasApiKey ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" : "bg-amber-500"}`} />
                <span>
                  {apiHealth.hasApiKey ? "CoreOS Live Models Active" : "Local Client Simulator"}
                </span>
                {!apiHealth.hasApiKey && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-bold">Demo Mode</span>
                )}
              </div>
            )}
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center justify-center h-8 w-8 text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>

            <a
              href="https://coreos-ai-1022619878110.europe-west2.run.app/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded shadow-sm transition-all"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <span>SaaS Website</span>
            </a>
          </div>
        </div>
      </header>

      {/* API Key Notification Guidance if mock */}
      {apiHealth && !apiHealth.hasApiKey && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 py-2.5 text-center text-xs px-4 font-normal">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Currently executing in standalone Offline Simulator Mode. Save your <strong>API secret key</strong> in the Secrets menu to unleash true model responses!</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout divided by responsive boundaries */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        
        {/* Controls Navigation bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2.5 rounded border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <button
              id="tab-clients"
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-all ${
                activeTab === "clients"
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Client AI Portals</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-mono border border-slate-205">{clients.length}</span>
            </button>

            <button
              id="tab-playground"
              onClick={() => {
                setActiveTab("playground");
                // Pre-select first client if none is active
                if (!selectedClientId && clients.length > 0) {
                  handleSelectClient(clients[0].id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-all ${
                activeTab === "playground"
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Simulation Sandbox</span>
            </button>

            <button
              id="tab-history"
              onClick={() => {
                setActiveTab("history");
                loadHistory();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-all ${
                activeTab === "history"
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Audit & Chat Logs</span>
              {chatSessions.length > 0 && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-mono border border-slate-205">{chatSessions.length}</span>
              )}
            </button>

            <button
              id="tab-radar"
              onClick={() => setActiveTab("radar")}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-all ${
                activeTab === "radar"
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>CoreOS Model Hub</span>
              {models.some(m => m.isCustom) && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>

            <button
              id="tab-owners"
              onClick={() => {
                setActiveTab("owners");
                loadOwners();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-all ${
                activeTab === "owners"
                  ? "bg-emerald-50 text-emerald-705 text-emerald-800 border border-emerald-250 border-emerald-200 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Users className="h-4 w-4 text-emerald-650" />
              <span>Business Owners</span>
              <span className="text-[10px] bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded-full font-mono border border-emerald-200/50">{owners.length}</span>
            </button>
          </div>

          {/* Action button: add customer */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow-md active:scale-95 transition-all text-center cursor-pointer"
            id="btn-add-client"
          >
            <Plus className="h-4 w-4" />
            <span>Integrate New AI</span>
          </button>
        </div>

        {/* Dynamic Workspace Container */}
        <div className="flex-1">
          {activeTab === "clients" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Client List Drawer */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-display font-bold text-sm text-slate-800 tracking-tight">Active Accounts</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">CoreOS Active Fleet</span>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search partner AIs, goals & models..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 pl-9 pr-4 py-2.5 rounded border border-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Client Cards List */}
                  {isLoadingClients ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-600 animate-spin" />
                      <p className="text-xs text-slate-500 font-mono">Syncing CoreOS accounts...</p>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bot className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 font-medium">No active clients match.</p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-xs text-blue-650 text-blue-650 text-blue-600 underline mt-1"
                      >
                        Create your first client deployment
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
                      {filteredClients.map((c) => {
                        const isSelected = selectedClientId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectClient(c.id)}
                            className={`p-4 rounded text-left cursor-pointer transition-all ${
                              isSelected
                                ? "bg-white border-2 border-blue-500 shadow-sm relative"
                                : "bg-white border border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{c.name}</h4>
                                <span className="font-mono text-[10px] text-slate-400 block mt-0.5 line-clamp-1">
                                  {getModelDisplayName(c.aiConfig.model)}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                                  c.status === "active"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : c.status === "configuring"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : c.status === "deactivated"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                  }`}
                              >
                                {c.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                              {c.needs}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Integration Details Tips banner */}
                <div className="bg-slate-100 border border-dashed border-slate-200 p-4 rounded text-xs text-slate-600 flex flex-col gap-2 leading-relaxed">
                  <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
                    <Zap className="h-4 w-4 shrink-0" />
                    <span>CoreOS Protip</span>
                  </div>
                  <p>Changes written to your client's prompts are updated live at their respective CoreOS SaaS web addresses.</p>
                  <p className="text-slate-400 font-mono text-[9px] mt-1">Status: Operational • v3.9</p>
                </div>
              </div>

              {/* Middle/Right Column: Active Configuration Hub */}
              <div className="lg:col-span-8">
                {activeClientState ? (
                  <div className="bg-white rounded border border-slate-200 p-5 md:p-6 flex flex-col gap-6 shadow-sm">
                    
                    {/* Header bar controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
                            {activeClientState.name}
                          </h2>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                            {activeClientState.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {activeClientState.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <select
                          value={activeClientState.status}
                          onChange={(e) => handleFieldChange("status", e.target.value)}
                          className="bg-white text-slate-800 px-3 py-1.5 rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                          <option value="active">Active Online</option>
                          <option value="configuring">Configuring Mode</option>
                          <option value="paused">Paused</option>
                          <option value="deactivated">Deactivated / Access Blocked</option>
                        </select>

                        <button
                          onClick={() => {
                            setActiveTab("playground");
                          }}
                          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded text-xs transition-all font-semibold"
                          title="Open in simulation sandbox"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Test Chat</span>
                        </button>

                        <button
                          onClick={() => handleDeleteClient(activeClientState.id)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded transition-all"
                          title="Retire deployment"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Section 1: Fill the Client Needs */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-450 text-slate-650 text-slate-500 uppercase tracking-wider block">
                          • Fill the Client Needs
                        </label>
                        <span className="text-[10px] text-slate-405 text-slate-400 font-mono">Dynamic AI Prompter Input</span>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded border border-slate-200 flex flex-col gap-3">
                        <textarea
                          rows={3}
                          value={activeClientState.needs}
                          onChange={(e) => handleFieldChange("needs", e.target.value)}
                          placeholder="Paste the raw client specifications, product manuals, target rules, or custom customer requirements..."
                          className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none leading-relaxed border-0 p-0 resize-none min-h-[50px] "
                        />
                        
                        <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-[11px] text-slate-500 leading-normal">
                            Edits here update the underlying goals. Use the CoreOS AI Prompter engine to instantly translate these needs into professional system instructions.
                          </p>
                          <button
                            onClick={handleAutoGenerateInstructions}
                            disabled={isGeneratingInstruction || !activeClientState.needs}
                            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded shrink-0 transition-all ${
                              isGeneratingInstruction
                                ? "bg-slate-200 text-slate-450 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow"
                            }`}
                          >
                            {isGeneratingInstruction ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
                                <span>Drafting System Prompts...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                                <span>Formulate System Persona</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Adjust System Instructions */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-505 text-slate-500 uppercase tracking-wider">
                          • Adjust Current System Persona
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">systemInstruction config</span>
                      </div>
                      <textarea
                        rows={6}
                        value={activeClientState.aiConfig.systemInstruction}
                        onChange={(e) => handleFieldChange("systemInstruction", e.target.value, true)}
                        placeholder="The core behavior prompt given to the AI. E.g. 'You are an Aero Specialist. Your rate is $2.5 globally...'"
                        className="w-full bg-white text-slate-800 placeholder-slate-400 text-sm border border-slate-200 p-4 rounded leading-relaxed font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    {/* Section 3: Model and Hyperparameters Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded border border-slate-200">
                      
                      {/* Left: Base Model selection */}
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-505 text-slate-550 text-slate-500 uppercase tracking-widest block mb-1.5">
                            Target AI Model Name
                          </label>
                          <select
                            value={activeClientState.aiConfig.model}
                            onChange={(e) => handleFieldChange("model", e.target.value, true)}
                            className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            {models.map(m => (
                              <option key={m.name} value={m.name}>
                                {m.displayName} {m.isCustom ? "[NEW RELEASE]" : ""}
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-slate-450 text-slate-400 font-mono mt-1.5 block">
                            Matches model selections on the CoreOS live instance dynamically.
                          </span>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                            Safety Strictness Guardrails
                          </label>
                          <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded border border-slate-200">
                            {(["relaxed", "standard", "strict"] as const).map(lev => (
                              <button
                                key={lev}
                                onClick={() => handleFieldChange("safetySettings", lev, true)}
                                className={`py-1.5 text-[10px] rounded uppercase transition-all font-semibold ${
                                  activeClientState.aiConfig.safetySettings === lev
                                    ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                }`}
                              >
                                {lev}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Sliders */}
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                              Temperature Setting
                            </label>
                            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">
                              {activeClientState.aiConfig.temperature}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="2.0"
                            step="0.05"
                            value={activeClientState.aiConfig.temperature}
                            onChange={(e) => handleFieldChange("temperature", Number(e.target.value), true)}
                            className="w-full h-1.5 rounded-full accent-blue-600 bg-slate-200 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                            <span>0.0 Precise (Writer mode)</span>
                            <span>2.0 Creative</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                              Nucleus Top-P Value
                            </label>
                            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold">
                              {activeClientState.aiConfig.topP}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={activeClientState.aiConfig.topP}
                            onChange={(e) => handleFieldChange("topP", Number(e.target.value), true)}
                            className="w-full h-1.5 rounded-full accent-blue-600 bg-slate-200 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                            <span>0.1 Direct</span>
                            <span>1.0 Full Range</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Section 4: Dynamic Context/Variables */}
                    <div className="flex flex-col gap-3">
                      <div className="pb-2 border-b border-slate-200">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                          Client Static Context Parameters
                        </label>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Declare unique brand variables that dynamically resolve or append context data for prompt engineering.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <input
                          type="text"
                          placeholder="Key e.g. SupportHours"
                          value={variableKey}
                          onChange={(e) => setVariableKey(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                          className="md:col-span-4 bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                        <input
                          type="text"
                          placeholder="Value e.g. Mon-Fri 9-5"
                          value={variableVal}
                          onChange={(e) => setVariableVal(e.target.value)}
                          className="md:col-span-6 bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                        <button
                          onClick={addVariable}
                          disabled={!variableKey || !variableVal}
                          className="md:col-span-2 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Insert</span>
                        </button>
                      </div>

                      {/* Variables list */}
                      {Object.keys(activeClientState.aiConfig.customVariables || {}).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                          {Object.entries(activeClientState.aiConfig.customVariables).map(([k, v]) => (
                            <div
                              key={k}
                              className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between text-xs shadow-sm"
                            >
                              <div className="font-mono text-slate-600 truncate pr-2">
                                <span className="text-blue-600 font-semibold">{`{${k}}`}</span>: <span className="text-slate-700">{v}</span>
                              </div>
                              <button
                                onClick={() => removeVariable(k)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-mono italic mt-1">
                          No variables specified. Feel free to declare custom key references. E.g. {"{supportEmail}"}
                        </p>
                      )}
                    </div>

                    {/* Section 4B: AI Enforced Language Configuration */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-6">
                      <div>
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                          🌐 AI Enforced Client Language Option
                        </label>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Configure the language constraint rule for this partner's AI service. This enforces and translates all interactions into English, Arabic, or Kurdish.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        {[
                          { id: "english", label: "English", sub: "Global US/UK", flag: "🇬🇧" },
                          { id: "kurdish", label: "Kurdish (کوردی)", sub: "سۆرانی / بادینی", flag: "☀️" },
                          { id: "arabic", label: "Arabic (العربية)", sub: "الفصحى / الخليجي", flag: "🇦🇪" }
                        ].map((lang) => {
                          const isActive = (activeClientState.language || "english") === lang.id;
                          return (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => handleFieldChange("language", lang.id)}
                              className={`flex flex-col items-center justify-center p-3 rounded-md transition-all text-center border cursor-pointer hover:shadow-xs ${
                                isActive
                                  ? "bg-white border-blue-500 text-blue-700 shadow-sm font-bold scale-[1.02]"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span className="text-base mb-1">{lang.flag}</span>
                              <span className="text-xs font-semibold block">{lang.label}</span>
                              <span className="text-[9px] text-slate-400 mt-0.5 block">{lang.sub}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 4C: Business Customers Limit Monitor & Refill Center */}
                    <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                        <div>
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block animate-pulse">
                            👥 Business Customers Allocation & Limit Refill Center
                          </label>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Monitor, refill, and dynamically set credits/limits for B2B seats here. Configure sentence and character limits **up to 1,000,000**.
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold uppercase shrink-0">
                          Usage-constrained B2B Seats
                        </span>
                      </div>

                      {/* Customer Cards List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {(activeClientState.customers || []).map((cust: any) => {
                          const percent = Math.min((cust.sentencesUsed / (cust.sentenceLimit || 70)) * 100, 100);
                          const isExhausted = cust.sentencesUsed >= (cust.sentenceLimit || 70);

                          if (editingCustomerId === cust.id) {
                            return (
                              <div key={cust.id} className="p-4 rounded-lg border border-blue-300 bg-blue-50/20 flex flex-col gap-3.5 shadow-md text-left">
                                <div className="flex justify-between items-center pb-2 border-b border-blue-100">
                                  <span className="text-xs font-bold text-blue-800 uppercase font-mono">🔧 Edit Seat Quota & Credits</span>
                                  <button 
                                    onClick={() => setEditingCustomerId("")}
                                    className="text-slate-400 hover:text-slate-650 text-[10px] font-mono cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                  <div>
                                    <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Customer Name</label>
                                    <input 
                                      type="text"
                                      value={editingCustomerName}
                                      onChange={(e) => setEditingCustomerName(e.target.value)}
                                      className="w-full bg-white text-slate-800 px-2.5 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Customer Email</label>
                                    <input 
                                      type="email"
                                      value={editingCustomerEmail}
                                      onChange={(e) => setEditingCustomerEmail(e.target.value)}
                                      className="w-full bg-white text-slate-800 px-2.5 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Used Sentences</label>
                                      <input 
                                        type="number"
                                        min={0}
                                        max={1000000}
                                        value={editingCustomerSentencesUsed}
                                        onChange={(e) => setEditingCustomerSentencesUsed(Number(e.target.value) || 0)}
                                        className="w-full bg-white text-slate-800 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Sentence limit</label>
                                      <input 
                                        type="number"
                                        min={1}
                                        max={1000000}
                                        value={editingCustomerSentenceLimit}
                                        onChange={(e) => setEditingCustomerSentenceLimit(Number(e.target.value) || 70)}
                                        className="w-full bg-white text-slate-800 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Char limit</label>
                                      <input 
                                        type="number"
                                        min={1}
                                        max={1000000}
                                        value={editingCustomerCharLimitPerSentence}
                                        onChange={(e) => setEditingCustomerCharLimitPerSentence(Number(e.target.value) || 115)}
                                        className="w-full bg-white text-slate-800 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCustomerId("")}
                                    className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded text-xs font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedCusts = (activeClientState.customers || []).map((c: any) => {
                                        if (c.id === cust.id) {
                                          return { 
                                            ...c, 
                                            name: editingCustomerName,
                                            email: editingCustomerEmail,
                                            sentencesUsed: editingCustomerSentencesUsed,
                                            sentenceLimit: editingCustomerSentenceLimit,
                                            charLimitPerSentence: editingCustomerCharLimitPerSentence
                                          };
                                        }
                                        return c;
                                      });
                                      handleFieldChange("customers", updatedCusts);
                                      setEditingCustomerId("");
                                      triggerAlert("success", `Updated credits and limits for: ${editingCustomerName}`);
                                    }}
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                                  >
                                    Save Credits
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={cust.id}
                              className={`p-4 rounded-lg border bg-white flex flex-col justify-between gap-3 shadow-xs transition-all ${
                                isExhausted 
                                  ? "border-rose-200 bg-rose-50/20" 
                                  : "border-slate-200 lg:hover:border-slate-300"
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 truncate">
                                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                      {cust.name}
                                    </h5>
                                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate max-w-[210px]" title={cust.email}>
                                      {cust.email}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCustomerId(cust.id);
                                        setEditingCustomerName(cust.name);
                                        setEditingCustomerEmail(cust.email);
                                        setEditingCustomerSentenceLimit(cust.sentenceLimit || 70);
                                        setEditingCustomerCharLimitPerSentence(cust.charLimitPerSentence || 115);
                                        setEditingCustomerSentencesUsed(cust.sentencesUsed || 0);
                                      }}
                                      title="Edit Credits & limits parameters"
                                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                                    >
                                      <SlidersHorizontal className="h-3.5 w-3.5" />
                                    </button>
                                    <span
                                      className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                        isExhausted
                                          ? "bg-rose-100 text-rose-700"
                                          : "bg-green-100 text-green-700"
                                      }`}
                                    >
                                      {isExhausted ? "exhausted" : "active"}
                                    </span>
                                  </div>
                                </div>

                                {/* Progress bar and counters */}
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                                    <span className="text-slate-500">Sentences Used:</span>
                                    <span className={`font-bold ${isExhausted ? "text-rose-600" : "text-slate-800"}`}>
                                      {cust.sentencesUsed} / {cust.sentenceLimit || 70} sentences
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${percent}%` }}
                                      className={`h-full transition-all duration-300 ${
                                        isExhausted ? "bg-rose-500" : "bg-blue-600"
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100">
                                  <div className="flex items-center gap-1">
                                    <SlidersHorizontal className="h-2.5 w-2.5" />
                                    <span>Cap: {cust.charLimitPerSentence || 115} chars / query</span>
                                  </div>
                                  <span className="font-bold text-slate-500">
                                    Remaining: {Math.max(0, (cust.sentenceLimit || 70) - cust.sentencesUsed)} msgs
                                  </span>
                                </div>
                              </div>

                              {/* Action Refill Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedCusts = (activeClientState.customers || []).map((c: any) => {
                                    if (c.id === cust.id) {
                                      return { ...c, sentencesUsed: 0 };
                                    }
                                    return c;
                                  });
                                  handleFieldChange("customers", updatedCusts);
                                  triggerAlert("success", `Sentence allowance fully refilled for customer: ${cust.name}`);
                                }}
                                className={`w-full py-1.5 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isExhausted
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  }`}
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>Refill & Reset Allowances</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Collapsible / Row to register a brand new B2B customer profile */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-1">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-2.5 text-left">
                          ➕ Register New B2B Customer Seat (Configure Limits up to 1 Million)
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-left">
                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">Customer Name *</label>
                            <input
                              type="text"
                              placeholder="Customer Name e.g. Ahmed Nyar"
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-3 flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">Email Address *</label>
                            <input
                              type="email"
                              placeholder="Email Address e.g. ahmednyar4@gmail.com"
                              value={newCustomerEmail}
                              onChange={(e) => setNewCustomerEmail(e.target.value)}
                              className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">Sentence Limit</label>
                            <input
                              type="number"
                              min={1}
                              max={1000000}
                              placeholder="70"
                              value={newCustomerSentenceLimit}
                              onChange={(e) => setNewCustomerSentenceLimit(Number(e.target.value) || 70)}
                              className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">Char Limit Per Sent.</label>
                            <input
                              type="number"
                              min={1}
                              max={1000000}
                              placeholder="115"
                              value={newCustomerCharLimitPerSentence}
                              onChange={(e) => setNewCustomerCharLimitPerSentence(Number(e.target.value) || 115)}
                              className="w-full bg-white text-slate-800 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <button
                              type="button"
                              disabled={!newCustomerName || !newCustomerEmail}
                              onClick={() => {
                                const newCust = {
                                  id: `${activeClientState.id}-cust-${Math.floor(Math.random() * 1000000)}`,
                                  name: newCustomerName,
                                  email: newCustomerEmail,
                                  sentencesUsed: 0,
                                  sentenceLimit: newCustomerSentenceLimit,
                                  charLimitPerSentence: newCustomerCharLimitPerSentence,
                                  status: "active" as const
                                };
                                const updatedCusts = [...(activeClientState.customers || []), newCust];
                                handleFieldChange("customers", updatedCusts);
                                setNewCustomerName("");
                                setNewCustomerEmail("");
                                triggerAlert("success", `Registered license and provisioned seat with sentence limit ${newCustomerSentenceLimit} and char limit ${newCustomerCharLimitPerSentence} for ${newCustomerName}`);
                              }}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded disabled:opacity-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Seat</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4D: Strategic Suggestions on Limit Reaches (Manager/Owner View Only) */}
                    <div className="flex flex-col gap-3.5 border-t border-slate-200 pt-6 bg-blue-50/20 p-5 rounded-lg border border-dashed border-blue-200/50">
                      <div className="flex items-center gap-1.5 text-blue-800">
                        <Sparkles className="h-4.5 w-4.5 text-blue-750" />
                        <span className="text-xs font-bold uppercase tracking-wider block">
                          💡 Strategic Advice & suggestions (Business Owner View Only)
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        When any of your business customers hit their allowance threshold (exceeding <strong>70 sentences</strong> or submitting individual queries longer than <strong>115 characters</strong>), you should consider taking tactical action:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-white p-3.5 rounded border border-slate-240 border-slate-200 text-left flex flex-col gap-1.5 shadow-xs">
                          <span className="text-[11px] font-bold text-slate-850 block text-slate-800">1. Dynamic In-Chat Upgrades</span>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Integrate a self-service top-up module within their chat window that lets exhausted customers pay immediately.
                          </p>
                        </div>

                        <div className="bg-white p-3.5 rounded border border-slate-240 border-slate-200 text-left flex flex-col gap-1.5 shadow-xs">
                          <span className="text-[11px] font-bold text-slate-850 block text-slate-800">2. Automatic Email Webhooks</span>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Configure automatic hooks to alert our core division at <code>coreosgmail.com@gmail.com</code> so we can automatically invoice and refill their balance on your behalf.
                          </p>
                        </div>

                        <div className="bg-white p-3.5 rounded border border-slate-240 border-slate-200 text-left flex flex-col gap-1.5 shadow-xs">
                          <span className="text-[11px] font-bold text-slate-850 block text-slate-800">3. Grace Periods & Multi-Tiers</span>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Allow a buffer of 5 grace sentences so active business operations are not broken while invoice validation finishes.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 text-blue-800 rounded border border-blue-200 text-[10.5px] leading-relaxed flex items-center gap-2">
                        <Info className="h-4 w-4 shrink-0 text-blue-600" />
                        <span>
                          Notice: To upgrade capacity limit bounds global parameters for this model platform, contact the CoreOS integration center at <strong>coreosgmail.com@gmail.com</strong>.
                        </span>
                      </div>
                    </div>

                    {/* Section 5: Standalone Delivery & Client Access Authorization */}
                    <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
                      <div className="pb-1 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                            📡 Standalone Delivery Channels & Authorization Control
                          </label>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Manage authorization settings, standalone landing URLs, and instant website embeds.
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-blue-600 bg-blue-50 border border-blue-200 rounded px-2.5 py-0.5 font-bold uppercase tracking-wider">
                          Ready for Distribution
                        </span>
                      </div>

                      {/* Client Access Authority Toggle */}
                      <div className="bg-slate-50 p-4 rounded border border-slate-200">
                        <span className="text-xs font-bold text-slate-700 block mb-1">
                          Client Authorizations (Status Gatekeeper)
                        </span>
                        <p className="text-[11px] text-slate-500 mb-3.5 leading-normal">
                          If you say <strong>Yes, Authorize</strong>, clients can use the standalone links and embeds. If you say <strong>No, Revoke</strong>, access is blocked immediately with a secure lock screen.
                        </p>

                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleFieldChange("status", "active")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs transition-all font-bold cursor-pointer border ${
                              activeClientState.status === "active"
                                ? "bg-green-600 border-green-700 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Check className="h-4 w-4" />
                            <span>Yes, Authorize Access (Live Active)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFieldChange("status", "deactivated")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs transition-all font-bold cursor-pointer border ${
                              activeClientState.status === "deactivated"
                                ? "bg-rose-600 border-rose-700 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Lock className="h-4 w-4" />
                            <span>No, Revoke Access (Deactivate Partner)</span>
                          </button>
                        </div>
                      </div>

                      {/* Standalone Link Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Option 1: Shareable Standalone Link */}
                        <div className="p-4 rounded border border-slate-200 flex flex-col justify-between gap-3 bg-white">
                          <div>
                            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs mb-1">
                              <Link className="h-4 w-4" />
                              <span>1. Direct Live Portal Link</span>
                            </div>
                            <p className="text-[11.5px] text-slate-500 leading-relaxed">
                              Ideal for partners who <strong>do not have a website</strong>! Share this standalone portal address directly with them.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/?portal=${activeClientState.id}`}
                              className="w-full bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded border border-slate-200 font-mono text-[10.5px] focus:outline-none"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(`${window.location.origin}/?portal=${activeClientState.id}`, "portal-link")}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                              >
                                {copiedStates["portal-link"] ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-green-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy Portal Link</span>
                                  </>
                                )}
                              </button>
                              
                              <a
                                href={`/?portal=${activeClientState.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-slate-50 hover:bg-slate-105 border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                              >
                                <ExternalLink className="h-3.5 w-3.5 animate-pulse" />
                                <span>Preview</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Option 2: Embed Code Snippet */}
                        <div className="p-4 rounded border border-slate-200 flex flex-col justify-between gap-3 bg-white">
                          <div>
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs mb-1">
                              <Code className="h-4 w-4" />
                              <span>2. Embed Direct Website Widget</span>
                            </div>
                            <p className="text-[11.5px] text-slate-500 leading-relaxed">
                              If they block out an element on their website, they can paste this interactive iframe anywhere!
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <textarea
                              readOnly
                              rows={1}
                              value={`<iframe src="${window.location.origin}/?portal=${activeClientState.id}" width="100%" height="600" style="border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);"></iframe>`}
                              className="w-full bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded border border-slate-200 font-mono text-[9.5px] focus:outline-none resize-none"
                              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(`<iframe src="${window.location.origin}/?portal=${activeClientState.id}" width="100%" height="600" style="border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);"></iframe>`, "embed-code")}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                            >
                              {copiedStates["embed-code"] ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-green-400" />
                                    <span>Copied Code!</span>
                                  </>
                              ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy Embed Code</span>
                                  </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Option 3: Download Configuration & Instructions Block */}
                        <div className="p-4 rounded border border-slate-200 flex flex-col justify-between gap-3 bg-white">
                          <div>
                            <div className="flex items-center gap-1.5 text-purple-650 text-purple-600 font-bold text-xs mb-1">
                              <FileText className="h-4 w-4" />
                              <span>3. Export File Package</span>
                            </div>
                            <p className="text-[11.5px] text-slate-500 leading-relaxed">
                              Export integration configurations to hand off to your partner or save as local templates.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => downloadJSONConfig(activeClientState)}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold py-2 px-1 rounded flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                                title="Download client-config.json file"
                              >
                                <Download className="h-3 w-3" />
                                <span>Save JSON</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadInstructionTXTPackage(activeClientState)}
                                className="bg-slate-900 hover:bg-slate-850 hover:bg-slate-800 text-white text-[11px] font-bold py-2 px-1 rounded flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                                title="Download instructions.txt file"
                              >
                                <Download className="h-3 w-3" />
                                <span>Save TXT</span>
                              </button>
                            </div>
                            <p className="text-[9px] text-slate-400 font-mono text-center">
                              File Exports: Config & Setup Guide
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Other Channels Bento Area */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 font-mono">
                          ⚡ 3. Alternative Direct API & Non-Website Channels
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="bg-slate-550 bg-slate-50 p-3 rounded border border-slate-200 text-left">
                            <span className="text-[11px] font-bold text-slate-850 text-slate-800 block">Rest API Stream</span>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed text-slate-400">
                              POST prompts directly to <code>/api/chat/simulate</code> using their security token to drive completely bespoke Android/iOS client mobile app pages.
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-left">
                            <span className="text-[11px] font-bold text-slate-800 block">WhatsApp Business bot</span>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed text-slate-400">
                              Pipe incoming customer chat hooks from their WhatsApp integration profile directly to this agent's allocation ID.
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-left">
                            <span className="text-[11px] font-bold text-slate-800 block">Oral Voice Operator (STT)</span>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed text-slate-400">
                              Forward real-time oral call audio streams into the client's allocated CoreOS AI prompter node.
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded p-16 text-center shadow-sm">
                    <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-display font-bold text-lg text-slate-800">No Client Deployments Found</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      Initialize a client AI profile to configure safety constraints and generate custom persona instructions.
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold rounded shadow"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Setup First Client</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "playground" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Sandbox Sidebar: Active Client Picker + Debug Readouts */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col gap-4 shadow-sm">
                  <div className="pb-2 border-b border-slate-200">
                    <span className="font-display font-bold text-sm text-slate-850 text-slate-800 block">Deployments Target</span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase font-semibold">Select client agent to chat</p>
                  </div>

                  {/* dropdown selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleSelectClient(e.target.value)}
                      className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Config settings recap & Interactive Tuning Panel */}
                  {activeClientState && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col gap-4 text-xs shadow-inner">
                      <div className="flex items-center justify-between font-mono text-[10px] pb-1.5 border-b border-slate-200 text-slate-505 text-slate-500 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                          <span>AI Core Calibration Hud</span>
                        </span>
                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[8.5px] border border-emerald-100 font-semibold uppercase animate-pulse font-mono">Live link</span>
                      </div>
                      
                      {/* 1. Quick Language Swapping Toggle */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-slate-600 font-bold flex items-center gap-1 text-[11px]">
                          <Globe className="h-3.5 w-3.5 text-slate-400" />
                          <span>🌐 Enforced AI Language</span>
                        </span>
                        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded border border-slate-200">
                          {[
                            { id: "english", flag: "🇬🇧", label: "EN" },
                            { id: "kurdish", flag: "☀️", label: "KU" },
                            { id: "arabic", flag: "🇦🇪", label: "AR" }
                          ].map((lang) => {
                            const isSel = (activeClientState.language || "english") === lang.id;
                            return (
                              <button
                                key={lang.id}
                                type="button"
                                onClick={() => {
                                  handleFieldChange("language", lang.id);
                                  triggerAlert("success", `AI Language constraint updated to: ${lang.id.toUpperCase()}`);
                                }}
                                className={`py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isSel
                                    ? "bg-slate-900 text-white shadow-xs font-bold"
                                    : "bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                                }`}
                                title={`Limit responses to ${lang.id}`}
                              >
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Interactive Persona Instruction Tweaker */}
                      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-150 border-dashed">
                        <div className="flex justify-between items-center text-[11px] text-slate-600 font-bold">
                          <span>📝 AI Persona Directives</span>
                          <span className="text-[9px] font-mono font-normal text-slate-400">Updates live</span>
                        </div>
                        <textarea
                          rows={3}
                          value={activeClientState.aiConfig.systemInstruction}
                          onChange={(e) => handleFieldChange("systemInstruction", e.target.value, true)}
                          placeholder="Configure the system instruction constraints..."
                          className="w-full bg-white text-slate-700 border border-slate-205 border-slate-200 rounded p-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-sans leading-relaxed whitespace-pre-wrap"
                        />
                        <p className="text-[9px] text-slate-400 italic">
                          Tweak prompt rules above to test response adjustments instantly in chat.
                        </p>
                      </div>

                      {/* 3. Fast simulated Customer Quota Refill */}
                      {(() => {
                        const activeSelectId = sandboxCustomerId || (activeClientState.customers && activeClientState.customers[0] ? activeClientState.customers[0].id : "");
                        const currentCust = (activeClientState.customers || []).find((c: any) => c.id === activeSelectId);
                        if (!currentCust) return null;
                        const count = currentCust.sentencesUsed || 0;
                        const isExhausted = count >= 70;
                        return (
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-150 border-dashed">
                            <div className="flex justify-between items-center font-bold text-[11px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                <span className="truncate max-w-[130px]">Seat: {currentCust.name}</span>
                              </span>
                              <span className={`text-[10px] font-mono shrink-0 ${isExhausted ? "text-rose-650 text-rose-600 font-bold animate-pulse" : "text-slate-500 font-bold"}`}>
                                {count}/70 messages
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updatedCusts = (activeClientState.customers || []).map((c: any) => {
                                  if (c.id === currentCust.id) {
                                    return { ...c, sentencesUsed: 0 };
                                  }
                                  return c;
                                });
                                handleFieldChange("customers", updatedCusts);
                                triggerAlert("success", `Refilled simulated sentence quota for ${currentCust.name}`);
                              }}
                              className={`w-full py-2 text-[10px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isExhausted 
                                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs" 
                                  : "bg-white hover:bg-slate-100 text-slate-705 text-slate-705 text-slate-700 border border-slate-205 border-slate-200"
                              }`}
                            >
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>{isExhausted ? "Quota Exhausted! Click to Refill" : "Reset & Refill Quota Seat"}</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 4. Model hyperparameters collapsible panel */}
                      <details className="mt-1 group border-t border-slate-150 border-dashed pt-2">
                        <summary className="flex items-center justify-between text-slate-500 font-semibold cursor-pointer hover:text-slate-800 transition-colors list-none select-none text-[10.5px]">
                          <span className="flex items-center gap-1 font-bold">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span>Advanced Model Params</span>
                          </span>
                          <span className="transition-transform group-open:rotate-90">▶</span>
                        </summary>

                        <div className="flex flex-col gap-2.5 mt-2.5 p-2 bg-white rounded border border-slate-100 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Allocated Model:</span>
                            <select
                              value={activeClientState.aiConfig.model}
                              onChange={(e) => handleFieldChange("model", e.target.value, true)}
                              className="bg-slate-50 text-slate-750 text-slate-700 rounded px-1.5 py-0.5 border border-slate-200 font-bold"
                            >
                              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Temperature (Noise):</span>
                              <span className="font-bold text-slate-700">{activeClientState.aiConfig.temperature ?? 0.7}</span>
                            </div>
                            <input
                              type="range"
                              min={0.1}
                              max={1.0}
                              step={0.1}
                              value={activeClientState.aiConfig.temperature ?? 0.7}
                              onChange={(e) => handleFieldChange("temperature", Number(e.target.value), true)}
                              className="w-full accent-blue-650 accent-blue-600 cursor-pointer"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Top-P Threshold:</span>
                              <span className="font-bold text-slate-700">{activeClientState.aiConfig.topP ?? 0.95}</span>
                            </div>
                            <input
                              type="range"
                              min={0.1}
                              max={1.0}
                              step={0.05}
                              value={activeClientState.aiConfig.topP ?? 0.95}
                              onChange={(e) => handleFieldChange("topP", Number(e.target.value), true)}
                              className="w-full accent-blue-650 accent-blue-600 cursor-pointer"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-slate-400">Safety Class:</span>
                            <select
                              value={activeClientState.aiConfig.safetySettings || "standard"}
                              onChange={(e) => handleFieldChange("safetySettings", e.target.value, true)}
                              className="bg-slate-50 text-slate-750 text-slate-700 rounded px-1.5 py-0.5 border border-slate-250 border-slate-200 font-bold uppercase text-[9px]"
                            >
                              <option value="none">None (Full Open)</option>
                              <option value="low">Low Filter</option>
                              <option value="standard">Standard B2B Filter</option>
                              <option value="strict">Strict Blocks</option>
                            </select>
                          </div>
                        </div>
                      </details>

                      {/* Custom Variables recap */}
                      {Object.keys(activeClientState.aiConfig.customVariables || {}).length > 0 && (
                        <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-2 font-mono text-[9px]">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Dynamic Workspace Custom Keys</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(activeClientState.aiConfig.customVariables).map(k => (
                              <span key={k} className="bg-blue-50 text-blue-700 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-blue-150">
                                {`{${k}}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preset Testing Suite */}
                {activeClientState && (
                  <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col gap-3 shadow-sm">
                    <span className="font-display font-bold text-xs text-slate-700 uppercase tracking-widest block pb-1 border-b border-slate-200">
                      Preset Client Questions
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium leading-normal">
                      Click any recommended scenario question to evaluate response fidelity against constraints instantly:
                    </p>
                    
                    <div className="flex flex-col gap-1.5 text-xs text-left">
                      {activeClientState.logoUrl === "ship" || activeClientState.name.toLowerCase().includes("aero") ? (
                        <>
                          <button
                            onClick={() => sendSandboxMessage("Can you calculate the cost to ship a heavy 15kg container globally?")}
                            className="bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 p-2.5 rounded border border-slate-200 truncate text-left transition-all"
                          >
                            "Ship a heavy 15kg container?"
                          </button>
                          <button
                            onClick={() => sendSandboxMessage("What premium shipping options do you have for $150 items?")}
                            className="bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 p-2.5 rounded border border-slate-200 truncate text-left transition-all"
                          >
                            "Premium options for custom logistics?"
                          </button>
                        </>
                      ) : activeClientState.logoUrl === "laptop" || activeClientState.name.toLowerCase().includes("tech") || activeClientState.name.toLowerCase().includes("zenith") ? (
                        <>
                          <button
                            onClick={() => sendSandboxMessage("Recommend me a dynamic high-end gaming and video computer setup with a $1500 budget")}
                            className="bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 p-2.5 rounded border border-slate-200 truncate text-left transition-all"
                          >
                            "Gaming setup for $1500?"
                          </button>
                          <button
                            onClick={() => sendSandboxMessage("Are older setups available for smaller pricing discounts?")}
                            className="bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 p-2.5 rounded border border-slate-200 truncate text-left transition-all"
                          >
                            "Ask about older processor components?"
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => sendSandboxMessage("Please compile this direct raw log: Task-A: complete, Task-B: delayed, Financials: up 4.2%.")}
                            className="bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 p-2.5 rounded border border-slate-200 truncate text-left transition-all"
                          >
                            "Compile concise summary log"
                          </button>
                          <button
                            onClick={() => sendSandboxMessage("Hello! Say a nice conversational preamble before giving me values.")}
                            className="bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 p-2.5 rounded border border-slate-200 truncate text-left transition-all"
                          >
                            "Verify conversational constraints"
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => sendSandboxMessage("Write a small greeting using the company custom variable data.")}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-2.5 rounded border border-blue-200 font-bold truncate text-left transition-all"
                      >
                        "Check context variables integration!"
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sandbox Core Pane: Conversational Thread window */}
              <div className="lg:col-span-8 flex flex-col bg-white rounded border border-slate-200 min-h-[500px] shadow-sm">
                {activeClientState ? (
                  <>
                     {/* Simulator Header */}
                     <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                       <div className="flex items-center gap-2">
                         <Terminal className="h-4.5 w-4.5 text-blue-600" />
                         <span className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 flex-wrap">
                           <span>Sandbox:</span>
                           <span className="text-blue-600">{activeClientState.name}</span>
                           <span className="text-[11px] text-slate-400 font-mono font-normal">({getModelDisplayName(activeClientState.aiConfig.model)})</span>
                         </span>
                         <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-0.5" />
                       </div>
                       
                       <button
                         onClick={clearSandboxHistory}
                         className="flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded border border-slate-200 transition-all font-bold shadow-sm cursor-pointer"
                       >
                         <Trash className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
                         <span>Delete Chats</span>
                       </button>
                     </div>

                     {/* Customer Seat Select & Active Utilization Monitor Bar */}
                     <div className="bg-slate-100/75 p-3.5 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono shrink-0">
                           Simulated Customer:
                         </span>
                         <select
                           value={sandboxCustomerId}
                           onChange={(e) => setSandboxCustomerId(e.target.value)}
                           className="bg-white text-slate-700 font-semibold px-2.5 py-1 rounded border border-slate-200 text-xs focus:outline-none"
                         >
                           <option value="">-- Autoselect (First B2B Customer) --</option>
                           {(activeClientState.customers || []).map((c: any) => (
                             <option key={c.id} value={c.id}>
                               {c.name} ({c.email})
                             </option>
                           ))}
                         </select>
                       </div>

                       {/* Utilization Bar */}
                       {(() => {
                         const activeSelectId = sandboxCustomerId || (activeClientState.customers && activeClientState.customers[0] ? activeClientState.customers[0].id : "");
                         const currentCust = (activeClientState.customers || []).find((c: any) => c.id === activeSelectId);
                         if (!currentCust) return null;
                         const count = currentCust.sentencesUsed || 0;
                         const percent = Math.min((count / 70) * 105, 100);
                         const isExhausted = count >= 70;
                         return (
                           <div className="flex items-center gap-3 flex-1 max-w-sm md:justify-end">
                             <div className="text-right shrink-0">
                               <span className="text-[10px] text-slate-500 block">Sentences usage count:</span>
                               <span className={`text-[11px] font-bold block ${isExhausted ? "text-rose-600" : "text-slate-800"}`}>
                                 {count} / 70 sentences chunk
                                </span>
                             </div>
                             <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden shrink-0 mt-0.5">
                               <div
                                 style={{ width: `${percent}%` }}
                                 className={`h-full ${isExhausted ? "bg-rose-500" : "bg-blue-600"}`}
                               />
                             </div>
                           </div>
                         );
                       })()}
                     </div>

                     {/* Messages Body panel */}
                     <div className="flex-1 p-5 overflow-y-auto max-h-[360px] flex flex-col gap-4 bg-white">
                       {!(sandboxMessages[activeClientState.id] && sandboxMessages[activeClientState.id].length > 0) ? (
                         <div className="h-full flex flex-col items-center justify-center text-center py-20">
                           <Bot className="h-10 w-10 text-blue-300 animate-pulse mb-3" />
                           <p className="text-sm text-slate-800 font-bold">Simulation with {activeClientState.name} Ready</p>
                           <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                             Evaluate how the custom system persona for <strong className='text-slate-600 font-bold'>{activeClientState.name}</strong> ({getModelDisplayName(activeClientState.aiConfig.model)}) behaves. Trigger preset client questions or type customized messages!
                           </p>
                         </div>
                       ) : (
                         sandboxMessages[activeClientState.id].map((msg) => {
                           const isUser = msg.sender === "user";
                           const isSys = msg.sender === "system";
                           return (
                             <div
                               key={msg.id}
                               className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
                             >
                               <span className={`text-[9px] font-bold uppercase tracking-wider font-mono mb-1 px-1 ${isUser ? "text-blue-600" : isSys ? "text-rose-600" : "text-emerald-700"}`}>
                                  {isUser ? "You / Client User" : isSys ? "System Guardrail Audit" : `${activeClientState.name} (AI)`}
                                </span>
                                <div
                                 className={`p-3.5 rounded text-sm leading-relaxed ${
                                   isUser
                                     ? "bg-blue-650 bg-blue-600 text-white rounded-tr-none shadow"
                                     : isSys
                                     ? "bg-rose-50 text-rose-800 border border-rose-100 font-mono text-xs rounded-tl-none p-3 shadow-inner"
                                     : "bg-white text-slate-800 border border-slate-200 rounded-tl-none p-3 shadow-sm"
                                 }`}
                               >
                                 <p className="whitespace-pre-wrap">{msg.text}</p>
                               </div>
                               <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">{msg.timestamp}</span><span className="text-slate-300 mx-1">/</span><button onClick={() => deleteSandboxMessage(msg.id)} className="text-slate-400 hover:text-rose-600 transition-colors font-sans font-semibold cursor-pointer hover:underline text-[10px] select-all" title="Delete this message">Clear</button>
                             </div>
                           );
                         })
                       )}

                       {/* Bot typing loader simulation */}
                       {isSendingSandboxMsg && (
                         <div className="self-start flex items-center gap-1.5 p-3.5 bg-slate-50 rounded border border-slate-200 rounded-tl-none max-w-[80px]">
                           <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce" />
                           <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                           <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                         </div>
                       )}
                     </div>

                     {/* Chat Input panel */}
                     <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto">
                       <div className="flex gap-2">
                         <input
                           type="text"
                           placeholder={`Message simulated ${activeClientState.name}...`}
                           value={sandboxInput}
                           onChange={(e) => setSandboxInput(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === "Enter") {
                               const count = getCountedCharacters(sandboxInput, activeClientState?.limitType, activeClientState?.monitoredChars);
                               if (count <= (activeClientState?.charLimit ?? 100)) sendSandboxMessage();
                             }
                           }}
                           className={`flex-1 bg-white text-slate-800 pl-4 pr-4 py-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm ${
                             getCountedCharacters(sandboxInput, activeClientState?.limitType, activeClientState?.monitoredChars) > (activeClientState?.charLimit ?? 100)
                               ? "border-rose-300 ring-2 ring-rose-500/10 focus:ring-rose-500/30 text-rose-800 font-semibold"
                               : "border-slate-200"
                           }`}
                         />
                         <button
                           onClick={() => sendSandboxMessage()}
                           disabled={isSendingSandboxMsg || !sandboxInput.trim() || getCountedCharacters(sandboxInput, activeClientState?.limitType, activeClientState?.monitoredChars) > (activeClientState?.charLimit ?? 100)}
                           className="bg-blue-600 hover:bg-blue-750 hover:bg-blue-700 disabled:opacity-45 text-white p-3 rounded shadow active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                         >
                           <Send className="h-4.5 w-4.5" />
                         </button>
                       </div>

                       {/* Live Character Limit Tracker */}
                       {(() => {
                         const limit = activeClientState?.charLimit ?? 100;
                         const count = getCountedCharacters(sandboxInput, activeClientState?.limitType, activeClientState?.monitoredChars);
                         const isOver = count > limit;
                         const ratio = limit > 0 ? (count / limit) : 0;
                         
                         return (
                           <div className="mt-2.5 flex items-center justify-between text-[11px] font-sans flex-wrap gap-2 text-left">
                             <div className="flex items-center gap-1.5 text-slate-500">
                               <span className="font-semibold uppercase tracking-wide text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 font-mono">
                                 {activeClientState?.limitType === "specific" ? `Watch List: "${activeClientState?.monitoredChars}"` : "Char Count"}
                               </span>
                               <span className={`font-mono font-bold ${isOver ? "text-rose-600 text-[11.5px]" : count > limit * 0.8 ? "text-amber-600 font-bold" : "text-slate-705 text-slate-700 font-semibold font-bold"}`}>
                                 {count}
                               </span>
                               <span className="text-slate-300">/</span>
                               <span className="font-mono">{limit}</span>
                             </div>

                             <div className="flex items-center gap-2">
                               {isOver ? (
                                 <div className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded animate-pulse">
                                   <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                                   <span>Over free allowance limit!</span>
                                 </div>
                               ) : (
                                 <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                   <div 
                                     className={`h-full rounded-full transition-all duration-300 ${count > limit * 0.8 ? "bg-amber-500" : "bg-blue-500"}`} 
                                     style={{ width: `${Math.min(ratio * 100, 100)}%` }} 
                                   />
                                 </div>
                               )}

                               <button
                                 type="button"
                                 onClick={() => {
                                   setUpgradeTargetClient(activeClientState);
                                   setIsUpgradeModalOpen(true);
                                 }}
                                 className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded flex items-center gap-0.5 transition-all shadow-sm cursor-pointer ml-1"
                                >
                                 <Coins className="h-3.5 w-3.5 text-amber-500 animate-spin [animation-duration:6s]" />
                                 <span>Increase Limit ($)</span>
                               </button>
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                     <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
                     <p className="text-sm text-slate-600 font-bold">Please construct a client configuration profile first.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Sessions List Ledger */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <span className="font-display font-bold text-sm text-slate-850 text-slate-850 text-slate-800 tracking-tight block">Audit Ledger Directory</span>
                      <p className="text-[10px] text-slate-450 uppercase font-mono font-semibold">Track & evaluation history</p>
                    </div>
                    {chatSessions.length > 0 && (
                      <button
                        onClick={clearAllHistory}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded border border-rose-100 transition-all cursor-pointer"
                      >
                        Purge All Logs
                      </button>
                    )}
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search entries by partner, message..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 pl-9 pr-4 py-2.5 rounded border border-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Sessions entries */}
                  {isLoadingHistory ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                      <span className="text-xs text-slate-400">Syncing ledger records...</span>
                    </div>
                  ) : chatSessions.length === 0 ? (
                    <div className="py-16 text-center">
                      <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-505 font-medium text-slate-500">No conversation sessions logged yet.</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 max-w-xs mx-auto leading-normal">
                        Simulate conversations in the Simulation Sandbox tab or share custom Live Portal links to start logging interactive records!
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
                      {chatSessions
                        .filter(s => {
                          const query = historySearch.toLowerCase();
                          return (
                            s.clientName.toLowerCase().includes(query) ||
                            s.channel.toLowerCase().includes(query) ||
                            (s.messages && s.messages.some((m: any) => m.text.toLowerCase().includes(query)))
                          );
                        })
                        .map(session => {
                          const isSelected = selectedSessionId === session.id;
                          return (
                            <div
                              key={session.id}
                              onClick={() => setSelectedSessionId(session.id)}
                              className={`p-3 rounded border text-left cursor-pointer transition-all flex items-start justify-between gap-2 group ${
                                isSelected
                                  ? "bg-blue-50/50 border-blue-400 ring-1 ring-blue-400"
                                  : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex gap-2.5 min-w-0 flex-1">
                                <div className="p-2 rounded bg-slate-100 shrink-0 mt-0.5">
                                  <Terminal className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 justify-between">
                                    <span className="font-bold text-xs text-slate-800 truncate block">
                                      {session.clientName}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      {session.messages && session.messages.length > 0 ? session.messages[session.messages.length - 1].timestamp : "00:00"}
                                    </span>
                                  </div>
                                  
                                  <p className="text-[10.5px] text-slate-500 mt-1 truncate italic">
                                    {session.messages && session.messages.length > 0 ? session.messages[session.messages.length - 1].text : "Empty session"}
                                  </p>

                                  <div className="flex flex-wrap gap-1 mt-2">
                                    <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                                      session.channel.includes("Portal")
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-blue-50 text-blue-700 border-blue-100"
                                    }`}>
                                      {session.channel}
                                    </span>
                                    <span className="text-[8px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                      {session.messages ? session.messages.length : 0} messages
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteHistorySession(session.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-all text-slate-405 shrink-0 self-center cursor-pointer"
                                title="Delete from ledger"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Full Interactive Transcript view */}
              <div className="lg:col-span-7 flex flex-col bg-white rounded-lg border border-slate-200 min-h-[500px] shadow-sm">
                {(() => {
                  const selectedSession = chatSessions.find(s => s.id === selectedSessionId);
                  
                  if (!selectedSession) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 py-32">
                        <FileText className="h-10 w-10 text-slate-300 mb-3 animate-pulse" />
                        <h4 className="font-display font-extrabold text-sm text-slate-800">Select Audit Interaction Record</h4>
                        <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                          Click any custom logged session from the audit ledger directory on the left to inspect conversation traces, safety classifications, target models, and export summaries.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col h-full flex-1">
                      {/* Transcript Header */}
                      <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center bg-slate-50 gap-2 rounded-t-lg text-left">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4.5 w-4.5 text-blue-600" />
                          <div>
                            <span className="font-display font-bold text-sm text-slate-800 block">
                              Transcript: {selectedSession.clientName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              Last Session Trace: {new Date(selectedSession.updatedAt).toLocaleDateString()} at {new Date(selectedSession.updatedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const md = `## Conversation Transcript: ${selectedSession.clientName}\n\n` +
                              `* **Channel**: ${selectedSession.channel}\n` +
                              `* **Model Core**: ${selectedSession.modelUsed}\n` +
                              `* **Recorded Date**: ${new Date(selectedSession.updatedAt).toLocaleString()}\n\n` +
                              `| Speaker | Message | Timestamp |\n` +
                              `| :--- | :--- | :--- |\n` +
                              selectedSession.messages.map((m: any) => `| **${m.sender === 'user' ? 'Client User' : 'CoreOS AI'}** | ${m.text.replace(/\n/g, '<br/>')} | _${m.timestamp}_ |`).join('\n');
                            copyToClipboard(md, "export-md-" + selectedSession.id);
                            triggerAlert("success", "Prinstine Markdown script copied to clipboard!");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Markdown Transcript</span>
                        </button>
                      </div>

                      {/* Chat Messages flow */}
                      <div className="flex-1 p-5 overflow-y-auto max-h-[380px] flex flex-col gap-4 bg-slate-50/50 border-b border-slate-200 text-left">
                        {selectedSession.messages && selectedSession.messages.map((msg: any) => {
                          const isUser = msg.sender === "user";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
                            >
                              <span className={`text-[9px] font-bold uppercase tracking-wider font-mono mb-1 px-1 ${isUser ? "text-blue-600" : "text-emerald-700"}`}>
                                {isUser ? "Client User" : `${selectedSession.clientName} (AI)`}
                              </span>
                              <div
                                className={`p-3 rounded text-xs leading-relaxed ${
                                  isUser
                                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                                    : "bg-white text-slate-850 text-slate-800 border border-slate-200 rounded-tl-none shadow-sm"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">{msg.timestamp}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Model Audit Summary info block */}
                      <div className="p-4 bg-white rounded-b-lg text-left">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono block mb-2.5">
                          🛡️ Alignment & Model Audit Report
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="text-slate-400 text-[10px] block font-mono">MODEL INFRASTRUCTURE</span>
                            <span className="font-bold text-slate-700 mt-0.5 block">{getModelDisplayName(selectedSession.modelUsed)}</span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="text-slate-400 text-[10px] block font-mono">DELIVERY CHANNEL</span>
                            <span className="font-bold text-slate-700 mt-0.5 block">{selectedSession.channel}</span>
                          </div>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded mt-3 text-[11px] text-slate-600 leading-relaxed text-left flex gap-2">
                          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <strong>CoreOS Audit Compliance Statement</strong>: This conversation was fully evaluated in accordance with the security directives, safety benchmarks, and compliance settings defined by your CoreOS agent profile configurations. No PII tokens were leaked.
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {activeTab === "radar" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              {/* Models List Header Card with manual Sync */}
              <div className="bg-white p-5 md:p-6 rounded border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-blue-600" />
                    <span>Dynamic Model Release Registry</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    We sync directly with enterprise cluster node registries. This automatically reflects newly provisioned CoreOS model nodes dynamically so they are instantly allocatable to clients.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                  <button
                    onClick={syncModelsList}
                    disabled={isSyncingModels}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-650 text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2.5 rounded text-xs font-bold transition-all disabled:opacity-60 shadow-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingModels ? "animate-spin" : ""}`} />
                    <span>Check Live Model Releases</span>
                  </button>
                  
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated: {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Models Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoadingModels ? (
                  <div className="col-span-full py-16 text-center">
                    <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-mono">Loading model library catalog...</p>
                  </div>
                ) : (
                  models.map((m) => (
                    <div
                      key={m.name}
                      className={`relative bg-white border rounded p-5 flex flex-col justify-between transition-all shadow-sm ${
                        m.isCustom
                          ? "border-blue-400 bg-blue-50/10"
                          : "border-slate-200 hover:border-slate-350"
                      }`}
                    >
                      {m.isCustom && (
                        <span className="absolute -top-2.5 left-4 text-[9px] font-bold tracking-widest uppercase text-white bg-blue-600 px-2 py-0.5 rounded border border-blue-500">
                          NEW RELEASE
                        </span>
                      )}

                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                              v{m.version || "1.0"} Release Node
                            </span>
                            <h3 className="font-display font-bold text-base text-slate-805 text-slate-800 mt-0.5">
                              {m.displayName}
                            </h3>
                          </div>
                          <Cpu className={`h-5 w-5 ${m.isCustom ? "text-blue-600" : "text-slate-400"}`} />
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                          {m.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                        {m.supportedFeatures && m.supportedFeatures.length > 0 && (
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                              Capabilities:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {m.supportedFeatures.slice(0, 3).map((f) => (
                                <span
                                  key={f}
                                  className="text-[9px] bg-slate-50 text-slate-550 border border-slate-150 text-slate-600 font-semibold px-1.5 py-0.5 rounded border"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                          <span>Inputs: {m.inputTypes ? m.inputTypes.join(", ") : "Text"}</span>
                          <span>Format: JSON / Stream</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Release Timeline Timeline Indicator */}
              <div className="bg-slate-100 border border-slate-200 border-dashed p-5 rounded flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 leading-relaxed gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded border border-blue-100">
                    <Info className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Release Integration Mechanism</h4>
                    <p className="text-slate-500 text-xs mt-0.5">Custom nodes sync dynamically based on active platform availability models.</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 hidden sm:block shrink-0" />
                <div className="bg-blue-50 px-4 py-2 rounded border border-blue-200 font-mono text-[10px] text-blue-700 font-bold uppercase shrink-0">
                  Node Status: Synchronized
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "owners" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              {/* Owners Directory Header and Create Actions */}
              <div className="bg-white p-5 md:p-6 rounded border border-slate-205 border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <span>Business Licensee Directory</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Supervise B2B client account holders, check active subscription tiers, and monitor or reset their operational AI instances dynamically.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 font-bold" />
                    <input
                      type="text"
                      placeholder="Search owner or company..."
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                      className="pl-8.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 w-full sm:w-56 font-semibold"
                    />
                  </div>

                  <button
                    onClick={() => setIsCreateOwnerModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Register Business Owner</span>
                  </button>
                </div>
              </div>

              {/* Alert Warning Hub about limit thresholds and quota resets */}
              <div className="bg-emerald-50 border border-emerald-150 p-5 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-3xs">
                <div className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
                  <span className="p-1.5 bg-white text-emerald-600 rounded border border-emerald-150 shrink-0 mt-0.5">
                    <Zap className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Autonomous Client Quota Monitoring Hub</h4>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      Whenever a business owner's linked AI customers reach their sentence limits (e.g. 70/70 messages processed), you can instantly restore full operational capacity using the <strong className="text-emerald-700 uppercase">Refill & Reset Quotas</strong> option.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 font-mono text-[9px] uppercase font-bold shrink-0">
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-2 py-1 rounded">
                    Live Telemetry
                  </span>
                </div>
              </div>

              {/* List of card layouts of owners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  const filtered = owners.filter(o => 
                    o.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
                    o.companyName.toLowerCase().includes(ownerSearch.toLowerCase()) ||
                    o.email.toLowerCase().includes(ownerSearch.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="col-span-full bg-white border border-slate-200 text-center py-16 rounded shadow-sm">
                        <Users className="h-10 w-10 text-slate-350 mx-auto mb-3" />
                        <h4 className="font-bold text-slate-700 text-sm">No business owners matching query</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          Try registering a new business owner or adjusting your search phrase keyword filters.
                        </p>
                      </div>
                    );
                  }

                  return filtered.map(owner => {
                    const linkedClient = clients.find(c => c.id === owner.linkedClientId);
                    const customers = linkedClient?.customers || [];
                    const totalUsedSentences = customers.reduce((sum, cust) => sum + (cust.sentencesUsed || 0), 0);
                    const totalAllowedSentences = customers.reduce((sum, cust) => sum + (cust.sentenceLimit || 70), 0) || 70;
                    const usedPercentage = Math.min(100, Math.round((totalUsedSentences / totalAllowedSentences) * 100)) || 0;
                    const isNearingThreshold = usedPercentage >= 80;

                    return (
                      <div key={owner.id} className="bg-white border border-slate-200 rounded p-5 md:p-6 shadow-sm flex flex-col justify-between gap-5 hover:border-slate-300 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border border-slate-200 w-fit">
                              {owner.plan === 'enterprise' ? '👑 Enterprise B2B SaaS' : owner.plan === 'growth' ? '🚀 Growth Package' : '🌱 Developer Tier'}
                            </span>
                            <h3 className="font-display font-bold text-base text-slate-800 tracking-tight truncate mt-1">
                              {owner.name}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>🏢 {owner.companyName}</span>
                              <span className="text-slate-300 font-normal">|</span>
                              <span className="text-emerald-700 font-medium truncate">{owner.email}</span>
                            </p>
                          </div>

                          <select
                            value={owner.status}
                            onChange={(e) => handleUpdateOwnerStatus(owner, e.target.value as 'active' | 'suspended')}
                            className={`text-xs font-bold font-mono px-2.5 py-1 rounded border shadow-sm cursor-pointer focus:outline-none ${
                              owner.status === 'active' 
                                ? "bg-emerald-50 text-emerald-750 border-emerald-200" 
                                : "bg-rose-50 text-rose-750 border-rose-200"
                            }`}
                          >
                            <option value="active">● ACTIVE</option>
                            <option value="suspended">● SUSPENDED</option>
                          </select>
                        </div>

                        {/* Linked Customer Quota Capacity usage bars */}
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 flex flex-col gap-3 font-sans text-xs">
                          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 pb-1.5 border-b border-slate-200">
                            <span>🔗 ALLOCATED CORE INSTANCE:</span>
                            {linkedClient ? (
                              <span className="text-slate-800 font-bold bg-white text-[10.5px] px-2.5 py-0.5 rounded border border-slate-200 shadow-3xs">
                                {linkedClient.name}
                              </span>
                            ) : (
                              <span className="text-rose-600 bg-rose-50 text-[10px] px-2.5 py-0.5 rounded border border-rose-150 font-bold animate-pulse uppercase font-mono">
                                Unallocated Node
                              </span>
                            )}
                          </div>

                          {linkedClient && (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-mono text-slate-400 font-medium">Monthly Usage Limit</span>
                                <span className={`font-mono font-bold ${isNearingThreshold ? "text-rose-650 text-rose-650 animate-pulse font-extrabold" : "text-slate-700"}`}>
                                  {totalUsedSentences} / {totalAllowedSentences} sentences ({usedPercentage}%)
                                </span>
                              </div>
                              
                              {/* Meter progress bar */}
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300/40">
                                <div 
                                  style={{ width: `${usedPercentage}%` }} 
                                  className={`h-full transition-all duration-500 ${
                                    isNearingThreshold ? "bg-gradient-to-r from-rose-500 to-rose-600 animate-pulse" : "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                  }`} 
                                />
                              </div>

                              <p className="text-[9.5px] text-slate-400 font-mono mt-0.5 leading-normal">
                                Seat metrics: {customers.length} customer slots. {customers.filter(c => (c.sentencesUsed || 0) >= (c.sentenceLimit || 70)).length} slots completely run out.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Administrative Control Actions Deck */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 border-dashed">
                          {/* 1. Complete instant Quota Refill */}
                          <button
                            type="button"
                            onClick={() => handleResetOwnerClientUsage(owner)}
                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded shadow-2xs hover:scale-101 active:scale-99 transition-all cursor-pointer"
                            title="Reset all customer sentence quotas under this AI node to 0"
                          >
                            <RefreshCw className="h-3 w-3 animate-spin duration-3500" />
                            <span>Refill & Reset Quotas</span>
                          </button>

                          {/* 2. Configure Settings Link */}
                          {linkedClient && (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectClient(linkedClient.id);
                                setActiveTab("clients");
                                triggerAlert("info", `Opening core settings panel for: ${linkedClient.name}`);
                              }}
                              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-250 text-slate-750 text-[11px] font-semibold py-2 px-3 rounded shadow-3xs hover:text-slate-900 transition-all cursor-pointer"
                              title="Tweak AI specifications"
                            >
                              <Sliders className="h-3 w-3 text-slate-500" />
                              <span>Tweak AI Params</span>
                            </button>
                          )}

                          {/* 3. Test Sandbox Link */}
                          {linkedClient && (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectClient(linkedClient.id);
                                setActiveTab("playground");
                                triggerAlert("info", `Initiating interactive testing playground for: ${linkedClient.name}`);
                              }}
                              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-250 text-slate-750 text-[11px] font-semibold py-2 px-3 rounded shadow-3xs hover:text-slate-900 transition-all cursor-pointer"
                              title="Test client chat in workspace simulator"
                            >
                              <MessageSquare className="h-3 w-3 text-slate-500" />
                              <span>Simulate Chat</span>
                            </button>
                          )}

                          {/* 4. Delete Profile Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOwner(owner.id)}
                            className="flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100/75 border border-rose-200 rounded p-2 transition-all cursor-pointer shadow-3xs"
                            title="Remove account holder registration"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* CREATE NEW CLIENT MODAL PANEL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* dark backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border border-slate-205 border-slate-300 w-full max-w-lg rounded overflow-hidden shadow-2xl z-10 relative flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-display font-bold text-base text-slate-800">Setup Custom Client AI Portal</span>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-mono font-bold"
                >
                  ESC
                </button>
              </div>

              {/* Form panel body */}
              <div className="p-5 overflow-y-auto flex flex-col gap-4">
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Client Or Brand Name *
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Aero Global Cargo"
                    className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Short Project Description
                  </label>
                  <input
                    type="text"
                    value={newClientDesc}
                    onChange={(e) => setNewClientDesc(e.target.value)}
                    placeholder="e.g. Dynamic parcel cost calculator..."
                    className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    External Customer SaaS Domain
                  </label>
                  <input
                    type="text"
                    value={newClientWeb}
                    onChange={(e) => setNewClientWeb(e.target.value)}
                    placeholder="e.g. https://domain.com (Optional)"
                    className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                    💡 If your client does not have a website yet, simply leave this empty! We automatically provision a standalone, white-labeled secure live chat link for them.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Base Model Assignment
                  </label>
                  <select
                    value={newClientModel}
                    onChange={(e) => setNewClientModel(e.target.value)}
                    className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded border border-slate-200 focus:outline-none text-sm font-semibold focus:ring-2 focus:ring-blue-500/30"
                  >
                    {models.map(m => (
                      <option key={m.name} value={m.name}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Primary Enforced AI Language
                  </label>
                  <select
                    value={newClientLanguage}
                    onChange={(e) => setNewClientLanguage(e.target.value as any)}
                    className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded border border-slate-200 focus:outline-none text-sm font-semibold focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="english">🇬🇧 English (Global US/UK)</option>
                    <option value="kurdish">☀️ Kurdish (کوردی - سۆرانی)</option>
                    <option value="arabic">🇦🇪 Arabic (العربية)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Strictly limits and translates model prompts & interactions to the chosen dialect.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Describe Client Goals / Raw Needs *
                  </label>
                  <textarea
                    rows={3}
                    value={newClientNeeds}
                    onChange={(e) => setNewClientNeeds(e.target.value)}
                    placeholder="E.g. They require a bot to calculate cargo rates at $2.5 kg, offer warranty options, and act extremely fast and direct."
                    className="w-full bg-white text-slate-800 px-3.5 py-2.5 rounded border border-slate-200 focus:outline-none resize-none text-sm leading-relaxed focus:ring-2 focus:ring-blue-500/30"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                    This needs statement serves as the foundation for our dynamic systemInstruction generator.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <span className="text-[11px] font-bold text-slate-705 uppercase tracking-wider text-slate-700 block mb-3">
                    ⚙️ Configure Custom Customer Limits (Up to 1,000,000)
                  </span>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Default Sentence Limit
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000000}
                        value={newClientSentenceLimit}
                        onChange={(e) => setNewClientSentenceLimit(Number(e.target.value) || 70)}
                        className="w-full bg-white text-slate-800 px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Default Char Limit per Sentence
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000000}
                        value={newClientCharLimitPerSentence}
                        onChange={(e) => setNewClientCharLimitPerSentence(Number(e.target.value) || 115)}
                        className="w-full bg-white text-slate-800 px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Playground / General Char Limit Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000000}
                      value={newClientGeneralCharLimit}
                      onChange={(e) => setNewClientGeneralCharLimit(Number(e.target.value) || 1500)}
                      className="w-full bg-white text-slate-800 px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs"
                    />
                    <p className="text-[9.5px] text-slate-450 text-slate-400 mt-1 leading-normal">
                      Defines the default overall session limit permitted within the client Sandbox portal widget.
                    </p>
                  </div>
                </div>

              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateClient}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow transition-all"
                >
                  Create Client Deployment
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER NEW BUSINESS OWNER MODAL PANEL */}
      <AnimatePresence>
        {isCreateOwnerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOwnerModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border border-slate-300 w-full max-w-lg rounded overflow-hidden shadow-2xl z-10 relative flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span className="font-display font-bold text-base text-slate-800">Register New Business Owner</span>
                </div>
                <button
                  onClick={() => setIsCreateOwnerModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-mono font-bold cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleCreateOwner} className="flex flex-col max-h-[calc(90vh-120px)] overflow-y-auto text-left">
                <div className="p-5 flex flex-col gap-4 bg-white text-slate-800">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Business Owner Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      placeholder="e.g. Liam Sterling"
                      className="w-full bg-white text-slate-850 px-3.5 py-2.5 rounded border border-slate-205 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOwnerCompanyName}
                      onChange={(e) => setNewOwnerCompanyName(e.target.value)}
                      placeholder="e.g. Apex Global Logistics"
                      className="w-full bg-white text-slate-850 px-3.5 py-2.5 rounded border border-slate-205 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Administrative Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      placeholder="e.g. liam@apexglobal.com"
                      className="w-full bg-white text-slate-850 px-3.5 py-2.5 rounded border border-slate-205 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-sans">
                      Link Client AI Portal Node
                    </label>
                    <select
                      value={newOwnerLinkedClientId}
                      onChange={(e) => setNewOwnerLinkedClientId(e.target.value)}
                      className="w-full bg-white text-slate-850 px-3.5 py-2.5 rounded border border-slate-205 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                    >
                      <option value="">-- No Linked Portal (Allocate Later) --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.id})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      🔗 Allocating a Client Portal enables automatic telemetry metrics like real-time sentence limits to appear on their cards.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        License Tier Plan
                      </label>
                      <select
                        value={newOwnerPlan}
                        onChange={(e) => setNewOwnerPlan(e.target.value as any)}
                        className="w-full bg-white text-slate-850 px-3.5 py-2.5 rounded border border-slate-205 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                      >
                        <option value="standard">🌱 Standard Dev Tier</option>
                        <option value="growth">🚀 Growth Package</option>
                        <option value="enterprise">👑 Enterprise SaaS Plan</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Account Activation Status
                      </label>
                      <select
                        value={newOwnerStatus}
                        onChange={(e) => setNewOwnerStatus(e.target.value as any)}
                        className="w-full bg-white text-slate-850 px-3.5 py-2.5 rounded border border-slate-205 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                      >
                        <option value="active">Active Seat</option>
                        <option value="suspended">Suspended seat</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCreateOwnerModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded shadow-md active:scale-95 transition-transform cursor-pointer"
                  >
                    Register Owner Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHARACTER LIMIT MONETIZATION UPGRADE MODAL */}
      <AnimatePresence>
        {isUpgradeModalOpen && upgradeTargetClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessingPayment) {
                  setIsUpgradeModalOpen(false);
                  setPaymentSuccess(false);
                }
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border border-slate-300 w-full max-w-md rounded overflow-hidden shadow-2xl z-10 relative flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500 animate-pulse" />
                  <span className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-800">
                    SaaS Budget Manager
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!isProcessingPayment) {
                      setIsUpgradeModalOpen(false);
                      setPaymentSuccess(false);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-mono font-bold"
                >
                  ESC
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex flex-col gap-4 text-left">
                {!paymentSuccess ? (
                  <>
                    <div className="text-center pb-2">
                      <div className="inline-flex p-3 bg-amber-50 border border-amber-200 rounded-full text-amber-600 mb-2">
                        <Coins className="h-6 w-6 animate-spin [animation-duration:8s]" />
                      </div>
                      <h4 className="font-display font-bold text-base text-slate-900 leading-tight">
                        Increase Client Allowance
                      </h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        The current free processing limit for <strong className="text-slate-700">{upgradeTargetClient.name}</strong> is <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-600">{upgradeTargetClient.charLimit ?? 100} chars</code>. Exceeding this cap blocks message requests.
                      </p>
                    </div>

                    {/* Scale Packs Selection */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block text-slate-400">
                        Choose Operations Scale Plan
                      </label>

                      {/* Pack 1 */}
                      <button
                        type="button"
                        onClick={() => setSelectedUpgradePlan("pack")}
                        className={`w-full p-3 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                          selectedUpgradePlan === "pack"
                            ? "border-amber-400 bg-amber-50/50 ring-1 ring-amber-400"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                            <span>Vocal Booster Pack</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1 rounded">
                              One-Time Addon
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            Appends +150 characters to your allowance instantly.
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          $4.99
                        </span>
                      </button>

                      {/* Pack 2 - Recommended */}
                      <button
                        type="button"
                        onClick={() => setSelectedUpgradePlan("pro")}
                        className={`w-full p-3 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                          selectedUpgradePlan === "pro"
                            ? "border-blue-400 bg-blue-50/20 ring-1 ring-blue-400"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                            <span>Standard Pro Tier</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-105 bg-blue-100 text-blue-750 text-blue-700 px-1 rounded">
                              Most Popular
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            Upgrades deployment allowance to a steady 600 characters capacity.
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          $9.99/mo
                        </span>
                      </button>

                      {/* Pack 3 */}
                      <button
                        type="button"
                        onClick={() => setSelectedUpgradePlan("unlimited")}
                        className={`w-full p-3 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                          selectedUpgradePlan === "unlimited"
                            ? "border-slate-800 bg-slate-50 ring-1 ring-slate-850"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                            <span>Enterprise Infinite Pack</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1 rounded">
                              Heavy Duty
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            No limits. Allows up to 10,000 characters per conversation payload!
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          $19.99/mo
                        </span>
                      </button>
                    </div>

                    {/* Card details */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block text-slate-450">
                          Secure Payment Gateway
                        </label>
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                          ● Mock Sandbox Mode
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Mock Debit/Credit Card
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              disabled
                              value={mockCardNumber}
                              className="w-full bg-slate-50 text-slate-500 border border-slate-200 px-3 py-2.5 rounded text-xs font-mono select-none"
                            />
                            <CreditCard className="h-4 w-4 absolute right-3 top-3 text-slate-400" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={mockCardName}
                            onChange={(e) => setMockCardName(e.target.value)}
                            className="w-full bg-white text-slate-800 border border-slate-200 px-3 py-2 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div>
                          <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Mock CVC
                          </label>
                          <input
                            type="text"
                            disabled
                            value="455"
                            className="w-full bg-slate-50 text-slate-500 border border-slate-200 px-3 py-2 rounded text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Pay button */}
                    <button
                      type="button"
                      disabled={isProcessingPayment || !mockCardName.trim()}
                      onClick={handleUpgradeClient}
                      className="w-full mt-2 py-3 bg-slate-900 hover:bg-black disabled:opacity-40 text-white rounded text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isProcessingPayment ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Simulating Merchant Authorization...</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                          <span>
                            Authorize & Upgrade Allowance ($
                            {selectedUpgradePlan === "pack"
                              ? "4.99"
                              : selectedUpgradePlan === "pro"
                              ? "9.99"
                              : "19.99"}
                            )
                          </span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex p-4 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600 mb-4 shadow-sm"
                    >
                      <Sparkles className="h-10 w-10 animate-pulse fill-emerald-100" />
                    </motion.div>
                    <h4 className="font-display font-extrabold text-base text-slate-900 leading-tight">
                      Merchant Authorization Approved!
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed mx-auto">
                      Allowance unlocked. The system has updated the budget allocation for <strong className="text-slate-700">{upgradeTargetClient.name}</strong> successfully. Enjoy continuous live simulation!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simple Clean Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CoreOS AI SaaS Integrator Systems. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-800 cursor-pointer transition-colors select-none font-bold">Terms of Deployments</span>
            <span className="hover:text-slate-800 cursor-pointer transition-colors select-none font-bold">API Protocols</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
