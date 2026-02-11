import { DishIngredient, Ingredient } from "@/generated/prisma/client";

/** 带食材详情的 DishIngredient */
export type DishIngredientWithDetail = DishIngredient & {
    ingredient: Ingredient;
};

/** 带食材列表的菜品 */
export interface DishWithIngredients {
    id: number;
    name: string;
    estimatedCost: number;
    ingredients: DishIngredientWithDetail[];
}

/** 聚合后的食材项 */
export interface AggregatedItem {
    ingredientId: number;
    name: string;
    unit: string;
    unitPrice: number;
    spec: string;
    totalQuantity: number;
    totalCost: number;
    fromDishes: string[];
}

/** 采购清单 */
export interface ShoppingList {
    items: AggregatedItem[];
    totalCost: number;
    dishCount: number;
    generatedAt: string;
}

/** API 统一响应格式 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

/** 密语数据结构 */
export interface TokenData {
    type: "dish" | "menu";
    version: number;
    data: {
        name: string;
        ingredients: {
            name: string;
            unitPrice: number;
            spec: string;
            quantity: number;
            unit: string;
        }[];
        // menu 类型时包含多道菜
        dishes?: {
            name: string;
            ingredients: {
                name: string;
                unitPrice: number;
                spec: string;
                quantity: number;
                unit: string;
            }[];
        }[];
    };
}
