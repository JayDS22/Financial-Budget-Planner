// VisionFi — learn.js (Financial Literacy Hub)
// Improve financial literacy with curated content and gamification

// ========== LEARNING STATE ==========
if (!window.state) window.state = {};
Object.assign(window.state, {
  learnSub: 'courses',
  learnProgress: {},
  currentQuiz: null,
  quizScore: 0,
  quizAnswers: [],
  streakDays: 7,
  totalXP: 1250,
  level: 3,
  completedLessons: ['budgeting-101', 'emergency-fund', 'debt-basics'],
  badges: ['first-lesson', 'streak-3', 'quiz-master'],
  dailyChallengeComplete: false
});

// ========== CURATED CONTENT ==========

// Medium Blogs & Articles
const BLOGS = [
  {
    id: 'compound-interest',
    title: 'The Magic of Compound Interest',
    source: 'Medium',
    author: 'Financial Freedom Hub',
    readTime: '6 min',
    image: '📈',
    url: 'https://medium.com/financial-freedom',
    description: 'Learn how compound interest can turn small savings into significant wealth over time.',
    tags: ['Investing', 'Beginner'],
    xp: 20
  },
  {
    id: 'budget-50-30-20',
    title: 'The 50/30/20 Budget Rule Explained',
    source: 'Medium',
    author: 'Money Matters',
    readTime: '5 min',
    image: '💰',
    url: 'https://medium.com/money-matters',
    description: 'A simple framework to allocate your income between needs, wants, and savings.',
    tags: ['Budgeting', 'Beginner'],
    xp: 15
  },
  {
    id: 'credit-score-boost',
    title: '7 Ways to Boost Your Credit Score Fast',
    source: 'Medium',
    author: 'Credit Insights',
    readTime: '8 min',
    image: '💳',
    url: 'https://medium.com/credit-insights',
    description: 'Actionable tips to improve your credit score in 30-60 days.',
    tags: ['Credit', 'Intermediate'],
    xp: 25
  },
  {
    id: 'emergency-fund-guide',
    title: 'Building Your Emergency Fund: A Complete Guide',
    source: 'NerdWallet',
    author: 'Personal Finance Team',
    readTime: '7 min',
    image: '🛡️',
    url: 'https://www.nerdwallet.com/emergency-fund',
    description: 'How much you need and the best strategies to build it.',
    tags: ['Savings', 'Beginner'],
    xp: 20
  },
  {
    id: 'investing-beginners',
    title: 'Investing 101: A Beginner\'s Complete Guide',
    source: 'Investopedia',
    author: 'James Chen',
    readTime: '12 min',
    image: '📊',
    url: 'https://www.investopedia.com/investing-101',
    description: 'Everything you need to know to start investing confidently.',
    tags: ['Investing', 'Beginner'],
    xp: 30
  },
  {
    id: 'debt-snowball',
    title: 'Debt Snowball vs Avalanche: Which Method Wins?',
    source: 'The Balance',
    author: 'Debt Experts',
    readTime: '6 min',
    image: '❄️',
    url: 'https://www.thebalancemoney.com/debt-methods',
    description: 'Compare two popular debt payoff strategies and find your best fit.',
    tags: ['Debt', 'Intermediate'],
    xp: 25
  }
];

// YouTube Videos
const VIDEOS = [
  {
    id: 'budgeting-basics-yt',
    title: 'Budgeting for Beginners - How to Make a Budget From Scratch',
    channel: 'Nate O\'Brien',
    views: '2.4M',
    duration: '12:34',
    thumbnail: '🎬',
    url: 'https://www.youtube.com/watch?v=budgeting-basics',
    description: 'Step-by-step guide to creating your first budget.',
    tags: ['Budgeting', 'Beginner'],
    xp: 25
  },
  {
    id: 'index-funds-yt',
    title: 'Index Funds vs ETFs vs Mutual Funds - What\'s the Difference?',
    channel: 'Graham Stephan',
    views: '1.8M',
    duration: '18:22',
    thumbnail: '📈',
    url: 'https://www.youtube.com/watch?v=index-funds',
    description: 'Clear explanation of different investment vehicles.',
    tags: ['Investing', 'Intermediate'],
    xp: 35
  },
  {
    id: 'credit-score-yt',
    title: 'How Credit Scores Work (and How to Improve Yours)',
    channel: 'Two Cents',
    views: '890K',
    duration: '9:45',
    thumbnail: '💳',
    url: 'https://www.youtube.com/watch?v=credit-scores',
    description: 'Understand the factors that impact your credit score.',
    tags: ['Credit', 'Beginner'],
    xp: 20
  },
  {
    id: 'retirement-yt',
    title: 'Retirement Accounts Explained: 401k, IRA, Roth',
    channel: 'The Plain Bagel',
    views: '1.2M',
    duration: '15:10',
    thumbnail: '🏖️',
    url: 'https://www.youtube.com/watch?v=retirement-accounts',
    description: 'Compare retirement account options and their tax benefits.',
    tags: ['Retirement', 'Intermediate'],
    xp: 30
  },
  {
    id: 'side-hustles-yt',
    title: '10 Legitimate Ways to Earn Extra Income in 2026',
    channel: 'Ali Abdaal',
    views: '3.1M',
    duration: '22:18',
    thumbnail: '💼',
    url: 'https://www.youtube.com/watch?v=side-hustles',
    description: 'Practical side income ideas you can start today.',
    tags: ['Income', 'Beginner'],
    xp: 25
  },
  {
    id: 'taxes-yt',
    title: 'Taxes For Beginners - How They Work & How To Pay Less',
    channel: 'Andrei Jikh',
    views: '2.1M',
    duration: '14:56',
    thumbnail: '📋',
    url: 'https://www.youtube.com/watch?v=taxes-beginners',
    description: 'Demystifying taxes and legal ways to reduce your bill.',
    tags: ['Taxes', 'Beginner'],
    xp: 30
  }
];

