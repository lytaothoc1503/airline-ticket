/**
 * FlightBook Backend API
 * Chạy: node server/index.js  (port 3001)
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');
const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo file data nếu chưa có
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { bookings: [], flights: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ===== BOOKINGS =====
app.get('/api/bookings', (_req, res) => {
  const data = loadData();
  res.json(data.bookings);
});

app.get('/api/bookings/:code', (req, res) => {
  const data = loadData();
  const booking = data.bookings.find(
    b => b.bookingCode === req.params.code.toUpperCase()
  );
  if (!booking) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json(booking);
});

app.post('/api/bookings', (req, res) => {
  const data = loadData();
  const booking = { ...req.body, id: req.body.id || `BK${Date.now()}` };
  data.bookings.push(booking);
  saveData(data);
  console.log(`[+] Booking ${booking.bookingCode} saved`);
  res.status(201).json(booking);
});

app.patch('/api/bookings/:id/cancel', (req, res) => {
  const data = loadData();
  const idx = data.bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy' });
  data.bookings[idx].status = 'cancelled';
  saveData(data);
  res.json(data.bookings[idx]);
});

// ===== STATS (Admin) =====
app.get('/api/stats', (_req, res) => {
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

// ===== FLIGHTS (optional sync) =====
app.get('/api/flights', (_req, res) => {
  const data = loadData();
  res.json(data.flights);
});

app.post('/api/flights', (req, res) => {
  const data = loadData();
  const flight = { ...req.body, id: req.body.id || `FL${Date.now()}` };
  data.flights.push(flight);
  saveData(data);
  res.status(201).json(flight);
});

app.listen(PORT, () => {
  console.log(`\n✈️  FlightBook API đang chạy tại http://localhost:${PORT}`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/bookings`);
  console.log(`   POST /api/bookings`);
  console.log(`   GET  /api/stats\n`);
});
