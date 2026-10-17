import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  STATUS_META, SEVERITY_META, SERIES_COLORS, ACCESS_LABELS, EVENT_LABELS,
  fmtDateTime, fmtDate, fmtPercent, fmtNumber, fmtDuration, fileStamp, allowedRolesText, BACKUP_TYPE_LABELS, stepText,
} from './reportFormat';

const BRAND = [35, 56, 143];
const INK = [7, 11, 29];
const MUTED = [100, 102, 110];
const GRID = [229, 231, 235];
const MARGIN = 14;

// jsPDF's built-in fonts are Latin-1 only; map the few symbols the report uses.
const pdfText = (value) => String(value ?? '')
  .replace(/[—–]/g, '-')
  .replace(/→/g, 'to')
  .replace(/≥/g, '>=')
  .replace(/≤/g, '<=')
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[^\x00-\xFF]/g, '');

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

class ReportPdf {
  constructor(report) {
    this.report = report;
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - MARGIN * 2;
    this.y = MARGIN;
  }

  ensureSpace(height) {
    if (this.y + height > this.pageHeight - 18) {
      this.doc.addPage();
      this.y = 20;
    }
  }

  sectionTitle(number, title) {
    this.ensureSpace(24);
    this.y += 4;
    this.doc.setFillColor(...BRAND);
    this.doc.rect(MARGIN, this.y, 1.5, 7, 'F');
    this.doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK);
    this.doc.text(pdfText(`${number}. ${title}`), MARGIN + 4, this.y + 5.5);
    this.y += 12;
  }

  subTitle(title) {
    this.ensureSpace(14);
    this.doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK);
    this.doc.text(pdfText(title), MARGIN, this.y + 4);
    this.y += 7;
  }

  paragraph(text, { size = 9, color = MUTED } = {}) {
    this.doc.setFont('helvetica', 'normal').setFontSize(size).setTextColor(...color);
    const lines = this.doc.splitTextToSize(pdfText(text), this.contentWidth);
    this.ensureSpace(lines.length * 4.2 + 2);
    this.doc.text(lines, MARGIN, this.y + 3.5);
    this.y += lines.length * 4.2 + 2;
  }

  table(head, body, options = {}) {
    autoTable(this.doc, {
      startY: this.y,
      head: [head.map(pdfText)],
      body: body.length ? body.map((row) => row.map(pdfText)) : [[{ content: 'No records in this period', colSpan: head.length, styles: { textColor: MUTED, fontStyle: 'italic' } }]],
      margin: { left: MARGIN, right: MARGIN, top: 20, bottom: 18 },
      styles: { fontSize: 8, cellPadding: 1.8, textColor: INK, lineColor: GRID, lineWidth: 0.1 },
      headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 248, 251] },
      ...options,
    });
    this.y = this.doc.lastAutoTable.finalY + 6;
  }

  /** Key/value grid used for headline metrics. */
  keyValues(rows) {
    this.table(['Metric', 'Value'], rows, {
      columnStyles: { 0: { cellWidth: 70, textColor: MUTED }, 1: { fontStyle: 'bold' } },
    });
  }

  statusCellHook(columnIndex, metaMap) {
    return (data) => {
      if (data.section !== 'body' || data.column.index !== columnIndex) return;
      const key = data.row.raw?.[columnIndex]?.__key;
      const meta = metaMap[key];
      if (meta) {
        data.cell.styles.textColor = meta.rgb;
        data.cell.styles.fontStyle = 'bold';
      }
    };
  }

  /**
   * Vertical bar chart (single series or stacked). Labels only first/last day to avoid collisions;
   * exact values are in the appendix table.
   */
  barChart({ title, days, series, height = 46, maxValue, notMeasured }) {
    this.ensureSpace(height + 22);
    this.subTitle(title);
    const doc = this.doc;
    const legendH = series.length > 1 ? 6 : 0;
    const top = this.y + legendH;
    const left = MARGIN + 10;
    const width = this.contentWidth - 10;
    const totals = days.map((_, i) => series.reduce((s, ser) => s + (ser.values[i] || 0), 0));
    const max = maxValue ?? Math.max(1, ...totals);

    if (series.length > 1) {
      let lx = MARGIN;
      doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
      series.forEach((ser) => {
        doc.setFillColor(...hexToRgb(ser.color));
        doc.roundedRect(lx, this.y + 0.5, 3, 3, 0.6, 0.6, 'F');
        doc.text(pdfText(ser.name), lx + 4.5, this.y + 3);
        lx += doc.getTextWidth(pdfText(ser.name)) + 11;
      });
    }

    // Recessive gridlines + y labels
    doc.setDrawColor(...GRID).setLineWidth(0.15);
    doc.setFont('helvetica', 'normal').setFontSize(6.5).setTextColor(...MUTED);
    [0, 0.5, 1].forEach((f) => {
      const gy = top + height - f * height;
      doc.line(left, gy, left + width, gy);
      const label = maxValue === 100 ? `${Math.round(f * 100)}%` : fmtNumber(Math.round(f * max));
      doc.text(label, left - 1.5, gy + 1, { align: 'right' });
    });

    const slot = width / Math.max(1, days.length);
    const barW = Math.max(0.4, Math.min(6, slot * 0.7));

    // Unmeasured days get a neutral band so they can't be mistaken for 0%.
    if (notMeasured?.some(Boolean)) {
      doc.setFillColor(238, 239, 242);
      notMeasured.forEach((flag, i) => {
        if (flag) doc.rect(left + i * slot, top, slot, height, 'F');
      });
      doc.setFontSize(6.5).setTextColor(...MUTED);
      doc.text('Shaded = not measured', left + width, top - 1.5, { align: 'right' });
    }
    days.forEach((_, i) => {
      let stackTop = top + height;
      series.forEach((ser) => {
        const v = ser.values[i];
        if (v == null || v <= 0) return;
        const h = (v / max) * height;
        doc.setFillColor(...hexToRgb(ser.color));
        doc.rect(left + i * slot + (slot - barW) / 2, stackTop - h, barW, h, 'F');
        stackTop -= h;
      });
    });

    if (days.length) {
      doc.setFontSize(6.5).setTextColor(...MUTED);
      doc.text(fmtDate(days[0]), left, top + height + 4);
      doc.text(fmtDate(days[days.length - 1]), left + width, top + height + 4, { align: 'right' });
    }
    this.y = top + height + 9;
  }

  header() {
    const { meta } = this.report;
    const doc = this.doc;
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, this.pageWidth, 38, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(17).setTextColor(255);
    doc.text('DRIMS System Activity & Status Report', MARGIN, 16);
    doc.setFont('helvetica', 'normal').setFontSize(10);
    doc.text(pdfText(`Reporting period: ${fmtDate(meta.from)} - ${fmtDate(meta.to)}  (${meta.timezone})`), MARGIN, 24);
    doc.setFontSize(8.5);
    doc.text(pdfText(`Generated ${fmtDateTime(meta.generatedAt)} by ${meta.generatedBy?.name || ''} (${meta.generatedBy?.role || ''})  |  Environment: ${meta.environment}`), MARGIN, 31);
    this.y = 46;
    this.paragraph(
      meta.instrumentationSince
        ? `Uptime and security-event monitoring active since ${fmtDateTime(meta.instrumentationSince)}. Any part of the period before that is reported as "Not measured", not as a pass.`
        : 'Uptime and security-event monitoring had not started when this report was generated. Those sections are reported as "Not measured".'
    );
  }

  summary() {
    const { checks } = this.report;
    this.sectionTitle(1, 'Executive Summary');
    const counts = checks.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {});
    this.paragraph(
      `${checks.length} checks: ${counts.PASS || 0} passed, ${counts.WARN || 0} warnings, ${counts.FAIL || 0} failed, ${counts.NOT_MEASURED || 0} not measured.`,
      { color: INK }
    );
    autoTable(this.doc, {
      startY: this.y,
      head: [['Check', 'Status', 'Detail']],
      body: checks.map((c) => [pdfText(c.label), { content: STATUS_META[c.status].label, __key: c.status }, pdfText(c.detail)]),
      margin: { left: MARGIN, right: MARGIN, top: 20, bottom: 18 },
      styles: { fontSize: 8, cellPadding: 1.8, textColor: INK, lineColor: GRID, lineWidth: 0.1 },
      headStyles: { fillColor: BRAND, textColor: 255 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' }, 1: { cellWidth: 24 } },
      didParseCell: this.statusCellHook(1, STATUS_META),
    });
    this.y = this.doc.lastAutoTable.finalY + 6;
  }

  availability() {
    const a = this.report.availability;
    this.sectionTitle(2, 'System Uptime & Availability');
    this.keyValues([
      ['Status', STATUS_META[a.status].label],
      ['Uptime (measured period)', fmtPercent(a.uptimePercent, 3)],
      ['Measured period', a.measuredFrom ? `${fmtDateTime(a.measuredFrom)} - ${fmtDateTime(a.measuredTo)}` : 'Not measured'],
      ['Total downtime', a.downtimeMinutes == null ? 'Not measured' : fmtDuration(a.downtimeMinutes)],
      ['Outages (3+ min)', a.outages ? String(a.outages.length) : 'Not measured'],
      ['Longest outage', a.longestOutageMinutes == null ? 'Not measured' : fmtDuration(a.longestOutageMinutes)],
      ['Server restarts', a.restarts == null ? 'Not measured' : String(a.restarts)],
      ...(a.notMeasuredRanges || []).map((r) => ['Not measured', `${fmtDateTime(r.from)} - ${fmtDateTime(r.to)}${r.reason ? ` (${r.reason})` : ''}`]),
    ]);
    if (a.daily?.some((d) => d.measured)) {
      this.barChart({
        title: 'Daily uptime (%)',
        days: a.daily.map((d) => d.day),
        series: [{ name: 'Uptime', color: SERIES_COLORS[0], values: a.daily.map((d) => (d.measured ? d.uptimePercent : null)) }],
        maxValue: 100,
        notMeasured: a.daily.map((d) => !d.measured),
      });
    }
    if (a.outages?.length) {
      this.subTitle('Outages');
      this.table(['From', 'To', 'Duration'], a.outages.map((o) => [fmtDateTime(o.from), fmtDateTime(o.to), fmtDuration(o.durationMinutes)]));
    }

    const e = a.external;
    this.subTitle('Reachability from outside (DigitalOcean Uptime)');
    if (!e || e.status === 'NOT_MEASURED') {
      this.paragraph(e?.configured
        ? 'Not measured: the DigitalOcean Uptime check had not been polled during this period.'
        : 'Not measured: outside-in monitoring was not set up for this period.', { color: INK });
      return;
    }
    this.keyValues([
      ['Status', STATUS_META[e.status].label],
      ['Reachable from outside', fmtPercent(e.uptimePercent, 3)],
      ['Monitored period', `${fmtDateTime(e.measuredFrom)} - ${fmtDateTime(e.measuredTo)}`],
      ['Unreachable for', fmtDuration(e.downtimeMinutes)],
      ['Outages seen from outside', `${fmtNumber(e.outages.length)} (${fmtNumber(e.outsideOnlyOutages)} while the server itself was running)`],
      ['Monitoring coverage', `${fmtPercent(e.pollCoveragePercent, 0)} of hours polled; ${fmtNumber(e.failedPolls)} failed poll(s)`],
    ]);
    this.paragraph('An outage the server heartbeat did not see means the API was running but unreachable (DNS, SSL, proxy or network).');
    if (e.outages.length) {
      this.table(['Region', 'From', 'To', 'Duration', 'Server heartbeat'], e.outages.map((o) => [
        o.region, fmtDateTime(o.from), o.ongoing ? 'Ongoing' : fmtDateTime(o.to), fmtDuration(o.durationMinutes), o.seenByHeartbeat ? 'Also down' : 'Running (outside-only)',
      ]));
    }
  }

  activity() {
    const { submissions, messages, logins, tickets } = this.report.activity;
    const { users } = this.report;
    const days = submissions.daily.map((d) => d.day);
    this.sectionTitle(3, 'Users & Platform Activity');

    this.subTitle('Registered users');
    this.paragraph(`Account totals as of ${fmtDateTime(users.asOf)}; "new" counts accounts created during the reporting period.`);
    this.keyValues([
      ['Total accounts', `${fmtNumber(users.total)} (${fmtNumber(users.active)} active, ${fmtNumber(users.deactivated)} deactivated)`],
      ['Students', `${fmtNumber(users.students.total)} (${fmtNumber(users.students.active)} active)`],
      ['Staff accounts', `${fmtNumber(users.staff.total)} (${fmtNumber(users.staff.active)} active)`],
      ['New accounts in period', `${fmtNumber(users.newInPeriod)} (${fmtNumber(users.students.newInPeriod)} students, ${fmtNumber(users.staff.newInPeriod)} staff)`],
      ['Users who signed in during period', fmtNumber(logins.uniqueUsers)],
    ]);
    this.table(
      ['Role', 'Total', 'Active', 'Deactivated', 'New in period', 'Signed in'],
      users.byRole.map((r) => [
        r.role, fmtNumber(r.total), fmtNumber(r.active), fmtNumber(r.deactivated), fmtNumber(r.newInPeriod),
        fmtNumber(logins.byRole.find((l) => l.role === r.role)?.uniqueUsers || 0),
      ])
    );

    this.subTitle('Document submissions');
    this.keyValues([
      ['Total submissions', fmtNumber(submissions.total)],
      ['Student documents', fmtNumber(submissions.studentDocuments)],
      ['Proposals', fmtNumber(submissions.proposals)],
      ['Books (dissertations)', fmtNumber(submissions.books)],
      ['Letters', fmtNumber(submissions.letters)],
    ]);
    this.barChart({
      title: 'Submissions per day',
      days,
      series: [
        { name: 'Student documents', color: SERIES_COLORS[0], values: submissions.daily.map((d) => d.studentDocuments) },
        { name: 'Proposals', color: SERIES_COLORS[1], values: submissions.daily.map((d) => d.proposals) },
        { name: 'Books', color: SERIES_COLORS[2], values: submissions.daily.map((d) => d.books) },
        { name: 'Letters', color: SERIES_COLORS[3], values: submissions.daily.map((d) => d.letters) },
      ],
    });
    if (submissions.studentDocumentsByType.length) {
      this.table(['Student document type', 'Count'], submissions.studentDocumentsByType.map((r) => [r.type, fmtNumber(r.count)]));
    }

    this.subTitle('Direct messages');
    this.keyValues([
      ['Messages sent', fmtNumber(messages.sent)],
      ['Read by recipient', fmtNumber(messages.readByRecipient)],
      ['Unread', fmtNumber(messages.unread)],
      ['Read rate', fmtPercent(messages.readRatePercent, 1)],
      ['Active conversations', fmtNumber(messages.activeConversations)],
    ]);
    this.barChart({
      title: 'Direct messages per day',
      days,
      series: [
        { name: 'Read by recipient', color: SERIES_COLORS[0], values: messages.daily.map((d) => d.readByRecipient) },
        { name: 'Unread', color: SERIES_COLORS[1], values: messages.daily.map((d) => d.sent - d.readByRecipient) },
      ],
    });
    if (messages.sentByRole.length) {
      this.table(['Sender role', 'Messages sent'], messages.sentByRole.map((r) => [r.role, fmtNumber(r.count)]));
    }

    this.subTitle('Sign-ins and support');
    this.table(['Role', 'Logins', 'Unique users'], logins.byRole.map((r) => [r.role, fmtNumber(r.logins), fmtNumber(r.uniqueUsers)]));
    this.keyValues([
      ['Total logins', fmtNumber(logins.total)],
      ['Unique users signed in', fmtNumber(logins.uniqueUsers)],
      ['Support tickets created', fmtNumber(tickets.created)],
      ['Support tickets resolved', fmtNumber(tickets.resolved)],
    ]);
  }

  security() {
    const { security, rbac } = this.report;
    this.sectionTitle(4, 'Data Integrity & Security Validation');

    this.subTitle('4.1 Role-based access control (RBAC)');
    this.paragraph('Route configuration inspected live from the running server at report time. Denials are counted from server logs for the measured period.');
    this.keyValues([
      ['API routes inspected', fmtNumber(rbac.totalRoutes)],
      ['Role restricted', fmtNumber(rbac.roleRestricted)],
      ['Own account only (any role, by design)', fmtNumber(rbac.selfService)],
      ['Open to any signed-in role (no stated reason)', fmtNumber(rbac.anyAuthenticated)],
      ['Public (intended: login, password reset, guest tickets)', fmtNumber(rbac.publicExpected)],
      ['Public (unexpected)', fmtNumber(rbac.publicUnexpected)],
    ]);
    const unexpected = rbac.routes.filter((r) => r.access === 'PUBLIC_UNEXPECTED');
    if (unexpected.length) {
      this.table(['Method', 'Unexpectedly public endpoint'], unexpected.map((r) => [r.method, r.path]), {
        headStyles: { fillColor: STATUS_META.FAIL.rgb, textColor: 255 },
      });
    }

    this.subTitle('4.2 Blocked and failed requests');
    if (!security.measured) {
      this.paragraph('Not measured: access-denial logging was not active during this period.', { color: INK });
    } else {
      if (security.measuredFrom && security.measuredFrom !== this.report.availability.measuredFrom) {
        this.paragraph(`Measured from ${fmtDateTime(security.measuredFrom)}.`);
      }
      this.table(['Event', 'Count'], Object.keys(EVENT_LABELS).map((k) => [EVENT_LABELS[k], fmtNumber(security.totals[k] || 0)]));
      this.barChart({
        title: 'Security events per day',
        days: security.daily.map((d) => d.day),
        series: [
          { name: 'Role denials', color: SERIES_COLORS[0], values: security.daily.map((d) => d.denied) },
          { name: 'Unauthenticated', color: SERIES_COLORS[1], values: security.daily.map((d) => d.unauthenticated) },
          { name: 'Failed logins', color: SERIES_COLORS[2], values: security.daily.map((d) => d.failedLogins) },
          { name: 'Rate limited', color: SERIES_COLORS[3], values: security.daily.map((d) => d.rateLimited) },
        ],
      });
      if (security.deniedByEndpoint.length) {
        this.subTitle('Most frequently blocked endpoints');
        this.table(['Event', 'Method', 'Endpoint', 'Count'], security.deniedByEndpoint.map((r) => [EVENT_LABELS[r.type] || r.type, r.method, r.endpoint, fmtNumber(r.count)]), {
          columnStyles: { 2: { cellWidth: 95 } },
        });
      }
      if (security.failedLoginsByIp.length) {
        this.subTitle('Failed logins by source IP');
        this.table(['IP address', 'Failed logins'], security.failedLoginsByIp.map((r) => [r.ipAddress, fmtNumber(r.failedLogins)]));
      }
    }

    this.subTitle('4.3 Session management');
    const rl = security.session.rateLimits;
    this.keyValues([
      ['Token lifetime', security.session.tokenLifetime],
      ['"Remember me" token lifetime', security.session.rememberMeLifetime],
      ['Server-side token revocation', security.session.serverSideRevocation ? 'Enabled (logout and account deactivation)' : 'Disabled'],
      ['API rate limit', `${rl.api.limit} requests / ${rl.api.windowMinutes} min per ${rl.api.keyedBy}`],
      ['Login rate limit', `${rl.login.limit} failed attempts / ${rl.login.windowMinutes} min per ${rl.login.keyedBy.replace(', failed attempts only', '')}; ${rl.loginPerIp.limit} attempts / ${rl.loginPerIp.windowMinutes} min per IP`],
      ['Logouts (tokens revoked)', fmtNumber(security.session.logouts)],
      ['Deactivated accounts signed out', fmtNumber(security.session.deactivationRevocations)],
      ['Accounts signing in from 5+ IPs', fmtNumber(security.multiIpAccounts.length)],
    ]);
  }

  backups() {
    const { backups, integrity } = this.report;
    this.subTitle('4.4 Backup & recovery');
    this.keyValues([
      ['Backup setup', backups.provider],
      ['Runs reported in period', backups.scriptReporting ? `${fmtNumber(backups.runsInWindow)} (${fmtNumber(backups.runsWithProblems)} with a problem)` : 'Not measured: mongodb_backup.sh has not reported yet'],
      ['Latest successful backup', backups.latestBackup ? `${fmtDateTime(backups.latestBackup.performedAt)} (${backups.latestBackupAgeHours.toFixed(1)} h ago)` : 'Not measured'],
      ['Days in period with a backup', backups.daysInWindow ? `${backups.daysWithBackup} of ${backups.daysInWindow}` : '-'],
      ['Latest off-site copy', backups.offsiteConfigured === false ? 'Not configured' : backups.latestOffsite ? `${fmtDateTime(backups.latestOffsite.performedAt)} (${backups.latestOffsiteAgeHours.toFixed(1)} h ago); ${backups.daysWithOffsite} of ${backups.daysInWindow} days` : 'Not measured'],
      ['Recovery verified', backups.restore ? `${STATUS_META[backups.restore.status].label}: ${backups.restore.detail}` : 'Not measured'],
    ]);
    if (backups.records.length) {
      this.table(['Performed', 'Type', 'Dump', 'Off-site', 'Atlas', 'Verify', 'GB', 'Notes'],
        backups.records.map((r) => [
          fmtDateTime(r.performedAt), BACKUP_TYPE_LABELS[r.type] || r.type, r.status === 'SUCCESS' ? 'OK' : 'Failed',
          stepText(r.offsiteStatus), stepText(r.mirrorStatus), stepText(r.verifyStatus), r.sizeGb ?? '-',
          r.verifyDetails || r.notes || '',
        ]),
        { columnStyles: { 0: { cellWidth: 27 }, 7: { cellWidth: 48 } } });
    }

    this.subTitle('4.5 Data integrity');
    this.keyValues([
      ['Student documents without a stored file', fmtNumber(integrity.studentDocumentsWithoutContent)],
      ['Letters without a stored file', fmtNumber(integrity.lettersWithoutContent)],
    ]);
  }

  findings() {
    const { findings } = this.report;
    this.sectionTitle(5, 'Findings & Recommendations');
    if (!findings.length) {
      this.paragraph('No findings for this period.', { color: INK });
      return;
    }
    autoTable(this.doc, {
      startY: this.y,
      head: [['Severity', 'Finding', 'Detail']],
      body: findings.map((f) => [{ content: f.severity, __key: f.severity }, pdfText(f.title), pdfText(f.detail)]),
      margin: { left: MARGIN, right: MARGIN, top: 20, bottom: 18 },
      styles: { fontSize: 8, cellPadding: 1.8, textColor: INK, lineColor: GRID, lineWidth: 0.1 },
      headStyles: { fillColor: BRAND, textColor: 255 },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 55, fontStyle: 'bold' } },
      didParseCell: this.statusCellHook(0, SEVERITY_META),
    });
    this.y = this.doc.lastAutoTable.finalY + 6;
  }

  appendix() {
    const { rbac, activity, security, availability } = this.report;
    this.doc.addPage();
    this.y = 20;
    this.sectionTitle('A', 'Appendix: Daily Breakdown');
    this.table(
      ['Date', 'Uptime', 'Submissions', 'DMs sent', 'DMs read', 'Logins', 'Denied', 'Failed logins'],
      activity.submissions.daily.map((d, i) => {
        const up = availability.daily[i];
        const sec = security.daily[i];
        return [
          fmtDate(d.day),
          up?.measured ? fmtPercent(up.uptimePercent, 1) : 'Not measured',
          fmtNumber(d.total),
          fmtNumber(activity.messages.daily[i]?.sent),
          fmtNumber(activity.messages.daily[i]?.readByRecipient),
          fmtNumber(activity.logins.daily[i]?.logins),
          security.measured ? fmtNumber(sec?.denied) : '-',
          security.measured ? fmtNumber(sec?.failedLogins) : '-',
        ];
      }),
      { styles: { fontSize: 7, cellPadding: 1.2, textColor: INK, lineColor: GRID, lineWidth: 0.1 } }
    );

    this.doc.addPage();
    this.y = 20;
    this.sectionTitle('B', 'Appendix: RBAC Route Matrix');
    this.table(
      ['Method', 'Endpoint', 'Allowed roles', 'Access'],
      rbac.routes.map((r) => [r.method, r.path, allowedRolesText(r), ACCESS_LABELS[r.access]]),
      {
        styles: { fontSize: 6.5, cellPadding: 1, textColor: INK, lineColor: GRID, lineWidth: 0.1 },
        columnStyles: { 0: { cellWidth: 13 }, 1: { cellWidth: 82 }, 3: { cellWidth: 27 } },
      }
    );
  }

  footers() {
    const total = this.doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      this.doc.setDrawColor(...GRID).setLineWidth(0.2);
      this.doc.line(MARGIN, this.pageHeight - 12, this.pageWidth - MARGIN, this.pageHeight - 12);
      this.doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
      this.doc.text('DRIMS System Activity & Status Report - Confidential', MARGIN, this.pageHeight - 7);
      this.doc.text(`Page ${i} of ${total}`, this.pageWidth - MARGIN, this.pageHeight - 7, { align: 'right' });
    }
  }

  build() {
    this.header();
    this.summary();
    this.availability();
    this.activity();
    this.security();
    this.backups();
    this.findings();
    this.appendix();
    this.footers();
    return this.doc;
  }
}

export const buildSystemReportPdf = (report) => new ReportPdf(report).build();

export const exportSystemReportPdf = (report) => {
  buildSystemReportPdf(report).save(`${fileStamp(report)}.pdf`);
};
