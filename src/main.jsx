import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Camera, ChevronDown, GripVertical, Plus, ShieldCheck, Sparkles, SprayCan, UsersRound, X } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';
import './styles.css';
import { createNativeQuotePdf } from './nativePdf';
import { quoteLayoutConfig } from './layoutConfig';
import { themeConfig } from './themeConfig';
import { FIXED_CONSTRUCTION_CATEGORIES, categoryNameByNo, parseConstructionText, parseCustomerText } from './aiSupplementParser';
import { formatParagraphForOutput } from './textLayout';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function renderDaisySettingsIcon() {
  return (
    <svg
      className="daisy-settings-icon"
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
      role="img"
    >
      <defs>
        <filter id="daisyIconSoftShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2a3d22" floodOpacity="0.22" />
        </filter>
        <linearGradient id="daisyIconPetalFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="58%" stopColor="#f7fcfc" />
          <stop offset="100%" stopColor="#dceced" />
        </linearGradient>
        <radialGradient id="daisyIconCenterFill" cx="42%" cy="38%" r="64%">
          <stop offset="0%" stopColor="#ffe57b" />
          <stop offset="48%" stopColor="#f8bf28" />
          <stop offset="100%" stopColor="#d78f13" />
        </radialGradient>
      </defs>
      <g filter="url(#daisyIconSoftShadow)">
        <g fill="url(#daisyIconPetalFill)" stroke="#a9c7c8" strokeWidth="1.35" strokeLinejoin="round">
          <ellipse cx="48" cy="19.5" rx="7.8" ry="18.5" transform="rotate(2 48 19.5)" />
          <ellipse cx="48" cy="76.5" rx="7.8" ry="18.5" transform="rotate(178 48 76.5)" />
          <ellipse cx="19.5" cy="48" rx="18.5" ry="7.8" transform="rotate(-2 19.5 48)" />
          <ellipse cx="76.5" cy="48" rx="18.5" ry="7.8" transform="rotate(2 76.5 48)" />
          <ellipse cx="28" cy="27.5" rx="7.3" ry="18" transform="rotate(-43 28 27.5)" />
          <ellipse cx="68" cy="27.5" rx="7.3" ry="18" transform="rotate(43 68 27.5)" />
          <ellipse cx="28" cy="68.5" rx="7.3" ry="18" transform="rotate(43 28 68.5)" />
          <ellipse cx="68" cy="68.5" rx="7.3" ry="18" transform="rotate(-43 68 68.5)" />
          <ellipse cx="38" cy="21.5" rx="6.4" ry="17" transform="rotate(-18 38 21.5)" />
          <ellipse cx="58" cy="21.5" rx="6.4" ry="17" transform="rotate(18 58 21.5)" />
          <ellipse cx="38" cy="74.5" rx="6.4" ry="17" transform="rotate(18 38 74.5)" />
          <ellipse cx="58" cy="74.5" rx="6.4" ry="17" transform="rotate(-18 58 74.5)" />
          <ellipse cx="21.5" cy="38" rx="17" ry="6.4" transform="rotate(18 21.5 38)" />
          <ellipse cx="74.5" cy="38" rx="17" ry="6.4" transform="rotate(-18 74.5 38)" />
          <ellipse cx="21.5" cy="58" rx="17" ry="6.4" transform="rotate(-18 21.5 58)" />
          <ellipse cx="74.5" cy="58" rx="17" ry="6.4" transform="rotate(18 74.5 58)" />
        </g>
        <circle cx="48" cy="48" r="15.5" fill="url(#daisyIconCenterFill)" stroke="#c78312" strokeWidth="1.2" />
        <circle cx="42.5" cy="42.5" r="2.1" fill="#fff1ad" opacity="0.72" />
      </g>
    </svg>
  );
}

const constructionNoticePreviewConfig = quoteLayoutConfig.preview.constructionNotice;
const headerPreviewConfig = quoteLayoutConfig.preview.header;
const brandPreviewConfig = quoteLayoutConfig.preview.brand;
const quotePreviewLayoutStyle = {
  '--theme-primary': themeConfig.colors.primary,
  '--theme-primary-dark': themeConfig.colors.primaryDark,
  '--theme-primary-deep': themeConfig.colors.primaryDeep,
  '--theme-primary-light': themeConfig.colors.primaryLight,
  '--theme-primary-pale': themeConfig.colors.primaryPale,
  '--theme-warning': themeConfig.colors.warning,
  '--theme-warning-strong': themeConfig.colors.warningStrong,
  '--theme-danger': themeConfig.colors.danger,
  '--theme-danger-soft': themeConfig.colors.dangerSoft,
  '--theme-text': themeConfig.colors.text,
  '--theme-muted': themeConfig.colors.muted,
  '--theme-border': themeConfig.colors.border,
  '--theme-border-dark': themeConfig.colors.borderDark,
  '--theme-quote-gold': themeConfig.colors.quoteGold,
  '--theme-quote-gold-soft': themeConfig.colors.quoteGoldSoft,
  '--theme-sage': themeConfig.colors.sage,
  '--theme-sage-soft': themeConfig.colors.sageSoft,
  '--quote-header-columns': quoteLayoutConfig.preview.headerColumns,
  '--quote-header-section-padding-y': headerPreviewConfig.sectionPaddingY,
  '--quote-header-section-padding-x': headerPreviewConfig.sectionPaddingX,
  '--quote-header-notice-padding-x': headerPreviewConfig.noticePaddingX,
  '--quote-header-quotation-font-size': `${headerPreviewConfig.quotationFontSize}px`,
  '--quote-header-title-font-size': `${headerPreviewConfig.titleFontSize}px`,
  '--quote-header-title-line-height': headerPreviewConfig.titleLineHeight,
  '--quote-header-title-margin-bottom': headerPreviewConfig.titleMarginBottom,
  '--quote-header-reminder-margin': headerPreviewConfig.reminderMargin,
  '--quote-header-reminder-font-size': `${headerPreviewConfig.reminderFontSize}px`,
  '--quote-header-reminder-line-height': headerPreviewConfig.reminderLineHeight,
  '--quote-header-meta-font-size': `${headerPreviewConfig.metaFontSize}px`,
  '--quote-header-meta-columns': headerPreviewConfig.metaColumns,
  '--quote-header-meta-cell-min-height': `${headerPreviewConfig.metaCellMinHeight}px`,
  '--quote-header-meta-cell-padding-y': headerPreviewConfig.metaCellPaddingY,
  '--quote-header-meta-cell-padding-x': headerPreviewConfig.metaCellPaddingX,
  '--quote-brand-logo-width': `${brandPreviewConfig.logoWidth}px`,
  '--quote-brand-logo-height': `${brandPreviewConfig.logoHeight}px`,
  '--quote-brand-name-font-size': `${brandPreviewConfig.nameFontSize}px`,
  '--quote-brand-site-font-size': `${brandPreviewConfig.siteFontSize}px`,
  '--quote-brand-site-line-height': `${brandPreviewConfig.siteLineHeight}px`,
  '--quote-brand-site-max-width': `${brandPreviewConfig.siteMaxWidth}px`,
  '--quote-brand-secondary-qr-size': `${brandPreviewConfig.secondaryQrSize}px`,
  '--quote-brand-primary-qr-size': `${brandPreviewConfig.primaryQrSize}px`,
  '--quote-brand-qr-gap': `${brandPreviewConfig.qrGap}px`,
  '--quote-brand-secondary-margin-bottom': `${brandPreviewConfig.secondaryMarginBottom}px`,
  '--construction-notice-title-font-size': `${constructionNoticePreviewConfig.titleFontSize}px`,
  '--construction-notice-title-padding-bottom': `${constructionNoticePreviewConfig.titlePaddingBottom}px`,
  '--construction-notice-list-gap': `${constructionNoticePreviewConfig.listGap}px`,
  '--construction-notice-list-margin-top': `${constructionNoticePreviewConfig.listMarginTop}px`,
  '--construction-notice-card-icon-column': `${constructionNoticePreviewConfig.cardIconColumn}px`,
  '--construction-notice-card-min-height': `${constructionNoticePreviewConfig.cardMinHeight}px`,
  '--construction-notice-copy-padding': constructionNoticePreviewConfig.cardCopyPadding,
  '--construction-notice-heading-font-size': `${constructionNoticePreviewConfig.cardTitleFontSize}px`,
  '--construction-notice-text-font-size': `${constructionNoticePreviewConfig.cardTextFontSize}px`,
  '--construction-notice-text-line-height': constructionNoticePreviewConfig.cardTextLineHeight
};
const constructionItemsPreviewConfig = quoteLayoutConfig.preview.constructionItems;
const quoteItemsLayoutStyle = {
  '--quote-item-columns': constructionItemsPreviewConfig.columns,
  '--quote-item-row-min-height': `${constructionItemsPreviewConfig.rowMinHeight}px`,
  '--quote-item-cell-line-height': constructionItemsPreviewConfig.cellLineHeight,
  '--quote-item-number-padding': constructionItemsPreviewConfig.numberPadding,
  '--quote-item-area-padding': constructionItemsPreviewConfig.areaPadding,
  '--quote-item-detail-padding': constructionItemsPreviewConfig.detailPadding,
  '--quote-item-area-letter-spacing': constructionItemsPreviewConfig.areaLetterSpacing,
  '--quote-item-detail-white-space': constructionItemsPreviewConfig.detailWhiteSpace,
  '--quote-item-title-padding-y': `${constructionItemsPreviewConfig.titleBarPaddingY}rem`,
  '--quote-item-title-font-size': `${constructionItemsPreviewConfig.titleBarFontSize}rem`
};
const feeSummaryPreviewConfig = quoteLayoutConfig.preview.feeSummary;
const feeSummaryLayoutStyle = {
  '--qbf-summary-columns': feeSummaryPreviewConfig.columns,
  '--qbf-fee-grid-rows': feeSummaryPreviewConfig.feeGridRows,
  '--qbf-fee-cards-columns': feeSummaryPreviewConfig.feeCardsColumns,
  '--qbf-fee-card-padding': feeSummaryPreviewConfig.feeCardPadding,
  '--qbf-fee-name-margin-bottom': `${feeSummaryPreviewConfig.feeNameMarginBottom}px`,
  '--qbf-fee-name-font-size': `${feeSummaryPreviewConfig.feeNameFontSize}px`,
  '--qbf-fee-table-font-size': `${feeSummaryPreviewConfig.feeTableFontSize}px`,
  '--qbf-fee-table-gap': `${feeSummaryPreviewConfig.feeTableGap}px`,
  '--qbf-fee-row-columns': feeSummaryPreviewConfig.feeRowColumns,
  '--qbf-fee-row-min-height': `${feeSummaryPreviewConfig.feeRowMinHeight}px`,
  '--qbf-fee-cell-padding-x': `${feeSummaryPreviewConfig.feeCellPaddingX}px`,
  '--qbf-total-row-min-height': `${feeSummaryPreviewConfig.totalRowMinHeight}px`,
  '--qbf-total-font-size': `${feeSummaryPreviewConfig.totalFontSize}px`,
  '--qbf-total-gap': `${feeSummaryPreviewConfig.totalGap}px`,
  '--qbf-total-letter-spacing': feeSummaryPreviewConfig.totalLetterSpacing,
  '--qbf-total-badge-font-size': `${feeSummaryPreviewConfig.totalBadgeFontSize}px`,
  '--qbf-total-badge-padding': feeSummaryPreviewConfig.totalBadgePadding,
  '--qbf-total-badge-radius': `${feeSummaryPreviewConfig.totalBadgeRadius}px`,
  '--qbf-installment-columns': feeSummaryPreviewConfig.installmentColumns,
  '--qbf-installment-row-min-height': `${feeSummaryPreviewConfig.installmentRowMinHeight}px`,
  '--qbf-installment-font-size': `${feeSummaryPreviewConfig.installmentFontSize}px`,
  '--qbf-fee-red': feeSummaryPreviewConfig.red,
  '--qbf-total-red': feeSummaryPreviewConfig.totalRed,
  '--qbf-fee-line-height': feeSummaryPreviewConfig.lineHeight,
  '--qbf-title-min-height': `${feeSummaryPreviewConfig.titleMinHeight}px`
};
const termsSignaturePreviewConfig = quoteLayoutConfig.preview.termsSignature;
const termsSignatureLayoutStyle = {
  '--qbf-terms-grid-rows': termsSignaturePreviewConfig.termsGridRows,
  '--qbf-term-list-rows': termsSignaturePreviewConfig.termListRows,
  '--qbf-term-row-columns': termsSignaturePreviewConfig.termRowColumns,
  '--qbf-term-row-gap': `${termsSignaturePreviewConfig.termRowGap}px`,
  '--qbf-term-cell-padding-x': `${termsSignaturePreviewConfig.termCellPaddingX}px`,
  '--qbf-term-cell-font-size': `${termsSignaturePreviewConfig.termCellFontSize}px`,
  '--qbf-term-cell-line-height': termsSignaturePreviewConfig.termCellLineHeight,
  '--qbf-term-note-gap': `${termsSignaturePreviewConfig.termNoteGap}px`,
  '--qbf-term-note-font-size': `${termsSignaturePreviewConfig.termNoteFontSize}px`,
  '--qbf-term-note-line-height': termsSignaturePreviewConfig.termNoteLineHeight,
  '--qbf-term-note-padding': termsSignaturePreviewConfig.termNotePadding,
  '--qbf-main-min-height': `${termsSignaturePreviewConfig.mainMinHeight}px`,
  '--qbf-signature-columns': termsSignaturePreviewConfig.signatureColumns,
  '--qbf-signature-card-padding': termsSignaturePreviewConfig.signatureCardPadding,
  '--qbf-signature-area-min-height': `${termsSignaturePreviewConfig.signatureAreaMinHeight}px`,
  '--qbf-signature-area-padding': `${termsSignaturePreviewConfig.signatureAreaPadding}px`,
  '--qbf-signature-line-padding-top': `${termsSignaturePreviewConfig.signatureLinePaddingTop}px`,
  '--qbf-export-term-row-columns': termsSignaturePreviewConfig.exportTermRowColumns,
  '--qbf-export-term-cell-font-size': `${termsSignaturePreviewConfig.exportTermCellFontSize}px`,
  '--qbf-export-term-cell-padding-x': `${termsSignaturePreviewConfig.exportTermCellPaddingX}px`,
  '--qbf-export-term-note-padding': termsSignaturePreviewConfig.exportTermNotePadding,
  '--qbf-export-term-note-font-size': `${termsSignaturePreviewConfig.exportTermNoteFontSize}px`,
  '--qbf-export-term-note-line-height': termsSignaturePreviewConfig.exportTermNoteLineHeight,
  '--qbf-export-signature-card-padding': termsSignaturePreviewConfig.exportSignatureCardPadding,
  '--qbf-export-signature-area-min-height': `${termsSignaturePreviewConfig.exportSignatureAreaMinHeight}px`
};
const bottomSummaryLayoutStyle = {
  ...feeSummaryLayoutStyle,
  ...termsSignatureLayoutStyle
};

const DEFAULT_CATEGORIES = ['牆面地面', '客廳玄關', '臥室', '廁所', '廚房', '陽台', '窗戶', '注意事項', '其他'];
const DEFAULT_CATEGORY_CONFIG = DEFAULT_CATEGORIES.map((category) => ({ key: category, label: category }));
const BLANK_CASE_CATEGORY_CONFIG = DEFAULT_CATEGORY_CONFIG.filter((category) => category.key !== '其他');
const CLEANING_TEMPLATE_OPTIONS = ['裝潢細清', '遷入清潔', '遷出清潔', '居家清潔', '空屋清潔', '店面清潔', '其他'];
const LONG_CONTENT_CATEGORIES = new Set(['窗戶', '注意事項', '其他']);
const INNER_OUTER_SCOPE_KEYWORDS = ['櫃體', '玻璃', '門片', '窗框', '抽屜', '流理台'];

