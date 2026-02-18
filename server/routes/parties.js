const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');
const { auth, optionalAuth } = require('../middleware/auth');

// 需要登录的操作
router.post('/', auth, partyController.create);
router.get('/my', auth, partyController.getMyParties);
router.put('/:id/toggle-lock', auth, partyController.toggleLock);

// 游客也可以访问的操作
router.get('/join/:code', optionalAuth, partyController.getByShareCode);
router.post('/join/:code/guest', partyController.joinAsGuest);
router.post('/join/:code/add-dish', optionalAuth, partyController.addDish);
router.get('/join/:code/shopping-list', optionalAuth, partyController.getShoppingList);

module.exports = router;
