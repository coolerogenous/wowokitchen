const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('./models');
const setupSocket = require('./socket');

// 路由
const authRoutes = require('./routes/auth');
const ingredientRoutes = require('./routes/ingredients');
const dishRoutes = require('./routes/dishes');
const menuRoutes = require('./routes/menus');
const tokenRoutes = require('./routes/tokens');
const partyRoutes = require('./routes/parties');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.CLIENT_URL
            : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
});

setupSocket(io);

// 中间件
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/parties', partyRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('未捕获的错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;

async function start() {
    try {
        // 验证数据库连接
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');

        // 同步模型（开发环境自动建表）
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ 数据表同步完成');
        }

        server.listen(PORT, () => {
            console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
            console.log(`📡 Socket.IO 已启动`);
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

start();
