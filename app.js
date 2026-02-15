// BANCO DE DADOS LOCAL
let db = JSON.parse(localStorage.getItem('fluxopro_db')) || { 
    profile: {nome: '', doc: '', theme: '#2563eb', photo: ''}, 
    entries: [] 
};

let myChart = null;

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    initThemeSelector();
    loadProfile();
    renderTable();
    initImportListener();
});

// ESC PARA FECHAR MODAL
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeModal();
});

// LÓGICA DE IMPORTAÇÃO DE ARQUIVO
function initImportListener() {
    const importInput = document.getElementById('import-db-input');
    if (importInput) {
        importInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.entries || data.profile) {
                        db.profile = data.profile || db.profile;
                        db.entries = data.entries || db.entries;
                        save();
                        loadProfile();
                        alert("Dados importados com sucesso! Verifique a aba de Lançamentos.");
                    }
                } catch (err) {
                    alert("Erro ao ler o arquivo JSON.");
                }
            };
            reader.readAsText(file);
        };
    }
}

function loadProfile() {
    // Evita o erro 'undefined' nos campos
    document.getElementById('conf-nome').value = db.profile.nome || '';
    document.getElementById('conf-doc').value = db.profile.doc || '';
    
    if(db.profile.photo) {
        const img = document.getElementById('user-photo-preview');
        img.src = db.profile.photo;
        img.style.display = 'block';
    }
    applyTheme(db.profile.theme || '#2563eb');
}

function applyTheme(color) {
    document.documentElement.style.setProperty('--primary', color);
}

function initThemeSelector() {
    const colors = ['#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#334155'];
    const container = document.getElementById('theme-selector');
    if (!container) return;
    container.innerHTML = '';
    colors.forEach(c => {
        const div = document.createElement('div');
        div.className = 'color-circle';
        div.style.background = c;
        div.onclick = () => { db.profile.theme = c; applyTheme(c); save(); };
        container.appendChild(div);
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
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
    alert("Perfil Atualizado!");
}

function save() {
    localStorage.setItem('fluxopro_db', JSON.stringify(db));
    renderTable();
}

document.getElementById('form-transacao').onsubmit = (e) => {
    e.preventDefault();
    const entry = {
        id: Date.now(),
        data: document.getElementById('f-data').value,
        tipo: document.getElementById('f-tipo').value,
        valor: parseFloat(document.getElementById('f-valor').value),
        categoria: document.getElementById('f-cat').value,
        obs: document.getElementById('f-obs').value || ''
    };
    db.entries.push(entry);
    save();
    closeModal();
    e.target.reset();
};

function renderTable() {
    const corpo = document.getElementById('lista-corpo');
    if(!corpo) return;
    corpo.innerHTML = db.entries.sort((a,b) => b.id - a.id).map(e => `
        <tr>
            <td>${e.data.split('-').reverse().join('/')}</td>
            <td style="color:${e.tipo === 'Entrada' ? '#16a34a' : '#dc2626'}"><strong>${e.tipo}</strong></td>
            <td>${e.categoria}</td>
            <td>R$ ${e.valor.toFixed(2)}</td>
            <td style="color:#64748b; font-size:0.85rem;">${e.obs || '-'}</td>
            <td>
                <button onclick="deleteEntry(${e.id})" style="border:none; background:none; cursor:pointer;">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function deleteEntry(id) {
    if(confirm("Deseja excluir este registro?")) {
        db.entries = db.entries.filter(e => e.id !== id);
        save();
    }
}

function updateDashboard() {
    const receitas = db.entries.filter(e => e.tipo === 'Entrada').reduce((a, b) => a + b.valor, 0);
    const despesas = db.entries.filter(e => e.tipo === 'Saída').reduce((a, b) => a + b.valor, 0);
    
    document.getElementById('total-entradas').innerText = `R$ ${receitas.toFixed(2)}`;
    document.getElementById('total-saidas').innerText = `R$ ${despesas.toFixed(2)}`;
    document.getElementById('total-saldo').innerText = `R$ ${(receitas - despesas).toFixed(2)}`;

    const ctx = document.getElementById('ctxCategorias').getContext('2d');
    const cats = [...new Set(db.entries.map(e => e.categoria))];
    const vals = cats.map(c => db.entries.filter(e => e.categoria === c).reduce((a, b) => a + b.valor, 0));

    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cats,
            datasets: [{ label: 'Total R$', data: vals, backgroundColor: db.profile.theme || '#2563eb' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// EXPORTAÇÕES
function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(db.entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos");
    XLSX.writeFile(wb, "Relatorio_FluxoPro.xlsx");
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("FluxoPro Brasil - Relatório", 14, 15);
    const rows = db.entries.map(e => [e.data, e.tipo, e.categoria, e.valor.toFixed(2), e.obs]);
    doc.autoTable({ head: [['Data', 'Tipo', 'Categoria', 'Valor', 'Obs']], body: rows, startY: 25 });
    doc.save("Relatorio.pdf");
}
