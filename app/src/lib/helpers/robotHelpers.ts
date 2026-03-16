import type { Robot } from "../types/RobotTypes";

export const getIdleRobot = (robots: Robot[]) => {
  const idleRobot = robots.find(
    (robot) => robot.isOnLine && !robot.isTask && !robot.isCharging
  );
  return idleRobot?.robotId;
};

export const getOnlineRobot = (robots: Robot[]) => {
  const onlineRobot = robots.find((robot) => robot.isOnLine);

  return onlineRobot?.robotId;
};