const categoryRules = [
  { category: '牆面地面', keywords: ['牆', '壁', '地', '地板', '磁磚', '油漆', '壁癌', '踢腳', '天花'] },
  { category: '客廳玄關', keywords: ['客廳', '玄關', '鞋櫃', '電視牆', '沙發', '大門', '門口'] },
  { category: '臥室', keywords: ['臥室', '房間', '主臥', '次臥', '床', '衣櫃', '書房'] },
  { category: '廁所', keywords: ['廁所', '浴室', '衛浴', '馬桶', '洗手台', '淋浴', '乾濕', '排水'] },
  { category: '廚房', keywords: ['廚房', '流理台', '瓦斯', '抽油煙', '櫥櫃', '水槽', '爐'] },
  { category: '陽台', keywords: ['陽台', '後陽台', '前陽台', '曬衣', '洗衣機'] },
  { category: '窗戶', keywords: ['窗', '窗戶', '紗窗', '玻璃', '窗框', '落地窗'] },
  { category: '注意事項', keywords: ['注意', '提醒', '限制', '不可', '需確認', '待確認', '管委會', '電梯', '施工時間'] }
];

const STANDARD_NOTICE_ITEMS = [
  '廁所乾濕分離門如有發霉、髒污及水垢皂垢，管家都會盡量清潔，但可能無法100%去除還原。',
  '石材檯面材質可能有水垢沉積，無法保證100%去除還原。',
  '廚房重度油垢、瓦斯爐架生鏽或燒焦痕跡，可能無法100%去除還原。',
  '大理石如需拋光需尋求專業廠商。'
];

const STANDARD_OTHER_ITEMS = [
  '施作內容不包含窗簾、捲簾、百葉窗。',
  '廢棄物僅協助集中整理，不含清運。',
  '若現場狀況與場勘照片或影片不同，需加時或調整費用時將另行說明。',
  '如有疑問歡迎於Line商家提出。'
];

const TEMPLATE_NOTICE_DETAIL = `• 廁所乾濕分離門如有發霉、髒污及水垢皂垢管家都會盡量清潔，但可能無法100%去除還原。
• 石材檯面材質，水中的鈣、鎂礦物質會在水蒸發後沉澱在石材表面形成水垢，部分表面會有這個情形，無法保證100%去除還原。
• 廚房重度油垢如已經結成油塊、瓦斯爐架如已經生鏽、有燒焦痕跡、可能無法100%去除還原。
• 大理石為特殊石材，如需拋光需尋求專業廠商`;

const TEMPLATE_OTHER_DETAIL = `• 廢棄物: 管家僅協助整理集中，屋主需自備垃圾袋及自行清運。
• 燈具、玻璃有使用年限，容易老舊脆化造成。僅以灰塵撢除塵方式進行。
• 如物品老舊或是已不堪使用，可能導致破損或損壞，清潔前請先行知會。
• 另天然因素損壞如：油漆、磁磚、水泥、水管、燈飾...等，因熱脹冷縮或自然災害而導致龜裂、剝落之情形，或金屬因潮濕或使用年限久遠而生鏽斷裂...等，如業主堅持清潔，微笑清家恕不賠償。`;

const CLEANING_TEMPLATES = {
  裝潢細清: {
    title: '裝潢細清 估價單',
    items: {
      牆面地面: '全室地板掃拖清潔，全室牆面除塵。',
      客廳玄關: '全室門片門框擦拭、全室牆面除塵、全室櫃體內外.平面.桌面擦拭(需協助撕保護膜)',
      臥室: '臥室門片、門框、櫃體內外、層板、平面、桌面擦拭(需協助撕保護膜)。',
      廁所: `廁所天花板、牆面、洗手台、乾溼分離玻璃、浴缸、馬桶、鏡子(鏡面及請小心處理)、抽風機排風口清潔。
需協助撕保護膜、除粉塵`,
      廚房: '廚房櫃體內外擦拭、牆面、烤漆玻璃、檯面、流理台、烘碗機、瓦斯爐、抽油煙機清潔、需除塵。',
      陽台: '陽台地板、牆面可及處、欄杆、排水孔與曬衣桿清潔。',
      窗戶: `全室玻璃、窗框、窗溝、紗窗清潔。
(外窗管家以工具輔助會盡量清潔，無法100%無水痕殘留，如遇直角式窗戶無開窗縫，則以內窗、窗框溝施作為主)
• 安全考量: 窗戶會視情況是否拆窗施作，多數大樓窗戶比載重，如拆下有危險性，則以不拆窗施作。
• 如有窗戶紗窗為摺紗，因摺紗脆弱易損壞，故管家僅能以除塵撢除去灰塵，可能無法100%乾淨。
• 施作地點為高危險之處(如外窗、陽台、邊雨棚...)，或是無立足點、欄杆低於腰部...等部分，不在服務範圍內，管家請勿以輔助工具施作`,
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
    }
  },
  遷入清潔: {
    title: '遷入清潔 估價單',
    items: {
      牆面地面: '全室地板掃拖清潔。',
      客廳玄關: '大門、門框、開關面板、家具表面擦拭。',
      臥室: '門片及大門擦拭、全室櫃體內外擦拭、家具表面擦拭。',
      廁所: '廁所天花板、牆面、洗手台、乾濕分離玻璃、馬桶、鏡子、抽風機排風口清潔。需除黴除垢。',
      廚房: '廚房櫃體內外擦拭、牆面、檯面、流理台、烘碗機、爐具外觀清潔。',
      陽台: '陽台地板掃拖清潔。',
      窗戶: '玻璃、窗框、窗溝、紗窗清潔。',
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
    }
  },
  遷出清潔: {
    title: '遷出清潔 估價單',
    items: {
      牆面地面: '全室地板掃拖清潔、踢腳板與牆面可及處擦拭。',
      客廳玄關: '大門、門框、開關面板、玄關櫃、客廳櫃體與家具表面擦拭。',
      臥室: '臥室門片、門框、衣櫃內外、窗台與家具表面擦拭。',
      廁所: '廁所天花板、牆面、洗手台、馬桶、鏡子、乾濕分離玻璃、排風口清潔，水垢皂垢盡量處理。',
      廚房: '廚房櫃體內外、牆面、檯面、流理台、爐具外觀與抽油煙機外觀油污清潔。',
      陽台: '陽台地板、欄杆、排水孔、洗衣機周邊可及處掃拖清潔。',
      窗戶: '玻璃、窗框、窗溝、紗窗清潔。',
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
    }
  },
  居家清潔: {
    title: '居家清潔 估價單',
    items: {
      牆面地面: '全室地板掃拖、踢腳板與可及牆面表面擦拭。',
      客廳玄關: '玄關、大門、開關面板、桌面、櫃體外觀與家具表面擦拭整理。',
      臥室: '臥室地板、門片、家具表面、床邊與櫃體外觀擦拭。',
      廁所: '洗手台、鏡面、馬桶、淋浴區、地面、排水孔與可及牆面清潔。',
      廚房: '檯面、流理台、爐具外觀、櫃體外觀、牆面局部油污與地面清潔。',
      陽台: '陽台地板掃拖、欄杆與洗衣機周邊可及處擦拭。',
      窗戶: '窗台、窗框可及處與玻璃局部擦拭。',
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
    }
  },
  空屋清潔: {
    title: '空屋清潔 估價單',
    items: {
      牆面地面: '全室地板掃拖、踢腳板、牆面可及處與角落落塵清潔。',
      客廳玄關: '大門、門框、玄關櫃、客廳櫃體內外、開關面板與窗台擦拭。',
      臥室: '臥室門片、門框、櫃體內外、層板、窗台與地面清潔。',
      廁所: '廁所天花板、牆面、洗手台、馬桶、鏡子、乾濕分離玻璃、排風口與地面清潔。',
      廚房: '廚房櫃體內外、流理台、檯面、牆面、爐具外觀、烘碗機與地面清潔。',
      陽台: '陽台地板、牆面可及處、欄杆、排水孔與曬衣桿清潔。',
      窗戶: '全室玻璃、窗框、窗溝、紗窗清潔。',
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
    }
  },
  其他: {
    title: '清潔服務 估價單',
    items: {
      牆面地面: '依現場需求確認牆面、地面、踢腳板與可及處清潔範圍。',
      客廳玄關: '依現場需求確認大門、玄關、客廳櫃體與家具表面清潔範圍。',
      臥室: '依現場需求確認臥室門片、櫃體、家具表面與地面清潔範圍。',
      廁所: '依現場需求確認衛浴設備、牆面、地面、玻璃與五金清潔範圍。',
      廚房: '依現場需求確認廚房櫃體、檯面、流理台、爐具與牆面清潔範圍。',
      陽台: '依現場需求確認陽台地板、欄杆、排水孔與可及處清潔範圍。',
      窗戶: '依現場需求確認玻璃、窗框、窗溝與紗窗清潔範圍。',
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
    }
  }
};

CLEANING_TEMPLATES.店面清潔 = {
  title: '店面清潔 估價單',
  items: { ...CLEANING_TEMPLATES.空屋清潔.items }
};

function numberedList(items) {
  return items.map((item, index) => `${index + 1} ${item}`).join('\n');
}

function buildStandardSpecialNotes() {
  return numberedList([...STANDARD_NOTICE_ITEMS, ...STANDARD_OTHER_ITEMS]);
}

function createContentId() {
  return `content-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hashText(value) {
  return Array.from(String(value || '')).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0).toString(36).replace('-', 'm');
}

function createContentItem(text = '', options = {}) {
  const rawText = String(text || '').trim();
  return {
    id: options.id || createContentId(),
    text: stripColorTags(rawText),
    enabled: options.enabled !== false,
    custom: Boolean(options.custom),
    type: options.type || 'tag',
    deleted: Boolean(options.deleted),
    red: options.red === true || /\[color=#[0-9a-fA-F]{6}\]/.test(rawText),
    strike: Boolean(options.strike),
    scope: options.scope || { inner: true, outer: true }
  };
}

function scopeKeywordForText(text) {
  const source = String(text || '');
  return INNER_OUTER_SCOPE_KEYWORDS.find((keyword) => source.includes(keyword));
}

function supportsInnerOuterScope(content) {
  return content?.type !== 'paragraph' && Boolean(scopeKeywordForText(content?.text));
}

function normalizedScope(scope) {
  const next = {
    inner: scope?.inner !== false,
    outer: scope?.outer !== false
  };
  return next.inner || next.outer ? next : { inner: true, outer: true };
}

function scopeText(scope) {
  const next = normalizedScope(scope);
  if (next.inner && next.outer) return '內外';
  return next.inner ? '內' : '外';
}

function applyInnerOuterScope(text, content) {
  if (!supportsInnerOuterScope(content)) return text;
  const keyword = scopeKeywordForText(text);
  if (!keyword) return text;
  const selected = scopeText(content.scope);
  const source = String(text || '');
  if (source.includes('內外')) return source.replace('內外', selected);
  const scopedKeywordPattern = new RegExp(`${keyword}[內外]`);
  if (scopedKeywordPattern.test(source)) return source.replace(scopedKeywordPattern, `${keyword}${selected}`);
  return source.replace(keyword, `${keyword}${selected}`);
}

function contentTypeForCategory() {
  return 'tag';
}

function splitDetailToTokens(detail, type = 'tag') {
  const lines = String(detail || '')
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*•・]|\d+[.、])\s*/, '').trim())
    .filter(Boolean);
  if (type === 'paragraph') return lines;
  return lines
    .flatMap((line) => line.split(/[、，,；;。]+/))
    .map((line) => line.replace(/^\s*(?:[-*•・]|\d+[.、])\s*/, '').replace(/[，,。；;：:]+$/g, '').trim())
    .filter(Boolean);
}

function isParagraphLine(line, category) {
  if (!LONG_CONTENT_CATEGORIES.has(category)) return false;
  return /^\s*[*•・(（]/.test(line) || /安全考量|廢棄物|無法100%|不在服務範圍|不賠償|石材|水垢|油垢/.test(line) || line.length > 42;
}

function splitBulletParagraphLines(detail) {
  return String(detail || '')
    .replace(/\r/g, '')
    .split(/\n+/)
    .flatMap((line) =>
      line
        .replace(/([^\n])\s*([•*])\s+/g, '$1\n$2 ')
        .split('\n')
    )
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitDetailToContentItems(detail, options = {}) {
  if (!options.type && LONG_CONTENT_CATEGORIES.has(options.category)) {
    const lines = splitBulletParagraphLines(detail);
    return lines.flatMap((line, lineIndex) => {
      const cleanedLine = line.replace(/^\s*(?:[-*•・]|\d+[.、])\s*/, '').trim();
      const inferredType = isParagraphLine(line, options.category) ? 'paragraph' : 'tag';
      if (inferredType === 'paragraph') {
        return [createContentItem(cleanedLine, { ...options, type: 'paragraph', id: options.id || `content-${hashText(cleanedLine)}-${lineIndex}` })];
      }
      return splitDetailToTokens(line, 'tag').map((text, tokenIndex) =>
        createContentItem(text, { ...options, type: 'tag', id: options.id || `content-${hashText(text)}-${lineIndex}-${tokenIndex}` })
      );
    });
  }
  const type = options.type || contentTypeForCategory(options.category);
  const normalized = splitDetailToTokens(detail, type);
  return normalized.map((text, index) => createContentItem(text, { ...options, id: options.id || `content-${hashText(text)}-${index}` }));
}

function normalizeContentItems(item) {
  const type = contentTypeForCategory(item?.area);
  if (Array.isArray(item?.contents)) {
    return item.contents
      .flatMap((content) => {
        const normalized = createContentItem(content.text, { type: content.type || type, ...content });
        const shouldSplitLoadedTag = normalized.type === 'tag' && normalized.custom !== true && /[、，,；;。]/.test(normalized.text);
        return shouldSplitLoadedTag
          ? splitDetailToContentItems(normalized.text, {
              category: item?.area,
              type: normalized.type,
              custom: normalized.custom,
              enabled: normalized.enabled,
              deleted: normalized.deleted,
              red: normalized.red,
              strike: normalized.strike
            })
          : [normalized];
      });
  }
  return splitDetailToContentItems(item?.detail || '', { custom: Boolean(item?.custom), category: item?.area, type });
}

function strikeThroughText(text) {
  return Array.from(String(text || '')).map((char) => (/\s/.test(char) ? char : `${char}\u0336`)).join('');
}

function contentItemsToDetail(contents, { enabledOnly = false, emptyText = '' } = {}) {
  const filtered = enabledOnly ? contents.filter((content) => content.enabled !== false && !content.deleted) : contents;
  const source = [
    ...filtered.filter((content) => content.type !== 'paragraph'),
    ...filtered.filter((content) => content.type === 'paragraph')
  ];
  const lines = [];
  let tagBuffer = [];
  source.forEach((content) => {
    const scopedText = applyInnerOuterScope(content.text, content);
    const baseText = content.strike ? strikeThroughText(scopedText) : scopedText;
    if (content.type === 'paragraph') {
      if (tagBuffer.length) {
        lines.push(tagBuffer.join('、'));
        tagBuffer = [];
      }
      const paragraphText = formatParagraphForOutput(baseText);
      const styledText = content.red ? `[color=#d71920]${paragraphText}[/color]` : paragraphText;
      if (paragraphText) lines.push(styledText);
      return;
    }
    const styledText = content.red ? `[color=#d71920]${baseText}[/color]` : baseText;
    if (styledText) tagBuffer.push(styledText);
  });
  if (tagBuffer.length) lines.push(tagBuffer.join('、'));
  const text = lines.filter(Boolean).join('\n');
  return text || emptyText;
}

function templateItemsToRows(template) {
  return DEFAULT_CATEGORY_CONFIG.map((category) => ({
    area: category.key,
    detail: template?.items?.[category.key] || '',
    contents: splitDetailToContentItems(template?.items?.[category.key] || '', { category: category.key })
  }));
}

function otherTemplateItemsToRows() {
  return DEFAULT_CATEGORY_CONFIG.map((category) => {
    const detail =
      category.key === '注意事項'
        ? TEMPLATE_NOTICE_DETAIL
        : category.key === '其他'
          ? TEMPLATE_OTHER_DETAIL
          : '';
    return {
      area: category.key,
      detail,
      contents: splitDetailToContentItems(detail, { category: category.key })
    };
  });
}

const COMPANY_TEMPLATE_STORAGE_KEY = 'meant2clean.companyTemplates.v2';
const LEGACY_COMPANY_TEMPLATE_STORAGE_KEY = 'meant2clean.companyDefaultTemplate.v1';
const CASE_STORAGE_KEY = 'meant2clean.savedCases.v1';

function cloneCategoryConfig(categoryConfig = []) {
  return categoryConfig.map((category) => ({
    key: category.key,
    label: category.label || category.key,
    enabled: category.enabled !== false
  }));
}

