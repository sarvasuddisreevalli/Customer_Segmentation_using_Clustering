"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
  Database,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  listClusteringRuns,
  askSegmentIQ,
} from "@/lib/api";
import { ClusteringRunItem } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  supportingMetrics?: Record<string, any>;
  evidenceSource?: string;
}

const SUGGESTED_QUESTIONS = [
  "Which customer segment spends the most?",
  "What are the main customer segments discovered?",
  "How well did this clustering model perform?",
  "Which is the largest customer segment?",
  "What marketing strategy should we test first?",
];

export default function AskSegmentIQPage() {
  const [runs, setRuns] = useState<ClusteringRunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [inputQuestion, setInputQuestion] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am **Ask SegmentIQ**, your AI Customer Intelligence Assistant. I can analyze your active customer clustering model, explain segment differences, and recommend strategies strictly grounded in verified database calculations. What would you like to explore?",
    },
  ]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listClusteringRuns(undefined, 1, 20).then((res) => {
      setRuns(res.runs);
      if (res.runs.length > 0) {
        setSelectedRunId(res.runs[0].id);
      }
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isSending) return;

    // Append user message
    const newMessages: Message[] = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setInputQuestion("");
    setIsSending(true);

    try {
      const response = await askSegmentIQ(q, selectedRunId || undefined);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: response.answer,
          supportingMetrics: response.supporting_metrics,
          evidenceSource: response.evidence_source,
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "I could not retrieve an answer for this question. Please ensure a clustering model has completed execution.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Ask SegmentIQ</span>
              <Badge variant="cyan">Conversational Analytics</Badge>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural language answers strictly grounded in active clustering evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Context:</span>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px]"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.dataset_name} ({r.algorithm.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Suggested Quick Questions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Prompts:
          </span>
          {SUGGESTED_QUESTIONS.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Chat History Container */}
        <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40 border-slate-800/80">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Supporting Evidence Card */}
                  {m.supportingMetrics && Object.keys(m.supportingMetrics).length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
                      <div className="font-semibold text-slate-300 text-[10px] uppercase flex items-center gap-1 mb-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Grounded Evidence:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(m.supportingMetrics).map(([k, v]) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px]"
                          >
                            {k}: <strong className="text-white">{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                      {m.evidenceSource && (
                        <div className="text-[9px] text-slate-500 mt-1">
                          Source: {m.evidenceSource}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Analyzing evidence and formulating verified response...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </Card>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Ask about segment spending, cluster sizes, model metrics..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isSending}
            className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!inputQuestion.trim() || isSending}
            isLoading={isSending}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Ask
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
