"use strict";

(function initSearchSuggest() {
    const suggestionLimit = 5;
    const minQueryLength = 1;
    let productCache = null;

    const money = value => {
        const number = Number(value || 0);
        const amount = number > 0 && number < 10000 ? number * 1000 : number;
        return amount ? amount.toLocaleString("vi-VN") + "đ" : "";
    };

    const escapeHTML = value =>
        String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    const normalize = value =>
        String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d");

    function localProducts() {
        const bySlug = new Map();

        Object.values(window.PRODUCT_CATALOG || {}).forEach(product => {
            if (product?.slug) {
                bySlug.set(product.slug, product);
            }
        });

        Object.values(window.CATEGORY_CATALOG || {}).forEach(category => {
            (category.products || []).forEach(product => {
                if (!product?.slug || bySlug.has(product.slug)) {
                    return;
                }

                bySlug.set(product.slug, {
                    ...product,
                    categorySlug: category.slug,
                    categoryName: category.name
                });
            });
        });

        return Array.from(bySlug.values());
    }

    async function loadProducts() {
        if (productCache) {
            return productCache;
        }

        try {
            const response = await fetch("/api/public/products", {
                credentials: "same-origin"
            });

            if (response.ok) {
                productCache = await response.json();
                return productCache;
            }
        } catch (error) {
            productCache = localProducts();
            return productCache;
        }

        productCache = localProducts();
        return productCache;
    }

    function productPrice(product) {
        if (typeof product.price === "string") {
            return product.price;
        }

        const firstVariant =
            (product.variants || [])[0];

        const firstDuration =
            (firstVariant?.durations || [])[0];

        return money(product.price || firstDuration?.price);
    }

    function productOldPrice(product) {
        if (typeof product.oldPrice === "string") {
            return product.oldPrice;
        }

        const firstVariant =
            (product.variants || [])[0];

        const firstDuration =
            (firstVariant?.durations || [])[0];

        return money(product.oldPrice || firstDuration?.oldPrice);
    }

    function productSubtitle(product) {
        const parts = [
            product.package,
            product.duration,
            product.categoryName
        ]
            .filter(Boolean);

        if (parts.length) {
            return parts.join(" · ");
        }

        return product.shortName || product.categorySlug || "Sản phẩm số";
    }

    function scoreProduct(product, query) {
        const name =
            normalize(product.name || product.shortName);

        const slug =
            normalize(product.slug);

        const category =
            normalize(product.categoryName || product.categorySlug);

        if (name.startsWith(query)) {
            return 100;
        }

        if (name.includes(query)) {
            return 80;
        }

        if (slug.includes(query)) {
            return 60;
        }

        if (category.includes(query)) {
            return 40;
        }

        return 0;
    }

    function renderItem(product) {
        const price =
            productPrice(product);

        const oldPrice =
            productOldPrice(product);

        const href =
            "product.html?slug=" +
            encodeURIComponent(product.slug);

        return `
            <a class="search-suggest-item" href="${href}">
                <span class="search-suggest-thumb">
                    <img
                        src="${escapeHTML(product.image || "assets/images/storetainguyen-logo.png")}"
                        alt="${escapeHTML(product.name || "")}"
                        loading="lazy"
                    >
                </span>
                <span class="search-suggest-main">
                    <strong>${escapeHTML(product.name || product.shortName || "Sản phẩm")}</strong>
                    <small>${escapeHTML(productSubtitle(product))}</small>
                </span>
                <span class="search-suggest-price">
                    ${price ? `<strong>Từ ${escapeHTML(price)}</strong>` : ""}
                    ${oldPrice ? `<del>${escapeHTML(oldPrice)}</del>` : ""}
                </span>
            </a>
        `;
    }

    function ensurePanel(form) {
        let panel =
            form.querySelector(".search-suggest-panel");

        if (!panel) {
            panel =
                document.createElement("div");
            panel.className =
                "search-suggest-panel";
            form.appendChild(panel);
        }

        return panel;
    }

    function submitSearch(input) {
        const keyword =
            input.value.trim();

        if (!keyword) {
            return;
        }

        window.location.href =
            "search.html?q=" +
            encodeURIComponent(keyword);
    }

    function bindForm(form) {
        const input =
            form.querySelector('input[type="search"]');

        if (!input || form.dataset.searchSuggestBound) {
            return;
        }

        form.dataset.searchSuggestBound =
            "1";
        form.classList.add("has-search-suggest");

        const panel =
            ensurePanel(form);

        let activeIndex =
            -1;

        async function updatePanel() {
            const rawQuery =
                input.value.trim();

            const query =
                normalize(rawQuery);

            activeIndex =
                -1;

            if (query.length < minQueryLength) {
                panel.classList.remove("is-open");
                panel.innerHTML = "";
                return;
            }

            const products =
                await loadProducts();

            const scoredMatches =
                products
                    .map(product => ({
                        product,
                        score: scoreProduct(product, query)
                    }))
                    .filter(item => item.score > 0)
                    .sort((a, b) => b.score - a.score);

            const matches =
                scoredMatches
                    .slice(0, suggestionLimit)
                    .map(item => item.product);

            const allHref =
                "search.html?q=" +
                encodeURIComponent(rawQuery);

            panel.innerHTML =
                matches.length
                    ? (
                        matches.map(renderItem).join("") +
                        `
                            <a class="search-suggest-all" href="${allHref}">
                                Xem tất cả sản phẩm... (${scoredMatches.length})
                            </a>
                        `
                    )
                    : `
                        <a class="search-suggest-empty" href="${allHref}">
                            Không thấy gợi ý nhanh. Xem kết quả cho "${escapeHTML(rawQuery)}"
                        </a>
                    `;

            panel.classList.add("is-open");
        }

        input.addEventListener("input", updatePanel);

        input.addEventListener("focus", () => {
            if (input.value.trim()) {
                updatePanel();
            }
        });

        input.addEventListener("keydown", event => {
            const links =
                Array.from(panel.querySelectorAll("a"));

            if (!panel.classList.contains("is-open")) {
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                activeIndex =
                    Math.min(links.length - 1, activeIndex + 1);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                activeIndex =
                    Math.max(0, activeIndex - 1);
            } else if (event.key === "Enter" && activeIndex >= 0) {
                event.preventDefault();
                links[activeIndex]?.click();
                return;
            } else if (event.key === "Escape") {
                panel.classList.remove("is-open");
                return;
            } else {
                return;
            }

            links.forEach((link, index) => {
                link.classList.toggle("is-active", index === activeIndex);
            });
        });

        form.addEventListener("submit", event => {
            event.preventDefault();
            submitSearch(input);
        });

        document.addEventListener("click", event => {
            if (!form.contains(event.target)) {
                panel.classList.remove("is-open");
            }
        });
    }

    function init() {
        document
            .querySelectorAll(".search-box, .category-search, .simple-search")
            .forEach(bindForm);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
