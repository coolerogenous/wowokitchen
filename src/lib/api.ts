const API_BASE = "";

/**
 * 通用 API 请求函数
 */
async function request<T>(
    url: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("wk_token") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
    });

    const json = await res.json();
    return json;
}

// ==================== 认证 ====================
export const authApi = {
    register: (username: string, password: string) =>
        request<{ token: string; user: { id: number; username: string } }>(
            "/api/auth/register",
            { method: "POST", body: JSON.stringify({ username, password }) }
        ),

    login: (username: string, password: string) =>
        request<{ token: string; user: { id: number; username: string } }>(
            "/api/auth/login",
            { method: "POST", body: JSON.stringify({ username, password }) }
        ),
};

// ==================== 食材 ====================
export const ingredientApi = {
    list: () => request<Ingredient[]>("/api/ingredients"),

    create: (data: { name: string; unitPrice: number; spec: string }) =>
        request<Ingredient>("/api/ingredients", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: Partial<{ name: string; unitPrice: number; spec: string }>) =>
        request<Ingredient>(`/api/ingredients/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<{ id: number }>(`/api/ingredients/${id}`, { method: "DELETE" }),
};

// ==================== 菜品 ====================
export const dishApi = {
    list: () => request<Dish[]>("/api/dishes"),

    get: (id: number) => request<Dish>(`/api/dishes/${id}`),

    create: (data: {
        name: string;
        ingredients: { ingredientId: number; quantity: number; unit: string }[];
    }) =>
        request<Dish>("/api/dishes", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (
        id: number,
        data: {
            name?: string;
            ingredients?: { ingredientId: number; quantity: number; unit: string }[];
        }
    ) =>
        request<Dish>(`/api/dishes/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<{ id: number }>(`/api/dishes/${id}`, { method: "DELETE" }),
};

// ==================== 菜单 ====================
export const menuApi = {
    list: () => request<Menu[]>("/api/menus"),

    get: (id: number) => request<MenuDetail>(`/api/menus/${id}`),

    create: (data: { name: string; dishIds?: number[] }) =>
        request<Menu>("/api/menus", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: number, data: { name?: string; dishIds?: number[] }) =>
        request<Menu>(`/api/menus/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<{ id: number }>(`/api/menus/${id}`, { method: "DELETE" }),
};

// ==================== 密语 ====================
export const tokenApi = {
    encode: (type: "dish" | "menu", id: number) =>
        request<{ token: string }>("/api/tokens/encode", {
            method: "POST",
            body: JSON.stringify({ type, id }),
        }),

    decode: (token: string) =>
        request<{
            ingredientsCreated: number;
            ingredientsReused: number;
            dishesCreated: number;
            menuCreated: boolean;
            menuName: string;
        }>("/api/tokens/decode", {
            method: "POST",
            body: JSON.stringify({ token }),
        }),
};

// ==================== 饭局 ====================
export const partyApi = {
    list: () => request<Party[]>("/api/parties"),

    get: (id: string | number) => request<PartyDetail>(`/api/parties/${id}`),

    create: (data: { name: string; dishIds?: number[] }) =>
        request<Party>("/api/parties", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        request<{ id: number }>(`/api/parties/${id}`, { method: "DELETE" }),

    join: (id: string | number, nickname: string) =>
        request<{ guestId: number; guestToken: string; nickname: string }>(
            `/api/parties/${id}/join`,
            { method: "POST", body: JSON.stringify({ nickname }) }
        ),

    addDish: (
        id: number,
        data:
            | { dishId: number }
            | {
                dishName: string;
                ingredients: { name: string; quantity: number; unit: string; unitPrice: number }[];
                guestToken: string;
            }
    ) =>
        request(`/api/parties/${id}/dishes`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    removeDish: (id: number, partyDishId: number) =>
        request(`/api/parties/${id}/dishes`, {
            method: "DELETE",
            body: JSON.stringify({ partyDishId }),
        }),

    lock: (id: number, action: "lock" | "unlock") =>
        request(`/api/parties/${id}/lock`, {
            method: "PUT",
            body: JSON.stringify({ action }),
        }),

    export: (id: number) => request<PartyExport>(`/api/parties/${id}/export`),
};

// ==================== 类型定义 ====================
export interface Ingredient {
    id: number;
    name: string;
    unitPrice: number;
    spec: string;
    createdAt: string;
}

export interface DishIngredient {
    id: number;
    ingredientId: number;
    quantity: number;
    unit: string;
    ingredient: Ingredient;
}

export interface Dish {
    id: number;
    name: string;
    estimatedCost: number;
    ingredients: DishIngredient[];
    createdAt: string;
}

export interface MenuDishItem {
    id: number;
    dish: Dish;
}

export interface Menu {
    id: number;
    name: string;
    dishes: MenuDishItem[];
    createdAt: string;
}

export interface ShoppingListItem {
    ingredientId: number;
    name: string;
    unit: string;
    unitPrice: number;
    spec: string;
    totalQuantity: number;
    totalCost: number;
    fromDishes: string[];
}

export interface MenuDetail extends Menu {
    shoppingList: {
        items: ShoppingListItem[];
        totalCost: number;
        dishCount: number;
        generatedAt: string;
    };
}

export interface Party {
    id: number;
    name: string;
    status: string;
    shareCode: string;
    createdAt: string;
    dishes: PartyDishItem[];
    guests: { id: number; nickname: string }[];
    _count?: { dishes: number; guests: number };
}

export interface PartyDishItem {
    id: number;
    dishName: string;
    ingredientsSnapshot: string;
    costSnapshot: number;
    addedByGuest?: { id: number; nickname: string } | null;
    createdAt: string;
}

export interface PartyDetail extends Party {
    host: { id: number; username: string };
    totalCost: number;
}

export interface PartyExport {
    partyName: string;
    hostName: string;
    status: string;
    guestCount: number;
    guests: string[];
    dishes: { name: string; cost: number; addedBy: string }[];
    shoppingList: {
        items: ShoppingListItem[];
        totalCost: number;
        dishCount: number;
        generatedAt: string;
    };
}
