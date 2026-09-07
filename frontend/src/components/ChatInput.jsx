import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";

export default function ChatInput({ onSendMessage, isLoading, suggestionQuestions }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  // Auto resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (question) => {
    if (isLoading) return;
    onSendMessage(question);
  };

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Suggestion Chips */}
        {suggestionQuestions && suggestionQuestions.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs text-slate-500 font-medium flex items-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 mr-1" />
              Gợi ý câu hỏi:
            </span>
            {suggestionQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(q)}
                disabled={isLoading}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 transition-all cursor-pointer disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Box Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về quy định an toàn điện, khoảng cách an toàn, quy trình 5 bước vàng..."
            disabled={isLoading}
            className="w-full resize-none rounded-xl bg-slate-900 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 placeholder-slate-500 text-sm py-3.5 pl-4 pr-12 outline-none transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 p-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium transition-all shadow-md shadow-sky-500/20 disabled:shadow-none flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Nhấn <strong>Enter</strong> để gửi, <strong>Shift + Enter</strong> để xuống dòng</span>
          <span>EVN Internal RAG Engine</span>
        </div>
      </div>
    </div>
  );
}
