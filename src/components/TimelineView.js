import React, { useRef, useEffect, useState } from 'react';
import { format, parse, differenceInDays, addDays, startOfYear, endOfYear, getWeek, getQuarter } from 'date-fns';
import { ZoomIn, ZoomOut } from 'lucide-react';

const TimelineView = ({ products }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });
  const [zoom, setZoom] = useState(1);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setDimensions({
            width: entry.contentRect.width,
            height: Math.max(entry.contentRect.height, products.length * 50 + 100, 500)
          });
        }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [products]);

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const getColorForPlanningType = (planningType) => {
    const planningTypeColors = {
      feature: '#4CAF50',
      promo: '#2196F3',
      endcap: '#FFC107',
      sidekick: '#9C27B0',
      markdown: '#F44336'
    };
    return planningTypeColors[planningType] || '#CCCCCC';
  };

  const yearStart = startOfYear(new Date(2025, 0, 1));
  const yearEnd = endOfYear(new Date(2025, 11, 31));
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;

  const chartWidth = Math.max(dimensions.width, 1000) * zoom;
  const chartHeight = Math.max(dimensions.height - 50, 450);
  const dayWidth = chartWidth / totalDays;

  const getXPosition = (date) => {
    if (!date) return 0;
    const days = differenceInDays(date, yearStart);
    return days * dayWidth;
  };

  const months = Array.from({ length: 12 }, (_, i) => new Date(2025, i, 1));
  const weeks = Array.from({ length: 53 }, (_, i) => addDays(yearStart, i * 7));

  const holidays = [
    { date: '02-14-2025', name: "Valentine's Day" },
    { date: '04-20-2025', name: 'Easter' },
    { date: '10-31-2025', name: 'Halloween' },
    { date: '11-28-2025', name: 'Black Friday' },
    { date: '12-25-2025', name: 'Christmas' }
  ];

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.brand]) {
      acc[product.brand] = [];
    }
    acc[product.brand].push(product);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button onClick={() => setZoom(zoom * 1.2)} className="mr-2 p-1 bg-blue-500 text-white rounded">
          <ZoomIn size={20} />
        </button>
        <button onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))} className="p-1 bg-blue-500 text-white rounded">
          <ZoomOut size={20} />
        </button>
      </div>
      <div ref={containerRef} style={{ width: '100%', minHeight: '500px', overflowX: 'auto', overflowY: 'hidden' }}>
        <svg width={chartWidth} height={chartHeight}>
          {/* Draw month labels */}
          {months.map((month, index) => (
            <text
              key={`month-${index}`}
              x={getXPosition(month)}
              y="15"
              fontSize="12"
              textAnchor="start"
            >
              {format(month, 'MMM')}
            </text>
          ))}

          {/* Draw week labels */}
          {weeks.map((week, index) => (
            <text
              key={`week-${index}`}
              x={getXPosition(week)}
              y="30"
              fontSize="10"
              textAnchor="middle"
            >
              {getWeek(week)}
            </text>
          ))}

          {/* Draw vertical lines for months */}
          {months.map((month, index) => (
            <line
              key={`month-line-${index}`}
              x1={getXPosition(month)}
              y1="35"
              x2={getXPosition(month)}
              y2={chartHeight}
              stroke="#CCCCCC"
              strokeWidth="1"
            />
          ))}

          {/* Draw quarter separators */}
          {months.filter((_, i) => i % 3 === 0).map((month, index) => (
            <line
              key={`quarter-line-${index}`}
              x1={getXPosition(month)}
              y1="35"
              x2={getXPosition(month)}
              y2={chartHeight}
              stroke="#999999"
              strokeWidth="2"
            />
          ))}

          {/* Draw grid lines */}
          {weeks.map((week, index) => (
            <line
              key={`grid-line-${index}`}
              x1={getXPosition(week)}
              y1="35"
              x2={getXPosition(week)}
              y2={chartHeight}
              stroke="#EEEEEE"
              strokeWidth="1"
            />
          ))}

          {/* Draw holiday indicators */}
          {holidays.map((holiday, index) => {
            const holidayDate = parseDate(holiday.date);
            const x = getXPosition(holidayDate);
            return (
              <g key={`holiday-${index}`}>
                <line
                  x1={x}
                  y1="35"
                  x2={x}
                  y2={chartHeight}
                  stroke="#FF0000"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
                <text
                  x={x}
                  y="45"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#FF0000"
                  transform={`rotate(-90 ${x},45)`}
                >
                  {holiday.name}
                </text>
              </g>
            );
          })}

          {/* Draw product bars and images */}
          {Object.entries(groupedProducts).map(([brand, brandProducts], brandIndex) => (
            <g key={brand}>
              <text
                x="0"
                y={brandIndex * (brandProducts.length * 50 + 30) + 65}
                fontSize="14"
                fontWeight="bold"
              >
                {brand}
              </text>
              {brandProducts.map((product, index) => {
                const startDate = parseDate(product.startDate);
                const endDate = parseDate(product.endDate);
                
                if (!startDate || !endDate) return null;

                const barStart = getXPosition(startDate);
                const barWidth = Math.max(getXPosition(endDate) - barStart, 1);
                const yPosition = brandIndex * (brandProducts.length * 50 + 30) + index * 50 + 70;

                return (
                  <g 
                    key={product.id}
                    onMouseEnter={() => setHoveredProduct(product)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <image
                      href={product.image}
                      x={0}
                      y={yPosition}
                      height="36"
                      width="36"
                    />
                    <rect
                      x={barStart + 40}
                      y={yPosition}
                      width={Math.max(barWidth - 40, 1)}
                      height="40"
                      fill={getColorForPlanningType(product.planningType)}
                      rx="5"
                      ry="5"
                    />
                    <text
                      x={barStart + 45}
                      y={yPosition + 25}
                      fontSize="12"
                      fill="white"
                    >
                      {product.description}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}

          {/* Tooltip */}
          {hoveredProduct && (
            <foreignObject x="10" y="10" width="200" height="100">
              <div xmlns="http://www.w3.org/1999/xhtml" style={{ background: 'white', padding: '10px', border: '1px solid black' }}>
                <p><strong>{hoveredProduct.description}</strong></p>
                <p>Start: {hoveredProduct.startDate}</p>
                <p>End: {hoveredProduct.endDate}</p>
                <p>Type: {hoveredProduct.planningType}</p>
              </div>
            </foreignObject>
          )}
        </svg>
      </div>
      {/* Legend */}
      <div className="mt-4 flex justify-center">
        {Object.entries(getColorForPlanningType).map(([type, color]) => (
          <div key={type} className="mr-4 flex items-center">
            <div style={{ backgroundColor: color, width: '20px', height: '20px' }} className="mr-2"></div>
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;