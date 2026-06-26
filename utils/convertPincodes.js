const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");

const csvPath = path.join(__dirname, "../../india_pincodes.csv");
const jsonPath = path.join(__dirname, "../../india_pincode.json");

csv()
  .fromFile(csvPath)
  .then((jsonData) => {
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log("✅ Converted CSV to JSON:", jsonPath);
  })
  .catch((err) => console.error("❌ Conversion error:", err));



/* csv({ delimiter: ";" })
  .fromFile(inputFile)
  .then((jsonArray) => {
    const formatted = jsonArray.map((item) => ({
      officeName: item.officename,
      pincode: item.pincode,
      district: item.district,
      stateName: item.statename,
      latitude: parseFloat(item.latitude),
      longitude: parseFloat(item.longitude)
    }));

    fs.writeFileSync(outputFile, JSON.stringify(formatted, null, 2));
    console.log("✅ CSV converted to JSON and saved as india_pincodess.json");
  });

*/


