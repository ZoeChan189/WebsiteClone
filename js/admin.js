"use strict";

const state = {
    products: [],
    categories: [],
    orders: [],
    authToken: localStorage.getItem("adminSession") || ""
};

const $ = (selector) => document.querySelector(selector);

function priceToVnd(value) {
    const number = Number(value || 0);
    return number > 0 && number < 10000 ? number * 1000 : number;
}

const money = (value) => `${priceToVnd(value).toLocaleString("vi-VN")}\u0111`;

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

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

function clearAdminSession() {
    state.authToken = "";
    localStorage.removeItem("adminSession");
}

function isAuthError(error) {
    return /401|đăng nhập|dang nhap|Chưa đăng nhập|Unauthorized/i.test(error.message || "");
}

function handleError(error) {
    if (isAuthError(error)) {
        clearAdminSession();
        toast("Phien dang nhap het han. Hay dang nhap lai roi bam Luu.");
        loadPublicData().catch((loadError) => toast(loadError.message));
        return;
    }

    toast(error.message || "Co loi xay ra.");
}

function categoryName(slug) {
    return state.categories.find((item) => item.slug === slug)?.name || slug || "-";
}

function productName(id) {
    return state.products.find((item) => item.id === id)?.name || id || "-";
}

function fillCategorySelect() {
    $("#productCategory").innerHTML = state.categories
        .map((item) => `<option value="${escapeHTML(item.slug)}">${escapeHTML(item.name)}</option>`)
        .join("");
}

function renderStats(summary) {
    $("#statProducts").textContent = summary.products;
    $("#statCategories").textContent = summary.categories;
    $("#statOrders").textContent = summary.orders;
    $("#statRevenue").textContent = money(summary.revenue);
}

function visibleProducts() {
    const keyword = ($("#productSearch")?.value || "").trim().toLowerCase();

    return state.products.filter((item) => {
        const haystack = [
            item.name,
            item.slug,
            item.categorySlug,
            categoryName(item.categorySlug),
            item.status
        ].join(" ").toLowerCase();

        return !keyword || haystack.includes(keyword);
    });
}

