const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', subCategoryController.getAllSubCategories);
router.post('/', authMiddleware, subCategoryController.createSubCategory);
router.put('/:id', authMiddleware, subCategoryController.updateSubCategory);
router.delete('/:id', authMiddleware, subCategoryController.deleteSubCategory);
router.post('/:id/move', authMiddleware, subCategoryController.moveSubCategory);

module.exports = router;
