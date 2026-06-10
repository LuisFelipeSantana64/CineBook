const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

if (usuarioLogado) {
    document.getElementById('nomeUsuarioHeader').innerText = usuarioLogado.nome;
    document.getElementById('inputUsuarioId').value = usuarioLogado.id;
}

document.getElementById('loadPostsBtn').addEventListener('click', loadPosts);
document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
});

function loadPosts() {
 fetch('/api/itens', {
     method: 'GET',
     headers: {
         'Content-Type': 'application/json',
         'X-User-Id': usuarioLogado ? usuarioLogado.id : 0 
     }
 })
 .then(response => response.json())
 .then(posts => {
     let output = '';
     
     posts.forEach(post => {
         const classeDono = post.e_do_usuario ? 'card-dono' : '';
         const estrelas = ''.repeat(post.preco_nota);

         output += `
            <div class="card ${classeDono}">
                ${post.e_do_usuario ? '<span class="badge-sua">Sua Review</span>' : ''}
                <h3>${post.nome}</h3>
                <p><strong>Categoria:</strong> ${post.categoria}</p>
                <p><em>"${post.descricao}"</em></p>
                
                <p style="font-size: 13px; color: #777; margin: 8px 0 3px 0;">
                    <strong>Postado por:</strong> ${post.nome_usuario || 'Usuário Anônimo'}
                </p>

                <p style="font-size: 18px; margin: 10px 0;">${estrelas}</p>
                
                ${post.e_do_usuario ? `
                    <button class="btn-excluir" onclick="excluirItem(${post.id})">Excluir</button>
                ` : ''}
            </div>
         `;
     });
     
     document.getElementById('postList').innerHTML = output;
 })
 .catch(error => {
     console.error('Erro:', error);
 });
}

function excluirItem(id) {
    if (confirm("Deseja realmente excluir este item?")) {
        fetch(`/api/itens/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            loadPosts(); 
        })
        .catch(error => console.error('Erro ao deletar:', error));
    }
}
loadPosts();
