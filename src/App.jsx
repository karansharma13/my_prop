import { useState, useEffect } from "react";
import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/components/ui/select";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

// Custom Droppable Component
function Droppable({ children, id }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

// Custom Draggable Component
function Draggable({ children, id }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

export default function App() {
  // State Management
  const [projects, setProjects] = useState(
    () => JSON.parse(localStorage.getItem("projects")) || []
  );
  const [selectedProject, setSelectedProject] = useState(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "Pending",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Tasks");
  const [quote, setQuote] = useState("");

  // Fetch Motivational Quote on Mount
  useEffect(() => {
    fetch("https://api.quotable.io/random")
      .then((response) => response.json())
      .then((data) => setQuote(data.content))
      .catch(() => setQuote("Stay motivated!"));
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  // Project Creation
  const handleCreateProject = () => {
    if (newProjectTitle.trim()) {
      const newProject = { id: Date.now(), title: newProjectTitle, tasks: [] };
      setProjects([...projects, newProject]);
      setNewProjectTitle("");
      setIsNewProjectOpen(false);
    }
  };

  // Project Deletion
  const handleDeleteProject = (projectId) => {
    setProjects(projects.filter((p) => p.id !== projectId));
    if (selectedProject?.id === projectId) setSelectedProject(null);
  };

  // Task Creation
  const handleCreateTask = () => {
    if (newTask.title.trim() && selectedProject) {
      const updatedProjects = projects.map((p) => {
        if (p.id === selectedProject.id) {
          return { ...p, tasks: [...p.tasks, { ...newTask, id: Date.now() }] };
        }
        return p;
      });
      setProjects(updatedProjects);

      // ✅ Add this line to reselect the updated project
      const updated = updatedProjects.find((p) => p.id === selectedProject.id);
      setSelectedProject(updated);

      setNewTask({
        title: "",
        description: "",
        dueDate: "",
        status: "Pending",
      });
      setIsNewTaskOpen(false);
    }
  };

  // Task Deletion
  const handleDeleteTask = (taskId) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  // Task Update
  const handleUpdateTask = (taskId, field, value) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId ? { ...t, [field]: value } : t
          ),
        };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  // Drag-and-Drop Handler
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || !selectedProject) return;

    const oldIndex = selectedProject.tasks.findIndex(
      (task) => task.id === active.id
    );
    const newIndex = selectedProject.tasks.findIndex(
      (task) => task.id === over.id
    );

    if (oldIndex !== newIndex) {
      const updatedTasks = Array.from(selectedProject.tasks);
      const [reorderedTask] = updatedTasks.splice(oldIndex, 1);
      updatedTasks.splice(newIndex, 0, reorderedTask);

      const updatedProjects = projects.map((p) =>
        p.id === selectedProject.id ? { ...p, tasks: updatedTasks } : p
      );
      setProjects(updatedProjects);
      setSelectedProject({ ...selectedProject, tasks: updatedTasks });
    }
  };

  // Progress Calculation
  const calculateProgress = (tasks) => {
    if (!tasks.length) return 0;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Filtered Tasks
  const filteredTasks =
    selectedProject?.tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filterStatus === "Tasks" || t.status === filterStatus)
    ) || [];

  // Check if Task is Overdue
  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date() && true;
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white p-4">
        <h2 className="text-xl font-bold text-black">Project Manager</h2>
        <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4">+ New Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Project Title"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="mt-4"
            />
            <div className="mt-4 flex justify-end space-x-2">
              <Button onClick={() => setIsNewProjectOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateProject}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-black">MY PROJECTS</h3>
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex justify-between items-center mt-2"
            >
              <span onClick={() => setSelectedProject(project)}>
                {project.title} ({calculateProgress(project.tasks)}%)
              </span>
              <Button
                // variant="flat"
                // size="sm"
                onClick={() => handleDeleteProject(project.id)}
              >
                🗑️
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-100 p-4">
        {!selectedProject ? (
          <div className="text-center mt-20">
            <p className="text-2xl font-bold text-black">No Projects Yet</p>
            <p className="text-gray-500">
              Create your first project to get started
            </p>
            <p className="mt-4 text-gray-700 italic">{quote}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">
                {selectedProject.title} -{" "}
                {calculateProgress(selectedProject.tasks)}% Complete
              </h3>
              <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                <DialogTrigger asChild>
                  <Button>+ Add Task</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Task Title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="mt-4"
                  />
                  <Input
                    placeholder="Description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="mt-4"
                  />
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="mt-4"
                  />
                  <Select
                    value={newTask.status}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, status: value })
                    }
                  >
                    <SelectTrigger className="mt-4">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In-Progress">In-Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button onClick={() => setIsNewTaskOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTask}>Create Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-4 flex space-x-2">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>{filterStatus}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("All Tasks")}
                  >
                    All Tasks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("Pending")}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("In-Progress")}
                  >
                    In-Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("Completed")}
                  >
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <DndContext onDragEnd={handleDragEnd}>
              <Droppable id="tasks">
                <div className="mt-4">
                  {filteredTasks.length ? (
                    filteredTasks.map((task) => (
                      <Draggable key={task.id} id={task.id}>
                        <div
                          className={`p-4 mb-2 bg-white rounded-md shadow ${
                            isOverdue(task.dueDate) &&
                            task.status !== "Completed"
                              ? "border-l-4 border-red-500"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-black">
                                {task.title}
                              </h4>
                              <p className="text-gray-600">
                                {task.description}
                              </p>
                              <p className="text-sm">
                                Due: {task.dueDate || "No due date"}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Select
                                value={task.status}
                                onValueChange={(value) =>
                                  handleUpdateTask(task.id, "status", value)
                                }
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">
                                    Pending
                                  </SelectItem>
                                  <SelectItem value="In-Progress">
                                    In-Progress
                                  </SelectItem>
                                  <SelectItem value="Completed">
                                    Completed
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Draggable>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center">
                      No tasks yet. Add your first task to get started!
                    </p>
                  )}
                </div>
              </Droppable>
            </DndContext>
          </>
        )}
      </div>
    </div>
  );
}
