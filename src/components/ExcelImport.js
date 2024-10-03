import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelImport = ({ onImport, onClose }) => {
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          console.log('Raw data:', data);
          setDebugInfo(`Raw data rows: ${data.length}`);

          const products = data
            .slice(1) // Assume first row is header
            .map((row, index) => {
              console.log(`Processing row ${index + 2}:`, row);
              return {
                id: `IMPORT-${Date.now()}-${index}`,
                itemNumber: row[0] || '',
                description: row[1] || '',
                brand: row[2] || '',
                image: row[3] || '/api/placeholder/100/100?text=NEW',
                retailer: row[4] ? row[4].split('|').map(r => r.trim()) : [],
                startDate: formatDate(row[5]),
                endDate: formatDate(row[6]),
                planningType: row[7] || '',
                season: row[8] || ''
              };
            })
            .filter(product => product.itemNumber || product.description); // Keep products with at least an item number or description

          console.log('Processed products:', products);
          setDebugInfo(prevInfo => `${prevInfo}\nProcessed products: ${products.length}`);

          if (products.length > 0) {
            onImport(products);
            setError(null);
          } else {
            setError('No valid products found in the Excel file.');
          }
        } catch (e) {
          console.error('Error processing data:', e);
          setError(`Error processing Excel data: ${e.message}`);
          setDebugInfo(`Error: ${e.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string') {
      return dateValue;
    }
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg relative max-w-2xl w-full">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Import Excel</h2>
        <p className="mb-4">Please ensure your Excel file has the correct column order: Item Number, Description, Brand, Image URL, Retailers (separated by |), Start Date, End Date, Planning Type, Season.</p>
        <label className="flex items-center space-x-2 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
          <Upload size={20} />
          <span>Select Excel File</span>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
        </label>
        {error && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        {debugInfo && (
          <div className="mt-4 p-2 bg-gray-100 border border-gray-400 text-gray-700 rounded">
            <p className="font-bold">Debug Info:</p>
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelImport;