"use strict";

const state = {
    products: [],
    categories: [],
    orders: [],
    authenticated: false,
    editingVariants: []
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
            ...(options.headers || {})
        }
    });

    const data = await res.json();

    if (!res.ok) {
        const error = new Error(data.error || "API lỗi.");
        error.status = res.status;
        throw error;
    }

    return data;
}

function clearAdminSession() {
    setAuthenticated(false);
}

function isAuthError(error) {
    return error.status === 401
        || /\u0111\u0103ng nh\u1eadp|dang nhap|Ch\u01b0a \u0111\u0103ng nh\u1eadp|Unauthorized/i.test(error.message || "");
}

function setAuthenticated(authenticated) {
    state.authenticated = Boolean(authenticated);
    document.body.classList.toggle("admin-authenticated", state.authenticated);
    document.querySelectorAll("[data-admin-only]").forEach((element) => {
        element.classList.toggle("hidden", !state.authenticated);
    });
    $("#adminUsername").classList.toggle("hidden", state.authenticated);
    $("#adminPassword").classList.toggle("hidden", state.authenticated);
    $("#adminLoginButton").classList.toggle("hidden", state.authenticated);
    $("#adminLogoutButton").classList.toggle("hidden", !state.authenticated);
}

function handleError(error) {
    if (isAuthError(error)) {
        clearAdminSession();
        toast("Phi\u00ean \u0111\u0103ng nh\u1eadp h\u1ebft h\u1ea1n. H\u00e3y \u0111\u0103ng nh\u1eadp l\u1ea1i r\u1ed3i b\u1ea5m L\u01b0u.");
        loadPublicData().catch((loadError) => toast(loadError.message));
        return;
    }

    toast(error.message || "C\u00f3 l\u1ed7i x\u1ea3y ra.");
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
                    ${item.image || item.icon ? `<img data-admin-product-image src="${escapeHTML(item.image || item.icon)}" alt="${escapeHTML(item.name)}" loading="lazy">` : ""}
                    <strong>${escapeHTML(item.name)}</strong><br>
                    <small>${escapeHTML(item.slug)}</small>
                    ${item.icon ? `<br><small>Icon: ${escapeHTML(item.icon)}</small>` : ""}
                    ${item.canbosoProductId ? `<br><small>Canboso: ${escapeHTML(item.canbosoProductId)}</small>` : ""}
                </td>
                <td>${escapeHTML(categoryName(item.categorySlug))}</td>
                <td>
                    ${money(item.price)}${item.oldPrice ? `<br><small>Gi&aacute; c&#361;: ${money(item.oldPrice)}</small>` : ""}
                    ${item.canbosoCostPrice ? `<br><small>Gốc: ${money(item.canbosoCostPrice)}</small>` : ""}
                    ${item.canbosoMarkup ? `<br><small>Markup: ${money(item.canbosoMarkup)}</small>` : ""}
                </td>
                <td>${Number(item.stock || 0)}</td>
                <td>
                    <span class="status">${escapeHTML(item.status)}</span>
                    ${item.discount ? `<br><small>${escapeHTML(item.discount)}</small>` : ""}
                </td>
                <td>
                    <div class="row-actions ${state.authenticated ? "" : "hidden"}">
                        <button data-edit-product="${escapeHTML(item.id)}">S&#7917;a</button>
                        <button class="danger" data-delete-product="${escapeHTML(item.id)}">X&oacute;a</button>
                    </div>
                </td>
            </tr>
        `)
        .join("");

    $("#productsTable").querySelectorAll("[data-admin-product-image]").forEach((image) => {
        image.addEventListener("error", () => {
            image.src = "assets/images/storetainguyen-logo.png";
            image.classList.add("image-fallback");
        }, { once: true });
    });
}

function renderCategories() {
    $("#categoriesTable").innerHTML = state.categories
        .map((item) => `
            <tr>
                <td><strong>${escapeHTML(item.name)}</strong><br><small>${escapeHTML(item.description || "")}</small></td>
                <td>${escapeHTML(item.slug)}</td>
                <td><span class="status">${escapeHTML(item.status)}</span></td>
                <td>
                    <div class="row-actions ${state.authenticated ? "" : "hidden"}">
                        <button data-edit-category="${escapeHTML(item.id)}">S&#7917;a</button>
                        <button class="danger" data-delete-category="${escapeHTML(item.id)}">X&oacute;a</button>
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
                <td><strong>${escapeHTML(item.id || "-")}</strong><br><small>${escapeHTML(item.telegramUsername || item.customerName || item.customerPhone || "")}</small></td>
                <td>${escapeHTML(item.productName || productName(item.productId))} x ${Number(item.quantity || 1)}${item.canbosoFulfillmentStatus ? `<br><small>Canboso: ${escapeHTML(item.canbosoFulfillmentStatus)}</small>` : ""}</td>
                <td>${money(item.total)}${item.costTotal ? `<br><small>Gốc: ${money(item.costTotal)}</small>` : ""}${item.profitTotal ? `<br><small>Lãi: ${money(item.profitTotal)}</small>` : ""}</td>
                <td>
                    <select data-order-status="${escapeHTML(item.id)}">
                        ${["created", "pending", "paid", "delivered", "failed", "cancelled"].map((status) => `
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
        api("/api/admin/summary"),
        api("/api/admin/categories"),
        api("/api/admin/products"),
        api("/api/admin/orders")
    ]);

    state.categories = categories;
    state.products = products;
    state.orders = orders;
    setAuthenticated(true);

    renderStats(summary);
    fillCategorySelect();
    renderProducts();
    renderCategories();
    renderOrders();
}

async function loadPublicData() {
    const [summary, categories, products] = await Promise.all([
        api("/api/summary"),
        api("/api/public/categories"),
        api("/api/public/products")
    ]);

    state.categories = categories;
    state.products = products;
    state.orders = [];
    setAuthenticated(false);

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

function localDateTimeValue(value) {
    if (!value || !Number.isFinite(Date.parse(value))) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function emptyDuration() {
    return {
        id: "",
        label: "1 tháng",
        months: 1,
        price: 0,
        oldPrice: "",
        available: true,
        highlight: ""
    };
}

function emptyVariant() {
    return {
        id: "",
        label: "Loại gói mới",
        accountType: "other",
        description: "",
        available: true,
        durations: [emptyDuration()]
    };
}

function renderVariantEditor() {
    const root = $("#variantEditor");
    const variants = state.editingVariants;

    root.innerHTML = variants.length
        ? variants.map((variant, variantIndex) => `
            <section class="variant-editor-item" data-variant-index="${variantIndex}">
                <div class="variant-editor-head">
                    <h3>Loại gói ${variantIndex + 1}</h3>
                    <button class="compact-action danger" type="button" data-remove-variant="${variantIndex}">Xóa loại gói</button>
                </div>
                <div class="variant-fields">
                    <label>Tên gói<input data-variant-field="label" value="${escapeHTML(variant.label || "")}" required></label>
                    <label>Mã gói<input data-variant-field="id" value="${escapeHTML(variant.id || "")}" placeholder="tự tạo từ tên"></label>
                    <label>Kiểu tài khoản<select data-variant-field="accountType">
                        <option value="shared" ${variant.accountType === "shared" ? "selected" : ""}>Dùng chung</option>
                        <option value="private" ${variant.accountType === "private" ? "selected" : ""}>Dùng riêng</option>
                        <option value="other" ${!['shared', 'private'].includes(variant.accountType) ? "selected" : ""}>Khác</option>
                    </select></label>
                    <label>Mô tả<input data-variant-field="description" value="${escapeHTML(variant.description || "")}"></label>
                    <label class="check-label"><input data-variant-field="available" type="checkbox" ${variant.available !== false ? "checked" : ""}> Đang bán</label>
                </div>
                <div class="duration-editor">
                    <div class="duration-editor-head">
                        <h4>Thời hạn</h4>
                        <button class="compact-action" type="button" data-add-duration="${variantIndex}">Thêm thời hạn</button>
                    </div>
                    ${(variant.durations || []).map((duration, durationIndex) => `
                        <div class="duration-row" data-duration-index="${durationIndex}">
                            <label>Tên<input data-duration-field="label" value="${escapeHTML(duration.label || "")}" required></label>
                            <label>Số tháng<input data-duration-field="months" type="number" min="1" max="120" value="${duration.months || ""}"></label>
                            <label>Giá bán<input data-duration-field="price" type="number" min="0" value="${Number(duration.price || 0)}" required></label>
                            <label>Giá cũ<input data-duration-field="oldPrice" type="number" min="0" value="${duration.oldPrice ?? ""}"></label>
                            <label>Nhãn<input data-duration-field="highlight" value="${escapeHTML(duration.highlight || "")}" placeholder="Phổ biến"></label>
                            <label class="check-label"><input data-duration-field="available" type="checkbox" ${duration.available !== false ? "checked" : ""}> Bán</label>
                            <button class="compact-action danger" type="button" data-remove-duration="${durationIndex}" aria-label="Xóa thời hạn">Xóa</button>
                        </div>
                    `).join("")}
                </div>
            </section>
        `).join("")
        : '<p class="empty-editor">Chưa có loại gói. Giá sản phẩm chung sẽ được sử dụng cho đến khi bạn thêm loại gói.</p>';
}

function readVariantEditor() {
    return Array.from(document.querySelectorAll(".variant-editor-item")).map((variantElement) => ({
        id: variantElement.querySelector('[data-variant-field="id"]').value.trim(),
        label: variantElement.querySelector('[data-variant-field="label"]').value.trim(),
        accountType: variantElement.querySelector('[data-variant-field="accountType"]').value,
        description: variantElement.querySelector('[data-variant-field="description"]').value.trim(),
        available: variantElement.querySelector('[data-variant-field="available"]').checked,
        durations: Array.from(variantElement.querySelectorAll(".duration-row")).map((durationElement) => ({
            label: durationElement.querySelector('[data-duration-field="label"]').value.trim(),
            months: durationElement.querySelector('[data-duration-field="months"]').value,
            price: Number(durationElement.querySelector('[data-duration-field="price"]').value),
            oldPrice: durationElement.querySelector('[data-duration-field="oldPrice"]').value,
            highlight: durationElement.querySelector('[data-duration-field="highlight"]').value.trim(),
            available: durationElement.querySelector('[data-duration-field="available"]').checked
        }))
    }));
}

function syncVariantEditor() {
    state.editingVariants = readVariantEditor();
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
    $("#productCanbosoProductId").value = product.canbosoProductId || "";
    $("#productCanbosoCostPrice").value = product.canbosoCostPrice || "";
    $("#productCanbosoMarkup").value = product.canbosoMarkup || "";
    $("#productCanbosoSlotMonths").value = product.canbosoSlotMonths || "";
    $("#productRequiresCustomerEmail").checked = Boolean(product.requiresCustomerEmail);
    $("#productStock").value = product.stock || 0;
    $("#productRating").value = product.rating || 4.6;
    $("#productSold").value = product.sold || 0;
    $("#productStatus").value = product.status || "active";
    $("#productDescription").value = product.description || "";
    $("#productSaleEnabled").checked = Boolean(product.sale?.enabled);
    $("#productSaleEndsAt").value = localDateTimeValue(product.sale?.endsAt);
    $("#productSaleSoldPercent").value = Number(product.sale?.soldPercent || 0);
    $("#productSaleRemaining").value = Number(product.sale?.remaining || 0);
    state.editingVariants = JSON.parse(JSON.stringify(product.variants || []));
    renderVariantEditor();
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
        canbosoProductId: $("#productCanbosoProductId").value,
        canbosoCostPrice: $("#productCanbosoCostPrice").value,
        canbosoMarkup: $("#productCanbosoMarkup").value,
        canbosoSlotMonths: $("#productCanbosoSlotMonths").value,
        requiresCustomerEmail: $("#productRequiresCustomerEmail").checked,
        stock: Number($("#productStock").value),
        rating: Number($("#productRating").value),
        sold: Number($("#productSold").value),
        status: $("#productStatus").value,
        description: $("#productDescription").value,
        sale: {
            enabled: $("#productSaleEnabled").checked,
            endsAt: $("#productSaleEndsAt").value,
            soldPercent: Number($("#productSaleSoldPercent").value || 0),
            remaining: Number($("#productSaleRemaining").value || 0)
        },
        variants: readVariantEditor()
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

            if (result.user.role !== "admin") {
                throw new Error("Tài khoản này không có quyền admin.");
            }

            localStorage.setItem("adminUsername", result.user.username);
            $("#adminPassword").value = "";
            setAuthenticated(true);
            toast(`\u0110\u00e3 \u0111\u0103ng nh\u1eadp: ${result.user.name}`);
            await loadAll();
        } catch (error) {
            handleError(error);
        }
    });

    $("#adminLogoutButton").addEventListener("click", async () => {
        try {
            await api("/api/auth/logout", { method: "POST" });
        } catch {}
        clearAdminSession();
        await loadPublicData();
        toast("\u0110\u00e3 \u0111\u0103ng xu\u1ea5t.");
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
    $("#addVariantButton")?.addEventListener("click", () => {
        syncVariantEditor();
        state.editingVariants.push(emptyVariant());
        renderVariantEditor();
    });

    $("#variantEditor")?.addEventListener("click", (event) => {
        const removeVariant = event.target.dataset.removeVariant;
        const addDuration = event.target.dataset.addDuration;
        const removeDuration = event.target.dataset.removeDuration;

        if (removeVariant === undefined && addDuration === undefined && removeDuration === undefined) return;

        syncVariantEditor();

        if (removeVariant !== undefined) {
            state.editingVariants.splice(Number(removeVariant), 1);
        }

        if (addDuration !== undefined) {
            state.editingVariants[Number(addDuration)].durations.push(emptyDuration());
        }

        if (removeDuration !== undefined) {
            const variantIndex = Number(event.target.closest(".variant-editor-item").dataset.variantIndex);
            state.editingVariants[variantIndex].durations.splice(Number(removeDuration), 1);
        }

        renderVariantEditor();
    });

    $("#productForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            const id = $("#productId").value;
            await api(id ? `/api/admin/products/${id}` : "/api/admin/products", {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(productPayload())
            });
            $("#productForm").classList.add("hidden");
            toast("\u0110\u00e3 l\u01b0u s\u1ea3n ph\u1ea9m.");
            await loadAll();
        } catch (error) {
            handleError(error);
        }
    });

    $("#categoryForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            const id = $("#categoryId").value;
            await api(id ? `/api/admin/categories/${id}` : "/api/admin/categories", {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(categoryPayload())
            });
            $("#categoryForm").classList.add("hidden");
            toast("\u0110\u00e3 l\u01b0u danh m\u1ee5c.");
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

        if (deleteProductId && confirm("X\u00f3a s\u1ea3n ph\u1ea9m n\u00e0y?")) {
            try {
                await api(`/api/admin/products/${deleteProductId}`, { method: "DELETE" });
                toast("\u0110\u00e3 x\u00f3a s\u1ea3n ph\u1ea9m.");
                await loadAll();
            } catch (error) {
                handleError(error);
            }
        }

        if (editCategoryId) {
            resetCategoryForm(state.categories.find((item) => item.id === editCategoryId));
        }

        if (deleteCategoryId && confirm("X\u00f3a danh m\u1ee5c n\u00e0y?")) {
            try {
                await api(`/api/admin/categories/${deleteCategoryId}`, { method: "DELETE" });
                toast("\u0110\u00e3 x\u00f3a danh m\u1ee5c.");
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
            await api(`/api/admin/orders/${orderId}`, {
                method: "PUT",
                body: JSON.stringify({ status: event.target.value })
            });
            toast("\u0110\u00e3 c\u1eadp nh\u1eadt \u0111\u01a1n h\u00e0ng.");
            await loadAll();
        } catch (error) {
            handleError(error);
        }
    });
}

bindEvents();

async function initialize() {
    try {
        const user = await api("/api/auth/me");

        if (user.role !== "admin") {
            throw new Error("T\u00e0i kho\u1ea3n hi\u1ec7n t\u1ea1i kh\u00f4ng c\u00f3 quy\u1ec1n admin.");
        }

        await loadAll();
    } catch {
        clearAdminSession();
        await loadPublicData();
    }
}

initialize().catch(handleError);