function normalizeTemplateContents(item) {
  return normalizeContentItems(item).map((content) =>
    createContentItem(content.text, {
      ...content,
      id: content.id || createContentId(),
      scope: normalizedScope(content.scope)
    })
  );
}

function cloneTemplateItems(items = []) {
  return items.map((item) => {
    const contents = normalizeTemplateContents(item).filter((content) => !content.deleted);
    return {
      area: item.area,
      detail: contentItemsToDetail(contents),
      custom: Boolean(item.custom),
      contents
    };
  });
}

function createCompanyTemplateSnapshot(form, items, categoryConfig) {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    cleaningType: form.cleaningType || '',
    title: form.title || '',
    categoryConfig: cloneCategoryConfig(categoryConfig),
    items: cloneTemplateItems(items)
  };
}

function normalizeCompanyTemplate(rawTemplate) {
  if (!rawTemplate || !Array.isArray(rawTemplate.items)) return null;
  const categoryConfig = Array.isArray(rawTemplate.categoryConfig)
    ? cloneCategoryConfig(rawTemplate.categoryConfig)
    : cloneCategoryConfig(DEFAULT_CATEGORY_CONFIG);
  const items = cloneTemplateItems(rawTemplate.items).filter((item) => item.area);
  return {
    version: 1,
    savedAt: rawTemplate.savedAt || new Date().toISOString(),
    cleaningType: rawTemplate.cleaningType || '',
    title: rawTemplate.title || '',
    categoryConfig: categoryConfig.length ? categoryConfig : cloneCategoryConfig(DEFAULT_CATEGORY_CONFIG),
    items
  };
}

function normalizeCompanyTemplateStore(rawStore) {
  const templates = {};
  if (rawStore?.templates && typeof rawStore.templates === 'object') {
    Object.entries(rawStore.templates).forEach(([key, template]) => {
      const normalized = normalizeCompanyTemplate(template);
      if (key && normalized) templates[key] = normalized;
    });
  }
  return {
    version: 2,
    savedAt: rawStore?.savedAt || new Date().toISOString(),
    templates
  };
}

function readCompanyTemplateStore() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COMPANY_TEMPLATE_STORAGE_KEY);
    if (raw) return normalizeCompanyTemplateStore(JSON.parse(raw));
    const legacyRaw = window.localStorage.getItem(LEGACY_COMPANY_TEMPLATE_STORAGE_KEY);
    const legacyTemplate = legacyRaw ? normalizeCompanyTemplate(JSON.parse(legacyRaw)) : null;
    if (!legacyTemplate?.cleaningType) return normalizeCompanyTemplateStore({});
    return normalizeCompanyTemplateStore({
      templates: {
        [legacyTemplate.cleaningType]: legacyTemplate
      }
    });
  } catch {
    return normalizeCompanyTemplateStore({});
  }
}

function writeCompanyTemplateStore(store) {
  if (typeof window === 'undefined') return false;
  const normalized = normalizeCompanyTemplateStore(store);
  window.localStorage.setItem(COMPANY_TEMPLATE_STORAGE_KEY, JSON.stringify(normalized, null, 2));
  return true;
}

function getCompanyTemplateForType(cleaningType) {
  if (!cleaningType) return null;
  return readCompanyTemplateStore()?.templates?.[cleaningType] || null;
}

function writeCompanyTemplateForType(cleaningType, template) {
  if (!cleaningType) return false;
  const normalized = normalizeCompanyTemplate(template);
  if (!normalized) return false;
  const store = readCompanyTemplateStore() || normalizeCompanyTemplateStore({});
  store.templates = { ...store.templates, [cleaningType]: normalized };
  store.savedAt = new Date().toISOString();
  return writeCompanyTemplateStore(store);
}

function clearCompanyTemplates() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(COMPANY_TEMPLATE_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_COMPANY_TEMPLATE_STORAGE_KEY);
}

function readSavedCaseStore() {
  if (typeof window === 'undefined') return { version: 1, cases: {} };
  try {
    const raw = window.localStorage.getItem(CASE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      version: 1,
      cases: parsed?.cases && typeof parsed.cases === 'object' ? parsed.cases : {}
    };
  } catch {
    return { version: 1, cases: {} };
  }
}

function listSavedCases() {
  const store = readSavedCaseStore();
  return Object.values(store.cases || {}).sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')));
}

function writeSavedCaseStore(store) {
  if (typeof window === 'undefined') return false;
  window.localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify({ version: 1, cases: store.cases || {} }, null, 2));
  return true;
}

function caseDateForName(form) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(form.serviceDate || '')) return form.serviceDate;
  if (/^\d{4}-\d{2}-\d{2}$/.test(form.quoteDate || '')) return form.quoteDate;
  return todayString();
}

function createCaseName(form) {
  const customerLabel = stripColorTags(form.contact || form.company || '').trim();
  return [caseDateForName(form), stripColorTags(form.building || '').trim(), customerLabel]
    .filter(Boolean)
    .join('｜');
}

function createCaseSnapshot({ id, name, form, items, categoryConfig, savedAt }) {
  return {
    id,
    name,
    savedAt,
    form,
    categoryConfig: cloneCategoryConfig(categoryConfig),
    items: cloneTemplateItems(items)
  };
}

function createNewCaseState() {
  return {
    form: createEmptyForm(),
    categoryConfig: BLANK_CASE_CATEGORY_CONFIG,
    items: []
  };
}

function cleaningTypeSelectValue(cleaningType) {
  if (!cleaningType) return '';
  return CLEANING_TEMPLATE_OPTIONS.includes(cleaningType) ? cleaningType : '其他';
}

function customCleaningTypeValue(cleaningType) {
  return cleaningType && !CLEANING_TEMPLATE_OPTIONS.includes(cleaningType) ? cleaningType : '';
}

const defaultCleaningType = '';
const defaultSpecialNotes = buildStandardSpecialNotes();
const defaultConstructionNotes = `• 本估價單為含耗材與清潔工具之專業報價。
• 裝潢細清為團隊合作工程，所有管家同進同出，
確保施工品質與驗收一致性。
• 施作後屋主可現場驗收
若有遺漏可立即補強處理。
• [color=#d71920]若施作當日現場狀況與場勘或業主提供的[/color]
[color=#d71920]照片/影片不同，若需加時或調整費用，[/color]
[color=#d71920]將於當日與屋主說明並確認後再行處理。[/color]`;

const defaultTerms = `1. 付款條件：待確認。
2. 付款期限：施作完畢後付款，匯費勿內扣。
3. 施作日期：待確認。
驗收完畢完成驗收通過，視同完成通過驗收，事後無法要求再回現場進行二次清潔。`;

const defaultPaymentNote = `戶名：待確認
銀行：待確認
帳號：待確認
匯款後請提供末五碼，以利對帳。`;

const PAYMENT_CONDITIONS = ['匯款', '現金', '其他'];
const PDF_IMPORT_START = 'SITE_QUOTE_IMPORT_START';
const PDF_IMPORT_END = 'SITE_QUOTE_IMPORT_END';

function todayString() {
  return dateOffsetString(0);
}

function dateOffsetString(days) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

const emptyForm = {
  title: '清潔服務 估價單',
  cleaningType: defaultCleaningType,
  company: '',
  taxId: '',
  contact: '',
  phone: '',
  building: '',
  address: '',
  constructionNotes: defaultConstructionNotes,
  roomSummary: '',
  projectType: '',
  quoteDate: todayString(),
  validUntil: dateOffsetString(3),
  serviceDate: '待訂',
  serviceStartTime: '',
  serviceEndTime: '',
  paymentCondition: '匯款',
  paymentConditionOther: '',
  paymentDeadline: '施作完畢後付款，匯費勿內扣。',
  serviceFeeLabel: '清潔費用 A',
  serviceSubtotal: '',
  serviceTax: '',
  serviceTotal: '',
  cleaningFeeLabel: '清潔費用 B',
  cleaningSubtotal: '',
  cleaningTax: '',
  cleaningTotal: '',
  deposit: '',
  balance: '',
  specialNotes: defaultSpecialNotes,
  terms: defaultTerms,
  paymentNote: defaultPaymentNote,
  rawText: ''
};

function createEmptyForm() {
  return {
    ...emptyForm,
    quoteDate: todayString(),
    validUntil: dateOffsetString(3),
    serviceDate: '待訂',
    serviceStartTime: '',
    serviceEndTime: ''
  };
}

function pending(value) {
  return value?.trim() || '';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stripColorTags(value) {
  return String(value).replace(/\[color=#[0-9a-fA-F]{6}\]([\s\S]*?)\[\/color\]/g, '$1');
}

function richTextHtml(value) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\[color=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/color\]/g, '<span style="color:$1;font-weight:700;">$2</span>')
    .replace(/\n/g, '<br>');
}

function printItemRowHtml(row) {
  const highlighted = Number(row.number) >= 8 ? 'highlight' : '';
  return `<div class="print-item-row ${highlighted}"><div class="print-item-cell no">${row.number}</div><div class="print-item-cell area">${escapeHtml(row.area)}</div><div class="print-item-cell">${richTextHtml(row.detail)}</div></div>`;
}

function rgbToHex(value) {
  if (!value) return '';
  if (value.startsWith('#')) return value.slice(0, 7);
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return '';
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
}

function htmlToRichText(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
    if (node.nodeName === 'BR') return '\n';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const element = node;
    const text = Array.from(element.childNodes).map(walk).join('');
    const color = rgbToHex(element.style?.color || element.getAttribute?.('color') || '');
    const blockBreak = ['DIV', 'P'].includes(element.nodeName) ? '\n' : '';
    const content = color ? `[color=${color}]${text}[/color]` : text;
    return content + blockBreak;
  }

  return Array.from(template.content.childNodes).map(walk).join('').replace(/\n{3,}/g, '\n\n').replace(/\n$/g, '');
}

function RichTextEditor({ editorId, value, onChange, onActivate, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = richTextHtml(value);
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => onActivate(editorId, ref.current)}
      onMouseUp={() => onActivate(editorId, ref.current)}
      onKeyUp={() => onActivate(editorId, ref.current)}
      onInput={(event) => onChange(htmlToRichText(event.currentTarget.innerHTML))}
      className={className}
    />
  );
}

