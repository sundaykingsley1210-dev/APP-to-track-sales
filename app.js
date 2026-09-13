// ===== ADMIN DEFAULT ACCOUNT =====
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';

// ===== INIT DATA =====
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let deferredPrompt = null;

// Seed admin if no users exist
if (users.length === 0) {
    users.push({
        id: '1',
        name: 'Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin'
    });
    localStorage.setItem('users', JSON.stringify(users));
}

// ===== DOM ELEMENTS =====
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const appContent = document.getElementById('appContent');
const loggedUser = document.getElementById('loggedUser');
const logoutBtn = document.getElementById('logoutBtn');
const adminPanel = document.getElementById('adminPanel');
const registerForm = document.getElementById('registerForm');
const registerMsg = document.getElementById('registerMsg');
const userList = document.getElementById('userList');
const modal = document.getElementById('modal');
const installBtn = document.getElementById('installBtn');
const heroInstallBtn = document.getElementById('heroInstallBtn');
const mobileInstallBar = document.getElementById('mobileInstallBar');
const mobileInstallBtn = document.getElementById('mobileInstallBtn');
const mobileInstallClose = document.getElementById('mobileInstallClose');
const addSaleBtn = document.getElementById('addSaleBtn');
const closeBtn = document.querySelector('.close');
const saleForm = document.getElementById('saleForm');
const salesBody = document.getElementById('salesBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const noSales = document.getElementById('noSales');

// ===== LOGIN =====
function checkLogin() {
    if (currentUser) {
        loginOverlay.classList.remove('show');
        appContent.style.display = 'block';
        loggedUser.textContent = `${currentUser.name} (${currentUser.role})`;
        if (currentUser.role === 'admin') {
            adminPanel.style.display = 'block';
            renderUserList();
        } else {
            adminPanel.style.display = 'none';
        }
        renderSales();
        showMobileInstall();
    } else {
        loginOverlay.classList.add('show');
        appContent.style.display = 'none';
    }
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loginError.style.display = 'none';
        checkLogin();
    } else {
        loginError.style.display = 'block';
        loginError.textContent = 'Invalid email or password';
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    checkLogin();
});

// ===== ADMIN: REGISTER USER =====
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    if (users.find(u => u.email.toLowerCase() === email)) {
        registerMsg.style.color = '#e74c3c';
        registerMsg.textContent = 'Email already registered';
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    registerMsg.style.color = '#11998e';
    registerMsg.textContent = `User "${name}" registered successfully!`;
    registerForm.reset();
    renderUserList();
});

