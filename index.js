import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

// Nạp biến môi trường từ file .env
dotenv.config();

async function runRAG() {
    console.log("1. Đang tải tài liệu PDF...");
    // Bước 1: Tiếp nhận dữ liệu (Load Document)
    // Thực tế có thể lấy từ Google Drive, S3, hoặc Database. Ở đây ta lấy từ file local.
    const loader = new PDFLoader("./tai-lieu-evn.pdf");
    const docs = await loader.load();

    console.log("2. Đang cắt nhỏ văn bản (Chunking)...");
    // Bước 2: Chuẩn hóa & Tổ chức dữ liệu (Chunking)
    // Tại sao dùng RecursiveCharacterTextSplitter? Vì nó cố gắng giữ trọn vẹn các đoạn văn (paragraph) 
    // trước khi phải cắt ngang câu, giúp AI không bị mất ngữ cảnh.
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, // Độ dài tối đa của 1 đoạn
        chunkOverlap: 200, // Cắt gối đầu nhau 200 ký tự để đoạn sau vẫn hiểu ngữ cảnh đoạn trước
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`   -> Đã cắt thành ${splitDocs.length} đoạn (chunks).`);

    console.log("3. Đang tạo Vector và lưu vào Vector Database...");
    // Bước 3: Nhúng (Embedding) và Lưu trữ vào Vector DB
    // Chúng ta dùng mô hình embedding-001 của Google để biến chữ thành ma trận số.
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", // Model nhúng văn bản mới nhất của Google
    });

    // Sử dụng MemoryVectorStore (lưu trên RAM) để làm PoC nhanh. 
    // Khi pv, bạn có thể nói: "Nếu đưa lên production, em sẽ thay cái này bằng Elasticsearch hoặc ChromaDB".
    const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

    console.log("4. Đang khởi tạo AI Model và Retrieval Chain...");
    // Bước 4: Khởi tạo LLM và Chuỗi truy hồi (Retrieval Chain)
    const model = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash", // Dùng bản flash cho tốc độ phản hồi nhanh
        temperature: 0, // Set = 0 để AI trả lời chính xác theo tài liệu, không sáng tạo lung tung
    });

    // Tạo Prompt Template để "ép" AI đóng vai trò cụ thể
    const prompt = ChatPromptTemplate.fromTemplate(`
    Bạn là một trợ lý AI nội bộ chuyên nghiệp của EVN.
    Hãy sử dụng các thông tin ngữ cảnh được cung cấp dưới đây để trả lời câu hỏi.
    Nếu bạn không biết câu trả lời từ ngữ cảnh này, hãy nói là "Tôi không tìm thấy thông tin trong tài liệu", đừng tự bịa ra câu trả lời.

    Ngữ cảnh tài liệu:
    {context}

    Câu hỏi của người dùng: {input}
    `);

    // Kết nối LLM với Prompt
    const combineDocsChain = await createStuffDocumentsChain({
        llm: model,
        prompt,
    });

    // Tạo bộ máy tìm kiếm (Retriever) để lôi dữ liệu từ Vector DB ra
    const retriever = vectorStore.asRetriever();

    // Kết nối bộ máy tìm kiếm với LLM
    const retrievalChain = await createRetrievalChain({
        combineDocsChain,
        retriever,
    });

    console.log("=======================================");
    console.log("HỆ THỐNG ĐÃ SẴN SÀNG! ĐANG XỬ LÝ CÂU HỎI...");
    console.log("=======================================\n");

    // Bước 5: Truy vấn và Đánh giá kết quả (Inference)
    const question = "Quy định về an toàn điện lưới bao gồm những điểm chính nào?"; // Thay bằng câu hỏi phù hợp với file PDF của bạn

    console.log(`Câu hỏi: ${question}`);
    const response = await retrievalChain.invoke({
        input: question,
    });

    console.log("\nAI Trả lời:");
    console.log(response.answer);

    // (Tính năng ăn điểm phỏng vấn: Trích dẫn nguồn)
    console.log("\n--- Nguồn trích dẫn (Context Used) ---");
    response.context.forEach((doc, index) => {
        // Log ra xem AI đã lấy đoạn nào trong file PDF để tạo ra câu trả lời trên
        console.log(`\nNguồn ${index + 1} (Trang ${doc.metadata.loc.pageNumber}):`);
        console.log(doc.pageContent.substring(0, 150) + "..."); // In ra 150 ký tự đầu tiên của đoạn chunk
    });
}

runRAG().catch(console.error);
