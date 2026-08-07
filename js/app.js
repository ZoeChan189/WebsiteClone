"use strict";


/* ==========================================================
   HELPERS
========================================================== */

const $ = (selector, root = document) =>
    root.querySelector(selector);

const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));


function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==========================================================
   PRODUCT DATA
========================================================== */

const PRODUCTS = {

    chatgpt: {
        name: "Tài khoản ChatGPT Plus & Pro (GPT-5.6)",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/chatgpt-plus-pro-800x800.webp",
        discount: "-73%",
        rating: "4,6",
        sold: "10,3k đã bán",
        price: "147.510₫",
        oldPrice: "499.000₫"
    },

    claude: {
        name: "Tài khoản Claude AI Pro/Max",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/claude-ai-pro-max-800x800.webp",
        discount: "-23%",
        rating: "4,6",
        sold: "9,2k đã bán",
        price: "519.000₫",
        oldPrice: "655.556₫"
    },

    kling: {
        name: "Tài khoản Kling AI",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2024/12/Tai-khoan-Kling-AI-800x800.webp",
        discount: "-23%",
        rating: "4,6",
        sold: "10,2k đã bán",
        price: "249.000₫"
    },

    googleAI: {
        name: "Tài khoản Google AI Pro",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/google-ai-pro-800x800.webp",
        discount: "-88%",
        rating: "4,6",
        sold: "7,6k đã bán",
        price: "358.901₫",
        oldPrice: "3.349.000₫"
    },

    cursor: {
        name: "Tài khoản Cursor AI",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/cursor-pro-800x800.webp",
        discount: "-48%",
        rating: "4,5",
        sold: "1,2k đã bán",
        price: "419.000₫"
    },

    canva: {
        name: "Tài khoản Canva Pro",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/canva-pro-800x800.webp",
        discount: "-75%",
        rating: "4,6",
        sold: "5,4k đã bán",
        price: "189.050₫",
        oldPrice: "479.000₫"
    },

    pia: {
        name: "Tài Khoản Pia VPN",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/pia-vpn-800x800.webp",
        discount: "-84%",
        rating: "4,7",
        sold: "1,7k đã bán",
        price: "46.550₫",
        oldPrice: "299.000₫"
    },

    capcut: {
        name: "Tài khoản CapCut Pro",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2023/09/Capcut-Pro-800x800.jpg",
        discount: "-43%",
        rating: "4,7",
        sold: "8,5k đã bán",
        price: "39.000₫"
    },

    quizlet: {
        name: "Nâng cấp tài khoản Quizlet Plus",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/quizlet-plus-800x800.webp",
        discount: "-63%",
        rating: "4,8",
        sold: "756 đã bán",
        price: "59.000₫"
    },

    lingokids: {
        name: "Tài Khoản Lingokids",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/lingokids-800x800.webp",
        discount: "-82%",
        rating: "4,6",
        sold: "8,9k đã bán",
        price: "299.000₫"
    },

    grammarly: {
        name: "Tài Khoản Grammarly Premium",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/grammarly-800x800.webp",
        discount: "-93%",
        rating: "4,6",
        sold: "8,8k đã bán",
        price: "79.000₫"
    },

    ejoy: {
        name: "Tài khoản eJOY English Pro Plus",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/ejoy-english-premium-800x800.webp",
        discount: "-46%",
        rating: "4,7",
        sold: "6k đã bán",
        price: "449.100₫",
        oldPrice: "899.000₫"
    },

    wayground: {
        name: "Wayground Premium",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/wayground-800x800.webp",
        discount: "-38%",
        rating: "4,6",
        sold: "5,5k đã bán",
        price: "299.000₫"
    },

    quillbot: {
        name: "Tài khoản QuillBot Premium",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/quillbot-premium-800x800.webp",
        discount: "-54%",
        rating: "4,6",
        sold: "9,4k đã bán",
        price: "224.723₫",
        oldPrice: "419.000₫"
    },

    freepik: {
        name: "Tài Khoản Freepik Premium",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/freepik-800x800.webp",
        discount: "-51%",
        rating: "4,7",
        sold: "4,9k đã bán",
        price: "141.550₫"
    },

    pacdora: {
        name: "Nâng Cấp Tài Khoản Pacdora",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/pacdora.webp",
        discount: "-56%",
        rating: "4,6",
        sold: "9,4k đã bán",
        price: "244.020₫"
    },

    vecteezy: {
        name: "Tài khoản Vecteezy",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/vecteezy.webp",
        discount: "-58%",
        rating: "4,6",
        sold: "6,1k đã bán",
        price: "159.000₫"
    },

    studocu: {
        name: "Nâng Cấp Quizizz Super Chính Chủ",
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/studocu-800x800.webp",
        discount: "-38%",
        rating: "4,6",
        sold: "5,5k đã bán",
        price: "1.499.000₫",
        oldPrice: "2.409.000₫"
    }

};


