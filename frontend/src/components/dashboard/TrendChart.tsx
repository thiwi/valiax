import { Chart, registerables, TimeScale } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import React, { useMemo, useEffect, type MutableRefObject } from 'react';
import { Line } from 'react-chartjs-2';
import type { DashboardTrendItem } from '../../types';
import type { ChartOptions, ChartData } from 'chart.js';
import Button from '@mui/material/Button';
import theme from '../../theme';

Chart.register(...registerables, zoomPlugin, TimeScale);

/**
 * Props interface for TrendChart component.
 * 
 * @property {string} rangeStart - The start date string (YYYY-MM-DD) for the displayed date range.
 * @property {string} rangeEnd - The end date string (YYYY-MM-DD) for the displayed date range.
 * @property {(d: string) => void} setRangeStart - Setter function to update the start date.
 * @property {(d: string) => void} setRangeEnd - Setter function to update the end date.
 * @property {MutableRefObject<any>} chartRef - Ref to the Chart.js instance for controlling zoom/reset.
 * @property {DashboardTrendItem[]} trends - Array of trend data items to display on the chart.
 * @property {string} defaultStart - Default start date string (unused in current logic but reserved).
 * @property {string} defaultEnd - Default end date string (unused in current logic but reserved).
 * @property {() => void} onResetTimeframe - Callback invoked when the timeframe is reset.
 * @property {() => void} reloadData - Callback to reload trend data, typically after reset.
 */

/**
 * TrendChart component renders a line chart visualizing trend data over time.
 * It is designed to be part of a dashboard, allowing users to select a date range,
 * zoom and pan interactively, and reset the timeframe to a default 90-day window.
 * 
 * The component processes incoming trend data, filters it based on the selected date range,
 * and dynamically generates datasets for each unique rule name in the data.
 * It utilizes Chart.js with zoom and pan plugins for enhanced interactivity.
 */
interface Props {
  rangeStart: string;
  rangeEnd: string;
  setRangeStart: (d: string) => void;
  setRangeEnd: (d: string) => void;
  chartRef: MutableRefObject<any>;
  trends: DashboardTrendItem[];
  defaultStart: string;
  defaultEnd: string;
  onResetTimeframe: () => void;
  reloadData: () => void;
}

const TrendChart: React.FC<Props> = ({
  rangeStart,
  rangeEnd,
  setRangeStart,
  setRangeEnd,
  chartRef,
  trends,
  defaultStart,
  defaultEnd,
  onResetTimeframe,
  reloadData,
}) => {
  const [initialStart, setInitialStart] = React.useState<string>('');
  const [initialEnd, setInitialEnd] = React.useState<string>('');

  useEffect(() => {
    // When trend data changes, determine a default date range to display.
    // The default range is the latest date in the data going back 90 days,
    // or the earliest date if it is more recent than 90 days ago.
    if (trends.length > 0) {
      const dates = trends.map(item => new Date(item.date));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const ninetyDaysAgo = new Date(maxDate);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      // Use the later of minDate and ninetyDaysAgo as the start date
      const startDate = minDate > ninetyDaysAgo ? minDate : ninetyDaysAgo;
      const from = startDate.toISOString().slice(0, 10);
      const to = maxDate.toISOString().slice(0, 10);
      // Update the controlled date range state and initial range state
      setRangeStart(from);
      setRangeEnd(to);
      setInitialStart(from);
      setInitialEnd(to);
    }
  }, [trends, setRangeStart, setRangeEnd]);

  // Filter trends to only those within the currently selected date range.
  // If rangeStart or rangeEnd are not set, fallback to initialStart/initialEnd.
  const filteredTrends = useMemo(() => {
    const startThreshold = rangeStart ? new Date(rangeStart) : new Date(initialStart);
    const endThreshold = rangeEnd ? new Date(rangeEnd) : new Date(initialEnd);

    if (Number.isNaN(startThreshold.getTime()) || Number.isNaN(endThreshold.getTime()) || startThreshold > endThreshold) {
      return [] as DashboardTrendItem[];
    }

    return trends.filter(item => {
      const date = new Date(item.date);
      return date >= startThreshold && date <= endThreshold;
    });
  }, [trends, rangeStart, rangeEnd, initialStart, initialEnd]);

  // Extract unique rule names from the filtered trends to create separate datasets.
  const ruleNames = useMemo(
    () => Array.from(new Set(filteredTrends.map(item => item.rule_name))),
    [filteredTrends]
  );

  // Prepare chart datasets: one dataset per rule, with points sorted by date.
  // Each dataset has a unique color based on its index.
  const data: ChartData<'line'> = useMemo(() => ({
    datasets: ruleNames.map((rule, idx) => {
      const color = `hsl(${(idx * 60) % 360}, 70%, 50%)`;
      const datasetPoints = filteredTrends
        .filter(item => item.rule_name === rule)
        .map(item => ({ x: new Date(item.date).getTime(), y: item.count }))
        .sort((a, b) => a.x - b.x);
      return {
        label: rule,
        data: datasetPoints,
        tension: 0.4,
        borderColor: color,
        backgroundColor: color,
        fill: false,
      };
    }),
  }), [ruleNames, filteredTrends]);

  // Chart configuration options, including scales, zoom/pan plugin, and legend.
  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'day' },
        min: new Date(rangeStart).getTime(),
        max: new Date(rangeEnd).getTime(),
        title: { display: true, text: 'Date' },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Count' },
      },
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          drag: {
            enabled: true,
            backgroundColor: 'rgba(224,224,224,0.3)',
          },
          mode: 'x',
          onZoomComplete({ chart }: { chart: any }) {
            const xScale = chart.scales.x;
            const min = xScale.min as number;
            const max = xScale.max as number;
            const from = new Date(min).toISOString().slice(0, 10);
            const to = new Date(max).toISOString().slice(0, 10);
            setRangeStart(from);
            setRangeEnd(to);
          },
        },
      } as any,
      legend: { position: 'top' },
    },
  }), [rangeStart, rangeEnd]);

  return (
    <div className="mb-6">
      <div className="flex space-x-4 mb-2 items-center">
        {/* Input for selecting the start date of the date range */}
        <div className="flex items-center space-x-1">
          <label htmlFor="range-start">From:</label>
          <input
            id="range-start"
            type="date"
            value={rangeStart}
            onChange={e => setRangeStart(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        {/* Input for selecting the end date of the date range */}
        <div className="flex items-center space-x-1">
          <label htmlFor="range-end">To:</label>
          <input
            id="range-end"
            type="date"
            value={rangeEnd}
            onChange={e => setRangeEnd(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        {/* Button to reset the timeframe to default and reload data */}
        <Button
          variant="contained"
          onClick={() => {
            onResetTimeframe();
            // Reset the zoom/pan state of the chart to default
            chartRef.current?.resetZoom();
            // Reload the trend data after reset
            reloadData();
          }}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
          }}
        >
          Reset timeframe
        </Button>
      </div>
      {/* Line chart displaying the filtered trend data over the selected date range */}
      <Line data={data} options={options} redraw ref={chartRef} />
    </div>
  );
};

export default TrendChart;