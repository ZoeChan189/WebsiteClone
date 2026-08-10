"use strict";


/* ==========================================================
   HELPERS
========================================================== */

const $ =
    (
        selector,
        root = document
    ) =>
        root.querySelector(
            selector
        );


const $$ =
    (
        selector,
        root = document
    ) =>
        Array.from(
            root.querySelectorAll(
                selector
            )
        );


function escapeHTML(value) {

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


function formatPrice(value) {

    if (
        value === null
        ||
        value === undefined
        ||
        value === ""
    ) {
        return "";
    }


    return (
        new Intl.NumberFormat(
            "vi-VN"
        )
            .format(
                Number(value)
            )
        +
        "₫"
    );

}


function compactNumber(value) {

    const number =
        Number(
            value || 0
        );


    if (
        number >=
        1000000
    ) {

        return (
            (
                number /
                1000000
            )
                .toFixed(1)
                .replace(
                    ".0",
                    ""
                )
                .replace(
                    ".",
                    ","
                )
            +
            "tr"
        );

    }


    if (
        number >=
        1000
    ) {

        return (
            (
                number /
                1000
            )
                .toFixed(1)
                .replace(
                    ".0",
                    ""
                )
                .replace(
                    ".",
                    ","
                )
            +
            "k"
        );

    }


    return String(
        number
    );

}


function formatSaving(value) {

    const number =
        Number(
            value || 0
        );


    if (
        number >=
        1000000
    ) {

        return (
            Math.round(
                number /
                100000
            )
            /
            10
        )
        +
        "tr";

    }


    if (
        number >=
        1000
    ) {

        return (
            Math.round(
                number /
                1000
            )
            +
            "k"
        );

    }


    return formatPrice(
        number
    );

}


function slugify(text) {

    return String(text)

        .normalize(
            "NFD"
        )

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .replace(
            /đ/g,
            "d"
        )

        .replace(
            /[^a-z0-9]+/g,
            "-"
        )

        .replace(
            /^-+|-+$/g,
            ""
        );

}


function starsHTML(
    rating,
    className = ""
) {

    const rounded =
        Math.max(
            0,
            Math.min(
                5,
                Math.round(
                    Number(
                        rating || 0
                    )
                )
            )
        );


    return `
        <span class="${className}">
            ${
                "★"
                    .repeat(
                        rounded
                    )
            }${
                "☆"
                    .repeat(
                        5 -
                        rounded
                    )
            }
        </span>
    `;

}


/* ==========================================================
   GET PRODUCT
========================================================== */

const query =
    new URLSearchParams(
        window.location.search
    );


const requestedSlug =
    query.get(
        "slug"
    )
    ||
    "chatgpt-plus";


const catalog =
    window.PRODUCT_CATALOG
    ||
    {};


function priceToNumber(value) {
    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        return value;
    }

    return Number(
        String(value || "0")
            .replace(/[^\d]/g, "")
    ) || 0;
}


function findCategoryProduct(slug) {
    const categories =
        Object.values(
            window.CATEGORY_CATALOG || {}
        );

    for (
        const category
        of categories
    ) {
        const item =
            (category.products || [])
                .find(product => product.slug === slug);

        if (!item) {
            continue;
        }

        return {
            slug:
                item.slug,

            name:
                item.name,

            shortName:
                item.name,

            metaTitle:
                item.name,

            categoryPath: [
                {
                    name:
                        "Trang chủ",
                    url:
                        "index.html"
                },
                {
                    name:
                        category.name,
                    url:
                        `category.html?slug=${encodeURIComponent(category.slug)}`
                }
            ],

            image:
                item.image,

            discount:
                item.discount || "",

            rating:
                Number(
                    String(item.rating || "4.6")
                        .replace(",", ".")
                ) || 4.6,

            reviewCount:
                128,

            satisfiedCount:
                120,

            sold:
                priceToNumber(item.sold) || 500,

            highRated:
                true,

            recentSale: {
                name:
                    "Khách hàng",
                time:
                    "vừa xong"
            },

            deal: {
                enabled:
                    false
            },

            variantTitle:
                "Loại gói:",

            variants: [
                {
                    id:
                        "default",
                    label:
                        "Dùng riêng",
                    available:
                        !item.outOfStock,
                    durations: [
                        {
                            id:
                                "12m",
                            label:
                                "12 tháng",
                            price:
                                priceToNumber(item.price),
                            oldPrice:
                                priceToNumber(item.oldPrice)
                        }
                    ]
                }
            ],

            benefits: [
                {
                    icon:
                        "bi-lightning-charge-fill",
                    title:
                        "5–15 phút",
                    text:
                        "Giao TK qua email"
                },
                {
                    icon:
                        "bi-shield",
                    title:
                        "Bảo hành",
                    text:
                        "Theo thời hạn gói"
                },
                {
                    icon:
                        "bi-chat",
                    title:
                        "Hỗ trợ",
                    text:
                        "Qua Zalo"
                }
            ],

            notice: [
                {
                    html:
                        "<strong>Lưu ý:</strong> đây là trang sản phẩm động được dựng từ dữ liệu danh mục. Chọn đúng gói và thời hạn trước khi thêm vào giỏ."
                }
            ],

            intro: [
                {
                    type:
                        "html",
                    html:
                        `<p>${escapeHTML(item.name)} hiện có trên Kho Tài Khoản với giao diện đặt hàng mô phỏng đầy đủ cho bản clone UI.</p>`
                }
            ],

            content: [
                {
                    id:
                        "guide",
                    type:
                        "heading",
                    text:
                        "Hướng dẫn mua sản phẩm",
                    toc:
                        true
                },
                {
                    type:
                        "ordered-list",
                    items: [
                        "Chọn loại gói và thời hạn.",
                        "Bấm Thêm vào giỏ hàng hoặc Mua ngay.",
                        "Kiểm tra thông tin trong giỏ hàng trước khi thanh toán."
                    ]
                }
            ],

            faq: [
                {
                    question:
                        "Sản phẩm này có bảo hành không?",
                    answer:
                        "Có, bảo hành theo thời hạn gói và chính sách của shop."
                }
            ],

            updated:
                "[Cập nhật lần cuối: Tháng 8/2026]",

            related:
                [],

            reviewSummary: {
                satisfaction:
                    96,
                totalPages:
                    12,
                distribution: {
                    5: 90,
                    4: 28,
                    3: 10,
                    2: 0,
                    1: 0
                },
                mentions:
                    []
            },

            reviews:
                []
        };
    }

    return null;
}


