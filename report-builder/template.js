// Generates the full HTML string for the Qualifying Programs Report
// data: reportData object (see sample-data.js for shape)

export function generateReportHTML(data) {
  const { facility, measures, programCount, summary, programs, stackingNotes, priorityActions } = data;

  const categoryColor = (cat) => {
    if (cat.includes('Utility')) return { bg: '#EAE8F5', text: '#1C2B5E', dot: '#1C2B5E' };
    if (cat.includes('Federal')) return { bg: '#FFF3E0', text: '#E65100', dot: '#E65100' };
    if (cat.includes('State')) return { bg: '#E8F5E9', text: '#4B3082', dot: '#4B3082' };
    if (cat.includes('Financing')) return { bg: '#F0EBF8', text: '#4B3082', dot: '#4B3082' };
    return { bg: '#F5F5F7', text: '#424242', dot: '#424242' };
  };

  const renderCard = (p) => {
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
            <div class="program-value next-step-value">${p.nextStep}</div>
          </div>
        </div>
      </div>`;
  };

  const programCardsHTML = programs.map(group => {
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
      <td class="stacking-can ${s.canStack ? 'can-yes' : 'can-no'}">${s.canStack ? '✓ Yes' : '✗ No'}</td>
      <td class="stacking-note">${s.note}</td>
    </tr>
  `).join('');

  const priorityHTML = priorityActions.map(a => `
    <div class="priority-item">
      <div class="priority-number">${a.priority}</div>
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
  <title>Qualifying Programs Report — ${facility.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', Helvetica, Arial, sans-serif;
      font-size: 10pt;
      color: #222;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cover {
      width: 8.5in;
      min-height: 11in;
      position: relative;
      overflow: hidden;
      background: #fff;
      page-break-after: always;
    }

    .content-page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.55in 0.7in 0.6in;
      position: relative;
      background: #fff;
    }

    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 2px solid #C84EC4;
      margin-bottom: 28px;
      font-size: 8.5pt;
      color: #888;
      page-break-after: avoid;
    }
    .running-header-left { font-weight: 600; color: #1C2B5E; }

    .page-footer {
      position: absolute;
      bottom: 0.35in;
      left: 0.7in;
      right: 0.7in;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #aaa;
      border-top: 1px solid #eee;
      padding-top: 8px;
    }
    .footer-brand { color: #1C2B5E; font-weight: 600; }

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
      page-break-inside: avoid;
    }

    .section-divider {
      height: 3px;
      background: linear-gradient(90deg, #C84EC4 0%, #1C2B5E 60%, transparent 100%);
      margin-bottom: 28px;
    }

    .cover-top-bar {
      height: 6px;
      background: linear-gradient(90deg, #C84EC4, #1C2B5E);
    }
    .cover-accent-bar {
      height: 2px;
      background: #f0f0f0;
    }

    .cover-body {
      padding: 0.55in 0.7in 0.5in;
      display: flex;
      flex-direction: column;
      min-height: calc(11in - 8px);
    }

    .cover-logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
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
      padding: 0.4in 0 0.3in;
    }

    .cover-eyebrow {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #C84EC4;
      margin-bottom: 16px;
    }

    .cover-title {
      font-size: 38pt;
      font-weight: 900;
      color: #1C2B5E;
      line-height: 1.08;
      margin-bottom: 20px;
    }

    .cover-subtitle {
      font-size: 12pt;
      color: #555;
      line-height: 1.6;
      margin-bottom: 32px;
      max-width: 5.5in;
    }

    .cover-divider {
      width: 0.6in;
      height: 4px;
      background: #C84EC4;
      margin-bottom: 32px;
      border-radius: 2px;
    }

    .cover-facility-box {
      background: #f8f8fc;
      border-left: 4px solid #C84EC4;
      border-radius: 0 8px 8px 0;
      padding: 20px 24px;
      max-width: 5in;
    }

    .cover-facility-label {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #C84EC4;
      margin-bottom: 6px;
    }

    .cover-facility-name {
      font-size: 18pt;
      font-weight: 800;
      color: #1C2B5E;
      margin-bottom: 6px;
    }

    .cover-facility-meta {
      font-size: 9pt;
      color: #777;
      margin-bottom: 3px;
    }

    .cover-facility-contact {
      font-size: 8.5pt;
      color: #aaa;
      margin-top: 4px;
    }

    .cover-measure-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    .cover-measure-tag {
      background: #1C2B5E;
      color: #fff;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }

    .cover-bottom {
      border-top: 1px solid #eee;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .cover-stat-block { text-align: center; }

    .cover-stat-number {
      font-size: 28pt;
      font-weight: 900;
      color: #C84EC4;
      line-height: 1;
    }

    .cover-stat-label {
      font-size: 7.5pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }

    .cover-prepared-by {
      font-size: 8pt;
      color: #aaa;
      text-align: right;
    }

    .cover-prepared-by strong {
      color: #555;
      display: block;
      margin-bottom: 2px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }

    .summary-card {
      background: #f8f8fc;
      border-radius: 8px;
      padding: 16px 20px;
      border-left: 3px solid #C84EC4;
    }

    .summary-card-label {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #C84EC4;
      margin-bottom: 6px;
    }

    .summary-card-value {
      font-size: 11pt;
      font-weight: 700;
      color: #1C2B5E;
    }

    .summary-narrative {
      font-size: 10pt;
      color: #444;
      line-height: 1.7;
      margin-bottom: 24px;
      padding: 18px 22px;
      background: #f4f4f8;
      border-radius: 8px;
    }

    .summary-program-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 0;
      border-bottom: 1px solid #eee;
    }

    .summary-program-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .summary-program-name {
      font-size: 9.5pt;
      font-weight: 600;
      color: #222;
      flex: 1;
    }

    .summary-program-category {
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 3px;
    }

    .summary-program-measure {
      font-size: 8pt;
      color: #888;
      white-space: nowrap;
    }

    .measure-group { margin-bottom: 32px; }
    .measure-header-anchor { page-break-inside: avoid; }

    .measure-header {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #1C2B5E;
      color: #fff;
      padding: 10px 16px;
      border-radius: 6px 6px 0 0;
      font-size: 10pt;
      font-weight: 700;
      page-break-after: avoid;
    }

    .measure-icon { font-size: 13pt; }

    .measure-count {
      margin-left: auto;
      font-size: 8pt;
      font-weight: 500;
      opacity: 0.8;
    }

    .program-card {
      border: 1px solid #e0e0e8;
      border-top: none;
      background: #fff;
      page-break-inside: avoid;
    }

    .program-card + .program-card { border-top: 2px solid #C84EC4; }

    .program-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 14px 16px 10px;
      border-bottom: 1px solid #f0f0f0;
      gap: 12px;
    }

    .program-name {
      font-size: 11.5pt;
      font-weight: 800;
      color: #1C2B5E;
      line-height: 1.2;
    }

    .program-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 8pt;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .badge-dot { width: 6px; height: 6px; border-radius: 50%; }

    .program-body { padding: 0; }

    .program-row {
      display: flex;
      padding: 8px 16px;
      border-bottom: 1px solid #f5f5f5;
      min-height: 34px;
      align-items: flex-start;
    }

    .program-row:last-child { border-bottom: none; }
    .program-row.alt { background: #fafafa; }
    .program-row.highlight-green { background: #f0faf4; }
    .program-row.highlight-amber { background: #fffbf0; }
    .program-row.highlight-blue { background: #f0f4ff; }
    .program-row.conflict-row { background: #fff5f5; }

    .program-label {
      font-size: 8pt;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: 1.6in;
      flex-shrink: 0;
      padding-top: 2px;
    }

    .program-value {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.45;
      flex: 1;
    }

    .stack-value { color: #2d6a4f; font-weight: 500; }
    .conflict-value { color: #c0392b; font-weight: 500; }

    .pre-approval-flag {
      font-size: 8pt;
      font-weight: 700;
      color: #b45309;
      display: inline-block;
      margin-bottom: 3px;
    }

    .next-step-row { border-bottom: none; }
    .next-step-value { font-weight: 600; color: #1C2B5E; }

    .stacking-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 9.5pt;
    }

    .stacking-table thead tr { background: #1C2B5E; color: #fff; }

    .stacking-table th {
      padding: 10px 14px;
      text-align: left;
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .stacking-row td { padding: 9px 14px; border-bottom: 1px solid #eee; }
    .stacking-pair { font-weight: 600; color: #222; }
    .stacking-can { font-weight: 700; white-space: nowrap; }
    .can-yes { color: #2d6a4f; }
    .can-no { color: #c0392b; }
    .stacking-note { color: #555; font-size: 9pt; }

    .priority-item {
      display: flex;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #eee;
      page-break-inside: avoid;
    }

    .priority-number {
      width: 32px;
      height: 32px;
      background: #C84EC4;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11pt;
      font-weight: 900;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .priority-urgency {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #C84EC4;
      margin-bottom: 4px;
    }

    .priority-action {
      font-size: 11pt;
      font-weight: 700;
      color: #1C2B5E;
      margin-bottom: 4px;
    }

    .priority-detail {
      font-size: 9.5pt;
      color: #555;
      line-height: 1.5;
    }

    .section-anchor { page-break-after: avoid; }
    .page-break-before { page-break-before: always; }

    @media print {
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

<div class="cover">
  <div class="cover-top-bar"></div>
  <div class="cover-accent-bar"></div>
  <div class="cover-body">
    <div style="margin-bottom:0.3in;">
      <div class="cover-logo-area" style="margin-bottom:6px;">
        <div class="cover-logo-circle">⚡</div>
        <div class="cover-company-name">Enlighting Energy</div>
      </div>
      <div class="cover-report-type">Qualifying Programs Report</div>
    </div>
    <div class="cover-main">
      <div class="cover-eyebrow">Incentive Finder 2.0</div>
      <div class="cover-title">Your Qualifying<br>Programs Report</div>
      <div class="cover-subtitle">Every utility rebate, state grant, and federal program<br>your facility qualifies for — organized by measure.</div>
      <div class="cover-divider"></div>
      <div class="cover-facility-box">
        <div class="cover-facility-label">Prepared For</div>
        <div class="cover-facility-name">${facility.name}</div>
        <div class="cover-facility-meta">${facility.state} ${facility.zipCode} &nbsp;·&nbsp; ${facility.facilityType} &nbsp;·&nbsp; ${facility.squareFootage.toLocaleString()} sq ft &nbsp;·&nbsp; ${facility.utility}</div>
        <div class="cover-facility-contact">${facility.email} &nbsp;·&nbsp; ${facility.reportDate}</div>
        <div class="cover-measure-tags">
          ${measures.map(m => `<span class="cover-measure-tag">${m}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="cover-bottom">
      <div style="display:flex; gap:40px;">
        <div class="cover-stat-block">
          <div class="cover-stat-number">${programCount}</div>
          <div class="cover-stat-label">Qualifying Programs</div>
        </div>
        <div class="cover-stat-block">
          <div class="cover-stat-number">${measures.length}</div>
          <div class="cover-stat-label">Eligible Measures</div>
        </div>
      </div>
      <div class="cover-prepared-by">
        <strong>Prepared by Enlighting Energy</strong>
        California Commercial Incentive Specialists<br>
        enlightingenergy.com
      </div>
    </div>
  </div>
</div>

<div class="content-page page-break-before">
  <div class="running-header">
    <div class="running-header-left">Executive Summary &nbsp;·&nbsp; ${facility.name}</div>
    <div class="running-header-right">${facility.reportDate}</div>
  </div>
  <div class="section-title section-anchor">Executive Summary</div>
  <div class="section-subtitle section-anchor">A snapshot of your facility's incentive landscape and the programs identified for your project.</div>
  <div class="section-divider section-anchor"></div>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-card-label">Facility</div>
      <div class="summary-card-value">${facility.name}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">Utility Provider</div>
      <div class="summary-card-value">${facility.utility}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">Qualifying Programs</div>
      <div class="summary-card-value">${programCount} programs found</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">Eligible Measures</div>
      <div class="summary-card-value">${measures.join(', ')}</div>
    </div>
  </div>
  <div class="summary-narrative">${summary}</div>
  <div class="summary-programs-preview">
    <div class="section-title" style="font-size:13pt;margin-bottom:12px;">All Qualifying Programs</div>
    ${programs.flatMap(group =>
      group.entries.map(p => {
        const colors = { bg: '#EAE8F5', text: '#1C2B5E', dot: '#1C2B5E' };
        if (p.category.includes('Federal')) { colors.bg = '#FFF3E0'; colors.text = '#E65100'; colors.dot = '#E65100'; }
        if (p.category.includes('State')) { colors.bg = '#E8F5E9'; colors.text = '#4B3082'; colors.dot = '#4B3082'; }
        if (p.category.includes('Financing')) { colors.bg = '#F0EBF8'; colors.text = '#4B3082'; colors.dot = '#4B3082'; }
        return `
        <div class="summary-program-row">
          <div class="summary-program-dot" style="background:${colors.dot};"></div>
          <div class="summary-program-name">${p.name}</div>
          <div class="summary-program-category" style="background:${colors.bg};color:${colors.text};">${p.category}</div>
          <div class="summary-program-measure">${group.measure}</div>
        </div>`;
      })
    ).join('')}
  </div>
  <div class="page-footer">
    <span><span class="footer-brand">Enlighting Energy</span> &nbsp;·&nbsp; Qualifying Programs Report</span>
    <span>Programs verified as of ${facility.reportDate}. Confirm current terms with program administrator before applying.</span>
  </div>
</div>

<div class="content-page page-break-before">
  <div class="running-header">
    <div class="running-header-left">Programs By Measure &nbsp;·&nbsp; ${facility.name}</div>
    <div class="running-header-right">${facility.reportDate}</div>
  </div>
  <div class="section-title section-anchor">Programs By Measure</div>
  <div class="section-subtitle">Each program is listed under the measure it applies to. Programs covering multiple measures appear under the most relevant one.</div>
  <div class="section-divider section-anchor"></div>
  ${programCardsHTML}
  <div class="page-footer">
    <span><span class="footer-brand">Enlighting Energy</span> &nbsp;·&nbsp; Qualifying Programs Report</span>
    <span>Programs verified as of ${facility.reportDate}. Confirm current terms with program administrator before applying.</span>
  </div>
</div>

<div class="content-page page-break-before">
  <div class="running-header">
    <div class="running-header-left">Stacking Analysis &nbsp;·&nbsp; ${facility.name}</div>
    <div class="running-header-right">${facility.reportDate}</div>
  </div>
  <div class="section-title section-anchor">Stacking Analysis</div>
  <div class="section-subtitle">Which programs from this report can be applied to the same project, and which cannot be combined.</div>
  <div class="section-divider section-anchor"></div>
  <table class="stacking-table">
    <thead>
      <tr>
        <th style="width:2.8in;">Program Pair</th>
        <th style="width:0.8in;">Can Stack?</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>${stackingHTML}</tbody>
  </table>
  <div class="page-footer">
    <span><span class="footer-brand">Enlighting Energy</span> &nbsp;·&nbsp; Qualifying Programs Report</span>
    <span>Programs verified as of ${facility.reportDate}. Confirm current terms with program administrator before applying.</span>
  </div>
</div>

<div class="content-page page-break-before">
  <div class="running-header">
    <div class="running-header-left">Priority Actions &nbsp;·&nbsp; ${facility.name}</div>
    <div class="running-header-right">${facility.reportDate}</div>
  </div>
  <div class="section-title section-anchor">Priority Actions</div>
  <div class="section-subtitle">Actions ordered by urgency. Items marked "Before Project Start" require action before equipment is purchased or installed.</div>
  <div class="section-divider section-anchor"></div>
  ${priorityHTML}
  <div class="page-footer">
    <span><span class="footer-brand">Enlighting Energy</span> &nbsp;·&nbsp; Qualifying Programs Report</span>
    <span>Programs verified as of ${facility.reportDate}. Confirm current terms with program administrator before applying.</span>
  </div>
</div>

<div class="content-page page-break-before" style="background:#1C2B5E;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
  <div style="color:#C84EC4;font-size:9pt;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">Next Steps</div>
  <div style="color:#fff;font-size:22pt;font-weight:900;margin-bottom:12px;line-height:1.2;">Ready to move forward?</div>
  <div style="color:#aac;font-size:11pt;margin-bottom:40px;max-width:4in;line-height:1.6;">
    Our team will walk you through each program, handle the paperwork, and make sure you capture every dollar available to your facility.
  </div>
  <div style="background:#C84EC4;color:#fff;padding:14px 32px;border-radius:6px;font-size:11pt;font-weight:700;margin-bottom:40px;">
    enlightingenergy.com
  </div>
  <div style="color:#667;font-size:8pt;margin-top:auto;padding-top:40px;">
    © ${new Date().getFullYear()} Enlighting Energy · This report is confidential and prepared exclusively for ${facility.name}
  </div>
</div>

</body>
</html>`;
}
