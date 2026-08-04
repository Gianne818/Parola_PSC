"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Smartphone,
  Terminal,
  Copy,
  Download,
  Search,
  FileCode,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Zap,
  Lock,
  Radio,
  Sliders,
  ExternalLink,
  Code2,
  ChevronRight,
  Database,
  Info
} from "lucide-react";
import { ParolaLogo } from "@/components/ui/ParolaLogo";

// Types
type TabType = "prompt" | "inspector" | "settings" | "tester";

interface CodeFile {
  path: string;
  name: string;
  category: string;
  content: string;
}

const SAMPLE_PROJECT_FILES: CodeFile[] = [
  {
    path: "services/iprogSmsService.ts",
    name: "iprogSmsService.ts",
    category: "Services",
    content: `import dotenv from 'dotenv';
dotenv.config();

export interface IProgSmsConfig {
  endpoint: string;
  apiKey: string;
  senderName: string;
  mockMode: boolean;
}

export function sanitizePhilippineMobileNumber(phone: string): string {
  let cleaned = phone.replace(/\\D/g, '');
  if (cleaned.startsWith('09') && cleaned.length === 11) {
    return '63' + cleaned.substring(1);
  }
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '63' + cleaned;
  }
  if (cleaned.startsWith('639') && cleaned.length === 12) {
    return cleaned;
  }
  throw new Error(\`Invalid Philippines mobile number format: \${phone}. Expected 09XXXXXXXXX or 639XXXXXXXXX.\`);
}

export class IProgSmsService {
  // Handles mock dry-run credit protection and live iPROG API dispatches
}`
  },
  {
    path: "templates/fishermanAlerts.ts",
    name: "fishermanAlerts.ts",
    category: "Templates",
    content: `export const FISHERMAN_ALERT_TEMPLATES = {
  high_wave: {
    title: 'High Wave / Sea Advisory',
    templateText: '[PAROLA ALERT] Babala sa mga mangingisda: Malalaking alon (3.5m-4.5m) sa Look ng Maynila. Mangyaring manatili muna sa daungan.'
  },
  storm_emergency: {
    title: 'Storm Emergency SOS',
    templateText: '[PAROLA SOS] URGENT: Signal No. 2. Lahat ng sasakyang pandagat ay pinapayuhan na huwag pumalaot at humanap ng ligtas na daungan.'
  },
  catch_log: {
    title: 'Catch Log Confirmation',
    templateText: '[PAROLA LOG] Maraming salamat Ka-Isda! Naitala ang iyong huli: 45kg Tulingan. Ref ID: LOG-2026-889. Ligtas na paglalayag!'
  }
};`
  },
  {
    path: ".env.example",
    name: ".env.example",
    category: "Config",
    content: `# iPROG SMS Gateway Configuration
IPROG_API_KEY="IPROG_PENDING_HACKATHON_KEY"
IPROG_API_ENDPOINT="https://iprogtech.com/api/v1/sms_messages"
IPROG_SENDER_NAME="PAROLA" # Masking name
IPROG_MOCK_MODE="true"     # Dry-run guard protecting 5 free credits`
  },
  {
    path: "app/api/sms/send/route.ts",
    name: "route.ts (SMS Dispatch)",
    category: "API Routes",
    content: `import { NextResponse } from 'next/server';
import { IProgSmsService } from '@/services/iprogSmsService';

const smsService = new IProgSmsService();

export async function POST(request: Request) {
  const { recipient, message, category } = await request.json();
  const result = await smsService.sendSms({ recipient, message, category });
  return NextResponse.json(result);
}`
  }
];

