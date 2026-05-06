import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layout, Users, X, Search, LogOut, ArrowRight, Home, Moon, Sun, Briefcase, FolderPlus, Compass, Trash2 } from "lucide-react";
import DomoApi from "../API/domoAPI";
import { generateId } from "../lib/helpers";
import { startWorkflow } from "../components/WorkflowApi";

const PROJECT_COLLECTION = "kanban_project";

const ProjectSelection = ({ onSelectProject, currentUser, domoUsers, isDarkMode, setIsDarkMode }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ project_name: "", members: [] });
    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const currentUserId = currentUser?.userId || currentUser?.id;
            const currentUserName = currentUser?.displayName || currentUser?.userName || "";

            const query = {
                "$and": [
                    { "content.admin_aproval": { "$in": ["true", true] } },
                    {
                        "$or": [
                            { "content.created_by_id": { "$in": [currentUserId, String(currentUserId), Number(currentUserId)] } },
                            { "content.created_by": currentUserName },
                            { "content.members.id": { "$in": [currentUserId, String(currentUserId), Number(currentUserId)] } }
                        ]
                    }
                ]
            };

            const res = await DomoApi.QueryDocument(PROJECT_COLLECTION, query);
            const data = Array.isArray(res) ? res.map(doc => {
                let content = doc.content || {};

                // Parse nested Agent_Result if it exists as a JSON string
                if (content.Agent_Result) {
                    try {
                        const parsed = typeof content.Agent_Result === 'string'
                            ? JSON.parse(content.Agent_Result)
                            : content.Agent_Result;
                        content = { ...content, ...parsed };
                    } catch (e) {
                        console.error("Error parsing Agent_Result for doc:", doc.id, e);
                    }
                }

                const { _id: legacyId, id: contentId, ...rest } = content;
                return {
                    ...rest,
                    id: doc.id || legacyId || contentId,
                    admin_aproval: rest.admin_approval || rest.admin_aproval || "pending",
                    project_name: rest.project_name || "Unnamed Project",
                    created_by: rest.created_by || "System",
                    createdAt: rest.createdAt || rest.created_date || doc.createdOn || new Date().toISOString(),
                    updatedAt: rest.updatedAt || doc.updatedOn,
                    members: rest.members || []
                };
            }) : [];
            setProjects(data);
        } catch (error) {
            console.error("Error loading projects:", error);
        } finally {
            setTimeout(() => setLoading(false), 800); // Smooth loading transition
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const projectToSave = editingProject || newProject;
        if (!projectToSave.project_name) return;

        try {
            const creatorName = currentUser?.displayName || currentUser?.userName || "a team member";
            let newlyAddedMembers = [];

            if (editingProject) {
                // Find original project to compare members
                const originalProject = projects.find(p => p.id === editingProject.id);
                const originalMemberIds = originalProject?.members?.map(m => String(m.id)) || [];

                // New members are those in the current list but not in the original list
                newlyAddedMembers = editingProject.members.filter(m => !originalMemberIds.includes(String(m.id)));

                const { id: _omitId, _id: _omitLegacy, Agent_Result: _omitAgent, ...rest } = editingProject || {};
                await DomoApi.UpdateDocument(PROJECT_COLLECTION, editingProject.id, {
                    ...rest,
                    updatedAt: new Date().toISOString()
                });
            } else {
                const projectData = {
                    ...newProject,
                    created_by: currentUser?.displayName || currentUser?.userName || "Unknown",
                    created_by_id: currentUser?.userId || currentUser?.id,
                    created_by_email: currentUser?.detail?.email || currentUser?.emailAddress || currentUser?.email || "",
                    createdAt: new Date().toISOString(),
                    columns: [{ key: "todo", label: "Todo" }],
                    admin_aproval: "false" // Default to false for admin approval
                };
                await DomoApi.CreateDocument(PROJECT_COLLECTION, projectData);
                newlyAddedMembers = projectData.members || [];
                projectToSave.project_name = projectData.project_name; // For email context
            }

            setIsModalOpen(false);
            setNewProject({ project_name: "", members: [] });
            setEditingProject(null);
            loadProjects();
        } catch (error) {
            console.error("Error saving project:", error);
        }
    };

    const handleDeleteProject = (e, project) => {
        e.stopPropagation();
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            await DomoApi.DeleteDocument(PROJECT_COLLECTION, projectToDelete.id);
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
            loadProjects();
        } catch (error) {
            console.error("Error deleting project:", error);
        }
    };

    const userProjects = projects.filter(p => {
        const isCreator = String(p.created_by_id) === String(currentUser?.userId || currentUser?.id) ||
            String(p.created_by || '').trim().toLowerCase() === String(currentUser?.displayName || currentUser?.userName || '').trim().toLowerCase();
        const isMember = p.members?.some(m => String(m.id) === String(currentUser?.userId || currentUser?.id));
        const isApproved = String(p.admin_aproval) === "true";
        return (isCreator || isMember) && isApproved;
    });

    const filteredProjects = userProjects.filter(p =>
        p.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = (domoUsers || []).filter(u =>
        (u?.displayName || "").toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
            {/* Header Mirroring Kanban Board */}
            <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/10">
                <div className="max-w-[1500px] mx-auto px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <Briefcase size={22} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <span className="font-extrabold tracking-tighter text-2xl dark:text-white">Domo <span className="text-primary">Planner</span></span>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
                            <input
                                className="bg-muted/50 dark:bg-zinc-900 border-none rounded-2xl pl-11 pr-4 py-2.5 w-72 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/40 dark:text-white"
                                placeholder="Search your projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-900 rounded-2xl transition-all"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-between overflow-hidden hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md">
                            {currentUser?.avatarKey ? (
                                <img src={currentUser.avatarKey} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-black text-primary uppercase">
                                    {currentUser?.displayName?.charAt(0) || "U"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1500px] mx-auto p-10">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-[0.2em] mb-2">
                            <Compass size={14} />
                            Navigate
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter dark:text-white">Workspace</h1>
                        <p className="text-muted-foreground/60 mt-2 text-base font-medium">Create or select a project to manage your tasks.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-card border border-border/10 rounded-[2.5rem] p-8 min-h-[260px] animate-pulse">
                                <div className="h-14 w-14 bg-muted/50 rounded-2xl mb-6" />
                                <div className="h-8 w-2/3 bg-muted/50 rounded-xl mb-4" />
                                <div className="h-4 w-full bg-muted/30 rounded-lg mb-8" />
                                <div className="flex gap-2">
                                    <div className="w-10 h-10 rounded-full bg-muted/50" />
                                    <div className="w-10 h-10 rounded-full bg-muted/50" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : userProjects.length === 0 ? (
                    /* Empty State UI */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                    >
                        <div className="w-24 h-24 bg-muted/20 rounded-[2.5rem] flex items-center justify-center mb-6 rotate-12">
                            <Layout size={40} className="text-muted-foreground/20" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter mb-3 dark:text-white">No Projects Found</h2>
                        <p className="text-muted-foreground/60 max-w-sm text-sm font-medium leading-relaxed">
                            Start by creating your first workspace to begin managing tasks efficiently.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsModalOpen(true)}
                            className="mt-8 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 flex items-center gap-2 transition-all"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Create Project
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* New Project Trigger */}
                        <motion.div
                            whileHover={{ scale: 1.03, y: -8 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsModalOpen(true)}
                            className="bg-primary/5 dark:bg-primary/[0.03] border-2 border-dashed border-primary/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all min-h-[280px] group"
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-xl shadow-primary/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <FolderPlus size={36} strokeWidth={2.5} />
                            </div>
                            <div className="text-center">
                                <span className="font-black text-xl text-foreground block">New Project</span>
                                <span className="text-xs text-muted-foreground/60 font-medium">Start a fresh workspace</span>
                            </div>
                        </motion.div>

                        {/* Project Cards */}
                        {filteredProjects.map((project, index) => {
                            const isCreator = String(project.created_by || '').trim() === String(currentUser?.displayName || currentUser?.userName || '').trim();

                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                                    whileHover={{ scale: 1.03, y: -8 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectProject(project);
                                    }}
                                    className="bg-card dark:bg-zinc-900 border border-border/10 rounded-[2.5rem] p-8 flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:shadow-primary/10 transition-all group min-h-[280px] relative overflow-hidden"

                                >
                                    {isCreator && (
                                        <button
                                            onClick={(e) => handleDeleteProject(e, project)}
                                            className="absolute top-6 right-6 p-2.5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all z-20 hover:scale-110 active:scale-95 shadow-lg shadow-red-500/10 opacity-0 group-hover:opacity-100"
                                            title="Delete Project"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-all" />

                                    <div>
                                        <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">
                                            {project.project_name}
                                        </h3>
                                        <div className="flex flex-col gap-1 mb-3">
                                            {(project.created_date || project.createdAt) && (
                                                <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider">
                                                    {new Date(project.created_date || project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-muted-foreground/60 font-medium italic line-clamp-1">
                                                Created by {project.created_by}
                                            </p>
                                        </div>
                                        {project.description && (
                                            <p 
                                                className="text-xs text-muted-foreground/80 font-medium line-clamp-3"
                                                title={project.description}
                                            >
                                                {project.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex -space-x-4">
                                            {project.members?.slice(0, 5).map((member, i) => {
                                                const avatarUrl = `/domo/avatars/v2/USER/${member.id}`;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="w-10 h-10 rounded-full border-4 border-card dark:border-zinc-900 bg-secondary dark:bg-zinc-800 overflow-hidden shadow-sm group/avatar relative"
                                                        title={member.name}
                                                    >
                                                        <img
                                                            src={avatarUrl}
                                                            alt={member.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&bold=true`;
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                            {project.members?.length > 5 && (
                                                <div className="w-10 h-10 rounded-full border-4 border-card dark:border-zinc-900 bg-muted flex items-center justify-center text-[10px] font-black z-10">
                                                    +{project.members.length - 5}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingProject(project);
                                                setIsModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all z-20 border border-primary/20"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {searchTerm && filteredProjects.length === 0 && (
                            <div className="col-span-full py-10 text-center">
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs italic">No projects match "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                )}

            </main>


            {/* Create Project Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="relative w-full max-w-xl bg-card dark:bg-[#121212] border border-border/10 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                        >
                            <div className="p-10">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 dark:text-white text-black">
                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                            {editingProject ? <Layout size={24} /> : <FolderPlus size={24} />}
                                        </div>
                                        {editingProject ? "Edit Project" : "Create Project"}
                                    </h2>
                                    <button onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingProject(null);
                                    }} className="p-2.5 hover:bg-muted rounded-xl text-muted-foreground transition-all active:scale-90">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateProject} className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-primary uppercase tracking-widest pl-1">Project Name</label>
                                        <input
                                            className="w-full bg-muted/40 dark:bg-white/5 border border-border/10 rounded-[1.5rem] p-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 font-bold text-lg dark:text-white text-black"
                                            placeholder="Ex: Marketing Campaign..."
                                            value={editingProject ? editingProject.project_name : newProject.project_name}
                                            onChange={(e) => {
                                                if (editingProject) {
                                                    setEditingProject({ ...editingProject, project_name: e.target.value });
                                                } else {
                                                    setNewProject({ ...newProject, project_name: e.target.value });
                                                }
                                            }}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-3 relative">
                                        <div className="flex justify-between items-center pl-1">
                                            <label className="text-xs font-black text-primary uppercase tracking-widest">Assign Members</label>
                                            <span className="text-[10px] bg-primary/10 px-2.5 py-1 rounded-full font-black text-primary uppercase tracking-tight">
                                                {(editingProject ? editingProject.members : newProject.members).length} SELECTED
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                                            <input
                                                className="w-full bg-muted/40 dark:bg-white/5 border border-border/10 rounded-[1.5rem] pl-12 pr-4 py-4 text-sm outline-none transition-all font-medium focus:ring-4 focus:ring-primary/10 dark:text-white text-black"
                                                placeholder="Search team members by name..."
                                                value={userSearch}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setUserSearch(val);
                                                    setIsUserDropdownOpen(val.length > 0);
                                                }}
                                            />
                                        </div>

                                        <AnimatePresence>
                                            {isUserDropdownOpen && userSearch.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full left-0 right-0 mt-3 bg-card dark:bg-[#1a1a1a] border border-border/10 rounded-[1.5rem] shadow-2xl z-[60] max-h-60 overflow-y-auto p-2 custom-scrollbar"
                                                >
                                                    {filteredUsers.length > 0 ? (
                                                        filteredUsers.map(u => (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    const currentMembers = editingProject ? editingProject.members : newProject.members;
                                                                    const isSelected = currentMembers.some(m => m.id === (u.id || u.userId));

                                                                    let updatedMembers;
                                                                    if (isSelected) {
                                                                        updatedMembers = currentMembers.filter(m => m.id !== (u.id || u.userId));
                                                                    } else {
                                                                        updatedMembers = [...currentMembers, {
                                                                            name: u.displayName || u.userName,
                                                                            email: u.detail?.email || u.emailAddress || u.email || "",
                                                                            id: u.id || u.userId
                                                                        }];
                                                                    }

                                                                    if (editingProject) {
                                                                        setEditingProject({ ...editingProject, members: updatedMembers });
                                                                    } else {
                                                                        setNewProject({ ...newProject, members: updatedMembers });
                                                                    }

                                                                    setUserSearch("");
                                                                    setIsUserDropdownOpen(false);
                                                                }}
                                                                className="w-full text-left px-5 py-4 text-sm hover:bg-primary/10 rounded-[1rem] transition-all flex items-center justify-between group"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold group-hover:text-primary transition-colors dark:text-white text-black">{u.displayName}</span>
                                                                    <span className="text-[10px] text-muted-foreground/60">{u.detail?.email || u.emailAddress || u.email || u.userName}</span>
                                                                </div>
                                                                {(editingProject ? editingProject.members : newProject.members).some(m => m.id === (u.id || u.userId)) && (
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-6 text-center text-xs text-muted-foreground/60 font-bold italic uppercase tracking-widest">No users found</div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Selected Members Chips */}
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {(editingProject ? editingProject.members : newProject.members).map(member => (
                                                <motion.div
                                                    initial={{ scale: 0.8 }}
                                                    animate={{ scale: 1 }}
                                                    key={member.id}
                                                    className="bg-secondary/50 dark:bg-white/5 dark:text-white text-black text-[10px] font-black tracking-tight px-4 py-2 rounded-full flex items-center gap-2 border border-border/10 shadow-sm"
                                                >
                                                    {member.name}
                                                    <X
                                                        size={14}
                                                        className="cursor-pointer hover:text-primary transition-colors"
                                                        onClick={() => {
                                                            if (editingProject) {
                                                                setEditingProject({
                                                                    ...editingProject,
                                                                    members: editingProject.members.filter(m => m.id !== member.id)
                                                                });
                                                            } else {
                                                                setNewProject({
                                                                    ...newProject,
                                                                    members: newProject.members.filter(m => m.id !== member.id)
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setNewProject({ project_name: "", members: [] });
                                                setEditingProject(null);
                                            }}
                                            className="flex-1 p-3.5 rounded-2xl border border-border font-bold hover:bg-muted dark:hover:bg-white/5 transition-all text-muted-foreground text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!(editingProject ? editingProject.project_name : newProject.project_name)}
                                            className="flex-[2] bg-primary text-primary-foreground p-3.5 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            {editingProject ? "Update Project" : "Start Project"}
                                            {/* <ArrowRight size={18} /> */}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Project Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-card dark:bg-zinc-900 border border-border/10 rounded-[2rem] shadow-2xl p-8 z-[110] overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                                    <Trash2 size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-black tracking-tight mb-2 dark:text-white">Delete Project?</h3>
                                <p className="text-sm text-muted-foreground/60 font-medium mb-8">
                                    This will permanently remove <span className="text-foreground font-bold">"{projectToDelete?.project_name}"</span> and all its data.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl border border-border hover:bg-muted font-bold transition-all text-sm dark:text-white cursor-pointer"
                                    >
                                        Keep it
                                    </button>
                                    <button
                                        onClick={confirmDeleteProject}
                                        className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all text-sm cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectSelection;
