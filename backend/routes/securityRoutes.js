import express from 'express';
import { logThreat, getThreats, deleteThreat } from '../controllers/securityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getThreats)
  .post(protect, logThreat);

router.route('/:id')
  .delete(protect, deleteThreat);

export default router;