export default function SmsStudioPage() {
  const [activeTab, setActiveTab] = useState<TabType>("tester");
  const [mockMode, setMockMode] = useState<boolean>(true);
  const [quotaRemaining, setQuotaRemaining] = useState<number>(5);

  // Payload Tester State
  const [phoneInput, setPhoneInput] = useState<string>("09171234567");
  const [normalizedPhone, setNormalizedPhone] = useState<string>("639171234567");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState<string>(
    "[PAROLA ALERT] Babala sa mga mangingisda: Malalaking alon (3.5m-4.5m) sa Look ng Maynila. Mangyaring manatili muna sa daungan."
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("high_wave");
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [sending, setSending] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Inspector State
  const [selectedFile, setSelectedFile] = useState<CodeFile>(SAMPLE_PROJECT_FILES[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Prompt Architect State
  const [promptTopic, setPromptTopic] = useState<string>("Gale Warning Advisory");
  const [promptUrgency, setPromptUrgency] = useState<string>("High");
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");

  // Normalize phone real-time
  useEffect(() => {
    try {
      let cleaned = phoneInput.replace(/\D/g, "");
      if (cleaned.startsWith("09") && cleaned.length === 11) {
        setNormalizedPhone("63" + cleaned.substring(1));
        setPhoneError(null);
      } else if (cleaned.startsWith("9") && cleaned.length === 10) {
        setNormalizedPhone("63" + cleaned);
        setPhoneError(null);
      } else if (cleaned.startsWith("639") && cleaned.length === 12) {
        setNormalizedPhone(cleaned);
        setPhoneError(null);
      } else {
        setPhoneError("Expected format: 09XXXXXXXXX or 639XXXXXXXXX");
        setNormalizedPhone("");
      }
    } catch (e: any) {
      setPhoneError(e.message);
    }
  }, [phoneInput]);

  // Segment calculation
  const charCount = messageText.length;
  const isUnicode = /[^\u0000-\u007F]/.test(messageText);
  const maxSingle = isUnicode ? 70 : 160;
  const maxConcat = isUnicode ? 67 : 153;
  const segmentCount = charCount === 0 ? 0 : charCount <= maxSingle ? 1 : Math.ceil(charCount / maxConcat);

  // Fetch API Config on Mount
  useEffect(() => {
    fetch("/api/sms/config")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.mockMode === "boolean") {
          setMockMode(data.mockMode);
        }
      })
      .catch(() => {});
  }, []);

  // Dispatch SMS
  const handleDispatchSms = async () => {
    if (phoneError || !normalizedPhone) {
      alert("Please provide a valid Philippine mobile number.");
      return;
    }
    setSending(true);

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: phoneInput,
          message: messageText,
          category: selectedCategory,
        }),
      });
      const data = await res.json();

      const timestamp = new Date().toLocaleTimeString();
      let logEntry = "";
      if (data.success) {
        if (data.mode === "MOCK_DRY_RUN") {
          logEntry = `[${timestamp}] 🛡️ [DRY-RUN] Message ID: ${data.messageId} | Sent to ${data.recipientFormatted} | Quota Preserved (5 remaining)`;
        } else {
          logEntry = `[${timestamp}] 🚀 [LIVE DISPATCH] Message ID: ${data.messageId} | Sent to ${data.recipientFormatted} | Credit Deducted!`;
          setQuotaRemaining((prev) => Math.max(0, prev - 1));
        }
      } else {
        logEntry = `[${timestamp}] ❌ [ERROR] ${data.error}`;
      }

      setAuditLogs((prev) => [logEntry, ...prev]);
    } catch (err: any) {
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] ❌ Network Error: ${err.message}`, ...prev]);
    } finally {
      setSending(false);
    }
  };

  // Toggle Mock Mode dynamically
  const handleToggleMock = async (newMode: boolean) => {
    setMockMode(newMode);
    try {
      await fetch("/api/sms/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockMode: newMode }),
      });
      setAuditLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ⚙️ Configuration changed: IPROG_MOCK_MODE=${newMode ? "true (DRY-RUN)" : "false (LIVE)"}`,
        ...prev,
      ]);
    } catch (e) {}
  };

  // Generate Prompt
  const handleGeneratePrompt = () => {
    const p = `Act as an expert Tagalog Emergency Broadcast Communication Specialist for StarISDA Parola Fisherman Safety Platform.

Task: Generate an SMS notification broadcast for fishermen in Manila Bay regarding: "${promptTopic}".
Target Audience: Local Filipino fishermen (Ka-Isda)
Urgency Level: ${promptUrgency}
Strict Constraints:
1. Maximum 160 GSM characters (single SMS segment).
2. Must start with prefix: [PAROLA ALERT] or [PAROLA SOS]
3. Clear, concise Tagalog phrasing understandable by all boat captains.
4. Include actionable instruction (e.g. return to port / secure anchor).`;

    setGeneratedPrompt(p);
  };

  useEffect(() => {
    handleGeneratePrompt();
  }, [promptTopic, promptUrgency]);

  // Copy Prompt
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export .md
  const handleExportMd = () => {
    const blob = new Blob([generatedPrompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StarISDA_Parola_SMS_Prompt_${promptTopic.replace(/\s+/g, "_")}.md`;
    a.click();
  };

  const filteredFiles = SAMPLE_PROJECT_FILES.filter(
    (f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <ParolaLogo iconOnly className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                StarISDA Parola
              </span>
            </Link>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 font-medium">
              iPROG SMS Studio v1.0
            </span>
          </div>

          {/* Status Quota Shield */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              mockMode
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                : "bg-amber-950/60 text-amber-400 border-amber-500/30"
            }`}>
              <ShieldAlert className="w-4 h-4" />
              <span>{mockMode ? "MOCK DRY-RUN (5 Free Credits Preserved)" : "LIVE DISPATCH ACTIVE"}</span>
            </div>

            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              Back to Main Platform <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-emerald-400" />
              iPROG SMS Gateway & Prompt Studio
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Automated SMS broadcast management, prompt architecture, and dry-run credit protection for fishermen safety.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
            <button
              onClick={() => handleToggleMock(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mockMode
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🛡️ Mock Dry-Run
            </button>
            <button
              onClick={() => handleToggleMock(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !mockMode
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ Live Hackathon Mode
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-8 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab("tester")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === "tester"
                ? "border-emerald-400 text-emerald-400 bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <Radio className="w-4 h-4" />
            iPROG Payload Tester & Broadcast
          </button>

          <button
            onClick={() => setActiveTab("prompt")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === "prompt"
                ? "border-emerald-400 text-emerald-400 bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <Zap className="w-4 h-4" />
            Antigravity Prompt Architect
          </button>

          <button
            onClick={() => setActiveTab("inspector")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === "inspector"
                ? "border-emerald-400 text-emerald-400 bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <FileCode className="w-4 h-4" />
            Codebase Inspector
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === "settings"
                ? "border-emerald-400 text-emerald-400 bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
            }`}
          >
            <Sliders className="w-4 h-4" />
            API Settings & Quota Guard
          </button>
        </div>

        {/* TAB 1: PAYLOAD TESTER & BROADCAST */}
        {activeTab === "tester" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Input Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    SMS Broadcast Payload Form
                  </span>
                  <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md">
                    Target: Philippines (PH)
                  </span>
                </h2>

                {/* Recipient Input */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Recipient Mobile Number (PH Format)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 09171234567 or 639171234567"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    {normalizedPhone && !phoneError && (
                      <span className="absolute right-3 top-3 text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md font-mono border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Sanitize: {normalizedPhone}
                      </span>
                    )}
                  </div>
                  {phoneError && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {phoneError}
                    </p>
                  )}
                </div>

                {/* Template Preset Selector */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Fisherman Pre-formatted Alert Templates
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategory("high_wave");
                        setMessageText(
                          "[PAROLA ALERT] Babala sa mga mangingisda: Malalaking alon (3.5m-4.5m) sa Look ng Maynila. Mangyaring manatili muna sa daungan."
                        );
                      }}
                      className={`p-3 rounded-xl text-left border text-xs font-medium transition-all ${
                        selectedCategory === "high_wave"
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      🌊 High Wave Advisory
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCategory("storm_emergency");
                        setMessageText(
                          "[PAROLA SOS] URGENT: Signal No. 2. Lahat ng sasakyang pandagat ay pinapayuhan na huwag pumalaot at humanap ng ligtas na daungan."
                        );
                      }}
                      className={`p-3 rounded-xl text-left border text-xs font-medium transition-all ${
                        selectedCategory === "storm_emergency"
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      🚨 Storm Emergency SOS
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCategory("catch_log");
                        setMessageText(
                          "[PAROLA LOG] Maraming salamat Ka-Isda! Naitala ang iyong huli: 45kg Tulingan. Ref ID: LOG-2026-889. Ligtas na paglalayag!"
                        );
                      }}
                      className={`p-3 rounded-xl text-left border text-xs font-medium transition-all ${
                        selectedCategory === "catch_log"
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      🐟 Catch Log Receipt
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCategory("port_alert");
                        setMessageText(
                          "[PAROLA PORT] Paalala sa daungan: Inaasahan ang malakas na hangin at ulan ngayong hapon. Seguruhin ang pagkakatali ng inyong bangka."
                        );
                      }}
                      className={`p-3 rounded-xl text-left border text-xs font-medium transition-all ${
                        selectedCategory === "port_alert"
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      ⚓ Port Security Alert
                    </button>
                  </div>
                </div>

                {/* SMS Content Textarea */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Message Body
                    </label>
                    <div className="text-xs font-mono space-x-2 text-slate-400">
                      <span>{charCount} chars</span>
                      <span>•</span>
                      <span className={segmentCount > 1 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                        {segmentCount} SMS Segment{segmentCount > 1 ? "s" : ""}
                      </span>
                      <span>•</span>
                      <span>{isUnicode ? "Unicode" : "GSM-7"}</span>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono leading-relaxed"
                  />
                  {charCount > 160 && (
                    <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Note: Messages over 160 chars split into multiple SMS credits per recipient.
                    </p>
                  )}
                </div>

                {/* Trigger Dispatch Button */}
                <button
                  onClick={handleDispatchSms}
                  disabled={sending || !!phoneError}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                    mockMode
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                      : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Dispatching SMS Payload...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {mockMode ? "Simulate Dry-Run SMS Dispatch" : "Send Live SMS Broadcast (iPROG)"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Payload Preview & Live Audit Log */}
            <div className="lg:col-span-5 space-y-6">
              {/* JSON Payload Inspector */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  iPROG HTTP POST Payload
                </h3>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
{JSON.stringify(
  {
    api_key: mockMode ? "MOCK_KEY_PROTECTED" : "IPROG_LIVE_KEY_CONFIGURED",
    sender_name: "PAROLA",
    recipient: normalizedPhone || "639171234567",
    message: messageText,
  },
  null,
  2
)}
                </pre>
              </div>

              {/* Audit Console Logs */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[320px]">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    SMS Gateway Audit Log
                  </h3>
                  <button
                    onClick={() => setAuditLogs([])}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono overflow-y-auto space-y-2">
                  {auditLogs.length === 0 ? (
                    <p className="text-slate-600 italic">No SMS dispatches logged yet. Click 'Simulate Dry-Run SMS Dispatch' to test.</p>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <div key={idx} className="text-slate-300 border-b border-slate-900/50 pb-1.5 leading-relaxed">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANTIGRAVITY PROMPT ARCHITECT */}
        {activeTab === "prompt" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Prompt Generator Parameters
              </h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Advisory / Broadcast Topic
                </label>
                <input
                  type="text"
                  value={promptTopic}
                  onChange={(e) => setPromptTopic(e.target.value)}
                  placeholder="e.g. Gale Warning, Typhoon Alert, Port Security"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Urgency Level
                </label>
                <select
                  value={promptUrgency}
                  onChange={(e) => setPromptUrgency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Low">Low - Informational Advisory</option>
                  <option value="Medium">Medium - Weather Caution</option>
                  <option value="High">High - Emergency SOS (Signal 2+)</option>
                </select>
              </div>

              <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
                <p className="font-bold">✨ Gemini Prompt Optimizations:</p>
                <p>• Ensures 160-char SMS limit constraint.</p>
                <p>• Uses clear Filipino/Tagalog maritime vocabulary.</p>
                <p>• Automatically formats prefix for easy SMS gateway parsing.</p>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Generated Antigravity Prompt Artifact
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyPrompt}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy Prompt"}
                    </button>
                    <button
                      onClick={handleExportMd}
                      className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-semibold rounded-lg text-emerald-400 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export .md
                    </button>
                  </div>
                </div>

                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {generatedPrompt}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CODEBASE INSPECTOR */}
        {activeTab === "inspector" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Project File Explorer
              </h2>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code files..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                {filteredFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full p-3 rounded-xl text-left border text-xs font-mono transition-all flex items-center justify-between ${
                      selectedFile.path === file.path
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-slate-500" />
                      {file.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-slate-500 rounded border border-slate-800">
                      {file.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300 font-bold">{selectedFile.path}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Hackathon2026StarISDA_Parola</span>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: API SETTINGS & QUOTA GUARD */}
        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Quota Shield Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">5 Free SMS Credits Quota Guard</h2>
                  <p className="text-xs text-slate-400">
                    `IPROG_MOCK_MODE` ensures test calls do not consume your 5 trial SMS credits prior to demo day.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 font-mono">5 / 5</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Credits Preserved</p>
              </div>
            </div>

            {/* Config Form */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                iPROG Environment Credential Settings (.env)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    iPROG API Endpoint
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="https://iprogtech.com/api/v1/sms_messages"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Sender Name Masking ID
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="PAROLA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Zero-Downtime Hackathon Key Rotation Guide */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Zero-Downtime Hackathon Day Key Rotation Checklist
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-bold text-white">Update .env File Credentials</p>
                    <p className="text-slate-400 mt-0.5">
                      Replace <code className="text-amber-300 font-mono">IPROG_API_KEY</code> with your fresh live API key.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-bold text-white">Disable Dry-Run Mock Mode</p>
                    <p className="text-slate-400 mt-0.5">
                      Set <code className="text-amber-300 font-mono">IPROG_MOCK_MODE="false"</code> or click the toggle switch above to activate live dispatches.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-bold text-white">Zero Code Redeployment Needed</p>
                    <p className="text-slate-400 mt-0.5">
                      The service dynamically reloads environment settings without interrupting active server operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
