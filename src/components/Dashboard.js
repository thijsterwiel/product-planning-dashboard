import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Filter, Save, FileDown, RefreshCw, Upload, Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { productData } from '../data/productData';
import ProductCard from './ProductCard';
import TimelineView from './TimelineView';

// ... rest of the Dashboard component code ...

const Dashboard = () => {
  const [products, setProducts] = useState(productData.map(p => ({
    ...p, 
    retailer: Array.isArray(p.retailer) ? p.retailer : [],
    startDate: p.startDate || null,
    endDate: p.endDate || null,
    planningType: p.planningType || ''
  })));
  const [filters, setFilters] = useState({ brands: [], retailers: [], startDate: null, endDate: null });
  const [retailers, setRetailers] = useState([
    { name: 'Retailer A', logo: '/api/placeholder/50/50?text=A' },
    { name: 'Retailer B', logo: '/api/placeholder/50/50?text=B' },
    { name: 'Retailer C', logo: '/api/placeholder/50/50?text=C' },
    { name: 'Retailer D', logo: '/api/placeholder/50/50?text=D' },
  ]);
  const [newRetailerName, setNewRetailerName] = useState('');

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parsedDate = parse(dateString, 'dd-MM-yyyy', new Date());
    return isValid(parsedDate) ? parsedDate : null;
  };

  const formatDate = (date) => {
    return date && isValid(date) ? format(date, 'dd-MM-yyyy') : null;
  };

  const updateProduct = (id, field, value) => {
    setProducts(products.map(p => p.id === id ? {...p, [field]: value} : p));
  };

  const filteredProducts = products.filter(p => 
    (filters.brands.length === 0 || filters.brands.some(b => b.value === p.brand)) &&
    (filters.retailers.length === 0 || p.retailer.some(r => filters.retailers.some(fr => fr.value === r))) &&
    (!filters.startDate || !p.endDate || parseDate(p.endDate) >= filters.startDate) &&
    (!filters.endDate || !p.startDate || parseDate(p.startDate) <= filters.endDate)
  );

  const resetFilters = () => {
    setFilters({ brands: [], retailers: [], startDate: null, endDate: null });
  };

  const savePlanning = () => {
    localStorage.setItem('productPlanning', JSON.stringify(products));
    localStorage.setItem('retailers', JSON.stringify(retailers));
    alert('Planning saved successfully!');
  };

  const exportPlanning = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Description,Brand,Retailers,Start Date,End Date,Planning Type\n"
      + products.map(p => `${p.id},"${p.description}",${p.brand},"${p.retailer.join('; ')}",${p.startDate},${p.endDate},${p.planningType}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_planning.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleImageUpload = useCallback((id, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === id ? {...p, image: reader.result} : p
          )
        );
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRetailerLogoUpload = useCallback((retailerName, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRetailers(prevRetailers => 
          prevRetailers.map(r => 
            r.name === retailerName ? {...r, logo: reader.result} : r
          )
        );
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const addRetailer = () => {
    if (newRetailerName && !retailers.some(r => r.name === newRetailerName)) {
      setRetailers([...retailers, { name: newRetailerName, logo: '/api/placeholder/50/50?text=NEW' }]);
      setNewRetailerName('');
    }
  };

  const removeRetailer = (retailerName) => {
    setRetailers(retailers.filter(r => r.name !== retailerName));
    setProducts(products.map(p => ({
      ...p,
      retailer: p.retailer.filter(r => r !== retailerName)
    })));
  };

  const addNewProduct = () => {
    const newProduct = {
      id: `NEW-${Date.now()}`,
      description: 'New Product',
      brand: '',
      image: '/api/placeholder/100/100?text=NEW',
      retailer: [],
      startDate: null,
      endDate: null,
      planningType: ''
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (productId) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const resetGanttChart = () => {
    setProducts(products.map(p => ({
      ...p,
      retailer: [],
      startDate: null,
      endDate: null,
      planningType: '',
    })));
  };

  useEffect(() => {
    const savedPlanning = localStorage.getItem('productPlanning');
    const savedRetailers = localStorage.getItem('retailers');
    if (savedPlanning) {
      setProducts(JSON.parse(savedPlanning));
    }
    if (savedRetailers) {
      setRetailers(JSON.parse(savedRetailers));
    }
  }, []);

  const brandOptions = [...new Set(products.map(p => p.brand))].map(brand => ({ value: brand, label: brand }));
  const retailerOptions = retailers.map(r => ({ value: r.name, label: r.name }));

  return (
    <div className="p-4 max-w-[1920px] mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Calendar className="mr-2" /> Autumn Winter 2025 Product Planning
      </h1>
      
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Filter className="mr-2" />
        <div className="w-48 mr-2">
          <Select
            isMulti
            options={brandOptions}
            value={filters.brands}
            onChange={(selected) => setFilters({...filters, brands: selected})}
            placeholder="Select Brands"
          />
        </div>
        <div className="w-48 mr-2">
          <Select
            isMulti
            options={retailerOptions}
            value={filters.retailers}
            onChange={(selected) => setFilters({...filters, retailers: selected})}
            placeholder="Select Retailers"
          />
        </div>
        <DatePicker
          selected={filters.startDate}
          onChange={(date) => setFilters({...filters, startDate: date})}
          selectsStart
          startDate={filters.startDate}
          endDate={filters.endDate}
          dateFormat="dd-MM-yyyy"
          placeholderText="Start Date"
          className="mr-2 p-2 border rounded"
        />
        <DatePicker
          selected={filters.endDate}
          onChange={(date) => setFilters({...filters, endDate: date})}
          selectsEnd
          startDate={filters.startDate}
          endDate={filters.endDate}
          minDate={filters.startDate}
          dateFormat="dd-MM-yyyy"
          placeholderText="End Date"
          className="mr-2 p-2 border rounded"
        />
        <button onClick={resetFilters} className="mr-2 p-2 bg-gray-200 text-gray-800 rounded flex items-center">
          <RefreshCw className="mr-1" size={16} /> Reset Filters
        </button>
        <button onClick={savePlanning} className="mr-2 p-2 bg-blue-500 text-white rounded flex items-center">
          <Save className="mr-1" size={16} /> Save
        </button>
        <button onClick={exportPlanning} className="mr-2 p-2 bg-green-500 text-white rounded flex items-center">
          <FileDown className="mr-1" size={16} /> Export
        </button>
        <button onClick={resetGanttChart} className="p-2 bg-red-500 text-white rounded flex items-center">
          <RefreshCw className="mr-1" size={16} /> Reset Gantt Chart
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Retailers</h2>
        <div className="flex flex-wrap gap-4 items-center">
          {retailers.map(retailer => (
            <div key={retailer.name} className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
              <img src={retailer.logo} alt={retailer.name} className="w-10 h-10 object-contain rounded-full" />
              <span className="text-sm">{retailer.name}</span>
              <label className="cursor-pointer">
                <Upload size={16} className="text-blue-500" />
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => handleRetailerLogoUpload(retailer.name, e.target.files[0])}
                  accept="image/*"
                />
              </label>
              <button 
                onClick={() => removeRetailer(retailer.name)} 
                className="text-red-500"
              >
                <Trash2 size={16}/>
              </button>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newRetailerName}
              onChange={(e) => setNewRetailerName(e.target.value)}
              placeholder="New Retailer"
              className="p-2 border rounded"
            />
            <button onClick={addRetailer} className="p-2 bg-blue-500 text-white rounded">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col" style={{ height: 'calc(100vh - px)' }}> {/* Adjust 200px as needed */}
  <h2 className="text-2xl font-semibold mb-2">Product Timeline</h2>
  {products && products.length > 0 ? (
    <div className="flex-grow" style={{ minHeight: 0 }}> {/* This ensures the TimelineView can grow to fill the space */}
      <TimelineView products={filteredProducts} />
    </div>
  ) : (
    <div className="flex-grow flex items-center justify-center">
      No products available to display in the timeline.
    </div>
  )}
</div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Products</h2>
        <button onClick={addNewProduct} className="mb-4 p-2 bg-green-500 text-white rounded">
          Add New Product
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onUpdate={updateProduct} 
              onImageUpload={handleImageUpload}
              retailers={retailers}
              onRemove={removeProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;