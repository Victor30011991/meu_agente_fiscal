/**
 * FLUXOPRO BRASIL - Lógica do Sistema
 */

// 1. Estado da Aplicação
let db = JSON.parse(localStorage.getItem('fluxopro_db')) || {
    config: { nome: '', doc: '', logo: '' },
    entries: []
};

let activeCharts = {};

// 2. Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadProfile();
    renderTable();
    initImportListener();
}

// 3. Controle de Interface (UI)
function switchTab(tabId) {
    // Gerenciar Botões
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${tabId}`).classList.add('active');

    // Gerenciar Telas
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    if (tabId === 'dash') renderAllCharts();
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// 4. Gestão de Dados (CRUD)
function save() {
    localStorage.setItem('fluxopro_db', JSON.stringify(db));
    renderTable();
}

const entryForm = document.getElementById('form-entry');
if (entryForm) {
    entryForm.onsubmit = (e) => {
        e.preventDefault();
        
        const newEntry = {
            id: Date.now(),
            data: document.getElementById('f-data').value,
            tipo: document.getElementById('f-tipo').value,
            dest: document.getElementById('f-dest').value,
            valor: parseFloat(document.getElementById('f-valor').value),
            categoria: document.getElementById('f-cat').value || 'Geral',
            obs: document.getElementById('f-obs').value
        };

        db.entries.push(newEntry);
        save();
        closeModal('modal-entry');
        e.target.reset();
    };
}

function renderTable() {
    const tableBody = document.getElementById('lista-corpo');
    if (!tableBody) return;

    tableBody.innerHTML = db.entries
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .map(entry => `
            <tr>
                <td>${formatDate(entry.data)}</td>
                <td><span class="badge">${entry.dest}</span></td>
                <td>${entry.categoria}</td>
                <td style="color: ${entry.tipo === 'Entrada' ? 'var(--success)' : 'var(--danger)'}; font-weight: 600">
                    R$ ${entry.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </td>
                <td><small>${entry.obs || '-'}</small></td>
                <td>
                    <button class="btn-icon" onclick="deleteEntry(${entry.id})" title="Excluir">🗑️</button>
                </td>
            </tr>
        `).join('');
}

// 5. Dashboards (Charts)
function renderAllCharts() {
    const entries = db.entries;
    
    // Gráfico de Fluxo (Entradas vs Saídas)
    const inSum = entries.filter(e => e.tipo === 'Entrada').reduce((acc, cur) => acc + cur.valor, 0);
    const outSum = entries.filter(e => e.tipo === 'Saída').reduce((acc, cur) => acc + cur.valor, 0);
    updateChart('chartGeral', 'doughnut', ['Entradas', 'Saídas'], [inSum, outSum]);

    // Gráfico MEI
    const faturamentoMei = entries
        .filter(e => e.dest === 'Empresa' && e.tipo === 'Entrada')
        .reduce((acc, cur) => acc + cur.valor, 0);
    
    const limiteMei = 81000;
    checkMeiStatus(faturamentoMei, limiteMei);
    updateChart('chartMei', 'bar', ['Faturado', 'Teto'], [faturamentoMei, limiteMei]);

    // Categorias
    const catMap = {};
    entries.forEach(e => {
        catMap[e.categoria] = (catMap[e.categoria] || 0) + e.valor;
    });
    updateChart('chartCategorias', 'pie', Object.keys(catMap), Object.values(catMap));
}

function updateChart(canvasId, type, labels, data) {
    if (activeCharts[canvasId]) activeCharts[canvasId].destroy();
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    activeCharts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 6. Funções Auxiliares
function formatDate(dateStr) {
    return dateStr.split('-').reverse().join('/');
}

function deleteEntry(id) {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
        db.entries = db.entries.filter(e => e.id !== id);
        save();
    }
}

function checkMeiStatus(atual, limite) {
    const alertDiv = document.getElementById('mei-status');
    if (atual > limite * 0.8) {
        alertDiv.innerHTML = `<div class="alert warning">Atenção: Você atingiu 80% do limite MEI!</div>`;
    } else {
        alertDiv.innerHTML = '';
    }
}

function saveConfig() {
    db.config.nome = document.getElementById('conf-nome').value;
    db.config.doc = document.getElementById('conf-doc').value;
    save();
    alert('Perfil atualizado com sucesso!');
}

function loadProfile() {
    document.getElementById('conf-nome').value = db.config.nome || '';
    document.getElementById('conf-doc').value = db.config.doc || '';
}

function initImportListener() {
    const importInput = document.getElementById('import-db');
    if (importInput) {
        importInput.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    db = JSON.parse(ev.target.result);
                    save();
                    location.reload();
                } catch (err) {
                    alert('Erro ao importar arquivo JSON.');
                }
            };
            reader.readAsText(file);
        };
    }
}
