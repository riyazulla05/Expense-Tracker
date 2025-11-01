// ============================
// 🚀 Expense Tracker Script
// ============================

// Detect current page name (e.g. 'index.html', 'login.html')
const currentPage = window.location.pathname.split("/").pop();

// Retrieve logged-in user info
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

// ✅ Redirect rules
if (!loggedInUser && currentPage === 'index.html') {
  // Not logged in but trying to access dashboard
  window.location.href = 'login.html';
}

if (loggedInUser && (currentPage === 'login.html' || currentPage === 'signup.html')) {
  // Already logged in — redirect to dashboard
  window.location.href = 'index.html';
}

// ============================
// Run only if user is logged in (Dashboard Page)
// ============================
if (loggedInUser && currentPage === 'index.html') {
  // Display username at the top
  const usernameDisplay = document.getElementById('usernameDisplay');
  if (usernameDisplay) {
    usernameDisplay.textContent = `Welcome, ${loggedInUser.username}`;
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('loggedInUser');
      window.location.href = 'login.html';
    });
  }

  // ============================
  // 💰 Expense Tracker Logic
  // ============================

  const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
    CNY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr', SEK: 'kr'
  };

  const username = loggedInUser.username; // unique per user
  const expensesKey = `expenses_${username}`;
  const budgetKey = `budget_${username}`;
  const currencyKey = `currency_${username}`;

  let expenses = [];
  let budget = 0;
  let currentCurrency = 'USD';
  let chart = null;

  // --- Load user data ---
  function loadData() {
    const savedExpenses = localStorage.getItem(expensesKey);
    const savedBudget = localStorage.getItem(budgetKey);
    const savedCurrency = localStorage.getItem(currencyKey);

    if (savedExpenses) expenses = JSON.parse(savedExpenses);
    if (savedBudget) budget = parseFloat(savedBudget);
    if (savedCurrency) {
      currentCurrency = savedCurrency;
      const currencySelect = document.getElementById('currency');
      if (currencySelect) currencySelect.value = currentCurrency;
    }
  }

  // --- Save user data ---
  function saveData() {
    localStorage.setItem(expensesKey, JSON.stringify(expenses));
    localStorage.setItem(budgetKey, budget);
    localStorage.setItem(currencyKey, currentCurrency);
  }

  // --- Format currency ---
  function formatCurrency(amount) {
    const symbol = currencySymbols[currentCurrency] || '';
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
  }

  // --- Initialize today's date ---
  const dateInput = document.getElementById('date');
  if (dateInput) dateInput.valueAsDate = new Date();

  // --- Currency change ---
  const currencySelect = document.getElementById('currency');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      saveData();
      updateDashboard();
      displayExpenses();
    });
  }

  // --- Add Expense ---
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const expense = {
        id: Date.now(),
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value
      };

      expenses.unshift(expense);
      saveData();
      updateDashboard();
      displayExpenses();
      updateChart();

      e.target.reset();
      document.getElementById('date').valueAsDate = new Date();
    });
  }

  // --- Set Budget ---
  const budgetForm = document.getElementById('budgetForm');
  if (budgetForm) {
    budgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      budget = parseFloat(document.getElementById('budget').value);
      saveData();
      updateDashboard();
    });
  }

  // --- Delete Expense ---
  function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveData();
    updateDashboard();
    displayExpenses();
    updateChart();
  }

  // --- Update Dashboard ---
  function updateDashboard() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget - total;

    document.getElementById('totalExpenses').textContent = formatCurrency(total);
    document.getElementById('budgetAmount').textContent = formatCurrency(budget);
    document.getElementById('remainingAmount').textContent = formatCurrency(remaining);
    document.getElementById('remainingAmount').style.color =
      remaining < 0 ? 'var(--danger)' : 'var(--success)';
  }

  // --- Display Expenses ---
  function displayExpenses() {
    const list = document.getElementById('expensesList');
    if (!list) return;

    if (expenses.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No expenses yet. Add your first expense above!</p>
        </div>`;
      return;
    }

    list.innerHTML = expenses.map(exp => `
      <div class="expense-item">
        <div class="expense-info">
          <span class="expense-category category-${exp.category}">${exp.category}</span>
          <div class="expense-description">${exp.description}</div>
          <div class="expense-date">${new Date(exp.date).toLocaleDateString()}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <div class="expense-amount">${formatCurrency(exp.amount)}</div>
          <button class="btn btn-danger" onclick="deleteExpense(${exp.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // --- Update Chart ---
  function updateChart() {
    const categoryData = {};
    expenses.forEach(exp => {
      categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount;
    });

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (chart) chart.destroy();

    if (Object.keys(categoryData).length === 0) {
      ctx.font = '16px Inter';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No data to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
      return;
    }

    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryData).map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: [
            '#f59e0b', '#3b82f6', '#ec4899', '#10b981',
            '#ef4444', '#8b5cf6', '#6b7280'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12, weight: '600' } }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${formatCurrency(context.parsed)}`
            }
          }
        }
      }
    });
  }

  // --- Initialize ---
  loadData();
  updateDashboard();
  displayExpenses();
  updateChart();

  // Expose deleteExpense globally (for inline onclick)
  window.deleteExpense = deleteExpense;
}





