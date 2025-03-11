// List of known spam domains
const SPAM_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'tempinbox.com',
  'getnada.com',
  'dispostable.com',
  'mailnesia.com',
  'maildrop.cc',
  'spambog.com',
  'temp-mail.org',
  'spamgourmet.com',
  'mintemail.com',
  'mailcatch.com',
  'tempr.email',
  'spamex.com',
];

// List of spam words to check for
const SPAM_WORDS = [
  'viagra',
  'cialis',
  'casino',
  'lottery',
  'prize',
  'winner',
  'free money',
  'bitcoin investment',
  'crypto investment',
  'make money fast',
  'get rich quick',
  'enlargement',
  'weight loss',
  'diet pill',
  'replica',
  'rolex',
  'pharmacy',
  'discount meds',
  'online pharmacy',
  'cheap prescription',
  'xxx',
  'porn',
  'adult',
  'dating',
  'meet singles',
  'russian bride',
  'nigerian prince',
  'inheritance',
  'bank transfer',
  'wire transfer',
  'offshore',
  'tax free',
  'investment opportunity',
  'business proposal',
  'confidential',
  'urgent',
  'attention',
  'dear beneficiary',
  'dear friend',
  'dear customer',
  'dear user',
  'account suspended',
  'verify your account',
  'update your information',
  'security alert',
  'suspicious activity',
  'click here',
  'limited time offer',
  'act now',
  'don\'t miss out',
  'guaranteed',
  'risk free',
  'no risk',
  '100% free',
  'best price',
  'cheap',
  'discount',
  'sale',
  'clearance',
  'lowest price',
  'best rates',
  'best deal',
  'special offer',
  'exclusive offer',
  'congratulations',
  'you\'ve won',
  'you have won',
  'you are a winner',
  'selected',
  'lucky',
  'bonus',
  'cash',
  'credit',
  'loan',
  'debt',
  'mortgage',
  'refinance',
  'insurance',
  'investment',
  'stock',
  'forex',
  'trading',
  'binary options',
  'options trading',
  'day trading',
  'market',
  'profit',
  'earn',
  'income',
  'money',
  'cash',
  'dollars',
  'euros',
  'pounds',
  'payment',
  'paypal',
  'western union',
  'moneygram',
  'wire',
  'transfer',
  'bank',
  'account',
  'deposit',
  'withdraw',
  'transaction',
  'processing',
  'fee',
  'charge',
  'cost',
  'price',
  'value',
  'worth',
  'million',
  'billion',
  'trillion',
];

/**
 * Check if an email is likely to be spam
 * @param email Email address to check
 * @returns True if the email is likely spam
 */
export function isSpamEmail(email: string): boolean {
  if (!email) return false;
  
  // Check for disposable email domains
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && SPAM_DOMAINS.includes(domain)) {
    return true;
  }
  
  // Check for suspicious patterns in email
  const suspiciousPatterns = [
    /^[a-z0-9]{10,}@/i, // Very long random username
    /\d{6,}@/i, // Many consecutive numbers
    /[a-z0-9]{3,}\.[a-z0-9]{3,}@/i, // Multiple random segments
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(email));
}

/**
 * Check if a message is likely to be spam
 * @param message The message to check
 * @returns True if the message is likely spam
 */
export function isSpamMessage(message: string): boolean {
  if (!message) return false;
  
  // Calculate spam score and check if it's above threshold
  const spamScore = calculateSpamScore(message);
  return spamScore > 70;
}

/**
 * Check if text contains spam words
 * @param text Text to check for spam words
 * @returns True if the text contains spam words
 */
export function containsSpamWords(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Check for spam words
  return SPAM_WORDS.some(word => lowerText.includes(word.toLowerCase()));
}

/**
 * Calculate a spam score for a message (0-100)
 * @param message The message to analyze
 * @returns A score from 0 (not spam) to 100 (definitely spam)
 */
export function calculateSpamScore(message: string): number {
  if (!message) return 0;
  
  const lowerMessage = message.toLowerCase();
  let score = 0;
  
  // Check for spam words
  const spamWordCount = SPAM_WORDS.filter(word => 
    lowerMessage.includes(word.toLowerCase())
  ).length;
  
  // Add points based on spam word density
  score += Math.min(spamWordCount * 10, 50);
  
  // Check for excessive capitalization
  const caps = message.replace(/[^A-Z]/g, '').length;
  const letters = message.replace(/[^a-zA-Z]/g, '').length;
  if (letters > 0 && caps / letters > 0.5) {
    score += 20;
  }
  
  // Check for excessive punctuation
  const exclamations = (message.match(/!/g) || []).length;
  if (exclamations > 3) {
    score += 10;
  }
  
  // Check for excessive use of numbers
  const numbers = (message.match(/\d/g) || []).length;
  if (numbers > 10) {
    score += 10;
  }
  
  // Check for URLs
  const urls = (message.match(/https?:\/\/\S+/g) || []).length;
  if (urls > 2) {
    score += 10;
  }
  
  return Math.min(score, 100);
} 