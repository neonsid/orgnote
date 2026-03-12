"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Check,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  X,
  Clock,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useUser } from "@clerk/react";

import { type Id } from "@/convex/_generated/dataModel";

type Todo = {
  _id: Id<"todos">;
  _creationTime: number;
  content: string;
  description?: string;
  durationMinutes?: number;
  completed: boolean;
  completedAt?: number;
  userId: string;
  createdAt: number;
  updatedAt?: number;
};

type FilterType = "all" | "active" | "completed";
type TimeFilter = "all" | "today" | "yesterday" | "lastWeek" | "older";

export function TodoList() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [newTodoContent, setNewTodoContent] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoDuration, setNewTodoDuration] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"todos"> | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const todos = useQuery(api.todos.listTodos);
  const createTodo = useMutation(api.todos.createTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const toggleTodo = useMutation(api.todos.toggleTodo);
  const updateTodoContent = useMutation(api.todos.updateTodoContent);
  const deleteAllCompleted = useMutation(api.todos.deleteAllCompletedTodos);

  const handleAddTodo = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTodoContent.trim()) return;

      try {
        const duration = newTodoDuration
          ? parseInt(newTodoDuration, 10)
          : undefined;
        await createTodo({
          content: newTodoContent,
          description: newTodoDescription.trim() || undefined,
          durationMinutes: duration && !isNaN(duration) ? duration : undefined,
        });
        setNewTodoContent("");
        setNewTodoDescription("");
        setNewTodoDuration("");
        setShowAddForm(false);
        toast.success("Todo added");
      } catch {
        toast.error("Failed to add todo");
      }
    },
    [createTodo, newTodoContent, newTodoDescription, newTodoDuration],
  );

  const handleToggle = useCallback(
    async (todoId: Id<"todos">) => {
      try {
        await toggleTodo({ todoId });
      } catch {
        toast.error("Failed to update todo");
      }
    },
    [toggleTodo],
  );

  const handleDelete = useCallback(
    async (todoId: Id<"todos">) => {
      try {
        await deleteTodo({ todoId });
        toast.success("Todo deleted");
      } catch {
        toast.error("Failed to delete todo");
      }
    },
    [deleteTodo],
  );

  const handleStartEdit = useCallback((todo: Todo) => {
    setEditingId(todo._id);
    setEditContent(todo.content);
    setEditDescription(todo.description || "");
    setEditDuration(todo.durationMinutes?.toString() || "");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent("");
    setEditDescription("");
    setEditDuration("");
  }, []);

  const handleSaveEdit = useCallback(
    async (todoId: Id<"todos">) => {
      if (!editContent.trim()) {
        toast.error("Todo content cannot be empty");
        return;
      }
      try {
        const duration = editDuration ? parseInt(editDuration, 10) : undefined;
        await updateTodoContent({
          todoId,
          content: editContent,
          description: editDescription.trim() || undefined,
          durationMinutes: duration && !isNaN(duration) ? duration : undefined,
        });
        setEditingId(null);
        setEditContent("");
        setEditDescription("");
        setEditDuration("");
        toast.success("Todo updated");
      } catch {
        toast.error("Failed to update todo");
      }
    },
    [updateTodoContent, editContent, editDescription, editDuration],
  );

  const handleClearCompleted = useCallback(async () => {
    try {
      const result = await deleteAllCompleted({});
      if (result.deletedCount > 0) {
        toast.success(`Cleared ${result.deletedCount} completed todo(s)`);
      } else {
        toast.info("No completed todos to clear");
      }
    } catch {
      toast.error("Failed to clear completed todos");
    }
  }, [deleteAllCompleted]);

  const getTimeFilterRange = (timeFilter: TimeFilter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (timeFilter) {
      case "today":
        return { start: today.getTime(), end: now.getTime() };
      case "yesterday":
        return { start: yesterday.getTime(), end: today.getTime() };
      case "lastWeek":
        return { start: lastWeek.getTime(), end: yesterday.getTime() };
      case "older":
        return { start: 0, end: lastWeek.getTime() };
      default:
        return null;
    }
  };

  const filteredTodos = todos?.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;

    if (timeFilter !== "all") {
      const range = getTimeFilterRange(timeFilter);
      if (range) {
        const todoTime = todo.completedAt || todo.createdAt;
        if (todoTime < range.start || todoTime >= range.end) {
          return false;
        }
      }
    }
    return true;
  });

  const activeCount = todos?.filter((t) => !t.completed).length ?? 0;
  const completedCount = todos?.filter((t) => t.completed).length ?? 0;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatCompletedTime = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (date >= today) return "Today";
    if (date >= yesterday) return "Yesterday";
    if (date >= lastWeek) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!isUserLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 mt-4 sm:mt-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Daily Activities
          </h1>
          <p className="text-muted-foreground">
            Track and manage your daily tasks
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          {showAddForm ? (
            <form
              onSubmit={handleAddTodo}
              className="space-y-3 p-4 rounded-xl border bg-card"
            >
              <Input
                type="text"
                placeholder="What do you want to do?"
                value={newTodoContent}
                onChange={(e) => setNewTodoContent(e.target.value)}
                className="flex-1 h-10 text-base"
                autoFocus
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Description (optional)"
                    value={newTodoDescription}
                    onChange={(e) => setNewTodoDescription(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <div className="relative w-24">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Minutes"
                    value={newTodoDuration}
                    onChange={(e) => setNewTodoDuration(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTodoContent("");
                    setNewTodoDescription("");
                    setNewTodoDuration("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newTodoContent.trim()}
                >
                  <Plus className="size-4 mr-1" />
                  Add
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="w-full h-10 justify-start text-muted-foreground"
            >
              <Plus className="size-4 mr-2" />
              Add a new activity...
            </Button>
          )}
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex gap-1">
            {(["all", "active", "completed"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
                {f === "active" && activeCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                    {activeCount}
                  </span>
                )}
                {f === "completed" && completedCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                    {completedCount}
                  </span>
                )}
              </Button>
            ))}
          </div>
          {filter === "completed" && (
            <div className="flex gap-1">
              {(
                [
                  "all",
                  "today",
                  "yesterday",
                  "lastWeek",
                  "older",
                ] as TimeFilter[]
              ).map((t) => (
                <Button
                  key={t}
                  variant={timeFilter === t ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTimeFilter(t)}
                  className="text-xs capitalize"
                >
                  {t === "all" ? "All" : t === "lastWeek" ? "This Week" : t}
                </Button>
              ))}
            </div>
          )}
          {completedCount > 0 && filter !== "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCompleted}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4 mr-1" />
              Clear completed
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredTodos?.map((todo, index) => (
              <motion.div
                key={todo._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`group flex items-start gap-3 p-4 rounded-xl border bg-card transition-all duration-200 ${
                  todo.completed
                    ? "border-muted opacity-60"
                    : "border-border hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => handleToggle(todo._id)}
                  className="size-5 shrink-0 mt-0.5"
                />

                {editingId === todo._id ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(todo._id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="h-9"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="flex-1 h-8 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Min"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="w-20 h-8 text-sm"
                        min="1"
                      />
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                      >
                        <X className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(todo._id)}
                      >
                        <Check className="size-4 text-green-500" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`block text-base transition-all duration-200 ${
                          todo.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {todo.content}
                      </span>
                      {(todo.description ||
                        todo.durationMinutes ||
                        todo.completedAt) && (
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {todo.description && (
                            <span className="truncate max-w-[200px]">
                              {todo.description}
                            </span>
                          )}
                          {todo.durationMinutes && (
                            <span className="flex items-center shrink-0">
                              <Clock className="size-3 mr-1" />
                              {formatDuration(todo.durationMinutes)}
                            </span>
                          )}
                          {todo.completedAt && (
                            <span className="flex items-center shrink-0 text-green-500">
                              <Check className="size-3 mr-1" />
                              {formatCompletedTime(todo.completedAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(todo)}
                        className="size-8"
                      >
                        <Pencil className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(todo._id)}
                        className="size-8 hover:text-destructive"
                      >
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTodos?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-muted-foreground mb-2">
                {filter === "all"
                  ? "No activities yet"
                  : filter === "active"
                    ? "No active activities"
                    : "No completed activities"}
              </div>
              <p className="text-sm text-muted-foreground/60">
                {filter === "all" && "Add your first activity above!"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
