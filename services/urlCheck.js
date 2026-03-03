const https = require('https');

function checkUrlWithIPQS(targetUrl) {
  return new Promise((resolve) => {
    const apiKey = process.env.IPQS_API_KEY;
    if (!apiKey) {
      return resolve({ usedExternal: false, result: null, error: null });
    }

    try {
      const encodedUrl = encodeURIComponent(targetUrl);
      const requestUrl = `https://ipqualityscore.com/api/json/url/${apiKey}/${encodedUrl}?strictness=1&fast=true&timeout=10`;

      https
        .get(requestUrl, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve({ usedExternal: true, result: json, error: null });
            } catch (e) {
              resolve({ usedExternal: true, result: null, error: 'Invalid JSON from IPQS' });
            }
          });
        })
        .on('error', (err) => {
          resolve({ usedExternal: true, result: null, error: err.message });
        });
    } catch (err) {
      resolve({ usedExternal: true, result: null, error: err.message });
    }
  });
}

function interpretIPQSResult(json) {
  if (!json) return null;
  // IPQS fields: unsafe (bool), phishing (bool), malware (bool), suspicious (bool), risk_score (0-100)
  const reasons = [];
  let isFake = false;

  if (json.unsafe === true) {
    isFake = true;
    reasons.push('Marked unsafe by provider');
  }
  if (json.phishing === true) {
    isFake = true;
    reasons.push('Phishing detected');
  }
  if (json.malware === true) {
    isFake = true;
    reasons.push('Malware risk detected');
  }
  if (json.suspicious === true) {
    isFake = true;
    reasons.push('Suspicious indicators');
  }
  if (json.risk_score >= 75) {
    isFake = true;
    reasons.push(`High risk score (${json.risk_score})`);
  }

  const details = reasons.length > 0 ? reasons.join('; ') : 'No significant risk indicators';
  return { isFake, details, provider: 'IPQualityScore', raw: json };
}

module.exports = {
  checkUrlWithIPQS,
  interpretIPQSResult,
};
