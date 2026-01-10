import React, { useEffect, useState } from "react";

const PageTransition = ({ children }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Reset visibility to trigger animation
        setVisible(false);
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, [children]); // Re-run when content (page) changes if key changes, but strictly we use wrapper logic

    return (
        <div className={`transition-all duration-500 ease-out transform ${visible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-4 blur-sm"}`}>
            {children}
        </div>
    );
};

export default PageTransition;