// Self-Paced Courses
const COURSES = [
  {
    id: 'budgeting-101',
    title: 'Budgeting 101',
    description: 'Master the fundamentals of personal budgeting',
    icon: '📊',
    lessons: 5,
    duration: '45 min',
    level: 'Beginner',
    xp: 100,
    color: '#5b8cff',
    modules: [
      { id: 'b1', title: 'Why Budget?', duration: '8 min', completed: true },
      { id: 'b2', title: 'Track Your Spending', duration: '10 min', completed: true },
      { id: 'b3', title: 'Set Categories', duration: '10 min', completed: false },
      { id: 'b4', title: 'The 50/30/20 Rule', duration: '8 min', completed: false },
      { id: 'b5', title: 'Automate & Review', duration: '9 min', completed: false }
    ]
  },
  {
    id: 'credit-mastery',
    title: 'Credit Score Mastery',
    description: 'Understand and improve your credit score',
    icon: '💳',
    lessons: 6,
    duration: '1 hr',
    level: 'Intermediate',
    xp: 150,
    color: '#3ddba0',
    modules: [
      { id: 'c1', title: 'Credit Score Basics', duration: '10 min', completed: false },
      { id: 'c2', title: 'The 5 Factors', duration: '12 min', completed: false },
      { id: 'c3', title: 'Reading Your Report', duration: '10 min', completed: false },
      { id: 'c4', title: 'Quick Wins', duration: '8 min', completed: false },
      { id: 'c5', title: 'Long-Term Strategy', duration: '10 min', completed: false },
      { id: 'c6', title: 'Common Mistakes', duration: '10 min', completed: false }
    ]
  },
  {
    id: 'investing-starter',
    title: 'Start Investing',
    description: 'Begin your investment journey with confidence',
    icon: '📈',
    lessons: 7,
    duration: '1.5 hrs',
    level: 'Beginner',
    xp: 200,
    color: '#b07cff',
    modules: [
      { id: 'i1', title: 'Why Invest?', duration: '10 min', completed: false },
      { id: 'i2', title: 'Risk & Return', duration: '12 min', completed: false },
      { id: 'i3', title: 'Stocks vs Bonds', duration: '15 min', completed: false },
      { id: 'i4', title: 'Index Funds', duration: '12 min', completed: false },
      { id: 'i5', title: 'Your First $100', duration: '10 min', completed: false },
      { id: 'i6', title: 'Tax-Advantaged', duration: '15 min', completed: false },
      { id: 'i7', title: 'Building a Portfolio', duration: '16 min', completed: false }
    ]
  },
  {
    id: 'debt-freedom',
    title: 'Path to Debt Freedom',
    description: 'Strategies to eliminate debt efficiently',
    icon: '🎯',
    lessons: 5,
    duration: '50 min',
    level: 'Intermediate',
    xp: 120,
    color: '#ff6b6b',
    modules: [
      { id: 'd1', title: 'Assess Your Debt', duration: '10 min', completed: false },
      { id: 'd2', title: 'Snowball Method', duration: '10 min', completed: false },
      { id: 'd3', title: 'Avalanche Method', duration: '10 min', completed: false },
      { id: 'd4', title: 'Negotiating Rates', duration: '10 min', completed: false },
      { id: 'd5', title: 'Staying Debt-Free', duration: '10 min', completed: false }
    ]
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund Builder',
    description: 'Build your financial safety net',
    icon: '🛡️',
    lessons: 4,
    duration: '30 min',
    level: 'Beginner',
    xp: 80,
    color: '#ffb84d',
    modules: [
      { id: 'e1', title: 'Why You Need One', duration: '8 min', completed: true },
      { id: 'e2', title: 'How Much?', duration: '8 min', completed: true },
      { id: 'e3', title: 'Where to Keep It', duration: '7 min', completed: false },
      { id: 'e4', title: 'Building It Fast', duration: '7 min', completed: false }
    ]
  },
  {
    id: 'retirement-planning',
    title: 'Retirement Planning',
    description: 'Plan for a comfortable retirement',
    icon: '🏖️',
    lessons: 6,
    duration: '1 hr 15 min',
    level: 'Advanced',
    xp: 180,
    color: '#4dd4c0',
    modules: [
      { id: 'r1', title: 'When to Start', duration: '10 min', completed: false },
      { id: 'r2', title: '401k Deep Dive', duration: '15 min', completed: false },
      { id: 'r3', title: 'IRA Options', duration: '12 min', completed: false },
      { id: 'r4', title: 'Roth vs Traditional', duration: '12 min', completed: false },
      { id: 'r5', title: 'Employer Match', duration: '10 min', completed: false },
      { id: 'r6', title: 'Calculating Needs', duration: '16 min', completed: false }
    ]
  }
];

// Daily Challenges
const DAILY_CHALLENGES = [
  { id: 'dc1', title: 'Track 3 expenses today', xp: 15, icon: '📝' },
  { id: 'dc2', title: 'Read 1 financial article', xp: 10, icon: '📖' },
  { id: 'dc3', title: 'Review your subscriptions', xp: 20, icon: '🔍' },
  { id: 'dc4', title: 'Set a savings goal', xp: 15, icon: '🎯' },
  { id: 'dc5', title: 'Check your credit score', xp: 10, icon: '💳' },
  { id: 'dc6', title: 'Complete a quiz', xp: 25, icon: '🧠' }
];

