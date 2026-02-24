import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
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

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
app.get("/api/stats", async (req, res) => {
  try {
    const { data: incomes, error: incomeError } = await supabase.from("incomes").select("amount");
    const { data: expenses, error: expenseError } = await supabase.from("expenses").select("amount");
    const { data: projects, error: projectError } = await supabase.from("projects").select("id, name");

    if (incomeError || expenseError || projectError) throw incomeError || expenseError || projectError;

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get project stats
    const projectStats = await Promise.all(projects.map(async (p) => {
      const { data: pIncomes } = await supabase.from("incomes").select("amount").eq("project_id", p.id);
      const { data: pExpenses } = await supabase.from("expenses").select("amount").eq("project_id", p.id);
      
      const pIncomeSum = pIncomes?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const pExpenseSum = pExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

      return {
        id: p.id,
        name: p.name,
        income: pIncomeSum,
        expense: pExpenseSum
      };
    }));

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      projects: projectStats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data: admin, error } = await supabase.from("admin").select("*").eq("username", username).single();

    if (admin && bcrypt.compareSync(password, admin.password)) {
      const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err: any) {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Categories
app.get("/api/categories", async (req, res) => {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/api/categories", authenticate, async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from("categories").insert([{ name }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put("/api/categories/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const { data, error } = await supabase.from("categories").update({ name }).eq("id", id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Projects
app.get("/api/projects", async (req, res) => {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      categories (name)
    `);
  
  if (error) return res.status(400).json({ error: error.message });
  
  // Flatten category name
  const projects = data.map(p => ({
    ...p,
    category_name: (p as any).categories?.name
  }));
  
  res.json(projects);
});

app.post("/api/projects", authenticate, async (req, res) => {
  const { name, category_id, description } = req.body;
  const { data, error } = await supabase
    .from("projects")
    .insert([{ name, category_id, description }])
    .select()
    .single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put("/api/projects/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, category_id, description } = req.body;
  const { data, error } = await supabase
    .from("projects")
    .update({ name, category_id, description })
    .eq("id", id)
    .select()
    .single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Incomes
app.get("/api/incomes", async (req, res) => {
  const { data, error } = await supabase
    .from("incomes")
    .select(`
      *,
      projects (name)
    `)
    .order("date", { ascending: false });
  
  if (error) return res.status(400).json({ error: error.message });
  
  const incomes = data.map(i => ({
    ...i,
    project_name: (i as any).projects?.name
  }));
  
  res.json(incomes);
});

app.post("/api/incomes", authenticate, async (req, res) => {
  const { receipt_number, amount, project_id, donor_name, date, notes } = req.body;
  const { data, error } = await supabase
    .from("incomes")
    .insert([{ receipt_number, amount, project_id, donor_name, date, notes }])
    .select()
    .single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put("/api/incomes/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { receipt_number, amount, project_id, donor_name, date, notes } = req.body;
  const { data, error } = await supabase
    .from("incomes")
    .update({ receipt_number, amount, project_id, donor_name, date, notes })
    .eq("id", id)
    .select()
    .single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Expenses
app.get("/api/expenses", async (req, res) => {
  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      projects (name)
    `)
    .order("date", { ascending: false });
  
  if (error) return res.status(400).json({ error: error.message });
  
  const expenses = data.map(e => ({
    ...e,
    project_name: (e as any).projects?.name
  }));
  
  res.json(expenses);
});

app.post("/api/expenses", authenticate, async (req, res) => {
  const { amount, project_id, description, date } = req.body;
  const { data, error } = await supabase
    .from("expenses")
    .insert([{ amount, project_id, description, date }])
    .select()
    .single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.put("/api/expenses/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { amount, project_id, description, date } = req.body;
  const { data, error } = await supabase
    .from("expenses")
    .update({ amount, project_id, description, date })
    .eq("id", id)
    .select()
    .single();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
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
