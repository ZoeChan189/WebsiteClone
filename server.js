"use strict";

const crypto = require("crypto");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const dataFile = path.join(rootDir, "data", "db.json");
const port = Number(process.env.PORT || 8010);
const sessions = new Map();

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
        "cache-control": "no-store"
    });
    res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
    sendJson(res, status, { error: message });
}

function hashPassword(password) {
    return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function authUser(req, db) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const session = sessions.get(token);

    if (!session) {
        return null;
    }

    return db.users?.find((user) => user.id === session.userId) || null;
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

    for await (const chunk of req) {
        chunks.push(chunk);
    }

    const raw = Buffer.concat(chunks).toString("utf8").trim();
    return raw ? JSON.parse(raw) : {};
}

async function readDb() {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw);
}

async function writeDb(db) {
    await fs.writeFile(dataFile, JSON.stringify(db, null, 2) + "\n", "utf8");
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
        price: Number(input.price ?? existing.price ?? 0),
        oldPrice: input.oldPrice === "" ? null : Number(input.oldPrice ?? existing.oldPrice ?? 0),
        stock: Number(input.stock ?? existing.stock ?? 0),
        rating: Number(input.rating ?? existing.rating ?? 4.6),
        sold: Number(input.sold ?? existing.sold ?? 0),
        status: input.status || existing.status || "active",
        description: String(input.description || existing.description || "").trim()
    };
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

async function handleApi(req, res, url) {
    const db = await readDb();
    const parts = url.pathname.split("/").filter(Boolean);
    const resource = parts[1];
    const id = parts[2];

    if (url.pathname === "/api/health") {
        sendJson(res, 200, { ok: true });
        return;
    }

    if (url.pathname === "/api/auth/login" && req.method === "POST") {
        const input = await readBody(req);
        const login = String(input.username || "").trim().toLowerCase();
        const user = db.users?.find((item) =>
            item.username?.toLowerCase() === login
            || item.email?.toLowerCase() === login
        );

        if (!user || user.passwordHash !== hashPassword(input.password)) {
            sendError(res, 401, "Sai tài khoản hoặc mật khẩu.");
            return;
        }

        const token = crypto.randomBytes(24).toString("hex");
        sessions.set(token, {
            userId: user.id,
            createdAt: Date.now()
        });

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

        if (!username || !email || password.length < 6) {
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
            passwordHash: hashPassword(password),
            createdAt: new Date().toISOString()
        };

        db.users = db.users || [];
        db.users.push(user);
        await writeDb(db);

        const token = crypto.randomBytes(24).toString("hex");
        sessions.set(token, { userId: user.id, createdAt: Date.now() });

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
            if (nextPassword.length < 6) {
                sendError(res, 400, "Mật khẩu mới cần ít nhất 6 ký tự.");
                return;
            }

            if (input.currentPassword && user.passwordHash !== hashPassword(input.currentPassword)) {
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
            passwordHash: nextPassword ? hashPassword(nextPassword) : user.passwordHash
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
            products: db.products.length,
            categories: db.categories.length,
            orders: db.orders.length,
            revenue: db.orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
        });
        return;
    }

    if (resource === "products") {
        if (req.method === "GET") {
            sendJson(res, 200, db.products);
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
            sendJson(res, 200, db.categories);
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
            const product = db.products.find((item) => item.id === input.productId);
            const user = authUser(req, db);
            const quantity = Math.max(1, Number(input.quantity || 1));
            const order = {
                id: createId("ord"),
                userId: user?.id || null,
                customerName: String(input.customerName || "").trim(),
                customerPhone: String(input.customerPhone || "").trim(),
                productId: input.productId,
                quantity,
                total: Number(input.total || (product ? product.price * quantity : 0)),
                status: "pending",
                note: String(input.note || "").trim(),
                createdAt: new Date().toISOString()
            };
            db.orders.unshift(order);
            await writeDb(db);
            sendJson(res, 201, order);
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
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
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
        res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
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

server.listen(port, "127.0.0.1", () => {
    console.log(`WebsiteClone server: http://127.0.0.1:${port}`);
    console.log(`Admin portal: http://127.0.0.1:${port}/admin.html`);
    console.log("Admin account: admin / admin123");
});
