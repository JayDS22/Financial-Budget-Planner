// ========== SHOPPING PLANNER - VisionFi ==========
// Smart Shopping with Offers, Budget Integration & Spend History Analysis
// Integrated with Capital One Nessie API concept for mock banking data

// ========== SHOPPING STATE ==========
if (typeof state !== 'undefined') {
  state.shoppingSub = 'planner';
  state.shoppingData = null;
  state.shoppingLoading = false;
  state.selectedOffer = null;
  state.shoppingCart = [];
  state.showOfferModal = false;
  state.activeCategory = 'all';
}

// ========== DUMMY OFFERS DATA (Capital One Style) ==========
const CAPITAL_ONE_OFFERS = [
  // Grocery & Food
  { id: 'offer1', merchant: 'Whole Foods', category: 'Food & Dining', discount: 10, type: 'percent', minSpend: 50, maxCashback: 25, icon: '🛒', expires: '2026-02-28', featured: true, description: '10% back on groceries', cardRequired: 'Savor' },
  { id: 'offer2', merchant: 'DoorDash', category: 'Food & Dining', discount: 5, type: 'flat', minSpend: 25, maxCashback: 5, icon: '🍔', expires: '2026-02-20', featured: false, description: '$5 off $25+ orders', cardRequired: 'Any' },
  { id: 'offer3', merchant: 'Starbucks', category: 'Food & Dining', discount: 15, type: 'percent', minSpend: 10, maxCashback: 5, icon: '☕', expires: '2026-02-15', featured: true, description: '15% back on coffee', cardRequired: 'Any' },
  { id: 'offer4', merchant: 'Chipotle', category: 'Food & Dining', discount: 20, type: 'percent', minSpend: 15, maxCashback: 8, icon: '🌯', expires: '2026-02-25', featured: false, description: '20% back on burritos', cardRequired: 'Quicksilver' },
  
  // Shopping & Retail
  { id: 'offer5', merchant: 'Amazon', category: 'Shopping', discount: 5, type: 'percent', minSpend: 100, maxCashback: 50, icon: '📦', expires: '2026-03-15', featured: true, description: '5% back on Amazon', cardRequired: 'Venture' },
  { id: 'offer6', merchant: 'Target', category: 'Shopping', discount: 10, type: 'percent', minSpend: 75, maxCashback: 30, icon: '🎯', expires: '2026-02-28', featured: true, description: '10% back at Target', cardRequired: 'Any' },
  { id: 'offer7', merchant: 'Best Buy', category: 'Shopping', discount: 15, type: 'percent', minSpend: 200, maxCashback: 100, icon: '🖥️', expires: '2026-03-01', featured: false, description: '15% back on electronics', cardRequired: 'Quicksilver' },
  { id: 'offer8', merchant: 'Nike', category: 'Shopping', discount: 20, type: 'percent', minSpend: 100, maxCashback: 50, icon: '👟', expires: '2026-02-22', featured: false, description: '20% back on shoes', cardRequired: 'Venture X' },
  { id: 'offer9', merchant: 'Costco', category: 'Shopping', discount: 4, type: 'percent', minSpend: 150, maxCashback: 40, icon: '🏪', expires: '2026-03-31', featured: true, description: '4% back at Costco', cardRequired: 'Costco Card' },
  
  // Transport & Gas
  { id: 'offer10', merchant: 'Shell', category: 'Transport', discount: 10, type: 'cents_gallon', minSpend: 0, maxCashback: 20, icon: '⛽', expires: '2026-03-15', featured: true, description: '10¢/gallon off gas', cardRequired: 'Any' },
  { id: 'offer11', merchant: 'Uber', category: 'Transport', discount: 25, type: 'percent', minSpend: 20, maxCashback: 15, icon: '🚗', expires: '2026-02-18', featured: true, description: '25% off rides', cardRequired: 'Venture' },
  { id: 'offer12', merchant: 'Lyft', category: 'Transport', discount: 20, type: 'percent', minSpend: 15, maxCashback: 10, icon: '🚕', expires: '2026-02-28', featured: false, description: '20% off Lyft', cardRequired: 'Savor' },
  
  // Entertainment & Subscriptions
  { id: 'offer13', merchant: 'Netflix', category: 'Subscriptions', discount: 3, type: 'flat', minSpend: 0, maxCashback: 3, icon: '🎬', expires: '2026-04-01', featured: false, description: '$3 off monthly', cardRequired: 'Any' },
  { id: 'offer14', merchant: 'Spotify', category: 'Subscriptions', discount: 2, type: 'flat', minSpend: 0, maxCashback: 2, icon: '🎵', expires: '2026-04-01', featured: false, description: '$2 off premium', cardRequired: 'Any' },
  { id: 'offer15', merchant: 'AMC Theatres', category: 'Entertainment', discount: 25, type: 'percent', minSpend: 25, maxCashback: 15, icon: '🎟️', expires: '2026-02-28', featured: true, description: '25% back on movies', cardRequired: 'Savor' },
  
  // Travel
  { id: 'offer16', merchant: 'Hotels.com', category: 'Travel', discount: 8, type: 'percent', minSpend: 200, maxCashback: 100, icon: '🏨', expires: '2026-06-30', featured: true, description: '8% back on hotels', cardRequired: 'Venture X' },
  { id: 'offer17', merchant: 'Delta Airlines', category: 'Travel', discount: 5, type: 'miles_per_dollar', minSpend: 300, maxCashback: 0, icon: '✈️', expires: '2026-05-31', featured: true, description: '5x miles on flights', cardRequired: 'Venture' },
  { id: 'offer18', merchant: 'Airbnb', category: 'Travel', discount: 10, type: 'percent', minSpend: 150, maxCashback: 75, icon: '🏠', expires: '2026-04-30', featured: false, description: '10% back on stays', cardRequired: 'Venture X' },
  
  // Healthcare & Wellness
  { id: 'offer19', merchant: 'CVS', category: 'Healthcare', discount: 10, type: 'percent', minSpend: 30, maxCashback: 15, icon: '💊', expires: '2026-03-15', featured: false, description: '10% back at CVS', cardRequired: 'Any' },
  { id: 'offer20', merchant: 'Planet Fitness', category: 'Healthcare', discount: 15, type: 'percent', minSpend: 0, maxCashback: 10, icon: '💪', expires: '2026-02-28', featured: false, description: '15% off membership', cardRequired: 'Quicksilver' }
];