// Quizzes for Gamification
const QUIZZES = [
  {
    id: 'budget-quiz',
    title: 'Budgeting Basics Quiz',
    icon: '📊',
    questions: [
      {
        q: 'In the 50/30/20 rule, what percentage goes to "needs"?',
        options: ['30%', '50%', '20%', '60%'],
        correct: 1,
        explanation: 'The 50/30/20 rule suggests 50% for needs, 30% for wants, and 20% for savings.'
      },
      {
        q: 'Which is NOT typically considered a "need"?',
        options: ['Rent', 'Groceries', 'Netflix subscription', 'Health insurance'],
        correct: 2,
        explanation: 'Entertainment subscriptions are "wants," not "needs."'
      },
      {
        q: 'How often should you review your budget?',
        options: ['Once a year', 'Monthly', 'Only when income changes', 'Daily'],
        correct: 1,
        explanation: 'Monthly reviews help you stay on track and adjust for changes.'
      }
    ],
    xp: 50
  },
  {
    id: 'credit-quiz',
    title: 'Credit Score Challenge',
    icon: '💳',
    questions: [
      {
        q: 'What is the highest possible FICO credit score?',
        options: ['800', '850', '900', '1000'],
        correct: 1,
        explanation: 'FICO scores range from 300 to 850.'
      },
      {
        q: 'Which factor has the BIGGEST impact on your credit score?',
        options: ['Credit mix', 'Payment history', 'New credit', 'Length of history'],
        correct: 1,
        explanation: 'Payment history accounts for 35% of your FICO score.'
      },
      {
        q: 'What credit utilization ratio is ideal?',
        options: ['Under 30%', 'Under 50%', 'Under 70%', 'Any amount is fine'],
        correct: 0,
        explanation: 'Keeping utilization under 30% is best for your score.'
      },
      {
        q: 'How long do most negative items stay on your credit report?',
        options: ['3 years', '5 years', '7 years', '10 years'],
        correct: 2,
        explanation: 'Most negative items remain for 7 years (bankruptcies can stay for 10).'
      }
    ],
    xp: 75
  },
  {
    id: 'investing-quiz',
    title: 'Investment Fundamentals',
    icon: '📈',
    questions: [
      {
        q: 'What is compound interest?',
        options: [
          'Interest paid only on principal',
          'Interest earned on interest',
          'A type of loan',
          'A tax deduction'
        ],
        correct: 1,
        explanation: 'Compound interest is interest calculated on both the initial principal and accumulated interest.'
      },
      {
        q: 'What is diversification?',
        options: [
          'Putting all money in one stock',
          'Spreading investments across different assets',
          'Only investing in bonds',
          'Day trading'
        ],
        correct: 1,
        explanation: 'Diversification reduces risk by spreading investments across different assets.'
      },
      {
        q: 'What is an index fund?',
        options: [
          'A fund that beats the market',
          'A fund that tracks a market index',
          'A savings account',
          'A type of bond'
        ],
        correct: 1,
        explanation: 'Index funds passively track a market index like the S&P 500.'
      }
    ],
    xp: 60
  }
];

// Badges/Achievements
const BADGES = [
  { id: 'first-lesson', name: 'First Steps', icon: '🎓', description: 'Complete your first lesson', earned: true },
  { id: 'streak-3', name: '3-Day Streak', icon: '🔥', description: 'Learn 3 days in a row', earned: true },
  { id: 'streak-7', name: 'Week Warrior', icon: '⚡', description: 'Learn 7 days in a row', earned: false },
  { id: 'streak-30', name: 'Monthly Master', icon: '🏆', description: 'Learn 30 days in a row', earned: false },
  { id: 'quiz-master', name: 'Quiz Master', icon: '🧠', description: 'Score 100% on any quiz', earned: true },
  { id: 'budget-pro', name: 'Budget Pro', icon: '💰', description: 'Complete Budgeting 101', earned: false },
  { id: 'credit-guru', name: 'Credit Guru', icon: '💳', description: 'Complete Credit Mastery', earned: false },
  { id: 'investor', name: 'Investor', icon: '📈', description: 'Complete Start Investing', earned: false },
  { id: 'knowledge-seeker', name: 'Knowledge Seeker', icon: '📚', description: 'Read 10 articles', earned: false },
  { id: 'video-learner', name: 'Video Learner', icon: '🎬', description: 'Watch 10 videos', earned: false }
];

// ========== HELPER FUNCTIONS ==========

function getLevelInfo(xp) {
  const levels = [
    { level: 1, min: 0, max: 100, title: 'Financial Newbie' },
    { level: 2, min: 100, max: 300, title: 'Budget Beginner' },
    { level: 3, min: 300, max: 600, title: 'Money Manager' },
    { level: 4, min: 600, max: 1000, title: 'Finance Enthusiast' },
    { level: 5, min: 1000, max: 1500, title: 'Wealth Builder' },
    { level: 6, min: 1500, max: 2200, title: 'Financial Advisor' },
    { level: 7, min: 2200, max: 3000, title: 'Money Master' },
    { level: 8, min: 3000, max: 4000, title: 'Finance Expert' },
    { level: 9, min: 4000, max: 5500, title: 'Wealth Wizard' },
    { level: 10, min: 5500, max: Infinity, title: 'Financial Freedom' }
  ];
  
  for (const l of levels) {
    if (xp >= l.min && xp < l.max) {
      return {
        ...l,
        progress: ((xp - l.min) / (l.max - l.min)) * 100,
        xpToNext: l.max - xp
      };
    }
  }
  return levels[levels.length - 1];
}