function renderProducts() {
    $("#productsTable").innerHTML = visibleProducts()
        .map((item) => `
            <tr>
                <td>
                    <img src="${escapeHTML(item.image || item.icon || "")}" alt="">
                    <strong>${escapeHTML(item.name)}</strong><br>
                    <small>${escapeHTML(item.slug)}</small>
                    ${item.icon ? `<br><small>Icon: ${escapeHTML(item.icon)}</small>` : ""}
                </td>
                <td>${escapeHTML(categoryName(item.categorySlug))}</td>
                <td>${money(item.price)}${item.oldPrice ? `<br><small>Gia cu: ${money(item.oldPrice)}</small>` : ""}</td>
                <td>${Number(item.stock || 0)}</td>
                <td>
                    <span class="status">${escapeHTML(item.status)}</span>
                    ${item.discount ? `<br><small>${escapeHTML(item.discount)}</small>` : ""}
                </td>
                <td>
                    <div class="row-actions">
                        <button data-edit-product="${escapeHTML(item.id)}">Sua</button>
                        <button class="danger" data-delete-product="${escapeHTML(item.id)}">Xoa</button>
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
                <td><strong>${escapeHTML(item.name)}</strong><br><small>${escapeHTML(item.description || "")}</small></td>
                <td>${escapeHTML(item.slug)}</td>
                <td><span class="status">${escapeHTML(item.status)}</span></td>
                <td>
                    <div class="row-actions">
                        <button data-edit-category="${escapeHTML(item.id)}">Sua</button>
                        <button class="danger" data-delete-category="${escapeHTML(item.id)}">Xoa</button>
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
                <td><strong>${escapeHTML(item.customerName || "-")}</strong><br><small>${escapeHTML(item.customerPhone || "")}</small></td>
                <td>${escapeHTML(productName(item.productId))} x ${Number(item.quantity || 1)}</td>
                <td>${money(item.total)}</td>
                <td>
                    <select data-order-status="${escapeHTML(item.id)}">
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

function updateProductPreview() {
    const image = $("#productImage").value.trim();
    const icon = $("#productIcon").value.trim();
    const imagePreview = $("#productImagePreview");
    const iconPreview = $("#productIconPreview");

    imagePreview.src = image;
    iconPreview.src = icon || image;
    imagePreview.classList.toggle("hidden", !image);
    iconPreview.classList.toggle("hidden", !(icon || image));
}

function resetProductForm(product = {}) {
    $("#productId").value = product.id || "";
    $("#productName").value = product.name || "";
    $("#productSlug").value = product.slug || "";
    $("#productCategory").value = product.categorySlug || state.categories[0]?.slug || "";
    $("#productImage").value = product.image || "";
    $("#productIcon").value = product.icon || "";
    $("#productDiscount").value = product.discount || "";
    $("#productPrice").value = product.price || 0;
    $("#productOldPrice").value = product.oldPrice || "";
    $("#productStock").value = product.stock || 0;
    $("#productRating").value = product.rating || 4.6;
    $("#productSold").value = product.sold || 0;
    $("#productStatus").value = product.status || "active";
    $("#productDescription").value = product.description || "";
    updateProductPreview();
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
        icon: $("#productIcon").value,
        discount: $("#productDiscount").value,
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

        try {
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
            toast(`Da dang nhap: ${result.user.name}`);
            await loadAll();
        } catch (error) {
            handleError(error);
        }
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
    $("#productSearch")?.addEventListener("input", renderProducts);
    $("#productImage")?.addEventListener("input", updateProductPreview);
    $("#productIcon")?.addEventListener("input", updateProductPreview);

    $("#productForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            const id = $("#productId").value;
            await api(id ? `/api/products/${id}` : "/api/products", {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(productPayload())
            });
            $("#productForm").classList.add("hidden");
            toast("Da luu san pham.");
            await loadAll();
        } catch (error) {
            handleError(error);
        }
    });

    $("#categoryForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            const id = $("#categoryId").value;
            await api(id ? `/api/categories/${id}` : "/api/categories", {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(categoryPayload())
            });
            $("#categoryForm").classList.add("hidden");
            toast("Da luu danh muc.");
            await loadAll();
        } catch (error) {
            handleError(error);
        }
    });

    document.body.addEventListener("click", async (event) => {
        const editProductId = event.target.dataset.editProduct;
        const deleteProductId = event.target.dataset.deleteProduct;
        const editCategoryId = event.target.dataset.editCategory;
        const deleteCategoryId = event.target.dataset.deleteCategory;

        if (editProductId) {
            resetProductForm(state.products.find((item) => item.id === editProductId));
        }

        if (deleteProductId && confirm("Xoa san pham nay?")) {
            try {
                await api(`/api/products/${deleteProductId}`, { method: "DELETE" });
                toast("Da xoa san pham.");
                await loadAll();
            } catch (error) {
                handleError(error);
            }
        }

        if (editCategoryId) {
            resetCategoryForm(state.categories.find((item) => item.id === editCategoryId));
        }

        if (deleteCategoryId && confirm("Xoa danh muc nay?")) {
            try {
                await api(`/api/categories/${deleteCategoryId}`, { method: "DELETE" });
                toast("Da xoa danh muc.");
                await loadAll();
            } catch (error) {
                handleError(error);
            }
        }
    });

    document.body.addEventListener("change", async (event) => {
        const orderId = event.target.dataset.orderStatus;

        if (!orderId) return;

        try {
            await api(`/api/orders/${orderId}`, {
                method: "PUT",
                body: JSON.stringify({ status: event.target.value })
            });
            toast("Da cap nhat don hang.");
            await loadAll();
        } catch (error) {
            handleError(error);
        }
    });
}

bindEvents();
(state.authToken ? loadAll() : loadPublicData()).catch(handleError);
