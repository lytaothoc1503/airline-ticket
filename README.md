# FlightBook – Hệ thống đặt vé máy bay nội địa

Ứng dụng web đặt vé máy bay nội địa Việt Nam (dữ liệu mô phỏng).
**React 18 · TypeScript · Vite · Tailwind CSS · Express**

> ⚠️ Đây là bản demo/MVP: chuyến bay, giá, ghế đều là dữ liệu giả lập; thanh toán không trừ tiền thật; chưa kết nối API hãng bay.

## Tính năng

**Người dùng**
- Tìm chuyến 1 chiều / khứ hồi (10 sân bay, 4 hãng bay, chuyến được sinh theo đúng ngày tìm)
- Lọc: hãng bay, khung giờ, khoảng giá, bay thẳng
- Sắp xếp: Tốt nhất / Rẻ nhất / Nhanh nhất / Sớm nhất
- Đặt vé 3 bước: thông tin hành khách → chọn ghế → xác nhận giá (vé + thuế 10%)
- Thanh toán giả lập (QR / thẻ)
- Vé điện tử dạng boarding pass kèm mã đặt chỗ 6 ký tự
- Dark mode, giao diện responsive

**Admin** (biểu tượng ⚙️ trên header)
- Thống kê: doanh thu, số đơn, số hành khách
- Quản lý đơn: tìm kiếm, hủy đơn
- Kho chuyến bay

**Backend (tùy chọn)**
- Express API lưu booking vào `server/data.json`
- Frontend tự dùng `localStorage` khi API không chạy

## Yêu cầu

- Node.js 18 trở lên
- Python 3 (chỉ khi dùng bản preview HTML)

## Cài đặt và chạy

### 1. Frontend

```bash
npm install
npm run dev
```
Mở http://localhost:5173

### 2. Backend (tùy chọn, mở terminal thứ 2)

```bash
cd server
npm install
npm start
```
API chạy tại http://localhost:3001. Nếu đã cài `server/node_modules`, có thể chạy `npm run server` từ thư mục gốc (`npm run server:dev` để tự khởi động lại khi sửa code).

### 3. Preview HTML (không cần npm)

```bash
python preview_server.py
```
Mở http://127.0.0.1:8765. Muốn xem trên điện thoại, dùng cùng Wi‑Fi và truy cập `http://<IP-máy-tính>:8765`.

### Các lệnh npm

| Lệnh | Tác dụng |
|------|----------|
| `npm run dev` | Chạy frontend (Vite) |
| `npm run build` | Kiểm tra kiểu TypeScript và build ra `dist/` |
| `npm run preview` | Chạy thử bản build |
| `npm run server` | Chạy API Express |
| `npm run server:dev` | Chạy API, tự tải lại khi sửa |

## API

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Kiểm tra server |
| GET | `/api/bookings` | Danh sách đơn |
| POST | `/api/bookings` | Tạo đơn mới |
| GET | `/api/bookings/:code` | Tra cứu theo mã đặt chỗ |
| PATCH | `/api/bookings/:id/cancel` | Hủy đơn |
| GET | `/api/stats` | Thống kê doanh thu (chỉ tính đơn `confirmed`) |
| GET | `/api/flights` | Danh sách chuyến lưu trên server |
| POST | `/api/flights` | Thêm chuyến |

Các endpoint admin (`GET /api/bookings`, `/api/stats`, `PATCH .../cancel`, `POST /api/flights`, `GET /api/admin/check`) cần header `x-admin-key`. Đặt khóa bằng biến môi trường `ADMIN_KEY` (PowerShell: `$env:ADMIN_KEY='matkhau'; npm run server`); không đặt thì server tự sinh khóa và in ra console. `GET /api/bookings/:code` chỉ trả thông tin tối thiểu (không có CCCD, email, SĐT). `POST /api/bookings` được kiểm tra dữ liệu, chặn trùng mã và luôn đặt trạng thái do server quyết định. CORS chỉ cho phép localhost:5173/4173. Vẫn là bản demo, không dùng cho dữ liệu khách thật.

## Cấu trúc thư mục

```
airline-ticket/
├── src/
│   ├── main.tsx
│   ├── App.tsx                     # Điều hướng màn hình, dark mode, state đặt vé
│   ├── index.css                   # Design system (btn, card, chip, dark)
│   ├── types/flight.ts             # Flight, Booking, SearchParams, Filters…
│   ├── data/mockFlights.ts         # Sân bay, hãng bay, sinh chuyến, tìm kiếm, định dạng
│   └── components/
│       ├── FlightSearch.tsx        # Form tìm kiếm + chọn sân bay
│       ├── FlightCard.tsx          # Thẻ chuyến bay
│       ├── SortBar.tsx
│       ├── FilterBar.tsx
│       ├── BookingFlow.tsx         # Hành khách → ghế → xác nhận
│       ├── PaymentStep.tsx         # Thanh toán QR / thẻ giả lập
│       ├── BookingConfirmation.tsx # Vé điện tử
│       └── AdminDashboard.tsx
├── server/                         # Express API (package.json riêng)
│   └── index.js
├── preview/index.html              # Bản xem trước thuần HTML/JS
├── preview_server.py               # Server tĩnh cho bản preview (port 8765)
├── HANDOFF.md                      # Ghi chú bàn giao cho AI/người làm tiếp
└── MANIFEST.txt                    # Danh mục file
```

## Hạn chế đã biết

- Chỉ có một sơ đồ ghế, không chọn ghế riêng cho chiều về
- "Vé của tôi" chỉ mở booking gần nhất
- Dữ liệu và thanh toán là giả lập; chưa deploy production, chưa có đăng nhập người dùng

## Hướng phát triển

1. Danh sách "Vé của tôi" đầy đủ
2. Chọn ghế chiều về
3. Đồng bộ giao diện Admin với design system mới
4. Deploy frontend (ví dụ Vercel)
5. Backend với cơ sở dữ liệu thật và xác thực

Chi tiết hơn cho người/AI làm tiếp: xem [HANDOFF.md](HANDOFF.md).
