let db = JSON.parse(localStorage.getItem('fluxopro_enterprise')) || {
    config: { nome: 'FluxoPro', theme: 'default' },
    entries: []
};

let activeCharts = {};

// 🔄 INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(db.config.theme);
    document.getElementById('theme-selector').value = db.config.theme;
    document.getElementById('conf-nome').value = db.config.nome;
    renderTable();
    initUniversalImport();
});

// 📑 CONTROLE DE ABAS (CORREÇÃO DA TELA ÚNICA)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
    
    if(tabId === 'dash') renderCharts();
}

// 🎨 GESTÃO DE TEMA
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    db.config.theme = theme;
    save();
}

// 📂 IMPORTAÇÃO UNIVERSAL (EXCEL / JSON)
function initUniversalImport() {
    const input = document.getElementById('universal-import');
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.onload = (evt) => {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet);
                
                // Mapeamento inteligente de colunas
                json.forEach(row => {
                    db.entries.push({
                        id: Date.now() + Math.random(),
                        data: row.Data || new Date().toISOString().split('T')[0],
                        tipo: row.Tipo || 'Saída',
                        categoria: row.Categoria || 'Importado',
                        valor: parseFloat(row.Valor) || 0,
                        dest: row.Destino || 'Empresa'
                    });
                });
                save();
                alert('Excel importado com sucesso!');
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (evt) => {
                const imported = JSON.parse(evt.target.result);
                db.entries = imported.entries || imported;
                save();
                location.reload();
            };
            reader.readAsText(file);
        }
    };
}

// 📥 EXPORTAÇÃO REAL (FIXED)
function openExportModal() { document.getElementById('modal-export').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function generateExport(type) {
    if (type === 'excel') {
        const ws = XLSX.utils.json_to_sheet(db.entries);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "FluxoFinanceiro");
        XLSX.writeFile(wb, `FluxoPro_Export_${Date.now()}.xlsx`);
    } else {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`Relatório: ${db.config.nome}`, 14, 20);
        const rows = db.entries.map(e => [e.data, e.tipo, e.categoria, e.valor.toFixed(2)]);
        doc.autoTable({ head: [['Data', 'Tipo', 'Categoria', 'Valor']], body: rows, startY: 30 });
        doc.save("FluxoPro_Relatorio.pdf");
    }
    closeModal('modal-export');
}

// 📊 DASHBOARDS
function renderCharts() {
    const ctx1 = document.getElementById('chartGeral').getContext('2d');
    const inSum = db.entries.filter(e => e.tipo === 'Entrada').reduce((a,b) => a+b.valor, 0);
    const outSum = db.entries.filter(e => e.tipo === 'Saída').reduce((a,b) => a+b.valor, 0);

    if(activeCharts.c1) activeCharts.c1.destroy();
    activeCharts.c1 = new Chart(ctx1, {
        type: 'doughnut',
        data: { labels: ['Entradas', 'Saídas'], datasets: [{ data: [inSum, outSum], backgroundColor: ['#10b981', '#ef4444'] }] }
    });
}

function save() { localStorage.setItem('fluxopro_enterprise', JSON.stringify(db)); renderTable(); }
function renderTable() {
    const corpo = document.getElementById('lista-corpo');
    corpo.innerHTML = db.entries.map(e => `
        <tr><td>${e.data}</td><td>${e.tipo}</td><td>${e.categoria}</td><td>R$ ${e.valor.toFixed(2)}</td>
        <td><button onclick="deleteEntry(${e.id})">🗑️</button></td></tr>
    `).join('');
}
function deleteEntry(id) { db.entries = db.entries.filter(e => e.id !== id); save(); }
function saveConfig() { save(); alert('Configurações aplicadas!'); }
function updateBrand(val) { document.getElementById('user-brand-name').innerText = val || 'FluxoPro'; }
