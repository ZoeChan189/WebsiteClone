(function () {
    const rails = document.querySelectorAll(".left-rail, .category-left-rail");
    let closeTimer = 0;

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
})();
