import React, { useEffect, useState } from "react";
import Zoom from "@mui/material/Zoom";

function AutoHidden({ children, enable, hide = false, element = null }) {
    const [hidden, setHidden] = useState(false);
    const [prev, setPrev] = useState(window.scrollY);
    const [lastUpdate, setLastUpdate] = useState(window.scrollY);
    const show = 50;

    useEffect(() => {
        const handleNavigation = (e) => {
            const window = e.currentTarget;
            const current = element ? element.scrollTop : window.scrollY;

            if (prev > current) {
                if (lastUpdate - current > show) {
                    setLastUpdate(current);
                    setHidden(false);
                }
            } else if (prev < current) {
                if (current - lastUpdate > show) {
                    setLastUpdate(current);
                    setHidden(true);
                }
            }
            setPrev(current);
        };

        if (enable) {
            const target = element || window;
            target.addEventListener("scroll", handleNavigation);

            return () => {
                target.removeEventListener("scroll", handleNavigation);
            };
        }
    }, [enable, element, prev, lastUpdate, show]);

    return <Zoom in={!hidden && !hide}>{children}</Zoom>;
}

export default AutoHidden;
