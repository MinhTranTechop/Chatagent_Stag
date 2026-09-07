import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  Search,
  FileText,
  Hash,
  Layers,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Cpu
} from "lucide-react";

export default function VectorManager() {
  const [data, setData] = useState({ totalChunks: 0, averageLength: 0, chunks: [] });
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const fetchVectorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vector-db");
      if (!res.ok) throw new Error("Không thể tải dữ liệu Vector DB");
      const json = await res.json();
      setData({
        totalChunks: json.totalChunks || 0,
        averageLength: json.averageLength || 0,
        chunks: json.chunks || [],
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Lỗi kết nối Backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVectorData();
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/vector-reindex", { method: "POST" });
      if (!res.ok) throw new Error("Re-Index thất bại");
      const json = await res.json();

      // BẮT BUỘC: Gọi lại hàm fetch danh sách chunks (GET /api/vector-db) để cập nhật UI ngay lập tức
      await fetchVectorData();

      setSuccessMsg(json.message || "Đã cập nhật Vector DB");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || "Lỗi khi chạy Re-Index");
    } finally {
      setReindexing(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredChunks = data.chunks.filter((chunk) => {
    const query = searchTerm.toLowerCase();
    const contentMatch = (chunk.content || "").toLowerCase().includes(query);
    const idMatch = String(chunk.id).includes(query);
    const sourceMatch = (chunk.metadata?.source || "").toLowerCase().includes(query);
    return contentMatch || idMatch || sourceMatch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Top Header & Re-Index Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="h-6 w-6 text-sky-400" />
            Quản lý Kho Vector DB & Chunks
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kiểm tra các đoạn văn bản (Text Chunks) được băm nhỏ và nhúng Vector phục vụ RAG.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVectorData}
            disabled={loading || reindexing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all shadow-sm disabled:opacity-50"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${reindexing ? "animate-spin" : ""}`} />
            <span>{reindexing ? "Đang Re-Indexing..." : "Làm mới Vector DB (Re-Index)"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-100">{data.totalChunks}</div>
            <div className="text-xs text-slate-400 font-medium">Tổng số đoạn (Chunks)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-100">{data.averageLength}</div>
            <div className="text-xs text-slate-400 font-medium">Kích thước trung bình (Ký tự)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">nomic-embed-text</div>
            <div className="text-xs text-slate-400 font-medium">Model Embedding (Ollama)</div>
          </div>
        </div>
      </div>

      {/* Search Filter Toolbar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm nội dung chunk, từ khóa, nguồn tài liệu..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
        />
        {searchTerm && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
            Tìm thấy {filteredChunks.length}/{data.totalChunks} chunks
          </span>
        )}
      </div>

      {/* Chunks List (Scrollable Cards) */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
        {loading || reindexing ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
            <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
            <span>{reindexing ? "Đang Re-Indexing và tạo nhúng Vector mới (vui lòng chờ trong giây lát)..." : "Đang tải dữ liệu Vector DB..."}</span>
          </div>
        ) : filteredChunks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
            <ShieldAlert className="h-8 w-8 text-slate-600" />
            <span>Không tìm thấy chunk dữ liệu nào phù hợp.</span>
          </div>
        ) : (
          filteredChunks.map((chunk) => (
            <div
              key={chunk.id}
              className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3 group"
            >
              {/* Card Top Metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Chunk #{chunk.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                    {chunk.length} ký tự
                  </span>
                  {chunk.metadata?.source && (
                    <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px]">
                      {chunk.metadata.source}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(chunk.id, chunk.content)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
                  title="Sao chép nội dung"
                >
                  {copiedId === chunk.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Raw Content Display */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-900 text-slate-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto selection:bg-sky-500 selection:text-white">
                {chunk.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
