import React, { useState, useEffect } from "react";
import Planner from "./pages/Planner";
import ProjectSelection from "./pages/ProjectSelection";
import DomoApi from "./API/domoAPI";

function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [domoUsers, setDomoUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("themePreference");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("themePreference", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [envUser, users] = await Promise.all([
        DomoApi.GetCurrentUser(),
        DomoApi.ListAllUsers(true, 500)
      ]);

      let fullUser = envUser;
      try {
        const detailedUser = await DomoApi.GetUser(envUser.userId);
        fullUser = { ...envUser, ...detailedUser };
      } catch (e) {
        console.warn("Could not fetch detailed current user info", e);
      }

      setCurrentUser(fullUser);
      setDomoUsers(users || []);

      // Persistence: Check for saved project
      const savedProjectId = localStorage.getItem("lastProjectSelection");
      if (savedProjectId) {
        try {
          const res = await DomoApi.ListDocuments("kanban_project");
          const found = res.find(doc => doc.id === savedProjectId);
          if (found) {
            const { _id: legacyId, id: contentId, ...rest } = found.content || {};
            const normalized = { ...rest, id: found.id || legacyId || contentId };
            
            // Only restore if approved
            if (String(normalized.admin_aproval) === "true") {
              setCurrentProject(normalized);
            } else {
              console.warn("Project pending approval or rejected, clearing selection");
              localStorage.removeItem("lastProjectSelection");
            }
          }
        } catch (err) {
          console.warn("Could not restore saved project session:", err);
        }
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project) => {
    if (project) {
      localStorage.setItem("lastProjectSelection", project.id);
    } else {
      localStorage.removeItem("lastProjectSelection");
    }
    setCurrentProject(project);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <ProjectSelection
        onSelectProject={handleSelectProject}
        currentUser={currentUser}
        domoUsers={domoUsers}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  return (
    <Planner
      project={currentProject}
      currentUser={currentUser}
      domoUsers={domoUsers}
      onBack={() => handleSelectProject(null)}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    />
  );
}

export default App;