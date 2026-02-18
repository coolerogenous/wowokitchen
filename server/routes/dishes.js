const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', dishController.getAll);
router.get('/:id', dishController.getOne);
router.post('/', dishController.create);
router.put('/:id', dishController.update);
router.delete('/:id', dishController.delete);

module.exports = router;
