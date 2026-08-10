"use strict";

const $ = (selector) => document.querySelector(selector);
let registrationEnabled = false;

function toast(message) {
    const el = $("#registerToast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2300);
}

$("#registerPageForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!registrationEnabled) {
        toast("Đăng ký tài khoản đang tạm khóa.");
        return;
    }
    const email = $("#registerEmail").value.trim();
    const username = email.split("@")[0] || email;
    const password = $("#registerPassword").value;
    const passwordConfirm = $("#registerPasswordConfirm").value;

    if (password !== passwordConfirm) {
        toast("Xác nhận mật khẩu chưa khớp.");
        return;
    }

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không đăng ký được.");
        toast("Đăng ký thành công.");
        setTimeout(() => { location.href = "account.html"; }, 500);
    } catch (error) {
        toast(error.message);
    }
});

$("#openLoginLink").addEventListener("click", () => {
    window.KTKAuth?.openAuth();
});

async function loadRegistrationAvailability() {
    try {
        const response = await fetch("/api/public/settings");
        const settings = await response.json();
        registrationEnabled = response.ok && settings.registrationEnabled === true;
    } catch {
        registrationEnabled = false;
    }

    const button = $("#registerPageForm button[type=\"submit\"]");
    button.disabled = !registrationEnabled;
    button.textContent = registrationEnabled ? "Đăng Ký" : "Đăng ký tạm khóa";
}

loadRegistrationAvailability();
