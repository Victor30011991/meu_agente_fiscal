let db = JSON.parse(localStorage.getItem('fluxopro_db')) || { 
    profile: {nome: '', doc: '', theme: '#2563eb'}, 
    entries: [] 
};

let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    renderTable();
    initImportListener();
});

// Correção do erro "undefined" nos campos
function loadProfile() {
    document.getElementById('conf-nome').value = db.profile.nome || "";
    document.getElementById('conf-doc').value = db.profile.doc || "";
    applyTheme(db.profile.theme || "#2563eb");
}

function applyTheme(color) { document.documentElement.style.setProperty('--primary', color); }

// EXCEL: Design e Correção de ID científico
function exportExcel() {
    const dataToExport = db.entries.map(e => ({
        Data: e.data.split('-').reverse().join('/'),
        Tipo: e.tipo,
        Categoria: e.categoria,
        Valor: `R$ ${e.valor.toFixed(2)}`,
        Observacao: e.obs || ""
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    
    // Auto-ajuste de colunas
    ws['!cols'] = [{wch: 12}, {wch: 10}, {wch: 18}, {wch: 15}, {wch: 25}];
    
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, "Relatorio_FluxoPro.xlsx");
}

// PDF: Design Profissional com 2 Páginas
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const color = db.profile.theme || '#2563eb';

    // Pág 1: Tabela estilizada
    doc.setFillColor(color);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255);
    doc.setFontSize(22);
    doc.text("FLUXOPRO BRASIL", 14, 22);
    doc.setFontSize(10);
    doc.text(`Usuário: ${db.profile.nome || "Não cadastrado"}`, 14, 30);

    const rows = db.entries.map(e => [e.data, e.tipo, e.categoria, e.valor.toFixed(2), e.obs]);
    doc.autoTable({
        head: [['Data', 'Tipo', 'Categoria', 'Valor', 'Obs']],
        body: rows,
        startY: 40,
        headStyles: { fillColor: color }
    });

    // Pág 2: Dashboards
    updateDashboards();
    setTimeout(() => {
        const canvas = document.getElementById('chartCategorias');
        const imgData = canvas.toDataURL('image/png');
        doc.addPage();
        doc.setTextColor(0);
        doc.text("ANÁLISE DE DESEMPENHO", 14, 20);
        doc.addImage(imgData, 'PNG', 15, 35, 180, 90);
        doc.save("Relatorio_Profissional.pdf");
    }, 500);
}

// 3 Tipos de Dashboards
function updateDashboards() {
    const ctx1 = document.getElementById('chartCategorias').getContext('2d');
    const ctx2 = document.getElementById('chartFluxo').getContext('2d');
    const ctx3 = document.getElementById('chartPizza').getContext('2d');

    const cats = [...new Set(db.entries.map(e => e.categoria))];
    const vals = cats.map(c => db.entries.filter(e => e.categoria === c).reduce((a, b) => a + b.valor, 0));

    if(charts.c1) charts.c1.destroy();
    charts.c1 = new Chart(ctx1, { type: 'bar', data: { labels: cats, datasets: [{ label: 'R$', data: vals, backgroundColor: db.profile.theme }] }});

    if(charts.c2) charts.c2.destroy();
    charts.c2 = new Chart(ctx2, { type: 'line', data: { labels: cats, datasets: [{ label: 'Tendência', data: vals, borderColor: db.profile.theme, fill: true }] }});

    if(charts.c3) charts.c3.destroy();
    charts.c3 = new Chart(ctx3, { type: 'pie', data: { labels: cats, datasets: [{ data: vals, backgroundColor: ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'] }] }});
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content, .nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('btn-' + tab).classList.add('active');
    if(tab === 'dash') updateDashboards();
}

function renderTable() {
    const corpo = document.getElementById('lista-corpo');
    let tin = 0, tout = 0;
    corpo.innerHTML = db.entries.map(e => {
        if(e.tipo === 'Entrada') tin += e.valor; else tout += e.valor;
        return `<tr><td>${e.data}</td><td>${e.tipo}</td><td>${e.categoria}</td><td>R$ ${e.valor.toFixed(2)}</td><td>${e.obs}</td><td><button onclick="deleteEntry(${e.id})">🗑️</button></td></tr>`;
    }).join('');
    document.getElementById('mini-entradas').innerText = `R$ ${tin.toFixed(2)}`;
    document.getElementById('mini-saidas').innerText = `R$ ${tout.toFixed(2)}`;
    document.getElementById('mini-balanco').innerText = `R$ ${(tin - tout).toFixed(2)}`;
}

function save() { localStorage.setItem('fluxopro_db', JSON.stringify(db)); renderTable(); }
function deleteEntry(id) { if(confirm("Apagar?")) { db.entries = db.entries.filter(e => e.id !== id); save(); } }
function openModal() { document.getElementById('modal-entry').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-entry').style.display = 'none'; }
function saveConfig() { db.profile.nome = document.getElementById('conf-nome').value; db.profile.doc = document.getElementById('conf-doc').value; save(); alert("Salvo!"); }

function initImportListener() {
    const input = document.getElementById('import-db-input');
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => { db = JSON.parse(ev.target.result); save(); loadProfile(); };
        reader.readAsText(e.target.files[0]);
    };
}
