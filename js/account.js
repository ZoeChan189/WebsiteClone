"use strict";

const state = { user: null, orders: [] };
const $ = (selector) => document.querySelector(selector);

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function toast(message) {
    const el = $("#accountToast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
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
    if (!res.ok) throw new Error(data.error || "API lỗi.");
    return data;
}

function setTab(tab) {
    if (tab === "logout") return logout();
    if (tab === "admin") {
        location.href = "admin.html";
        return;
    }
    document.querySelectorAll(".account-tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    document.querySelectorAll(".account-panel").forEach((panel) => panel.classList.remove("active"));
    $(`#${tab}Panel`).classList.add("active");
    history.replaceState(null, "", `account.html?tab=${tab}`);
}

function renderUser() {
    $("#helloName").textContent = state.user.name || state.user.username;
    $("#helloName2").textContent = state.user.name || state.user.username;
    $("#firstName").value = state.user.firstName || "";
    $("#lastName").value = state.user.lastName || "";
    $("#displayName").value = state.user.name || state.user.username;
    $("#email").value = state.user.email || "";
}

function renderAdminAccess() {
    if (state.user.role !== "admin") return;

    const nav = $(".account-side nav");
    const dashGrid = $(".dash-grid");

    if (nav && !nav.querySelector('[data-tab="admin"]')) {
        const adminTab = document.createElement("button");
        adminTab.className = "account-tab admin-only";
        adminTab.dataset.tab = "admin";
        adminTab.textContent = "Admin portal";
        nav.insertBefore(adminTab, nav.querySelector('[data-tab="logout"]'));
    }

    if (dashGrid && !dashGrid.querySelector("[data-admin-portal]")) {
        const adminCard = document.createElement("button");
        adminCard.type = "button";
        adminCard.dataset.adminPortal = "true";
        adminCard.innerHTML = '<i class="bi bi-speedometer2"></i><span>Admin portal</span>';
        adminCard.addEventListener("click", () => {
            location.href = "admin.html";
        });
        dashGrid.appendChild(adminCard);
    }
}

function renderOrders() {
    $("#orderCount").textContent = state.orders.length;
    const notice = $("#ordersPanel .notice span");
    const list = $("#ordersList");
    if (!state.orders.length) {
        notice.textContent = "Bạn chưa có đơn hàng nào.";
        list.innerHTML = "";
        return;
    }
    notice.textContent = `Bạn có ${state.orders.length} đơn hàng.`;
    list.innerHTML = state.orders.map((order) => `
        <article class="order-row">
            <strong>${escapeHTML(order.id)}</strong>
            <span>${Number(order.total || 0).toLocaleString("vi-VN")}đ</span>
            <span>${escapeHTML(order.status)}</span>
        </article>
    `).join("");
}

async function logout() {
    try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    location.href = "index.html";
}

async function saveProfile(event) {
    event.preventDefault();
    if ($("#newPassword").value && $("#newPassword").value !== $("#confirmPassword").value) {
        toast("Xác nhận mật khẩu chưa khớp.");
        return;
    }
    const result = await api("/api/account", {
        method: "PUT",
        body: JSON.stringify({
            firstName: $("#firstName").value,
            lastName: $("#lastName").value,
            name: $("#displayName").value,
            email: $("#email").value,
            currentPassword: $("#currentPassword").value,
            newPassword: $("#newPassword").value
        })
    });

    state.user = result;

    $("#currentPassword").value = "";
    $("#newPassword").value = "";
    $("#confirmPassword").value = "";
    renderUser();
    toast("Đã lưu thay đổi.");
}

async function boot() {
    try {
        state.user = await api("/api/account");
        state.orders = await api("/api/account/orders");
    } catch {
        location.href = "index.html";
        return;
    }
    renderUser();
    renderAdminAccess();
    renderOrders();
    document.querySelectorAll(".account-tab").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
    document.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", (event) => {
        event.preventDefault();
        setTab(button.dataset.jump);
    }));
    document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", (event) => {
        event.preventDefault();
        logout();
    }));
    $("#profileForm").addEventListener("submit", saveProfile);
    setTab(new URLSearchParams(location.search).get("tab") || "dashboard");
}

boot();
