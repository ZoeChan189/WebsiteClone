"use strict";

const crypto = require("crypto");
const fs = require("fs/promises");
const https = require("https");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const seedDataFile = path.join(rootDir, "data", "db.json");
const dataFile = process.env.DATA_FILE
    ? path.resolve(process.env.DATA_FILE)
    : seedDataFile;
const environment = String(process.env.NODE_ENV || "development").toLowerCase();
const isProduction = environment === "production";
const port = Number(process.env.PORT || 8010);
const host = String(process.env.HOST || (isProduction ? "127.0.0.1" : "0.0.0.0")).trim();
const sessionSecret = process.env.SESSION_SECRET || "storetainguyen-dev-session-secret";
const dataEncryptionSecret = process.env.DATA_ENCRYPTION_KEY || "";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES || 250000);
const sessionMaxAgeMs = Number(process.env.SESSION_MAX_AGE_MS || 24 * 60 * 60 * 1000);
const allowRegistration = process.env.ALLOW_REGISTRATION
    ? process.env.ALLOW_REGISTRATION === "true"
    : !isProduction;
const telegramBotUrl = (process.env.TELEGRAM_BOT_URL || "").replace(/\/+$/, "");
const botWebhookSecret = process.env.BOT_WEBHOOK_SECRET || "";
const botWebhookSigningSecret = process.env.BOT_WEBHOOK_SIGNING_SECRET || "";
const botRequireSignature = process.env.BOT_REQUIRE_SIGNATURE
    ? process.env.BOT_REQUIRE_SIGNATURE === "true"
    : isProduction;
const botRequirePaymentRef = process.env.BOT_REQUIRE_PAYMENT_REF
    ? process.env.BOT_REQUIRE_PAYMENT_REF === "true"
    : isProduction;
const botWebhookMaxSkewMs = Number(process.env.BOT_WEBHOOK_MAX_SKEW_MS || 5 * 60 * 1000);
const trustProxyHeaders = process.env.TRUST_PROXY_HEADERS === "true";
const canbosoApiBase = (process.env.CANBOSO_API_BASE || "https://canboso.com").replace(/\/+$/, "");
const canbosoApiKey = process.env.CANBOSO_API_KEY || "";
const canbosoMarkupVnd = Number(process.env.CANBOSO_MARKUP_VND || 10000);
const sessionCookieName = isProduction ? "__Host-stn_session" : "stn_session";
const loginAttempts = new Map();
const registerAttempts = new Map();
const orderAttempts = new Map();
const botAttempts = new Map();
let mutationQueue = Promise.resolve();

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

function sendJson(res, status, payload, extraHeaders = {}) {
    res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        ...securityHeaders(),
        ...extraHeaders
    });
    res.end(JSON.stringify(payload));
}

function sendJs(res, payload) {
    res.writeHead(200, {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
        ...securityHeaders()
    });
    res.end(payload);
}

function sendError(res, status, message) {
    sendJson(res, status, { error: message });
}

function httpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.expose = statusCode >= 400 && statusCode < 500;
    return error;
}

function redactSensitive(value) {
    let output = String(value ?? "");

    for (const secret of [
        sessionSecret,
        dataEncryptionSecret,
        adminPassword,
        botWebhookSecret,
        botWebhookSigningSecret,
        canbosoApiKey
    ]) {
        if (secret && secret.length >= 8) {
            output = output.split(secret).join("[REDACTED]");
        }
    }

    return output;
}

function dataEncryptionKey() {
    return dataEncryptionSecret
        ? crypto.createHash("sha256").update(dataEncryptionSecret).digest()
        : null;
}

function encryptSensitiveJson(value) {
    const key = dataEncryptionKey();

    if (!key) {
        return "";
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(value), "utf8"),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();

    return ["enc", "v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

function decryptSensitiveJson(value) {
    const key = dataEncryptionKey();
    const parts = String(value || "").split(":");

    if (!key) {
        throw new Error("DATA_ENCRYPTION_KEY is required to decrypt order data.");
    }

    if (parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "v1") {
        throw new Error("Unsupported encrypted order data format.");
    }

    try {
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(parts[2], "base64url"));
        decipher.setAuthTag(Buffer.from(parts[3], "base64url"));
        const plaintext = Buffer.concat([
            decipher.update(Buffer.from(parts[4], "base64url")),
            decipher.final()
        ]).toString("utf8");
        return JSON.parse(plaintext);
    } catch {
        throw new Error("Cannot decrypt order data. Check DATA_ENCRYPTION_KEY.");
    }
}

function securityHeaders() {
    const headers = {
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "no-referrer",
        "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
        "cross-origin-opener-policy": "same-origin",
        "content-security-policy": [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
            "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
            "img-src 'self' data: https:",
            "connect-src 'self'"
        ].join("; ")
    };

    if (isProduction) {
        headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
        headers["content-security-policy"] += "; upgrade-insecure-requests";
    }

    return headers;
}

function httpsJsonRequest(method, targetUrl, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(targetUrl);

        if (url.protocol !== "https:") {
            reject(new Error("Upstream API must use HTTPS."));
            return;
        }

        const payload = body ? JSON.stringify(body) : "";
        const request = https.request(
            {
                hostname: url.hostname,
                path: `${url.pathname}${url.search}`,
                method,
                timeout: 20000,
                headers: {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "content-length": Buffer.byteLength(payload),
                    "user-agent": "storetainguyen-backend",
                    ...headers
                }
            },
            (response) => {
                const chunks = [];
                let responseBytes = 0;

                response.on("data", (chunk) => {
                    responseBytes += chunk.length;

                    if (responseBytes > 1024 * 1024) {
                        request.destroy(new Error("Upstream API response is too large."));
                        return;
                    }

                    chunks.push(chunk);
                });
                response.on("end", () => {
                    const raw = Buffer.concat(chunks).toString("utf8");
                    let data = {};

                    try {
                        data = raw ? JSON.parse(raw) : {};
                    } catch {
                        data = { message: raw };
                    }

                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        resolve(data);
                        return;
                    }

                    const error = new Error(data.message || `Upstream API error ${response.statusCode}`);
                    error.statusCode = response.statusCode;
                    error.retryAfter = response.headers["retry-after"] || "";
                    reject(error);
                });
            }
        );

        request.on("timeout", () => request.destroy(new Error("Upstream API timeout")));
        request.on("error", reject);
        request.end(payload);
    });
}

