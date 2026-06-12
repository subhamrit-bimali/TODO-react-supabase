import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import TodoItem from "./components/TodoItem";
import styles from "./App.module.css";

const FILTERS = ["all", "active", "done"];

export default function App() {
  const [session, setSession] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState("none");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Auth listener
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setTodos(data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Realtime subscription
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTodos((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTodos((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t)),
            );
          } else if (payload.eventType === "DELETE") {
            setTodos((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setAdding(true);
    const { error } = await supabase.from("todos").insert({
      title: trimmed,
      priority: priority === "none" ? null : priority,
      user_id: session.user.id,
      is_complete: false,
    });
    if (error) setError(error.message);
    else {
      setNewTitle("");
      setPriority("none");
    }
    setAdding(false);
  };

  const handleToggle = async (id, currentState) => {
    const { error } = await supabase
      .from("todos")
      .update({ is_complete: !currentState })
      .eq("id", id);
    if (error) setError(error.message);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) setError(error.message);
  };

  const handleUpdate = async (id, updates) => {
    const { error } = await supabase.from("todos").update(updates).eq("id", id);
    if (error) setError(error.message);
  };

  const handleClearDone = async () => {
    const doneIds = todos.filter((t) => t.is_complete).map((t) => t.id);
    if (!doneIds.length) return;
    const { error } = await supabase.from("todos").delete().in("id", doneIds);
    if (error) setError(error.message);
  };

  const handleSignOut = () => supabase.auth.signOut();

  // Declare search hooks before any early returns
  // Debounce searchQuery -> debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Server-side search when debounced query changes
  useEffect(() => {
    console.log("Running search for:", debouncedSearch);
    let cancelled = false;
    const runSearch = async () => {
      if (!session) return;
      const q = debouncedSearch;
      if (!q) {
        return;
      }
      setSearchLoading(true);
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", session.user.id)
        .ilike("title", `%${q}%`)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setTodos(data || []);
      setSearchLoading(false);
    };
    runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, session]);

  if (!session) return <Auth />;

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.is_complete;
    if (filter === "done") return t.is_complete;
    return true;
  });

  const doneCount = todos.filter((t) => t.is_complete).length;
  const activeCount = todos.filter((t) => !t.is_complete).length;

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="10" fill="#7C3AED" />
              <path
                d="M9 16.5L13.5 21L23 11"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.brandName}>Focus</span>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.userEmail}>{session.user.email}</span>
            <button className={styles.signOutBtn} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{activeCount}</span>
              <span className={styles.statLabel}>remaining</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>{doneCount}</span>
              <span className={styles.statLabel}>completed</span>
            </div>
          </div>

          {/* Add task form */}
          <form className={styles.addForm} onSubmit={handleAdd}>
            <div className={styles.addRow}>
              <input
                className={styles.addInput}
                placeholder="Add a task…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={280}
                autoFocus
              />
              <select
                className={styles.prioritySelect}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                aria-label="Priority"
              >
                <option value="none">No priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                className={styles.addBtn}
                disabled={adding || !newTitle.trim()}
              >
                {adding ? (
                  <span className={styles.spinner} />
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Filter bar */}
          <div className={styles.filterBar}>
            <div className={styles.filters}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "active" && activeCount > 0 && (
                    <span className={styles.badge}>{activeCount}</span>
                  )}
                  {f === "done" && doneCount > 0 && (
                    <span className={styles.badgeDone}>{doneCount}</span>
                  )}
                </button>
              ))}
            </div>
            <input
              className={styles.searchInput}
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
            />
            {doneCount > 0 && (
              <button className={styles.clearBtn} onClick={handleClearDone}>
                Clear done
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error}>
              {error}
              <button
                className={styles.errorClose}
                onClick={() => setError(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* List */}
          <div className={styles.list}>
            {loading ? (
              <div className={styles.loadingState}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeleton} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                {filter === "done" ? (
                  <>
                    <span className={styles.emptyIcon}>✓</span>
                    <p>No completed tasks yet</p>
                  </>
                ) : filter === "active" ? (
                  <>
                    <span className={styles.emptyIcon}>🎉</span>
                    <p>All caught up!</p>
                  </>
                ) : (
                  <>
                    <span className={styles.emptyIcon}>○</span>
                    <p>No tasks yet — add one above</p>
                  </>
                )}
              </div>
            ) : (
              filtered.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
