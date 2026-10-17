/* eslint-disable react/prop-types */
import React, { useMemo, useState } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { RiFilePdf2Line, RiFileZipLine, RiRefreshLine, RiDatabase2Line } from 'react-icons/ri';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useGetLoggedInUserDetails, useGetSystemReport } from '../../store/tanstackStore/services/queries';
import RecordBackupDialog from './RecordBackupDialog';
import { exportSystemReportPdf } from './exportSystemReportPdf';
import { exportSystemReportCsv } from './exportSystemReportCsv';
import {
  STATUS_META, SEVERITY_META, SERIES_COLORS, ACCESS_LABELS, EVENT_LABELS,
  fmtDateTime, fmtDate, fmtPercent, fmtNumber, fmtDuration, allowedRolesText, BACKUP_TYPE_LABELS, stepText,
} from './reportFormat';

const ymd = (d) => format(d, 'yyyy-MM-dd');

const PRESETS = [
  { label: 'Last 7 days', range: () => [subDays(new Date(), 6), new Date()] },
  { label: 'Last 30 days', range: () => [subDays(new Date(), 29), new Date()] },
  { label: 'This month', range: () => [startOfMonth(new Date()), new Date()] },
];

/* ---------- small building blocks ---------- */

const StatusPill = ({ status, meta = STATUS_META }) => {
  const m = meta[status] || STATUS_META.NOT_MEASURED;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${m.className}`}>
      {m.label || status}
    </span>
  );
};

const Stat = ({ label, value, hint }) => (
  <div className="rounded-lg border bg-white p-4">
    <p className="text-xs text-[#626263]">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-[#070B1D] tabular-nums">{value}</p>
    {hint && <p className="mt-1 text-xs text-[#939495]">{hint}</p>}
  </div>
);

const SimpleTable = ({ headers, rows, empty = 'No records in this period' }) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>{headers.map((h) => <TableHead key={h} className="text-xs">{h}</TableHead>)}</TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={headers.length} className="text-center text-sm text-gray-500 py-6">{empty}</TableCell></TableRow>
        ) : rows.map((row, i) => (
          <TableRow key={i}>{row.map((c, j) => <TableCell key={j} className="text-xs">{c}</TableCell>)}</TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const NotMeasured = ({ children }) => (
  <div className="rounded-md border border-dashed bg-gray-50 p-6 text-center text-sm text-gray-600">
    <p className="font-medium text-gray-700">Not measured</p>
    <p className="mt-1">{children}</p>
  </div>
);

/**
 * Daily bar chart (single or stacked) with a table view. Two of the series colors are
 * below 3:1 contrast, so the table view is the required non-color fallback.
 */
const DailyChart = ({ title, data, series, yFormatter, yDomain }) => {
  const [view, setView] = useState('chart');
  const stacked = series.length > 1;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <div className="flex rounded-md border text-xs">
          {['chart', 'table'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-2.5 py-1 capitalize ${view === v ? 'bg-[#ECF6FB] text-[#23388F] font-medium' : 'text-gray-600'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {view === 'chart' ? (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="#eceef2" />
                <XAxis dataKey="day" tickFormatter={(d) => format(new Date(d), 'dd MMM')} tick={{ fontSize: 11, fill: '#626263' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: '#626263' }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={yFormatter} domain={yDomain} />
                <Tooltip
                  cursor={{ fill: 'rgba(35,56,143,0.06)' }}
                  labelFormatter={(d) => fmtDate(d)}
                  formatter={(value, name) => [yFormatter ? yFormatter(value) : fmtNumber(value), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                {stacked && <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />}
                {series.map((s, i) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    stackId={stacked ? 'a' : undefined}
                    fill={SERIES_COLORS[i]}
                    stroke="#ffffff"
                    strokeWidth={stacked ? 1 : 0}
                    radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                    maxBarSize={28}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            <SimpleTable
              headers={['Date', ...series.map((s) => s.name)]}
              rows={data.map((d) => [fmtDate(d.day), ...series.map((s) => (d[s.key] == null ? 'Not measured' : yFormatter ? yFormatter(d[s.key]) : fmtNumber(d[s.key])))])}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ---------- sections ---------- */

const ExternalUptime = ({ e }) => {
  if (!e || e.status === 'NOT_MEASURED') {
    return (
      <NotMeasured>
        {e?.configured
          ? 'The DigitalOcean Uptime check has not been polled during this period yet.'
          : 'Outside-in monitoring is not set up. Create a DigitalOcean Uptime check for the API URL, then set DO_API_TOKEN and DO_UPTIME_CHECK_ID on the server.'}
      </NotMeasured>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Reachability from outside (DigitalOcean Uptime)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Reachable" value={fmtPercent(e.uptimePercent, 3)} hint={`Since ${fmtDateTime(e.measuredFrom)}`} />
          <Stat label="Unreachable for" value={fmtDuration(e.downtimeMinutes)} />
          <Stat label="Outages seen from outside" value={fmtNumber(e.outages.length)} hint={`${fmtNumber(e.outsideOnlyOutages)} while the server was running`} />
          <Stat label="Monitoring coverage" value={fmtPercent(e.pollCoveragePercent, 0)} hint={e.failedPolls ? `${fmtNumber(e.failedPolls)} failed poll(s)` : 'No failed polls'} />
        </div>
        <p className="text-xs text-[#626263]">
          An outage the server&apos;s own heartbeat did not see means the API was running but could not be reached (DNS, SSL, proxy or network).
        </p>
        <SimpleTable
          headers={['Region', 'From', 'To', 'Duration', 'Server heartbeat']}
          rows={e.outages.map((o) => [
            o.region,
            fmtDateTime(o.from),
            o.ongoing ? 'Ongoing' : fmtDateTime(o.to),
            fmtDuration(o.durationMinutes),
            o.seenByHeartbeat ? 'Also down' : <span key="h" className="font-medium text-amber-700">Running (outside-only)</span>,
          ])}
          empty="No outages seen from outside in this period"
        />
      </CardContent>
    </Card>
  );
};

const AvailabilitySection = ({ a }) => (
  <div className="space-y-4">
    <InternalAvailability a={a} />
    <ExternalUptime e={a.external} />
  </div>
);

const InternalAvailability = ({ a }) => {
  if (a.status === 'NOT_MEASURED') {
    return <NotMeasured>Heartbeat monitoring was not active during this period. Uptime is recorded from the moment the updated server is deployed.</NotMeasured>;
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Uptime" value={fmtPercent(a.uptimePercent, 3)} hint="Measured period only" />
        <Stat label="Total downtime" value={fmtDuration(a.downtimeMinutes)} />
        <Stat label="Outages (3+ min)" value={fmtNumber(a.outages.length)} />
        <Stat label="Longest outage" value={fmtDuration(a.longestOutageMinutes)} />
        <Stat label="Server restarts" value={fmtNumber(a.restarts)} />
      </div>
      <p className="text-xs text-[#626263]">
        Measured {fmtDateTime(a.measuredFrom)} to {fmtDateTime(a.measuredTo)} at {a.heartbeatIntervalSeconds}s intervals.
        {a.notMeasuredRanges.map((r, i) => (
          <span key={i} className="block">Not measured: {fmtDateTime(r.from)} to {fmtDateTime(r.to)}{r.reason ? ` (${r.reason.toLowerCase()})` : ''}</span>
        ))}
      </p>
      <DailyChart
        title="Daily uptime"
        data={a.daily.map((d) => ({ day: d.day, uptime: d.measured ? Number(d.uptimePercent.toFixed(2)) : null }))}
        series={[{ key: 'uptime', name: 'Uptime %' }]}
        yFormatter={(v) => `${v}%`}
        yDomain={[0, 100]}
      />
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Outages</CardTitle></CardHeader>
        <CardContent>
          <SimpleTable headers={['From', 'To', 'Duration']} rows={a.outages.map((o) => [fmtDateTime(o.from), fmtDateTime(o.to), fmtDuration(o.durationMinutes)])} empty="No outages in the measured period" />
        </CardContent>
      </Card>
    </div>
  );
};

const ActivitySection = ({ activity, users }) => {
  const { submissions, messages, logins, tickets } = activity;
  const msgData = messages.daily.map((d) => ({ day: d.day, read: d.readByRecipient, unread: d.sent - d.readByRecipient }));
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-baseline justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Registered users</CardTitle>
          <span className="text-xs text-[#939495]">As of {fmtDateTime(users.asOf)}</span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total accounts" value={fmtNumber(users.total)} hint={`${fmtNumber(users.active)} active · ${fmtNumber(users.deactivated)} deactivated`} />
            <Stat label="Students" value={fmtNumber(users.students.total)} hint={`${fmtNumber(users.students.active)} active`} />
            <Stat label="Staff accounts" value={fmtNumber(users.staff.total)} hint={`${fmtNumber(users.staff.active)} active`} />
            <Stat label="New in period" value={fmtNumber(users.newInPeriod)} hint={`${fmtNumber(users.students.newInPeriod)} students · ${fmtNumber(users.staff.newInPeriod)} staff`} />
          </div>
          <SimpleTable
            headers={['Role', 'Total', 'Active', 'Deactivated', 'New in period', 'Signed in during period']}
            rows={users.byRole.map((r) => [
              r.role,
              fmtNumber(r.total),
              fmtNumber(r.active),
              fmtNumber(r.deactivated),
              fmtNumber(r.newInPeriod),
              fmtNumber(logins.byRole.find((l) => l.role === r.role)?.uniqueUsers || 0),
            ])}
          />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Document submissions" value={fmtNumber(submissions.total)} hint={`${fmtNumber(submissions.proposals)} proposals · ${fmtNumber(submissions.books)} books`} />
        <Stat label="Direct messages sent" value={fmtNumber(messages.sent)} hint={`${fmtPercent(messages.readRatePercent, 1)} read by recipient`} />
        <Stat label="Sign-ins" value={fmtNumber(logins.total)} hint={`${fmtNumber(logins.uniqueUsers)} unique users`} />
        <Stat label="Support tickets" value={fmtNumber(tickets.created)} hint={`${fmtNumber(tickets.resolved)} resolved`} />
      </div>
      <DailyChart
        title="Document submissions per day"
        data={submissions.daily}
        series={[
          { key: 'studentDocuments', name: 'Student documents' },
          { key: 'proposals', name: 'Proposals' },
          { key: 'books', name: 'Books' },
          { key: 'letters', name: 'Letters' },
        ]}
      />
      <DailyChart
        title="Direct messages per day"
        data={msgData}
        series={[{ key: 'read', name: 'Read by recipient' }, { key: 'unread', name: 'Unread' }]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Student documents by type</CardTitle></CardHeader>
          <CardContent><SimpleTable headers={['Type', 'Count']} rows={submissions.studentDocumentsByType.map((r) => [r.type, fmtNumber(r.count)])} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Messages by sender role</CardTitle></CardHeader>
          <CardContent><SimpleTable headers={['Role', 'Sent']} rows={messages.sentByRole.map((r) => [r.role, fmtNumber(r.count)])} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Sign-ins by role</CardTitle></CardHeader>
          <CardContent><SimpleTable headers={['Role', 'Logins', 'Users']} rows={logins.byRole.map((r) => [r.role, fmtNumber(r.logins), fmtNumber(r.uniqueUsers)])} /></CardContent>
        </Card>
      </div>
    </div>
  );
};

const SecuritySection = ({ security, rbac }) => {
  const [accessFilter, setAccessFilter] = useState('ALL');
  const routes = accessFilter === 'ALL' ? rbac.routes : rbac.routes.filter((r) => r.access === accessFilter);
  const rl = security.session.rateLimits;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="API routes inspected" value={fmtNumber(rbac.totalRoutes)} hint={`${fmtNumber(rbac.roleRestricted)} role restricted · ${fmtNumber(rbac.selfService)} own account`} />
        <Stat label="Unexpectedly public" value={fmtNumber(rbac.publicUnexpected)} hint={`${fmtNumber(rbac.publicExpected)} intended public`} />
        <Stat label="Requests blocked (403)" value={security.measured ? fmtNumber((security.totals.RBAC_DENIED || 0) + (security.totals.READONLY_BLOCKED || 0)) : 'Not measured'} />
        <Stat label="Failed logins" value={security.measured ? fmtNumber(security.totals.LOGIN_FAILED || 0) : 'Not measured'} hint={security.measured ? `${security.bruteForceIps.length} suspicious IP(s)` : undefined} />
      </div>

      {security.measured ? (
        <>
          <DailyChart
            title="Security events per day"
            data={security.daily}
            series={[
              { key: 'denied', name: 'Role denials' },
              { key: 'unauthenticated', name: 'Unauthenticated' },
              { key: 'failedLogins', name: 'Failed logins' },
              { key: 'rateLimited', name: 'Rate limited' },
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Events by type</CardTitle></CardHeader>
              <CardContent><SimpleTable headers={['Event', 'Count']} rows={Object.keys(EVENT_LABELS).map((k) => [EVENT_LABELS[k], fmtNumber(security.totals[k] || 0)])} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Most blocked endpoints</CardTitle></CardHeader>
              <CardContent><SimpleTable headers={['Event', 'Endpoint', 'Count']} rows={security.deniedByEndpoint.slice(0, 10).map((r) => [EVENT_LABELS[r.type] || r.type, `${r.method} ${r.endpoint}`, fmtNumber(r.count)])} /></CardContent>
            </Card>
          </div>
        </>
      ) : (
        <NotMeasured>Access-denial and failed-login logging was not active during this period.</NotMeasured>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Session controls</CardTitle></CardHeader>
        <CardContent>
          <SimpleTable
            headers={['Control', 'Configuration']}
            rows={[
              ['Token lifetime', `${security.session.tokenLifetime} (${security.session.rememberMeLifetime} with "remember me")`],
              ['Server-side revocation', security.session.serverSideRevocation ? 'Enabled on logout and account deactivation' : 'Disabled'],
              ['API rate limit', `${rl.api.limit} requests / ${rl.api.windowMinutes} min per ${rl.api.keyedBy}`],
              ['Login rate limit', `${rl.login.limit} failed / ${rl.login.windowMinutes} min per IP + email; ${rl.loginPerIp.limit} / ${rl.loginPerIp.windowMinutes} min per IP`],
              ['Logouts in period', fmtNumber(security.session.logouts)],
              ['Deactivated accounts signed out', fmtNumber(security.session.deactivationRevocations)],
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">RBAC route matrix</CardTitle>
          <select
            className="h-8 rounded-md border px-2 text-xs"
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
          >
            <option value="ALL">All routes ({rbac.totalRoutes})</option>
            {Object.entries(ACCESS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label} ({rbac.routes.filter((r) => r.access === k).length})</option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <SimpleTable
              headers={['Method', 'Endpoint', 'Allowed roles', 'Access']}
              rows={routes.map((r) => [
                r.method,
                <code key="p" className="text-[11px]">{r.path}</code>,
                allowedRolesText(r),
                <span key="a" className={r.access === 'PUBLIC_UNEXPECTED' ? 'font-semibold text-red-700' : ''}>{ACCESS_LABELS[r.access]}</span>,
              ])}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BackupsSection = ({ backups, integrity, canRecord, onRecord }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat
        label="Latest successful backup"
        value={backups.latestBackup ? `${backups.latestBackupAgeHours.toFixed(1)} h ago` : 'Not measured'}
        hint={backups.daysInWindow ? `${backups.daysWithBackup} of ${backups.daysInWindow} days in period` : undefined}
      />
      <Stat
        label="Latest off-site copy"
        value={backups.offsiteConfigured === false ? 'Not configured' : backups.latestOffsite ? `${backups.latestOffsiteAgeHours.toFixed(1)} h ago` : 'Not measured'}
        hint={backups.daysInWindow && backups.offsiteConfigured !== false ? `${backups.daysWithOffsite} of ${backups.daysInWindow} days in period` : undefined}
      />
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-[#626263]">Recovery verified</p>
        <div className="mt-2"><StatusPill status={backups.restore?.status || 'NOT_MEASURED'} /></div>
        <p className="mt-2 text-xs text-[#939495]">{backups.restore?.detail || 'No restore evidence yet'}</p>
      </div>
      <Stat label="Documents without stored file" value={fmtNumber(integrity.studentDocumentsWithoutContent + integrity.lettersWithoutContent)} />
    </div>
    <p className="text-xs text-[#626263]">
      {backups.provider}.{' '}
      {backups.scriptReporting
        ? `${fmtNumber(backups.runsInWindow)} run(s) reported in this period, ${fmtNumber(backups.runsWithProblems)} with a problem. Latest report ${fmtDateTime(backups.latestScriptRunAt)}.`
        : 'mongodb_backup.sh has not reported any runs yet: set BACKUP_INGEST_KEY on the server and in ~/.mongo_backup.env, then run mongodb_backup.sh --sync.'}
    </p>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">Backup runs and records in period</CardTitle>
        {canRecord && (
          <Button size="sm" variant="outline" onClick={onRecord}>
            <RiDatabase2Line className="mr-1" /> Record restore test / manual export
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <SimpleTable
          headers={['Performed', 'Type', 'Dump', 'Off-site', 'Atlas mirror', 'Verify', 'Size (GB)', 'Duration', 'Notes']}
          rows={backups.records.map((r) => [
            fmtDateTime(r.performedAt),
            BACKUP_TYPE_LABELS[r.type] || r.type,
            <StatusPill key="s" status={r.status === 'SUCCESS' ? 'PASS' : 'FAIL'} />,
            stepText(r.offsiteStatus),
            stepText(r.mirrorStatus),
            stepText(r.verifyStatus),
            r.sizeGb ?? '—',
            r.durationSeconds != null ? fmtDuration(Math.max(1, Math.round(r.durationSeconds / 60))) : '—',
            r.verifyDetails || r.notes || (r.recordedByName ? `By ${r.recordedByName}` : ''),
          ])}
        />
      </CardContent>
    </Card>
  </div>
);

const FindingsSection = ({ findings }) => (
  <Card>
    <CardContent className="pt-6">
      <SimpleTable
        headers={['Severity', 'Finding', 'Detail']}
        rows={findings.map((f) => [<StatusPill key="s" status={f.severity} meta={SEVERITY_META} />, <span key="t" className="font-medium">{f.title}</span>, f.detail])}
        empty="No findings for this period"
      />
    </CardContent>
  </Card>
);

/* ---------- page ---------- */

const SystemReport = () => {
  const { data: userDetails } = useGetLoggedInUserDetails();
  const role = userDetails?.user?.role;

  const [from, setFrom] = useState(() => ymd(subDays(new Date(), 29)));
  const [to, setTo] = useState(() => ymd(new Date()));
  const [requested, setRequested] = useState(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [exporting, setExporting] = useState(null);

  const { data, isFetching, error, refetch } = useGetSystemReport(requested?.from, requested?.to, Boolean(requested));
  const report = data?.report;

  const counts = useMemo(
    () => (report ? report.checks.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {}) : {}),
    [report]
  );

  const generate = () => {
    if (from > to) {
      toast.error('Start date must be on or before the end date');
      return;
    }
    if (requested?.from === from && requested?.to === to) refetch();
    else setRequested({ from, to });
  };

  const runExport = (kind) => {
    setExporting(kind);
    // Let the button state paint before the synchronous PDF/zip build.
    setTimeout(() => {
      try {
        if (kind === 'pdf') exportSystemReportPdf(report);
        else exportSystemReportCsv(report);
      } catch (e) {
        console.error(e);
        toast.error('Export failed');
      } finally {
        setExporting(null);
      }
    }, 30);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="System Status Report" subtitle="Uptime, platform activity, access control, sessions and backups for any period" />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-from" className="text-xs">From</Label>
              <Input id="report-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-to" className="text-xs">To</Label>
              <Input id="report-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
            <div className="flex gap-1.5">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs text-[#23388F]"
                  onClick={() => { const [a, b] = p.range(); setFrom(ymd(a)); setTo(ymd(b)); }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Button onClick={generate} disabled={isFetching} className="bg-[#23388F] hover:bg-[#1c2d73]">
              <RiRefreshLine className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Generating…' : 'Generate report'}
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" disabled={!report || Boolean(exporting)} onClick={() => runExport('pdf')}>
                <RiFilePdf2Line /> {exporting === 'pdf' ? 'Building…' : 'Export PDF'}
              </Button>
              <Button variant="outline" size="sm" disabled={!report || Boolean(exporting)} onClick={() => runExport('csv')}>
                <RiFileZipLine /> {exporting === 'csv' ? 'Building…' : 'Export CSV (zip)'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message || 'Failed to generate report'}</div>
      )}

      {!report && !isFetching && !error && (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-gray-500">
          Choose a period and generate the report.
        </div>
      )}

      {report && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#626263]">
            <span>
              {fmtDate(report.meta.from)} – {fmtDate(report.meta.to)} · {report.meta.timezone} · {report.meta.environment}
            </span>
            <span>
              {counts.PASS || 0} passed · {counts.WARN || 0} warnings · {counts.FAIL || 0} failed · {counts.NOT_MEASURED || 0} not measured
              {' · '}Generated {fmtDateTime(report.meta.generatedAt)}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {report.checks.map((c) => (
              <div key={c.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-[#070B1D]">{c.label}</p>
                  <StatusPill status={c.status} />
                </div>
                <p className="mt-2 text-xs text-[#626263]">{c.detail}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="availability">
            <TabsList>
              <TabsTrigger value="availability">Uptime & availability</TabsTrigger>
              <TabsTrigger value="activity">Users & activity</TabsTrigger>
              <TabsTrigger value="security">Access & sessions</TabsTrigger>
              <TabsTrigger value="backups">Backups & integrity</TabsTrigger>
              <TabsTrigger value="findings">Findings ({report.findings.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="availability" className="mt-4"><AvailabilitySection a={report.availability} /></TabsContent>
            <TabsContent value="activity" className="mt-4"><ActivitySection activity={report.activity} users={report.users} /></TabsContent>
            <TabsContent value="security" className="mt-4"><SecuritySection security={report.security} rbac={report.rbac} /></TabsContent>
            <TabsContent value="backups" className="mt-4">
              <BackupsSection backups={report.backups} integrity={report.integrity} canRecord={role === 'SUPERADMIN'} onRecord={() => setBackupOpen(true)} />
            </TabsContent>
            <TabsContent value="findings" className="mt-4"><FindingsSection findings={report.findings} /></TabsContent>
          </Tabs>
        </>
      )}

      <RecordBackupDialog open={backupOpen} onOpenChange={setBackupOpen} />
    </div>
  );
};

export default SystemReport;
