import React from "react";
import TaskCard from "./TaskCard";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Plus, X, Trash2, Edit2 } from "lucide-react";

const KanbanColumn = ({
  title,
  status,
  tasks,
  domoUsers,
  onDropTask,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onAddTask,
  onDeleteColumn,
  currentUser,
  isMember,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    if (!isMember) return;
    try {
      const task = JSON.parse(e.dataTransfer.getData("task"));
      onDropTask(task, status);
    } catch (err) {
      console.error("Failed to parse task data", err);
    }
  };

  return (
    <div
      className="flex flex-col h-full w-full select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4 px-2 relative">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-primary/40 rounded-full" />
          <h2 className="font-black text-lg tracking-tight text-foreground dark:text-foreground/90 lowercase first-letter:uppercase">
            {title}
          </h2>
          <span className="flex items-center justify-center min-w-[24px] px-1.5 h-6 text-[10px] font-black rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            {tasks.length}
          </span>
        </div>

        {isMember && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-muted dark:hover:bg-white/5 rounded-lg text-muted-foreground dark:text-foreground/50 transition-all active:scale-90"
            >
              <MoreHorizontal size={18} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl z-20 overflow-hidden p-1.5"
                  >
                    <button
                      onClick={() => {
                        onAddTask(status);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold hover:bg-primary/10 text-foreground hover:text-primary transition-colors rounded-xl"
                    >
                      <Plus size={16} />
                      Add Task
                    </button>
                    <div className="h-[1px] bg-border my-1" />
                    <button
                      onClick={() => {
                        onDeleteColumn();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold hover:bg-red-500/10 text-red-500 transition-colors rounded-xl"
                    >
                      <Trash2 size={16} />
                      Delete Column
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex-1 bg-muted/30 dark:bg-white/[0.01] rounded-[2.5rem] p-3 border border-border/40 min-h-[500px] transition-all hover:bg-muted/40 group/col relative">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("task", JSON.stringify(task))
              }
              className="cursor-grab active:cursor-grabbing mb-4"
            >
              <TaskCard
                task={task}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                onUpdate={onUpdateTask}
                domoUsers={domoUsers}
                currentUser={currentUser}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {isMember && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddTask(status)}
            className="w-full py-4 rounded-3xl border-2 border-dashed border-border/60 flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-bold opacity-0 group-hover/col:opacity-100 mt-2"
          >
            <Plus size={16} />
            Add New Task
          </motion.button>
        )}

        {tasks.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/30 dark:text-foreground/20 text-xs italic border-2 border-dashed border-muted-foreground/10 dark:border-white/5 rounded-[2rem] p-6 text-center">
            <div className="mb-2 opacity-20">
              <Edit2 size={24} />
            </div>
            Drop tasks here <br />or use the plus button
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
