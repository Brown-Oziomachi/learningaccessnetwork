import { earnPosts } from "./earn";
import { studyPosts } from "./study";
import { resourcePosts } from "./resources";
import { facultyPosts } from "./faculty";
import { skillsPosts } from "./skills";

export const SITE = "https://lanlibrary.com";

// icon + accent colour drive the cover art, the filter chips and the section headers
export const CATEGORIES = [
    { name: "Study Smarter", icon: "📚", accent: "#5ad1c0", blurb: "Exam preparation and study techniques for university students across Africa." },
    { name: "Earn From Knowledge", icon: "💰", accent: "#d4aa5a", blurb: "Turn original academic work into digital products." },
    { name: "Academic Resources", icon: "🗂️", accent: "#7fb0ff", blurb: "Past questions, course guides and study materials." },
    { name: "Faculty & Authors", icon: "🎓", accent: "#f08fb4", blurb: "Publishing and teaching resources for lecturers and authors." },
    { name: "Student Skills", icon: "🚀", accent: "#ff9f68", blurb: "Digital skills and entrepreneurship for students." },
];

export const catMeta = (name) => CATEGORIES.find((c) => c.name === name) || CATEGORIES[0];

// Featured post first, then all categories
export const posts = [...earnPosts, ...studyPosts, ...resourcePosts, ...facultyPosts, ...skillsPosts];

export const getPost = (slug) => posts.find((p) => p.slug === slug) || null;

// Same-category posts first, then others, never the post itself
export const getRelated = (slug, n = 3) => {
    const me = getPost(slug);
    if (!me) return [];
    const rest = posts.filter((p) => p.slug !== slug);
    const same = rest.filter((p) => p.category === me.category);
    const other = rest.filter((p) => p.category !== me.category);
    return [...same, ...other].slice(0, n);
};