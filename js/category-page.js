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
                " | storetainguyen"
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


    function buildGenericBottom() {

        const slug =
            category.slug || "";

        const baseTitle =
            "Chọn đúng sản phẩm trong nhóm " + category.name;

        const presets = {
            "cong-cu-ai": {
                intro:
                    "Nhóm công cụ AI phù hợp cho viết nội dung, học tập, nghiên cứu, lập trình, thiết kế ảnh/video và tự động hóa công việc. Hãy chọn theo nhu cầu chính thay vì chỉ nhìn giá.",
                items: [
                    {
                        chip:
                            "Viết & nghiên cứu",
                        title:
                            "ChatGPT, Claude, Google AI",
                        text:
                            "Phù hợp khi cần trợ lý AI để viết, tóm tắt, phân tích tài liệu, brainstorm và xử lý công việc hằng ngày."
                    },
                    {
                        chip:
                            "Lập trình",
                        title:
                            "Cursor, AI code assistant",
                        text:
                            "Dành cho dev hoặc người học code cần gợi ý, sửa lỗi, refactor và tăng tốc quy trình làm việc."
                    },
                    {
                        chip:
                            "Sáng tạo",
                        title:
                            "Kling, Krea, Invideo, Canva",
                        text:
                            "Hợp với creator, designer, marketer và seller cần tạo ảnh, video, template hoặc nội dung nhanh hơn."
                    }
                ],
                posts: [
                    {
                        title:
                            "Nên mua công cụ AI nào nếu mới bắt đầu?",
                        text:
                            "Nếu cần đa năng hãy bắt đầu với ChatGPT; nếu xử lý văn bản dài chọn Claude; nếu thiết kế hoặc video hãy chọn nhóm sáng tạo."
                    },
                    {
                        title:
                            "Dùng chung hay dùng riêng?",
                        text:
                            "Dùng chung tiết kiệm hơn, còn dùng riêng phù hợp khi làm việc với dữ liệu cá nhân hoặc cần ổn định lâu dài."
                    }
                ]
            },
            "giai-tri": {
                intro:
                    "Danh mục giải trí gồm tài khoản xem phim, nghe nhạc, anime, thể thao và cộng đồng. Mỗi nền tảng có nội dung, thiết bị hỗ trợ và chính sách dùng khác nhau.",
                items: [
                    {
                        chip:
                            "Xem phim",
                        title:
                            "Netflix, HBO Max, Disney+, Prime Video",
                        text:
                            "Phù hợp cho phim, series, nội dung gia đình, hoạt hình hoặc nội dung quốc tế."
                    },
                    {
                        chip:
                            "Âm nhạc",
                        title:
                            "Spotify, Apple Music",
                        text:
                            "Dành cho người nghe nhạc thường xuyên, cần playlist, podcast và trải nghiệm ít gián đoạn."
                    },
                    {
                        chip:
                            "Cộng đồng",
                        title:
                            "Discord Nitro, Crunchyroll",
                        text:
                            "Phù hợp cho game thủ, fan anime hoặc người sinh hoạt nhiều trong các cộng đồng online."
                    }
                ],
                posts: [
                    {
                        title:
                            "Chọn nền tảng xem phim theo nhu cầu",
                        text:
                            "Disney+ hợp nội dung gia đình/Marvel; HBO Max mạnh về series; Prime Video phù hợp phim quốc tế; Crunchyroll dành cho anime."
                    },
                    {
                        title:
                            "Lưu ý khi dùng tài khoản giải trí",
                        text:
                            "Nên đọc kỹ thiết bị hỗ trợ, số màn hình, vùng khả dụng và điều kiện bảo hành trước khi mua."
                    }
                ]
            },
            "vpn": {
                intro:
                    "VPN giúp mã hóa kết nối, ẩn IP và truy cập Internet linh hoạt hơn. Mỗi dịch vụ khác nhau về tốc độ, số thiết bị, vị trí máy chủ và độ ổn định.",
                items: [
                    {
                        chip:
                            "Tốc độ",
                        title:
                            "NordVPN, ExpressVPN, Surfshark",
                        text:
                            "Phù hợp khi cần kết nối ổn định, nhiều máy chủ và dùng trên nhiều thiết bị."
                    },
                    {
                        chip:
                            "Chi phí",
                        title:
                            "PIA VPN, HMA, PureVPN",
                        text:
                            "Lựa chọn hợp lý nếu muốn dùng VPN cơ bản với ngân sách tiết kiệm."
                    },
                    {
                        chip:
                            "Riêng tư",
                        title:
                            "Mullvad, CyberGhost",
                        text:
                            "Phù hợp người ưu tiên sự riêng tư, bảo vệ kết nối Wi-Fi công cộng hoặc làm việc từ xa."
                    }
                ],
                posts: [
                    {
                        title:
                            "VPN có dùng để bảo mật tuyệt đối không?",
                        text:
                            "VPN giúp tăng riêng tư nhưng không thay thế thói quen bảo mật như mật khẩu mạnh, 2FA và tránh link lạ."
                    },
                    {
                        title:
                            "Nên chọn VPN theo tiêu chí nào?",
                        text:
                            "Hãy cân nhắc số thiết bị, tốc độ, quốc gia máy chủ, thời hạn gói và chính sách bảo hành."
                    }
                ]
            },
            "hoc-tap": {
                intro:
                    "Tài khoản học tập hỗ trợ ngoại ngữ, ghi nhớ kiến thức, khóa học, viết học thuật và luyện kỹ năng. Nên chọn nền tảng theo mục tiêu học trong 1-3 tháng tới.",
                items: [
                    {
                        chip:
                            "Ngoại ngữ",
                        title:
                            "ELSA, Duolingo, Quizlet",
                        text:
                            "Phù hợp luyện từ vựng, phát âm, ghi nhớ và duy trì thói quen học mỗi ngày."
                    },
                    {
                        chip:
                            "Khóa học",
                        title:
                            "Udemy, Coursera, Skillshare",
                        text:
                            "Dành cho người cần học kỹ năng mới, lấy tài liệu chuyên môn hoặc học theo lộ trình."
                    },
                    {
                        chip:
                            "Viết & kiểm tra",
                        title:
                            "Grammarly, QuillBot, Turnitin",
                        text:
                            "Hỗ trợ viết tiếng Anh, diễn đạt, kiểm tra nội dung và chỉnh sửa bài học thuật."
                    }
                ],
                posts: [
                    {
                        title:
                            "Quizlet Plus phù hợp với ai?",
                        text:
                            "Phù hợp người học ngoại ngữ, ôn thi, cần flashcard và chế độ học lặp lại có hệ thống."
                    },
                    {
                        title:
                            "Làm sao chọn tài khoản học tập không lãng phí?",
                        text:
                            "Chọn theo môn đang học, thời lượng học mỗi tuần và thiết bị bạn dùng thường xuyên."
                    }
                ]
            },
            "luu-tru": {
                intro:
                    "Nhóm lưu trữ giúp tăng dung lượng cho ảnh, tài liệu, email và dữ liệu làm việc. Trước khi mua nên xác định dung lượng cần dùng và tài khoản cần nâng cấp.",
                items: [
                    {
                        chip:
                            "Google",
                        title:
                            "Google One, Google Drive",
                        text:
                            "Phù hợp người dùng Gmail, Google Photos và Drive hằng ngày."
                    },
                    {
                        chip:
                            "Microsoft",
                        title:
                            "OneDrive",
                        text:
                            "Phù hợp người dùng Office, Windows và lưu tài liệu làm việc."
                    },
                    {
                        chip:
                            "Đồng bộ",
                        title:
                            "Dropbox",
                        text:
                            "Hợp với nhu cầu đồng bộ file nhanh giữa nhiều thiết bị và chia sẻ cho đội nhóm."
                    }
                ],
                posts: [
                    {
                        title:
                            "Nên chuẩn bị gì trước khi nâng cấp dung lượng?",
                        text:
                            "Chuẩn bị đúng email cần nâng cấp và kiểm tra dung lượng hiện tại trước khi tạo đơn."
                    }
                ]
            }
        };

        const preset =
            presets[slug];

        if (!preset) {
            return {
                type:
                    "picks",
                title:
                    baseTitle,
                intro:
                    "Mỗi sản phẩm có gói, thời hạn, điều kiện sử dụng và bảo hành riêng. Hãy xem kỹ trang chi tiết trước khi đặt hàng.",
                items: [
                    {
                        chip:
                            "Gói dùng chung",
                        title:
                            "Tối ưu chi phí",
                        text:
                            "Phù hợp khi muốn trải nghiệm dịch vụ với ngân sách thấp."
                    },
                    {
                        chip:
                            "Gói dùng riêng",
                        title:
                            "Ổn định hơn",
                        text:
                            "Phù hợp khi sử dụng thường xuyên hoặc cần tài khoản riêng."
                    },
                    {
                        chip:
                            "Nâng cấp chính chủ",
                        title:
                            "Dùng trên tài khoản của bạn",
                        text:
                            "Phù hợp khi muốn giữ dữ liệu và lịch sử trên tài khoản cá nhân."
                    }
                ],
                cta: {
                    title:
                        "Cần tư vấn chọn gói?",
                    html:
                        'Nhắn <a href="https://zalo.me/0924356579" target="_blank" rel="noopener">Zalo</a> hoặc <a href="https://t.me/0924356579" target="_blank" rel="noopener">Telegram</a> để được hỗ trợ.'
                }
            };
        }

        return {
            type:
                "picks",
            title:
                baseTitle,
            intro:
                preset.intro,
            items:
                preset.items,
            postsTitle:
                "Gợi ý & câu hỏi thường gặp",
            posts:
                preset.posts,
            cta: {
                title:
                    "Chưa chắc nên chọn sản phẩm nào?",
                html:
                    'Gửi nhu cầu qua <a href="https://zalo.me/0924356579" target="_blank" rel="noopener">Zalo</a> hoặc <a href="https://t.me/0924356579" target="_blank" rel="noopener">Telegram</a>, shop sẽ gợi ý gói phù hợp.'
            }
        };

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
            category.bottom
            ||
            buildGenericBottom();


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
