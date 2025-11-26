# app.py
import sqlite3
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
DATABASE = 'tasks.db'

# Funções de conexão com o banco de dados
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Cria a tabela 'tasks' no SQLite se ela não existir
    with app.app_context():
        conn = get_db_connection()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                completed BOOLEAN NOT NULL
            );
        """)
        conn.commit()
        conn.close()

init_db()

# --- Rotas da API REST ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tasks', methods=['GET'])
def get_tasks():
    conn = get_db_connection()
    tasks = conn.execute('SELECT * FROM tasks').fetchall()
    conn.close()
    return jsonify([dict(task) for task in tasks])

@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({'error': 'Título da tarefa é obrigatório.'}), 400
        
    title = data['title']
    conn = get_db_connection()
    cursor = conn.execute('INSERT INTO tasks (title, completed) VALUES (?, ?)', (title, False))
    conn.commit()
    new_task_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': new_task_id, 'title': title, 'completed': False}), 201

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task_status(task_id):
    data = request.get_json()
    completed = data.get('completed')
    
    if completed is None:
        return jsonify({'error': 'O campo "completed" é obrigatório no PUT.'}), 400
        
    conn = get_db_connection()
    cursor = conn.execute('UPDATE tasks SET completed = ? WHERE id = ?', (completed, task_id))
    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Tarefa não encontrada.'}), 404

    conn.close()
    return jsonify({'message': 'Tarefa atualizada com sucesso!'})

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db_connection()
    # CORREÇÃO: Adicionada a vírgula para ser reconhecida como tupla (task_id,)
    cursor = conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Tarefa não encontrada.'}), 404

    conn.close()
    # Melhor Prática REST: Retornar 204 No Content para DELETE bem-sucedido
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)