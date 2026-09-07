import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeRAG, askQuestion, getVectorDbInfo, reindexVectorStore } from "./ragService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const vectorStoreFilePath = path.join(__dirname, "local_vector_store", "vectors.json");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "EVN RAG Backend Service is running" });
});

// 🗄️ GET /api/vector-db: Lấy danh sách Chunks và thống kê Vector DB
app.get("/api/vector-db", async (req, res) => {
  try {
    const data = await getVectorDbInfo();
    return res.json({
      success: true,
      totalChunks: data.totalChunks,
      averageLength: data.averageLength,
      chunks: data.chunks,
    });
  } catch (error) {
    console.error("❌ Lỗi GET /api/vector-db:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Không thể đọc dữ liệu Vector DB",
      totalChunks: 0,
      averageLength: 0,
      chunks: [],
    });
  }
});

// 🔄 POST /api/vector-reindex: Chạy lại chunking và cập nhật file vectors.json
app.post("/api/vector-reindex", async (req, res) => {
  try {
    // Bước 1: Dùng thư viện fs xóa thẳng tay file cache hiện tại: vectors.json (try-catch bỏ qua lỗi nếu file không tồn tại)
    try {
      if (fs.existsSync(vectorStoreFilePath)) {
        fs.unlinkSync(vectorStoreFilePath);
        console.log(`🗑️ [API POST /api/vector-reindex] Đã xóa cache file vectors.json tại: ${vectorStoreFilePath}`);
      }
    } catch (fsErr) {
      console.warn("⚠️ [API POST /api/vector-reindex] Bỏ qua lỗi xóa cache file vectors.json:", fsErr.message);
    }

    // Bước 2: Gọi lại hàm khởi tạo Vector DB để ép hệ thống đọc lại file .md mới, chunking và embedding lại từ đầu
    await reindexVectorStore();

    // Bước 3: Sau khi tiến trình nhúng hoàn tất, trả về { success: true, message: "Đã cập nhật Vector DB" }
    return res.json({
      success: true,
      message: "Đã cập nhật Vector DB",
    });
  } catch (error) {
    console.error("❌ Lỗi POST /api/vector-reindex:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Lỗi khi Re-Index Vector DB",
    });
  }
});

// Chat endpoint - Bọc toàn bộ logic trong try...catch tổng, luôn trả về JSON hợp lệ
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập câu hỏi hợp lệ." });
    }

    console.log(`\n❓ [API POST /api/chat] Nhận câu hỏi: "${question}"`);
    const startTime = Date.now();
    const result = await askQuestion(question.trim());
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ [API POST /api/chat] Trả lời thành công trong ${duration}s với ${result.sources.length} trích dẫn.`);

    return res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error("❌ [API POST /api/chat] Lỗi xử lý chi tiết từ Ollama / LangChain:", error);
    const detailError = error?.message || String(error);
    // BẮT BUỘC trả về HTTP Status 500 cùng message: "Lỗi Backend: [chi tiết lỗi]", tuyệt đối không để request bị treo
    return res.status(500).json({
      success: false,
      message: `Lỗi Backend: ${detailError}`,
      error: `Lỗi Backend: ${detailError}`,
    });
  }
});

// Initialize RAG and start Express server with server.timeout = 180000ms (3 minutes)
initializeRAG()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 [Server] Backend server đang chạy thành công tại http://localhost:${PORT}`);
    });

    // Cấu hình Timeout của ExpressJS Server lên 180,000ms (3 phút) tránh hanging
    server.timeout = 180000;
    server.keepAliveTimeout = 185000;
    server.headersTimeout = 190000;
  })
  .catch((err) => {
    console.error("💥 Thất bại khi khởi động RAG Service:", err);
    process.exit(1);
  });
