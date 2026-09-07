import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "evn_database.sqlite");

export function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("❌ Lỗi mở kết nối SQLite Database:", err);
        return reject(err);
      }
    });

    console.log(`🗄️ [SQLite] Đang khởi tạo Database tại: ${dbPath}`);

    db.serialize(() => {
      // Tạo bảng MayChu_EVN
      db.run(`
        CREATE TABLE IF NOT EXISTS MayChu_EVN (
          MaMayChu TEXT PRIMARY KEY,
          KhuVuc TEXT NOT NULL,
          LoaiMayChu TEXT NOT NULL,
          Uptime TEXT NOT NULL,
          TrangThai TEXT NOT NULL,
          TongChiPhi INTEGER NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error("❌ Lỗi tạo bảng MayChu_EVN:", err);
          return reject(err);
        }
      });

      // Xóa dữ liệu cũ để nạp mới mẫu
      db.run(`DELETE FROM MayChu_EVN`);

      // Chèn các dòng dữ liệu hạ tầng mẫu
      const stmt = db.prepare(`
        INSERT INTO MayChu_EVN (MaMayChu, KhuVuc, LoaiMayChu, Uptime, TrangThai, TongChiPhi)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const sampleData = [
        ["SGN-WEB-01", "TP. Hồ Chí Minh", "Web Server", "99.9%", "Tốt", 550000],
        ["DAK-DBS-02", "Đắk Lắk", "Database", "98.5%", "Bảo trì", 1008000],
        ["HNX-APP-01", "Hà Nội", "App Server", "99.5%", "Ổn định", 896000],
      ];

      for (const row of sampleData) {
        stmt.run(row);
      }

      stmt.finalize((err) => {
        if (err) {
          console.error("❌ Lỗi chèn dữ liệu vào bảng MayChu_EVN:", err);
          return reject(err);
        }
        console.log("✅ [SQLite] Đã khởi tạo bảng MayChu_EVN và chèn 3 bản ghi hạ tầng thành công!");
        db.close();
        resolve(dbPath);
      });
    });
  });
}

// Nếu chạy file này trực tiếp từ CLI: node initDB.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDatabase().catch(console.error);
}
