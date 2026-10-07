import React, { useEffect, useRef, useState } from "react";

/**
 * Fades its content up the first time it scrolls into view.
 * `delay` (ms) lets neighbours appear one after another.
 */
export default function Reveal({ as = "div", delay = 0, className = "", children, ...rest }) {
  const Tag = as;
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ "--delay": `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
