import React from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, Rectangle, ReferenceLine } from 'recharts';
import { format, parse, differenceInDays, isValid, addDays } from 'date-fns';

const colors = {
  feature: '#00a8e8',
  promo: '#007ea7',
  endcap: '#003459',
  sidekick: '#00171f',
  markdown: '#ff6b6b'
};

const holidays = [
  { date: '14-02-2025', name: 'Valentine\'s Day' },
  { date: '20-04-2025', name: 'Easter' },
  { date: '31-10-2025', name: 'Halloween' },
  { date: '29-11-2025', name: 'Black Friday' },
  { date: '25-12-2025', name: 'Christmas' }
];

const TimelineView = ({ products }) => {
  console.log("TimelineView received products:", products);

  if (!products || !Array.isArray(products) || products.length === 0) {
    return <div>No products available to display in the timeline.</div>;
  }

  const startOfTimeline = parse('01-01-2025', 'dd-MM-yyyy', new Date());
  const endOfTimeline = parse('31-12-2025', 'dd-MM-yyyy', new Date());

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = parse(dateString, 'dd-MM-yyyy', new Date());
    return isValid(parsedDate) ? parsedDate : null;
  };

  const getDayOfYear = (date) => {
    if (!date) return null;
    return differenceInDays(date, startOfTimeline);
  };

  const data = products.map((product) => {
    const start = product.startDate ? getDayOfYear(parseDate(product.startDate)) : 0;
    const end = product.endDate ? getDayOfYear(parseDate(product.endDate)) : 364;
    const duration = end - start + 1;

    return {
      id: product.id,
      name: product.description ? product.description.substring(0, 30) : 'No description',
      start,
      duration,
      color: colors[product.planningType] || '#cccccc',
      image: product.image || '/api/placeholder/100/100?text=NO_IMAGE',
      retailers: Array.isArray(product.retailer) ? product.retailer : [],
      planningType: product.planningType || '',
      startDate: product.startDate,
      endDate: product.endDate
    };
  });

  const CustomBar = (props) => {
    const { x, y, width, height, color } = props;
    return (
      <Rectangle
        x={x}
        y={y + 5}
        width={width}
        height={height - 10}
        fill={color}
        radius={[5, 5, 5, 5]}
      />
    );
  };

  const CustomizedAxisTick = ({ x, y, payload }) => (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
        {format(addDays(startOfTimeline, payload.value), 'dd MMM yyyy')}
      </text>
    </g>
  );

  const CustomizedYAxisTick = ({ x, y, payload }) => {
    const product = data.find(p => p.name === payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        <image x={-190} y={-10} width={20} height={20} xlinkHref={product.image} />
        <text x={-165} y={5} textAnchor="start" fill="#666" fontSize={12}>
          {payload.value}
        </text>
      </g>
    );
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Not set';
    const parsedDate = parseDate(dateString);
    return parsedDate ? format(parsedDate, 'dd-MM-yyyy') : 'Invalid date';
  };

  return (
    <div className="gantt-chart">
      <ResponsiveContainer width="100%" height={Math.max(data.length * 50 + 100, 300)}>
        <BarChart
          data={data}
          layout="vertical"
          barSize={30}
          margin={{ top: 20, right: 30, left: 200, bottom: 20 }}
        >
          <XAxis
            type="number"
            domain={[0, 365]}
            tickCount={12}
            tickFormatter={(value) => format(addDays(startOfTimeline, value), 'MMM yyyy')}
            tick={<CustomizedAxisTick />}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={<CustomizedYAxisTick />}
          />
          <Tooltip
            formatter={(value, name, props) => {
              const startDateStr = formatDateDisplay(props.payload.startDate);
              const endDateStr = formatDateDisplay(props.payload.endDate);
              const retailers = Array.isArray(props.payload.retailers) 
                ? props.payload.retailers.join(', ') 
                : (props.payload.retailers || 'None');
              return [
                `${startDateStr} - ${endDateStr}`,
                `Retailers: ${retailers}`,
                `Type: ${props.payload.planningType || 'Not specified'}`
              ];
            }}
          />
          {holidays.map(holiday => (
            <ReferenceLine
              key={holiday.date}
              x={getDayOfYear(parseDate(holiday.date))}
              stroke="#ff0000"
              label={{ value: holiday.name, position: 'top', fill: '#ff0000' }}
            />
          ))}
          <Bar dataKey="duration" stackId="a" shape={<CustomBar />}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} color={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineView;