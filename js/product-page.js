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


function canonicalProductSlug(slug) {
    const normalized =
        slugify(
            slug || ""
        );

    const aliases = {
        "tai-khoan-chatgpt-plus": "chatgpt-plus",
        "tai-khoan-chatgpt-plus-pro": "chatgpt-plus",
        "tai-khoan-chatgpt-plus-pro-gpt-5-6": "chatgpt-plus",
        "chatgpt-plus-pro": "chatgpt-plus",
        "claude-ai-pro-max": "claude-ai",
        "tai-khoan-claude-ai-pro-max": "claude-ai",
        "tai-khoan-claude-ai": "claude-ai",
        "tai-khoan-google-ai-pro": "google-ai-pro",
        "tai-khoan-cursor-ai": "cursor-ai",
        "tai-khoan-kling-ai": "kling-ai",
        "goi-hbo-max-gia-re": "hbo-max",
        "tai-khoan-disney-plus": "disney-plus",
        "tai-khoan-amazon-prime-video": "amazon-prime-video",
        "tai-khoan-crunchyroll-premium": "crunchyroll",
        "tai-khoan-discord-nitro": "discord-nitro",
        "tai-khoan-nordvpn": "nordvpn",
        "nang-cap-google-one": "google-one",
        "nang-cap-tai-khoan-quizlet-plus": "nang-cap-tai-khoan-quizlet-plus"
    };

    return aliases[normalized] || slug || "chatgpt-plus";
}


const canonicalSlug =
    canonicalProductSlug(
        requestedSlug
    );


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
                        `<p>${escapeHTML(item.name)} hiện có tại storetainguyen. Vui lòng kiểm tra đúng gói và thời hạn trước khi đặt hàng.</p>`
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


function textLooksCorrupted(value) {
    return /Ã|Â|Ä|áº|á»|Æ/.test(
        String(value || "")
    );
}


function blocksLookCorrupted(blocks) {
    return (
        blocks || []
    )
        .some(block =>
            textLooksCorrupted(
                [
                    block.text,
                    block.html,
                    block.question,
                    block.answer,
                    ...(block.items || []),
                    ...(block.rows || []).flat()
                ]
                    .join(" ")
            )
        );
}


function getProductCategoryName(item) {
    const path =
        item?.categoryPath || [];

    const category =
        path.find(entry =>
            entry?.name &&
            !/trang chủ/i.test(entry.name)
        );

    if (category?.name) {
        return category.name;
    }

    const categoryEntry =
        Object.values(window.CATEGORY_CATALOG || {})
            .find(categoryItem =>
                (categoryItem.products || [])
                    .some(productItem => productItem.slug === item?.slug)
            );

    return categoryEntry?.name || "Tài khoản bản quyền";
}


function normalizeProductText(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}


function isChatGPTProduct(item) {
    return /chatgpt|openai/.test(
        normalizeProductText(
            `${item?.name || ""} ${item?.slug || ""}`
        )
    );
}


