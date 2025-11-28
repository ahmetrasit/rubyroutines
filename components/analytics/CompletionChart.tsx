'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';

interface CompletionDataPoint {
  date: Date;
  completionRate: number;
}

interface CompletionChartProps {
  data: CompletionDataPoint[];
  isLoading?: boolean;
}

export function CompletionChart({ data, isLoading }: CompletionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  // Handle responsive resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: 400 });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Render chart
  useEffect(() => {
    if (!svgRef.current || !data.length || dimensions.width === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Create line generator
    const line = d3
      .line<CompletionDataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.completionRate))
      .curve(d3.curveMonotoneX);

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

    // Add Y axis
    svg
      .append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

    // Add grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => ''));

    // Add line path
    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3B82F6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add circles for data points
    svg
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d.completionRate))
      .attr('r', 4)
      .attr('fill', '#3B82F6')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    svg
      .selectAll('.dot')
      .on('mouseover', function (event, d) {
        const dataPoint = d as CompletionDataPoint;
        d3.select(this).attr('r', 6);
        tooltip
          .style('visibility', 'visible')
          .html(
            `<strong>${d3.timeFormat('%b %d, %Y')(dataPoint.date)}</strong><br/>Completion: ${dataPoint.completionRate.toFixed(1)}%`
          );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 4);
        tooltip.style('visibility', 'hidden');
      });

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
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
          <div className="text-gray-500">No data available</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Completion Rate Trend</h3>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef}></svg>
      </div>
    </Card>
  );
}
