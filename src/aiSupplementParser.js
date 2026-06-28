export const FIXED_CONSTRUCTION_CATEGORIES = [
  { categoryNo: 1, categoryName: '牆面地面' },
  { categoryNo: 2, categoryName: '客廳玄關' },
  { categoryNo: 3, categoryName: '臥室' },
  { categoryNo: 4, categoryName: '廁所' },
  { categoryNo: 5, categoryName: '廚房' },
  { categoryNo: 6, categoryName: '陽台' },
  { categoryNo: 7, categoryName: '窗戶' },
  { categoryNo: 8, categoryName: '注意事項' },
  { categoryNo: 9, categoryName: '其他' }
];

const CONSTRUCTION_RULES = [
  { categoryNo: 4, categoryName: '廁所', keywords: ['浴室', '廁所', '乾濕分離', '馬桶', '洗手台', '浴缸', '鏡子', '水垢', '皂垢', '發霉'], priority: 90 },
  { categoryNo: 5, categoryName: '廚房', keywords: ['廚房', '流理台', '瓦斯爐', '抽油煙機', '油垢', '櫥櫃', '烘碗機', '爐架'], priority: 88 },
  { categoryNo: 7, categoryName: '窗戶', keywords: ['窗戶', '玻璃', '窗框', '窗溝', '紗窗', '落地窗', '外窗', '摺紗'], priority: 86 },
  { categoryNo: 6, categoryName: '陽台', keywords: ['陽台', '排水孔', '欄杆'], priority: 84 },
  { categoryNo: 2, categoryName: '客廳玄關', keywords: ['客廳', '玄關', '大門', '門框', '插座', '開關面板', '鞋櫃'], priority: 82 },
  { categoryNo: 3, categoryName: '臥室', keywords: ['房間', '臥室', '主臥', '次臥', '衣櫃', '床架', '書桌', '窗台'], priority: 80 },
  { categoryNo: 1, categoryName: '牆面地面', keywords: ['牆面', '地面', '地板', '踢腳板', '粉塵'], priority: 78 },
  { categoryNo: 9, categoryName: '其他', keywords: ['窗簾', '捲簾', '百葉窗', '冷氣', '廢棄物', '垃圾', '自行清運', '移位', '老舊物品', '損壞', '自然耗損'], priority: 76 },
  { categoryNo: 8, categoryName: '注意事項', keywords: ['發霉', '除霉', '除黴', '除垢', '水垢', '油垢', '生鏽', '燒焦', '石材', '大理石', '無法100%', '安全考量', '現場狀況', '加價', '照片影片不同'], priority: 45 }
];

const CUSTOMER_LINE_PATTERN = /^(日期|有效日期至|有效日期|公司名稱|客戶公司名稱|統編|聯絡人|聯絡電話|電話|手機|社區|社區\/大樓|大樓|門牌|地址|地點|位置|房型|格局|型態|清潔類型)\s*[:：@]?/;
const NOISE_LINE_PATTERN = /^(場\s*#?\d+|清潔內容敘述|清潔重點|只清特別重點|裝潢細清|遷入清潔|遷出清潔|居家清潔|空屋清潔|無|\(?無\)?|.{1,8}(先生|小姐|太太))\s*[-:：@]*$/;
const PHONE_PATTERN = /(09\d{2}[-\s]?\d{3}[-\s]?\d{3}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{3,4})/;

function cleanValue(value) {
  return String(value || '')
    .replace(/^[@\s:：]+/, '')
    .replace(/[，,。；;]+$/g, '')
    .trim();
}

function lineValue(line, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`^${label}\\s*[:：@]?\\s*(.+)$`, 'i');
    const match = line.match(pattern);
    if (match?.[1]) return cleanValue(match[1]);
  }
  return '';
}

function normalizeDate(value) {
  const source = cleanValue(value);
  const match = source.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!match) return source;
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

