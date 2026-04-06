/**
 * Handy Go — Matching Service (Appwrite Function)
 *
 * Replaces: backend/services/matching-service/
 *
 * This function handles:
 *  1. Problem analysis (enhanced NLP: fuzzy matching, stemming, synonyms,
 *     Roman Urdu + English + Urdu vocabulary)
 *  2. Worker matching (proximity + rating + trust)
 *  3. Price estimation
 *  4. Duration estimation
 *
 * Deploy: appwrite functions createDeployment \
 *   --functionId=matching_service \
 *   --entrypoint=src/main.js \
 *   --code=./
 *
 * Runtime: Node.js 20
 * Timeout: 30 seconds
 */

import { Client, Databases, Query } from 'node-appwrite';

// ============================================================
// NLP HELPERS — fuzzy matching, stemming, tokenization
// ============================================================

/** Levenshtein distance between two strings */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Basic English stemmer — strips common suffixes */
function stemWord(word) {
  if (word.length < 4) return word;
  return word
    .replace(/ying$/, 'y')
    .replace(/ies$/, 'y')
    .replace(/ied$/, 'y')
    .replace(/ing$/, '')
    .replace(/tion$/, 't')
    .replace(/sion$/, 's')
    .replace(/ness$/, '')
    .replace(/ment$/, '')
    .replace(/able$/, '')
    .replace(/ible$/, '')
    .replace(/ful$/, '')
    .replace(/less$/, '')
    .replace(/ous$/, '')
    .replace(/ive$/, '')
    .replace(/ed$/, '')
    .replace(/er$/, '')
    .replace(/ly$/, '')
    .replace(/es$/, '')
    .replace(/s$/, '');
}

/** Tokenize text into words, removing punctuation */
function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
}

/** Generate bigrams from a token array */
function bigrams(tokens) {
  const result = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    result.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return result;
}

/** Generate trigrams from a token array */
function trigrams(tokens) {
  const result = [];
  for (let i = 0; i < tokens.length - 2; i++) {
    result.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }
  return result;
}