/* ==========================================================
   PRODUCT COLLECTIONS
========================================================== */

const aiProducts = [
    PRODUCTS.chatgpt,
    PRODUCTS.claude,
    PRODUCTS.kling,
    PRODUCTS.googleAI,
    PRODUCTS.cursor,
    PRODUCTS.canva,
    PRODUCTS.pia,
    PRODUCTS.capcut,
    PRODUCTS.quillbot,
    PRODUCTS.freepik
];


const bestProducts = [
    PRODUCTS.chatgpt,
    PRODUCTS.claude,
    PRODUCTS.canva,
    PRODUCTS.pia,
    PRODUCTS.capcut,
    PRODUCTS.kling,
    PRODUCTS.googleAI,
    PRODUCTS.cursor,
    PRODUCTS.freepik,
    PRODUCTS.quillbot
];


const educationProducts = {

    language: [
        PRODUCTS.quizlet,
        PRODUCTS.lingokids,
        PRODUCTS.grammarly,
        PRODUCTS.ejoy,
        PRODUCTS.wayground
    ],

    course: [
        PRODUCTS.studocu,
        PRODUCTS.quillbot,
        PRODUCTS.canva,
        PRODUCTS.freepik,
        PRODUCTS.googleAI
    ],

    book: [
        PRODUCTS.quillbot,
        PRODUCTS.grammarly,
        PRODUCTS.quizlet,
        PRODUCTS.googleAI,
        PRODUCTS.kling
    ],

    other: [
        PRODUCTS.canva,
        PRODUCTS.pacdora,
        PRODUCTS.vecteezy,
        PRODUCTS.freepik,
        PRODUCTS.cursor
    ]

};


const flashProducts = [

    {
        ...PRODUCTS.pia,
        badge: "Giảm sâu",
        price: "46.550₫",
        stock: "Còn 261/300 suất",
        stockPercent: 87
    },

    {
        ...PRODUCTS.chatgpt,
        badge: "Giảm sâu",
        price: "147.510₫",
        stock: "Còn 680/900 suất",
        stockPercent: 75.5
    },

    {
        ...PRODUCTS.canva,
        badge: "Giảm sâu",
        price: "189.050₫",
        stock: "Còn 288/300 suất",
        stockPercent: 96
    },

    {
        ...PRODUCTS.googleAI,
        badge: "Giảm sâu",
        price: "358.901₫",
        stock: "Còn 283/300 suất",
        stockPercent: 94.3
    },

    {
        ...PRODUCTS.claude,
        badge: "Deal hot",
        price: "519.000₫",
        stock: "Còn 559/600 suất",
        stockPercent: 93
    },

    {
        ...PRODUCTS.wayground,
        badge: "Giảm sâu",
        price: "66.866₫",
        stock: "Còn 296/300 suất",
        stockPercent: 98.6
    },

    {
        ...PRODUCTS.pacdora,
        badge: "Deal hot",
        price: "244.020₫",
        stock: "Còn 298/300 suất",
        stockPercent: 99.3
    },

    {
        ...PRODUCTS.freepik,
        badge: "Giảm sâu",
        price: "141.550₫",
        stock: "Còn 297/300 suất",
        stockPercent: 99
    },

    {
        ...PRODUCTS.quillbot,
        badge: "Giảm sâu",
        price: "224.723₫",
        stock: "Còn 300/300 suất",
        stockPercent: 100
    },

    {
        ...PRODUCTS.vecteezy,
        badge: "Giảm sâu",
        price: "159.000₫",
        stock: "Còn 294/300 suất",
        stockPercent: 98
    }

];


/* ==========================================================
   PRODUCT TEMPLATE
========================================================== */

