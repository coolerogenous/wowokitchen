import { DishWithIngredients, AggregatedItem, ShoppingList } from "@/types";

/**
 * 合并同类项：将多道菜的食材汇总
 */
export function aggregateIngredients(
    dishes: DishWithIngredients[]
): AggregatedItem[] {
    const map = new Map<number, AggregatedItem>();

    for (const dish of dishes) {
        for (const di of dish.ingredients) {
            const existing = map.get(di.ingredientId);
            if (existing) {
                existing.totalQuantity += di.quantity;
                existing.totalCost = existing.totalQuantity * existing.unitPrice;
                existing.fromDishes.push(dish.name);
            } else {
                map.set(di.ingredientId, {
                    ingredientId: di.ingredientId,
                    name: di.ingredient.name,
                    unit: di.unit,
                    unitPrice: di.ingredient.unitPrice,
                    spec: di.ingredient.spec,
                    totalQuantity: di.quantity,
                    totalCost: di.quantity * di.ingredient.unitPrice,
                    fromDishes: [dish.name],
                });
            }
        }
    }

    return Array.from(map.values());
}

/**
 * 生成完整的采购清单
 */
export function generateShoppingList(
    dishes: DishWithIngredients[]
): ShoppingList {
    const items = aggregateIngredients(dishes);
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

    return {
        items,
        totalCost: Math.round(totalCost * 100) / 100, // 保留两位小数
        dishCount: dishes.length,
        generatedAt: new Date().toISOString(),
    };
}

/**
 * 计算单道菜的成本
 */
export function calculateDishCost(
    ingredients: { quantity: number; unitPrice: number }[]
): number {
    const cost = ingredients.reduce(
        (sum, ing) => sum + ing.quantity * ing.unitPrice,
        0
    );
    return Math.round(cost * 100) / 100;
}
