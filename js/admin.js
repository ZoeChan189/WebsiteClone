"use strict";

const state = {
    products: [],
    categories: [],
    orders: [],
    authToken: localStorage.getItem("adminSession") || ""
};

const $ = (selector) => document.querySelector(selector);
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    window.setTimeout(() => el.classList.remove("show"), 2400);
}

async function api(path, options = {}) {
    const res = await fetch(path, {
        ...options,
        headers: {
            "content-type": "application/json",
            "authorization": state.authToken ? `Bearer ${state.authToken}` : "",
            ...(options.headers || {})
        }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "API lỗi.");
    }

    return data;
}

function categoryName(slug) {
    return state.categories.find((item) => item.slug === slug)?.name || slug || "-";
}

function productName(id) {
    return state.products.find((item) => item.id === id)?.name || id || "-";
}

function fillCategorySelect() {
    $("#productCategory").innerHTML = state.categories
        .map((item) => `<option value="${item.slug}">${item.name}</option>`)
        .join("");
}

function renderStats(summary) {
    $("#statProducts").textContent = summary.products;
    $("#statCategories").textContent = summary.categories;
    $("#statOrders").textContent = summary.orders;
    $("#statRevenue").textContent = money(summary.revenue);
}

function renderProducts() {
    $("#productsTable").innerHTML = state.products
        .map((item) => `
            <tr>
                <td>
                    <img src="${item.image || ""}" alt="">
                    <strong>${item.name}</strong><br>
                    <small>${item.slug}</small>
                </td>
                <td>${categoryName(item.categorySlug)}</td>
                <td>${money(item.price)}</td>
                <td>${item.stock}</td>
                <td><span class="status">${item.status}</span></td>
                <td>
                    <div class="row-actions">
                        <button data-edit-product="${item.id}">Sửa</button>
                        <button class="danger" data-delete-product="${item.id}">Xóa</button>
                    </div>
                </td>
            </tr>
        `)
        .join("");
}

function renderCategories() {
    $("#categoriesTable").innerHTML = state.categories
        .map((item) => `
            <tr>
                <td><strong>${item.name}</strong><br><small>${item.description || ""}</small></td>
                <td>${item.slug}</td>
                <td><span class="status">${item.status}</span></td>
                <td>
                    <div class="row-actions">
                        <button data-edit-category="${item.id}">Sửa</button>
                        <button class="danger" data-delete-category="${item.id}">Xóa</button>
                    </div>
                </td>
            </tr>
        `)
        .join("");
}

function renderOrders() {
    $("#ordersTable").innerHTML = state.orders
        .map((item) => `
            <tr>
                <td><strong>${item.customerName || "-"}</strong><br><small>${item.customerPhone || ""}</small></td>
                <td>${productName(item.productId)} x ${item.quantity}</td>
                <td>${money(item.total)}</td>
                <td>
                    <select data-order-status="${item.id}">
                        ${["pending", "paid", "delivered", "cancelled"].map((status) => `
                            <option value="${status}" ${status === item.status ? "selected" : ""}>${status}</option>
                        `).join("")}
                    </select>
                </td>
                <td>${new Date(item.createdAt).toLocaleString("vi-VN")}</td>
            </tr>
        `)
        .join("");
}

async function loadAll() {
    const [summary, categories, products, orders] = await Promise.all([
        api("/api/summary"),
        api("/api/categories"),
        api("/api/products"),
        api("/api/orders")
    ]);

    state.categories = categories;
    state.products = products;
    state.orders = orders;

    renderStats(summary);
    fillCategorySelect();
    renderProducts();
    renderCategories();
    renderOrders();
}

async function loadPublicData() {
    const [summary, categories, products] = await Promise.all([
        api("/api/summary"),
        api("/api/categories"),
        api("/api/products")
    ]);

    state.categories = categories;
    state.products = products;
    state.orders = [];

    renderStats(summary);
    fillCategorySelect();
    renderProducts();
    renderCategories();
    renderOrders();
}

function resetProductForm(product = {}) {
    $("#productId").value = product.id || "";
    $("#productName").value = product.name || "";
    $("#productSlug").value = product.slug || "";
    $("#productCategory").value = product.categorySlug || state.categories[0]?.slug || "";
    $("#productImage").value = product.image || "";
    $("#productPrice").value = product.price || 0;
    $("#productOldPrice").value = product.oldPrice || "";
    $("#productStock").value = product.stock || 0;
    $("#productRating").value = product.rating || 4.6;
    $("#productSold").value = product.sold || 0;
    $("#productStatus").value = product.status || "active";
    $("#productDescription").value = product.description || "";
    $("#productForm").classList.remove("hidden");
}