function productCardTemplate(product, options = {}) {

    const {
        flash = false,
        hidden = false
    } = options;


    const discount = flash
        ? `
            <span class="flash-badge">
                ${escapeHTML(product.badge || "Giảm sâu")}
            </span>
        `
        : product.discount
            ? `
                <span class="product-discount">
                    ${escapeHTML(product.discount)}
                </span>
            `
            : "";


    const oldPrice = product.oldPrice
        ? `
            <span class="product-old-price">
                ${escapeHTML(product.oldPrice)}
            </span>
        `
        : "";


    const stock = flash
        ? `
            <div class="stock-bar">

                <span
                    class="stock-fill"
                    style="width:${Number(product.stockPercent || 80)}%"
                ></span>

                <span class="stock-text">
                    ${escapeHTML(product.stock || "")}
                </span>

            </div>
        `
        : "";


    return `
        <article
            class="
                product-card
                ${flash ? "flash-card" : ""}
                ${hidden ? "ui-hidden" : ""}
            "
        >

            <div class="product-image">

                ${discount}

                <button
                    class="product-wish"
                    type="button"
                    aria-label="Thêm vào yêu thích"
                >
                    <i class="bi bi-heart"></i>
                </button>


                <img
                    src="${product.image}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                >

            </div>


            <div class="product-body">

                <h3 class="product-name">
                    ${escapeHTML(product.name)}
                </h3>


                <div class="product-social-proof">

                    <span class="product-stars">
                        ★★★★★
                    </span>

                    <span class="product-rating">
                        ${escapeHTML(product.rating || "4,6")}
                    </span>

                    <span>
                        ·
                    </span>

                    <span>
                        ${escapeHTML(product.sold || "")}
                    </span>

                </div>


                <div class="product-prices">

                    <div class="product-price-line">

                        <span class="product-price-prefix">
                            ${flash ? "Chỉ từ" : "Từ"}
                        </span>

                        <strong class="product-current-price">
                            ${escapeHTML(product.price || "")}
                        </strong>

                    </div>

                    ${oldPrice}

                </div>


                ${stock}


                <a
                    class="product-buy-button"
                    href="#"
                >
                    ${flash ? "Mua ngay" : "Chọn gói"}
                </a>

            </div>

        </article>
    `;
}


/* ==========================================================
   RENDER PRODUCTS
========================================================== */

function renderProducts(
    target,
    products,
    options = {}
) {

    const element = $(target);

    if (!element) {
        return;
    }


    const {
        flash = false,
        initial = products.length
    } = options;


    element.innerHTML = products
        .map(
            (product, index) =>
                productCardTemplate(
                    product,
                    {
                        flash,
                        hidden:
                            index >= initial
                    }
                )
        )
        .join("");

}


renderProducts(
    "#flashGrid",
    flashProducts,
    {
        flash: true,
        initial: 5
    }
);


renderProducts(
    "#aiGrid",
    aiProducts,
    {
        initial: 5
    }
);


renderProducts(
    "#bestGrid",
    bestProducts,
    {
        initial: 10
    }
);


/* ==========================================================
   SHOW MORE
========================================================== */

function setupShowMore(
    buttonSelector,
    gridSelector,
    collapsedText,
    expandedText
) {

    const button =
        $(buttonSelector);

    const grid =
        $(gridSelector);


    if (!button || !grid) {
        return;
    }


    let expanded = false;


    button.addEventListener(
        "click",
        () => {

            expanded =
                !expanded;


            const cards =
                $$(".product-card", grid);


            cards.forEach(
                (card, index) => {

                    if (index < 5) {
                        return;
                    }


                    card.classList.toggle(
                        "ui-hidden",
                        !expanded
                    );

                }
            );


            button.textContent =
                expanded
                    ? expandedText
                    : collapsedText;

        }
    );

}


setupShowMore(
    "#flashMore",
    "#flashGrid",
    "Xem Thêm (5)",
    "Thu Gọn"
);


setupShowMore(
    "#aiMore",
    "#aiGrid",
    "Xem thêm sản phẩm",
    "Thu Gọn"
);


/* ==========================================================
   EDUCATION TABS
========================================================== */

function renderEducation(tab) {

    const products =
        educationProducts[tab]
        ||
        educationProducts.language;


    renderProducts(
        "#educationGrid",
        products
    );

}


renderEducation("language");


$$(".education-tab").forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                $$(".education-tab")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                renderEducation(
                    button.dataset.tab
                );

            }
        );

    }
);


/* ==========================================================
   HERO SLIDER
========================================================== */

const heroSlides = [

    {
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/chatgpt-plus-banner.webp",

        alt:
            "ChatGPT Plus"
    },

    {
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/claude-ai-pro-max-banner.webp",

        alt:
            "Claude AI Pro Max"
    },

    {
        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/google-ai-pro-banner.webp",

        alt:
            "Google AI Pro"
    }

];


let heroIndex = 0;


const heroImage =
    $("#heroImage");

const heroDots =
    $("#heroDots");


