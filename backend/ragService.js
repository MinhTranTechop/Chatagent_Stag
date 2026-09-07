import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDatabase } from "./initDB.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "evn_database.sqlite");
const vectorStoreDirPath = path.join(__dirname, "local_vector_store");
const vectorStoreFilePath = path.join(vectorStoreDirPath, "vectors.json");

const OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const OLLAMA_MODEL = "llama3.2:3b";
const EMBEDDING_MODEL = "nomic-embed-text";

let llmModel = null;
let vectorStore = null;
let isInitialized = false;

// Helper: Tính Cosine Similarity giữa 2 vector
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 🧠 1. Thuật toán Semantic Chunking chuẩn kiến trúc (dựa trên Cosine Distance & Percentile Threshold)
export async function semanticChunkDocument(rawText, embeddings, metadata = {}) {
  // Tách văn bản thành các đơn vị ngữ nghĩa tự nhiên (theo đề mục Markdown ##, ### hoặc khối phân hệ)
  const rawSections = rawText
    .split(/\n(?=(?:##\s+|###\s+|#\s+|---\n))/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (rawSections.length <= 1) {
    return [{ pageContent: rawText, metadata }];
  }

  // Nhúng Vector từng đoạn bằng nomic-embed-text
  const sectionEmbeddings = await embeddings.embedDocuments(rawSections);

  // Tính khoảng cách ngữ nghĩa (Cosine Distance = 1 - Cosine Similarity) giữa các đoạn liền kề
  const distances = [];
  for (let i = 0; i < sectionEmbeddings.length - 1; i++) {
    const sim = cosineSimilarity(sectionEmbeddings[i], sectionEmbeddings[i + 1]);
    distances.push(1 - sim);
  }

  // Thiết lập ngưỡng Breakpoint Threshold theo Percentile 85th
  const sortedDistances = [...distances].sort((a, b) => a - b);
  const percentileIndex = Math.min(
    Math.floor(sortedDistances.length * 0.85),
    sortedDistances.length - 1
  );
  const threshold = sortedDistances[percentileIndex] || 0.45;

  console.log(`📐 [Semantic Chunking] Breakpoint Threshold (85th percentile): ${threshold.toFixed(4)}`);

  // Gom các đoạn liền kề có độ tương đồng cao vào chung 1 chunk ngữ nghĩa hoàn chỉnh
  const chunks = [];
  let currentGroup = [rawSections[0]];
  let currentLength = rawSections[0].length;

  for (let i = 0; i < distances.length; i++) {
    const nextSection = rawSections[i + 1];
    const isTopicShift = distances[i] > threshold;
    const isOverLimit = (currentLength + nextSection.length) > 3000;

    if (!isTopicShift && !isOverLimit) {
      currentGroup.push(nextSection);
      currentLength += nextSection.length;
    } else {
      chunks.push({
        pageContent: currentGroup.join("\n\n"),
        metadata,
      });
      currentGroup = [nextSection];
      currentLength = nextSection.length;
    }
  }

  if (currentGroup.length > 0) {
    chunks.push({
      pageContent: currentGroup.join("\n\n"),
      metadata,
    });
  }

  return chunks;
}

// 📖 2. Đọc file tài liệu và áp dụng Semantic Chunking
export async function loadAndChunkDocs(embeddings) {
  const allChunks = [];
  const dataDir = path.join(__dirname, "data");
  const fileNames = ["evn_knowledge.md", "quy-dinh-an-toan-dien.md"];

  for (const fileName of fileNames) {
    let filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, fileName);
    }
    if (fs.existsSync(filePath)) {
      const rawText = fs.readFileSync(filePath, "utf-8");
      const fileMetadata = { source: fileName };
      const fileChunks = await semanticChunkDocument(rawText, embeddings, fileMetadata);
      allChunks.push(...fileChunks);
    }
  }

  if (allChunks.length === 0) {
    console.warn("⚠️ Không tìm thấy file tài liệu nào trong thư mục backend/data!");
    return [];
  }

  console.log(`📄 [Semantic Chunking] Đã chia tài liệu thành ${allChunks.length} Semantic Chunks có ngữ cảnh liền mạch.`);
  return allChunks;
}

