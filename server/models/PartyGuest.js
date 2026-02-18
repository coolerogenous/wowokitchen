const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PartyGuest = sequelize.define('PartyGuest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    party_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    nickname: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '游客昵称',
    },
    guest_token: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '游客令牌',
    },
}, {
    tableName: 'party_guests',
});

module.exports = PartyGuest;