function AccordionSection({ title, description, open, onToggle, className = '', children }) {
  return (
    <section className={`shrink-0 overflow-hidden rounded-md border border-[#dfe8d8] bg-white ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-[#fbfdf8] px-4 py-3 text-left transition hover:bg-[#f4f9ef]"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-bold text-stone-800">{title}</span>
          {description ? <span className="mt-1 block text-xs leading-5 text-stone-500">{description}</span> : null}
        </span>
        <ChevronDown className={`shrink-0 text-moss-700 transition-transform ${open ? 'rotate-180' : ''}`} size={20} />
      </button>
      {open ? <div className="space-y-4 border-t border-[#dfe8d8] p-4">{children}</div> : null}
    </section>
  );
}

function RichText({ text }) {
  const parts = [];
  const source = String(text);
  const pattern = /\[color=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/color\]/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(source))) {
    if (match.index > lastIndex) {
      parts.push({ text: source.slice(lastIndex, match.index) });
    }
    parts.push({ text: match[2], color: match[1] });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < source.length) {
    parts.push({ text: source.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((part, index) =>
        part.color ? (
          <span key={index} style={{ color: part.color, fontWeight: 700 }}>
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

function detectCategory(text) {
  const compact = text.toLowerCase();
  return categoryRules.find((rule) => rule.keywords.some((keyword) => compact.includes(keyword)))?.category || '其他';
}

function normalizeItemText(value) {
  return stripColorTags(value)
    .replace(/\s+/g, '')
    .replace(/[，,。；;、.]/g, '')
    .toLowerCase();
}

function linesFromText(text) {
  return pending(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function constructionNoticeCards(text) {
  const titles = ['專業報價', '團隊進場', '現場驗收', '現況差異'];
  const cards = [];

  linesFromText(text).forEach((line) => {
    const bulletMatch = line.match(/^[•*－-]\s*(.*)$/);
    if (bulletMatch || !cards.length) {
      cards.push({
        title: titles[cards.length] || '施工須知',
        text: bulletMatch ? bulletMatch[1] : line
      });
      return;
    }
    cards[cards.length - 1].text = `${cards[cards.length - 1].text}\n${line}`;
  });

  return cards;
}

function money(value) {
  return value?.trim() ? `NT$ ${value.trim()}` : '';
}

function formatRoomSummary(value) {
  const source = String(value || '').trim();
  if (!source) return '';
  const slashMatch = source.match(/^(\d+)\s*[/／]\s*(\d+)\s*[/／]\s*(\d+)(?:\s*[/／]\s*(\d+))?$/);
  if (slashMatch) {
    return `${slashMatch[1]}房${slashMatch[2]}廳${slashMatch[3]}衛${slashMatch[4] ? `${slashMatch[4]}陽台` : ''}`;
  }
  return source;
}

function moneyNumber(value) {
  const normalized = String(value || '').replace(/[^\d.-]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function amountText(value) {
  if (value === null || value === undefined || value === '') return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(Math.round(parsed)) : '';
}

function feeAmount(total, subtotal, tax) {
  const totalValue = moneyNumber(total);
  if (totalValue !== null) return totalValue;
  const subtotalValue = moneyNumber(subtotal);
  const taxValue = moneyNumber(tax);
  if (subtotalValue === null && taxValue === null) return null;
  return (subtotalValue || 0) + (taxValue || 0);
}

function totalFeeText(form) {
  const chineseAmount = totalFeeChineseText(form);
  return chineseAmount ? `${chineseAmount}【含稅】` : '';
}

function totalFeeChineseText(form) {
  const serviceAmount = feeAmount(form.serviceTotal, form.serviceSubtotal, form.serviceTax);
  const cleaningAmount = feeAmount(form.cleaningTotal, form.cleaningSubtotal, form.cleaningTax);
  if (serviceAmount === null && cleaningAmount === null) return '';
  return numberToChineseCurrency((serviceAmount || 0) + (cleaningAmount || 0));
}

function numberToChineseCurrency(value) {
  const amount = Math.round(Number(value) || 0);
  if (!amount) return '零元整';
  const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const sections = ['', '萬', '億', '兆'];
  const convertSection = (section) => {
    let result = '';
    let zeroPending = false;
    String(section).padStart(4, '0').split('').map(Number).forEach((digit, index) => {
      const unitIndex = 3 - index;
      if (digit === 0) {
        if (result) zeroPending = true;
        return;
      }
      if (zeroPending) {
        result += digits[0];
        zeroPending = false;
      }
      result += `${digits[digit]}${units[unitIndex]}`;
    });
    return result;
  };
  let result = '';
  let remaining = amount;
  let sectionIndex = 0;
  let needZero = false;
  while (remaining > 0) {
    const section = remaining % 10000;
    if (section) {
      const sectionText = `${convertSection(section)}${sections[sectionIndex]}`;
      result = needZero && result ? `${sectionText}零${result}` : `${sectionText}${result}`;
      needZero = section < 1000;
    } else if (result) {
      needZero = true;
    }
    remaining = Math.floor(remaining / 10000);
    sectionIndex += 1;
  }
  return `${result.replace(/零+/g, '零')}元整`;
}

function paymentConditionText(form) {
  return form.paymentCondition === '其他' ? pending(form.paymentConditionOther) : pending(form.paymentCondition);
}

function buildCategoryRows(items, categoryConfig = DEFAULT_CATEGORY_CONFIG) {
  const activeConfig = [...categoryConfig];
  items.forEach((item) => {
    if (!activeConfig.some((category) => category.key === item.area)) {
      activeConfig.push({ key: item.area, label: item.area });
    }
  });
  return activeConfig.map((category, index) => {
    const categoryItems = items.filter((item) => item.area === category.key);
    const contents = categoryItems.flatMap((item) => normalizeContentItems(item));
    const details = categoryItems.map((item) => item.detail || '');
    return {
      number: index + 1,
      area: category.label || '',
      key: category.key,
      enabled: category.enabled !== false,
      contents,
      detail: contents.length
        ? contentItemsToDetail(contents, { enabledOnly: true, emptyText: '本項目未列入施作內容' })
        : details.length
          ? details.join('\n')
          : ''
    };
  }).filter((row) => row.area || row.detail);
}

function buildPlainText(form, rows) {
  const itemText = rows.map((row) => `${row.number}. ${row.area}\n${stripColorTags(row.detail)}`).join('\n\n');
  return [
    pending(form.title),
    `清潔類型：${pending(form.cleaningType)}`,
    `日期：${pending(form.quoteDate)}`,
    `有效日期至：${pending(form.validUntil)}`,
    `公司名稱：${pending(form.company)}`,
    `統編：${pending(form.taxId)}`,
    `聯絡人：${pending(form.contact)}`,
    `聯絡電話：${pending(form.phone)}`,
    `社區：${pending(form.building)}`,
    `地址：${pending(form.address)}`,
    `施工說明：${stripColorTags(pending(form.constructionNotes))}`,
    `房型：${pending(form.roomSummary)}`,
    `型態：${pending(form.projectType)}`,
    `施作日期：${pending(form.serviceDate)}`,
    `付款條件：${paymentConditionText(form)}`,
    `付款期限：${pending(form.paymentDeadline)}`,
    `${pending(form.serviceFeeLabel)} 小計：${money(form.serviceSubtotal)}`,
    `${pending(form.serviceFeeLabel)} 稅額：${money(form.serviceTax)}`,
    `${pending(form.serviceFeeLabel)} 總計含稅：${money(form.serviceTotal)}`,
    `${pending(form.cleaningFeeLabel)} 小計：${money(form.cleaningSubtotal)}`,
    `${pending(form.cleaningFeeLabel)} 稅額：${money(form.cleaningTax)}`,
    `${pending(form.cleaningFeeLabel)} 總計含稅：${money(form.cleaningTotal)}`,
    `總計費用：${totalFeeText(form)}`,
    `訂金：${money(form.deposit)}`,
    `尾款：${money(form.balance)}`,
    '',
    '特別說明',
    stripColorTags(pending(form.specialNotes)),
    '',
    '施作項目',
    itemText,
    '',
    '條款及細則',
    stripColorTags(pending(form.terms)),
    ''
  ].join('\n');
}

function googleCalendarDate(dateValue, fallbackTime) {
  const dateMatch = String(dateValue || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return '';
  return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}T${fallbackTime.replace(':', '')}00`;
}

function buildGoogleCalendarEventUrl(form, rows) {
  const startDate = googleCalendarDate(form.serviceDate, form.serviceStartTime || '09:00');
  const endDate = googleCalendarDate(form.serviceDate, form.serviceEndTime || '17:00');

  const customerName = stripColorTags(form.contact || form.company || form.building || '客戶');
  const cleaningType = stripColorTags(form.cleaningType || '清潔服務');
  const constructionLines = rows
    .map((row) => {
      const detail = stripColorTags(row.detail || '').trim();
      return detail ? `${row.number}. ${row.area}：${detail}` : `${row.number}. ${row.area}`;
    })
    .join('\n');
  const noteLines = rows
    .filter((row) => row.area === '注意事項' || row.key === '注意事項')
    .map((row) => stripColorTags(row.detail || '').trim())
    .filter(Boolean)
    .join('\n');

  const details = [
    `👤 客戶：\n${stripColorTags(form.contact || '') || '待確認'}`,
    `📞 電話：\n${stripColorTags(form.phone || '') || '待確認'}`,
    `🏢 社區：\n${stripColorTags(form.building || '') || '待確認'}`,
    `🏠 型態：\n${cleaningType}`,
    `📋 施工項目：\n${constructionLines || '待確認'}`,
    `📝 注意事項：\n${noteLines || '待確認'}`,
    '----------------'
  ].join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🧹 微笑清家｜${customerName}｜${cleaningType}`,
    location: stripColorTags(form.address || ''),
    details
  });
  if (startDate && endDate) {
    params.set('dates', `${startDate}/${endDate}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function decodePdfImportText(encoded) {
  const binary = atob(encoded.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function extractEmbeddedPdfImportText(text) {
  const match = text.match(new RegExp(`${PDF_IMPORT_START}\\s*([A-Za-z0-9+/=\\s]+?)\\s*${PDF_IMPORT_END}`));
  if (!match?.[1]) return '';
  try {
    return decodePdfImportText(match[1]);
  } catch {
    return '';
  }
}

function isLikelyMojibake(text) {
  const source = text.trim();
  if (!source) return false;
  const hasChinese = /[\u4e00-\u9fff]/.test(source);
  const weirdMatches = source.match(/[^\w\s.,;:!?()[\]{}'"@#+\-/%$&*\u4e00-\u9fff]/g) || [];
  return !hasChinese && source.length > 60 && weirdMatches.length / source.length > 0.08;
}

function buildPrintHtml(form, rows) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(pending(form.title))}</title>
  <style>
    body { font-family: "Microsoft JhengHei", "Noto Sans TC", Arial, sans-serif; margin: 28px; color: #243423; }
    .sheet { width: 960px; margin: auto; border: 2px solid #111; background: #fff; }
    .top { display: grid; grid-template-columns: 1.25fr 0.95fr 150px; background: #e8f3df; color: #4b7d35; }
    .top > div { padding: 18px 22px; }
    h1 { margin: 0 0 14px; text-align: center; font-size: 28px; font-weight: 500; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #c8d9bd; border-left: 1px solid #c8d9bd; }
    .meta-row { display: grid; grid-template-columns: 88px minmax(0, 1fr); border-right: 1px solid #c8d9bd; border-bottom: 1px solid #c8d9bd; font-size: 12px; min-width: 0; }
    .meta-row span { min-width: 0; padding: 7px 8px; overflow-wrap: anywhere; word-break: break-word; line-height: 1.45; }
    .meta-row span:first-child { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.35); font-weight: 700; text-align: center; }
    .note-row { display: grid; grid-template-columns: 24px 1fr; gap: 8px; margin: 8px 0; font-size: 13px; line-height: 1.55; }
    .note-row span { text-align: right; font-weight: 700; }
    .brand { text-align: center; word-break: break-all; overflow-wrap: anywhere; overflow: hidden; }
    .brand strong, .brand div { display: block; max-width: 100%; line-height: 1.35; }
    .brand div { font-size: 11px; }
    .qr-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 12px; }
    .qr { width: 52px; height: 52px; border: 2px solid #8bb078; background: repeating-linear-gradient(45deg,#fff,#fff 5px,#dbead1 5px,#dbead1 10px); }
    .logo { width: 62px; height: 62px; border: 2px solid #4b7d35; border-radius: 50%; display: grid; place-items: center; margin: 6px auto; font-size: 30px; font-weight: 700; }
    .bar { background: #548436; color: white; text-align: center; font-size: 24px; letter-spacing: 4px; padding: 7px; }
    .print-items-grid { display: grid; background: #111; gap: 1px 0; font-size: 13px; }
    .print-item-row { display: grid; grid-template-columns: 54px 120px minmax(0, 1fr); min-height: 42px; background: #fff; }
    .print-item-row.highlight { background: #fffed0; }
    .print-item-cell { display: flex; min-width: 0; align-items: center; justify-content: flex-start; background: inherit; padding: 12px 14px; line-height: 1.28; white-space: pre-line; overflow-wrap: anywhere; }
    .no { justify-content: center; color: #57921f; text-align: center; }
    .area { justify-content: center; color: #496d34; text-align: center; letter-spacing: 6px; }
    .bottom { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #111; }
    .box { min-height: 170px; padding: 18px; border-right: 1px solid #111; }
    .box:last-child { border-right: 0; }
    .muted { color: #688158; font-size: 13px; line-height: 1.8; white-space: pre-line; }
    .fee-columns { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #c8d9bd; background: #fff; }
    .fee-panel { padding: 10px 12px; border-right: 1px solid #c8d9bd; min-width: 0; }
    .fee-panel:last-child { border-right: 0; }
    .fee-title { margin-bottom: 8px; color: #243423; font-weight: 700; overflow-wrap: anywhere; }
    .fee-grid { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 6px 8px; color: #e11d1d; font-weight: 700; overflow-wrap: anywhere; }
    .fee-note { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 6px 8px; margin-top: 10px; color: #e11d1d; font-weight: 700; }
    .signature { margin-top: 18px; border-top: 1px solid #111; padding-top: 14px; font-size: 18px; color: #4b7d35; }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="top">
      <div class="meta">
        <h1>${escapeHtml(pending(form.title))}</h1>
        <div class="meta-grid">
          <div class="meta-row"><span>日期</span><span>${escapeHtml(pending(form.quoteDate))}</span></div>
          <div class="meta-row"><span>有效日期至</span><span>${escapeHtml(pending(form.validUntil))}</span></div>
          <div class="meta-row"><span>公司名稱</span><span>${escapeHtml(pending(form.company))}</span></div>
          <div class="meta-row"><span>統編</span><span>${escapeHtml(pending(form.taxId))}</span></div>
          <div class="meta-row"><span>聯絡人</span><span>${escapeHtml(pending(form.contact))}</span></div>
          <div class="meta-row"><span>聯絡電話</span><span>${escapeHtml(pending(form.phone))}</span></div>
          <div class="meta-row"><span>社區</span><span>${escapeHtml(pending(form.building))}</span></div>
          <div class="meta-row"><span>地址</span><span>${escapeHtml(pending(form.address))}</span></div>
        </div>
      </div>
      <div class="notes">
        <strong>特別說明</strong>
        ${linesFromText(form.specialNotes)
          .map((line, index) => `<div class="note-row"><span>${index + 1}</span><p>${richTextHtml(line.replace(/^\d+\s*[.、]?\s*/, ''))}</p></div>`)
          .join('')}
      </div>
      <div class="brand">
        <div class="qr-row"><div class="qr"></div><div class="qr"></div></div>
        <div class="logo">葉</div>
        <strong>微笑清家</strong>
        <div>meant2clean.com</div>
      </div>
    </section>
    <div class="bar">${escapeHtml(formatRoomSummary(form.roomSummary))} 施 作 項 目</div>
    <div class="print-items-grid">
      ${rows
        .map(printItemRowHtml)
        .join('')}
    </div>
    <section class="bottom">
      <div class="box">
        <div class="fee-columns">
          <div class="fee-panel">
            <div class="fee-title">${escapeHtml(pending(form.serviceFeeLabel))}</div>
            <div class="fee-grid"><span>小計</span><span>${escapeHtml(money(form.serviceSubtotal))}</span><span>稅額</span><span>${escapeHtml(money(form.serviceTax))}</span><span>總計含稅</span><span>${escapeHtml(money(form.serviceTotal))}</span></div>
          </div>
          <div class="fee-panel">
            <div class="fee-title">${escapeHtml(pending(form.cleaningFeeLabel))}</div>
            <div class="fee-grid"><span>小計</span><span>${escapeHtml(money(form.cleaningSubtotal))}</span><span>稅額</span><span>${escapeHtml(money(form.cleaningTax))}</span><span>總計含稅</span><span>${escapeHtml(money(form.cleaningTotal))}</span></div>
          </div>
        </div>
        <div class="fee-note"><span>訂金</span><span>${escapeHtml(money(form.deposit))}</span><span>尾款</span><span>${escapeHtml(money(form.balance))}</span></div>
      </div>
      <div class="box"><strong>條款及細則</strong><p class="muted">${richTextHtml(pending(form.terms))}</p><div class="signature">接受報價簽名：</div><div class="signature">驗收簽名：</div></div>
    </section>
  </main>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function App() {
  const [initialCaseState] = useState(createNewCaseState);
  const [form, setForm] = useState(initialCaseState.form);
  const [items, setItems] = useState(initialCaseState.items);
  const [categoryConfig, setCategoryConfig] = useState(initialCaseState.categoryConfig);
  const [status, setStatus] = useState('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [customerAiPreview, setCustomerAiPreview] = useState(null);
  const [aiSupplementPreview, setAiSupplementPreview] = useState(null);
  const [highlightColor, setHighlightColor] = useState('#d92626');
  const [activeTextTarget, setActiveTextTarget] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [draggingCategoryKey, setDraggingCategoryKey] = useState('');
  const [draggingContent, setDraggingContent] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);
  const [savedCases, setSavedCases] = useState(() => listSavedCases());
  const [currentCaseId, setCurrentCaseId] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [openSections, setOpenSections] = useState({
    survey: true,
    customer: false,
    notes: false,
    items: false,
    payment: false
  });
  const quoteRef = useRef(null);
  const textRefs = useRef({});
  const companyTemplateInputRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const caseMenuRef = useRef(null);

  const categoryRows = useMemo(() => buildCategoryRows(items, categoryConfig), [items, categoryConfig]);
  const enabledCategoryRows = useMemo(() => categoryRows.filter((row) => row.enabled), [categoryRows]);

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!settingsMenuRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [settingsOpen]);

  useEffect(() => {
    if (!caseMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!caseMenuRef.current?.contains(event.target)) {
        setCaseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [caseMenuOpen]);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      const syncFee = (prefix) => {
        const subtotalField = `${prefix}Subtotal`;
        const taxField = `${prefix}Tax`;
        const totalField = `${prefix}Total`;
        const subtotal = moneyNumber(next[subtotalField]);
        if (subtotal === null) {
          if (field === subtotalField) {
            next[taxField] = '';
            next[totalField] = '';
          }
          return;
        }
        const tax = Math.round(subtotal * 0.05);
        next[taxField] = amountText(tax);
        next[totalField] = amountText(subtotal + tax);
      };

      if (field === 'serviceSubtotal') syncFee('service');
      if (field === 'cleaningSubtotal') syncFee('cleaning');

      if (['serviceSubtotal', 'cleaningSubtotal', 'serviceTotal', 'cleaningTotal', 'deposit'].includes(field)) {
        const serviceAmount = feeAmount(next.serviceTotal, next.serviceSubtotal, next.serviceTax) || 0;
        const cleaningAmount = feeAmount(next.cleaningTotal, next.cleaningSubtotal, next.cleaningTax) || 0;
        const depositAmount = moneyNumber(next.deposit);
        if (depositAmount !== null) {
          next.balance = amountText(Math.max(0, serviceAmount + cleaningAmount - depositAmount));
        }
      }

      return next;
    });
  }

  function openConfirmDialog({ title, message, confirmText, onConfirm }) {
    setConfirmDialog({ title, message, confirmText, onConfirm });
  }

  function closeConfirmDialog() {
    setConfirmDialog(null);
  }

  function confirmAndClose() {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
  }

  function saveCurrentCase() {
    const now = new Date();
    const savedAt = now.toISOString();
    const nextCaseId = currentCaseId || `case-${now.getTime()}`;
    const store = readSavedCaseStore();
    const caseName = createCaseName(form);
    const snapshot = createCaseSnapshot({
      id: nextCaseId,
      name: caseName,
      form,
      items,
      categoryConfig,
      savedAt
    });
    if (writeSavedCaseStore({ version: 1, cases: { ...store.cases, [nextCaseId]: snapshot } })) {
      setCurrentCaseId(nextCaseId);
      setLastSavedAt(savedAt);
      setSavedCases(listSavedCases());
      setStatus(`✔ 已儲存｜最後儲存時間：${now.toLocaleString('zh-TW', { hour12: false })}`);
    }
  }

  function loadSavedCase(savedCase) {
    if (!savedCase) return;
    setForm({ ...createEmptyForm(), ...(savedCase.form || {}) });
    setItems(cloneTemplateItems(savedCase.items || []));
    setCategoryConfig(cloneCategoryConfig(savedCase.categoryConfig || DEFAULT_CATEGORY_CONFIG));
    setCurrentCaseId(savedCase.id || '');
    setLastSavedAt(savedCase.savedAt || '');
    setCaseMenuOpen(false);
    setStatus(`已開啟案件：${savedCase.name || '未命名案件'}`);
  }

  function deleteSavedCase(caseId, caseName) {
    openConfirmDialog({
      title: '刪除案件',
      message: `確定刪除「${caseName || '未命名案件'}」嗎？`,
      confirmText: '刪除',
      onConfirm: () => {
        const store = readSavedCaseStore();
        const nextCases = { ...(store.cases || {}) };
        delete nextCases[caseId];
        writeSavedCaseStore({ version: 1, cases: nextCases });
        if (currentCaseId === caseId) {
          setCurrentCaseId('');
          setLastSavedAt('');
        }
        setSavedCases(listSavedCases());
        setStatus(`已刪除案件：${caseName || '未命名案件'}`);
      }
    });
  }

  function applyCleaningTemplate(cleaningType) {
    if (cleaningType === form.cleaningType && items.length > 0) return;
    if (cleaningType === '其他' && cleaningTypeSelectValue(form.cleaningType) === '其他' && items.length > 0) return;
    if (!cleaningType) {
      setForm((current) => ({ ...current, cleaningType: '' }));
      return;
    }
    openConfirmDialog({
      title: '套用清潔範本',
      message: '套用範本會覆蓋目前施工項目，是否繼續？',
      confirmText: '繼續套用',
      onConfirm: () => applyCleaningTemplateNow(cleaningType)
    });
  }

  function applyCleaningTemplateNow(cleaningType) {
    const companyTemplate = getCompanyTemplateForType(cleaningType);
    if (companyTemplate) {
      setForm((current) => ({
        ...current,
        cleaningType,
        title: companyTemplate.title || current.title || '清潔服務 估價單',
        specialNotes: buildStandardSpecialNotes()
      }));
      setCategoryConfig(companyTemplate.categoryConfig);
      setItems(companyTemplate.items);
      setOpenSections((current) => ({ ...current, items: true, notes: true }));
      setStatus(`已套用「${cleaningType}」公司預設範本，內容仍可手動編輯`);
      return;
    }
    if (cleaningType === '其他') {
      setForm((current) => ({
        ...current,
        cleaningType: '其他',
        title: current.title || '清潔服務 估價單',
        specialNotes: buildStandardSpecialNotes()
      }));
      setCategoryConfig(DEFAULT_CATEGORY_CONFIG);
      setItems(otherTemplateItemsToRows());
      setOpenSections((current) => ({ ...current, items: true, notes: true }));
      setStatus('已套用「其他」空白範本，注意事項與其他事項已保留');
      return;
    }
    const template = CLEANING_TEMPLATES[cleaningType];
    setForm((current) => ({
      ...current,
      cleaningType,
      title: template?.title || current.title,
      specialNotes: template ? buildStandardSpecialNotes() : current.specialNotes
    }));
    if (template) {
      setCategoryConfig(DEFAULT_CATEGORY_CONFIG);
      setItems(templateItemsToRows(template));
      setOpenSections((current) => ({ ...current, items: true, notes: true }));
      setStatus(`已套用「${cleaningType}」標準清潔範本，內容仍可手動編輯`);
    }
  }

  function updateCustomCleaningType(value) {
    const nextName = value.trim();
    setForm((current) => ({
      ...current,
      cleaningType: value,
      title: nextName ? `${nextName} 估價單` : '清潔服務 估價單'
    }));
  }

  function saveCompanyTemplateNow() {
    const cleaningType = form.cleaningType?.trim();
    if (!cleaningType) {
      setStatus('請先選擇清潔類型，再更新該類型的公司預設範本');
      return;
    }
    const snapshot = createCompanyTemplateSnapshot(form, items, categoryConfig);
    if (writeCompanyTemplateForType(cleaningType, snapshot)) {
      setStatus(`已更新「${cleaningType}」公司預設範本，之後套用此類型會使用這份內容`);
    } else {
      setStatus('公司預設範本更新失敗，請稍後再試');
    }
  }

  function updateCompanyTemplate() {
    const cleaningType = form.cleaningType?.trim() || '目前清潔類型';
    openConfirmDialog({
      title: '更新公司預設範本',
      message: `這會更新「${cleaningType}」之後套用時的公司預設範本，確定更新嗎？`,
      confirmText: '更新公司預設範本',
      onConfirm: saveCompanyTemplateNow
    });
  }

  function restoreSystemTemplate() {
    openConfirmDialog({
      title: '恢復系統原始範本',
      message: '這會清除本機所有公司預設範本。之後套用清潔類型會回到系統內建範本，是否繼續？',
      confirmText: '恢復系統原始範本',
      onConfirm: () => {
        clearCompanyTemplates();
        setStatus('已清除所有公司預設範本，之後套用清潔類型會使用系統原始範本');
      }
    });
  }

  function exportCompanyTemplate() {
    const store = readCompanyTemplateStore() || normalizeCompanyTemplateStore({});
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = todayString().replaceAll('-', '');
    link.href = url;
    link.download = `微笑清家公司範本-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(Object.keys(store.templates || {}).length ? '已匯出公司預設範本 JSON' : '目前尚未建立公司預設範本，已匯出空白範本庫 JSON');
  }

  async function importCompanyTemplate(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const store = parsed?.templates ? normalizeCompanyTemplateStore(parsed) : normalizeCompanyTemplateStore({ templates: { [parsed.cleaningType || '匯入範本']: parsed } });
      writeCompanyTemplateStore(store);
      setStatus(`已匯入公司範本「${file.name}」，之後套用清潔類型會使用匯入內容`);
    } catch (error) {
      setStatus(`匯入公司範本失敗：${error.message || '無法讀取 JSON'}`);
    }
  }

  function runSettingsAction(action) {
    setSettingsOpen(false);
    action?.();
  }

  function showComingSoon(label) {
    setStatus(`${label} 功能已預留入口，之後可從設定選單擴充`);
  }

  function resetCurrentCase() {
    openConfirmDialog({
      title: '開新案件',
      message: '開新案件會清空目前資料，並回到空白估價單，不會自動套用任何範本，是否繼續？',
      confirmText: '開新案件',
      onConfirm: resetCurrentCaseNow
    });
  }

  function resetCurrentCaseNow() {
    const nextCase = createNewCaseState();
    setForm(nextCase.form);
    setCategoryConfig(nextCase.categoryConfig);
    setItems(nextCase.items);
    setOpenSections({
      survey: true,
      customer: false,
      notes: false,
      items: nextCase.items.length > 0,
      payment: false
    });
    setActiveTextTarget(null);
    setDraggingCategoryKey('');
    setEditingContent(null);
    setCurrentCaseId('');
    setLastSavedAt('');
    setStatus('已建立空白估價單');
  }

  function addToGoogleCalendar() {
    const calendarUrl = buildGoogleCalendarEventUrl(form, enabledCategoryRows);
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
    setStatus(/^\d{4}-\d{2}-\d{2}$/.test(form.serviceDate || '') ? '已開啟 Google 行事曆建立事件' : '已開啟 Google 行事曆，請在 Google 畫面選擇日期');
  }

  function toggleSection(section) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function updateCategoryDetail(category, value) {
    setItems((current) => {
      const next = [...current];
      const index = next.findIndex((item) => item.area === category);
      if (index >= 0) {
        next[index] = { ...next[index], detail: value || '', contents: splitDetailToContentItems(value || '', { custom: next[index].custom, category }) };
        return next;
      }
      return [...next, { area: category, detail: value || '', contents: splitDetailToContentItems(value || '', { custom: true, category }) }];
    });
  }

  function updateCategoryContents(category, updater) {
    setItems((current) => {
      const next = [...current];
      const index = next.findIndex((item) => item.area === category);
      const baseItem = index >= 0 ? next[index] : { area: category, detail: '', contents: [] };
      const nextContents = updater(normalizeContentItems(baseItem)).filter((content) => content.text);
      const nextItem = {
        ...baseItem,
        area: category,
        contents: nextContents,
        detail: contentItemsToDetail(nextContents)
      };
      if (index >= 0) {
        next[index] = nextItem;
        return next;
      }
      return [...next, nextItem];
    });
  }

  function toggleContentItem(category, contentId) {
    updateCategoryContents(category, (contents) =>
      contents.map((content) => (content.id === contentId ? { ...content, enabled: content.enabled === false } : content))
    );
  }

  function updateContentItemText(category, contentId, text) {
    updateCategoryContents(category, (contents) =>
      contents.map((content) => (content.id === contentId ? { ...content, text } : content))
    );
  }

  function promptEditContentItem(category, content) {
    setEditingContent({ category, contentId: content.id });
  }

  function removeContentItem(category, contentId) {
    updateCategoryContents(category, (contents) => contents.filter((content) => content.id !== contentId));
    setEditingContent((current) => (current?.contentId === contentId ? null : current));
    setDraggingContent((current) => (current?.contentId === contentId ? null : current));
    setStatus('已刪除施工內容');
  }

  function toggleContentRed(category, contentId) {
    updateCategoryContents(category, (contents) => contents.map((content) => (content.id === contentId ? { ...content, red: !content.red } : content)));
  }

  function toggleContentStrike(category, contentId) {
    updateCategoryContents(category, (contents) => contents.map((content) => (content.id === contentId ? { ...content, strike: !content.strike } : content)));
  }

  function toggleContentScope(category, contentId, scopeKey) {
    updateCategoryContents(category, (contents) =>
      contents.map((content) => {
        if (content.id !== contentId || !supportsInnerOuterScope(content)) return content;
        const currentScope = normalizedScope(content.scope);
        const nextScope = { ...currentScope, [scopeKey]: !currentScope[scopeKey] };
        return { ...content, scope: normalizedScope(nextScope) };
      })
    );
  }

  function moveContentItem(category, sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) return;
    updateCategoryContents(category, (contents) => {
      const next = [...contents];
      const fromIndex = next.findIndex((content) => content.id === sourceId);
      const toIndex = next.findIndex((content) => content.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return contents;
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function addContentItem(category) {
    const content = createContentItem('新增內容', { custom: true, type: 'tag' });
    updateCategoryContents(category, (contents) => [...contents, content]);
    setEditingContent({ category, contentId: content.id });
    setStatus('已新增施工內容');
  }

  function addParagraphItem(category) {
    const content = createContentItem('新增段落', { custom: true, type: 'paragraph' });
    updateCategoryContents(category, (contents) => [...contents, content]);
    setEditingContent({ category, contentId: content.id });
    setStatus('已新增段落內容');
  }

  function renderContentEditor(row, content) {
    const isEditing = editingContent?.category === row.key && editingContent?.contentId === content.id;
    const isParagraph = content.type === 'paragraph';
    const isDisabled = content.enabled === false;
    const hasScopeToggle = supportsInnerOuterScope(content);
    const contentScope = normalizedScope(content.scope);
    return (
      <span
        key={content.id}
        draggable
        onDragStart={(event) => {
          setDraggingContent({ category: row.key, contentId: content.id });
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', content.id);
        }}
        onDragEnd={() => setDraggingContent(null)}
        onDragOver={(event) => {
          if (draggingContent?.category === row.key) event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (draggingContent?.category === row.key) {
            moveContentItem(row.key, draggingContent.contentId, content.id);
          }
          setDraggingContent(null);
        }}
        className={`group relative inline-flex max-w-full cursor-grab items-start gap-1 border text-[13px] leading-5 transition active:cursor-grabbing ${
          isParagraph ? 'w-full rounded-md px-3 py-2 pr-24' : `rounded-full px-2.5 py-1 ${hasScopeToggle ? 'pr-36' : 'pr-20'}`
        } ${
          isDisabled
            ? 'border-stone-200 bg-stone-100 text-stone-400'
            : content.red
              ? 'border-red-200 bg-red-50 text-red-700 shadow-sm'
              : 'border-[#b9d0ad] bg-white text-moss-800 shadow-sm hover:bg-moss-50'
        } ${content.strike || isDisabled ? 'line-through' : ''}`}
      >
        {isEditing ? (
          isParagraph ? (
            <textarea
              autoFocus
              value={content.text}
              placeholder="輸入施工內容"
              onChange={(event) => updateContentItemText(row.key, content.id, event.target.value)}
              onBlur={() => setEditingContent(null)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.currentTarget.blur();
              }}
              className="min-h-16 w-full resize-y rounded-md border border-[#cbdcc2] bg-white px-2 py-1 text-[13px] leading-5 text-moss-900 outline-none focus:border-moss-700 focus:ring-2 focus:ring-moss-100"
            />
          ) : (
            <input
              autoFocus
              value={content.text}
              placeholder="輸入施工內容"
              onChange={(event) => updateContentItemText(row.key, content.id, event.target.value)}
              onBlur={() => setEditingContent(null)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'Escape') {
                  event.currentTarget.blur();
                }
              }}
              className="h-6 w-48 max-w-[52vw] rounded-full border border-[#cbdcc2] bg-white px-2 text-[13px] text-moss-900 outline-none focus:border-moss-700 focus:ring-2 focus:ring-moss-100"
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => {
              toggleContentItem(row.key, content.id);
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              promptEditContentItem(row.key, content);
            }}
            className={`${isParagraph ? 'whitespace-pre-wrap' : 'truncate'} max-w-full text-left`}
            title="點一下停用/恢復，雙擊編輯"
          >
            {content.text}
          </button>
        )}
        {!isEditing && hasScopeToggle && (
          <span className="absolute right-20 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5">
            {[
              ['inner', '內'],
              ['outer', '外']
            ].map(([scopeKey, label]) => {
              const active = contentScope[scopeKey];
              return (
                <button
                  key={scopeKey}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleContentScope(row.key, content.id, scopeKey);
                  }}
                  className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold leading-none transition ${
                    active
                      ? 'border-moss-600 bg-moss-700 text-white'
                      : 'border-stone-300 bg-white text-stone-400 hover:bg-stone-50'
                  }`}
                  title={`${label}側施作`}
                >
                  {label}
                </button>
              );
            })}
          </span>
        )}
        <span className={`absolute ${isParagraph ? 'right-2 top-2' : 'right-5 top-1/2 -translate-y-1/2'} inline-flex items-center gap-1`}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleContentRed(row.key, content.id);
            }}
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold transition ${content.red ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            title="紅字"
          >
            紅
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleContentStrike(row.key, content.id);
            }}
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold transition ${content.strike ? 'bg-stone-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            title="刪除線"
          >
            線
          </button>
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            removeContentItem(row.key, content.id);
          }}
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm transition hover:bg-red-50"
          title="刪除此內容"
          aria-label="刪除此內容"
        >
          <X size={10} />
        </button>
      </span>
    );
  }

  function updateCategoryLabel(key, value) {
    setCategoryConfig((current) => current.map((category) => (category.key === key ? { ...category, label: value } : category)));
  }

  function toggleCategoryEnabled(key) {
    setCategoryConfig((current) =>
      current.map((category) => (category.key === key ? { ...category, enabled: category.enabled === false } : category))
    );
  }

  function addCategoryRow() {
    const key = `custom-${Date.now()}`;
    setCategoryConfig((current) => [...current, { key, label: '新增項目', enabled: true }]);
    setItems((current) => [...current, { area: key, detail: '', contents: [] }]);
    setOpenSections((current) => ({ ...current, items: true }));
  }

  function removeCategoryRow(key) {
    setCategoryConfig((current) => current.filter((category) => category.key !== key));
    setItems((current) => current.filter((item) => item.area !== key));
    setStatus('已刪除施工項目');
  }

  function moveCategoryRow(dragKey, targetKey) {
    if (!dragKey || dragKey === targetKey) return;
    setCategoryConfig((current) => {
      const fromIndex = current.findIndex((category) => category.key === dragKey);
      const targetIndex = current.findIndex((category) => category.key === targetKey);
      if (fromIndex < 0 || targetIndex < 0) return current;

      const next = current.filter((category) => category.key !== dragKey);
      const insertIndex = fromIndex < targetIndex ? targetIndex : targetIndex;
      next.splice(insertIndex, 0, current[fromIndex]);
      return next;
    });
  }

  function rememberTextTarget(type, key, node = null, rich = false) {
    setActiveTextTarget({ type, key, node, rich });
  }

  function handleRichEditorActivate(editorId, node) {
    const [type, ...keyParts] = editorId.split(':');
    rememberTextTarget(type, keyParts.join(':'), node, true);
  }

  function applyColorToSelection(color = highlightColor) {
    if (!activeTextTarget) {
      setStatus('請先選取要變色的文字');
      return;
    }

    if (activeTextTarget.rich && activeTextTarget.node) {
      activeTextTarget.node.focus();
      document.execCommand('foreColor', false, color);
      const nextValue = htmlToRichText(activeTextTarget.node.innerHTML);

      if (activeTextTarget.type === 'form') {
        updateField(activeTextTarget.key, nextValue);
      } else {
        updateCategoryDetail(activeTextTarget.key, nextValue);
      }

      setStatus('已套用文字顏色');
      return;
    }

    const id = `${activeTextTarget.type}:${activeTextTarget.key}`;
    const node = textRefs.current[id];
    if (!node) return;

    const start = node.selectionStart ?? 0;
    const end = node.selectionEnd ?? 0;
    const currentValue = node.value;
    const selected = currentValue.slice(start, end) || '輸入文字';
    const nextValue = `${currentValue.slice(0, start)}[color=${color}]${selected}[/color]${currentValue.slice(end)}`;

    if (activeTextTarget.type === 'form') {
      updateField(activeTextTarget.key, nextValue);
    } else {
      updateCategoryDetail(activeTextTarget.key, nextValue);
    }

    window.requestAnimationFrame(() => {
      node.focus();
      const cursor = start + `[color=${color}]${selected}[/color]`.length;
      node.setSelectionRange(cursor, cursor);
    });
    setStatus('已套用文字顏色');
  }

  function appendSupplementRows(rows) {
    const validAreas = new Set([...DEFAULT_CATEGORY_CONFIG, ...categoryConfig].map((category) => category.key));
    let addedCount = 0;

    setItems((current) => {
      const existingTexts = new Set(
        current
          .flatMap((item) => normalizeContentItems(item).map((content) => normalizeItemText(stripColorTags(content.text))))
          .filter(Boolean)
      );
      const next = [...current];

      rows.forEach((row) => {
        const detail = stripColorTags(row.detail || '').trim();
        const normalized = normalizeItemText(detail);
        if (!detail || normalized === normalizeItemText('待確認') || normalized === normalizeItemText('施工內容待確認')) return;
        if (existingTexts.has(normalized)) return;

        const area = validAreas.has(row.area) ? row.area : detectCategory(`${row.area || ''} ${detail}`);
        const targetArea = validAreas.has(area) ? area : '其他';
        const index = next.findIndex((item) => item.area === targetArea);
        const content = createContentItem(detail, { custom: true, type: contentTypeForCategory(targetArea) });
        if (index >= 0) {
          const contents = [...normalizeContentItems(next[index]), content];
          next[index] = {
            ...next[index],
            contents,
            detail: contentItemsToDetail(contents)
          };
        } else {
          next.push({
            area: targetArea,
            detail,
            contents: [content]
          });
        }
        existingTexts.add(normalized);
        addedCount += 1;
      });

      return addedCount ? next : current;
    });

    return addedCount;
  }

  function updateAiPreviewItem(index, patch) {
    setAiSupplementPreview((current) => {
      if (!current) return current;
      const detectedItems = current.detectedItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        if (patch.categoryNo) {
          next.categoryNo = Number(patch.categoryNo);
          next.categoryName = categoryNameByNo(patch.categoryNo);
        }
        return next;
      });
      return { ...current, detectedItems };
    });
  }

  function removeAiPreviewItem(index) {
    setAiSupplementPreview((current) => {
      if (!current) return current;
      return {
        ...current,
        detectedItems: current.detectedItems.filter((_, itemIndex) => itemIndex !== index)
      };
    });
  }

  function previewCustomerContent(text) {
    if (!text.trim()) {
      setStatus('請先貼上 LINE 對話或備註文字');
      return;
    }
    const preview = parseCustomerText(text);
    setCustomerAiPreview(preview);
    const filledCount = Object.entries(preview).filter(([key, value]) => key !== 'unclassified' && value).length;
    setStatus(`已產生客戶資料解析預覽：${filledCount} 個欄位，${preview.unclassified.length} 筆未分類`);
  }

  function updateCustomerPreviewField(field, value) {
    setCustomerAiPreview((current) => (current ? { ...current, [field]: value } : current));
  }

  function applyCustomerAiPreview() {
    if (!customerAiPreview) {
      setStatus('目前沒有可套用的客戶資料');
      return;
    }

    const fieldMap = {
      quoteDate: 'quoteDate',
      validUntil: 'validUntil',
      companyName: 'company',
      taxId: 'taxId',
      contactName: 'contact',
      contactPhone: 'phone',
      community: 'building',
      roomSummary: 'roomSummary',
      houseType: 'projectType',
      address: 'address'
    };

    setForm((current) => {
      const next = { ...current };
      Object.entries(fieldMap).forEach(([previewField, formField]) => {
        const value = customerAiPreview[previewField];
        if (value) next[formField] = value;
      });
      return next;
    });
    setCustomerAiPreview(null);
    setOpenSections((current) => ({ ...current, customer: true }));
    setStatus('已套用客戶資料');
  }

  function previewSupplementContent(text, mode = 'manual') {
    if (!text.trim()) {
      setStatus('請先貼上 LINE 對話或備註文字');
      return;
    }

    setIsOrganizing(true);
    setStatus(mode === 'paste' ? '已偵測貼上內容，正在解析補充內容...' : '正在解析補充內容...');

    window.setTimeout(() => {
      try {
        const preview = parseConstructionText(text);
        setAiSupplementPreview({
          detectedItems: preview.detectedItems.map((item) => ({ ...item, enabled: true })),
          unclassified: preview.unclassified
        });
        setStatus(
          preview.detectedItems.length
            ? `已產生施工內容解析預覽：${preview.detectedItems.length} 筆可分類，${preview.unclassified.length} 筆未分類`
            : '沒有偵測到明確施工補充，請查看未分類內容'
        );
      } catch {
        setAiSupplementPreview({ detectedItems: [], unclassified: [text] });
        setStatus('解析失敗，已放入未分類內容，請手動確認');
      } finally {
        setIsOrganizing(false);
      }
    }, 0);
  }

  function applyAiSupplementPreview() {
    if (!aiSupplementPreview?.detectedItems?.length) {
      setStatus('目前沒有可套用的補充內容');
      return;
    }

    const rows = aiSupplementPreview.detectedItems
      .filter((item) => item.enabled !== false)
      .map((item) => ({
        area: item.categoryName,
        detail: item.suggestedContent
      }));

    const addedCount = appendSupplementRows(rows);
    setCategoryConfig((current) => current.map((category) => ({ ...category, enabled: true })));
    setAiSupplementPreview(null);
    setOpenSections((current) => ({ ...current, items: true }));
    setStatus(addedCount ? `已套用 ${addedCount} 筆補充內容到施工項目` : '沒有新增內容，可能已存在相同項目');
  }

  async function parseLineSupplements() {
    previewSupplementContent(form.rawText, 'manual');
  }

  async function extractPdfText(file) {
    const buffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: buffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const positionedItems = content.items
        .map((item) => ({
          text: item.str,
          x: item.transform?.[4] || 0,
          y: item.transform?.[5] || 0
        }))
        .filter((item) => item.text?.trim())
        .sort((a, b) => b.y - a.y || a.x - b.x);

      const lines = [];
      positionedItems.forEach((item) => {
        const currentLine = lines.find((line) => Math.abs(line.y - item.y) < 3);
        if (currentLine) {
          currentLine.items.push(item);
        } else {
          lines.push({ y: item.y, items: [item] });
        }
      });

      pages.push(
        lines
          .sort((a, b) => b.y - a.y)
          .map((line) =>
            line.items
              .sort((a, b) => a.x - b.x)
              .map((item) => item.text)
              .join(' ')
          )
          .join('\n')
      );
    }

    const extractedText = pages.join('\n');
    const embeddedText = extractEmbeddedPdfImportText(extractedText);
    return embeddedText || extractedText;
  }

  async function extractSpreadsheetText(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    return workbook.SheetNames.map((sheetName) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
      return [`【${sheetName}】`, ...rows.map((row) => row.filter(Boolean).join(' '))].join('\n');
    }).join('\n\n');
  }

  async function handleFileImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(`正在讀取 ${file.name}...`);
    try {
      const fileName = file.name.toLowerCase();
      const text = fileName.endsWith('.pdf') ? await extractPdfText(file) : await extractSpreadsheetText(file);
      if (!text.trim()) {
        throw new Error('這份 PDF 沒有可讀文字，可能是圖片或掃描檔，請改貼文字內容或匯入 Excel。');
      }
      if (fileName.endsWith('.pdf') && isLikelyMojibake(text)) {
        throw new Error('這份 PDF 讀到的是亂碼，請用新版重新下載 PDF 後再匯入，或改貼 LINE 文字內容。');
      }
      setForm((current) => ({
        ...current,
        rawText: text
      }));
      previewCustomerContent(text);
      previewSupplementContent(text, 'file');
      setStatus(`已匯入 ${file.name}，並解析為補充項目`);
    } catch (error) {
      setStatus(`匯入失敗：${error.message || '無法讀取檔案內容'}`);
    } finally {
      event.target.value = '';
    }
  }

  function handleRawTextPaste(event) {
    const target = event.currentTarget;
    window.setTimeout(() => {
      const pastedText = target.value;
      updateField('rawText', pastedText);
    }, 0);
  }

  async function copyResult() {
    await navigator.clipboard.writeText(buildPlainText(form, enabledCategoryRows));
    setStatus('已複製結果');
  }

  function downloadExcel() {
    const infoRows = [
      ['估價單名稱', pending(form.title)],
      ['清潔類型', pending(form.cleaningType)],
      ['日期', pending(form.quoteDate)],
      ['有效日期至', pending(form.validUntil)],
      ['公司名稱', pending(form.company)],
      ['統編', pending(form.taxId)],
      ['聯絡人', pending(form.contact)],
      ['聯絡電話', pending(form.phone)],
      ['社區', pending(form.building)],
      ['地址', pending(form.address)],
      ['房型', pending(form.roomSummary)],
      ['型態', pending(form.projectType)],
      ['施作日期', pending(form.serviceDate)],
      ['付款條件', paymentConditionText(form)],
      ['付款期限', pending(form.paymentDeadline)],
      [`${pending(form.serviceFeeLabel)} 小計`, money(form.serviceSubtotal)],
      [`${pending(form.serviceFeeLabel)} 稅額`, money(form.serviceTax)],
      [`${pending(form.serviceFeeLabel)} 總計含稅`, money(form.serviceTotal)],
      [`${pending(form.cleaningFeeLabel)} 小計`, money(form.cleaningSubtotal)],
      [`${pending(form.cleaningFeeLabel)} 稅額`, money(form.cleaningTax)],
      [`${pending(form.cleaningFeeLabel)} 總計含稅`, money(form.cleaningTotal)],
      ['總計費用', totalFeeText(form)],
      ['訂金', money(form.deposit)],
      ['尾款', money(form.balance)]
    ];
    const itemRows = enabledCategoryRows.map((row) => ({
      編號: row.number,
      區域: row.area,
      施工細項: stripColorTags(row.detail)
    }));
    const wb = XLSX.utils.book_new();
    const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
    infoSheet['!cols'] = [{ wch: 24 }, { wch: 42 }];
    XLSX.utils.book_append_sheet(wb, infoSheet, '基本資料');

    const notesSheet = XLSX.utils.aoa_to_sheet([['特別說明'], ...linesFromText(form.specialNotes).map((line) => [stripColorTags(line)])]);
    notesSheet['!cols'] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, notesSheet, '特別說明');

    const itemsSheet = XLSX.utils.json_to_sheet(itemRows);
    itemsSheet['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(wb, itemsSheet, '施工項目');

    const termsSheet = XLSX.utils.aoa_to_sheet([['條款及細則'], ...linesFromText(form.terms).map((line) => [stripColorTags(line)])]);
    termsSheet['!cols'] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, termsSheet, '條款及細則');

    XLSX.writeFile(wb, `場勘報價清單_${pending(form.company)}.xlsx`);
    setStatus('已下載 Excel');
  }

  async function downloadPdf() {
    try {
      setStatus('正在產生 PDF...');
      const pdfBytes = await createNativeQuotePdf(form, enabledCategoryRows);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `場勘報價清單_${pending(form.company)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus('已下載 PDF');
    } catch (error) {
      console.error(error);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(buildPrintHtml(form, enabledCategoryRows));
      printWindow.document.close();
      setStatus('PDF 模板產生失敗，已開啟列印視窗。');
    }
  }

  const fields = [
    ['title', '估價單名稱'],
    ['company', '公司名稱'],
    ['taxId', '統編'],
    ['contact', '聯絡人姓名'],
    ['phone', '聯絡電話'],
    ['building', '社區/大樓'],
    ['roomSummary', '房型/格局'],
    ['projectType', '型態'],
    ['quoteDate', '日期', 'date'],
    ['validUntil', '有效日期', 'date'],
    ['address', '地址']
  ];

  const metaRows = [
    { label: '日期', value: pending(form.quoteDate) },
    { label: '有效日期至', value: pending(form.validUntil) },
    { label: '公司名稱', value: pending(form.company) },
    { label: '統編', value: pending(form.taxId) },
    { label: '聯絡人', value: pending(form.contact) },
    { label: '聯絡電話', value: pending(form.phone) },
    { label: '社區', value: pending(form.building) },
    { label: '型態', value: pending(form.projectType) },
    { label: '地址', value: pending(form.address), wide: true }
  ];

  const feeGroups = [
    {
      labelField: 'serviceFeeLabel',
      labelText: '費用 A 標題',
      placeholder: '清潔費用 A',
      fields: [
        ['serviceSubtotal', '小計'],
        ['serviceTax', '稅額'],
        ['serviceTotal', '總計含稅']
      ]
    },
    {
      labelField: 'cleaningFeeLabel',
      labelText: '費用 B 標題',
      placeholder: '清潔費用 B',
      fields: [
        ['cleaningSubtotal', '小計'],
        ['cleaningTax', '稅額'],
        ['cleaningTotal', '總計含稅']
      ]
    }
  ];

  const paymentSummaryFields = [
    ['deposit', '訂金匯款'],
    ['balance', '尾款']
  ];

  const quickColors = ['#d92626', '#f59e0b', '#2f7d32', '#2563eb', '#7c3aed', '#111827'];

  return (
    <main className="min-h-screen bg-[#eef3ea] text-stone-900">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-5 px-4 py-5 lg:h-screen lg:flex-row lg:overflow-hidden">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#d9e2d2] bg-white shadow-soft">
          <div className="relative overflow-visible border-b border-[#dbe4d5] bg-gradient-to-r from-white to-[#f4f8f0] px-5 py-4">
            <div className="pointer-events-none absolute right-5 top-4 opacity-90" aria-hidden="true">
              <img className="kitty-mini" src="/assets/hello-kitty-accent.png" alt="" />
            </div>
            <div className="pr-24">
              <p className="text-xs font-bold uppercase text-moss-700">Professional site survey quotation</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-normal text-stone-950">場勘報價清單產生器</h1>
                <div ref={caseMenuRef} className="relative z-30 inline-flex">
                  <button
                    type="button"
                    onClick={() => setCaseMenuOpen((current) => !current)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c8d9bd] bg-white text-lg text-moss-800 shadow-sm transition hover:bg-moss-50 hover:text-moss-900"
                    aria-label="個案管理"
                    title="個案管理"
                  >
                    📁
                  </button>
                  {caseMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-80 overflow-hidden rounded-lg border border-[#c8d9bd] bg-white shadow-[0_18px_55px_rgba(35,55,31,0.2)]">
                      <div className="flex items-center justify-between border-b border-[#e4ecdd] px-3 py-2">
                        <span className="text-xs font-black uppercase tracking-wide text-moss-700">📁 個案管理</span>
                        <span className="text-[11px] font-bold text-stone-500">{savedCases.length} 筆</span>
                      </div>
                      {savedCases.length ? (
                        <div className="max-h-80 overflow-auto p-2">
                          {savedCases.map((savedCase) => (
                            <div
                              key={savedCase.id}
                              className={`mb-2 rounded-md border p-2 last:mb-0 ${
                                currentCaseId === savedCase.id
                                  ? 'border-moss-600 bg-[#edf7e6]'
                                  : 'border-[#dfe8d8] bg-white'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => loadSavedCase(savedCase)}
                                className="block w-full text-left"
                              >
                                <span className="block text-sm font-black text-stone-900">{savedCase.name || '未命名案件'}</span>
                                <span className="mt-1 block text-xs leading-5 text-stone-500">
                                  最後儲存：{savedCase.savedAt ? new Date(savedCase.savedAt).toLocaleString('zh-TW', { hour12: false }) : '未記錄'}
                                </span>
                              </button>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-moss-700">
                                  {currentCaseId === savedCase.id ? '目前開啟' : '點擊開啟'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteSavedCase(savedCase.id, savedCase.name)}
                                  className="rounded-full border border-red-200 px-2 py-1 text-[11px] font-black text-red-600 transition hover:bg-red-50"
                                >
                                  刪除
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-5 text-sm leading-6 text-stone-600">
                          目前還沒有儲存案件。先按旁邊的 💾 儲存，這裡就會出現可開啟的清單。
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={saveCurrentCase}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c8d9bd] bg-white text-lg text-moss-800 shadow-sm transition hover:bg-moss-50 hover:text-moss-900"
                  aria-label="儲存案件"
                  title={lastSavedAt ? `儲存案件｜最後儲存：${new Date(lastSavedAt).toLocaleString('zh-TW', { hour12: false })}` : '儲存案件'}
                >
                  💾
                </button>
                <div ref={settingsMenuRef} className="relative z-30 inline-flex">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((current) => !current)}
                    className={`daisy-settings-button flex h-9 w-9 items-center justify-center rounded-full border border-[#c8d9bd] bg-white text-moss-800 shadow-sm transition hover:bg-moss-50 hover:text-moss-900 ${settingsOpen ? 'is-open' : ''}`}
                    aria-label="設定"
                    title="設定"
                  >
                    {renderDaisySettingsIcon()}
                  </button>
                  {settingsOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-lg border border-[#c8d9bd] bg-white shadow-[0_18px_55px_rgba(35,55,31,0.2)]">
                      <div className="px-3 py-2 text-xs font-black uppercase tracking-wide text-moss-700">公司預設範本</div>
                      <div className="h-px bg-[#e4ecdd]" />
                      <button
                        type="button"
                        onClick={() => runSettingsAction(updateCompanyTemplate)}
                        className="flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold text-stone-800 transition hover:bg-moss-50"
                      >
                        💾 更新公司預設範本
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          companyTemplateInputRef.current?.click();
                        }}
                        className="flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold text-stone-800 transition hover:bg-moss-50"
                      >
                        📥 匯入公司預設範本
                      </button>
                      <button
                        type="button"
                        onClick={() => runSettingsAction(exportCompanyTemplate)}
                        className="flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold text-stone-800 transition hover:bg-moss-50"
                      >
                        📤 匯出公司預設範本
                      </button>
                      <button
                        type="button"
                        onClick={() => runSettingsAction(restoreSystemTemplate)}
                        className="flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        ↩ 恢復系統原始範本
                      </button>
                      <div className="h-px bg-[#e4ecdd]" />
                      {['🏢 公司資料設定', '🖼 Logo／QR Code 設定', '🎨 PDF 樣式設定'].map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => runSettingsAction(() => showComingSoon(label.replace(/^[^ ]+\s*/, '')))}
                          className="flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition hover:bg-moss-50"
                        >
                          {label}
                        </button>
                      ))}
                      <div className="h-px bg-[#e4ecdd]" />
                      <button
                        type="button"
                        onClick={() => runSettingsAction(() => setStatus('系統版本：0.1.0'))}
                        className="flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition hover:bg-moss-50"
                      >
                        ℹ 系統版本
                      </button>
                      <input
                        ref={companyTemplateInputRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={importCompanyTemplate}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                先套用清潔範本，再將 LINE 對話解析為補充項目，產出可供客戶確認的正式估價單內容。
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-5">
            <AccordionSection
              title="客戶資料"
              description="估價單抬頭、日期、聯絡資訊與地址。"
              open={openSections.customer}
              onToggle={() => toggleSection('customer')}
              className="order-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map(([field, label, type = 'text']) => (
                  <label key={field} className={field === 'address' || field === 'title' ? 'sm:col-span-2' : ''}>
                    <span className="mb-1 block text-sm font-semibold text-stone-700">{label}</span>
                    <input
                      type={type}
                      value={form[field]}
                      onChange={(event) => updateField(field, event.target.value)}
                      className="h-11 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[15px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      placeholder=""
                    />
                  </label>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection
              title="場勘內容"
              description="貼上 LINE 對話、場勘文字，或匯入既有 PDF / Excel。"
              open={openSections.survey}
              onToggle={() => toggleSection('survey')}
              className="order-1"
            >
              <label className="block rounded-md border-2 border-moss-700 bg-[#edf7e6] p-4 shadow-sm ring-4 ring-[#dcebd3]">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-moss-700 px-3 py-1 text-xs font-black tracking-wide text-white">
                        先選這裡
                      </span>
                      <button
                        type="button"
                        onClick={resetCurrentCase}
                        className="inline-flex h-7 items-center rounded-full border border-[#b9d0ad] bg-white px-3 text-xs font-black text-moss-800 shadow-sm transition hover:bg-moss-50"
                      >
                        開新案件
                      </button>
                    </div>
                    <span className="mt-2 block text-base font-black text-moss-900">清潔類型 / 套用範本</span>
                    <span className="mt-1 block text-xs leading-5 text-moss-800">
                      選擇後會自動帶入常用施工項目、標準注意事項與其他事項，所有內容仍可手動編輯。
                    </span>
                  </div>
                  <span className="rounded-md bg-white px-3 py-2 text-xs font-bold text-moss-700 ring-1 ring-[#b9d0ad]">
                    目前：{form.cleaningType || '請選擇清潔類型'}
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={cleaningTypeSelectValue(form.cleaningType)}
                    onChange={(event) => applyCleaningTemplate(event.target.value)}
                    className="h-13 w-full cursor-pointer appearance-none rounded-md border-2 border-moss-700 bg-white px-4 py-3 pr-11 text-[17px] font-black text-moss-800 shadow-inner outline-none transition hover:bg-[#fbfff8] focus:border-moss-800 focus:ring-4 focus:ring-moss-100"
                  >
                    <option value="">請選擇清潔類型</option>
                    {CLEANING_TEMPLATE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-moss-700" size={22} />
                </div>
                {cleaningTypeSelectValue(form.cleaningType) === '其他' && (
                  <div className="mt-3 rounded-md border border-[#d7e5cf] bg-white p-3">
                    <span className="mb-2 block text-sm font-bold text-stone-800">自訂清潔名稱</span>
                    <input
                      value={customCleaningTypeValue(form.cleaningType)}
                      onChange={(event) => updateCustomCleaningType(event.target.value)}
                      placeholder="例如：辦公室清潔、店面清潔、退租補強清潔"
                      className="h-11 w-full rounded-md border border-[#cbdcc2] bg-[#fbfff8] px-3 text-sm font-semibold text-moss-900 outline-none transition focus:border-moss-700 focus:ring-4 focus:ring-moss-100"
                    />
                    <p className="mt-2 text-xs leading-5 text-stone-500">
                      選擇其他時，施工項目 1-7 會保留空白，僅保留注意事項與其他事項內容。
                    </p>
                  </div>
                )}
              </label>

              <section className="rounded-md border border-[#d7e5cf] bg-[#f4f9ef] p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">匯入既有估價單</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      支援 PDF、Excel、CSV。匯入後會嘗試帶入客戶資料，施工內容只會新增為補充項目。
                    </p>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-white px-4 text-sm font-bold text-moss-700 ring-1 ring-[#c8d9bd] transition hover:bg-moss-50">
                    選擇檔案
                    <input type="file" accept=".pdf,.xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
                  </label>
                </div>
              </section>

              <label className="block rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-sm font-semibold text-stone-800">貼上 LINE 對話或場勘文字內容</span>
                    <span className="block text-xs text-stone-500">貼上後可解析為補充項目，會保留目前清潔範本內容。</span>
                  </div>
                  <span className="rounded-full bg-moss-50 px-3 py-1 text-xs font-bold text-moss-700">補充解析</span>
                </div>
                <textarea
                  value={form.rawText}
                  onChange={(event) => updateField('rawText', event.target.value)}
                  onPaste={handleRawTextPaste}
                  className="min-h-[230px] w-full resize-y rounded-md border border-[#cfd8c8] bg-[#fffefb] p-3 text-[15px] leading-7 outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                  placeholder="例：客廳牆面要補土油漆、主臥窗戶玻璃清潔、廚房流理台除油，管委會施工時間需確認..."
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => previewCustomerContent(form.rawText)}
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-moss-800 ring-1 ring-[#b9d0ad] transition hover:bg-moss-50"
                  >
                    客戶資料 AI
                  </button>
                  <button
                    type="button"
                    onClick={parseLineSupplements}
                    disabled={isOrganizing}
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-moss-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-moss-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles size={18} />
                    {isOrganizing ? '解析中' : '施工內容 AI'}
                  </button>
                  <span className="text-xs leading-5 text-stone-500">先產生預覽，確認後才會套用到表單或施工項目。</span>
                </div>
              </label>
            </AccordionSection>

            {customerAiPreview && (
              <section className="order-2 rounded-md border border-[#c8d9bd] bg-white p-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black text-moss-800">客戶資料解析預覽</h3>
                    <p className="mt-1 text-xs leading-5 text-stone-500">只解析客戶資料，不會改動施工項目。確認後才會套用到表單。</p>
                  </div>
                  <button
                    type="button"
                    onClick={applyCustomerAiPreview}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-moss-700 px-4 text-sm font-bold text-white transition hover:bg-moss-800"
                  >
                    套用客戶資料
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {[
                    ['quoteDate', '日期'],
                    ['validUntil', '有效日期至'],
                    ['companyName', '公司名稱'],
                    ['taxId', '統編'],
                    ['contactName', '聯絡人'],
                    ['contactPhone', '聯絡電話'],
                    ['community', '社區'],
                    ['roomSummary', '房型'],
                    ['houseType', '型態'],
                    ['address', '地址']
                  ].map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="mb-1 block text-xs font-bold text-moss-700">{label}</span>
                      <input
                        value={customerAiPreview[field] || ''}
                        onChange={(event) => updateCustomerPreviewField(field, event.target.value)}
                        className="h-9 w-full rounded-md border border-[#cfd8c8] bg-white px-2 text-sm outline-none focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      />
                    </label>
                  ))}
                </div>
                {customerAiPreview.unclassified?.length > 0 && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <h4 className="text-xs font-black text-amber-800">未分類內容</h4>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
                      {customerAiPreview.unclassified.map((text, index) => (
                        <li key={`${text}-${index}`}>・{text}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {aiSupplementPreview && (
              <section className="order-2 rounded-md border border-[#c8d9bd] bg-white p-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black text-moss-800">施工內容解析預覽</h3>
                    <p className="mt-1 text-xs leading-5 text-stone-500">只解析施工內容，不會改動客戶資料。確認後才會套用到施工項目。</p>
                  </div>
                  <button
                    type="button"
                    onClick={applyAiSupplementPreview}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-moss-700 px-4 text-sm font-bold text-white transition hover:bg-moss-800"
                  >
                    套用施工項目
                  </button>
                </div>

                <div className="space-y-2">
                  {aiSupplementPreview.detectedItems.map((item, index) => (
                    <div key={`${item.sourceText}-${index}`} className="grid gap-2 rounded-md border border-[#edf2e8] bg-[#fbfdf8] p-2 lg:grid-cols-[72px_140px_1fr_36px]">
                      <label className="flex items-center gap-2 text-xs font-bold text-moss-700">
                        <input
                          type="checkbox"
                          checked={item.enabled !== false}
                          onChange={(event) => updateAiPreviewItem(index, { enabled: event.target.checked })}
                          className="h-4 w-4 accent-moss-700"
                        />
                        加入
                      </label>
                      <select
                        value={item.categoryNo}
                        onChange={(event) => updateAiPreviewItem(index, { categoryNo: event.target.value })}
                        className="h-9 rounded-md border border-[#cfd8c8] bg-white px-2 text-sm font-bold text-moss-700 outline-none focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      >
                        {FIXED_CONSTRUCTION_CATEGORIES.map((category) => (
                          <option key={category.categoryNo} value={category.categoryNo}>
                            {category.categoryNo}. {category.categoryName}
                          </option>
                        ))}
                      </select>
                      <div className="min-w-0">
                        <input
                          value={item.suggestedContent}
                          onChange={(event) => updateAiPreviewItem(index, { suggestedContent: event.target.value })}
                          className="h-9 w-full rounded-md border border-[#cfd8c8] bg-white px-2 text-sm outline-none focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        />
                        <p className="mt-1 truncate text-[11px] text-stone-500">來源：{item.sourceText}｜信心 {Math.round((item.confidence || 0) * 100)}%</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAiPreviewItem(index)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-red-100 bg-white text-red-500 transition hover:border-red-200 hover:bg-red-50"
                        title="刪除"
                        aria-label="刪除解析結果"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {aiSupplementPreview.unclassified.length > 0 && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <h4 className="text-xs font-black text-amber-800">未分類內容</h4>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
                      {aiSupplementPreview.unclassified.map((text, index) => (
                        <li key={`${text}-${index}`}>・{text}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            <AccordionSection
              title="施工項目"
              description="範本與 LINE 補充都會顯示在這裡，可手動微調與標色。"
              open={openSections.items}
              onToggle={() => toggleSection('items')}
              className="order-4"
            >
              <section className="rounded-md border border-[#dfe8d8] bg-white p-3">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">施作項目手動編輯</h2>
                    <p className="mt-1 text-xs text-stone-500">範本項目與 LINE 補充都可在這裡微調文字，也可以選取文字套用任意顏色。</p>
                  </div>
                  <button
                    type="button"
                    onClick={addCategoryRow}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#c8d9bd] bg-[#f4f9ef] px-3 text-sm font-bold text-moss-700 transition hover:bg-moss-50"
                  >
                    <Plus size={16} />
                    新增項目
                  </button>
                </div>
                <div className="space-y-3">
                  {categoryRows.map((row) => (
                    <div
                      key={row.key}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        moveCategoryRow(draggingCategoryKey || event.dataTransfer.getData('text/plain'), row.key);
                        setDraggingCategoryKey('');
                      }}
                      className={`grid gap-2 rounded-md border p-2 transition md:grid-cols-[128px_minmax(0,1fr)_40px] ${
                        draggingCategoryKey === row.key
                          ? 'border-moss-600 bg-moss-50 opacity-60'
                          : 'border-[#edf2e8] bg-[#fbfdf8]'
                      }`}
                    >
                      <span className="space-y-1">
                        <label className="flex items-center gap-2 text-xs font-bold text-moss-700">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={() => toggleCategoryEnabled(row.key)}
                            className="h-4 w-4 accent-moss-700"
                          />
                          <span>項目 {row.number}</span>
                          {!row.enabled && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">已停用</span>}
                        </label>
                        <input
                          value={row.area}
                          onChange={(event) => updateCategoryLabel(row.key, event.target.value)}
                          className="h-9 w-full rounded-md border border-[#cfd8c8] bg-white px-2 text-sm font-bold text-moss-700 outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        />
                      </span>
                      <div className="min-w-0 rounded-md border border-[#cfd8c8] bg-[#fffefb] p-3">
                        {(() => {
                          const visibleContents = row.contents.filter((content) => !content.deleted);
                          const tagContents = visibleContents.filter((content) => content.type !== 'paragraph');
                          const paragraphContents = visibleContents.filter((content) => content.type === 'paragraph');
                          const hasParagraphSection = LONG_CONTENT_CATEGORIES.has(row.area);
                          return (
                            <>
                              <div className="flex flex-wrap gap-2">
                                {tagContents.length ? (
                                  tagContents.map((content) => renderContentEditor(row, content))
                                ) : (
                                  <span className="text-xs text-stone-400">尚無標準施工內容，可新增內容。</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => addContentItem(row.key)}
                                  className="inline-flex h-8 items-center gap-1 rounded-full border border-[#c8d9bd] bg-[#f4f9ef] px-3 text-xs font-bold text-moss-700 transition hover:bg-moss-50"
                                >
                                  <Plus size={14} />
                                  新增內容
                                </button>
                              </div>

                              {hasParagraphSection && (
                                <div className="mt-3 border-t border-dashed border-[#c8d9bd] pt-3">
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-moss-700">段落說明</span>
                                    <button
                                      type="button"
                                      onClick={() => addParagraphItem(row.key)}
                                      className="inline-flex h-7 items-center gap-1 rounded-full border border-[#c8d9bd] bg-white px-2.5 text-xs font-bold text-moss-700 transition hover:bg-moss-50"
                                    >
                                      <Plus size={13} />
                                      新增段落
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {paragraphContents.length ? (
                                      paragraphContents.map((content) => renderContentEditor(row, content))
                                    ) : (
                                      <span className="text-xs text-stone-400">尚無段落說明。</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex shrink-0 justify-end gap-1 md:w-10 md:flex-col md:items-stretch">
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggingCategoryKey(row.key);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', row.key);
                          }}
                          onDragEnd={() => setDraggingCategoryKey('')}
                          className="flex h-9 w-9 cursor-grab items-center justify-center rounded-md border border-[#cfd8c8] bg-white text-moss-700 active:cursor-grabbing"
                          title="拖拉排序"
                          aria-label={`拖拉項目 ${row.number}`}
                        >
                          <GripVertical size={16} />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCategoryRow(row.key)}
                          className="flex h-9 w-9 items-center justify-center rounded-md border border-red-100 bg-white text-red-500 transition hover:border-red-200 hover:bg-red-50"
                          title="刪除此施工項目"
                          aria-label={`刪除項目 ${row.number}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </AccordionSection>

            <AccordionSection
              title="費用與付款"
              description="清潔費用、訂金尾款與付款資訊。"
              open={openSections.payment}
              onToggle={() => toggleSection('payment')}
              className="order-5"
            >
              <section className="rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">費用資訊</h2>
                    <p className="mt-1 text-xs text-stone-500">只輸入數字即可，預覽會自動顯示 NT$。不填則留白。</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-moss-700 ring-1 ring-[#dfe8d8]">Optional</span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {feeGroups.map((group) => (
                    <div key={group.labelField} className="rounded-md border border-[#dfe8d8] bg-white p-3">
                      <label>
                        <span className="mb-1 block text-xs font-bold text-stone-600">{group.labelText}</span>
                        <input
                          value={form[group.labelField]}
                          onChange={(event) => updateField(group.labelField, event.target.value)}
                          className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] font-bold text-moss-700 outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                          placeholder={group.placeholder}
                        />
                      </label>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {group.fields.map(([field, label]) => (
                          <label key={field}>
                            <span className="mb-1 block text-xs font-bold text-stone-600">{label}</span>
                            <input
                              inputMode="numeric"
                              value={form[field]}
                              onChange={(event) => updateField(field, event.target.value)}
                              className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                              placeholder=""
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 rounded-md border border-[#dfe8d8] bg-white p-3 sm:grid-cols-[0.7fr_0.7fr_1.8fr]">
                  {paymentSummaryFields.map(([field, label]) => (
                    <label key={field}>
                      <span className="mb-1 block text-xs font-bold text-stone-600">{label}</span>
                      <input
                        inputMode="numeric"
                        value={form[field]}
                        onChange={(event) => updateField(field, event.target.value)}
                        className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        placeholder=""
                      />
                    </label>
                  ))}
                  <div>
                    <span className="mb-1 block text-xs font-bold text-stone-600">總計費用</span>
                    <div className="flex h-10 items-center rounded-md border border-[#cfd8c8] bg-[#f4f9ef] px-3 text-[14px] font-bold text-moss-700">
                      {totalFeeText(form)}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-[#dfe8d8] bg-white p-3">
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-stone-800">條款及細則付款條件</h2>
                  <p className="mt-1 text-xs text-stone-500">會同步顯示在右側估價單的條款及簽核區。</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_CONDITIONS.map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => updateField('paymentCondition', condition)}
                      className={`h-10 rounded-md border text-sm font-bold transition ${
                        form.paymentCondition === condition
                          ? 'border-moss-700 bg-moss-700 text-white shadow-sm'
                          : 'border-[#cfd8c8] bg-[#fbfdf8] text-moss-700 hover:bg-moss-50'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
                {form.paymentCondition === '其他' ? (
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-bold text-stone-600">其他付款條件</span>
                    <input
                      value={form.paymentConditionOther}
                      onChange={(event) => updateField('paymentConditionOther', event.target.value)}
                      className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      placeholder="請輸入付款條件"
                    />
                  </label>
                ) : null}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-xs font-bold text-stone-600">付款期限</span>
                    <input
                      value={form.paymentDeadline}
                      onChange={(event) => updateField('paymentDeadline', event.target.value)}
                      className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      placeholder="施作完畢後付款，匯費勿內扣。"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-stone-600">施作日期</span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={/^\d{4}-\d{2}-\d{2}$/.test(form.serviceDate) ? form.serviceDate : ''}
                        onChange={(event) => updateField('serviceDate', event.target.value)}
                        className="h-10 min-w-0 flex-1 rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        placeholder="待訂或 YYYY-MM-DD"
                      />
                      <button
                        type="button"
                        onClick={() => updateField('serviceDate', '待訂')}
                        className="h-10 rounded-md border border-[#cfd8c8] bg-[#fbfdf8] px-3 text-sm font-bold text-moss-700 transition hover:bg-moss-50"
                      >
                        待訂
                      </button>
                    </div>
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-stone-600">施作時間</span>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={form.serviceStartTime}
                        onChange={(event) => updateField('serviceStartTime', event.target.value)}
                        className="h-10 min-w-0 flex-1 rounded-md border border-[#cfd8c8] bg-white px-2 text-[14px] outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        aria-label="施作開始時間"
                      />
                      <input
                        type="time"
                        value={form.serviceEndTime}
                        onChange={(event) => updateField('serviceEndTime', event.target.value)}
                        className="h-10 min-w-0 flex-1 rounded-md border border-[#cfd8c8] bg-white px-2 text-[14px] outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        aria-label="施作結束時間"
                      />
                    </div>
                  </label>
                </div>
              </section>

            </AccordionSection>

            <AccordionSection
              title="施工說明"
              description="估價單上方施工須知內容。"
              open={openSections.notes}
              onToggle={() => toggleSection('notes')}
              className="order-6"
            >
              <label className="block rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
                <span className="mb-1 block text-sm font-semibold text-stone-800">施工說明</span>
                <span className="mb-2 block text-xs text-stone-500">會顯示在估價單右上方，建議保留品質、驗收、現場差異等說明。</span>
                <RichTextEditor
                  editorId="form:constructionNotes"
                  value={form.constructionNotes}
                  onChange={(value) => updateField('constructionNotes', value)}
                  onActivate={handleRichEditorActivate}
                  className="min-h-28 w-full overflow-auto whitespace-pre-wrap rounded-md border border-[#cfd8c8] bg-white p-3 text-[15px] leading-7 outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                />
              </label>

            </AccordionSection>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#dbe4d5] bg-[#fbfdf8] px-5 py-4">
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-[#dfe8d8]">
              <span className="text-xs font-bold text-stone-500">快速標色</span>
              {quickColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setHighlightColor(color);
                    applyColorToSelection(color);
                  }}
                  className="h-6 w-6 rounded-full border border-white shadow ring-1 ring-stone-200"
                  style={{ backgroundColor: color }}
                  title={`套用 ${color}`}
                />
              ))}
              <input
                type="color"
                value={highlightColor}
                onChange={(event) => setHighlightColor(event.target.value)}
                onBlur={() => applyColorToSelection(highlightColor)}
                className="h-7 w-8 cursor-pointer rounded border border-[#cfd8c8] bg-white p-0.5"
                title="自訂顏色，選完後套用"
              />
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-sm text-stone-600 ring-1 ring-[#dfe8d8]">{status || '等待貼上場勘文字'}</p>
          </div>
        </section>

        <section className="flex min-h-0 flex-[1.45] flex-col overflow-hidden rounded-lg border border-[#d2dfca] bg-paper shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-leaf bg-[#3f6535] px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold opacity-90">正式估價單版型</p>
              <h2 className="text-2xl font-bold tracking-normal">估價單預覽</h2>
            </div>
            <div className="flex gap-2">
              <button title="加入 Google 行事曆" onClick={addToGoogleCalendar} className="icon-button">
                加入 Google 行事曆
              </button>
              <button title="複製結果" onClick={copyResult} className="icon-button">
                複製
              </button>
              <button title="下載預覽版 PDF" onClick={downloadPdf} className="icon-button">
                PDF
              </button>
              <button title="下載 Excel" onClick={downloadExcel} className="icon-button">
                EXCEL
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-[#edf2e8] p-4">
            <article ref={quoteRef} className="quote-export mx-auto overflow-hidden border-2 border-[#1e2d1b] bg-white text-[#25381f] shadow-[0_20px_60px_rgba(40,64,35,0.18)]">
              <section className="quote-header grid grid-cols-1 bg-[#e8f3df] text-[#4f7d35] md:grid-cols-[1.2fr_0.9fr_170px]" style={quotePreviewLayoutStyle}>
                <div className="px-6 py-5">
                  <p className="quote-kicker mb-1 text-center text-xs font-bold uppercase text-[#6f9461]">Quotation</p>
                  <h3 className="mb-4 text-center text-3xl font-semibold tracking-normal text-[#3f6535]">{pending(form.title)}</h3>
                  <p className="quote-contact-reminder">如對本報價內容有任何疑問，歡迎透過 LINE 商家與我們聯繫。</p>
                  <div className="grid overflow-hidden border-l border-t border-[#c6d9ba] sm:grid-cols-2">
                    {metaRows.map(({ label, value, wide }) => (
                      <div key={label} className={`grid min-w-0 grid-cols-[88px_minmax(0,1fr)] border-b border-r border-[#c6d9ba] text-[12px] ${wide ? 'sm:col-span-2' : ''}`}>
                        <div className="flex items-center justify-center bg-white/40 px-2 py-2 text-center font-bold leading-5">{label}</div>
                        <div className="min-w-0 overflow-hidden break-words px-2 py-2 leading-5 text-[#385f2c] [overflow-wrap:anywhere]">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-5">
                  <p className="construction-notice-title">施工須知</p>
                  <div className="construction-notice-list">
                    {constructionNoticeCards(form.constructionNotes).map((card, index) => {
                      const Icon = [SprayCan, UsersRound, ShieldCheck, Camera][index] || ShieldCheck;
                      const isImportant = card.text.includes('[color=#d71920]') || card.text.includes('#d71920');
                      return (
                        <div key={`${card.title}-${index}`} className={`construction-notice-card ${isImportant ? 'construction-notice-card-important' : ''}`}>
                          <div className="construction-notice-icon"><Icon size={constructionNoticePreviewConfig.iconSize} strokeWidth={constructionNoticePreviewConfig.iconStrokeWidth} /></div>
                          <div className="construction-notice-copy">
                            <p className="construction-notice-heading">{card.title}</p>
                            <div className="construction-notice-text">
                              {card.text.split('\n').map((line) => (
                                <p key={line}><RichText text={line} /></p>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <aside className="border-t border-[#c6d9ba] bg-[#f4f8ef] px-4 py-5 text-center md:border-l md:border-t-0">
                  <img className="brand-logo-mark mx-auto mb-2" src="/assets/brand-logo-mark.png" alt="微笑清家 Logo" />
                  <p className="brand-name text-xl font-bold tracking-normal text-moss-800">微笑清家</p>
                  <p className="brand-site mx-auto mb-3 max-w-[120px] break-all text-[10px] leading-4 text-moss-700">meant2clean.com</p>
                  <div className="brand-qr-secondary mb-3 flex justify-center gap-2">
                    <div className="brand-qr-mini">
                      <span>IG</span>
                      <img src="/assets/brand-qr-instagram.png" alt="Instagram QR" />
                    </div>
                    <div className="brand-qr-mini">
                      <span>FB</span>
                      <img src="/assets/brand-qr-facebook.png" alt="Facebook QR" />
                    </div>
                  </div>
                  <div className="brand-qr-primary flex justify-center">
                    <img src="/assets/brand-qr-line.png" alt="LINE QR Code" />
                  </div>
                </aside>
              </section>

              <div className="quote-items-title-bar border-y border-[#1e2d1b] bg-[#548436] px-4 py-2.5 text-center text-2xl font-semibold tracking-[0.18em] text-white" style={quoteItemsLayoutStyle}>
                {formatRoomSummary(form.roomSummary)} 施 作 項 目
              </div>

              <div className="quote-items-grid" style={quoteItemsLayoutStyle}>
                  {enabledCategoryRows.map((row) => {
                    const highlighted = constructionItemsPreviewConfig.featuredNumbers.includes(Number(row.number));
                    return (
                      <div key={row.area} className={`quote-item-row ${highlighted ? 'is-highlighted' : ''}`}>
                        <div className="quote-item-cell quote-item-no">{row.number}</div>
                        <div className="quote-item-cell quote-item-area">{row.area}</div>
                        <div className="quote-item-cell quote-item-detail">
                          <span className="quote-item-detail-text"><RichText text={row.detail} /></span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <section className="quote-bottom-frame">
                <div className="qbf-head">
                  <div className="qbf-title">費 用 摘 要</div>
                  <div className="qbf-title">條 款 及 簽 核</div>
                </div>
                <div className="qbf-summary" style={bottomSummaryLayoutStyle}>
                  <div className="qbf-fees">
                    <div className="qbf-fee-cards">
                      {[
                        [pending(form.serviceFeeLabel), [
                          ['小計', money(form.serviceSubtotal)],
                          ['稅額', money(form.serviceTax)],
                          ['總計含稅', money(form.serviceTotal)]
                        ]],
                        [pending(form.cleaningFeeLabel), [
                          ['小計', money(form.cleaningSubtotal)],
                          ['稅額', money(form.cleaningTax)],
                          ['總計含稅', money(form.cleaningTotal)]
                        ]]
                      ].map(([title, rows]) => (
                        <div key={title} className="qbf-fee-card">
                          <p className="qbf-fee-name">{title}</p>
                          <div className="qbf-fee-table">
                            {rows.map(([label, value]) => (
                              <div key={label} className="qbf-fee-row">
                                <span>{label}</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="qbf-total">
                      <span className="qbf-total-badge"><span className="qbf-total-badge-text">應付總額</span></span>
                      <span className="cell-content">{totalFeeText(form)}</span>
                    </div>
                    <div className="qbf-installments">
                      <div>訂金匯款：{money(form.deposit)}</div>
                      <div>尾款：{money(form.balance)}</div>
                    </div>
                  </div>
                  <div className="qbf-terms">
                    <div className="qbf-term-list">
                      {[
                        ['1', '付款條件', paymentConditionText(form)],
                        ['2', '付款期限', pending(form.paymentDeadline)],
                        ['3', '施作日期', pending(form.serviceDate)]
                      ].map(([number, label, value]) => (
                        <div key={label} className="qbf-term-row">
                          <span>{number}</span>
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="qbf-term-note">
                      <p>驗收完畢完成驗收通過（照片/影片或放棄驗收）</p>
                      <p>視同「完成通過驗收」 事後無法要求管家再回現場進行二次清潔。</p>
                    </div>
                  </div>
                </div>
                <div className="qbf-main" style={termsSignatureLayoutStyle}>
                  <div className="qbf-payment">
                    <div className="qbf-section-label">
                      <span>付款資訊</span>
                      <span className="qbf-payment-reminder">匯款後請提供末五碼，以利對帳</span>
                    </div>
                    <div className="qbf-payment-content">
                      <div className="qbf-bank-wrap">
                        <img className="bank-cover-image" src="/assets/bank-cover.png" alt="付款帳戶資訊" />
                      </div>
                      <div className="qbf-transfer-wrap">
                        <div className="payment-qr-label">掃碼付款</div>
                        <img className="payment-transfer-qr" src="/assets/payment-transfer-qr.png" alt="匯款 QR Code" />
                      </div>
                    </div>
                  </div>
                  <div className="qbf-signatures">
                    <div className="qbf-signature-card qbf-signature-quote">
                      <div className="signature-title signature-title-quote">接受報價簽名</div>
                      <div className="qbf-signature-area">
                        <div className="qbf-signature-line">簽名 / 日期</div>
                      </div>
                    </div>
                    <div className="qbf-signature-card qbf-signature-acceptance">
                      <div className="signature-title signature-title-acceptance">驗收簽名</div>
                      <div className="qbf-signature-area">
                        <div className="qbf-signature-line">簽名 / 日期</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="qbf-footer-note">
                  本估價單內容依場勘紀錄與客戶提供資訊整理，實際施作範圍以雙方確認版本為準。
                </div>
              </section>
            </article>
          </div>
        </section>
      </div>
      {confirmDialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-lg border border-[#c8d9bd] bg-white p-5 shadow-[0_24px_80px_rgba(28,45,24,0.28)]">
            <h3 className="text-lg font-bold text-stone-950">{confirmDialog.title}</h3>
            <p className="mt-3 text-sm leading-6 text-stone-600">{confirmDialog.message}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmDialog}
                className="h-10 rounded-md border border-[#cfd8c8] bg-white px-4 text-sm font-bold text-moss-700 transition hover:bg-moss-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmAndClose}
                className="h-10 rounded-md bg-moss-700 px-4 text-sm font-bold text-white transition hover:bg-moss-800"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
