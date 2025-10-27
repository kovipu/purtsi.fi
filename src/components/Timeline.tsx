export type LaneId = "Work" | "School" | "Volunteering";

export type TimelineItem = {
  id: string;
  title: string;
  start: string | Date; // ISO or Date
  end?: string | Date;  // if omitted => dot
  lane: LaneId;
};

export type SvgTimelineProps = {
  data: TimelineItem[];
  lanes?: LaneId[];
  width?: number;       // outer width in CSS px; SVG scales via viewBox
  laneHeight?: number;  // vertical space per lane in SVG units
  laneGap?: number;     // gap between lanes
  pxPerMonth?: number;  // horizontal scale
  padMonths?: number;   // domain padding on both ends
  colors?: Partial<Record<LaneId, string>>; // fill color per lane
};

const DEFAULTS = {
  width: 1100,
  laneHeight: 64,
  laneGap: 12,
  pxPerMonth: 20,
  padMonths: 1,
} as const;

function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

function monthDiff(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function addMonths(d: Date, m: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1); }
function endOfYear(d: Date) { return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999); }

function domainFromData(data: TimelineItem[], padMonths: number) {
  const dates = data.flatMap(i => [toDate(i.start), i.end ? toDate(i.end) : toDate(i.start)]);
  const min = new Date(Math.min(...dates.map(Number)));
  const max = new Date(Math.max(...dates.map(Number)));
  const minP = addMonths(startOfYear(min), -padMonths);
  const maxP = addMonths(endOfYear(max), padMonths);
  return { min: minP, max: maxP };
}

function yearsBetween(min: Date, max: Date): number[] {
  const out: number[] = [];
  for (let y = min.getFullYear(); y <= max.getFullYear(); y++) out.push(y);
  return out;
}

const SvgTimeline = ({
  data,
  lanes = ["Work", "School", "Volunteering"],
  laneHeight = DEFAULTS.laneHeight,
  laneGap = DEFAULTS.laneGap,
  pxPerMonth = DEFAULTS.pxPerMonth,
  padMonths = DEFAULTS.padMonths,
}: SvgTimelineProps) => {
  const { min, max } = domainFromData(data, padMonths);
  const totalMonths = Math.max(1, monthDiff(startOfMonth(min), startOfMonth(max)) + 1);

  // X scale: date -> px
  const x = (d: Date) => {
    const m = monthDiff(startOfMonth(min), startOfMonth(d));
    // add proportional offset within the month
    const monthStart = startOfMonth(d);
    const nextMonth = addMonths(monthStart, 1);
    const frac = (+d - +monthStart) / (+nextMonth - +monthStart);
    return m * pxPerMonth + frac * pxPerMonth;
  };

  const yearTicks = yearsBetween(min, max);

  const height = lanes.length * (laneHeight + laneGap) + 60;
  const innerWidth = Math.max(800, totalMonths * pxPerMonth); // min width if you want


  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={innerWidth}
        height={height}
        viewBox={`0 0 ${innerWidth} ${height}`}
        className="mx-auto block select-none fill-transparent"
        role="img"
        aria-label="Timeline"
      >
        {/* Background */}
        <rect x={0} y={0} width={innerWidth} height={height} />

        {/* Year ruler at top */}
        <g transform={`translate(0, 0)`}>
          <rect x={0} y={0} width={innerWidth} height={40} />
          <line x1={0} y1={40} x2={innerWidth} y2={40} strokeWidth={1} className="stroke-licorice" />
          {yearTicks.map((y) => {
            const xPos = x(new Date(y, 0, 1)) + 100;
            return (
              <g key={y} transform={`translate(${xPos},0)`}>
                <text x={4} y={30} fontSize={18} fill="#4b5563">{y}</text>
              </g>
            );
          })}
        </g>

        {/* Lane labels and rows */}
        {lanes.map((lane, idx) => {
          const yTop = 40 + idx * (laneHeight + laneGap);
          return (
            <g key={lane} transform={`translate(0, ${yTop})`}>
              {/* Lane background */}
              <rect x={0} y={0} width={innerWidth} height={laneHeight} />
              <line x1={0} y1={laneHeight} x2={innerWidth} y2={laneHeight} strokeWidth={1} className="stroke-licorice" />

              {/* Lane label */}
              <text x={8} y={36} fontSize={20} fill="#374151" fontWeight={600}>{lane}</text>

              {/* Items in lane */}
              {data.filter(d => d.lane === lane).map(it => {
                const s = toDate(it.start);
                const e = it.end ? toDate(it.end) : undefined;
                const xStart = x(s);
                const xEnd = e ? x(e) : x(s);
                const cy = laneHeight / 2;
                const color = "#6b7280";

                if (!e) {
                  // point
                  return (
                    <g key={it.id} transform={`translate(${xStart},0)`}>
                      <circle cx={0} cy={cy} r={6} fill={color} />
                      <text x={8} y={cy + 4} fontSize={12} fill="#111827">{it.title}</text>
                    </g>
                  );
                }

                const w = Math.max(2, xEnd - xStart);
                const r = 6;
                return (
                  <g key={it.id} transform={`translate(100, 0)`}>
                    <rect x={xStart} y={cy - 10} width={w} height={20} rx={r} ry={r} fill={color} opacity={0.95} />
                    <text x={xStart + 8} y={cy + 4} fontSize={12} fill="#ffffff" style={{ pointerEvents: "none" }}>
                      {it.title}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const DATA: TimelineItem[] = [
  { id: "a", title: "ViLLE Team", start: "2016-02-01", end: "2016-05-30", lane: "Work" },
  { id: "b", title: "Vincit", start: "2018-04-01", end: "2019-08-30", lane: "Work" },
  { id: "c", title: "Identio", start: "2020-05-01", end: "2022-08-30", lane: "Work" },
  { id: "d", title: "Arado", start: "2022-09-01", end: "2025-04-30", lane: "Work" },
  { id: "d", title: "Purtsi Consulting", start: "2025-05-01", end: "2025-11-30", lane: "Work" },
];

export default () => {
  return (
    <div className="p-6 w-full overtflow-x-auto">
      <h2 className="mb-3 text-xl font-semibold">Timeline</h2>
      <p className="mb-4 text-sm text-gray-600">Scroll horizontally if needed.</p>
      <SvgTimeline data={DATA} />
    </div>
  );
}

