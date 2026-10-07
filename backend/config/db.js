const mongoose = require('mongoose');
const dns = require('dns');

// Fallback DNS to prevent 'querySrv ECONNREFUSED' on MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toiyeudoan_db';
    const conn = await mongoose.connect(connUri, {
      autoIndex: true,
    });

    console.log(`✅ MongoDB đã kết nối thành công: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
    console.error('💡 Vui lòng kiểm tra lại biến MONGO_URI trong file .env hoặc đảm bảo MongoDB service đang chạy.');
    process.exit(1);
  }
};

module.exports = { connectDB };
