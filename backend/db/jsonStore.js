/**
 * JSON File Database — локальная замена MongoDB.
 * Хранит данные в JSON-файлах в папке /data.
 * Поддерживает CRUD операции с API, похожим на Mongoose.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      } else {
        this.data = [];
        this._save();
      }
    } catch {
      this.data = [];
      this._save();
    }
  }

  _save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  _generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  // Find documents matching a query
  find(query = {}) {
    let results = [...this.data];
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        for (const [op, opVal] of Object.entries(value)) {
          if (op === '$gte') results = results.filter(d => new Date(d[key]) >= new Date(opVal));
          if (op === '$lt') results = results.filter(d => new Date(d[key]) < new Date(opVal));
        }
      } else {
        results = results.filter(d => d[key] === value);
      }
    }
    return results;
  }

  findOne(query) {
    return this.find(query)[0] || null;
  }

  findById(id) {
    return this.data.find(d => d._id === id) || null;
  }

  create(doc) {
    const newDoc = {
      _id: this._generateId(),
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.push(newDoc);
    this._save();
    return newDoc;
  }

  deleteById(id) {
    const index = this.data.findIndex(d => d._id === id);
    if (index === -1) return null;
    const deleted = this.data.splice(index, 1)[0];
    this._save();
    return deleted;
  }

  updateById(id, updates) {
    const index = this.data.findIndex(d => d._id === id);
    if (index === -1) return null;
    this.data[index] = {
      ...this.data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this._save();
    return this.data[index];
  }

  countDocuments(query = {}) {
    return this.find(query).length;
  }

  // Sort results (returns sorted array)
  sort(results, sortObj) {
    const key = Object.keys(sortObj)[0];
    const order = sortObj[key]; // 1 asc, -1 desc
    return results.sort((a, b) => {
      if (a[key] < b[key]) return -1 * order;
      if (a[key] > b[key]) return 1 * order;
      return 0;
    });
  }
}

// Cache collections
const collections = {};

export function getCollection(name) {
  if (!collections[name]) {
    collections[name] = new Collection(name);
  }
  return collections[name];
}

export default { getCollection };
