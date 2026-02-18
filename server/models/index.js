const sequelize = require('../config/database');
const User = require('./User');
const Ingredient = require('./Ingredient');
const Dish = require('./Dish');
const DishIngredient = require('./DishIngredient');
const Menu = require('./Menu');
const MenuDish = require('./MenuDish');
const Party = require('./Party');
const PartyDish = require('./PartyDish');
const PartyGuest = require('./PartyGuest');
const Token = require('./Token');

// ========== User 关联 ==========
User.hasMany(Ingredient, { foreignKey: 'user_id', as: 'ingredients' });
Ingredient.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Dish, { foreignKey: 'user_id', as: 'dishes' });
Dish.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Menu, { foreignKey: 'user_id', as: 'menus' });
Menu.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Party, { foreignKey: 'host_id', as: 'parties' });
Party.belongsTo(User, { foreignKey: 'host_id', as: 'host' });

User.hasMany(Token, { foreignKey: 'user_id', as: 'tokens' });
Token.belongsTo(User, { foreignKey: 'user_id' });

// ========== Dish <-> Ingredient (BOM) ==========
Dish.belongsToMany(Ingredient, {
    through: DishIngredient,
    foreignKey: 'dish_id',
    otherKey: 'ingredient_id',
    as: 'ingredients',
});
Ingredient.belongsToMany(Dish, {
    through: DishIngredient,
    foreignKey: 'ingredient_id',
    otherKey: 'dish_id',
    as: 'dishes',
});
Dish.hasMany(DishIngredient, { foreignKey: 'dish_id', as: 'dishIngredients' });
DishIngredient.belongsTo(Dish, { foreignKey: 'dish_id' });
DishIngredient.belongsTo(Ingredient, { foreignKey: 'ingredient_id', as: 'ingredient' });

// ========== Menu <-> Dish ==========
Menu.belongsToMany(Dish, {
    through: MenuDish,
    foreignKey: 'menu_id',
    otherKey: 'dish_id',
    as: 'dishes',
});
Dish.belongsToMany(Menu, {
    through: MenuDish,
    foreignKey: 'dish_id',
    otherKey: 'menu_id',
    as: 'menus',
});
Menu.hasMany(MenuDish, { foreignKey: 'menu_id', as: 'menuDishes' });
MenuDish.belongsTo(Menu, { foreignKey: 'menu_id' });
MenuDish.belongsTo(Dish, { foreignKey: 'dish_id', as: 'dish' });

// ========== Party 关联 ==========
Party.hasMany(PartyDish, { foreignKey: 'party_id', as: 'partyDishes' });
PartyDish.belongsTo(Party, { foreignKey: 'party_id' });
PartyDish.belongsTo(Dish, { foreignKey: 'dish_id', as: 'dish' });

Party.hasMany(PartyGuest, { foreignKey: 'party_id', as: 'guests' });
PartyGuest.belongsTo(Party, { foreignKey: 'party_id' });

module.exports = {
    sequelize,
    User,
    Ingredient,
    Dish,
    DishIngredient,
    Menu,
    MenuDish,
    Party,
    PartyDish,
    PartyGuest,
    Token,
};
