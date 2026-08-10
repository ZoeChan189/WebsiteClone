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
const port = Number(process.env.PORT || 8010);
const sessionSecret = process.env.SESSION_SECRET || "storetainguyen-dev-session-secret";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
const githubToken = process.env.GITHUB_TOKEN || "";
const syncDbToGithubEnabled = process.env.DB_SYNC_TO_GITHUB === "true";
const githubRepo = process.env.GITHUB_REPO || "ZoeChan189/WebsiteClone";
const githubBranch = process.env.GITHUB_BRANCH || "feature/cart";
const githubDbPath = process.env.GITHUB_DB_PATH || "data/db.json";
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES || 250000);
const sessionMaxAgeMs = Number(process.env.SESSION_MAX_AGE_MS || 24 * 60 * 60 * 1000);
const telegramBotUrl = (process.env.TELEGRAM_BOT_URL || "").replace(/\/+$/, "");
const botWebhookSecret = process.env.BOT_WEBHOOK_SECRET || "";
const sessions = new Map();
const loginAttempts = new Map();

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

function sendJson(res, status, payload) {
    res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        ...securityHeaders()
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

function securityHeaders() {
    return {
        "x-content-type-options": "nosniff",
        "x-frame-options": "SAMEORIGIN",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": "camera=(), microphone=(), geolocation=()"
    };
}

function githubRequest(method, apiPath, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : "";
        const request = https.request(
            {
                hostname: "api.github.com",
                path: apiPath,
                method,
                headers: {
                    "accept": "application/vnd.github+json",
                    "authorization": `Bearer ${githubToken}`,
                    "content-type": "application/json",
                    "content-length": Buffer.byteLength(payload),
                    "user-agent": "storetainguyen-admin-sync",
                    "x-github-api-version": "2022-11-28"
                }
            },
            (response) => {
                const chunks = [];

                response.on("data", (chunk) => chunks.push(chunk));
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

                    reject(new Error(data.message || `GitHub API error ${response.statusCode}`));
                });
            }
        );

        request.on("error", reject);
        request.end(payload);
    });
}

