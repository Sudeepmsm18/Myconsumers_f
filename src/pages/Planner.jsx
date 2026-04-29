import KanbanBoard from "../components/KanbanBoard";

const Planner = ({ project, currentUser, domoUsers, onBack, isDarkMode, setIsDarkMode }) => {
  return (
    <KanbanBoard
      project={project}
      currentUser={currentUser}
      domoUsers={domoUsers}
      onBack={onBack}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    />
  );
};

export default Planner;