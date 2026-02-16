// Base de Dados com Persistência Local
let db = JSON.parse(localStorage.getItem('fluxopro_db')) || [];
let activeCharts = {};

document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    initFileUpload();
});

// NAVEGAÇÃO ENTRE ABAS
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane, .nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
    if(tabId === 'dash') renderCharts();
}

// LANÇAMENTO MANUAL
document.getElementById('form-entry').onsubmit = (e) => {
    e.preventDefault();
    const entry = {
        id: Date.now(),
        data: document.getElementById('f-date').value,
        cat: document.getElementById('f-cat').value,
        tipo: document.getElementById('f-tipo').value,
        val: parseFloat(document.getElementById('f-val').value)
    };
    db.push(entry);
    sync();
    closeModal('entry-modal');
    e.target.reset();
};

// MOTOR DE IMPORTAÇÃO (JSON, EXCEL)
function initFileUpload() {
    const zone = document.getElementById('drop-zone');
    const input = document.getElementById('file-input');

    zone.onclick = () => input.click();
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (evt) => {
            if (file.name.endsWith('.json')) {
                const data = JSON.parse(evt.target.result);
                db = Array.isArray(data) ? data : (data.entries || []);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const workbook = XLSX.read(evt.target.result, {type: 'binary'});
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet);
                // Mapeamento inteligente de colunas
                db = rows.map(r => ({
                    id: Date.now() + Math.random(),
                    data: r.Data || r.date || new Date().toISOString().split('T')[0],
                    cat: r.Categoria || r.category || 'Geral',
                    tipo: r.Tipo || r.type || 'Saída',
                    val: parseFloat(r.Valor || r.value || 0)
                }));
            }
            sync();
            alert("Dados importados com sucesso!");
        };

        if (file.name.endsWith('.json')) reader.readAsText(file);
        else reader.readAsBinaryString(file);
    };
}

// EXPORTAÇÃO (SAVE GAME)
function exportFile(type) {
    if (type === 'json') {
        const blob = new Blob([JSON.stringify(db, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'fluxopro_backup.json'; a.click();
    } else {
        const ws = XLSX.utils.json_to_sheet(db);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
        XLSX.writeFile(wb, "fluxopro_relatorio.xlsx");
    }
}

// RENDERIZAÇÃO DE GRÁFICOS (3 MODELOS)
function renderCharts() {
    const gastos = db.filter(e => e.tipo === 'Saída');
    const ganhos = db.filter(e => e.tipo === 'Entrada');

    // 1. PIZZA: Gastos por Categoria
    const catMap = {};
    gastos.forEach(g => catMap[g.cat] = (catMap[g.cat] || 0) + g.val);
    createChart('chartPie', 'pie', Object.keys(catMap), Object.values(catMap));

    // 2. RÉGUAS: Ganhos Mensais (Jan-Dez)
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const ganhosMes = Array(12).fill(0);
    ganhos.forEach(g => {
        const m = new Date(g.data).getMonth();
        ganhosMes[m] += g.val;
    });
    createChart('chartBars', 'bar', meses, ganhosMes);

    // 3. RANKING %: Top Gastadores
    const totalGasto = gastos.reduce((a,b) => a+b.val, 0);
    const sortedCats = Object.keys(catMap).sort((a,b) => catMap[b] - catMap[a]);
    const values = sortedCats.map(c => ((catMap[c] / totalGasto) * 100).toFixed(1));
    createChart('chartRanking', 'doughnut', sortedCats, values);
}

function createChart(id, type, labels, data) {
    if (activeCharts[id]) activeCharts[id].destroy();
    activeCharts[id] = new Chart(document.getElementById(id), {
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

// UTILITÁRIOS
function sync() {
    localStorage.setItem('fluxopro_db', JSON.stringify(db));
    renderTable();
}

function renderTable() {
    const html = db.sort((a,b) => new Date(b.data) - new Date(a.data)).map(e => `
        <tr>
            <td>${e.data}</td>
            <td>${e.cat}</td>
            <td style="color:${e.tipo === 'Entrada' ? 'var(--success)' : 'var(--danger)'}; font-weight:bold">${e.tipo}</td>
            <td>R$ ${e.val.toFixed(2)}</td>
            <td style="text-align:right"><button onclick="deleteEntry(${e.id})" style="border:none; background:none; cursor:pointer">🗑️</button></td>
        </tr>
    `).join('');
    document.getElementById('table-body').innerHTML = html || '<tr><td colspan="5" style="text-align:center">Nenhum dado disponível.</td></tr>';
}

function deleteEntry(id) {
    db = db.filter(e => e.id !== id);
    sync();
}

function applyTheme(t) { document.body.setAttribute('data-theme', t); }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function resetSystem() { if(confirm("Apagar todos os dados?")) { localStorage.clear(); location.reload(); } }