// ============================================================
// SERVICE KEYWORDS — Comprehensive English + Roman Urdu + Urdu
// ============================================================
const SERVICE_KEYWORDS = {
  PLUMBING: {
    keywords: [
      // English
      'leak', 'pipe', 'tap', 'drain', 'toilet', 'water', 'bathroom', 'faucet',
      'shower', 'geyser', 'heater', 'sewage', 'plumber', 'plumbing', 'valve',
      'cistern', 'flush', 'basin', 'sink', 'commode', 'bidet', 'hose', 'washer',
      'gasket', 'sealant', 'clog', 'overflow', 'sump', 'pump', 'boiler',
      'septic', 'pipeline', 'fitting', 'copper', 'pvc', 'cpvc', 'drip',
      // Roman Urdu / Urdu
      'nalkay', 'nalka', 'pani', 'tuti', 'nali', 'tatti', 'flush', 'tanki',
      'garam pani', 'thanda pani', 'naali', 'pipeline', 'motor', 'boring',
      'paani', 'paiip', 'tanka', 'washroom', 'ghusal khana',
    ],
    patterns: [
      'water not coming', 'drain blocked', 'tap leaking', 'toilet not flushing',
      'pipe burst', 'slow drain', 'water leak', 'kitchen sink', 'water heater',
      'geyser repair', 'hot water', 'low pressure', 'no water', 'dripping water',
      'running toilet', 'clogged drain', 'blocked pipe', 'overflowing',
      'water damage', 'sewer smell', 'leaky faucet', 'broken pipe',
      // Roman Urdu
      'pani nahi aa raha', 'nalkay kharab', 'tuti se pani', 'naali band',
      'flush kharab', 'tanki leak', 'geyser kharab', 'pani tapak raha',
      'bathroom leak', 'pani ka pressure', 'motor nahi chal rahi',
      'boring kharab', 'pani garam nahi ho raha',
    ],
    synonyms: { 'faucet': 'tap', 'spigot': 'tap', 'commode': 'toilet', 'loo': 'toilet', 'lavatory': 'bathroom', 'restroom': 'bathroom', 'washroom': 'bathroom' },
  },
  ELECTRICAL: {
    keywords: [
      // English
      'switch', 'wire', 'socket', 'light', 'fan', 'circuit', 'power', 'bulb',
      'mcb', 'breaker', 'voltage', 'wiring', 'electrical', 'electrician', 'fuse',
      'outlet', 'plug', 'extension', 'led', 'tube', 'inverter', 'ups',
      'generator', 'transformer', 'meter', 'phase', 'neutral', 'ground',
      'earthing', 'conduit', 'panel', 'board', 'dimmer', 'regulator',
      'chandelier', 'spotlight', 'downlight', 'ceiling',
      // Roman Urdu / Urdu
      'bijli', 'batti', 'pankha', 'taar', 'switch', 'lait', 'current',
      'bijli ka meter', 'watt', 'load shedding', 'generator', 'ups',
      'inverter', 'fuse', 'mcb', 'board', 'wire', 'bijli ka kaam',
    ],
    patterns: [
      'light not working', 'no electricity', 'switch broken', 'fan not working',
      'short circuit', 'power outage', 'flickering light', 'tripping breaker',
      'sparking socket', 'no power', 'electrical fault', 'fuse blown',
      'socket not working', 'wiring issue', 'voltage problem', 'ups not working',
      'generator repair', 'earthing problem', 'meter issue', 'electric shock',
      'fan making noise', 'dimmer not working', 'led not working',
      // Roman Urdu
      'bijli nahi aa rahi', 'batti nahi jal rahi', 'pankha nahi chal raha',
      'switch kharab', 'current nahi aa raha', 'taar kharab', 'fuse ur gaya',
      'mcb trip ho raha', 'bijli ka kaam karna', 'wiring kharabi',
      'board mein masla', 'spark aa rahi', 'short ho raha',
    ],
    synonyms: { 'outlet': 'socket', 'receptacle': 'socket', 'lamp': 'light', 'tube light': 'light', 'tubelight': 'light', 'electricity': 'power', 'current': 'power' },
  },
  CLEANING: {
    keywords: [
      // English
      'clean', 'wash', 'mop', 'dust', 'carpet', 'sofa', 'sanitize', 'scrub',
      'vacuum', 'polish', 'sweep', 'wipe', 'disinfect', 'detergent', 'bleach',
      'stain', 'spot', 'grime', 'mold', 'mildew', 'tile', 'grout', 'window',
      'curtain', 'upholstery', 'mattress', 'rug', 'floor', 'kitchen',
      'oven', 'refrigerator', 'fridge', 'laundry', 'ironing', 'housekeeping',
      // Roman Urdu / Urdu
      'safai', 'dhona', 'jharu', 'pochha', 'kapray', 'carpet', 'sofa',
      'ghar ki safai', 'bartan', 'kitchen', 'bathroom', 'dhulai', 'istri',
      'kachra', 'gandagi', 'mitti', 'daag', 'dhobi', 'ghusal khana',
    ],
    patterns: [
      'house cleaning', 'deep cleaning', 'carpet wash', 'sofa cleaning',
      'bathroom clean', 'kitchen clean', 'office cleaning', 'window cleaning',
      'floor polish', 'tile cleaning', 'mold removal', 'stain removal',
      'spring cleaning', 'move out cleaning', 'after party cleaning',
      'post construction', 'mattress cleaning', 'curtain wash', 'rug cleaning',
      'disinfection service', 'fumigation', 'pest control',
      // Roman Urdu
      'ghar ki safai', 'kitchen saaf', 'bathroom saaf', 'carpet dhona',
      'sofa dhona', 'floor saaf', 'bartan dhona', 'kapray dhona',
      'istri karna', 'poccha lagana', 'jharu lagana', 'deewar saaf',
      'safai chahiye', 'cleaning service', 'ghar saaf karna',
    ],
    synonyms: { 'tidy': 'clean', 'cleanse': 'clean', 'janitorial': 'cleaning', 'housemaid': 'housekeeping', 'maid': 'housekeeping' },
  },
  AC_REPAIR: {
    keywords: [
      // English
      'ac', 'air conditioner', 'cooling', 'compressor', 'thermostat', 'filter',
      'split', 'window ac', 'inverter ac', 'hvac', 'refrigerant', 'freon',
      'condenser', 'evaporator', 'duct', 'vent', 'blower', 'capacitor',
      'remote', 'temperature', 'coil', 'drainage', 'pcb', 'sensor',
      'coolant', 'tonnage', 'btu',
      // Roman Urdu / Urdu
      'ac', 'thanda', 'garam', 'gas', 'compressor', 'filter', 'remote',
      'ac ki gas', 'ac ki safai', 'ac service', 'ac install', 'ac shift',
      'split ac', 'window ac', 'inverter ac', 'cooling nahi', 'ek ton', 'do ton',
    ],
    patterns: [
      'ac not cooling', 'ac leaking', 'ac gas refill', 'ac service',
      'ac not working', 'ac installation', 'ac repair', 'ac maintenance',
      'ac making noise', 'ac remote not working', 'ac smell', 'ac water dripping',
      'ac frozen', 'ac not turning on', 'low cooling', 'split ac install',
      'window ac repair', 'ac shifting', 'ac gas charge', 'ac compressor',
      // Roman Urdu
      'ac ki gas', 'ac band', 'ac kharab', 'ac nahi chal raha',
      'ac se pani aa raha', 'ac thanda nahi kar raha', 'ac ki service',
      'ac lagwana', 'ac shift karna', 'ac mein awaz', 'ac ki safai karna',
      'ac ka compressor kharab', 'ac ka remote kharab',
    ],
    synonyms: { 'air conditioning': 'ac', 'aircon': 'ac', 'a/c': 'ac', 'a.c': 'ac', 'a.c.': 'ac' },
  },
  CARPENTER: {
    keywords: [
      // English
      'wood', 'furniture', 'door', 'cabinet', 'shelf', 'table', 'chair',
      'wardrobe', 'carpenter', 'cupboard', 'drawer', 'hinge', 'lock', 'handle',
      'plywood', 'laminate', 'veneer', 'polish', 'frame', 'bed', 'desk',
      'bookshelf', 'partition', 'panel', 'molding', 'baseboard', 'deck',
      'pergola', 'railing', 'staircase', 'threshold',
      // Roman Urdu / Urdu
      'lakri', 'darwaza', 'almari', 'kursi', 'mez', 'palang', 'khidki',
      'tarkhan', 'mistri', 'furniture', 'polish', 'cabinet', 'shelf',
      'wardrobe', 'drawer', 'hinge', 'lock', 'handle', 'lakri ka kaam',
    ],
    patterns: [
      'door repair', 'furniture repair', 'cabinet fix', 'shelf installation',
      'new furniture', 'wardrobe repair', 'table broken', 'chair repair',
      'door hinge', 'lock replacement', 'drawer stuck', 'wood work',
      'custom furniture', 'kitchen cabinet', 'bed repair', 'desk assembly',
      'bookshelf install', 'door installation', 'cupboard repair', 'polish work',
      // Roman Urdu
      'darwaza theek', 'almari banana', 'furniture theek', 'lakri ka kaam',
      'door ka lock', 'hinge badalna', 'cabinet banana', 'shelf lagana',
      'mez theek karna', 'kursi toot gayi', 'palang ki marammat',
      'polish karna', 'furniture banana', 'darwaza lagana', 'khidki theek',
    ],
    synonyms: { 'woodwork': 'carpenter', 'joinery': 'carpenter', 'closet': 'wardrobe', 'cupboard': 'cabinet', 'almirah': 'wardrobe' },
  },
  PAINTING: {
    keywords: [
      // English
      'paint', 'wall', 'color', 'whitewash', 'primer', 'distemper', 'emulsion',
      'texture', 'stencil', 'roller', 'brush', 'spray', 'coat', 'finish',
      'matte', 'glossy', 'satin', 'enamel', 'putty', 'sanding', 'scraping',
      'waterproof', 'damp', 'seepage', 'crack', 'peeling', 'flaking',
      'ceiling', 'exterior', 'interior', 'facade',
      // Roman Urdu / Urdu
      'rang', 'deewar', 'safedi', 'paint', 'primer', 'putty', 'distemper',
      'color', 'rangai', 'painter', 'rang karna', 'safedi karna',
      'deewar ka rang', 'chhat', 'kamra', 'ghar ka rang',
    ],
    patterns: [
      'wall painting', 'house paint', 'room paint', 'exterior painting',
      'interior painting', 'ceiling paint', 'texture painting', 'wall crack',
      'damp wall', 'peeling paint', 'color change', 'fresh coat',
      'whitewash needed', 'paint job', 'office painting', 'spray painting',
      'waterproof coating', 'seepage treatment', 'putty work',
      // Roman Urdu
      'deewar ka rang', 'ghar paint', 'kamra paint', 'safedi karwani hai',
      'rang lagana', 'deewar mein crack', 'seelan', 'deewar gili',
      'paint karna', 'rang badalna', 'naya rang', 'ghar ki rangai',
      'chhat paint', 'bahar ka rang', 'andar ka rang',
    ],
    synonyms: { 'repaint': 'paint', 'coating': 'paint', 'varnish': 'paint', 'lacquer': 'paint', 'stain': 'paint' },
  },
  MECHANIC: {
    keywords: [
      // English
      'car', 'bike', 'engine', 'tire', 'oil', 'brake', 'battery', 'mechanic',
      'motorcycle', 'vehicle', 'clutch', 'gear', 'transmission', 'radiator',
      'coolant', 'alternator', 'starter', 'ignition', 'exhaust', 'muffler',
      'suspension', 'steering', 'alignment', 'balancing', 'dent', 'scratch',
      'bumper', 'headlight', 'taillight', 'wiper', 'horn', 'ac',
      // Roman Urdu / Urdu
      'gaari', 'gadi', 'motorcycle', 'bike', 'engine', 'tyre', 'brake',
      'battery', 'mechanic', 'mistri', 'oil change', 'gaari ka engine',
      'clutch', 'gear', 'silencer', 'bonnet', 'dikki', 'steering',
    ],
    patterns: [
      'car repair', 'bike repair', 'engine problem', 'tire puncture',
      'oil change', 'brake issue', 'battery dead', 'car service',
      'bike service', 'engine noise', 'car not starting', 'flat tire',
      'clutch problem', 'gear shifting', 'car wash', 'dent removal',
      'scratch repair', 'ac not cooling car', 'radiator leak',
      'headlight broken', 'wiper not working',
      // Roman Urdu
      'gaari kharab', 'bike kharab', 'engine problem', 'puncture',
      'oil change karna', 'brake nahi lag raha', 'battery khatam',
      'gaari start nahi ho rahi', 'clutch problem', 'gear nahi lag raha',
      'gaari ki service', 'bike ki service', 'silencer kharab',
      'dent nikalna', 'gaari dhona', 'scratch hatana',
    ],
    synonyms: { 'automobile': 'car', 'auto': 'car', 'scooter': 'bike', 'scooty': 'bike', 'motorbike': 'bike', 'tyre': 'tire', 'bonnet': 'hood' },
  },
  GENERAL_HANDYMAN: {
    keywords: [
      // English
      'fix', 'repair', 'install', 'mount', 'hang', 'assemble', 'handyman',
      'general', 'maintenance', 'replace', 'adjust', 'tighten', 'loosen',
      'setup', 'move', 'lift', 'carry', 'drill', 'screw', 'nail', 'bolt',
      'hook', 'bracket', 'anchor', 'drywall', 'patch', 'seal', 'caulk',
      // Roman Urdu / Urdu
      'marammat', 'theek karna', 'lagana', 'jorna', 'banana', 'hatana',
      'badalna', 'adjust', 'general kaam', 'chota kaam', 'mistri',
      'kaam', 'help', 'madad', 'fixer',
    ],
    patterns: [
      'general repair', 'tv mount', 'curtain rod', 'picture hanging',
      'shelf mount', 'furniture assembly', 'ikea assembly', 'wall mount',
      'door bell', 'lock change', 'key stuck', 'handle broken',
      'need handyman', 'small repairs', 'odd jobs', 'home maintenance',
      'fix something', 'help needed', 'minor repairs',
      // Roman Urdu
      'theek karwana', 'lagwana hai', 'kuch banana hai', 'kaam karwana',
      'marammat karwani hai', 'kuch toot gaya', 'kuch kharab hai',
      'madad chahiye', 'mistri bulana', 'chota kaam hai',
    ],
    synonyms: { 'maintenance': 'repair', 'broken': 'fix', 'damaged': 'fix', 'faulty': 'fix' },
  },
};

