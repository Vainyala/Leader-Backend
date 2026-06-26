// controllers/openDataController.js
const Pincode = require("../models/Pincodes");

exports.getAllPincodes = async (req, res) => {

  console.log('getAllPincodes: Request Params:', req.params );
  try {
    const pincodes = await Pincode.find();
    res.status(200).json(pincodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getPincodeByCode = async (req, res) => {

  console.log('getPincodebyCode: Request Params:', req.params);

  try {
    const { pincode } = req.params;
    
    /*
    //Fetch all columns of the db into resultset
    const result = await Pincode.find({ pincode });
      if (result.length === 0) {
        return res.status(404).json({ message: "Pincode not found" });
      }
    */

      
    //Fetch selected columns of the db into resultset

      const result = await Pincode.aggregate([
    { $match: { pincode } },
    {
      $group: {
        _id: { district: "$district", statename: "$statename" },
        pincode: { $first: "$pincode" }
      }
    },
    {
      $project: {
        _id: 0,
        pincode: 1,
        district: "$_id.district",
        statename: "$_id.statename"
      }
    }
  ]);
    /*
    const result = await Pincode.find({ pincode }, {
      pincode: 1,
      district: 1,
      statename: 1,
      _id: 0 // optional: excludes the MongoDB internal _id field
    });
*/

    //OR  Fetch selected columns of the db into resultset 
   // const result = await Pincode.find({ pincode }).select('pincode postoffice district statename -_id');

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
