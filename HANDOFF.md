# HANDOFF – FlightBook (Hệ thống đặt vé máy bay)

> Dán file này + folder `airline-ticket` (hoặc `FlightBook-full.zip`) vào chat mới  
> để AI đọc lại dự án và làm tiếp **không viết lại từ đầu**.

---

## 1. Dự án là gì

**FlightBook** – web đặt vé máy bay nội địa Việt Nam (mock data).

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + lucide-react |
| Backend | Express (API mock, port 3001), lưu JSON |
| Preview | HTML/JS thuần + `preview_server.py` (port 8765) – không cần npm |

**Không phải:** API hãng bay thật, thanh toán thật, host public.

---

## 2. Cấu trúc file (không thiếu)

```
airline-ticket/
├── HANDOFF.md              ← file này
├── MANIFEST.txt
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # Điều hướng màn hình, dark mode, booking state
│   ├── index.css               # Design system (btn, card, chip, dark)
│   ├── types/flight.ts         # Flight, Booking, SearchParams, Filters…
│   ├── data/mockFlights.ts     # 10 sân bay, 4 hãng, sinh chuyến, search, format
│   └── components/
│       ├── FlightSearch.tsx    # Form tìm kiếm + modal sân bay
│       ├── FlightCard.tsx      # Thẻ chuyến bay
│       ├── SortBar.tsx         # Tốt nhất / Rẻ / Nhanh / Sớm
│       ├── FilterBar.tsx       # Hãng, giờ, giá, bay thẳng
│       ├── BookingFlow.tsx     # 3 bước: HK → ghế → xác nhận
│       ├── PaymentStep.tsx     # QR / thẻ (giả lập)
│       ├── BookingConfirmation.tsx  # Vé điện tử + mã đặt chỗ
│       └── AdminDashboard.tsx  # Tổng quan, đơn, kho chuyến
├── server/
│   ├── package.json
│   └── index.js                # GET/POST bookings, stats, health
├── preview/
│   └── index.html              # Bản xem trước full flow (không React)
└── preview_server.py
```

---

## 3. Trạng thái đã làm xong

### UI/UX
- Tối giản, tham khảo Google Flights / Traveloka
- Dark mode (localStorage `theme`)
- Header blur, bottom nav, empty/loading state
- Responsive mobile

### Flow người dùng
1. Tìm (1 chiều / khứ hồi) → kết quả + sort + filter  
2. Chọn chiều đi (→ chiều về nếu khứ hồi)  
3. Thông tin hành khách + liên hệ (validate)  
4. Chọn ghế (sơ đồ, không đè ghế HK khác, auto chuyển HK)  
5. Xác nhận giá (vé + thuế 10%)  
6. Thanh toán giả lập QR/thẻ  
7. Vé điện tử + mã 6 ký tự + copy  

### Logic đã fix
- Sinh chuyến **đúng ngày** tìm (không lệch ± ngày)
- Khứ hồi sinh thêm theo **ngày về**
- So khớp ngày bằng **local date** (tránh lệch UTC)
- Chặn chọn chuyến khi `seatsAvailable < số khách`
- Reset filter khi sang chọn chiều về
- localStorage bookings: try/catch + kiểm tra array
- ID chuyến unique

### Admin
- Icon Settings trên header
- Thống kê, danh sách đơn, hủy đơn, kho chuyến mock

### Backend
- `POST/GET /api/bookings`, `GET /api/stats`, `GET /api/health`
- Frontend fallback localStorage nếu API tắt

---

## 4. Cách chạy (máy local)

```bash
# App React
cd airline-ticket
npm install
npm run dev
# → http://localhost:5173

# API (terminal 2, tùy chọn)
cd airline-ticket/server
npm install
npm start
# → http://localhost:3001

# Preview HTML (không cần npm)
cd airline-ticket
python3 preview_server.py
# → http://127.0.0.1:8765  (chỉ trên máy đang chạy server)
```

**Lưu ý:** `127.0.0.1` trên điện thoại **không** mở được server máy tính.  
Muốn xem trên phone: cùng Wi‑Fi + `http://IP-máy-tính:8765` hoặc deploy public.

---

## 5. Hạn chế còn lại (MVP)

- Một sơ đồ ghế (không chọn ghế riêng chiều về)
- “Vé của tôi” chỉ mở booking **gần nhất**
- Giá / ghế / chuyến là mock
- Thanh toán không trừ tiền thật
- Chưa deploy production

---

## 6. Hướng dẫn cho AI trong chat mới

1. Đọc `HANDOFF.md` + `MANIFEST.txt` + `README.md` trước.  
2. **Không** scaffold lại project nếu các file trên đã có.  
3. Sửa từng file hiện có; giữ design system trong `index.css`.  
4. Một task một lần; sau khi sửa, nêu file đã đụng.  
5. Test logic ngày bay / khứ hồi / ghế nếu đụng `mockFlights.ts` hoặc `BookingFlow.tsx`.

### Tin nhắn mẫu user dán kèm zip

```
Dự án FlightBook – đính kèm airline-ticket / FlightBook-full.zip.
Đọc HANDOFF.md rồi làm tiếp: [MÔ TẢ VIỆC CỤ THỂ].
Không viết lại toàn bộ trừ khi file thiếu.
```

---

## 7. Việc nên làm tiếp (gợi ý)

| Ưu tiên | Việc |
|--------|------|
| P0 | Chạy `npm install && npm run dev` trên máy, xác nhận app lên |
| P1 | List “Vé của tôi” đầy đủ (mọi booking trong localStorage) |
| P1 | Chọn ghế chiều về (roundtrip) |
| P2 | Đồng bộ UI Admin với design system mới |
| P2 | Deploy Vercel (frontend) để mở bằng link trên điện thoại |
| P3 | Backend + DB thật / auth user |

---

## 8. File đóng gói

- Folder: `airline-ticket/`
- Zip: `FlightBook-full.zip` (artifacts) – đủ source, không gồm `node_modules`

**Cập nhật handoff:** 2026-10-22  
**Stack mục tiêu:** bán vé máy bay nội địa VN, mock, UI production-like.