// ========== SHOPPING ASSISTANT - AI Recommendations ==========
const SHOPPING_RECOMMENDATIONS = {
  'high_spender': {
    title: 'Smart Saver Mode',
    description: 'Based on your spending patterns, here are ways to save:',
    tips: [
      'Use cashback offers for your frequent merchants',
      'Stack credit card rewards with store coupons',
      'Consider bulk buying at Costco for recurring items'
    ]
  },
  'budget_conscious': {
    title: 'Budget Guardian',
    description: 'You\'re doing great staying within budget! Optimize further:',
    tips: [
      'Set spending alerts for categories near limit',
      'Use price comparison before big purchases',
      'Wait 24 hours before impulse buys over $50'
    ]
  },
  'occasional_shopper': {
    title: 'Strategic Shopping',
    description: 'Make the most of your shopping trips:',
    tips: [
      'Activate all available offers before shopping',
      'Combine errands to save on transport',
      'Use seasonal sales for bigger purchases'
    ]
  }
};

// ========== LOAD SHOPPING DATA ==========
async function loadShoppingData(userId) {
  state.shoppingLoading = true;
  render();
  
  try {
    // Fetch user's transaction data to analyze spend patterns
    const dashData = state.dashData || await api('GET', '/api/dashboard/' + userId);
    const transactions = dashData.transactions || [];
    const budgets = dashData.budgets || [];
    
    // Analyze spending patterns
    const spendAnalysis = analyzeSpendingPatterns(transactions);
    
    // Get budget status
    const budgetStatus = analyzeBudgetStatus(budgets, transactions);
    
    // Match offers to user's spending habits
    const personalizedOffers = personalizeOffers(spendAnalysis, budgetStatus);
    
    // Calculate potential savings
    const potentialSavings = calculatePotentialSavings(personalizedOffers, spendAnalysis);
    
    // Shopping calendar - when to buy what
    const shoppingCalendar = generateShoppingCalendar(spendAnalysis, budgetStatus);
    
    state.shoppingData = {
      spendAnalysis,
      budgetStatus,
      personalizedOffers,
      potentialSavings,
      shoppingCalendar,
      allOffers: CAPITAL_ONE_OFFERS,
      recommendations: getShoppingRecommendations(spendAnalysis)
    };
    
  } catch (e) {
    console.error('Failed to load shopping data:', e);
    state.shoppingData = {
      error: e.message,
      allOffers: CAPITAL_ONE_OFFERS
    };
  }
  
  state.shoppingLoading = false;
  render();
}

// ========== ANALYZE SPENDING PATTERNS ==========
function analyzeSpendingPatterns(transactions) {
  const patterns = {};
  const merchantFrequency = {};
  const categoryTotals = {};
  const weekdaySpending = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  
  const expenses = transactions.filter(tx => tx.amount < 0);
  
  expenses.forEach(tx => {
    // Category analysis
    const cat = tx.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(tx.amount);
    
    // Merchant frequency
    const merchant = tx.name;
    if (!merchantFrequency[merchant]) {
      merchantFrequency[merchant] = { count: 0, total: 0, category: cat, icon: tx.icon };
    }
    merchantFrequency[merchant].count++;
    merchantFrequency[merchant].total += Math.abs(tx.amount);
    
    // Day of week analysis
    const day = new Date(tx.date).getDay();
    weekdaySpending[day] += Math.abs(tx.amount);
  });
  
  // Find top merchants
  const topMerchants = Object.entries(merchantFrequency)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      ...data,
      avgTransaction: data.total / data.count
    }));
  
  // Find top categories
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => ({ name, total }));
  
  // Calculate spending behavior type
  const totalSpending = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const avgTransaction = totalSpending / expenses.length || 0;
  
  let spenderType = 'budget_conscious';
  if (avgTransaction > 100 || totalSpending > 5000) {
    spenderType = 'high_spender';
  } else if (expenses.length < 10) {
    spenderType = 'occasional_shopper';
  }
  
  return {
    topMerchants,
    topCategories,
    weekdaySpending,
    totalSpending,
    avgTransaction,
    transactionCount: expenses.length,
    spenderType,
    peakSpendingDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      weekdaySpending.indexOf(Math.max(...weekdaySpending))
    ]
  };
}

