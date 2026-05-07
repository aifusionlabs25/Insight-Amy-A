const catalog = [
  {
    id: 'cisco-9500-48y4c',
    title: 'Cisco Catalyst 9500 48-port 25G, 4-port 100G',
    manufacturer: 'Cisco',
    partNumber: 'C9500-48Y4C-A',
    url: 'https://www.insight.com/en_US/shop/product/C9500-48Y4C-A/CISCO%20SYSTEMS/C9500-48Y4C-A/Cisco-Catalyst-9500---switch---48-ports---managed---rack-mountable/',
    shortSpecs: '48 x 25G SFP28, 4 x 100G QSFP28, Advantage License',
  },
  {
    id: 'cisco-9200l-24t',
    title: 'Cisco Catalyst 9200L 24-port Data, 4 x 1G, Network Essentials',
    manufacturer: 'Cisco',
    partNumber: 'C9200L-24T-4G-E',
    url: 'https://www.insight.com/en_US/shop/product/C9200L-24T-4G-E/CISCO%20SYSTEMS/C9200L-24T-4G-E/Cisco-Catalyst-9200L---switch---24-ports---managed---rack-mountable/',
    shortSpecs: '24 x 10/100/1000, 4 x 1G SFP, Fixed Uplinks',
  },
  {
    id: 'fortinet-60f',
    title: 'FortiGate 60F Hardware plus 1 Year FortiCare and FortiGuard',
    manufacturer: 'Fortinet',
    partNumber: 'FG-60F-BDL-950-12',
    url: 'https://www.insight.com/en_US/shop/product/FG-60F-BDL-950-12/FORTINET/FG-60F-BDL-950-12/Fortinet-FortiGate-60F---security-appliance---with-1-year-FortiCare-and-FortiGuard-Enterprise-Protection/',
    shortSpecs: '10 x GE RJ45 ports, FortiCare, IPS, antivirus',
  },
  {
    id: 'hp-probook-450',
    title: 'HP ProBook 450 G10 15.6-inch Notebook',
    manufacturer: 'HP',
    partNumber: '822P1UT#ABA',
    url: 'https://www.insight.com/en_US/shop/product/822P1UT%23ABA/HP%20INC/822P1UT%23ABA/HP-ProBook-450-G10---15.6%22---Core-i7-1355U---16-GB-RAM---512-GB-SSD---US/',
    shortSpecs: 'Core i7, 16GB RAM, 512GB SSD, Windows 11 Pro',
  },
  {
    id: 'surface-pro-9',
    title: 'Microsoft Surface Pro 9 for Business',
    manufacturer: 'Microsoft',
    partNumber: 'QIX-00001',
    url: 'https://www.insight.com/en_US/shop/product/QIX-00001/MICROSOFT/QIX-00001/Microsoft-Surface-Pro-9-for-Business---13%22---Core-i5-1245U---8-GB-RAM---256-GB-SSD---Platinum/',
    shortSpecs: '13-inch touchscreen, Core i5, 8GB RAM, 256GB SSD',
  },
  {
    id: 'lenovo-thinkpad-x1',
    title: 'Lenovo ThinkPad X1 Carbon Gen 11',
    manufacturer: 'Lenovo',
    partNumber: '21HM000KUS',
    url: 'https://www.insight.com/en_US/shop/product/21HM000KUS/LENOVO/21HM000KUS/Lenovo-ThinkPad-X1-Carbon-Gen-11---14%22---Core-i7-1355U---16-GB-RAM---512-GB-SSD---English/',
    shortSpecs: 'Core i7, 16GB RAM, 512GB SSD, 14-inch WUXGA',
  },
];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const query = String((req.body && (req.body.queryText || req.body.query)) || '').trim().slice(0, 500);
  if (!query) return res.status(400).json({ error: 'queryText is required.' });

  const terms = query.toLowerCase().split(/[^a-z0-9#-]+/).filter(Boolean);
  const scored = catalog.map((item) => {
    const haystack = `${item.title} ${item.manufacturer} ${item.partNumber} ${item.shortSpecs}`.toLowerCase();
    const exactPn = item.partNumber.toLowerCase() === query.toLowerCase();
    const hits = terms.filter((term) => haystack.includes(term)).length;
    return {
      ...item,
      confidence: exactPn ? 0.98 : Math.min(0.92, 0.42 + hits * 0.14),
    };
  }).filter((item) => item.confidence > 0.42)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return res.status(200).json({
    modeUsed: /^[A-Z0-9#-]{5,25}$/i.test(query) ? 'pn' : 'keyword',
    matches: scored,
    bestMatchId: scored[0] && scored[0].id,
    bestMatchUrl: scored[0] && scored[0].url,
    notes: scored.length ? undefined : 'No demo catalog results found.',
  });
};
