import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Pencil,
  User,
  Mail,
  Calendar,
  UserPlus,
  Check,
  X,
  Search,
} from 'lucide-react';

const TaskCard = ({
  task,
  onDelete,
  onEdit,
  onUpdate,
  domoUsers,
  currentUser,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isDropdownOpen) {
      setMemberSearch('');
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50';
    }
  };

  const isCreator =
    String(task.created_by || '').trim() ===
    String(currentUser?.displayName || currentUser?.userName || '').trim();

  const handleToggleAssignee = (user) => {
    const currentMembers =
      task.members ||
      task.assignees ||
      (task.assigned_to
        ? [
            {
              name: task.assigned_to,
              email: task.assigned_email,
              id: task.assigned_id,
            },
          ]
        : []);

    const isSelected = currentMembers.some(
      (a) => String(a.id) === String(user.id || user.userId),
    );
    let newMembers;

    if (isSelected) {
      newMembers = currentMembers.filter(
        (a) => String(a.id) !== String(user.id || user.userId),
      );
    } else {
      newMembers = [
        ...currentMembers,
        {
          name: user.displayName || user.userName || 'Unknown',
          email:
            user.detail?.email ||
            user.emailAddress ||
            user.email ||
            user.mail ||
            user.userName ||
            '',
          id: user.id || user.userId || '',
        },
      ];
    }

    const primaryAssignee = newMembers[0] || {};
    onUpdate({
      ...task,
      members: newMembers,
      assigned_to: primaryAssignee.name || '',
      assigned_email: primaryAssignee.email || '',
      assigned_id: primaryAssignee.id || '',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onEdit(task)}
      className="glass-card p-4 rounded-2xl shadow-sm border border-white/40 dark:border-white/5 mb-4 group relative active:cursor-grabbing"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-foreground/90 leading-tight">
          {task.task_name || task.title}
        </h3>
        <div className="flex items-center gap-1 show-on-hover transition-all">
          {(isCreator || !task.created_by) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
              title="Delete task"
            >
              <Trash2
                size={16}
                strokeWidth={2.5}
                className="destructive-icon"
              />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground dark:text-foreground/70 mb-4 line-clamp-2">
        {task.description || 'No description provided.'}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-y-3 mt-auto">
        {(() => {
          // ── Safe members parser — fixes .map() crash from agent ──
          const parseMembers = (members) => {
            if (Array.isArray(members)) return members;
            if (typeof members === 'string') {
              try {
                const parsed = JSON.parse(members);
                return Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                return [];
              }
            }
            return [];
          };

          const membersList =
            parseMembers(task.members) ||
            parseMembers(task.assignees) ||
            (task.assigned_to
              ? [
                  {
                    name: task.assigned_to,
                    email: task.assigned_email,
                    id: task.assigned_id,
                  },
                ]
              : []);

          return (
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex -space-x-1.5 cursor-pointer hover:opacity-80 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                {membersList.length === 0 ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 dark:bg-white/10 rounded-lg text-muted-foreground dark:text-foreground/80 border border-white/10">
                    <UserPlus size={12} />
                    Add members
                  </div>
                ) : (
                  <>
                    {membersList.map((assignee, idx) => {
                      const assignedUser = domoUsers?.find(
                        (u) => String(u.id || u.userId) === String(assignee.id),
                      );
                      return (
                        <div
                          key={assignee.id || idx}
                          className="w-6 h-6 rounded-full bg-background border-2 border-card flex items-center justify-center overflow-hidden shadow-sm"
                          title={assignee.name}
                        >
                          {assignedUser?.avatarKey || assignee.id ? (
                            <img
                              src={
                                assignedUser?.avatarKey ||
                                `/domo/avatars/v2/USER/${assignee.id}`
                              }
                              alt={assignee.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="text-[7px] font-bold text-primary">${(assignee.name || 'U').charAt(0).toUpperCase()}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-[7px] font-bold text-primary uppercase">
                              {(assignee.name || 'U').charAt(0)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div className="pl-3 flex flex-col justify-center gap-0.5">
                      <span className="text-muted-foreground/80 text-[10px] font-bold leading-tight">
                        {membersList.length === 1
                          ? membersList[0].name
                          : `${membersList.length} Members`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl z-[50] overflow-hidden p-3 origin-top-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">
                        Project Team
                      </span>
                      <X
                        size={14}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                    </div>

                    <div className="relative mb-3">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                        size={14}
                      />
                      <input
                        className="w-full bg-muted/40 border-none rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
                        placeholder="Search project members..."
                        autoFocus
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto custom-scrollbar -mx-1 px-1">
                      {(() => {
                        const filteredMembers = domoUsers?.filter((u) =>
                          (u.displayName || u.userName || '')
                            .toLowerCase()
                            .includes(memberSearch.toLowerCase()),
                        );

                        if (filteredMembers?.length === 0) {
                          return (
                            <div className="text-[10px] text-muted-foreground text-center py-4 italic font-medium">
                              No results found
                            </div>
                          );
                        }

                        return filteredMembers?.map((user) => {
                          const isSelected = membersList.some(
                            (a) =>
                              String(a.id) === String(user.id || user.userId),
                          );
                          return (
                            <button
                              key={user.id || user.userId}
                              onClick={() => handleToggleAssignee(user)}
                              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold hover:bg-primary/10 rounded-xl transition-all group mb-0.5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                  {user.avatarKey || user.id ? (
                                    <img
                                      src={
                                        user.avatarKey ||
                                        `/domo/avatars/v2/USER/${user.id || user.userId}`
                                      }
                                      alt={user.displayName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent =
                                          user.displayName?.charAt(0);
                                      }}
                                    />
                                  ) : (
                                    <span className="text-[10px] uppercase">
                                      {user.displayName?.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                  <span
                                    className={`truncate w-full text-left ${isSelected ? 'text-primary' : 'text-foreground'}`}
                                  >
                                    {user.displayName}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground/50 font-medium truncate w-full italic">
                                    Member
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Check size={12} className="text-primary" />
                                </div>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {task.priority && (
          <div
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${getPriorityColor(task.priority)}`}
          >
            {task.priority.toUpperCase()}
          </div>
        )}

        {task.created_by && (
          <div className="w-full mt-2 pt-2 border-t border-white/5 text-[10px] text-muted-foreground/60 flex items-center gap-1 italic">
            <span>By</span>
            <span className="font-bold">{task.created_by}</span>
          </div>
        )}
      </div>

      {/* Subtle bottom accent line based on status */}
      <div
        className={`absolute bottom-0 left-0 h-1 bg-primary/30 w-full rounded-b-2xl transition-all duration-300 opacity-0 group-hover:opacity-100`}
      />
    </motion.div>
  );
};

export default TaskCard;