function getServiceProfile(item) {
    const source =
        normalizeProductText(
            `${item?.name || ""} ${item?.slug || ""}`
        );

    const profiles = [
        {
            match: /chatgpt|openai/,
            label: "ChatGPT Plus",
            purpose: "trợ lý AI hỗ trợ viết nội dung, học tập, lập trình, phân tích tài liệu và xử lý công việc hằng ngày.",
            features: [
                "Truy cập các tính năng AI nâng cao theo gói đang cung cấp.",
                "Phù hợp cho học tập, làm việc văn phòng, viết nội dung, code và nghiên cứu.",
                "Hỗ trợ sử dụng trên trình duyệt và các thiết bị cá nhân tương thích."
            ]
        },
        {
            match: /claude/,
            label: "Claude AI",
            purpose: "công cụ AI mạnh về đọc hiểu, tóm tắt, viết nội dung dài, phân tích tài liệu và hỗ trợ lập luận.",
            features: [
                "Phù hợp để xử lý tài liệu dài, viết bài, lập kế hoạch và brainstorm ý tưởng.",
                "Hỗ trợ công việc học tập, nghiên cứu, marketing, content và lập trình.",
                "Giao diện dễ dùng, thích hợp cho người cần trợ lý AI ổn định."
            ]
        },
        {
            match: /canva/,
            label: "Canva Pro",
            purpose: "nền tảng thiết kế trực tuyến cho banner, social post, CV, thuyết trình, video ngắn và bộ nhận diện thương hiệu.",
            features: [
                "Mở khóa template, ảnh, video, font và thành phần thiết kế premium.",
                "Hỗ trợ xóa nền, resize thiết kế, Brand Kit và các công cụ sáng tạo nâng cao.",
                "Phù hợp cho shop online, marketer, học sinh sinh viên và đội nhóm thiết kế."
            ]
        },
        {
            match: /youtube|ytb/,
            label: "YouTube Premium",
            purpose: "gói xem YouTube nâng cấp giúp giảm gián đoạn khi xem video, nghe nhạc và học tập.",
            features: [
                "Xem video không quảng cáo theo điều kiện gói.",
                "Hỗ trợ phát nền, tải nội dung offline và sử dụng YouTube Music.",
                "Phù hợp cho người xem YouTube thường xuyên trên điện thoại, máy tính bảng và máy tính."
            ]
        },
        {
            match: /netflix/,
            label: "Netflix",
            purpose: "dịch vụ xem phim, series và nội dung giải trí trực tuyến.",
            features: [
                "Xem phim và series theo chất lượng/gói được cung cấp.",
                "Phù hợp cho nhu cầu giải trí cá nhân hoặc gia đình.",
                "Có hướng dẫn đăng nhập và lưu ý sử dụng rõ ràng khi nhận tài khoản."
            ]
        },
        {
            match: /hbo|max|disney|amazon prime|prime video|crunchyroll|hulu|apple tv|iqiyi|vieon|fpt play|paramount|showtime/,
            label: "Tài khoản xem phim",
            purpose: "dịch vụ xem phim, series, hoạt hình, thể thao hoặc nội dung giải trí trực tuyến theo gói premium.",
            features: [
                "Truy cập kho phim, series hoặc nội dung độc quyền theo nền tảng đã chọn.",
                "Hỗ trợ xem trên thiết bị tương thích như điện thoại, máy tính bảng, laptop hoặc TV.",
                "Phù hợp cho nhu cầu giải trí gia đình, xem phim cuối tuần hoặc theo dõi nội dung quốc tế."
            ]
        },
        {
            match: /spotify/,
            label: "Spotify Premium",
            purpose: "dịch vụ nghe nhạc nâng cấp cho nhu cầu giải trí, làm việc và học tập.",
            features: [
                "Nghe nhạc mượt hơn theo quyền lợi của gói Premium.",
                "Hỗ trợ playlist, podcast và trải nghiệm nghe nhạc đa thiết bị.",
                "Phù hợp cho người nghe nhạc thường xuyên mỗi ngày."
            ]
        },
        {
            match: /discord|nitro/,
            label: "Discord Nitro",
            purpose: "gói nâng cấp Discord dành cho cộng đồng, game thủ, creator và người dùng thường xuyên voice/chat.",
            features: [
                "Mở khóa các quyền lợi Nitro theo gói như emoji, upload dung lượng cao hơn hoặc boost server.",
                "Phù hợp cho người tham gia nhiều server, cộng đồng game hoặc đội nhóm online.",
                "Có hướng dẫn kích hoạt và lưu ý sử dụng để hạn chế mua nhầm loại gói."
            ]
        },
        {
            match: /vpn|nord|pia|express|surfshark|hma/,
            label: "VPN Premium",
            purpose: "dịch vụ mạng riêng ảo hỗ trợ bảo mật kết nối, đổi khu vực truy cập và dùng Internet linh hoạt hơn.",
            features: [
                "Hỗ trợ đổi vị trí máy chủ theo gói đang cung cấp.",
                "Tăng riêng tư khi dùng Wi-Fi công cộng hoặc làm việc từ xa.",
                "Phù hợp cho nhu cầu truy cập nội dung quốc tế và bảo vệ kết nối cơ bản."
            ]
        },
        {
            match: /google one/,
            label: "Google One",
            purpose: "gói nâng cấp dung lượng Google giúp lưu trữ ảnh, tài liệu, Gmail và Drive thuận tiện hơn.",
            features: [
                "Tăng dung lượng cho Google Drive, Gmail và Google Photos theo gói đã chọn.",
                "Phù hợp cho người cần backup ảnh, tài liệu học tập hoặc dữ liệu làm việc.",
                "Một số gói có thể cần email Google để nâng cấp đúng tài khoản."
            ]
        },
        {
            match: /google one|drive|storage|onedrive|dropbox/,
            label: "Gói lưu trữ",
            purpose: "dịch vụ tăng dung lượng lưu trữ, sao lưu dữ liệu và đồng bộ tệp giữa nhiều thiết bị.",
            features: [
                "Tăng dung lượng lưu trữ cho ảnh, tài liệu và tệp làm việc.",
                "Hỗ trợ đồng bộ dữ liệu trên nhiều thiết bị.",
                "Phù hợp cho cá nhân, học tập, làm việc nhóm và backup dữ liệu."
            ]
        },
        {
            match: /quizlet|quizizz|duolingo|elsa|grammarly|coursera|udemy|skillshare|datacamp|codecademy|course hero/,
            label: "Tài khoản học tập",
            purpose: "dịch vụ học tập premium hỗ trợ luyện ngoại ngữ, ghi nhớ kiến thức, làm bài tập, học kỹ năng hoặc truy cập khóa học.",
            features: [
                "Mở khóa tài nguyên học tập hoặc tính năng nâng cao theo từng nền tảng.",
                "Phù hợp cho học sinh, sinh viên, người tự học và người cần nâng cấp kỹ năng.",
                "Có hướng dẫn đăng nhập/kích hoạt để bắt đầu học nhanh sau khi mua."
            ]
        },
        {
            match: /capcut|kling|invideo|heygen|krea|gamma|cursor|perplexity|freepik|pikbest|vecteezy/,
            label: "Công cụ sáng tạo",
            purpose: "công cụ hỗ trợ sáng tạo nội dung, thiết kế, dựng video, tạo ảnh hoặc tăng tốc quy trình làm việc.",
            features: [
                "Mở khóa các tính năng nâng cao theo từng nền tảng.",
                "Phù hợp cho creator, marketer, designer, seller và người làm nội dung.",
                "Giúp tiết kiệm thời gian so với thao tác thủ công."
            ]
        }
    ];

    const profile =
        profiles.find(itemProfile =>
            itemProfile.match.test(source)
        );

    if (profile) {
        return profile;
    }

    const categoryName =
        getProductCategoryName(item);

    if (/giải trí|giai tri/i.test(categoryName)) {
        return {
            label: item?.shortName || item?.name || "Tài khoản giải trí",
            purpose: "dịch vụ giải trí số giúp xem phim, nghe nhạc, chơi game hoặc sử dụng nội dung premium thuận tiện hơn.",
            features: [
                "Tối ưu cho nhu cầu giải trí hằng ngày.",
                "Có hướng dẫn đăng nhập và sử dụng sau khi đặt hàng.",
                "Shop hỗ trợ xử lý khi phát sinh lỗi trong thời gian bảo hành."
            ]
        };
    }

    if (/học|hoc|khóa|khoa|ngoại ngữ|ngoai ngu/i.test(categoryName)) {
        return {
            label: item?.shortName || item?.name || "Tài khoản học tập",
            purpose: "dịch vụ hỗ trợ học tập, luyện kỹ năng, học ngoại ngữ hoặc truy cập khóa học trực tuyến.",
            features: [
                "Phù hợp cho học sinh, sinh viên và người tự học.",
                "Hỗ trợ truy cập tài nguyên học tập theo quyền lợi của gói.",
                "Có hướng dẫn sử dụng để bắt đầu nhanh sau khi mua."
            ]
        };
    }

    return {
        label: item?.shortName || item?.name || "Tài khoản bản quyền",
        purpose: "dịch vụ tài khoản bản quyền giúp bạn dùng phần mềm hoặc nền tảng số với chi phí tối ưu hơn.",
        features: [
            "Gói được shop cấu hình theo thông tin sản phẩm và thời hạn đã chọn.",
            "Phù hợp cho nhu cầu cá nhân, học tập, làm việc hoặc giải trí.",
            "Có hỗ trợ trong quá trình kích hoạt và sử dụng."
        ]
    };
}


