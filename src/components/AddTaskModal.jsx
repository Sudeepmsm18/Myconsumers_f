import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  User,
  Mail,
  AlignLeft,
  Flag,
  Save,
  Calendar,
  Trash2,
} from 'lucide-react';

const AddTaskModal = ({
  isOpen,
  onClose,
  onAdd,
  task,
  initialStatus,
  currentUser,
  domoUsers,
  readOnly = false,
}) => {
  const userName = currentUser?.displayName || currentUser?.userName || '';

  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    members: [], // [{ name, email, id }]
    due_date: '',
    priority: '',
    status: initialStatus || 'todo',
    created_by: userName,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (task) {
      setFormData({
        task_name: task.task_name || task.title || '',
        description: task.description || '',
        members: (() => {
          const m = task.members || task.assignees;
          if (Array.isArray(m)) return m;
          if (typeof m === 'string') {
            try {
              return JSON.parse(m) || [];
            } catch {
              return [];
            }
          }
          return task.assigned_to
            ? [
                {
                  name: task.assigned_to,
                  email: task.assigned_email,
                  id: task.assigned_id,
                },
              ]
            : [];
        })(),
        due_date: task.due_date || '',
        priority: task.priority || '',
        status: task.status || 'todo',
        created_by:
          task.created_by ||
          currentUser?.displayName ||
          currentUser?.userName ||
          '',
      });
    } else {
      const defaultUser =
        currentUser?.displayName || currentUser?.userName || '';
      setFormData({
        task_name: '',
        description: '',
        members: [],
        due_date: '',
        priority: '',
        status: initialStatus || 'todo',
        created_by: defaultUser,
      });
    }
    setIsDropdownOpen(false);
    setSearchTerm('');
  }, [task, isOpen, currentUser, initialStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task_name) return;

    // Populate legacy fields for backward compatibility/card display
    const primaryAssignee = formData.members[0] || {};
    const submissionData = {
      ...formData,
      assigned_to: primaryAssignee.name || '',
      assigned_email: primaryAssignee.email || '',
      assigned_id: primaryAssignee.id || '',
    };

    onAdd(task ? { ...task, ...submissionData } : submissionData);
    onClose();
  };

  const filteredUsers = (domoUsers || []).filter((u) =>
    (u?.displayName || '')
      .toLowerCase()
      .includes((searchTerm || '').toLowerCase()),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl z-50"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                    {task ? (
                      readOnly ? (
                        <AlignLeft size={22} />
                      ) : (
                        <Save size={22} />
                      )
                    ) : (
                      <Plus size={22} />
                    )}
                  </div>
                  {task
                    ? readOnly
                      ? 'Task Details'
                      : 'Edit Task'
                    : 'Create New Task'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Core Info */}
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                        Task Name
                      </label>
                      <input
                        autoFocus={!readOnly}
                        readOnly={readOnly}
                        className={`w-full bg-muted/40 dark:bg-white/5 border border-border rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 text-foreground font-medium ${readOnly ? 'cursor-default border-transparent bg-muted/20' : ''}`}
                        placeholder="What needs to be done?"
                        value={formData.task_name}
                        onChange={(e) =>
                          !readOnly &&
                          setFormData({
                            ...formData,
                            task_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                        <AlignLeft size={14} /> Description
                      </label>
                      <textarea
                        readOnly={readOnly}
                        rows={4}
                        className={`w-full bg-muted/40 dark:bg-white/5 border border-border rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 resize-none text-foreground text-sm leading-relaxed ${readOnly ? 'cursor-default border-transparent bg-muted/20' : ''}`}
                        placeholder="Add some details..."
                        value={formData.description}
                        onChange={(e) =>
                          !readOnly &&
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                        <Flag size={14} /> Priority
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {['low', 'medium', 'high'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              !readOnly &&
                              setFormData({ ...formData, priority: p })
                            }
                            disabled={readOnly}
                            className={`capitalize py-2 rounded-xl border text-[11px] font-black tracking-widest transition-all ${
                              formData.priority === p
                                ? p === 'high'
                                  ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20'
                                  : p === 'medium'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                    : 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                : 'bg-muted/30 dark:bg-white/[0.02] text-muted-foreground border-border hover:bg-muted/50 dark:hover:bg-white/10'
                            }`}
                          >
                            {p.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Assignment & Details */}
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-muted-foreground">
                          Created By
                        </label>
                        <input
                          readOnly
                          className="w-full bg-muted/20 dark:bg-white/[0.02] border border-border rounded-xl p-3 focus:outline-none text-muted-foreground/80 cursor-not-allowed text-xs font-semibold"
                          value={formData.created_by}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                          <Calendar size={14} /> Due Date
                        </label>
                        <input
                          type="date"
                          readOnly={readOnly}
                          className={`w-full bg-muted/40 dark:bg-white/5 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs text-foreground font-semibold ${readOnly ? 'cursor-default border-transparent bg-muted/20' : ''}`}
                          value={formData.due_date}
                          onChange={(e) =>
                            !readOnly &&
                            setFormData({
                              ...formData,
                              due_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 relative" ref={dropdownRef}>
                      <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                        <User size={14} /> Assignee
                      </label>

                      {/* Custom Searchable Dropdown */}
                      {!readOnly && (
                        <div className="space-y-3">
                          <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full bg-muted/40 dark:bg-white/5 border border-border rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Plus size={18} />
                              </div>
                              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                Add Assignee
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded-md">
                                {formData.members.length} Selected
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* List of Added Assignees - FIXED HEIGHT SCROLLABLE */}
                      <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                        {formData.members.map((user, idx) => (
                          <div
                            key={user.id || idx}
                            className="flex items-center justify-between p-3 bg-muted/20 dark:bg-white/[0.02] border border-border rounded-2xl group"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">
                                {user.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {user.email || `ID: ${user.id}`}
                              </span>
                            </div>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    members: formData.members.filter(
                                      (m) => m.id !== user.id,
                                    ),
                                  });
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}

                        {formData.members.length === 0 && !isDropdownOpen && (
                          <div className="p-4 text-center text-xs text-muted-foreground italic border-2 border-dashed border-muted-foreground/10 rounded-2xl">
                            No users assigned yet
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-card dark:bg-zinc-900 border border-border rounded-2xl shadow-2xl z-[60] overflow-hidden"
                          >
                            <div className="p-2 border-b border-border bg-muted/40 dark:bg-white/5">
                              <input
                                autoFocus
                                className="w-full bg-transparent p-2 text-sm focus:outline-none placeholder:text-muted-foreground/50 text-foreground font-medium"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                              {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => {
                                      const isSelected = formData.members.some(
                                        (m) =>
                                          String(m.id) ===
                                          String(u.id || u.userId),
                                      );
                                      const newMembers = isSelected
                                        ? formData.members.filter(
                                            (m) =>
                                              String(m.id) !==
                                              String(u.id || u.userId),
                                          )
                                        : [
                                            ...formData.members,
                                            {
                                              name:
                                                u.displayName ||
                                                u.userName ||
                                                'Unknown',
                                              email:
                                                u.detail?.email ||
                                                u.emailAddress ||
                                                u.email ||
                                                u.mail ||
                                                u.userName ||
                                                '',
                                              id: u.id || u.userId || '',
                                            },
                                          ];

                                      setFormData({
                                        ...formData,
                                        members: newMembers,
                                      });
                                      if (!isSelected) {
                                        setIsDropdownOpen(false);
                                        setSearchTerm('');
                                      }
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-primary/20 rounded-xl transition-all flex items-center justify-between group"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                        {u.displayName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                        {u.detail?.email ||
                                          u.emailAddress ||
                                          u.email ||
                                          u.mail ||
                                          u.userName ||
                                          `ID: ${u.id || u.userId}`}
                                      </span>
                                    </div>
                                    {formData.members.some(
                                      (m) =>
                                        String(m.id) ===
                                        String(u.id || u.userId),
                                    ) && (
                                      <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                                    )}
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-xs text-muted-foreground italic">
                                  No users found
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`${readOnly ? 'flex-[1]' : 'flex-1'} p-3.5 rounded-2xl border border-border font-bold hover:bg-muted dark:hover:bg-white/5 transition-colors text-muted-foreground`}
                  >
                    {readOnly ? 'Close' : 'Cancel'}
                  </button>
                  {!readOnly && (
                    <button
                      type="submit"
                      className="flex-[2] bg-primary text-primary-foreground p-3.5 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                      {task ? 'Update Task' : 'Create Task'}
                      {!task && <Plus size={18} />}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddTaskModal;
