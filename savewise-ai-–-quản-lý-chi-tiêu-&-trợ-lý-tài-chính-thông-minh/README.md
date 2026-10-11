# SAVEWISE AI – Chi tiêu thông minh, Tiết kiệm có mục tiêu, Sống hợp lý

Nền tảng quản lý tài chính cá nhân toàn diện kết hợp trợ lý AI dành cho học sinh, sinh viên, người mới đi làm và bất kỳ ai muốn làm chủ dòng tiền cá nhân.

---

## 1. CÔNG NGHỆ SỬ DỤNG

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4.
- **Biểu tượng & Giao diện**: Lucide React, bố cục Sidebar đa nền tảng (Desktop + Mobile Responsive Drawer & Bottom Bar).
- **Backend & AI API**: Node.js, Express, tsx, Google GenAI SDK (`@google/genai`).
- **Mô hình AI**: `gemini-3.8-flash` kết hợp cơ chế fallback dự phòng `gemini-3.1-flash-lite`.
- **Lưu trữ dữ liệu**: Module lưu trữ phân tầng `src/services/storage.ts` trên LocalStorage với versioning schema, hỗ trợ sao lưu / phục hồi tệp JSON và xuất tệp CSV.

---

## 2. QUY TẮC TÍNH TOÁN TÀI CHÍNH CHUẨN HÓA (`src/services/finance.ts`)

Hệ thống tuân thủ nghiêm ngặt các nguyên tắc tài chính cốt lõi:
1. **Số dư thực tế**: `Số dư thực tế = Số dư ban đầu + Tổng thu nhập thực tế - Tổng chi tiêu thực tế`.
2. **Tiền đã phân bổ cho mục tiêu**: Khoản tiền người dùng dành riêng cho các quỹ tiết kiệm (đóng góp vào mục tiêu là phân bổ nội bộ, **không** làm mất tổng số dư thực tế và **không** bị tính thành chi tiêu).
3. **Quỹ dự phòng**: Khoản tiền chủ động dành riêng cho trường hợp khẩn cấp (sửa xe, thuốc men).
4. **Tiền chưa phân bổ**: `Số dư thực tế - Tiền đã phân bổ cho mục tiêu - Quỹ dự phòng`.
5. **Tiền có thể chi tiêu (Ngân sách linh hoạt)**: `Tiền chưa phân bổ - Các khoản bắt buộc chưa thanh toán trong kỳ`.
6. **Cảnh báo thiếu hụt**: Nếu tổng tiền phân bổ > Số dư thực tế, hệ thống lập tức hiển thị cảnh báo thiếu hụt và không tự ý âm thầm sửa số dư của người dùng.
7. **Ngân sách tham khảo mỗi ngày**: `max(0, Tiền có thể chi tiêu / Số ngày còn lại)` làm tròn xuống số nguyên VNĐ (tránh chia cho 0).

---

## 3. DANH SÁCH 9 MODULE CHỨC NĂNG ĐÃ HOÀN TẤT

### Module 1: Dashboard – Tổng quan
- 6 thẻ thống kê chuẩn: Số dư thực tế, Tiền chưa phân bổ, Tiền mục tiêu, Thu nhập tháng, Chi tiêu tháng, Tiền có thể tiêu.
- Thẻ mục tiêu tiết kiệm đang hoạt động với tiến độ và nút nạp/rút tiền nhanh.
- Biểu đồ cơ cấu chi tiêu thực tế theo danh mục (tính từ giao dịch thực, không dùng số liệu ảo).
- Nhật ký các hoạt động thu chi mới nhất.
- Tối đa 3 gợi ý trong ngày dựa trên dữ liệu thật với lý do và hành động đề xuất.

### Module 2: Quản lý Thu nhập & Chi tiêu
- Biểu mẫu ghi chép thu nhập và chi tiêu: Số tiền, ngày, danh mục chuẩn (Ăn uống, Đi lại, Học tập, Mua sắm, Sức khỏe, Lương, Tiền tiêu vặt...), ghi chú, phương thức thanh toán.
- Bộ lọc đa chiều: Lọc theo loại (Thu/Chi), danh mục, khoảng thời gian (Hôm nay, 7 ngày, 30 ngày, Tất cả), tìm kiếm từ khóa, sắp xếp mới nhất/cũ nhất.
- Chỉnh sửa và xóa giao dịch với hộp thoại xác nhận. Tự động đồng bộ số dư và ngân sách ngay lập tức.
- Xuất danh sách giao dịch ra tệp CSV.

### Module 3: Smart Goal – Mục tiêu tiết kiệm
- Đặt mục tiêu với thời hạn, mức độ ưu tiên, mô tả.
- Tính số tiền còn thiếu, phần trăm hoàn thành, số tiền cần tiết kiệm mỗi ngày / tuần / tháng.
- Thao tác nạp tiền và rút tiền nội bộ với lịch sử phân bổ chi tiết (`GoalAllocationHistory`).
- Đánh giá tính khả thi dựa trên hạn mức sinh hoạt thực tế.

