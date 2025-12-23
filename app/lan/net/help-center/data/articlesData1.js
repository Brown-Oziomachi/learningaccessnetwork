// PART 1: Getting Started, Payments & Pricing, Downloads & Access
export const articlesP1 = {
  // ==================== GETTING STARTED ====================
  'creating-your-account': {
    category: 'Getting Started',
    title: 'Creating Your Account',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Account', 'Getting Started', 'Sign Up'],
    content: [
      {
        type: 'intro',
        text: 'Creating an account on Learning Access Network is quick and easy. Follow these simple steps to get started with your digital library journey.'
      },
      {
        type: 'heading',
        text: 'Sign Up Methods'
      },
      {
        type: 'paragraph',
        text: 'You can create an account using two methods:'
      },
      {
        type: 'list',
        items: [
          'Google Sign In - Quick and secure authentication using your Google account',
          'Email and Password - Traditional sign-up method with email verification'
        ]
      },
      {
        type: 'heading',
        text: 'Using Google Sign In'
      },
      {
        type: 'paragraph',
        text: 'This is the fastest way to create your account:'
      },
      {
        type: 'steps',
        items: [
          'Click the "Sign In" button at the top right of the page',
          'Select "Continue with Google"',
          'Choose your Google account from the list',
          'Grant necessary permissions',
          'You\'re all set! You\'ll be redirected to your dashboard'
        ]
      },
      {
        type: 'heading',
        text: 'Using Email and Password'
      },
      {
        type: 'paragraph',
        text: 'If you prefer not to use Google Sign In, you can create an account with your email:'
      },
      {
        type: 'steps',
        items: [
          'Click "Sign In" then "Create new account"',
          'Enter your first name and surname',
          'Provide your date of birth',
          'Enter your email address',
          'Create a strong password (minimum 6 characters)',
          'Review your information and click "Create Account"'
        ]
      },
      {
        type: 'heading',
        text: 'After Account Creation'
      },
      {
        type: 'paragraph',
        text: 'Once your account is created, you can:'
      },
      {
        type: 'list',
        items: [
          'Browse our extensive library of PDF books',
          'Purchase books and access them instantly',
          'Upload your own PDF books for personal storage',
          'Manage your account settings and preferences',
          'Download purchased books to any device'
        ]
      },
      {
        type: 'note',
        text: 'Important: Keep your login credentials secure. We will never ask for your password via email or phone.'
      }
    ],
    relatedArticles: [
      { title: 'Browsing the Library', slug: 'browsing-the-library' },
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' },
      { title: 'Changing Your Password', slug: 'changing-password' }
    ]
  },

  'browsing-the-library': {
    category: 'Getting Started',
    title: 'Browsing the Library',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Library', 'Browse', 'Navigation'],
    content: [
      {
        type: 'intro',
        text: 'LAN library (Learning Access Network) offers thousands of PDF books across various categories. Learn how to efficiently browse and find the books you need.'
      },
      {
        type: 'heading',
        text: 'Using the Search Bar'
      },
      {
        type: 'paragraph',
        text: 'The search bar at the top of the page is your quickest way to find specific books:'
      },
      {
        type: 'list',
        items: [
          'Search by book title',
          'Search by author name',
          'Search by keywords or topics',
          'Search by category'
        ]
      },
      {
        type: 'heading',
        text: 'Browsing by Category'
      },
      {
        type: 'paragraph',
        text: 'Click on any category from the menu bar to see all books in that category:'
      },
      {
        type: 'list',
        items: [
          'Education - Academic and learning materials',
          'Personal Development - Self-improvement books',
          'Business - Entrepreneurship and management',
          'Technology - Programming and tech guides',
          'Science - Scientific publications and research',
          'Literature - Fiction and creative writing',
          'Health & Wellness - Fitness and mental health',
          'History - Historical accounts and biographies',
          'Arts & Culture - Creative arts and cultural studies'
        ]
      },
      {
        type: 'heading',
        text: 'Filtering and Sorting'
      },
      {
        type: 'paragraph',
        text: 'Use filters to narrow down your search results:'
      },
      {
        type: 'list',
        items: [
          'Sort by popularity, price, or rating',
          'Filter by price range',
          'Filter by format (PDF only)',
          'View related results'
        ]
      },
      {
        type: 'heading',
        text: 'Book Details'
      },
      {
        type: 'paragraph',
        text: 'Click on any book to view detailed information:'
      },
      {
        type: 'list',
        items: [
          'Book cover and title',
          'Author name',
          'Price and discounts',
          'Number of pages',
          'User ratings and reviews',
          'Book description',
          'PDF format badge'
        ]
      }
    ],
    relatedArticles: [
      { title: 'Using the Search Function', slug: 'using-search-function' },
      { title: 'Understanding Book Categories', slug: 'understanding-book-categories' },
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' }
    ]
  },

  'understanding-book-categories': {
    category: 'Getting Started',
    title: 'Understanding Book Categories',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Categories', 'Navigation', 'Library'],
    content: [
      {
        type: 'intro',
        text: 'Our library is organized into 9 main categories to help you find exactly what you\'re looking for. Learn about each category and what types of books you\'ll find there.'
      },
      {
        type: 'heading',
        text: 'Education'
      },
      {
        type: 'paragraph',
        text: 'Academic textbooks, study guides, exam preparation materials, and educational resources for students of all levels.'
      },
      {
        type: 'list',
        items: [
          'Primary and secondary school textbooks',
          'University-level academic books',
          'Professional certification study guides',
          'Language learning materials',
          'Test preparation resources'
        ]
      },
      {
        type: 'heading',
        text: 'Personal Development'
      },
      {
        type: 'paragraph',
        text: 'Books focused on self-improvement, productivity, motivation, and personal growth.'
      },
      {
        type: 'list',
        items: [
          'Self-help and motivation',
          'Leadership and communication skills',
          'Time management and productivity',
          'Emotional intelligence',
          'Career development'
        ]
      },
      {
        type: 'heading',
        text: 'Business'
      },
      {
        type: 'paragraph',
        text: 'Entrepreneurship, management, finance, marketing, and business strategy books.'
      },
      {
        type: 'list',
        items: [
          'Startup and entrepreneurship guides',
          'Business management strategies',
          'Financial planning and investment',
          'Marketing and sales techniques',
          'Business case studies'
        ]
      },
      {
        type: 'heading',
        text: 'Technology'
      },
      {
        type: 'paragraph',
        text: 'Programming, software development, IT infrastructure, and emerging technologies.'
      },
      {
        type: 'list',
        items: [
          'Programming languages (Python, JavaScript, etc.)',
          'Web and mobile development',
          'Data science and AI',
          'Cybersecurity',
          'Cloud computing and DevOps'
        ]
      },
      {
        type: 'heading',
        text: 'Other Categories'
      },
      {
        type: 'list',
        items: [
          'Science - Research papers, scientific discoveries, STEM subjects',
          'Literature - Novels, poetry, plays, creative writing',
          'Health & Wellness - Fitness, nutrition, mental health, medical guides',
          'History - Historical accounts, biographies, cultural studies',
          'Arts & Culture - Visual arts, music, film, cultural criticism'
        ]
      },
      {
        type: 'note',
        text: 'Tip: Books can appear in multiple categories if they cover multiple topics. Use the search function to find books across all categories.'
      }
    ],
    relatedArticles: [
      { title: 'Browsing the Library', slug: 'browsing-the-library' },
      { title: 'Using the Search Function', slug: 'using-search-function' },
      { title: 'Creating Your Account', slug: 'creating-your-account' }
    ]
  },

  'using-search-function': {
    category: 'Getting Started',
    title: 'Using the Search Function',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Search', 'Navigation', 'Tips'],
    content: [
      {
        type: 'intro',
        text: 'Our powerful search function helps you quickly find exactly what you\'re looking for. Learn how to use advanced search techniques to get the best results.'
      },
      {
        type: 'heading',
        text: 'Basic Search'
      },
      {
        type: 'paragraph',
        text: 'The search bar is located at the top of every page. Simply type your query and press Enter or click the search icon.'
      },
      {
        type: 'list',
        items: [
          'Type the book title you\'re looking for',
          'Enter an author\'s name',
          'Use keywords related to your topic',
          'Search by ISBN if you know it'
        ]
      },
      {
        type: 'heading',
        text: 'Search Tips for Better Results'
      },
      {
        type: 'steps',
        items: [
          'Use specific keywords - "Python programming" instead of just "programming"',
          'Try different spellings if you don\'t find results',
          'Use author\'s full name for more accurate results',
          'Check your spelling - the search is case-insensitive but spelling matters',
          'Use quotes for exact phrases - "data science fundamentals"'
        ]
      },
      {
        type: 'heading',
        text: 'Filtering Search Results'
      },
      {
        type: 'paragraph',
        text: 'After searching, you can refine your results:'
      },
      {
        type: 'list',
        items: [
          'Filter by category',
          'Sort by relevance, price, or rating',
          'Filter by price range',
          'View only available books or include pre-orders'
        ]
      },
      {
        type: 'heading',
        text: 'What You Can Search For'
      },
      {
        type: 'list',
        items: [
          'Book titles (full or partial)',
          'Author names',
          'Publishers',
          'Subject topics and keywords',
          'ISBN numbers',
          'Book categories'
        ]
      },
      {
        type: 'note',
        text: 'Pro Tip: If you\'re not finding what you\'re looking for, try browsing by category or contact our support team for assistance in locating a specific book.'
      }
    ],
    relatedArticles: [
      { title: 'Browsing the Library', slug: 'browsing-the-library' },
      { title: 'Understanding Book Categories', slug: 'understanding-book-categories' },
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' }
    ]
  },

  // ==================== PAYMENTS & PRICING ====================
  'how-to-purchase-book': {
    category: 'Payments & Pricing',
    title: 'How to Purchase a Book',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Purchase', 'Payment', 'Books'],
    content: [
      {
        type: 'intro',
        text: 'Purchasing books on Learning Access Network is simple and secure. Once you purchase a book, you get lifetime access to download it anytime.'
      },
      {
        type: 'heading',
        text: 'Finding a Book to Purchase'
      },
      {
        type: 'steps',
        items: [
          'Browse the library or use the search function to find a book',
          'Click on the book to view details including price, author, and description',
          'Review the book information carefully',
          'Click the "Purchase & Access" button'
        ]
      },
      {
        type: 'heading',
        text: 'Completing Your Purchase'
      },
      {
        type: 'paragraph',
        text: 'After clicking "Purchase & Access", a modal will appear showing:'
      },
      {
        type: 'list',
        items: [
          'Book cover and title',
          'Author name',
          'Final price',
          'Information about instant PDF access',
          'Your registered email where the PDF will be sent'
        ]
      },
      {
        type: 'steps',
        items: [
          'Review the purchase details',
          'Click "Proceed to Payment"',
          'Select your preferred payment method',
          'Complete the payment process',
          'Receive instant confirmation'
        ]
      },
      {
        type: 'heading',
        text: 'Accepted Payment Methods'
      },
      {
        type: 'list',
        items: [
          'Credit/Debit Cards (Visa, Mastercard, Verve)',
          'Bank Transfer',
          'Mobile Money (MTN, Airtel, Glo, 9mobile)',
          'USSD Payment'
        ]
      },
      {
        type: 'heading',
        text: 'After Purchase'
      },
      {
        type: 'paragraph',
        text: 'Once your payment is confirmed:'
      },
      {
        type: 'list',
        items: [
          'The PDF will be sent to your registered email immediately',
          'The book will appear in your "My Books" section',
          'You can download it as many times as needed',
          'Access the book from any device by signing in'
        ]
      },
      {
        type: 'note',
        text: 'Note: Due to the digital nature of our products, all sales are final. Please review book details carefully before purchasing.'
      }
    ],
    relatedArticles: [
      { title: 'Accepted Payment Methods', slug: 'payment-methods' },
      { title: 'Downloading Your PDFs', slug: 'downloading-pdfs' },
      { title: 'Refund Policy', slug: 'refund-policy' }
    ]
  },

  'payment-methods': {
    category: 'Payments & Pricing',
    title: 'Accepted Payment Methods',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Payment', 'Methods', 'Cards'],
    content: [
      {
        type: 'intro',
        text: 'We offer multiple secure payment options to make purchasing books convenient for everyone in Nigeria and beyond.'
      },
      {
        type: 'heading',
        text: 'Credit and Debit Cards'
      },
      {
        type: 'paragraph',
        text: 'We accept all major card types:'
      },
      {
        type: 'list',
        items: [
          'Visa',
          'Mastercard',
          'Verve',
          'American Express'
        ]
      },
      {
        type: 'heading',
        text: 'Bank Transfer'
      },
      {
        type: 'paragraph',
        text: 'Pay directly from your bank account:'
      },
      {
        type: 'list',
        items: [
          'Online banking transfer',
          'Direct bank deposit',
          'Instant confirmation upon payment'
        ]
      },
      {
        type: 'heading',
        text: 'Mobile Money'
      },
      {
        type: 'paragraph',
        text: 'Pay using your mobile money wallet:'
      },
      {
        type: 'list',
        items: [
          'MTN Mobile Money',
          'Airtel Money',
          'Glo Mobile Money',
          '9mobile Cash'
        ]
      },
      {
        type: 'heading',
        text: 'USSD Payment'
      },
      {
        type: 'paragraph',
        text: 'Quick payment via USSD code from your phone without internet connection.'
      },
      {
        type: 'heading',
        text: 'Payment Security'
      },
      {
        type: 'list',
        items: [
          'All transactions are encrypted and secure',
          'We never store your full card details',
          'PCI DSS compliant payment processing',
          'Two-factor authentication available',
          '3D Secure protection for card payments'
        ]
      },
      {
        type: 'note',
        text: 'All payments are processed in Nigerian Naira (₦). International cards are accepted and will be converted at current exchange rates.'
      }
    ],
    relatedArticles: [
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' },
      { title: 'Payment Failed', slug: 'payment-failed' },
      { title: 'Refund Policy', slug: 'refund-policy' }
    ]
  },

  'understanding-pricing': {
    category: 'Payments & Pricing',
    title: 'Understanding Pricing',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Pricing', 'Cost', 'Payment'],
    content: [
      {
        type: 'intro',
        text: 'Our pricing is transparent and straightforward. Learn about how books are priced, discounts, and what\'s included with your purchase.'
      },
      {
        type: 'heading',
        text: 'How Books Are Priced'
      },
      {
        type: 'paragraph',
        text: 'Book prices are set based on several factors:'
      },
      {
        type: 'list',
        items: [
          'Publisher\'s recommended price',
          'Book length and complexity',
          'Market demand and availability',
          'Educational vs commercial content',
          'Author reputation and expertise'
        ]
      },
      {
        type: 'heading',
        text: 'What\'s Included in the Price'
      },
      {
        type: 'paragraph',
        text: 'When you purchase a book, you get:'
      },
      {
        type: 'list',
        items: [
          'Lifetime access to the PDF file',
          'Unlimited downloads to any device',
          'Email delivery of the PDF',
          'Access from your "My Books" library',
          'Customer support for any issues',
          'No hidden fees or recurring charges'
        ]
      },
      {
        type: 'heading',
        text: 'Discounts and Promotions'
      },
      {
        type: 'paragraph',
        text: 'We regularly offer special pricing:'
      },
      {
        type: 'list',
        items: [
          'Seasonal sales and promotions',
          'Bundle deals on multiple books',
          'Student discounts (with valid ID)',
          'Newsletter subscriber exclusive offers',
          'First-time buyer discounts'
        ]
      },
      {
        type: 'heading',
        text: 'Price Comparison'
      },
      {
        type: 'paragraph',
        text: 'Our digital PDFs are typically priced:'
      },
      {
        type: 'list',
        items: [
          '30-50% lower than physical books',
          'Competitively priced compared to other digital platforms',
          'No shipping or handling fees',
          'Instant delivery saves time and money'
        ]
      },
      {
        type: 'heading',
        text: 'Currency and Taxes'
      },
      {
        type: 'list',
        items: [
          'All prices displayed in Nigerian Naira (₦)',
          'Prices include applicable taxes',
          'No additional fees at checkout',
          'International cards accepted with automatic conversion'
        ]
      },
      {
        type: 'note',
        text: 'Prices may change over time based on publisher updates or promotions. The price shown at checkout is the final price you\'ll pay.'
      }
    ],
    relatedArticles: [
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' },
      { title: 'Accepted Payment Methods', slug: 'payment-methods' },
      { title: 'Refund Policy', slug: 'refund-policy' }
    ]
  },

  'refund-policy': {
    category: 'Payments & Pricing',
    title: 'Refund Policy',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Refund', 'Policy', 'Returns'],
    content: [
      {
        type: 'intro',
        text: 'Due to the digital nature of our products, we have a specific refund policy. Please read this carefully before making a purchase.'
      },
      {
        type: 'heading',
        text: 'General Refund Policy'
      },
      {
        type: 'paragraph',
        text: 'All sales of digital PDF books are final. Once a book has been delivered to your email and made available in your account, we cannot offer refunds.'
      },
      {
        type: 'heading',
        text: 'Why No Refunds?'
      },
      {
        type: 'paragraph',
        text: 'Digital products are different from physical goods:'
      },
      {
        type: 'list',
        items: [
          'PDFs are instantly delivered and accessible',
          'Content cannot be "returned" once accessed',
          'Files can be copied and shared',
          'Digital products have no inventory or shipping costs to recover'
        ]
      },
      {
        type: 'heading',
        text: 'Exceptions to the Policy'
      },
      {
        type: 'paragraph',
        text: 'We will consider refunds in these specific circumstances:'
      },
      {
        type: 'list',
        items: [
          'You were charged multiple times for the same book',
          'The PDF file is corrupted and cannot be fixed',
          'You received the wrong book entirely',
          'Technical issues prevented you from accessing the book',
          'The book description was significantly misleading'
        ]
      },
      {
        type: 'heading',
        text: 'How to Request a Refund'
      },
      {
        type: 'paragraph',
        text: 'If you believe you qualify for a refund under our exceptions:'
      },
      {
        type: 'steps',
        items: [
          'Contact our support team within 7 days of purchase',
          'Provide your order number and email address',
          'Explain the issue in detail with screenshots if applicable',
          'Our team will review your request within 2-3 business days',
          'If approved, refunds are processed within 5-7 business days'
        ]
      },
      {
        type: 'heading',
        text: 'Before You Purchase'
      },
      {
        type: 'paragraph',
        text: 'To avoid disappointment, we recommend:'
      },
      {
        type: 'list',
        items: [
          'Read the book description and details carefully',
          'Check the preview pages if available',
          'Review the table of contents',
          'Read other customers\' reviews',
          'Contact support if you have questions about a book'
        ]
      },
      {
        type: 'heading',
        text: 'Alternative Solutions'
      },
      {
        type: 'paragraph',
        text: 'If you\'re not satisfied with a purchase, we can offer:'
      },
      {
        type: 'list',
        items: [
          'Technical support to fix access issues',
          'Book replacement if there\'s a technical error',
          'Store credit for future purchases (case-by-case basis)',
          'Recommendations for similar books that may better meet your needs'
        ]
      },
      {
        type: 'note',
        text: 'Important: Refund requests must be made within 7 days of purchase. After this period, all sales are absolutely final.'
      }
    ],
    relatedArticles: [
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' },
      { title: 'Payment Failed', slug: 'payment-failed' },
      { title: 'Downloading Your PDFs', slug: 'downloading-pdfs' }
    ]
  },

  // ==================== DOWNLOADS & ACCESS ====================
  'downloading-pdfs': {
    category: 'Downloads & Access',
    title: 'Downloading Your PDFs',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Download', 'PDF', 'Access'],
    content: [
      {
        type: 'intro',
        text: 'After purchasing a book, you have lifetime access to download the PDF. Here\'s how to access your purchased books.'
      },
      {
        type: 'heading',
        text: 'Accessing My Books'
      },
      {
        type: 'steps',
        items: [
          'Sign in to your account',
          'Click on "My Books" in the top navigation menu',
          'You\'ll see all your purchased and uploaded books',
          'Click the "Download PDF" button on any book',
          'The PDF will begin downloading to your device'
        ]
      },
      {
        type: 'heading',
        text: 'From Your Email'
      },
      {
        type: 'paragraph',
        text: 'Immediately after purchase, the PDF is sent to your registered email:'
      },
      {
        type: 'steps',
        items: [
          'Check your inbox for an email from Learning Access Network',
          'Open the email containing your purchase confirmation',
          'Click the download link in the email',
          'The PDF will download to your device'
        ]
      },
      {
        type: 'note',
        text: 'Tip: If you don\'t see the email, check your spam/junk folder. Add our email to your contacts to ensure future emails arrive in your inbox.'
      },
      {
        type: 'heading',
        text: 'Multiple Device Access'
      },
      {
        type: 'paragraph',
        text: 'You can access your books on unlimited devices:'
      },
      {
        type: 'list',
        items: [
          'Sign in to your account on any device',
          'Navigate to "My Books"',
          'Download the PDF to that device',
          'No additional charges or limitations'
        ]
      },
      {
        type: 'heading',
        text: 'Reading Your PDFs'
      },
      {
        type: 'paragraph',
        text: 'To open and read your downloaded PDFs, you\'ll need a PDF reader:'
      },
      {
        type: 'list',
        items: [
          'Desktop: Adobe Acrobat Reader, Preview (Mac), or browser',
          'Mobile: Adobe Acrobat Reader app, Google PDF Viewer, or built-in readers',
          'Tablet: Same as mobile options'
        ]
      },
      {
        type: 'heading',
        text: 'Troubleshooting Downloads'
      },
      {
        type: 'paragraph',
        text: 'If you experience issues downloading:'
      },
      {
        type: 'list',
        items: [
          'Check your internet connection',
          'Try a different browser',
          'Clear your browser cache and cookies',
          'Disable browser extensions temporarily',
          'Contact support if the problem persists'
        ]
      }
    ],
    relatedArticles: [
      { title: 'PDF Won\'t Open', slug: 'pdf-wont-open' },
      { title: 'Multiple Device Access', slug: 'multiple-device-access' },
      { title: 'Accessing My Books', slug: 'accessing-my-books' }
    ]
  },

  'accessing-my-books': {
    category: 'Downloads & Access',
    title: 'Accessing My Books',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['My Books', 'Library', 'Access'],
    content: [
      {
        type: 'intro',
        text: 'Your personal library contains all books you\'ve purchased and uploaded. Learn how to access and manage your collection.'
      },
      {
        type: 'heading',
        text: 'Finding Your Library'
      },
      {
        type: 'steps',
        items: [
          'Sign in to your Learning Access Network account',
          'Click "My Books" in the top navigation menu',
          'You\'ll see your complete collection of purchased and uploaded books',
          'Books are displayed with covers, titles, and authors'
        ]
      },
      {
        type: 'heading',
        text: 'What\'s in My Books'
      },
      {
        type: 'paragraph',
        text: 'Your library contains two types of books:'
      },
      {
        type: 'list',
        items: [
          'Purchased Books - All books you\'ve bought from our library',
          'Uploaded Books - Personal PDFs you\'ve uploaded for storage'
        ]
      },
      {
        type: 'heading',
        text: 'Managing Your Books'
      },
      {
        type: 'paragraph',
        text: 'From the My Books section, you can:'
      },
      {
        type: 'list',
        items: [
          'Download any book to your device',
          'View book details and descriptions',
          'Sort books by title, author, or purchase date',
          'Search within your personal library',
          'Delete uploaded books (purchased books cannot be deleted)'
        ]
      },
      {
        type: 'heading',
        text: 'Downloading from My Books'
      },
      {
        type: 'steps',
        items: [
          'Locate the book you want to download',
          'Click the "Download PDF" button',
          'The file will download to your device\'s default download location',
          'You can download the same book multiple times at no extra cost'
        ]
      },
      {
        type: 'heading',
        text: 'Uploading Personal Books'
      },
      {
        type: 'paragraph',
        text: 'You can upload your own PDF books for storage:'
      },
      {
        type: 'steps',
        items: [
          'Go to "My Books" section',
          'Click the "Upload Book" button',
          'Select a PDF file from your device (max 50MB)',
          'Add title, author, and optional description',
          'Click "Upload" to add to your library',
          'Uploaded books are private and only visible to you'
        ]
      },
      {
        type: 'heading',
        text: 'Organizing Your Library'
      },
      {
        type: 'paragraph',
        text: 'Keep your collection organized:'
      },
      {
        type: 'list',
        items: [
          'Use the search bar to find specific books quickly',
          'Sort by title, author, or date added',
          'Filter between purchased and uploaded books',
          'View books in grid or list layout',
          'Use tags or categories for better organization'
        ]
      },
      {
        type: 'heading',
        text: 'Viewing Book Details'
      },
      {
        type: 'steps',
        items: [
          'Click on any book cover or title',
          'View full description and details',
          'See purchase date and price (for purchased books)',
          'Access download button',
          'View related books or recommendations'
        ]
      },
      {
        type: 'heading',
        text: 'Deleting Uploaded Books'
      },
      {
        type: 'paragraph',
        text: 'To remove books you\'ve uploaded:'
      },
      {
        type: 'steps',
        items: [
          'Find the uploaded book in your library',
          'Click the three-dot menu icon',
          'Select "Delete Book"',
          'Confirm deletion',
          'Note: This action cannot be undone'
        ]
      },
      {
        type: 'heading',
        text: 'Library Sync Across Devices'
      },
      {
        type: 'paragraph',
        text: 'Your library automatically syncs:'
      },
      {
        type: 'list',
        items: [
          'All changes appear on every device instantly',
          'Uploaded books accessible on all your devices',
          'Downloaded books stored locally on each device',
          'Sign in on any device to access your complete library'
        ]
      },
      {
        type: 'heading',
        text: 'Storage Limits'
      },
      {
        type: 'list',
        items: [
          'Unlimited purchased books - no storage limits',
          'Personal uploads: 100 books or 5GB total',
          'Individual file size limit: 50MB per PDF',
          'Upgrade available for more storage if needed'
        ]
      },
      {
        type: 'note',
        text: 'Tip: Your library syncs across all devices. Books you purchase on mobile will appear on desktop and vice versa. Downloaded files are stored locally on each device.'
      }
    ],
    relatedArticles: [
      { title: 'Downloading Your PDFs', slug: 'downloading-pdfs' },
      { title: 'Multiple Device Access', slug: 'multiple-device-access' },
      { title: 'Troubleshooting Downloads', slug: 'troubleshooting-downloads' }
    ]
  }
};