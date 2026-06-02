'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Presentation.module.css';

const slides = [
    {
        id: 's0',
        bg: 'bgGeo',
        script: "How to Monetize Your Knowledge on LAN Library. The leading African digital academic repository — eliminating barriers of printing, distribution, and currency fluctuations across 30 plus African nations.",
        corners: ['topLeft', 'bottomRight'],
        content: (
            <>
                <span className={styles.tag}>Pan-African Knowledge Platform</span>
                <h1 className={styles.headline}>
                    How to <span>Monetize</span>
                    <br />Your Knowledge on
                    <br /><span>LAN Library</span>
                </h1>
                <div className={styles.divider} />
                <p className={styles.subtext}>
                    The leading African digital academic repository — eliminating barriers of printing,
                    distribution, and currency fluctuations across <strong>30+ African nations.</strong>
                </p>
            </>
        ),
    },
    {
        id: 's1',
        bg: 'bgGeo2',
        script: "Sell Once. Earn Forever. LAN Library gives educators, independent scholars, and smart students the tools to package their knowledge once and earn continuous revenue across the entire African continent — 24 hours a day, 7 days a week, always in stock.",
        corners: ['topLeft'],
        content: (
            <>
                <span className={styles.tag}>About the Platform</span>
                <span className={styles.iconBig}>🌍</span>
                <h1 className={styles.headline}>
                    Sell Once.<br /><span>Earn Forever.</span>
                </h1>
                <div className={styles.divider} />
                <p className={styles.subtext}>
                    LAN Library gives educators, independent scholars, and smart students the tools to{' '}
                    <strong>package their knowledge once</strong> and earn{' '}
                    <strong>continuous revenue</strong> across the entire African continent — 24/7, always in stock.
                </p>
            </>
        ),
    },
    {
        id: 's2',
        bg: 'bgGeo',
        script: "3 Types of Earners. Lecturers and Educators — Monetize handouts and textbooks digitally. No printing overhead. Pan-African royalties. Exceptional Students — Sell study guides, summaries, and past question walkthroughs for premium prices. Independent Authors — Bypass slow publishers. Sell monographs and research directly to your audience.",
        corners: ['bottomRight'],
        content: (
            <>
                <span className={styles.tag}>💰 Who Makes Money</span>
                <h1 className={styles.headline}>
                    3 Types of<br /><span>Earners</span>
                </h1>
                <div className={styles.gridCards}>
                    {[
                        { icon: '🏛️', title: 'Lecturers & Educators', desc: 'Monetize handouts & textbooks digitally. No printing overhead. Pan-African royalties.' },
                        { icon: '🎓', title: 'Exceptional Students', desc: 'Sell study guides, summaries & past question walkthroughs for premium prices.' },
                        { icon: '✍️', title: 'Independent Authors', desc: 'Bypass slow publishers. Sell monographs and research directly to your audience.' },
                    ].map((card) => (
                        <div key={card.title} className={styles.gridCard}>
                            <span className={styles.cardIcon}>{card.icon}</span>
                            <div className={styles.cardTitle}>{card.title}</div>
                            <div className={styles.cardDesc}>{card.desc}</div>
                        </div>
                    ))}
                </div>
            </>
        ),
    },
    {
        id: 's3',
        bg: 'bgGeo2',
        script: "Stop Losing Money to Illegal Copies. Upload your materials as protected digital formats — no printing bills, no unsold inventory, no piracy. Collect instant Pan-African royalties via Mobile Money or Card from students in Nigeria, Ghana, Kenya and beyond.",
        corners: ['topLeft'],
        content: (
            <>
                <span className={styles.pill}>🏛️ Lecturers & Educators</span>
                <h1 className={styles.headline}>
                    Stop Losing Money<br />to <span>Illegal Copies</span>
                </h1>
                <div className={styles.divider} />
                <p className={styles.subtext}>
                    Upload your materials as <strong>protected digital formats</strong> — no printing bills,
                    no unsold inventory, no piracy. Collect <strong>instant Pan-African royalties</strong> via
                    Mobile Money or Card from students in Nigeria, Ghana, Kenya &amp; beyond.
                </p>
            </>
        ),
    },
    {
        id: 's4',
        bg: 'bgGeo',
        script: "Your A Plus Grade is Worth Money. Turn your high-quality lecture notes into a Mastery Study Guide and sell it to junior students. Compile official university past questions with step-by-step solutions — students will happily pay a premium to pass confidently.",
        corners: ['bottomRight'],
        content: (
            <>
                <span className={styles.pill}>🎓 Students & Peer Tutors</span>
                <h1 className={styles.headline}>
                    Your <span>A+</span> Grade<br />is Worth <span>Money</span>
                </h1>
                <div className={styles.divider} />
                <p className={styles.subtext}>
                    Turn your high-quality lecture notes into a <strong>"Mastery Study Guide"</strong> and
                    sell it to junior students. Compile official university past questions with{' '}
                    <strong>step-by-step solutions</strong> — students will happily pay a premium to pass confidently.
                </p>
            </>
        ),
    },
    {
        id: 's5',
        bg: 'bgGeo2',
        script: "Share a Link. Bank Commission. Generate unique tracking links for top-selling materials. Share in departmental group chats, hostel forums, or class channels. When a classmate buys — you instantly earn 5 to 10 percent credited to your wallet. No book required.",
        corners: ['topLeft'],
        content: (
            <>
                <span className={styles.pill}>🤝 Campus Ambassadors</span>
                <h1 className={styles.headline}>
                    Share a Link.<br /><span>Bank Commission.</span>
                </h1>
                <div className={styles.divider} />
                <p className={styles.subtext}>
                    Generate unique tracking links for top-selling materials. Share in{' '}
                    <strong>departmental group chats, hostel forums, or class channels.</strong> When a
                    classmate buys — you instantly earn <strong>5% to 10%</strong> credited to your wallet.
                    No book required.
                </p>
            </>
        ),
    },
    {
        id: 's6',
        bg: 'bgGeo',
        script: "Get Paid in Your Currency. No foreign exchange headaches. Earnings paid directly into your local bank or mobile money wallet in Nigerian Naira, Ghanaian Cedis, Kenyan Shillings, South African Rand, West African Francs, and more. Track every download, view real-time metrics, and request withdrawals in one click.",
        corners: ['bottomRight'],
        content: (
            <>
                <span className={styles.tag}>🏦 The Payout Engine</span>
                <h1 className={styles.headline}>
                    Get Paid in<br /><span>Your Currency</span>
                </h1>
                <div className={styles.divider} />
                <p className={styles.subtext}>
                    No foreign exchange headaches. Earnings paid directly into your{' '}
                    <strong>local bank or mobile money wallet</strong> in NGN, GHS, KES, ZAR, XOF &amp; more.
                    Track every download, view real-time metrics, and{' '}
                    <strong>request withdrawals in one click.</strong>
                </p>
            </>
        ),
    },
    {
        id: 's7',
        bg: 'bgGeo2',
        script: "4 Rules for Maximum Sales. Rule one: Leverage Your Unique URL. — Pin it to your WhatsApp Bio, email signature, and class group chats every semester. Rule two:. Price Responsibly for Your Region — Use real-time currency conversion to ensure fair pricing for Ghanaian, Kenyan, and West African wallets — high volume wins. Rule three:. Optimize for Rich Previews — Upload a professional profile picture. LAN Library auto-builds stunning visual cards that drive clicks. Rule four:. Offer a Free Sample Preview — Let buyers read the first 5 pages for free. Showing immediate value boosts conversions by over 40 percent.",
        corners: ['topLeft'],
        content: (
            <>
                <span className={styles.tag}>⚡ 4 Rules for Maximum Sales</span>
                <div className={styles.listItems}>
                    {[
                        { num: '01', title: 'Leverage Your Unique URL', desc: 'Pin it to your WhatsApp Bio, email signature, and class group chats every semester.' },
                        { num: '02', title: 'Price Responsibly for Your Region', desc: 'Use real-time currency conversion to ensure fair pricing for GHS, KES, XOF wallets — high-volume wins.' },
                        { num: '03', title: 'Optimize for Rich Previews', desc: 'Upload a professional profile picture. LAN Library auto-builds stunning visual cards that drive clicks.' },
                        { num: '04', title: 'Offer a Free Sample Preview', desc: 'Let buyers read the first 5 pages for free. Showing immediate value boosts conversions by over 40%.' },
                    ].map((item) => (
                        <div key={item.num} className={styles.listItem}>
                            <div className={styles.listNum}>{item.num}</div>
                            <div className={styles.listBody}>
                                <div className={styles.listTitle}>{item.title}</div>
                                <div className={styles.listDesc}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        ),
    },
    {
        id: 's8',
        bg: 'bgGeo',
        script: "Your Knowledge. Your Revenue. Africa-Wide. LAN Library — Package your knowledge once and earn across 30 plus African countries. Join thousands of educators, students, and authors already building their income on LAN Library.",
        corners: ['topLeft', 'bottomRight'],
        content: (
            <>
                <span className={styles.tag}>Start Today</span>
                <span className={styles.iconBig}>🚀</span>
                <h1 className={styles.headline}>
                    Your Knowledge.<br /><span>Your Revenue.</span><br />Africa-Wide.
                </h1>
                <div className={styles.divider} />
                <p className={styles.subtext}>
                    <strong>LAN Library</strong> — Package your knowledge once and earn across{' '}
                    <strong>30+ African countries.</strong> Join thousands of educators, students, and authors
                    already building their income.
                </p>
            </>
        ),
    },
];

export default function Presentation() {
    const [current, setCurrent] = useState(0);
    const [animKey, setAnimKey] = useState(0);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);

    // Use refs so callbacks always see the latest values without re-creating effects
    const pausedRef = useRef(paused);
    const mutedRef = useRef(muted);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { mutedRef.current = muted; }, [muted]);

    const goNext = useCallback(() => {
        setCurrent((prev) => {
            const next = (prev + 1) % slides.length;
            setAnimKey((k) => k + 1);
            return next;
        });
    }, []);

    const go = useCallback((n) => {
        setCurrent(() => {
            const next = ((n % slides.length) + slides.length) % slides.length;
            setAnimKey((k) => k + 1);
            return next;
        });
    }, []);

    // Speak the current slide and call onComplete when done
    const speakSlide = useCallback((text, onComplete) => {
        window.speechSynthesis.cancel();

        if (!text) {
            onComplete?.();
            return;
        }

        if (mutedRef.current) {
            onComplete?.();
            return;
        }

        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.92;
        utter.pitch = 1.0;
        utter.lang = 'en-US';

        // Pick the best available voice
        const trySpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const preferred =
                voices.find(v => v.name === 'Google US English') ||
                voices.find(v => v.name.includes('Samantha')) ||
                voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
                voices.find(v => v.lang.startsWith('en-US')) ||
                voices.find(v => v.lang.startsWith('en'));
            if (preferred) utter.voice = preferred;

            utter.onend = () => onComplete?.();
            utter.onerror = () => onComplete?.();

            window.speechSynthesis.speak(utter);
        };

        // Voices may not be loaded yet on first call
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            trySpeak();
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.onvoiceschanged = null;
                trySpeak();
            };
        }
    }, []);

    // Auto-advance: speak slide, then move to next when speech ends.
    // When muted, fall back to a 5-second timer.
    useEffect(() => {
        if (paused) {
            window.speechSynthesis.cancel();
            return;
        }

        let timer;

        if (muted) {
            // Muted: simple 5-second timer
            timer = setTimeout(() => {
                if (!pausedRef.current) goNext();
            }, 5000);
        } else {
            // Unmuted: advance after speech finishes
            speakSlide(slides[current]?.script, () => {
                // Small pause between slides for natural feel
                timer = setTimeout(() => {
                    if (!pausedRef.current) goNext();
                }, 600);
            });
        }

        return () => {
            clearTimeout(timer);
            window.speechSynthesis.cancel();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, paused, muted]);

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                setPaused(true);
                window.speechSynthesis.cancel();
                go(current + 1);
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                setPaused(true);
                window.speechSynthesis.cancel();
                go(current - 1);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [current, go]);

    // When user toggles mute on, cancel any running speech
    const handleMuteToggle = () => {
        setMuted(m => {
            if (!m) window.speechSynthesis.cancel(); // turning mute ON → stop speech
            return !m;
        });
    };

    const slide = slides[current];

    return (
        <div className={styles.app}>
            <div
                key={animKey}
                className={`${styles.slide} ${styles[slide.bg]} ${styles.active}`}
            >
                {slide.corners.includes('topLeft') && <div className={styles.cornerAccent} />}
                {slide.corners.includes('bottomRight') && <div className={styles.cornerAccentBr} />}

                <div className={styles.slideContent}>
                    {slide.content}
                </div>
            </div>

            <nav className={styles.nav}>
                <button
                    className={styles.navBtn}
                    onClick={() => {
                        setPaused(true);
                        window.speechSynthesis.cancel();
                        go(current - 1);
                    }}
                >
                    ← Prev
                </button>

                <div className={styles.dots}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            className={`${styles.dot} ${i === current ? styles.dotOn : ''}`}
                            onClick={() => {
                                setPaused(true);
                                window.speechSynthesis.cancel();
                                go(i);
                            }}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>

                <button
                    className={styles.navBtn}
                    onClick={handleMuteToggle}
                >
                    {muted ? '🔇 Unmute' : '🔊 Mute'}
                </button>

                {paused ? (
                    <button
                        className={styles.navBtn}
                        onClick={() => setPaused(false)}
                    >
                        ▶ Resume
                    </button>
                ) : (
                    <button
                        className={styles.navBtn}
                        onClick={() => {
                            setPaused(true);
                            window.speechSynthesis.cancel();
                        }}
                    >
                        ⏸ Pause
                    </button>
                )}

                <button
                    className={styles.navBtn}
                    onClick={() => {
                        setPaused(true);
                        window.speechSynthesis.cancel();
                        go(current + 1);
                    }}
                >
                    Next →
                </button>
            </nav>
        </div>
    );
}