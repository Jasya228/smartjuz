import express from 'express';
import { authAdmin, registerAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authAdmin);
router.post('/register', registerAdmin);

export default router;
