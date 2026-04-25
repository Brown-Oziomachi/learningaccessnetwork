"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Filter, ChevronRight, BookOpen, FileText, FlaskConical, PenLine, ClipboardList, Layers, ScrollText, Briefcase, GraduationCap, Star, X, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const documentTypes = [
    // ── CORE ACADEMIC ──
    { name: 'Textbook', slug: 'textbook', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600', description: 'Standard educational books used across courses', icon: BookOpen, color: '#1a3a5c' },
    { name: 'Lecture Note', slug: 'lecture-note', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600', description: 'Summarized class materials from lecturers', icon: PenLine, color: '#2d6a4f' },
    { name: 'Handwritten Notes', slug: 'handwritten-notes', image: 'https://images.unsplash.com/photo-1503467913725-8484b65b0715?w=600', description: 'Authentic student notes from class', icon: PenLine, color: '#4a1a2d' },
    { name: 'Summary', slug: 'summary', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600', description: 'Quick study breakdowns of complex topics', icon: Layers, color: '#7a4500' },
    { name: 'Syllabus', slug: 'syllabus', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600', description: 'Official course requirements and grading', icon: FileText, color: '#1a5c4a' },
    { name: 'Course Outline', slug: 'course-outline', image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600', description: 'Topic distributions and weekly schedules', icon: ClipboardList, color: '#2b4a6b' },
    { name: 'Study Guide', slug: 'study-guide', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600', description: 'Structured materials to guide self-study sessions', icon: BookOpen, color: '#3a5c2b' },
    { name: 'Reading List', slug: 'reading-list', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600', description: 'Curated books and articles recommended by lecturers', icon: BookOpen, color: '#5c4a1a' },
    { name: 'Mind Map', slug: 'mind-map', image: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=600', description: 'Visual diagrams connecting key concepts and ideas', icon: Layers, color: '#1a4a5c' },
    { name: 'Flashcards', slug: 'flashcards', image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600', description: 'Quick-recall cards for terms, formulas, and facts', icon: Star, color: '#5c1a4a' },
    { name: 'Cheat Sheet', slug: 'cheat-sheet', image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600', description: 'Condensed key formulas and facts on one page', icon: FileText, color: '#3a2b1a' },
    { name: 'Annotated Bibliography', slug: 'annotated-bibliography', image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600', description: 'Sources with brief evaluative descriptions attached', icon: ScrollText, color: '#2b3a1a' },

    // ── EXAM & ASSESSMENT ──
    { name: 'Past Question', slug: 'past-question', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600', description: 'Previous exam papers with marking schemes', icon: ClipboardList, color: '#6b2737' },
    { name: 'Exam Revision', slug: 'exam-revision', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600', description: 'Highly focused last-minute exam prep materials', icon: Star, color: '#5c3d00' },
    { name: 'Assignment', slug: 'assignment', image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600', description: 'Practice tasks, CATs, and group projects', icon: PenLine, color: '#5c2d1a' },
    { name: 'Mock Exam', slug: 'mock-exam', image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600', description: 'Full timed practice exams under real conditions', icon: ClipboardList, color: '#4a1a1a' },
    { name: 'Quiz Bank', slug: 'quiz-bank', image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600', description: 'Large collections of short-answer and MCQ questions', icon: Star, color: '#1a3a4a' },
    { name: 'WAEC Past Questions', slug: 'waec-past-questions', image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600', description: 'WAEC past papers across all subjects', icon: ClipboardList, color: '#6b3700' },
    { name: 'JAMB CBT Practice', slug: 'jamb-cbt-practice', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', description: 'Computer-based UTME practice questions', icon: Star, color: '#1a5c3a' },
    { name: 'NECO Past Questions', slug: 'neco-past-questions', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600', description: 'NECO exam past papers with answers', icon: ClipboardList, color: '#3a1a5c' },
    { name: 'GCE Past Questions', slug: 'gce-past-questions', image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600', description: 'GCE O-level and A-level past papers', icon: ClipboardList, color: '#5c2b1a' },
    { name: 'Post-UTME Past Questions', slug: 'post-utme-past-questions', image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600', description: 'University-specific post-UTME screening questions', icon: Star, color: '#1a4a5c' },

    // ── RESEARCH & WRITING ──
    { name: 'Thesis', slug: 'thesis', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600', description: 'Academic research papers and dissertations', icon: ScrollText, color: '#3d2b6b' },
    { name: 'Research Proposal', slug: 'research-proposal', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600', description: 'Initial project outlines and methodology plans', icon: ScrollText, color: '#3a1a5c' },
    { name: 'Seminar Paper', slug: 'seminar-paper', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600', description: 'Presentations prepared for departmental seminars', icon: Layers, color: '#1a2d5c' },
    { name: 'Case Study', slug: 'case-study', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600', description: 'Real-world scenario analysis for Law and Business', icon: BookOpen, color: '#5c1a1a' },
    { name: 'Journal Article', slug: 'journal-article', image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600', description: 'Peer-reviewed academic journal publications', icon: ScrollText, color: '#2b1a5c' },
    { name: 'Literature Review', slug: 'literature-review', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600', description: 'Critical overview of existing research on a topic', icon: BookOpen, color: '#1a5c2b' },
    { name: 'Conference Paper', slug: 'conference-paper', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600', description: 'Academic papers presented at conferences', icon: ScrollText, color: '#4a2b1a' },
    { name: 'Essay', slug: 'essay', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600', description: 'Structured academic and argumentative essays', icon: PenLine, color: '#2b4a1a' },
    { name: 'Dissertation Chapter', slug: 'dissertation-chapter', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600', description: 'Individual dissertation sections like methodology or lit review', icon: ScrollText, color: '#5c1a3a' },

    // ── PRACTICAL & TECHNICAL ──
    { name: 'Lab Manual', slug: 'lab-manual', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600', description: 'Practical guides, procedures, and lab reports', icon: FlaskConical, color: '#2d4a1a' },
    { name: 'Project', slug: 'project', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600', description: 'Detailed final year student projects', icon: Briefcase, color: '#1a3a5c' },
    { name: 'Technical Drawing', slug: 'technical-drawing', image: 'https://images.unsplash.com/photo-1503387762-592dec58ef4e?w=600', description: 'Engineering and architectural design sheets', icon: FileText, color: '#3a3a1a' },
    { name: 'Lab Report', slug: 'lab-report', image: 'https://images.unsplash.com/photo-1581093196277-9f608bb3b511?w=600', description: 'Documented results and analysis from practical experiments', icon: FlaskConical, color: '#1a4a2b' },
    { name: 'Field Report', slug: 'field-report', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', description: 'Observations and data collected from field surveys', icon: Briefcase, color: '#3a5c1a' },
    { name: 'Software Documentation', slug: 'software-documentation', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600', description: 'Technical docs for student software projects', icon: FileText, color: '#1a2b5c' },
    { name: 'Circuit Diagram', slug: 'circuit-diagram', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600', description: 'Electrical and electronic circuit schematics', icon: FlaskConical, color: '#3a1a3a' },
    { name: 'Code Sample', slug: 'code-sample', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600', description: 'Reusable code snippets for programming coursework', icon: Layers, color: '#1a3a2b' },
    { name: 'Algorithm Sheet', slug: 'algorithm-sheet', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600', description: 'Step-by-step computational procedures and flowcharts', icon: Layers, color: '#2b1a4a' },

    // ── ADMINISTRATIVE & CAREER ──
    { name: 'Internship Report', slug: 'internship-report', image: 'https://images.unsplash.com/photo-1521791136064-7986c2959d99?w=600', description: 'SIWES and industrial training documentation', icon: Briefcase, color: '#1a4a4a' },
    { name: 'Clearance Guide', slug: 'clearance-guide', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600', description: 'Step-by-step graduation clearance process', icon: ClipboardList, color: '#2d2d5c' },
    { name: 'Scholarship Guide', slug: 'scholarship-guide', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600', description: 'Funding sources, eligibility, and application tips', icon: GraduationCap, color: '#1a4a3a' },
    { name: 'CV Template', slug: 'cv-template', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600', description: 'Professional CV and resume formats for fresh graduates', icon: Briefcase, color: '#3a2b1a' },
    { name: 'Cover Letter Template', slug: 'cover-letter-template', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600', description: 'Winning cover letter samples for job applications', icon: FileText, color: '#1a3a4a' },
    { name: 'Student Handbook', slug: 'student-handbook', image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600', description: 'University rules, regulations, and student rights', icon: BookOpen, color: '#4a3a1a' },
    { name: 'Hostel Guide', slug: 'hostel-guide', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600', description: 'Campus accommodation tips and application process', icon: ClipboardList, color: '#2b4a2b' },
    { name: 'Admission Letter', slug: 'admission-letter', image: 'https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?w=600', description: 'Sample and template admission acceptance letters', icon: ScrollText, color: '#5c3a1a' },
    { name: 'Academic Transcript', slug: 'academic-transcript', image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=600', description: 'Official grade records and academic history formats', icon: FileText, color: '#1a5c5c' },
    { name: 'Fellowship Application', slug: 'fellowship-application', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600', description: 'Templates for applying to academic fellowships', icon: GraduationCap, color: '#3a1a4a' },

    // ── PROFESSIONAL & CAREER DEVELOPMENT ──
    { name: 'Portfolio', slug: 'portfolio', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600', description: 'Creative and academic portfolio collections', icon: Briefcase, color: '#2b1a3a' },
    { name: 'Career Guide', slug: 'career-guide', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600', description: 'Industry-specific career roadmaps for students', icon: GraduationCap, color: '#1a4a2d' },
    { name: 'Interview Prep', slug: 'interview-prep', image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600', description: 'Common questions and strategies for job interviews', icon: Star, color: '#5c1a2b' },
    { name: 'Networking Guide', slug: 'networking-guide', image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600', description: 'Tips for building professional connections as a student', icon: Layers, color: '#1a2b4a' },

    // ── DIGITAL & MULTIMEDIA ──
    { name: 'Presentation Slides', slug: 'presentation-slides', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', description: 'PowerPoint and slide decks for academic presentations', icon: Layers, color: '#2b3a5c' },
    { name: 'Infographic', slug: 'infographic', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', description: 'Visual data representations and illustrated summaries', icon: Layers, color: '#3a5c3a' },
    { name: 'Video Lecture Notes', slug: 'video-lecture-notes', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600', description: 'Notes and summaries derived from recorded video classes', icon: PenLine, color: '#5c2b3a' },
    { name: 'Podcast Transcript', slug: 'podcast-transcript', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600', description: 'Written transcripts of educational podcasts and talks', icon: ScrollText, color: '#2b5c3a' },
    { name: 'E-Book', slug: 'e-book', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600', description: 'Full digital books optimized for screen reading', icon: BookOpen, color: '#1a2b5c' },

    // ── HEALTH, LAW & PROFESSIONAL SCHOOLS ──
    { name: 'Medical Notes', slug: 'medical-notes', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600', description: 'Anatomy, pharmacology, and clinical notes for medical students', icon: FlaskConical, color: '#5c1a1a' },
    { name: 'Law Case Brief', slug: 'law-case-brief', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600', description: 'Summarized legal cases for law school students', icon: ScrollText, color: '#3a1a1a' },
    { name: 'Nursing Guide', slug: 'nursing-guide', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600', description: 'Clinical procedures and nursing care plan templates', icon: FlaskConical, color: '#1a5c4a' },
    { name: 'Accounting Workbook', slug: 'accounting-workbook', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600', description: 'Practice workbooks with solved accounting problems', icon: ClipboardList, color: '#2b2b1a' },
    { name: 'Engineering Formula Sheet', slug: 'engineering-formula-sheet', image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600', description: 'Consolidated formulas for mechanical, civil, and electrical', icon: FileText, color: '#1a3a2b' },
    { name: 'Pharmacy Notes', slug: 'pharmacy-notes', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600', description: 'Drug classifications, dosages, and pharmacology notes', icon: FlaskConical, color: '#4a1a4a' },
    { name: 'Architecture Portfolio', slug: 'architecture-portfolio', image: 'https://images.unsplash.com/photo-1503387762-592dec58ef4e?w=600', description: 'Design portfolios for architecture and urban planning', icon: Briefcase, color: '#3a2b1a' },

    // ── GENERAL EXTRAS ──
    { name: 'Workshop Material', slug: 'workshop-material', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600', description: 'Handouts and activities from academic workshops', icon: Layers, color: '#2b1a2b' },
    { name: 'Tutorial Sheet', slug: 'tutorial-sheet', image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600', description: 'Guided problem sets from tutorial sessions', icon: PenLine, color: '#1a4a1a' },
    { name: 'Group Project Report', slug: 'group-project-report', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600', description: 'Collaborative academic reports from student groups', icon: Briefcase, color: '#2b4a4a' },
    { name: 'Translation Resource', slug: 'translation-resource', image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=600', description: 'Bilingual study aids and translated academic texts', icon: BookOpen, color: '#4a4a1a' },
    { name: 'Motivational Resource', slug: 'motivational-resource', image: 'https://images.unsplash.com/photo-1552508744-1696d4464960?w=600', description: 'Productivity tips, mental health guides, and study hacks', icon: Star, color: '#3a1a2b' },
    { name: 'Community Timetable', slug: 'community-timetable', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600', description: 'Student-shared exam and lecture timetables by department', icon: ClipboardList, color: '#1a2b3a' },
];

const filters = ['All', 'Academic', 'Exam Prep', 'Research', 'Practical', 'Administrative', 'Career', 'Digital', 'Professional'];

const filterMap = {
    'Academic': ['textbook', 'lecture-note', 'syllabus', 'course-outline', 'handwritten-notes', 'summary', 'study-guide', 'reading-list', 'mind-map', 'flashcards', 'cheat-sheet', 'annotated-bibliography', 'tutorial-sheet', 'community-timetable'],
    'Exam Prep': ['past-question', 'exam-revision', 'assignment', 'mock-exam', 'quiz-bank', 'waec-past-questions', 'jamb-cbt-practice', 'neco-past-questions', 'gce-past-questions', 'post-utme-past-questions'],
    'Research': ['thesis', 'research-proposal', 'seminar-paper', 'case-study', 'journal-article', 'literature-review', 'conference-paper', 'essay', 'dissertation-chapter', 'group-project-report'],
    'Practical': ['lab-manual', 'technical-drawing', 'project', 'lab-report', 'field-report', 'software-documentation', 'circuit-diagram', 'code-sample', 'algorithm-sheet'],
    'Administrative': ['internship-report', 'clearance-guide', 'scholarship-guide', 'student-handbook', 'hostel-guide', 'admission-letter', 'academic-transcript', 'fellowship-application'],
    'Career': ['cv-template', 'cover-letter-template', 'portfolio', 'career-guide', 'interview-prep', 'networking-guide'],
    'Digital': ['presentation-slides', 'infographic', 'video-lecture-notes', 'podcast-transcript', 'e-book'],
    'Professional': ['medical-notes', 'law-case-brief', 'nursing-guide', 'accounting-workbook', 'engineering-formula-sheet', 'pharmacy-notes', 'architecture-portfolio', 'workshop-material', 'motivational-resource', 'translation-resource'],
};

export default function ResourcesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [hoveredCard, setHoveredCard] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const heroRef = useRef(null);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const filteredTypes = documentTypes.filter(type => {
        const matchesSearch = type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            type.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' || (filterMap[activeFilter] || []).includes(type.slug);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen" style={{ background: '#f5f2ed', fontFamily: "'Playfair Display', Georgia, serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

                * { box-sizing: border-box; }

                .dm-sans { font-family: 'DM Sans', sans-serif; }

                .hero-pattern {
                    background-image: radial-gradient(circle at 20% 50%, rgba(26, 58, 92, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(107, 39, 55, 0.06) 0%, transparent 40%),
                        radial-gradient(circle at 60% 80%, rgba(45, 106, 79, 0.05) 0%, transparent 40%);
                }

                .resource-card {
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
                    cursor: pointer;
                }
                .resource-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 24px 48px rgba(0,0,0,0.14);
                }

                .resource-card .card-img {
                    transition: transform 0.6s ease;
                }
                .resource-card:hover .card-img {
                    transform: scale(1.06);
                }

                .filter-pill {
                    transition: all 0.2s ease;
                    font-family: 'DM Sans', sans-serif;
                    cursor: pointer;
                    border: 1.5px solid transparent;
                }
                .filter-pill:hover {
                    border-color: #1a3a5c;
                }
                .filter-pill.active {
                    background: #1a3a5c;
                    color: white;
                    border-color: #1a3a5c;
                }

                .upload-cta {
                    background: linear-gradient(135deg, #1a3a5c 0%, #0f2440 100%);
                    position: relative;
                    overflow: hidden;
                }
                .upload-cta::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -20%;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%);
                    border-radius: 50%;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #1a3a5c;
                    box-shadow: 0 0 0 3px rgba(26, 58, 92, 0.1);
                }

                .count-badge {
                    font-family: 'DM Sans', sans-serif;
                    font-variant-numeric: tabular-nums;
                }

                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-up {
                    animation: fadeUp 0.6s ease forwards;
                }
                .fade-up-delay-1 { animation-delay: 0.1s; opacity: 0; }
                .fade-up-delay-2 { animation-delay: 0.2s; opacity: 0; }
                .fade-up-delay-3 { animation-delay: 0.3s; opacity: 0; }

                .grid-pattern {
                    background-image: linear-gradient(rgba(26,58,92,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(26,58,92,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
            `}</style>

            {/* Navbar placeholder - replace with your actual Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                        <BookOpen size={22} className="text-blue-950" />
                        StudyDocs
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="dm-sans text-sm text-gray-600 hover:text-gray-900">Home</Link>
                        <Link href="/documents" className="dm-sans text-sm text-gray-600 hover:text-gray-900">Documents</Link>
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="dm-sans flex items-center gap-2 bg-blue-950 text-white px-4 py-2 text-sm font-medium hover:bg-blue-900 transition-colors"
                        >
                            <Upload size={15} />
                            Upload
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section
                ref={heroRef}
                className="hero-pattern grid-pattern relative pt-20 pb-16 px-4 overflow-hidden"
                style={{ background: '#f5f2ed' }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ transform: `translateY(${scrollY * 0.3}px)`, opacity: 0.4 }}
                >
                    <div className="absolute top-8 right-[10%] w-64 h-64 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(26,58,92,0.07), transparent 70%)' }} />
                    <div className="absolute bottom-0 left-[5%] w-96 h-96 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(107,39,55,0.05), transparent 70%)' }} />
                </div>

                <div className="max-w-5xl mx-auto relative">
                    {/* Breadcrumb */}
                    <div className="dm-sans flex items-center gap-2 text-sm text-gray-500 mb-8 fade-up">
                        <Link href="/" className="hover:text-gray-800 transition-colors">Home</Link>
                        <ChevronRight size={14} />
                        <span className="text-gray-900 font-medium">Student Resources</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-block mb-4 fade-up fade-up-delay-1">
                                <span className="dm-sans text-xs font-600 tracking-[0.15em] uppercase text-blue-950 bg-blue-950/8 px-3 py-1.5 border border-blue-950/20"
                                    style={{ fontSize: '11px', letterSpacing: '0.12em', background: 'rgba(26,58,92,0.08)' }}>
                                    Academic Library
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.95] mb-6 fade-up fade-up-delay-1"
                                style={{ fontWeight: 900 }}>
                                Student<br />
                                <span style={{ color: '#1a3a5c' }}>Resources</span>
                            </h1>
                            <p className="dm-sans text-lg text-gray-600 leading-relaxed max-w-xl fade-up fade-up-delay-2">
                                Every document type a student needs — from textbooks to clearance guides. Browse, download, and upload to help the community.
                            </p>
                        </div>

                        <div className="flex items-center gap-6 fade-up fade-up-delay-3">
                            <div className="text-center">
                                <div className="text-4xl font-black text-gray-900 count-badge">{documentTypes.length}</div>
                                <div className="dm-sans text-xs text-gray-500 uppercase tracking-wider mt-1">Resource Types</div>
                            </div>
                            <div className="w-px h-12 bg-gray-300" />
                            <div className="text-center">
                                <div className="text-4xl font-black text-gray-900 count-badge">Free</div>
                                <div className="dm-sans text-xs text-gray-500 uppercase tracking-wider mt-1">To Browse</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upload CTA Banner */}
            <section className="upload-cta px-4 py-8">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                    <div className="text-center sm:text-left">
                        <p className="text-white font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Have study materials to share?
                        </p>
                        <p className="dm-sans text-blue-200 text-sm mt-1">
                            Upload your documents and earn from every download.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="dm-sans flex items-center gap-2 bg-white text-blue-950 font-semibold px-6 py-3 text-sm hover:bg-blue-50 transition-colors whitespace-nowrap"
                    >
                        <Upload size={16} />
                        Upload a Resource
                        <ArrowUpRight size={15} />
                    </button>
                </div>
            </section>

            {/* Search + Filter */}
            <section className="px-4 py-10 bg-white border-b border-gray-200 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search resource types..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input dm-sans w-full pl-10 pr-4 py-2.5 border border-gray-200 text-sm text-gray-900 bg-gray-50 transition-all"
                                style={{ borderRadius: 0 }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter size={14} className="text-gray-400 dm-sans" />
                            {filters.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`filter-pill px-4 py-1.5 text-xs font-medium ${activeFilter === f ? 'active' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="dm-sans text-sm text-gray-500 ml-auto whitespace-nowrap">
                            {filteredTypes.length} resource{filteredTypes.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </section>

            {/* Resources Grid */}
            <section className="px-4 py-16 max-w-7xl mx-auto">
                {filteredTypes.length === 0 ? (
                    <div className="text-center py-24">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No resources found</h3>
                        <p className="dm-sans text-gray-500">Try a different search or filter</p>
                        <button onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                            className="dm-sans mt-6 text-sm text-blue-950 underline underline-offset-4">
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {filteredTypes.map((type, index) => {
                            const Icon = type.icon;
                            return (
                                <Link
                                    key={type.slug}
                                    href={`/document-type/${type.slug}`}
                                    className="resource-card bg-white overflow-hidden block"
                                    onMouseEnter={() => setHoveredCard(type.slug)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    style={{
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                        animationDelay: `${index * 0.04}s`,
                                        animation: 'fadeUp 0.5s ease forwards',
                                        opacity: 0,
                                    }}
                                >
                                    {/* Image */}
                                    <div className="relative h-36 overflow-hidden">
                                        <img
                                            src={type.image}
                                            alt={type.name}
                                            className="card-img w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0"
                                            style={{ background: `linear-gradient(to top, ${type.color}dd 0%, transparent 60%)` }} />
                                        <div className="absolute bottom-3 left-3">
                                            <Icon size={18} color="white" strokeWidth={1.5} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight"
                                            style={{ fontFamily: "'Playfair Display', serif" }}>
                                            {type.name}
                                        </h3>
                                        <p className="dm-sans text-xs text-gray-500 leading-relaxed line-clamp-2">
                                            {type.description}
                                        </p>

                                        <div className={`dm-sans mt-3 flex items-center gap-1 text-xs font-semibold transition-all duration-300 ${hoveredCard === type.slug ? 'text-blue-950' : 'text-gray-400'}`}>
                                            Browse
                                            <ChevronRight size={12} className={`transition-transform duration-300 ${hoveredCard === type.slug ? 'translate-x-1' : ''}`} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Upload Card */}
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="resource-card bg-blue-950 overflow-hidden block text-left"
                            style={{ boxShadow: '0 2px 12px rgba(26,58,92,0.2)' }}
                        >
                            <div className="h-36 flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center">
                                    <Upload size={24} color="white" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-white text-sm mb-1"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Upload Yours
                                </h3>
                                <p className="dm-sans text-xs text-blue-200 leading-relaxed">
                                    Share your materials and earn from every download
                                </p>
                                <div className="dm-sans mt-3 flex items-center gap-1 text-xs font-semibold text-white/60">
                                    Get started
                                    <ChevronRight size={12} />
                                </div>
                            </div>
                        </button>
                    </div>
                )}
            </section>

            {/* Bottom Upload CTA */}
            <section className="px-4 py-20" style={{ background: '#1a1a1a' }}>
                <div className="max-w-3xl mx-auto text-center">
                    <p className="dm-sans text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">For Sellers & Contributors</p>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6"
                        style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>
                        Your notes could be<br />
                        <span style={{ color: '#7eb8f7' }}>earning right now.</span>
                    </h2>
                    <p className="dm-sans text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                        Thousands of students are searching for exactly what you've already written. Upload once, earn forever.
                    </p>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="dm-sans inline-flex items-center gap-3 bg-white text-gray-900 font-bold px-8 py-4 text-base hover:bg-gray-100 transition-colors"
                    >
                        <Upload size={18} />
                        Start Uploading
                        <ArrowUpRight size={16} />
                    </button>
                </div>
            </section>

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="bg-white w-full max-w-md p-8 relative" style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
                        <button onClick={() => setIsUploadOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-black text-gray-900 mb-2"
                            style={{ fontFamily: "'Playfair Display', serif" }}>
                            Upload a Resource
                        </h3>
                        <p className="dm-sans text-sm text-gray-500 mb-8">You need to be a verified seller to upload documents.</p>

                        <div className="space-y-3">
                            <Link href="/uploader-agreement"
                                className="dm-sans flex items-center justify-between w-full bg-blue-950 text-white px-5 py-3.5 text-sm font-semibold hover:bg-blue-900 transition-colors">
                                <span>Upload Document</span>
                                <ArrowUpRight size={16} />
                            </Link>
                            <Link href="/become-seller"
                                className="dm-sans flex items-center justify-between w-full border border-gray-200 text-gray-700 px-5 py-3.5 text-sm font-medium hover:bg-gray-50 transition-colors">
                                <span>Become a Seller First</span>
                                <ChevronRight size={16} />
                            </Link>
                        </div>

                        <p className="dm-sans text-xs text-gray-400 mt-6 text-center">
                            Not a seller yet?{' '}
                            <Link href="/become-seller" className="text-blue-950 underline underline-offset-2">
                                Apply in minutes
                            </Link>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}