function renderUserList() {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="user-info">
                <span class="name">${escapeHtml(user.name)}</span>
                <span class="email">${escapeHtml(user.email)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="user-role ${user.role === 'admin' ? 'role-admin' : 'role-user'}">${user.role}</span>
                ${user.email !== ADMIN_EMAIL ? `<button class="btn btn-danger" onclick="deleteUser('${user.id}')">Remove</button>` : ''}
            </div>
        `;
        userList.appendChild(li);
    });
}

function deleteUser(id) {
    if (!confirm('Remove this user?')) return;
    users = users.filter(u => u.id !== id);
    localStorage.setItem('users', JSON.stringify(users));
    renderUserList();
}

function showAdminTab(tab) {
    document.getElementById('adminRegister').classList.toggle('active', tab === 'register');
    document.getElementById('adminUsers').classList.toggle('active', tab === 'users');
}

// ===== MOBILE INSTALL BAR =====
function showMobileInstall() {
    if (window.innerWidth <= 768) {
        const dismissed = localStorage.getItem('mobileInstallDismissed');
        if (!dismissed) {
            mobileInstallBar.classList.add('show');
        }
    }
}

mobileInstallClose.addEventListener('click', () => {
    mobileInstallBar.classList.remove('show');
    localStorage.setItem('mobileInstallDismissed', 'true');
});

// ===== PWA INSTALL =====
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
    heroInstallBtn.classList.add('available');
});

async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        installBtn.style.display = 'none';
        heroInstallBtn.textContent = '✅ Installed!';
        heroInstallBtn.classList.add('installed');
        mobileInstallBar.classList.remove('show');
    }
    deferredPrompt = null;
}

installBtn.addEventListener('click', handleInstall);
heroInstallBtn.addEventListener('click', handleInstall);
mobileInstallBtn.addEventListener('click', handleInstall);

window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
    heroInstallBtn.textContent = '✅ Installed!';
    heroInstallBtn.classList.add('installed');
    mobileInstallBar.classList.remove('show');
    deferredPrompt = null;
});

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('SW registration failed:', err));
}

// ===== SALES CRUD =====
addSaleBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add Sale';
    saleForm.reset();
    document.getElementById('saleId').value = '';
    document.getElementById('saleDate').valueAsDate = new Date();
    modal.style.display = 'block';
});

closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

saleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('saleId').value;
    const sale = {
        id: id || Date.now().toString(),
        date: document.getElementById('saleDate').value,
        customer: document.getElementById('customer').value,
        product: document.getElementById('product').value,
        amount: parseFloat(document.getElementById('amount').value),
        status: document.getElementById('status').value,
        addedBy: currentUser ? currentUser.email : 'unknown'
    };

    if (id) {
        const index = sales.findIndex(s => s.id === id);
        sales[index] = sale;
    } else {
        sales.push(sale);
    }

    localStorage.setItem('sales', JSON.stringify(sales));
    modal.style.display = 'none';
    renderSales();
});

searchInput.addEventListener('input', renderSales);
statusFilter.addEventListener('change', renderSales);

function renderSales() {
    const search = searchInput.value.toLowerCase();
    const status = statusFilter.value;

    let filtered = sales.filter(sale => {
        const matchSearch = sale.customer.toLowerCase().includes(search) ||
                           sale.product.toLowerCase().includes(search);
        const matchStatus = status === 'all' || sale.status === status;
        return matchSearch && matchStatus;
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    salesBody.innerHTML = '';

    if (filtered.length === 0) {
        noSales.style.display = 'block';
    } else {
        noSales.style.display = 'none';
        filtered.forEach(sale => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(sale.date)}</td>
                <td>${escapeHtml(sale.customer)}</td>
                <td>${escapeHtml(sale.product)}</td>
                <td>₦${sale.amount.toFixed(2)}</td>
                <td><span class="status status-${sale.status.toLowerCase()}">${sale.status}</span></td>
                <td class="actions">
                    <button class="btn btn-edit" onclick="editSale('${sale.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteSale('${sale.id}')">Delete</button>
                </td>
            `;
            salesBody.appendChild(tr);
        });
    }

    updateDashboard();
}

function updateDashboard() {
    const total = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const pending = sales.filter(s => s.status === 'Pending').length;
    const avg = sales.length > 0 ? total / sales.length : 0;

    document.getElementById('totalSales').textContent = `₦${total.toFixed(2)}`;
    document.getElementById('totalCount').textContent = sales.length;
    document.getElementById('avgSale').textContent = `₦${avg.toFixed(2)}`;
    document.getElementById('pendingCount').textContent = pending;
}

function editSale(id) {
    const sale = sales.find(s => s.id === id);
    document.getElementById('modalTitle').textContent = 'Edit Sale';
    document.getElementById('saleId').value = sale.id;
    document.getElementById('saleDate').value = sale.date;
    document.getElementById('customer').value = sale.customer;
    document.getElementById('product').value = sale.product;
    document.getElementById('amount').value = sale.amount;
    document.getElementById('status').value = sale.status;
    modal.style.display = 'block';
}

function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale?')) {
        sales = sales.filter(s => s.id !== id);
        localStorage.setItem('sales', JSON.stringify(sales));
        renderSales();
    }
}

function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== INIT =====
checkLogin();
