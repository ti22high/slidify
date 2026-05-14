import { useMemo } from 'react';
import {
  Bar,
  BarChart as RcBar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RcLine,
  Pie,
  PieChart as RcPie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildChartData, type ChartPayload } from '../../model/chart';
import { useDataStore } from '../../store/dataStore';

const DEFAULT_PALETTE = ['#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6', '#F79646'];

interface Props {
  payload: ChartPayload;
}

export function Chart({ payload }: Props): JSX.Element {
  const dataset = useDataStore((s) => s.datasets[payload.datasetId]);
  const points = useMemo(
    () => (dataset ? buildChartData(dataset.rows, payload.categoryColumn, payload.series) : []),
    [dataset, payload],
  );
  const data = points.map((p) => ({ category: p.category, ...p.values }));

  if (!dataset) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
        Dataset unavailable.
      </div>
    );
  }

  if (payload.kind === 'pie') {
    const seriesName = payload.series[0]?.name ?? 'Value';
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RcPie>
          <Pie data={data} dataKey={seriesName} nameKey="category" outerRadius="80%" label>
            {data.map((_, i) => (
              <Cell key={i} fill={DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RcPie>
      </ResponsiveContainer>
    );
  }

  if (payload.kind === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RcLine data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          {payload.series.map((s, i) => (
            <Line
              key={s.name}
              dataKey={s.name}
              stroke={s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
              dot={false}
            />
          ))}
        </RcLine>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RcBar data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Legend />
        {payload.series.map((s, i) => (
          <Bar
            key={s.name}
            dataKey={s.name}
            fill={s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
          />
        ))}
      </RcBar>
    </ResponsiveContainer>
  );
}
