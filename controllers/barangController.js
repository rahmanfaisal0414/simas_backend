const {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  getRiwayatBarang,
  getRiwayatDetail,
  deleteRiwayat,
  getBarangMinStok
} = require('../models/barangModel');

const Minio = require('minio');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = 'barang';

(async () => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      console.log(`✅ Bucket "${bucketName}" dibuat di MinIO`);
    }
  } catch (err) {
    console.error('❌ Gagal memeriksa/membuat bucket:', err.message);
  }
})();

async function uploadToMinio(file) {
  const fileName = `${Date.now()}_${file.originalname}`;
  const filePath = file.path;

  await minioClient.fPutObject(bucketName, fileName, filePath, {
    'Content-Type': file.mimetype
  });

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  return `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${fileName}`;
}

const getBarangList = async (req, res) => {
  try {
    const barang = await getAllBarang();
    res.json(barang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBarangDetail = async (req, res) => {
  try {
    const barang = await getBarangById(req.params.id);
    if (!barang) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    res.json(barang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addBarang = async (req, res) => {
  try {
    let foto_url = null;
    if (req.file) {
      foto_url = await uploadToMinio(req.file);
    }

    const newBarang = await createBarang({
      ...req.body,
      foto_url
    });

    res.status(201).json(newBarang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const editBarang = async (req, res) => {
  try {
    let foto_url = req.body.foto_url || null;
    if (req.file) {
      foto_url = await uploadToMinio(req.file);
    }

    const updatedBarang = await updateBarang(req.params.id, {
      ...req.body,
      foto_url
    });

    if (!updatedBarang) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }

    res.json(updatedBarang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeBarang = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT foto_url FROM barang WHERE id = $1`,
      [req.params.id]
    );
    const fotoUrl = result.rows[0]?.foto_url;

    if (fotoUrl) {
      const objectName = decodeURIComponent(
        fotoUrl.split(`/${bucketName}/`)[1]
      );
      try {
        await minioClient.removeObject(bucketName, objectName);
        console.log(`🗑️ File ${objectName} dihapus dari MinIO`);
      } catch (err) {
        console.error("Gagal hapus file di MinIO:", err.message);
      }
    }

    await deleteBarang(req.params.id);

    res.json({ message: 'Barang dan foto berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBarangRiwayat = async (req, res) => {
  try {
    const riwayat = await getRiwayatBarang(req.params.id);
    res.json(riwayat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBarangRiwayatDetail = async (req, res) => {
  try {
    const { tipe, notaId, barangId } = req.params;
    const data = await getRiwayatDetail(tipe, notaId, barangId);

    if (!data || !data.nota_id) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeBarangRiwayat = async (req, res) => {
  try {
    const { tipe, notaId, barangId } = req.params;
    await deleteRiwayat(tipe, notaId, barangId);
    res.json({ message: 'Riwayat berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBarangMinStokNotif = async (req, res) => {
  try {
    const barang = await getBarangMinStok();
    res.json(barang);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBarangList,
  getBarangDetail,
  addBarang,
  editBarang,
  removeBarang,
  getBarangRiwayat,
  getBarangRiwayatDetail,
  removeBarangRiwayat,
  getBarangMinStokNotif
};