// ========== ANALYZE BUDGET STATUS ==========
function analyzeBudgetStatus(budgets, transactions) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const monthProgress = (dayOfMonth / daysInMonth) * 100;
  
  const monthlyTx = transactions.filter(tx => new Date(tx.date) >= startOfMonth && tx.amount < 0);
  
  const categorySpending = {};
  monthlyTx.forEach(tx => {
    const cat = tx.category || 'Other';
    categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(tx.amount);
  });
  
  const budgetAnalysis = budgets.map(b => {
    const spent = categorySpending[b.category] || 0;
    const percentage = (spent / b.budget_amount) * 100;
    const remaining = b.budget_amount - spent;
    const dailyAllowance = remaining / (daysInMonth - dayOfMonth + 1);
    
    let status = 'good';
    if (percentage > monthProgress + 15) status = 'warning';
    if (percentage > 90) status = 'critical';
    if (percentage > 100) status = 'over';
    
    return {
      category: b.category,
      budget: b.budget_amount,
      spent,
      remaining,
      percentage,
      dailyAllowance,
      status,
      canSpend: status !== 'over' && status !== 'critical'
    };
  });
  
  return {
    budgetAnalysis,
    monthProgress,
    totalBudget: budgets.reduce((sum, b) => sum + b.budget_amount, 0),
    totalSpent: Object.values(categorySpending).reduce((sum, v) => sum + v, 0),
    flexibleCategories: budgetAnalysis.filter(b => b.status === 'good').map(b => b.category),
    restrictedCategories: budgetAnalysis.filter(b => b.status !== 'good').map(b => b.category)
  };
}

// ========== PERSONALIZE OFFERS ==========
function personalizeOffers(spendAnalysis, budgetStatus) {
  const merchantNames = spendAnalysis.topMerchants.map(m => m.name.toLowerCase());
  const flexibleCategories = budgetStatus.flexibleCategories;
  
  return CAPITAL_ONE_OFFERS.map(offer => {
    let relevanceScore = 0;
    let reasons = [];
    
    // Check if user shops at this merchant
    const merchantMatch = merchantNames.find(m => 
      m.includes(offer.merchant.toLowerCase()) || 
      offer.merchant.toLowerCase().includes(m)
    );
    if (merchantMatch) {
      relevanceScore += 50;
      reasons.push('You shop here often');
    }
    
    // Check if category has budget room
    if (flexibleCategories.includes(offer.category)) {
      relevanceScore += 30;
      reasons.push('Budget available');
    } else if (budgetStatus.restrictedCategories.includes(offer.category)) {
      relevanceScore -= 20;
      reasons.push('⚠️ Budget tight');
    }
    
    // Featured offers get a boost
    if (offer.featured) {
      relevanceScore += 20;
      reasons.push('Featured deal');
    }
    
    // Check expiration urgency
    const daysToExpire = Math.ceil((new Date(offer.expires) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysToExpire <= 7) {
      relevanceScore += 15;
      reasons.push('Expires soon!');
    }
    
    return {
      ...offer,
      relevanceScore,
      reasons,
      daysToExpire,
      recommended: relevanceScore >= 50
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// ========== CALCULATE POTENTIAL SAVINGS ==========
function calculatePotentialSavings(personalizedOffers, spendAnalysis) {
  const relevantOffers = personalizedOffers.filter(o => o.recommended);
  
  let monthlySavings = 0;
  const savingsBreakdown = [];
  
  relevantOffers.forEach(offer => {
    const merchant = spendAnalysis.topMerchants.find(m => 
      m.name.toLowerCase().includes(offer.merchant.toLowerCase()) ||
      offer.merchant.toLowerCase().includes(m.name.toLowerCase())
    );
    
    if (merchant) {
      let savings = 0;
      if (offer.type === 'percent') {
        savings = Math.min(merchant.total * (offer.discount / 100), offer.maxCashback);
      } else if (offer.type === 'flat') {
        savings = Math.min(offer.discount * merchant.count, offer.maxCashback * 4); // 4 weeks
      }
      
      monthlySavings += savings;
      savingsBreakdown.push({
        merchant: offer.merchant,
        estimatedSavings: savings,
        offer: offer
      });
    }
  });
  
  return {
    monthlySavings,
    yearlySavings: monthlySavings * 12,
    savingsBreakdown,
    offersToActivate: relevantOffers.length
  };
}

// ========== GENERATE SHOPPING CALENDAR ==========
function generateShoppingCalendar(spendAnalysis, budgetStatus) {
  const calendar = [];
  const today = new Date();
  
  // Find categories with room to spend
  const goodCategories = budgetStatus.budgetAnalysis
    .filter(b => b.status === 'good' && b.dailyAllowance > 10)
    .sort((a, b) => b.dailyAllowance - a.dailyAllowance);
  
  // Peak spending days get lower recommendations
  const peakDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    .indexOf(spendAnalysis.peakSpendingDay);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
    
    let recommendation = 'Normal spending day';
    let spendingAdvice = [];
    let urgentOffers = [];
    
    // Weekend shopping
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      recommendation = 'Good day for planned purchases';
      spendingAdvice.push('✓ Bulk grocery shopping recommended');
    }
    
    // If it's their peak spending day, warn them
    if (dayOfWeek === peakDayIndex) {
      recommendation = '⚠️ Your highest spending day';
      spendingAdvice.push('Consider delaying non-essential purchases');
    }
    
    // Find offers expiring on this day
    urgentOffers = CAPITAL_ONE_OFFERS.filter(o => {
      const expDate = new Date(o.expires);
      return expDate.toDateString() === date.toDateString();
    });
    
    if (urgentOffers.length > 0) {
      spendingAdvice.push(`${urgentOffers.length} offer(s) expire today!`);
    }
    
    // Add category recommendations based on budget
    if (i === 0) { // Today
      goodCategories.slice(0, 2).forEach(cat => {
        spendingAdvice.push(`💰 ${cat.category}: $${cat.dailyAllowance.toFixed(0)} available today`);
      });
    }
    
    calendar.push({
      date: date.toISOString().split('T')[0],
      dayName,
      dayOfMonth: date.getDate(),
      recommendation,
      spendingAdvice,
      urgentOffers,
      isToday: i === 0,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    });
  }
  
  return calendar;
}

// ========== GET SHOPPING RECOMMENDATIONS ==========
function getShoppingRecommendations(spendAnalysis) {
  return SHOPPING_RECOMMENDATIONS[spendAnalysis.spenderType] || SHOPPING_RECOMMENDATIONS['budget_conscious'];
}

// ========== RENDER SHOPPING PLANNER ==========
function renderShoppingPlanner() {
  if (state.shoppingLoading) {
    return '<div class="card" style="padding:60px;text-align:center">' +
      '<div style="font-size:48px;margin-bottom:16px;animation:pulse 1.5s infinite">🛍️</div>' +
      '<div style="font-size:16px;color:var(--t2)">Analyzing your shopping patterns...</div>' +
      '<div style="font-size:12px;color:var(--t3);margin-top:8px">Powered by Capital One Offers</div>' +
    '</div>';
  }
  
  if (!state.shoppingData) {
    // Use setTimeout to avoid render loop - load data after current render completes
    setTimeout(function() {
      loadShoppingData(state.currentUser?.id || 'u1');
    }, 0);
    return '<div class="card" style="padding:60px;text-align:center">' +
      '<div style="font-size:48px;margin-bottom:16px;animation:pulse 1.5s infinite">🛒</div>' +
      '<div style="font-size:16px;color:var(--t2)">Loading Shopping Planner...</div>' +
    '</div>';
  }
  
  const data = state.shoppingData;
  const subs = [
    { id: 'planner', label: 'Smart Planner', icon: '📋' },
    { id: 'offers', label: 'Offers & Deals', icon: '🏷️' },
    { id: 'calendar', label: 'When to Buy', icon: '📅' },
    { id: 'insights', label: 'Spend Insights', icon: '📊' }
  ];
  
  return '<div style="animation:fadeIn .35s">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<div>' +
        '<h1 style="font-size:24px;font-weight:700;margin-bottom:4px">🛍️ Shopping Planner</h1>' +
        '<p style="font-size:13px;color:var(--t2)">Shop smarter with personalized offers & budget-aware recommendations</p>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(135deg,rgba(0,135,90,0.1),rgba(26,31,113,0.05));border-radius:10px;border:1px solid rgba(0,135,90,0.2)">' +
        '<span style="font-size:20px">💰</span>' +
        '<div>' +
          '<div style="font-size:10px;color:var(--t3)">Potential Monthly Savings</div>' +
          '<div style="font-size:18px;font-weight:700;color:var(--green)">' + fmt(data.potentialSavings?.monthlySavings || 0) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    
    // Sub-navigation
    '<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">' +
      subs.map(s => {
        const isActive = state.shoppingSub === s.id;
        return '<button onclick="set({shoppingSub:\'' + s.id + '\'})" style="padding:10px 16px;border-radius:10px;border:1px solid ' + (isActive ? 'var(--blue)' : 'var(--bd)') + ';background:' + (isActive ? 'var(--blue-g)' : 'var(--bg1)') + ';color:' + (isActive ? 'var(--blue)' : 'var(--t2)') + ';font-size:13px;font-weight:' + (isActive ? '600' : '500') + ';cursor:pointer;display:flex;align-items:center;gap:6px">' +
          '<span>' + s.icon + '</span>' + s.label +
        '</button>';
      }).join('') +
    '</div>' +
    
    // Content based on sub-tab
    (state.shoppingSub === 'planner' ? renderSmartPlanner(data) :
     state.shoppingSub === 'offers' ? renderOffersSection(data) :
     state.shoppingSub === 'calendar' ? renderShoppingCalendar(data) :
     state.shoppingSub === 'insights' ? renderSpendInsights(data) : '') +
    
    // Offer Detail Modal
    (state.showOfferModal && state.selectedOffer ? renderOfferModal(state.selectedOffer) : '') +
  '</div>';
}

// ========== SMART PLANNER VIEW ==========
function renderSmartPlanner(data) {
  const recommendations = data.recommendations;
  const topOffers = data.personalizedOffers?.slice(0, 4) || [];
  const budgetStatus = data.budgetStatus;
  
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
    // Left Column - Recommendations
    '<div>' +
      // AI Recommendations Card
      '<div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,rgba(91,140,255,0.08),rgba(176,124,255,0.05))">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
          '<div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#5b8cff,#b07cff);display:flex;align-items:center;justify-content:center">' +
            '<span style="font-size:20px">🧠</span>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:16px;font-weight:700">' + (recommendations?.title || 'Smart Shopping') + '</div>' +
            '<div style="font-size:12px;color:var(--t2)">' + (recommendations?.description || '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          (recommendations?.tips || []).map(tip => 
            '<div style="display:flex;align-items:start;gap:10px;padding:10px;background:rgba(255,255,255,0.5);border-radius:8px">' +
              '<span style="color:var(--green);font-size:14px">✓</span>' +
              '<span style="font-size:13px">' + tip + '</span>' +
            '</div>'
          ).join('') +
        '</div>' +
      '</div>' +
      
      // Budget Snapshot
      '<div class="card">' +
        '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px">📊 Budget Snapshot</h3>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          (budgetStatus?.budgetAnalysis?.slice(0, 5) || []).map(b => {
            const color = b.status === 'good' ? 'var(--green)' : b.status === 'warning' ? 'var(--amber)' : 'var(--red)';
            const bgColor = b.status === 'good' ? 'var(--green-g)' : b.status === 'warning' ? 'var(--amber-g)' : 'var(--red-g)';
            return '<div style="padding:10px;background:' + bgColor + ';border-radius:8px;border-left:3px solid ' + color + '">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
                '<span style="font-size:13px;font-weight:500">' + b.category + '</span>' +
                '<span style="font-size:12px;color:' + color + ';font-weight:600">' + b.percentage.toFixed(0) + '%</span>' +
              '</div>' +
              '<div style="height:4px;background:rgba(0,0,0,0.1);border-radius:2px;overflow:hidden">' +
                '<div style="height:100%;width:' + Math.min(b.percentage, 100) + '%;background:' + color + ';border-radius:2px"></div>' +
              '</div>' +
              '<div style="font-size:11px;color:var(--t3);margin-top:4px">' +
                (b.canSpend ? '💰 ' + fmt(b.dailyAllowance) + '/day available' : '⚠️ Budget exceeded') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>' +
    
    // Right Column - Top Offers
    '<div>' +
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
          '<h3 style="font-size:14px;font-weight:600">🔥 Recommended for You</h3>' +
          '<button onclick="set({shoppingSub:\'offers\'})" style="font-size:11px;color:var(--blue);background:none;border:none;cursor:pointer;font-weight:500">View All →</button>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          topOffers.map(offer => renderOfferCard(offer, 'compact')).join('') +
        '</div>' +
      '</div>' +
      
      // Today's Shopping Tip
      '<div class="card" style="margin-top:16px;background:linear-gradient(135deg,rgba(0,135,90,0.1),rgba(0,135,90,0.05));border:1px solid rgba(0,135,90,0.2)">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
          '<span style="font-size:24px">💡</span>' +
          '<span style="font-size:14px;font-weight:600;color:var(--green)">Today\'s Tip</span>' +
        '</div>' +
        '<div style="font-size:13px;color:var(--t1);line-height:1.5">' +
          (data.shoppingCalendar?.[0]?.recommendation || 'Check your offers before shopping!') +
        '</div>' +
        '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">' +
          (data.shoppingCalendar?.[0]?.spendingAdvice || []).slice(0, 2).map(advice =>
            '<span style="font-size:11px;padding:4px 10px;background:rgba(0,135,90,0.15);border-radius:6px;color:var(--green)">' + advice + '</span>'
          ).join('') +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// ========== OFFERS SECTION ==========
function renderOffersSection(data) {
  const offers = data.personalizedOffers || data.allOffers || [];
  const categories = ['all', 'Food & Dining', 'Shopping', 'Transport', 'Entertainment', 'Travel', 'Healthcare'];
  
  const filteredOffers = state.activeCategory === 'all' 
    ? offers 
    : offers.filter(o => o.category === state.activeCategory);
  
  return '<div>' +
    // Category Filter
    '<div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px">' +
      categories.map(cat => {
        const isActive = state.activeCategory === cat;
        const count = cat === 'all' ? offers.length : offers.filter(o => o.category === cat).length;
        return '<button onclick="state.activeCategory=\'' + cat + '\';render()" style="padding:8px 14px;border-radius:20px;border:1px solid ' + (isActive ? 'var(--blue)' : 'var(--bd)') + ';background:' + (isActive ? 'var(--blue)' : 'var(--bg1)') + ';color:' + (isActive ? '#fff' : 'var(--t2)') + ';font-size:12px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px">' +
          (cat === 'all' ? '🏷️ All' : cat) +
          '<span style="padding:2px 6px;border-radius:10px;background:' + (isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg3)') + ';font-size:10px">' + count + '</span>' +
        '</button>';
      }).join('') +
    '</div>' +
    
    // Savings Summary
    '<div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#1A1F71 0%,#2E348F 100%);color:#fff">' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center">' +
        '<div>' +
          '<div style="font-size:28px;font-weight:700">' + fmt(data.potentialSavings?.monthlySavings || 0) + '</div>' +
          '<div style="font-size:11px;opacity:0.8">Monthly Savings</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-size:28px;font-weight:700">' + fmt(data.potentialSavings?.yearlySavings || 0) + '</div>' +
          '<div style="font-size:11px;opacity:0.8">Yearly Savings</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-size:28px;font-weight:700">' + (data.potentialSavings?.offersToActivate || 0) + '</div>' +
          '<div style="font-size:11px;opacity:0.8">Offers to Activate</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    
    // Offers Grid
    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">' +
      filteredOffers.map(offer => renderOfferCard(offer, 'full')).join('') +
    '</div>' +
    
    (filteredOffers.length === 0 ? 
      '<div style="text-align:center;padding:40px;color:var(--t3)">' +
        '<div style="font-size:32px;margin-bottom:12px">🔍</div>' +
        '<div>No offers in this category</div>' +
      '</div>' : '') +
  '</div>';
}

// ========== OFFER CARD ==========
function renderOfferCard(offer, style) {
  const daysLeft = offer.daysToExpire || Math.ceil((new Date(offer.expires) - new Date()) / (1000 * 60 * 60 * 24));
  const urgencyColor = daysLeft <= 3 ? 'var(--red)' : daysLeft <= 7 ? 'var(--amber)' : 'var(--green)';
  
  if (style === 'compact') {
    return '<div onclick="openOfferModal(\'' + offer.id + '\')" style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg1);border-radius:10px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background=\'var(--bg2)\'" onmouseout="this.style.background=\'var(--bg1)\'">' +
      '<div style="width:44px;height:44px;border-radius:10px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:22px">' + offer.icon + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:13px;font-weight:600">' + offer.merchant + '</div>' +
        '<div style="font-size:11px;color:var(--t3)">' + offer.description + '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:16px;font-weight:700;color:var(--green)">' + 
          (offer.type === 'percent' ? offer.discount + '%' : 
           offer.type === 'flat' ? '$' + offer.discount : 
           offer.discount + (offer.type === 'cents_gallon' ? '¢' : 'x')) +
        '</div>' +
        '<div style="font-size:10px;color:' + urgencyColor + '">' + daysLeft + 'd left</div>' +
      '</div>' +
    '</div>';
  }
  
  // Full card
  return '<div class="card" onclick="openOfferModal(\'' + offer.id + '\')" style="cursor:pointer;transition:all 0.2s;border:' + (offer.recommended ? '2px solid var(--green)' : '1px solid var(--bd)') + '" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.1)\'" onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'none\'">' +
    (offer.recommended ? '<div style="position:absolute;top:-1px;right:16px;padding:4px 10px;background:var(--green);color:#fff;font-size:10px;font-weight:600;border-radius:0 0 6px 6px">RECOMMENDED</div>' : '') +
    '<div style="display:flex;align-items:start;gap:14px;margin-bottom:12px">' +
      '<div style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,var(--bg2),var(--bg3));display:flex;align-items:center;justify-content:center;font-size:26px">' + offer.icon + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:15px;font-weight:700">' + offer.merchant + '</div>' +
        '<div style="font-size:12px;color:var(--t3);margin-top:2px">' + offer.category + '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:22px;font-weight:700;color:var(--green)">' +
          (offer.type === 'percent' ? offer.discount + '%' :
           offer.type === 'flat' ? '$' + offer.discount :
           offer.type === 'cents_gallon' ? offer.discount + '¢/gal' :
           offer.discount + 'x miles') +
        '</div>' +
        '<div style="font-size:10px;color:var(--t3)">BACK</div>' +
      '</div>' +
    '</div>' +
    '<div style="font-size:13px;color:var(--t2);margin-bottom:12px">' + offer.description + '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--bd)">' +
      '<div style="display:flex;gap:8px">' +
        (offer.minSpend > 0 ? '<span style="font-size:10px;padding:4px 8px;background:var(--bg2);border-radius:4px">Min $' + offer.minSpend + '</span>' : '') +
        '<span style="font-size:10px;padding:4px 8px;background:var(--blue-g);border-radius:4px;color:var(--blue)">' + offer.cardRequired + '</span>' +
      '</div>' +
      '<span style="font-size:11px;color:' + urgencyColor + ';font-weight:500">' +
        (daysLeft <= 0 ? 'Expired' : daysLeft + ' days left') +
      '</span>' +
    '</div>' +
    (offer.reasons && offer.reasons.length > 0 ? 
      '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:4px">' +
        offer.reasons.slice(0, 2).map(r => 
          '<span style="font-size:10px;padding:3px 8px;background:' + (r.includes('⚠️') ? 'var(--amber-g)' : 'var(--green-g)') + ';color:' + (r.includes('⚠️') ? 'var(--amber)' : 'var(--green)') + ';border-radius:4px">' + r + '</span>'
        ).join('') +
      '</div>' : '') +
  '</div>';
}

// ========== SHOPPING CALENDAR VIEW ==========
function renderShoppingCalendar(data) {
  const calendar = data.shoppingCalendar || [];
  
  return '<div>' +
    '<div class="card" style="margin-bottom:16px">' +
      '<h3 style="font-size:16px;font-weight:600;margin-bottom:4px">📅 Your Shopping Week</h3>' +
      '<p style="font-size:12px;color:var(--t3)">Budget-aware recommendations for when to make purchases</p>' +
    '</div>' +
    
    '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">' +
      calendar.map(day => {
        const bgColor = day.isToday ? 'linear-gradient(135deg,rgba(91,140,255,0.15),rgba(176,124,255,0.1))' : 
                       day.isWeekend ? 'rgba(0,135,90,0.08)' : 'var(--bg1)';
        const borderColor = day.isToday ? 'var(--blue)' : day.isWeekend ? 'rgba(0,135,90,0.3)' : 'var(--bd)';
        
        return '<div style="padding:14px 10px;background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:12px;text-align:center;min-height:180px;display:flex;flex-direction:column">' +
          '<div style="font-size:11px;color:var(--t3);font-weight:600">' + day.dayName + '</div>' +
          '<div style="font-size:22px;font-weight:700;margin:4px 0;color:' + (day.isToday ? 'var(--blue)' : 'var(--t1)') + '">' + day.dayOfMonth + '</div>' +
          (day.isToday ? '<span style="font-size:9px;padding:2px 8px;background:var(--blue);color:#fff;border-radius:4px;margin-bottom:8px">TODAY</span>' : '') +
          '<div style="flex:1;display:flex;flex-direction:column;gap:4px;margin-top:8px">' +
            day.spendingAdvice.slice(0, 2).map(advice =>
              '<div style="font-size:10px;padding:4px 6px;background:rgba(255,255,255,0.7);border-radius:4px;text-align:left">' + advice + '</div>'
            ).join('') +
            (day.urgentOffers.length > 0 ?
              '<div style="font-size:10px;padding:4px 6px;background:var(--red-g);color:var(--red);border-radius:4px;margin-top:auto">' +
                '🔥 ' + day.urgentOffers.length + ' expiring!' +
              '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    
    // Expiring Soon Section
    '<div class="card" style="margin-top:16px">' +
      '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px">⏰ Expiring Soon - Act Fast!</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">' +
        (data.personalizedOffers || []).filter(o => (o.daysToExpire || 999) <= 7).slice(0, 4).map(offer => 
          '<div onclick="openOfferModal(\'' + offer.id + '\')" style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--amber-g);border-radius:10px;cursor:pointer;border:1px solid rgba(255,153,31,0.3)">' +
            '<span style="font-size:24px">' + offer.icon + '</span>' +
            '<div style="flex:1">' +
              '<div style="font-size:13px;font-weight:600">' + offer.merchant + '</div>' +
              '<div style="font-size:11px;color:var(--amber)">' + (offer.daysToExpire || '?') + ' days left</div>' +
            '</div>' +
            '<div style="font-size:16px;font-weight:700;color:var(--green)">' + 
              (offer.type === 'percent' ? offer.discount + '%' : '$' + offer.discount) +
            '</div>' +
          '</div>'
        ).join('') +
      '</div>' +
    '</div>' +
  '</div>';
}

// ========== SPEND INSIGHTS VIEW ==========
function renderSpendInsights(data) {
  const analysis = data.spendAnalysis || {};
  const merchants = analysis.topMerchants || [];
  const categories = analysis.topCategories || [];
  
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
    // Spending Overview
    '<div class="card">' +
      '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px">💳 Spending Overview</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px">' +
        '<div style="padding:14px;background:var(--bg1);border-radius:10px;text-align:center">' +
          '<div style="font-size:24px;font-weight:700;color:var(--blue)">' + fmt(analysis.totalSpending || 0) + '</div>' +
          '<div style="font-size:11px;color:var(--t3)">Total Spent</div>' +
        '</div>' +
        '<div style="padding:14px;background:var(--bg1);border-radius:10px;text-align:center">' +
          '<div style="font-size:24px;font-weight:700;color:var(--purple)">' + fmt(analysis.avgTransaction || 0) + '</div>' +
          '<div style="font-size:11px;color:var(--t3)">Avg Transaction</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:14px;background:linear-gradient(135deg,var(--blue-g),var(--purple-g));border-radius:10px">' +
        '<div style="font-size:12px;color:var(--t2);margin-bottom:4px">Your Spending Style</div>' +
        '<div style="font-size:16px;font-weight:600;color:var(--blue)">' + 
          (analysis.spenderType === 'high_spender' ? '🛒 High Volume Shopper' :
           analysis.spenderType === 'occasional_shopper' ? '🎯 Strategic Shopper' :
           '💰 Budget-Conscious Saver') +
        '</div>' +
        '<div style="font-size:11px;color:var(--t3);margin-top:4px">Peak day: ' + (analysis.peakSpendingDay || 'N/A') + '</div>' +
      '</div>' +
    '</div>' +
    
    // Top Merchants
    '<div class="card">' +
      '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px">🏪 Where You Shop Most</h3>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
        merchants.slice(0, 6).map((m, i) => {
          const widthPercent = merchants.length > 0 ? (m.total / merchants[0].total) * 100 : 0;
          return '<div style="position:relative">' +
            '<div style="position:absolute;top:0;left:0;bottom:0;width:' + widthPercent + '%;background:linear-gradient(90deg,var(--blue-g),transparent);border-radius:8px;z-index:0"></div>' +
            '<div style="position:relative;z-index:1;display:flex;align-items:center;gap:10px;padding:10px">' +
              '<span style="font-size:10px;color:var(--t3);width:16px">#' + (i + 1) + '</span>' +
              '<span style="font-size:18px">' + (m.icon || '🏪') + '</span>' +
              '<div style="flex:1">' +
                '<div style="font-size:13px;font-weight:500">' + m.name + '</div>' +
                '<div style="font-size:10px;color:var(--t3)">' + m.count + ' visits • Avg ' + fmt(m.avgTransaction) + '</div>' +
              '</div>' +
              '<div style="font-size:14px;font-weight:600">' + fmt(m.total) + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>' +
    
    // Category Breakdown
    '<div class="card" style="grid-column:span 2">' +
      '<h3 style="font-size:14px;font-weight:600;margin-bottom:14px">📊 Category Breakdown</h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        categories.map(cat => {
          const colors = {
            'Food & Dining': '#FF6B6B',
            'Shopping': '#4ECDC4',
            'Transport': '#45B7D1',
            'Entertainment': '#96CEB4',
            'Housing': '#FFEAA7',
            'Healthcare': '#DDA0DD',
            'Utilities': '#98D8C8',
            'Subscriptions': '#F7DC6F'
          };
          const color = colors[cat.name] || '#95A5A6';
          const total = categories.reduce((sum, c) => sum + c.total, 0);
          const percent = total > 0 ? ((cat.total / total) * 100).toFixed(0) : 0;
          
          return '<div style="flex:1;min-width:120px;padding:14px;background:linear-gradient(135deg,' + color + '22,' + color + '11);border-radius:10px;border-left:4px solid ' + color + '">' +
            '<div style="font-size:18px;font-weight:700">' + fmt(cat.total) + '</div>' +
            '<div style="font-size:12px;color:var(--t2)">' + cat.name + '</div>' +
            '<div style="font-size:10px;color:var(--t3)">' + percent + '% of spending</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>' +
  '</div>';
}

// ========== OFFER MODAL ==========
function renderOfferModal(offer) {
  const budgetInfo = state.shoppingData?.budgetStatus?.budgetAnalysis?.find(b => b.category === offer.category);
  
  return '<div onclick="closeOfferModal(event)" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn 0.2s">' +
    '<div onclick="event.stopPropagation()" style="width:100%;max-width:480px;background:var(--bg0);border-radius:20px;overflow:hidden;animation:slideUp 0.3s">' +
      // Header
      '<div style="padding:24px;background:linear-gradient(135deg,#1A1F71,#2E348F);color:#fff;text-align:center">' +
        '<div style="font-size:52px;margin-bottom:12px">' + offer.icon + '</div>' +
        '<div style="font-size:22px;font-weight:700">' + offer.merchant + '</div>' +
        '<div style="font-size:14px;opacity:0.8">' + offer.category + '</div>' +
      '</div>' +
      
      // Offer Details
      '<div style="padding:24px">' +
        '<div style="text-align:center;margin-bottom:20px">' +
          '<div style="font-size:48px;font-weight:700;color:var(--green)">' +
            (offer.type === 'percent' ? offer.discount + '%' :
             offer.type === 'flat' ? '$' + offer.discount :
             offer.type === 'cents_gallon' ? offer.discount + '¢/gal' :
             offer.discount + 'x') +
          '</div>' +
          '<div style="font-size:14px;color:var(--t2)">' + offer.description + '</div>' +
        '</div>' +
        
        // Terms
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px">' +
          '<div style="padding:12px;background:var(--bg1);border-radius:10px;text-align:center">' +
            '<div style="font-size:11px;color:var(--t3)">Min Spend</div>' +
            '<div style="font-size:16px;font-weight:600">' + (offer.minSpend > 0 ? '$' + offer.minSpend : 'None') + '</div>' +
          '</div>' +
          '<div style="padding:12px;background:var(--bg1);border-radius:10px;text-align:center">' +
            '<div style="font-size:11px;color:var(--t3)">Max Cashback</div>' +
            '<div style="font-size:16px;font-weight:600">$' + offer.maxCashback + '</div>' +
          '</div>' +
          '<div style="padding:12px;background:var(--bg1);border-radius:10px;text-align:center">' +
            '<div style="font-size:11px;color:var(--t3)">Card Required</div>' +
            '<div style="font-size:16px;font-weight:600">' + offer.cardRequired + '</div>' +
          '</div>' +
          '<div style="padding:12px;background:' + ((offer.daysToExpire || 999) <= 7 ? 'var(--amber-g)' : 'var(--bg1)') + ';border-radius:10px;text-align:center">' +
            '<div style="font-size:11px;color:var(--t3)">Expires</div>' +
            '<div style="font-size:16px;font-weight:600;color:' + ((offer.daysToExpire || 999) <= 7 ? 'var(--amber)' : 'var(--t1)') + '">' + 
              new Date(offer.expires).toLocaleDateString() + 
            '</div>' +
          '</div>' +
        '</div>' +
        
        // Budget Warning/Info
        (budgetInfo ?
          '<div style="padding:14px;background:' + (budgetInfo.canSpend ? 'var(--green-g)' : 'var(--amber-g)') + ';border-radius:10px;margin-bottom:20px">' +
            '<div style="display:flex;align-items:center;gap:10px">' +
              '<span style="font-size:20px">' + (budgetInfo.canSpend ? '✅' : '⚠️') + '</span>' +
              '<div>' +
                '<div style="font-size:13px;font-weight:600;color:' + (budgetInfo.canSpend ? 'var(--green)' : 'var(--amber)') + '">' +
                  (budgetInfo.canSpend ? 'Budget Available' : 'Budget Tight') +
                '</div>' +
                '<div style="font-size:12px;color:var(--t2)">' +
                  offer.category + ': ' + fmt(budgetInfo.remaining) + ' remaining (' + budgetInfo.percentage.toFixed(0) + '% used)' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' : '') +
        
        // Actions
        '<div style="display:flex;gap:12px">' +
          '<button onclick="activateOffer(\'' + offer.id + '\')" style="flex:1;padding:14px;background:linear-gradient(135deg,#00875A,#00A86B);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer">Activate Offer</button>' +
          '<button onclick="closeOfferModal()" style="padding:14px 20px;background:var(--bg2);border:none;border-radius:12px;color:var(--t2);font-size:14px;cursor:pointer">Close</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// ========== HELPER FUNCTIONS ==========
function openOfferModal(offerId) {
  const offer = CAPITAL_ONE_OFFERS.find(o => o.id === offerId);
  if (offer) {
    state.selectedOffer = offer;
    state.showOfferModal = true;
    render();
  }
}
window.openOfferModal = openOfferModal;

function closeOfferModal(event) {
  if (event && event.target !== event.currentTarget) return;
  state.showOfferModal = false;
  state.selectedOffer = null;
  render();
}
window.closeOfferModal = closeOfferModal;

function activateOffer(offerId) {
  showToast('🎉 Offer activated! Use at ' + state.selectedOffer.merchant, 'success');
  closeOfferModal();
}
window.activateOffer = activateOffer;

// Export for use in app.js
window.renderShoppingPlanner = renderShoppingPlanner;
window.loadShoppingData = loadShoppingData;