const product =
    catalog[
        requestedSlug
    ]
    ||
    findCategoryProduct(
        requestedSlug
    )
    ||
    catalog[
        "chatgpt-plus"
    ];


/* ==========================================================
   STATE
========================================================== */

let selectedVariant =
    null;


let selectedDuration =
    null;


let quantity =
    1;


let countdownSeconds =
    product
        ?.deal
        ?.countdownSeconds
    ||
    0;


let reviewFilter =
    "all";


let reviewSort =
    "newest";


let reviewPage =
    1;


const reviewsPerPage =
    2;


/* ==========================================================
   META
========================================================== */

function updateMeta() {

    document.title =
        (
            product.metaTitle
            ||
            product.name
        )
        +
        " | Kho Tài Khoản";


    const meta =
        $(
            'meta[name="description"]'
        );


    if (meta) {

        meta.content =
            (
                product.name
                +
                " - thông tin chi tiết sản phẩm."
            );

    }

}


/* ==========================================================
   BREADCRUMBS
========================================================== */

function renderBreadcrumbs() {

    const root =
        $("#breadcrumbs");


    if (!root) {
        return;
    }


    const items = [

        ...(
            product.categoryPath
            ||
            []
        ),

        {

            name:
                product.name,

            url:
                null

        }

    ];


    root.innerHTML =
        items
            .map(
                (
                    item,
                    index
                ) => {

                    const last =
                        index
                        ===
                        items.length
                        -
                        1;


                    return `
                        ${
                            last
                                ?
                                `
                                <strong>
                                    ${escapeHTML(
                                        item.name
                                    )}
                                </strong>
                                `
                                :
                                `
                                <a
                                    href="${escapeHTML(
                                        item.url
                                        ||
                                        "#"
                                    )}"
                                >
                                    ${escapeHTML(
                                        item.name
                                    )}
                                </a>
                                `
                        }

                        ${
                            last
                                ?
                                ""
                                :
                                `
                                <span class="breadcrumb-separator">
                                    /
                                </span>
                                `
                        }
                    `;

                }
            )
            .join("");

}


/* ==========================================================
   BASIC PRODUCT DATA
========================================================== */

function renderProductBasic() {

    const image =
        $("#productImage");


    image.src =
        product.image;


    image.alt =
        product.name;


    $("#productName")
        .textContent =
        product.name;


    $("#mainDiscount")
        .textContent =
        product.discount
        ||
        "";


    if (
        !product.discount
    ) {

        $("#mainDiscount")
            .style.display =
            "none";

    }


    $("#productRating")
        .textContent =
        String(
            product.rating
        )
            .replace(
                ".",
                ","
            );


    $("#reviewCount")
        .textContent =
        (
            new Intl.NumberFormat(
                "en-US"
            )
                .format(
                    product.reviewCount
                )
            +
            " đánh giá"
        );


    $("#soldCount")
        .textContent =
        (
            compactNumber(
                product.sold
            )
            +
            " đã bán"
        );


    if (
        !product.highRated
    ) {

        $("#highRatingBadge")
            .style.display =
            "none";

    }


    $("#recentBuyer")
        .textContent =
        product.recentSale
            ?.name
        ||
        "Khách hàng";


    $("#recentTime")
        .textContent =
        product.recentSale
            ?.time
        ||
        "vừa xong";


    $("#variantTitle")
        .textContent =
        product.variantTitle
        ||
        "Loại gói:";


    /* STICKY */

    $("#stickyProductImage")
        .src =
        product.image;


    $("#stickyProductImage")
        .alt =
        product.name;


    $("#stickyProductName")
        .textContent =
        product.name;

}


/* ==========================================================
   DEFAULT VARIANT
========================================================== */

function selectDefaults() {

    selectedVariant =
        product
            .variants
            ?.find(
                item =>
                    item.available
            )
        ||
        null;


    selectedDuration =
        selectedVariant
            ?.durations
            ?.find(
                item =>
                    item.available
                    !==
                    false
            )
        ||
        selectedVariant
            ?.durations
            ?.[0]
        ||
        null;

}


/* ==========================================================
   VARIANT BUTTONS
========================================================== */

function renderVariants() {

    const root =
        $("#variantOptions");


    if (!root) {
        return;
    }


    root.innerHTML =
        "";


    (
        product.variants
        ||
        []
    )
        .forEach(
            variant => {

                const button =
                    document
                        .createElement(
                            "button"
                        );


                button.type =
                    "button";


                button.className =
                    "product-option-button";


                button.dataset
                    .variantId =
                    variant.id;


                button.disabled =
                    !variant.available;


                button.textContent =
                    variant.label;


                if (
                    selectedVariant
                        ?.id
                    ===
                    variant.id
                ) {

                    button
                        .classList
                        .add(
                            "active"
                        );

                }


                button.addEventListener(
                    "click",
                    () => {

                        if (
                            !variant.available
                        ) {
                            return;
                        }


                        selectedVariant =
                            variant;


                        selectedDuration =
                            variant
                                .durations
                                ?.find(
                                    item =>
                                        item.available
                                        !==
                                        false
                                )
                            ||
                            variant
                                .durations
                                ?.[0]
                            ||
                            null;


                        renderVariants();

                        renderDurations();

                        updatePrice();

                    }
                );


                root.appendChild(
                    button
                );

            }
        );

}


/* ==========================================================
   DURATION BUTTONS
========================================================== */

function renderDurations() {

    const root =
        $("#durationOptions");


    const section =
        $("#durationSection");


    if (
        !root
        ||
        !section
    ) {
        return;
    }


    root.innerHTML =
        "";


    if (
        !selectedVariant
            ?.durations
            ?.length
    ) {

        section.style.display =
            "none";

        return;

    }


    section.style.display =
        "";


    selectedVariant
        .durations
        .forEach(
            duration => {

                const button =
                    document
                        .createElement(
                            "button"
                        );


                button.type =
                    "button";


                button.className =
                    "product-option-button";


                button.disabled =
                    duration.available
                    ===
                    false;


                if (
                    selectedDuration
                        ?.id
                    ===
                    duration.id
                ) {

                    button
                        .classList
                        .add(
                            "active"
                        );

                }


                button.innerHTML =
                    `
                    <span>
                        ${escapeHTML(
                            duration.label
                        )}
                    </span>

                    ${
                        duration.highlight
                            ?
                            `
                            <small class="option-highlight">
                                · ${escapeHTML(
                                    duration.highlight
                                )}
                            </small>
                            `
                            :
                            ""
                    }
                    `;


                button.addEventListener(
                    "click",
                    () => {

                        if (
                            duration.available
                            ===
                            false
                        ) {
                            return;
                        }


                        selectedDuration =
                            duration;


                        renderDurations();

                        updatePrice();

                    }
                );


                root.appendChild(
                    button
                );

            }
        );

}


