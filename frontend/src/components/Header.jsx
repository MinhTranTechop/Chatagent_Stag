import React from "react";
import { Zap, ShieldCheck, RefreshCw, MessageSquare, Database } from "lucide-react";

export default function Header({ isOnline, onResetChat, messageCount, activeTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Zap className="h-5 w-5 text-sky-400 fill-sky-400/20" />
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base text-slate-100 tracking-wide flex items-center gap-1.5">
              EVN AI Assistant
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Llama 3.2 3B
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Trợ lý RAG Hỏi đáp Quy định An toàn Điện & Tri thức EVN
          </p>
        </div>
      </div>

      {/* Center Tab Navigation */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onTabChange("chat")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "chat"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Hỏi đáp (Chat)</span>
        </button>

        <button
          onClick={() => onTabChange("vector")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "vector"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Quản lý Vector DB</span>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend Status indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-500"}`}></span>
          <span className="text-slate-300 font-medium">
            {isOnline ? "Backend Connected" : "Connecting..."}
          </span>
        </div>

        {/* Clear chat button */}
        {activeTab === "chat" && messageCount > 0 && (
          <button
            onClick={onResetChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Xóa hội thoại"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>
        )}
      </div>
    </header>
  );
}
