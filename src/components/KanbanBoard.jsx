import React, { useEffect, useState } from 'react';
import KanbanColumn from './KanbanColumn';
import AddTaskModal from './AddTaskModal';
import DomoApi from '../API/domoAPI';
import DeleteConfirmModal from './DeleteConfirmModal';
import ProfilePreviewModal from './ProfilePreviewModal';
import { generateId } from '../lib/helpers';
import {
  Plus,
  Search,
  Layout,
  Moon,
  Sun,
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Home,
  Columns,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SkeletonColumn from './SkeletonColumn';
import { startWorkflow } from './WorkflowApi';

const TASK_COLLECTION = 'kanban_task';
const PROJECT_COLLECTION = 'kanban_project';

const KanbanBoard = ({
  project: initialProject,
  currentUser,
  domoUsers,
  onBack,
  isDarkMode,
  setIsDarkMode,
}) => {
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [initialStatus, setInitialStatus] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProfilePreviewOpen, setIsProfilePreviewOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [columns, setColumns] = useState(project?.columns || []);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const headerMembersDropdownRef = React.useRef(null);

  const isLead =
    String(project?.created_by_id) ===
    String(currentUser?.userId || currentUser?.id) ||
    project?.created_by === (currentUser?.displayName || currentUser?.userName);

  const isMember =
    project?.members?.some(
      (m) => String(m.id) === String(currentUser?.userId || currentUser?.id),
    ) || isLead;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        headerMembersDropdownRef.current &&
        !headerMembersDropdownRef.current.contains(event.target)
      ) {
        setIsMembersDropdownOpen(false);
      }
    };
    if (isMembersDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMembersDropdownOpen]);

  useEffect(() => {
    const normalizedProject = initialProject
      ? (() => {
        const { _id: legacyId, id: contentId, ...rest } = initialProject;
        return { ...rest, id: initialProject.id || legacyId || contentId };
      })()
      : null;

    if (normalizedProject?.id) {
      setProject(normalizedProject);
      setColumns(normalizedProject.columns || []);
      loadTasks();
    }
  }, [initialProject?.id, initialProject?._id]);

  const handleUpdateProject = async (updatedData) => {
    try {
      setProject(updatedData);
      const { id: _omitId, _id: _omitLegacy, ...payload } = updatedData || {};
      await DomoApi.UpdateDocument(PROJECT_COLLECTION, project.id, payload);
    } catch (error) {
      console.error('Error updating project:', error);
      // Revert if failed
      setProject(project);
    }
  };

  const handleAddMember = async (user) => {
    const currentMembers = project.members || [];
    const isAlreadyMember = currentMembers.some(
      (m) => String(m.id) === String(user.id || user.userId),
    );
    if (isAlreadyMember) return;

    const newMember = {
      name: user.displayName || user.userName,
      email: user.detail?.email || user.emailAddress || user.email || '',
      id: user.id || user.userId,
    };

    const updatedMembers = [...currentMembers, newMember];

    await handleUpdateProject({ ...project, members: updatedMembers });

    // Send notification to the newly added member
    if (newMember.email) {
      const creatorName =
        currentUser?.displayName || currentUser?.userName || 'a team member';
      startWorkflow({
        To: newMember.email,
        Subject: `Added to Project: ${project.project_name}`,
        Body: `Hi ${newMember.name},\n\nYou have been added to the project "${project.project_name}" by ${creatorName}.\n\nYou can now collaborate on tasks and track progress in the workspace.\n\nBest regards,\nKanban Flow`,
      }).catch((err) => console.error('Project addition email failed', err));
    }

    setMemberSearchTerm('');
  };

  const handleRemoveMember = (memberId) => {
    const currentMembers = project.members || [];
    const memberToRemove = currentMembers.find(
      (m) => String(m.id) === String(memberId),
    );
    if (memberToRemove?.name === project.created_by) {
      alert('You cannot remove the project lead.');
      return;
    }

    const updatedMembers = currentMembers.filter(
      (m) => String(m.id) !== String(memberId),
    );
    handleUpdateProject({ ...project, members: updatedMembers });
  };

  const loadTasks = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const targetProjectId = project.id;
      const res = await DomoApi.ListDocuments(TASK_COLLECTION);
      const data = Array.isArray(res)
        ? res
          .map((doc) => {
            const {
              _id: legacyId,
              id: contentId,
              ...rest
            } = doc.content || {};
            return { ...rest, id: doc.id || legacyId || contentId };
          })
          .filter(
            (task) => String(task.projectId) === String(targetProjectId),
          )
        : [];

      console.log(
        `[Kanban] Loaded ${data.length} tasks for project ${targetProjectId}`,
      );
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const sendTaskNotification = (task, isNew = false) => {
    const members = task.members || task.assignees || [];
    if (members.length === 0) return;

    const creatorName =
      currentUser?.displayName || currentUser?.userName || 'a team member';
    const statusLabel =
      columns.find((c) => String(c.key) === String(task.status))?.label ||
      task.status;
    const subject = isNew
      ? `New Task Assigned: ${task.task_name || task.title}`
      : `Task Updated: ${task.task_name || task.title}`;

    const body = `Hi Team,\n\n${isNew ? `A new task has been assigned to you` : `A task you are involved in has been updated`} by ${creatorName}.\n\n--- TASK DETAILS ---\nTask: ${task.task_name || task.title}\nStatus: ${statusLabel}\nPriority: ${task.priority || 'Normal'}\nDue Date: ${task.due_date || 'Not set'}\nDescription: ${task.description || 'No description'}\n\nBest regards,\nKanban Flow`;

    members.forEach((member) => {
      if (member.email) {
        startWorkflow({
          To: member.email,
          Subject: subject,
          Body: body,
        }).catch((err) =>
          console.error('Notification failed for', member.email, err),
        );
      }
    });
  };

  const handleSaveTask = async (taskData) => {
    if (!isMember) {
      alert('Only project members can edit tasks.');
      return;
    }

    try {
      const projectId = project?.id || project?._id;
      if (!projectId) {
        console.error('No project ID found for task save');
        return;
      }

      const taskToSave = {
        ...taskData,
        projectId: projectId,
        updatedAt: new Date().toISOString(),
      };

      if (editingTask) {
        const taskId = editingTask.id;
        // Optimistic update
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...taskToSave } : t)),
        );

        const { id: _omitId, ...payload } = { ...taskToSave };
        await DomoApi.UpdateDocument(TASK_COLLECTION, taskId, payload);
        sendTaskNotification({ ...editingTask, ...taskToSave }, false);
        setEditingTask(null);
      } else {
        const newTask = {
          ...taskToSave,
          id: generateId(),
          createdAt: new Date().toISOString(),
          status: taskData.status || initialStatus || columns[0]?.key || 'todo',
        };
        // Optimistic update
        setTasks((prev) => [...prev, newTask]);

        const { id: _omitId, ...payload } = { ...newTask };
        await DomoApi.CreateDocument(TASK_COLLECTION, payload);
        sendTaskNotification(newTask, true);
      }
      // Re-load to sync with DB and get real IDs/index state
      await loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      // Rollback on error
      loadTasks();
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;

    const newCol = {
      key: generateId(), // Unique key for the status
      label: newColumnName.trim(),
    };

    const updatedColumns = [...columns, newCol];
    setColumns(updatedColumns);
    setIsAddingColumn(false);
    setNewColumnName('');

    // Update project document
    try {
      const { id: _omitId, _id: _omitLegacy, ...rest } = project || {};
      await DomoApi.UpdateDocument(PROJECT_COLLECTION, project.id, {
        ...rest,
        columns: updatedColumns,
      });
    } catch (err) {
      console.error('Error updating columns:', err);
    }
  };

  const handleDeleteColumn = async (columnKey) => {
    if (
      !confirm(
        "Are you sure you want to delete this column? All tasks in it will remain in the database but won't be visible.",
      )
    )
      return;

    const updatedColumns = columns.filter((c) => c.key !== columnKey);
    setColumns(updatedColumns);

    try {
      const { id: _omitId, _id: _omitLegacy, ...rest } = project || {};
      await DomoApi.UpdateDocument(PROJECT_COLLECTION, project.id, {
        ...rest,
        columns: updatedColumns,
      });
    } catch (err) {
      console.error('Error deleting column:', err);
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    if (!isMember) return;

    const currentTasks = [...tasks];
    const updatedTasks = currentTasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t,
    );
    setTasks(updatedTasks);

    try {
      const { id: _omitId, ...payload } = { ...updatedTask };
      await DomoApi.UpdateDocument(TASK_COLLECTION, updatedTask.id, payload);
      sendTaskNotification(updatedTask, false);
    } catch (err) {
      console.error('Update failed', err);
      loadTasks();
    }
  };

  const handleDropTask = (task, newStatus) => {
    if (task.status === newStatus) return;
    handleUpdateTask({ ...task, status: newStatus });
  };

  const handleDeleteTask = (task) => {
    if (!isMember) return;
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      await DomoApi.DeleteDocument(TASK_COLLECTION, taskToDelete.id);
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      loadTasks();
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    const taskName = task.task_name || task.title || '';
    const description = task.description || '';
    const parseMembers = (members) => {
      if (Array.isArray(members)) return members;
      if (typeof members === 'string') {
        try {
          return JSON.parse(members) || [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const membersList =
      parseMembers(task.members) || parseMembers(task.assignees) || [];

    return (
      taskName.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query) ||
      membersList.some((a) => a.name?.toLowerCase().includes(query))
    );
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-[#0a0a0a]' : 'bg-[#f8f9fa]'}`}
    >
      <nav className="nav-glass">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-[1px] bg-border" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                <Layout size={18} />
              </div>
              <span className="font-bold tracking-tight text-lg dark:text-white truncate max-w-[200px]">
                {project?.project_name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <input
                className="bg-muted border-none rounded-md pl-9 pr-4 py-1.5 w-64 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60 dark:text-white"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div
              onClick={() => setIsProfilePreviewOpen(true)}
              className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              {currentUser?.avatarKey ? (
                <img
                  src={currentUser.avatarKey}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold text-primary uppercase">
                  {currentUser?.displayName?.charAt(0) || 'U'}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto p-8">
        <header className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Home size={14} />
              <span
                className="hover:text-primary cursor-pointer transition-colors"
                onClick={onBack}
              >
                Projects
              </span>
              <span>/</span>
              <span className="font-bold text-foreground dark:text-white">
                {project?.project_name}
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter dark:text-white flex items-center gap-3 lowercase first-letter:uppercase">
              Task Board
            </h2>
          </div>
          <div
            className="flex items-center gap-3 relative"
            ref={headerMembersDropdownRef}
          >
            <div
              className="flex -space-x-2 cursor-pointer hover:scale-105 transition-all p-1 hover:bg-muted/50 rounded-full"
              onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
              title="View all team members"
            >
              {project?.members?.slice(0, 5).map((m, i) => {
                const avatarUrl = `/domo/avatars/v2/USER/${m.id}`;
                return (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-background dark:border-[#0a0a0a] bg-secondary flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm"
                  >
                    <img
                      src={avatarUrl}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="dark:text-white">${m.name.charAt(0)}</span>`;
                      }}
                    />
                  </div>
                );
              })}
              {project?.members?.length > 5 && (
                <div className="w-9 h-9 rounded-full border-2 border-background dark:border-[#0a0a0a] bg-muted flex items-center justify-center text-[10px] font-black dark:text-white shadow-sm">
                  +{project.members.length - 5}
                </div>
              )}
            </div>

            <AnimatePresence>
              {isMembersDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-72 bg-card dark:bg-[#121215] border border-border dark:border-white/10 rounded-3xl shadow-2xl z-[100] overflow-hidden p-3"
                >
                  <div className="px-4 py-3 border-b border-border/50 dark:border-white/5 mb-2 flex justify-between items-center bg-primary/5 rounded-2xl">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                      Team Members
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
                      {project?.members?.length}
                    </span>
                  </div>

                  {isLead && (
                    <div className="mb-3 px-1">
                      <div className="relative">
                        <Plus
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50"
                          size={12}
                        />
                        <input
                          className="w-full bg-muted/40 dark:bg-white/5 border border-border/20 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-[10px] outline-none focus:ring-1 focus:ring-primary/30 transition-all font-bold dark:text-white"
                          placeholder="Search users to add..."
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                        />
                      </div>

                      {memberSearchTerm && (
                        <div className="mt-2 max-h-32 overflow-y-auto custom-scrollbar bg-card/95 dark:bg-[#1a1a20] border border-border/20 dark:border-white/10 rounded-xl p-1 shadow-lg">
                          {domoUsers
                            .filter(
                              (u) =>
                                u.displayName
                                  ?.toLowerCase()
                                  .includes(memberSearchTerm.toLowerCase()) &&
                                !project.members.some(
                                  (m) =>
                                    String(m.id) === String(u.id || u.userId),
                                ),
                            )
                            .map((u) => (
                              <button
                                key={u.id || u.userId}
                                onClick={() => handleAddMember(u)}
                                className="w-full text-left p-2 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg text-[10px] font-bold flex items-center justify-between transition-colors dark:text-foreground/90 font-bold"
                              >
                                <span>{u.displayName}</span>
                                <Plus size={10} className="text-primary" />
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1 pb-1">
                    {project?.members?.map((m) => {
                      const mIsLead = project.created_by === m.name;
                      const avatarUrl = `/domo/avatars/v2/USER/${m.id}`;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-2xl transition-all group"
                        >
                          <div className="flex items-center justify-center w-6 shrink-0">
                            {isLead && !mIsLead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMember(m.id);
                                }}
                                className="text-red-500 hover:scale-110 active:scale-95 transition-all"
                                title="Remove from project"
                              >
                                <X size={16} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-xl overflow-hidden border border-border/50 bg-secondary flex items-center justify-center shrink-0">
                            <img
                              src={avatarUrl}
                              alt={m.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random&color=fff&bold=true`;
                              }}
                            />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-bold text-foreground truncate">
                                {m.name}
                              </span>
                              {mIsLead && (
                                <span className="text-[7px] bg-primary text-white px-1.5 py-0.5 rounded-md font-black uppercase shrink-0">
                                  Lead
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {m.email || 'No email'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar min-h-[calc(100vh-280px)] items-start">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-w-[320px] max-w-[380px] basis-[340px] shrink-0"
              >
                <SkeletonColumn />
              </div>
            ))
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {columns.map((col, index) => (
                  <motion.div
                    key={col.key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="min-w-[320px] max-w-[380px] basis-[340px] shrink-0"
                  >
                    {(() => {
                      const projectUsers = domoUsers.filter(
                        (u) =>
                          project.members?.some(
                            (m) => String(m.id) === String(u.id || u.userId),
                          ) ||
                          String(u.id || u.userId) ===
                          String(project.created_by_id),
                      );

                      return (
                        <KanbanColumn
                          key={col.key}
                          title={col.label}
                          status={col.key}
                          tasks={filteredTasks.filter((t) => {
                            const match = String(t.status) === String(col.key);
                            if (match)
                              console.log(
                                `Matched task "${t.task_name}" to column "${col.label}"`,
                              );
                            return match;
                          })}
                          domoUsers={projectUsers}
                          onDropTask={handleDropTask}
                          onUpdateTask={handleUpdateTask}
                          onDeleteTask={handleDeleteTask}
                          onEditTask={(task) => {
                            setEditingTask(task);
                            setIsModalOpen(true);
                          }}
                          onAddTask={(status) => {
                            if (!isMember) return;
                            setEditingTask(null);
                            setInitialStatus(status);
                            setIsModalOpen(true);
                          }}
                          onDeleteColumn={() => handleDeleteColumn(col.key)}
                          currentUser={currentUser}
                          isMember={isMember}
                        />
                      );
                    })()}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Column Button Card */}
              {isMember && (
                <div className="min-w-[320px] max-w-[380px] basis-[340px] shrink-0 mt-[44px]">
                  {isAddingColumn ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border-2 border-primary/20 rounded-3xl p-4 shadow-2xl shadow-primary/5"
                    >
                      <div className="flex items-center gap-2 mb-3 text-primary/80 dark:text-primary">
                        <Columns size={16} />
                        <span className="font-black text-[10px] uppercase tracking-wider">
                          New Column
                        </span>
                      </div>
                      <input
                        autoFocus
                        className="w-full bg-muted/40 dark:bg-zinc-900 border border-border rounded-xl p-3 mb-3 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all dark:text-white text-black placeholder:text-muted-foreground/50"
                        placeholder="Enter title..."
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleCreateColumn()
                        }
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleCreateColumn}
                          className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingColumn(false);
                            setNewColumnName('');
                          }}
                          className="flex-1 bg-muted dark:bg-zinc-800 hover:bg-muted/80 dark:hover:bg-zinc-700 py-2.5 rounded-xl text-xs font-bold transition-all dark:text-white text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsAddingColumn(true)}
                      className="w-full bg-muted/20 border-2 border-dashed border-border/80 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group h-[120px]"
                    >
                      <div className="w-10 h-10 bg-muted/50 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Plus size={20} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-sm">Add Column</span>
                    </motion.button>
                  )}
                </div>
              )}
            </>
          )}

          {!loading && columns.length === 0 && !isAddingColumn && isMember && (
            <div className="flex flex-col items-center justify-center w-full py-20 text-center opacity-60">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                <Layout size={40} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Empty Board</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Start by adding a column to organize your projects tasks.
              </p>
            </div>
          )}
        </div>

        <AddTaskModal
          isOpen={isModalOpen}
          task={editingTask}
          initialStatus={initialStatus}
          currentUser={currentUser}
          domoUsers={
            project?.members?.map((m) => ({
              displayName: m.name,
              userName: m.name,
              id: m.id,
              userId: m.id,
              detail: { email: m.email },
            })) || []
          }
          readOnly={!isMember}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onAdd={handleSaveTask}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteTask}
          taskTitle={taskToDelete?.task_name || taskToDelete?.title || ''}
        />

        <ProfilePreviewModal
          isOpen={isProfilePreviewOpen}
          onClose={() => setIsProfilePreviewOpen(false)}
          user={currentUser}
        />
      </main>
    </div>
  );
};

export default KanbanBoard;