/* ==========================================================
   PRICE
========================================================== */

function currentPricing() {

    return {

        price:
            selectedDuration
                ?.price
            ||
            0,


        oldPrice:
            selectedDuration
                ?.oldPrice
            ||
            0

    };

}


function updatePrice() {

    const {
        price,
        oldPrice
    } =
        currentPricing();


    $("#currentPrice")
        .textContent =
        formatPrice(
            price
        );


    $("#stickyPrice")
        .textContent =
        formatPrice(
            price
        );


    const oldPriceEl =
        $("#oldPrice");


    const stickyOldPriceEl =
        $("#stickyOldPrice");


    const saveEl =
        $("#stickySaveBadge");


    if (
        oldPrice
        &&
        oldPrice >
        price
    ) {

        oldPriceEl
            .textContent =
            formatPrice(
                oldPrice
            );


        stickyOldPriceEl
            .textContent =
            formatPrice(
                oldPrice
            );


        oldPriceEl
            .style.display =
            "";


        stickyOldPriceEl
            .style.display =
            "";


        saveEl
            .textContent =
            (
                "Tiết kiệm "
                +
                formatSaving(
                    oldPrice -
                    price
                )
            );


        saveEl
            .style.display =
            "";

    } else {

        oldPriceEl
            .style.display =
            "none";


        stickyOldPriceEl
            .style.display =
            "none";


        saveEl
            .style.display =
            "none";

    }

}


/* ==========================================================
   BENEFITS
========================================================== */

function renderBenefits() {

    const root =
        $("#purchaseBenefits");


    if (!root) {
        return;
    }


    root.innerHTML =
        (
            product.benefits
            ||
            []
        )
            .map(
                benefit =>
                    `
                    <article class="purchase-benefit-card">

                        <span class="purchase-benefit-icon">

                            <i class="bi ${escapeHTML(
                                benefit.icon
                            )}">
                            </i>

                        </span>


                        <span class="purchase-benefit-copy">

                            <strong>
                                ${escapeHTML(
                                    benefit.title
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    benefit.text
                                )}
                            </small>

                        </span>

                    </article>
                    `
            )
            .join("");

}


/* ==========================================================
   NOTICE
========================================================== */

function renderNotice() {

    const root =
        $("#noticeItems");


    const notice =
        product.notice
        ||
        [];


    if (
        !notice.length
    ) {

        $("#purchaseNotice")
            .style.display =
            "none";

        return;

    }


    root.innerHTML =
        notice
            .map(
                item =>
                    `
                    <div class="notice-item">

                        <span class="notice-check">
                            <i class="bi bi-check-lg"></i>
                        </span>

                        <div>
                            ${
                                item.html
                                ||
                                escapeHTML(
                                    item.text
                                    ||
                                    ""
                                )
                            }
                        </div>

                    </div>
                    `
            )
            .join("");

}


/* ==========================================================
   DEAL
========================================================== */

function renderDeal() {

    const deal =
        product.deal;


    if (
        !deal
        ?.enabled
    ) {

        $("#productDealBox")
            .style.display =
            "none";

        return;

    }


    $("#dealProgressFill")
        .style.width =
        (
            deal.soldPercent
            +
            "%"
        );


    $("#dealSoldText")
        .textContent =
        (
            "Đã bán "
            +
            deal.soldPercent
            +
            "%"
        );


    $("#dealRemaining")
        .textContent =
        (
            "Còn "
            +
            new Intl.NumberFormat(
                "vi-VN"
            )
                .format(
                    deal.remaining
                )
        );


    updateCountdown();

}


function updateCountdown() {

    const days =
        Math.floor(
            countdownSeconds /
            86400
        );


    const hours =
        Math.floor(
            (
                countdownSeconds
                %
                86400
            )
            /
            3600
        );


    const minutes =
        Math.floor(
            (
                countdownSeconds
                %
                3600
            )
            /
            60
        );


    const seconds =
        countdownSeconds
        %
        60;


    $("#dealDays")
        .textContent =
        String(
            days
        )
            .padStart(
                2,
                "0"
            );


    $("#dealHours")
        .textContent =
        String(
            hours
        )
            .padStart(
                2,
                "0"
            );


    $("#dealMinutes")
        .textContent =
        String(
            minutes
        )
            .padStart(
                2,
                "0"
            );


    $("#dealSeconds")
        .textContent =
        String(
            seconds
        )
            .padStart(
                2,
                "0"
            );

}


/* ==========================================================
   INTRO
========================================================== */

function renderIntro() {

    const root =
        $("#productIntro");


    if (!root) {
        return;
    }


    root.innerHTML =
        (
            product.intro
            ||
            []
        )
            .map(
                block => {

                    if (
                        block.type
                        ===
                        "html"
                    ) {

                        return (
                            block.html
                            ||
                            ""
                        );

                    }


                    if (
                        block.type
                        ===
                        "paragraph"
                    ) {

                        return `
                            <p>
                                ${escapeHTML(
                                    block.text
                                )}
                            </p>
                        `;

                    }


                    return "";

                }
            )
            .join("");

}


/* ==========================================================
   TABLE
========================================================== */

