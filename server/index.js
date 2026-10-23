/**
 * FlightBook Backend API
 * Chạy: ADMIN_KEY=matkhau node server/index.js  (port 3001)
 * Không đặt ADMIN_KEY thì server tự sinh khóa ngẫu nhiên và in ra console.
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');
const PORT = 3001;

const ADMIN_KEY = process.env.ADMIN_KEY || crypto.randomBytes(9).toString('base64url');
const KEY_IS_GENERATED = !process.env.ADMIN_KEY;

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

const app = express();
app.use(
  cors({
    origin(origin, cb) {
      // Cho phép công cụ không có Origin (curl) và các nguồn local đã khai báo
      cb(null, !origin || ALLOWED_ORIGINS.has(origin));
    },
  })
);
app.use(express.json({ limit: '100kb' }));

// ===== Lưu trữ =====
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { bookings: [], flights: [] };
    saveData(initial);
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

// Ghi qua file tạm rồi đổi tên để không hỏng data.json nếu bị ngắt giữa chừng
function saveData(data) {
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// ===== Xác thực admin =====
function requireAdmin(req, res, next) {
  const given = Buffer.from(String(req.get('x-admin-key') || ''));
  const expected = Buffer.from(ADMIN_KEY);
  const ok = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!ok) return res.status(401).json({ error: 'Cần quyền admin' });
  next();
}

// ===== Kiểm tra dữ liệu đơn =====
const isStr = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.length <= max;

function sanitizeBooking(body) {
  if (!body || typeof body !== 'object') return { error: 'Dữ liệu không hợp lệ' };

  if (!/^[A-Z2-9]{6}$/.test(String(body.bookingCode || ''))) return { error: 'Mã đặt chỗ không hợp lệ' };
  if (!Array.isArray(body.passengers) || body.passengers.length < 1 || body.passengers.length > 9)
    return { error: 'Số hành khách phải từ 1 đến 9' };

  const passengers = [];
  for (const p of body.passengers) {
    if (!p || !isStr(p.fullName, 2, 80) || !isStr(p.idNumber, 8, 20))
      return { error: 'Thông tin hành khách không hợp lệ' };
    passengers.push({
      id: String(p.id || '').slice(0, 20),
      fullName: p.fullName.trim(),
      dateOfBirth: String(p.dateOfBirth || '').slice(0, 10),
      gender: ['male', 'female', 'other'].includes(p.gender) ? p.gender : 'other',
      idNumber: p.idNumber.trim(),
      type: ['adult', 'child', 'infant'].includes(p.type) ? p.type : 'adult',
    });
  }

  const contact = body.contact || {};
  if (!isStr(contact.email, 5, 120) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
    return { error: 'Email không hợp lệ' };
  if (!isStr(contact.phone, 9, 20) || contact.phone.replace(/\D/g, '').length < 9)
    return { error: 'Số điện thoại không hợp lệ' };

  const total = Number(body.totalPrice);
  const tax = Number(body.tax);
  if (!Number.isFinite(total) || total <= 0 || total > 1e9) return { error: 'Tổng tiền không hợp lệ' };
  if (!Number.isFinite(tax) || tax < 0 || tax > total) return { error: 'Thuế không hợp lệ' };

  const outbound = body.flights?.outbound;
  if (!outbound || !outbound.from?.code || !outbound.to?.code) return { error: 'Thiếu chuyến bay chiều đi' };

  return {
    booking: {
      id: `BK${Date.now()}${crypto.randomInt(100, 999)}`,
      bookingCode: body.bookingCode,
      createdAt: new Date().toISOString(),
      flights: { outbound, return: body.flights.return || undefined },
      passengers,
      contact: { email: contact.email.trim(), phone: contact.phone.trim() },
      seats: Array.isArray(body.seats) ? body.seats.slice(0, 9) : [],
      cabin: ['economy', 'business', 'first'].includes(body.cabin) ? body.cabin : 'economy',
      totalPrice: total,
      tax,
      // Trạng thái do server quyết định, không tin dữ liệu client gửi lên
      status: 'confirmed',
      paymentMethod: ['qr', 'card'].includes(body.paymentMethod) ? body.paymentMethod : undefined,
    },
  };
}

// ===== Health =====
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Kiểm tra khóa admin (dùng cho màn đăng nhập)
app.get('/api/admin/check', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

// ===== BOOKINGS =====
app.get('/api/bookings', requireAdmin, (_req, res) => {
  res.json(loadData().bookings);
});

// Tra cứu theo mã: chỉ trả thông tin tối thiểu, không lộ CCCD/email/SĐT
app.get('/api/bookings/:code', (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const b = loadData().bookings.find(x => x.bookingCode === code);
  if (!b) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json({
    bookingCode: b.bookingCode,
    status: b.status,
    flights: b.flights,
    seats: b.seats,
    passengers: b.passengers.map(p => ({ id: p.id, fullName: p.fullName })),
  });
});

app.post('/api/bookings', (req, res) => {
  const { booking, error } = sanitizeBooking(req.body);
  if (error) return res.status(400).json({ error });

  const data = loadData();
  if (data.bookings.some(b => b.bookingCode === booking.bookingCode))
    return res.status(409).json({ error: 'Mã đặt chỗ đã tồn tại' });

  data.bookings.push(booking);
  saveData(data);
  console.log(`[+] Booking ${booking.bookingCode} saved`);
  res.status(201).json(booking);
});

app.patch('/api/bookings/:id/cancel', requireAdmin, (req, res) => {
  const data = loadData();
  const idx = data.bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy' });
  data.bookings[idx].status = 'cancelled';
  saveData(data);
  res.json(data.bookings[idx]);
});

// ===== STATS (Admin) =====
app.get('/api/stats', requireAdmin, (_req, res) => {
  const data = loadData();
  const confirmed = data.bookings.filter(b => b.status === 'confirmed');
  const revenue = confirmed.reduce((s, b) => s + (b.totalPrice || 0), 0);
  const passengers = confirmed.reduce((s, b) => s + (b.passengers?.length || 0), 0);
  res.json({
    totalBookings: confirmed.length,
    revenue,
    passengers,
    cancelled: data.bookings.filter(b => b.status === 'cancelled').length,
  });
});

// ===== FLIGHTS =====
app.get('/api/flights', (_req, res) => {
  res.json(loadData().flights);
});

app.post('/api/flights', requireAdmin, (req, res) => {
  const data = loadData();
  const flight = { ...req.body, id: req.body?.id || `FL${Date.now()}` };
  data.flights.push(flight);
  saveData(data);
  res.status(201).json(flight);
});

app.listen(PORT, () => {
  console.log(`\n✈️  FlightBook API đang chạy tại http://localhost:${PORT}`);
  console.log(`   Khóa admin: ${ADMIN_KEY}${KEY_IS_GENERATED ? '  (tự sinh, đổi mỗi lần chạy – đặt ADMIN_KEY để cố định)' : ''}\n`);
});
