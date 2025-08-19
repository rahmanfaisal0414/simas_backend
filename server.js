const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const verifyToken = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const metodePembayaranRoutes = require('./routes/metodePembayaranRoutes');
const pelangganRoutes = require('./routes/pelangganRoutes');
const pemasokRoutes = require('./routes/pemasokRoutes');
const barangRoutes = require('./routes/barangRoutes');
const stokMasukRoutes = require('./routes/stokMasukRoutes');
const stokKeluarRoutes = require('./routes/stokKeluarRoutes');
const stokAuditRoutes = require('./routes/stokAuditRoutes'); 
const laporanRoutes = require('./routes/laporanRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use('/api/auth', authRoutes);
app.use('/api/kategori', verifyToken, kategoriRoutes);
app.use('/api/metode-pembayaran', verifyToken, metodePembayaranRoutes);
app.use('/api/pelanggan', verifyToken, pelangganRoutes);
app.use('/api/pemasok', verifyToken, pemasokRoutes);
app.use('/api/barang', verifyToken, barangRoutes);
app.use('/api/stok-masuk', verifyToken, stokMasukRoutes);
app.use('/api/stok-keluar', verifyToken, stokKeluarRoutes);
app.use('/api/stok-audit', verifyToken, stokAuditRoutes); 
app.use('/api/laporan', verifyToken, laporanRoutes);

app.use('/public', publicRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
