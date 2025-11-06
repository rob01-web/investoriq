// src/lib/docGenerator.js — TDZ NUKED, DEEPSKY 11 SECTIONS FULL (NO ALERT, PRO LAYOUT)

var pdfMake = null; // var = TDZ dead
var pdfFonts = null;

const loadPDFMake = async () => {
  if (typeof window === 'undefined') return null;
  if (pdfMake && pdfFonts) return { pdfMake, pdfFonts };

  try {
    console.log('Step 1: Starting pdfmake dynamic load...');
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    pdfMake = pdfMakeModule.default;
    console.log('Step 2: pdfMake imported:', pdfMake ? 'SUCCESS' : 'FAIL - NULL');

    if (!pdfMake) throw new Error('pdfMake default is null — check installation');

    console.log('Step 3: Loading vfs_fonts...');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    pdfFonts = pdfFontsModule;
    console.log('Step 4: vfs_fonts imported:', pdfFonts ? 'SUCCESS' : 'FAIL - NULL');

    if (!pdfFonts || !pdfFonts.pdfMake || !pdfFonts.pdfMake.vfs) throw new Error('vfs_fonts.pdfMake.vfs is missing — check pdfmake version');

    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    console.log('Step 5: VFS SET — DEEPSKY FULL READY');
    return { pdfMake, pdfFonts };
  } catch (err) {
    console.error('FULL LOAD FAIL:', err);
    return null;
  }
};

