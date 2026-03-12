import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

export const createTodo = mutation({
  args: {
    content: v.string(),
    description: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
  },
  returns: v.id("todos"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (!args.content.trim()) {
      throw new ConvexError({
        code: "INVALID_ARGS",
        message: "Todo content cannot be empty",
      });
    }

    return await ctx.db.insert("todos", {
      content: args.content.trim(),
      description: args.description?.trim() || undefined,
      durationMinutes: args.durationMinutes,
      completed: false,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteTodo = mutation({
  args: { todoId: v.id("todos") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Todo not found",
      });
    }

    if (todo.userId !== userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to delete this todo",
      });
    }

    await ctx.db.delete(args.todoId);
    return { success: true };
  },
});

export const toggleTodo = mutation({
  args: { todoId: v.id("todos") },
  returns: v.object({ success: v.boolean(), completed: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Todo not found",
      });
    }

    if (todo.userId !== userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to update this todo",
      });
    }

    const newCompleted = !todo.completed;
    await ctx.db.patch(args.todoId, {
      completed: newCompleted,
      completedAt: newCompleted ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return { success: true, completed: newCompleted };
  },
});

export const updateTodoContent = mutation({
  args: {
    todoId: v.id("todos"),
    content: v.string(),
    description: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Todo not found",
      });
    }

    if (todo.userId !== userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to update this todo",
      });
    }

    if (!args.content.trim()) {
      throw new ConvexError({
        code: "INVALID_ARGS",
        message: "Todo content cannot be empty",
      });
    }

    await ctx.db.patch(args.todoId, {
      content: args.content.trim(),
      description: args.description?.trim() || undefined,
      durationMinutes: args.durationMinutes,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const listTodos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const todos = await ctx.db
      .query("todos")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return todos;
  },
});

export const deleteAllCompletedTodos = mutation({
  args: {},
  returns: v.object({ success: v.boolean(), deletedCount: v.number() }),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const completedTodos = await ctx.db
      .query("todos")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    for (const todo of completedTodos) {
      await ctx.db.delete(todo._id);
    }

    return { success: true, deletedCount: completedTodos.length };
  },
});
