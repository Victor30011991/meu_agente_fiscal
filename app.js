let db = JSON.parse(localStorage.getItem('fluxopro_db')) || {
    config: { nome: '', doc: '', logo: '' },
    entries: []
};

let activeCharts = {};

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    renderTable();
    initImport();
});

// NAVEGAÇÃO
function switchTab(tab) {
    document.querySelectorAll('.tab-content, .nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('btn-' + tab).classList.add('active');
    if(tab === 'dash') renderAllCharts();
}

// CRUD
document.getElementById('form-entry').onsubmit = (e) => {
    e.preventDefault();
    const entry = {
        id: Date.now(),
        data: document.getElementById('f-data').value,
        tipo: document.getElementById('f-tipo').value,
        dest: document.getElementById('f-dest').value,
        valor: parseFloat(document.getElementById('f-valor').value),
        categoria: document.getElementById('f-cat').value || 'Geral',
        obs: document.getElementById('f-obs').value
    };
    db.entries.push(entry);
    save();
    closeModal('modal-entry');
    e.target.reset();
};

function renderTable() {
    const corpo = document.getElementById('lista-corpo');
    corpo.innerHTML = db.entries.sort((a,b) => new Date(b.data) - new Date(a.data)).map(e => `
        <tr>
            <td>${e.data.split('-').reverse().join('/')}</td>
            <td><span class="badge">${e.dest}</span></td>
            <td>${e.categoria}</td>
            <td style="color:${e.tipo === 'Entrada' ? 'green' : 'red'}">R$ ${e.valor.toFixed(2)}</td>
            <td>${e.obs || '-'}</td>
            <td>
                <button onclick="deleteEntry(${e.id})">🗑️</button>
                <button onclick="duplicateEntry(${e.id})">📋</button>
            </td>
        </tr>
    `).join('');
}

// DASHBOARDS (3 VERSÕES)
function renderAllCharts() {
    const entries = db.entries;
    
    // 1. Visão Geral
    const inSum = entries.filter(e => e.tipo === 'Entrada').reduce((a,b) => a + b.valor, 0);
    const outSum = entries.filter(e => e.tipo === 'Saída').reduce((a,b) => a + b.valor, 0);
    createChart('chartGeral', 'doughnut', ['Entradas', 'Saídas'], [inSum, outSum]);

    // 2. Visão Fiscal MEI
    const faturamentoMei = entries.filter(e => e.dest === 'Empresa' && e.tipo === 'Entrada').reduce((a,b) => a + b.valor, 0);
    const limite = 81000;
    const alertBox = document.getElementById('mei-status');
    alertBox.innerHTML = faturamentoMei > limite * 0.8 ? `<p style="color:red">⚠️ Limite MEI Próximo!</p>` : '';
    createChart('chartMei', 'bar', ['Faturado', 'Limite Anual'], [faturamentoMei, limite]);

    // 3. Categorias
    const cats = [...new Set(entries.map(e => e.categoria))];
    const catData = cats.map(c => entries.filter(e => e.categoria === c).reduce((a,b) => a + b.valor, 0));
    createChart('chartCategorias', 'pie', cats, catData);
}

function createChart(id, type, labels, data) {
    if(activeCharts[id]) activeCharts[id].destroy();
    activeCharts[id] = new Chart(document.getElementById(id), {
        type: type,
        data: { labels, datasets: [{ data, backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// EXPORTAÇÃO PROFISSIONAL
function openExportModal() { document.getElementById('modal-export').style.display = 'flex'; }

async function generateExport(type) {
    const filtro = document.getElementById('exp-filtro').value;
    const data = filtro === 'Tudo' ? db.entries : db.entries.filter(e => e.dest === filtro);

    if(type === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Capa do Relatório
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255);
        doc.setFontSize(22);
        doc.text("FluxoPro Brasil - Relatório Profissional", 15, 25);
        
        // Conteúdo
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`Proprietário: ${db.config.nome || 'N/A'}`, 15, 50);
        doc.text(`Filtro Aplicado: ${filtro}`, 15, 57);

        const rows = data.map(e => [e.data, e.dest, e.categoria, `R$ ${e.valor.toFixed(2)}`]);
        doc.autoTable({ head: [['Data', 'Destino', 'Categoria', 'Valor']], body: rows, startY: 65 });

        // Adiciona Dashboard no PDF (Página 2)
        doc.addPage();
        doc.text("Dashboard Consolidado do Período", 15, 20);
        const chartImg = document.getElementById('chartGeral').toDataURL('image/png');
        doc.addImage(chartImg, 'PNG', 15, 30, 180, 100);

        doc.save(`Relatorio_FluxoPro_${filtro}.pdf`);
    } else {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
        XLSX.writeFile(wb, `FluxoPro_${filtro}.xlsx`);
    }
}

// UTILITÁRIOS
function save() { localStorage.setItem('fluxopro_db', JSON.stringify(db)); renderTable(); }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function deleteEntry(id) { if(confirm("Excluir?")) { db.entries = db.entries.filter(e => e.id !== id); save(); } }
function saveConfig() {
    db.config.nome = document.getElementById('conf-nome').value;
    db.config.doc = document.getElementById('conf-doc').value;
    save();
    alert("Configurações salvas!");
}
function loadProfile() {
    document.getElementById('conf-nome').value = db.config.nome;
    document.getElementById('conf-doc').value = db.config.doc;
}
function initImport() {
    document.getElementById('import-db').onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => { db = JSON.parse(ev.target.result); save(); location.reload(); };
        reader.readAsText(e.target.files[0]);
    };
}
