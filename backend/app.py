from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)

# データベース設定
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "tasks.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# Task モデル（データベーススキーマ）
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50), default='General')
    priority = db.Column(db.String(10), default='Medium')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'completed': self.completed,
            'category': self.category,
            'priority': self.priority
        }

# データベース初期化
with app.app_context():
    db.create_all()

# すべてのタスクを取得（フィルター機能付き）
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    # ==================== フィルターパラメータの取得 ====================
    # クエリパラメータから値を取得（例：?category=Work&priority=High）
    # request.args.get('key', 'デフォルト値') のように使用
    category_filter = request.args.get('category', 'All')
    priority_filter = request.args.get('priority', 'All')
    status_filter = request.args.get('status', 'All')  # All, completed, incomplete

    # ==================== タスクをクエリして取得 ====================
    # 基本的なクエリ（全タスクを取得）
    query = Task.query

    # ==================== フィルター条件を適用 ====================
    # カテゴリフィルター：'All' 以外の場合のみ適用
    if category_filter != 'All':
        query = query.filter_by(category=category_filter)

    # 優先度フィルター：'All' 以外の場合のみ適用
    if priority_filter != 'All':
        query = query.filter_by(priority=priority_filter)

    # ステータスフィルター：'All' 以外の場合のみ適用
    if status_filter == 'completed':
        query = query.filter_by(completed=True)
    elif status_filter == 'incomplete':
        query = query.filter_by(completed=False)
    # status_filter == 'All' の場合はフィルターなし

    # ==================== フィルター済みのタスクを取得して返却 ====================
    # all() で全てのマッチしたタスクを取得
    tasks = query.all()
    
    # 各タスクを辞書に変換してJSON形式で返す
    return jsonify([task.to_dict() for task in tasks])

# 新しいタスクを追加
@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.json
    task = Task(
        title=data.get('title'),
        category=data.get('category', 'General'),
        priority=data.get('priority', 'Medium')
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

# タスクを完了状態に更新
@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    task.completed = not task.completed
    db.session.commit()
    return jsonify(task.to_dict())

# タスクを削除
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    db.session.delete(task)
    db.session.commit()
    return jsonify({'status': 'deleted'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)