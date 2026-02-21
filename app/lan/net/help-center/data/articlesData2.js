// PART 2: Account Management, Security & Privacy, Technical Support
export const articlesP2 = {
  // ==================== DOWNLOADS & ACCESS (continued) ====================
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
          'You\'ll see your complete collection',
          'Books display with covers, titles, and authors'
        ]
      },
      {
        type: 'heading',
        text: 'Managing Your Collection'
      },
      {
        type: 'list',
        items: [
          'Download any book to your device',
          'View book details and descriptions',
          'Sort by title, author, or date',
          'Search within your library',
          'Upload personal PDFs for storage'
        ]
      },
      {
        type: 'note',
        text: 'Your library syncs across all devices. Books you purchase on mobile will appear on desktop and vice versa.'
      }
    ],
    relatedArticles: [
      { title: 'Downloading Your PDFs', slug: 'downloading-pdfs' },
      { title: 'Multiple Device Access', slug: 'multiple-device-access' },
      { title: 'Troubleshooting Downloads', slug: 'troubleshooting-downloads' }
    ]
  },

  'multiple-device-access': {
    category: 'Downloads & Access',
    title: 'Multiple Device Access',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Devices', 'Access', 'Sync'],
    content: [
      {
        type: 'intro',
        text: 'Access your purchased books on unlimited devices with a single account. Your library syncs automatically across all platforms.'
      },
      {
        type: 'heading',
        text: 'Supported Devices'
      },
      {
        type: 'paragraph',
        text: 'You can access Learning Access Network on:'
      },
      {
        type: 'list',
        items: [
          'Desktop computers (Windows, Mac, Linux)',
          'Laptops and notebooks',
          'Smartphones (iOS and Android)',
          'Tablets (iPad, Android tablets)',
          'Any device with a web browser'
        ]
      },
      {
        type: 'heading',
        text: 'How to Access on New Devices'
      },
      {
        type: 'steps',
        items: [
          'Open a web browser on your new device',
          'Go to the Learning Access Network website',
          'Sign in with your account credentials',
          'Navigate to "My Books"',
          'Download any book to that device'
        ]
      },
      {
        type: 'heading',
        text: 'Automatic Sync'
      },
      {
        type: 'paragraph',
        text: 'Your account automatically syncs:'
      },
      {
        type: 'list',
        items: [
          'All purchased books appear on every device',
          'Uploaded books are accessible everywhere',
          'Account settings sync across devices',
          'No manual setup required'
        ]
      },
      {
        type: 'heading',
        text: 'Device Limits'
      },
      {
        type: 'paragraph',
        text: 'We believe in unlimited access:'
      },
      {
        type: 'list',
        items: [
          'No limit on number of devices',
          'Sign in on as many devices as you need',
          'Download books to all your devices',
          'No additional fees for multiple devices'
        ]
      },
      {
        type: 'heading',
        text: 'Managing Devices'
      },
      {
        type: 'paragraph',
        text: 'For security, you can:'
      },
      {
        type: 'list',
        items: [
          'View active login sessions in Account Settings',
          'Sign out of all devices remotely',
          'Change your password if you suspect unauthorized access',
          'Enable two-factor authentication for extra security'
        ]
      },
      {
        type: 'note',
        text: 'Tip: Download books to devices for offline reading when you won\'t have internet access.'
      }
    ],
    relatedArticles: [
      { title: 'Downloading Your PDFs', slug: 'downloading-pdfs' },
      { title: 'Accessing My Books', slug: 'accessing-my-books' },
      { title: 'Data Protection', slug: 'data-protection' }
    ]
  },

  'troubleshooting-downloads': {
    category: 'Downloads & Access',
    title: 'Troubleshooting Downloads',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Troubleshooting', 'Downloads', 'Support'],
    content: [
      {
        type: 'intro',
        text: 'Having trouble downloading your books? Here are common issues and their solutions.'
      },
      {
        type: 'heading',
        text: 'Download Won\'t Start'
      },
      {
        type: 'paragraph',
        text: 'If clicking download does nothing:'
      },
      {
        type: 'list',
        items: [
          'Check your internet connection',
          'Try a different browser (Chrome, Firefox, Safari)',
          'Disable pop-up blockers temporarily',
          'Clear browser cache and cookies',
          'Try downloading on a different device'
        ]
      },
      {
        type: 'heading',
        text: 'Download Stops Midway'
      },
      {
        type: 'paragraph',
        text: 'If downloads fail partway through:'
      },
      {
        type: 'steps',
        items: [
          'Ensure stable internet connection',
          'Check available storage space on your device',
          'Pause other downloads or streaming',
          'Try downloading during off-peak hours',
          'Use a download manager for large files'
        ]
      },
      {
        type: 'heading',
        text: 'File Size Issues'
      },
      {
        type: 'list',
        items: [
          'Large PDFs (100MB+) take longer to download',
          'Ensure sufficient storage space before downloading',
          'Mobile data may be slow - use WiFi for large files',
          'Check your data plan if using mobile connection'
        ]
      },
      {
        type: 'heading',
        text: 'Browser-Specific Issues'
      },
      {
        type: 'paragraph',
        text: 'Try these browser-specific fixes:'
      },
      {
        type: 'list',
        items: [
          'Chrome: Check Downloads folder, disable extensions',
          'Firefox: Clear recent history, check download settings',
          'Safari: Check Downloads folder in Finder',
          'Edge: Clear browsing data, check download location'
        ]
      },
      {
        type: 'heading',
        text: 'Mobile Device Issues'
      },
      {
        type: 'list',
        items: [
          'iOS: Files save to Files app - check Downloads folder',
          'Android: Check Downloads folder or notification area',
          'Ensure app permissions allow downloads',
          'Try Safari (iOS) or Chrome (Android) browsers'
        ]
      },
      {
        type: 'heading',
        text: 'Still Having Problems?'
      },
      {
        type: 'paragraph',
        text: 'If nothing works:'
      },
      {
        type: 'steps',
        items: [
          'Note the book title and error message',
          'Take a screenshot if possible',
          'Contact our support team',
          'Provide your account email',
          'We\'ll send the PDF directly to your email'
        ]
      },
      {
        type: 'note',
        text: 'Emergency Access: If you urgently need a book, contact support and we can email it to you directly while we troubleshoot the download issue.'
      }
    ],
    relatedArticles: [
      { title: 'Downloading Your PDFs', slug: 'downloading-pdfs' },
      { title: 'PDF Won\'t Open', slug: 'pdf-wont-open' },
      { title: 'Website Not Loading', slug: 'website-not-loading' }
    ]
  },

  // ==================== ACCOUNT MANAGEMENT ====================
  'updating-profile': {
    category: 'Account Management',
    title: 'Updating Profile Information',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Profile', 'Account', 'Settings'],
    content: [
      {
        type: 'intro',
        text: 'Keep your account information up-to-date. Here\'s how to edit your profile details.'
      },
      {
        type: 'heading',
        text: 'Accessing Your Profile'
      },
      {
        type: 'steps',
        items: [
          'Sign in to your account',
          'Click "My Account" in the top navigation',
          'You\'ll see all your profile information'
        ]
      },
      {
        type: 'heading',
        text: 'What You Can Update'
      },
      {
        type: 'list',
        items: [
          'First name and surname',
          'Bank details',
          'Email address',
          'Date of birth',
          'Phone number',
          'Profile picture',
          'Country and language preferences'
        ]
      },
      {
        type: 'heading',
        text: 'Updating Your Email'
      },
      {
        type: 'steps',
        items: [
          'Go to Profile settings',
          'Click "Change Email"',
          'Enter your new email address',
          'Verify with your current password',
          'Confirm via email sent to new address',
          'Your email is updated once verified'
        ]
      },
      {
        type: 'heading',
        text: 'Updating Personal Details'
      },
      {
        type: 'steps',
        items: [
          'Click on your Profile image',
          'Update the fields you want to change',
          'Click "Save Changes"',
          'Changes take effect immediately'
        ]
      },
      {
        type: 'note',
        text: 'Important: Changing your email will affect where purchase confirmations and PDFs are sent. Update it carefully.'
      }
    ],
    relatedArticles: [
      { title: 'Changing Your Password', slug: 'changing-password' },
      { title: 'Email Preferences', slug: 'email-preferences' },
      { title: 'Deleting Your Account', slug: 'deleting-account' }
    ]
  },

  'changing-password': {
    category: 'Account Management',
    title: 'Changing Your Password',
    readTime: '2 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Password', 'Security', 'Account'],
    content: [
      {
        type: 'intro',
        text: 'Keep your account secure by regularly updating your password. Here\'s how to change it.'
      },
      {
        type: 'heading',
        text: 'From Account Settings'
      },
      {
        type: 'steps',
        items: [
          'Sign in to your account',
          'Click "Account" in the top menu',
          'Select "Settings" from dropdown',
          'Click "Security" tab',
          'Click "Change Password"',
          'Enter current password',
          'Enter new password (min 6 characters)',
          'Confirm new password',
          'Click "Save Changes"'
        ]
      },
      {
        type: 'heading',
        text: 'If You Forgot Your Password'
      },
      {
        type: 'steps',
        items: [
          'Go to sign-in page',
          'Click "Forgotten password?"',
          'Enter registered email',
          'Click "Continue"',
          'Check email for reset link',
          'Click link in email',
          'Enter new password',
          'Confirm and save'
        ]
      },
      {
        type: 'heading',
        text: 'Password Requirements'
      },
      {
        type: 'list',
        items: [
          'Minimum 6 characters',
          'Mix of letters and numbers recommended',
          'Avoid common passwords',
          'Don\'t reuse old passwords',
          'Never share your password'
        ]
      },
      {
        type: 'note',
        text: 'Security Tip: Use unique passwords for each website. Consider a password manager to generate and store strong passwords.'
      }
    ],
    relatedArticles: [
      { title: 'Creating Your Account', slug: 'creating-your-account' },
      { title: 'Data Protection', slug: 'data-protection' },
      { title: 'Updating Profile Information', slug: 'updating-profile' }
    ]
  },

  'email-preferences': {
    category: 'Account Management',
    title: 'Email Preferences',
    readTime: '3 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Email', 'Notifications', 'Settings'],
    content: [
      {
        type: 'intro',
        text: 'Control what emails you receive from us. Customize your notification preferences to suit your needs.'
      },
      {
        type: 'heading',
        text: 'Managing Email Settings'
      },
      {
        type: 'steps',
        items: [
          'Sign in to your account',
          'Go to Account > Settings',
          'Click "Email Preferences"',
          'Toggle options on or off',
          'Click "Save Preferences"'
        ]
      },
      {
        type: 'heading',
        text: 'Types of Emails We Send'
      },
      {
        type: 'paragraph',
        text: 'You can control these email types:'
      },
      {
        type: 'list',
        items: [
          'Purchase confirmations (cannot be disabled)',
          'Order receipts and invoices',
          'New book releases and recommendations',
          'Promotional offers and discounts',
          'Newsletter and educational content',
          'Account security alerts (cannot be disabled)'
        ]
      },
      {
        type: 'heading',
        text: 'Essential Emails'
      },
      {
        type: 'paragraph',
        text: 'These emails cannot be disabled:'
      },
      {
        type: 'list',
        items: [
          'Purchase confirmations with PDF links',
          'Password reset emails',
          'Security alerts about account activity',
          'Important account notifications'
        ]
      },
      {
        type: 'heading',
        text: 'Unsubscribe from Marketing'
      },
      {
        type: 'steps',
        items: [
          'Open any marketing email',
          'Scroll to bottom',
          'Click "Unsubscribe"',
          'Confirm your choice',
          'Or manage all preferences in account settings'
        ]
      },
      {
        type: 'heading',
        text: 'Email Frequency'
      },
      {
        type: 'paragraph',
        text: 'You can choose how often you hear from us:'
      },
      {
        type: 'list',
        items: [
          'Daily - Get updates every day',
          'Weekly - Receive weekly digest',
          'Monthly - Monthly newsletter only',
          'None - Only essential emails'
        ]
      },
      {
        type: 'note',
        text: 'Tip: We recommend keeping purchase confirmations enabled so you always have access to download links.'
      }
    ],
    relatedArticles: [
      { title: 'Updating Profile Information', slug: 'updating-profile' },
      { title: 'Data Protection', slug: 'data-protection' },
      { title: 'Privacy Policy', slug: 'privacy-policy' }
    ]
  },

  'deleting-account': {
    category: 'Account Management',
    title: 'Deleting Your Account',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Delete', 'Account', 'Privacy'],
    content: [
      {
        type: 'intro',
        text: 'We\'re sorry to see you go. Here\'s what you need to know about deleting your account.'
      },
      {
        type: 'heading',
        text: 'Before You Delete'
      },
      {
        type: 'paragraph',
        text: 'Important things to consider:'
      },
      {
        type: 'list',
        items: [
          'You will lose access to all purchased books',
          'Purchased books cannot be re-downloaded',
          'Account deletion is permanent and cannot be undone',
          'Any unused credits or refunds will be forfeited',
          'You cannot create a new account with the same email for 30 days'
        ]
      },
      {
        type: 'heading',
        text: 'Download Your Books First'
      },
      {
        type: 'paragraph',
        text: 'Before deleting, make sure to:'
      },
      {
        type: 'steps',
        items: [
          'Go to "My Books"',
          'Download all purchased books to your device',
          'Save them to a secure location',
          'Verify files open correctly',
          'Only then proceed with account deletion'
        ]
      },
      {
        type: 'heading',
        text: 'How to Delete Your Account'
      },
      {
        type: 'steps',
        items: [
          'Sign in to your account',
          'Go to Account > Settings',
          'Scroll to bottom and click "Delete Account"',
          'Read the warning message carefully',
          'Enter your password to confirm',
          'Click "Permanently Delete Account"',
          'You\'ll receive confirmation email'
        ]
      },
      {
        type: 'heading',
        text: 'What Gets Deleted'
      },
      {
        type: 'list',
        items: [
          'Your profile information',
          'Purchase history and receipts',
          'Access to all purchased books',
          'Uploaded personal PDFs',
          'Saved preferences and settings',
          'Email subscription lists'
        ]
      },
      {
        type: 'heading',
        text: 'What We Keep'
      },
      {
        type: 'paragraph',
        text: 'For legal and business purposes, we retain:'
      },
      {
        type: 'list',
        items: [
          'Transaction records (for accounting)',
          'Tax documentation (as required by law)',
          'Fraud prevention data',
          'This data is anonymized where possible'
        ]
      },
      {
        type: 'heading',
        text: 'Alternatives to Deletion'
      },
      {
        type: 'paragraph',
        text: 'Instead of deleting, you could:'
      },
      {
        type: 'list',
        items: [
          'Simply stop using the account (no fees)',
          'Unsubscribe from all marketing emails',
          'Update your email preferences',
          'Contact support about specific concerns'
        ]
      },
      {
        type: 'note',
        text: 'Need help? Contact our support team before deleting. We may be able to resolve your concerns without account deletion.'
      }
    ],
    relatedArticles: [
      { title: 'Data Protection', slug: 'data-protection' },
      { title: 'Privacy Policy', slug: 'privacy-policy' },
      { title: 'Updating Profile Information', slug: 'updating-profile' }
    ]
  },

  // ==================== SECURITY & PRIVACY ====================
  'data-protection': {
    category: 'Security & Privacy',
    title: 'Data Protection',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Security', 'Privacy', 'Data'],
    content: [
      {
        type: 'intro',
        text: 'We take your data security seriously. Learn about how we protect your personal information.'
      },
      {
        type: 'heading',
        text: 'How We Protect Your Data'
      },
      {
        type: 'list',
        items: [
          'Industry-standard SSL/TLS encryption',
          'Secure payment processing (PCI DSS compliant)',
          'Regular security audits and updates',
          'Encrypted database storage',
          'Two-factor authentication available',
          'Strict access controls for staff'
        ]
      },
      {
        type: 'heading',
        text: 'What Data We Collect'
      },
      {
        type: 'paragraph',
        text: 'We collect only necessary information:'
      },
      {
        type: 'list',
        items: [
          'Name and email address',
          'Payment information (not stored fully)',
          'Purchase history',
          'Device and browser information',
          'IP address for security',
          'Usage analytics (anonymized)'
        ]
      },
      {
        type: 'heading',
        text: 'How We Use Your Data'
      },
      {
        type: 'list',
        items: [
          'Process your purchases',
          'Send purchase confirmations and PDFs',
          'Provide customer support',
          'Improve our services',
          'Prevent fraud and abuse',
          'Marketing (with your consent)'
        ]
      },
      {
        type: 'heading',
        text: 'Your Data Rights'
      },
      {
        type: 'paragraph',
        text: 'You have the right to:'
      },
      {
        type: 'list',
        items: [
          'Access your personal data',
          'Correct inaccurate information',
          'Request data deletion',
          'Export your data',
          'Opt-out of marketing',
          'Withdraw consent anytime'
        ]
      },
      {
        type: 'heading',
        text: 'Data Sharing'
      },
      {
        type: 'paragraph',
        text: 'We never sell your data. We only share with:'
      },
      {
        type: 'list',
        items: [
          'Payment processors (to complete transactions)',
          'Email service providers (to send confirmations)',
          'Analytics services (anonymized data only)',
          'As required by law'
        ]
      },
      {
        type: 'note',
        text: 'Questions about your data? Contact our privacy team at privacy@learningaccess.net'
      }
    ],
    relatedArticles: [
      { title: 'Privacy Policy', slug: 'privacy-policy' },
      { title: 'Cookie Policy', slug: 'cookie-policy' },
      { title: 'Deleting Your Account', slug: 'deleting-account' }
    ]
  },

  'privacy-policy': {
    category: 'Security & Privacy',
    title: 'Privacy Policy',
    readTime: '8 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Privacy', 'Policy', 'Legal'],
    content: [
      {
        type: 'intro',
        text: 'This Privacy Policy explains how Learning Access Network collects, uses, and protects your personal information.'
      },
      {
        type: 'heading',
        text: 'Information We Collect'
      },
      {
        type: 'paragraph',
        text: 'We collect information you provide directly:'
      },
      {
        type: 'list',
        items: [
          'Account registration data (name, email, password)',
          'Profile information you choose to add',
          'Payment information for purchases',
          'Communications with our support team',
          'Books you upload to your library'
        ]
      },
      {
        type: 'heading',
        text: 'Automatically Collected Information'
      },
      {
        type: 'list',
        items: [
          'Device and browser type',
          'IP address and location',
          'Pages visited and actions taken',
          'Time and date of visits',
          'Referring website'
        ]
      },
      {
        type: 'heading',
        text: 'How We Use Your Information'
      },
      {
        type: 'list',
        items: [
          'Provide and improve our services',
          'Process transactions and send confirmations',
          'Respond to support requests',
          'Send marketing communications (with consent)',
          'Detect and prevent fraud',
          'Comply with legal obligations'
        ]
      },
      {
        type: 'heading',
        text: 'Information Sharing'
      },
      {
        type: 'paragraph',
        text: 'We share information only as necessary:'
      },
      {
        type: 'list',
        items: [
          'With payment processors for transactions',
          'With service providers who assist operations',
          'When required by law or legal process',
          'To protect our rights and prevent fraud',
          'With your consent for other purposes'
        ]
      },
      {
        type: 'heading',
        text: 'Your Rights and Choices'
      },
      {
        type: 'list',
        items: [
          'Access your personal data',
          'Correct or update information',
          'Delete your account and data',
          'Object to certain processing',
          'Export your data',
          'Withdraw consent for marketing'
        ]
      },
      {
        type: 'heading',
        text: 'Data Security'
      },
      {
        type: 'paragraph',
        text: 'We implement appropriate technical and organizational measures including encryption, access controls, and regular security assessments.'
      },
      {
        type: 'heading',
        text: 'Children\'s Privacy'
      },
      {
        type: 'paragraph',
        text: 'Our services are not intended for children under 13. We do not knowingly collect information from children.'
      },
      {
        type: 'heading',
        text: 'Contact Us'
      },
      {
        type: 'paragraph',
        text: 'For privacy questions: privacy@learningaccess.net'
      },
      {
        type: 'note',
        text: 'This is a summary. For the complete legal policy, visit our full Privacy Policy page.'
      }
    ],
    relatedArticles: [
      { title: 'Data Protection', slug: 'data-protection' },
      { title: 'Terms of Service', slug: 'terms-of-service' },
      { title: 'Cookie Policy', slug: 'cookie-policy' }
    ]
  },

  'terms-of-service': {
    category: 'Security & Privacy',
    title: 'Terms of Service',
    readTime: '7 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Terms', 'Legal', 'Policy'],
    content: [
      {
        type: 'intro',
        text: 'By using Learning Access Network, you agree to these Terms of Service. Please read them carefully.'
      },
      {
        type: 'heading',
        text: 'Acceptance of Terms'
      },
      {
        type: 'paragraph',
        text: 'By creating an account or using our services, you agree to be bound by these terms and all applicable laws.'
      },
      {
        type: 'heading',
        text: 'Account Responsibilities'
      },
      {
        type: 'list',
        items: [
          'You must be 18 or older to create an account',
          'Provide accurate registration information',
          'Keep your password secure and confidential',
          'You\'re responsible for all activity under your account',
          'Notify us immediately of unauthorized access'
        ]
      },
      {
        type: 'heading',
        text: 'Permitted Use'
      },
      {
        type: 'paragraph',
        text: 'You may:'
      },
      {
        type: 'list',
        items: [
          'Purchase and download books for personal use',
          'Access books on multiple personal devices',
          'Upload personal PDFs for your own storage',
          'Share purchased books within your household'
        ]
      },
      {
        type: 'heading',
        text: 'Prohibited Activities'
      },
      {
        type: 'paragraph',
        text: 'You may not:'
      },
      {
        type: 'list',
        items: [
          'Share your account credentials with others',
          'Resell or distribute purchased books',
          'Remove copyright notices or watermarks',
          'Use bots or automated systems',
          'Violate any laws or regulations',
          'Infringe intellectual property rights'
        ]
      },
      {
        type: 'heading',
        text: 'Intellectual Property'
      },
      {
        type: 'paragraph',
        text: 'All content is protected by copyright. You receive a limited license for personal use only.'
      },
      {
        type: 'heading',
        text: 'Purchases and Payments'
      },
      {
        type: 'list',
        items: [
          'All prices in Nigerian Naira unless stated',
          'Prices subject to change without notice',
          'Sales are final (see Refund Policy)',
          'You authorize us to charge your payment method'
        ]
      },
      {
        type: 'heading',
        text: 'Account Termination'
      },
      {
        type: 'paragraph',
        text: 'We may suspend or terminate accounts that violate these terms without refund.'
      },
      {
        type: 'heading',
        text: 'Disclaimer of Warranties'
      },
      {
        type: 'paragraph',
        text: 'Services provided "as is" without warranties. We don\'t guarantee uninterrupted access.'
      },
      {
        type: 'heading',
        text: 'Changes to Terms'
      },
      {
        type: 'paragraph',
        text: 'We may update these terms. Continued use constitutes acceptance of changes.'
      },
      {
        type: 'note',
        text: 'Questions about these terms? Contact legal@learningaccess.net'
      }
    ],
    relatedArticles: [
      { title: 'Privacy Policy', slug: 'privacy-policy' },
      { title: 'Refund Policy', slug: 'refund-policy' },
      { title: 'Data Protection', slug: 'data-protection' }
    ]
  },

  'cookie-policy': {
    category: 'Security & Privacy',
    title: 'Cookie Policy',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Cookies', 'Privacy', 'Policy'],
    content: [
      {
        type: 'intro',
        text: 'We use cookies and similar technologies to improve your experience. Learn about the cookies we use and how to control them.'
      },
      {
        type: 'heading',
        text: 'What Are Cookies?'
      },
      {
        type: 'paragraph',
        text: 'Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and improve your experience.'
      },
      {
        type: 'heading',
        text: 'Types of Cookies We Use'
      },
      {
        type: 'paragraph',
        text: 'Essential Cookies (Required):'
      },
      {
        type: 'list',
        items: [
          'Authentication - Keep you signed in',
          'Security - Protect against fraud',
          'Shopping cart - Remember your selections',
          'These cookies cannot be disabled'
        ]
      },
      {
        type: 'paragraph',
        text: 'Performance Cookies (Optional):'
      },
      {
        type: 'list',
        items: [
          'Analytics - Understand how you use our site',
          'Error tracking - Identify technical issues',
          'Site optimization - Improve load times'
        ]
      },
      {
        type: 'paragraph',
        text: 'Functionality Cookies (Optional):'
      },
      {
        type: 'list',
        items: [
          'Remember your preferences',
          'Save language settings',
          'Personalize your experience'
        ]
      },
      {
        type: 'paragraph',
        text: 'Marketing Cookies (Optional):'
      },
      {
        type: 'list',
        items: [
          'Show relevant ads',
          'Track ad performance',
          'Limit ad frequency'
        ]
      },
      {
        type: 'heading',
        text: 'Managing Cookies'
      },
      {
        type: 'paragraph',
        text: 'You can control cookies through:'
      },
      {
        type: 'steps',
        items: [
          'Cookie banner when you first visit',
          'Account Settings > Privacy',
          'Your browser settings',
          'Third-party opt-out tools'
        ]
      },
      {
        type: 'heading',
        text: 'Browser Cookie Settings'
      },
      {
        type: 'list',
        items: [
          'Chrome: Settings > Privacy > Cookies',
          'Firefox: Preferences > Privacy > Cookies',
          'Safari: Preferences > Privacy',
          'Edge: Settings > Privacy > Cookies'
        ]
      },
      {
        type: 'heading',
        text: 'Impact of Disabling Cookies'
      },
      {
        type: 'paragraph',
        text: 'Disabling optional cookies is fine, but disabling essential cookies will:'
      },
      {
        type: 'list',
        items: [
          'Prevent you from signing in',
          'Disable shopping cart features',
          'Affect site functionality',
          'Remove personalization'
        ]
      },
      {
        type: 'note',
        text: 'We respect your privacy choices. You can change cookie preferences anytime in your account settings.'
      }
    ],
    relatedArticles: [
      { title: 'Privacy Policy', slug: 'privacy-policy' },
      { title: 'Data Protection', slug: 'data-protection' },
      { title: 'Email Preferences', slug: 'email-preferences' }
    ]
  },

  // ==================== TECHNICAL SUPPORT ====================
  'pdf-wont-open': {
    category: 'Technical Support',
    title: 'PDF Won\'t Open',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Troubleshooting', 'PDF', 'Technical'],
    content: [
      {
        type: 'intro',
        text: 'Having trouble opening your downloaded PDF? Follow these troubleshooting steps to resolve the issue.'
      },
      {
        type: 'heading',
        text: 'Check Your PDF Reader'
      },
      {
        type: 'paragraph',
        text: 'Make sure you have a PDF reader installed:'
      },
      {
        type: 'list',
        items: [
          'Desktop: Download Adobe Acrobat Reader (free)',
          'Mac: Use built-in Preview app',
          'Mobile: Download Adobe Acrobat Reader app from App Store or Play Store',
          'Browser: Most modern browsers can open PDFs'
        ]
      },
      {
        type: 'heading',
        text: 'Re-download the File'
      },
      {
        type: 'steps',
        items: [
          'Go to "My Books" section',
          'Find the book that won\'t open',
          'Click "Download PDF" again',
          'Try opening the newly downloaded file'
        ]
      },
      {
        type: 'heading',
        text: 'Check File Integrity'
      },
      {
        type: 'list',
        items: [
          'Ensure the download completed fully',
          'Check the file size (shouldn\'t be 0 KB)',
          'Make sure the file has .pdf extension',
          'Try downloading on a different device'
        ]
      },
      {
        type: 'heading',
        text: 'Clear Browser Cache'
      },
      {
        type: 'steps',
        items: [
          'Open browser settings',
          'Find "Clear browsing data" or "Privacy"',
          'Select "Cached images and files"',
          'Clear the cache',
          'Try downloading again'
        ]
      },
      {
        type: 'heading',
        text: 'Try Different Methods'
      },
      {
        type: 'list',
        items: [
          'Right-click the PDF and select "Open with" → Choose your PDF reader',
          'Drag and drop the PDF onto your PDF reader icon',
          'Open your PDF reader first, then use File → Open to select the PDF',
          'Try opening in a different browser'
        ]
      },
      {
        type: 'note',
        text: 'Still having issues? The PDF might be corrupted during download. Contact our support team with the book title and we\'ll send you a fresh copy via email.'
      }
    ],
    relatedArticles: [
      { title: 'Downloading Your PDFs', slug: 'downloading-pdfs' },
      { title: 'Troubleshooting Downloads', slug: 'troubleshooting-downloads' },
      { title: 'Multiple Device Access', slug: 'multiple-device-access' }
    ]
  },

  'payment-failed': {
    category: 'Technical Support',
    title: 'Payment Failed',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Payment', 'Troubleshooting', 'Support'],
    content: [
      {
        type: 'intro',
        text: 'Payment declined or failed? Here are common reasons and how to fix them.'
      },
      {
        type: 'heading',
        text: 'Common Reasons for Failed Payments'
      },
      {
        type: 'list',
        items: [
          'Insufficient funds in account',
          'Incorrect card details entered',
          'Card expired or blocked',
          'Bank declined the transaction',
          'Internet connection interrupted',
          'Daily spending limit reached',
          'Card not enabled for online purchases'
        ]
      },
      {
        type: 'heading',
        text: 'Immediate Steps to Try'
      },
      {
        type: 'steps',
        items: [
          'Double-check all card details (number, expiry, CVV)',
          'Ensure sufficient balance in your account',
          'Try a different payment method',
          'Check with your bank if card is blocked',
          'Wait 5 minutes and try again',
          'Clear browser cache and retry'
        ]
      },
      {
        type: 'heading',
        text: 'Card-Specific Issues'
      },
      {
        type: 'paragraph',
        text: 'Debit/Credit Cards:'
      },
      {
        type: 'list',
        items: [
          'Verify card is activated for online transactions',
          'Check international transaction settings',
          'Confirm 3D Secure/OTP is working',
          'Contact your bank for authorization'
        ]
      },
      {
        type: 'heading',
        text: 'Bank Transfer Issues'
      },
      {
        type: 'list',
        items: [
          'Ensure correct account details',
          'Check transfer limits',
          'Wait for bank processing time',
          'Keep transaction reference number'
        ]
      },
      {
        type: 'heading',
        text: 'Mobile Money Problems'
      },
      {
        type: 'list',
        items: [
          'Confirm sufficient balance',
          'Check network connection',
          'Verify phone number is correct',
          'Ensure mobile money is activated'
        ]
      },
      {
        type: 'heading',
        text: 'What to Do Next'
      },
      {
        type: 'steps',
        items: [
          'Check your email for any error messages',
          'Contact your bank/provider for details',
          'Try an alternative payment method',
          'Contact our support with transaction details',
          'We can manually process your payment'
        ]
      },
      {
        type: 'heading',
        text: 'Preventing Future Issues'
      },
      {
        type: 'list',
        items: [
          'Save successful payment methods',
          'Keep cards updated before expiry',
          'Enable transaction notifications',
          'Maintain sufficient balance',
          'Whitelist our payment gateway'
        ]
      },
      {
        type: 'note',
        text: 'Urgent? Contact support immediately with your order number and we\'ll help complete your purchase manually.'
      }
    ],
    relatedArticles: [
      { title: 'Accepted Payment Methods', slug: 'payment-methods' },
      { title: 'How to Purchase a Book', slug: 'how-to-purchase-book' },
      { title: 'Refund Policy', slug: 'refund-policy' }
    ]
  },

  'cant-access-books': {
    category: 'Technical Support',
    title: 'Can\'t Access My Books',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Access', 'Troubleshooting', 'Books'],
    content: [
      {
        type: 'intro',
        text: 'Can\'t see your purchased books in "My Books"? Here\'s how to troubleshoot access issues.'
      },
      {
        type: 'heading',
        text: 'Check You\'re Signed In'
      },
      {
        type: 'steps',
        items: [
          'Verify you\'re signed in to the correct account',
          'Check the email address shown in your profile',
          'If wrong account, sign out and sign in with correct email',
          'Books are tied to specific accounts'
        ]
      },
      {
        type: 'heading',
        text: 'Verify Purchase Completed'
      },
      {
        type: 'list',
        items: [
          'Check your email for purchase confirmation',
          'Look for payment receipt',
          'Verify payment wasn\'t declined',
          'Check your bank statement for charges'
        ]
      },
      {
        type: 'heading',
        text: 'Browser and Cache Issues'
      },
      {
        type: 'steps',
        items: [
          'Clear your browser cache and cookies',
          'Try a different browser',
          'Disable browser extensions temporarily',
          'Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)',
          'Try incognito/private browsing mode'
        ]
      },
      {
        type: 'heading',
        text: 'Check Internet Connection'
      },
      {
        type: 'list',
        items: [
          'Ensure stable internet connection',
          'Try switching between WiFi and mobile data',
          'Restart your router',
          'Check if other websites load properly'
        ]
      },
      {
        type: 'heading',
        text: 'Device-Specific Issues'
      },
      {
        type: 'paragraph',
        text: 'Mobile devices:'
      },
      {
        type: 'list',
        items: [
          'Update your browser or app',
          'Clear app data/cache',
          'Try accessing via desktop browser',
          'Ensure OS is up to date'
        ]
      },
      {
        type: 'heading',
        text: 'Account Sync Delays'
      },
      {
        type: 'paragraph',
        text: 'Sometimes there\'s a brief delay:'
      },
      {
        type: 'list',
        items: [
          'Wait 5-10 minutes after purchase',
          'Refresh the "My Books" page',
          'Sign out and sign back in',
          'Check for system maintenance notices'
        ]
      },
      {
        type: 'heading',
        text: 'Still Can\'t Access?'
      },
      {
        type: 'paragraph',
        text: 'Contact support with:'
      },
      {
        type: 'list',
        items: [
          'Your account email address',
          'Order number or transaction ID',
          'Book title you\'re trying to access',
          'Screenshots of the issue',
          'Device and browser you\'re using'
        ]
      },
      {
        type: 'note',
        text: 'Tip: Check your email inbox - purchased books are also sent directly to your email as backup access.'
      }
    ],
    relatedArticles: [
      { title: 'Accessing My Books', slug: 'accessing-my-books' },
      { title: 'Downloading Your PDFs', slug: 'downloading-pdfs' },
      { title: 'Multiple Device Access', slug: 'multiple-device-access' }
    ]
  },

  'website-not-loading': {
    category: 'Technical Support',
    title: 'Website Not Loading',
    readTime: '4 min read',
    lastUpdated: 'December 15, 2025',
    tags: ['Technical', 'Troubleshooting', 'Website'],
    content: [
      {
        type: 'intro',
        text: 'Having trouble accessing Learning Access Network? Here are solutions for common loading issues.'
      },
      {
        type: 'heading',
        text: 'Quick Fixes to Try First'
      },
      {
        type: 'steps',
        items: [
          'Refresh the page (F5 or Ctrl+R)',
          'Clear browser cache and cookies',
          'Try a different browser',
          'Check your internet connection',
          'Restart your device'
        ]
      },
      {
        type: 'heading',
        text: 'Check Internet Connection'
      },
      {
        type: 'list',
        items: [
          'Try opening other websites',
          'Run a speed test',
          'Restart your router/modem',
          'Switch between WiFi and mobile data',
          'Check if your ISP has outages'
        ]
      },
      {
        type: 'heading',
        text: 'Browser Issues'
      },
      {
        type: 'paragraph',
        text: 'If the site won\'t load in your browser:'
      },
      {
        type: 'list',
        items: [
          'Update to latest browser version',
          'Disable extensions/add-ons',
          'Clear all browsing data',
          'Try incognito/private mode',
          'Reset browser settings',
          'Try Chrome, Firefox, Safari, or Edge'
        ]
      },
      {
        type: 'heading',
        text: 'DNS and Network Issues'
      },
      {
        type: 'steps',
        items: [
          'Flush DNS cache on your device',
          'Try Google DNS (8.8.8.8 and 8.8.4.4)',
          'Disable VPN or proxy temporarily',
          'Check firewall settings',
          'Contact your network administrator'
        ]
      },
      {
        type: 'heading',
        text: 'Device-Specific Solutions'
      },
      {
        type: 'paragraph',
        text: 'Windows:'
      },
      {
        type: 'list',
        items: [
          'Run Network Troubleshooter',
          'Reset TCP/IP stack',
          'Disable antivirus temporarily'
        ]
      },
      {
        type: 'paragraph',
        text: 'Mac:'
      },
      {
        type: 'list',
        items: [
          'Renew DHCP lease',
          'Reset DNS settings',
          'Check Security & Privacy settings'
        ]
      },
      {
        type: 'paragraph',
        text: 'Mobile:'
      },
      {
        type: 'list',
        items: [
          'Toggle airplane mode on/off',
          'Forget and reconnect to WiFi',
          'Clear app data if using browser app'
        ]
      },
      {
        type: 'heading',
        text: 'Check Service Status'
      },
      {
        type: 'paragraph',
        text: 'The site might be down for maintenance:'
      },
      {
        type: 'list',
        items: [
          'Check our social media for updates',
          'Try again in 15-30 minutes',
          'Scheduled maintenance is usually brief',
          'Emergency maintenance is rare'
        ]
      },
      {
        type: 'heading',
        text: 'Error Messages'
      },
      {
        type: 'paragraph',
        text: 'Common errors and meanings:'
      },
      {
        type: 'list',
        items: [
          '404 Error - Page not found (check URL)',
          '500 Error - Server issue (try later)',
          '502/503 - Temporary server problem',
          'Timeout - Connection too slow',
          'SSL Error - Security certificate issue'
        ]
      },
      {
        type: 'note',
        text: 'Still can\'t access? Contact our support team with error messages and screenshots. We\'ll investigate immediately.'
      }
    ],
    relatedArticles: [
      { title: 'Troubleshooting Downloads', slug: 'troubleshooting-downloads' },
      { title: 'Can\'t Access My Books', slug: 'cant-access-books' },
      { title: 'PDF Won\'t Open', slug: 'pdf-wont-open' }
    ]
  }
};