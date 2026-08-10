(() => {
    "use strict";

    /* =====================================================
       CONFIG
       ===================================================== */

    const STORAGE_KEY = "ktk_cart_v1";
    const MAX_QTY = 99;

    const state = {
        items: loadItems(),
        isOpen: false
    };

    const selectors = {
        root: "#ktkCartRoot",
        overlay: "#ktkCartOverlay",
        drawer: "#ktkCartDrawer",
        body: "#ktkCartBody",
        footer: "#ktkCartFooter"
    };

    /* =====================================================
       STORAGE
       ===================================================== */

    function loadItems() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed
                .map(normalizeItem)
                .filter(Boolean);
        } catch (error) {
            console.warn(
                "[KTK Cart] Không đọc được localStorage:",
                error
            );

            return [];
        }
    }

    function saveItems() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state.items)
            );
        } catch (error) {
            console.warn(
                "[KTK Cart] Không ghi được localStorage:",
                error
            );
        }

        updateExternalCartIndicators();
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    function clampInt(
        value,
        min,
        max,
        fallback
    ) {
        const number =
            Number.parseInt(
                value,
                10
            );

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(
            max,
            Math.max(
                min,
                number
            )
        );
    }

    function parsePrice(value) {
        if (
            typeof value === "number" &&
            Number.isFinite(value)
        ) {
            return Math.round(value);
        }

        if (
            typeof value !== "string"
        ) {
            return 0;
        }

        const text =
            value.trim();

        if (!text) {
            return 0;
        }

        /*
            Ví dụ:

            189.050đ
            -> 189050

            189.050đ - 236.550đ
            -> lấy giá đầu tiên: 189050
        */

        const match =
            text.match(
                /\d{1,3}(?:[.,\s]\d{3})+|\d+/
            );

        if (!match) {
            return 0;
        }

        return (
            Number.parseInt(
                match[0].replace(
                    /\D/g,
                    ""
                ),
                10
            ) || 0
        );
    }

    function formatVnd(value) {
        const number =
            Math.round(
                value || 0
            );

        return (
            new Intl.NumberFormat(
                "vi-VN"
            ).format(number) +
            "đ"
        );
    }

    function escapeHtml(value) {
        return String(
            value ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }

    function cleanOptionText(value) {
        return String(
            value || ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .replace(
                /^[-–—:]\s*/,
                ""
            )
            .trim();
    }

    /* =====================================================
       NORMALIZE CART ITEM
       ===================================================== */

    function normalizeItem(item) {
        if (
            !item ||
            typeof item !== "object"
        ) {
            return null;
        }

        const id =
            String(
                item.id ||
                item.slug ||
                item.name ||
                Date.now()
            );

        const name =
            String(
                item.name ||
                item.title ||
                "Sản phẩm"
            );

        const price =
            Math.max(
                0,
                parsePrice(
                    item.price
                )
            );

        const quantity =
            clampInt(
                item.quantity,
                1,
                MAX_QTY,
                1
            );

        const image =
            String(
                item.image ||
                item.thumbnail ||
                ""
            );

        const options = {
            package:
                String(
                    item.options?.package ||
                    item.package ||
                    "Dùng riêng"
                ),

            duration:
                String(
                    item.options?.duration ||
                    item.duration ||
                    "12 tháng"
                ),

            privateAccount:
                String(
                    item.options?.privateAccount ||
                    item.privateAccount ||
                    "Có"
                )
        };

        return {
            key:
                item.key ||
                makeItemKey(
                    id,
                    options
                ),

            id,

            slug:
                String(
                    item.slug ||
                    id
                ),

            name,

            image,

            price,

            quantity,

            options
        };
    }

    function makeItemKey(
        id,
        options = {}
    ) {
        return [
            id,
            options.package || "",
            options.duration || "",
            options.privateAccount || ""
        ]
            .join("::")
            .toLowerCase();
    }

    /* =====================================================
       TOTAL
       ===================================================== */

    function getTotalQuantity() {
        return state.items.reduce(
            (
                total,
                item
            ) =>
                total +
                item.quantity,
            0
        );
    }

    function getSubtotal() {
        return state.items.reduce(
            (
                total,
                item
            ) =>
                total +
                item.price *
                item.quantity,
            0
        );
    }

    /* =====================================================
       INJECT DRAWER HTML
       ===================================================== */

    function injectCart() {
        if (
            document.querySelector(
                selectors.root
            )
        ) {
            return;
        }

        const root =
            document.createElement(
                "div"
            );

        root.id =
            "ktkCartRoot";

        root.className =
            "ktk-cart-root";

        root.innerHTML = `
            <div
                class="ktk-cart-overlay"
                id="ktkCartOverlay"
                aria-hidden="true"
            ></div>

            <aside
                class="ktk-cart-drawer"
                id="ktkCartDrawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ktkCartTitle"
                aria-hidden="true"
            >

                <header
                    class="ktk-cart-header"
                >

                    <h2
                        id="ktkCartTitle"
                    >
                        Giỏ hàng
                    </h2>

                    <button
                        class="ktk-cart-close"
                        type="button"
                        data-cart-close
                        aria-label="Đóng giỏ hàng"
                    >

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M5 5l14 14M19 5L5 19"
                            ></path>
                        </svg>

                        <span>
                            Đóng
                        </span>

                    </button>

                </header>

                <div
                    class="ktk-cart-body"
                    id="ktkCartBody"
                ></div>

                <footer
                    class="ktk-cart-footer"
                    id="ktkCartFooter"
                ></footer>

            </aside>
        `;

        document.body.appendChild(
            root
        );
    }

    /* =====================================================
       EMPTY STATE
       ===================================================== */

    function emptyStateMarkup() {
        return `
            <div
                class="ktk-cart-empty"
            >

                <svg
                    class="ktk-cart-empty-icon"
                    viewBox="0 0 96 96"
                    aria-hidden="true"
                >

                    <g
                        fill="none"
                        stroke="currentColor"
                        stroke-width="7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >

                        <path
                            d="M20 22h10l7 39h35l8-28H34"
                        ></path>

                        <circle
                            cx="43"
                            cy="75"
                            r="4"
                        ></circle>

                        <circle
                            cx="70"
                            cy="75"
                            r="4"
                        ></circle>

                        <path
                            d="M58 25l17 17M75 25L58 42"
                        ></path>

                    </g>

                </svg>

                <p>
                    Chưa có sản phẩm trong giỏ hàng.
                </p>

                <a
                    class="ktk-cart-back"
                    href="index.html"
                    data-cart-close
                >
                    Quay Về Cửa Hàng
                </a>

            </div>
        `;
    }

    /* =====================================================
       CART ITEM
       ===================================================== */

    function itemMarkup(item) {
        let imageMarkup;

        if (item.image) {
            imageMarkup = `
                <img
                    src="${escapeHtml(item.image)}"
                    alt="${escapeHtml(item.name)}"
                    loading="lazy"
                >
            `;
        } else {
            imageMarkup = `
                <div
                    class="ktk-cart-image-placeholder"
                >
                    KTK
                </div>
            `;
        }

        return `
            <article
                class="ktk-cart-item"
                data-cart-key="${escapeHtml(item.key)}"
            >

                <div
                    class="ktk-cart-item-image"
                >
                    ${imageMarkup}
                </div>

                <div
                    class="ktk-cart-item-info"
                >

                    <div
                        class="ktk-cart-item-heading"
                    >

                        <h3>
                            ${escapeHtml(item.name)}
                        </h3>

                        <button
                            class="ktk-cart-remove"
                            type="button"

                            data-cart-remove="${escapeHtml(item.key)}"

                            aria-label="Xóa sản phẩm"
                        >
                            ×
                        </button>

                    </div>

                    <div
                        class="ktk-cart-meta"
                    >

                        <p>
                            <strong>
                                Loại gói:
                            </strong>

                            ${escapeHtml(
                                item.options.package
                            )}
                        </p>

                        <p>
                            <strong>
                                Thời hạn:
                            </strong>

                            ${escapeHtml(
                                item.options.duration
                            )}
                        </p>

                        <p>
                            <strong>
                                Cấp tài khoản riêng tư:
                            </strong>

                            ${escapeHtml(
                                item.options.privateAccount
                            )}
                        </p>

                    </div>

                    <div
                        class="ktk-cart-item-bottom"
                    >

                        <div
                            class="ktk-cart-qty"
                            aria-label="Số lượng"
                        >

                            <button
                                type="button"
                                data-cart-decrease="${escapeHtml(item.key)}"
                                aria-label="Giảm số lượng"
                            >
                                −
                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                data-cart-increase="${escapeHtml(item.key)}"
                                aria-label="Tăng số lượng"
                            >
                                +
                            </button>

                        </div>

                        <div
                            class="ktk-cart-line-price"
                        >

                            <span>
                                ${item.quantity} ×
                            </span>

                            <strong>
                                ${formatVnd(item.price)}
                            </strong>

                        </div>

                    </div>

                </div>

            </article>
        `;
    }

    /* =====================================================
       FOOTER
       ===================================================== */

    function footerMarkup() {
        return `
            <div
                class="ktk-cart-subtotal"
            >

                <span>
                    Tổng số phụ:
                </span>

                <strong>
                    ${formatVnd(
                        getSubtotal()
                    )}
                </strong>

            </div>

            <button
                class="
                    ktk-cart-action
                    ktk-cart-view
                "
                type="button"
                data-cart-view
            >
                Xem Giỏ Hàng
            </button>

            <button
                class="
                    ktk-cart-action
                    ktk-cart-checkout
                "
                type="button"
                data-cart-checkout
            >
                Thanh Toán
            </button>
        `;
    }

    /* =====================================================
       RENDER
       ===================================================== */

    function render() {
        injectCart();

        const body =
            document.querySelector(
                selectors.body
            );

        const footer =
            document.querySelector(
                selectors.footer
            );

        if (
            !body ||
            !footer
        ) {
            return;
        }

        if (
            state.items.length === 0
        ) {
            body.innerHTML =
                emptyStateMarkup();

            footer.innerHTML =
                "";

            footer.classList.add(
                "is-empty"
            );
        } else {
            body.innerHTML = `
                <div
                    class="ktk-cart-items"
                >
                    ${state.items
                        .map(itemMarkup)
                        .join("")}
                </div>
            `;

            footer.innerHTML =
                footerMarkup();

            footer.classList.remove(
                "is-empty"
            );
        }

        handleImageErrors();

        updateExternalCartIndicators();
    }

    /* =====================================================
       IMAGE FALLBACK
       ===================================================== */

    function handleImageErrors() {
        document
            .querySelectorAll(
                ".ktk-cart-item-image img"
            )
            .forEach(
                (image) => {
                    image.addEventListener(
                        "error",
                        () => {
                            const wrapper =
                                image.parentElement;

                            if (!wrapper) {
                                return;
                            }

                            wrapper.innerHTML = `
                                <div
                                    class="ktk-cart-image-placeholder"
                                >
                                    KTK
                                </div>
                            `;
                        },
                        {
                            once: true
                        }
                    );
                }
            );
    }

    /* =====================================================
       OPEN / CLOSE
       ===================================================== */

    function openCart() {
        injectCart();

        render();

        const overlay =
            document.querySelector(
                selectors.overlay
            );

        const drawer =
            document.querySelector(
                selectors.drawer
            );

        if (
            !overlay ||
            !drawer
        ) {
            return;
        }

        state.isOpen =
            true;

        document.body.classList.add(
            "ktk-cart-open"
        );

        overlay.classList.add(
            "is-open"
        );

        drawer.classList.add(
            "is-open"
        );

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        drawer.setAttribute(
            "aria-hidden",
            "false"
        );
    }

    function closeCart() {
        const overlay =
            document.querySelector(
                selectors.overlay
            );

        const drawer =
            document.querySelector(
                selectors.drawer
            );

        state.isOpen =
            false;

        document.body.classList.remove(
            "ktk-cart-open"
        );

        overlay?.classList.remove(
            "is-open"
        );

        drawer?.classList.remove(
            "is-open"
        );

        overlay?.setAttribute(
            "aria-hidden",
            "true"
        );

        drawer?.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    /* =====================================================
       ADD ITEM
       ===================================================== */

    function addItem(
        rawItem,
        options = {}
    ) {
        const item =
            normalizeItem(
                rawItem
            );

        if (!item) {
            return;
        }

        const existing =
            state.items.find(
                current =>
                    current.key ===
                    item.key
            );

        if (existing) {
            existing.quantity =
                Math.min(
                    MAX_QTY,
                    existing.quantity +
                    item.quantity
                );
        } else {
            state.items.push(
                item
            );
        }

        saveItems();

        render();

        if (
            options.open !== false
        ) {
            openCart();
        }

        document.dispatchEvent(
            new CustomEvent(
                "ktk:cart:added",
                {
                    detail: {
                        item,
                        items:
                            getItems()
                    }
                }
            )
        );
    }

    /* =====================================================
       REMOVE
       ===================================================== */

    function removeItem(key) {
        state.items =
            state.items.filter(
                item =>
                    item.key !== key
            );

        saveItems();

        render();

        document.dispatchEvent(
            new CustomEvent(
                "ktk:cart:changed",
                {
                    detail: {
                        items:
                            getItems()
                    }
                }
            )
        );
    }

    /* =====================================================
       QUANTITY
       ===================================================== */

    function changeQuantity(
        key,
        delta
    ) {
        const item =
            state.items.find(
                current =>
                    current.key === key
            );

        if (!item) {
            return;
        }

        const next =
            item.quantity +
            delta;

        if (
            next <= 0
        ) {
            removeItem(key);

            return;
        }

        item.quantity =
            Math.min(
                MAX_QTY,
                next
            );

        saveItems();

        render();
    }

    /* =====================================================
       CLEAR
       ===================================================== */

    function clearCart() {
        state.items = [];

        saveItems();

        render();
    }

    /* =====================================================
       GET ITEMS
       ===================================================== */

    function getItems() {
        return JSON.parse(
            JSON.stringify(
                state.items
            )
        );
    }

    async function createTelegramCartOrder() {
        const response = await fetch(
            "/api/orders",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    items: getItems().map((item) => ({
                        productId: item.id,
                        productSlug: item.slug,
                        quantity: item.quantity,
                        options: item.options
                    })),
                    note: "Telegram bot cart checkout"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Không tạo được đơn hàng.");
        }

        if (!data.telegramUrl) {
            throw new Error("Chưa cấu hình TELEGRAM_BOT_URL trên server.");
        }

        return data;
    }

    /* =====================================================
       EXTERNAL CART BADGE
       ===================================================== */

    function updateExternalCartIndicators() {
        const qty =
            getTotalQuantity();

        const subtotal =
            getSubtotal();

        document
            .querySelectorAll(
                `
                [data-cart-count],
                .cart-count,
                .cart-badge,
                [data-cart-open] .action-counter,
                [data-cart-open] > span,
                .cart-action .action-counter,
                .cart-button > span
                `
            )
            .forEach(
                element => {
                    element.textContent =
                        String(qty);

                    if (
                        element.hasAttribute(
                            "data-cart-count"
                        )
                    ) {
                        element.toggleAttribute(
                            "hidden",
                            qty === 0
                        );
                    }
                }
            );

        document
            .querySelectorAll(
                `
                [data-cart-total],
                .cart-price
                `
            )
            .forEach(
                element => {
                    element.textContent =
                        formatVnd(
                            subtotal
                        );
                }
            );
    }

    /* =====================================================
       READ CURRENT PRODUCT PAGE
       ===================================================== */

    function getSlugFromLocation() {
        const params =
            new URLSearchParams(
                window.location.search
            );

        const querySlug =
            params.get(
                "slug"
            );

        if (querySlug) {
            return querySlug;
        }

        const parts =
            window.location.pathname
                .split("/")
                .filter(Boolean);

        const last =
            parts.at(-1) ||
            "product";

        return last.replace(
            /\.html$/i,
            ""
        );
    }

    /* =====================================================
       FIND PRODUCT FROM products.js
       ===================================================== */

    function getProductFromCatalog(
        slug
    ) {
        const sources = [
            window.PRODUCTS,
            window.PRODUCT_CATALOG,
            window.products
        ];

        for (
            const source
            of sources
        ) {
            if (!source) {
                continue;
            }

            if (
                Array.isArray(
                    source
                )
            ) {
                const found =
                    source.find(
                        product =>
                            product?.slug === slug ||
                            product?.id === slug
                    );

                if (found) {
                    return found;
                }
            } else if (
                typeof source ===
                "object"
            ) {
                if (
                    source[slug]
                ) {
                    return source[
                        slug
                    ];
                }

                const found =
                    Object
                        .values(
                            source
                        )
                        .find(
                            product =>
                                product?.slug === slug ||
                                product?.id === slug
                        );

                if (found) {
                    return found;
                }
            }
        }

        return {};
    }

    /* =====================================================
       DOM READ HELPERS
       ===================================================== */

    function readText(
        selectorList
    ) {
        for (
            const selector
            of selectorList
        ) {
            const element =
                document.querySelector(
                    selector
                );

            const text =
                element
                    ?.textContent
                    ?.trim();

            if (text) {
                return text;
            }
        }

        return "";
    }

    function readImage(
        selectorList
    ) {
        for (
            const selector
            of selectorList
        ) {
            const element =
                document.querySelector(
                    selector
                );

            if (!element) {
                continue;
            }

            const source =
                element.currentSrc ||
                element.src ||
                element.getAttribute?.(
                    "src"
                ) ||
                "";

            if (source) {
                return source;
            }
        }

        return "";
    }

    function readCheckedValue(
        names
    ) {
        for (
            const name
            of names
        ) {
            const checked =
                document.querySelector(
                    `input[name="${name}"]:checked`
                );

            if (!checked) {
                continue;
            }

            let label =
                null;

            if (checked.id) {
                try {
                    label =
                        document.querySelector(
                            `label[for="${checked.id}"]`
                        );
                } catch {
                    label =
                        null;
                }
            }

            return (
                checked.dataset.label ||
                label
                    ?.textContent
                    ?.trim() ||
                checked.value ||
                ""
            );
        }

        return "";
    }

    function readSelectedText(
        selectorList
    ) {
        for (
            const selector
            of selectorList
        ) {
            const element =
                document.querySelector(
                    selector
                );

            const text =
                element?.dataset?.value ||
                element
                    ?.textContent
                    ?.trim();

            if (text) {
                return text.replace(
                    /\s+/g,
                    " "
                );
            }
        }

        return "";
    }

    /* =====================================================
       CREATE PRODUCT FROM CURRENT PAGE
       ===================================================== */

    function buildCurrentProductFromPage(
        button
    ) {
        const slug =
            button
                ?.dataset
                ?.productSlug ||
            getSlugFromLocation();

        const catalogProduct =
            getProductFromCatalog(
                slug
            );

        /* -----------------------------
           NAME
           ----------------------------- */

        const name =
            button
                ?.dataset
                ?.productName ||

            catalogProduct.name ||

            catalogProduct.title ||

            readText([
                "[data-product-title]",
                "#productTitle",
                "#productName",
                ".product-title",
                ".product-info h1",
                ".product-summary h1",
                "main h1"
            ]) ||

            "Sản phẩm";

        /* -----------------------------
           IMAGE
           ----------------------------- */

        const image =
            button
                ?.dataset
                ?.productImage ||

            catalogProduct.cartImage ||

            catalogProduct.thumbnail ||

            catalogProduct.image ||

            (
                Array.isArray(
                    catalogProduct.images
                )
                    ? catalogProduct.images[0]
                    : ""
            ) ||

            readImage([
                "[data-product-image]",
                "#productMainImage",
                "#productImage",
                ".product-main-image img",
                ".product-gallery img",
                ".product-media img"
            ]);

        /* -----------------------------
           PRICE
           ----------------------------- */

        const domPrice =
            readText([
                "[data-product-price]",
                "#productPrice",
                "#currentPrice",
                ".product-price .current-price",
                ".product-price",
                ".current-price",
                ".sale-price"
            ]);

        const price =
            parsePrice(
                button
                    ?.dataset
                    ?.productPrice
            ) ||

            parsePrice(
                domPrice
            ) ||

            parsePrice(
                catalogProduct.salePrice
            ) ||

            parsePrice(
                catalogProduct.currentPrice
            ) ||

            parsePrice(
                catalogProduct.price
            ) ||

            0;

        /* -----------------------------
           QUANTITY
           ----------------------------- */

        const quantityInput =
            document.querySelector(
                `
                [data-product-quantity],
                #quantity,
                .quantity input,
                input.qty,
                .qty-input
                `
            );

        const quantity =
            clampInt(
                button
                    ?.dataset
                    ?.quantity ||

                quantityInput
                    ?.value ||

                quantityInput
                    ?.textContent,

                1,
                MAX_QTY,
                1
            );

        /* -----------------------------
           PACKAGE
           ----------------------------- */

        const packageName =
            button
                ?.dataset
                ?.package ||

            readCheckedValue([
                "package",
                "plan",
                "type",
                "account_type",
                "goi"
            ]) ||

            readSelectedText([
                '[data-option-group="package"] .active',
                '[data-option-group="package"] .selected',

                ".package-options .active",
                ".package-options .selected",

                ".plan-options .active",
                ".plan-options .selected",

                "#variantOptions .active",
                ".product-option-button.active"
            ]) ||

            "Dùng riêng";

        /* -----------------------------
           DURATION
           ----------------------------- */

        const duration =
            button
                ?.dataset
                ?.duration ||

            readCheckedValue([
                "duration",
                "period",
                "term",
                "thoi_han"
            ]) ||

            readSelectedText([
                '[data-option-group="duration"] .active',
                '[data-option-group="duration"] .selected',

                ".duration-options .active",
                ".duration-options .selected",

                ".period-options .active",
                ".period-options .selected",

                "#durationOptions .active"
            ]) ||

            "12 tháng";

        /* -----------------------------
           PRIVATE ACCOUNT
           ----------------------------- */

        let privateAccount =
            button
                ?.dataset
                ?.privateAccount ||
            "";

        if (!privateAccount) {
            const checkbox =
                document.querySelector(
                    `
                    input[type="checkbox"][name*="private"],
                    input[type="checkbox"][name*="account"],
                    #privateAccount
                    `
                );

            if (checkbox) {
                privateAccount =
                    checkbox.checked
                        ? "Có"
                        : "Không";
            }
        }

        if (!privateAccount) {
            privateAccount =
                "Có";
        }

        return {
            id:
                catalogProduct.id ||
                slug,

            slug,

            name,

            image,

            price,

            quantity,

            options: {
                package:
                    cleanOptionText(
                        packageName
                    ),

                duration:
                    cleanOptionText(
                        duration
                    ),

                privateAccount:
                    cleanOptionText(
                        privateAccount
                    )
            }
        };
    }

    /* =====================================================
       DETECT "ADD TO CART"
       ===================================================== */

    function getAddToCartButton(
        element
    ) {
        const button =
            element.closest(
                `
                [data-add-to-cart],
                #addToCartBtn,
                #add-to-cart,
                #addCartButton,
                .add-to-cart-btn,
                .add-cart-button,
                .btn-add-cart,
                button,
                a
                `
            );

        if (!button) {
            return null;
        }

        if (
            button.matches(
                `
                [data-add-to-cart],
                #addToCartBtn,
                #add-to-cart,
                #addCartButton,
                .add-to-cart-btn,
                .add-cart-button,
                .btn-add-cart
                `
            )
        ) {
            return button;
        }

        const text =
            button
                .textContent
                ?.replace(
                    /\s+/g,
                    " "
                )
                .trim()
                .toLowerCase() ||
            "";

        if (
            text.includes(
                "thêm vào giỏ hàng"
            )
        ) {
            return button;
        }

        return null;
    }

    /* =====================================================
       DETECT CART OPEN BUTTON
       ===================================================== */

    function getCartOpenTrigger(
        element
    ) {
        return element.closest(
            `
            [data-cart-open],
            #cartButton,
            #cartBtn,
            .cart-trigger,
            .cart-button,
            .header-cart,
            .cart-action,
            .mobile-bottom-nav a:nth-child(2)
            `
        );
    }

    /* =====================================================
       CLICK HANDLER
       ===================================================== */

    function handleDocumentClick(
        event
    ) {
        const target =
            event.target;

        if (
            !(target instanceof Element)
        ) {
            return;
        }

        /* -----------------------------
           OPEN CART
           ----------------------------- */

        const openTrigger =
            getCartOpenTrigger(
                target
            );

        if (openTrigger) {
            event.preventDefault();

            openCart();

            return;
        }

        /* -----------------------------
           OVERLAY
           ----------------------------- */

        if (
            target.closest(
                selectors.overlay
            )
        ) {
            closeCart();

            return;
        }

        /* -----------------------------
           CLOSE
           ----------------------------- */

        const closeButton =
            target.closest(
                "[data-cart-close]"
            );

        if (closeButton) {
            /*
                Link "Quay về cửa hàng"
                vẫn được phép navigate.
            */

            if (
                closeButton.tagName !==
                "A"
            ) {
                event.preventDefault();
            }

            closeCart();

            return;
        }

        /* -----------------------------
           REMOVE
           ----------------------------- */

        const removeButton =
            target.closest(
                "[data-cart-remove]"
            );

        if (removeButton) {
            event.preventDefault();

            removeItem(
                removeButton
                    .dataset
                    .cartRemove
            );

            return;
        }

        /* -----------------------------
           DECREASE
           ----------------------------- */

        const decreaseButton =
            target.closest(
                "[data-cart-decrease]"
            );

        if (decreaseButton) {
            event.preventDefault();

            changeQuantity(
                decreaseButton
                    .dataset
                    .cartDecrease,

                -1
            );

            return;
        }

        /* -----------------------------
           INCREASE
           ----------------------------- */

        const increaseButton =
            target.closest(
                "[data-cart-increase]"
            );

        if (increaseButton) {
            event.preventDefault();

            changeQuantity(
                increaseButton
                    .dataset
                    .cartIncrease,

                1
            );

            return;
        }

        /* -----------------------------
           VIEW CART
           ----------------------------- */

        const viewCart =
            target.closest(
                "[data-cart-view]"
            );

        if (viewCart) {
            event.preventDefault();

            document.dispatchEvent(
                new CustomEvent(
                    "ktk:cart:view",
                    {
                        detail: {
                            items:
                                getItems()
                        }
                    }
                )
            );

            return;
        }

        /* -----------------------------
           CHECKOUT
           ----------------------------- */

        const checkout =
            target.closest(
                "[data-cart-checkout]"
            );

        if (checkout) {
            event.preventDefault();

            document.dispatchEvent(
                new CustomEvent(
                    "ktk:cart:checkout",
                    {
                        detail: {
                            items:
                                getItems(),

                            subtotal:
                                getSubtotal()
                        }
                    }
                )
            );

            checkout.disabled =
                true;

            const originalText =
                checkout.textContent;

            checkout.textContent =
                "Đang mở bot...";

            createTelegramCartOrder()
                .then((order) => {
                    window.location.href =
                        order.telegramUrl;
                })
                .catch((error) => {
                    alert(
                        error.message ||
                        "Không mở được Telegram bot."
                    );
                    checkout.disabled =
                        false;
                    checkout.textContent =
                        originalText;
                });

            return;
        }

        /* -----------------------------
           ADD TO CART
           ----------------------------- */

        const addButton =
            getAddToCartButton(
                target
            );

        if (
            addButton &&
            !addButton.closest(
                selectors.drawer
            )
        ) {
            if (
                addButton.tagName ===
                "A"
            ) {
                const href =
                    addButton.getAttribute(
                        "href"
                    );

                if (
                    !href ||
                    href === "#"
                ) {
                    event.preventDefault();
                }
            }

            const product =
                buildCurrentProductFromPage(
                    addButton
                );

            addItem(
                product
            );
        }
    }

    /* =====================================================
       KEYBOARD
       ===================================================== */

    function handleKeydown(
        event
    ) {
        if (
            event.key === "Escape" &&
            state.isOpen
        ) {
            closeCart();
        }
    }

    /* =====================================================
       INIT
       ===================================================== */

    function init() {
        injectCart();

        render();

        document.addEventListener(
            "click",
            handleDocumentClick
        );

        document.addEventListener(
            "keydown",
            handleKeydown
        );
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.KTKCart = {

        open:
            openCart,

        close:
            closeCart,

        add:
            addItem,

        remove:
            removeItem,

        clear:
            clearCart,

        getItems:
            getItems,

        getSubtotal:
            getSubtotal,

        render:
            render,

        addCurrentProduct(
            button = null
        ) {
            addItem(
                buildCurrentProductFromPage(
                    button
                )
            );
        }
    };

    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );
    } else {
        init();
    }

})();
