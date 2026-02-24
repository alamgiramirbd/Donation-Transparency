import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt, Wallet, FolderTree, LogIn, LogOut, ShieldCheck, Menu, X, Info, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "./services/api";
import { Stats, Category, Project, Income, Expense } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ isAdmin, onLogout }: { isAdmin: boolean; onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Transparency", path: "/", icon: LayoutDashboard },
    ...(isAdmin ? [
      { name: "Admin Panel", path: "/admin", icon: ShieldCheck },
    ] : [
      { name: "Admin Login", path: "/login", icon: LogIn },
    ]),
  ];

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
              <span className="text-xl font-bold text-zinc-900 tracking-tight">DonationTrust</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2",
                  location.pathname === item.path
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
            {isAdmin && (
              <button
                onClick={onLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-600 hover:text-zinc-900 p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-b border-zinc-200 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-3",
                    location.pathname === item.path
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              ))}
              {isAdmin && (
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center space-x-3"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Pages ---

const TransparencyPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, i, e] = await Promise.all([
          api.getStats(),
          api.getIncomes(),
          api.getExpenses(),
        ]);
        setStats(s);
        setIncomes(i);
        setExpenses(e);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredIncomes = incomes.filter(i => 
    i.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Financial Transparency</h1>
        <p className="text-zinc-600">Real-time tracking of every donation and expense for complete accountability.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Wallet size={20} />
            </div>
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Income</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">৳{stats?.totalIncome.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <Receipt size={20} />
            </div>
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Expenses</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">৳{stats?.totalExpense.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <LayoutDashboard size={20} />
            </div>
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Current Balance</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">৳{stats?.balance.toLocaleString()}</div>
        </div>
      </div>

      {/* Projects Summary */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center space-x-2">
          <FolderTree size={20} className="text-emerald-600" />
          <span>Project Breakdown</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats?.projects.map((p) => (
            <div key={p.id} className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
              <h3 className="font-bold text-zinc-900 mb-4">{p.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Income</span>
                  <span className="font-medium text-emerald-600">৳{p.income.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Expense</span>
                  <span className="font-medium text-red-600">৳{p.expense.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-bold">
                  <span className="text-zinc-700">Net</span>
                  <span className="text-zinc-900">৳{(p.income - p.expense).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-zinc-900">Recent Incomes</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Receipt #"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-48"
              />
              <Menu className="absolute left-3 top-2.5 text-zinc-400" size={16} />
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Receipt</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Donor</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Date</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Project</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredIncomes.slice(0, 10).map((i) => (
                  <tr key={i.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{i.receipt_number}</td>
                    <td className="px-4 py-3 text-zinc-900">{i.donor_name || "Anonymous"}</td>
                    <td className="px-4 py-3 text-zinc-600">{i.date}</td>
                    <td className="px-4 py-3 text-zinc-900">{i.project_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">৳{i.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {filteredIncomes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 italic">No records found matching that receipt number.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Recent Expenses</h2>
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Description</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Date</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {expenses.slice(0, 10).map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 text-zinc-900">{e.description}</td>
                    <td className="px-4 py-3 text-zinc-600">{e.date}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">৳{e.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token } = await api.login({ username, password });
      onLogin(token);
      navigate("/admin");
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-4">D</div>
          <h1 className="text-2xl font-bold text-zinc-900">Admin Login</h1>
          <p className="text-zinc-500">Access management dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<"income" | "expense" | "setup">("income");
  
  // Editing states
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [newCat, setNewCat] = useState("");
  const [newProject, setNewProject] = useState({ name: "", category_id: "", description: "" });
  const [newIncome, setNewIncome] = useState({ receipt_number: "", amount: "", project_id: "", donor_name: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [newExpense, setNewExpense] = useState({ amount: "", project_id: "", description: "", date: new Date().toISOString().split("T")[0] });

  const fetchData = async () => {
    const [c, p, i, e] = await Promise.all([
      api.getCategories(),
      api.getProjects(),
      api.getIncomes(),
      api.getExpenses()
    ]);
    setCategories(c);
    setProjects(p);
    setIncomes(i);
    setExpenses(e);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.updateCategory(editingId, newCat);
    } else {
      await api.addCategory(newCat);
    }
    setNewCat("");
    setEditingId(null);
    fetchData();
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.updateProject(editingId, newProject);
    } else {
      await api.addProject(newProject);
    }
    setNewProject({ name: "", category_id: "", description: "" });
    setEditingId(null);
    fetchData();
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...newIncome, amount: parseFloat(newIncome.amount) };
    if (editingId) {
      await api.updateIncome(editingId, data);
    } else {
      await api.addIncome(data);
    }
    setNewIncome({ receipt_number: "", amount: "", project_id: "", donor_name: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setEditingId(null);
    fetchData();
    alert(editingId ? "Income updated!" : "Income added!");
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...newExpense, amount: parseFloat(newExpense.amount) };
    if (editingId) {
      await api.updateExpense(editingId, data);
    } else {
      await api.addExpense(data);
    }
    setNewExpense({ amount: "", project_id: "", description: "", date: new Date().toISOString().split("T")[0] });
    setEditingId(null);
    fetchData();
    alert(editingId ? "Expense updated!" : "Expense added!");
  };

  const startEditCategory = (cat: Category) => {
    setEditingId(cat.id);
    setNewCat(cat.name);
    setActiveTab("setup");
  };

  const startEditProject = (proj: Project) => {
    setEditingId(proj.id);
    setNewProject({ name: proj.name, category_id: proj.category_id.toString(), description: proj.description });
    setActiveTab("setup");
  };

  const startEditIncome = (inc: Income) => {
    setEditingId(inc.id);
    setNewIncome({
      receipt_number: inc.receipt_number,
      amount: inc.amount.toString(),
      project_id: inc.project_id.toString(),
      donor_name: inc.donor_name || "",
      date: inc.date,
      notes: inc.notes
    });
    setActiveTab("income");
  };

  const startEditExpense = (exp: Expense) => {
    setEditingId(exp.id);
    setNewExpense({
      amount: exp.amount.toString(),
      project_id: exp.project_id.toString(),
      description: exp.description,
      date: exp.date
    });
    setActiveTab("expense");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        <div className="flex bg-zinc-100 p-1 rounded-lg">
          {(["income", "expense", "setup"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all",
                activeTab === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "income" && (
          <motion.div
            key="income"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <h2 className="text-lg font-bold mb-6">{editingId ? "Edit Income Record" : "Record New Income"}</h2>
              <form onSubmit={handleAddIncome} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={newIncome.receipt_number}
                    onChange={(e) => setNewIncome({ ...newIncome, receipt_number: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Project</label>
                  <select
                    value={newIncome.project_id}
                    onChange={(e) => setNewIncome({ ...newIncome, project_id: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Donor Name</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newIncome.donor_name}
                      onChange={(e) => setNewIncome({ ...newIncome, donor_name: e.target.value })}
                      placeholder="Enter name"
                      className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setNewIncome({ ...newIncome, donor_name: "নাম প্রকাশে অনুচ্ছুক" })}
                      className="px-3 py-2 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-lg border border-zinc-200 hover:bg-zinc-200 transition-colors"
                    >
                      Anonymous
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newIncome.date}
                    onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={newIncome.notes}
                    onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                  />
                </div>
                <div className="md:col-span-2 flex space-x-4">
                  <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors">
                    {editingId ? "Update Income Record" : "Save Income Record"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setNewIncome({ receipt_number: "", amount: "", project_id: "", donor_name: "", date: new Date().toISOString().split("T")[0], notes: "" });
                      }}
                      className="px-6 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <h2 className="text-lg font-bold mb-6">Income History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-zinc-700">Receipt</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700">Donor</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Amount</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {incomes.map((i) => (
                      <tr key={i.id}>
                        <td className="px-4 py-3 font-mono text-xs">{i.receipt_number}</td>
                        <td className="px-4 py-3">{i.donor_name || "Anonymous"}</td>
                        <td className="px-4 py-3 text-right font-bold">৳{i.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => startEditIncome(i)} className="p-1.5 text-zinc-400 hover:text-emerald-600 transition-colors">
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "expense" && (
          <motion.div
            key="expense"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <h2 className="text-lg font-bold mb-6">{editingId ? "Edit Expense Record" : "Record New Expense"}</h2>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Project</label>
                  <select
                    value={newExpense.project_id}
                    onChange={(e) => setNewExpense({ ...newExpense, project_id: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                  <textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex space-x-4">
                  <button type="submit" className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors">
                    {editingId ? "Update Expense Record" : "Save Expense Record"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setNewExpense({ amount: "", project_id: "", description: "", date: new Date().toISOString().split("T")[0] });
                      }}
                      className="px-6 py-3 bg-zinc-100 text-zinc-600 font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <h2 className="text-lg font-bold mb-6">Expense History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-zinc-700">Description</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700">Date</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Amount</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3">{e.description}</td>
                        <td className="px-4 py-3">{e.date}</td>
                        <td className="px-4 py-3 text-right font-bold">৳{e.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => startEditExpense(e)} className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors">
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <h2 className="text-lg font-bold mb-6">{editingId ? "Edit Category" : "Manage Categories"}</h2>
              <form onSubmit={handleAddCategory} className="flex space-x-4 mb-6">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Sadaqah)"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button type="submit" className="bg-zinc-900 text-white px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
                  {editingId ? "Update" : "Add"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setNewCat("");
                    }}
                    className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </form>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center space-x-2 px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-full text-sm text-zinc-700">
                    <span>{c.name}</span>
                    <button onClick={() => startEditCategory(c)} className="text-zinc-400 hover:text-zinc-900">
                      <Pencil size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <h2 className="text-lg font-bold mb-6">{editingId ? "Edit Project" : "Manage Projects"}</h2>
              <form onSubmit={handleAddProject} className="space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <select
                    value={newProject.category_id}
                    onChange={(e) => setNewProject({ ...newProject, category_id: e.target.value })}
                    className="px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                />
                <div className="flex space-x-4">
                  <button type="submit" className="flex-1 bg-zinc-900 text-white font-bold py-2 rounded-lg hover:bg-zinc-800 transition-colors">
                    {editingId ? "Update Project" : "Create Project"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setNewProject({ name: "", category_id: "", description: "" });
                      }}
                      className="px-6 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              <div className="space-y-3">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-zinc-900">{p.name}</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">{p.category_name}</p>
                    </div>
                    <button onClick={() => startEditProject(p)} className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors">
                      <Pencil size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem("admin_token"));

  const handleLogin = (token: string) => {
    localStorage.setItem("admin_token", token);
    setIsAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAdmin(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <Navbar isAdmin={isAdmin} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/" element={<TransparencyPage />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route
              path="/admin"
              element={isAdmin ? <AdminPanel /> : <LoginPage onLogin={handleLogin} />}
            />
          </Routes>
        </main>
        <footer className="py-12 border-t border-zinc-200 mt-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white text-xs font-bold">D</div>
              <span className="font-bold text-zinc-900 tracking-tight">DonationTrust</span>
            </div>
            <p className="text-zinc-500 text-sm">Built for transparency and accountability in charitable giving.</p>
            <div className="mt-4 flex justify-center space-x-4 text-zinc-400">
              <Info size={16} />
              <span className="text-xs">Data is updated in real-time from our verified records.</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