### Module 4: Ngân sách hằng ngày
- Thiết lập hạn mức ngân sách theo từng danh mục (Ngày, Tuần, Tháng).
- Đo lường số tiền đã chi, số tiền còn lại và phần trăm sử dụng.
- Hệ thống cảnh báo 3 cấp độ: Cảnh báo nhẹ (70%), Cảnh báo rõ (85%), Vượt ngân sách (>100%).
- Quản lý các khoản chi bắt buộc (tiền trọ, điện nước, internet) có trạng thái đã trả / chưa trả.
- Quản lý Quỹ dự phòng khẩn cấp (Emergency Fund).

### Module 5: AI Money Coach
- Kết nối mô hình qua backend an toàn (`/api/ai/coach` & `/api/ai/chat`), tuyệt đối không để lộ API key ra frontend.
- Cung cấp ngữ cảnh tài chính thực tế: Số dư, hạn mức ngày, chi tiêu gần đây, mục tiêu đang theo đuổi.
- Các câu hỏi mẫu thông minh: *"Còn 200k cho 5 ngày"*, *"Có nên mua món đồ này không"*, *"Vì sao tháng này tiêu nhiều"*.
- Hộp thoại minh bạch dữ liệu giải thích rõ ràng các thông số được gửi tới AI.
- Nút làm mới lịch sử hội thoại.

### Module 6: Smart Meal – Thực đơn tiết kiệm
- Lập thực đơn theo ngân sách ngày/tuần, số người ăn, số ngày, số bữa, nguyên liệu có sẵn, dị ứng/kiêng cữ, có bếp nấu hay không.
- Phân biệt rõ chi phí mua ở chợ (market budget) và chi phí phần nguyên liệu tiêu thụ thực tế.
- Danh sách đi chợ gộp nguyên liệu trùng lặp kèm ô checkbox đã mua và cho phép chỉnh sửa giá nguyên liệu theo thực tế chợ địa phương.
- Nút ghi chép chi phí bữa ăn vào sổ thu chi chỉ với 1 click.

### Module 7 & 8: Thói quen chi tiêu & Trợ lý mua hàng
- Nhận diện danh mục chi lớn nhất, các khoản chi lặp lại thường xuyên, những ngày chi tiêu cao điểm.
- Trợ lý đánh giá món đồ trước khi quẹt thẻ: Quy đổi ra số ngày tiền ăn sinh viên, tỷ lệ số dư, câu hỏi tự vấn theo quy tắc hoãn 72 giờ.

### Module 9: Báo cáo & Xuất dữ liệu
- Báo cáo theo ngày, 30 ngày qua và toàn bộ lịch sử.
- Định dạng sẵn sàng cho máy in hoặc xuất PDF (`window.print()`).
- Xuất tệp CSV cho bảng thu chi.
- Xuất tệp sao lưu JSON toàn bộ hệ thống.

### Module 10: Cài đặt & Quyền riêng tư
- Đặt số dư ban đầu, chu kỳ kế hoạch (số ngày), các ngưỡng cảnh báo (70%, 85%, 100%).
- Cập nhật sở thích ăn uống và điều kiện bếp nấu.
- Sao lưu và khôi phục dữ liệu từ tệp JSON (có kiểm tra cấu trúc, xác thực schema, cảnh báo trước khi ghi đè).
- Nạp dữ liệu mẫu demo của sinh viên để trải nghiệm tính năng.
- Nút xóa toàn bộ dữ liệu trên thiết bị (yêu cầu gõ chữ "XÓA HẾT" để xác nhận an toàn).

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Bước 1: Cài đặt các gói phụ thuộc
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường
Tạo tệp `.env` dựa trên `.env.example`:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=3000
```
*(Trong môi trường Google AI Studio Build, GEMINI_API_KEY được tự động tiêm từ bảng Secrets).*

### Bước 3: Chạy ứng dụng ở chế độ phát triển
```bash
npm run dev
```
Mở trình duyệt tại địa chỉ `http://localhost:3000`.

### Bước 4: Kiểm tra và Build dự án
```bash
npm run lint    # Kiểm tra TypeScript typecheck
npm run build   # Build ứng dụng cho môi trường production
```

---

## 5. DỊCH VỤ NGOÀI & XỬ LÝ DỰ PHÒNG

- **Google Gemini API**: Được gọi hoàn toàn từ server Node.js / Express.
- **Cơ chế Fallback thông minh**: Hệ thống ưu tiên `gemini-3.8-flash`, tự động chuyển tiếp sang `gemini-3.1-flash-lite` khi gặp tải cao điểm, và kích hoạt bộ tính toán ngữ cảnh tài chính nội bộ nếu mất kết nối mạng. Ứng dụng luôn hoạt động 100%, không bị treo hay báo lỗi gián đoạn.
