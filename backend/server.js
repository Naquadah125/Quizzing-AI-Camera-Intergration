const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Thiết bị kết nối realtime: ${socket.id}`);

  socket.on('join_class_room', ({ classId }) => {
    if (classId) {
      socket.join(`class_${classId}`);
      console.log(`👨‍🏫 Giáo viên đã vào room giám sát lớp: class_${classId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Thiết bị ngắt kết nối: ${socket.id}`);
  });
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Hệ thống thi trắc nghiệm trực tuyến đang hoạt động bình thường.',
    timestamp: new Date(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại.' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });
  });
}

module.exports = { app, server };
