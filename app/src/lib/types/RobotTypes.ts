export type Robot = {
  id: string;
  name: string;
  location: string;
  battery: number;
  status: "idle" | "serving" | "charging";
};

export interface RobotFormData {
  serial_number: string;
  name: string;
};