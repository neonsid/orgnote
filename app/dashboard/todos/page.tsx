"use client";

import { TodoList } from "@/components/dashboard/todos/todo-list";
import { TodosHeader } from "@/components/dashboard/todos/todos-header";
import { useUser } from "@clerk/react";

export default function TodosPage() {
  const { user, isLoaded: isUserLoaded } = useUser();

  if (!isUserLoaded) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TodosHeader />
      <TodoList />
    </div>
  );
}
