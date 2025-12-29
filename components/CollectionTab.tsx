
import React, { useState, useMemo } from 'react';
import { SuggestedLink } from '../types';
import SwipableListItem from './SwipableListItem';

interface CollectionItem extends SuggestedLink {
  id: string;
  tags: string[];
}

const collectionData: CollectionItem[] = [
  { id: '1', title: '8 Ways A.I. Affected Pop Culture in 2025 - The New York Times', url: 'https://www.nytimes.com/2025/12/28/arts/ai-pop-culture-2025.html', tags: ['Report', 'AI'] },
  { id: '2', title: 'How AI is changing the patient journey - Fast Company', url: 'https://www.fastcompany.com/91467152/how-ai-is-changing-the-patient-journey', tags: ['Medical', 'AI'] },
  { id: '3', title: 'How AI could close the education inequality gap - or widen it | ZDNET', url: 'https://www.zdnet.com/article/ai-tutoring-education-gap-school/', tags: ['Education', 'AI'] },
  { id: '4', title: 'Google Cloud\'s TPU Strategy Powers AI Dominance and Sustainability', url: 'https://www.webpronews.com/google-clouds-tpu-strategy-powers-ai-dominance-and-sustainability/', tags: ['Google', 'AI'] },
  { id: '5', title: 'The Next Frontier For AI Is The Human Brain', url: 'https://www.forbes.com/sites/robtoews/2025/12/07/the-next-frontier-for-ai-is-the-human-brain/', tags: ['Report', 'AI'] },
  { id: '6', title: '60 of Google’s biggest AI announcements and updates in 2025', url: 'https://blog.google/technology/ai/google-ai-news-recap-2025/', tags: ['Google', 'AI'] },
  { id: '7', title: 'Can teacher wisdom steer the AI transition in education? - Fast Company', url: 'https://www.fastcompany.com/91464977/can-teacher-wisdom-steer-the-ai-transition-in-education', tags: ['Education', 'AI'] },
  { id: '8', title: 'Nvidia buying AI chip startup Groq for about $20 billion, biggest deal', url: 'https://www.cnbc.com/2025/12/24/nvidia-buying-ai-chip-startup-groq-for-about-20-billion-biggest-deal.html', tags: ['Nvidia', 'AI'] },
  { id: '9', title: 'Elon Musk Says He\'s Been Having \'AI Nightmares\' Lately —\'If I Could, I Would Certainly Slow Down AI And Robotics, But I Can\'t\'', url: 'https://www.yahoo.com/news/articles/elon-musk-says-hes-having-173017488.html', tags: ['AI', 'Elon'] },
  { id: '10', title: 'The Top-Paying 2026 AI Internships, Fellowships, and Residencies - Business Insider', url: 'https://www.businessinsider.com/top-paying-ai-internships-fellowships-residencies-openai-anthropic-meta-google-2025-12', tags: ['Jobs', 'AI'] },
  { id: '11', title: 'Why Do A.I. Chatbots Use ‘I’? - The New York Times', url: 'https://www.nytimes.com/2025/12/19/technology/why-do-ai-chatbots-use-i.html', tags: ['AI'] },
  { id: '12', title: 'How I learned to stop worrying and love AI slop | MIT Technology Review', url: 'https://www.technologyreview.com/2025/12/23/1130396/how-i-learned-to-stop-worrying-and-love-ai-slop/', tags: ['Report', 'AI'] },
  { id: '13', title: 'An AI Godfather Says He Lies to AI Chatbots to Get Better Responses - Business Insider', url: 'https://www.businessinsider.com/ai-godfather-yoshua-bengio-lies-ai-chatbots-responses-2025-12', tags: ['Report', 'AI'] },
  { id: '14', title: 'When AI-powered toys go rogue - Fast Company', url: 'https://www.fastcompany.com/91463100/ai-toys-kumma-legal-liability-openai', tags: ['AI', 'Toy'] },
  { id: '15', title: 'Microsoft, Google, Amazon Partner With U.S. Energy Department to Boost AI Innovation', url: 'https://finance.yahoo.com/news/microsoft-google-amazon-partner-u-113442977.html', tags: ['Power', 'AI'] },
  { id: '16', title: 'Are AI scribes safe? | Medical Economics', url: 'https://www.medicaleconomics.com/view/are-ai-scribes-safe-', tags: ['Medical', 'AI'] },
  { id: '17', title: 'Apple\'s AI team is bigger than reported & strategy reinforced with latest restructure | AppleInsider', url: 'https://appleinsider.com/articles/25/12/23/apples-ai-team-is-bigger-than-reported-strategy-reinforced-with-latest-restructure', tags: ['Apple', 'AI'] },
  { id: '18', title: 'How AI broke the smart home in 2025  | The Verge', url: 'https://www.theverge.com/tech/845958/ai-smart-home-broken', tags: ['AI', 'Agent'] },
  { id: '19', title: 'When is an AI agent not really an agent? | InfoWorld', url: 'https://www.infoworld.com/article/4110742/when-is-an-ai-agent-not-really-an-agent.html', tags: ['AI', 'Agent'] },
  { id: '20', title: 'How will AI transform business in 2026? - Fast Company', url: 'https://www.fastcompany.com/91464688/how-will-ai-transform-business-in-2026', tags: ['AI'] },
  { id: '21', title: 'AI CEOs Say AI Automation Is Harder Than Expected - Business Insider', url: 'https://www.businessinsider.com/ceo-databricks-glean-ai-automation-overestimate-ali-ghodsi-arvind-jain-2025-12', tags: ['AI', 'Agent'] },
  { id: '22', title: 'The Year in Slop | The New Yorker', url: 'https://www.newyorker.com/culture/infinite-scroll/the-year-in-ai-slop', tags: ['AI'] },
  { id: '23', title: 'OpenAI Data Center Plans Highlight AI Investment Momentum', url: 'https://www.etftrends.com/artificial-intelligence-content-hub/open-ai-data-center-plans-highlight-ai-investment-momentum/', tags: ['Openai', 'AI'] },
  { id: '24', title: 'The AI boom is heralding a new gold rush in the American west | Artificial intelligence (AI) | The Guardian', url: 'https://www.theguardian.com/technology/2025/dec/04/nevada-ai-data-centers', tags: ['AI'] },
  { id: '25', title: 'Forget Chatbots. This Is the AI Technology to Watch in 2026 | PCMag', url: 'https://www.pcmag.com/opinions/forget-chatbots-this-is-the-ai-technology-to-watch-in-2026', tags: ['AI'] },
  { id: '26', title: 'YouTube Now Shutting Down Channels Posting AI Slop', url: 'https://futurism.com/artificial-intelligence/youtube-shutting-down-ai-slop-channels', tags: ['AI'] },
  { id: '27', title: 'I was wrong. Universities don’t fear AI. They fear self-reflection', url: 'https://www.timeshighereducation.com/opinion/i-was-wrong-universities-dont-fear-ai-they-fear-self-reflection', tags: ['AI'] },
  { id: '28', title: '6 Scary Predictions for AI in 2026 | WIRED', url: 'https://www.wired.com/story/backchannel-2026-predictions-tech-robots-ai/', tags: ['AI'] },
  { id: '29', title: '10 AI Predictions For 2026', url: 'https://www.forbes.com/sites/robtoews/2025/12/22/10-ai-predictions-for-2026/', tags: ['Report', 'AI'] },
  { id: '30', title: 'Actor Joseph Gordon-Levitt wonders why AI companies don\'t have to \'follow any laws\' | Fortune', url: 'https://fortune.com/2025/12/15/joseph-gordon-levitt-ai-laws-dystopian/', tags: ['AI'] },
  { id: '31', title: 'OpenAI says AI browsers may always be vulnerable to prompt injection attacks | TechCrunch', url: 'https://techcrunch.com/2025/12/22/openai-says-ai-browsers-may-always-be-vulnerable-to-prompt-injection-attacks/', tags: ['AI'] },
  { id: '32', title: 'AI coding is now everywhere. But not everyone is convinced. | MIT Technology Review', url: 'https://www.technologyreview.com/2025/12/15/1128352/rise-of-ai-coding-developers-2026/', tags: ['Code', 'AI'] },
  { id: '33', title: 'Amazon in talks to invest about $10 billion in OpenAI, source says | Reuters', url: 'https://www.reuters.com/business/retail-consumer/openai-talks-raise-least-10-billion-amazon-use-its-ai-chips-information-reports-2025-12-17/', tags: ['AI'] },
  { id: '34', title: 'Google researchers figure how to get AI agents to work better | Fortune', url: 'https://fortune.com/2025/12/16/google-researchers-ai-agents-multi-agent-getting-them-to-work/', tags: ['AI', 'Agent'] },
  { id: '35', title: 'The commoditization of "AI-first" marketing - Fast Company', url: 'https://www.fastcompany.com/91461295/the-commoditization-of-ai-first-marketing', tags: ['AI'] },
  { id: '36', title: 'Why the Next AI Revolution Will Happen Off-Screen: Samsara CEO Sanjit Biswas | Sequoia Capital', url: 'https://sequoiacap.com/podcast/why-the-next-ai-revolution-will-happen-off-screen-samsara-ceo-sanjit-biswas/', tags: ['AI'] },
  { id: '37', title: 'Walmart AI strategy: US$905B bet on agentic future', url: 'https://www.artificialintelligence-news.com/news/walmart-ai-strategy-agentic-future/', tags: ['Walmart', 'AI'] },
  { id: '38', title: 'Hollywood’s AI Experiments Are in Conflict With What Actors and Directors Want', url: 'https://www.bloomberg.com/features/2025-ai-hollywood/', tags: ['AI'] },
  { id: '39', title: 'What if Readers Like A.I.-Generated Fiction? | The New Yorker', url: 'https://www.newyorker.com/culture/the-weekend-essay/what-if-readers-like-ai-generated-fiction', tags: ['Kindle', 'AI'] },
  { id: '40', title: 'How AI could reboot science and revive long-term economic growth | Vox', url: 'https://www.vox.com/future-perfect/471918/ai-science-growth-deepmind-alphafold-chatgpt-google', tags: ['AI'] },
  { id: '41', title: 'AI is changing the way customers shop. How should your brand respond? | The Drum', url: 'https://www.thedrum.com/opinion/ai-is-changing-the-way-customers-shop-how-should-your-brand-respond', tags: ['Marketing', 'AI'] },
  { id: '42', title: 'AI data centres could have a carbon footprint that matches small European country, new study finds | Euronews', url: 'https://www.euronews.com/next/2025/12/20/ai-data-centres-could-have-a-carbon-footprint-that-matches-small-european-country-new-stud', tags: ['Power', 'AI'] },
  { id: '43', title: 'How AI Is Rewriting the Healthcare Playbook', url: 'https://www.pymnts.com/news/artificial-intelligence/2025/how-ai-is-rewriting-healthcare-playbook/', tags: ['Health', 'AI'] },
  { id: '44', title: 'Google Says Gemini 3 Flash AI Is as Fast as Traditional Search', url: 'https://www.vice.com/en/article/google-gemini-3-flash-ai-fast-as-search-engine/', tags: ['Google', 'AI'] },
  { id: '45', title: 'The surprising truth about AI’s impact on jobs | CNN Business', url: 'https://edition.cnn.com/2025/12/18/business/ai-jobs-economy', tags: ['Jobs', 'AI'] },
  { id: '46', title: 'Justice in the Age of Algorithms: Guardrails for AI - The Fulcrum', url: 'https://thefulcrum.us/rule-of-law/justice-age-algorithms-ai-guardrails', tags: ['AI'] },
  { id: '47', title: 'Don’t Build Agents, Build Skill. The scariest part of building agents… | by Yanqing_J | Dec, 2025 | Medium', url: 'https://medium.com/@yanqing_j/dont-build-agents-build-skill-62b97b4eae30', tags: ['AI', 'Agent'] },
  { id: '48', title: 'New Research Shows How the Brain Adapts Faster Than AI - North American Community Hub', url: 'https://nchstats.com/brain-adapts-faster-than-ai/', tags: ['Report', 'AI'] },
  { id: '49', title: 'Why I\'m Betting Against AI Agents in 2025 (Despite Building Them)', url: 'https://utkarshkanwat.com/writing/betting-against-agents', tags: ['AI', 'Agent'] },
  { id: '50', title: 'When AI learns the why, it becomes smarter—and more responsible', url: 'https://techxplore.com/news/2025-12-ai-smarter-responsible.html', tags: ['Report', 'AI'] },
  { id: '51', title: 'In a First, AI Models Analyze Language As Well As a Human Expert | Quanta Magazine', url: 'https://www.quantamagazine.org/in-a-first-ai-models-analyze-language-as-well-as-a-human-expert-20251031/', tags: ['Report', 'AI'] },
  { id: '52', title: 'AI is making us more comfortable . . . and that’s the problem - Fast Company', url: 'https://www.fastcompany.com/91453616/ai-is-making-us-more-comfortable-and-thats-the-problem-ai-validation', tags: ['AI'] },
  { id: '53', title: 'The truth about AI in drug discovery: what the experts really think - Drug Target Review', url: 'https://www.drugtargetreview.com/webinar/191559/the-truth-about-ai-in-drug-discovery-what-the-experts-really-think/', tags: ['Medical', 'AI'] },
  { id: '54', title: 'AI Use at Work Rises', url: 'https://www.gallup.com/workplace/699689/ai-use-at-work-rises.aspx', tags: ['Jobs', 'AI'] },
  { id: '55', title: 'AI ROI: How to measure the true value of AI | CIO', url: 'https://www.cio.com/article/4106788/ai-roi-how-to-measure-the-true-value-of-ai-2.html', tags: ['AI'] },
  { id: '56', title: 'AI image generators are getting better by getting worse | The Verge', url: 'https://www.theverge.com/column/843883/ai-image-generators-better-worse', tags: ['Application', 'AI'] },
  { id: '57', title: 'Opinion | Don’t Fear the A.I. Bubble Bursting - The New York Times', url: 'https://www.nytimes.com/2025/12/05/opinion/ai-bubble-innovation-advancement.html', tags: ['AI'] },
  { id: '58', title: 'Will AIs Take All Our Jobs and End Human History—or Not? Well, It’s Complicated…—Stephen Wolfram Writings', url: 'https://writings.stephenwolfram.com/2023/03/will-ais-take-all-our-jobs-and-end-human-history-or-not-well-its-complicated/', tags: ['Report', 'AI'] },
  { id: '59', title: 'There\'s a new face in Hollywood, generated by AI - CBS News', url: 'https://www.cbsnews.com/news/theres-a-new-face-in-hollywood-generated-by-ai/', tags: ['Movie', 'Application', 'AI'] },
  { id: '60', title: 'What do AI relationships mean for the future? – The Wellesley News', url: 'https://thewellesleynews.com/22344/opinions/what-do-ai-relationships-mean-for-the-future/', tags: ['AI'] },
  { id: '61', title: 'Tool or Toy? Businesses Must Learn to Wield AI With Purpose', url: 'https://www.inc.com/louise-allen/business-leaders-must-learn-how-to-utilize-ai-as-an-effective-tool/91274586', tags: ['Jobs', 'AI'] },
  { id: '62', title: 'State of AI | OpenRouter', url: 'https://openrouter.ai/state-of-ai', tags: ['Report', 'AI'] },
  { id: '63', title: '折腾 NAS 的这些年：从工作到生活，我找到了自己的答案 - 少数派', url: 'https://sspai.com/post/104223', tags: ['Nas'] },
  { id: '64', title: 'MIT researchers “speak objects into existence” using AI and robotics | MIT News | Massachusetts Institute of Technology', url: 'https://news.mit.edu/2025/mit-researchers-speak-objects-existence-using-ai-robotics-1205', tags: ['Application', 'AI'] },
  { id: '65', title: 'AI is Destroying the University and Learning Itself', url: 'https://www.currentaffairs.org/news/ai-is-destroying-the-university-and-learning-itself', tags: ['Education', 'AI'] },
  { id: '66', title: '\'Godfather of AI\' Says Google Is \'Beginning to Overtake\' OpenAI - Business Insider', url: 'https://www.businessinsider.com/ai-godfather-geoffrey-hinton-google-overtaking-openai-2025-12', tags: ['Google', 'Openai', 'AI'] },
  { id: '67', title: 'For MrBeast, YouTube Still Rules, but It’s Not Everything - The New York Times', url: 'https://www.nytimes.com/2025/12/03/business/dealbook/mrbeast-youtube.html', tags: ['Youtube', 'AI'] },
  { id: '68', title: 'Cloudflare Has Blocked 416 Billion AI Bot Requests Since July 1 | WIRED', url: 'https://www.wired.com/story/big-interview-event-matthew-prince-cloudflare/', tags: ['AI'] },
  { id: '69', title: 'PODCAST | Lowe’s AI Reset: The Infrastructure and Strategy Behind a Retail Giant’s Transformation - CDO Magazine', url: 'https://www.cdomagazine.tech/podcasts/podcast-lowes-ai-reset-the-infrastructure-and-strategy-behind-a-retail-giants-transformation', tags: ['Application', 'AI'] },
  { id: '70', title: '✍️ New AI enables people without CAD training to create 3D models from hand sketches', url: 'https://www.warpnews.org/artificial-intelligence/new-ai-enables-people-without-cad-training-to-create-3d-models-from-hand-sketches/', tags: ['Application', 'AI'] },
  { id: '71', title: 'Trains cancelled over fake bridge collapse image', url: 'https://www.bbc.com/news/articles/cwygqqll9k2o', tags: ['AI'] },
  { id: '72', title: 'Will AI chatbots ever be funny? Comedians weight in - Fast Company', url: 'https://www.fastcompany.com/91453237/will-chatbots-ever-funny-why-these-comedians-arent-worried-about-ai-takeover-yet', tags: ['Jobs', 'Application', 'AI'] },
  { id: '73', title: 'Share your views on music produced by AI | Music | The Guardian', url: 'https://www.theguardian.com/music/2025/dec/03/share-your-views-on-music-produced-by-ai', tags: ['Music', 'AI'] },
  { id: '74', title: 'How Will AI Hiring Affect Your Next Job Search?', url: 'https://www.fairobserver.com/more/science/how-will-ai-hiring-affect-your-next-job-search/', tags: ['Jobs', 'AI'] },
  { id: '75', title: 'MIT creates an AI labor index as agents invade human economies – Computerworld', url: 'https://www.computerworld.com/article/4100257/mit-creates-an-ai-labor-index-as-agents-invade-human-economies.html', tags: ['Jobs', 'AI'] },
  { id: '76', title: 'When AI Outruns Your Strategy: The Rise Of The AI Sherpa', url: 'https://www.forbes.com/sites/johnwinsor/2025/12/03/when-ai-outruns-your-strategy-the-rise-of-the-ai-sherpa/', tags: ['Jobs', 'AI'] },
  { id: '77', title: 'Agent 持续学习的困境：为什么 Reasoner 不是真正的 Agent？ | Bojie Li', url: 'https://01.me/2025/10/agent-continual-learning/', tags: ['Report', 'Agent', 'AI'] },
  { id: '78', title: '从ChatGPT到AI Agent，一文讲透 Agent 的底层逻辑', url: 'https://mp.weixin.qq.com/s/tewBKHgbyrjxUjAOmkXI7A', tags: ['Report', 'Agent', 'AI'] },
  { id: '79', title: 'AI: A double-edged sword of innovation and risk', url: 'https://finance.yahoo.com/news/ai-double-edged-sword-innovation-risk-103252426.html', tags: ['AI'] },
  { id: '80', title: 'CEOs are making the business case for AI—and dispelling talk of a bubble | Fortune', url: 'https://fortune.com/2025/12/04/nyt-dealbook-summit-ceos-ai-business-case-bubble/', tags: ['AI'] },
  { id: '81', title: 'Microsoft Excel Powers an AI-Resistant, Multitrillion-Dollar Empire', url: 'https://www.bloomberg.com/features/2025-microsoft-excel-ai-software/', tags: ['Mircosoft', 'AI'] },
  { id: '82', title: 'Reaping the Benefits of AI Without the Brain Rot | Psychology Today', url: 'https://www.psychologytoday.com/us/blog/power-and-influence/202512/reaping-the-benefits-of-ai-without-the-brain-rot', tags: ['AI'] },
  { id: '83', title: 'AMD CEO Lisa Su Says Concerns About an AI Bubble Are Overblown | WIRED', url: 'https://www.wired.com/story/big-interview-event-lisa-su-amd/', tags: ['AMD', 'AI'] },
  { id: '84', title: 'Why is AI making computers and games consoles more expensive? | New Scientist', url: 'https://www.newscientist.com/article/2507081-why-is-ai-making-computers-and-games-consoles-more-expensive/', tags: ['AI'] },
  { id: '85', title: 'How AI may impact specialty margins and referrals in 2026 | Healthcare IT News', url: 'https://www.healthcareitnews.com/news/how-ai-may-impact-specialty-margins-and-referrals-2026', tags: ['Health', 'AI'] },
  { id: '86', title: 'Why Does A.I. Write Like … That? - The New York Times', url: 'https://www.nytimes.com/2025/12/03/magazine/chatbot-writing-style.html', tags: ['Kindle', 'AI'] },
  { id: '87', title: 'AI’s future runs on water - Fast Company', url: 'https://www.fastcompany.com/91454609/ais-future-runs-on-water', tags: ['Power', 'AI'] },
  { id: '88', title: 'AI finds its way into Apple\'s top apps of the year | TechCrunch', url: 'https://techcrunch.com/2025/12/04/ai-finds-its-way-into-apples-top-apps-of-the-year/', tags: ['Apple', 'AI'] },
  { id: '89', title: 'Mistral unveils new AI models in bid to compete with OpenAI, Google', url: 'https://www.cnbc.com/2025/12/02/mistral-unveils-new-ai-models-in-bid-to-compete-with-openai-google.html', tags: ['AI'] },
  { id: '90', title: 'How to responsibly integrate AI into strategic foresight | World Economic Forum', url: 'https://www.weforum.org/stories/2025/12/ai-strategic-foresight-future-thinking/', tags: ['Report', 'AI'] },
  { id: '91', title: 'Google Discover is testing AI-generated headlines and they aren\'t good', url: 'https://www.engadget.com/ai/google-discover-is-testing-ai-generated-headlines-and-they-arent-good-234700720.html', tags: ['Google', 'AI'] },
  { id: '92', title: 'How to stop AI from eating the open Internet - POLITICO', url: 'https://www.politico.com/newsletters/digital-future-daily/2025/12/02/how-to-stop-ai-from-eating-the-open-internet-00673326', tags: ['AI'] },
  { id: '93', title: 'To AI or not to AI? Do college students appreciate the question? : NPR', url: 'https://www.npr.org/2025/12/02/nx-s1-5626843/to-ai-or-not-to-ai-do-college-students-appreciate-the-question', tags: ['Education', 'AI'] },
  { id: '94', title: 'How AI Is Transforming Work at Anthropic \\ Anthropic', url: 'https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic', tags: ['Anthropic', 'Application', 'AI'] },
  { id: '95', title: 'Insurance\'s new operating system for 2026: AI', url: 'https://finance.yahoo.com/news/insurances-operating-system-2026-ai-141700591.html', tags: ['Application', 'AI'] },
  { id: '96', title: 'Human-AI teaming in healthcare: 1 + 1 > 2? | npj Artificial Intelligence', url: 'https://www.nature.com/articles/s44387-025-00052-4', tags: ['Report', 'Application', 'AI'] },
  { id: '97', title: 'AI could already replace nearly 12% of jobs - MIT | HRD America', url: 'https://www.hcamag.com/us/news/general/ai-could-already-replace-nearly-12-of-jobs-mit/558674', tags: ['Jobs', 'AI'] },
  { id: '98', title: 'Using AI to scan the Earth - SpaceNews', url: 'https://spacenews.com/using-ai-to-scan-the-earth/', tags: ['Application', 'AI'] },
  { id: '99', title: 'Google tests merging AI Overviews with AI Mode | TechCrunch', url: 'https://techcrunch.com/2025/12/02/google-tests-merging-ai-overviews-with-ai-mode/', tags: ['Google', 'AI'] },
  { id: '100', title: 'Google Tests Direct Link To AI Mode From Search | Social Media Today', url: 'https://www.socialmediatoday.com/news/google-tests-direct-link-to-ai-mode-from-search/806741/', tags: ['Google', 'AI'] },
];

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

