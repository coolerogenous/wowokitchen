const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'wowokitchen_default_secret';

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization: Bearer <token>
 */
const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: '令牌已过期，请重新登录' });
        }
        return res.status(401).json({ message: '无效的认证令牌' });
    }
};

/**
 * 可选认证中间件
 * 如果有 token 则解析，没有也不拦截
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
    } catch (error) {
        // 静默忽略，游客模式
    }
    next();
};

module.exports = { auth, optionalAuth };
