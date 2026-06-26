const verifyToken = require('../middleware/verifyToken');

router.get('/dashboard', verifyToken, (req, res) => {
  res.status(200).json({ message: `Welcome user ${req.user.userId}! Dashboard unlocked.` });
});


