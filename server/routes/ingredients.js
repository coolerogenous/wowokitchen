const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', ingredientController.getAll);
router.get('/:id', ingredientController.getOne);
router.post('/', ingredientController.create);
router.put('/:id', ingredientController.update);
router.delete('/:id', ingredientController.delete);

module.exports = router;
