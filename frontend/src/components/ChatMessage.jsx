import React, { useState } from "react";
import { Bot, User, BookOpen, ChevronDown, ChevronUp, FileText, CheckCircle2 } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);

  // Helper to format simple markdown-like elements (bold, bullet points, linebreaks)
  const formatText = (content) => {
    if (!content) return null;

    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Process bold syntax **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-sky-200">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 my-1 text-slate-200">
            {formattedLine.slice(0, 1)} {formattedLine.slice(1)}
          </li>
        );
      }

      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="ml-2 font-medium my-1 text-slate-200">
            {formattedLine}
          </div>
        );
      }

      return (
        <p key={idx} className={`${line.trim() === "" ? "h-2" : "my-1 text-slate-200 leading-relaxed"}`}>
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className={`py-4 px-4 sm:px-6 flex justify-center ${isUser ? "bg-slate-950" : "bg-slate-900/50 border-y border-slate-800/50"}`}>
      <div className="max-w-3xl w-full flex space-x-3 sm:space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="h-5 w-5" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Bot className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-bold text-slate-200">
              {isUser ? "Bạn" : "Trợ lý AI EVN"}
            </span>
            <span className="text-[11px] text-slate-500">{message.timestamp}</span>
          </div>

          <div className="text-sm space-y-1">
            {formatText(message.content)}
          </div>

          {/* Source Citations Section (RAG Highlight) */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-sky-500/20 text-xs font-medium text-sky-400 transition-colors group"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>
                    Nguồn trích dẫn ({message.sources.length} đoạn văn bản từ Vector Store)
                  </span>
                </div>
                {showSources ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {/* Collapsible Content */}
              {showSources && (
                <div className="mt-3 space-y-2.5 animate-fadeIn">
                  {message.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                        <span className="flex items-center space-x-1.5 text-sky-300 font-semibold">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Trích dẫn #{src.id || idx + 1}</span>
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {src.metadata?.source ? src.metadata.source.split(/[\\/]/).pop() : "quy-dinh-an-toan-dien.md"}
                        </span>
                      </div>
                      <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/50 leading-relaxed italic font-sans">
                        "{src.pageContent}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
