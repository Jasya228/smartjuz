import jwt from 'jsonwebtoken';
import db from '../db/jsonStore.js';

const Admin = db.getCollection('admins');

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_for_development');

      const admin = Admin.findById(decoded.id);
      if (admin) {
        const { password, ...rest } = admin;
        req.admin = rest;
        next();
      } else {
        res.status(401).json({ message: 'Not authorized, admin not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