function renderHeroDots() {

    if (!heroDots) {
        return;
    }


    heroDots.innerHTML = "";


    heroSlides.forEach(
        (_, index) => {

            const dot =
                document.createElement(
                    "button"
                );


            dot.type =
                "button";


            dot.className =
                "hero-dot";


            if (index === heroIndex) {
                dot.classList.add(
                    "active"
                );
            }


            dot.addEventListener(
                "click",
                () => {

                    heroIndex =
                        index;

                    updateHero();

                }
            );


            heroDots.appendChild(dot);

        }
    );

}


function updateHero() {

    if (!heroImage) {
        return;
    }


    const slide =
        heroSlides[heroIndex];


    heroImage.style.opacity =
        "0";


    setTimeout(
        () => {

            heroImage.src =
                slide.image;

            heroImage.alt =
                slide.alt;

            heroImage.style.opacity =
                "1";

        },
        120
    );


    renderHeroDots();

}


$("#heroPrev")?.addEventListener(
    "click",
    () => {

        heroIndex =
            (
                heroIndex -
                1 +
                heroSlides.length
            )
            %
            heroSlides.length;


        updateHero();

    }
);


$("#heroNext")?.addEventListener(
    "click",
    () => {

        heroIndex =
            (
                heroIndex +
                1
            )
            %
            heroSlides.length;


        updateHero();

    }
);


renderHeroDots();


let heroTimer =
    setInterval(
        () => {

            heroIndex =
                (
                    heroIndex +
                    1
                )
                %
                heroSlides.length;


            updateHero();

        },
        5500
    );


$(".hero-main")?.addEventListener(
    "mouseenter",
    () => {

        clearInterval(heroTimer);

    }
);


$(".hero-main")?.addEventListener(
    "mouseleave",
    () => {

        clearInterval(heroTimer);


        heroTimer =
            setInterval(
                () => {

                    heroIndex =
                        (
                            heroIndex +
                            1
                        )
                        %
                        heroSlides.length;


                    updateHero();

                },
                5500
            );

    }
);


/* ==========================================================
   COUNTDOWN
========================================================== */

let countdownSeconds =
    (8 * 60 * 60)
    +
    (32 * 60)
    +
    17;


function formatCountdown(totalSeconds) {

    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (
                totalSeconds %
                3600
            )
            /
            60
        );


    const seconds =
        totalSeconds %
        60;


    return [
        hours,
        minutes,
        seconds
    ]
        .map(
            number =>
                String(number)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join(":");

}


setInterval(
    () => {

        countdownSeconds--;


        if (countdownSeconds < 0) {
            countdownSeconds =
                8 * 60 * 60;
        }


        const countdown =
            $("#countdown");


        if (countdown) {
            countdown.textContent =
                formatCountdown(
                    countdownSeconds
                );
        }

    },
    1000
);


/* ==========================================================
   REVIEW DATA
========================================================== */

const reviews = [

    {
        text:
            "Dịch vụ uy tín, có bảo hành rõ ràng. Có lỗi là shop xử lý ngay, không vòng vo. Làm ăn đàng hoàng nên mình tin tưởng lâu dài.",

        name:
            "Phan Thị Huyền",

        role:
            "Chủ shop online"
    },

    {
        text:
            "Bên khotaikhoan giao tài khoản nhanh, thanh toán xong 2-3 phút là có. Mình mua nhiều lần rồi, lần nào cũng ok.",

        name:
            "Đỗ Văn Nam",

        role:
            "Kinh doanh online"
    },

    {
        text:
            "Đã mua Google One và VPN để chạy ads, tốc độ ổn định, không lỗi vặt. Shop hỗ trợ đổi IP, xử lý nhanh khi có vấn đề. Dịch vụ đáng tiền.",

        name:
            "Nguyễn Quang Huy",

        role:
            "Ads Freelancer"
    },

    {
        text:
            "Lấy combo Netflix + Spotify dùng êm, không bị out acc. Hướng dẫn kích hoạt chi tiết, người không rành cũng làm được. Giá rất hợp lý.",

        name:
            "Hoàng Minh Đức",

        role:
            "Sinh viên"
    },

    {
        text:
            "Acc Netflix 4K xem mượt, không bị out giữa chừng. Hướng dẫn chi tiết, mình làm theo là xong.",

        name:
            "Trương Hải Yến",

        role:
            "Nhân viên văn phòng"
    },

    {
        text:
            "Shop giao acc nhanh, thanh toán xong là nhận liền. Có bảo hành nên yên tâm dùng lâu dài.",

        name:
            "Nguyễn Văn Khải",

        role:
            "Kinh doanh"
    }

];


