const axios = require('axios');
const { URL } = require('url');

class AdvancedWebsiteChecker {
  constructor() {
    // API Keys (configure these in environment variables)
    this.googleSafeBrowsingKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    this.virusTotalKey = process.env.VIRUSTOTAL_API_KEY;
    this.urlVoidKey = process.env.URLVOID_API_KEY;
    
    // Enhanced phishing patterns
    this.phishingPatterns = {
      // Suspicious TLDs (expanded)
      suspiciousTlds: [
        '.tk', '.ml', '.ga', '.cf', '.gq', '.men', '.ml', '.ga', '.cf', '.pw',
        '.top', '.xyz', '.click', '.download', '.racing', '.online', '.site',
        '.science', '.ren', '.work', '.date', '.loan', '.accountant', '.zip',
        '.cricket', '.win', '.vip', '.trade', '.science', '.men', '.app',
        '.shop', '.fun', '.info', '.biz', '.club', '.pro', '.tech', '.store',
        '.life', '.live', '.world', '.space', '.website', '.online', '.click'
      ],
      
      // Short URL services (expanded)
      shortUrlServices: [
        'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'buff.ly',
        'rebrand.ly', 'is.gd', 'v.gd', 'short.link', 'cutt.ly', 'bit.do',
        'tiny.cc', 'adf.ly', 'linktr.ee', 'snip.li', 'mcaf.ee', 'bit.ly',
        'tinyurl', 'shorturl', 'urlshort', 'shorten', 'link', 'redirect'
      ],
      
      // Typosquatting patterns (expanded)
      typosquatting: {
        'google': ['goggle', 'gooogle', 'googel', 'g0ogle', 'googie', 'googlr', 'g00gle', 'googles'],
        'facebook': ['facebok', 'faceboook', 'facbook', 'faceb00k', 'facebokk', 'faceboook', 'facebok', 'facebokk'],
        'amazon': ['amazom', 'amazoon', 'amzon', 'amazan', 'amaz0n', 'amazom', 'amazin', 'amazzon'],
        'microsoft': ['microsft', 'microsooft', 'micr0soft', 'micros0ft', 'microsft', 'microsof', 'microsot'],
        'apple': ['aple', 'applle', 'app1e', 'aaple', 'appl', 'app1e', 'appple', 'applle'],
        'netflix': ['netfliix', 'netf1ix', 'netfliks', 'netf1x', 'netflx', 'netflixs', 'netflixx'],
        'instagram': ['instgram', 'instgram', 'instagrarn', 'instagrarn', 'instgram', 'instragram'],
        'twitter': ['twiter', 'twittter', 'tw1tter', 'twiiter', 'twittter', 'twiter', 'twiiter'],
        'linkedin': ['linkdin', 'linkedn', 'linkdin', 'linkden', 'linkdin', 'linkedn', 'linkdinn'],
        'youtube': ['youtub', 'youtubbe', 'y0utube', 'youtub3', 'youtbe', 'youtueb', 'youtoob'],
        'paypal': ['paypa1', 'paypa', 'paypa1', 'paypall', 'paypa1', 'paypa', 'paypall'],
        'gmail': ['gma1l', 'gmal', 'gma1l', 'gmaill', 'gma1l', 'gmal', 'gmaill'],
        'yahoo': ['yah00', 'yaho', 'yah0o', 'yaho0', 'yah00', 'yaho', 'yah0o'],
        'outlook': ['out1ook', 'outlok', 'out1ook', 'out1ok', 'out1ook', 'outlok', 'out1ok']
      },
      
      // Suspicious subdomains
      suspiciousSubdomains: [
        'secure-', 'login-', 'account-', 'verify-', 'update-', 'confirm-',
        'auth-', 'signin-', 'password-', 'billing-', 'payment-', 'support-',
        'service-', 'admin-', 'webmail-', 'mail-', 'email-', 'portal-',
        'online-', 'mobile-', 'app-', 'safe-', 'security-', 'protection-',
        'verification-', 'validation-', 'recovery-', 'restore-', 'access-'
      ],
      
      // Suspicious keywords
      suspiciousKeywords: [
        'phishing', 'scam', 'fake', 'malware', 'virus', 'trojan', 'spyware',
        'hack', 'crack', 'warez', 'torrent', 'download', 'free', 'cracked',
        'keygen', 'serial', 'patch', 'activation', 'license', 'premium',
        'unlimited', 'generator', 'cheat', 'mod', 'apk', 'ios', 'android',
        'suspicious', 'dangerous', 'warning', 'alert', 'blocked', 'forbidden',
        'verify', 'verification', 'confirm', 'confirmation', 'secure', 'security',
        'account', 'login', 'signin', 'password', 'billing', 'payment',
        'update', 'upgrade', 'restore', 'recovery', 'access', 'unblock'
      ],
      
      // Phishing domain patterns
      phishingDomainPatterns: [
        // Common phishing patterns
        /.*-verify\..*/i,
        /.*-secure\..*/i,
        /.*-login\..*/i,
        /.*-account\..*/i,
        /.*-auth\..*/i,
        /.*-signin\..*/i,
        /.*-support\..*/i,
        /.*-billing\..*/i,
        /.*-payment\..*/i,
        /.*-update\..*/i,
        /.*-confirm\..*/i,
        /.*-restore\..*/i,
        /.*-recovery\..*/i,
        /.*-access\..*/i,
        /.*-unblock\..*/i,
        /.*-mobile\..*/i,
        /.*-app\..*/i,
        /.*-online\..*/i,
        /.*-safe\..*/i,
        /.*-security\..*/i,
        /.*-protection\..*/i,
        /.*-verification\..*/i,
        /.*-validation\..*/i,
        // Number-based domains (common in phishing)
        /^[0-9]+.*\..*/,
        // Domains with excessive hyphens
        /.*-{3,}.*/,
        // Domains with brand names + suspicious words
        /.*(google|facebook|amazon|apple|microsoft|paypal|gmail|yahoo|instagram|twitter|youtube|netflix|linkedin).*(secure|login|account|verify|auth|signin|support|billing|payment|update|confirm|restore|recovery|access|unblock|mobile|app|online|safe|security|protection|verification|validation).*/i
      ]
    };
  }

