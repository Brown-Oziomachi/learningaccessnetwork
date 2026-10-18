// Category: Academic Resources (10 articles). Written for students across Africa.
import { intro, h, p, ul, ol, STUDENT } from "./helpers";
const CAT = "Academic Resources";

export const resourcePosts = [
    {
        slug: "find-university-past-questions-for-your-department",
        category: CAT,
        title: "How to Find University Past Questions for Your Department",
        description: "Where to look for genuine past questions and past papers, and how to check that they are real and relevant.",
        date: "2026-09-20",
        readTime: "5 min read",
        cta: STUDENT,
        content: [
            intro("Past questions help you understand how your courses are examined. But not every document labelled as a past question is genuine. This guide shows where to look and how to avoid being misled."),
            h("Start with official and trusted sources"),
            ul("Your department office, course representatives and lecturers", "Your university library, which may keep archives of past papers", "Senior students who are willing to share their own practice material", "Study material marketplaces such as LAN Library, where sellers describe what their documents contain"),
            h("Check before you rely on a document"),
            ol("Confirm the course code and level match your course", "Check the year or session if it is stated, and be cautious if it is not", "Look at the quality: clear formatting and complete questions", "Read the description to see whether answers or solutions are included", "Compare a few questions with your syllabus to confirm they fit"),
            h("A note on honesty"),
            p("Be cautious of any seller or group that promises the exact questions for an upcoming exam. Real preparation is built on practice and understanding, not on promises that sound too good to be true.")
        ]
    },
    {
        slug: "how-to-use-past-questions-effectively-before-an-examination",
        category: CAT,
        title: "How to Use Past Questions Effectively Before an Examination",
        description: "A practical routine for turning past questions into real exam readiness instead of memorised answers.",
        date: "2026-09-21",
        readTime: "5 min read",
        cta: STUDENT,
        content: [
            intro("Having past questions is not the same as using them well. The value comes from how you practise. Here is a simple routine that works for most courses."),
            h("The practice loop"),
            ol("Choose one topic and attempt related questions without notes", "Set a timer to match real exam conditions", "Check your answers against your notes or a marking guide", "Record every error and the reason you made it", "Revise the weak concept, then retry similar questions"),
            h("Tracking progress"),
            ul("Keep a notebook of mistakes you tend to repeat", "Mark topics as red, amber or green based on your confidence", "Repeat red topics every few days until they turn green"),
            p("Past questions work best when combined with your lecture notes, textbooks and good study guides. They are one tool in a larger plan.")
        ]
    },
    {
        slug: "why-students-should-practice-past-questions-before-exam-week",
        category: CAT,
        title: "Why Students Should Practice Past Questions Before Exam Week",
        description: "Practising early reveals weak spots while there is still time to fix them.",
        date: "2026-09-22",
        readTime: "5 min read",
        cta: STUDENT,
        content: [
            intro("Many students open past questions for the first time in exam week, when it is too late to fix what they discover. Practising earlier turns surprises into a study plan."),
            h("Benefits of early practice"),
            ul("You learn how questions are phrased and how long answers should be", "You discover weak topics while there is time to improve", "You build speed and confidence", "You reduce anxiety because the format feels familiar"),
            h("How early is early?"),
            p("Start practising questions after each topic is covered, not only at the end. By the last month you should already have completed a large share of the practice material."),
            h("A short weekly routine"),
            ol("Monday to Thursday: study new content", "Friday: attempt questions on that week's topics", "Saturday: review mistakes and fix them", "Sunday: rest and plan next week")
        ]
    },
    {
        slug: "how-to-prepare-for-biology-examinations-at-university",
        category: CAT,
        title: "How to Prepare for Biology Examinations at University",
        description: "Learn how to study biology effectively with diagrams, processes and practice questions.",
        date: "2026-09-23",
        readTime: "6 min read",
        cta: STUDENT,
        content: [
            intro("University biology mixes memorisation with understanding. You need to know terms and also explain processes. Preparation works best when you study visually and test yourself often."),
            h("Study methods that suit biology"),
            ul("Draw and label diagrams from memory, such as cell structures or the Krebs cycle", "Use flashcards for terminology and classification", "Explain processes aloud, step by step", "Link topics together, for example how genetics connects to evolution"),
            h("Prepare in five steps"),
            ol("List all topics from the course outline", "Create a one-page summary for each topic", "Practise diagram questions and short answers", "Attempt essay questions with a clear structure", "Revise using flashcards in the last week"),
            h("Using resources"),
            p("Search LAN Library for biology study guides, notes and practice questions. Always check that a document's course level and content match your syllabus before relying on it.")
        ]
    },
    {
        slug: "how-to-study-chemistry-effectively-at-university",
        category: CAT,
        title: "How to Study Chemistry Effectively at University",
        description: "Understand concepts, practise calculations and prepare for both theory and practical exams.",
        date: "2026-09-24",
        readTime: "6 min read",
        cta: STUDENT,
        content: [
            intro("Chemistry rewards understanding more than memorising. Once you see why reactions behave as they do, the facts connect. The key is steady practice."),
            h("Build the foundation"),
            p("Make sure you understand atomic structure, bonding and the mole concept. Many later topics depend on these basics."),
            h("Study approach"),
            ul("Practise calculations daily, even for ten minutes", "Learn reaction mechanisms by drawing them repeatedly", "Make summary tables for functional groups and reactions", "Review practical procedures and safety rules before lab sessions"),
            h("Weekly routine"),
            ol("Review the week's lecture topics", "Solve at least five problems per topic", "Check your answers and correct errors", "Summarise key points in a one-page sheet", "Ask for help on anything unclear before the next lecture")
        ]
    },
    {
        slug: "how-to-prepare-for-computer-science-examinations",
        category: CAT,
        title: "How to Prepare for Computer Science Examinations",
        description: "Combine theory, problem solving and hands-on coding to be ready for any computer science paper.",
        date: "2026-09-25",
        readTime: "6 min read",
        cta: STUDENT,
        content: [
            intro("Computer science exams usually test both theory and the ability to solve problems. Reading alone is not enough. You need to write code, trace algorithms and explain why things work."),
            h("Cover the core areas"),
            ul("Programming fundamentals and data structures", "Algorithms and complexity", "Databases and SQL", "Operating systems and networks", "Discrete mathematics and logic"),
            h("Preparation steps"),
            ol("Write code by hand for common algorithms, since many exams are on paper", "Trace programs line by line to predict output", "Practise drawing diagrams such as flowcharts, ER diagrams and trees", "Solve past exam questions under time pressure", "Build a small project to see the concepts working together"),
            p("Even without a laptop, you can practise on paper. Many African students prepare this way and perform well.")
        ]
    },
    {
        slug: "how-to-organize-lecture-notes-by-course-code-and-semester",
        category: CAT,
        title: "How to Organize Your Lecture Notes by Course Code and Semester",
        description: "A simple filing system for paper and digital notes that saves time when exams come.",
        date: "2026-09-26",
        readTime: "5 min read",
        cta: STUDENT,
        content: [
            intro("Good notes are only useful if you can find them. A clear system keeps your materials ready for revision and also makes them easier to share or publish later."),
            h("The folder structure"),
            p("Create a folder for each level, then each semester, then each course code. Inside each course folder keep notes, assignments, past questions and summaries."),
            h("Naming files clearly"),
            ul("Use the format: COURSECODE_Topic_Date", "Add the level or year where helpful", "Avoid names such as Final2 or New copy", "Keep drafts separate from finished summaries"),
            h("Set it up in four steps"),
            ol("Create folders for the semester", "Scan or photograph handwritten notes and save them in the right folder", "Rename files using your naming pattern", "Back up everything to cloud storage or an external drive")
        ]
    },
    {
        slug: "how-to-build-a-personal-digital-library-for-university",
        category: CAT,
        title: "How to Build a Personal Digital Library for University",
        description: "Collect, organise and back up your study materials so they are always ready when you need them.",
        date: "2026-09-27",
        readTime: "5 min read",
        cta: STUDENT,
        content: [
            intro("A personal digital library gives you all your notes, textbooks and practice material in one searchable place. It is especially useful when internet access is unreliable, because you can study offline."),
            h("What goes in your library"),
            ul("Lecture notes and summaries", "Textbooks and reading lists you have the right to use", "Study guides and practice questions", "Assignments and feedback", "Useful articles and references"),
            h("Build it step by step"),
            ol("Choose where to store it: phone, laptop, memory card or cloud", "Use the folder system by level, semester and course code", "Download documents once and keep them offline", "Back up regularly to a second location", "Review and remove outdated material each semester"),
            p("Marketplaces like LAN Library can supply study guides and notes to grow your collection. Always use materials responsibly and respect their licences.")
        ]
    },
    {
        slug: "what-to-look-for-when-choosing-university-study-materials",
        category: CAT,
        title: "What to Look for When Choosing University Study Materials",
        description: "A quick checklist to judge whether a study guide, note set or e-book is worth your time and money.",
        date: "2026-09-28",
        readTime: "5 min read",
        cta: STUDENT,
        content: [
            intro("Not every study document is equally useful. With so many options online, you need a way to decide quickly what is worth using. Use this checklist before you buy or download."),
            h("The quality checklist"),
            ul("Does it clearly state the course, level and topics covered?", "Is the author credible, such as a lecturer or a student with relevant results?", "Is the writing clear and well organised?", "Does it include examples, summaries or practice questions?", "Is it current, matching your syllabus?"),
            h("Warning signs"),
            ul("Promises of guaranteed grades or exact exam questions", "Vague titles with no course details", "Poor formatting and obvious errors", "Pricing that does not match the amount of content"),
            h("Test before you commit"),
            ol("Read the description carefully", "Check any preview or sample", "Compare with your lecture notes", "Ask a coursemate who has used it")
        ]
    },
    {
        slug: "how-to-identify-reliable-academic-resources-online",
        category: CAT,
        title: "How to Identify Reliable Academic Resources Online",
        description: "Learn to separate trustworthy academic sources from misleading or low-quality ones.",
        date: "2026-09-29",
        readTime: "6 min read",
        cta: STUDENT,
        content: [
            intro("The internet gives African students access to a huge range of learning material, but quality varies widely. Learning to judge a source is a skill that will help throughout your career."),
            h("Questions to ask about any source"),
            ul("Who wrote it, and what are their qualifications?", "When was it published or updated?", "Does it cite evidence or other reliable sources?", "Does it agree with trusted textbooks and your lecturers?", "Is it trying to sell you something misleading?"),
            h("Prefer these types of sources"),
            ul("University libraries and open-access repositories", "Peer-reviewed journals and recognised publishers", "Documents from verified lecturers and academic authors", "Study guides with honest, specific descriptions"),
            h("Verify in three steps"),
            ol("Cross-check key facts with at least two sources", "Compare against your course outline", "Ask your lecturer if a source is acceptable for assignments")
        ]
    },
];