// Price baselines (PKR)
const PRICE_BASELINES = {
  PLUMBING: { basic: { labor: 500, duration: 30 }, medium: { labor: 1500, duration: 60 }, complex: { labor: 3000, duration: 120 } },
  ELECTRICAL: { basic: { labor: 400, duration: 30 }, medium: { labor: 1200, duration: 60 }, complex: { labor: 2500, duration: 120 } },
  CLEANING: { basic: { labor: 1000, duration: 60 }, medium: { labor: 2000, duration: 120 }, complex: { labor: 4000, duration: 240 } },
  AC_REPAIR: { basic: { labor: 800, duration: 30 }, medium: { labor: 2000, duration: 60 }, complex: { labor: 4000, duration: 120 } },
  CARPENTER: { basic: { labor: 600, duration: 45 }, medium: { labor: 1500, duration: 90 }, complex: { labor: 3500, duration: 180 } },
  PAINTING: { basic: { labor: 1500, duration: 120 }, medium: { labor: 3000, duration: 240 }, complex: { labor: 6000, duration: 480 } },
  MECHANIC: { basic: { labor: 500, duration: 30 }, medium: { labor: 1500, duration: 60 }, complex: { labor: 3000, duration: 120 } },
  GENERAL_HANDYMAN: { basic: { labor: 500, duration: 30 }, medium: { labor: 1000, duration: 60 }, complex: { labor: 2000, duration: 120 } },
};