interface CollectionTabProps {
  isDarkMode: boolean;
  addBookmark: (item: SuggestedLink) => void;
}

const CollectionTab: React.FC<CollectionTabProps> = ({ isDarkMode, addBookmark }) => {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    collectionData.forEach(item => {
      item.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedTags.size === 0) {
      return collectionData;
    }
    return collectionData.filter(item => {
      return Array.from(selectedTags).every(selectedTag => item.tags.includes(selectedTag));
    });
  }, [selectedTags]);

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  };
  

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#121212]' : 'bg-[#F2F2F7]'} transition-colors duration-300`}>
      <div className={`${isDarkMode ? 'bg-[#121212]/90' : 'bg-white/90'} backdrop-blur-md border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} sticky top-0 z-10 transition-colors duration-300`}>
        <div className="px-6 pt-6 pb-4">
          <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Collection</h1>
          <p className="text-gray-500 text-sm mt-1">A curated library of AI news and resources.</p>
        </div>
        <div className="px-4 pb-3">
           <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedTags(new Set())}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${selectedTags.size === 0 ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-gray-700')}`}
              >
                All
              </button>
             {allTags.map(tag => {
                const isSelected = selectedTags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${isSelected ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-gray-700')}`}
                  >
                    {tag}
                  </button>
                )
             })}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 space-y-2 pb-24">
          {filteredItems.map(item => {
            const bookmarkContent = (
              <div className="w-full h-full flex items-center justify-start pl-6 bg-blue-500 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                </svg>
              </div>
            );
            return (
              <SwipableListItem
                key={item.id}
                onSwipe={() => addBookmark(item)}
                swipeContent={bookmarkContent}
              >
                <a href={item.url} target="_blank" rel="noopener noreferrer" className={`block p-3 rounded-2xl ${isDarkMode ? 'bg-[#1C1C1E] ring-white/10' : 'bg-white ring-black/5'} ring-1`}>
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} truncate`}>{item.title}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} truncate`}>{getHostname(item.url)}</p>
                </a>
              </SwipableListItem>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CollectionTab;
