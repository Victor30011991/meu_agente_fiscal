// Banco de dados local
let db = JSON.parse(localStorage.getItem('fluxopro_db')) || { 
    profile: {nome: '', doc: '', theme: '#2563eb', photo: ''}, 
    entries: [] 
};

let myChart = null;

// Inicialização segura
document.addEventListener('DOMContentLoaded', () => {
    initThemeSelector();
    loadProfile();
    renderAll();
    
    // Configuração do upload de foto
    const photoInput = document.getElementById('user-photo-input');
    if (photoInput) {
        photoInput.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = () => {
                db.profile.photo = reader.result;
                const preview = document.getElementById('user-photo-preview');
                preview.src = reader.result;
                preview.style.display = 'block';
                save();
            };
            reader.readAsDataURL(e.target.files[0]);
        };
    }
});

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

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('btn-' + tab).classList.add('active');
    if(tab === 'dash') updateDashboard();
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

function applyTheme(color) {
    document.documentElement.style.setProperty('--primary', color);
}

function saveConfig() {
    db.profile.nome = document.getElementById('conf-nome').value;
    db.profile.doc = document.getElementById('conf-doc').value;
    save();
    alert("Configurações atualizadas!");
}

function save() {
    localStorage.setItem('fluxopro_db', JSON.stringify(db));
    renderAll();
}

function renderAll() {
    const corpo = document.getElementById('lista-corpo');
    if (!corpo) return;
    corpo.innerHTML = db.entries.sort((a,b) => b.id - a.id).map(e => `
        <tr>
            <td>${e.data.split('-').reverse().join('/')}</td>
            <td style="color:${e.tipo === 'Entrada' ? '#16a34a' : '#dc2626'}"><b>${e.tipo}</b></td>
            <td>${e.categoria}</td>
            <td>R$ ${e.valor.toFixed(2)}</td>
            <td style="color:#64748b; font-size:0.8rem">${e.obs || '-'}</td>
            <td onclick="deleteEntry(${e.id})" style="cursor:pointer; opacity:0.5">✕</td>
        </tr>
    `).join('');
    updateDashboard();
}

function deleteEntry(id) {
    if(confirm("Excluir este lançamento?")) {
        db.entries = db.entries.filter(x => x.id != id);
        save();
    }
}

function openModal() { document.getElementById('modal-entry').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-entry').style.display = 'none'; }

document.getElementById('form-transacao').onsubmit = (e) => {
    e.preventDefault();
    db.entries.push({
        id: Date.now(),
        data: document.getElementById('f-data').value,
        tipo: document.getElementById('f-tipo').value,
        valor: parseFloat(document.getElementById('f-valor').value),
        categoria: document.getElementById('f-cat').value,
        obs: document.getElementById('f-obs').value
    });
    save(); 
    closeModal();
};

function updateDashboard() {
    const inTotal = db.entries.filter(e => e.tipo === 'Entrada').reduce((a, b) => a + b.valor, 0);
    const outTotal = db.entries.filter(e => e.tipo === 'Saída').reduce((a, b) => a + b.valor, 0);
    
    if(document.getElementById('total-entradas')) {
        document.getElementById('total-entradas').innerText = `R$ ${inTotal.toFixed(2)}`;
        document.getElementById('total-saidas').innerText = `R$ ${outTotal.toFixed(2)}`;
        document.getElementById('total-saldo').innerText = `R$ ${(inTotal - outTotal).toFixed(2)}`;
    }
    
    const canvas = document.getElementById('ctxCategorias');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const cats = [...new Set(db.entries.map(e => e.categoria))];
    const vals = cats.map(c => db.entries.filter(x => x.categoria === c).reduce((a,b)=> a+b.valor, 0));

    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: cats, datasets: [{ label: 'R$', data: vals, backgroundColor: db.profile.theme || '#2563eb' }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- CORREÇÃO DAS FUNÇÕES DE DOWNLOAD ---

function exportExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Erro: Biblioteca Excel ainda não carregou. Verifique sua conexão.");
        return;
    }
    const ws = XLSX.utils.json_to_sheet(db.entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, "FluxoPro_Relatorio.xlsx");
}

function exportPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        alert("Erro: Biblioteca PDF ainda não carregou. Verifique sua conexão.");
        return;
    }
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório FluxoPro Brasil", 14, 20);
    doc.setFontSize(10);
    doc.text(`Usuário: ${db.profile.nome} | Doc: ${db.profile.doc}`, 14, 30);
    
    const rows = db.entries.map(e => [
        e.data.split('-').reverse().join('/'), 
        e.tipo, 
        e.categoria, 
        `R$ ${e.valor.toFixed(2)}`, 
        e.obs || ""
    ]);
    
    doc.autoTable({
        head: [['Data', 'Tipo', 'Categoria', 'Valor', 'Observação']],
        body: rows,
        startY: 35,
        theme: 'grid'
    });
    
    doc.save("FluxoPro_Financeiro.pdf");
}