function getTodayChallenge() {
  const today = new Date().getDate();
  return DAILY_CHALLENGES[today % DAILY_CHALLENGES.length];
}

function startQuiz(quizId) {
  const quiz = QUIZZES.find(q => q.id === quizId);
  if (quiz) {
    state.currentQuiz = quiz;
    state.quizScore = 0;
    state.quizAnswers = [];
    render();
  }
}
window.startQuiz = startQuiz;

function answerQuiz(questionIndex, answerIndex) {
  if (!state.currentQuiz) return;
  state.quizAnswers[questionIndex] = answerIndex;
  render();
}
window.answerQuiz = answerQuiz;

function submitQuiz() {
  if (!state.currentQuiz) return;
  const quiz = state.currentQuiz;
  let correct = 0;
  quiz.questions.forEach((q, i) => {
    if (state.quizAnswers[i] === q.correct) correct++;
  });
  state.quizScore = correct;
  // Award XP
  const earnedXP = Math.round((correct / quiz.questions.length) * quiz.xp);
  state.totalXP += earnedXP;
  showToast(`Quiz complete! +${earnedXP} XP`, 'success');
  render();
}
window.submitQuiz = submitQuiz;

function closeQuiz() {
  state.currentQuiz = null;
  state.quizScore = 0;
  state.quizAnswers = [];
  render();
}
window.closeQuiz = closeQuiz;

function completeDailyChallenge() {
  if (!state.dailyChallengeComplete) {
    const challenge = getTodayChallenge();
    state.dailyChallengeComplete = true;
    state.totalXP += challenge.xp;
    state.streakDays++;
    showToast(`Challenge complete! +${challenge.xp} XP`, 'success');
    render();
  }
}
window.completeDailyChallenge = completeDailyChallenge;

function setLearnSub(sub) {
  state.learnSub = sub;
  render();
}
window.setLearnSub = setLearnSub;

function markContentRead(contentId, xp) {
  if (!state.learnProgress[contentId]) {
    state.learnProgress[contentId] = true;
    state.totalXP += xp;
    showToast(`Content completed! +${xp} XP`, 'success');
    render();
  }
}
window.markContentRead = markContentRead;

// ========== RENDER FUNCTIONS ==========

function renderLearnHub() {
  const u = state.currentUser;
  const sub = state.learnSub || 'courses';
  const levelInfo = getLevelInfo(state.totalXP);
  const todayChallenge = getTodayChallenge();
  const earnedBadges = BADGES.filter(b => state.badges.includes(b.id));
  
  const tabs = [
    { id: 'courses', l: 'Courses', i: '📚' },
    { id: 'videos', l: 'Videos', i: '🎬' },
    { id: 'articles', l: 'Articles', i: '📰' },
    { id: 'quizzes', l: 'Quizzes', i: '🧠' },
    { id: 'progress', l: 'My Progress', i: '🏆' }
  ];

  // Quiz Modal
  if (state.currentQuiz) {
    return renderQuizModal();
  }

  return '<div style="animation:fadeIn .35s">' +
    // Header with Level & XP
    '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px">' +
      '<div>' +
        '<h1 style="font-size:24px;font-weight:700;margin-bottom:6px">📖 Financial Literacy Hub</h1>' +
        '<p style="font-size:13px;color:var(--t3)">Learn, earn XP, and level up your financial knowledge</p>' +
      '</div>' +
      // XP & Level Badge
      '<div style="display:flex;align-items:center;gap:16px">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:linear-gradient(135deg,rgba(91,140,255,0.1),rgba(176,124,255,0.1));border-radius:12px;border:1px solid rgba(91,140,255,0.2)">' +
          '<span style="font-size:24px">⭐</span>' +
          '<div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--blue)">' + state.totalXP.toLocaleString() + ' XP</div>' +
            '<div style="font-size:11px;color:var(--t3)">Level ' + levelInfo.level + ' • ' + levelInfo.title + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:linear-gradient(135deg,rgba(255,107,107,0.1),rgba(255,184,77,0.1));border-radius:12px;border:1px solid rgba(255,184,77,0.2)">' +
          '<span style="font-size:24px">🔥</span>' +
          '<div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--yellow)">' + state.streakDays + ' days</div>' +
            '<div style="font-size:11px;color:var(--t3)">Learning streak</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Daily Challenge Card
    '<div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,rgba(61,219,160,0.1),rgba(91,140,255,0.05));border:1px solid rgba(61,219,160,0.2)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div style="display:flex;align-items:center;gap:14px">' +
          '<div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--green),#3ddba0);display:flex;align-items:center;justify-content:center;font-size:26px">' + todayChallenge.icon + '</div>' +
          '<div>' +
            '<div style="font-size:11px;color:var(--green);text-transform:uppercase;font-weight:600;margin-bottom:4px">Daily Challenge</div>' +
            '<div style="font-size:16px;font-weight:600">' + todayChallenge.title + '</div>' +
            '<div style="font-size:12px;color:var(--t3);margin-top:2px">+' + todayChallenge.xp + ' XP reward</div>' +
          '</div>' +
        '</div>' +
        (state.dailyChallengeComplete ?
          '<div style="display:flex;align-items:center;gap:8px;padding:12px 20px;background:var(--green-g);border-radius:10px;color:var(--green);font-weight:600"><span>✓</span> Completed!</div>' :
          '<button onclick="completeDailyChallenge()" class="btn btn-p" style="background:var(--green);padding:12px 24px">Complete Challenge</button>'
        ) +
      '</div>' +
    '</div>' +

    // Level Progress Bar
    '<div class="card" style="margin-bottom:20px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span style="font-size:28px">🎖️</span>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600">Level ' + levelInfo.level + ': ' + levelInfo.title + '</div>' +
            '<div style="font-size:11px;color:var(--t3)">' + levelInfo.xpToNext + ' XP to next level</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--blue);font-weight:600">' + Math.round(levelInfo.progress) + '%</div>' +
      '</div>' +
      '<div style="height:10px;background:var(--bg3);border-radius:5px;overflow:hidden">' +
        '<div style="height:100%;width:' + levelInfo.progress + '%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:5px;transition:width 0.5s ease"></div>' +
      '</div>' +
    '</div>' +

    // Tab Navigation
    '<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">' +
      tabs.map(function(t) {
        const isActive = sub === t.id;
        return '<button onclick="setLearnSub(\'' + t.id + '\')" style="display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:10px;border:1px solid ' + (isActive ? 'var(--blue)' : 'var(--bd)') + ';background:' + (isActive ? 'rgba(91,140,255,0.1)' : 'var(--bg1)') + ';color:' + (isActive ? 'var(--blue)' : 'var(--t2)') + ';cursor:pointer;font-family:inherit;font-size:13px;font-weight:' + (isActive ? '600' : '500') + ';transition:all 0.2s">' +
          '<span style="font-size:16px">' + t.i + '</span>' + t.l +
        '</button>';
      }).join('') +
    '</div>' +

    // Content based on selected tab
    (sub === 'courses' ? renderCourses() : '') +
    (sub === 'videos' ? renderVideos() : '') +
    (sub === 'articles' ? renderArticles() : '') +
    (sub === 'quizzes' ? renderQuizzesList() : '') +
    (sub === 'progress' ? renderProgress() : '') +

    // Partners Section
    renderLearnPartners() +
  '</div>';
}

