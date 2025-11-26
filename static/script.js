// static/script.js
document.addEventListener('DOMContentLoaded', function() {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    const API_URL = '/tasks'; // CORRIGIDO: Usando caminho relativo para funcionar em qualquer porta/host

    // FUNÇÃO PRINCIPAL PARA CARREGAR AS TAREFAS DO BACK-END
    async function loadTasks() {
        taskList.innerHTML = '';
        try {
            const response = await fetch(API_URL);
            const tasks = await response.json();
            tasks.forEach(task => {
                createTaskElement(task.id, task.title, task.completed);
            });
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            if (taskList.innerHTML === '') {
                taskList.innerHTML = '<p style="text-align: center; color: #e74c3c;">Erro: Não foi possível conectar com o servidor (Back-end).</p>';
            }
        }
    }

    // FUNÇÃO QUE CRIA O ELEMENTO HTML (e anexa os ouvintes de API)
    function createTaskElement(id, title, completed) {
        const li = document.createElement('li');
        li.dataset.id = id;
        if (completed) {
            li.classList.add('completed');
        }

        const textSpan = document.createElement('span');
        textSpan.textContent = title;
        textSpan.className = 'task-text';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Remover';
        deleteButton.className = 'delete-btn';

        // OUVINTE 1: Mudar Status (Chama a API PUT para salvar a mudança)
        textSpan.addEventListener('click', async function() {
            const newStatus = !li.classList.contains('completed');

            try {
                await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    // O valor 1 ou 0 é enviado como booleanos True/False no Python
                    body: JSON.stringify({ completed: newStatus ? true : false }) 
                });
                li.classList.toggle('completed');
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
            }
        });

        // OUVINTE 2: Remover Tarefa (Chama a API DELETE para remover do banco)
        deleteButton.addEventListener('click', async function() {
            try {
                await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE'
                });
                li.remove();
            } catch (error) {
                console.error('Erro ao remover tarefa:', error);
            }
        });

        li.appendChild(textSpan);
        li.appendChild(deleteButton);
        taskList.appendChild(li);
    }

    // OUVINTE DO FORMULÁRIO (Chama a API POST para adicionar ao banco)
    taskForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const title = taskInput.value.trim();

        if (title !== '') {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: title })
                });

                const newTask = await response.json();
                createTaskElement(newTask.id, newTask.title, newTask.completed);
                taskInput.value = '';
                taskInput.focus();
            } catch (error) {
                console.error('Erro ao adicionar tarefa:', error);
            }
        }
    });

    loadTasks();
});