function buildRichContent(item) {
    if (isChatGPTProduct(item)) {
        return buildChatGPTContent(item);
    }

    const profile =
        getServiceProfile(item);

    const name =
        item?.name || profile.label;

    const categoryName =
        getProductCategoryName(item);

    const price =
        getActiveDuration(item)?.price || item?.price || 0;

    const oldPrice =
        getActiveDuration(item)?.oldPrice || item?.oldPrice || 0;

    return [
        {
            id: "overview",
            type: "heading",
            text: `Tổng quan ${profile.label}`,
            toc: true
        },
        {
            type: "paragraph",
            html: `<strong>${escapeHTML(name)}</strong> là ${escapeHTML(profile.purpose)} Sản phẩm thuộc nhóm <strong>${escapeHTML(categoryName)}</strong>, phù hợp cho khách cần kích hoạt nhanh, có hướng dẫn rõ ràng và được hỗ trợ trong quá trình sử dụng.`
        },
        {
            id: "features",
            type: "heading",
            text: "Tính năng nổi bật",
            toc: true
        },
        {
            type: "list",
            items: profile.features
        },
        {
            id: "benefits",
            type: "heading",
            text: "Quyền lợi khi mua tại storetainguyen",
            toc: true
        },
        {
            type: "list",
            items: [
                "Tư vấn đúng gói trước khi thanh toán để tránh mua nhầm nhu cầu.",
                "Giao thông tin đơn hàng qua luồng tự động hoặc kênh hỗ trợ đã công bố.",
                "Bảo hành theo thời hạn gói, hỗ trợ đổi lỗi nếu vấn đề thuộc phạm vi shop xử lý.",
                "Có lịch sử đơn hàng trong hệ thống để đối soát khi cần hỗ trợ sau mua."
            ]
        },
        {
            id: "compare",
            type: "heading",
            text: "So sánh nhanh",
            toc: true
        },
        {
            type: "table",
            headers: [
                "Tiêu chí",
                "Mua tại storetainguyen",
                "Tự mua chính hãng"
            ],
            rows: [
                [
                    "Chi phí",
                    price ? `Từ ${formatPrice(price)}` : "Tối ưu theo từng gói",
                    oldPrice ? `Tham khảo ${formatPrice(oldPrice)}` : "Theo giá niêm yết chính hãng"
                ],
                [
                    "Kích hoạt",
                    "Có hướng dẫn và hỗ trợ",
                    "Tự thao tác toàn bộ"
                ],
                [
                    "Bảo hành",
                    "Theo chính sách shop",
                    "Theo chính sách nền tảng"
                ]
            ]
        },
        {
            id: "buy-guide",
            type: "heading",
            text: "Hướng dẫn mua và kích hoạt",
            toc: true
        },
        {
            type: "ordered-list",
            items: [
                "Chọn đúng loại gói, thời hạn và số lượng cần mua.",
                "Bấm Mua ngay hoặc Thêm vào giỏ hàng để tạo đơn.",
                "Kiểm tra lại tên sản phẩm, giá và thông tin cần nâng cấp trước khi xác nhận.",
                "Hoàn tất thanh toán theo hướng dẫn của hệ thống/bot.",
                "Nhận tài khoản hoặc thông tin kích hoạt, sau đó liên hệ hỗ trợ nếu cần bảo hành."
            ]
        },
        {
            id: "notes",
            type: "heading",
            text: "Lưu ý trước khi mua",
            toc: true
        },
        {
            type: "list",
            items: [
                "Đọc kỹ mô tả gói, thời hạn và điều kiện bảo hành trước khi thanh toán.",
                "Không lưu dữ liệu nhạy cảm trên tài khoản dùng chung nếu gói không phải tài khoản riêng.",
                "Giữ lại mã đơn hàng để shop kiểm tra và đối soát khi cần hỗ trợ.",
                "Một số dịch vụ có thể cần email/tên đăng nhập để nâng cấp đúng tài khoản."
            ]
        }
    ];
}