function splitLines(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitConstructionSegments(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .split(/[\n。；;，,、]+/g)
    .map((segment) => segment.replace(/^[\s>*\-•●\d.、]+/, '').trim())
    .filter(Boolean)
    .filter((segment) => !CUSTOMER_LINE_PATTERN.test(segment))
    .filter((segment) => !NOISE_LINE_PATTERN.test(segment))
    .filter((segment) => !PHONE_PATTERN.test(segment));
}

function keywordScore(segment, keywords) {
  return keywords.reduce((score, keyword) => {
    if (!segment.includes(keyword)) return score;
    return score + (keyword.length >= 3 ? 2 : 1);
  }, 0);
}

function bestConstructionCategory(segment) {
  const scored = CONSTRUCTION_RULES
    .map((rule) => ({ ...rule, score: keywordScore(segment, rule.keywords) }))
    .filter((rule) => rule.score > 0)
    .sort((a, b) => b.score - a.score || b.priority - a.priority);

  if (!scored.length) return null;

  const physical = scored.find((rule) => rule.categoryNo !== 8);
  const top = physical || scored[0];
  return {
    categoryNo: top.categoryNo,
    categoryName: top.categoryName,
    confidence: Math.min(0.98, Number((0.62 + top.score * 0.08).toFixed(2)))
  };
}

function suggestedContent(segment) {
  const text = segment
    .replace(/\s+/g, '')
    .replace(/要清潔?|要擦拭?|要擦|需清潔?|需要清潔?/g, '清潔')
    .replace(/不用清潔?/g, '不清潔')
    .trim();
  if (!text) return '';
  return /[。.!！?？]$/.test(text) ? text : `${text}。`;
}

export function parseConstructionText(text) {
  const detectedItems = [];
  const unclassified = [];

  splitConstructionSegments(text).forEach((sourceText) => {
    const category = bestConstructionCategory(sourceText);
    if (!category) {
      unclassified.push(sourceText);
      return;
    }
    detectedItems.push({
      categoryNo: category.categoryNo,
      categoryName: category.categoryName,
      sourceText,
      suggestedContent: suggestedContent(sourceText),
      confidence: category.confidence
    });
  });

  return { detectedItems, unclassified };
}

export function parseCustomerText(text) {
  const result = {
    quoteDate: '',
    validUntil: '',
    companyName: '',
    taxId: '',
    contactName: '',
    contactPhone: '',
    community: '',
    roomSummary: '',
    houseType: '',
    address: '',
    unclassified: []
  };

  splitLines(text).forEach((line) => {
    const phone = line.match(PHONE_PATTERN)?.[1] || '';
    const contactWithPhone = line.match(/聯絡人\s*[:：@]?\s*([^\s，,。:：]+).*?(?:電話|手機)\s*[:：@]?\s*([0-9\-\s]+)/);

    if (contactWithPhone) {
      result.contactName ||= cleanValue(contactWithPhone[1]);
      result.contactPhone ||= cleanValue(contactWithPhone[2]).replace(/\s+/g, '');
      return;
    }

    const quoteDate = lineValue(line, ['日期']);
    if (quoteDate) {
      result.quoteDate ||= normalizeDate(quoteDate);
      return;
    }

    const validUntil = lineValue(line, ['有效日期至', '有效日期']);
    if (validUntil) {
      result.validUntil ||= normalizeDate(validUntil);
      return;
    }

    const companyName = lineValue(line, ['公司名稱', '客戶公司名稱']);
    if (companyName) {
      result.companyName ||= companyName;
      return;
    }

    const taxId = lineValue(line, ['統編']);
    if (taxId) {
      result.taxId ||= taxId.replace(/\D/g, '').slice(0, 8);
      return;
    }

    const contactName = lineValue(line, ['聯絡人']);
    if (contactName) {
      result.contactName ||= contactName;
      return;
    }

    const contactPhone = lineValue(line, ['聯絡電話', '電話', '手機']);
    if (contactPhone || phone) {
      result.contactPhone ||= cleanValue(contactPhone || phone).replace(/\s+/g, '');
      return;
    }

    const community = lineValue(line, ['社區', '社區/大樓', '大樓']);
    if (community) {
      result.community ||= community;
      if (!result.houseType) result.houseType = '社區大樓';
      return;
    }

    const address = lineValue(line, ['地址', '門牌', '地點', '位置']);
    if (address) {
      result.address ||= address;
      return;
    }

    const roomSummary = lineValue(line, ['房型', '格局']);
    if (roomSummary) {
      result.roomSummary ||= roomSummary;
      return;
    }

    const houseType = lineValue(line, ['型態']);
    if (houseType) {
      result.houseType ||= houseType;
      return;
    }

    if (/先生|小姐|太太/.test(line) && !result.contactName && !CUSTOMER_LINE_PATTERN.test(line)) {
      result.contactName = cleanValue(line);
      return;
    }

    if (!NOISE_LINE_PATTERN.test(line) && !bestConstructionCategory(line)) {
      result.unclassified.push(line);
    }
  });

  return result;
}

export function parseSupplementText(text) {
  return parseConstructionText(text);
}

export function categoryNameByNo(categoryNo) {
  return FIXED_CONSTRUCTION_CATEGORIES.find((category) => category.categoryNo === Number(categoryNo))?.categoryName || '其他';
}

export function categoryNoByName(categoryName) {
  return FIXED_CONSTRUCTION_CATEGORIES.find((category) => category.categoryName === categoryName)?.categoryNo || 9;
}
