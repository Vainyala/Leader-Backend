// controllers/leaderController.js
const Leader = require('../models/Leader');

// Create Leader 
exports.createLeader = async (req, res) => {
  try {
    const leader = new Leader(req.body);

    console.log('Request Body:', req.body);

    await leader.save();
    res.status(201).json("Awesome! Leader data saved successfully");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Read All
exports.getAllLeaders = async (req, res) => {
  try {
    const leaders = await Leader.find();
    res.status(200).json(leaders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSelected = async (req, res) => {
  try {
    //const leader = await Leader.find({}, 'title member_name party constituency social_media');

    //const leader = await Leader.find({}).select('title member_name party constituency social_media');
    const leader = await Leader.find({}).select('member_coordinates party constituency social_media');

    if (!leader || leader.length === 0) {
      return res.status(404).json({ message: 'Leader not found' });
    }
    res.status(200).json(leader);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Read One
exports.getLeaderById = async (req, res) => {
  try {
    const leader = await Leader.findById(req.params.id);
    if (!leader) return res.status(404).json({ message: 'Leader not found' });
    res.status(200).json(leader);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update
exports.updateLeader = async (req, res) => {
  try {
    const leader = await Leader.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(leader);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete
exports.deleteLeader = async (req, res) => {
  try {
    await Leader.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllLeaders = async (req, res) => {
  const { page = 1, limit = 5, party, state } = req.query;

  const query = {};
  if (party) query.party = party;
  if (state) query.state = state;

  try {
    const leaders = await Leader.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Leader.countDocuments(query);
    res.json({ total, page: parseInt(page), limit: parseInt(limit), leaders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