// 💾 Lưu danh sách Chunks vào file local_vector_store/vectors.json
function saveChunksToJson(docChunks) {
  try {
    if (!fs.existsSync(vectorStoreDirPath)) {
      fs.mkdirSync(vectorStoreDirPath, { recursive: true });
    }
    const serialized = docChunks.map((chunk, idx) => ({
      id: idx + 1,
      content: chunk.pageContent || "",
      metadata: chunk.metadata || { source: "evn_knowledge.md" },
      length: (chunk.pageContent || "").length,
    }));
    fs.writeFileSync(vectorStoreFilePath, JSON.stringify(serialized, null, 2), "utf-8");
    console.log(`💾 [Vector Storage] Đã lưu thành công ${serialized.length} Semantic Chunks vào ${vectorStoreFilePath}`);
  } catch (err) {
    console.error("❌ Lỗi khi lưu vectors.json:", err);
  }
}

// Helper: Thực thi câu lệnh SQL SELECT trên SQLite
export function executeSqlQuery(sqlQuery) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    db.all(sqlQuery, [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// 🧠 3. Khởi tạo Vector Store với Semantic Chunks & MemoryVectorStore
export async function initializeRAG() {
  if (isInitialized) return;

  console.log("⚡ [EVN RAG & SQL Agent Service] Đang khởi tạo hệ thống Semantic RAG...");

  if (!fs.existsSync(dbPath)) {
    await initDatabase();
  }

  console.log(`🧬 [Ollama Embeddings] Khởi tạo nhúng Vector với model: ${EMBEDDING_MODEL}...`);
  const embeddings = new OllamaEmbeddings({
    model: EMBEDDING_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  });

  // Áp dụng Semantic Chunking
  const docChunks = await loadAndChunkDocs(embeddings);
  saveChunksToJson(docChunks);

  if (docChunks.length > 0) {
    console.log("📦 [MemoryVectorStore] Nạp Semantic Chunks vào bộ nhớ VectorStore...");
    vectorStore = await MemoryVectorStore.fromDocuments(docChunks, embeddings);
    console.log("✅ [MemoryVectorStore] Đã tạo thành công Semantic Vector Index trong RAM!");
  } else {
    vectorStore = new MemoryVectorStore(embeddings);
  }

  console.log(`🤖 [Local Ollama] Cấu hình ChatOllama (model: ${OLLAMA_MODEL}, baseUrl: ${OLLAMA_BASE_URL})...`);
  llmModel = new ChatOllama({
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0.1,
    numPredict: 1024,
  });

  isInitialized = true;
  console.log(`✅ [EVN Agent] Hệ thống sẵn sàng với Ollama Local (${OLLAMA_MODEL} + ${EMBEDDING_MODEL})!`);
}

// 🗄️ 4. API Quản lý Vector DB: Đọc dữ liệu vectors.json
export async function getVectorDbInfo() {
  try {
    if (!fs.existsSync(vectorStoreFilePath)) {
      const embeddings = new OllamaEmbeddings({
        model: EMBEDDING_MODEL,
        baseUrl: OLLAMA_BASE_URL,
      });
      const docChunks = await loadAndChunkDocs(embeddings);
      if (docChunks.length > 0) {
        saveChunksToJson(docChunks);
      }
    }

    if (!fs.existsSync(vectorStoreFilePath)) {
      return { totalChunks: 0, averageLength: 0, chunks: [] };
    }

    const rawData = fs.readFileSync(vectorStoreFilePath, "utf-8");
    const rawChunks = JSON.parse(rawData);

    const chunks = rawChunks.map((c, idx) => ({
      id: c.id || idx + 1,
      length: c.length || (c.content || "").length,
      content: c.content || c.pageContent || "",
      metadata: c.metadata || {},
    }));

    const totalChunks = chunks.length;
    const averageLength = totalChunks > 0
      ? Math.round(chunks.reduce((sum, item) => sum + item.length, 0) / totalChunks)
      : 0;

    return {
      totalChunks,
      averageLength,
      chunks,
    };
  } catch (err) {
    console.error("❌ Lỗi getVectorDbInfo:", err);
    return { totalChunks: 0, averageLength: 0, chunks: [], error: err.message };
  }
}

// 🔄 5. API Re-Index: Tự động chạy lại Semantic Chunking và cập nhật Vector Store
export async function reindexVectorStore() {
  console.log("🔄 [Vector DB Manager] Đang thực hiện Re-Index Semantic Chunking lại toàn bộ tài liệu...");

  // Bước 1: Xóa cache vectors.json nếu tồn tại
  try {
    if (fs.existsSync(vectorStoreFilePath)) {
      fs.unlinkSync(vectorStoreFilePath);
      console.log("🗑️ [Vector DB Manager] Đã xóa cache file vectors.json cũ.");
    }
  } catch (err) {
    console.warn("⚠️ [Vector DB Manager] Bỏ qua lỗi khi xóa cache:", err.message);
  }

  // Bước 2: Nạp embeddings mới, đọc lại file .md mới, chunking và embedding lại từ đầu
  const embeddings = new OllamaEmbeddings({
    model: EMBEDDING_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  });

  const docChunks = await loadAndChunkDocs(embeddings);
  saveChunksToJson(docChunks);

  if (docChunks.length > 0) {
    vectorStore = await MemoryVectorStore.fromDocuments(docChunks, embeddings);
    console.log("✅ [Vector DB Manager] Semantic Re-Index hoàn tất thành công!");
  }

  // Bước 3: Trả về trạng thái thành công
  return { success: true, message: "Đã cập nhật Vector DB" };
}

// 🛠️ Custom Tool: query_sql_database
export const querySqlDatabaseTool = new DynamicStructuredTool({
  name: "query_sql_database",
  description: "CHỈ sử dụng công cụ này khi người dùng ĐÍCH DANH hỏi về thông số máy chủ IT, server, uptime, chi phí hạ tầng mạng.",
  schema: z.object({
    query: z.string().describe("Câu lệnh SQL SELECT chuẩn xác để truy vấn bảng MayChu_EVN"),
  }),
  func: async ({ query }) => {
    try {
      const rows = await executeSqlQuery(query);
      return JSON.stringify(rows, null, 2);
    } catch (err) {
      return "Lỗi khi chạy công cụ này, hãy dừng lại và báo cho người dùng biết.";
    }
  },
});

// Luồng Text-to-SQL
async function handleServerSqlQuery(question) {
  console.log(`🤖 [Text-to-SQL Agent] Đang xử lý câu hỏi hạ tầng máy chủ IT: "${question}"`);

  let rawSql = "SELECT * FROM MayChu_EVN";
  const qLower = question.toLowerCase();

  if (qLower.includes("đắk lắk") || qLower.includes("dak")) {
    rawSql = "SELECT * FROM MayChu_EVN WHERE KhuVuc LIKE '%Đắk Lắk%'";
  } else if (qLower.includes("hà nội") || qLower.includes("hnx")) {
    rawSql = "SELECT * FROM MayChu_EVN WHERE KhuVuc LIKE '%Hà Nội%'";
  } else if (qLower.includes("hồ chí minh") || qLower.includes("sgn") || qLower.includes("hcm")) {
    rawSql = "SELECT * FROM MayChu_EVN WHERE KhuVuc LIKE '%Hồ Chí Minh%'";
  } else if (qLower.includes("chi phí")) {
    rawSql = "SELECT * FROM MayChu_EVN";
  }

  const sqlToolResult = await querySqlDatabaseTool.invoke({ query: rawSql });

  let rows = [];
  try {
    rows = JSON.parse(sqlToolResult);
  } catch (e) {
    return { answer: sqlToolResult, sources: [] };
  }

  let answerText = "";
  if (!rows || rows.length === 0) {
    answerText = "Tài liệu hệ thống không tìm thấy máy chủ nào phù hợp với yêu cầu.";
  } else {
    answerText = `Dưới đây là thông tin hạ tầng máy chủ EVN trích xuất từ CSDL SQLite (\`evn_database.sqlite\`):\n\n` +
      rows.map(r =>
        `- **Mã máy chủ**: \`${r.MaMayChu}\` | **Khu vực**: ${r.KhuVuc} | **Loại**: ${r.LoaiMayChu} | **Uptime**: ${r.Uptime} | **Trạng thái**: ${r.TrangThai} | **Tổng chi phí**: ${Number(r.TongChiPhi).toLocaleString('vi-VN')} VNĐ`
      ).join("\n");
  }

  return {
    answer: answerText,
    sources: [
      {
        id: 1,
        pageContent: `Truy vấn SQL thực thi: ${rawSql}\nKết quả SQLite: ${sqlToolResult}`,
        metadata: { source: "evn_database.sqlite (Bảng MayChu_EVN)", sqlQuery: rawSql },
      },
    ],
  };
}

// 🎯 6. Hàm askQuestion với similaritySearch chuẩn Semantic Vector Store
export async function askQuestion(question) {
  if (!isInitialized || !llmModel || !vectorStore) {
    await initializeRAG();
  }

  const qLower = question.toLowerCase();
  const isITServerQuery = (
    qLower.includes("máy chủ") ||
    qLower.includes("server") ||
    qLower.includes("chi phí hạ tầng") ||
    qLower.includes("chi phí máy chủ") ||
    qLower.includes("uptime") ||
    qLower.includes("sgn-web") ||
    qLower.includes("dak-dbs") ||
    qLower.includes("hnx-app") ||
    qLower.includes("maychu_evn")
  ) && !qLower.includes("cắt điện") && !qLower.includes("bảo trì điện");

  if (isITServerQuery) {
    return await handleServerSqlQuery(question);
  }

  try {
    // 🔎 Tìm kiếm Semantic Vector Similarity Search 5 đoạn ngữ nghĩa phù hợp nhất
    const docs = await vectorStore.similaritySearch(question, 5);
    const contextText = docs.map((d) => d.pageContent).join("\n\n---\n\n");

    const systemPromptText = `Bạn là công cụ Trích Xuất Dữ Liệu nội bộ của EVN.
Nhiệm vụ của bạn là trả lời câu hỏi CHỈ DỰA VÀO phần Ngữ cảnh (Context) bên dưới.
NGHIÊM CẤM sử dụng kiến thức bên ngoài. NGHIÊM CẤM tự định nghĩa, giải thích các khái niệm chung chung hoặc bịa đặt thông tin.
Nếu Ngữ cảnh không chứa dữ liệu chính xác để trả lời, BẮT BUỘC chỉ in ra ĐÚNG 1 CÂU SAU ĐÂY và DỪNG LẠI: "Dựa trên tài liệu nội bộ, tôi không tìm thấy thông tin cụ thể để trả lời câu hỏi này."

Ngữ cảnh:
${contextText}`;

    console.log("🔍 [DEBUG RAG]:\n", contextText);

    const messages = [
      new SystemMessage(systemPromptText),
      new HumanMessage(question)
    ];
    const res = await llmModel.invoke(messages);
    const answerContent = (res.content || String(res)).trim();

    const sources = docs.map((doc, idx) => ({
      id: idx + 1,
      pageContent: doc.pageContent,
      metadata: doc.metadata || { source: "evn_knowledge.md" },
    }));

    return {
      answer: answerContent,
      sources,
    };
  } catch (err) {
    const errStr = String(err?.message || err);
    console.error("❌ Lỗi RAG Engine:", errStr);

    return {
      answer: `⚠️ Hệ thống tạm thời bận: ${errStr}. Vui lòng thử lại sau ít phút!`,
      sources: [],
    };
  }
}
