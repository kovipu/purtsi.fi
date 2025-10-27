const NUM_LANES = 3;
const DATA: TimelineData = {
  work: {
    lane: "Work",
    rails: 2,
    items: [
      { title: "ViLLE", start: "2016-02-01", end: "2016-05-30" },
      { title: "Vincit", start: "2018-04-01", end: "2019-08-30" },
      { title: "Identio", start: "2020-05-01", end: "2022-08-30" },
      { title: "Arado", start: "2022-09-01", end: "2025-04-30" },
      { title: "Purtsi Consulting", start: "2025-05-01", end: "2025-11-30" },
    ],
  },
  school: {
    lane: "School",
    rails: 1,
    items: [
      { title: "Turun Yliopisto", start: "2016-09-01", end: "2022-12-20" },
    ]
  },
  volunteering: {
    lane: "Volunteering",
    rails: 2,
    items: [
      { title: "Digit ry", start: "2018-01-01", end: "2019-12-31" }
    ]
  }
}

export type TimelineData = Record<string, LaneData>;

export type LaneData = {
  lane: string;
  rails: 1 | 2;
  items: TimelineItem[];
}

export type TimelineItem = {
  title: string;
  start: string;
  end: string;
  rail?: 0 | 1;
};

export type SvgTimelineProps = {
  data: Record<string, LaneData>
};

const PX_PER_MONTH = 14;
const LANE_HEIGHT = 60;
const LANE_GAP = 5;
const PAD_MONTHS = 5;

const SvgTimeline = ({
  data,
}: SvgTimelineProps) => {
  const { min, max } = domainFromData(data, PAD_MONTHS);
  console.log(min, max)
  const totalMonths = Math.max(1, monthDiff(startOfMonth(min), startOfMonth(max)) + 1);

  // X scale: date -> px
  const x = (d: Date) => {
    const m = monthDiff(startOfMonth(min), startOfMonth(d));
    // add proportional offset within the month
    const monthStart = startOfMonth(d);
    const nextMonth = addMonths(monthStart, 1);
    const frac = (+d - +monthStart) / (+nextMonth - +monthStart);
    return m * PX_PER_MONTH + frac * PX_PER_MONTH;
  };

  const yearTicks = yearsBetween(min, max);

  const height = NUM_LANES * (LANE_HEIGHT + LANE_GAP) + 60;
  const innerWidth = Math.max(800, totalMonths * PX_PER_MONTH); // min width if you want

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
        {Object.values(data).map((lane, idx) => {
          const yTop = 40 + idx * (LANE_HEIGHT + LANE_GAP);
          return (
            <g key={lane.lane} transform={`translate(0, ${yTop})`}>
              {/* Lane background */}
              <rect x={0} y={0} width={innerWidth} height={LANE_HEIGHT} />
              <line x1={0} y1={LANE_HEIGHT} x2={innerWidth} y2={LANE_HEIGHT} strokeWidth={1} className="stroke-licorice" />

              {/* Lane label */}
              <text x={8} y={36} fontSize={20} fill="#374151" fontWeight={600}>{lane.lane}</text>

              {/* Items in lane */}
              {lane.items.map(it => {
                const s = toDate(it.start);
                const e = it.end ? toDate(it.end) : undefined;
                const xStart = x(s);
                const xEnd = e ? x(e) : x(s);
                const cy = LANE_HEIGHT / 2;
                const color = "#6b7280";

                const w = Math.max(2, xEnd - xStart);
                const r = 6;
                return (
                  <g key={it.title} transform={`translate(100, 0)`}>
                    <rect x={xStart} y={cy - 20} width={w} height={40} rx={r} ry={r} fill={color} opacity={0.95} />
                    <text x={xStart + 8} y={cy + 4} fontSize={16} className="fill-white pointer-events-none">
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

function domainFromData(data: TimelineData, padMonths: number) {
  const dates = Object.values(data).flatMap((lane: LaneData) => lane.items.flatMap(({ start, end }) => [toDate(start), toDate(end)]));
  console.log(dates)
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


export default () => {
  return (
    <div className="p-6 w-full overtflow-x-auto">
      <h2 className="mb-3 text-xl font-semibold">Timeline</h2>
      <p className="mb-4 text-sm text-gray-600">Scroll horizontally if needed.</p>
      <SvgTimeline data={DATA} />
    </div>
  );
}

