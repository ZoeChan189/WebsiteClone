"use strict";

const $ = (selector) => document.querySelector(selector);

function toast(message) {
    const el = $("#registerToast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2300);
}

$("#registerPageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("#registerEmail").value.trim();
    const username = email.split("@")[0] || email;
    const password = `temp-${Date.now()}`;

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không đăng ký được.");
        localStorage.setItem("customerSession", data.token);
        toast("Đăng ký thành công.");
        setTimeout(() => { location.href = "account.html"; }, 500);
    } catch (error) {
        toast(error.message);
    }
});

$("#openLoginLink").addEventListener("click", () => {
    window.KTKAuth?.openAuth();
});