function getActiveDuration(item) {
    const firstVariant =
        (item?.variants || [])
            .find(variant => variant.available !== false)
        ||
        item?.variants?.[0];

    return (
        firstVariant?.durations || []
    )
        .find(duration => duration.available !== false)
    ||
    firstVariant?.durations?.[0]
    ||
    null;
}


function buildChatGPTContent(item) {
    return [
        {
            id: "chatgpt-price",
            type: "heading",
            text: "Bảng giá ChatGPT Plus tại storetainguyen",
            toc: true
        },
        {
            type: "paragraph",
            html: "Bảng dưới giúp bạn nhìn nhanh các gói phổ biến trước khi chọn biến thể phía trên. Giá trên form đặt hàng là giá cuối cùng theo thời điểm bạn mua."
        },
        {
            type: "table",
            headers: [
                "Gói",
                "Thời hạn",
                "Giá tại shop",
                "Giá chính hãng tham khảo"
            ],
            headerClasses: [
                "dark",
                "dark",
                "green",
                "slate"
            ],
            highlightColumns: [
                2
            ],
            rows: [
                [
                    "Plus dùng chung",
                    "1 tháng",
                    "149.000đ",
                    "~529.000đ"
                ],
                [
                    "Plus dùng chung",
                    "3 tháng",
                    "399.000đ",
                    "~1.569.000đ"
                ],
                [
                    "Plus dùng chung",
                    "5 tháng",
                    "649.000đ",
                    "~2.645.000đ"
                ],
                [
                    "Plus dùng chung",
                    "12 tháng",
                    "1.249.000đ",
                    "~6.249.000đ"
                ],
                [
                    "Plus dùng riêng / chính chủ",
                    "1 tháng",
                    "449.000đ",
                    "~529.000đ"
                ]
            ]
        },
        {
            type: "callout",
            html: "<strong>Lưu ý:</strong> gói Pro 5x/20x hoặc gói dài hạn chính chủ có thể hết hàng theo từng đợt. Nếu nút chọn bị khóa, hãy nhắn shop để được báo khi có lại."
        },
        {
            id: "private-plus",
            type: "heading",
            text: "ChatGPT Plus dùng riêng / chính chủ phù hợp với ai?",
            toc: true
        },
        {
            type: "paragraph",
            html: "Gói dùng riêng phù hợp khi bạn cần một tài khoản chỉ mình bạn sử dụng, dễ quản lý lịch sử chat và hạn chế rủi ro lẫn dữ liệu với người khác."
        },
        {
            type: "list",
            items: [
                "<strong>Freelancer, marketer, dev:</strong> dùng ChatGPT gần như mỗi ngày để viết, code, phân tích và xử lý công việc.",
                "<strong>Có dữ liệu khách hàng hoặc code riêng:</strong> không nên đặt nội dung nhạy cảm lên tài khoản dùng chung.",
                "<strong>Cần đồng bộ lịch sử:</strong> muốn dùng cùng một tài khoản trên máy tính và điện thoại.",
                "<strong>Muốn chủ động bảo mật:</strong> nhận tài khoản riêng, đổi mật khẩu và quản lý cách đăng nhập."
            ]
        },
        {
            type: "paragraph",
            html: "Nếu bạn chỉ mới thử Plus, dùng vài lần mỗi tuần hoặc muốn tiết kiệm chi phí, gói dùng chung 1 tháng là lựa chọn dễ bắt đầu hơn."
        },
        {
            id: "pro-5x-20x",
            type: "heading",
            text: "ChatGPT Pro 5x vs 20x khác gì Plus?",
            toc: true
        },
        {
            type: "paragraph",
            html: "Gói Plus phù hợp đa số nhu cầu cá nhân. Gói Pro hướng tới người dùng nặng hơn, cần quota cao hơn, context lớn hơn và ưu tiên các tác vụ phân tích/code/research cường độ cao."
        },
        {
            type: "list",
            items: [
                "<strong>Pro 5x:</strong> phù hợp dev, researcher hoặc người chat/code nhiều nhưng chưa cần mức quota tối đa.",
                "<strong>Pro 20x:</strong> phù hợp power user, agency hoặc người chạy Agent mode, Deep Research, phân tích tài liệu liên tục.",
                "<strong>Nếu chỉ viết lách, học tập, hỏi đáp hằng ngày:</strong> Plus dùng riêng thường đã đủ."
            ]
        },
        {
            id: "chatgpt-features",
            type: "heading",
            text: "ChatGPT Plus có gì nổi bật?",
            toc: true
        },
        {
            id: "gpt-models",
            type: "subheading",
            text: "1. Model AI nâng cao cho viết, học tập và công việc",
            toc: true
        },
        {
            type: "list",
            items: [
                "<strong>Phản hồi nhanh:</strong> phù hợp hỏi đáp, viết nội dung, sửa câu chữ, lập kế hoạch và brainstorming.",
                "<strong>Suy luận sâu:</strong> phù hợp bài toán khó, code, phân tích logic và nghiên cứu có nhiều điều kiện.",
                "<strong>Context dài hơn:</strong> đọc và xử lý tài liệu dài tốt hơn so với gói miễn phí."
            ]
        },
        {
            id: "research-agent",
            type: "subheading",
            text: "2. Deep Research và Agent mode",
            toc: true
        },
        {
            type: "list",
            items: [
                "<strong>Deep Research:</strong> phù hợp khi cần tổng hợp thông tin, lập báo cáo, so sánh nhiều nguồn hoặc nghiên cứu chủ đề mới.",
                "<strong>Agent mode:</strong> hỗ trợ các chuỗi tác vụ nhiều bước như tra cứu, tổng hợp, lập bảng, chuẩn bị nội dung hoặc xử lý quy trình lặp lại."
            ]
        },
        {
            id: "files-images-code",
            type: "subheading",
            text: "3. Tạo ảnh, đọc tệp, phân tích dữ liệu và Canvas",
            toc: true
        },
        {
            type: "list",
            items: [
                "<strong>Tạo ảnh:</strong> dùng cho poster, thumbnail, mockup, ảnh minh họa và ý tưởng thiết kế.",
                "<strong>Đọc tệp:</strong> hỗ trợ PDF, bảng tính, ảnh, tài liệu và code trong quá trình làm việc.",
                "<strong>Phân tích dữ liệu:</strong> phù hợp xử lý bảng, tính toán, tóm tắt số liệu và dựng báo cáo.",
                "<strong>Canvas:</strong> tiện khi viết/chỉnh sửa nội dung hoặc code theo từng phần thay vì chat tuyến tính."
            ]
        },
        {
            id: "free-plus-pro",
            type: "heading",
            text: "So sánh nhanh Free vs Plus vs Pro",
            toc: true
        },
        {
            type: "table",
            headers: [
                "Tiêu chí",
                "Free",
                "Plus",
                "Pro"
            ],
            headerClasses: [
                "dark",
                "slate",
                "green",
                "green-dark"
            ],
            highlightColumns: [
                2,
                3
            ],
            rows: [
                [
                    "Chi phí chính hãng",
                    "$0",
                    "$20/tháng",
                    "$200/tháng"
                ],
                [
                    "Giá tại shop",
                    "-",
                    "Từ 149K/tháng",
                    "Tùy đợt hàng"
                ],
                [
                    "Tốc độ phản hồi",
                    "Cơ bản",
                    "Ưu tiên hơn",
                    "Ưu tiên cao"
                ],
                [
                    "Suy luận nâng cao",
                    "Giới hạn",
                    "Có",
                    "Mạnh hơn"
                ],
                [
                    "Đọc file / phân tích dữ liệu",
                    "Giới hạn",
                    "Có",
                    "Có, quota cao hơn"
                ],
                [
                    "Phù hợp nhất",
                    "Dùng thử",
                    "Học tập, công việc, content, code",
                    "Power user, dev/research nặng"
                ]
            ]
        },
        {
            id: "shared-private",
            type: "heading",
            text: "Dùng chung hay dùng riêng nên chọn gói nào?",
            toc: true
        },
        {
            type: "paragraph",
            html: "<strong>Hai loại đều là ChatGPT Plus đầy đủ</strong>, khác nhau chủ yếu ở cách dùng tài khoản, độ riêng tư và chi phí."
        },
        {
            type: "table",
            headers: [
                "Tiêu chí",
                "Dùng chung",
                "Dùng riêng / chính chủ"
            ],
            headerClasses: [
                "dark",
                "green",
                "green-dark"
            ],
            highlightColumns: [
                2
            ],
            rows: [
                [
                    "Ai nên chọn?",
                    "Mới thử Plus, dùng vài lần/tuần, sinh viên, ngân sách thấp",
                    "Dùng hầu như mỗi ngày, freelancer, marketer, dev, tài liệu khách hàng"
                ],
                [
                    "Cách hoạt động",
                    "Đăng nhập bằng tài khoản shop cấp",
                    "Nhận tài khoản riêng, đổi mật khẩu và dùng một mình"
                ],
                [
                    "Lịch sử chat",
                    "Tách theo trình duyệt/môi trường dùng",
                    "Chỉ mình bạn quản lý trên tài khoản riêng"
                ],
                [
                    "Quota",
                    "Có thể bị chia nếu nhiều người dùng cùng lúc",
                    "Ổn định hơn vì chỉ một người dùng"
                ],
                [
                    "Bảo mật",
                    "Không nên nhập dữ liệu nhạy cảm",
                    "Phù hợp hơn cho dữ liệu cá nhân/công việc"
                ],
                [
                    "Chọn trên form",
                    "Loại gói -> Dùng chung + thời hạn",
                    "Loại gói -> Dùng riêng / chính chủ"
                ]
            ]
        },
        {
            type: "list",
            items: [
                "<strong>Chưa chắc cần Plus lâu dài?</strong> Chọn dùng chung 1 tháng.",
                "<strong>Đã quen Plus, dùng cả năm?</strong> Chọn dùng chung 12 tháng để tối ưu chi phí.",
                "<strong>Làm việc với tài liệu khách/code riêng?</strong> Chọn dùng riêng/chính chủ.",
                "<strong>Cần quota cao hơn Plus?</strong> Hỏi shop về Pro 5x/20x hoặc thử Plus chính chủ trước."
            ]
        },
        {
            id: "buy-guide",
            type: "heading",
            text: "Hướng dẫn mua và kích hoạt",
            toc: true
        },
        {
            type: "ordered-list",
            items: [
                "<strong>Chọn gói</strong> trong form phía trên, kiểm tra đúng loại gói và thời hạn.",
                "<strong>Bấm Mua ngay</strong> hoặc thêm vào giỏ hàng để tạo đơn.",
                "<strong>Thanh toán</strong> theo hướng dẫn của hệ thống/bot.",
                "<strong>Nhận tài khoản</strong> hoặc thông tin kích hoạt theo đơn hàng.",
                "<strong>Đăng nhập và kiểm tra</strong> quyền Plus/Pro; nếu có lỗi hãy giữ mã đơn để shop hỗ trợ."
            ]
        },
        {
            id: "warranty",
            type: "heading",
            text: "Bảo hành và chính sách hỗ trợ",
            toc: true
        },
        {
            type: "list",
            items: [
                "<strong>Bảo hành theo thời hạn gói</strong> nếu lỗi thuộc phạm vi shop xử lý.",
                "<strong>Đổi tài khoản/gói tương đương</strong> khi phát sinh lỗi đăng nhập hoặc lỗi sử dụng do phía cấp tài khoản.",
                "<strong>Hỗ trợ qua Zalo/Telegram</strong> trong khung giờ làm việc.",
                "<strong>Không tự ý đổi thông tin quan trọng</strong> nếu hướng dẫn gói yêu cầu giữ nguyên để bảo hành."
            ]
        }
    ];
}


