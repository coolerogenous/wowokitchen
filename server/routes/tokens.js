const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/export/dish/:id', tokenController.exportDish);
router.post('/export/menu/:id', tokenController.exportMenu);
router.post('/import', tokenController.importByCode);

module.exports = router;
