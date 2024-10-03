import axios from 'axios';

const PROXY_URL = 'http://localhost:3001/api/product-image';

export const getProductImage = async (itemNumber) => {
  try {
    console.log(`Requesting image for item number: ${itemNumber}`);
    const response = await axios.get(PROXY_URL, {
      params: { itemNumber }
    });

    console.log('Proxy server response:', response.data);

    if (response.data && response.data.imageUrl) {
      console.log(`Image URL found: ${response.data.imageUrl}`);
      console.log(`Salsify ID: ${response.data.salsifyId}`);
      return response.data.imageUrl;
    } else {
      console.log(`No image found for item ${itemNumber}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching product data for item ${itemNumber}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};
