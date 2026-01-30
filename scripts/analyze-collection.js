import fs from 'fs';

// Read collection.md
const content = fs.readFileSync('public/collection.md', 'utf-8');

// Extract all URLs from markdown format [Text](URL)
const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
const matches = [...content.matchAll(urlRegex)];

console.log(`\n📊 Total articles found: ${matches.length}\n`);

// Extract domains and count
const domainCounts = {};
const domainExamples = {};

matches.forEach((match) => {
  const url = match[2];
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;

    // Remove www. prefix for consistency
    if (domain.startsWith('www.')) {
      domain = domain.slice(4);
    }

    domainCounts[domain] = (domainCounts[domain] || 0) + 1;

    // Store example URL (first 3)
    if (!domainExamples[domain]) {
      domainExamples[domain] = [];
    }
    if (domainExamples[domain].length < 3) {
      domainExamples[domain].push({ title: match[1], url: url });
    }
  } catch (e) {
    console.error(`Failed to parse URL: ${url}`);
  }
});

// Sort by count
const sortedDomains = Object.entries(domainCounts)
  .sort((a, b) => b[1] - a[1]);

// Display results
console.log('📰 Unique sources:', sortedDomains.length);
console.log('\n┌─────────────────────────────────┬────────┬────────────────────────────────────────┐');
console.log('│ Source                         │ Count  │ Example URLs                              │');
console.log('├─────────────────────────────────┼────────┼────────────────────────────────────────┤');

sortedDomains.forEach(([domain, count]) => {
  const domainPadded = domain.padEnd(31);
  const countPadded = count.toString().padEnd(6);

  // Show first example URL
  const example = domainExamples[domain][0];
  const exampleTitle = example.title.length > 40
    ? example.title.substring(0, 37) + '...'
    : example.title;

  console.log(`│ ${domainPadded} │ ${countPadded} │ ${exampleTitle} │`);

  // Show more examples if count > 5
  if (count > 5 && domainExamples[domain].length > 1) {
    for (let i = 1; i < Math.min(3, domainExamples[domain].length); i++) {
      const ex = domainExamples[domain][i];
      const exTitle = ex.title.length > 40
        ? ex.title.substring(0, 37) + '...'
        : ex.title;
      console.log(`│ ${' '.repeat(31)} │ ${' '.repeat(6)} │ ${exTitle} │`);
    }
  }
});

console.log('└─────────────────────────────────┴────────┴────────────────────────────────────────┘');

// Categorize sources
const highVolume = sortedDomains.filter(([_, count]) => count >= 50);
const mediumVolume = sortedDomains.filter(([_, count]) => count >= 20 && count < 50);
const lowVolume = sortedDomains.filter(([_, count]) => count >= 5 && count < 20);
const rare = sortedDomains.filter(([_, count]) => count < 5);

console.log('\n📈 Distribution:');
console.log(`   High volume (≥50 articles): ${highVolume.length} sources`);
console.log(`   Medium volume (20-49): ${mediumVolume.length} sources`);
console.log(`   Low volume (5-19): ${lowVolume.length} sources`);
console.log(`   Rare (<5): ${rare.length} sources`);

console.log('\n🔥 Top 20 sources by volume:');
highVolume.slice(0, 20).forEach(([domain, count]) => {
  console.log(`   ${domain}: ${count} articles`);
});

// Check which current RSS sources are in collection
const currentSources = ['wired.com', 'technologyreview.com', 'nvidia.com', 'fortune.com', 'cnet.com', 'engadget.com'];
console.log('\n✅ Current RSS sources found in collection:');
currentSources.forEach(source => {
  const found = sortedDomains.find(([domain]) => domain.includes(source));
  if (found) {
    console.log(`   ✓ ${source}: ${found[1]} articles`);
  } else {
    console.log(`   ✗ ${source}: Not found in collection`);
  }
});

// Recommend RSS sources based on collection
console.log('\n💡 Recommended new RSS sources (high volume in collection):');
const recommendedSources = [
  { domain: 'technologyreview.com', name: 'MIT Technology Review', rss: 'https://www.technologyreview.com/feed/' },
  { domain: 'wired.com', name: 'Wired', rss: 'https://www.wired.com/feed/rss' },
  { domain: 'theverge.com', name: 'The Verge', rss: 'https://www.theverge.com/rss/index.xml' },
  { domain: 'arstechnica.com', name: 'Ars Technica', rss: 'https://feeds.arstechnica.com/arstechnica/index' },
  { domain: 'techcrunch.com', name: 'TechCrunch', rss: 'https://techcrunch.com/feed/' },
  { domain: 'venturebeat.com', name: 'VentureBeat', rss: 'https://venturebeat.com/feed/' },
  { domain: 'zdnet.com', name: 'ZDNet', rss: 'https://www.zdnet.com/news/rss.xml' },
  { domain: 'ieee.org', name: 'IEEE Spectrum', rss: 'https://spectrum.ieee.org/rss/full' },
  { domain: 'a16z.com', name: 'a16z (Andreessen Horowitz)', rss: 'https://a16z.com/feed/' },
  { domain: 'openai.com', name: 'OpenAI Blog', rss: 'https://openai.com/blog/rss.xml' },
  { domain: 'anthropic.com', name: 'Anthropic Blog', rss: 'https://www.anthropic.com/news/rss' },
  { domain: 'deepmind.com', name: 'Google DeepMind', rss: 'https://deepmind.google/discover/feed/' },
];

const currentDomains = currentSources;
recommendedSources.forEach(({ domain, name, rss }) => {
  const found = sortedDomains.find(([d]) => d.includes(domain));
  if (found && !currentDomains.some(cd => found[0].includes(cd))) {
    console.log(`   • ${name}: ${found[1]} articles in collection`);
    console.log(`     RSS: ${rss}`);
  }
});
