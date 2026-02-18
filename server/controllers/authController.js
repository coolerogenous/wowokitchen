const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'wowokitchen_default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 注册
exports.register = async (req, res) => {
    try {
        const { username, password, nickname } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }
        const existing = await User.findOne({ where: { username } });
        if (existing) {
            return res.status(409).json({ message: '用户名已存在' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password_hash,
            nickname: nickname || username,
        });
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(201).json({
            message: '注册成功',
            token,
            user: { id: user.id, username: user.username, nickname: user.nickname },
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 登录
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({
            message: '登录成功',
            token,
            user: { id: user.id, username: user.username, nickname: user.nickname },
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 获取当前用户信息
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'nickname', 'created_at'],
        });
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }
        res.json({ user });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};
