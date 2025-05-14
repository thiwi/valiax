// KpiTiles.tsx
// This component displays key performance indicators (KPIs) in a dashboard as a set of tiles.
// Each tile shows a specific metric such as total violations, critical violations, affected tables, and compliance rate.
// It is used within the dashboard to provide a quick overview of important metrics with visually distinct colored tiles.

import React from 'react';
import type { DashboardKPI } from '../../types';

/**
 * Props interface for KpiTiles component.
 * @property {DashboardKPI} kpis - An object containing the various KPI metrics to display.
 * @property {string[]} brandColors - An array of color strings used to style the KPI tiles.
 */
interface Props { kpis: DashboardKPI; brandColors: string[]; }

const KpiTiles: React.FC<Props> = ({ kpis, brandColors }) => {
  // Destructure individual KPI values from the kpis object for easy access
  const { total_violations, critical_violations, affected_tables, compliance_rate } = kpis;
  console.log('[KpiTiles] Render with:', kpis);
  
  return (
    // Container div that uses CSS grid to layout the KPI tiles in four columns with gaps and margin below
    <div className="grid grid-cols-4 gap-4 mb-6">
      {/* Tile for Total Violations KPI */}
      <div
        style={{ backgroundColor: brandColors[0] }} // Background color from brand colors for visual branding
        className="text-white p-4 rounded shadow"   // White text, padding, rounded corners, and shadow for depth
      >
        <h3 className="text-sm font-medium">Total Violations</h3>
        <p className="text-2xl font-semibold">{total_violations}</p>
      </div>
      {/* Tile for Critical Violations KPI */}
      <div
        style={{ backgroundColor: brandColors[0] }}
        className="text-white p-4 rounded shadow"
      >
        <h3 className="text-sm font-medium">Critical Violations</h3>
        <p className="text-2xl font-semibold">{critical_violations}</p>
      </div>
      {/* Tile for Affected Tables KPI */}
      <div
        style={{ backgroundColor: brandColors[0] }}
        className="text-white p-4 rounded shadow"
      >
        <h3 className="text-sm font-medium">Affected Tables</h3>
        <p className="text-2xl font-semibold">{affected_tables}</p>
      </div>
      {/* Tile for Compliance Rate KPI */}
      <div
        style={{ backgroundColor: brandColors[0] }}
        className="text-white p-4 rounded shadow"
      >
        <h3 className="text-sm font-medium">Compliance Rate</h3>
        <p className="text-2xl font-semibold">
          {/* Format compliance rate as a percentage with one decimal place */}
          {(compliance_rate * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default KpiTiles;