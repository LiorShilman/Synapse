import { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';

const BASE = import.meta.env.BASE_URL;

export default function LearningChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const agents = useSimStore((s) => s.agents);
  const initializedRef = useRef(false);

  const initChart = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 8, right: 50, bottom: 8, left: 90 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Gradient defs — horizontal: left to right
    const defs = svg.append('defs');
    AGENTS.forEach((agentDef) => {
      const grad = defs.append('linearGradient')
        .attr('id', `bar-grad-${agentDef.id}`)
        .attr('x1', '0').attr('y1', '0')
        .attr('x2', '1').attr('y2', '0');
      grad.append('stop').attr('offset', '0%')
        .attr('stop-color', agentDef.color).attr('stop-opacity', 0.2);
      grad.append('stop').attr('offset', '50%')
        .attr('stop-color', agentDef.color).attr('stop-opacity', 0.6);
      grad.append('stop').attr('offset', '100%')
        .attr('stop-color', agentDef.color).attr('stop-opacity', 0.95);
    });

    const g = svg.append('g')
      .attr('class', 'chart-root')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const barCount = AGENTS.length;
    const gap = 6;
    const barHeight = Math.min(28, (innerH - gap * (barCount - 1)) / barCount);
    const totalH = barCount * barHeight + (barCount - 1) * gap;
    const offsetY = (innerH - totalH) / 2;

    // Threshold line at 70%
    const threshX = (70 / 100) * innerW;
    g.append('line')
      .attr('x1', threshX).attr('x2', threshX)
      .attr('y1', offsetY - 4).attr('y2', offsetY + totalH + 4)
      .attr('stroke', '#4FC3F7').attr('stroke-width', 0.7)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-opacity', 0.3);
    g.append('text')
      .attr('x', threshX).attr('y', offsetY - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4FC3F7').attr('font-size', '7.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('opacity', 0.4)
      .text('70%');

    AGENTS.forEach((agentDef, i) => {
      const y = offsetY + i * (barHeight + gap);

      // Avatar — left side
      const clipId = `avatar-clip-${agentDef.id}`;
      const avatarSize = Math.min(barHeight - 2, 22);
      const avatarCx = -54;
      const avatarCy = y + barHeight / 2;

      defs.append('clipPath').attr('id', clipId)
        .append('circle').attr('cx', avatarCx).attr('cy', avatarCy).attr('r', avatarSize / 2);

      g.append('circle')
        .attr('cx', avatarCx).attr('cy', avatarCy).attr('r', avatarSize / 2 + 1.5)
        .attr('fill', 'none')
        .attr('stroke', agentDef.color).attr('stroke-width', 1.5)
        .attr('opacity', 0.4);

      g.append('image')
        .attr('href', `${BASE}${agentDef.avatar}`)
        .attr('x', avatarCx - avatarSize / 2)
        .attr('y', avatarCy - avatarSize / 2)
        .attr('width', avatarSize).attr('height', avatarSize)
        .attr('preserveAspectRatio', 'xMidYMin slice')
        .attr('clip-path', `url(#${clipId})`);

      // Agent name — between avatar and bar
      g.append('text')
        .attr('x', -8).attr('y', y + barHeight / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', agentDef.color)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('opacity', 0.8)
        .text(agentDef.name);

      // Bar background track
      g.append('rect')
        .attr('x', 0).attr('y', y)
        .attr('width', innerW).attr('height', barHeight)
        .attr('rx', 4).attr('ry', 4)
        .attr('fill', 'rgba(100, 160, 255, 0.03)');

      // Bar fill — starts at 0 width, animated on update
      g.append('rect')
        .attr('class', `bar-fill-${agentDef.id}`)
        .attr('x', 0).attr('y', y)
        .attr('width', 0).attr('height', barHeight)
        .attr('rx', 4).attr('ry', 4)
        .attr('fill', `url(#bar-grad-${agentDef.id})`);

      // Right-edge glow
      g.append('rect')
        .attr('class', `bar-glow-${agentDef.id}`)
        .attr('x', 0).attr('y', y + 2)
        .attr('width', 2).attr('height', barHeight - 4)
        .attr('rx', 1)
        .attr('fill', agentDef.color)
        .attr('opacity', 0);

      // Percentage label — to the right of bar
      g.append('text')
        .attr('class', `bar-label-${agentDef.id}`)
        .attr('x', 4).attr('y', y + barHeight / 2 + 4)
        .attr('text-anchor', 'start')
        .attr('fill', agentDef.color)
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text('0%');
    });

    initializedRef.current = true;
  }, []);

  const updateChart = useCallback(() => {
    if (!svgRef.current || !initializedRef.current) return;
    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const margin = { right: 50, left: 90 };
    const innerW = width - margin.left - margin.right;

    AGENTS.forEach((agentDef) => {
      const confidence = agents[agentDef.id]?.confidence ?? 0;
      const barW = (confidence / 100) * innerW;

      svg.select(`.bar-fill-${agentDef.id}`)
        .transition().duration(500).ease(d3.easeCubicOut)
        .attr('width', barW);

      svg.select(`.bar-glow-${agentDef.id}`)
        .transition().duration(500).ease(d3.easeCubicOut)
        .attr('x', barW - 1)
        .attr('opacity', confidence > 5 ? 0.6 : 0);

      svg.select(`.bar-label-${agentDef.id}`)
        .text(`${confidence}%`)
        .transition().duration(500).ease(d3.easeCubicOut)
        .attr('x', barW + 6);
    });
  }, [agents]);

  useEffect(() => {
    initChart();
  }, [initChart]);

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
