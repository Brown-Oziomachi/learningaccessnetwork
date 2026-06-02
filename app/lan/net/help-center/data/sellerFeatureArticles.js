export const sellerFeatureArticles = {

  'physical-repository': {
    category: 'Seller Tools',
    title: 'Physical Repository',
    readTime: '4 min read',
    lastUpdated: 'May 2026',
    tags: ['Physical', 'Repository', 'Inventory', 'Registry'],
    content: [
      {
        type: 'intro',
        text: 'The Physical Repository gives you a real-time view of every physical book copy consigned at the LAN Abuja Registry — stock levels, sales, and earnings all update instantly.'
      },
      {
        type: 'heading',
        text: 'What is the Physical Repository?'
      },
      {
        type: 'paragraph',
        text: 'When you deliver physical copies of your books to the LAN Abuja Registry, each copy is logged as an asset with a unique Asset ID. The repository dashboard tracks:'
      },
      {
        type: 'list',
        items: [
          'How many copies are currently on shelf',
          'How many have been sold (picked up by students)',
          'Your earnings from each physical sale',
          'Low stock and out-of-stock alerts',
          'Shelf location at the registry'
        ]
      },
      {
        type: 'heading',
        text: 'Reading your Inventory'
      },
      {
        type: 'paragraph',
        text: 'Each asset card shows a stock health bar:'
      },
      {
        type: 'list',
        items: [
          'Green — Good stock (above 50%)',
          'Amber — Low stock (20–50%)',
          'Red / Critical — Below 20% or out of stock'
        ]
      },
      {
        type: 'heading',
        text: 'Viewing the Sales Ledger'
      },
      {
        type: 'steps',
        items: [
          'Go to your seller dashboard and tap the profile menu',
          'Select "Physical Repository"',
          'Click the "Sales Ledger" tab at the top',
          'See every physical sale with date, student name, Asset ID, and the amount credited to your wallet',
          'Click any asset card to open a detailed drawer with the full sales history for that specific book'
        ]
      },
      {
        type: 'heading',
        text: 'Low Stock Alerts'
      },
      {
        type: 'paragraph',
        text: 'If any title falls to ≤30% of its original consignment, a yellow alert banner appears at the top of the page. Click "View Critical" to filter to those titles and contact the Abuja Registry to arrange a restock.'
      },
      {
        type: 'note',
        text: 'Sales update in real-time. As soon as a student collects a copy at the registry, the stock count drops and the payout is credited to your LAN wallet.'
      }
    ],
    relatedArticles: [
      { title: 'My Physical Orders', slug: 'my-physical-orders' },
      { title: 'Becoming a LAN Seller', slug: 'seller-account-overview' },
      { title: 'Understanding Pricing', slug: 'understanding-pricing' }
    ]
  },

  'my-physical-orders': {
    category: 'Seller Tools',
    title: 'My Physical Orders',
    readTime: '3 min read',
    lastUpdated: 'May 2026',
    tags: ['Physical', 'Orders', 'Pickup', 'Registry'],
    content: [
      {
        type: 'intro',
        text: 'My Physical Orders shows every physical book copy you have reserved at the LAN Abuja Registry, along with the secret pickup code you need to collect it.'
      },
      {
        type: 'heading',
        text: 'How to View Your Orders'
      },
      {
        type: 'steps',
        items: [
          'Open your seller dashboard',
          'Tap the profile menu (three lines, top right)',
          'Select "My Physical Orders"',
          'Your orders appear as ticket-style cards showing the book title and order status'
        ]
      },
      {
        type: 'heading',
        text: 'Order Statuses'
      },
      {
        type: 'list',
        items: [
          'Awaiting Pickup — your copy is reserved at the registry and ready for collection',
          'Completed — the copy has been collected',
          'Cancelled — the reservation was cancelled; you can place a new order'
        ]
      },
      {
        type: 'heading',
        text: 'Revealing Your Pickup Code'
      },
      {
        type: 'steps',
        items: [
          'Find the order card for your book',
          'The pickup code is hidden by default for security',
          'Tap "Reveal Pickup Code" to display it',
          'Show the code to staff at the Abuja Registry to collect your copy',
          'Tap "Hide Code" again after noting it down'
        ]
      },
      {
        type: 'heading',
        text: 'Where to Collect'
      },
      {
        type: 'paragraph',
        text: 'All physical copies are held at the LAN Head Office, Abuja Registry. Each order card also shows the specific shelf location (section and shelf number) so staff can locate your copy quickly.'
      },
      {
        type: 'note',
        text: 'Keep your pickup code private — anyone who presents the code at the registry can collect the copy. Only reveal it when you are physically at the collection point.'
      }
    ],
    relatedArticles: [
      { title: 'Physical Repository', slug: 'physical-repository' },
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' }
    ]
  },

  'print-license-ledger': {
    category: 'Seller Tools',
    title: 'Print License Ledger',
    readTime: '4 min read',
    lastUpdated: 'May 2026',
    tags: ['Print', 'License', 'Royalty', 'Sellers'],
    content: [
      {
        type: 'intro',
        text: 'The Print License Ledger lets you control which of your books students can request a licensed hard copy of — and tracks the royalties you earn from each license sold.'
      },
      {
        type: 'heading',
        text: 'What is Print Licensing?'
      },
      {
        type: 'paragraph',
        text: 'When print licensing is enabled on a book, students can purchase a "Get Hard-Copy License" through LAN Library. The platform arranges the print and you earn a royalty on each copy sold.'
      },
      {
        type: 'list',
        items: [
          'You earn 80% of the license fee as a royalty',
          'LAN Library retains 20% as a platform commission',
          'Royalties are credited instantly to your LAN wallet',
          'You can enable or disable licensing per book at any time'
        ]
      },
      {
        type: 'heading',
        text: 'Enabling Print Licensing'
      },
      {
        type: 'steps',
        items: [
          'Open your seller dashboard and tap the profile menu',
          'Select "Print License Ledger"',
          'You will see a table listing all your approved books',
          'Find the book you want to enable and toggle the switch to ON',
          'The change takes effect immediately — students will now see the hard-copy option on that book'
        ]
      },
      {
        type: 'heading',
        text: 'Disabling Print Licensing'
      },
      {
        type: 'paragraph',
        text: 'Toggle the switch to OFF at any time. This immediately removes the "Get Hard-Copy License" button from the book page. Any licenses already sold remain valid; only new purchases are blocked.'
      },
      {
        type: 'heading',
        text: 'Reading the Stats'
      },
      {
        type: 'list',
        items: [
          'Total Books — number of your approved books',
          'Licensing On — books currently available for print licensing',
          'Licensing Off — books where print licensing is disabled',
          'Royalties Earned — cumulative royalties credited to your wallet'
        ]
      },
      {
        type: 'note',
        text: 'Print licensing is only available for books that have been approved by the LAN admin team. If a book does not appear in the list, it is still pending approval.'
      }
    ],
    relatedArticles: [
      { title: 'Physical Repository', slug: 'physical-repository' },
      { title: 'Understanding Pricing', slug: 'understanding-pricing' },
      { title: 'Accepted Payment Methods', slug: 'payment-methods' }
    ]
  },

  'promotion-analytics': {
    category: 'Seller Tools',
    title: 'Promotion Analytics',
    readTime: '4 min read',
    lastUpdated: 'May 2026',
    tags: ['Ads', 'Promotions', 'Analytics', 'CTR'],
    content: [
      {
        type: 'intro',
        text: 'Promotion Analytics gives you real-time performance data for every sponsored ad you have run on LAN Library — impressions, clicks, click-through rate (CTR), and a 7-day chart.'
      },
      {
        type: 'heading',
        text: 'Understanding Your Metrics'
      },
      {
        type: 'list',
        items: [
          'Impressions — the number of times your ad appeared on screen (counted when at least 50% of the ad is visible)',
          'Clicks — how many times students clicked your ad',
          'CTR (Click-Through Rate) — clicks ÷ impressions × 100. A higher CTR means your ad is compelling',
          'Days Left — how many days remain on your current campaign'
        ]
      },
      {
        type: 'heading',
        text: 'CTR Quality Benchmarks'
      },
      {
        type: 'list',
        items: [
          '3% and above — Excellent',
          '1–3% — Good',
          'Below 1% — Needs attention (consider a new headline or banner image)'
        ]
      },
      {
        type: 'heading',
        text: 'Reading the 7-Day Chart'
      },
      {
        type: 'paragraph',
        text: 'Each ad card shows a bar chart of clicks over the last 7 days. Days with no clicks show a grey bar. Use this to spot which days students engage most and time future campaigns accordingly.'
      },
      {
        type: 'heading',
        text: 'Filtering Your Campaigns'
      },
      {
        type: 'steps',
        items: [
          'Open your seller dashboard and tap the profile menu',
          'Select "Promotion Analytics"',
          'Use the filter tabs — All, Active, Pending, Expired — to find specific campaigns',
          'Click "Refresh" to pull the latest impression and click data'
        ]
      },
      {
        type: 'heading',
        text: 'Ad Tiers'
      },
      {
        type: 'list',
        items: [
          'Gold Tier — highest visibility, shown on the student homepage',
          'Silver Tier — mid-level placement across category pages',
          'Bronze Tier — entry-level placement in search results'
        ]
      },
      {
        type: 'note',
        text: 'Low CTR Tip: If your ad has over 50 impressions but a CTR below 1%, a yellow warning card will appear. Try rewriting your headline to highlight a specific benefit (e.g. "Pass ECO 301 — step-by-step solutions included").'
      }
    ],
    relatedArticles: [
      { title: 'Impact Analytics', slug: 'impact-analytics' },
      { title: 'Becoming a LAN Seller', slug: 'seller-account-overview' }
    ]
  },

  'impact-analytics': {
    category: 'Seller Tools',
    title: 'Impact Analytics',
    readTime: '5 min read',
    lastUpdated: 'May 2026',
    tags: ['Analytics', 'Faculty', 'Students', 'Reach'],
    content: [
      {
        type: 'intro',
        text: 'Impact Analytics (also called Faculty Analytics) gives sellers and faculty members a deep view of how their materials are performing — downloads, views, departmental reach, wishlist demand, student engagement, and book feedback all in one place.'
      },
      {
        type: 'heading',
        text: 'Who Can Access Impact Analytics?'
      },
      {
        type: 'list',
        items: [
          'All approved sellers — to track digital and physical sales',
          'Verified faculty members (Dr., Prof., Engr., Barr., Pharm., Lecturer titles) — get automatic access',
          'Role-based lecturers — access unlocks after admin verifies credentials (24–48 hours)'
        ]
      },
      {
        type: 'heading',
        text: 'Overview Tab'
      },
      {
        type: 'paragraph',
        text: 'The Overview tab shows your top-level performance at a glance:'
      },
      {
        type: 'list',
        items: [
          'Total Sales — combined digital downloads and physical copies sold',
          'Total Views — number of times your book pages were visited',
          'Wishlisted — students who have saved your materials for later',
          'Pending Pickup — physical copies reserved but not yet collected',
          'Student / Buyer Reach — unique departments that have purchased your work',
          'Feedback — number of reviews left on your books'
        ]
      },
      {
        type: 'heading',
        text: 'Course Breakdown (Faculty view)'
      },
      {
        type: 'paragraph',
        text: 'Faculty members see a breakdown per course code showing views, digital sales, physical sales, reviews, and a total engagement score. The highest-scoring course is marked "Top".'
      },
      {
        type: 'heading',
        text: 'Future Demand Signal'
      },
      {
        type: 'paragraph',
        text: 'The navy panel at the bottom of the Overview tab shows how many students have wishlisted your materials and which countries they are in. A high wishlist count signals strong future demand — consider uploading more materials for those topics.'
      },
      {
        type: 'heading',
        text: 'Other Tabs'
      },
      {
        type: 'list',
        items: [
          'Digital Sales — downloads per book, broken down by department',
          'Physical (N) — inventory at the Abuja Registry, pending pickups, and completed sales ledger',
          'Wishlist & Countries — which countries your materials are saved in',
          'Course Students / Buyers — students whose enrolled courses match your course codes, or a breakdown of buyers by department',
          'Feedback — all reviews with sentiment analysis (Positive, Neutral, Needs Review) and star ratings'
        ]
      },
      {
        type: 'note',
        text: 'If you see "Analytics Locked", your faculty credentials are still under review. Verification typically takes 24–48 hours after document submission.'
      }
    ],
    relatedArticles: [
      { title: 'Promotion Analytics', slug: 'promotion-analytics' },
      { title: 'How the Bounty Board Works', slug: 'bounty-board' },
      { title: 'Becoming a LAN Seller', slug: 'seller-account-overview' }
    ]
  },

  'reset-transfer-pin': {
    category: 'Account Management',
    title: 'Reset Transfer PIN',
    readTime: '3 min read',
    lastUpdated: 'May 2026',
    tags: ['PIN', 'Security', 'Transfer', 'Withdrawal'],
    content: [
      {
        type: 'intro',
        text: 'Your Transfer PIN is a 4-digit code that authorises withdrawals and transfers from your LAN wallet. If you forget it, you can reset it securely using your registered email.'
      },
      {
        type: 'heading',
        text: 'How to Reset Your Transfer PIN'
      },
      {
        type: 'steps',
        items: [
          'Open your seller dashboard and tap the profile menu (three lines, top right)',
          'Select "Reset Transfer PIN"',
          'Click "Send Reset Code" — a 6-digit code will be sent to your registered email address',
          'Check your inbox (and spam folder) for the email from LAN Library',
          'Enter the 6-digit code in the first field',
          'Enter your new 4-digit PIN in the second field',
          'Click "Reset PIN & Save" to confirm'
        ]
      },
      {
        type: 'heading',
        text: 'PIN Requirements'
      },
      {
        type: 'list',
        items: [
          'Must be exactly 4 digits',
          'Do not use obvious sequences like 1234 or 0000',
          'Never share your PIN with anyone — LAN support staff will never ask for it',
          'Your PIN is separate from your account password'
        ]
      },
      {
        type: 'heading',
        text: 'When Is the PIN Used?'
      },
      {
        type: 'list',
        items: [
          'Confirming a withdrawal to your bank account',
          'Authorising a wallet-to-wallet transfer to another user',
          'Any transaction that moves funds out of your LAN wallet'
        ]
      },
      {
        type: 'heading',
        text: 'Troubleshooting'
      },
      {
        type: 'list',
        items: [
          'Did not receive the code — check spam/junk, then try again after 2 minutes',
          '"Invalid code" error — codes expire after 10 minutes; request a new one',
          'Still locked out — contact LAN support with your registered email address'
        ]
      },
      {
        type: 'note',
        text: 'Security reminder: LAN Library will never ask for your PIN via email, phone call, or chat. If anyone claiming to be LAN support asks for your PIN, do not share it.'
      }
    ],
    relatedArticles: [
      { title: 'Changing Your Password', slug: 'changing-password' },
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' },
      { title: 'Accepted Payment Methods', slug: 'payment-methods' }
    ]
  }

};