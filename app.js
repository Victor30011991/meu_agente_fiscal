// Banco de Dados e Estado Global
let db = JSON.parse(localStorage.getItem('fluxopro_db')) || { 
    profile: {nome: '', doc: '', theme: '#2563eb', photo: ''}, 
    entries: [] 
};

let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initThemeSelector();
    initImportListener();
    loadProfile();
    renderTable();
});

// Atalho Tecla ESC para fechar janelas
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeModal();
});

// Importação de Arquivo
function initImportListener() {
    const input = document.getElementById('import-db-input');
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                db = data;
                save();
                loadProfile();
                alert("Dados alimentados com sucesso!");
            } catch (err) { alert("Erro ao ler JSON."); }
        };
        reader.readAsText(e.target.files[0]);
    };
}

function loadProfile() {
    document.getElementById('conf-nome').value = db.profile.nome || '';
    document.getElementById('conf-doc').value = db.profile.doc || '';
    if(db.profile.photo) {
        const preview = document.getElementById('user-photo-preview');
        preview.src = db.profile.photo;
        preview.style.display = 'block';
    }
    applyTheme(db.profile.theme || '#2563eb');
}

function applyTheme(color) {
    document.documentElement.style.setProperty('--primary', color);
}

function initThemeSelector() {
    const colors = ['#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#334155'];
    const container = document.getElementById('theme-selector');
    container.innerHTML = colors.map(c => 
        `<div class="color-circle" style="background:${c}" onclick="setTheme('${c}')"></div>`
    ).join('');
}

function setTheme(c) {
    db.profile.theme = c;
    applyTheme(c);
    save();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content, .nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('btn-' + tab).classList.add('active');
    if(tab === 'dash') updateDashboard();
}

function openModal() { document.getElementById('modal-entry').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-entry').style.display = 'none'; }

function saveConfig() {
    db.profile.nome = document.getElementById('conf-nome').value;
    db.profile.doc = document.getElementById('conf-doc').value;
    save();
    alert("Configurações fiscais salvas.");
}

function save() {
    localStorage.setItem('fluxopro_db', JSON.stringify(db));
    renderTable();
}

// Lógica de Lançamento
document.getElementById('form-transacao').onsubmit = (e) => {
    e.preventDefault();
    db.entries.push({
        id: Date.now(),
        data: document.getElementById('f-data').value,
        tipo: document.getElementById('f-tipo').value,
        valor: parseFloat(document.getElementById('f-valor').value),
        categoria: document.getElementById('f-cat').value,
        obs: document.getElementById('f-obs').value || ''
    });
    save();
    closeModal();
    e.target.reset();
};

function renderTable() {
    const corpo = document.getElementById('lista-corpo');
    let tin = 0, tout = 0;

    corpo.innerHTML = db.entries.sort((a,b) => new Date(b.data) - new Date(a.data)).map(e => {
        if(e.tipo === 'Entrada') tin += e.valor; else tout += e.valor;
        return `
            <tr>
                <td>${e.data.split('-').reverse().join('/')}</td>
                <td class="${e.tipo === 'Entrada' ? 'txt-success' : 'txt-danger'}"><strong>${e.tipo}</strong></td>
                <td>${e.categoria}</td>
                <td>R$ ${e.valor.toFixed(2)}</td>
                <td style="color:#64748b; font-size:0.8rem;">${e.obs}</td>
                <td><button onclick="deleteEntry(${e.id})" style="background:none; border:none; cursor:pointer;">🗑️</button></td>
            </tr>
        `;
    }).join('');

    document.getElementById('mini-entradas').innerText = `R$ ${tin.toFixed(2)}`;
    document.getElementById('mini-saidas').innerText = `R$ ${tout.toFixed(2)}`;
    document.getElementById('mini-balanco').innerText = `R$ ${(tin - tout).toFixed(2)}`;
}

function deleteEntry(id) {
    if(confirm("Deseja apagar este registro?")) {
        db.entries = db.entries.filter(e => e.id !== id);
        save();
    }
}

function updateDashboard() {
    const canvas = document.getElementById('ctxCategorias');
    const cats = [...new Set(db.entries.map(e => e.categoria))];
    const vals = cats.map(c => db.entries.filter(e => e.categoria === c).reduce((a,b) => a + b.valor, 0));

    if(myChart) myChart.destroy();
    myChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels: cats, datasets: [{ label: 'Total R$', data: vals, backgroundColor: db.profile.theme }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// EXPORTAÇÕES
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const color = db.profile.theme;
    
    // Pag 1: Dados e Tabela
    doc.setFontSize(20); doc.setTextColor(color); doc.text("Relatório FluxoPro Brasil", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Proprietário: ${db.profile.nome || 'N/A'} | Doc: ${db.profile.doc || 'N/A'}`, 14, 28);
    
    const rows = db.entries.map(e => [e.data.split('-').reverse().join('/'), e.tipo, e.categoria, e.valor.toFixed(2), e.obs]);
    doc.autoTable({ 
        head: [['Data', 'Tipo', 'Categoria', 'Valor', 'Obs']], 
        body: rows, 
        startY: 35,
        headStyles: { fillColor: color }
    });
    
    // Pag 2: Dashboard
    updateDashboard();
    setTimeout(() => {
        const chartImg = document.getElementById('ctxCategorias').toDataURL('image/png', 1.0);
        doc.addPage();
        doc.text("Análise Gráfica", 14, 20);
        doc.addImage(chartImg, 'PNG', 15, 40, 180, 90);
        doc.save(`FluxoPro_Relatorio_${Date.now()}.pdf`);
    }, 400);
}

function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(db.entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, "FluxoPro_Export.xlsx");
}
