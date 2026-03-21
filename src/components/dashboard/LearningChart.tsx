import { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';

const BASE = import.meta.env.BASE_URL;

export default function LearningChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const agents = useSimStore((s) => s.agents);
  const initializedRef = useRef(false);

  // One-time setup: create all static elements (defs, tracks, threshold, avatars, labels)
  const initChart = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 16, right: 16, bottom: 34, left: 16 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Gradient defs
    const defs = svg.append('defs');
    AGENTS.forEach((agentDef) => {
      const grad = defs.append('linearGradient')
        .attr('id', `bar-grad-${agentDef.id}`)
        .attr('x1', '0').attr('y1', '1')
        .attr('x2', '0').attr('y2', '0');
      grad.append('stop').attr('offset', '0%')
        .attr('stop-color', agentDef.color).attr('stop-opacity', 0.15);
      grad.append('stop').attr('offset', '60%')
        .attr('stop-color', agentDef.color).attr('stop-opacity', 0.6);
      grad.append('stop').attr('offset', '100%')
        .attr('stop-color', agentDef.color).attr('stop-opacity', 0.95);
    });

    const g = svg.append('g')
      .attr('class', 'chart-root')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    // Subtle horizontal grid lines
    [25, 50, 75].forEach((tick) => {
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(tick)).attr('y2', yScale(tick))
        .attr('stroke', '#111D30').attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '3,6');
    });

    // Threshold line at 70%
    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', yScale(70)).attr('y2', yScale(70))
      .attr('stroke', '#4FC3F7').attr('stroke-width', 0.7)
      .attr('stroke-dasharray', '6,4')
      .attr('stroke-opacity', 0.25);
    g.append('text')
      .attr('x', innerW).attr('y', yScale(70) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#4FC3F7').attr('font-size', '7.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('opacity', 0.4)
      .text('70%');

    // Bottom baseline
    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', innerH).attr('y2', innerH)
      .attr('stroke', '#1A2A4A').attr('stroke-width', 0.5);

    const barCount = AGENTS.length;
    const gap = Math.max(10, innerW * 0.04);
    const barWidth = Math.min(52, (innerW - gap * (barCount + 1)) / barCount);
    const totalBarsWidth = barCount * barWidth + (barCount - 1) * gap;
    const offsetX = (innerW - totalBarsWidth) / 2;

    AGENTS.forEach((agentDef, i) => {
      const x = offsetX + i * (barWidth + gap);

      // Bar background track — subtle rounded column
      g.append('rect')
        .attr('x', x).attr('y', 0)
        .attr('width', barWidth).attr('height', innerH)
        .attr('rx', 5).attr('ry', 5)
        .attr('fill', 'rgba(100, 160, 255, 0.025)');

      // Bar fill — starts at bottom, will be animated on update
      g.append('rect')
        .attr('class', `bar-fill-${agentDef.id}`)
        .attr('x', x).attr('y', innerH)
        .attr('width', barWidth).attr('height', 0)
        .attr('rx', 5).attr('ry', 5)
        .attr('fill', `url(#bar-grad-${agentDef.id})`);

      // Top glow line
      g.append('rect')
        .attr('class', `bar-glow-${agentDef.id}`)
        .attr('x', x + 3).attr('y', innerH)
        .attr('width', barWidth - 6).attr('height', 2)
        .attr('rx', 1)
        .attr('fill', agentDef.color)
        .attr('opacity', 0);

      // Percentage text
      g.append('text')
        .attr('class', `bar-label-${agentDef.id}`)
        .attr('x', x + barWidth / 2).attr('y', innerH - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', agentDef.color)
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text('0%');

      // Avatar circle — clipped
      const clipId = `avatar-clip-${agentDef.id}`;
      const avatarSize = 20;
      const cx = x + barWidth / 2;
      const cy = innerH + 6 + avatarSize / 2;

      defs.append('clipPath').attr('id', clipId)
        .append('circle').attr('cx', cx).attr('cy', cy).attr('r', avatarSize / 2);

      // Avatar ring
      g.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', avatarSize / 2 + 1.5)
        .attr('fill', 'none')
        .attr('stroke', agentDef.color).attr('stroke-width', 1.5)
        .attr('opacity', 0.4);

      // Avatar image
      g.append('image')
        .attr('href', `${BASE}${agentDef.avatar}`)
        .attr('x', cx - avatarSize / 2)
        .attr('y', cy - avatarSize / 2)
        .attr('width', avatarSize).attr('height', avatarSize)
        .attr('preserveAspectRatio', 'xMidYMin slice')
        .attr('clip-path', `url(#${clipId})`);
    });

    initializedRef.current = true;
  }, []);

  // Update: only animate bar heights and label text — no flickering
  const updateChart = useCallback(() => {
    if (!svgRef.current || !initializedRef.current) return;
    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentElement;
    if (!container) return;

    const height = container.clientHeight;
    const margin = { top: 16, bottom: 34 };
    const innerH = height - margin.top - margin.bottom;

    AGENTS.forEach((agentDef) => {
      const confidence = agents[agentDef.id]?.confidence ?? 0;
      const barH = (confidence / 100) * innerH;
      const y = innerH - barH;

      // Smooth bar transition
      svg.select(`.bar-fill-${agentDef.id}`)
        .transition().duration(500).ease(d3.easeCubicOut)
        .attr('y', y)
        .attr('height', barH);

      // Move glow to top of bar
      svg.select(`.bar-glow-${agentDef.id}`)
        .transition().duration(500).ease(d3.easeCubicOut)
        .attr('y', y - 1)
        .attr('opacity', confidence > 5 ? 0.5 : 0);

      // Update label position and text
      svg.select(`.bar-label-${agentDef.id}`)
        .text(`${confidence}%`)
        .transition().duration(500).ease(d3.easeCubicOut)
        .attr('y', Math.max(y - 5, 12));
    });
  }, [agents]);

  // Init once
  useEffect(() => {
    initChart();
  }, [initChart]);

  // Update on every agents change
  useEffect(() => {
    updateChart();
  }, [updateChart]);

  return (
    <div className="learning-chart">
      <div className="learning-chart-header">רמת ביטחון</div>
      <div className="learning-chart-svg-wrapper">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