function hashPassword(password) {
    return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function createPasswordHash(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(String(password), salt, 32).toString("hex");
    return `scrypt$${salt}$${hash}`;
}

function timingSafeEqualHex(left, right) {
    const leftHex = String(left || "");
    const rightHex = String(right || "");

    if (!/^[a-f0-9]+$/i.test(leftHex) || !/^[a-f0-9]+$/i.test(rightHex)) {
        return false;
    }

    const leftBuffer = Buffer.from(leftHex, "hex");
    const rightBuffer = Buffer.from(rightHex, "hex");

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyPassword(password, storedHash) {
    const hash = String(storedHash || "");

    if (hash.startsWith("scrypt$")) {
        const parts = hash.split("$");

        if (parts.length !== 3 || !parts[1] || !parts[2]) {
            return false;
        }

        const actual = crypto.scryptSync(String(password), parts[1], 32).toString("hex");
        return timingSafeEqualHex(actual, parts[2]);
    }

    if (hash.startsWith("pbkdf2$")) {
        const parts = hash.split("$");

        if (parts.length !== 3 || !parts[1] || !parts[2]) {
            return false;
        }

        const [, salt, expected] = parts;
        const actual = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
        return timingSafeEqualHex(actual, expected);
    }

    return timingSafeEqualHex(hashPassword(password), hash);
}

function verifyAdminPassword(password, user) {
    if (adminPasswordHash) {
        return verifyPassword(password, adminPasswordHash);
    }

    if (adminPassword) {
        return timingSafeEqualString(password, adminPassword);
    }

    return verifyPassword(password, user?.passwordHash);
}

function base64UrlEncode(value) {
    return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
    return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload) {
    return crypto
        .createHmac("sha256", sessionSecret)
        .update(payload)
        .digest("base64url");
}

function timingSafeEqualString(left, right) {
    const leftBuffer = Buffer.from(String(left || ""));
    const rightBuffer = Buffer.from(String(right || ""));

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createSessionToken(user) {
    const payload = base64UrlEncode(JSON.stringify({
        userId: user.id,
        createdAt: Date.now(),
        sessionVersion: Number(user.sessionVersion || 0)
    }));

    return `${payload}.${signPayload(payload)}`;
}

function sessionCookie(token) {
    const maxAge = Math.max(1, Math.floor(sessionMaxAgeMs / 1000));
    const secure = isProduction ? "; Secure" : "";
    return `${sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie() {
    const secure = isProduction ? "; Secure" : "";
    return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

function cookieValue(req, name) {
    const cookieHeader = String(req.headers.cookie || "");

    for (const part of cookieHeader.split(";")) {
        const separator = part.indexOf("=");

        if (separator < 0 || part.slice(0, separator).trim() !== name) {
            continue;
        }

        try {
            return decodeURIComponent(part.slice(separator + 1).trim());
        } catch {
            return "";
        }
    }

    return "";
}

function sessionFromToken(token) {
    if (!token) {
        return null;
    }

    const [payload, signature] = token.split(".");

    if (!payload || !signature || !timingSafeEqualString(signPayload(payload), signature)) {
        return null;
    }

    try {
        const session = JSON.parse(base64UrlDecode(payload));

        if (!session.createdAt || Date.now() - Number(session.createdAt) > sessionMaxAgeMs) {
            return null;
        }

        if (!session.userId || !Number.isInteger(Number(session.sessionVersion || 0))) {
            return null;
        }

        return session;
    } catch {
        return null;
    }
}

function authContext(req, db) {
    const header = req.headers.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : "";
    const token = bearerToken || cookieValue(req, sessionCookieName);
    const session = sessionFromToken(token);

    if (!session) {
        return null;
    }

    const user = db.users?.find((item) => item.id === session.userId) || null;

    if (!user || Number(user.sessionVersion || 0) !== Number(session.sessionVersion || 0)) {
        return null;
    }

    return { user, token, session };
}

function authUser(req, db) {
    return authContext(req, db)?.user || null;
}

function isAdmin(req, db) {
    return authUser(req, db)?.role === "admin";
}

function requireAdmin(req, res, db) {
    if (isAdmin(req, db)) {
        return true;
    }

    sendError(res, 401, "Bạn cần đăng nhập tài khoản admin.");
    return false;
}

async function readRawBody(req) {
    if (typeof req.rawBody === "string") {
        return req.rawBody;
    }

    const contentType = String(req.headers["content-type"] || "").toLowerCase();

    if (!contentType.startsWith("application/json")) {
        throw httpError(415, "Content-Type phải là application/json.");
    }

    const chunks = [];
    let total = 0;

    for await (const chunk of req) {
        total += chunk.length;

        if (total > maxBodyBytes) {
            throw httpError(413, "Payload quá lớn.");
        }

        chunks.push(chunk);
    }

    req.rawBody = Buffer.concat(chunks).toString("utf8");
    return req.rawBody;
}

async function readBody(req) {
    const raw = (await readRawBody(req)).trim();

    if (!raw) {
        return {};
    }

    try {
        return JSON.parse(raw);
    } catch {
        throw httpError(400, "JSON không hợp lệ.");
    }
}

function clientIp(req) {
    if (trustProxyHeaders && req.headers["x-real-ip"]) {
        return String(req.headers["x-real-ip"]).trim();
    }

    return String(req.socket.remoteAddress || "").trim();
}

function consumeRateLimit(store, key, maxAttempts, windowMs) {
    const now = Date.now();

    if (store.size > 10000) {
        for (const [storedKey, storedBucket] of store) {
            if (storedBucket.resetAt <= now) {
                store.delete(storedKey);
            }
        }
    }

    const bucket = store.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    store.set(key, bucket);

    return bucket.count <= maxAttempts;
}

function checkLoginRateLimit(req) {
    return consumeRateLimit(loginAttempts, clientIp(req) || "unknown", 12, 15 * 60 * 1000);
}

function clearLoginRateLimit(req) {
    loginAttempts.delete(clientIp(req) || "unknown");
}

const sensitiveOrderFields = [
    "customerName",
    "customerPhone",
    "customerEmail",
    "telegramUserId",
    "telegramUsername",
    "botPaymentRef",
    "deliveredAccounts",
    "note"
];

function hydrateSensitiveOrders(db) {
    for (const order of db.orders || []) {
        if (!order.sensitiveEncrypted) {
            continue;
        }

        const sensitive = decryptSensitiveJson(order.sensitiveEncrypted);

        for (const field of sensitiveOrderFields) {
            if (hasOwn(sensitive, field)) {
                order[field] = sensitive[field];
            }
        }

        delete order.sensitiveEncrypted;
    }

    return db;
}

function databaseForPersistence(db) {
    const persisted = JSON.parse(JSON.stringify(db));

    if (!dataEncryptionSecret) {
        return persisted;
    }

    for (const order of persisted.orders || []) {
        const sensitive = {};

        for (const field of sensitiveOrderFields) {
            sensitive[field] = order[field] ?? (field === "deliveredAccounts" ? [] : "");
            delete order[field];
        }

        order.sensitiveEncrypted = encryptSensitiveJson(sensitive);
    }

    return persisted;
}

async function readDb() {
    try {
        await fs.access(dataFile);
    } catch {
        await fs.mkdir(path.dirname(dataFile), { recursive: true });
        await fs.copyFile(seedDataFile, dataFile);
    }

    const raw = await fs.readFile(dataFile, "utf8");
    return hydrateSensitiveOrders(JSON.parse(raw));
}

async function writeDb(db) {
    const raw = JSON.stringify(databaseForPersistence(db), null, 2) + "\n";
    const directory = path.dirname(dataFile);
    const tempFile = path.join(directory, `.${path.basename(dataFile)}.${process.pid}.tmp`);

    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    await fs.writeFile(tempFile, raw, { encoding: "utf8", mode: 0o600 });
    await fs.rename(tempFile, dataFile);

    if (process.platform !== "win32") {
        await fs.chmod(dataFile, 0o600);
    }
}

function withMutationLock(task) {
    const run = mutationQueue.then(task, task);
    mutationQueue = run.catch(() => {});
    return run;
}

function createId(prefix) {
    return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function inputValue(input, existing, key, fallback = "") {
    if (hasOwn(input, key)) {
        return input[key];
    }

    if (hasOwn(existing, key)) {
        return existing[key];
    }

    return fallback;
}

function boundedString(value, maxLength, fieldName) {
    const output = String(value ?? "").trim();

    if (output.length > maxLength) {
        throw httpError(400, `${fieldName} vượt quá ${maxLength} ký tự.`);
    }

    return output;
}

function finiteNumber(value, fieldName, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}) {
    const output = Number(value);

    if (!Number.isFinite(output) || output < min || output > max || (integer && !Number.isInteger(output))) {
        throw httpError(400, `${fieldName} không hợp lệ.`);
    }

    return output;
}

function sanitizeAssetUrl(value, fieldName) {
    const output = boundedString(value, 1000, fieldName);

    if (!output) {
        return "";
    }

    if (/^(?:assets|images)\/[a-z0-9_./-]+$/i.test(output) && !output.includes("..")) {
        return output;
    }

    let url;

    try {
        url = new URL(output);
    } catch {
        throw httpError(400, `${fieldName} phải là URL HTTPS hoặc đường dẫn asset hợp lệ.`);
    }

    if (url.protocol !== "https:" && !(environment === "development" && url.protocol === "http:")) {
        throw httpError(400, `${fieldName} phải dùng HTTPS.`);
    }

    if (url.username || url.password) {
        throw httpError(400, `${fieldName} không được chứa thông tin đăng nhập.`);
    }

    return url.toString();
}

function publicAssetUrl(value) {
    try {
        return sanitizeAssetUrl(value, "Asset");
    } catch {
        return "";
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function sanitizeOrderOptions(value) {
    const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const output = {};

    for (const key of ["package", "variant", "duration", "privateAccount", "accountIdentifier", "customerEmail", "email"]) {
        if (hasOwn(input, key)) {
            output[key] = boundedString(input[key], 200, `options.${key}`);
        }
    }

    return output;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "")) && String(value).length <= 254;
}

function normalizeSlotMonths(value) {
    if (value === "" || value == null) {
        return null;
    }

    const months = finiteNumber(value, "Slot months", { integer: true, max: 12 });

    if (![1, 3, 6, 12].includes(months)) {
        throw httpError(400, "Slot months chỉ nhận 1, 3, 6 hoặc 12.");
    }

    return months;
}

function normalizeProduct(input, existing = {}) {
    const name = boundedString(inputValue(input, existing, "name"), 160, "Tên sản phẩm");
    const slug = slugify(inputValue(input, existing, "slug", name) || name);
    const status = String(inputValue(input, existing, "status", "active"));

    if (!name || !slug) {
        throw httpError(400, "Tên và slug sản phẩm là bắt buộc.");
    }

    if (!["active", "draft"].includes(status)) {
        throw httpError(400, "Trạng thái sản phẩm không hợp lệ.");
    }

    return {
        ...existing,
        id: existing.id || createId("prod"),
        slug,
        name,
        categorySlug: boundedString(inputValue(input, existing, "categorySlug", "cong-cu-ai"), 80, "Danh mục"),
        image: sanitizeAssetUrl(inputValue(input, existing, "image"), "Ảnh sản phẩm"),
        icon: sanitizeAssetUrl(inputValue(input, existing, "icon"), "Icon sản phẩm"),
        discount: boundedString(inputValue(input, existing, "discount"), 30, "Giảm giá"),
        price: finiteNumber(inputValue(input, existing, "price", 0), "Giá", { integer: true }),
        oldPrice: inputValue(input, existing, "oldPrice", "") === ""
            ? null
            : finiteNumber(inputValue(input, existing, "oldPrice", 0), "Giá cũ", { integer: true }),
        stock: finiteNumber(inputValue(input, existing, "stock", 0), "Tồn kho", { integer: true }),
        rating: finiteNumber(inputValue(input, existing, "rating", 4.6), "Đánh giá", { min: 0, max: 5 }),
        sold: finiteNumber(inputValue(input, existing, "sold", 0), "Đã bán", { integer: true }),
        status,
        description: boundedString(inputValue(input, existing, "description"), 5000, "Mô tả"),
        canbosoProductId: boundedString(inputValue(input, existing, "canbosoProductId"), 160, "Canboso product_id"),
        canbosoCostPrice: inputValue(input, existing, "canbosoCostPrice", "") === ""
            ? null
            : finiteNumber(inputValue(input, existing, "canbosoCostPrice", 0), "Giá gốc Canboso", { integer: true }),
        canbosoMarkup: inputValue(input, existing, "canbosoMarkup", "") === ""
            ? null
            : finiteNumber(inputValue(input, existing, "canbosoMarkup", canbosoMarkupVnd), "Markup", { integer: true }),
        requiresCustomerEmail: Boolean(inputValue(input, existing, "requiresCustomerEmail", false)),
        canbosoSlotMonths: normalizeSlotMonths(inputValue(input, existing, "canbosoSlotMonths", ""))
    };
}

function priceToVnd(value) {
    const number = Number(value || 0);
    return number > 0 && number < 10000 ? number * 1000 : number;
}

function buildTelegramStartUrl(orderId) {
    if (!telegramBotUrl || !orderId) {
        return "";
    }

    const separator = telegramBotUrl.includes("?") ? "&" : "?";
    return `${telegramBotUrl}${separator}start=${encodeURIComponent(orderId)}`;
}

function requireBot(req, res, signaturePayload = null) {
    if (!botWebhookSecret) {
        sendError(res, 503, "BOT_WEBHOOK_SECRET chưa được cấu hình.");
        return false;
    }

    const provided =
        req.headers["x-bot-secret"]
        || req.headers["x-webhook-secret"]
        || "";

    if (!timingSafeEqualString(provided, botWebhookSecret)) {
        sendError(res, 401, "Bot secret không hợp lệ.");
        return false;
    }

    if (botRequireSignature) {
        if (signaturePayload === null) {
            sendError(res, 401, "Request bot thiếu payload chữ ký.");
            return false;
        }

        const timestampHeader = String(req.headers["x-bot-timestamp"] || "").trim();
        const providedSignature = String(req.headers["x-bot-signature"] || "")
            .trim()
            .replace(/^sha256=/i, "");
        const timestamp = Number(timestampHeader);
        const timestampMs = timestamp > 1e12 ? timestamp : timestamp * 1000;

        if (!botWebhookSigningSecret) {
            sendError(res, 503, "BOT_WEBHOOK_SIGNING_SECRET chưa được cấu hình.");
            return false;
        }

        if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > botWebhookMaxSkewMs) {
            sendError(res, 401, "Webhook đã hết hạn hoặc timestamp không hợp lệ.");
            return false;
        }

        const expectedSignature = crypto
            .createHmac("sha256", botWebhookSigningSecret)
            .update(`${timestampHeader}.${signaturePayload}`)
            .digest("hex");

        if (!timingSafeEqualHex(providedSignature, expectedSignature)) {
            sendError(res, 401, "Chữ ký webhook không hợp lệ.");
            return false;
        }
    }

    return true;
}

function publicOrderItem(item) {
    return {
        productId: item.productId || "",
        productSlug: item.productSlug || "",
        productName: item.productName || "",
        image: publicAssetUrl(item.image),
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        total: Number(item.total || 0),
        options: sanitizeOrderOptions(item.options)
    };
}

function publicOrder(order, options = {}) {
    const payload = {
        id: order.id,
        orderId: order.id,
        productId: order.productId || "",
        productSlug: order.productSlug || "",
        productName: order.productName || "",
        items: (order.items || []).map(publicOrderItem),
        quantity: Number(order.quantity || 1),
        total: Number(order.total || 0),
        amount: Number(order.total || order.amount || 0),
        paidAmount: order.paidAmount == null ? null : Number(order.paidAmount),
        status: order.status || "created",
        source: order.source || "website",
        paidAt: order.paidAt || "",
        deliveredAt: order.deliveredAt || "",
        note: order.note || "",
        createdAt: order.createdAt || "",
        updatedAt: order.updatedAt || "",
        telegramUrl: buildTelegramStartUrl(order.id)
    };

    if (options.includeCustomer) {
        payload.userId = order.userId || null;
        payload.customerName = order.customerName || "";
        payload.customerPhone = order.customerPhone || "";
        payload.customerEmail = order.customerEmail || "";
        payload.telegramUserId = order.telegramUserId || "";
        payload.telegramUsername = order.telegramUsername || "";
        payload.botPaymentRef = order.botPaymentRef || "";
    }

    if (options.includeIntegration) {
        payload.canbosoFulfillmentStatus = order.canbosoFulfillmentStatus || "";
        payload.canbosoFulfillmentMessage = order.canbosoFulfillmentMessage || "";
    }

    if (options.includeDelivery) {
        payload.deliveredAccounts = order.deliveredAccounts || [];
    }

    return payload;
}

function requireCanbosoConfig(res) {
    if (!canbosoApiKey) {
        sendError(res, 503, "CANBOSO_API_KEY chưa được cấu hình trên server.");
        return false;
    }

    return true;
}

async function canbosoGet(pathname) {
    const url = new URL(`${canbosoApiBase}${pathname}`);
    url.searchParams.set("key", canbosoApiKey);
    return httpsJsonRequest("GET", url.toString());
}

function extractDeliveredAccounts(result) {
    const candidates = [
        result?.deliveredAccounts,
        result?.delivered_accounts,
        result?.accounts,
        result?.account,
        result?.data?.deliveredAccounts,
        result?.data?.delivered_accounts,
        result?.data?.accounts,
        result?.data?.account,
        result?.data?.items
    ];
    const accounts = candidates.find((value) => Array.isArray(value) || (value && typeof value === "object") || typeof value === "string");

    if (accounts == null) {
        return [];
    }

    const list = Array.isArray(accounts) ? accounts : [accounts];
    const serialized = JSON.stringify(list);

    if (Buffer.byteLength(serialized, "utf8") > 200000) {
        throw new Error("Canboso delivery payload is too large.");
    }

    return list.map((account) => {
        if (typeof account === "string") {
            return account.slice(0, 10000);
        }

        if (!account || typeof account !== "object" || Array.isArray(account)) {
            return String(account ?? "").slice(0, 10000);
        }

        const sanitized = {};

        for (const [key, value] of Object.entries(account)) {
            if (/^(?:api[_-]?key|buyer[_-]?key|request[_-]?key)$/i.test(key)) {
                continue;
            }

            sanitized[key] = typeof value === "string" && value === canbosoApiKey
                ? "[REDACTED]"
                : value;
        }

        return sanitized;
    });
}

function summarizeCanbosoResponse(result, deliveredCount) {
    const orderType = boundedString(redactSensitive(result?.orderType || result?.data?.orderType || ""), 80, "Canboso order type");
    const manualSlotStatus = boundedString(redactSensitive(result?.manualSlotStatus || result?.data?.manualSlotStatus || ""), 80, "Canboso manual slot status");
    const workspaceInviteStatus = boundedString(redactSensitive(result?.workspaceInviteStatus || result?.data?.workspaceInviteStatus || ""), 80, "Canboso invite status");
    const autoCompleted = result?.autoCompleted ?? result?.data?.autoCompleted ?? null;
    const completed = deliveredCount > 0
        || workspaceInviteStatus === "invited"
        || autoCompleted === true
        || ["completed", "delivered"].includes(manualSlotStatus);

    return {
        status: boundedString(redactSensitive(result?.status || result?.data?.status || "completed"), 80, "Canboso status"),
        message: boundedString(redactSensitive(result?.message || result?.data?.message || ""), 500, "Canboso message"),
        upstreamPurchaseId: boundedString(
            redactSensitive(result?.orderCode || result?.data?.orderCode || result?.purchase_id || result?.order_id || result?.id || result?.data?.purchase_id || result?.data?.order_id || result?.data?.id || ""),
            200,
            "Canboso purchase id"
        ),
        orderType,
        manualSlotStatus,
        workspaceInviteStatus,
        autoCompleted,
        deliveredCount,
        completed
    };
}

async function canbosoPurchaseItem(order, item, itemIndex = 0) {
    if (!item.canbosoProductId) {
        throw new Error(`Sản phẩm ${item.productName || item.productSlug} chưa mapping canbosoProductId.`);
    }

    const body = {
        key: canbosoApiKey,
        product_id: item.canbosoProductId,
        quantity: Math.max(1, Number(item.quantity || 1))
    };

    const customerEmail =
        order.customerEmail
        || item.options?.customerEmail
        || item.options?.email
        || item.options?.accountIdentifier
        || "";

    if (customerEmail) {
        body.customer_email = String(customerEmail).trim();
    }

    if (item.canbosoSlotMonths) {
        body.slot_months = Number(item.canbosoSlotMonths);
    }

    return httpsJsonRequest(
        "POST",
        `${canbosoApiBase}/api/v2/telegram-buyer/purchase`,
        body,
        {
            "Idempotency-Key": `${order.id}-${itemIndex}-${item.productId || item.productSlug}`.slice(0, 128)
        }
    );
}

async function fulfillOrderWithCanboso(order) {
    if (!canbosoApiKey) {
        return {
            skipped: true,
            reason: "CANBOSO_API_KEY chưa được cấu hình."
        };
    }

    if (order.canbosoFulfillmentStatus === "completed") {
        return {
            skipped: true,
            reason: "Đơn đã được purchase Canboso trước đó.",
            results: order.canbosoResults || []
        };
    }

    const results = [];
    const deliveredAccounts = [];

    for (const [itemIndex, item] of (order.items || []).entries()) {
        const result = await canbosoPurchaseItem(order, item, itemIndex);
        const itemAccounts = extractDeliveredAccounts(result);

        deliveredAccounts.push(...itemAccounts);
        results.push({
            productId: item.productId,
            productSlug: item.productSlug,
            canbosoProductId: item.canbosoProductId,
            ...summarizeCanbosoResponse(result, itemAccounts.length)
        });
    }

    return {
        skipped: false,
        results,
        deliveredAccounts,
        completed: results.length > 0 && results.every((item) => item.completed)
    };
}

function formatMoney(value) {
    return `${priceToVnd(value).toLocaleString("vi-VN")}đ`;
}

function formatSold(value) {
    const number = Number(value || 0);

    if (number >= 1000) {
        return `${(number / 1000).toFixed(1).replace(".", ",").replace(",0", "")}k đã bán`;
    }

    return `${number} đã bán`;
}

function productCatalogItem(product, categories) {
    const category = categories.find((item) => item.slug === product.categorySlug);
    const image = publicAssetUrl(product.image || product.icon || "");
    const price = priceToVnd(product.price);
    const oldPrice = priceToVnd(product.oldPrice);

    return {
        slug: product.slug,
        name: product.name,
        shortName: product.name,
        metaTitle: product.name,
        categorySlug: product.categorySlug,
        categoryPath: [
            { name: "Trang chủ", url: "index.html" },
            {
                name: category?.name || product.categorySlug || "Danh mục",
                url: `category.html?slug=${encodeURIComponent(product.categorySlug || "")}`
            }
        ],
        image,
        icon: product.icon || image,
        discount: product.discount || "",
        rating: Number(product.rating || 4.6),
        reviewCount: 128,
        satisfiedCount: 120,
        sold: Number(product.sold || 0),
        highRated: true,
        recentSale: { name: "Khách hàng", time: "vừa xong" },
        deal: { enabled: false },
        variantTitle: "Loại gói:",
        variants: [
            {
                id: "default",
                label: "Dùng riêng",
                available: product.status !== "draft" && Number(product.stock || 0) !== 0,
                durations: [
                    {
                        id: "12m",
                        label: "12 tháng",
                        price,
                        oldPrice
                    }
                ]
            }
        ],
        benefits: [
            { icon: "bi-lightning-charge-fill", title: "5-15 phút", text: "Giao TK qua email" },
            { icon: "bi-shield", title: "Bảo hành", text: "Theo thời hạn gói" },
            { icon: "bi-chat", title: "Hỗ trợ", text: "Qua Zalo" }
        ],
        notice: [
            {
                html: `<strong>Lưu ý:</strong> ${escapeHtml(product.description || "Chọn đúng gói và thời hạn trước khi thêm vào giỏ.")}`
            }
        ],
        intro: [
            {
                type: "html",
                html: `<p>${escapeHtml(product.description || `${product.name} đang được bán tại storetainguyen.`)}</p>`
            }
        ],
        content: [
            { id: "guide", type: "heading", text: "Hướng dẫn mua sản phẩm", toc: true },
            {
                type: "ordered-list",
                items: [
                    "Chọn loại gói và thời hạn.",
                    "Bấm Thêm vào giỏ hàng hoặc Mua ngay.",
                    "Kiểm tra thông tin trong giỏ hàng trước khi thanh toán."
                ]
            }
        ],
        faq: [
            {
                question: "Sản phẩm này có bảo hành không?",
                answer: "Có, bảo hành theo thời hạn gói và chính sách của shop."
            }
        ],
        updated: "[Cập nhật lần cuối: Tháng 8/2026]",
        related: [],
        reviewSummary: {
            satisfaction: 96,
            totalPages: 12,
            distribution: { 5: 90, 4: 28, 3: 10, 2: 0, 1: 0 },
            mentions: []
        },
        reviews: []
    };
}

function categoryCatalogItem(category, products) {
    const items = products
        .filter((product) => product.categorySlug === category.slug && product.status !== "draft")
        .map((product) => ({
            slug: product.slug,
            name: product.name,
            image: product.image || product.icon || "",
            icon: product.icon || product.image || "",
            discount: product.discount || "",
            rating: String(product.rating || "4.6").replace(".", ","),
            sold: formatSold(product.sold),
            price: formatMoney(product.price),
            oldPrice: product.oldPrice ? formatMoney(product.oldPrice) : null,
            outOfStock: Number(product.stock || 0) === 0,
            button: "Chọn gói"
        }));

    return {
        slug: category.slug,
        name: category.name,
        metaTitle: `${category.name} | storetainguyen`,
        metaDescription: category.description || "",
        totalProducts: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / 12)),
        description: category.description ? [category.description] : [],
        products: items
    };
}

async function serveLiveCatalog(res, type) {
    const db = await readDb();
    const activeProducts = (db.products || []).filter((product) => product.status !== "draft");
    const activeCategories = (db.categories || []).filter((category) => category.status !== "draft");

    if (type === "products") {
        const catalog = Object.fromEntries(
            activeProducts.map((product) => [
                product.slug,
                productCatalogItem(product, activeCategories)
            ])
        );

        sendJs(
            res,
            `"use strict";\nwindow.PRODUCT_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`
        );
        return;
    }

    const catalog = Object.fromEntries(
        activeCategories.map((category) => [
            category.slug,
            categoryCatalogItem(category, activeProducts)
        ])
    );

    sendJs(
        res,
        `"use strict";\nwindow.CATEGORY_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`
    );
}

function normalizeCategory(input, existing = {}) {
    const name = boundedString(inputValue(input, existing, "name"), 120, "Tên danh mục");
    const slug = slugify(inputValue(input, existing, "slug", name) || name);
    const status = String(inputValue(input, existing, "status", "active"));

    if (!name || !slug) {
        throw httpError(400, "Tên và slug danh mục là bắt buộc.");
    }

    if (!["active", "draft"].includes(status)) {
        throw httpError(400, "Trạng thái danh mục không hợp lệ.");
    }

    return {
        ...existing,
        id: existing.id || createId("cat"),
        slug,
        name,
        description: boundedString(inputValue(input, existing, "description"), 5000, "Mô tả danh mục"),
        status
    };
}

function publicProduct(product) {
    return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        categorySlug: product.categorySlug,
        image: publicAssetUrl(product.image),
        icon: publicAssetUrl(product.icon),
        discount: product.discount || "",
        price: Number(product.price || 0),
        oldPrice: product.oldPrice ?? null,
        stock: Number(product.stock || 0),
        rating: Number(product.rating || 4.6),
        sold: Number(product.sold || 0),
        description: product.description || "",
        status: product.status || "active"
    };
}

function publicCategory(category) {
    return {
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description || "",
        status: category.status || "active",
        totalProducts: Number(category.totalProducts || 0)
    };
}

function publicProducts(db) {
    return (db.products || [])
        .filter((product) => product.status !== "draft")
        .map(publicProduct);
}

function publicCategories(db) {
    return (db.categories || [])
        .filter((category) => category.status !== "draft")
        .map(publicCategory);
}

function adminProducts(db) {
    return (db.products || []).map((product) => ({
        ...publicProduct(product),
        canbosoProductId: product.canbosoProductId || "",
        canbosoCostPrice: product.canbosoCostPrice ?? null,
        canbosoMarkup: product.canbosoMarkup ?? canbosoMarkupVnd,
        requiresCustomerEmail: Boolean(product.requiresCustomerEmail),
        canbosoSlotMonths: product.canbosoSlotMonths ?? null
    }));
}

function adminCategories(db) {
    return (db.categories || []).map(publicCategory);
}

function validateProductForDb(product, db, existingId = "") {
    if (!db.categories.some((category) => category.slug === product.categorySlug)) {
        throw httpError(400, "Danh mục sản phẩm không tồn tại.");
    }

    if (db.products.some((item) => item.id !== existingId && item.slug === product.slug)) {
        throw httpError(409, "Slug sản phẩm đã tồn tại.");
    }

    const sellingPrice = priceToVnd(product.price);

    if (product.status === "active" && sellingPrice <= 0) {
        throw httpError(400, "Sản phẩm đang bán phải có giá lớn hơn 0.");
    }

    if (product.canbosoProductId && product.canbosoCostPrice != null) {
        const minimumPrice = priceToVnd(product.canbosoCostPrice) + Number(product.canbosoMarkup ?? canbosoMarkupVnd);

        if (sellingPrice < minimumPrice) {
            throw httpError(400, `Giá bán phải từ ${minimumPrice.toLocaleString("vi-VN")}đ để không thấp hơn giá gốc + markup.`);
        }
    }
}

function validateCategoryForDb(category, db, existingId = "") {
    if (db.categories.some((item) => item.id !== existingId && item.slug === category.slug)) {
        throw httpError(409, "Slug danh mục đã tồn tại.");
    }
}

function recognizedRevenue(orders) {
    return (orders || [])
        .filter((order) => ["paid", "delivered"].includes(order.status))
        .reduce((sum, order) => sum + Number(order.paidAmount ?? order.total ?? 0), 0);
}

async function handleApi(req, res, url) {
    const db = await readDb();
    const parts = url.pathname.split("/").filter(Boolean);
    const resource = parts[1];
    const id = parts[2];

    if (url.pathname === "/api/health") {
        sendJson(res, 200, { ok: true });
        return;
    }

    if (url.pathname === "/api/public/settings" && req.method === "GET") {
        sendJson(res, 200, {
            telegramBotUrl,
            telegramEnabled: Boolean(telegramBotUrl),
            registrationEnabled: allowRegistration
        });
        return;
    }

    if (resource === "bot") {
        if (parts[2] === "orders" && parts[3] && req.method === "GET") {
            if (!consumeRateLimit(botAttempts, clientIp(req) || "unknown", 120, 60 * 1000)) {
                sendError(res, 429, "Bot gọi API quá nhanh.");
                return;
            }

            if (!requireBot(req, res, `${req.method}.${url.pathname}`)) return;

            const order = db.orders?.find((item) => item.id === parts[3]);

            if (!order) {
                sendError(res, 404, "Không tìm thấy đơn hàng.");
                return;
            }

            sendJson(res, 200, publicOrder(order, {
                includeCustomer: true,
                includeDelivery: true,
                includeIntegration: true
            }));
            return;
        }

        if (parts[2] === "order-paid" && req.method === "POST") {
            if (!consumeRateLimit(botAttempts, clientIp(req) || "unknown", 60, 60 * 1000)) {
                sendError(res, 429, "Bot gọi API quá nhanh.");
                return;
            }

            const rawBody = await readRawBody(req);

            if (!requireBot(req, res, rawBody)) return;

            const input = await readBody(req);
            const orderId = String(input.orderId || input.id || "").trim();
            const index = db.orders?.findIndex((item) => item.id === orderId) ?? -1;

            if (index < 0) {
                sendError(res, 404, "Không tìm thấy đơn hàng.");
                return;
            }

            const requestedStatus = String(input.status || "paid").trim().toLowerCase();
            const expectedAmount = Number(db.orders[index].total || 0);
            const submittedAmount = Number(input.amount ?? input.total);
            const paymentRef = boundedString(input.botPaymentRef || input.paymentRef || "", 200, "Mã giao dịch");

            if (!["paid", "delivered"].includes(requestedStatus)) {
                sendError(res, 400, "Callback thanh toán chỉ chấp nhận trạng thái paid hoặc delivered.");
                return;
            }

            if (!Number.isFinite(submittedAmount) || submittedAmount !== expectedAmount) {
                sendError(res, 409, "Số tiền thanh toán không khớp tổng đơn hàng.");
                return;
            }

            if (botRequirePaymentRef && !paymentRef) {
                sendError(res, 400, "Thiếu mã giao dịch botPaymentRef.");
                return;
            }

            if (["cancelled", "refunded"].includes(db.orders[index].status)) {
                sendError(res, 409, "Đơn hàng đã bị hủy hoặc hoàn tiền.");
                return;
            }

            if (
                db.orders[index].botPaymentRef
                && paymentRef
                && db.orders[index].botPaymentRef !== paymentRef
            ) {
                sendError(res, 409, "Mã giao dịch không khớp callback trước đó.");
                return;
            }

            if (
                paymentRef
                && db.orders.some((order, orderIndex) => orderIndex !== index && order.botPaymentRef === paymentRef)
            ) {
                sendError(res, 409, "Mã giao dịch đã được dùng cho đơn hàng khác.");
                return;
            }

            const now = new Date().toISOString();
            db.orders[index] = {
                ...db.orders[index],
                status: db.orders[index].canbosoFulfillmentStatus === "completed"
                    ? (db.orders[index].status || "delivered")
                    : "paid",
                paidAmount: submittedAmount,
                telegramUserId: boundedString(input.telegramUserId || db.orders[index].telegramUserId || "", 80, "Telegram user id"),
                telegramUsername: boundedString(input.telegramUsername || db.orders[index].telegramUsername || "", 80, "Telegram username"),
                botPaymentRef: paymentRef || db.orders[index].botPaymentRef || "",
                paidAt: db.orders[index].paidAt || now,
                canbosoFulfillmentStatus: db.orders[index].canbosoFulfillmentStatus === "completed"
                    ? "completed"
                    : "processing",
                updatedAt: now
            };

            await writeDb(db);

            if (db.orders[index].canbosoFulfillmentStatus !== "completed") {
                try {
                    const fulfillment = await fulfillOrderWithCanboso(db.orders[index]);

                    db.orders[index] = {
                        ...db.orders[index],
                        canbosoFulfillmentStatus: fulfillment.skipped
                            ? "skipped"
                            : (fulfillment.completed ? "completed" : "pending"),
                        canbosoFulfillmentMessage: fulfillment.reason || "",
                        canbosoResults: fulfillment.results || db.orders[index].canbosoResults || [],
                        deliveredAccounts: fulfillment.deliveredAccounts || db.orders[index].deliveredAccounts || [],
                        updatedAt: new Date().toISOString()
                    };

                    if (!fulfillment.skipped && fulfillment.completed) {
                        db.orders[index].status = "delivered";
                        db.orders[index].deliveredAt = new Date().toISOString();
                    }
                } catch (error) {
                    db.orders[index] = {
                        ...db.orders[index],
                        canbosoFulfillmentStatus: "failed",
                        canbosoFulfillmentMessage: redactSensitive(error.message || "Canboso purchase failed"),
                        updatedAt: new Date().toISOString()
                    };
                }
            }

            await writeDb(db);
            sendJson(res, 200, publicOrder(db.orders[index], {
                includeCustomer: true,
                includeDelivery: true,
                includeIntegration: true
            }));
            return;
        }

        sendError(res, 404, "Bot API không tồn tại.");
        return;
    }

    if (url.pathname === "/api/auth/login" && req.method === "POST") {
        if (!checkLoginRateLimit(req)) {
            sendError(res, 429, "Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ rồi thử lại.");
            return;
        }

        const input = await readBody(req);
        const login = String(input.username || "").trim().toLowerCase();
        const user = db.users?.find((item) =>
            item.username?.toLowerCase() === login
            || item.email?.toLowerCase() === login
        );

        const passwordOk = user?.role === "admin"
            ? verifyAdminPassword(input.password, user)
            : verifyPassword(input.password, user?.passwordHash);

        if (!user || !passwordOk) {
            sendError(res, 401, "Sai tài khoản hoặc mật khẩu.");
            return;
        }

        clearLoginRateLimit(req);
        if (user.role !== "admin" && !String(user.passwordHash || "").startsWith("scrypt$")) {
            user.passwordHash = createPasswordHash(input.password);
            await writeDb(db);
        }

        const token = createSessionToken(user);

        sendJson(res, 200, {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email || "",
                role: user.role
            }
        }, { "set-cookie": sessionCookie(token) });
        return;
    }

    if (url.pathname === "/api/auth/register" && req.method === "POST") {
        if (!allowRegistration) {
            sendError(res, 403, "Đăng ký tài khoản đang tạm khóa.");
            return;
        }

        if (!consumeRateLimit(registerAttempts, clientIp(req) || "unknown", 5, 60 * 60 * 1000)) {
            sendError(res, 429, "Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau.");
            return;
        }

        const input = await readBody(req);
        const username = boundedString(input.username || input.email || "", 80, "Tên đăng nhập");
        const email = boundedString(input.email || "", 254, "Email").toLowerCase();
        const password = String(input.password || "");
        const minimumPasswordLength = isProduction ? 12 : 8;

        if (
            !/^[\p{L}\p{N}_.@+-]+$/u.test(username)
            || !isValidEmail(email)
            || password.length < minimumPasswordLength
            || password.length > 200
        ) {
            sendError(res, 400, `Vui lòng nhập email hợp lệ và mật khẩu từ ${minimumPasswordLength} ký tự.`);
            return;
        }

        const existed = db.users?.some((user) =>
            user.username?.toLowerCase() === username.toLowerCase()
            || user.email?.toLowerCase() === email
        );

        if (existed) {
            sendError(res, 409, "Tài khoản hoặc email đã tồn tại.");
            return;
        }

        const user = {
            id: createId("user"),
            username,
            email,
            name: boundedString(input.name || username, 120, "Tên hiển thị"),
            firstName: boundedString(input.firstName || "", 80, "Tên"),
            lastName: boundedString(input.lastName || "", 80, "Họ"),
            role: "customer",
            sessionVersion: 0,
            passwordHash: createPasswordHash(password),
            createdAt: new Date().toISOString()
        };

        db.users = db.users || [];
        db.users.push(user);
        await writeDb(db);

        const token = createSessionToken(user);

        sendJson(res, 201, {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }, { "set-cookie": sessionCookie(token) });
        return;
    }

    if (url.pathname === "/api/auth/me" && req.method === "GET") {
        const user = authUser(req, db);

        if (!user) {
            sendError(res, 401, "Chưa đăng nhập.");
            return;
        }

        sendJson(res, 200, {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            role: user.role
        });
        return;
    }

    if (url.pathname === "/api/account" && req.method === "GET") {
        const user = authUser(req, db);
        if (!user) {
            sendError(res, 401, "Chưa đăng nhập.");
            return;
        }

        sendJson(res, 200, {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            role: user.role
        });
        return;
    }

    if (url.pathname === "/api/account" && req.method === "PUT") {
        const user = authUser(req, db);
        if (!user) {
            sendError(res, 401, "Chưa đăng nhập.");
            return;
        }

        const input = await readBody(req);
        const index = db.users.findIndex((item) => item.id === user.id);
        const nextPassword = String(input.newPassword || "");
        const nextEmail = boundedString(input.email || user.email || "", 254, "Email").toLowerCase();

        if (nextPassword) {
            const minimumPasswordLength = isProduction ? 12 : 8;

            if (nextPassword.length < minimumPasswordLength || nextPassword.length > 200) {
                sendError(res, 400, `Mật khẩu mới cần từ ${minimumPasswordLength} đến 200 ký tự.`);
                return;
            }

            if (!input.currentPassword || !verifyPassword(input.currentPassword, user.passwordHash)) {
                sendError(res, 400, "Mật khẩu hiện tại không đúng.");
                return;
            }
        }

        if (!isValidEmail(nextEmail)) {
            sendError(res, 400, "Email không hợp lệ.");
            return;
        }

        if (db.users.some((item) => item.id !== user.id && item.email?.toLowerCase() === nextEmail)) {
            sendError(res, 409, "Email đã được tài khoản khác sử dụng.");
            return;
        }

        db.users[index] = {
            ...user,
            firstName: boundedString(input.firstName || "", 80, "Tên"),
            lastName: boundedString(input.lastName || "", 80, "Họ"),
            name: boundedString(input.name || user.name || user.username, 120, "Tên hiển thị"),
            email: nextEmail,
            sessionVersion: nextPassword ? Number(user.sessionVersion || 0) + 1 : Number(user.sessionVersion || 0),
            passwordHash: nextPassword ? createPasswordHash(nextPassword) : user.passwordHash
        };
        await writeDb(db);
        const response = {
            id: db.users[index].id,
            username: db.users[index].username,
            name: db.users[index].name,
            email: db.users[index].email,
            firstName: db.users[index].firstName,
            lastName: db.users[index].lastName,
            role: db.users[index].role
        };

        const responseHeaders = nextPassword
            ? { "set-cookie": sessionCookie(createSessionToken(db.users[index])) }
            : {};

        sendJson(res, 200, response, responseHeaders);
        return;
    }

    if (url.pathname === "/api/account/orders" && req.method === "GET") {
        const user = authUser(req, db);
        if (!user) {
            sendError(res, 401, "Chưa đăng nhập.");
            return;
        }

        sendJson(
            res,
            200,
            db.orders
                .filter((order) => order.userId === user.id)
                .map((order) => publicOrder(order, {
                    includeCustomer: true,
                    includeDelivery: true,
                    includeIntegration: true
                }))
        );
        return;
    }

    if (url.pathname === "/api/auth/logout" && req.method === "POST") {
        const context = authContext(req, db);

        if (context?.user) {
            const index = db.users.findIndex((item) => item.id === context.user.id);
            db.users[index].sessionVersion = Number(db.users[index].sessionVersion || 0) + 1;
            await writeDb(db);
        }

        sendJson(res, 200, { ok: true }, { "set-cookie": clearSessionCookie() });
        return;
    }

    if (resource === "summary" && req.method === "GET") {
        sendJson(res, 200, {
            products: publicProducts(db).length,
            categories: publicCategories(db).length,
            orders: isAdmin(req, db) ? db.orders.length : 0,
            revenue: isAdmin(req, db) ? recognizedRevenue(db.orders) : 0
        });
        return;
    }

    if (resource === "public" && req.method === "GET") {
        if (id === "products") {
            sendJson(res, 200, publicProducts(db));
            return;
        }

        if (id === "categories") {
            sendJson(res, 200, publicCategories(db));
            return;
        }
    }

    if (resource === "admin") {
        if (!requireAdmin(req, res, db)) return;

        const adminResource = parts[2];
        const adminId = parts[3];

        if (adminResource === "summary" && req.method === "GET") {
            sendJson(res, 200, {
                products: db.products.length,
                categories: db.categories.length,
                orders: db.orders.length,
                revenue: recognizedRevenue(db.orders)
            });
            return;
        }

        if (adminResource === "canboso-products" && req.method === "GET") {
            if (!requireCanbosoConfig(res)) return;
            sendJson(res, 200, await canbosoGet("/api/v2/telegram-buyer/products"));
            return;
        }

        if (adminResource === "canboso-balance" && req.method === "GET") {
            if (!requireCanbosoConfig(res)) return;
            sendJson(res, 200, await canbosoGet("/api/v2/telegram-buyer/balance"));
            return;
        }

        if (adminResource === "products") {
            if (req.method === "GET") {
                sendJson(res, 200, adminProducts(db));
                return;
            }

            if (req.method === "POST") {
                const product = normalizeProduct(await readBody(req));
                validateProductForDb(product, db);
                db.products.unshift(product);
                await writeDb(db);
                sendJson(res, 201, publicProduct(product));
                return;
            }

            const index = db.products.findIndex((item) => item.id === adminId);
            if (index < 0) {
                sendError(res, 404, "Không tìm thấy sản phẩm.");
                return;
            }

            if (req.method === "PUT") {
                const product = normalizeProduct(await readBody(req), db.products[index]);
                validateProductForDb(product, db, db.products[index].id);
                db.products[index] = product;
                await writeDb(db);
                sendJson(res, 200, publicProduct(db.products[index]));
                return;
            }

            if (req.method === "DELETE") {
                const [removed] = db.products.splice(index, 1);
                await writeDb(db);
                sendJson(res, 200, publicProduct(removed));
                return;
            }
        }

        if (adminResource === "categories") {
            if (req.method === "GET") {
                sendJson(res, 200, adminCategories(db));
                return;
            }

            if (req.method === "POST") {
                const category = normalizeCategory(await readBody(req));
                validateCategoryForDb(category, db);
                db.categories.push(category);
                await writeDb(db);
                sendJson(res, 201, publicCategory(category));
                return;
            }

            const index = db.categories.findIndex((item) => item.id === adminId);
            if (index < 0) {
                sendError(res, 404, "Không tìm thấy danh mục.");
                return;
            }

            if (req.method === "PUT") {
                const category = normalizeCategory(await readBody(req), db.categories[index]);
                validateCategoryForDb(category, db, db.categories[index].id);
                db.categories[index] = category;
                await writeDb(db);
                sendJson(res, 200, publicCategory(db.categories[index]));
                return;
            }

            if (req.method === "DELETE") {
                if (db.products.some((product) => product.categorySlug === db.categories[index].slug)) {
                    sendError(res, 409, "Không thể xóa danh mục đang có sản phẩm.");
                    return;
                }

                const [removed] = db.categories.splice(index, 1);
                await writeDb(db);
                sendJson(res, 200, publicCategory(removed));
                return;
            }
        }

        if (adminResource === "orders") {
            if (req.method === "GET") {
                sendJson(res, 200, db.orders);
                return;
            }

            const index = db.orders.findIndex((item) => item.id === adminId);
            if (index < 0) {
                sendError(res, 404, "Không tìm thấy đơn hàng.");
                return;
            }

            if (req.method === "PUT") {
                const input = await readBody(req);
                const allowedStatuses = ["created", "pending", "paid", "delivered", "failed", "cancelled", "refunded"];
                const nextStatus = String(input.status || db.orders[index].status);

                if (!allowedStatuses.includes(nextStatus)) {
                    sendError(res, 400, "Trạng thái đơn hàng không hợp lệ.");
                    return;
                }

                db.orders[index] = {
                    ...db.orders[index],
                    status: nextStatus,
                    note: hasOwn(input, "note")
                        ? boundedString(input.note, 1000, "Ghi chú")
                        : db.orders[index].note,
                    updatedAt: new Date().toISOString()
                };
                await writeDb(db);
                sendJson(res, 200, db.orders[index]);
                return;
            }
        }
    }

    if (resource === "products") {
        if (req.method === "GET") {
            sendJson(res, 200, publicProducts(db));
            return;
        }

        sendError(res, 405, "Hãy dùng API /api/admin/products.");
        return;
    }

    if (resource === "categories") {
        if (req.method === "GET") {
            sendJson(res, 200, publicCategories(db));
            return;
        }

        sendError(res, 405, "Hãy dùng API /api/admin/categories.");
        return;
    }

    if (resource === "orders") {
        if (req.method === "GET") {
            if (!requireAdmin(req, res, db)) return;
            sendJson(res, 200, db.orders);
            return;
        }

        if (req.method === "POST") {
            if (!consumeRateLimit(orderAttempts, clientIp(req) || "unknown", 20, 10 * 60 * 1000)) {
                sendError(res, 429, "Bạn tạo đơn quá nhanh. Vui lòng thử lại sau.");
                return;
            }

            const input = await readBody(req);
            const user = authUser(req, db);
            const requestedItems = Array.isArray(input.items) && input.items.length
                ? input.items
                : [{
                    productId: input.productId,
                    productSlug: input.productSlug || input.slug,
                    quantity: input.quantity || 1,
                    options: input.options || {}
                }];

            if (requestedItems.length > 20) {
                sendError(res, 400, "Một đơn hàng chỉ được chứa tối đa 20 dòng sản phẩm.");
                return;
            }

            const items = requestedItems.map((item) => {
                const product = db.products.find((current) =>
                    current.id === item.productId
                    || current.slug === item.productSlug
                    || current.slug === item.slug
                );

                if (!product || product.status !== "active" || Number(product.stock || 0) <= 0) {
                    return null;
                }

                const requestedQuantity = Number(item.quantity || 1);

                if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 99) {
                    throw httpError(400, "Số lượng sản phẩm không hợp lệ.");
                }

                if (requestedQuantity > Number(product.stock || 0)) {
                    throw httpError(409, `Sản phẩm ${product.name} không đủ tồn kho.`);
                }

                if (product.canbosoProductId && product.requiresCustomerEmail && requestedQuantity !== 1) {
                    throw httpError(400, `Sản phẩm ${product.name} chỉ cho phép số lượng 1 mỗi đơn.`);
                }

                const quantity = requestedQuantity;
                const unitPrice = priceToVnd(product.price);
                const costPrice = priceToVnd(product.canbosoCostPrice || 0);

                return {
                    productId: product.id,
                    productSlug: product.slug,
                    productName: product.name,
                    image: publicAssetUrl(product.image || product.icon || ""),
                    quantity,
                    unitPrice,
                    total: unitPrice * quantity,
                    costPrice,
                    profit: costPrice ? (unitPrice - costPrice) * quantity : null,
                    canbosoProductId: product.canbosoProductId || "",
                    canbosoSlotMonths: product.canbosoSlotMonths || null,
                    requiresCustomerEmail: Boolean(product.requiresCustomerEmail),
                    options: sanitizeOrderOptions(item.options)
                };
            }).filter(Boolean);

            if (!items.length || items.length !== requestedItems.length) {
                sendError(res, 400, "Có sản phẩm không tồn tại, đã ẩn hoặc hết hàng.");
                return;
            }

            if (items.filter((item) => item.canbosoProductId).length > 5) {
                sendError(res, 400, "Một đơn chỉ được chứa tối đa 5 dòng sản phẩm Canboso.");
                return;
            }

            const quantityByProduct = new Map();

            for (const item of items) {
                quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) || 0) + item.quantity);
            }

            for (const [productId, quantity] of quantityByProduct) {
                const stock = Number(db.products.find((product) => product.id === productId)?.stock || 0);

                if (quantity > stock) {
                    sendError(res, 409, "Tổng số lượng trong giỏ vượt quá tồn kho.");
                    return;
                }
            }

            const total = items.reduce((sum, item) => sum + item.total, 0);
            const firstItem = items[0];
            const now = new Date().toISOString();
            const optionEmail = items
                .map((item) => item.options.customerEmail || item.options.email || item.options.accountIdentifier || "")
                .find((value) => isValidEmail(value));
            const customerEmail = boundedString(
                input.customerEmail || input.email || optionEmail || "",
                254,
                "Email khách hàng"
            ).toLowerCase();

            if (customerEmail && !isValidEmail(customerEmail)) {
                sendError(res, 400, "Email khách hàng không hợp lệ.");
                return;
            }

            if (items.some((item) => item.requiresCustomerEmail) && !customerEmail) {
                sendError(res, 400, "Sản phẩm này yêu cầu email khách hàng.");
                return;
            }

            const order = {
                id: createId("ord"),
                userId: user?.id || null,
                customerName: boundedString(input.customerName || "", 120, "Tên khách hàng"),
                customerPhone: boundedString(input.customerPhone || "", 30, "Số điện thoại"),
                customerEmail,
                productId: firstItem.productId,
                productSlug: firstItem.productSlug,
                productName: firstItem.productName,
                quantity: items.reduce((sum, item) => sum + item.quantity, 0),
                items,
                total,
                amount: total,
                costTotal: items.reduce((sum, item) => sum + Number(item.costPrice || 0) * item.quantity, 0),
                profitTotal: items.reduce((sum, item) => sum + Number(item.profit || 0), 0),
                status: "created",
                source: "website",
                note: boundedString(input.note || "", 1000, "Ghi chú"),
                createdAt: now,
                updatedAt: now
            };
            db.orders.unshift(order);
            await writeDb(db);
            sendJson(res, 201, publicOrder(order));
            return;
        }

        sendError(res, 405, "Phương thức không được hỗ trợ.");
        return;
    }

    sendError(res, 404, "API không tồn tại.");
}

async function serveStatic(req, res, url) {
    if (!["GET", "HEAD"].includes(req.method)) {
        sendError(res, 405, "Phương thức không được hỗ trợ.");
        return;
    }

    if (url.pathname === "/js/products.js") {
        await serveLiveCatalog(res, "products");
        return;
    }

    if (url.pathname === "/js/categories.js") {
        await serveLiveCatalog(res, "categories");
        return;
    }

    let pathname;

    try {
        pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    } catch {
        sendError(res, 400, "Đường dẫn không hợp lệ.");
        return;
    }

    const normalizedPathname = pathname.replaceAll("\\", "/");
    const lowercasePathname = normalizedPathname.toLowerCase();

    if (
        lowercasePathname.startsWith("/data/")
        || lowercasePathname.startsWith("/.git/")
        || lowercasePathname.includes("/.")
        || ["/server.js", "/package.json", "/package-lock.json", "/render.yaml"].includes(lowercasePathname)
    ) {
        sendError(res, 404, "Không tìm thấy file.");
        return;
    }

    const filePath = path.resolve(rootDir, `.${pathname}`);
    const relativePath = path.relative(rootDir, filePath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        sendError(res, 403, "Forbidden");
        return;
    }

    try {
        const stat = await fs.stat(filePath);
        const target = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
        const ext = path.extname(target).toLowerCase();
        const publicExtensions = new Set([
            ".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff", ".woff2"
        ]);

        if (!publicExtensions.has(ext)) {
            sendError(res, 404, "Không tìm thấy file.");
            return;
        }

        const content = await fs.readFile(target);
        const longLivedAsset = [".png", ".jpg", ".jpeg", ".webp", ".ico", ".woff", ".woff2"].includes(ext);
        res.writeHead(200, {
            "content-type": mimeTypes[ext] || "application/octet-stream",
            "cache-control": longLivedAsset
                ? "public, max-age=86400"
                : "no-cache, must-revalidate",
            ...securityHeaders()
        });
        res.end(req.method === "HEAD" ? undefined : content);
    } catch {
        sendError(res, 404, "Không tìm thấy file.");
    }
}

function validateProductionConfig() {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT không hợp lệ.");
    }

    if (!["127.0.0.1", "0.0.0.0", "::1"].includes(host)) {
        throw new Error("HOST chỉ được dùng 127.0.0.1, ::1 hoặc 0.0.0.0.");
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT không hợp lệ.");
    }

    if (!Number.isFinite(maxBodyBytes) || maxBodyBytes < 1024 || maxBodyBytes > 2 * 1024 * 1024) {
        throw new Error("MAX_BODY_BYTES phải nằm trong khoảng 1KB đến 2MB.");
    }

    if (!Number.isFinite(sessionMaxAgeMs) || sessionMaxAgeMs < 5 * 60 * 1000 || sessionMaxAgeMs > 7 * 24 * 60 * 60 * 1000) {
        throw new Error("SESSION_MAX_AGE_MS phải từ 5 phút đến 7 ngày.");
    }

    if (!Number.isFinite(botWebhookMaxSkewMs) || botWebhookMaxSkewMs < 30000 || botWebhookMaxSkewMs > 15 * 60 * 1000) {
        throw new Error("BOT_WEBHOOK_MAX_SKEW_MS phải từ 30 giây đến 15 phút.");
    }

    if (!Number.isInteger(canbosoMarkupVnd) || canbosoMarkupVnd < 0) {
        throw new Error("CANBOSO_MARKUP_VND không hợp lệ.");
    }

    if (process.env.DB_SYNC_TO_GITHUB === "true") {
        throw new Error("DB_SYNC_TO_GITHUB đã bị vô hiệu hóa vì có thể đưa dữ liệu khách hàng lên repository.");
    }

    if (canbosoApiKey) {
        const apiUrl = new URL(canbosoApiBase);

        if (apiUrl.protocol !== "https:") {
            throw new Error("CANBOSO_API_BASE phải dùng HTTPS.");
        }

        if (isProduction && (apiUrl.hostname !== "canboso.com" || !["", "/"].includes(apiUrl.pathname))) {
            throw new Error("CANBOSO_API_BASE production chỉ được phép trỏ tới canboso.com.");
        }

        if (isProduction && !/^tgb_[a-z0-9]{32,}$/i.test(canbosoApiKey)) {
            throw new Error("CANBOSO_API_KEY không đúng định dạng buyer key.");
        }
    }

    if (telegramBotUrl) {
        const botUrl = new URL(telegramBotUrl);

        if (botUrl.protocol !== "https:" || !["t.me", "telegram.me"].includes(botUrl.hostname)) {
            throw new Error("TELEGRAM_BOT_URL phải là URL HTTPS của t.me hoặc telegram.me.");
        }
    }

    if (!isProduction) {
        return;
    }

    const relativeDataPath = path.relative(rootDir, dataFile);
    const dataInsideSource = relativeDataPath === ""
        || (!relativeDataPath.startsWith("..") && !path.isAbsolute(relativeDataPath));

    if (dataInsideSource) {
        throw new Error("Production phải đặt DATA_FILE ngoài thư mục source để tránh deploy ghi đè hoặc làm lộ database.");
    }

    if (!process.env.SESSION_SECRET || sessionSecret.length < 32) {
        throw new Error("Production cần SESSION_SECRET ngẫu nhiên tối thiểu 32 ký tự.");
    }

    if (dataEncryptionSecret.length < 32) {
        throw new Error("Production cần DATA_ENCRYPTION_KEY ngẫu nhiên tối thiểu 32 ký tự.");
    }

    if (!adminPassword && !adminPasswordHash) {
        throw new Error("Production cần ADMIN_PASSWORD hoặc ADMIN_PASSWORD_HASH.");
    }

    if (adminPassword && adminPassword.length < 12) {
        throw new Error("ADMIN_PASSWORD production cần tối thiểu 12 ký tự.");
    }

    if (
        adminPasswordHash
        && !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{64}$/i.test(adminPasswordHash)
        && !/^pbkdf2\$[a-f0-9]{32}\$[a-f0-9]{64}$/i.test(adminPasswordHash)
    ) {
        throw new Error("ADMIN_PASSWORD_HASH không đúng định dạng được hỗ trợ.");
    }

    if ((telegramBotUrl || canbosoApiKey) && botWebhookSecret.length < 32) {
        throw new Error("BOT_WEBHOOK_SECRET cần là chuỗi ngẫu nhiên tối thiểu 32 ký tự.");
    }

    if (botRequireSignature) {
        if (botWebhookSigningSecret.length < 32) {
            throw new Error("BOT_WEBHOOK_SIGNING_SECRET cần là chuỗi ngẫu nhiên tối thiểu 32 ký tự.");
        }

        if (timingSafeEqualString(botWebhookSigningSecret, botWebhookSecret)) {
            throw new Error("BOT_WEBHOOK_SIGNING_SECRET phải khác BOT_WEBHOOK_SECRET.");
        }
    }


    if (!botRequireSignature || !botRequirePaymentRef) {
        throw new Error("Production bắt buộc BOT_REQUIRE_SIGNATURE=true và BOT_REQUIRE_PAYMENT_REF=true.");
    }

    const configuredSecrets = [
        sessionSecret,
        dataEncryptionSecret,
        adminPassword,
        botWebhookSecret,
        botWebhookSigningSecret,
        canbosoApiKey
    ].filter(Boolean);

    if (new Set(configuredSecrets).size !== configuredSecrets.length) {
        throw new Error("Mỗi secret production phải là một giá trị độc lập.");
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    try {
        if (url.pathname.startsWith("/api/")) {
            const task = () => handleApi(req, res, url);

            if (["GET", "HEAD"].includes(req.method)) {
                await task();
            } else {
                await withMutationLock(task);
            }

            return;
        }

        await serveStatic(req, res, url);
    } catch (error) {
        const status = Number(error.statusCode) >= 400 && Number(error.statusCode) <= 599
            ? Number(error.statusCode)
            : 500;

        if (status >= 500) {
            console.error(`${req.method} ${url.pathname} failed:`, redactSensitive(error.message));
        }

        sendError(res, status, error.expose ? error.message : "Lỗi máy chủ. Vui lòng thử lại sau.");
    }
});

server.requestTimeout = 30000;
server.headersTimeout = 15000;
server.keepAliveTimeout = 5000;
server.maxHeadersCount = 100;

validateProductionConfig();

server.listen(port, host, () => {
    console.log(`storetainguyen server: http://${host}:${port}`);
    console.log(`Admin portal: http://${host}:${port}/admin.html`);
    console.log(`Database file: ${dataFile}`);

    if (!isProduction && !adminPassword && !adminPasswordHash) {
        console.warn("WARNING: Admin login is disabled until ADMIN_PASSWORD or ADMIN_PASSWORD_HASH is configured.");
    }
});
