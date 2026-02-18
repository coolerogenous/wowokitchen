const { Ingredient } = require('../models');

// 获取当前用户所有食材
exports.getAll = async (req, res) => {
    try {
        const ingredients = await Ingredient.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
        });
        res.json({ ingredients });
    } catch (error) {
        console.error('获取食材列表失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 获取单个食材
exports.getOne = async (req, res) => {
    try {
        const ingredient = await Ingredient.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!ingredient) {
            return res.status(404).json({ message: '食材不存在' });
        }
        res.json({ ingredient });
    } catch (error) {
        console.error('获取食材失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 新增食材
exports.create = async (req, res) => {
    try {
        const { name, unit_price, unit_spec, unit } = req.body;
        if (!name) {
            return res.status(400).json({ message: '食材名称不能为空' });
        }
        const ingredient = await Ingredient.create({
            user_id: req.user.id,
            name,
            unit_price: unit_price || 0,
            unit_spec: unit_spec || '',
            unit: unit || 'g',
        });
        res.status(201).json({ message: '食材创建成功', ingredient });
    } catch (error) {
        console.error('创建食材失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 更新食材
exports.update = async (req, res) => {
    try {
        const ingredient = await Ingredient.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!ingredient) {
            return res.status(404).json({ message: '食材不存在' });
        }
        const { name, unit_price, unit_spec, unit } = req.body;
        await ingredient.update({ name, unit_price, unit_spec, unit });
        res.json({ message: '更新成功', ingredient });
    } catch (error) {
        console.error('更新食材失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 删除食材
exports.delete = async (req, res) => {
    try {
        const ingredient = await Ingredient.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });
        if (!ingredient) {
            return res.status(404).json({ message: '食材不存在' });
        }
        await ingredient.destroy();
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除食材失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};
