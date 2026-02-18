const { Dish, DishIngredient, Ingredient } = require('../models');
const calculationEngine = require('../services/calculationEngine');

// 获取当前用户所有菜品
exports.getAll = async (req, res) => {
    try {
        const dishes = await Dish.findAll({
            where: { user_id: req.user.id },
            include: [{
                model: DishIngredient,
                as: 'dishIngredients',
                include: [{ model: Ingredient, as: 'ingredient' }],
            }],
            order: [['created_at', 'DESC']],
        });
        res.json({ dishes });
    } catch (error) {
        console.error('获取菜品列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 获取单个菜品详情
exports.getOne = async (req, res) => {
    try {
        const dish = await Dish.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{
                model: DishIngredient,
                as: 'dishIngredients',
                include: [{ model: Ingredient, as: 'ingredient' }],
            }],
        });
        if (!dish) {
            return res.status(404).json({ message: '菜品不存在' });
        }
        res.json({ dish });
    } catch (error) {
        console.error('获取菜品失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 创建菜品（含食材配方）
exports.create = async (req, res) => {
    try {
        const { name, description, ingredients } = req.body;
        // ingredients: [{ ingredient_id, quantity, unit }]
        if (!name) {
            return res.status(400).json({ message: '菜品名称不能为空' });
        }

        const dish = await Dish.create({
            user_id: req.user.id,
            name,
            description: description || '',
        });

        // 添加食材配方
        if (ingredients && ingredients.length > 0) {
            const dishIngredients = ingredients.map(item => ({
                dish_id: dish.id,
                ingredient_id: item.ingredient_id,
                quantity: item.quantity || 0,
                unit: item.unit || 'g',
            }));
            await DishIngredient.bulkCreate(dishIngredients);
        }

        // 计算成本
        const cost = await calculationEngine.calculateDishCost(dish.id);
        await dish.update({ estimated_cost: cost });

        // 重新查询完整数据
        const fullDish = await Dish.findByPk(dish.id, {
            include: [{
                model: DishIngredient,
                as: 'dishIngredients',
                include: [{ model: Ingredient, as: 'ingredient' }],
            }],
        });

        res.status(201).json({ message: '菜品创建成功', dish: fullDish });
    } catch (error) {
        console.error('创建菜品失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 更新菜品
exports.update = async (req, res) => {
    try {
        const dish = await Dish.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!dish) {
            return res.status(404).json({ message: '菜品不存在' });
        }

        const { name, description, ingredients } = req.body;
        await dish.update({ name, description });

        // 如果传入了食材列表，则替换
        if (ingredients) {
            await DishIngredient.destroy({ where: { dish_id: dish.id } });
            if (ingredients.length > 0) {
                const dishIngredients = ingredients.map(item => ({
                    dish_id: dish.id,
                    ingredient_id: item.ingredient_id,
                    quantity: item.quantity || 0,
                    unit: item.unit || 'g',
                }));
                await DishIngredient.bulkCreate(dishIngredients);
            }
        }

        // 重新计算成本
        const cost = await calculationEngine.calculateDishCost(dish.id);
        await dish.update({ estimated_cost: cost });

        const fullDish = await Dish.findByPk(dish.id, {
            include: [{
                model: DishIngredient,
                as: 'dishIngredients',
                include: [{ model: Ingredient, as: 'ingredient' }],
            }],
        });

        res.json({ message: '更新成功', dish: fullDish });
    } catch (error) {
        console.error('更新菜品失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 删除菜品（软删除策略可后续考虑）
exports.delete = async (req, res) => {
    try {
        const dish = await Dish.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!dish) {
            return res.status(404).json({ message: '菜品不存在' });
        }
        // 先删除关联的食材配方
        await DishIngredient.destroy({ where: { dish_id: dish.id } });
        await dish.destroy();
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除菜品失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};