let reviewPage = 0;

const reviewsPerPage = 3;


/* ==========================================================
   REVIEW RENDER
========================================================== */

function renderReviews() {

    const grid =
        $("#reviewGrid");

    const dots =
        $("#reviewDots");


    if (!grid || !dots) {
        return;
    }


    const totalPages =
        Math.ceil(
            reviews.length /
            reviewsPerPage
        );


    const start =
        reviewPage *
        reviewsPerPage;


    const pageItems =
        reviews.slice(
            start,
            start +
            reviewsPerPage
        );


    grid.innerHTML =
        pageItems
            .map(
                review => `
                    <article class="review-card">

                        <div class="review-stars">
                            ★★★★★
                        </div>

                        <p>
                            ${escapeHTML(review.text)}
                        </p>

                        <footer>

                            ${escapeHTML(review.name)}

                            <span>
                                - ${escapeHTML(review.role)}
                            </span>

                        </footer>

                    </article>
                `
            )
            .join("");


    dots.innerHTML = "";


    for (
        let index = 0;
        index < totalPages;
        index++
    ) {

        const dot =
            document.createElement(
                "button"
            );


        dot.type =
            "button";


        dot.className =
            "review-dot";


        if (index === reviewPage) {
            dot.classList.add(
                "active"
            );
        }


        dot.addEventListener(
            "click",
            () => {

                reviewPage =
                    index;

                renderReviews();

            }
        );


        dots.appendChild(dot);

    }

}


$("#reviewPrev")?.addEventListener(
    "click",
    () => {

        const totalPages =
            Math.ceil(
                reviews.length /
                reviewsPerPage
            );


        reviewPage =
            (
                reviewPage -
                1 +
                totalPages
            )
            %
            totalPages;


        renderReviews();

    }
);


$("#reviewNext")?.addEventListener(
    "click",
    () => {

        const totalPages =
            Math.ceil(
                reviews.length /
                reviewsPerPage
            );


        reviewPage =
            (
                reviewPage +
                1
            )
            %
            totalPages;


        renderReviews();

    }
);


renderReviews();


/* ==========================================================
   WISHLIST UI ONLY
========================================================== */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".product-wish"
            );


        if (!button) {
            return;
        }


        button.classList.toggle(
            "active"
        );


        const icon =
            $("i", button);


        if (!icon) {
            return;
        }


        if (
            button.classList.contains(
                "active"
            )
        ) {

            icon.className =
                "bi bi-heart-fill";

        } else {

            icon.className =
                "bi bi-heart";

        }

    }
);


/* ==========================================================
   CATEGORY DRAWER
========================================================== */

const drawer =
    $("#categoryDrawer");

const backdrop =
    $("#categoryBackdrop");


function openDrawer() {

    drawer?.classList.add(
        "show"
    );

    backdrop?.classList.add(
        "show"
    );

    document.body
        .classList.add(
            "drawer-open"
        );

}


function closeDrawer() {

    drawer?.classList.remove(
        "show"
    );

    backdrop?.classList.remove(
        "show"
    );

    document.body
        .classList.remove(
            "drawer-open"
        );

}


$("#categoryButton")
    ?.addEventListener(
        "click",
        openDrawer
    );


$("#railMenuButton")
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
            event.key ===
            "Escape"
        ) {
            closeDrawer();
        }

    }
);


/* ==========================================================
   SEARCH UI
========================================================== */

$("#searchForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

        }
    );


/* ==========================================================
   PLACEHOLDER LINKS
========================================================== */

document.addEventListener(
    "click",
    event => {

        const link =
            event.target.closest(
                'a[href="#"]'
            );


        if (link) {
            event.preventDefault();
        }

    }
);


/* ==========================================================
   IMAGE FALLBACK
========================================================== */

document.addEventListener(
    "error",
    event => {

        const image =
            event.target;


        if (
            !(image instanceof HTMLImageElement)
        ) {
            return;
        }


        if (
            image.dataset.fallbackApplied
        ) {
            return;
        }


        image.dataset.fallbackApplied =
            "true";


        const parent =
            image.parentElement;


        if (parent) {

            parent.style.background =
                "linear-gradient(135deg,#eef4ff,#f8fafc)";

        }


        image.style.opacity =
            "0";

    },
    true
);


/* ==========================================================
   INITIAL
========================================================== */

console.log(
    "Kho Tai Khoan UI v2 loaded."
);