(function () {
    const rails = document.querySelectorAll(".left-rail, .category-left-rail");
    let closeTimer = 0;
    const categoryRoutes = [
        ["cong cu ai", "cong-cu-ai"],
        ["hoc tap", "hoc-tap"],
        ["lam viec", "lam-viec"],
        ["giai tri", "giai-tri"],
        ["vpn", "vpn"],
        ["luu tru", "luu-tru"],
        ["anti virus", "anti-virus"],
        ["phan mem khac", "phan-mem-khac"]
    ];

    function normalizedLabel(link) {
        return `${link.getAttribute("title") || ""} ${link.textContent || ""}`
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replaceAll("đ", "d")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function wireKnownLinks() {
        document.querySelectorAll("a").forEach((link) => {
            const label = normalizedLabel(link);
            const category = categoryRoutes.find(([keyword]) => label.includes(keyword));

            if (category) {
                link.href = `category.html?slug=${category[1]}`;
                return;
            }

            if (link.getAttribute("href") !== "#") {
                return;
            }

            if (label.includes("zalo")) {
                link.href = "https://zalo.me/0924356579";
            } else if (label.includes("telegram")) {
                link.href = "https://t.me/0924356579";
            } else if (label.includes("hotline")) {
                link.href = "tel:0924356579";
            } else if (label.includes("support@storetainguyen.com")) {
                link.href = "mailto:support@storetainguyen.com";
            }
        });
    }

    function installImageFallbacks() {
        const fallback = "assets/images/storetainguyen-logo.png";
        const replaceBrokenImage = (image) => {
            if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied === "true") {
                return;
            }

            image.dataset.fallbackApplied = "true";
            image.src = fallback;
            image.style.objectFit = "contain";
        };

        document.addEventListener("error", (event) => replaceBrokenImage(event.target), true);
        document.querySelectorAll("img").forEach((image) => {
            if (image.complete && image.naturalWidth === 0) {
                replaceBrokenImage(image);
            }
        });
    }

    function firstRail() {
        return document.querySelector(".left-rail, .category-left-rail");
    }

    function openRail(rail) {
        window.clearTimeout(closeTimer);
        rail?.classList.add("is-expanded");
    }

    function closeRailSoon(rail, delay = 60) {
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
            if (!rail?.matches(":hover")) {
                rail?.classList.remove("is-expanded");
            }
        }, delay);
    }

    rails.forEach((rail) => {
        const menuButton = rail.querySelector("#railMenuButton");

        menuButton?.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                rail.classList.toggle("is-expanded");
            },
            true
        );

        rail.addEventListener("mouseenter", () => {
            openRail(rail);
        });

        rail.addEventListener("mouseleave", () => {
            closeRailSoon(rail);
        });
    });

    document.querySelectorAll("#categoryButton, #mobileCategoryButton").forEach((button) => {
        button.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                openRail(firstRail());
            },
            true
        );
    });

    wireKnownLinks();
    installImageFallbacks();
})();
