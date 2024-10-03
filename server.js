const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

const API_KEY = 'XYAIki1Z51MRIIqSjIJyJXC774p5mS3QsmLBpoyEQK8';  // Replace with your Salsify API key
const BASE_URL = 'https://app.salsify.com/api/v1/products';

app.get('/api/product-image', async (req, res) => {
  try {
    let { itemNumber } = req.query;
    console.log(`Searching for item number: ${itemNumber}`);

    // First, try to fetch the product by 'salsify:id'
    let response = await axios.get(`${BASE_URL}/${itemNumber}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    let product = response.data;

    // If not found, try a broader search
    if (!product) {
      response = await axios.get(BASE_URL, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        params: {
          'filter': `"Item Number" eq "${itemNumber}"`,
          'per_page': 1
        }
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        product = response.data.data[0];
      }
    }

    console.log('Salsify API response:', JSON.stringify(product, null, 2));

    if (product) {
      console.log('Matching product data:', JSON.stringify(product, null, 2));

      const assets = product['salsify:digital_assets'] || [];

      // Look for the first image, prioritizing PNG but accepting other formats
      const image = assets.find(asset => 
        asset['salsify:format'] === 'png' || 
        asset['salsify:format'] === 'jpg' || 
        asset['salsify:format'] === 'jpeg'
      );

      if (image) {
        console.log(`Found image for item ${itemNumber}: ${image['salsify:url']}`);
        return res.json({ 
          imageUrl: image['salsify:url'],
          salsifyId: product['salsify:id']
        });
      } else {
        console.log(`No suitable images found for item ${itemNumber}`);
      }
    } else {
      console.log(`No product found for item ${itemNumber}`);
    }

    res.status(404).json({ error: `No images found for item ${itemNumber}` });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({ 
      error: error.response ? error.response.data : 'Internal server error',
      message: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});