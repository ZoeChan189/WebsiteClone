"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { after, before, test } = require("node:test");

const projectDir = path.resolve(__dirname, "..");
const port = 18000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const adminPassword = "Admin-password-for-tests-2026";
const botSecret = "bot-access-secret-for-tests-1234567890";
const signingSecret = "bot-signing-secret-for-tests-0987654321";
let child;
let tempDir;
let serverOutput = "";
let firstProduct;
let adminCookie;

async function api(pathname, options = {}) {
    const response = await fetch(`${baseUrl}${pathname}`, options);
    const data = await response.json().catch(() => ({}));
    return { response, data };
}

async function waitForServer() {
    const deadline = Date.now() + 10000;

    while (Date.now() < deadline) {
        if (child.exitCode !== null) {
            throw new Error(`Server exited early.\n${serverOutput}`);
        }

        try {
            const response = await fetch(`${baseUrl}/api/health`);
            if (response.ok) return;
        } catch {}

        await new Promise((resolve) => setTimeout(resolve, 80));
    }

    throw new Error(`Server did not start.\n${serverOutput}`);
}

function signedBotRequest(body) {
    const rawBody = JSON.stringify(body);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = crypto
        .createHmac("sha256", signingSecret)
        .update(`${timestamp}.${rawBody}`)
        .digest("hex");

    return {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-bot-secret": botSecret,
            "x-bot-timestamp": timestamp,
            "x-bot-signature": `sha256=${signature}`
        },
        body: rawBody
    };
}

function signedBotGet(pathname) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = crypto
        .createHmac("sha256", signingSecret)
        .update(`${timestamp}.GET.${pathname}`)
        .digest("hex");

    return {
        headers: {
            "x-bot-secret": botSecret,
            "x-bot-timestamp": timestamp,
            "x-bot-signature": `sha256=${signature}`
        }
    };
}

before(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "storetainguyen-test-"));
    child = spawn(process.execPath, ["server.js"], {
        cwd: projectDir,
        env: {
            ...process.env,
            NODE_ENV: "production",
            PORT: String(port),
            DATA_FILE: path.join(tempDir, "db.json"),
            SESSION_SECRET: "session-secret-for-tests-123456789012345",
            DATA_ENCRYPTION_KEY: "data-encryption-key-for-tests-123456789",
            ADMIN_PASSWORD: adminPassword,
            ALLOW_REGISTRATION: "true",
            TELEGRAM_BOT_URL: "https://t.me/TestStoreBot",
            BOT_WEBHOOK_SECRET: botSecret,
            BOT_WEBHOOK_SIGNING_SECRET: signingSecret,
            BOT_REQUIRE_SIGNATURE: "true",
            BOT_REQUIRE_PAYMENT_REF: "true"
        },
        stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
    child.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
    await waitForServer();

    const products = await api("/api/public/products");
    assert.equal(products.response.status, 200, `${JSON.stringify(products.data)}\n${serverOutput}`);
    firstProduct = products.data.find((item) => item.status === "active" && item.stock > 0);
    assert.ok(firstProduct);
});

after(async () => {
    if (child && child.exitCode === null) {
        child.kill();
        await new Promise((resolve) => child.once("exit", resolve));
    }

    if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

test("private source and database files are not served", async () => {
    for (const pathname of ["/data/db.json", "/server.js", "/SERVER.JS", "/package.json", "/BOT_INTEGRATION.md", "/.env"]) {
        const response = await fetch(`${baseUrl}${pathname}`);
        assert.equal(response.status, 404, pathname);
    }
});

test("security headers are present", async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/);
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("public product API excludes Canboso fields", async () => {
    const { response, data } = await api("/api/public/products");
    assert.equal(response.status, 200);
    assert.ok(data.length > 0);
    assert.equal("canbosoProductId" in data[0], false);
    assert.equal("canbosoCostPrice" in data[0], false);
});

test("public settings expose flags but never server secrets", async () => {
    const { response, data } = await api("/api/public/settings");
    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(data).sort(), ["registrationEnabled", "telegramBotUrl", "telegramEnabled"]);
    assert.equal(data.registrationEnabled, true);
    assert.equal(JSON.stringify(data).includes(botSecret), false);
    assert.equal(JSON.stringify(data).includes(signingSecret), false);
});

test("invalid JSON is rejected without exposing an internal error", async () => {
    const result = await api("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not-json"
    });
    assert.equal(result.response.status, 400);
    assert.equal(result.data.error, "JSON không hợp lệ.");
});

test("admin authentication and private API separation work", async () => {
    const login = await api("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "admin", password: adminPassword })
    });
    assert.equal(login.response.status, 200);
    assert.equal(login.data.user.role, "admin");
    assert.equal("token" in login.data, false);
    assert.match(login.response.headers.get("set-cookie") || "", /__Host-stn_session=.*HttpOnly.*SameSite=Strict.*Secure/i);
    adminCookie = (login.response.headers.get("set-cookie") || "").split(";")[0];

    const denied = await api("/api/admin/products");
    assert.equal(denied.response.status, 401);

    const allowed = await api("/api/admin/products", {
        headers: { cookie: adminCookie }
    });
    assert.equal(allowed.response.status, 200);
    assert.equal("canbosoProductId" in allowed.data[0], true);
});

test("admin input validation blocks unsafe asset URLs", async () => {
    const result = await api(`/api/admin/products/${encodeURIComponent(firstProduct.id)}`, {
        method: "PUT",
        headers: {
            "content-type": "application/json",
            cookie: adminCookie
        },
        body: JSON.stringify({ image: "javascript:alert(1)" })
    });
    assert.equal(result.response.status, 400);
});

test("customer password change requires current password and rotates the HttpOnly session", async () => {
    const email = `security-${Date.now()}@example.com`;
    const password = "Customer-password-2026";
    const register = await api("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: email, email, password })
    });
    assert.equal(register.response.status, 201);
    assert.equal("token" in register.data, false);
    const oldCookie = (register.response.headers.get("set-cookie") || "").split(";")[0];
    assert.ok(oldCookie.startsWith("__Host-stn_session="));

    const denied = await api("/api/account", {
        method: "PUT",
        headers: {
            "content-type": "application/json",
            cookie: oldCookie
        },
        body: JSON.stringify({ email, name: "Customer", newPassword: "New-customer-password-2026" })
    });
    assert.equal(denied.response.status, 400);

    const changed = await api("/api/account", {
        method: "PUT",
        headers: {
            "content-type": "application/json",
            cookie: oldCookie
        },
        body: JSON.stringify({
            email,
            name: "Customer",
            currentPassword: password,
            newPassword: "New-customer-password-2026"
        })
    });
    assert.equal(changed.response.status, 200);
    assert.equal("token" in changed.data, false);
    const newCookie = (changed.response.headers.get("set-cookie") || "").split(";")[0];
    assert.ok(newCookie.startsWith("__Host-stn_session="));
    assert.notEqual(newCookie, oldCookie);

    const oldSession = await api("/api/account", {
        headers: { cookie: oldCookie }
    });
    assert.equal(oldSession.response.status, 401);

    const newSession = await api("/api/account", {
        headers: { cookie: newCookie }
    });
    assert.equal(newSession.response.status, 200);
});

test("product variants drive server-side order pricing", async () => {
    const products = await api("/api/public/products");
    const chatgpt = products.data.find((item) => item.slug === "tai-khoan-chatgpt-plus-pro-gpt-5-6");

    assert.ok(chatgpt);
    assert.equal(chatgpt.sale.enabled, true);
    assert.ok(chatgpt.variants.some((variant) => variant.id === "plus-dung-rieng"));

    const selected = await api("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            productSlug: chatgpt.slug,
            quantity: 1,
            options: { variant: "plus-dung-rieng", duration: "3-thang" }
        })
    });
    assert.equal(selected.response.status, 201);
    assert.equal(selected.data.amount, 1199000);

    const invalid = await api("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            productSlug: chatgpt.slug,
            quantity: 1,
            options: { variant: "khong-ton-tai", duration: "1-thang" }
        })
    });
    assert.equal(invalid.response.status, 400);
});

