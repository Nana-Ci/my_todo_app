import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  // ==================== State（状態管理）====================
  // tasks: データベースから取得したすべてのタスクを保存
  const [tasks, setTasks] = useState([]);

  // input: テキスト入力欄の値を保存
  const [input, setInput] = useState("");

  // category: タスク作成時のカテゴリ選択値
  const [category, setCategory] = useState("General");

  // priority: タスク作成時の優先度選択値
  const [priority, setPriority] = useState("Medium");

  // ==================== フィルター用のState ====================
  // filterCategory: フィルター対象のカテゴリ（デフォルト: 'All' = フィルターなし）
  const [filterCategory, setFilterCategory] = useState("All");

  // filterPriority: フィルター対象の優先度（デフォルト: 'All' = フィルターなし）
  const [filterPriority, setFilterPriority] = useState("All");

  // filterStatus: フィルター対象のステータス（'All', 'completed', 'incomplete'）
  const [filterStatus, setFilterStatus] = useState("All");

  // ==================== ページ読み込み時の処理 ====================
  useEffect(() => {
    fetchTasks();
  }, []);

  // ==================== バックエンド通信関数 ====================

  // fetchTasks: バックエンドから全タスクを取得してstateに保存
  // フィルターパラメータを付けてリクエスト
  const fetchTasks = async () => {
    // ==================== クエリパラメータを構築 ====================
    // URLに ?category=Work&priority=High のような形式で追加
    const params = new URLSearchParams({
      category: filterCategory,
      priority: filterPriority,
      status: filterStatus,
    });

    // バックエンドのGETエンドポイントからデータを取得（フィルター付き）
    const response = await fetch(`http://localhost:5000/api/tasks?${params}`);
    // JSONレスポンスを解析
    const data = await response.json();
    // stateのtasksを更新（画面を再レンダリング）
    setTasks(data);
  };

  // フィルターが変更されたときにタスクを再取得する
  // 依存関係: filterCategory, filterPriority, filterStatus が変わったら再実行
  useEffect(() => {
    fetchTasks();
  }, [filterCategory, filterPriority, filterStatus]);

  // addTask: 新しいタスクをバックエンドに送信して追加
  const addTask = async () => {
    // 空の入力値は無視（バリデーション）
    if (!input) return;

    // POSTリクエストでバックエンドに新タスクを送信
    const response = await fetch("http://localhost:5000/api/tasks", {
      method: "POST",
      // JSONデータとして送信することを指定
      headers: { "Content-Type": "application/json" },
      // title, category, priority を含むオブジェクトを送信
      body: JSON.stringify({
        title: input,
        category: category,
        priority: priority,
      }),
    });

    // バックエンドが返した新たに作成されたタスクをJSON解析
    const newTask = await response.json();

    // 既存のタスク配列に新しいタスクを追加
    setTasks([...tasks, newTask]);

    // 入力欄をクリア（次のタスク入力に備える）
    setInput("");
  };

  // deleteTask: タスクをバックエンドから削除
  const deleteTask = async (id) => {
    // DELETEリクエストでバックエンドに削除指示を送信
    await fetch(`http://localhost:5000/api/tasks/${id}`, {
      method: "DELETE",
    });

    // 削除されたタスクをローカルstate(tasks)から除外
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // toggleTask: タスクの完了/未完了を切り替え
  const toggleTask = async (id) => {
    // PUTリクエストで完了状態を切り替え（バックエンド側で not をつける）
    const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
      method: "PUT",
    });

    // 更新後のタスク情報を取得
    const updatedTask = await response.json();

    // 対象のタスクだけを更新して、他のタスクはそのままにする
    setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
  };

  // ==================== ユーティリティ関数 ====================

  // resetFilters: フィルター条件をすべてリセット（初期状態に戻す）
  // 「フィルターをリセット」ボタンが押されたときに実行される
  const resetFilters = () => {
    setFilterCategory("All"); // カテゴリを 'All' にリセット
    setFilterPriority("All"); // 優先度を 'All' にリセット
    setFilterStatus("All"); // ステータスを 'All' にリセット
    // useEffect が自動的に fetchTasks() を呼び出してくれるので、
    // フィルター後のタスク一覧が自動で更新される
  };

  // getPriorityColor: 優先度に基づいて背景色を返す
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#ff6b6b"; // 赤色
      case "Medium":
        return "#ffd93d"; // 黄色
      case "Low":
        return "#6bcf7f"; // 緑色
      default:
        return "#999"; // グレー
    }
  };

  // ==================== JSX（UI）====================
  return (
    <div className="App">
      {/* タイトル */}
      <h1>My Todo List</h1>

      {/* ==================== 入力フォーム ====================  */}
      <div className="input-container">
        {/* テキスト入力欄: タスクの説明を入力 */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="新しいタスク..."
        />

        {/* カテゴリセレクト: タスク作成時のカテゴリ選択 */}
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>General</option>
          <option>Work</option>
          <option>Personal</option>
          <option>Shopping</option>
        </select>

        {/* 優先度セレクト: タスク作成時の優先度選択 */}
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>

        {/* 追加ボタン */}
        <button onClick={addTask}>追加</button>
      </div>

      {/* ==================== フィルターUI ====================  */}
      <div className="filter-container">
        <h3>フィルター</h3>

        {/* カテゴリフィルター */}
        <div className="filter-group">
          <label>カテゴリ:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option>All</option>
            <option>General</option>
            <option>Work</option>
            <option>Personal</option>
            <option>Shopping</option>
          </select>
        </div>

        {/* 優先度フィルター */}
        <div className="filter-group">
          <label>優先度:</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        {/* ステータスフィルター */}
        <div className="filter-group">
          <label>ステータス:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">すべて</option>
            <option value="incomplete">未完了</option>
            <option value="completed">完了</option>
          </select>
        </div>

        {/* ==================== リセットボタン ==================== */}
        {/* 
          フィルターをリセットするボタン
          クリックすると resetFilters() 関数が実行されて、
          全てのフィルター条件が初期状態（'All'）に戻される
        */}
        <button className="reset-button" onClick={resetFilters}>
          フィルターをリセット
        </button>
      </div>

      {/* ==================== タスクリスト ====================  */}
      <ul className="task-list">
        {/* タスクが見つからない場合のメッセージ */}
        {tasks.length === 0 ? (
          <li className="no-tasks">タスクがありません</li>
        ) : (
          // map: tasksの各要素に対してJSXを返す（ループ）
          tasks.map((task) => (
            // 各タスクをリスト項目として表示
            <li key={task.id} className={task.completed ? "completed" : ""}>
              {/* チェックボックス: タスクの完了状態を切り替え */}
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />

              {/* タスクの内容と詳細情報を含むコンテナ */}
              <div className="task-content">
                {/* タスクのタイトル */}
                <span>{task.title}</span>

                {/* タスクのメタ情報（カテゴリと優先度） */}
                <div className="task-meta">
                  {/* カテゴリバッジ */}
                  <span className="category">{task.category}</span>

                  {/* 優先度バッジ: 優先度に応じて色を変更 */}
                  <span
                    className="priority"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* 削除ボタン */}
              <button onClick={() => deleteTask(task.id)}>削除</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default App;