function hashPassword(password) {
    return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function createPasswordHash(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
    return `pbkdf2$${salt}$${hash}`;
}

function timingSafeEqualHex(left, right) {
    const leftBuffer = Buffer.from(String(left || ""), "hex");
    const rightBuffer = Buffer.from(String(right || ""), "hex");

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyPassword(password, storedHash) {
    const hash = String(storedHash || "");

    if (hash.startsWith("pbkdf2$")) {
        const [, salt, expected] = hash.split("$");
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
        return String(password) === adminPassword;
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

function createSessionToken(userId) {
    const payload = base64UrlEncode(JSON.stringify({
        userId,
        createdAt: Date.now()
    }));

    return `${payload}.${signPayload(payload)}`;
}

function userIdFromToken(token) {
    if (!token) {
        return "";
    }

    if (sessions.has(token)) {
        return sessions.get(token).userId;
    }

    const [payload, signature] = token.split(".");

    if (!payload || !signature || !timingSafeEqualString(signPayload(payload), signature)) {
        return "";
    }

    try {
        const session = JSON.parse(base64UrlDecode(payload));

        if (!session.createdAt || Date.now() - Number(session.createdAt) > sessionMaxAgeMs) {
            return "";
        }

        return session.userId || "";
    } catch {
        return "";
    }
}

function authUser(req, db) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const userId = userIdFromToken(token);

    if (!userId) {
        return null;
    }

    return db.users?.find((user) => user.id === userId) || null;
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

async function readBody(req) {
    const chunks = [];
    let total = 0;

    for await (const chunk of req) {
        total += chunk.length;

        if (total > maxBodyBytes) {
            throw new Error("Payload quá lớn.");
        }

        chunks.push(chunk);
    }

    const raw = Buffer.concat(chunks).toString("utf8").trim();
    return raw ? JSON.parse(raw) : {};
}

function clientIp(req) {
    return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
        .split(",")[0]
        .trim();
}

function checkLoginRateLimit(req) {
    const key = clientIp(req) || "unknown";
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 12;
    const bucket = loginAttempts.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    loginAttempts.set(key, bucket);

    return bucket.count <= maxAttempts;
}

function clearLoginRateLimit(req) {
    loginAttempts.delete(clientIp(req) || "unknown");
}

async function readDb() {
    try {
        await fs.access(dataFile);
    } catch {
        await fs.mkdir(path.dirname(dataFile), { recursive: true });
        await fs.copyFile(seedDataFile, dataFile);
    }

    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw);
}

let githubSyncQueue = Promise.resolve();

async function syncDbToGithub(raw) {
    if (!githubToken || !syncDbToGithubEnabled) {
        return;
    }

    githubSyncQueue = githubSyncQueue.then(async () => {
        const encodedPath = githubDbPath
            .split("/")
            .map(encodeURIComponent)
            .join("/");

        const current = await githubRequest(
            "GET",
            `/repos/${githubRepo}/contents/${encodedPath}?ref=${encodeURIComponent(githubBranch)}`
        );

        await githubRequest(
            "PUT",
            `/repos/${githubRepo}/contents/${encodedPath}`,
            {
                message: `Update ${githubDbPath} from admin panel`,
                content: Buffer.from(raw, "utf8").toString("base64"),
                sha: current.sha,
                branch: githubBranch
            }
        );
    });

    return githubSyncQueue;
}

async function writeDb(db) {
    const raw = JSON.stringify(db, null, 2) + "\n";

    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, raw, "utf8");

    try {
        await syncDbToGithub(raw);
    } catch (error) {
        console.error("GitHub db sync failed:", error.message);

        if (githubToken) {
            throw new Error("Đã lưu tạm trên server nhưng chưa đồng bộ được data/db.json lên GitHub: " + error.message);
        }
    }
}

function createId(prefix) {
    return `${prefix}_${crypto.randomBytes(5).toString("hex")}`;
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

function normalizeProduct(input, existing = {}) {
    const name = String(input.name || existing.name || "").trim();

    return {
        ...existing,
        id: existing.id || input.id || createId("prod"),
        slug: slugify(input.slug || existing.slug || name),
        name,
        categorySlug: String(input.categorySlug || existing.categorySlug || "cong-cu-ai").trim(),
        image: String(input.image || existing.image || "").trim(),
        icon: String(input.icon || existing.icon || "").trim(),
        discount: String(input.discount || existing.discount || "").trim(),
        price: Number(input.price ?? existing.price ?? 0),
        oldPrice: input.oldPrice === "" ? null : Number(input.oldPrice ?? existing.oldPrice ?? 0),
        stock: Number(input.stock ?? existing.stock ?? 0),
        rating: Number(input.rating ?? existing.rating ?? 4.6),
        sold: Number(input.sold ?? existing.sold ?? 0),
        status: input.status || existing.status || "active",
        description: String(input.description || existing.description || "").trim()
    };
}

function priceToVnd(value) {
    const number = Number(value || 0);
    return number > 0 && number < 10000 ? number * 1000 : number;
}

function publicOrigin(req) {
    const proto = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "";
    return `${proto}://${host}`;
}

function buildTelegramStartUrl(orderId) {
    if (!telegramBotUrl || !orderId) {
        return "";
    }

    const separator = telegramBotUrl.includes("?") ? "&" : "?";
    return `${telegramBotUrl}${separator}start=${encodeURIComponent(orderId)}`;
}

function requireBot(req, res) {
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

    return true;
}

function orderProductSnapshot(product) {
    if (!product) {
        return null;
    }

    return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image || product.icon || "",
        price: priceToVnd(product.price)
    };
}

function publicOrder(order, req = null) {
    return {
        id: order.id,
        orderId: order.id,
        userId: order.userId || null,
        productId: order.productId || "",
        productSlug: order.productSlug || "",
        productName: order.productName || "",
        items: order.items || [],
        quantity: Number(order.quantity || 1),
        total: Number(order.total || 0),
        amount: Number(order.total || order.amount || 0),
        status: order.status || "created",
        source: order.source || "website",
        telegramUserId: order.telegramUserId || "",
        telegramUsername: order.telegramUsername || "",
        paidAt: order.paidAt || "",
        deliveredAt: order.deliveredAt || "",
        botPaymentRef: order.botPaymentRef || "",
        note: order.note || "",
        createdAt: order.createdAt || "",
        updatedAt: order.updatedAt || "",
        telegramUrl: buildTelegramStartUrl(order.id),
        botOrderApi: req ? `${publicOrigin(req)}/api/bot/orders/${encodeURIComponent(order.id)}` : ""
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
    const image = product.image || product.icon || "";
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
        deal: { enabled: !!product.discount },
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
                html: `<strong>Lưu ý:</strong> ${product.description || "Chọn đúng gói và thời hạn trước khi thêm vào giỏ."}`
            }
        ],
        intro: [
            {
                type: "html",
                html: `<p>${product.description || `${product.name} đang được bán tại storetainguyen.`}</p>`
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
    const name = String(input.name || existing.name || "").trim();

    return {
        ...existing,
        id: existing.id || input.id || createId("cat"),
        slug: slugify(input.slug || existing.slug || name),
        name,
        description: String(input.description || existing.description || "").trim(),
        status: input.status || existing.status || "active"
    };
}

function publicProduct(product) {
    return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        categorySlug: product.categorySlug,
        image: product.image || "",
        icon: product.icon || "",
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
    return (db.products || []).map(publicProduct);
}

function adminCategories(db) {
    return (db.categories || []).map(publicCategory);
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
            telegramEnabled: Boolean(telegramBotUrl)
        });
        return;
    }

    if (resource === "bot") {
        if (!requireBot(req, res)) return;

        if (parts[2] === "orders" && parts[3] && req.method === "GET") {
            const order = db.orders?.find((item) => item.id === parts[3]);

            if (!order) {
                sendError(res, 404, "Không tìm thấy đơn hàng.");
                return;
            }

            sendJson(res, 200, publicOrder(order, req));
            return;
        }

        if (parts[2] === "order-paid" && req.method === "POST") {
            const input = await readBody(req);
            const orderId = String(input.orderId || input.id || "").trim();
            const index = db.orders?.findIndex((item) => item.id === orderId) ?? -1;

            if (index < 0) {
                sendError(res, 404, "Không tìm thấy đơn hàng.");
                return;
            }

            const now = new Date().toISOString();
            db.orders[index] = {
                ...db.orders[index],
                status: String(input.status || "paid"),
                total: Number(input.amount || input.total || db.orders[index].total || 0),
                amount: Number(input.amount || input.total || db.orders[index].total || 0),
                telegramUserId: String(input.telegramUserId || db.orders[index].telegramUserId || ""),
                telegramUsername: String(input.telegramUsername || db.orders[index].telegramUsername || ""),
                botPaymentRef: String(input.botPaymentRef || input.paymentRef || db.orders[index].botPaymentRef || ""),
                paidAt: String(input.paidAt || now),
                deliveredAt: input.deliveredAt ? String(input.deliveredAt) : db.orders[index].deliveredAt || "",
                botRaw: input,
                updatedAt: now
            };

            await writeDb(db);
            sendJson(res, 200, publicOrder(db.orders[index], req));
            return;
        }
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
        const token = createSessionToken(user.id);

        sendJson(res, 200, {
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email || "",
                role: user.role
            }
        });
        return;
    }

    if (url.pathname === "/api/auth/register" && req.method === "POST") {
        const input = await readBody(req);
        const username = String(input.username || input.email || "").trim();
        const email = String(input.email || "").trim().toLowerCase();
        const password = String(input.password || "");

        if (!username || !email || password.length < 8) {
            sendError(res, 400, "Vui lòng nhập email và mật khẩu từ 6 ký tự.");
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
            name: input.name || username,
            firstName: input.firstName || "",
            lastName: input.lastName || "",
            role: "customer",
            passwordHash: createPasswordHash(password),
            createdAt: new Date().toISOString()
        };

        db.users = db.users || [];
        db.users.push(user);
        await writeDb(db);

        const token = createSessionToken(user.id);

        sendJson(res, 201, {
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
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

        if (nextPassword) {
            if (nextPassword.length < 8) {
                sendError(res, 400, "Mật khẩu mới cần ít nhất 8 ký tự.");
                return;
            }

            if (input.currentPassword && !verifyPassword(input.currentPassword, user.passwordHash)) {
                sendError(res, 400, "Mật khẩu hiện tại không đúng.");
                return;
            }
        }

        db.users[index] = {
            ...user,
            firstName: String(input.firstName || "").trim(),
            lastName: String(input.lastName || "").trim(),
            name: String(input.name || user.name || user.username).trim(),
            email: String(input.email || user.email || "").trim().toLowerCase(),
            passwordHash: nextPassword ? createPasswordHash(nextPassword) : user.passwordHash
        };
        await writeDb(db);
        sendJson(res, 200, {
            id: db.users[index].id,
            username: db.users[index].username,
            name: db.users[index].name,
            email: db.users[index].email,
            firstName: db.users[index].firstName,
            lastName: db.users[index].lastName,
            role: db.users[index].role
        });
        return;
    }

    if (url.pathname === "/api/account/orders" && req.method === "GET") {
        const user = authUser(req, db);
        if (!user) {
            sendError(res, 401, "Chưa đăng nhập.");
            return;
        }

        sendJson(res, 200, db.orders.filter((order) => order.userId === user.id));
        return;
    }

    if (url.pathname === "/api/auth/logout" && req.method === "POST") {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : "";
        sessions.delete(token);
        sendJson(res, 200, { ok: true });
        return;
    }

    if (resource === "summary" && req.method === "GET") {
        sendJson(res, 200, {
            products: publicProducts(db).length,
            categories: publicCategories(db).length,
            orders: isAdmin(req, db) ? db.orders.length : 0,
            revenue: isAdmin(req, db) ? db.orders.reduce((sum, order) => sum + Number(order.total || 0), 0) : 0
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
                revenue: db.orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
            });
            return;
        }

        if (adminResource === "products") {
            if (req.method === "GET") {
                sendJson(res, 200, adminProducts(db));
                return;
            }

            if (req.method === "POST") {
                const product = normalizeProduct(await readBody(req));
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
                db.products[index] = normalizeProduct(await readBody(req), db.products[index]);
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
                db.categories[index] = normalizeCategory(await readBody(req), db.categories[index]);
                await writeDb(db);
                sendJson(res, 200, publicCategory(db.categories[index]));
                return;
            }

            if (req.method === "DELETE") {
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
                db.orders[index] = {
                    ...db.orders[index],
                    ...(await readBody(req))
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

        if (!requireAdmin(req, res, db)) return;

        if (req.method === "POST") {
            const product = normalizeProduct(await readBody(req));
            db.products.unshift(product);
            await writeDb(db);
            sendJson(res, 201, product);
            return;
        }

        const index = db.products.findIndex((item) => item.id === id);
        if (index < 0) {
            sendError(res, 404, "Không tìm thấy sản phẩm.");
            return;
        }

        if (req.method === "PUT") {
            db.products[index] = normalizeProduct(await readBody(req), db.products[index]);
            await writeDb(db);
            sendJson(res, 200, db.products[index]);
            return;
        }

        if (req.method === "DELETE") {
            const [removed] = db.products.splice(index, 1);
            await writeDb(db);
            sendJson(res, 200, removed);
            return;
        }
    }

    if (resource === "categories") {
        if (req.method === "GET") {
            sendJson(res, 200, publicCategories(db));
            return;
        }

        if (!requireAdmin(req, res, db)) return;

        if (req.method === "POST") {
            const category = normalizeCategory(await readBody(req));
            db.categories.push(category);
            await writeDb(db);
            sendJson(res, 201, category);
            return;
        }

        const index = db.categories.findIndex((item) => item.id === id);
        if (index < 0) {
            sendError(res, 404, "Không tìm thấy danh mục.");
            return;
        }

        if (req.method === "PUT") {
            db.categories[index] = normalizeCategory(await readBody(req), db.categories[index]);
            await writeDb(db);
            sendJson(res, 200, db.categories[index]);
            return;
        }

        if (req.method === "DELETE") {
            const [removed] = db.categories.splice(index, 1);
            await writeDb(db);
            sendJson(res, 200, removed);
            return;
        }
    }

    if (resource === "orders") {
        if (req.method === "GET") {
            if (!requireAdmin(req, res, db)) return;
            sendJson(res, 200, db.orders);
            return;
        }

        if (req.method === "POST") {
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

            const items = requestedItems.map((item) => {
                const product = db.products.find((current) =>
                    current.id === item.productId
                    || current.slug === item.productSlug
                    || current.slug === item.slug
                );

                if (!product || product.status === "draft") {
                    return null;
                }

                const quantity = Math.max(1, Math.min(99, Number(item.quantity || 1)));
                const unitPrice = priceToVnd(product.price);

                return {
                    productId: product.id,
                    productSlug: product.slug,
                    productName: product.name,
                    image: product.image || product.icon || "",
                    quantity,
                    unitPrice,
                    total: unitPrice * quantity,
                    options: item.options || {}
                };
            }).filter(Boolean);

            if (!items.length) {
                sendError(res, 400, "Không tìm thấy sản phẩm để tạo đơn.");
                return;
            }

            const total = items.reduce((sum, item) => sum + item.total, 0);
            const firstItem = items[0];
            const now = new Date().toISOString();
            const order = {
                id: createId("ord"),
                userId: user?.id || null,
                customerName: String(input.customerName || "").trim(),
                customerPhone: String(input.customerPhone || "").trim(),
                productId: firstItem.productId,
                productSlug: firstItem.productSlug,
                productName: firstItem.productName,
                quantity: items.reduce((sum, item) => sum + item.quantity, 0),
                items,
                total,
                amount: total,
                status: "created",
                source: "website",
                note: String(input.note || "").trim(),
                createdAt: now,
                updatedAt: now
            };
            db.orders.unshift(order);
            await writeDb(db);
            sendJson(res, 201, publicOrder(order, req));
            return;
        }

        if (!requireAdmin(req, res, db)) return;

        const index = db.orders.findIndex((item) => item.id === id);
        if (index < 0) {
            sendError(res, 404, "Không tìm thấy đơn hàng.");
            return;
        }

        if (req.method === "PUT") {
            db.orders[index] = {
                ...db.orders[index],
                ...(await readBody(req))
            };
            await writeDb(db);
            sendJson(res, 200, db.orders[index]);
            return;
        }
    }

    sendError(res, 404, "API không tồn tại.");
}

async function serveStatic(req, res, url) {
    if (url.pathname === "/js/products.js") {
        await serveLiveCatalog(res, "products");
        return;
    }

    if (url.pathname === "/js/categories.js") {
        await serveLiveCatalog(res, "categories");
        return;
    }

    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const normalizedPathname = pathname.replaceAll("\\", "/");

    if (
        normalizedPathname.startsWith("/data/")
        || normalizedPathname.startsWith("/.git/")
        || normalizedPathname.includes("/.")
        || ["/server.js", "/package.json", "/package-lock.json", "/render.yaml"].includes(normalizedPathname)
    ) {
        sendError(res, 404, "Không tìm thấy file.");
        return;
    }

    const filePath = path.resolve(rootDir, `.${pathname}`);

    if (!filePath.startsWith(rootDir)) {
        sendError(res, 403, "Forbidden");
        return;
    }

    try {
        const stat = await fs.stat(filePath);
        const target = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
        const ext = path.extname(target).toLowerCase();
        const content = await fs.readFile(target);
        res.writeHead(200, {
            "content-type": mimeTypes[ext] || "application/octet-stream",
            ...securityHeaders()
        });
        res.end(content);
    } catch {
        sendError(res, 404, "Không tìm thấy file.");
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    try {
        if (url.pathname.startsWith("/api/")) {
            await handleApi(req, res, url);
            return;
        }

        await serveStatic(req, res, url);
    } catch (error) {
        sendError(res, 500, error.message || "Server error");
    }
});

server.listen(port, "0.0.0.0", () => {
    console.log(`WebsiteClone server: http://0.0.0.0:${port}`);
    console.log(`Admin portal: http://0.0.0.0:${port}/admin.html`);
    console.log(`Database file: ${dataFile}`);

    if (!adminPassword && !adminPasswordHash) {
        console.warn("WARNING: ADMIN_PASSWORD or ADMIN_PASSWORD_HASH is not configured. Do not run production with the default admin password from seed data.");
    }
});
