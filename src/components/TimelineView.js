import React, { useRef, useEffect, useState, useMemo } from 'react';
import { format, parse, differenceInDays, addDays, startOfYear, endOfYear, getWeek, isValid, min, max } from 'date-fns';
import { ZoomIn, ZoomOut } from 'lucide-react';

const formatDateForTooltip = (dateString) => {
  if (!dateString) return '';
  const date = parse(dateString, 'dd-MM-yyyy', new Date());
  return isValid(date) ? format(date, 'dd-MM-yyyy') : '';
};

const TimelineView = ({ products }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });
  const [zoom, setZoom] = useState(1);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

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
    const parsedDate = parse(dateString, 'dd-MM-yyyy', new Date());
    return isValid(parsedDate) ? parsedDate : null;
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

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const startA = parseDate(a.startDate);
      const startB = parseDate(b.startDate);
      return startA && startB ? startA.getTime() - startB.getTime() : 0;
    });
  }, [products]);

  const { minDate, maxDate } = useMemo(() => {
    const dates = sortedProducts
      .flatMap(p => [parseDate(p.startDate), parseDate(p.endDate)])
      .filter(Boolean);
    return {
      minDate: min(dates),
      maxDate: max(dates)
    };
  }, [sortedProducts]);

  const yearStart = startOfYear(minDate || new Date());
  const yearEnd = endOfYear(maxDate || new Date());
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;

  const chartWidth = Math.max(dimensions.width, 1000) * zoom;
  const chartHeight = Math.max(dimensions.height - 50, 450);
  const dayWidth = chartWidth / totalDays;

  const getXPosition = (date) => {
    if (!date) return 0;
    const days = differenceInDays(date, yearStart);
    return days * dayWidth;
  };

  const months = Array.from({ length: differenceInDays(yearEnd, yearStart) / 30 }, (_, i) => addDays(yearStart, i * 30));
  const weeks = Array.from({ length: Math.ceil(totalDays / 7) }, (_, i) => addDays(yearStart, i * 7));

  const holidays = [
    { date: '14-02', name: "Valentine's Day" },
    { date: '20-04', name: 'Easter' },
    { date: '31-10', name: 'Halloween' },
    { date: '28-11', name: 'Black Friday' },
    { date: '25-12', name: 'Christmas' }
  ].map(holiday => ({
    ...holiday,
    date: `${holiday.date}-${yearStart.getFullYear()}`
  }));

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
              {format(month, 'MMM yyyy')}
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

          {/* Draw product bars */}
          {sortedProducts.map((product, index) => {
            const startDate = parseDate(product.startDate);
            const endDate = parseDate(product.endDate);
            
            if (!startDate || !endDate) return null;

            const barStart = getXPosition(startDate);
            const barWidth = Math.max(getXPosition(endDate) - barStart, 1);
            const yPosition = index * 30 + 70;

            return (
              <g 
                key={product.id}
                onMouseEnter={(e) => {
                  setHoveredProduct(product);
                  setHoverPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setHoverPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <rect
                  x={barStart}
                  y={yPosition}
                  width={barWidth}
                  height="20"
                  fill={getColorForPlanningType(product.planningType)}
                  rx="5"
                  ry="5"
                />
                <text
                  x={barStart + 5}
                  y={yPosition + 15}
                  fontSize="12"
                  fill="white"
                >
                  {product.description}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Tooltip with image */}
      {hoveredProduct && (
        <div 
          style={{
            position: 'fixed',
            left: `${hoverPosition.x + 10}px`,
            top: `${hoverPosition.y + 10}px`,
            background: 'white',
            padding: '10px',
            border: '1px solid black',
            borderRadius: '5px',
            zIndex: 1000,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'start',
            maxWidth: '300px'
          }}
        >
          <img 
            src={hoveredProduct.image} 
            alt={hoveredProduct.description} 
            style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '10px' }}
          />
          <div>
            <p><strong>{hoveredProduct.description}</strong></p>
            <p>Brand: {hoveredProduct.brand}</p>
            <p>Start: {formatDateForTooltip(hoveredProduct.startDate)}</p>
            <p>End: {formatDateForTooltip(hoveredProduct.endDate)}</p>
            <p>Type: {hoveredProduct.planningType}</p>
            <p>Season: {hoveredProduct.season}</p>
            <p>Retailers: {hoveredProduct.retailer.join(', ')}</p>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex justify-center">
        {Object.entries(getColorForPlanningType()).map(([type, color]) => (
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