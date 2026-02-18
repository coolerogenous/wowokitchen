const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ingredient = sequelize.define('Ingredient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '采购单价',
    },
    unit_spec: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '采购规格，如 500g/包',
    },
    unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'g',
        comment: '基本单位，如 g/个/ml',
    },
}, {
    tableName: 'ingredients',
});

module.exports = Ingredient;
