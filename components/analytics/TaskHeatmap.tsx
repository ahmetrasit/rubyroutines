'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';

interface TaskHeatmapData {
  date: Date;
  taskName: string;
  count: number;
}

interface TaskHeatmapProps {
  data: TaskHeatmapData[];
  isLoading?: boolean;
}

export function TaskHeatmap({ data, isLoading }: TaskHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  // Handle responsive resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      const uniqueTasks = new Set(data.map((d) => d.taskName)).size;
      setDimensions({ width, height: Math.max(400, uniqueTasks * 40 + 80) });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [data]);

  // Render chart
  useEffect(() => {
    if (!svgRef.current || !data.length || dimensions.width === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 60, right: 20, bottom: 40, left: 180 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get unique dates and tasks
    const dates = Array.from(new Set(data.map((d) => d3.timeDay.floor(d.date).getTime()))).sort(
      (a, b) => a - b
    );
    const tasks = Array.from(new Set(data.map((d) => d.taskName))).sort();

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(dates.map((d) => new Date(d).toISOString()))
      .range([0, width])
      .padding(0.05);

    const yScale = d3.scaleBand().domain(tasks).range([0, height]).padding(0.05);

    const maxCount = d3.max(data, (d) => d.count) || 1;
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxCount])
      .interpolator(d3.interpolateBlues);

    // Add X axis (dates)
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((d) => d3.timeFormat('%m/%d')(new Date(d as string)))
          .tickValues(
            dates
              .filter((_, i) => i % Math.ceil(dates.length / 10) === 0)
              .map((d) => new Date(d).toISOString())
          )
      )
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#6B7280')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis (task names)
    svg
      .append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#374151')
      .call(wrap, margin.left - 10);

    // Create data map for efficient lookup
    const dataMap = new Map<string, number>();
    data.forEach((d) => {
      const key = `${d3.timeDay.floor(d.date).toISOString()}-${d.taskName}`;
      dataMap.set(key, d.count);
    });

    // Add heatmap cells
    const cells = svg
      .selectAll('.cell')
      .data(
        tasks.flatMap((task) =>
          dates.map((date) => ({
            task,
            date: new Date(date),
            count: dataMap.get(`${new Date(date).toISOString()}-${task}`) || 0,
          }))
        )
      )
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d) => xScale(d.date.toISOString()) || 0)
      .attr('y', (d) => yScale(d.task) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => (d.count > 0 ? colorScale(d.count) : '#F3F4F6'))
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .attr('rx', 2)
      .style('cursor', 'pointer');

    // Add tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'heatmap-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    cells
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.8);
        tooltip
          .style('visibility', 'visible')
          .html(
            `<strong>${d.task}</strong><br/>${d3.timeFormat('%b %d, %Y')(d.date)}<br/>Completions: ${d.count}`
          );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1);
        tooltip.style('visibility', 'hidden');
      });

    // Add legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - legendWidth},${-40})`);

    const legendScale = d3.scaleLinear().domain([0, maxCount]).range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format('d'));

    legend
      .selectAll('.legend-rect')
      .data(d3.range(0, maxCount + 1, maxCount / 20))
      .enter()
      .append('rect')
      .attr('x', (d) => legendScale(d))
      .attr('width', legendWidth / 20)
      .attr('height', legendHeight)
      .attr('fill', (d) => colorScale(d));

    legend
      .append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#6B7280');

    legend
      .append('text')
      .attr('x', 0)
      .attr('y', -5)
      .style('font-size', '12px')
      .style('fill', '#374151')
      .text('Completions');

    // Text wrapping function
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

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [data, dimensions]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-gray-500">Loading heatmap...</div>
        </div>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-gray-500">No task data available</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Task Completion Heatmap</h3>
      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg ref={svgRef}></svg>
      </div>
    </Card>
  );
}