export const generatePDF = async (reportData) => {
  console.log('generatePDF started with data:', reportData);
  const libs = await loadPDFMake();
  if (!libs || !pdfMake) {
    console.error('LIBS DEAD — CHECK NPM INSTALL pdfmake');
    return; // Silent — no alert, PDF skips gracefully
  }

  const { pdfMake } = libs;

  // DEEPSKY PROMPT + MOCK AI FULL (11 SECTIONS)
  const coreQuestion = '5-year value-add IRR analysis for off-market deal.';
  const deepSkyPrompt = `**ROLE & GOAL:** You are an expert institutional real estate investment analyst. Your task is to generate a comprehensive, "Golden ELITE" investment analysis report for the property data provided below. The final report must be formatted as a single, clean HTML file with embedded CSS and JavaScript for charts. It must be suitable for high-fidelity PDF conversion via an API like DocRaptor. **TONE & STYLE:** - **Tone:** Professional, confident, authoritative, and data-driven. - **Formatting:** Use headings (h1, h2, h3), bullet points, bolding for key metrics and verdicts, and clean tables for financial data. - **Consistency:** Strictly adhere to the section order and content requirements outlined below to ensure every report is uniform. - **Visuals:** All charts must be rendered using Google Charts. For conceptual images, provide a placeholder text like "[Conceptual Image: Description]". **CLIENT & PROPERTY DATA:** ${JSON.stringify(reportData, null, 2)} **CORE ANALYTICAL REQUEST:** ${coreQuestion} --- **REPORT GENERATION INSTRUCTIONS:** Based on the data and request above, generate a complete HTML report with the following structure and content: **1.0 Executive Summary:** - Start with a clear verdict (e.g., STRONG BUY, HOLD, PASS). - State the overall Deal Score (out of 100). - Summarize the primary opportunity and key red flags. - Create a "Key Metrics Snapshot" table including: Purchase Price, Total Project Cost, 5-Year Levered IRR, Equity Multiple, Stabilized Year 1 Cash-on-Cash Return, and Stabilized Cap Rate on Cost. **2.0 Multi-Family Support Analysis:** - If applicable, create a "Unit-by-Unit Renovation & Rent Lift Analysis" table. - Provide a "Portfolio Strategy Recommendation" explaining how this asset fits into a balanced investment portfolio (e.g., Core-Plus, Value-Add). **3.0 Cash Flow Projections (5-Year Hold):** - Create a "Scenario Assumptions" table showing assumptions for Worst Case, Conservative, Base Case, Optimistic, and Best Case scenarios (variables: Annual Rent Growth, Stabilized Vacancy, Exit Cap Rate). - Create a "5-Year Projection Summary" table showing the Levered IRR, Equity Multiple, and Projected Sale Price for each of the five scenarios. - Generate a Google Bar Chart visualizing the "5-Year Levered IRR Across Scenarios". - Include a brief "Sensitivity & Break-Even Analysis" narrative. **4.0 Neighborhood Analysis:** - Provide a Location Score (out of 10). - Create a table with columns: Factor, Data, and Impact. Include rows for: Demographics, Crime Rate, School Ratings, Economic Indicators, and Infrastructure. **5.0 Risk Assessment:** - Provide an Overall Risk Score (out of 10, lower is better). - Create a "Risk Matrix" table with columns: Risk Category, Specific Risk, Impact (High/Medium/Low), and Mitigation Strategy. Cover Property-Specific, Market, Financial, and Operational risks. **6.0 Visual Projections: Renovation Analysis:** - Create a "Renovation Budget Breakdown" table. - Provide placeholder text for conceptual before & after images. Example: "[Conceptual Image: Dated 1980s kitchen with laminate countertops and worn linoleum flooring.]" and "[Conceptual Image: Modern renovated kitchen with white quartz countertops and stainless steel appliances.]" **7.0 Investment Strategy Analysis:** - Create a table comparing at least three relevant strategies (e.g., Buy & Hold, Fix & Flip, BRRRR) with columns for Strategy, Projected 5-Year IRR, Pros, and Cons. - Clearly state the recommended strategy. **8.0 Deal Score Breakdown:** - Create a table scoring the deal across 8 factors (Location, Cash Flow, Risk, Value-Add, etc.) on a scale of 1-10. - Provide a final, decisive verdict based on the total score. **9.0 Advanced Financial Modeling:** - Include a brief "Discounted Cash Flow (DCF) Analysis" summary. - Include a "Comparable Deal Analysis" table with recent sales of similar properties. **10.0 Final Recommendations:** - Provide a bulleted list of "Action Items," a "Due Diligence Checklist," a "Negotiation Strategy," and key "Deal-Breakers." - Conclude with a strong, confident "Bottom Line" summary. **11.0 Legal Disclaimer:** - Append the standardized legal disclaimer in a smaller font size at the very end of the report.`;

  // FULL DEEPSKY MOCK AI RESPONSE (ALL 11 SECTIONS)
  const aiResponse = {
    verdict: 'STRONG BUY',
    dealScore: 92,
    locationScore: 9.5,
    riskScore: 3.2,
    strategies: [
      { name: 'Buy & Hold', irr: 12, pros: 'Stable cash flow', cons: 'Low appreciation' },
      { name: 'Fix & Flip', irr: 25, pros: 'Quick ROI', cons: 'High risk' },
      { name: 'BRRRR', irr: 18, pros: 'Infinite returns', cons: 'Execution heavy' }
    ],
    scenarios: [
      { scenario: 'Worst', irr: 8, multiple: 1.2, sale: 9500000 },
      { scenario: 'Conservative', irr: 12, multiple: 1.5, sale: 10500000 },
      { scenario: 'Base', irr: 18, multiple: 2.0, sale: 12000000 },
      { scenario: 'Optimistic', irr: 22, multiple: 2.5, sale: 13500000 },
      { scenario: 'Best', irr: 28, multiple: 3.0, sale: 15000000 }
    ],
    risks: [
      { category: 'Market', specific: 'Volatility', impact: 'High', mitigation: 'Diversify with comps' },
      { category: 'Financial', specific: 'Debt Service', impact: 'Medium', mitigation: 'Stress test cash flow' },
      { category: 'Operational', specific: 'Tenant Turnover', impact: 'Low', mitigation: 'Screen rigorously' }
    ],
    renovationBudget: [
      { item: 'Kitchen', cost: 50000 },
      { item: 'Bathrooms', cost: 30000 },
      { item: 'Pool', cost: 20000 }
    ],
    dcfSummary: 'NPV $1.2M at 8% discount rate; IRR 18% over 5 years.',
    compsTable: [
      { property: 'Comp 1', salePrice: 8100000, daysOnMarket: 60 },
      { property: 'Comp 2', salePrice: 8700000, daysOnMarket: 45 },
      { property: 'Comp 3', salePrice: 9200000, daysOnMarket: 30 }
    ],
    actionItems: ['Due diligence on title', 'Appraisal ASAP', 'Negotiate 5% below ask'],
    dealBreakers: ['Environmental issues', 'Title defects'],
    bottomLine: 'Acquire immediately — 18% IRR potential in off-market gem.'
  };

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    header: function(currentPage, pageCount) { return { text: `InvestorIQ Elite Report | Page ${currentPage} of ${pageCount}`, style: 'footer' }; },
    footer: function(currentPage, pageCount) { return { text: `Confidential - V1.0 Off-Market Only | © 2025 InvestorIQ. Early 2026: MLS Upgrades.`, style: 'footer' }; },
    content: [
      { text: 'ELITE $5K INVESTORIQ REPORT', style: 'header' },
      { text: 'Powered by AI • Off-Market Valuation • Hedge-Fund Ready', style: 'subheader', margin: [0, 10] },
      {
        columns: [
          { text: `Property: ${aiResponse.address || 'N/A'}`, width: '*' },
          { text: `Generated: ${new Date().toLocaleDateString()}`, alignment: 'right', width: 'auto' }
        ],
        margin: [0, 20]
      },
      { text: '1.0 Executive Summary', style: 'section' },
      { text: aiResponse.verdict, style: 'verdict' },
      { text: `Deal Score: ${aiResponse.dealScore}/100`, style: 'score' },
      { text: aiResponse.summary || 'Analysis loading...', margin: [0, 10, 0, 20] },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Key Metric', 'Value'],
            ['Purchase Price', '$8,500,000'],
            ['Total Project Cost', '$9,200,000'],
            ['5-Year Levered IRR', '18%'],
            ['Equity Multiple', '2.0x'],
            ['Stabilized Cash-on-Cash', '7.5%'],
            ['Stabilized Cap Rate on cost', '6.2%']
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '2.0 Multi-Family Support Analysis', style: 'section' },
      { text: 'Portfolio Strategy: Core-Plus — Stable income with moderate value-add potential.', margin: [0, 10, 0, 20] },
      { text: '3.0 Cash Flow Projections (5-Year Hold)', style: 'section' },
      { text: 'Scenario Assumptions', style: 'subsection' },
      {
        table: {
          widths: ['*', '*', '*', '*', '*'],
          body: [
            ['Scenario', 'Rent Growth', 'Vacancy', 'Exit Cap Rate'],
            ['Worst', '1%', '10%', '6.5%'],
            ['Conservative', '2%', '8%', '6.0%'],
            ['Base', '3%', '5%', '5.5%'],
            ['Optimistic', '4%', '3%', '5.0%'],
            ['Best', '5%', '2%', '4.5%']
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '5-Year Projection Summary', style: 'subsection' },
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            ['Scenario', 'Levered IRR', 'Equity Multiple', 'Projected Sale Price'],
            ...aiResponse.scenarios.map(s => [s.scenario, `${s.irr}%`, `${s.multiple}x`, `$${s.sale.toLocaleString()}`])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '4.0 Neighborhood Analysis', style: 'section' },
      { text: `Location Score: ${aiResponse.locationScore}/10`, style: 'score' },
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            ['Factor', 'Data', 'Impact'],
            ['Demographics', 'High-income, young professionals', 'Positive'],
            ['Crime Rate', 'Low', 'Positive'],
            ['School Ratings', '9/10', 'Positive'],
            ['Economic Indicators', 'Growing tech hub', 'Positive'],
            ['Infrastructure', 'Excellent transit', 'Positive']
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '5.0 Risk Assessment', style: 'section' },
      { text: `Overall Risk Score: ${aiResponse.riskScore}/10`, style: 'score' },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            ['Category', 'Specific Risk', 'Impact', 'Mitigation'],
            ...aiResponse.risks.map(r => [r.category, r.specific, r.impact, r.mitigation])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '6.0 Visual Projections: Renovation Analysis', style: 'section' },
      { text: 'Renovation Budget Breakdown', style: 'subsection' },
      {
        table: {
          widths: ['*', 'auto'],
          body: aiResponse.renovationBudget.map(item => [item.item, `$${item.cost.toLocaleString()}`])
        },
        layout: 'lightHorizontalLines'
      },
      { text: '[Conceptual Image: Before Renovation - Dated kitchen]', margin: [0, 20] },
      { text: '[Conceptual Image: After Renovation - Modern luxury kitchen]', margin: [0, 20] },
      { text: '7.0 Investment Strategy Analysis', style: 'section' },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            ['Strategy', 'Projected 5-Year IRR', 'Pros', 'Cons'],
            ...aiResponse.strategies.map(s => [s.name, `${s.irr}%`, s.pros, s.cons])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: 'Recommended Strategy: BRRRR for infinite returns.', margin: [0, 10, 0, 20] },
      { text: '8.0 Deal Score Breakdown', style: 'section' },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Factor', 'Score (1-10)'],
            ['Location', 9],
            ['Cash Flow', 8],
            ['Risk', 7],
            ['Value-Add', 9],
            ['Total Average', 8.25]
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: 'Final Verdict: STRONG BUY.', style: 'verdict' },
      { text: '9.0 Advanced Financial Modeling', style: 'section' },
      { text: aiResponse.dcfSummary, margin: [0, 10, 0, 20] },
      { text: 'Comparable Deal Analysis', style: 'subsection' },
      {
        table: {
          widths: ['*', 'auto', 'auto'],
          body: aiResponse.compsTable.map(c => [c.property, `$${c.salePrice.toLocaleString()}`, `${c.daysOnMarket} days`])
        },
        layout: 'lightHorizontalLines'
      },
      { text: '10.0 Final Recommendations', style: 'section' },
      { ul: aiResponse.actionItems, style: 'list' },
      { text: 'Due Diligence Checklist:', style: 'subsection' },
      { ul: ['Title search', 'Appraisal', 'Environmental review'] },
      { text: 'Negotiation Strategy: Offer 5% below ask with contingencies.', margin: [0, 10] },
      { text: 'Deal-Breakers: Title defects, structural issues.', margin: [0, 10] },
      { text: aiResponse.bottomLine, style: 'bottomline' },
      { text: '11.0 Legal Disclaimer', style: 'section' },
      { text: 'This report is for informational purposes only. Not financial advice. Consult professionals. © 2025 InvestorIQ. V1.0 Off-Market Only.', style: 'disclaimer' }
    ],
    styles: {
      header: { fontSize: 24, bold: true, color: '#1a56db', margin: [0, 0, 0, 15] },
      subheader: { fontSize: 12, italics: true, color: '#6b7280' },
      section: { fontSize: 16, bold: true, color: '#111827', margin: [0, 25, 0, 10] },
      subsection: { fontSize: 14, bold: true, bold: true, color: '#374151', margin: [0, 15, 0, 5] },
      verdict: { fontSize: 20, bold: true, color: '#059669', margin: [0, 0, 0, 10] },
      score: { fontSize: 14, bold: true, color: '#059669', margin: [0, 0, 0, 0] },
      bottomline: { fontSize: 16, bold: true, color: '#1f2937', margin: [0, 20, 0, 10] },
      disclaimer: { fontSize: 8, italics: true, color: '#6b7280', margin: [0, 20, 0, 0] },
      list: { fontSize: 12, margin: [0, 5, 0, 5] },
      footer: { fontSize: 8, italics: true, alignment: 'center', margin: [0, 10, 0, 0] }
    },
    defaultStyle: { fontSize: 11, lineHeight: 1.5 }
  };

  pdfMake.createPdf(docDefinition).download(`investoriq-elite-report-${Date.now()}.pdf`);
  console.log('DEEPSKY ELITE PDF DROPPED — $5K PRINTED');
};