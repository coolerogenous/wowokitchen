const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DishIngredient = sequelize.define('DishIngredient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    dish_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ingredient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '消耗量',
    },
    unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'g',
        comment: '单位',
    },
}, {
    tableName: 'dish_ingredients',
});

module.exports = DishIngredient;
