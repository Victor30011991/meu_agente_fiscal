// Inicialização do Banco de Dados com valores padrão para evitar "undefined"
let db = JSON.parse(localStorage.getItem('fluxopro_db')) || { 
    profile: {nome: '', doc: '', theme: '#2563eb', photo: ''}, 
    entries: [] 
};

let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initThemeSelector();
    loadProfile();
    renderTable();
    
    // Upload de Foto
    const photoInput = document.getElementById('user-photo-input');
    if(photoInput) {
        photoInput.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = () => {
                db.profile.photo = reader.result;
                loadProfile();
                save();
            };
            reader.readAsDataURL(e.target.files[0]);
        };
    }
});

// Fechar com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeModal();
});

function loadProfile() {
    // Garante que não apareça "undefined" nos inputs
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
    alert("Configurações salvas!");
}

function save() {
    localStorage.setItem('fluxopro_db', JSON.stringify(db));
    renderTable();
}

document.getElementById('form-transacao').onsubmit = (e) => {
    e.preventDefault();
    const novaEntrada = {
        id: Date.now(),
        data: document.getElementById('f-data').value,
        tipo: document.getElementById('f-tipo').value,
        valor: parseFloat(document.getElementById('f-valor').value),
        categoria: document.getElementById('f-cat').value,
        obs: document.getElementById('f-obs').value || ''
    };
    db.entries.push(novaEntrada);
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
            <td class="${e.tipo === 'Entrada' ? 'txt-success' : 'txt-danger'}">${e.tipo}</td>
            <td>${e.categoria}</td>
            <td>R$ ${e.valor.toFixed(2)}</td>
            <td style="font-size: 0.8rem; color: #94a3b8;">${e.obs}</td>
            <td onclick="deleteEntry(${e.id})" style="cursor:pointer; color:#cbd5e1">✕</td>
        </tr>
    `).join('');
}

function deleteEntry(id) {
    if(confirm("Excluir lançamento?")) {
        db.entries = db.entries.filter(e => e.id !== id);
        save();
    }
}

function updateDashboard() {
    const receitas = db.entries.filter(e => e.tipo === 'Entrada').reduce((acc, cur) => acc + cur.valor, 0);
    const despesas = db.entries.filter(e => e.tipo === 'Saída').reduce((acc, cur) => acc + cur.valor, 0);
    
    document.getElementById('total-entradas').innerText = `R$ ${receitas.toFixed(2)}`;
    document.getElementById('total-saidas').innerText = `R$ ${despesas.toFixed(2)}`;
    document.getElementById('total-saldo').innerText = `R$ ${(receitas - despesas).toFixed(2)}`;

    const ctx = document.getElementById('ctxCategorias').getContext('2d');
    const cats = [...new Set(db.entries.map(e => e.categoria))];
    const data = cats.map(c => db.entries.filter(e => e.categoria === c).reduce((acc, cur) => acc + cur.valor, 0));

    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: cats,
            datasets: [{ data: data, backgroundColor: [db.profile.theme, '#10b981', '#f59e0b', '#ef4444', '#6366f1'] }]
        }
    });
}

// FUNÇÕES DE EXPORTAÇÃO CORRIGIDAS
function exportExcel() {
    if(typeof XLSX === 'undefined') return alert("Erro: Biblioteca Excel não carregada.");
    const ws = XLSX.utils.json_to_sheet(db.entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos");
    XLSX.writeFile(wb, "Relatorio_Financeiro.xlsx");
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    if(!jsPDF) return alert("Erro: Biblioteca PDF não carregada.");
    const doc = new jsPDF();
    doc.text("FluxoPro Brasil - Relatório", 14, 15);
    const rows = db.entries.map(e => [e.data, e.tipo, e.categoria, e.valor.toFixed(2), e.obs]);
    doc.autoTable({ head: [['Data', 'Tipo', 'Categoria', 'Valor', 'Obs']], body: rows, startY: 25 });
    doc.save("Relatorio.pdf");
}
