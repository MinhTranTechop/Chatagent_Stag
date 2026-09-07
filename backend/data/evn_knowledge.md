# HỆ THỐNG TRI THỨC NỘI BỘ TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM (EVN)
*Lưu ý: EVN là viết tắt của Tập đoàn Điện lực Việt Nam. Mọi truy vấn về "điện lực" hoặc "EVN" đều dùng chung cơ sở dữ liệu này.*

## PHẦN 1: THÔNG TIN LÃNH ĐẠO NHÀ NƯỚC (CẬP NHẬT 2024)
- **Tô Lâm**: Đương nhiệm chức vụ Tổng Bí thư Ban Chấp hành Trung ương Đảng Cộng sản Việt Nam (từ tháng 8/2024 đến nay).
- **Phạm Minh Chính**: Đương nhiệm chức vụ Thủ tướng Chính phủ nước Cộng hòa xã hội chủ nghĩa Việt Nam (từ năm 2021 đến nay).
- **Trần Thanh Mẫn**: Đương nhiệm chức vụ Chủ tịch Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam (từ tháng 5/2024 đến nay).

## PHẦN 2: THÔNG TIN LÃNH ĐẠO TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM (EVN)
- **Nguyễn Anh Tuấn**: Đương nhiệm chức vụ Tổng Giám đốc Tập đoàn Điện lực Việt Nam (EVN) từ tháng 12/2023 đến nay.
- **Đặng Hoàng An**: Đương nhiệm chức vụ Chủ tịch Hội đồng thành viên (HĐTV) Tập đoàn Điện lực Việt Nam (EVN) từ tháng 07/2023 đến nay.
- **Trần Đình Nhân**: Nguyên Tổng Giám đốc Tập đoàn Điện lực Việt Nam (EVN), nhiệm kỳ công tác từ năm 2018 đến tháng 12/2023.

## PHẦN 3: LÃNH ĐẠO ĐIỆN LỰC EVN BA MIỀN (BẮC - TRUNG - NAM)
- **Tổng công ty Điện lực miền Bắc (EVNNPC)**: Giám đốc / Tổng Giám đốc hiện tại là ông **Nguyễn Đức Thiện** (nhiệm kỳ 2021 - nay). Trụ sở điều hành đặt tại Hà Nội.
- **Tổng công ty Điện lực miền Trung (EVNCPC)**: Giám đốc / Tổng Giám đốc hiện tại là ông **Ngô Tấn Cư** (nhiệm kỳ 2019 - nay). Trụ sở điều hành đặt tại Đà Nẵng.
- **Tổng công ty Điện lực miền Nam (EVNSPC)**: Giám đốc / Tổng Giám đốc hiện tại là ông **Nguyễn Phước Đức** (nhiệm kỳ 2020 - nay). Trụ sở điều hành đặt tại TP. Hồ Chí Minh.

## PHẦN 4: HẠ TẦNG MẠNG VÀ ROUTING NỘI BỘ (DATA CENTER EVN)
- **Kiến trúc Core Network**: Trung tâm dữ liệu EVN sử dụng thiết bị Core Switch Cisco Nexus 9000 chạy kiến trúc Spine-Leaf để đảm bảo băng thông cao và chống nghẽn mạng.
- **Giao thức định tuyến (Routing Protocol)**: 
  - Mạng nội bộ (LAN/WAN nội vùng) sử dụng giao thức **OSPFv3** để định tuyến động, đảm bảo thời gian hội tụ nhanh khi có sự cố đứt cáp.
  - Kết nối liên vùng giữa 3 miền Bắc - Trung - Nam sử dụng giao thức **BGP** (Border Gateway Protocol) để quản lý các bảng định tuyến quy mô lớn.
- **Phân hoạch VLAN và IP LAN**:
  - **VLAN 10 (Server Farm)**: Dải IP `10.10.10.0/24`. Dành riêng cho hệ thống máy chủ cơ sở dữ liệu (Database) và ứng dụng nội bộ.
  - **VLAN 20 (Nhân sự & Client)**: Dải IP `10.10.20.0/23`. Dành cho máy tính cán bộ công nhân viên tại trụ sở chính.
  - **VLAN 99 (Management)**: Dải IP `192.168.99.0/24`. Dải mạng quản trị độc quyền dành riêng cho đội ngũ IT (Sysadmin) để SSH/Truy cập các thiết bị mạng.

## PHẦN 5: QUY TRÌNH SAO LƯU VÀ PHỤC HỒI THẢM HỌA (DISASTER RECOVERY - DR)
- **Chính sách Backup Database**: Toàn bộ cơ sở dữ liệu hóa đơn điện tử và thông tin khách hàng phải được sao lưu định kỳ Full-Backup vào lúc 02:00 AM Chủ Nhật hàng tuần, và Incremental-Backup vào 01:00 AM các ngày trong tuần.
- **Cam kết SLA (Service Level Agreement)**: Khi xảy ra sự cố sập mạng LAN hoặc lỗi máy chủ Core, đội ngũ IT phải đảm bảo thời gian phục hồi dịch vụ (RTO - Recovery Time Objective) tối đa không quá 45 phút. Thời điểm khôi phục dữ liệu (RPO - Recovery Point Objective) tối đa không quá 15 phút so với thời điểm xảy ra sự cố.