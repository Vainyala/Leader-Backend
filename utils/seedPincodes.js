// utils/seedPincodes.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Pincodes = require('../models/Pincodes');

mongoose.connect('mongodb://localhost:27017/leaderapp_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Load raw JSON data
const rawData = require('../../india_pincodes.json');

// Transform the raw semicolon-separated string into proper fields
const transformedData = rawData.map(obj => {
  const raw = obj["pincode;postoffice;district;statename;latitude;longitude"];
  const parts = raw?.split(';');

  // Ensure the data is well-formed
  if (!parts || parts.length !== 6) {
    console.warn('⚠️ Skipping malformed entry:', raw);
    return null;
  }

  const [pincode, postoffice, district, statename, latitudeStr, longitudeStr] = parts;
  const latitude = parseFloat(latitudeStr);
  const longitude = parseFloat(longitudeStr);

  // Ensure valid coordinates
  if (isNaN(latitude) || isNaN(longitude)) {
    console.warn('⚠️ Invalid coordinates:', latitudeStr, longitudeStr);
    return null;
  }

  return {
    pincode,
    postoffice,
    district,
    statename,
    latitude,
    longitude
  };
}).filter(Boolean); // Removes any null entries

async function seedData() {
  try {
    console.log(`🔄 Purging existing pincodes...`);
    await Pincodes.deleteMany({});

    /* Source data has duplicate pincodes so lets not do any indexing on pincode
    console.log(`🚀 Creating index on 'pincode' for uniqueness...`);
    await Pincodes.createIndexes();
    */
    console.log(`📦 Inserting ${transformedData.length} entries...`);
    await Pincodes.insertMany(transformedData, { ordered: false });

    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedData();