function buildFAQ(item) {
    if (isChatGPTProduct(item)) {
        return [
            {
                question: "Mua ChatGPT Plus tại storetainguyen có dùng được ở Việt Nam không?",
                answer: "Có. Sau khi nhận thông tin tài khoản hoặc gói nâng cấp, bạn đăng nhập và sử dụng bình thường theo hướng dẫn của shop."
            },
            {
                question: "Có gói ChatGPT Plus vĩnh viễn không?",
                answer: "Không nên coi bất kỳ gói Plus nào là lifetime chính thức. ChatGPT Plus là dịch vụ thuê bao, nên gói dài hạn thực tế vẫn là gói theo thời hạn."
            },
            {
                question: "Dùng chung có an toàn không?",
                answer: "Dùng chung giúp tiết kiệm chi phí nhưng không phù hợp để nhập hợp đồng, mật khẩu, dữ liệu khách hàng hoặc code nhạy cảm. Nếu cần riêng tư, hãy chọn dùng riêng."
            },
            {
                question: "Dùng riêng / chính chủ là gì?",
                answer: "Đây là gói tài khoản riêng shop giao cho bạn sử dụng một mình hoặc gói được xử lý theo điều kiện riêng của sản phẩm. Bạn nên đọc đúng mô tả biến thể trước khi mua."
            },
            {
                question: "Pro 5x và Pro 20x nên chọn gói nào?",
                answer: "Pro 5x hợp người dùng nặng vừa phải như dev/researcher. Pro 20x hợp nhu cầu rất cao, dùng liên tục hoặc cần quota lớn hơn. Nếu chưa chắc, Plus chính chủ thường là điểm bắt đầu hợp lý."
            },
            {
                question: "ChatGPT Plus tạo được bao nhiêu ảnh?",
                answer: "Hạn mức tạo ảnh có thể thay đổi theo chính sách nền tảng và tải hệ thống. Plus phù hợp nhu cầu tạo ảnh hằng ngày, nhưng không nên xem là gói tạo ảnh bulk số lượng rất lớn."
            },
            {
                question: "Có gói 1 năm không?",
                answer: "Có thể có gói 12 tháng tùy loại biến thể và tình trạng hàng. Nếu trên form không chọn được, hãy liên hệ shop để kiểm tra."
            },
            {
                question: "Thanh toán xong bao lâu nhận được tài khoản?",
                answer: "Tùy luồng xử lý tự động và tình trạng hàng. Bạn nên giữ mã đơn để shop kiểm tra nhanh nếu quá thời gian dự kiến."
            },
            {
                question: "Nếu tài khoản lỗi hoặc bị khóa thì sao?",
                answer: "Shop hỗ trợ theo chính sách bảo hành của gói. Trường hợp lỗi thuộc phạm vi bảo hành sẽ được kiểm tra và xử lý đổi thông tin hoặc phương án tương đương."
            },
            {
                question: "Có nên mua kèm Claude AI hoặc Cursor AI không?",
                answer: "Nếu viết dài và phân tích tài liệu nhiều, Claude là lựa chọn đáng cân nhắc. Nếu code trong IDE thường xuyên, Cursor phù hợp hơn. ChatGPT vẫn là lựa chọn đa dụng nhất cho phần lớn nhu cầu."
            }
        ];
    }

    const profile =
        getServiceProfile(item);

    const name =
        item?.name || profile.label;

    return [
        {
            question: `${profile.label} dùng để làm gì?`,
            answer: `${escapeHTML(profile.label)} phù hợp cho nhu cầu ${escapeHTML(profile.purpose)}`
        },
        {
            question: "Sau khi thanh toán bao lâu thì nhận được thông tin?",
            answer: "Thông thường hệ thống sẽ xử lý nhanh qua luồng tự động hoặc kênh hỗ trợ. Nếu có phát sinh, bạn giữ mã đơn để shop kiểm tra."
        },
        {
            question: `${name} có được bảo hành không?`,
            answer: "Có. Sản phẩm được bảo hành theo thời hạn gói và điều kiện sử dụng đã công bố trên trang sản phẩm."
        },
        {
            question: "Tôi cần chuẩn bị thông tin gì trước khi mua?",
            answer: "Bạn nên chuẩn bị email, tên đăng nhập hoặc thông tin tài khoản cần nâng cấp nếu sản phẩm yêu cầu. Không chia sẻ mật khẩu nếu shop không cần để xử lý."
        }
    ];
}


