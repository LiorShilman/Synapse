import { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';

export default function LearningChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const agents = useSimStore((s) => s.agents);

  const drawChart = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 8, right: 12, bottom: 24, left: 38 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Gradient defs — area fades to transparent at bottom
    const defs = svg.append('defs');
    AGENTS.forEach((agentDef) => {
      const grad = defs.append('linearGradient')
        .attr('id', `area-grad-${agentDef.id}`)
        .attr('x1', '0').attr('y1', '0')
        .attr('x2', '0').attr('y2', '1');
      grad.append('stop').attr('offset', '0%')
        .attr('stop-color', agentDef.color).attr('stop-opacity', 0.12);
      grad.append('stop').attr('offset', '100%')
        .attr('stop-color', agentDef.color).attr('stop-opacity', 0.0);
    });

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const allHistories = AGENTS.map((a) => agents[a.id]?.confidenceHistory ?? []);
    const maxLen = Math.max(...allHistories.map((h) => h.length), 2);

    const xScale = d3.scaleLinear().domain([0, Math.max(maxLen - 1, 1)]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    // Horizontal grid + Y-axis labels (0%, 25%, 50%, 75%, 100%)
    [0, 25, 50, 75, 100].forEach((tick) => {
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(tick)).attr('y2', yScale(tick))
        .attr('stroke', tick === 0 ? '#1A2A4A' : '#111D30')
        .attr('stroke-width', tick === 0 ? 1 : 0.5)
        .attr('stroke-dasharray', tick === 0 ? 'none' : '3,4');
      g.append('text')
        .attr('x', -8).attr('y', yScale(tick) + 3.5)
        .attr('text-anchor', 'end')
        .attr('fill', '#3A5A7A').attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(`${tick}%`);
    });

    // Vertical grid (very subtle)
    xScale.ticks(6).forEach((tick) => {
      g.append('line')
        .attr('x1', xScale(tick)).attr('x2', xScale(tick))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#0E1828').attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,5');
    });

    // Draw each agent
    for (const agentDef of AGENTS) {
      const history = agents[agentDef.id]?.confidenceHistory ?? [];
      if (history.length < 2) continue;

      const lineGen = d3
        .line<number>()
        .x((_, i) => xScale(i))
        .y((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      const areaGen = d3
        .area<number>()
        .x((_, i) => xScale(i))
        .y0(innerH)
        .y1((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      // Area with gradient (not flat fill)
      g.append('path')
        .datum(history)
        .attr('d', areaGen)
        .attr('fill', `url(#area-grad-${agentDef.id})`);

      // Line
      g.append('path')
        .datum(history)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', agentDef.color)
        .attr('stroke-width', 1.8)
        .attr('stroke-opacity', 0.85);

      // Endpoint glow + dot
      const lastVal = history[history.length - 1];
      const lx = xScale(history.length - 1);
      const ly = yScale(lastVal);
      g.append('circle')
        .attr('cx', lx).attr('cy', ly)
        .attr('r', 6).attr('fill', agentDef.color).attr('fill-opacity', 0.15);
      g.append('circle')
        .attr('cx', lx).attr('cy', ly)
        .attr('r', 3).attr('fill', agentDef.color).attr('fill-opacity', 0.9);
    }

    // X-axis label
    g.append('text')
      .attr('x', innerW / 2).attr('y', innerH + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#3A5A7A').attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('מחזורים');
  }, [agents]);

  useEffect(() => {
    drawChart();
    const handle = setInterval(drawChart, 1000);
    return () => clearInterval(handle);
  }, [drawChart]);

  // Legend
  return (
    <div className="learning-chart">
      <div className="learning-chart-header">עקומות למידה</div>
      <div className="learning-chart-legend">
        {AGENTS.map((a) => (
          <div key={a.id} className="legend-item">
            <span className="legend-dot bg-agent" style={{ '--agent-color': a.color } as React.CSSProperties} />
            <span className="legend-label">{a.name}</span>
            <span className="legend-value text-agent" style={{ '--agent-color': a.color } as React.CSSProperties}>
              {agents[a.id]?.confidence ?? 0}%
            </span>
          </div>
        ))}
      </div>
      <div className="learning-chart-svg-wrapper">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
