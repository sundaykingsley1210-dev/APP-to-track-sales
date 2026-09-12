let deferredPrompt;
let sales = JSON.parse(localStorage.getItem('sales')) || [];

const modal = document.getElementById('modal');
const installBtn = document.getElementById('installBtn');
const heroInstallBtn = document.getElementById('heroInstallBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
    heroInstallBtn.classList.add('available');
});

async function handleInstall() {
    if (!deferredPrompt) {
        window.open('https://app-to-track-sales.vercel.app', '_blank');
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        installBtn.style.display = 'none';
        heroInstallBtn.textContent = '✅ Installed!';
        heroInstallBtn.classList.add('installed');
    }
    deferredPrompt = null;
}

installBtn.addEventListener('click', handleInstall);
heroInstallBtn.addEventListener('click', handleInstall);

window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
    heroInstallBtn.textContent = '✅ Installed!';
    heroInstallBtn.classList.add('installed');
    deferredPrompt = null;
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('SW registration failed:', err));
}
const addSaleBtn = document.getElementById('addSaleBtn');
const closeBtn = document.querySelector('.close');
const saleForm = document.getElementById('saleForm');
const salesBody = document.getElementById('salesBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const noSales = document.getElementById('noSales');

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
        status: document.getElementById('status').value
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
    const completed = sales.filter(s => s.status === 'Completed').length;
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

renderSales();