test("expired product sale is omitted from the live catalog", async () => {
    const products = await api("/api/admin/products", { headers: { cookie: adminCookie } });
    const chatgpt = products.data.find((item) => item.slug === "tai-khoan-chatgpt-plus-pro-gpt-5-6");
    const expired = await api(`/api/admin/products/${encodeURIComponent(chatgpt.id)}`, {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: adminCookie },
        body: JSON.stringify({
            sale: { enabled: true, endsAt: "2020-01-01T00:00:00.000Z", soldPercent: 44, remaining: 10 }
        })
    });
    assert.equal(expired.response.status, 200);

    const catalogResponse = await fetch(`${baseUrl}/js/products.js`);
    const catalogSource = await catalogResponse.text();
    const productStart = catalogSource.indexOf(`"${chatgpt.slug}"`);
    const nextProduct = catalogSource.indexOf("\n  },", productStart);
    const productSource = catalogSource.slice(productStart, nextProduct);

    assert.ok(productStart >= 0);
    assert.match(productSource, /"deal":\s*\{\s*"enabled": false\s*\}/);
});

test("order response hides internal prices and integration data", async () => {
    const created = await api("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: firstProduct.id, quantity: 1 })
    });
    assert.equal(created.response.status, 201);
    assert.ok(created.data.orderId);
    assert.equal("costTotal" in created.data, false);
    assert.equal("profitTotal" in created.data, false);
    assert.equal("canbosoResults" in created.data, false);
    assert.equal("deliveredAccounts" in created.data, false);
    assert.equal("botOrderApi" in created.data, false);

    const unsigned = await api("/api/bot/order-paid", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-bot-secret": botSecret
        },
        body: JSON.stringify({
            orderId: created.data.orderId,
            amount: created.data.amount,
            status: "paid",
            botPaymentRef: "test-payment-1"
        })
    });
    assert.equal(unsigned.response.status, 401);

    const mismatchBody = {
        orderId: created.data.orderId,
        amount: created.data.amount - 1,
        status: "paid",
        botPaymentRef: "test-payment-1"
    };
    const mismatch = await api("/api/bot/order-paid", signedBotRequest(mismatchBody));
    assert.equal(mismatch.response.status, 409);

    const paidBody = {
        orderId: created.data.orderId,
        amount: created.data.amount,
        status: "paid",
        telegramUserId: "123456",
        botPaymentRef: "test-payment-1"
    };
    const paid = await api("/api/bot/order-paid", signedBotRequest(paidBody));
    assert.equal(paid.response.status, 200);
    assert.equal(paid.data.status, "paid");
    assert.equal(paid.data.canbosoFulfillmentStatus, "skipped");

    const botOrderPath = `/api/bot/orders/${created.data.orderId}`;
    const unsignedBotRead = await api(botOrderPath, {
        headers: { "x-bot-secret": botSecret }
    });
    assert.equal(unsignedBotRead.response.status, 401);

    const botOrder = await api(botOrderPath, signedBotGet(botOrderPath));
    assert.equal(botOrder.response.status, 200);
    assert.equal(botOrder.data.telegramUserId, "123456");
    assert.equal("costPrice" in botOrder.data.items[0], false);
    assert.equal("canbosoProductId" in botOrder.data.items[0], false);

    const secondOrder = await api("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: firstProduct.id, quantity: 1 })
    });
    assert.equal(secondOrder.response.status, 201);
    const reusedPayment = await api("/api/bot/order-paid", signedBotRequest({
        orderId: secondOrder.data.orderId,
        amount: secondOrder.data.amount,
        status: "paid",
        botPaymentRef: "test-payment-1"
    }));
    assert.equal(reusedPayment.response.status, 409);

    const persistedDatabase = await fs.readFile(path.join(tempDir, "db.json"), "utf8");
    assert.doesNotMatch(persistedDatabase, /test-payment-1|123456/);
    assert.match(persistedDatabase, /"sensitiveEncrypted": "enc:v1:/);
});

test("logout invalidates the server-side session version", async () => {
    const logout = await api("/api/auth/logout", {
        method: "POST",
        headers: { cookie: adminCookie }
    });
    assert.equal(logout.response.status, 200);
    assert.match(logout.response.headers.get("set-cookie") || "", /Max-Age=0/);

    const denied = await api("/api/admin/summary", {
        headers: { cookie: adminCookie }
    });
    assert.equal(denied.response.status, 401);
});

test("frontend never stores authentication tokens in Web Storage", async () => {
    for (const filename of ["js/auth.js", "js/account.js", "js/admin.js", "js/register.js"]) {
        const source = await fs.readFile(path.join(projectDir, filename), "utf8");
        assert.doesNotMatch(source, /customerSession|adminSession|authorization\s*:/, filename);
    }
});
