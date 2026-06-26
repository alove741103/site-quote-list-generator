export const quoteLayoutConfig = {
  version: 'quote-layout-v5-header-brand-meta',
  pdf: {
    page: {
      width: 595.28,
      height: 841.89
    },
    outer: {
      x: 24,
      y: 7,
      width: 547,
      height: 821
    },
    header: {
      height: 208,
      leftWidth: 246,
      brandWidth: 90,
      title: {
        quotationX: 16,
        quotationY: 13,
        quotationFontSize: 8.5,
        titleX: 16,
        titleY: 30,
        titleMaxFontSize: 21,
        titleMinFontSize: 14,
        reminderX: 18,
        reminderY: 56,
        reminderFontSize: 7.4
      },
      meta: {
        x: 16,
        y: 70,
        labelWidth: 52,
        valueWidth: 61,
        rowHeight: 21,
        labelFontSize: 8.5,
        valueFontSize: 8.2
      },
      brand: {
        dividerWidth: 0.7,
        logoX: 20,
        logoY: 8,
        logoWidthInset: 40,
        logoHeight: 38,
        nameX: 5,
        nameY: 54,
        nameFontSize: 9.8,
        siteX: 5,
        siteY: 68,
        siteFontSize: 6,
        secondaryQrLabelY: 84,
        secondaryQrLabelFontSize: 6.2,
        secondaryQrY: 90,
        secondaryQrSize: 46,
        instagramX: 0,
        facebookX: 44,
        lineQrX: 11,
        lineQrY: 144,
        lineQrWidthInset: 22,
        lineQrHeight: 58
      }
    },
    constructionItems: {
      titleBarHeight: 26,
      sectionHeight: 283,
      columns: {
        numberWidth: 34,
        areaWidth: 78
      },
      title: {
        y: 5,
        fontSize: 17
      },
      row: {
        fallbackHeight: 24,
        normalMinHeight: 23,
        normalMaxHeight: 45,
        featuredMinHeight: 28,
        featuredMaxHeight: 72,
        lineHeightBase: 9,
        normalPaddingY: 10,
        featuredPaddingY: 12,
        numberFontSize: 8.5,
        areaFontSize: 8.5,
        detailFontSize: 7.2,
        detailMinFontSize: 5.2,
        detailLineHeight: 8.4,
        detailMinLineHeight: 6.4,
        detailPaddingX: 8,
        detailWrapInset: 16,
        topAlignThreshold: 32,
        featuredNumbers: [8, 9],
        specialDetail: {
          enabled: true,
          areas: ['廁所', '廚房', '窗戶'],
          fontSize: 7.2,
          lineHeight: 8.4
        }
      }
    },
    feeSummary: {
      columns: {
        leftWidth: 306
      },
      headerHeight: 18,
      summaryHeight: 84,
      feeCardHeight: 54,
      feeCardBorderWidth: 0.6,
      feeCardTitle: {
        x: 8,
        y: 6,
        fontSize: 9
      },
      feeRows: {
        startY: 18,
        stepY: 11.4,
        labelX: 16,
        valueX: 70,
        fontSize: 8,
        separatorLeftInset: 12,
        separatorRightInset: 16,
        separatorY: 10,
        separatorWidth: 0.4
      },
      totalRow: {
        height: 16,
        fontSize: 9.9
      },
      installmentRow: {
        height: 14,
        fontSize: 8
      }
    },
    termsSignature: {
      terms: {
        rowHeight: 17,
        numberWidth: 22,
        labelWidth: 62,
        numberFontSize: 8.5,
        labelFontSize: 7.6,
        valueFontSize: 7.4,
        noteY: 51,
        noteHeight: 42,
        noteFontSize: 6.4,
        noteLineHeight: 8.1
      },
      signature: {
        columns: 2,
        cardBorderWidth: 0.6,
        titleX: 12,
        titleY: 10,
        titleWidth: 76,
        titleHeight: 18,
        titleFontSize: 8.2,
        areaX: 10,
        areaY: 26,
        areaInsetX: 20,
        areaBottomInset: 24,
        areaBorderWidth: 0.6,
        areaDash: [2, 2],
        lineInsetX: 28,
        lineBottomY: 28,
        lineWidth: 0.7,
        lineLabelBottomY: 21,
        lineLabelFontSize: 8
      }
    },
    constructionNotice: {
      insetLeft: 8,
      titleY: 14,
      titleFontSize: 14,
      ruleY: 36,
      ruleRightInset: 14,
      cardStartY: 42,
      cardStepY: 40,
      cardHeight: 37,
      cardGap: 2,
      normalCardHeight: 31,
      importantCardHeight: 50,
      cardHeights: [30, 31, 37, 56],
      cardRightInset: 4,
      cardBorderWidth: 0.75,
      titleX: 9,
      titleTextY: 5,
      cardTitleFontSize: 9.6,
      textX: 42,
      textY: 17,
      textPaddingRight: 2,
      textFontSize: 6.8,
      importantTextFontSize: 5.4,
      textFontSizes: [7.6, 7.6, 7.6, 7.6],
      lineHeight: 8.3,
      importantLineHeight: 6.9,
      lineHeights: [8.6, 8.6, 8.6, 8.6],
      iconTopY: 4,
      iconBgTopY: 3
    }
  },
  preview: {
    headerColumns: '1.04fr 0.98fr 142px',
    header: {
      sectionPaddingY: '0.85rem',
      sectionPaddingX: '1.5rem',
      noticePaddingX: '0.65rem',
      quotationFontSize: 12,
      titleFontSize: 27.5,
      titleLineHeight: 1.12,
      titleMarginBottom: '0.86rem',
      reminderMargin: '-0.48rem 0 0.5rem',
      reminderFontSize: 10.3,
      reminderLineHeight: 1.2,
      metaFontSize: 11.8,
      metaColumns: '88px minmax(0,1fr)',
      metaCellMinHeight: 28,
      metaCellPaddingY: '0.36rem',
      metaCellPaddingX: '0.5rem'
    },
    brand: {
      logoWidth: 70,
      logoHeight: 64,
      nameFontSize: 15.7,
      siteFontSize: 10,
      siteLineHeight: 16,
      siteMaxWidth: 120,
      secondaryQrSize: 102,
      primaryQrSize: 126,
      qrGap: 12,
      secondaryMarginBottom: 4
    },
    constructionItems: {
      titleBarPaddingY: 0.38,
      titleBarFontSize: 1.36,
      columns: '48px 118px minmax(0, 1fr)',
      rowMinHeight: 34,
      cellLineHeight: 1.18,
      numberPadding: '0.5rem 0.75rem',
      areaPadding: '0.5rem 0.75rem',
      detailPadding: '0.5rem 1rem',
      areaLetterSpacing: '0.12em',
      detailWhiteSpace: 'pre-wrap',
      featuredNumbers: [8, 9],
      specialDetail: {
        enabled: true,
        areas: ['廁所', '廚房', '窗戶']
      }
    },
    feeSummary: {
      columns: '60fr 40fr',
      feeGridRows: '1fr auto auto',
      feeCardsColumns: '1fr 1fr',
      feeCardPadding: '5px 8px',
      feeNameMarginBottom: 2,
      feeNameFontSize: 11.5,
      feeTableFontSize: 11.6,
      feeTableGap: 1,
      feeRowColumns: '86px minmax(0, 1fr)',
      feeRowMinHeight: 24,
      feeCellPaddingX: 8,
      totalRowMinHeight: 20,
      totalFontSize: 13.4,
      totalGap: 8,
      totalLetterSpacing: '0.03em',
      totalBadgeFontSize: 11.6,
      totalBadgePadding: '2px 8px',
      totalBadgeRadius: 6,
      installmentColumns: '1fr 1fr',
      installmentRowMinHeight: 20,
      installmentFontSize: 12,
      red: '#d71920',
      totalRed: '#cf1118',
      lineHeight: 1.18
    },
    termsSignature: {
      termsGridRows: '70% 30%',
      termListRows: 'repeat(3, 1fr)',
      termRowColumns: '22px 78px minmax(0, 1fr)',
      termRowGap: 1,
      termCellPaddingX: 7,
      termCellFontSize: 12,
      termCellLineHeight: 1.1,
      termNoteGap: 1,
      termNoteFontSize: 10.8,
      termNoteLineHeight: 1.15,
      termNotePadding: '0 12px',
      mainMinHeight: 315,
      signatureColumns: '1fr 1fr',
      signatureCardPadding: '10px 12px',
      signatureAreaMinHeight: 248,
      signatureAreaPadding: 12,
      signatureLinePaddingTop: 8,
      exportTermRowColumns: '20px 76px minmax(0, 1fr)',
      exportTermCellFontSize: 11.8,
      exportTermCellPaddingX: 6,
      exportTermNotePadding: '0 10px',
      exportTermNoteFontSize: 10.7,
      exportTermNoteLineHeight: 1.12,
      exportSignatureCardPadding: '7px 8px',
      exportSignatureAreaMinHeight: 252
    },
    constructionNotice: {
      titleFontSize: 16,
      titlePaddingBottom: 6,
      listGap: 6,
      listMarginTop: 8,
      cardIconColumn: 50,
      cardMinHeight: 52,
      cardCopyPadding: '9px 11px 9px 0',
      cardTitleFontSize: 12.8,
      cardTextFontSize: 8.4,
      cardTextLineHeight: 1.36,
      iconSize: 35,
      iconStrokeWidth: 2.7
    }
  }
};