function buildGeneratedReviews(item) {
    const profile =
        getServiceProfile(item);

    const service =
        profile.label;

    return [
        {
            id: 8,
            name: "Minh Anh",
            date: "08/08/2026",
            rating: 5,
            verified: true,
            text: `${service} dùng ổn, shop hướng dẫn rõ nên thao tác khá nhanh.`,
            tags: ["Giao nhanh", "Hỗ trợ tốt"],
            helpful: 3
        },
        {
            id: 7,
            name: "Quốc Huy",
            date: "07/08/2026",
            rating: 5,
            verified: true,
            text: `Giá hợp lý, cần hỗ trợ thì nhắn được phản hồi nhanh. Sẽ mua lại nếu cần gia hạn ${service}.`,
            tags: ["Đáng tiền"],
            helpful: 2
        },
        {
            id: 6,
            name: "Thanh Trúc",
            date: "06/08/2026",
            rating: 4,
            verified: true,
            text: "Lần đầu dùng cần đọc kỹ hướng dẫn, sau đó sử dụng bình thường.",
            tags: ["Hướng dẫn rõ"],
            helpful: 1
        },
        {
            id: 5,
            name: "Gia Bảo",
            date: "05/08/2026",
            rating: 5,
            verified: true,
            text: `Mua ${service} để phục vụ công việc, trải nghiệm tốt trong tầm giá.`,
            tags: ["Ổn định"],
            helpful: 1
        }
    ];
}