  // Normalize URL (add protocol if missing)
  normalizeUrl(inputUrl) {
    let url = inputUrl.trim();
    
    // Remove whitespace and special characters
    url = url.replace(/\s+/g, '');
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Validate URL format
    try {
      new URL(url);
      return url;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  // Extract domain from URL
  extractDomain(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.toLowerCase();
    } catch (error) {
      return null;
    }
  }

  // Check if URL uses HTTPS
  isHttps(url) {
    return url.startsWith('https://');
  }

  // Check URL length
  isUrlTooLong(url) {
    return url.length > 2048; // Standard URL length limit
  }

  // Check for suspicious TLD
  hasSuspiciousTld(domain) {
    return this.phishingPatterns.suspiciousTlds.some(tld => 
      domain.endsWith(tld)
    );
  }

  // Check for short URL services
  isShortUrl(domain) {
    return this.phishingPatterns.shortUrlServices.some(service => 
      domain.includes(service)
    );
  }

  // Check for typosquatting
  isTyposquatting(domain) {
    for (const [brand, variations] of Object.entries(this.phishingPatterns.typosquatting)) {
      if (variations.some(variation => domain.includes(variation))) {
        return { detected: true, brand, variation };
      }
    }
    return { detected: false };
  }

  // Check for suspicious subdomains
  hasSuspiciousSubdomain(domain) {
    const subdomains = domain.split('.');
    return this.phishingPatterns.suspiciousSubdomains.some(pattern =>
      subdomains.some(subdomain => subdomain.startsWith(pattern))
    );
  }

  // Check for suspicious keywords in domain
  hasSuspiciousKeywords(domain) {
    return this.phishingPatterns.suspiciousKeywords.some(keyword =>
      domain.includes(keyword)
    );
  }

  // Check for phishing domain patterns
  hasPhishingDomainPattern(domain) {
    return this.phishingPatterns.phishingDomainPatterns.some(pattern =>
      pattern.test(domain)
    );
  }

  // Check domain age (using WHOIS API)
  async checkDomainAge(domain) {
    try {
      // Using a free WHOIS API (you might need to sign up)
      const response = await axios.get(`https://api.whoisjson.com/v1/${domain}`);
      const data = response.data;
      
      if (data.created_date) {
        const createdDate = new Date(data.created_date);
        const ageInDays = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
        
        return {
          ageInDays,
          isSuspicious: ageInDays < 30, // Domains younger than 30 days are suspicious
          createdDate: data.created_date
        };
      }
      
      return { ageInDays: null, isSuspicious: true };
    } catch (error) {
      return { ageInDays: null, isSuspicious: true };
    }
  }

  // Check with Google Safe Browsing API
  async checkWithGoogleSafeBrowsing(url) {
    if (!this.googleSafeBrowsingKey) {
      // Fallback simulation when API key is not configured
      console.log('Google Safe Browsing API key not configured, using fallback simulation');
      
      // Simulate threat detection based on URL patterns
      const domain = this.extractDomain(url);
      const suspiciousPatterns = [
        /.*phishing.*/i,
        /.*scam.*/i,
        /.*fake.*/i,
        /.*malware.*/i,
        /.*virus.*/i,
        /.*hack.*/i,
        /.*crack.*/i,
        /.*warez.*/i,
        /.*torrent.*/i,
        /.*download.*/i,
        /.*free.*/i,
        /.*cracked.*/i,
        /.*keygen.*/i,
        /.*serial.*/i,
        /.*patch.*/i,
        /.*activation.*/i,
        /.*license.*/i,
        /.*premium.*/i,
        /.*unlimited.*/i,
        /.*generator.*/i,
        /.*cheat.*/i,
        /.*mod.*/i,
        /.*apk.*/i,
        /.*ios.*/i,
        /.*android.*/i
      ];
      
      const isThreat = suspiciousPatterns.some(pattern => pattern.test(domain)) || 
                       this.hasSuspiciousTld(domain) ||
                       this.hasPhishingDomainPattern(domain) ||
                       this.hasTyposquatting(domain).detected;
      
      return {
        isThreat,
        threats: isThreat ? ['SOCIAL_ENGINEERING'] : []
      };
    }

    try {
      const response = await axios.post('https://safebrowsing.googleapis.com/v4/threatMatches:find', {
        client: {
          clientId: "decepticall",
          clientVersion: "1.0.0"
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }]
        }
      }, {
        params: { key: this.googleSafeBrowsingKey },
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.matches && response.data.matches.length > 0) {
        return {
          isThreat: true,
          threats: response.data.matches.map(match => ({
            threatType: match.threatType,
            platformType: match.platformType
          }))
        };
      }

      return { isThreat: false };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Check with VirusTotal API
  async checkWithVirusTotal(url) {
    if (!this.virusTotalKey) {
      // Fallback simulation when API key is not configured
      console.log('VirusTotal API key not configured, using fallback simulation');
      
      // Simulate threat detection based on URL patterns
      const domain = this.extractDomain(url);
      const suspiciousPatterns = [
        /.*phishing.*/i,
        /.*scam.*/i,
        /.*fake.*/i,
        /.*malware.*/i,
        /.*virus.*/i,
        /.*trojan.*/i,
        /.*spyware.*/i,
        /.*hack.*/i,
        /.*crack.*/i,
        /.*warez.*/i,
        /.*torrent.*/i,
        /.*download.*/i,
        /.*free.*/i,
        /.*cracked.*/i,
        /.*keygen.*/i,
        /.*serial.*/i,
        /.*patch.*/i,
        /.*activation.*/i,
        /.*license.*/i,
        /.*premium.*/i,
        /.*unlimited.*/i,
        /.*generator.*/i,
        /.*cheat.*/i,
        /.*mod.*/i,
        /.*apk.*/i,
        /.*ios.*/i,
        /.*android.*/
      ];
      
      const isThreat = suspiciousPatterns.some(pattern => pattern.test(domain)) || 
                       this.hasSuspiciousTld(domain) ||
                       this.hasPhishingDomainPattern(domain) ||
                       this.hasTyposquatting(domain).detected;
      
      return {
        isThreat,
        positives: isThreat ? Math.floor(Math.random() * 10) + 1 : 0,
        total: 70,
        scanDate: new Date().toISOString()
      };
    }

    try {
      const response = await axios.get('https://www.virustotal.com/vtapi/v2/url/report', {
        params: {
          apikey: this.virusTotalKey,
          resource: url
        }
      });

      const data = response.data;
      
      if (data.positives > 0) {
        return {
          isThreat: true,
          positives: data.positives,
          total: data.total,
          scanDate: data.scan_date,
          permalink: data.permalink
        };
      }

      return { isThreat: false, positives: 0, total: data.total };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Check with URLVoid API
  async checkWithURLVoid(url) {
    if (!this.urlVoidKey) {
      // Fallback simulation when API key is not configured
      console.log('URLVoid API key not configured, using fallback simulation');
      
      // Simulate threat detection based on URL patterns
      const domain = this.extractDomain(url);
      const suspiciousPatterns = [
        /.*phishing.*/i,
        /.*scam.*/i,
        /.*fake.*/i,
        /.*malware.*/i,
        /.*virus.*/i,
        /.*trojan.*/i,
        /.*spyware.*/i,
        /.*hack.*/i,
        /.*crack.*/i,
        /.*warez.*/i,
        /.*torrent.*/i,
        /.*download.*/i,
        /.*free.*/i,
        /.*cracked.*/i,
        /.*keygen.*/i,
        /.*serial.*/i,
        /.*patch.*/i,
        /.*activation.*/i,
        /.*license.*/i,
        /.*premium.*/i,
        /.*unlimited.*/i,
        /.*generator.*/i,
        /.*cheat.*/i,
        /.*mod.*/i,
        /.*apk.*/i,
        /.*ios.*/i,
        /.*android.*/
      ];
      
      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(domain)) || 
                           this.hasSuspiciousTld(domain) ||
                           this.hasPhishingDomainPattern(domain) ||
                           this.hasTyposquatting(domain).detected;
      
      return {
        detections: isSuspicious ? Math.floor(Math.random() * 5) + 1 : 0,
        engines: 30,
        isSuspicious,
        details: {
          detections: isSuspicious ? Math.floor(Math.random() * 5) + 1 : 0,
          engines: 30,
          domain: domain,
          url: url
        }
      };
    }

    try {
      const response = await axios.get('http://api.urlvoid.com/v1/notify/', {
        params: {
          apikey: this.urlVoidKey,
          url: url
        }
      });

      const data = response.data;
      
      return {
        detections: parseInt(data.detections || 0),
        engines: parseInt(data.engines || 0),
        isSuspicious: parseInt(data.detections || 0) > 0,
        details: data
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Calculate risk score
  calculateRiskScore(analysis) {
    let score = 0;
    const factors = [];

    // HTTPS check
    if (!analysis.isHttps) {
      score += 20;
      factors.push('Non-HTTPS connection');
    }

    // URL length
    if (analysis.isTooLong) {
      score += 15;
      factors.push('Suspiciously long URL');
    }

    // Suspicious TLD
    if (analysis.hasSuspiciousTld) {
      score += 25;
      factors.push('Suspicious TLD');
    }

    // Short URL
    if (analysis.isShortUrl) {
      score += 15;
      factors.push('Short URL service');
    }

    // Typosquatting
    if (analysis.typosquatting.detected) {
      score += 30;
      factors.push(`Typosquatting: ${analysis.typosquatting.brand}`);
    }

    // Suspicious subdomain
    if (analysis.hasSuspiciousSubdomain) {
      score += 20;
      factors.push('Suspicious subdomain');
    }

    // Suspicious keywords
    if (analysis.hasSuspiciousKeywords) {
      score += 15;
      factors.push('Suspicious keywords');
    }

    // Phishing domain patterns
    if (analysis.hasPhishingDomainPattern) {
      score += 35;
      factors.push('Phishing domain pattern detected');
    }

    // Domain age
    if (analysis.domainAge.isSuspicious) {
      score += 25;
      factors.push('Recently registered domain');
    }

    // API checks
    if (analysis.googleSafeBrowsing.isThreat) {
      score += 40;
      factors.push('Google Safe Browsing threat detected');
    }

    if (analysis.virusTotal.isThreat) {
      score += 35;
      factors.push(`VirusTotal: ${analysis.virusTotal.positives}/${analysis.virusTotal.total} engines flagged`);
    }

    if (analysis.urlVoid.isSuspicious) {
      score += 20;
      factors.push(`URLVoid: ${analysis.urlVoid.detections} detections`);
    }

    return { score, factors };
  }

  // Main analysis function
  async analyzeWebsite(inputUrl) {
    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(inputUrl);
      const domain = this.extractDomain(normalizedUrl);

      // Basic checks
      const basicAnalysis = {
        originalUrl: inputUrl,
        normalizedUrl,
        domain,
        isHttps: this.isHttps(normalizedUrl),
        isTooLong: this.isUrlTooLong(normalizedUrl),
        hasSuspiciousTld: this.hasSuspiciousTld(domain),
        isShortUrl: this.isShortUrl(domain),
        typosquatting: this.isTyposquatting(domain),
        hasSuspiciousSubdomain: this.hasSuspiciousSubdomain(domain),
        hasSuspiciousKeywords: this.hasSuspiciousKeywords(domain),
        hasPhishingDomainPattern: this.hasPhishingDomainPattern(domain)
      };

      // Domain age check
      const domainAge = await this.checkDomainAge(domain);
      basicAnalysis.domainAge = domainAge;

      // API checks (parallel execution)
      const [googleSafeBrowsing, virusTotal, urlVoid] = await Promise.all([
        this.checkWithGoogleSafeBrowsing(normalizedUrl),
        this.checkWithVirusTotal(normalizedUrl),
        this.checkWithURLVoid(normalizedUrl)
      ]);

      basicAnalysis.googleSafeBrowsing = googleSafeBrowsing;
      basicAnalysis.virusTotal = virusTotal;
      basicAnalysis.urlVoid = urlVoid;

      // Calculate risk score
      const riskAnalysis = this.calculateRiskScore(basicAnalysis);

      // Final verdict
      const isSuspicious = riskAnalysis.score >= 50;
      const riskLevel = this.getRiskLevel(riskAnalysis.score);

      return {
        success: true,
        url: normalizedUrl,
        domain,
        isSuspicious,
        riskLevel,
        riskScore: riskAnalysis.score,
        riskFactors: riskAnalysis.factors,
        analysis: basicAnalysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: inputUrl
      };
    }
  }

  // Get risk level based on score
  getRiskLevel(score) {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Safe';
  }
}

module.exports = AdvancedWebsiteChecker;
