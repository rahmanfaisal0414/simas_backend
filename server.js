const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

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

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/metode-pembayaran', metodePembayaranRoutes);
app.use('/api/pelanggan', pelangganRoutes);
app.use('/api/pemasok', pemasokRoutes);
app.use('/api/barang', barangRoutes);
app.use('/api/stok-masuk', stokMasukRoutes);
app.use('/api/stok-keluar', stokKeluarRoutes);
app.use('/api/stok-audit', stokAuditRoutes); 
app.use('/api/laporan', laporanRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));