function buildReviewSummary(item) {
    const sold =
        Number(item?.sold || 0) || 500;

    const total =
        Math.max(
            Number(item?.reviewCount || 0) || 0,
            Math.min(1187, Math.round(sold * 0.12))
        );

    const five =
        Math.round(total * 0.72);

    const four =
        Math.round(total * 0.22);

    const three =
        Math.max(0, total - five - four);

    return {
        satisfaction: 96,
        totalPages: Math.max(1, Math.ceil(total / 10)),
        distribution: {
            5: five,
            4: four,
            3: three,
            2: 0,
            1: 0
        },
        mentions: [
            "Giao nhanh",
            "Hỗ trợ tốt",
            "Đáng tiền",
            "Hướng dẫn rõ"
        ]
    };
}


function buildRelatedProducts(item) {
    const allProducts =
        [
            ...Object.values(catalog || {}),
            ...Object.values(window.CATEGORY_CATALOG || {})
                .flatMap(category => category.products || [])
        ]
            .filter(candidate =>
                candidate &&
                candidate.slug &&
                candidate.slug !== item?.slug
            );

    const seen =
        new Set();

    const categorySlug =
        Object.values(window.CATEGORY_CATALOG || {})
            .find(category =>
                (category.products || [])
                    .some(productItem => productItem.slug === item?.slug)
            )
            ?.slug;

    return allProducts
        .filter(candidate => {
            if (seen.has(candidate.slug)) {
                return false;
            }

            seen.add(candidate.slug);

            if (!categorySlug) {
                return true;
            }

            return Object.values(window.CATEGORY_CATALOG || {})
                .find(category => category.slug === categorySlug)
                ?.products
                ?.some(productItem => productItem.slug === candidate.slug);
        })
        .slice(0, 4)
        .map(candidate => ({
            slug: candidate.slug,
            name: candidate.name,
            image: candidate.image,
            discount: candidate.discount || "",
            rating: candidate.rating || 4.8,
            sold: candidate.sold || "1,2k đã bán",
            price: candidate.price || getActiveDuration(candidate)?.price || 0,
            oldPrice: candidate.oldPrice || getActiveDuration(candidate)?.oldPrice || 0,
            outOfStock: candidate.outOfStock
        }));
}


