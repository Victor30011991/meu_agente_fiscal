let db = JSON.parse(localStorage.getItem('fluxopro_vfinal')) || {
    config: { nome: 'Minha Empresa', logo: '', theme: 'default' },
    entries: []
};

let charts = {};

// Inicialização
window.onload = () => {
    applyConfig();
    renderTable();
    initImport();
};

function switchTab(tab) {
    document.querySelectorAll('.tab-content, .nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`btn-${tab}`).classList.add('active');
    if(tab === 'dash') renderDashboards();
}

// CRUD Core
document.getElementById('entry-form').onsubmit = (e) => {
    e.preventDefault();
    const entry = {
        id: Date.now(),
        data: document.getElementById('f-date').value,
        tipo: document.getElementById('f-tipo').value,
        dest: document.getElementById('f-dest').value,
        valor: parseFloat(document.getElementById('f-valor').value),
        categoria: document.getElementById('f-cat').value || 'Diversos'
    };
    db.entries.push(entry);
    save();
    closeModal('modal-entry');
    renderTable();
    e.target.reset();
};

function renderTable() {
    const filter = document.getElementById('filter-dest').value;
    const filtered = filter === 'todos' ? db.entries : db.entries.filter(e => e.dest === filter);
    
    document.getElementById('table-body').innerHTML = filtered.sort((a,b) => new Date(b.data) - new Date(a.data)).map(e => `
        <tr>
            <td>${e.data.split('-').reverse().join('/')}</td>
            <td><span class="badge ${e.dest}">${e.dest}</span></td>
            <td>${e.categoria}</td>
            <td style="color:${e.tipo === 'Entrada' ? '#10b981' : '#ef4444'}">R$ ${e.valor.toFixed(2)}</td>
            <td>
                <button onclick="deleteEntry(${e.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Motores de Dashboards (3 versões)
function renderDashboards() {
    const entries = db.entries;
    
    // 1. Geral
    const inG = entries.filter(e => e.tipo === 'Entrada').reduce((a,b) => a+b.valor, 0);
    const outG = entries.filter(e => e.tipo === 'Saída').reduce((a,b) => a+b.valor, 0);
    updateChart('chartGeral', 'doughnut', ['Entradas', 'Saídas'], [inG, outG]);

    // 2. MEI Fiscal
    const faturadoMei = entries.filter(e => e.dest === 'Empresa' && e.tipo === 'Entrada').reduce((a,b) => a+b.valor, 0);
    const limite = 81000;
    const resto = Math.max(0, limite - faturadoMei);
    updateChart('chartMei', 'bar', ['Consumido', 'Disponível'], [faturadoMei, resto]);
    
    document.getElementById('mei-alert-container').innerHTML = faturadoMei > (limite * 0.8) ? 
        `<div style="color:red; font-weight:bold; margin-bottom:10px;">⚠️ ALERTA: 80% do limite MEI atingido!</div>` : '';

    // 3. Categorias
    const cats = [...new Set(entries.map(e => e.categoria))];
    const catData = cats.map(c => entries.filter(e => e.categoria === c).reduce((a,b) => a+b.valor, 0));
    updateChart('chartCats', 'pie', cats, catData);
}

function updateChart(id, type, labels, data) {
    if(charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), {
        type: type,
        data: { labels, datasets: [{ data, backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Exportação Profissional (PDF & Excel)
async function exportData(format) {
    if(format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255);
        doc.setFontSize(20);
        doc.text(db.config.nome, 15, 25);
        
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text("Relatório Gerencial de Fluxo de Caixa", 15, 50);

        const rows = db.entries.map(e => [e.data, e.dest, e.categoria, `R$ ${e.valor.toFixed(2)}`]);
        doc.autoTable({ head: [['Data', 'Conta', 'Categoria', 'Valor']], body: rows, startY: 60 });

        // Nova Página: Dashboard do Relatório
        doc.addPage();
        doc.text("Dashboard Consolidado", 15, 20);
        const chartImg = document.getElementById('chartGeral').toDataURL('image/png');
        doc.addImage(chartImg, 'PNG', 15, 30, 180, 100);

        doc.save("Relatorio_FluxoPro.pdf");
    } else {
        const ws = XLSX.utils.json_to_sheet(db.entries);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
        XLSX.writeFile(wb, "Financeiro_FluxoPro.xlsx");
    }
}

// Configurações e Persistência
function save() { localStorage.setItem('fluxopro_vfinal', JSON.stringify(db)); }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openExportModal() { openModal('modal-export'); }

function saveConfig() {
    db.config.nome = document.getElementById('conf-nome').value;
    save();
    location.reload();
}

function applyConfig() {
    document.body.setAttribute('data-theme', db.config.theme);
    document.getElementById('conf-nome').value = db.config.nome;
    document.getElementById('app-title').innerHTML = `${db.config.nome} <span>Brasil</span>`;
    if(db.config.logo) {
        document.getElementById('display-logo').src = db.config.logo;
        document.getElementById('display-logo').style.display = 'block';
    }
}

function handleLogo(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        db.config.logo = e.target.result;
        save();
        applyConfig();
    };
    reader.readAsDataURL(input.files[0]);
}

function initImport() {
    document.getElementById('universal-import').onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            if(file.name.endsWith('.json')) {
                db.entries = JSON.parse(ev.target.result).entries || JSON.parse(ev.target.result);
                save(); renderTable();
            }
        };
        reader.readAsText(file);
    };
}
function deleteEntry(id) { if(confirm("Remover lançamento?")) { db.entries = db.entries.filter(e => e.id !== id); save(); renderTable(); } }
function clearAllData() { if(confirm("APAGAR TUDO?")) { localStorage.clear(); location.reload(); } }
