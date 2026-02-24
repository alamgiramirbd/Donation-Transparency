import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "donation-transparency-secret-key";

// Database initialization
const db = new Database("donations.db");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_number TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    project_id INTEGER NOT NULL,
    donor_name TEXT,
    date TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    project_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

// Create default admin if not exists
const adminExists = db.prepare("SELECT * FROM admin WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO admin (username, password) VALUES (?, ?)").run("admin", hashedPassword);
  console.log("Default admin created: admin / admin123");
}

// Middleware
app.use(express.json());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// API Routes

// Public Stats
app.get("/api/stats", (req, res) => {
  const totalIncome = db.prepare("SELECT SUM(amount) as total FROM incomes").get() as any;
  const totalExpense = db.prepare("SELECT SUM(amount) as total FROM expenses").get() as any;
  const projectStats = db.prepare(`
    SELECT 
      p.name, 
      p.id,
      COALESCE(SUM(i.amount), 0) as income,
      COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.project_id = p.id), 0) as expense
    FROM projects p
    LEFT JOIN incomes i ON i.project_id = p.id
    GROUP BY p.id
  `).all();

  res.json({
    totalIncome: totalIncome?.total || 0,
    totalExpense: totalExpense?.total || 0,
    balance: (totalIncome?.total || 0) - (totalExpense?.total || 0),
    projects: projectStats
  });
});

// Auth
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare("SELECT * FROM admin WHERE username = ?").get(username) as any;

  if (admin && bcrypt.compareSync(password, admin.password)) {
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Categories
app.get("/api/categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM categories").all();
  res.json(categories);
});

app.post("/api/categories", authenticate, (req, res) => {
  const { name } = req.body;
  try {
    const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid, name });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/categories/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
    res.json({ id, name });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Projects
app.get("/api/projects", (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM projects p 
    JOIN categories c ON p.category_id = c.id
  `).all();
  res.json(projects);
});

app.post("/api/projects", authenticate, (req, res) => {
  const { name, category_id, description } = req.body;
  try {
    const result = db.prepare("INSERT INTO projects (name, category_id, description) VALUES (?, ?, ?)")
      .run(name, category_id, description);
    res.json({ id: result.lastInsertRowid, name, category_id, description });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/projects/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { name, category_id, description } = req.body;
  try {
    db.prepare("UPDATE projects SET name = ?, category_id = ?, description = ? WHERE id = ?")
      .run(name, category_id, description, id);
    res.json({ id, name, category_id, description });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Incomes
app.get("/api/incomes", (req, res) => {
  const incomes = db.prepare(`
    SELECT i.*, p.name as project_name 
    FROM incomes i 
    JOIN projects p ON i.project_id = p.id
    ORDER BY i.date DESC
  `).all();
  res.json(incomes);
});

app.post("/api/incomes", authenticate, (req, res) => {
  const { receipt_number, amount, project_id, donor_name, date, notes } = req.body;
  try {
    const result = db.prepare("INSERT INTO incomes (receipt_number, amount, project_id, donor_name, date, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .run(receipt_number, amount, project_id, donor_name, date, notes);
    res.json({ id: result.lastInsertRowid, receipt_number, amount, project_id, donor_name, date, notes });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/incomes/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { receipt_number, amount, project_id, donor_name, date, notes } = req.body;
  try {
    db.prepare("UPDATE incomes SET receipt_number = ?, amount = ?, project_id = ?, donor_name = ?, date = ?, notes = ? WHERE id = ?")
      .run(receipt_number, amount, project_id, donor_name, date, notes, id);
    res.json({ id, receipt_number, amount, project_id, donor_name, date, notes });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Expenses
app.get("/api/expenses", (req, res) => {
  const expenses = db.prepare(`
    SELECT e.*, p.name as project_name 
    FROM expenses e 
    JOIN projects p ON e.project_id = p.id
    ORDER BY e.date DESC
  `).all();
  res.json(expenses);
});

app.post("/api/expenses", authenticate, (req, res) => {
  const { amount, project_id, description, date } = req.body;
  try {
    const result = db.prepare("INSERT INTO expenses (amount, project_id, description, date) VALUES (?, ?, ?, ?)")
      .run(amount, project_id, description, date);
    res.json({ id: result.lastInsertRowid, amount, project_id, description, date });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/expenses/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { amount, project_id, description, date } = req.body;
  try {
    db.prepare("UPDATE expenses SET amount = ?, project_id = ?, description = ?, date = ? WHERE id = ?")
      .run(amount, project_id, description, date, id);
    res.json({ id, amount, project_id, description, date });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
