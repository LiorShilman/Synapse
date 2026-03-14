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
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Find max data length
    const allHistories = AGENTS.map((a) => agents[a.id]?.confidenceHistory ?? []);
    const maxLen = Math.max(...allHistories.map((h) => h.length), 1);

    const xScale = d3.scaleLinear().domain([0, Math.max(maxLen - 1, 1)]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(-innerH).tickFormat(() => ''))
      .selectAll('line')
      .attr('stroke', '#1A2A4A')
      .attr('stroke-dasharray', '2,2');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerW).tickFormat(() => ''))
      .selectAll('line')
      .attr('stroke', '#1A2A4A')
      .attr('stroke-dasharray', '2,2');

    // Remove axis domain lines
    g.selectAll('.domain').remove();

    // Draw lines
    for (const agentDef of AGENTS) {
      const history = agents[agentDef.id]?.confidenceHistory ?? [];
      if (history.length < 2) continue;

      const lineGen = d3
        .line<number>()
        .x((_, i) => xScale(i))
        .y((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      // Area fill
      const areaGen = d3
        .area<number>()
        .x((_, i) => xScale(i))
        .y0(innerH)
        .y1((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(history)
        .attr('d', areaGen)
        .attr('fill', agentDef.color)
        .attr('fill-opacity', 0.05);

      g.append('path')
        .datum(history)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', agentDef.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.8);
    }
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
            <span className="legend-dot" style={{ backgroundColor: a.color }} />
            <span className="legend-label">{a.name}</span>
            <span className="legend-value" style={{ color: a.color }}>
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
