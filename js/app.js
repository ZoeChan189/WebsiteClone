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
   PRODUCT DATA FROM BACKEND
========================================================== */

let fedProducts = [];
let aiProducts = [];
let bestProducts = [];
let flashProducts = [];
let educationProducts = {
    language: [],
    course: [],
    book: [],
    other: []
};

function formatCurrency(value) {
    const number = Number(value || 0);
    const amount = number > 0 && number < 10000 ? number * 1000 : number;
    return amount.toLocaleString("vi-VN") + "\u0111";
}



function formatSold(value) {
    const number = Number(value || 0);

    if (number >= 1000) {
        return (number / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k đã bán";
    }

    return number + " đã bán";
}

function normalizeFeedProduct(product) {
    return {
        ...product,
        soldCount: Number(product.sold || 0),
        rating: String(product.rating || "4.6").replace(".", ","),
        sold: typeof product.sold === "string" ? product.sold : formatSold(product.sold),
        price: typeof product.price === "string" ? product.price : formatCurrency(product.price),
        oldPrice: product.oldPrice ? formatCurrency(product.oldPrice) : "",
        stock: product.stock ? "Còn " + product.stock + "/300 suất" : "Còn 300/300 suất",
        stockPercent: Math.max(8, Math.min(100, Number(product.stock || 300) / 3)),
        badge: product.discount ? "Giảm sâu" : "Deal hot"
    };
}

function byCategory(slug) {
    return fedProducts.filter(product => product.categorySlug === slug);
}

function pickProducts(list, count) {
    return list.filter(Boolean).slice(0, count);
}

function buildProductCollections(products) {
    fedProducts = products.map(normalizeFeedProduct);
    aiProducts = pickProducts(byCategory("cong-cu-ai"), 12);
    bestProducts = pickProducts([...fedProducts].sort((a, b) => b.soldCount - a.soldCount), 10);
    flashProducts = pickProducts(fedProducts.filter(product => product.discount), 10);

    if (!flashProducts.length) {
        flashProducts = pickProducts(bestProducts, 10);
    }

    const studyProducts = byCategory("hoc-tap");
    educationProducts = {
        language: pickProducts(studyProducts, 5),
        course: pickProducts([...studyProducts].reverse(), 5),
        book: pickProducts(fedProducts.filter(product => ["hoc-tap", "lam-viec"].includes(product.categorySlug)), 5),
        other: pickProducts(fedProducts.filter(product => product.categorySlug !== "hoc-tap"), 5)
    };
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Không tải được dữ liệu: " + url);
    }

    return response.json();
}

function catalogFallbackProducts() {
    return Object.values(window.PRODUCT_CATALOG || {}).map(product => ({
        slug: product.slug,
        name: product.shortName || product.name,
        categorySlug: product.categorySlug || "cong-cu-ai",
        image: product.image,
        discount: product.discount,
        price: product.price,
        oldPrice: product.oldPrice,
        rating: product.rating,
        sold: product.sold,
        stock: product.stock
    }));
}

async function loadProductFeed() {
    try {
        buildProductCollections(await fetchJson("/api/products"));
        return;
    } catch (apiError) {
        console.warn(apiError);
    }

    try {
        const database = await fetchJson("data/db.json");
        buildProductCollections(database.products || []);
        return;
    } catch (staticError) {
        console.warn(staticError);
    }

    const fallbackProducts = catalogFallbackProducts();

    if (!fallbackProducts.length) {
        throw new Error("Không tải được sản phẩm.");
    }

    buildProductCollections(fallbackProducts);
}

function renderFedProducts() {
    renderProducts("#flashGrid", flashProducts, { flash: true, initial: 5 });
    renderProducts("#aiGrid", aiProducts, { initial: 5 });
    renderProducts("#bestGrid", bestProducts, { initial: 10 });
    renderEducation("language");
}

/* ==========================================================
   PRODUCT TEMPLATE
========================================================== */

function productCardTemplate(product, options = {}) {

    const {
        flash = false,
        hidden = false
    } = options;


    const productHref =
        product.slug
            ? `product.html?slug=${encodeURIComponent(product.slug)}`
            : "#";


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


                <a href="${productHref}">
                    <img
                        src="${product.image}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy"
                    >
                </a>

            </div>


            <div class="product-body">

                <h3 class="product-name">
                    <a href="${productHref}">
                        ${escapeHTML(product.name)}
                    </a>
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
                    href="${productHref}"
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

loadProductFeed()
    .then(renderFedProducts)
    .catch(error => {
        console.error(error);
        ["#flashGrid", "#aiGrid", "#bestGrid", "#educationGrid"].forEach(target => {
            const element = $(target);
            if (element) element.innerHTML = '<p class="product-feed-error">Không tải được sản phẩm.</p>';
        });
    });


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
    "storetainguyen UI v2 loaded."
);
