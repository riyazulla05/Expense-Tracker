// ✅ Redirect to login if not logged in
const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!loggedInUser) {
    window.location.href = 'login.html';
}

// ✅ Display logged-in user's name
document.getElementById('usernameDisplay').textContent = `Welcome, ${loggedInUser.name}!`;

// Global variables
let expenses = [];
let budget = 0;
let currentCurrency = 'USD';
let chart = null;

const userEmail = loggedInUser.email; // unique user key
const userKey = `expenseData_${userEmail}`;

const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
    CNY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr', SEK: 'kr'
};

// ✅ Load data for this user
function loadData() {
    const data = JSON.parse(localStorage.getItem(userKey)) || {};
    expenses = data.expenses || [];
    budget = data.budget || 0;
    currentCurrency = data.currency || 'USD';
    document.getElementById('currency').value = currentCurrency;
}

// ✅ Save data for this user
function saveData() {
    const data = { expenses, budget, currency: currentCurrency };
    localStorage.setItem(userKey, JSON.stringify(data));
}

// ✅ Format currency
function formatCurrency(amount) {
    const symbol = currencySymbols[currentCurrency];
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
}

// Set today's date
document.getElementById('date').valueAsDate = new Date();

// ✅ Currency change
document.getElementById('currency').addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    saveData();
    updateDashboard();
    displayExpenses();
});

// ✅ Add expense
document.getElementById('expenseForm').addEventListener('submit', (e) => {
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

// ✅ Set budget
document.getElementById('budgetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    budget = parseFloat(document.getElementById('budget').value);
    saveData();
    updateDashboard();
});

// ✅ Delete expense
function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveData();
    updateDashboard();
    displayExpenses();
    updateChart();
}

// ✅ Update dashboard
function updateDashboard() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget - total;

    document.getElementById('totalExpenses').textContent = formatCurrency(total);
    document.getElementById('budgetAmount').textContent = formatCurrency(budget);
    document.getElementById('remainingAmount').textContent = formatCurrency(remaining);
    document.getElementById('remainingAmount').style.color =
        remaining < 0 ? 'var(--danger)' : 'var(--success)';
}

// ✅ Display expenses
function displayExpenses() {
    const list = document.getElementById('expensesList');

    if (expenses.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No expenses yet. Add your first expense above!</p>
            </div>
        `;
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

// ✅ Chart visualization
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

// ✅ Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
});

// ✅ Initialize on page load
loadData();
updateDashboard();
displayExpenses();
updateChart();
