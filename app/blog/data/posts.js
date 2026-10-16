import { earnPosts } from "./earn";
// When the next batches are ready, add them here, for example:
// import { studyPosts } from "./study";
// import { resourcePosts } from "./resources";
// import { facultyPosts } from "./faculty";
// import { skillsPosts } from "./skills";

export const SITE = "https://lanlibrary.com";

export const CATEGORIES = [
  { name: "Study Smarter", blurb: "Exam preparation and study techniques for university students." },
  { name: "Earn From Knowledge", blurb: "Turn original academic work into digital products." },
  { name: "Academic Resources", blurb: "Past questions, course guides and study materials." },
  { name: "Faculty & Authors", blurb: "Publishing and teaching resources for lecturers and authors." },
  { name: "Student Skills", blurb: "Digital skills and entrepreneurship for students." },
];

// Every post automatically gets a cover image at /blog/<slug>.png
const withImage = (p) => ({
  ...p,
  image: `/blog/${p.slug}.png`,
  imageAlt: `Cover image for the article: ${p.title}`,
});

export const posts = [...earnPosts].map(withImage);

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
