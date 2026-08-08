"use strict";

(function () {
    const state = {
        token: localStorage.getItem("customerSession") || "",
        user: null
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    function api(path, options = {}) {
        return fetch(path, {
            ...options,
            headers: {
                "content-type": "application/json",
                "authorization": state.token ? `Bearer ${state.token}` : "",
                ...(options.headers || {})
            }
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra.");
            return data;
        });
    }

    function ensureUi() {
        if ($("#authPanel")) return;

        document.body.insertAdjacentHTML("beforeend", `
            <div class="auth-dim" id="authDim"></div>
            <aside class="auth-panel" id="authPanel">
                <div class="auth-head">
                    <h2 id="authTitle">Đăng nhập</h2>
                    <button class="auth-close" id="authClose" type="button">× Đóng</button>
                </div>
                <form class="auth-form" id="loginFormPublic">
                    <div class="auth-error" id="authError"></div>
                    <label>Tên tài khoản hoặc địa chỉ email *
                        <input id="loginUsername" autocomplete="username" required>
                    </label>
                    <label>Mật khẩu *
                        <input id="loginPassword" type="password" autocomplete="current-password" required>
                    </label>
                    <button class="auth-submit" type="submit">Đăng Nhập</button>
                    <div class="auth-row">
                        <label class="auth-remember"><input type="checkbox"> Nhớ đăng nhập</label>
                        <a href="#">Quên mật khẩu?</a>
                    </div>
                    <div class="auth-sep">HOẶC ĐĂNG NHẬP BẰNG</div>
                    <button class="auth-google" type="button">Google</button>
                </form>
                <div class="auth-register">
                    <div class="auth-avatar"></div>
                    <strong>Chưa có tài khoản?</strong>
                    <a class="auth-switch" href="register.html">Tạo Tài Khoản</a>
                </div>
            </aside>
            <div class="account-dropdown" id="accountDropdown">
                <a href="account.html">Trang tài khoản</a>
                <a href="account.html?tab=orders">Đơn hàng</a>
                <a href="account.html?tab=profile">Tài khoản</a>
                <a href="account.html?tab=wishlist">Wishlist</a>
                <button type="button" id="logoutButton">Đăng xuất</button>
            </div>
        `);

        $("#authClose").addEventListener("click", closeAuth);
        $("#authDim").addEventListener("click", closeAuth);
        $("#loginFormPublic").addEventListener("submit", login);
        $("#logoutButton").addEventListener("click", logout);
        document.addEventListener("click", (event) => {
            if (!event.target.closest(".account-dropdown, .header-action, .mobile-user")) {
                $("#accountDropdown")?.classList.remove("active");
            }
        });
    }

    function openAuth() {
        ensureUi();
        $("#authDim").classList.add("active");
        $("#authPanel").classList.add("active");
    }

    function closeAuth() {
        $("#authDim")?.classList.remove("active");
        $("#authPanel")?.classList.remove("active");
    }

    async function login(event) {
        event.preventDefault();
        showError("");

        try {
            const result = await api("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    username: $("#loginUsername").value.trim(),
                    password: $("#loginPassword").value
                })
            });
            saveSession(result);
            location.href = "account.html";
        } catch (error) {
            showError(error.message.includes("Unexpected token")
                ? "Bạn đang mở bằng static server. Hãy chạy backend Node bằng npm start rồi mở port 8020."
                : error.message);
        }
    }

    function showError(message) {
        const error = $("#authError");
        if (!error) return;
        error.textContent = message;
        error.classList.toggle("active", Boolean(message));
    }

    function saveSession(result) {
        state.token = result.token;
        state.user = result.user;
        localStorage.setItem("customerSession", result.token);
        closeAuth();
        updateButtons();
    }

    async function logout() {
        try {
            await api("/api/auth/logout", { method: "POST" });
        } catch {}
        state.token = "";
        state.user = null;
        localStorage.removeItem("customerSession");
        $("#accountDropdown")?.classList.remove("active");
        updateButtons();
        if (location.pathname.endsWith("account.html")) location.href = "index.html";
    }

    function profileButtons() {
        return $$(".header-action, .mobile-user").filter((button) =>
            button.querySelector(".bi-person, .bi-person-check")
        );
    }

    function updateButtons() {
        profileButtons().forEach((button) => {
            button.classList.toggle("is-logged-in", Boolean(state.user));
            const icon = button.querySelector("i");
            if (icon) icon.className = state.user ? "bi bi-person-check" : "bi bi-person";
        });
    }

    function showDropdown(button) {
        ensureUi();
        const dropdown = $("#accountDropdown");
        const box = button.getBoundingClientRect();
        dropdown.style.top = `${box.bottom + 8}px`;
        dropdown.style.left = `${Math.min(box.left - 140, window.innerWidth - 230)}px`;
        dropdown.classList.toggle("active");
    }

    function bindProfileButtons() {
        profileButtons().forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (state.user) showDropdown(button);
                else openAuth(false);
            });
        });
    }

    async function boot() {
        ensureUi();
        bindProfileButtons();
        if (state.token) {
            try {
                state.user = await api("/api/auth/me");
            } catch {
                localStorage.removeItem("customerSession");
                state.token = "";
            }
        }
        updateButtons();
        window.KTKAuth = { openAuth, logout, api, state };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
