import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import {
  saveChatMessage,
  getChefChatHistory,
  clearChefChatHistoryInDb
} from "../services/firebase";
import {
  ChefHat,
  Send,
  Trash2,
  Sparkles,
  RefreshCw,
  Clock,
  HelpCircle,
  MessageSquare,
  AlertCircle
} from "lucide-react";

interface AIChefAssistViewProps {
  userId: string;
}

export default function AIChefAssistView({ userId }: AIChefAssistViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchChatHistory();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatHistory = async () => {
    setSyncing(true);
    try {
      const hist = await getChefChatHistory(userId);
      // Sort message history chronologically
      const sorted = hist.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(sorted);
    } catch (err) {
      console.error("Failed loading AI chat logs:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || loading) return;

    if (!customPrompt) setInputText("");

    const mockMessageId = `chat-msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      chatId: mockMessageId,
      userId,
      message: promptToSend.trim(),
      response: "", // Will be updated
      timestamp: new Date().toISOString()
    };

    // Temporarily add to local state
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Format chat history context for multi-turn guidelines
    const contextHistory = messages.slice(-8).map((m) => ([
      { role: "user", text: m.message },
      { role: "model", text: m.response }
    ])).flat();

    try {
      const response = await fetch("/api/chef/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.message,
          history: contextHistory
        })
      });

      if (!response.ok) {
        throw new Error("Chef Antoinette is currently formulating a dessert menu and had a temporary disconnect.");
      }

      const resData = await response.json();
      const updatedMsg: ChatMessage = {
        ...userMsg,
        response: resData.response || "I apologize. I could not synthesize a proper recipe solution at this time."
      };

      // Persist to Cloudstore database
      await saveChatMessage(updatedMsg);

      // Replace last message with response
      setMessages((prev) => prev.map((m) => (m.chatId === mockMessageId ? updatedMsg : m)));
    } catch (err: any) {
      console.error(err);
      // Fallback response with diagnostic error block
      const errorMsg: ChatMessage = {
        ...userMsg,
        response: `⚠️ Antoinette Chef Engine error: ${err.message || "Failed to establish real-time server socket."}`
      };
      setMessages((prev) => prev.map((m) => (m.chatId === mockMessageId ? errorMsg : m)));
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you confident you want to delete all Chef Antoinette conversation history? This process cannot be undone.")) {
      setLoading(true);
      try {
        await clearChefChatHistoryInDb(userId);
        setMessages([]);
      } catch (err) {
        console.error("History erasure failure:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const PRESET_QUERIES = [
    "What is a smart vegetarian substitute for chicken breast in curries?",
    "My gravy tastes too salty. How can I quickly troubleshoot it?",
    "Recommend a healthy beverage to pair with hot spicy tacos.",
    "Give me beginner tips on how to properly emulsify a hollandaise sauce."
  ];

  return (
    <div className="space-y-6">
      
      {/* Visual Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center mb-0.5">
            <ChefHat className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-neutral-900 flex items-center gap-2">
              AI Chef Assistant
              <span className="inline-block px-1.5 py-0.5 bg-primary-100/30 text-primary-700 rounded-full text-[9px] uppercase font-bold tracking-tight">Active</span>
            </h1>
            <p className="text-xs text-neutral-400">
              Troubleshoot culinary preparations, request perfect spice pairings, or swap ingredients in real-time
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Log History
          </button>
        )}
      </div>

      {/* Main Chef Conversation Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Preset Prompt Recommendations (Sidebar) */}
        <div className="lg:col-span-1 space-y-4 bg-neutral-50/50 border border-neutral-100 p-4 rounded-xl">
          <h3 className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
            Antoinette Presets
          </h3>
          <p className="text-[11px] text-neutral-400 leading-normal">
            Select a common stove diagnostic query or beginner concept to ask our Executive Chef instantly:
          </p>
          <div className="space-y-2">
            {PRESET_QUERIES.map((queryText) => (
              <button
                key={queryText}
                onClick={() => handleSendMessage(undefined, queryText)}
                disabled={loading}
                className="w-full text-left p-2.5 bg-white border border-neutral-200 rounded-lg hover:border-primary-400 transition-all text-[11px] text-neutral-600 hover:text-neutral-900 leading-snug font-medium shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {queryText}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Dialog Interface */}
        <div className="lg:col-span-3 flex flex-col border border-neutral-100 bg-white rounded-xl overflow-hidden h-[450px]">
          
          <div className="p-3 bg-neutral-50 text-neutral-400 text-[10px] font-semibold border-b border-neutral-100 flex justify-between items-center shrink-0">
            <span>CHEF ANTOINETTE ONLINE</span>
            {syncing && <span className="animate-pulse">Retrieving conversation database...</span>}
          </div>

          {/* Interactive chat log lists */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            
            {/* Introductions msg */}
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-primary-100 shrink-0 flex items-center justify-center font-display font-bold text-primary-700 text-xs text-center border border-primary-200">
                A
              </div>
              <div className="bg-neutral-50 p-3 rounded-2xl text-xs text-neutral-800 space-y-1">
                <p className="font-display font-medium text-neutral-900">Chef Antoinette</p>
                <p className="leading-relaxed font-sans">
                  "Bonjour! Saffron, rosemary, stove configurations and spice measurements — I can optimize any culinary design. How may I improve your gourmet workflow or diagnose your dishes today?"
                </p>
              </div>
            </div>

            {/* Loop actual history message logs */}
            {messages.map((msg, index) => (
              <React.Fragment key={msg.chatId || index}>
                {/* User Message logs bubble */}
                <div className="flex gap-2 justify-end max-w-[85%] ml-auto">
                  <div className="bg-primary-500 text-white p-3 rounded-2xl text-xs shadow-sm font-sans leading-relaxed">
                    {msg.message}
                  </div>
                </div>

                {/* Chef Message response logs bubble */}
                {msg.response && (
                  <div className="flex gap-3 max-w-[85%] animate-fade-in">
                    <div className="w-7 h-7 rounded-full bg-primary-100 shrink-0 flex items-center justify-center font-display font-bold text-primary-700 text-xs text-center border border-primary-200">
                      A
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-2xl text-xs text-neutral-800 space-y-1 w-full overflow-hidden">
                      <p className="font-display font-medium text-neutral-900">Chef Antoinette</p>
                      <div className="leading-relaxed font-sans prose prose-neutral max-w-full text-xs">
                        {/* Format paragraph splits securely */}
                        {msg.response.split("\n").map((para, pIdx) => (
                          <p key={pIdx} className="mb-1.5 break-words">
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Simulated loading bubble */}
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-primary-100 shrink-0 flex items-center justify-center font-display font-bold text-primary-700 text-xs text-center">
                  A
                </div>
                <div className="bg-neutral-50 p-3 rounded-2xl text-xs text-neutral-400 italic">
                  Antoinette is tasting the sauce, please wait...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt dispatch input form */}
          <form onSubmit={(e) => handleSendMessage(e)} className="p-3 border-t border-neutral-100 bg-neutral-50 flex gap-2 shrink-0">
            <input
              type="text"
              placeholder="Ask Chef Antoinette (e.g. Can I substitute honey for maple syrup?)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500 placeholder:text-neutral-300"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