function enrichProduct(item) {
    if (!item) {
        return item;
    }

    const enriched =
        {
            ...item
        };

    if (
        isChatGPTProduct(enriched)
        ||
        !enriched.content?.length ||
        enriched.content.length < 4 ||
        blocksLookCorrupted(enriched.content)
    ) {
        enriched.content =
            buildRichContent(enriched);
    }

    if (
        isChatGPTProduct(enriched)
        ||
        !enriched.faq?.length ||
        enriched.faq.length < 3 ||
        blocksLookCorrupted(enriched.faq)
    ) {
        enriched.faq =
            buildFAQ(enriched);
    }

    if (
        !enriched.reviews?.length ||
        enriched.reviews.length < 4 ||
        blocksLookCorrupted(enriched.reviews)
    ) {
        enriched.reviews =
            buildGeneratedReviews(enriched);
    }

    if (!enriched.reviewSummary) {
        enriched.reviewSummary =
            buildReviewSummary(enriched);
    }

    if (!enriched.related?.length) {
        enriched.related =
            buildRelatedProducts(enriched);
    }

    enriched.updated =
        enriched.updated && !textLooksCorrupted(enriched.updated)
            ? enriched.updated
            : "[Cập nhật lần cuối: Tháng 8/2026]";

    return enriched;
}


const product =
    enrichProduct(
        catalog[
            requestedSlug
        ]
        ||
        findCategoryProduct(
            requestedSlug
        )
        ||
        catalog[
            canonicalSlug
        ]
        ||
        findCategoryProduct(
            canonicalSlug
        )
        ||
        catalog[
            "chatgpt-plus"
        ]
    );


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
    Math.max(
        0,
        Math.ceil((Date.parse(product?.deal?.endsAt || "") - Date.now()) / 1000) || 0
    );


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
        " | storetainguyen";


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

    const description = $("#variantDescription");
    if (description) {
        description.textContent = selectedVariant?.description || "";
        description.style.display = description.textContent ? "" : "none";
    }

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

    const dealBox =
        $("#productDealBox");


    if (
        !deal
        ?.enabled
        ||
        !Number.isFinite(Date.parse(deal.endsAt || ""))
        ||
        Date.parse(deal.endsAt) <= Date.now()
    ) {

        dealBox
            .style.display =
            "none";

        return;

    }

    dealBox
        .style.display =
        "";

    countdownSeconds = Math.max(
        0,
        Math.ceil((Date.parse(deal.endsAt) - Date.now()) / 1000)
    );


    const soldPercent = Math.max(
        0,
        Math.min(
            100,
            Number.isFinite(
                Number(
                    deal.soldPercent
                )
            )
                ? Number(
                    deal.soldPercent
                )
                : 0
        )
    );
    const remaining = Math.max(
        0,
        Number.isFinite(
            Number(
                deal.remaining
            )
        )
            ? Number(
                deal.remaining
            )
            : 0
    );

    $("#dealProgressFill")
        .style.width =
        (
            soldPercent
            +
            "%"
        );


    $("#dealSoldText")
        .textContent =
        (
            "Đã bán "
            +
            soldPercent
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
                    remaining
                )
        );


    updateCountdown();

}


function updateCountdown() {

    const endsAt = Date.parse(product?.deal?.endsAt || "");
    countdownSeconds = Number.isFinite(endsAt)
        ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
        : 0;

    if (countdownSeconds <= 0) {
        $("#productDealBox").style.display = "none";
        return;
    }

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
                        "product.html?slug="
                        +
                        encodeURIComponent(
                            item.slug
                        );


                    return `
                        <a
                            class="related-card"
                            href="${href}"
                            ${
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
        ||
        reviewSort
        ===
        "highest"
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
        ||
        reviewSort
        ===
        "lowest"
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
        &&
        Number.isFinite(Date.parse(product.deal.endsAt || ""))
        &&
        Date.parse(product.deal.endsAt) > Date.now()
    ) {

        setInterval(
            () => {
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
