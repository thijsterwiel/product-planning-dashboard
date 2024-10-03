import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Filter, Save, FileDown, RefreshCw, Upload, Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { productData } from '../data/productData';
import ProductCard from './ProductCard';
import TimelineView from './TimelineView';
import ExcelImport from './ExcelImport';
import { getProductImage } from './salsifyAPI';

const Dashboard = () => {
  const [products, setProducts] = useState(productData.map(p => ({
    ...p, 
    retailer: Array.isArray(p.retailer) ? p.retailer : [],
    startDate: p.startDate || null,
    endDate: p.endDate || null,
    planningType: p.planningType || '',
    season: p.season || '',
    itemNumber: p.itemNumber || ''
  })));
  const [filters, setFilters] = useState({ 
    brands: [], 
    retailers: [], 
    startDate: null, 
    endDate: null,
    types: [],
    seasons: []
  });
  const [retailers, setRetailers] = useState([
    { name: 'Dreamland', logo: '/api/placeholder/50/50?text=D' },
    { name: 'Otto Simon', logo: '/api/placeholder/50/50?text=OS' },
    { name: 'Intertoys', logo: '/api/placeholder/50/50?text=I' },
    { name: 'Toychamp', logo: '/api/placeholder/50/50?text=T' },
    { name: 'Supra Bazar', logo: '/api/placeholder/50/50?text=SB' },
    { name: 'Bol.com', logo: '/api/placeholder/50/50?text=B' },
  ]);
  const [newRetailerName, setNewRetailerName] = useState('');
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [view, setView] = useState('timeline');
  const [debugInfo, setDebugInfo] = useState('');

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
    (!filters.endDate || !p.startDate || parseDate(p.startDate) <= filters.endDate) &&
    (filters.types.length === 0 || filters.types.some(t => t.value === p.planningType)) &&
    (filters.seasons.length === 0 || filters.seasons.some(s => s.value === p.season))
  );

  const resetFilters = () => {
    setFilters({ brands: [], retailers: [], startDate: null, endDate: null, types: [], seasons: [] });
  };

  const savePlanning = () => {
    localStorage.setItem('productPlanning', JSON.stringify(products));
    localStorage.setItem('retailers', JSON.stringify(retailers));
    alert('Planning saved successfully!');
  };

  const exportPlanning = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID;Item Number;Description;Brand;Retailers;Start Date;End Date;Planning Type;Season\n"
      + products.map(p => `${p.id};${p.itemNumber};"${p.description}";${p.brand};"${p.retailer.join('|')}";${p.startDate};${p.endDate};${p.planningType};${p.season}`).join("\n");
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
      itemNumber: '',
      description: 'New Product',
      brand: '',
      image: '/api/placeholder/100/100?text=NEW',
      retailer: [],
      startDate: null,
      endDate: null,
      planningType: '',
      season: ''
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
      season: ''
    })));
  };

  const handleExcelImport = (importedProducts) => {
    setProducts(prevProducts => [...prevProducts, ...importedProducts]);
    setShowExcelImport(false);
  };

  const fetchProductImages = async () => {
    setDebugInfo('Fetching images...');
    console.log('Current products:', products);  // Add this line
    const updatedProducts = await Promise.all(products.map(async (product) => {
      if (product.itemNumber) {
        setDebugInfo(prev => `${prev}\nFetching image for item ${product.itemNumber}...`);
        try {
          const imageUrl = await getProductImage(product.itemNumber);
          if (imageUrl) {
            setDebugInfo(prev => `${prev}\nImage found for item ${product.itemNumber}: ${imageUrl}`);
            return { ...product, image: imageUrl };
          } else {
            setDebugInfo(prev => `${prev}\nNo image found for item ${product.itemNumber}`);
          }
        } catch (error) {
          setDebugInfo(prev => `${prev}\nError fetching image for item ${product.itemNumber}: ${error.message}`);
        }
      } else {
        setDebugInfo(prev => `${prev}\nSkipping item with no item number: ${product.description}`);
      }
      return product;
    }));
    setProducts(updatedProducts);
    setDebugInfo(prev => `${prev}\nImage fetching complete.`);
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
  const typeOptions = [...new Set(products.map(p => p.planningType))].map(type => ({ value: type, label: type }));
  const seasonOptions = [
    { value: 'Spring/Summer', label: 'Spring/Summer' },
    { value: 'Autumn/Fall', label: 'Autumn/Fall' }
  ];

  return (
    <div className="p-4 max-w-[1920px] mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Calendar className="mr-2" /> Product Planning Dashboard
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
        <div className="w-48 mr-2">
          <Select
            isMulti
            options={typeOptions}
            value={filters.types}
            onChange={(selected) => setFilters({...filters, types: selected})}
            placeholder="Select Types"
          />
        </div>
        <div className="w-48 mr-2">
          <Select
            isMulti
            options={seasonOptions}
            value={filters.seasons}
            onChange={(selected) => setFilters({...filters, seasons: selected})}
            placeholder="Select Seasons"
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
        <button onClick={() => setShowExcelImport(true)} className="mr-2 p-2 bg-purple-500 text-white rounded flex items-center">
          <Upload className="mr-1" size={16} /> Import Excel
        </button>
      </div>

      {showExcelImport && (
        <ExcelImport onImport={handleExcelImport} onClose={() => setShowExcelImport(false)} />
      )}

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

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-semibold">Products</h2>
          <div>
            <button 
              onClick={() => setView('timeline')} 
              className={`mr-2 p-2 rounded ${view === 'timeline' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              Timeline View
            </button>
            <button 
              onClick={() => setView('cards')} 
              className={`p-2 rounded ${view === 'cards' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Card View
            </button>
          </div>
        </div>
        <button onClick={addNewProduct} className="mb-4 p-2 bg-green-500 text-white rounded">
          Add New Product
        </button>
        <button onClick={fetchProductImages} className="mb-4 ml-2 p-2 bg-blue-500 text-white rounded">
          Fetch Salsify Images
        </button>
        {view === 'timeline' ? (
          <div style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
            <TimelineView products={filteredProducts} />
          </div>
        ) : (
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
        )}
      </div>
      
      {debugInfo && (
        <div className="mt-4 p-2 bg-gray-100 border border-gray-400 text-gray-700 rounded">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre className="whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;