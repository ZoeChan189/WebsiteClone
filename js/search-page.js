"use strict";

(() => {
    const params =
        new URLSearchParams(window.location.search);

    const query =
        params.get("q")?.trim() || "";

    const normalize = value =>
        String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    const formatPrice = value => {
        if (value === null || value === undefined || value === "") {
            return "";
        }

        if (typeof value === "number") {
            return new Intl.NumberFormat("vi-VN").format(value) + "đ";
        }

        return String(value);
    };

    const escapeHtml = value =>
        String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    function collectProducts() {
        const map =
            new Map();

        Object
            .values(window.PRODUCT_CATALOG || {})
            .forEach(product => {
                if (!product?.slug) {
                    return;
                }

                const firstVariant =
                    product.variants?.find(item => item.available !== false);

                const firstDuration =
                    firstVariant?.durations?.find(item => item.available !== false)
                    || firstVariant?.durations?.[0];

                map.set(product.slug, {
                    slug:
                        product.slug,
                    name:
                        product.name,
                    image:
                        product.image,
                    price:
                        firstDuration?.price || product.price || "",
                    rating:
                        product.rating || "",
                    sold:
                        product.sold || ""
                });
            });

        Object
            .values(window.CATEGORY_CATALOG || {})
            .forEach(category => {
                (category.products || [])
                    .forEach(product => {
                        if (!product?.slug || map.has(product.slug)) {
                            return;
                        }

                        map.set(product.slug, {
                            slug:
                                product.slug,
                            name:
                                product.name,
                            image:
                                product.image,
                            price:
                                product.price,
                            rating:
                                product.rating,
                            sold:
                                product.sold
                        });
                    });
            });

        return [...map.values()];
    }

    function render() {
        const title =
            document.querySelector("#searchTitle");

        const count =
            document.querySelector("#searchCount");

        const grid =
            document.querySelector("#searchResults");

        const input =
            document.querySelector("#simpleSearchInput");

        if (input) {
            input.value =
                query;
        }

        if (title) {
            title.textContent =
                query
                    ? `Tìm kiếm: ${query}`
                    : "Tìm kiếm sản phẩm";
        }

        if (!grid) {
            return;
        }

        const needle =
            normalize(query);

        const products =
            collectProducts()
                .filter(product => {
                    if (!needle) {
                        return true;
                    }

                    return normalize(product.name)
                        .includes(needle);
                });

        if (count) {
            count.textContent =
                `${products.length} sản phẩm phù hợp`;
        }

        if (!products.length) {
            grid.innerHTML = `
                <div class="simple-panel simple-content" style="grid-column:1/-1">
                    <h2>Không tìm thấy sản phẩm</h2>
                    <p>Thử tìm bằng tên ngắn hơn như Canva, ChatGPT, VPN hoặc Premium.</p>
                </div>
            `;

            return;
        }

        grid.innerHTML =
            products
                .map(product => `
                    <a class="search-card" href="product.html?slug=${encodeURIComponent(product.slug)}">
                        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
                        <div class="search-card-body">
                            <h2>${escapeHtml(product.name)}</h2>
                            <p>${escapeHtml(product.rating || "4,6")} · ${escapeHtml(product.sold || "Đang bán")}</p>
                            <strong>${escapeHtml(formatPrice(product.price))}</strong>
                        </div>
                    </a>
                `)
                .join("");

        grid.querySelectorAll("img").forEach((image) => {
            image.addEventListener("error", () => {
                image.src = "assets/images/storetainguyen-logo.png";
                image.style.objectFit = "contain";
            }, { once: true });
        });
    }

    document
        .querySelector("#simpleSearchForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();

            const keyword =
                event.currentTarget
                    .querySelector('input[type="search"]')
                    ?.value
                    ?.trim();

            if (!keyword) {
                return;
            }

            window.location.href =
                `search.html?q=${encodeURIComponent(keyword)}`;
        });

    render();
})();
