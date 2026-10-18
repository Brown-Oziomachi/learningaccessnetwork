// Small helpers so article files stay short and readable.
export const intro = (text) => ({ type: "intro", text });
export const h = (text) => ({ type: "heading", text });
export const p = (text) => ({ type: "paragraph", text });
export const ul = (...items) => ({ type: "list", items });
export const ol = (...items) => ({ type: "steps", items });

export const SELLER = { label: "Explore the Seller Network", href: "/seller/network" };
export const FACULTY = { label: "Explore the Faculty Network", href: "/faculty/network" };
export const STUDENT = { label: "Browse study materials", href: "/documents" };