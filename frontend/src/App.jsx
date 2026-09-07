import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import VectorManager from "./components/VectorManager";
import { Bot, Zap, BookOpen, Shield, AlertTriangle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  const chatEndRef = useRef(null);

  const suggestionQuestions = [
    "Ai là Giám đốc Tập đoàn Điện lực Việt Nam?",
    "Chủ tịch HĐTV của EVN hiện nay là ai?",
    "Thông tin máy chủ ở Đắk Lắk như thế nào?",
    "Quy định an toàn làm việc trên cao thuộc điều mấy?",
  ];

  // Health check polling
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          setIsBackendOnline(true);
        } else {
          setIsBackendOnline(false);
        }
      } catch (err) {
        setIsBackendOnline(false);
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom on message change
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, activeTab]);

  const handleSendMessage = async (questionText) => {
    if (!questionText.trim() || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: questionText,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });

      if (!response.ok) {
        let errorMsg = "Hệ thống máy chủ AI đang bận hoặc không phản hồi đúng định dạng, vui lòng thử lại.";
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("Hệ thống máy chủ AI đang bận hoặc không phản hồi đúng định dạng, vui lòng thử lại.");
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Hệ thống máy chủ AI đang bận hoặc không phản hồi đúng định dạng, vui lòng thử lại.");
      }

      const aiTimestamp = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        timestamp: aiTimestamp,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      setError(err.message || "Hệ thống máy chủ AI đang bận hoặc không phản hồi đúng định dạng, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <Header
        isOnline={isBackendOnline}
        onResetChat={handleResetChat}
        messageCount={messages.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Conditional View: Vector Manager vs Chat */}
      {activeTab === "vector" ? (
        <VectorManager />
      ) : (
        <>
          {/* Main Chat Feed */}
          <main className="flex-1 overflow-y-auto relative no-scrollbar">
            {messages.length === 0 ? (
              /* Empty / Welcome State */
              <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-700 p-0.5 shadow-xl shadow-sky-500/20 flex items-center justify-center animate-bounce">
                  <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Bot className="h-8 w-8 text-sky-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                    Hệ thống AI Hỏi đáp Tài liệu An toàn Điện EVN
                  </h2>
                  <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                    PoC RAG (Retrieval-Augmented Generation) tra cứu chính xác quy định nội bộ EVN với Ollama Local LLM (Llama 3.2 3B) và CSDL Máy chủ SQLite.
                  </p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left space-y-2 hover:border-sky-500/30 transition-colors">
                    <BookOpen className="h-5 w-5 text-sky-400" />
                    <h3 className="text-xs font-bold text-slate-200">Vector Search</h3>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Phân đoạn văn bản 1500 ký tự & lưu Vector Store chuẩn LangChain.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left space-y-2 hover:border-sky-500/30 transition-colors">
                    <Zap className="h-5 w-5 text-amber-400" />
                    <h3 className="text-xs font-bold text-slate-200">Llama 3.2 (3B)</h3>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Mô hình LLM thế hệ mới suy luận sâu trên máy chủ 30GB RAM.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left space-y-2 hover:border-sky-500/30 transition-colors">
                    <Shield className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-200">Nguồn Trích Dẫn</h3>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Trả về nguyên bản các đoạn văn bản gốc được AI dùng để trả lời.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Message List */
              <div className="divide-y divide-slate-800/40">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="py-4 px-4 sm:px-6 bg-slate-900/50 flex justify-center">
                    <div className="max-w-3xl w-full flex space-x-4">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md">
                        <Bot className="h-5 w-5 animate-spin" />
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-sky-400 font-medium animate-pulse">
                        <span>Trợ lý AI đang tra cứu tri thức & tổng hợp câu trả lời...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="max-w-3xl mx-auto my-4 px-4">
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </main>

          {/* Bottom Input Field */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            suggestionQuestions={messages.length === 0 ? suggestionQuestions : []}
          />
        </>
      )}
    </div>
  );
}
