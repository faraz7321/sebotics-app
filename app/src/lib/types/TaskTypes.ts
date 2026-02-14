export type Task = {
  id: string;
  title: string;
  description?: string;
  assignedRobot: string;
  status: "pending" | "in-progress" | "completed";
};