function resetCategoryForm(category = {}) {
    $("#categoryId").value = category.id || "";
    $("#categoryName").value = category.name || "";
    $("#categorySlug").value = category.slug || "";
    $("#categoryStatus").value = category.status || "active";
    $("#categoryDescription").value = category.description || "";
    $("#categoryForm").classList.remove("hidden");
}

function productPayload() {
    return {
        name: $("#productName").value,
        slug: $("#productSlug").value,
        categorySlug: $("#productCategory").value,
        image: $("#productImage").value,
        price: Number($("#productPrice").value),
        oldPrice: $("#productOldPrice").value,
        stock: Number($("#productStock").value),
        rating: Number($("#productRating").value),
        sold: Number($("#productSold").value),
        status: $("#productStatus").value,
        description: $("#productDescription").value
    };
}

function categoryPayload() {
    return {
        name: $("#categoryName").value,
        slug: $("#categorySlug").value,
        status: $("#categoryStatus").value,
        description: $("#categoryDescription").value
    };
}

function bindEvents() {
    $("#adminUsername").value = localStorage.getItem("adminUsername") || "admin";

    $("#loginForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const result = await api("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username: $("#adminUsername").value.trim(),
                password: $("#adminPassword").value
            })
        });
        state.authToken = result.token;
        localStorage.setItem("adminSession", result.token);
        localStorage.setItem("adminUsername", result.user.username);
        $("#adminPassword").value = "";
        toast(`Đã đăng nhập: ${result.user.name}`);
        await loadAll();
    });

    document.querySelectorAll(".admin-nav").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".admin-nav").forEach((item) => item.classList.remove("active"));
            document.querySelectorAll(".admin-panel").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            $(`#${button.dataset.view}Panel`).classList.add("active");
        });
    });

    $("#newProductButton").addEventListener("click", () => resetProductForm());
    $("#cancelProductButton").addEventListener("click", () => $("#productForm").classList.add("hidden"));
    $("#newCategoryButton").addEventListener("click", () => resetCategoryForm());
    $("#cancelCategoryButton").addEventListener("click", () => $("#categoryForm").classList.add("hidden"));

    $("#productForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = $("#productId").value;
        await api(id ? `/api/products/${id}` : "/api/products", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(productPayload())
        });
        $("#productForm").classList.add("hidden");
        toast("Đã lưu sản phẩm.");
        await loadAll();
    });

    $("#categoryForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = $("#categoryId").value;
        await api(id ? `/api/categories/${id}` : "/api/categories", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(categoryPayload())
        });
        $("#categoryForm").classList.add("hidden");
        toast("Đã lưu danh mục.");
        await loadAll();
    });

    document.body.addEventListener("click", async (event) => {
        const editProductId = event.target.dataset.editProduct;
        const deleteProductId = event.target.dataset.deleteProduct;
        const editCategoryId = event.target.dataset.editCategory;
        const deleteCategoryId = event.target.dataset.deleteCategory;

        if (editProductId) {
            resetProductForm(state.products.find((item) => item.id === editProductId));
        }

        if (deleteProductId && confirm("Xóa sản phẩm này?")) {
            await api(`/api/products/${deleteProductId}`, { method: "DELETE" });
            toast("Đã xóa sản phẩm.");
            await loadAll();
        }

        if (editCategoryId) {
            resetCategoryForm(state.categories.find((item) => item.id === editCategoryId));
        }

        if (deleteCategoryId && confirm("Xóa danh mục này?")) {
            await api(`/api/categories/${deleteCategoryId}`, { method: "DELETE" });
            toast("Đã xóa danh mục.");
            await loadAll();
        }
    });

    document.body.addEventListener("change", async (event) => {
        const orderId = event.target.dataset.orderStatus;

        if (!orderId) return;

        await api(`/api/orders/${orderId}`, {
            method: "PUT",
            body: JSON.stringify({ status: event.target.value })
        });
        toast("Đã cập nhật đơn hàng.");
        await loadAll();
    });
}

bindEvents();
(state.authToken ? loadAll() : loadPublicData()).catch((error) => toast(error.message));
