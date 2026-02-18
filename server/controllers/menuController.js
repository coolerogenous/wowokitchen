const { Menu, MenuDish, Dish, DishIngredient, Ingredient } = require('../models');
const calculationEngine = require('../services/calculationEngine');

// 获取所有菜单
exports.getAll = async (req, res) => {
    try {
        const menus = await Menu.findAll({
            where: { user_id: req.user.id },
            include: [{
                model: MenuDish,
                as: 'menuDishes',
                include: [{
                    model: Dish,
                    as: 'dish',
                    include: [{
                        model: DishIngredient,
                        as: 'dishIngredients',
                        include: [{ model: Ingredient, as: 'ingredient' }],
                    }],
                }],
            }],
            order: [['created_at', 'DESC']],
        });
        res.json({ menus });
    } catch (error) {
        console.error('获取菜单列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 获取单个菜单详情
exports.getOne = async (req, res) => {
    try {
        const menu = await Menu.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{
                model: MenuDish,
                as: 'menuDishes',
                include: [{
                    model: Dish,
                    as: 'dish',
                    include: [{
                        model: DishIngredient,
                        as: 'dishIngredients',
                        include: [{ model: Ingredient, as: 'ingredient' }],
                    }],
                }],
            }],
        });
        if (!menu) {
            return res.status(404).json({ message: '菜单不存在' });
        }
        res.json({ menu });
    } catch (error) {
        console.error('获取菜单失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 创建菜单
exports.create = async (req, res) => {
    try {
        const { name, description, dishes } = req.body;
        // dishes: [{ dish_id, servings }]
        if (!name) {
            return res.status(400).json({ message: '菜单名称不能为空' });
        }

        const menu = await Menu.create({
            user_id: req.user.id,
            name,
            description: description || '',
        });

        if (dishes && dishes.length > 0) {
            const menuDishes = dishes.map(item => ({
                menu_id: menu.id,
                dish_id: item.dish_id,
                servings: item.servings || 1,
            }));
            await MenuDish.bulkCreate(menuDishes);
        }

        // 计算总成本
        const cost = await calculationEngine.calculateMenuCost(menu.id);
        await menu.update({ total_cost: cost });

        const fullMenu = await Menu.findByPk(menu.id, {
            include: [{
                model: MenuDish,
                as: 'menuDishes',
                include: [{
                    model: Dish,
                    as: 'dish',
                }],
            }],
        });

        res.status(201).json({ message: '菜单创建成功', menu: fullMenu });
    } catch (error) {
        console.error('创建菜单失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 更新菜单
exports.update = async (req, res) => {
    try {
        const menu = await Menu.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!menu) {
            return res.status(404).json({ message: '菜单不存在' });
        }

        const { name, description, dishes } = req.body;
        await menu.update({ name, description });

        if (dishes) {
            await MenuDish.destroy({ where: { menu_id: menu.id } });
            if (dishes.length > 0) {
                const menuDishes = dishes.map(item => ({
                    menu_id: menu.id,
                    dish_id: item.dish_id,
                    servings: item.servings || 1,
                }));
                await MenuDish.bulkCreate(menuDishes);
            }
        }

        const cost = await calculationEngine.calculateMenuCost(menu.id);
        await menu.update({ total_cost: cost });

        const fullMenu = await Menu.findByPk(menu.id, {
            include: [{
                model: MenuDish,
                as: 'menuDishes',
                include: [{ model: Dish, as: 'dish' }],
            }],
        });

        res.json({ message: '更新成功', menu: fullMenu });
    } catch (error) {
        console.error('更新菜单失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 删除菜单
exports.delete = async (req, res) => {
    try {
        const menu = await Menu.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!menu) {
            return res.status(404).json({ message: '菜单不存在' });
        }
        await MenuDish.destroy({ where: { menu_id: menu.id } });
        await menu.destroy();
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除菜单失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 获取菜单的采购清单
exports.getShoppingList = async (req, res) => {
    try {
        const menu = await Menu.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!menu) {
            return res.status(404).json({ message: '菜单不存在' });
        }

        const shoppingList = await calculationEngine.generateMenuShoppingList(menu.id);
        res.json({ menu_name: menu.name, shopping_list: shoppingList });
    } catch (error) {
        console.error('生成采购清单失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};
