const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', menuController.getAll);
router.get('/:id', menuController.getOne);
router.post('/', menuController.create);
router.put('/:id', menuController.update);
router.delete('/:id', menuController.delete);
router.get('/:id/shopping-list', menuController.getShoppingList);

module.exports = router;
