import React from 'react';
import { Upload, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { format, parse, isValid } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";

const planningOptions = [
  { value: 'feature', label: 'Feature' },
  { value: 'promo', label: 'Promo' },
  { value: 'endcap', label: 'Endcap' },
  { value: 'sidekick', label: 'Sidekick' },
  { value: 'markdown', label: 'Markdown' },
];

const seasonOptions = [
  { value: 'Spring/Summer', label: 'Spring/Summer' },
  { value: 'Autumn/Fall', label: 'Autumn/Fall' },
];

const ProductCard = ({ product, onUpdate, onImageUpload, retailers, onRemove }) => {
  const retailerOptions = retailers.map(r => ({ value: r.name, label: r.name }));

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = parse(dateString, 'dd-MM-yyyy', new Date());
    return isValid(parsedDate) ? parsedDate : null;
  };

  const formatDate = (date) => {
    return date && isValid(date) ? format(date, 'dd-MM-yyyy') : '';
  };

  const handleDateChange = (field, date) => {
    onUpdate(product.id, field, formatDate(date));
  };

  return (
    <div className="border rounded-lg p-3 shadow-sm bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-sm truncate">{product.id}</h3>
        <button onClick={() => onRemove(product.id)} className="text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mb-2 relative">
        <img src={product.image} alt={product.description} className="w-full h-24 object-cover rounded" />
        <label className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full cursor-pointer">
          <Upload size={10} />
          <input type="file" className="hidden" onChange={(e) => onImageUpload(product.id, e.target.files[0])} accept="image/*" />
        </label>
      </div>
      <input
        type="text"
        value={product.itemNumber}
        onChange={(e) => onUpdate(product.id, 'itemNumber', e.target.value)}
        placeholder="Item Number"
        className="w-full p-1 mb-1 border rounded text-xs"
      />
      <input
        type="text"
        value={product.description}
        onChange={(e) => onUpdate(product.id, 'description', e.target.value)}
        placeholder="Description"
        className="w-full p-1 mb-1 border rounded text-xs"
      />
      <input
        type="text"
        value={product.brand}
        onChange={(e) => onUpdate(product.id, 'brand', e.target.value)}
        placeholder="Brand"
        className="w-full p-1 mb-2 border rounded text-xs"
      />
      <div className="grid grid-cols-2 gap-1 mb-2">
        <DatePicker
          selected={parseDate(product.startDate)}
          onChange={(date) => handleDateChange('startDate', date)}
          selectsStart
          startDate={parseDate(product.startDate)}
          endDate={parseDate(product.endDate)}
          dateFormat="dd-MM-yyyy"
          placeholderText="Start"
          className="w-full p-1 border rounded text-xs"
        />
        <DatePicker
          selected={parseDate(product.endDate)}
          onChange={(date) => handleDateChange('endDate', date)}
          selectsEnd
          startDate={parseDate(product.startDate)}
          endDate={parseDate(product.endDate)}
          minDate={parseDate(product.startDate)}
          dateFormat="dd-MM-yyyy"
          placeholderText="End"
          className="w-full p-1 border rounded text-xs"
        />
      </div>
      <Select
        isMulti
        options={retailerOptions}
        value={product.retailer.map(r => ({ value: r, label: r }))}
        onChange={(selected) => onUpdate(product.id, 'retailer', selected.map(s => s.value))}
        placeholder="Retailers"
        className="mb-2 text-xs"
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '24px',
            height: '24px'
          }),
          valueContainer: (base) => ({
            ...base,
            height: '24px',
            padding: '0 6px'
          }),
          input: (base) => ({
            ...base,
            margin: '0px',
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: '24px',
          })
        }}
      />
      <Select
        options={planningOptions}
        value={planningOptions.find(option => option.value === product.planningType)}
        onChange={(selected) => onUpdate(product.id, 'planningType', selected ? selected.value : null)}
        placeholder="Type"
        className="mb-2 text-xs"
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '24px',
            height: '24px'
          }),
          valueContainer: (base) => ({
            ...base,
            height: '24px',
            padding: '0 6px'
          }),
          input: (base) => ({
            ...base,
            margin: '0px',
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: '24px',
          })
        }}
      />
      <Select
        options={seasonOptions}
        value={seasonOptions.find(option => option.value === product.season)}
        onChange={(selected) => onUpdate(product.id, 'season', selected ? selected.value : null)}
        placeholder="Season"
        className="text-xs"
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '24px',
            height: '24px'
          }),
          valueContainer: (base) => ({
            ...base,
            height: '24px',
            padding: '0 6px'
          }),
          input: (base) => ({
            ...base,
            margin: '0px',
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: '24px',
          })
        }}
      />
    </div>
  );
};

export default ProductCard;