const DB_ID = 'handy_go_db';

export default async ({ req, res, log, error }) => {
  try {
    const body = JSON.parse(req.body || '{}');
    const action = body.action;

    // Initialize Appwrite client with function's permissions
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      // Use server API key from env vars (prioritize over dynamic header JWT)
      .setKey(process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key'] || '');

    const databases = new Databases(client);

    log(`Matching service action: ${action}`);

    switch (action) {
      case 'analyze_problem':
        return res.json(analyzeProblem(body));

      case 'find_workers':
        return res.json(await findWorkers(databases, body));

      case 'estimate_price':
        return res.json(estimatePrice(body));

      case 'estimate_duration':
        return res.json(estimateDuration(body));

      default:
        return res.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    error(`Matching service error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};

// ============================================================
// 1. PROBLEM ANALYSIS (Enhanced NLP)
// ============================================================
function analyzeProblem({ problemDescription, serviceCategory }) {
  const rawDesc = (problemDescription || '').toLowerCase().trim();
  if (!rawDesc) {
    return {
      success: true,
      data: {
        detectedServices: [serviceCategory || 'GENERAL_HANDYMAN'],
        confidence: serviceCategory ? 0.5 : 0.1,
        suggestedQuestions: generateQuestions(serviceCategory || 'GENERAL_HANDYMAN'),
        urgencyLevel: 'MEDIUM',
      },
    };
  }

  const descTokens = tokenize(rawDesc);
  const stemmedTokens = descTokens.map(stemWord);
  const descBigrams = bigrams(descTokens);
  const descTrigrams = trigrams(descTokens);

  const scores = {};

  for (const [category, { keywords, patterns, synonyms }] of Object.entries(SERVICE_KEYWORDS)) {
    let score = 0;

    // --- 1a. Exact keyword matching (10 pts) ---
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (kw.includes(' ')) {
        // Multi-word keyword: check substring
        if (rawDesc.includes(kw)) score += 10;
      } else {
        // Single word: check token match
        if (descTokens.includes(kw)) score += 10;
      }
    }

    // --- 1b. Stemmed keyword matching (7 pts) ---
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (kw.includes(' ')) continue; // skip multi-word for stemming
      const stemmedKw = stemWord(kw);
      if (stemmedKw.length >= 3 && stemmedTokens.includes(stemmedKw) && !descTokens.includes(kw)) {
        score += 7; // Only add if exact match didn't already match
      }
    }

    // --- 1c. Fuzzy keyword matching (5 pts, Levenshtein ≤ 2) ---
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (kw.includes(' ') || kw.length < 4) continue; // skip short & multi-word
      for (const token of descTokens) {
        if (token === kw) continue; // already matched exact
        if (token.length < 3) continue;
        const dist = levenshtein(token, kw);
        const maxDist = kw.length <= 5 ? 1 : 2;
        if (dist > 0 && dist <= maxDist) {
          score += 5;
          break; // one fuzzy match per keyword is enough
        }
      }
    }

    // --- 1d. Synonym matching (8 pts) ---
    if (synonyms) {
      for (const [syn, _canonical] of Object.entries(synonyms)) {
        const synLower = syn.toLowerCase();
        if (synLower.includes(' ')) {
          if (rawDesc.includes(synLower)) score += 8;
        } else {
          if (descTokens.includes(synLower)) score += 8;
        }
      }
    }

    // --- 1e. Pattern matching — exact substring (25 pts) ---
    for (const pattern of patterns) {
      if (rawDesc.includes(pattern.toLowerCase())) {
        score += 25;
      }
    }

    // --- 1f. Bigram/trigram pattern matching (15 pts) ---
    for (const pattern of patterns) {
      const patTokens = tokenize(pattern);
      if (patTokens.length === 2) {
        if (descBigrams.some(bg => bg === patTokens.join(' '))) {
          // Already counted above as substring, but check near-matches
          // e.g., "tap leak" matching "tap leaking" via stemmed bigrams
          const stemmedPat = patTokens.map(stemWord).join(' ');
          const stemmedBigrams = bigrams(stemmedTokens);
          if (stemmedBigrams.some(bg => bg === stemmedPat) && !rawDesc.includes(pattern.toLowerCase())) {
            score += 15;
          }
        }
      }
      if (patTokens.length === 3) {
        const stemmedPat = patTokens.map(stemWord).join(' ');
        const stemmedTrigrams = trigrams(stemmedTokens);
        if (stemmedTrigrams.some(tg => tg === stemmedPat) && !rawDesc.includes(pattern.toLowerCase())) {
          score += 15;
        }
      }
    }

    scores[category] = score;
  }

  // If a category was provided, boost it
  if (serviceCategory && scores[serviceCategory] !== undefined) {
    scores[serviceCategory] += 50;
  }

  // Sort by score
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  const topScore = sorted[0]?.[1] || 0;
  // More granular confidence: 0-30 = low, 30-60 = medium, 60+ = high
  const confidence = Math.min(topScore / 80, 1.0);

  const detectedServices = sorted
    .slice(0, 3)
    .map(([category]) => category);

  // Determine urgency — expanded keywords (English + Roman Urdu)
  const urgentKeywords = [
    'emergency', 'urgent', 'immediately', 'flood', 'fire', 'shock', 'burst',
    'asap', 'right now', 'dangerous', 'hazard', 'sparking', 'electrocuted',
    'overflowing', 'gas leak', 'smoke', 'burning',
    // Roman Urdu
    'fori', 'jaldi', 'abhi', 'emergency', 'khatarnak', 'aag', 'dhuen',
    'bijli lagi', 'pani bhar gaya', 'gas leak',
  ];
  const isUrgent = urgentKeywords.some(k => rawDesc.includes(k));
  const urgencyLevel = isUrgent ? 'HIGH' : (topScore > 40 ? 'MEDIUM' : 'LOW');

  return {
    success: true,
    data: {
      detectedServices: detectedServices.length > 0 ? detectedServices : [serviceCategory || 'GENERAL_HANDYMAN'],
      confidence,
      suggestedQuestions: generateQuestions(detectedServices[0] || serviceCategory),
      urgencyLevel,
    },
  };
}

function generateQuestions(category) {
  const questions = {
    PLUMBING: ['Where exactly is the leak?', 'How long has the issue been present?', 'Is water still running?'],
    ELECTRICAL: ['Which room has the issue?', 'Are other switches working?', 'Any burning smell?'],
    CLEANING: ['How many rooms need cleaning?', 'Any specific areas?', 'Deep clean or regular?'],
    AC_REPAIR: ['What brand/model is the AC?', 'Is it cooling at all?', 'When was last service?'],
    CARPENTER: ['What type of furniture?', 'Is it a repair or new installation?', 'Do you have the materials?'],
    PAINTING: ['How many rooms?', 'Interior or exterior?', 'Any specific color preference?'],
    MECHANIC: ['What type of vehicle?', 'What is the issue?', 'Can the vehicle start?'],
    GENERAL_HANDYMAN: ['What needs to be fixed?', 'Do you have the materials?', 'Is it urgent?'],
  };
  return questions[category] || questions.GENERAL_HANDYMAN;
}

// ============================================================
// 2. WORKER MATCHING
// ============================================================
async function findWorkers(databases, { serviceCategory, location, scheduledDateTime, isUrgent }) {
  const { lat, lng } = location || {};

  // Get all active, available workers with matching skills
  const skillDocs = await databases.listDocuments(DB_ID, 'worker_skills', [
    Query.equal('category', serviceCategory),
    Query.limit(100),
  ]);

  const workerIds = [...new Set(skillDocs.documents.map(d => d.workerId))];

  if (workerIds.length === 0) {
    return { success: true, data: { workers: [], totalAvailable: 0 } };
  }

  // Get worker profiles in a single batched query
  const workers = [];
  const batchIds = workerIds.slice(0, 20);
  let workerDocsAll = [];
  try {
    const batchResult = await databases.listDocuments(DB_ID, 'workers', [
      Query.equal('$id', batchIds),
      Query.equal('status', 'ACTIVE'),
      Query.equal('isAvailable', true),
      Query.limit(20),
    ]);
    workerDocsAll = batchResult.documents;
  } catch (err) {
    // Fallback: if batch $id query not supported, try individually
    for (const wid of batchIds) {
      try {
        const doc = await databases.getDocument(DB_ID, 'workers', wid);
        if (doc.status === 'ACTIVE' && doc.isAvailable) workerDocsAll.push(doc);
      } catch { /* skip unavailable workers */ }
    }
  }

  for (const w of workerDocsAll) {
    try {
      const workerId = w.$id;
      {
        const _unused = 0; // keep indentation compatible
        const skill = skillDocs.documents.find(s => s.workerId === workerId);

        // Calculate distance (Haversine formula)
        const distance = lat && lng && w.currentLatitude && w.currentLongitude
          ? haversineDistance(lat, lng, w.currentLatitude, w.currentLongitude)
          : 999;

        // Only include workers within service radius
        if (distance <= (w.serviceRadius || 10)) {
          // Calculate match score
          const matchScore = calculateMatchScore({
            distance,
            rating: w.ratingAverage || 0,
            trustScore: w.trustScore || 50,
            experience: skill?.experience || 0,
            totalJobs: w.totalJobsCompleted || 0,
          });

          workers.push({
            workerId: w.$id,
            name: `${w.firstName} ${w.lastName}`,
            profileImage: w.profileImage,
            rating: { average: w.ratingAverage || 0, count: w.ratingCount || 0 },
            trustScore: w.trustScore || 50,
            distance: Math.round(distance * 10) / 10,
            estimatedArrival: Math.ceil(distance * 4), // ~4 min per km
            matchScore,
            hourlyRate: skill?.hourlyRate || 0,
          });
        }
      }
    } catch { /* skip worker */ }
  }

  // Sort by match score descending
  workers.sort((a, b) => b.matchScore - a.matchScore);

  return {
    success: true,
    data: {
      workers: workers.slice(0, 10),
      totalAvailable: workers.length,
    },
  };
}

function calculateMatchScore({ distance, rating, trustScore, experience, totalJobs }) {
  // Weights: Distance 25%, Rating 25%, Trust 20%, Experience 15%, Workload 15%
  const distanceScore = Math.max(0, 100 - distance * 10); // Closer = higher
  const ratingScore = (rating / 5) * 100;
  const trustScoreNorm = trustScore;
  const experienceScore = Math.min(experience * 10, 100);
  const jobsScore = Math.min(totalJobs, 100);

  return Math.round(
    distanceScore * 0.25 +
    ratingScore * 0.25 +
    trustScoreNorm * 0.20 +
    experienceScore * 0.15 +
    jobsScore * 0.15
  );
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// 3. PRICE ESTIMATION
// ============================================================
function estimatePrice({ serviceCategory, problemDescription }) {
  const category = serviceCategory || 'GENERAL_HANDYMAN';
  const baselines = PRICE_BASELINES[category] || PRICE_BASELINES.GENERAL_HANDYMAN;

  // Enhanced complexity detection (English + Roman Urdu)
  const desc = (problemDescription || '').toLowerCase();
  const complexKeywords = [
    'major', 'complete', 'full', 'replace', 'install new', 'renovation', 'multiple',
    'entire', 'whole', 'overhaul', 'rewiring', 'replumbing', 'demolish',
    'poora', 'pura', 'naya lagana', 'sab badalna', 'mukammal',
  ];
  const simpleKeywords = [
    'minor', 'small', 'quick', 'just', 'only', 'single', 'simple',
    'tiny', 'little', 'basic', 'easy',
    'chota', 'sirf', 'ek', 'mamuli', 'asan',
  ];

  let complexity = 'medium';
  if (complexKeywords.some(k => desc.includes(k))) complexity = 'complex';
  if (simpleKeywords.some(k => desc.includes(k))) complexity = 'basic';

  const baseline = baselines[complexity];
  const platformFee = Math.round(baseline.labor * 0.10); // 10% platform fee

  return {
    success: true,
    data: {
      estimatedPrice: {
        min: Math.round(baseline.labor * 0.8),
        max: Math.round(baseline.labor * 1.4),
        average: baseline.labor,
      },
      breakdown: {
        laborCost: { min: Math.round(baseline.labor * 0.8), max: Math.round(baseline.labor * 1.2) },
        estimatedMaterials: { min: 0, max: Math.round(baseline.labor * 0.5) },
        platformFee,
      },
      priceFactors: [
        `Complexity: ${complexity}`,
        `Category: ${category}`,
        'Prices may vary based on actual work required',
      ],
    },
  };
}

// ============================================================
// 4. DURATION ESTIMATION
// ============================================================
function estimateDuration({ serviceCategory, problemDescription }) {
  const category = serviceCategory || 'GENERAL_HANDYMAN';
  const baselines = PRICE_BASELINES[category] || PRICE_BASELINES.GENERAL_HANDYMAN;

  const desc = (problemDescription || '').toLowerCase();
  const complexKeywords = [
    'major', 'complete', 'full', 'replace', 'install', 'renovation',
    'entire', 'overhaul', 'poora', 'pura', 'naya lagana', 'mukammal',
  ];
  const simpleKeywords = [
    'minor', 'small', 'quick', 'just', 'simple',
    'chota', 'sirf', 'mamuli', 'asan',
  ];

  let complexity = 'medium';
  if (complexKeywords.some(k => desc.includes(k))) complexity = 'complex';
  if (simpleKeywords.some(k => desc.includes(k))) complexity = 'basic';

  const baseline = baselines[complexity];

  return {
    estimatedMinutes: baseline.duration,
    range: {
      min: Math.round(baseline.duration * 0.7),
      max: Math.round(baseline.duration * 1.5),
    },
    confidence: 0.7,
  };
}
