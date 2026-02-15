// --- CONFIGURAÇÃO INICIAL (O Agente Contábil) ---
const CATEGORIAS = [
    "Alimentação", "Combustível", "Transporte", "Moradia", "Energia elétrica", 
    "Água", "Internet", "Telefone", "Aluguel", "Contador", "Impostos", 
    "DAS (MEI)", "Investimentos", "Lazer", "Educação", "Saúde", "Manutenção", 
    "Marketing", "Compras para revenda", "Equipamentos", "Softwares / Assinaturas", 
    "Serviços terceirizados", "Taxas bancárias", "Outros"
];

const LIMITE_MEI_ANUAL = 81000.00;

let db = JSON.parse(localStorage.getItem('fluxopro_db')) || {
    profile: { type: 'PF', name: '', id: '', logo: '' },
    entries: []
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    populateCategories();
    renderProfile();
    renderTable();
    updateDashboard();
    initCharts();
});

// --- AGENTE FISCAL & PERFIL ---
function saveProfile() {
    db.profile.type = document.getElementById('user-type').value;
    db.profile.name = document.getElementById('user-name').value;
    db.profile.id = document.getElementById('user-id').value;
    saveDB();
    alert("Perfil atualizado!");
    updateDashboard();
}

function uploadLogo(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        db.profile.logo = reader.result;
        saveDB();
        renderProfile();
    };
    reader.readAsDataURL(file);
}

function renderProfile() {
    const logoImg = document.getElementById('display-logo');
    if (db.profile.logo) {
        logoImg.src = db.profile.logo;
        logoImg.style.display = 'block';
    }
    document.getElementById('user-type').value = db.profile.type;
    document.getElementById('user-name').value = db.profile.name;
    document.getElementById('user-id').value = db.profile.id;
}

// --- CRUD DE LANÇAMENTOS ---
const entryForm = document.getElementById('entry-form');
entryForm.onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('entry-id').value;
    const date = document.getElementById('field-date').value;
    
    const entry = {
        id: id || Date.now().toString(),
        date: date,
        month: date.substring(0, 7),
        year: date.substring(0, 4),
        type: document.getElementById('field-type').value,
        destinacao: document.getElementById('field-dest').value,
        category: document.getElementById('field-cat').value,
        value: parseFloat(document.getElementById('field-val').value),
        obs: document.getElementById('field-obs').value
    };

    if (id) {
        const index = db.entries.findIndex(en => en.id === id);
        db.entries[index] = entry;
    } else {
        db.entries.push(entry);
    }

    saveDB();
    closeModal();
    renderTable();
    updateDashboard();
};

function deleteEntry(id) {
    if (confirm("Deseja excluir este lançamento?")) {
        db.entries = db.entries.filter(e => e.id !== id);
        saveDB();
        renderTable();
        updateDashboard();
    }
}

function duplicateEntry(id) {
    const entry = db.entries.find(e => e.id === id);
    const newEntry = {...entry, id: Date.now().toString()};
    db.entries.push(newEntry);
    saveDB();
    renderTable();
    updateDashboard();
}

// --- AGENTE DE DASHBOARD E CÁLCULO MEI ---
function updateDashboard() {
    const filterMonth = document.getElementById('filter-month').value;
    const filterDest = document.getElementById('filter-dest').value;

    let filtered = db.entries;
    if (filterMonth) filtered = filtered.filter(e => e.month === filterMonth);
    if (filterDest !== 'todos') filtered = filtered.filter(e => e.destinacao.toLowerCase() === filterDest);

    const income = filtered.filter(e => e.type === 'Entrada').reduce((acc, e) => acc + e.value, 0);
    const expense = filtered.filter(e => e.type === 'Saída').reduce((acc, e) => acc + e.value, 0);

    document.getElementById('kpi-in').innerText = formatCurrency(income);
    document.getElementById('kpi-out').innerText = formatCurrency(expense);
    document.getElementById('kpi-total').innerText = formatCurrency(income - expense);

    // Lógica MEI (Calcula faturamento empresarial anual)
    const currentYear = new Date().getFullYear().toString();
    const fatAnualPJ = db.entries
        .filter(e => e.year === currentYear && e.destinacao === 'Empresarial' && e.type === 'Entrada')
        .reduce((acc, e) => acc + e.value, 0);

    const meiCard = document.getElementById('mei-card');
    if (db.profile.type === 'MEI') {
        meiCard.style.display = 'block';
        const percent = (fatAnualPJ / LIMITE_MEI_ANUAL) * 100;
        const restante = LIMITE_MEI_ANUAL - fatAnualPJ;
        
        document.getElementById('mei-progress-fill').style.width = Math.min(percent, 100) + '%';
        document.getElementById('mei-status').innerHTML = 
            `Faturado: ${formatCurrency(fatAnualPJ)}<br>` +
            (restante > 0 ? `Ainda pode faturar: <b>${formatCurrency(restante)}</b>` : `<b style="color:red">LIMITE ULTRAPASSADO!</b>`);
        
        if (percent > 80) document.getElementById('mei-progress-fill').style.background = '#dc2626';
    } else {
        meiCard.style.display = 'none';
    }
    
    updateCharts(filtered);
}

// --- EXPORTAÇÃO (AGENTE DE RELATÓRIOS) ---
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(db.entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
    XLSX.writeFile(wb, "FluxoPro_Relatorio.xlsx");
}

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório Financeiro - FluxoPro Brasil", 14, 15);
    
    const tableData = db.entries.map(e => [e.date, e.type, e.destinacao, e.category, e.value.toFixed(2)]);
    doc.autoTable({
        head: [['Data', 'Tipo', 'Destinação', 'Categoria', 'Valor (R$)']],
        body: tableData,
        startY: 25
    });
    doc.save("Relatorio_FluxoPro.pdf");
}

function downloadJSON() {
    const blob = new Blob([JSON.stringify(db)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_fluxopro_${Date.now()}.json`;
    a.click();
}

// --- AUXILIARES ---
function saveDB() { localStorage.setItem('fluxopro_db', JSON.stringify(db)); }
function formatCurrency(v) { return v.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }); }
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
}
function populateCategories() {
    const select = document.getElementById('field-cat');
    CATEGORIAS.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.innerText = cat; select.appendChild(opt);
    });
}
// (Demais funções de renderização de tabela e gráficos seguem a mesma lógica funcional...)
