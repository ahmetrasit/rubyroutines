'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';

interface GoalProgressData {
  goalId: string;
  goalName: string;
  progress: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED';
}

interface GoalProgressChartProps {
  data: GoalProgressData[];
  isLoading?: boolean;
}

const STATUS_COLORS = {
  NOT_STARTED: '#9CA3AF',
  IN_PROGRESS: '#3B82F6',
  ACHIEVED: '#10B981',
};

export function GoalProgressChart({ data, isLoading }: GoalProgressChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  // Handle responsive resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(400, data.length * 60) });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [data.length]);

  // Render chart
  useEffect(() => {
    if (!svgRef.current || !data.length || dimensions.width === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 150 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.goalName))
      .range([0, height])
      .padding(0.2);

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);

    // Add Y axis (goal names)
    svg
      .append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#374151')
      .style('font-weight', '500')
      .call(wrap, margin.left - 10);

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

    // Add background bars (light gray)
    svg
      .selectAll('.bg-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bg-bar')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.goalName) || 0)
      .attr('width', width)
      .attr('height', yScale.bandwidth())
      .attr('fill', '#F3F4F6')
      .attr('rx', 4);

    // Add progress bars
    svg
      .selectAll('.progress-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'progress-bar')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.goalName) || 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => STATUS_COLORS[d.status])
      .attr('rx', 4)
      .transition()
      .duration(1000)
      .attr('width', (d) => xScale(d.progress));

    // Add percentage labels
    svg
      .selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d) => xScale(d.progress) + 8)
      .attr('y', (d) => (yScale(d.goalName) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text((d) => `${d.progress.toFixed(0)}%`);

    // Text wrapping function for long goal names
    function wrap(text: any, width: number) {
      text.each(function (this: SVGTextElement) {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = text.attr('y');
        const dy = parseFloat(text.attr('dy') || '0');
        let tspan = text
          .text(null)
          .append('tspan')
          .attr('x', -10)
          .attr('y', y)
          .attr('dy', dy + 'em');

        while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(' '));
          if (tspan.node()!.getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = text
              .append('tspan')
              .attr('x', -10)
              .attr('y', y)
              .attr('dy', ++lineNumber * lineHeight + dy + 'em')
              .text(word);
          }
        }
      });
    }
  }, [data, dimensions]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-gray-500">No goals to display</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Goal Progress</h3>
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.NOT_STARTED }}></div>
          <span className="text-gray-600">Not Started</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.IN_PROGRESS }}></div>
          <span className="text-gray-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.ACHIEVED }}></div>
          <span className="text-gray-600">Achieved</span>
        </div>
      </div>
      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg ref={svgRef}></svg>
      </div>
    </Card>
  );
}
