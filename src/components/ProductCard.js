import React, { useState } from 'react';
import { Upload, Trash2, Edit2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import "react-datepicker/dist/react-datepicker.css";

const ProductCard = ({ product, onUpdate, onImageUpload, retailers, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(product.description);

  const retailerOptions = retailers.map(r => ({ value: r.name, label: r.name }));

  const planningOptions = [
    { value: 'feature', label: 'Feature' },
    { value: 'promo', label: 'Promo' },
    { value: 'endcap', label: 'Endcap' },
    { value: 'sidekick', label: 'Sidekick' },
    { value: 'markdown', label: 'Markdown' },
  ];

  const handleDescriptionEdit = () => {
    onUpdate(product.id, 'description', editedDescription);
    setIsEditing(false);
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  return (
    <div className="border rounded-lg p-3 shadow-sm bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-sm truncate">
          {isEditing ? (
            <input
              type="text"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={handleDescriptionEdit}
              className="border rounded p-1 w-full"
            />
          ) : (
            product.description
          )}
        </h3>
        <div className="flex">
          <button onClick={() => setIsEditing(!isEditing)} className="text-blue-500 mr-2">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onRemove(product.id)} className="text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="mb-2 relative">
        <img src={product.image} alt={product.description} className="w-full h-24 object-contain rounded" />
        <label className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full cursor-pointer">
          <Upload size={10} />
          <input type="file" className="hidden" onChange={(e) => onImageUpload(product.id, e.target.files[0])} accept="image/*" />
        </label>
      </div>
      <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
      <div className="grid grid-cols-2 gap-1 mb-2">
        <DatePicker
          selected={parseDate(product.startDate)}
          onChange={(date) => onUpdate(product.id, 'startDate', date ? date.toISOString() : null)}
          selectsStart
          startDate={parseDate(product.startDate)}
          endDate={parseDate(product.endDate)}
          dateFormat="dd-MM-yyyy"
          placeholderText="Start"
          className="w-full p-1 border rounded text-xs"
        />
        <DatePicker
          selected={parseDate(product.endDate)}
          onChange={(date) => onUpdate(product.id, 'endDate', date ? date.toISOString() : null)}
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