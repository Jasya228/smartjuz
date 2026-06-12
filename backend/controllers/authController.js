import jwt from 'jsonwebtoken';
import db from '../db/jsonStore.js';

const Admin = db.getCollection('admins');

// Seed admin if not exists
const seedUsers = () => {
  const users = Admin.find({});
  if (users.length === 0) {
    Admin.create({
      name: 'Администратор',
      email: 'admin@college.kz',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Default admin created: admin@college.kz / admin123');
  }
};

seedUsers();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey_for_development', {
    expiresIn: '30d',
  });
};

// @desc    Auth admin & get token
export const authAdmin = async (req, res) => {
  const { email, password } = req.body;

  const admin = Admin.findOne({ email });

  if (admin && admin.password === password) {
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      assignedGroup: admin.assignedGroup,
      assignedStudentId: admin.assignedStudentId,
      token: generateToken(admin._id),
    });
  } else {
    res.status(401).json({ message: 'Неверный email или пароль' });
  }
};

// @desc    Register admin (Placeholder)
export const registerAdmin = async (req, res) => {
  res.status(403).json({ message: 'Registration is disabled in local mode' });
};

// @desc    Get admin profile
export const getAdminProfile = async (req, res) => {
  const admin = Admin.findById(req.admin._id);

  if (admin) {
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      assignedGroup: admin.assignedGroup,
      assignedStudentId: admin.assignedStudentId,
    });
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
};
