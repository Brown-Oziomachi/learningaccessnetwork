// Category: Study Smarter (10 articles). Written for students across Africa.
import { intro, h, p, ul, ol, STUDENT } from "./helpers";
const CAT = "Study Smarter";

export const studyPosts = [
  {
    slug: "pass-university-exams-without-last-minute-reading",
    category: CAT,
    title: "How to Pass University Examinations Without Reading at the Last Minute",
    description: "A calm, practical plan for African students who want to stop cramming and walk into the exam hall prepared.",
    date: "2026-10-01",
    readTime: "6 min read",
    cta: STUDENT,
    content: [
      intro("Last-minute reading feels urgent, but it is one of the least reliable ways to prepare. Information crammed the night before fades quickly and leaves you anxious. This guide shows how to spread your preparation across the semester so the exam week feels like revision, not rescue."),
      h("Why cramming fails"),
      p("Your brain remembers better when it meets an idea several times over days and weeks. A single long session the night before gives you one exposure, tired eyes and very little time to ask questions. Short, repeated sessions beat one heroic night."),
      h("Build the habit early"),
      ul("Review each day's lecture notes within 24 hours", "Spend 20 minutes each weekend summarising the week", "Mark topics you do not understand and ask about them while the course is still running", "Collect past questions or past papers early so you know how the course is examined"),
      h("A simple plan for the last four weeks"),
      ol("Week 4: list every topic in the course outline and rate your confidence from 1 to 5", "Week 3: study the weakest topics first and write short summaries", "Week 2: practise questions under timed conditions", "Week 1: revise your summaries, rest well and fix only small gaps"),
      h("The night before"),
      p("Do a light review of your summaries, prepare your pens, ID and anything the exam requires, and sleep. A rested mind recalls more than a tired one that read another chapter.")
    ]
  },
  {
    slug: "prepare-university-exams-using-past-questions",
    category: CAT,
    title: "How to Prepare for University Exams Using Past Questions",
    description: "Learn how to use past questions and past papers to find patterns, test yourself and prepare with confidence.",
    date: "2026-10-02",
    readTime: "6 min read",
    cta: STUDENT,
    content: [
      intro("Past questions, also called past papers in many countries, show you how a course is tested. Used well, they teach you the style of questions, the depth expected and where you are weak. Used badly, they become a shortcut that leaves you unprepared when the questions change."),
      h("What past questions can and cannot tell you"),
      p("They show format, difficulty and the kind of thinking examiners expect. They do not guarantee that a question will repeat. Lecturers change, syllabuses change and papers are rewritten. Treat past questions as practice, never as a prediction."),
      h("How to use them"),
      ol("Finish studying a topic first, then attempt the related questions without notes", "Mark your answers honestly against your notes or a marking guide", "Write down every mistake and the reason behind it", "Revisit weak topics and try similar questions again a few days later", "In the final two weeks, do full papers under timed conditions"),
      h("Mistakes to avoid"),
      ul("Memorising answers without understanding them", "Skipping topics because they have not appeared recently", "Using questions from another course or level", "Trusting any document that promises exact questions"),
      p("If you are looking for practice material, browse the documents on LAN Library and check that the description clearly states the course, level and what is included.")
    ]
  },
  {
    slug: "study-techniques-african-university-students",
    category: CAT,
    title: "7 Study Techniques Every African University Student Should Know",
    description: "Seven proven techniques, from active recall to spaced revision, that work in crowded lecture halls and on limited data budgets.",
    date: "2026-10-03",
    readTime: "6 min read",
    cta: STUDENT,
    content: [
      intro("You do not need expensive tools to study well. These seven techniques are simple, cost nothing and work whether you study in a library, a hostel or at home with an unstable power supply."),
      h("The seven techniques"),
      ol("Active recall: close your notes and write what you remember, then check", "Spaced revision: review a topic after one day, three days and a week", "The Feynman method: explain a concept in plain words as if teaching a younger student", "Practice questions: test yourself instead of rereading", "Mind maps: draw connections between ideas on a single page", "Pomodoro sessions: study for 25 minutes, rest for 5, repeat", "Study groups: meet with two or three serious coursemates and teach each other"),
      h("Choosing what suits you"),
      p("You do not have to use all seven at once. Start with active recall and spaced revision, since they have the strongest record in learning research. Add the others when you want variety."),
      h("Studying with limited resources"),
      ul("Use paper flashcards instead of apps", "Download notes and documents once, then study offline", "Study in daylight hours when electricity is uncertain", "Share printed materials with a study group to reduce costs")
    ]
  },
  {
    slug: "make-a-reading-timetable-you-can-follow",
    category: CAT,
    title: "How to Make a Reading Timetable You Can Actually Follow",
    description: "Stop abandoning your timetable by week two. Build a realistic reading plan around lectures, power cuts and real life.",
    date: "2026-10-04",
    readTime: "5 min read",
    cta: STUDENT,
    content: [
      intro("Most reading timetables fail because they are written for an imaginary student with endless energy. A timetable only works if it fits your actual week. Here is how to build one that survives lectures, travel, chores and tiredness."),
      h("Start with your real week"),
      p("List every fixed commitment: lectures, practicals, church or mosque, work, travel and sleep. What is left is your study time. Be honest about it."),
      h("Build the timetable"),
      ol("Split your free time into blocks of 45 to 90 minutes", "Assign one course to each block and avoid mixing topics", "Give harder courses your best hours of the day", "Add one free block per week for catching up", "Place short breaks and meals inside the plan"),
      h("Keep it alive"),
      ul("Review it every Sunday and adjust", "Cross off finished blocks to see your progress", "If you miss a block, move it, do not abandon the week", "Tell a friend your plan so someone can ask how it is going")
    ]
  },
  {
    slug: "write-excellent-university-assignments",
    category: CAT,
    title: "How to Write Excellent University Assignments and Get Better Grades",
    description: "From understanding the question to referencing properly, a clear method for assignments that earn stronger marks.",
    date: "2026-10-05",
    readTime: "6 min read",
    cta: STUDENT,
    content: [
      intro("Assignments often carry a solid share of your final grade, yet many students rush them. A good assignment answers the question that was asked, uses reliable sources and is clearly structured. None of that requires talent, only method."),
      h("Understand the question first"),
      p("Underline the instruction words, such as discuss, compare, evaluate or explain. Each asks for something different. Many lost marks come from answering a different question than the one set."),
      h("A reliable process"),
      ol("Plan an outline with a clear introduction, body and conclusion", "Gather sources from your textbooks, library and trusted journals", "Write the first draft without stopping to perfect each sentence", "Edit for clarity, structure and spelling", "Reference every source in the style your department requires", "Submit before the deadline, not at the deadline"),
      h("Protect your integrity"),
      p("Plagiarism can cost you marks or more. Always write in your own words and cite your sources. If you do not understand something well enough to explain it yourself, go back and study it again.")
    ]
  },
  {
    slug: "prepare-first-semester-exams-as-a-fresher",
    category: CAT,
    title: "How to Prepare for First-Semester Examinations as a Fresher",
    description: "New to university? Here is how to settle in, study sensibly and approach your first exams with confidence.",
    date: "2026-10-06",
    readTime: "6 min read",
    cta: STUDENT,
    content: [
      intro("First-semester exams are different from secondary school exams. There is more material, less hand-holding and a lot more freedom. This guide helps freshers build good habits from the first weeks."),
      h("What changes at university"),
      p("Lecturers move quickly and expect independent reading. Nobody will chase you to study. The students who do well are usually those who start early and stay consistent."),
      h("Your first-semester checklist"),
      ul("Get the course outlines and read them in the first week", "Attend every lecture and take your own notes", "Join a small, serious study group", "Learn how your department grades coursework and exams", "Locate the library and any digital resources your school provides"),
      h("Preparing for the exam period"),
      ol("Start revision at least four weeks ahead", "Organise notes by course code and topic", "Practise with past questions where available", "Visit your lecturers during office hours with specific questions", "Look after your sleep, meals and health in exam weeks"),
      p("Remember that everyone feels nervous in their first exams. Preparation is the best answer to that fear.")
    ]
  },
  {
    slug: "why-lecture-notes-are-not-enough",
    category: CAT,
    title: "Why Your Lecture Notes May Not Be Enough to Prepare for Exams",
    description: "Notes are a starting point, not the finish line. Learn how to fill the gaps and turn notes into real understanding.",
    date: "2026-10-07",
    readTime: "5 min read",
    cta: STUDENT,
    content: [
      intro("Many students rely entirely on what they wrote in class. But notes taken in a fast lecture are often incomplete, rushed and sometimes wrong. They record what was said, not what you understood."),
      h("Common problems with lecture notes"),
      ul("Missed points when the lecturer spoke quickly", "Unclear handwriting or abbreviations you cannot decode later", "No examples or worked solutions", "Gaps from lectures you missed"),
      h("How to strengthen your notes"),
      ol("Rewrite notes within a day while the lecture is still fresh", "Compare with a reliable coursemate and fill in missing parts", "Read the relevant textbook chapter and add key explanations", "Add your own examples and practice questions", "Summarise each topic on a single page"),
      p("Well-organised study guides and summaries from other learners can also help you see a topic from a new angle. Always check that any material is accurate and matches your syllabus.")
    ]
  },
  {
    slug: "how-to-study-difficult-courses-without-giving-up",
    category: CAT,
    title: "How to Study Difficult Courses Without Giving Up",
    description: "Struggling with a hard course is normal. Here is how to break it down, get help and keep moving.",
    date: "2026-10-08",
    readTime: "6 min read",
    cta: STUDENT,
    content: [
      intro("Every student meets a course that feels impossible. The difference between those who pass and those who quit is usually the strategy, not the intelligence. Hard courses become manageable when you break them into small, solvable pieces."),
      h("Find where you are actually stuck"),
      p("Often the problem is not the whole course but one missing foundation. If calculus confuses you, the real gap may be algebra. Trace your confusion back until you find the first thing you do not understand."),
      h("A step-by-step approach"),
      ol("Split the course into small topics", "Study one topic at a time until you can explain it simply", "Solve many small examples before attempting hard ones", "Ask a lecturer, tutor or senior to clarify exactly what confuses you", "Test yourself with practice questions after each topic"),
      h("Keep your motivation"),
      ul("Celebrate small wins, like finishing one topic", "Study difficult material when you are most alert", "Do not compare your pace with others", "Take rest seriously, because tired minds learn poorly")
    ]
  },
  {
    slug: "manage-time-between-lectures-assignments-and-personal-life",
    category: CAT,
    title: "How to Manage Your Time Between Lectures, Assignments, and Personal Life",
    description: "Balance academics, relationships, work and rest without burning out.",
    date: "2026-10-09",
    readTime: "6 min read",
    cta: STUDENT,
    content: [
      intro("University life pulls you in many directions: lectures, assignments, friends, family, faith, part-time work and rest. Time management is not about doing everything. It is about choosing well and protecting what matters most."),
      h("Know your priorities"),
      p("Write down your top three priorities for the semester. When a new request arrives, ask whether it supports those priorities. If not, say no politely or postpone it."),
      h("Simple time tools"),
      ul("A weekly planner on paper or on your phone", "A daily list of three must-do tasks", "Fixed times for study, rest and social activities", "A deadline calendar showing every assignment and exam date"),
      h("A weekly rhythm"),
      ol("Sunday: plan the week and check deadlines", "Weekdays: attend lectures, review notes the same day", "One evening: do something you enjoy", "Weekend: catch up and do larger assignments", "Every night: sleep enough to function the next day"),
      p("If you feel overwhelmed, speak to a trusted friend, mentor or your university's student support office. Asking for help is a strength.")
    ]
  },
  {
    slug: "smart-students-guide-to-preparing-for-university-examinations",
    category: CAT,
    title: "The Smart Student's Guide to Preparing for University Examinations",
    description: "A complete, step-by-step exam preparation system that brings together planning, practice, revision and rest.",
    date: "2026-10-10",
    readTime: "7 min read",
    cta: STUDENT,
    content: [
      intro("This guide pulls the most reliable exam habits into one system. Follow it from the start of the semester and the weeks before exams will feel much lighter."),
      h("Phase 1: During the semester"),
      ul("Attend lectures and take clear notes", "Review notes within 24 hours", "Ask questions early", "Complete assignments seriously because they teach the material"),
      h("Phase 2: Four to six weeks before exams"),
      ol("List all topics for each course", "Create short summaries in your own words", "Start practising questions topic by topic", "Form or join a study group", "Collect trustworthy study materials and organise them by course code"),
      h("Phase 3: The final two weeks"),
      ol("Do full practice papers under timed conditions", "Focus on weak areas without ignoring strong ones", "Revise summaries and flashcards", "Plan your travel and exam-day materials"),
      h("Phase 4: Exam day"),
      p("Eat, hydrate and arrive early. Read the instructions carefully, plan your time across questions and begin with the ones you know best. Stay calm. You have prepared."),
      p("Explore LAN Library for study guides, notes and practice material that support your preparation.")
    ]
  },
];