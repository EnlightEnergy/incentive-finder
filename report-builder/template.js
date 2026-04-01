// Generates the full HTML string for the Qualifying Programs Report
// data: reportData object (see sample-data.js for shape)

export function generateReportHTML(data) {
  const _d = data || {};
  const facility = _d.facility || {};
  const programs = _d.programs || [];
  const measures = _d.measures || [...new Set(programs.flatMap(p => p.measures || []))];
  const programCount = _d.programCount != null ? _d.programCount : programs.length;
  const summary = _d.summary || '';
  const stackingNotes = _d.stackingNotes || [];
  const priorityActions = _d.priorityActions || [];

  const categoryColor = (cat = '') => {
    if (cat.includes('Utility')) return { bg: '#EAE8F5', text: '#1C2B5E', dot: '#1C2B5E' };
    if (cat.includes('Federal')) return { bg: '#FFF3E0', text: '#E65100', dot: '#E65100' };
    if (cat.includes('State')) return { bg: '#E8F5E9', text: '#4B3082', dot: '#4B3082' };
    if (cat.includes('Financing')) return { bg: '#F0EBF8', text: '#4B3082', dot: '#4B3082' };
    return { bg: '#F5F5F7', text: '#424242', dot: '#424242' };
  };

  const renderCard = (p) => {
    // Normalize missing fields to safe defaults
    p = { ...p, category: p.category || '', administrator: p.administrator || '&mdash;', eligibleMeasures: p.eligibleMeasures || '', incentiveStructure: p.incentiveStructure || p.incentiveAmount || '', stacksWith: p.stacksWith || '', deadline: p.deadline || 'TBD', timeline: p.timeline || '', nextStep: p.nextStep || '' };
    const colors = categoryColor(p.category);
    return `
      <div class="program-card">
        <div class="program-card-header">
          <div class="program-name">${p.name}</div>
          <div class="program-badge" style="background:${colors.bg}; color:${colors.text};">
            <span class="badge-dot" style="background:${colors.dot};"></span>${p.category}
          </div>
        </div>
        <div class="program-body">
          <div class="program-row">
            <div class="program-label">Administered by</div>
            <div class="program-value">${p.administrator}</div>
          </div>
          <div class="program-row alt">
            <div class="program-label">Eligible Measures</div>
            <div class="program-value">${p.eligibleMeasures}</div>
          </div>
          <div class="program-row highlight-green">
            <div class="program-label">Incentive Structure</div>
            <div class="program-value">${p.incentiveStructure}</div>
          </div>
          <div class="program-row">
            <div class="program-label">Can Stack With</div>
            <div class="program-value stack-value">${p.stacksWith || '&#8212;'}</div>
          </div>
          ${p.conflicts ? `<div class="program-row conflict-row">
            <div class="program-label">Cannot Combine With</div>
            <div class="program-value conflict-value">${p.conflicts}</div>
          </div>` : ''}
          <div class="program-row alt ${p.preApprovalRequired ? 'highlight-amber' : ''}">
            <div class="program-label">Deadline / Enrollment</div>
            <div class="program-value">
              ${p.preApprovalRequired ? '<span class="pre-approval-flag">&#9651; Pre-approval required before project start</span><br>' : ''}
              ${p.deadline}
            </div>
          </div>
          <div class="program-row">
            <div class="program-label">Typical Timeline</div>
            <div class="program-value">${p.timeline}</div>
          </div>
          <div class="program-row highlight-blue next-step-row">
            <div class="program-label">Your Next Step</div>
            <div class="program-value next-step-value">Contact us to discuss your project and rebate eligibility. We handle pre-approval, application, and all rebate filing on your behalf.</div>
          </div>
        </div>
      </div>`;
  };

  // Normalize: accept flat [{name,eligibleMeasures,...}] OR grouped [{measure,entries:[...]}]
  const groupedPrograms = (programs.length === 0 || programs[0].entries)
    ? programs
    : (() => {
        const g = {};
        programs.forEach(p => {
          const m = p.measure || p.eligibleMeasures || 'General Programs';
          if (!g[m]) g[m] = { measure: m, entries: [] };
          g[m].entries.push(p);
        });
        return Object.values(g);
      })();

  const programCardsHTML = groupedPrograms.map(group => {
    const [first, ...rest] = group.entries;
    return `
    <div class="measure-group">
      <div class="measure-header-anchor">
        <div class="measure-header">
          <span class="measure-icon">&#9889;</span>
          <span>${group.measure}</span>
          <span class="measure-count">${group.entries.length} program${group.entries.length > 1 ? 's' : ''} found</span>
        </div>
        ${renderCard(first)}
      </div>
      ${rest.map(p => renderCard(p)).join('')}
    </div>`;
  }).join('');

  const stackingHTML = stackingNotes.map(s => `
    <tr class="stacking-row">
      <td class="stacking-pair">${s.pair}</td>
      <td class="stacking-can ${s.canStack ? 'can-yes' : 'can-no'}">${s.canStack ? 'Yes' : 'No'}</td>
      <td class="stacking-note">${s.note}</td>
    </tr>
  `).join('');

  const priorityHTML = [
    { n: '1', urgency: 'Schedule a Call', action: 'Contact Enlighting Energy to explain your project goals, timeline, and budget.', detail: 'Our team will review your facility profile and the programs identified in this report.' },
    { n: '2', urgency: 'Free Facility Audit', action: 'We visit your facility at no cost to assess your energy systems and baseline usage.', detail: 'This on-site audit confirms eligibility and identifies additional savings opportunities.' },
    { n: '3', urgency: 'Incentive Stack Plan', action: 'We map out the optimal combination of utility rebates, state grants, and federal tax credits for your project.', detail: 'Our goal is to layer programs so you achieve your upgrade at the lowest possible out-of-pocket cost.' },
    { n: '4', urgency: 'Installation & Filing', action: 'If the numbers work for you, we install the energy-saving measures and handle every rebate application on your behalf.', detail: 'You get the upgrades and the incentives &mdash; we handle all the paperwork, submissions, and follow-up.' },
  ].map(a => `
    <div class="priority-item">
      <div class="priority-number">${a.n}</div>
      <div class="priority-content">
        <div class="priority-urgency">${a.urgency}</div>
        <div class="priority-action">${a.action}</div>
        <div class="priority-detail">${a.detail}</div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Qualifying Programs Report &mdash; ${facility.name}</title>
<style>
  /*  Reset & Base  */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.5;
  }

  /*  Page Layout  */
  .page {
    width: 8.5in;
    min-height: 11in;
    margin: 0 auto;
    padding: 0;
  }

  /*  Cover Page  */
  .cover {
    width: 8.5in;
    height: 11in;
    max-height: 11in;
    display: flex;
    flex-direction: column;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }

  .cover-top-bar {
    background: #1C2B5E;
    height: 6px;
    width: 100%;
    flex-shrink: 0;
  }

  .cover-accent-bar {
    background: #C84EC4;
    height: 3px;
    width: 100%;
    flex-shrink: 0;
  }

  .cover-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.45in 0.75in 0.35in;
    overflow: hidden;
  }

  .cover-logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 0.3in;
  }

  .cover-logo-circle {
    width: 48px;
    height: 48px;
    background: #C84EC4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: white;
  }

  .cover-company-name {
    font-size: 13pt;
    font-weight: 700;
    color: #1C2B5E;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .cover-report-type {
    font-size: 10pt;
    color: #666;
    font-weight: 400;
    margin-top: 2px;
  }

  .cover-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .cover-eyebrow {
    font-size: 10pt;
    font-weight: 600;
    color: #C84EC4;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 16px;
  }

  .cover-title {
    font-size: 34pt;
    font-weight: 800;
    color: #1C2B5E;
    line-height: 1.1;
    margin-bottom: 14px;
  }

  .cover-subtitle {
    font-size: 13pt;
    color: #444;
    margin-bottom: 24px;
    line-height: 1.4;
  }

  .cover-divider {
    width: 80px;
    height: 4px;
    background: #C84EC4;
    margin-bottom: 24px;
    border-radius: 2px;
  }

  .cover-facility-box {
    background: #F5F5F8;
    border-left: 4px solid #1C2B5E;
    padding: 24px 28px;
    border-radius: 0 8px 8px 0;
    max-width: 5.5in;
  }

  .cover-facility-label {
    font-size: 8pt;
    font-weight: 700;
    color: #C84EC4;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 8px;
  }

  .cover-facility-name {
    font-size: 18pt;
    font-weight: 700;
    color: #1C2B5E;
    margin-bottom: 6px;
  }

  .cover-facility-meta {
    font-size: 10pt;
    color: #555;
    line-height: 1.7;
  }

  .cover-measures-row {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cover-measure-chip {
    background: #1C2B5E;
    color: white;
    font-size: 9pt;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
  }

  .cover-programs-found {
    margin-top: 14px;
    display: inline-block;
    background: #C84EC4;
    color: white;
    font-size: 11pt;
    font-weight: 700;
    padding: 7px 18px;
    border-radius: 6px;
  }

  .cover-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 16px;
    border-top: 1px solid #E0E0E0;
    margin-top: 20px;
  }

  .cover-footer-left {
    font-size: 9pt;
    color: #888;
    line-height: 1.6;
  }

  .cover-footer-right {
    font-size: 9pt;
    color: #888;
    text-align: right;
  }

  /*  Content Pages  */
  .content-page {
    padding: 0.55in 0.75in 0.45in;
  }

  /* Force page break BEFORE these sections */
  .page-break-before {
    page-break-before: always;
  }

  /* Glue section title/divider to the content that follows */
  .section-anchor {
    page-break-after: avoid;
  }

  /*  Running Header  */
  .running-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 3px solid #1C2B5E;
    margin-bottom: 28px;
    page-break-after: avoid;
  }

  .running-header-left {
    font-size: 9pt;
    font-weight: 700;
    color: #1C2B5E;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .running-header-right {
    font-size: 9pt;
    color: #888;
  }

  /*  Section Titles  */
  .section-title {
    font-size: 18pt;
    font-weight: 800;
    color: #1C2B5E;
    margin-bottom: 6px;
  }

  .section-subtitle {
    font-size: 10pt;
    color: #666;
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .section-divider {
    height: 3px;
    background: linear-gradient(90deg, #C84EC4 0%, #1C2B5E 60%, transparent 100%);
    margin-bottom: 28px;
    border-radius: 2px;
  }

  /*  Summary Page  */
  .summary-header-box {
    background: #1C2B5E;
    color: white;
    border-radius: 10px;
    padding: 28px 32px;
    margin-bottom: 24px;
  }

  .summary-header-title {
    font-size: 9pt;
    font-weight: 700;
    color: #BBA8E0;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 8px;
  }

  .summary-facility-name {
    font-size: 20pt;
    font-weight: 800;
    color: white;
    margin-bottom: 6px;
  }

  .summary-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-top: 20px;
  }

  .summary-meta-item {
    border-left: 3px solid #C84EC4;
    padding-left: 12px;
  }

  .summary-meta-label {
    font-size: 8pt;
    color: #BBA8E0;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 3px;
  }

  .summary-meta-value {
    font-size: 11pt;
    font-weight: 600;
    color: white;
  }

  .summary-measures-row {
    margin-top: 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .summary-measures-label {
    font-size: 9pt;
    color: #BBA8E0;
    margin-right: 4px;
  }

  .summary-measure-chip {
    background: rgba(255,255,255,0.15);
    color: white;
    font-size: 9pt;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .programs-found-banner {
    background: #C84EC4;
    color: white;
    border-radius: 0 0 10px 10px;
    padding: 12px 32px;
    margin-top: -4px;
    font-size: 12pt;
    font-weight: 700;
  }

  .summary-text-box {
    background: #F5F5F8;
    border-left: 4px solid #1C2B5E;
    border-radius: 0 8px 8px 0;
    padding: 20px 24px;
    margin-bottom: 24px;
  }

  .summary-text-label {
    font-size: 8pt;
    font-weight: 700;
    color: #C84EC4;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 8px;
  }

  .summary-text {
    font-size: 11pt;
    color: #2c2c2c;
    line-height: 1.65;
  }

  /*  Program Cards  */
  .measure-group {
    margin-bottom: 32px;
  }

  /* Glues measure header to first program card */
  .measure-header-anchor {
    page-break-inside: avoid;
  }

  .measure-header {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #1C2B5E;
    color: white;
    padding: 10px 18px;
    border-radius: 8px 8px 0 0;
    font-size: 12pt;
    font-weight: 700;
    page-break-after: avoid;
  }

  .measure-icon {
    font-size: 14pt;
  }

  .measure-count {
    margin-left: auto;
    font-size: 9pt;
    font-weight: 600;
    background: rgba(255,255,255,0.2);
    padding: 3px 10px;
    border-radius: 12px;
  }

  .program-card {
    border: 1px solid #D5DCE4;
    border-top: none;
    margin-bottom: 0;
    border-radius: 0;
  }

  .program-card:last-child {
    border-radius: 0 0 8px 8px;
  }

  .program-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 20px 12px;
    background: #FAFBFC;
    border-bottom: 1px solid #E8ECF0;
    gap: 16px;
  }

  .program-name {
    font-size: 12pt;
    font-weight: 700;
    color: #1C2B5E;
    flex: 1;
    line-height: 1.3;
  }

  .program-badge {
    font-size: 8.5pt;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .badge-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .program-body {}

  .program-row {
    display: flex;
    border-bottom: 1px solid #EAECEF;
    min-height: 36px;
  }

  .program-row:last-child {
    border-bottom: none;
  }

  .program-row.alt {
    background: #FAFBFC;
  }

  .program-row.highlight-green {
    background: #F5F2FF;
  }

  .program-row.highlight-amber {
    background: #FFFBF0;
  }

  .program-row.highlight-blue {
    background: #F5F5F8;
  }

  .program-row.conflict-row {
    background: #FFF5F5;
  }

  .program-label {
    width: 170px;
    flex-shrink: 0;
    font-size: 8.5pt;
    font-weight: 700;
    color: #555;
    padding: 10px 16px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-right: 1px solid #EAECEF;
    display: flex;
    align-items: flex-start;
    line-height: 1.3;
  }

  .program-value {
    flex: 1;
    font-size: 10pt;
    color: #2c2c2c;
    padding: 10px 16px;
    line-height: 1.55;
  }

  .stack-value {
    color: #4B3082;
    font-weight: 600;
    font-size: 9.5pt;
  }

  .conflict-value {
    color: #B71C1C;
    font-weight: 600;
    font-size: 9.5pt;
  }

  .next-step-row .program-label {
    color: #1C2B5E;
  }

  .next-step-value {
    font-size: 10pt;
    font-weight: 500;
    color: #1a2a3a;
  }

  .pre-approval-flag {
    display: inline-block;
    background: #FFF3CD;
    color: #856404;
    font-weight: 700;
    font-size: 9pt;
    padding: 3px 10px;
    border-radius: 4px;
    margin-bottom: 6px;
    border: 1px solid #FFE69C;
  }

  /*  Stacking Table  */
  .stacking-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 10pt;
  }

  .stacking-table th {
    background: #1C2B5E;
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stacking-table th:first-child { border-radius: 6px 0 0 0; }
  .stacking-table th:last-child  { border-radius: 0 6px 0 0; }

  .stacking-row { border-bottom: 1px solid #E8ECF0; }
  .stacking-row:nth-child(even) td { background: #FAFBFC; }

  .stacking-pair {
    padding: 12px 14px;
    font-weight: 600;
    color: #1C2B5E;
    font-size: 9.5pt;
    width: 38%;
  }

  .stacking-can {
    padding: 12px 14px;
    font-weight: 800;
    width: 10%;
    text-align: center;
    font-size: 10pt;
  }

  .can-yes { color: #4B3082; }
  .can-no  { color: #B71C1C; }

  .stacking-note {
    padding: 12px 14px;
    font-size: 9.5pt;
    color: #444;
    line-height: 1.5;
  }

  /*  Priority Actions  */
  .priority-item {
    display: flex;
    gap: 0;
    margin-bottom: 14px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #D5DCE4;
  }

  .priority-number {
    background: #1C2B5E;
    color: white;
    font-size: 20pt;
    font-weight: 800;
    width: 52px;
    min-width: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 0;
  }

  .priority-content {
    flex: 1;
    padding: 14px 18px;
    background: #FAFBFC;
  }

  .priority-urgency {
    font-size: 8pt;
    font-weight: 700;
    color: #E65100;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .priority-action {
    font-size: 12pt;
    font-weight: 700;
    color: #1C2B5E;
    margin-bottom: 6px;
  }

  .priority-detail {
    font-size: 10pt;
    color: #444;
    line-height: 1.55;
  }

  /*  Limitations Section  */
  .limitations-box {
    background: #FFFBF0;
    border: 1px solid #FFE69C;
    border-left: 4px solid #F39C12;
    border-radius: 0 8px 8px 0;
    padding: 20px 24px;
    margin-bottom: 24px;
  }

  .limitations-title {
    font-size: 10pt;
    font-weight: 700;
    color: #856404;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }

  .limitations-list {
    list-style: none;
    padding: 0;
  }

  .limitations-list li {
    font-size: 10pt;
    color: #444;
    line-height: 1.6;
    padding: 6px 0;
    padding-left: 20px;
    position: relative;
    border-bottom: 1px solid rgba(243, 156, 18, 0.15);
  }

  .limitations-list li:last-child { border-bottom: none; }

  .limitations-list li::before {
    content: '!';
    position: absolute;
    left: 0;
    top: 8px;
    width: 14px;
    height: 14px;
    background: #F39C12;
    color: white;
    font-size: 9pt;
    font-weight: 800;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 14px;
  }

  /*  About Page  */
  .about-hero {
    background: linear-gradient(135deg, #1C2B5E 0%, #13194A 100%);
    border-radius: 12px;
    padding: 36px 40px;
    color: white;
    margin-bottom: 28px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .about-hero-label {
    font-size: 9pt;
    font-weight: 700;
    color: #BBA8E0;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 12px;
  }

  .about-hero-title {
    font-size: 22pt;
    font-weight: 800;
    color: white;
    margin-bottom: 12px;
    line-height: 1.2;
  }

  .about-hero-sub {
    font-size: 11pt;
    color: #C9B8E8;
    line-height: 1.6;
    max-width: 5.5in;
  }

  .about-services-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 28px;
  }

  .about-service-card {
    border: 1px solid #D5DCE4;
    border-radius: 8px;
    padding: 16px 18px;
  }

  .about-service-icon {
    font-size: 18pt;
    margin-bottom: 6px;
  }

  .about-service-title {
    font-size: 11pt;
    font-weight: 700;
    color: #1C2B5E;
    margin-bottom: 6px;
  }

  .about-service-desc {
    font-size: 9.5pt;
    color: #555;
    line-height: 1.5;
  }

  .about-cta-box {
    background: #F5F2FF;
    border: 1.5px solid #C84EC4;
    border-radius: 8px;
    padding: 24px 28px;
    margin-bottom: 28px;
  }

  .about-cta-title {
    font-size: 14pt;
    font-weight: 800;
    color: #1C2B5E;
    margin-bottom: 10px;
  }

  .about-cta-text {
    font-size: 10.5pt;
    color: #4B3082;
    line-height: 1.65;
    margin-bottom: 16px;
  }

  .about-cta-contacts {
    display: flex;
    gap: 28px;
    flex-wrap: wrap;
  }

  .about-cta-contact-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10pt;
    font-weight: 700;
    color: #4B3082;
  }

  .contact-icon {
    width: 28px;
    height: 28px;
    background: #C84EC4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12pt;
    flex-shrink: 0;
  }

  /*  Footer  */
  .page-footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #E0E0E0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    color: #999;
  }

  .footer-brand {
    font-weight: 700;
    color: #1C2B5E;
  }

  /*  Print / PDF  */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { page-break-after: always; }
    .page-break-before { page-break-before: always; }
    .program-card { page-break-inside: avoid; }
    .priority-item { page-break-inside: avoid; }
    .section-anchor { page-break-after: avoid; }
    .measure-header { page-break-after: avoid; }
    .running-header { page-break-after: avoid; }
  }
</style>
</head>
<body>

<!-- ========================================
     COVER PAGE
     ======================================== -->
<div class="cover">
  <div class="cover-top-bar"></div>
  <div class="cover-accent-bar"></div>

  <div class="cover-body">
    <!-- Logo area -->
    <div class="cover-logo-area">
      <div class="cover-logo-circle"></div>
      <div>
        <div class="cover-company-name">Enlighting Energy</div>
        <div class="cover-report-type">Qualifying Programs Report</div>
      </div>
    </div>

    <!-- Main content -->
    <div class="cover-main">
      <div class="cover-eyebrow">Incentive Finder 2.0</div>
      <div class="cover-title">Your Qualifying<br>Programs Report</div>
      <div class="cover-subtitle">Every utility rebate, state grant, and federal program<br>your facility qualifies for &mdash; organized by measure.</div>
      <div class="cover-divider"></div>

      <div class="cover-facility-box">
        <div class="cover-facility-label">Prepared For</div>
        <div class="cover-facility-name">${facility.name}</div>
        <div class="cover-facility-meta">
          ${facility.address}, ${facility.city}, ${facility.state} ${facility.zip}<br>
          ${facility.facilityType} &nbsp;&middot;&nbsp; ${facility.sqFt} sq ft &nbsp;&middot;&nbsp; ${facility.utility} &nbsp;&middot;&nbsp; ${facility.ownership}<br>
          <span style="color:#888;font-size:9pt;">${facility.contactName} &nbsp;&middot;&nbsp; ${facility.contactEmail} &nbsp;&middot;&nbsp; ${facility.reportDate}</span>
        </div>
        <div class="cover-measures-row">
          ${measures.map(m => `<span class="cover-measure-chip">${m}</span>`).join('')}
        </div>
        <div style="margin-top: 14px;">
          <span class="cover-programs-found">${programCount} Qualifying Programs Found</span>
        </div>
      </div>
    </div>

  </div>
</div>


<!-- ========================================
     PAGE 2: SUMMARY
     ======================================== -->
<div class="content-page page-break-before">
  <div class="running-header">
    <div class="running-header-left">Qualifying Programs Report &nbsp;&middot;&nbsp; ${facility.name}</div>
    <div class="running-header-right">${facility.reportDate}</div>
  </div>

  <div class="section-title">Summary</div>
  <div class="section-divider"></div>

  <!-- Facility header box -->
  <div class="summary-header-box">
    <div class="summary-header-title">Facility Profile</div>
    <div class="summary-facility-name">${facility.name}</div>

    <div class="summary-meta-grid">
      <div class="summary-meta-item">
        <div class="summary-meta-label">Utility</div>
        <div class="summary-meta-value">${facility.utility}</div>
      </div>
      <div class="summary-meta-item">
        <div class="summary-meta-label">Facility Size</div>
        <div class="summary-meta-value">${facility.sqFt} sq ft</div>
      </div>
      <div class="summary-meta-item">
        <div class="summary-meta-label">Facility Type</div>
        <div class="summary-meta-value">${facility.facilityType}</div>
      </div>
    </div>

    <div class="summary-measures-row">
      <span class="summary-measures-label">Measures reviewed:</span>
      ${measures.map(m => `<span class="summary-measure-chip">${m}</span>`).join('')}
    </div>
  </div>

  <div class="programs-found-banner">
     &nbsp; ${programCount} qualifying programs found across utility, state, and federal sources
  </div>

  <!-- AI Summary -->
  <div style="margin-top: 24px;">
    <div class="summary-text-box">
      <div class="summary-text-label">What We Found</div>
      <div class="summary-text">${summary}</div>
    </div>
  </div>

  <div class="page-footer">
    <span><span class="footer-brand">Enlighting Energy</span> &nbsp;&middot;&nbsp; Qualifying Programs Report</span>
    <span>enlightingenergy.com &nbsp;&middot;&nbsp; 714-853-5416 &nbsp;&middot;&nbsp; hello@enlightingenergy.com</span>
  </div>
</div>


<!-- ========================================
     PROGRAMS BY MEASURE
     ======================================== -->
<div class="content-page page-break-before">
  <div class="running-header">
    <div class="running-header-left">Programs By Measure &nbsp;&middot;&nbsp; ${facility.name}</div>
    <div class="running-header-right">${facility.reportDate}</div>
  </div>

  <div class="section-title section-anchor">Programs By Measure</div>
  <div class="section-subtitle section-anchor">Each program is listed under the measure it applies to. Programs covering multiple measures appear under the most relevant one.</div>
  <div class="section-divider section-anchor"></div>

  ${programCardsHTML}

  <div class="page-footer">
    <span><span class="footer-brand">Enlighting Energy</span> &nbsp;&middot;&nbsp; Qualifying Programs Report</span>
    <span>Programs verified as of ${facility.reportDate}. Confirm current terms with program administrator before applying.</span>
  </div>
</div>


<!-- ========================================
     STACKING + PRIORITY ACTIONS
     ======================================== -->
<div class="content-page page-break-before">
  <div class="running-header">
    <div class="running-header-left">Stacking & Next Steps &nbsp;&middot;&nbsp; ${facility.name}</div>
    <div class="running-header-right">${facility.reportDate}</div>
  </div>

  <!-- Stacking Section -->
  <div class="section-title">Stacking Notes</div>
  <div class="section-subtitle">Which programs from this report can be applied to the same project, and which cannot be combined.</div>
  <div class="section-divider"></div>

  <table class="stacking-table">
    <thead>
      <tr>
        <th>Program Combination</th>
        <th>Stack?</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${stackingHTML}
    </tbody>
  </table>

  <div style="margin-bottom: 36px;"></div>

  <!-- Priority Actions -->
  <div class="section-title">Priority Action Plan</div>
  <div class="section-subtitle">Actions ordered by urgency. Items marked "Before Project Start" require action before equipment is purchased or installed.</div>
  <div class="section-divider"></div>

  ${priorityHTML}

  <div class="page-footer">
    <span><span class="footer-brand">Enlighting Energy</span> &nbsp;&middot;&nbsp; Qualifying Programs Report</span>
    <span>enlightingenergy.com &nbsp;&middot;&nbsp; 714-853-5416 &nbsp;&middot;&nbsp; hello@enlightingenergy.com</span>
  </div>
</div>


<!-- ========================================
     LIMITATIONS + ABOUT
     ======================================== -->
<div class="content-page page-break-before">
  <div class="running-header">
    <div class="running-header-left">Important Notes &nbsp;&middot;&nbsp; ${facility.name}</div>
    <div class="running-header-right">${facility.reportDate}</div>
  </div>

  <!-- Limitations -->
  <div class="section-title">Important Notes & Limitations</div>
  <div class="section-divider"></div>

  <div class="limitations-box">
    <div class="limitations-title">Please Read Before Taking Action</div>
    <ul class="limitations-list">
      <li>This report identifies programs for which your facility meets the <strong>general eligibility criteria</strong> based on your profile. Final qualification is confirmed by the program administrator upon application review.</li>
      <li>Incentive structures shown (per-ton, per-watt, per-fixture, etc.) are drawn from program documentation. <strong>Actual incentive amounts</strong> depend on final equipment specifications, quantities, and project scope &mdash; which are determined during project design and confirmed at pre-approval.</li>
      <li>Program availability, incentive rates, and eligibility requirements <strong>change frequently</strong>. This report reflects information as of ${facility.reportDate}. Always verify current terms with the program administrator before submitting applications.</li>
      <li>Several programs in this report require <strong>pre-approval before equipment is purchased or installed</strong>. Retroactive applications are not accepted. See the Priority Action Plan for time-sensitive items.</li>
      <li>Stacking eligibility noted in this report reflects known rules as of the report date. Confirm current stacking rules with program administrators, and consult your accountant regarding any federal tax implications of receiving utility or state incentives.</li>
    </ul>
  </div>

  <div style="margin-bottom: 32px;"></div>

  <!-- About -->
  <div style="page-break-before: always;"></div><div class="section-title">About Enlighting Energy</div>
  <div class="section-divider"></div>

  <div class="about-hero">
    <div class="about-hero-label">Who We Are</div>
    <div class="about-hero-title">We find the incentives.<br>Then we capture them for You.</div>
    <div class="about-hero-sub">Enlighting Energy is a California-based energy efficiency contractor with over 36 years of combined expertise. We work with commercial, industrial, manufacturing, and multifamily facilities across California to identify incentive opportunities and handle everything from engineering through installation, pre-approval, and rebate filing.</div>
  </div>

  <div class="about-services-grid">
    <div class="about-service-card">
      <div class="about-service-icon"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#1C2B5E"/><path d="M10 18l6 6 10-12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="about-service-title">Incentive Pre-Approval</div>
      <div class="about-service-desc">We handle pre-approval submissions with SCE, PG&E, SDG&E, LADWP, and state agencies &mdash; ensuring no deadline is missed and no eligibility is left on the table.</div>
    </div>
    <div class="about-service-card">
      <div class="about-service-icon"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#1C2B5E"/><circle cx="18" cy="18" r="6" stroke="white" stroke-width="2"/><path d="M18 8v4M18 24v4M8 18h4M24 18h4" stroke="white" stroke-width="2" stroke-linecap="round"/></svg></div>
      <div class="about-service-title">Engineering & Installation</div>
      <div class="about-service-desc">Licensed engineering and turnkey installation for HVAC, lighting, refrigeration, VFDs, and more &mdash; all designed to meet program specifications.</div>
    </div>
    <div class="about-service-card">
      <div class="about-service-icon"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#1C2B5E"/><rect x="13" y="11" width="10" height="14" rx="1" stroke="white" stroke-width="2"/><path d="M15 15h6M15 19h4" stroke="white" stroke-width="2" stroke-linecap="round"/></svg></div>
      <div class="about-service-title">Rebate Filing</div>
      <div class="about-service-desc">We prepare and submit all post-installation documentation, inspection coordination, and rebate applications so you receive every dollar you qualified for.</div>
    </div>
    <div class="about-service-card">
      <div class="about-service-icon"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#1C2B5E"/><path d="M12 24v-6M16 24v-9M20 24v-5M24 24v-11" stroke="white" stroke-width="2" stroke-linecap="round"/></svg></div>
      <div class="about-service-title">Incentive Stacking Strategy</div>
      <div class="about-service-desc">We identify how to layer utility, state, and federal programs on the same project to maximize total incentive capture without conflicts.</div>
    </div>
  </div>

  <div class="about-cta-box">
    <div class="about-cta-title">Want help capturing all of these programs?</div>
    <div class="about-cta-text">Enlighting handles everything from pre-approval through installation and final rebate filing &mdash; one team, one engagement. No obligation to use us after this conversation. Reach out and let's talk about your project.</div>
    <div class="about-cta-contacts">
      <div class="about-cta-contact-item">
        <div class="contact-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="10" fill="#7C3AED"/><path d="M5 7l5 4 5-4M5 7h10v8H5V7z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg></div>
        hello@enlightingenergy.com
      </div>
      <div class="about-cta-contact-item">
        <div class="contact-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="10" fill="#7C3AED"/><path d="M7 6h3l1 3-2 1a7 7 0 003 3l1-2 3 1v3c-5 1-10-4-9-9z" fill="white"/></svg></div>
        714-853-5416
      </div>
      <div class="about-cta-contact-item">
        <div class="contact-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="10" fill="#7C3AED"/><circle cx="10" cy="10" r="5" stroke="white" stroke-width="1.5"/><path d="M10 5v10M5 10h10" stroke="white" stroke-width="1.5"/></svg></div>
        enlightingenergy.com
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span><span class="footer-brand">Enlighting Energy</span> &nbsp;&middot;&nbsp; Qualifying Programs Report &nbsp;&middot;&nbsp; ${facility.reportDate}</span>
    <span>&copy; Enlighting Energy. All rights reserved.</span>
  </div>
</div>

</body>
</html>`;
}

