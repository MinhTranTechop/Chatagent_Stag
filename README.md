# ⚡ EVN AI Agent - Hệ Thống Hỏi Đáp Tài Liệu Nội Bộ (RAG PoC)

Dự án Proof-of-Concept (PoC) về hệ thống **RAG (Retrieval-Augmented Generation)** tra cứu và hỏi đáp tài liệu quy định an toàn điện nội bộ của EVN (Tập đoàn Điện lực Việt Nam). Built for technical presentation & interviews.

---

## 🏗️ Cấu Trúc Thư Mục Dự Án

```text
evn-ai-agent/
├── backend/                             # Express Server + LangChain RAG Service
│   ├── data/
│   │   └── quy-dinh-an-toan-dien.md     # Tài liệu nguồn dạng Markdown
│   ├── ragService.js                     # Pipeline: Load -> Chunk -> Embed -> Vector Store -> Gemini RAG
│   ├── server.js                         # API Express server (POST /api/chat)
│   ├── .env                              # Biến môi trường (GOOGLE_API_KEY, PORT)
│   └── package.json                      # Cấu hình ES Module & dependencies backend
├── frontend/                            # Web App ReactJS + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                # Header thương hiệu EVN & trạng thái kết nối
│   │   │   ├── ChatMessage.jsx           # Khung câu hỏi/câu trả lời & Accordion Trích dẫn Nguồn
│   │   │   └── ChatInput.jsx             # Ô nhập văn bản, phím tắt & Gợi ý câu hỏi
│   │   ├── App.jsx                       # Giao diện chính & quản lý hội thoại
│   │   ├── main.jsx                      # React Entry point
│   │   └── index.css                     # Tailwind CSS & Scrollbar custom
│   ├── index.html                        # HTML template
│   ├── vite.config.js                    # Cấu hình Vite & Proxy /api sang Backend (Port 5000)
│   ├── tailwind.config.js                # Theme & màu sắc chuẩn EVN
│   └── package.json                      # Dependencies Frontend (React, Lucide icons, Tailwind)
└── README.md                             # Hướng dẫn chạy dự án
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Backend
- **Core Framework**: Node.js, Express.js (ES Module)
- **AI / RAG Framework**: LangChain JS (`langchain`, `@langchain/google-genai`, `@langchain/core`, `@langchain/community`)
- **LLM Model**: Google Gemini (`gemini-1.5-flash`)
- **Embedding Model**: Google Text Embeddings (`text-embedding-004`)
- **Vector Store**: `MemoryVectorStore` (LangChain In-Memory Vector Store)
- **Document Chunking**: `RecursiveCharacterTextSplitter` (`chunkSize: 800`, `chunkOverlap: 150`)

### Frontend
- **Framework**: ReactJS 18 + Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Features**: Trích dẫn nguồn tài liệu tương tác (Collapsible Citation Accordion), câu hỏi gợi ý, tự động cuộn (Auto-scroll), giao diện ChatGPT Dark Mode.

---

## 🚀 Hướng Dẫn Cài Đặt Và Khởi Chạy

### 1. Cấu hình biến môi trường (Backend)
Tạo file `.env` nằm trong thư mục `backend/.env`:
```env
PORT=5000
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

### 2. Cài đặt thư viện (Dependencies)

**Cài đặt Backend:**
```bash
cd backend
npm install
```

**Cài đặt Frontend:**
```bash
cd ../frontend
npm install
```

---

### 3. Khởi chạy Hệ thống

#### Bước A: Khởi chạy Backend Server (Port 5000)
Mở một cửa sổ Terminal:
```bash
cd backend
npm start
```
*Khi khởi chạy, server sẽ đọc file `quy-dinh-an-toan-dien.md`, cắt nhỏ văn bản (chunking), gọi Gemini Embeddings và lưu vào Memory Vector Store.*

#### Bước B: Khởi chạy Frontend Web App (Port 3000)
Mở một cửa sổ Terminal thứ hai:
```bash
cd frontend
npm run dev
```

Sau khi cả 2 server đều chạy, truy cập đường dẫn: **`http://localhost:3000`** trên trình duyệt để trải nghiệm hệ thống!

---

## 📡 Chi Tiết API Endpoint (Backend)

### Endpoint: `POST /api/chat`
- **Mô tả**: Nhận câu hỏi từ Frontend, tìm kiếm đoạn tài liệu phù hợp trong Vector Store, gửi kèm prompt ngữ cảnh cho Gemini 1.5 Flash và trả về câu trả lời + danh sách đoạn trích dẫn nguồn.

#### Request Body:
```json
{
  "question": "Khoảng cách an toàn điện lưới 110kV là bao nhiêu?"
}
```

#### Response Output:
```json
{
  "success": true,
  "answer": "Khoảng cách an toàn tối thiểu đối với cấp điện áp từ 35 kV đến 110 kV là 1.50 mét.",
  "sources": [
    {
      "id": 1,
      "pageContent": "Cấp điện áp từ 35 kV đến 110 kV: Khoảng cách an toàn tối thiểu là 1.50 mét.",
      "metadata": {
        "source": "E:\\Me\\Codex\\evn-ai-agent\\backend\\data\\quy-dinh-an-toan-dien.md"
      }
    }
  ]
}
```

---

## 💡 Điểm Ăn Điểm Khi Phỏng Vấn Kỹ Thuật (Interview Highlights)

1. **Kiến trúc RAG chuẩn mực**:
   - Sử dụng `RecursiveCharacterTextSplitter` giúp cắt nhỏ dữ liệu mà không làm đứt đoạn ngữ cảnh câu/đoạn văn.
   - Sử dụng `GoogleGenerativeAIEmbeddings` (`text-embedding-004`) biến văn bản thành vector ma trận nhiều chiều.
2. **Strict Grounding Prompting**:
   - Cấu hình Prompt ép Gemini trả lời 100% dựa vào dữ liệu ngữ cảnh (Context), nếu không tìm thấy sẽ thông báo *"Tôi không tìm thấy thông tin này trong tài liệu"* thay vì tự ý bịa câu trả lời (Anti-Hallucination).
3. **Nguồn trích dẫn minh bạch (Explainable AI / Citation UI)**:
   - Trả về kèm danh sách chunk gốc từ Vector Database giúp người dùng thẩm định tính chính xác của câu trả lời.