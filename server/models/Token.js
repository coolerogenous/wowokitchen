const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Token = sequelize.define('Token', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: '密语码',
    },
    type: {
        type: DataTypes.ENUM('dish', 'menu'),
        allowNull: false,
        comment: '类型：菜品或菜单',
    },
    data: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: '序列化的 JSON 数据',
    },
}, {
    tableName: 'tokens',
});

module.exports = Token;
