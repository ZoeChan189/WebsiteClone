"use strict";


window.PRODUCT_CATALOG = {


    /* ======================================================
       CHATGPT PLUS
    ====================================================== */

    "chatgpt-plus": {

        slug:
            "chatgpt-plus",

        name:
            "Tài khoản ChatGPT Plus & Pro (GPT-5.6)",

        shortName:
            "ChatGPT Plus & Pro (GPT-5.6)",

        metaTitle:
            "Mua ChatGPT Plus Giá Rẻ | Dùng Riêng & Chính Chủ",


        categoryPath: [

            {
                name:
                    "Trang chủ",

                url:
                    "index.html"
            },

            {
                name:
                    "Ứng dụng & Phần mềm khác",

                url:
                    "#"
            },

            {
                name:
                    "Công Cụ AI",

                url:
                    "#"
            }

        ],


        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/chatgpt-plus-pro.webp",


        discount:
            "-73%",


        rating:
            4.6,


        reviewCount:
            1817,


        satisfiedCount:
            1738,


        sold:
            10300,


        highRated:
            true,


        recentSale: {

            name:
                "Uyên",

            time:
                "2 phút trước"

        },


        /* ==================================================
           DEAL
        ================================================== */

        deal: {

            enabled:
                true,

            soldPercent:
                30,

            remaining:
                626,

            countdownSeconds:
                (
                    25 * 86400
                )
                +
                (
                    12 * 3600
                )
                +
                (
                    14 * 60
                )
                +
                52

        },


        /* ==================================================
           VARIANTS
        ================================================== */

        variantTitle:
            "Loại gói:",


        variants: [

            {

                id:
                    "shared-plus",

                label:
                    "Dùng chung - Plus",

                available:
                    true,


                durations: [

                    {

                        id:
                            "1m",

                        label:
                            "1 tháng",

                        price:
                            147510,

                        oldPrice:
                            499000

                    },


                    {

                        id:
                            "3m",

                        label:
                            "3 tháng",

                        price:
                            395010,

                        oldPrice:
                            1497000

                    },


                    {

                        id:
                            "6m",

                        label:
                            "6 tháng",

                        highlight:
                            "-17%",

                        price:
                            731610,

                        oldPrice:
                            2499000

                    },


                    {

                        id:
                            "12m",

                        label:
                            "12 tháng",

                        highlight:
                            "-30% · Phổ biến nhất",

                        price:
                            1236510,

                        oldPrice:
                            3499000

                    }

                ]

            },


            {

                id:
                    "private-plus",

                label:
                    "Dùng riêng - Plus",

                available:
                    true,


                durations: [

                    {

                        id:
                            "1m",

                        label:
                            "1 tháng",

                        price:
                            444510,

                        oldPrice:
                            527000

                    }

                ]

            },


            {

                id:
                    "pro-5x",

                label:
                    "Chính chủ - Pro 5x",

                available:
                    false,

                durations:
                    []

            },


            {

                id:
                    "pro-20x",

                label:
                    "Chính chủ - Pro 20x",

                available:
                    false,

                durations:
                    []

            }

        ],


        /* ==================================================
           TRUST STRIP
        ================================================== */

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
                    "1 đổi 1 trọn gói"

            },


            {

                icon:
                    "bi-arrow-return-left",

                title:
                    "Hoàn tiền",

                text:
                    "Nếu không giao được"

            },


            {

                icon:
                    "bi-chat",

                title:
                    "8h–22h",

                text:
                    "Hỗ trợ nhanh qua Zalo"

            }

        ],


        /* ==================================================
           PURCHASE NOTICE
        ================================================== */

        notice: [

            {

                html:
                    `
                    <strong>
                        Chọn loại Dùng riêng
                    </strong>
                    khi bạn cần tài khoản riêng một mình:
                    shop cấp tài khoản mới, bạn đổi được mật khẩu
                    và toàn quyền bảo mật.
                    `

            },


            {

                html:
                    `
                    <strong>
                        Chọn loại Dùng chung – Plus
                    </strong>
                    khi ưu tiên tiết kiệm:
                    một nhóm nhỏ dùng chung đăng nhập;
                    tránh nhập dữ liệu nhạy cảm.
                    `

            },


            {

                html:
                    `
                    Thông tin đăng nhập được gửi qua email
                    và trang đơn hàng sau thanh toán;
                    thời gian giao thường chỉ vài phút.
                    `

            },


            {

                html:
                    `
                    Tài khoản có đầy đủ tính năng theo gói;
                    hãy đọc kỹ mô tả biến thể trước khi đặt.
                    `

            },


            {

                html:
                    `
                    Bảo hành
                    <strong>
                        1 đổi 1
                    </strong>
                    trong thời hạn.
                    Trường hợp không thể khắc phục sẽ xử lý
                    theo chính sách hoàn tiền.
                    `

            },


            {

                html:
                    `
                    Gói không tự động gia hạn;
                    khi gần hết hạn bạn có thể chủ động
                    gia hạn tiếp.
                    `

            }

        ],


        /* ==================================================
           INTRO
        ================================================== */

        intro: [

            {

                type:
                    "html",

                html:
                    `
                    <p>
                        Bạn muốn dùng
                        <strong>
                            ChatGPT Plus
                        </strong>
                        với
                        <strong>
                            GPT-5.6
                        </strong>
                        mà không có thẻ quốc tế?
                        Chọn gói phù hợp phía trên;
                        giá và thời hạn sẽ thay đổi
                        theo biến thể.
                    </p>
                    `

            }

        ],


        /* ==================================================
           LONG CONTENT
        ================================================== */

        content: [


            /* ==============================
               PRICE TABLE
            ============================== */

            {

                id:
                    "price-table",

                type:
                    "heading",

                text:
                    "Bảng giá ChatGPT Plus tại Kho Tài Khoản cập nhật 7/2026",

                toc:
                    true

            },


            {

                type:
                    "table",

                headers: [
                    "Gói",
                    "Thời hạn",
                    "Giá tại KTK",
                    "OpenAI gốc"
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
                        "~529.000đ ($20)"
                    ],

                    [
                        "Plus dùng chung",
                        "3 tháng",
                        "399.000đ",
                        "~1.569.000đ"
                    ],

                    [
                        "Plus dùng chung",
                        "6 tháng",
                        "739.000đ",
                        "~3.129.000đ"
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

                type:
                    "callout",

                html:
                    `
                    Gói Plus chính chủ dài hạn và ChatGPT Pro
                    5x/20x hiện có thể tạm hết hàng —
                    các lựa chọn hết hàng sẽ bị khóa trên form.
                    `

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    <em>
                        Giá gốc chỉ để tham khảo.
                        Giá trên form đặt hàng là giá áp dụng
                        tại thời điểm bạn lựa chọn biến thể.
                    </em>
                    `

            },


            /* ==============================
               PRIVATE ACCOUNT
            ============================== */

            {

                id:
                    "private-account",

                type:
                    "heading",

                text:
                    "ChatGPT Plus dùng riêng (chính chủ) — ai nên chọn?",

                toc:
                    true

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    Gói
                    <strong>
                        dùng riêng
                    </strong>
                    phù hợp khi bạn muốn một tài khoản
                    chỉ mình sử dụng.
                    Shop giao tài khoản riêng để bạn đổi mật khẩu
                    và đăng nhập độc lập.
                    `

            },


            {

                type:
                    "list",

                items: [

                    "Làm freelance, marketing hoặc dev và dùng ChatGPT gần như mỗi ngày.",

                    "Có tài liệu khách hàng hoặc code riêng, không muốn để trên tài khoản dùng chung.",

                    "Muốn đồng bộ lịch sử giữa máy tính và điện thoại trên một tài khoản."

                ]

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    Nếu mới thử hoặc chỉ dùng vài lần mỗi tuần,
                    gói
                    <strong>
                        dùng chung
                    </strong>
                    thường tiết kiệm hơn.
                    Gói dùng riêng 1 tháng có mức giá tham khảo
                    <strong>
                        449.000đ
                    </strong>.
                    `

            },


            /* ==============================
               PRO
            ============================== */

            {

                id:
                    "pro-comparison",

                type:
                    "heading",

                text:
                    "ChatGPT Pro 5x vs 20x — khác gì Plus?",

                toc:
                    true

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    Gói
                    <strong>
                        Plus
                    </strong>
                    phù hợp đa số người dùng cá nhân.
                    Gói
                    <strong>
                        Pro
                    </strong>
                    hướng tới nhu cầu nặng hơn với quota
                    và context lớn hơn.
                    `

            },


            {

                type:
                    "list",

                items: [

                    "Pro 5x: phù hợp dev hoặc researcher dùng nặng nhưng chưa cần mức cao nhất.",

                    "Pro 20x: phù hợp power user, agency hoặc nhu cầu Agent / Deep Research liên tục."

                ]

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    <em>
                        Trong UI hiện tại,
                        Pro 5x và Pro 20x đang được đánh dấu hết hàng
                        nên không thể chọn trên form.
                    </em>
                    `

            },


            /* ==============================
               FEATURES
            ============================== */

            {

                id:
                    "features",

                type:
                    "heading",

                text:
                    "ChatGPT Plus có gì ở thời điểm hiện tại?",

                toc:
                    true

            },


            {

                id:
                    "gpt56",

                type:
                    "subheading",

                text:
                    "1. GPT-5.6 — Mô hình mới nhất của OpenAI",

                toc:
                    true

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    Gói Plus/Pro có các chế độ AI nâng cao
                    phục vụ viết lách, phân tích,
                    nghiên cứu và công việc nhiều bước.
                    `

            },


            {

                type:
                    "list",

                items: [

                    "GPT-5.6 Instant: ưu tiên tốc độ cho hỏi đáp và tác vụ thường ngày.",

                    "GPT-5.6 Thinking: ưu tiên suy luận sâu cho bài toán, code và phân tích phức tạp."

                ]

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    Context của Plus được trình bày
                    trong trang tham chiếu là
                    <strong>
                        32K token
                    </strong>.
                    `

            },


            {

                id:
                    "research-agent",

                type:
                    "subheading",

                text:
                    "2. Deep Research + Agent mode",

                toc:
                    true

            },


            {

                type:
                    "list",

                items: [

                    "Deep Research: tổng hợp nhiều nguồn và tạo báo cáo có cấu trúc.",

                    "Agent mode: hỗ trợ thực hiện chuỗi tác vụ nhiều bước trong môi trường công cụ."

                ]

            },


            {

                id:
                    "tools",

                type:
                    "subheading",

                text:
                    "3. Tạo ảnh, đọc tệp, Code Interpreter, Canvas",

                toc:
                    true

            },


            {

                type:
                    "list",

                items: [

                    "Tạo hình ảnh.",

                    "Đọc PDF, bảng tính, ảnh và code.",

                    "Code Interpreter cho xử lý dữ liệu và tính toán.",

                    "Không gian chỉnh sửa nội dung / code theo từng phần."

                ]

            },


            {

                id:
                    "pro-only",

                type:
                    "subheading",

                text:
                    "4. Có gì riêng ở gói Pro?",

                toc:
                    true

            },


            {

                type:
                    "list",

                items: [

                    "Quyền truy cập mô hình Pro ở gói tương ứng.",

                    "Context và quota cao hơn Plus.",

                    "Phù hợp công việc cường độ cao."

                ]

            },


            /* ==============================
               FREE / PLUS / PRO TABLE
            ============================== */

            {

                id:
                    "free-plus-pro",

                type:
                    "heading",

                text:
                    "So sánh nhanh Free vs Plus vs Pro (cập nhật 7/2026)",

                toc:
                    true

            },


            {

                type:
                    "table",

                headers: [
                    "Tiêu chí",
                    "Free",
                    "Plus",
                    "PRO"
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
                        "Giá OpenAI",
                        "$0",
                        "$20/tháng",
                        "$200/tháng"
                    ],

                    [
                        "Giá tại KTK (1 tháng)",
                        "–",
                        "từ 149K",
                        "tạm hết hàng"
                    ],

                    [
                        "GPT-5.6 Instant",
                        "Hạn chế",
                        "160 tin / 3h",
                        "Không giới hạn*"
                    ],

                    [
                        "GPT-5.6 Thinking",
                        "Không",
                        "3.000 tin/tuần",
                        "Không giới hạn*"
                    ],

                    [
                        "GPT-5.6 Pro",
                        "Không",
                        "Không",
                        "Có"
                    ],

                    [
                        "Context window",
                        "16K",
                        "32K",
                        "128K (Thinking 409K)"
                    ],

                    [
                        "Deep Research + Agent",
                        "Hạn chế",
                        "Có",
                        "Mở rộng"
                    ],

                    [
                        "Custom GPTs, Projects, Tasks",
                        "Không",
                        "Có",
                        "Có (mở rộng)"
                    ]

                ]

            },


            /* ==============================
               SHARED VS PRIVATE
            ============================== */

            {

                id:
                    "shared-vs-private",

                type:
                    "heading",

                text:
                    "Dùng chung hay dùng riêng (chính chủ) — nên chọn gói nào?",

                toc:
                    true

            },


            {

                type:
                    "table",

                headers: [
                    "Tiêu chí",
                    "Dùng chung",
                    "Dùng riêng / chính chủ"
                ],

                headerClasses: [
                    "dark",
                    "slate",
                    "green-dark"
                ],

                highlightColumns: [
                    2
                ],

                rows: [

                    [
                        "Ai nên chọn?",
                        "Mới thử Plus, dùng vài lần/tuần, sinh viên, ngân sách eo",
                        "Dùng gần như mỗi ngày – freelancer, marketing, dev, tài liệu khách hàng"
                    ],

                    [
                        "Cách hoạt động",
                        "Shop gửi email + mật khẩu — đăng nhập ChatGPT",
                        "Shop giao tài khoản riêng — bạn đổi pass, chỉ một người dùng"
                    ],

                    [
                        "Tính năng Plus",
                        "Đủ các tính năng của gói",
                        "Giống dùng chung"
                    ],

                    [
                        "Lịch sử chat",
                        "Tách theo trình duyệt / môi trường sử dụng",
                        "Chỉ mình bạn dùng tài khoản"
                    ],

                    [
                        "Bảo mật",
                        "Không lưu dữ liệu nhạy cảm trên tài khoản chung",
                        "Cao hơn vì tài khoản riêng"
                    ],

                    [
                        "Giá tại shop",
                        "149K/tháng · 399K/3T · 739K/6T · 1.249K/12T",
                        "449K/tháng"
                    ],

                    [
                        "Chọn trên form",
                        "Loại gói → Dùng chung + thời hạn",
                        "Loại gói → Dùng riêng / chính chủ"
                    ]

                ]

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    <strong>
                        Chọn trong 10 giây:
                    </strong>
                    nếu mới thử chọn 1 tháng dùng chung;
                    nếu dùng lâu chọn 12 tháng;
                    nếu làm việc với dữ liệu riêng
                    chọn dùng riêng.
                    `

            },


            /* ==============================
               GUIDE
            ============================== */

            {

                id:
                    "buy-guide",

                type:
                    "heading",

                text:
                    "Hướng dẫn mua và kích hoạt",

                toc:
                    true

            },


            {

                type:
                    "ordered-list",

                items: [

                    "Chọn gói và thời hạn trên form phía trên.",

                    "Bấm Mua ngay hoặc thêm vào giỏ hàng.",

                    "Hoàn tất phương thức thanh toán mà shop hỗ trợ.",

                    "Nhận thông tin tài khoản theo hướng dẫn của đơn hàng và đổi mật khẩu nếu là gói riêng."

                ]

            },


            /* ==============================
               WARRANTY
            ============================== */

            {

                id:
                    "warranty",

                type:
                    "heading",

                text:
                    "Bảo hành & chính sách tại Kho Tài Khoản",

                toc:
                    true

            },


            {

                type:
                    "list",

                items: [

                    "Bảo hành 1 đổi 1 trong thời gian thuê bao theo điều kiện của gói.",

                    "Hỗ trợ đổi trả khi sản phẩm không sử dụng được do lỗi thuộc phía shop.",

                    "Hỗ trợ khách hàng trong khung giờ hoạt động của shop."

                ]

            }

        ],


        /* ==================================================
           FAQ
        ================================================== */

        faq: [

            {

                question:
                    "Mua ChatGPT Plus ở Kho Tài Khoản có dùng được tại Việt Nam không?",

                answer:
                    "Trang tham chiếu mô tả rằng tài khoản được giao có thể đăng nhập và sử dụng tại Việt Nam; hãy đọc điều kiện của biến thể trước khi mua."

            },


            {

                question:
                    "Có gói ChatGPT Plus “vĩnh viễn” không?",

                answer:
                    "Không có lựa chọn lifetime trong form. Thời hạn dài nhất đang được mô phỏng ở template này là 12 tháng."

            },


            {

                question:
                    "Loại “Dùng chung” có an toàn không? Bao nhiêu người dùng cùng tài khoản?",

                answer:
                    "Dùng chung có chi phí thấp hơn nhưng không nên lưu dữ liệu nhạy cảm. Số người chia sẻ và điều kiện sử dụng nên được ghi rõ trong mô tả của shop."

            },


            {

                question:
                    "Thanh toán bằng cách nào? Có hoá đơn VAT không?",

                answer:
                    "Phần thanh toán sẽ được nối với checkout/backend sau. UI hiện tại mới mô phỏng trang sản phẩm."

            },


            {

                question:
                    "Nếu OpenAI khoá tài khoản thì sao?",

                answer:
                    "Trang tham chiếu có chính sách bảo hành hoặc đổi tài khoản theo điều kiện cụ thể của gói."

            },


            {

                question:
                    "ChatGPT Plus giá bao nhiêu tại shop?",

                answer:
                    "Giá thay đổi theo loại gói và thời hạn. Form phía trên tự cập nhật giá theo biến thể đang chọn."

            },


            {

                question:
                    "Dùng riêng / chính chủ là gì?",

                answer:
                    "Trong cấu trúc sản phẩm này, dùng riêng là tài khoản riêng được giao để một người sử dụng và có thể đổi mật khẩu."

            },


            {

                question:
                    "Pro 5x vs 20x nên chọn gói nào?",

                answer:
                    "Pro 5x hướng tới nhu cầu cao hơn Plus; Pro 20x phù hợp người dùng rất nặng. Hai biến thể đang khóa trong UI khi hết hàng."

            },


            {

                question:
                    "ChatGPT Plus tạo được bao nhiêu ảnh?",

                answer:
                    "Hạn mức có thể thay đổi theo chính sách dịch vụ tại từng thời điểm; trang bán hàng nên tránh hứa một con số cố định nếu nhà cung cấp không công bố cố định."

            },


            {

                question:
                    "Có gói 1 năm không?",

                answer:
                    "Có biến thể 12 tháng trong template sản phẩm khi gói đó còn hàng."

            },


            {

                question:
                    "Có nên mua kèm Claude AI / Cursor AI / ChatGPT Go không?",

                answer:
                    "Tùy nhu cầu: viết dài có thể cân nhắc Claude, code trong IDE có thể cân nhắc Cursor, còn nhu cầu nhẹ hơn có thể chọn gói rẻ hơn."

            }

        ],


        updated:
            "[Cập nhật lần cuối: Tháng 7/2026]",


        /* ==================================================
           RELATED PRODUCTS
        ================================================== */

        related: [

            {

                slug:
                    "elevenlabs-ai",

                name:
                    "Tài khoản ElevenLabs AI",

                image:
                    "https://khotaikhoan.net/wp-content/uploads/2024/12/Elevenlabs-1-768x768.webp",

                discount:
                    "-37%",

                rating:
                    5.0,

                sold:
                    "9,6k đã bán",

                price:
                    399000,

                oldPrice:
                    null,

                outOfStock:
                    false

            },


            {

                slug:
                    "suno-ai",

                name:
                    "Nâng Cấp Tài Khoản Suno AI",

                image:
                    "https://khotaikhoan.net/wp-content/uploads/2026/05/suno-ai-pro-premier-768x768.webp",

                discount:
                    "-38%",

                rating:
                    4.6,

                sold:
                    "9k đã bán",

                price:
                    246435,

                oldPrice:
                    399000,

                outOfStock:
                    true

            },


            {

                slug:
                    "copy-ai",

                name:
                    "Tài khoản Copy.ai",

                image:
                    "https://khotaikhoan.net/wp-content/uploads/2026/05/copy-ai-768x768.webp",

                discount:
                    "-30%",

                rating:
                    4.9,

                sold:
                    "7,1k đã bán",

                price:
                    859000,

                oldPrice:
                    1229000,

                outOfStock:
                    false

            },


            {

                slug:
                    "tempo-labs-ai",

                name:
                    "Nâng Cấp Tài Khoản Tempo Labs AI",

                image:
                    "https://khotaikhoan.net/wp-content/uploads/2025/08/Nang-cap-tai-khoan-Tempo-Labs_-768x768.webp",

                discount:
                    "-32%",

                rating:
                    4.6,

                sold:
                    "10,9k đã bán",

                price:
                    519000,

                oldPrice:
                    null,

                outOfStock:
                    false

            },


            {

                slug:
                    "midjourney",

                name:
                    "Tài khoản Midjourney",

                image:
                    "https://khotaikhoan.net/wp-content/uploads/2026/05/midjourney-ai-768x768.webp",

                discount:
                    "-52%",

                rating:
                    4.6,

                sold:
                    "11,7k đã bán",

                price:
                    307203,

                oldPrice:
                    649000,

                outOfStock:
                    true

            }

        ],


        /* ==================================================
           REVIEW SUMMARY
        ================================================== */

        reviewSummary: {

            satisfaction:
                96,

            totalPages:
                182,


            distribution: {

                5:
                    1150,

                4:
                    588,

                3:
                    79,

                2:
                    0,

                1:
                    0

            },


            mentions: [

                {

                    text:
                        "Giá hợp lý",

                    count:
                        2

                },

                {

                    text:
                        "Giao nhanh",

                    count:
                        2

                },

                {

                    text:
                        "Hỗ trợ tốt",

                    count:
                        2

                }

            ]

        },


        /* ==================================================
           REVIEWS
        ================================================== */

        reviews: [

            {

                id:
                    79154,

                name:
                    "Đinh Thành Khôi",

                rating:
                    4,

                date:
                    "16/05/2026",

                wordCount:
                    19,

                text:
                    "ChatGPT Plus & Pro đủ xài. App mobile thiếu vài tùy chọn. Vẫn recommend.",

                verified:
                    true,

                helpful:
                    2,

                tags:
                    []

            },


            {

                id:
                    11567,

                name:
                    "Quỳnh blogger",

                rating:
                    4,

                date:
                    "15/05/2026",

                wordCount:
                    21,

                text:
                    "Lần đầu mua ở đây, tối thứ 7 phản hồi chậm hơn, ổn cho giá này.",

                verified:
                    true,

                helpful:
                    0,

                tags: [
                    "Cần cải thiện tốc độ",
                    "Cần hỗ trợ thêm"
                ]

            },


            {

                id:
                    11566,

                name:
                    "Võ Đức Thành",

                rating:
                    5,

                date:
                    "15/05/2026",

                wordCount:
                    28,

                text:
                    "Giao nhanh, không phải chờ lâu; hỗ trợ viết lách nhanh hơn hẳn. Xài tiếp dài dài.",

                verified:
                    true,

                helpful:
                    0,

                tags: [
                    "Giao nhanh",
                    "Hỗ trợ tốt"
                ]

            },


            {

                id:
                    79153,

                name:
                    "Võ Anh Tùng",

                rating:
                    4,

                date:
                    "14/05/2026",

                wordCount:
                    24,

                text:
                    "Dùng được nhưng lần đầu cần nhắn shop thêm. Nhìn chung tổng thể ổn.",

                verified:
                    true,

                helpful:
                    0,

                tags:
                    []

            },


            {

                id:
                    11565,

                name:
                    "Hoàng Thị Lan",

                rating:
                    5,

                date:
                    "14/05/2026",

                wordCount:
                    19,

                text:
                    "Nhận acc trong vài phút, hỗ trợ viết lách nhanh hơn hẳn.",

                verified:
                    true,

                helpful:
                    0,

                tags: [
                    "Giao nhanh",
                    "Hỗ trợ tốt"
                ]

            },


            {

                id:
                    11564,

                name:
                    "Mai Thanh Tùng",

                rating:
                    4,

                date:
                    "14/05/2026",

                wordCount:
                    34,

                text:
                    "Nhìn chung ổn, phù hợp sinh viên và dân văn phòng; acc dùng chung đôi khi phải đợi slot nhưng không ảnh hưởng nhiều.",

                verified:
                    true,

                helpful:
                    0,

                tags:
                    []

            }

        ]

    },


    "canva-pro": {

        slug:
            "canva-pro",

        name:
            "Tài khoản Canva Pro",

        shortName:
            "Canva Pro",

        metaTitle:
            "Mua Canva Pro Giá Rẻ — Chính Chủ",

        categoryPath: [
            {
                name:
                    "Trang chủ",
                url:
                    "index.html"
            },
            {
                name:
                    "Công cụ thiết kế",
                url:
                    "category.html?slug=cong-cu-ai"
            }
        ],

        image:
            "https://khotaikhoan.net/wp-content/uploads/2026/05/canva-pro-800x800.webp",

        discount:
            "-75%",

        rating:
            4.6,

        reviewCount:
            1248,

        satisfiedCount:
            1198,

        sold:
            5400,

        highRated:
            true,

        recentSale: {
            name:
                "An",
            time:
                "3 phút trước"
        },

        deal: {
            enabled:
                true,
            soldPercent:
                64,
            remaining:
                288,
            countdownSeconds:
                9 * 86400 + 8 * 3600 + 25 * 60
        },

        variantTitle:
            "Loại gói:",

        variants: [
            {
                id:
                    "private",
                label:
                    "Dùng riêng",
                available:
                    true,
                durations: [
                    {
                        id:
                            "12m",
                        label:
                            "12 tháng",
                        price:
                            189050,
                        oldPrice:
                            479000
                    },
                    {
                        id:
                            "6m",
                        label:
                            "6 tháng",
                        price:
                            119000,
                        oldPrice:
                            299000
                    }
                ]
            },
            {
                id:
                    "team",
                label:
                    "Team bản quyền",
                available:
                    true,
                durations: [
                    {
                        id:
                            "12m",
                        label:
                            "12 tháng",
                        price:
                            189050,
                        oldPrice:
                            479000
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
                    "1 đổi 1 trọn gói"
            },
            {
                icon:
                    "bi-arrow-return-left",
                title:
                    "Hoàn tiền",
                text:
                    "Nếu không giao được"
            },
            {
                icon:
                    "bi-chat",
                title:
                    "8h–22h",
                text:
                    "Hỗ trợ nhanh qua Zalo"
            }
        ],

        notice: [
            {
                html:
                    "<strong>Cách kích hoạt:</strong> sau khi thanh toán, shop gửi link mời vào email của bạn để tham gia Team bản quyền, dùng được ngay sau 1–3 phút."
            },
            {
                html:
                    "<strong>Full tính năng Canva Pro</strong> qua Team bản quyền: project ở chế độ riêng tư, Brand Kit dùng theo quyền gói."
            },
            {
                html:
                    "<strong>Bảo hành theo gói:</strong> lỗi phát sinh shop xử lý nhanh trong thời hạn sử dụng."
            }
        ],

        intro: [
            {
                type:
                    "html",
                html:
                    "<p>Canva Pro phù hợp cho thiết kế social, banner, video ngắn, tài liệu marketing và làm việc nhóm với kho template, ảnh, video, font và công cụ AI cao cấp.</p>"
            }
        ],

        content: [
            {
                id:
                    "features",
                type:
                    "heading",
                text:
                    "Canva Pro có gì nổi bật?",
                toc:
                    true
            },
            {
                type:
                    "list",
                items: [
                    "Hơn 100 triệu tài nguyên thiết kế premium.",
                    "Xóa nền 1 click và công cụ Magic Design.",
                    "Brand Kit, font thương hiệu và thư viện mẫu chuyên nghiệp.",
                    "Lưu trữ đám mây và chia sẻ làm việc nhóm."
                ]
            },
            {
                id:
                    "buy-guide",
                type:
                    "heading",
                text:
                    "Hướng dẫn mua Canva Pro",
                toc:
                    true
            },
            {
                type:
                    "ordered-list",
                items: [
                    "Chọn loại gói và thời hạn.",
                    "Nhập email Canva hoặc tick cấp tài khoản riêng tư.",
                    "Bấm Thêm vào giỏ hàng hoặc Mua ngay.",
                    "Shop gửi thông tin kích hoạt qua email/Zalo sau thanh toán."
                ]
            }
        ],

        faq: [
            {
                question:
                    "Canva Pro có dùng được trên tài khoản của tôi không?",
                answer:
                    "Có. Bạn nhập email Canva để shop gửi lời mời nâng cấp theo gói phù hợp."
            },
            {
                question:
                    "Dự án thiết kế của tôi có riêng tư không?",
                answer:
                    "Dự án cá nhân vẫn nằm trong tài khoản của bạn; chỉ nên chia sẻ nội dung khi bạn chủ động cấp quyền."
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
                58,
            distribution: {
                5: 930,
                4: 270,
                3: 48,
                2: 0,
                1: 0
            },
            mentions: [
                {
                    text:
                        "Dễ kích hoạt",
                    count:
                        7
                },
                {
                    text:
                        "Giá tốt",
                    count:
                        6
                }
            ]
        },

        reviews: [
            {
                id:
                    301,
                name:
                    "Minh Anh",
                rating:
                    5,
                date:
                    "08/08/2026",
                wordCount:
                    18,
                text:
                    "Canva Pro kích hoạt nhanh, dùng template và xóa nền ổn.",
                verified:
                    true,
                helpful:
                    3,
                tags: [
                    "Kích hoạt nhanh"
                ]
            },
            {
                id:
                    302,
                name:
                    "Hoàng Nam",
                rating:
                    4,
                date:
                    "06/08/2026",
                wordCount:
                    14,
                text:
                    "Giá tốt, shop hướng dẫn rõ. Dùng thiết kế social rất tiện.",
                verified:
                    true,
                helpful:
                    1,
                tags:
                    []
            }
        ]

    },


    /* ======================================================
       YOUTUBE PREMIUM
       MẪU ĐỂ TEST ENGINE DYNAMIC
    ====================================================== */

    "youtube-premium": {

        slug:
            "youtube-premium",

        name:
            "YouTube Premium",

        shortName:
            "YouTube Premium",

        metaTitle:
            "YouTube Premium",


        categoryPath: [

            {

                name:
                    "Trang chủ",

                url:
                    "index.html"

            },

            {

                name:
                    "Tài khoản Giải trí",

                url:
                    "#"

            }

        ],


        image:
            "assets/images/youtube-premium.webp",


        discount:
            "-60%",


        rating:
            4.8,


        reviewCount:
            932,


        satisfiedCount:
            891,


        sold:
            7100,


        highRated:
            true,


        recentSale: {

            name:
                "Minh",

            time:
                "5 phút trước"

        },


        deal: {

            enabled:
                true,

            soldPercent:
                62,

            remaining:
                214,

            countdownSeconds:
                (
                    7 * 86400
                )
                +
                (
                    9 * 3600
                )
                +
                (
                    34 * 60
                )

        },


        variantTitle:
            "Loại gói:",


        variants: [

            {

                id:
                    "upgrade-own",

                label:
                    "Nâng cấp chính chủ",

                available:
                    true,


                durations: [

                    {

                        id:
                            "1m",

                        label:
                            "1 tháng",

                        price:
                            49000,

                        oldPrice:
                            129000

                    },


                    {

                        id:
                            "3m",

                        label:
                            "3 tháng",

                        price:
                            129000,

                        oldPrice:
                            387000

                    },


                    {

                        id:
                            "6m",

                        label:
                            "6 tháng",

                        highlight:
                            "Tiết kiệm",

                        price:
                            239000,

                        oldPrice:
                            774000

                    },


                    {

                        id:
                            "12m",

                        label:
                            "12 tháng",

                        highlight:
                            "Phổ biến nhất",

                        price:
                            429000,

                        oldPrice:
                            1548000

                    }

                ]

            },


            {

                id:
                    "ready-account",

                label:
                    "Tài khoản có sẵn",

                available:
                    true,


                durations: [

                    {

                        id:
                            "1m",

                        label:
                            "1 tháng",

                        price:
                            39000,

                        oldPrice:
                            99000

                    }

                ]

            }

        ],


        benefits: [

            {

                icon:
                    "bi-play-circle",

                title:
                    "Không quảng cáo",

                text:
                    "Xem video liền mạch"

            },


            {

                icon:
                    "bi-music-note-beamed",

                title:
                    "YouTube Music",

                text:
                    "Nghe nhạc Premium"

            },


            {

                icon:
                    "bi-download",

                title:
                    "Tải offline",

                text:
                    "Xem khi không có mạng"

            },


            {

                icon:
                    "bi-shield-check",

                title:
                    "Bảo hành",

                text:
                    "Theo thời hạn gói"

            }

        ],


        notice: [

            {

                html:
                    `
                    <strong>
                        Kiểm tra tài khoản
                    </strong>
                    trước khi đặt nếu gói yêu cầu nâng cấp
                    trên tài khoản hiện tại.
                    `

            },


            {

                html:
                    `
                    <strong>
                        Chọn đúng loại gói
                    </strong>
                    theo nhu cầu sử dụng cá nhân
                    hoặc tài khoản có sẵn.
                    `

            }

        ],


        intro: [

            {

                type:
                    "html",

                html:
                    `
                    <p>
                        YouTube Premium cung cấp trải nghiệm
                        xem video không quảng cáo,
                        phát nền, tải offline
                        và YouTube Music Premium.
                    </p>
                    `

            }

        ],


        content: [

            {

                id:
                    "yt-features",

                type:
                    "heading",

                text:
                    "YouTube Premium có những gì?",

                toc:
                    true

            },


            {

                type:
                    "list",

                items: [

                    "Không quảng cáo",

                    "Phát nền",

                    "Tải video offline",

                    "YouTube Music Premium"

                ]

            },


            {

                id:
                    "yt-guide",

                type:
                    "heading",

                text:
                    "Hướng dẫn chọn gói",

                toc:
                    true

            },


            {

                type:
                    "paragraph",

                html:
                    `
                    Chọn loại gói và thời hạn,
                    sau đó thêm vào giỏ
                    hoặc bấm Mua ngay.
                    `

            }

        ],


        faq: [

            {

                question:
                    "Có dùng tài khoản hiện tại được không?",

                answer:
                    "Có nếu bạn chọn biến thể nâng cấp chính chủ và sản phẩm hỗ trợ hình thức đó."

            },


            {

                question:
                    "Có YouTube Music Premium không?",

                answer:
                    "Có trong quyền lợi của YouTube Premium theo gói tương ứng."

            }

        ],


        updated:
            "[Cập nhật lần cuối: Tháng 8/2026]",


        related:
            [],


        reviewSummary: {

            satisfaction:
                97,

            totalPages:
                40,


            distribution: {

                5:
                    681,

                4:
                    201,

                3:
                    50,

                2:
                    0,

                1:
                    0

            },


            mentions: [

                {

                    text:
                        "Không quảng cáo",

                    count:
                        8

                },

                {

                    text:
                        "Giá tốt",

                    count:
                        6

                },

                {

                    text:
                        "Kích hoạt nhanh",

                    count:
                        5

                }

            ]

        },


        reviews: [

            {

                id:
                    2,

                name:
                    "Nguyễn Minh",

                rating:
                    5,

                date:
                    "05/08/2026",

                wordCount:
                    12,

                text:
                    "Kích hoạt nhanh, xem video không quảng cáo ổn.",

                verified:
                    true,

                helpful:
                    4,

                tags: [
                    "Kích hoạt nhanh"
                ]

            },


            {

                id:
                    1,

                name:
                    "Trần Hoàng",

                rating:
                    4,

                date:
                    "03/08/2026",

                wordCount:
                    8,

                text:
                    "Dùng ổn, YouTube Music tiện.",

                verified:
                    true,

                helpful:
                    2,

                tags:
                    []

            }

        ]

    }

};


console.log(
    "PRODUCT_CATALOG V2 loaded",
    Object.keys(
        window.PRODUCT_CATALOG
    )
);
