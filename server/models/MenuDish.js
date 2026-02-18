const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuDish = sequelize.define('MenuDish', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    menu_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    dish_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    servings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '份数',
    },
}, {
    tableName: 'menu_dishes',
});

module.exports = MenuDish;