function renderTable(
    block
) {

    const highlightColumns =
        block.highlightColumns
        ||
        [];


    const headerClasses =
        block.headerClasses
        ||
        [];


    const headers =
        (
            block.headers
            ||
            []
        )
            .map(
                (
                    header,
                    index
                ) => {

                    const classes = [];


                    if (
                        headerClasses[
                            index
                        ]
                    ) {

                        classes.push(
                            "table-head-"
                            +
                            headerClasses[
                                index
                            ]
                        );

                    }


                    if (
                        highlightColumns
                            .includes(
                                index
                            )
                    ) {

                        classes.push(
                            "highlight-column"
                        );

                    }


                    return `
                        <th class="${classes.join(" ")}">
                            ${escapeHTML(
                                header
                            )}
                        </th>
                    `;

                }
            )
            .join("");


    const rows =
        (
            block.rows
            ||
            []
        )
            .map(
                row =>
                    `
                    <tr>

                        ${
                            row
                                .map(
                                    (
                                        cell,
                                        index
                                    ) =>
                                        `
                                        <td
                                            class="${
                                                highlightColumns
                                                    .includes(
                                                        index
                                                    )
                                                    ?
                                                    "highlight-column"
                                                    :
                                                    ""
                                            }"
                                        >
                                            ${cell}
                                        </td>
                                        `
                                )
                                .join("")
                        }

                    </tr>
                    `
            )
            .join("");


    return `
        <div class="product-table-wrapper">

            <table class="product-info-table">

                <thead>

                    <tr>
                        ${headers}
                    </tr>

                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;

}


/* ==========================================================
   CONTENT RENDERER
========================================================== */

function renderContentBlock(
    block
) {

    const id =
        block.id
        ||
        slugify(
            block.text
            ||
            "section"
        );


    switch (
        block.type
    ) {


        case "heading":

            return `
                <h2
                    class="content-heading"
                    id="${escapeHTML(
                        id
                    )}"
                >
                    ${escapeHTML(
                        block.text
                    )}
                </h2>
            `;


        case "subheading":

            return `
                <h3
                    class="content-subheading"
                    id="${escapeHTML(
                        id
                    )}"
                >
                    ${escapeHTML(
                        block.text
                    )}
                </h3>
            `;


        case "paragraph":

            return `
                <p>
                    ${
                        block.html
                        ||
                        escapeHTML(
                            block.text
                            ||
                            ""
                        )
                    }
                </p>
            `;


        case "html":

            return (
                block.html
                ||
                ""
            );


        case "callout":

            return `
                <div class="content-callout">

                    ${
                        block.html
                        ||
                        escapeHTML(
                            block.text
                            ||
                            ""
                        )
                    }

                </div>
            `;


        case "list":

            return `
                <ul>

                    ${
                        (
                            block.items
                            ||
                            []
                        )
                            .map(
                                item =>
                                    `
                                    <li>
                                        ${item}
                                    </li>
                                    `
                            )
                            .join("")
                    }

                </ul>
            `;


        case "ordered-list":

            return `
                <ol>

                    ${
                        (
                            block.items
                            ||
                            []
                        )
                            .map(
                                item =>
                                    `
                                    <li>
                                        ${item}
                                    </li>
                                    `
                            )
                            .join("")
                    }

                </ol>
            `;


        case "table":

            return renderTable(
                block
            );


        default:

            return "";

    }

}


/* ==========================================================
   CONTENT
========================================================== */

function renderContent() {

    const root =
        $("#dynamicProductContent");


    if (!root) {
        return;
    }


    root.innerHTML =
        (
            product.content
            ||
            []
        )
            .map(
                renderContentBlock
            )
            .join("");


    $("#updatedBadge")
        .textContent =
        product.updated
        ||
        "";

}


/* ==========================================================
   FAQ
========================================================== */

function renderFAQ() {

    const root =
        $("#faqContent");


    const faq =
        product.faq
        ||
        [];


    if (
        !faq.length
    ) {

        $("#faqSection")
            .style.display =
            "none";

        return;

    }


    root.innerHTML =
        faq
            .map(
                (
                    item,
                    index
                ) =>
                    `
                    <article
                        class="faq-item"
                        id="faq-${index + 1}"
                    >

                        <h3 class="faq-question">

                            ${
                                index + 1
                            }.

                            ${escapeHTML(
                                item.question
                            )}

                        </h3>


                        <p class="faq-answer">
                            ${item.answer}
                        </p>

                    </article>
                    `
            )
            .join("");

}


/* ==========================================================
   TABLE OF CONTENT
========================================================== */

function renderTOC() {

    const root =
        $("#tocBody");


    if (!root) {
        return;
    }


    const entries =
        (
            product.content
            ||
            []
        )
            .filter(
                block =>
                    block.toc
                    &&
                    [
                        "heading",
                        "subheading"
                    ]
                        .includes(
                            block.type
                        )
            );


    root.innerHTML =
        `

        ${
            entries
                .map(
                    block => {

                        const id =
                            block.id
                            ||
                            slugify(
                                block.text
                            );


                        return `
                            <a
                                class="
                                    toc-link
                                    ${
                                        block.type
                                        ===
                                        "subheading"
                                            ?
                                            "toc-sub"
                                            :
                                            ""
                                    }
                                "
                                href="#${escapeHTML(
                                    id
                                )}"
                            >
                                ${escapeHTML(
                                    block.text
                                )}
                            </a>
                        `;

                    }
                )
                .join("")
        }


        ${
            (
                product.faq
                ||
                []
            )
                .length
                ?
                `

                <a
                    class="toc-link"
                    href="#faqSection"
                >
                    Câu hỏi thường gặp (FAQ)
                </a>


                ${
                    (
                        product.faq
                        ||
                        []
                    )
                        .map(
                            (
                                item,
                                index
                            ) =>
                                `
                                <a
                                    class="toc-link toc-sub"
                                    href="#faq-${index + 1}"
                                >
                                    ${
                                        index + 1
                                    }.

                                    ${escapeHTML(
                                        item.question
                                    )}
                                </a>
                                `
                        )
                        .join("")
                }

                `
                :
                ""
        }

        `;

}


/* ==========================================================
   RELATED PRODUCTS
========================================================== */

function renderRelated() {

    const root =
        $("#relatedProducts");


    const section =
        $(".related-products-section");


    const related =
        product.related
        ||
        [];


    if (
        !related.length
    ) {

        if (section) {

            section.style.display =
                "none";

        }

        return;

    }


    root.innerHTML =
        related
            .map(
                item => {

                    const href =
                        catalog[
                            item.slug
                        ]
                            ?
                            (
                                "product.html?slug="
                                +
                                encodeURIComponent(
                                    item.slug
                                )
                            )
                            :
                            "#";


                    return `
                        <a
                            class="related-card"
                            href="${href}"
                            ${
                                href
                                ===
                                "#"
                                    ?
                                    'data-related-placeholder="1"'
                                    :
                                    ""
                            }
                        >

                            <div class="related-card-image">


                                <div class="related-badges">

                                    ${
                                        item.discount
                                            ?
                                            `
                                            <span class="related-discount">
                                                ${escapeHTML(
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
                                            <span class="related-stock-badge">
                                                HẾT HÀNG
                                            </span>
                                            `
                                            :
                                            ""
                                    }

                                </div>


                                <img
                                    src="${escapeHTML(
                                        item.image
                                    )}"
                                    alt="${escapeHTML(
                                        item.name
                                    )}"
                                    loading="lazy"
                                >

                            </div>


                            <div class="related-card-body">

                                <h3 class="related-card-title">
                                    ${escapeHTML(
                                        item.name
                                    )}
                                </h3>


                                <div class="related-card-proof">

                                    <span class="related-card-stars">
                                        ★★★★★
                                    </span>

                                    <strong>
                                        ${String(
                                            item.rating
                                        ).replace(
                                            ".",
                                            ","
                                        )}
                                    </strong>

                                    <span>
                                        ·
                                        ${escapeHTML(
                                            item.sold
                                        )}
                                    </span>

                                </div>


                                <div class="related-price">

                                    <strong>
                                        ${formatPrice(
                                            item.price
                                        )}
                                    </strong>


                                    ${
                                        item.oldPrice
                                            ?
                                            `
                                            <del>
                                                ${formatPrice(
                                                    item.oldPrice
                                                )}
                                            </del>
                                            `
                                            :
                                            ""
                                    }

                                </div>


                                <span class="related-card-button">
                                    Chọn gói
                                </span>

                            </div>

                        </a>
                    `;

                }
            )
            .join("");

}


/* ==========================================================
   REVIEW SUMMARY
========================================================== */

function renderReviewSummary() {

    const summary =
        product.reviewSummary
        ||
        {};


    const distribution =
        summary.distribution
        ||
        {};


    const total =
        product.reviewCount
        ||
        Object
            .values(
                distribution
            )
            .reduce(
                (
                    sum,
                    value
                ) =>
                    sum
                    +
                    Number(
                        value
                        ||
                        0
                    ),
                0
            )
        ||
        1;


    $("#reviewAverage")
        .textContent =
        String(
            product.rating
        )
            .replace(
                ".",
                ","
            );


    $("#reviewTotalLabel")
        .textContent =
        (
            new Intl.NumberFormat(
                "en-US"
            )
                .format(
                    product.reviewCount
                )
            +
            " nhận xét"
        );


    $("#satisfactionRate")
        .textContent =
        (
            summary.satisfaction
            ||
            0
        )
        +
        "%";


    $("#summarySold")
        .textContent =
        compactNumber(
            product.sold
        );


    $("#ratingDistribution")
        .innerHTML =
        [
            5,
            4,
            3,
            2,
            1
        ]
            .map(
                rating => {

                    const value =
                        Number(
                            distribution[
                                rating
                            ]
                            ||
                            0
                        );


                    const percent =
                        Math.round(
                            (
                                value
                                /
                                total
                            )
                            *
                            100
                        );


                    return `
                        <div class="rating-row">

                            <strong>
                                ${rating} ★
                            </strong>


                            <div class="rating-bar">

                                <span
                                    class="rating-bar-fill"
                                    style="width:${percent}%"
                                ></span>

                            </div>


                            <span>
                                ${
                                    new Intl.NumberFormat(
                                        "en-US"
                                    )
                                        .format(
                                            value
                                        )
                                }
                            </span>

                        </div>
                    `;

                }
            )
            .join("");


    $("#reviewMentionTags")
        .innerHTML =
        (
            summary.mentions
            ||
            []
        )
            .map(
                item =>
                    `
                    <button
                        class="review-mention-chip"
                        type="button"
                        data-keyword="${escapeHTML(
                            item.text
                                .toLowerCase()
                        )}"
                    >

                        ${escapeHTML(
                            item.text
                        )}

                        <span>
                            ${item.count}
                        </span>

                    </button>
                    `
            )
            .join("");

}


/* ==========================================================
   REVIEW FILTER BUTTONS
========================================================== */

function buildReviewFilters() {

    const distribution =
        product
            .reviewSummary
            ?.distribution
        ||
        {};


    const filters = [

        {

            id:
                "all",

            label:
                (
                    "Tất cả ("
                    +
                    new Intl.NumberFormat(
                        "en-US"
                    )
                        .format(
                            product.reviewCount
                        )
                    +
                    ")"
                )

        },


        {

            id:
                "positive",

            label:
                (
                    "Hài lòng ("
                    +
                    new Intl.NumberFormat(
                        "en-US"
                    )
                        .format(
                            product.satisfiedCount
                            ||
                            0
                        )
                    +
                    ")"
                )

        },


        {

            id:
                "5",

            label:
                (
                    "5 sao ("
                    +
                    new Intl.NumberFormat(
                        "en-US"
                    )
                        .format(
                            distribution[
                                5
                            ]
                            ||
                            0
                        )
                    +
                    ")"
                )

        },


        {

            id:
                "4",

            label:
                (
                    "4 sao ("
                    +
                    new Intl.NumberFormat(
                        "en-US"
                    )
                        .format(
                            distribution[
                                4
                            ]
                            ||
                            0
                        )
                    +
                    ")"
                )

        },


        {

            id:
                "3",

            label:
                (
                    "3 sao ("
                    +
                    new Intl.NumberFormat(
                        "en-US"
                    )
                        .format(
                            distribution[
                                3
                            ]
                            ||
                            0
                        )
                    +
                    ")"
                )

        },


        {

            id:
                "2",

            label:
                (
                    "2 sao ("
                    +
                    new Intl.NumberFormat(
                        "en-US"
                    )
                        .format(
                            distribution[
                                2
                            ]
                            ||
                            0
                        )
                    +
                    ")"
                )

        },


        {

            id:
                "1",

            label:
                (
                    "1 sao ("
                    +
                    new Intl.NumberFormat(
                        "en-US"
                    )
                        .format(
                            distribution[
                                1
                            ]
                            ||
                            0
                        )
                    +
                    ")"
                )

        },


        {

            id:
                "images",

            label:
                "Có hình ảnh (0)"

        }

    ];


    const root =
        $("#reviewFilterButtons");


    root.innerHTML =
        filters
            .map(
                item =>
                    `
                    <button
                        class="
                            review-filter-button
                            ${
                                item.id
                                ===
                                reviewFilter
                                    ?
                                    "active"
                                    :
                                    ""
                            }
                        "
                        data-filter="${item.id}"
                        type="button"
                    >
                        ${item.label}
                    </button>
                    `
            )
            .join("");


    $$(
        ".review-filter-button",
        root
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        reviewFilter =
                            button
                                .dataset
                                .filter;


                        reviewPage =
                            1;


                        buildReviewFilters();

                        renderReviews();

                    }
                );

            }
        );

}


/* ==========================================================
   FILTER / SORT REVIEWS
========================================================== */

function filteredReviews() {

    let reviews = [

        ...(
            product.reviews
            ||
            []
        )

    ];


    if (
        reviewFilter
        ===
        "positive"
    ) {

        reviews =
            reviews.filter(
                item =>
                    item.rating
                    >=
                    4
            );

    } else if (
        [
            "1",
            "2",
            "3",
            "4",
            "5"
        ]
            .includes(
                reviewFilter
            )
    ) {

        reviews =
            reviews.filter(
                item =>
                    item.rating
                    ===
                    Number(
                        reviewFilter
                    )
            );

    } else if (
        reviewFilter
        ===
        "images"
    ) {

        reviews =
            reviews.filter(
                item =>
                    item.images
                    ?.length
            );

    }


    if (
        reviewSort
        ===
        "helpful"
    ) {

        reviews.sort(
            (
                a,
                b
            ) =>
                Number(
                    b.helpful
                    ||
                    0
                )
                -
                Number(
                    a.helpful
                    ||
                    0
                )
        );

    } else if (
        reviewSort
        ===
        "rating_desc"
    ) {

        reviews.sort(
            (
                a,
                b
            ) =>
                b.rating
                -
                a.rating
        );

    } else if (
        reviewSort
        ===
        "rating_asc"
    ) {

        reviews.sort(
            (
                a,
                b
            ) =>
                a.rating
                -
                b.rating
        );

    } else {

        reviews.sort(
            (
                a,
                b
            ) =>
                Number(
                    b.id
                )
                -
                Number(
                    a.id
                )
        );

    }


    return reviews;

}


/* ==========================================================
   REVIEW AVATAR
========================================================== */

function avatarBackground(
    index
) {

    const gradients = [

        "linear-gradient(135deg,#12a76b,#36c98a)",

        "linear-gradient(135deg,#ef405b,#ff6b76)",

        "linear-gradient(135deg,#2563eb,#60a5fa)",

        "linear-gradient(135deg,#8b5cf6,#c084fc)",

        "linear-gradient(135deg,#f59e0b,#fb7185)",

        "linear-gradient(135deg,#0ea5e9,#14b8a6)"

    ];


    return gradients[
        index
        %
        gradients.length
    ];

}


/* ==========================================================
   REVIEWS
========================================================== */

function renderReviews() {

    const root =
        $("#reviewList");


    const reviews =
        filteredReviews();


    const localPages =
        Math.max(
            1,
            Math.ceil(
                reviews.length
                /
                reviewsPerPage
            )
        );


    const effectiveLocalPage =
        Math.min(
            reviewPage,
            localPages
        );


    const start =
        (
            effectiveLocalPage
            -
            1
        )
        *
        reviewsPerPage;


    const pageItems =
        reviews.slice(
            start,
            start
            +
            reviewsPerPage
        );


    if (
        !pageItems.length
    ) {

        root.innerHTML =
            `
            <div class="empty-review-state">
                Chưa có đánh giá phù hợp
                với bộ lọc này.
            </div>
            `;

    } else {

        root.innerHTML =
            pageItems
                .map(
                    (
                        review,
                        index
                    ) =>
                        `
                        <article class="customer-review-card">


                            <div class="customer-review-top">


                                <div class="customer-profile">


                                    <span
                                        class="customer-avatar"
                                        style="
                                            background:
                                            ${
                                                avatarBackground(
                                                    index
                                                    +
                                                    start
                                                )
                                            }
                                        "
                                    >

                                        <i class="bi bi-person-fill"></i>

                                    </span>


                                    <div class="customer-info">


                                        <div class="customer-name-row">

                                            <strong>
                                                ${escapeHTML(
                                                    review.name
                                                )}
                                            </strong>


                                            ${
                                                review.verified
                                                    ?
                                                    `
                                                    <span class="verified-buyer">

                                                        <i class="bi bi-patch-check-fill"></i>

                                                        Đã mua hàng

                                                    </span>
                                                    `
                                                    :
                                                    ""
                                            }

                                        </div>


                                        <div class="customer-stars">

                                            ${
                                                starsHTML(
                                                    review.rating
                                                )
                                            }

                                        </div>


                                    </div>


                                </div>


                                <span class="review-date">
                                    ${escapeHTML(
                                        review.date
                                    )}
                                </span>


                            </div>


                            <div class="review-meta">

                                <span>
                                    ${review.rating}/5 sao
                                </span>

                                <span>
                                    ·
                                </span>

                                <span>
                                    ${
                                        review.wordCount
                                        ||
                                        0
                                    }
                                    từ
                                </span>

                            </div>


                            <p class="customer-review-text">
                                ${escapeHTML(
                                    review.text
                                )}
                            </p>


                            ${
                                review.tags
                                    ?.length
                                    ?
                                    `
                                    <div class="review-tags">

                                        ${
                                            review.tags
                                                .map(
                                                    tag =>
                                                        `
                                                        <span
                                                            class="
                                                                review-tag
                                                                ${
                                                                    tag
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            "cần"
                                                                        )
                                                                        ?
                                                                        "is-con"
                                                                        :
                                                                        "is-pro"
                                                                }
                                                            "
                                                        >
                                                            ${escapeHTML(
                                                                tag
                                                            )}
                                                        </span>
                                                        `
                                                )
                                                .join("")
                                        }

                                    </div>
                                    `
                                    :
                                    ""
                            }


                            <div class="review-actions">


                                <button
                                    class="
                                        review-action-button
                                        helpful-button
                                    "
                                    type="button"
                                >

                                    <i class="bi bi-hand-thumbs-up"></i>

                                    <span>
                                        Hữu ích
                                    </span>

                                    <b>
                                        ${
                                            review.helpful
                                            ||
                                            0
                                        }
                                    </b>

                                </button>


                                <button
                                    class="review-action-button"
                                    type="button"
                                >

                                    <i class="bi bi-chat-square"></i>

                                    <span>
                                        Phản Hồi
                                    </span>

                                </button>


                            </div>


                        </article>
                        `
                )
                .join("");

    }


    renderReviewPagination();

}


/* ==========================================================
   REVIEW PAGINATION
========================================================== */

function renderReviewPagination() {

    const root =
        $("#reviewPagination");


    const totalPages =
        Math.max(
            1,
            Number(
                product
                    .reviewSummary
                    ?.totalPages
                ||
                1
            )
        );


    if (
        totalPages <=
        1
    ) {

        root.innerHTML =
            "";

        return;

    }


    const buttons =
        [];


    const pushPage =
        page => {

            buttons.push(
                `
                <button
                    class="
                        review-page-button
                        ${
                            page
                            ===
                            reviewPage
                                ?
                                "active"
                                :
                                ""
                        }
                    "
                    data-page="${page}"
                    type="button"
                >
                    ${page}
                </button>
                `
            );

        };


    if (
        reviewPage <=
        3
    ) {

        [
            1,
            2,
            3
        ]
            .filter(
                page =>
                    page <=
                    totalPages
            )
            .forEach(
                pushPage
            );


        if (
            totalPages >
            4
        ) {

            buttons.push(
                `
                <span class="review-page-ellipsis">
                    …
                </span>
                `
            );

        }


        if (
            totalPages >
            3
        ) {

            pushPage(
                totalPages
            );

        }

    } else if (
        reviewPage >=
        totalPages
        -
        2
    ) {

        pushPage(
            1
        );


        buttons.push(
            `
            <span class="review-page-ellipsis">
                …
            </span>
            `
        );


        [
            totalPages - 2,
            totalPages - 1,
            totalPages
        ]
            .filter(
                page =>
                    page >
                    1
            )
            .forEach(
                pushPage
            );

    } else {

        pushPage(
            1
        );


        buttons.push(
            `
            <span class="review-page-ellipsis">
                …
            </span>
            `
        );


        [
            reviewPage - 1,
            reviewPage,
            reviewPage + 1
        ]
            .forEach(
                pushPage
            );


        buttons.push(
            `
            <span class="review-page-ellipsis">
                …
            </span>
            `
        );


        pushPage(
            totalPages
        );

    }


    if (
        reviewPage <
        totalPages
    ) {

        buttons.push(
            `
            <button
                class="
                    review-page-button
                    review-page-next
                "
                data-page="${
                    reviewPage
                    +
                    1
                }"
                type="button"
            >
                Trang sau
            </button>
            `
        );

    }


    root.innerHTML =
        buttons.join("");


    $$(
        ".review-page-button",
        root
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        reviewPage =
                            Number(
                                button
                                    .dataset
                                    .page
                            );


                        renderReviews();


                        $("#reviews")
                            .scrollIntoView(
                                {

                                    behavior:
                                        "smooth",

                                    block:
                                        "start"

                                }
                            );

                    }
                );

            }
        );

}


/* ==========================================================
   QUANTITY
========================================================== */

function updateQuantity() {

    $("#quantity")
        .textContent =
        String(
            quantity
        );

}


/* ==========================================================
   ORDER DATA
========================================================== */

function selectedOrderInfo() {

    return {

        slug:
            product.slug,

        product:
            product.name,

        variant:
            selectedVariant
                ?.label
            ||
            "",

        duration:
            selectedDuration
                ?.label
            ||
            "",

        quantity,

        unitPrice:
            selectedDuration
                ?.price
            ||
            0,

        total:
            (
                selectedDuration
                    ?.price
                ||
                0
            )
            *
            quantity

    };

}


async function createTelegramOrder() {

    const info =
        selectedOrderInfo();

    const response =
        await fetch(
            "/api/orders",
            {
                method:
                    "POST",

                headers: {
                    "content-type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            productSlug:
                                info.slug,

                            quantity:
                                info.quantity,

                            options: {
                                variant:
                                    info.variant,

                                duration:
                                    info.duration
                            },

                            note:
                                "Telegram bot checkout"
                        }
                    )
            }
        );

    const data =
        await response.json();

    if (
        !response.ok
    ) {
        throw new Error(
            data.error
            ||
            "Không tạo được đơn hàng."
        );
    }

    if (
        !data.telegramUrl
    ) {
        throw new Error(
            "Chưa cấu hình TELEGRAM_BOT_URL trên server."
        );
    }

    return data;

}


/* ==========================================================
   BUTTON FEEDBACK
========================================================== */

function flashButton(
    button,
    text
) {

    if (!button) {
        return;
    }


    const original =
        button.textContent;


    button.textContent =
        text;


    button.disabled =
        true;


    setTimeout(
        () => {

            button.textContent =
                original;

            button.disabled =
                false;

        },
        1200
    );

}


/* ==========================================================
   BUY NOW
========================================================== */

function buyNow() {

    console.log(
        "BUY NOW UI",
        selectedOrderInfo()
    );


    flashButton(
        $("#buyNowButton"),
        "Đã chọn ✓"
    );

}


async function buyNowTelegram(event) {

    event
        ?.preventDefault();


    flashButton(
        $("#buyNowButton"),
        "Đang mở bot..."
    );

    flashButton(
        $("#stickyBuyButton"),
        "Đang mở bot..."
    );


    try {

        const order =
            await createTelegramOrder();

        window.location.href =
            order.telegramUrl;

    } catch (error) {

        alert(
            error.message
            ||
            "Không mở được Telegram bot."
        );

    }

}


/* ==========================================================
   STICKY BAR
========================================================== */

function updateStickyBar() {

    const bar =
        $("#productStickyBar");


    const productTop =
        $(".product-top-section");


    if (
        !bar
        ||
        !productTop
    ) {
        return;
    }


    const trigger =
        productTop.offsetTop
        +
        Math.min(
            productTop.offsetHeight
            *
            0.8,
            720
        );


    bar.classList.toggle(
        "visible",
        window.scrollY
        >
        trigger
    );

}


/* ==========================================================
   INTERACTIONS
========================================================== */

function setupInteractions() {


    /* QUANTITY */

    $("#qtyMinus")
        ?.addEventListener(
            "click",
            () => {

                quantity =
                    Math.max(
                        1,
                        quantity - 1
                    );


                updateQuantity();

            }
        );


    $("#qtyPlus")
        ?.addEventListener(
            "click",
            () => {

                quantity =
                    Math.min(
                        99,
                        quantity + 1
                    );


                updateQuantity();

            }
        );


    /* RESET */

    $("#resetOptions")
        ?.addEventListener(
            "click",
            () => {

                selectDefaults();

                renderVariants();

                renderDurations();

                updatePrice();

            }
        );


    /* TOC */

    $("#tocToggle")
        ?.addEventListener(
            "click",
            () => {

                const body =
                    $("#tocBody");


                const arrow =
                    $("#tocArrow");


                body
                    .classList
                    .toggle(
                        "open"
                    );


                arrow.className =
                    body
                        .classList
                        .contains(
                            "open"
                        )
                        ?
                        "bi bi-chevron-down"
                        :
                        "bi bi-chevron-right";

            }
        );


    /* REVIEW SORT */

    $("#reviewSort")
        ?.addEventListener(
            "change",
            event => {

                reviewSort =
                    event.target
                        .value;


                reviewPage =
                    1;


                renderReviews();

            }
        );


    /* ADD CART */

    $("#addCartButton")
        ?.addEventListener(
            "click",
            event => {

                if (
                    window.KTKCart
                ) {
                    event.preventDefault();
                    event.stopPropagation();

                    window.KTKCart.addCurrentProduct(
                        $("#addCartButton")
                    );

                    flashButton(
                        $("#addCartButton"),
                        "\u0110\u00e3 th\u00eam \u2713"
                    );

                    return;
                }

                console.log(
                    "ADD CART UI",
                    selectedOrderInfo()
                );


                flashButton(
                    $("#addCartButton"),
                    "Đã thêm ✓"
                );

            }
        );


    /* BUY */

    $("#buyNowButton")
        ?.addEventListener(
            "click",
            buyNowTelegram
        );


    $("#stickyBuyButton")
        ?.addEventListener(
            "click",
            buyNowTelegram
        );


    /* SELECT */

    $("#stickySelectButton")
        ?.addEventListener(
            "click",
            () => {

                $("#variantSection")
                    ?.scrollIntoView(
                        {

                            behavior:
                                "smooth",

                            block:
                                "center"

                        }
                    );

            }
        );


    /* HEART */

    $$(
        ".sticky-heart, .header-action"
    )
        .forEach(
            button => {

                if (
                    !button
                        .querySelector(
                            ".bi-heart"
                        )
                ) {
                    return;
                }


                button.addEventListener(
                    "click",
                    () => {

                        const icon =
                            button
                                .querySelector(
                                    "i"
                                );


                        if (!icon) {
                            return;
                        }


                        icon.classList.toggle(
                            "bi-heart"
                        );


                        icon.classList.toggle(
                            "bi-heart-fill"
                        );


                        button.classList.toggle(
                            "is-liked"
                        );

                    }
                );

            }
        );


    /* STICKY */

    window.addEventListener(
        "scroll",
        updateStickyBar,
        {
            passive:
                true
        }
    );


    /* GLOBAL CLICK */

    document.addEventListener(
        "click",
        event => {


            const placeholderLink =
                event.target.closest(
                    `
                    a[href="#"],
                    a[data-related-placeholder="1"]
                    `
                );


            if (
                placeholderLink
            ) {

                event.preventDefault();

            }


            const helpful =
                event.target.closest(
                    ".helpful-button"
                );


            if (
                helpful
                &&
                !helpful
                    .dataset
                    .clicked
            ) {

                helpful.dataset
                    .clicked =
                    "1";


                helpful.classList.add(
                    "active"
                );


                const count =
                    helpful
                        .querySelector(
                            "b"
                        );


                if (count) {

                    count.textContent =
                        String(
                            Number(
                                count.textContent
                                ||
                                0
                            )
                            +
                            1
                        );

                }

            }

        }
    );


    /* SEARCH */

    $("#globalSearchForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const input =
                    event.currentTarget.querySelector(
                        'input[type="search"]'
                    );

                const keyword =
                    input
                        ?.value
                        ?.trim();

                if (!keyword) {
                    return;
                }

                window.location.href =
                    `search.html?q=${encodeURIComponent(keyword)}`;

            }
        );

}


/* ==========================================================
   DRAWER
========================================================== */

const drawer =
    $("#categoryDrawer");


const backdrop =
    $("#categoryBackdrop");


function openDrawer() {

    drawer
        ?.classList
        .add(
            "show"
        );


    backdrop
        ?.classList
        .add(
            "show"
        );


    document.body
        .classList
        .add(
            "drawer-open"
        );

}


function closeDrawer() {

    drawer
        ?.classList
        .remove(
            "show"
        );


    backdrop
        ?.classList
        .remove(
            "show"
        );


    document.body
        .classList
        .remove(
            "drawer-open"
        );

}


function setupDrawer() {

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


    $("#mobileMenuButton")
        ?.addEventListener(
            "click",
            openDrawer
        );


    $("#closeDrawer")
        ?.addEventListener(
            "click",
            closeDrawer
        );


    backdrop
        ?.addEventListener(
            "click",
            closeDrawer
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key
                ===
                "Escape"
            ) {

                closeDrawer();

            }

        }
    );

}


/* ==========================================================
   IMAGE FALLBACK
========================================================== */

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
                ||
                image.dataset
                    .fallback
            ) {
                return;
            }


            image.dataset
                .fallback =
                "true";


            image.style.opacity =
                "0.18";


            if (
                image.parentElement
            ) {

                image
                    .parentElement
                    .style
                    .background =
                    `
                    linear-gradient(
                        135deg,
                        #eef4ff,
                        #f8fafc
                    )
                    `;

            }

        },
        true
    );

}


/* ==========================================================
   REVIEW SORT OPTIONS
========================================================== */

function initReviewSort() {

    const select =
        $("#reviewSort");


    if (!select) {
        return;
    }


    select.innerHTML =
        `
        <option value="newest">
            Mới nhất
        </option>

        <option value="helpful">
            Hữu ích nhất
        </option>

        <option value="rating_desc">
            Sao cao
        </option>

        <option value="rating_asc">
            Sao thấp
        </option>
        `;

}


/* ==========================================================
   INIT
========================================================== */

function init() {

    if (!product) {

        document.body
            .innerHTML =
            `
            <main
                style="
                    min-height:100vh;
                    display:grid;
                    place-items:center;
                    font-family:sans-serif;
                "
            >
                Không tìm thấy sản phẩm.
            </main>
            `;

        return;

    }


    updateMeta();

    renderBreadcrumbs();

    renderProductBasic();


    selectDefaults();

    renderVariants();

    renderDurations();

    updatePrice();


    renderBenefits();

    renderNotice();

    renderDeal();


    renderIntro();

    renderContent();

    renderFAQ();

    renderTOC();


    renderRelated();


    renderReviewSummary();

    initReviewSort();

    buildReviewFilters();

    renderReviews();


    updateQuantity();


    setupInteractions();

    setupDrawer();

    setupImageFallback();


    updateStickyBar();


    if (
        product.deal
            ?.enabled
    ) {

        setInterval(
            () => {

                countdownSeconds -=
                    1;


                if (
                    countdownSeconds
                    <
                    0
                ) {

                    countdownSeconds =
                        product
                            .deal
                            .countdownSeconds;

                }


                updateCountdown();

            },
            1000
        );

    }


    console.log(
        "Product UI V2 loaded",
        product.slug
    );

}


init();