function renderCourses() {
  return '<div class="grid g2" style="gap:16px">' +
    COURSES.map(function(course) {
      const completedModules = course.modules.filter(m => m.completed).length;
      const progress = (completedModules / course.modules.length) * 100;
      const isCompleted = progress === 100;
      
      return '<div class="card invest-card" style="cursor:default">' +
        '<div style="display:flex;gap:16px;align-items:start">' +
          '<div style="width:60px;height:60px;border-radius:14px;background:' + course.color + '22;display:flex;align-items:center;justify-content:center;font-size:30px">' + course.icon + '</div>' +
          '<div style="flex:1">' +
            '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">' +
              '<div>' +
                '<h3 style="font-size:16px;font-weight:700;margin-bottom:4px">' + course.title + '</h3>' +
                '<p style="font-size:12px;color:var(--t3)">' + course.description + '</p>' +
              '</div>' +
              '<span class="badge" style="background:' + course.color + '22;color:' + course.color + '">' + course.level + '</span>' +
            '</div>' +
            '<div style="display:flex;gap:16px;font-size:11px;color:var(--t3);margin-bottom:12px">' +
              '<span>📖 ' + course.lessons + ' lessons</span>' +
              '<span>⏱️ ' + course.duration + '</span>' +
              '<span style="color:var(--yellow)">⭐ ' + course.xp + ' XP</span>' +
            '</div>' +
            '<div style="margin-bottom:10px">' +
              '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px">' +
                '<span style="color:var(--t2)">' + completedModules + '/' + course.modules.length + ' completed</span>' +
                '<span style="color:' + course.color + ';font-weight:600">' + Math.round(progress) + '%</span>' +
              '</div>' +
              '<div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden">' +
                '<div style="height:100%;width:' + progress + '%;background:' + course.color + ';border-radius:3px"></div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
              course.modules.map(function(m, i) {
                return '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:' + (m.completed ? 'var(--green-g)' : 'var(--bg2)') + ';border-radius:6px;font-size:10px;color:' + (m.completed ? 'var(--green)' : 'var(--t3)') + '">' +
                  (m.completed ? '✓' : (i + 1)) + ' ' + m.title +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
        (isCompleted ? 
          '<div style="margin-top:16px;padding:12px;background:var(--green-g);border-radius:8px;text-align:center;color:var(--green);font-weight:600">🎉 Course Completed! +' + course.xp + ' XP</div>' :
          '<button class="btn btn-p" style="width:100%;margin-top:16px;background:' + course.color + '">Continue Learning</button>'
        ) +
      '</div>';
    }).join('') +
  '</div>';
}

function renderVideos() {
  return '<div class="grid g2" style="gap:16px">' +
    VIDEOS.map(function(video) {
      const watched = state.learnProgress[video.id];
      return '<div class="card" style="' + (watched ? 'border-color:var(--green);' : '') + '">' +
        '<div style="display:flex;gap:14px">' +
          '<div style="width:120px;height:80px;border-radius:10px;background:linear-gradient(135deg,var(--bg2),var(--bg3));display:flex;align-items:center;justify-content:center;font-size:40px;position:relative;overflow:hidden">' +
            video.thumbnail +
            '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);opacity:0;transition:opacity 0.2s;cursor:pointer" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0" onclick="window.open(\'' + video.url + '\', \'_blank\');markContentRead(\'' + video.id + '\', ' + video.xp + ')">' +
              '<span style="font-size:36px">▶️</span>' +
            '</div>' +
            (watched ? '<div style="position:absolute;top:4px;right:4px;background:var(--green);color:white;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600">✓</div>' : '') +
          '</div>' +
          '<div style="flex:1">' +
            '<h4 style="font-size:14px;font-weight:600;margin-bottom:6px;line-height:1.3">' + video.title + '</h4>' +
            '<div style="font-size:11px;color:var(--t3);margin-bottom:6px">' + video.channel + ' • ' + video.views + ' views</div>' +
            '<div style="display:flex;gap:8px;font-size:10px">' +
              '<span style="padding:4px 8px;background:var(--bg2);border-radius:4px">⏱️ ' + video.duration + '</span>' +
              '<span style="padding:4px 8px;background:var(--yellow-g);color:var(--yellow);border-radius:4px">⭐ ' + video.xp + ' XP</span>' +
              video.tags.map(function(tag) {
                return '<span style="padding:4px 8px;background:var(--blue-g);color:var(--blue);border-radius:4px">' + tag + '</span>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') +
  '</div>';
}

function renderArticles() {
  return '<div style="display:flex;flex-direction:column;gap:12px">' +
    BLOGS.map(function(blog) {
      const read = state.learnProgress[blog.id];
      return '<a href="' + blog.url + '" target="_blank" onclick="markContentRead(\'' + blog.id + '\', ' + blog.xp + ')" class="card" style="display:flex;align-items:center;gap:16px;text-decoration:none;color:inherit;' + (read ? 'border-color:var(--green);' : '') + '">' +
        '<div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,var(--bg2),var(--bg3));display:flex;align-items:center;justify-content:center;font-size:28px">' + blog.image + '</div>' +
        '<div style="flex:1">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
            '<h4 style="font-size:15px;font-weight:600">' + blog.title + '</h4>' +
            (read ? '<span style="color:var(--green);font-size:12px">✓ Read</span>' : '') +
          '</div>' +
          '<p style="font-size:12px;color:var(--t3);margin-bottom:6px">' + blog.description + '</p>' +
          '<div style="display:flex;gap:8px;font-size:10px">' +
            '<span style="color:var(--t3)">' + blog.source + ' • ' + blog.readTime + ' read</span>' +
            '<span style="padding:3px 8px;background:var(--yellow-g);color:var(--yellow);border-radius:4px">⭐ ' + blog.xp + ' XP</span>' +
            blog.tags.map(function(tag) {
              return '<span style="padding:3px 8px;background:var(--blue-g);color:var(--blue);border-radius:4px">' + tag + '</span>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<span style="color:var(--t3);font-size:18px">↗</span>' +
      '</a>';
    }).join('') +
  '</div>';
}

function renderQuizzesList() {
  return '<div class="grid g3" style="gap:16px">' +
    QUIZZES.map(function(quiz) {
      return '<div class="card" style="text-align:center;padding:24px">' +
        '<div style="width:70px;height:70px;margin:0 auto 16px;border-radius:18px;background:linear-gradient(135deg,var(--blue-g),var(--purple-g));display:flex;align-items:center;justify-content:center;font-size:36px">' + quiz.icon + '</div>' +
        '<h3 style="font-size:16px;font-weight:700;margin-bottom:8px">' + quiz.title + '</h3>' +
        '<p style="font-size:12px;color:var(--t3);margin-bottom:12px">' + quiz.questions.length + ' questions</p>' +
        '<div style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:var(--yellow-g);border-radius:8px;color:var(--yellow);font-size:13px;font-weight:600;margin-bottom:16px">' +
          '<span>⭐</span> ' + quiz.xp + ' XP' +
        '</div>' +
        '<button onclick="startQuiz(\'' + quiz.id + '\')" class="btn btn-p" style="width:100%">Start Quiz</button>' +
      '</div>';
    }).join('') +
  '</div>';
}

function renderQuizModal() {
  const quiz = state.currentQuiz;
  const totalQuestions = quiz.questions.length;
  const answeredCount = state.quizAnswers.filter(a => a !== undefined).length;
  const isComplete = answeredCount === totalQuestions && state.quizScore > 0;

  if (isComplete) {
    // Show results
    const percentage = Math.round((state.quizScore / totalQuestions) * 100);
    const earnedXP = Math.round((state.quizScore / totalQuestions) * quiz.xp);
    
    return '<div style="animation:fadeIn .35s;max-width:600px;margin:0 auto">' +
      '<div class="card" style="text-align:center;padding:40px">' +
        '<div style="font-size:64px;margin-bottom:16px">' + (percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚') + '</div>' +
        '<h2 style="font-size:24px;font-weight:700;margin-bottom:8px">Quiz Complete!</h2>' +
        '<p style="font-size:14px;color:var(--t3);margin-bottom:24px">' + quiz.title + '</p>' +
        
        '<div style="display:flex;justify-content:center;gap:24px;margin-bottom:24px">' +
          '<div style="text-align:center">' +
            '<div style="font-size:36px;font-weight:800;color:' + (percentage >= 80 ? 'var(--green)' : percentage >= 60 ? 'var(--yellow)' : 'var(--red)') + '">' + percentage + '%</div>' +
            '<div style="font-size:12px;color:var(--t3)">Score</div>' +
          '</div>' +
          '<div style="text-align:center">' +
            '<div style="font-size:36px;font-weight:800;color:var(--blue)">' + state.quizScore + '/' + totalQuestions + '</div>' +
            '<div style="font-size:12px;color:var(--t3)">Correct</div>' +
          '</div>' +
          '<div style="text-align:center">' +
            '<div style="font-size:36px;font-weight:800;color:var(--yellow)">+' + earnedXP + '</div>' +
            '<div style="font-size:12px;color:var(--t3)">XP Earned</div>' +
          '</div>' +
        '</div>' +

        // Show answers review
        '<div style="text-align:left;margin-bottom:24px">' +
          quiz.questions.map(function(q, i) {
            const userAnswer = state.quizAnswers[i];
            const isCorrect = userAnswer === q.correct;
            return '<div style="padding:16px;margin-bottom:12px;background:' + (isCorrect ? 'var(--green-g)' : 'var(--red-g)') + ';border-radius:12px;border-left:4px solid ' + (isCorrect ? 'var(--green)' : 'var(--red)') + '">' +
              '<div style="display:flex;align-items:start;gap:10px;margin-bottom:8px">' +
                '<span style="font-size:16px">' + (isCorrect ? '✓' : '✗') + '</span>' +
                '<div style="flex:1">' +
                  '<div style="font-size:13px;font-weight:600;margin-bottom:4px">' + q.q + '</div>' +
                  '<div style="font-size:12px;color:var(--t2)">' +
                    'Your answer: ' + q.options[userAnswer] +
                    (!isCorrect ? ' • Correct: ' + q.options[q.correct] : '') +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div style="font-size:11px;color:var(--t3);padding-left:26px">' + q.explanation + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +

        '<button onclick="closeQuiz()" class="btn btn-p" style="padding:14px 32px">Back to Quizzes</button>' +
      '</div>' +
    '</div>';
  }

  // Show quiz questions
  return '<div style="animation:fadeIn .35s;max-width:700px;margin:0 auto">' +
    '<div class="card" style="padding:24px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
        '<div>' +
          '<h2 style="font-size:20px;font-weight:700;margin-bottom:4px">' + quiz.icon + ' ' + quiz.title + '</h2>' +
          '<p style="font-size:12px;color:var(--t3)">' + answeredCount + ' of ' + totalQuestions + ' answered</p>' +
        '</div>' +
        '<button onclick="closeQuiz()" style="background:var(--bg3);border:1px solid var(--bd);color:var(--t2);cursor:pointer;font-size:14px;padding:8px 16px;border-radius:8px">✕ Close</button>' +
      '</div>' +
      
      '<div style="height:6px;background:var(--bg3);border-radius:3px;margin-bottom:24px;overflow:hidden">' +
        '<div style="height:100%;width:' + ((answeredCount / totalQuestions) * 100) + '%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:3px;transition:width 0.3s"></div>' +
      '</div>' +

      quiz.questions.map(function(q, qIndex) {
        const userAnswer = state.quizAnswers[qIndex];
        return '<div style="margin-bottom:24px;padding:20px;background:var(--bg1);border-radius:14px;border:1px solid var(--bd)">' +
          '<div style="font-size:12px;color:var(--blue);font-weight:600;margin-bottom:8px">Question ' + (qIndex + 1) + '</div>' +
          '<div style="font-size:15px;font-weight:600;margin-bottom:16px">' + q.q + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' +
            q.options.map(function(opt, oIndex) {
              const isSelected = userAnswer === oIndex;
              return '<button onclick="answerQuiz(' + qIndex + ', ' + oIndex + ')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:' + (isSelected ? 'rgba(91,140,255,0.1)' : 'var(--bg2)') + ';border:2px solid ' + (isSelected ? 'var(--blue)' : 'transparent') + ';border-radius:10px;cursor:pointer;text-align:left;font-family:inherit;font-size:13px;color:var(--t1);transition:all 0.2s">' +
                '<span style="width:24px;height:24px;border-radius:50%;background:' + (isSelected ? 'var(--blue)' : 'var(--bg3)') + ';display:flex;align-items:center;justify-content:center;color:' + (isSelected ? 'white' : 'var(--t3)') + ';font-size:11px;font-weight:600">' + String.fromCharCode(65 + oIndex) + '</span>' +
                '<span>' + opt + '</span>' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('') +

      '<button onclick="submitQuiz()" class="btn btn-p" style="width:100%;padding:16px;font-size:15px" ' + (answeredCount < totalQuestions ? 'disabled style="opacity:0.5;cursor:not-allowed;width:100%;padding:16px;font-size:15px"' : '') + '>' +
        (answeredCount < totalQuestions ? 'Answer all questions to submit' : 'Submit Quiz') +
      '</button>' +
    '</div>' +
  '</div>';
}

function renderProgress() {
  const levelInfo = getLevelInfo(state.totalXP);
  const earnedBadges = BADGES.filter(b => state.badges.includes(b.id));
  const lockedBadges = BADGES.filter(b => !state.badges.includes(b.id));
  
  const totalCourseModules = COURSES.reduce((sum, c) => sum + c.modules.length, 0);
  const completedModules = COURSES.reduce((sum, c) => sum + c.modules.filter(m => m.completed).length, 0);
  const articlesRead = Object.keys(state.learnProgress).filter(k => BLOGS.some(b => b.id === k)).length;
  const videosWatched = Object.keys(state.learnProgress).filter(k => VIDEOS.some(v => v.id === k)).length;

  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">' +
    // Stats Overview
    '<div class="card">' +
      '<h3 style="font-size:16px;font-weight:700;margin-bottom:16px">📊 Learning Stats</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div style="padding:16px;background:linear-gradient(135deg,var(--blue-g),rgba(91,140,255,0.05));border-radius:12px;text-align:center">' +
          '<div style="font-size:28px;font-weight:800;color:var(--blue)">' + state.totalXP.toLocaleString() + '</div>' +
          '<div style="font-size:11px;color:var(--t3)">Total XP</div>' +
        '</div>' +
        '<div style="padding:16px;background:linear-gradient(135deg,var(--yellow-g),rgba(255,184,77,0.05));border-radius:12px;text-align:center">' +
          '<div style="font-size:28px;font-weight:800;color:var(--yellow)">' + state.streakDays + '</div>' +
          '<div style="font-size:11px;color:var(--t3)">Day Streak</div>' +
        '</div>' +
        '<div style="padding:16px;background:linear-gradient(135deg,var(--green-g),rgba(61,219,160,0.05));border-radius:12px;text-align:center">' +
          '<div style="font-size:28px;font-weight:800;color:var(--green)">' + completedModules + '/' + totalCourseModules + '</div>' +
          '<div style="font-size:11px;color:var(--t3)">Lessons Done</div>' +
        '</div>' +
        '<div style="padding:16px;background:linear-gradient(135deg,var(--purple-g),rgba(176,124,255,0.05));border-radius:12px;text-align:center">' +
          '<div style="font-size:28px;font-weight:800;color:var(--purple)">' + earnedBadges.length + '</div>' +
          '<div style="font-size:11px;color:var(--t3)">Badges Earned</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:16px;padding:16px;background:var(--bg1);border-radius:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<span style="font-size:13px;font-weight:600">📖 Articles Read</span>' +
          '<span style="font-size:13px;color:var(--blue)">' + articlesRead + '/' + BLOGS.length + '</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<span style="font-size:13px;font-weight:600">🎬 Videos Watched</span>' +
          '<span style="font-size:13px;color:var(--blue)">' + videosWatched + '/' + VIDEOS.length + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Level Progress
    '<div class="card">' +
      '<h3 style="font-size:16px;font-weight:700;margin-bottom:16px">🎖️ Level Progress</h3>' +
      '<div style="text-align:center;padding:20px;background:linear-gradient(135deg,rgba(91,140,255,0.1),rgba(176,124,255,0.1));border-radius:16px;margin-bottom:16px">' +
        '<div style="font-size:48px;margin-bottom:8px">🏆</div>' +
        '<div style="font-size:24px;font-weight:800;color:var(--blue)">Level ' + levelInfo.level + '</div>' +
        '<div style="font-size:14px;color:var(--t2)">' + levelInfo.title + '</div>' +
      '</div>' +
      '<div style="margin-bottom:12px">' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">' +
          '<span style="color:var(--t2)">' + state.totalXP + ' XP</span>' +
          '<span style="color:var(--t3)">' + levelInfo.xpToNext + ' XP to Level ' + (levelInfo.level + 1) + '</span>' +
        '</div>' +
        '<div style="height:12px;background:var(--bg3);border-radius:6px;overflow:hidden">' +
          '<div style="height:100%;width:' + levelInfo.progress + '%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:6px"></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Earned Badges
    '<div class="card" style="grid-column:span 2">' +
      '<h3 style="font-size:16px;font-weight:700;margin-bottom:16px">🏅 Badges Collection</h3>' +
      '<div style="margin-bottom:20px">' +
        '<div style="font-size:12px;color:var(--green);font-weight:600;margin-bottom:12px">✓ Earned (' + earnedBadges.length + ')</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:12px">' +
          earnedBadges.map(function(badge) {
            return '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--green-g);border-radius:12px;border:1px solid rgba(61,219,160,0.2)">' +
              '<span style="font-size:28px">' + badge.icon + '</span>' +
              '<div>' +
                '<div style="font-size:13px;font-weight:600;color:var(--green)">' + badge.name + '</div>' +
                '<div style="font-size:10px;color:var(--t3)">' + badge.description + '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:12px">🔒 Locked (' + lockedBadges.length + ')</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:12px">' +
          lockedBadges.map(function(badge) {
            return '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg2);border-radius:12px;border:1px solid var(--bd);opacity:0.6">' +
              '<span style="font-size:28px;filter:grayscale(1)">' + badge.icon + '</span>' +
              '<div>' +
                '<div style="font-size:13px;font-weight:600;color:var(--t2)">' + badge.name + '</div>' +
                '<div style="font-size:10px;color:var(--t3)">' + badge.description + '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function renderLearnPartners() {
  const partners = [
    { name: 'Capital One', icon: '🏦', desc: 'Nessie API - Mock banking data', url: 'https://api.nessieisreal.com' },
    { name: 'Khan Academy', icon: '🎓', desc: 'Free financial education', url: 'https://www.khanacademy.org/college-careers-more/personal-finance' },
    { name: 'Investopedia', icon: '📊', desc: 'Financial dictionary & guides', url: 'https://www.investopedia.com' },
    { name: 'NerdWallet', icon: '🤓', desc: 'Comparison & calculators', url: 'https://www.nerdwallet.com' }
  ];

  return '<div style="margin-top:32px">' +
    '<h3 style="font-size:15px;font-weight:700;margin-bottom:14px">🤝 Learning Partners</h3>' +
    '<div class="grid g4" style="gap:12px">' +
      partners.map(function(p) {
        return '<a href="' + p.url + '" target="_blank" class="card" style="display:flex;align-items:center;gap:12px;padding:16px;text-decoration:none;color:inherit">' +
          '<span style="font-size:28px">' + p.icon + '</span>' +
          '<div style="flex:1">' +
            '<div style="font-size:13px;font-weight:600">' + p.name + '</div>' +
            '<div style="font-size:10px;color:var(--t3)">' + p.desc + '</div>' +
          '</div>' +
          '<span style="color:var(--t3)">↗</span>' +
        '</a>';
      }).join('') +
    '</div>' +
  '</div>';
}

// Export render function
window.renderLearnHub = renderLearnHub;