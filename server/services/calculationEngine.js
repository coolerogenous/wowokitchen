const { DishIngredient, Ingredient, MenuDish, Dish, PartyDish } = require('../models');

/**
 * 智能计算引擎 - 独立的计算服务模块
 * 核心算法：成本核算 + 清单合并同类项
 */
const calculationEngine = {

    /**
     * 计算单个菜品的预估成本
     * 公式：Σ (食材消耗量 × 食材单价 / 采购规格中的数量)
     * 简化版：消耗量(基本单位) × 单价 / 规格量
     */
    async calculateDishCost(dishId) {
        const dishIngredients = await DishIngredient.findAll({
            where: { dish_id: dishId },
            include: [{ model: Ingredient, as: 'ingredient' }],
        });

        let totalCost = 0;
        for (const di of dishIngredients) {
            if (di.ingredient) {
                // 简化计算：消耗量 × 单价（单价已经是按基本单位换算好的）
                // 如果单价是"每500g X元"，消耗量是以g为单位
                // 则成本 = 消耗量 / 规格量 × 单价
                const specQuantity = parseSpecQuantity(di.ingredient.unit_spec);
                if (specQuantity > 0) {
                    totalCost += (parseFloat(di.quantity) / specQuantity) * parseFloat(di.ingredient.unit_price);
                } else {
                    totalCost += parseFloat(di.quantity) * parseFloat(di.ingredient.unit_price);
                }
            }
        }

        return Math.round(totalCost * 100) / 100;
    },

    /**
     * 计算菜单总成本
     */
    async calculateMenuCost(menuId) {
        const menuDishes = await MenuDish.findAll({
            where: { menu_id: menuId },
            include: [{ model: Dish, as: 'dish' }],
        });

        let totalCost = 0;
        for (const md of menuDishes) {
            if (md.dish) {
                // 每道菜的成本已经计算好，乘以份数
                totalCost += parseFloat(md.dish.estimated_cost) * (md.servings || 1);
            }
        }

        return Math.round(totalCost * 100) / 100;
    },

    /**
     * 计算饭局总预算
     */
    async calculatePartyBudget(partyId) {
        const partyDishes = await PartyDish.findAll({
            where: { party_id: partyId },
            include: [{ model: Dish, as: 'dish' }],
        });

        let totalBudget = 0;
        for (const pd of partyDishes) {
            if (pd.dish) {
                totalBudget += parseFloat(pd.dish.estimated_cost) * (pd.servings || 1);
            }
        }

        return Math.round(totalBudget * 100) / 100;
    },

    /**
     * 生成菜单采购清单（合并同类项）
     */
    async generateMenuShoppingList(menuId) {
        const menuDishes = await MenuDish.findAll({
            where: { menu_id: menuId },
            include: [{
                model: Dish,
                as: 'dish',
                include: [{
                    model: DishIngredient,
                    as: 'dishIngredients',
                    include: [{ model: Ingredient, as: 'ingredient' }],
                }],
            }],
        });

        return aggregateIngredients(menuDishes.map(md => ({
            dish: md.dish,
            servings: md.servings || 1,
        })));
    },

    /**
     * 生成饭局采购清单（合并同类项）
     */
    async generatePartyShoppingList(partyId) {
        const partyDishes = await PartyDish.findAll({
            where: { party_id: partyId },
            include: [{
                model: Dish,
                as: 'dish',
                include: [{
                    model: DishIngredient,
                    as: 'dishIngredients',
                    include: [{ model: Ingredient, as: 'ingredient' }],
                }],
            }],
        });

        return aggregateIngredients(partyDishes.map(pd => ({
            dish: pd.dish,
            servings: pd.servings || 1,
        })));
    },
};

/**
 * 合并同类项核心逻辑
 * 遍历所有菜品下的食材，将相同食材的消耗量累加
 */
function aggregateIngredients(dishEntries) {
    const ingredientMap = {};
    const dishList = [];

    for (const entry of dishEntries) {
        const { dish, servings } = entry;
        if (!dish || !dish.dishIngredients) continue;

        dishList.push({
            name: dish.name,
            servings,
            estimated_cost: parseFloat(dish.estimated_cost) * servings,
        });

        for (const di of dish.dishIngredients) {
            if (!di.ingredient) continue;
            const key = di.ingredient.name;
            const quantity = parseFloat(di.quantity) * servings;

            if (ingredientMap[key]) {
                ingredientMap[key].total_quantity += quantity;
            } else {
                const specQuantity = parseSpecQuantity(di.ingredient.unit_spec);
                ingredientMap[key] = {
                    name: di.ingredient.name,
                    unit: di.unit || di.ingredient.unit,
                    unit_price: parseFloat(di.ingredient.unit_price),
                    unit_spec: di.ingredient.unit_spec,
                    spec_quantity: specQuantity,
                    total_quantity: quantity,
                };
            }
        }
    }

    // 计算每项的总价
    const ingredients = Object.values(ingredientMap).map(item => {
        let totalPrice;
        if (item.spec_quantity > 0) {
            totalPrice = (item.total_quantity / item.spec_quantity) * item.unit_price;
        } else {
            totalPrice = item.total_quantity * item.unit_price;
        }
        return {
            ...item,
            total_price: Math.round(totalPrice * 100) / 100,
        };
    });

    const grandTotal = ingredients.reduce((sum, item) => sum + item.total_price, 0);

    return {
        dishes: dishList,
        ingredients,
        grand_total: Math.round(grandTotal * 100) / 100,
    };
}

/**
 * 从采购规格中解析数量
 * 例如 "500g/包" -> 500, "1个" -> 1, "250ml/瓶" -> 250
 */
function parseSpecQuantity(unitSpec) {
    if (!unitSpec) return 0;
    const match = unitSpec.match(/^(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
}

module.exports = calculationEngine;
