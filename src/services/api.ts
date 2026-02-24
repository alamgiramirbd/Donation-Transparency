const getAuthHeader = () => {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  async getStats() {
    const res = await fetch("/api/stats");
    return res.json();
  },
  async login(credentials: any) {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    return res.json();
  },
  async getCategories() {
    const res = await fetch("/api/categories");
    return res.json();
  },
  async addCategory(name: string) {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
  async updateCategory(id: number, name: string) {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
  async getProjects() {
    const res = await fetch("/api/projects");
    return res.json();
  },
  async addProject(project: any) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(project),
    });
    return res.json();
  },
  async updateProject(id: number, project: any) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(project),
    });
    return res.json();
  },
  async getIncomes() {
    const res = await fetch("/api/incomes");
    return res.json();
  },
  async addIncome(income: any) {
    const res = await fetch("/api/incomes", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(income),
    });
    return res.json();
  },
  async updateIncome(id: number, income: any) {
    const res = await fetch(`/api/incomes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(income),
    });
    return res.json();
  },
  async getExpenses() {
    const res = await fetch("/api/expenses");
    return res.json();
  },
  async addExpense(expense: any) {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(expense),
    });
    return res.json();
  },
  async updateExpense(id: number, expense: any) {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(expense),
    });
    return res.json();
  },
};
