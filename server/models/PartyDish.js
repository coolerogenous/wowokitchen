const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PartyDish = sequelize.define('PartyDish', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    party_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    dish_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    added_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '添加者昵称',
    },
    servings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '份数',
    },
}, {
    tableName: 'party_dishes',
});

module.exports = PartyDish;
