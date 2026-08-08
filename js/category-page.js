"use strict";


(() => {


    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (
        selector,
        root = document
    ) => root.querySelector(selector);


    const $$ = (
        selector,
        root = document
    ) => [
        ...root.querySelectorAll(selector)
    ];


    const params =
        new URLSearchParams(
            window.location.search
        );


    const requestedSlug =
        params.get("slug")
        ||
        "hoc-tap";


    const catalog =
        window.CATEGORY_CATALOG
        ||
        {};


    const category =
    catalog[
        requestedSlug
    ];


if (!category) {

    document.body.innerHTML = `
        <main
            style="
                min-height:100vh;
                display:grid;
                place-items:center;
                font-family:Arial,sans-serif;
                background:#f7f7f7;
            "
        >
            <div style="text-align:center">

                <h1>
                    Không tìm thấy danh mục
                </h1>

                <p>
                    ${requestedSlug}
                </p>

            </div>
        </main>
    `;

    return;
}


    if (!category) {

        document.body.innerHTML = `
            <main
                style="
                    min-height:100vh;
                    display:grid;
                    place-items:center;
                    font-family:Arial,sans-serif;
                "
            >
                Không tìm thấy danh mục.
            </main>
        `;

        return;
    }


    let displayCount = 12;

    let gridColumns = 4;

    let sortMode = "popularity";


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    const esc = (
        value = ""
    ) => {

        return String(value)

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

    };


    /* =====================================================
       PRICE TO NUMBER
    ===================================================== */

    const moneyToNumber = (
        value
    ) => {

        return Number(

            String(
                value || "0"
            )
                .replace(
                    /[^\d]/g,
                    ""
                )

        ) || 0;

    };


    /* =====================================================
       RATING TO NUMBER
    ===================================================== */

    const ratingToNumber = (
        value
    ) => {

        return Number(

            String(
                value || "0"
            )
                .replace(
                    ",",
                    "."
                )

        ) || 0;

    };


    /* =====================================================
       PRODUCT LINK
    ===================================================== */

    function localProductHref(
        item
    ) {

        return (
            "product.html?slug="
            +
            encodeURIComponent(
                item.slug
            )
        );

    }


    /* =====================================================
       META
    ===================================================== */

    function updateMeta() {

        document.title =
            category.metaTitle
            ||
            (
                category.name
                +
                " | Kho Tài Khoản"
            );


        const metaDescription =
            $(
                'meta[name="description"]'
            );


        if (
            metaDescription
        ) {

            metaDescription.content =
                category.metaDescription
                ||
                category.description?.[0]
                ||
                "";

        }

    }


    /* =====================================================
       CATEGORY HEADER / DESCRIPTION
    ===================================================== */

    function renderCategoryHeader() {

        const categoryName =
            $("#categoryName");


        const breadcrumb =
            $("#breadcrumbCurrent");


        const description =
            $("#categoryDescription");


        if (
            categoryName
        ) {

            categoryName.textContent =
                category.name;

        }


        if (
            breadcrumb
        ) {

            breadcrumb.textContent =
                category.name;

        }


        if (
            description
        ) {

            description.innerHTML =
                (
                    category.description
                    ||
                    []
                )
                    .map(
                        text => `
                            <p>
                                ${esc(text)}
                            </p>
                        `
                    )
                    .join("");

        }


        renderResultCount();

    }


    /* =====================================================
       RESULT COUNT
    ===================================================== */

    function renderResultCount() {

        const root =
            $("#resultCount");


        if (
            !root
        ) {
            return;
        }


        const total =
            Number(
                category.totalProducts
                ||
                category.products?.length
                ||
                0
            );


        const shown =
            Math.min(
                displayCount,
                total
            );


        if (
            total <=
            displayCount
        ) {

            root.textContent =
                (
                    "Hiển thị tất cả "
                    +
                    total
                    +
                    " kết quả"
                );

        } else {

            root.textContent =
                (
                    "Hiển thị 1–"
                    +
                    shown
                    +
                    " của "
                    +
                    total
                    +
                    " kết quả"
                );

        }

    }


    /* =====================================================
       SORT PRODUCTS
    ===================================================== */

    function getSortedProducts() {

        const products = [

            ...(
                category.products
                ||
                []
            )

        ];


        /* RATING */

        if (
            sortMode ===
            "rating"
        ) {

            products.sort(
                (
                    a,
                    b
                ) => {

                    return (
                        ratingToNumber(
                            b.rating
                        )
                        -
                        ratingToNumber(
                            a.rating
                        )
                    );

                }
            );

        }


        /* PRICE LOW -> HIGH */

        else if (
            sortMode ===
            "price-low"
        ) {

            products.sort(
                (
                    a,
                    b
                ) => {

                    return (
                        moneyToNumber(
                            a.price
                        )
                        -
                        moneyToNumber(
                            b.price
                        )
                    );

                }
            );

        }


        /* PRICE HIGH -> LOW */

        else if (
            sortMode ===
            "price-high"
        ) {

            products.sort(
                (
                    a,
                    b
                ) => {

                    return (
                        moneyToNumber(
                            b.price
                        )
                        -
                        moneyToNumber(
                            a.price
                        )
                    );

                }
            );

        }


        /*
         * popularity:
         * giữ nguyên thứ tự
         * trong categories.js.
         */

        return products;

    }


    /* =====================================================
       PRODUCT CARD
    ===================================================== */

    function renderProductCard(
        item
    ) {

        const href =
            localProductHref(
                item
            );


        const placeholderAttribute =
            href === "#"
                ?
                'data-placeholder-link="1"'
                :
                "";


        return `
            <article
                class="category-product-card"
            >


                <!-- IMAGE -->

                <a
                    class="category-product-image"
                    href="${href}"
                    ${placeholderAttribute}
                >


                    <div
                        class="category-product-badges"
                    >


                        ${
                            item.discount
                                ?
                                `
                                <span
                                    class="sale-badge"
                                >
                                    ${esc(
                                        item.discount
                                    )}
                                </span>
                                `
                                :
                                ""
                        }


                        ${
                            item.outOfStock
                                ?
                                `
                                <span
                                    class="stock-badge"
                                >
                                    HẾT HÀNG
                                </span>
                                `
                                :
                                ""
                        }


                    </div>


                    <img
                        src="${esc(
                            item.image
                        )}"
                        alt="${esc(
                            item.name
                        )}"
                        loading="lazy"
                    >


                </a>


                <!-- BODY -->

                <div
                    class="category-product-body"
                >


                    <!-- TITLE -->

                    <h3>

                        <a
                            href="${href}"
                            ${placeholderAttribute}
                        >
                            ${esc(
                                item.name
                            )}
                        </a>

                    </h3>


                    <!-- SOCIAL PROOF -->

                    <div
                        class="category-product-proof"
                    >


                        ${
                            item.rating
                                ?
                                `

                                <span
                                    class="category-stars"
                                    aria-hidden="true"
                                >
                                    ★★★★★
                                </span>


                                <strong>
                                    ${esc(
                                        item.rating
                                    )}
                                </strong>

                                `
                                :
                                ""
                        }


                        ${
                            item.sold
                                ?
                                `
                                <span>
                                    ${esc(
                                        item.sold
                                    )}
                                </span>
                                `
                                :
                                ""
                        }


                    </div>


                    <!-- PRICE -->

                    <div
                        class="category-product-price"
                    >


                        ${
                            item.pricePrefix
                            ===
                            false
                                ?
                                ""
                                :
                                `
                                <span>
                                    Từ
                                </span>
                                `
                        }


                        <strong>
                            ${esc(
                                item.price
                                ||
                                ""
                            )}
                        </strong>


                        ${
                            item.oldPrice
                                ?
                                `
                                <del>
                                    ${esc(
                                        item.oldPrice
                                    )}
                                </del>
                                `
                                :
                                ""
                        }


                    </div>


                    <!-- BUTTON -->

                    <a
                        class="category-product-button"
                        href="${href}"
                        ${placeholderAttribute}
                    >

                        ${esc(
                            item.button
                            ||
                            "Chọn gói"
                        )}

                    </a>


                </div>


            </article>
        `;

    }


    /* =====================================================
       RENDER PRODUCTS
    ===================================================== */

    function renderProducts() {

        const root =
            $("#categoryProducts");


        if (
            !root
        ) {
            return;
        }


        const products =
            getSortedProducts()
                .slice(
                    0,
                    displayCount
                );


        root.className =
            (
                "category-products-grid cols-"
                +
                gridColumns
            );


        if (
            !products.length
        ) {

            root.innerHTML = `
                <div
                    style="
                        grid-column:1/-1;
                        padding:50px;
                        text-align:center;
                        color:#64748b;
                    "
                >
                    Chưa có sản phẩm trong danh mục này.
                </div>
            `;

            return;

        }


        root.innerHTML =
            products
                .map(
                    renderProductCard
                )
                .join("");

    }


    /* =====================================================
       PAGINATION
    ===================================================== */

    function renderPagination() {

        const root =
            $("#categoryPagination");


        if (
            !root
        ) {
            return;
        }


        const totalPages =
            Number(
                category.totalPages
                ||
                1
            );


        if (
            totalPages <=
            1
        ) {

            root.innerHTML =
                "";

            return;

        }


        let html =
            "";


        for (
            let i = 1;
            i <= totalPages;
            i++
        ) {

            html += `
                <button
                    type="button"
                    class="
                        category-page-number
                        ${
                            i === 1
                                ?
                                "active"
                                :
                                ""
                        }
                    "
                    data-page="${i}"
                >
                    ${i}
                </button>
            `;

        }


        html += `
            <button
                type="button"
                class="
                    category-page-number
                    next
                "
                data-page-next="1"
                aria-label="Trang sau"
            >
                <i
                    class="
                        bi
                        bi-chevron-right
                    "
                ></i>
            </button>
        `;


        root.innerHTML =
            html;

    }


    /* =====================================================
       HỌC TẬP BOTTOM CONTENT
    ===================================================== */

    function renderUsecases(
        bottom
    ) {

        return `
            <section
                class="category-bottom-section"
            >


                <h2>
                    ${esc(
                        bottom.title
                    )}
                </h2>


                ${
                    bottom.intro
                        ?
                        `
                        <p
                            class="
                                category-bottom-intro
                            "
                        >
                            ${esc(
                                bottom.intro
                            )}
                        </p>
                        `
                        :
                        ""
                }


                <div
                    class="category-usecases"
                >


                    ${
                        (
                            bottom.items
                            ||
                            []
                        )
                            .map(
                                item => `
                                    <article
                                        class="
                                            category-usecase
                                        "
                                    >


                                        <h3>
                                            ${esc(
                                                item.title
                                            )}
                                        </h3>


                                        ${
                                            item.text
                                                ?
                                                `
                                                <p>
                                                    ${esc(
                                                        item.text
                                                    )}
                                                </p>
                                                `
                                                :
                                                ""
                                        }


                                        ${
                                            item.bullets?.length
                                                ?
                                                `
                                                <ul>

                                                    ${
                                                        item.bullets
                                                            .map(
                                                                bullet => `
                                                                    <li>
                                                                        ${bullet}
                                                                    </li>
                                                                `
                                                            )
                                                            .join("")
                                                    }

                                                </ul>
                                                `
                                                :
                                                ""
                                        }


                                    </article>
                                `
                            )
                            .join("")
                    }


                </div>


            </section>
        `;

    }


    /* =====================================================
       LÀM VIỆC PICK CARDS
    ===================================================== */

    function renderPicks(
        bottom
    ) {

        return `
            <section
                class="category-bottom-section"
            >


                <h2>
                    ${esc(
                        bottom.title
                    )}
                </h2>


                ${
                    bottom.intro
                        ?
                        `
                        <p
                            class="
                                category-bottom-intro
                            "
                        >
                            ${esc(
                                bottom.intro
                            )}
                        </p>
                        `
                        :
                        ""
                }


                <div
                    class="category-picks-grid"
                >


                    ${
                        (
                            bottom.items
                            ||
                            []
                        )
                            .map(
                                item => `
                                    <article
                                        class="
                                            category-pick-card
                                        "
                                    >


                                        ${
                                            item.chip
                                                ?
                                                `
                                                <span
                                                    class="
                                                        category-chip
                                                    "
                                                >
                                                    ${esc(
                                                        item.chip
                                                    )}
                                                </span>
                                                `
                                                :
                                                ""
                                        }


                                        <strong>
                                            ${esc(
                                                item.title
                                            )}
                                        </strong>


                                        <p>
                                            ${esc(
                                                item.text
                                                ||
                                                ""
                                            )}
                                        </p>


                                        ${
                                            item.linkText
                                                ?
                                                `
                                                <a
                                                    href="#"
                                                    data-placeholder-link="1"
                                                >
                                                    ${esc(
                                                        item.linkText
                                                    )}
                                                </a>
                                                `
                                                :
                                                ""
                                        }


                                    </article>
                                `
                            )
                            .join("")
                    }


                </div>


            </section>
        `;

    }


    /* =====================================================
       SUPPORT POSTS
    ===================================================== */

    function renderPosts(
        bottom
    ) {

        if (
            !bottom.posts?.length
        ) {

            return "";

        }


        return `
            <section
                class="
                    category-bottom-section
                    category-posts-section
                "
            >


                <h2>

                    ${esc(
                        bottom.postsTitle
                        ||
                        (
                            "Bài viết hỗ trợ cho nhóm "
                            +
                            category.name
                        )
                    )}

                </h2>


                <div
                    class="category-posts-grid"
                >


                    ${
                        bottom.posts
                            .map(
                                post => `
                                    <article
                                        class="
                                            category-post-card
                                        "
                                    >


                                        <strong>

                                            <a
                                                href="#"
                                                data-placeholder-link="1"
                                            >
                                                ${esc(
                                                    post.title
                                                )}
                                            </a>

                                        </strong>


                                        <p>
                                            ${esc(
                                                post.text
                                                ||
                                                ""
                                            )}
                                        </p>


                                    </article>
                                `
                            )
                            .join("")
                    }


                </div>


            </section>
        `;

    }


    /* =====================================================
       BOTTOM CTA
    ===================================================== */

    function renderBottomCTA(
        bottom
    ) {

        if (
            !bottom.cta
        ) {

            return "";

        }


        return `
            <div
                class="category-bottom-cta"
            >


                <strong>
                    ${esc(
                        bottom.cta.title
                        ||
                        ""
                    )}
                </strong>


                <p>
                    ${
                        bottom.cta.html
                        ||
                        ""
                    }
                </p>


            </div>
        `;

    }


    /* =====================================================
       RENDER BOTTOM
    ===================================================== */

    function renderBottom() {

        const root =
            $("#categoryBottomContent");


        if (
            !root
        ) {
            return;
        }


        const bottom =
            category.bottom;


        if (
            !bottom
        ) {

            root.innerHTML =
                "";

            return;

        }


        let html =
            "";


        /*
         * Học tập
         */

        if (
            bottom.type ===
            "usecases"
        ) {

            html +=
                renderUsecases(
                    bottom
                );

        }


        /*
         * Làm việc
         */

        else if (
            bottom.type ===
            "picks"
        ) {

            html +=
                renderPicks(
                    bottom
                );

        }


        html +=
            renderPosts(
                bottom
            );


        html +=
            renderBottomCTA(
                bottom
            );


        root.innerHTML =
            html;

    }


    /* =====================================================
       ACTIVE CATEGORY IN DRAWER
    ===================================================== */

    function renderDrawerActive() {

        $$(
            "[data-category-slug]"
        )
            .forEach(
                link => {

                    link.classList.toggle(

                        "active",

                        link.dataset
                            .categorySlug
                        ===
                        category.slug

                    );

                }
            );

    }


    /* =====================================================
       ITEM COUNT
    ===================================================== */

    function setupItemCount() {

        $$(
            "[data-count]"
        )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {


                            displayCount =
                                Number(
                                    button.dataset
                                        .count
                                );


                            $$(
                                "[data-count]"
                            )
                                .forEach(
                                    item => {

                                        item.classList.toggle(

                                            "active",

                                            item ===
                                            button

                                        );

                                    }
                                );


                            renderResultCount();

                            renderProducts();

                        }
                    );

                }
            );

    }


    /* =====================================================
       GRID SWITCH
    ===================================================== */

    function setupGridSwitch() {

        $$(
            "[data-grid]"
        )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {


                            gridColumns =
                                Number(
                                    button.dataset
                                        .grid
                                );


                            $$(
                                "[data-grid]"
                            )
                                .forEach(
                                    item => {

                                        item.classList.toggle(

                                            "active",

                                            item ===
                                            button

                                        );

                                    }
                                );


                            renderProducts();

                        }
                    );

                }
            );

    }


    /* =====================================================
       SORT
    ===================================================== */

    function setupSort() {

        const sort =
            $("#categorySort");


        if (
            !sort
        ) {
            return;
        }


        sort.addEventListener(
            "change",
            event => {

                sortMode =
                    event.target.value;


                renderProducts();

            }
        );

    }


    /* =====================================================
       TOOLBAR
    ===================================================== */

    function setupToolbar() {

        setupItemCount();

        setupGridSwitch();

        setupSort();

    }


    /* =====================================================
       DRAWER
    ===================================================== */

    function setupDrawer() {

        const drawer =
            $("#categoryDrawer");


        const backdrop =
            $("#categoryBackdrop");


        if (
            !drawer
            ||
            !backdrop
        ) {
            return;
        }


        function openDrawer() {

            drawer.classList.add(
                "show"
            );


            backdrop.classList.add(
                "show"
            );


            document.body.classList.add(
                "drawer-open"
            );

        }


        function closeDrawer() {

            drawer.classList.remove(
                "show"
            );


            backdrop.classList.remove(
                "show"
            );


            document.body.classList.remove(
                "drawer-open"
            );

        }


        $("#railMenuButton")
            ?.addEventListener(
                "click",
                openDrawer
            );


        $("#categoryButton")
            ?.addEventListener(
                "click",
                openDrawer
            );


        $("#closeDrawer")
            ?.addEventListener(
                "click",
                closeDrawer
            );


        backdrop.addEventListener(
            "click",
            closeDrawer
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeDrawer();

                }

            }
        );

    }


    /* =====================================================
       PLACEHOLDER LINKS
    ===================================================== */

    function setupPlaceholderLinks() {

        document.addEventListener(
            "click",
            event => {


                const placeholder =
                    event.target.closest(
                        '[data-placeholder-link="1"]'
                    );


                if (
                    placeholder
                ) {

                    event.preventDefault();

                }


                /*
                 * Pagination hiện mới là UI.
                 * Backend/page data sẽ code sau.
                 */

                const pagination =
                    event.target.closest(
                        ".category-page-number"
                    );


                if (
                    pagination
                ) {

                    event.preventDefault();

                }

            }
        );

    }


    /* =====================================================
       IMAGE FALLBACK
    ===================================================== */

    function setupImageFallback() {

        document.addEventListener(
            "error",
            event => {


                const image =
                    event.target;


                if (
                    !(
                        image
                        instanceof
                        HTMLImageElement
                    )
                ) {

                    return;

                }


                if (
                    image.dataset
                        .fallback
                ) {

                    return;

                }


                image.dataset
                    .fallback =
                    "1";


                /*
                 * Không dùng ảnh placeholder ngoài.
                 * Chỉ làm ảnh lỗi mờ đi.
                 */

                image.style.opacity =
                    "0.12";


                image.parentElement
                    ?.classList
                    .add(
                        "image-fallback"
                    );

            },
            true
        );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function setupSearch() {

        const form =
            $("#categorySearchForm");


        if (
            !form
        ) {
            return;
        }


        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const input =
                    form.querySelector(
                        'input[type="search"]'
                    );


                const keyword =
                    input
                        ?.value
                        ?.trim();


                /*
                 * Chưa nối search.html.
                 */

                if (
                    !keyword
                ) {

                    return;

                }


                window.location.href =
                    `search.html?q=${encodeURIComponent(keyword)}`;

            }
        );

    }


    /* =====================================================
       WISHLIST UI
    ===================================================== */

    function setupWishlist() {

        const buttons =
            $$(
                ".category-nav-actions button"
            );


        buttons.forEach(
            button => {


                const icon =
                    button.querySelector(
                        ".bi-heart"
                    );


                if (
                    !icon
                ) {

                    return;

                }


                button.addEventListener(
                    "click",
                    () => {


                        icon.classList.toggle(
                            "bi-heart"
                        );


                        icon.classList.toggle(
                            "bi-heart-fill"
                        );


                        button.classList.toggle(
                            "liked"
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       SCROLL TO TOP WHEN CATEGORY CHANGES
    ===================================================== */

    function resetScroll() {

        if (
            window.location.hash
        ) {

            return;

        }


        window.scrollTo(
            {
                top: 0,
                behavior: "instant"
            }
        );

    }


    /* =====================================================
       INIT
    ===================================================== */

    function init() {


        console.log(
            "CATEGORY_CATALOG:",
            window.CATEGORY_CATALOG
        );


        console.log(
            "REQUESTED CATEGORY:",
            requestedSlug
        );


        console.log(
            "CATEGORY LOADED:",
            category.slug
        );


        updateMeta();


        renderCategoryHeader();

        renderProducts();

        renderPagination();

        renderBottom();

        renderDrawerActive();


        setupToolbar();

        setupDrawer();

        setupPlaceholderLinks();

        setupImageFallback();

        setupSearch();

        setupWishlist();


        resetScroll();


        console.log(
            "CATEGORY PAGE V1 READY"
        );

    }


    init();


})();
