import { useEffect, useRef } from "react";
import { useAppSelector } from "@/store";
import { robotStateSocket, taskStateSocket } from "@/lib/ws/stateSockets";
import type { Robot } from "@/lib/types/RobotTypes";

export function useRobotSockets() {
  const selectedBusinessId = useAppSelector((state) => state.business.selectedBusinessId);
  const robots = useAppSelector((state) => state.robot.robots);
  const subscribedRobotsRef = useRef<Set<string>>(new Set());

  // 1. Explicitly clear all subscriptions ONLY when business changes
  useEffect(() => {
    robotStateSocket.unsubscribeAll();
    taskStateSocket.unsubscribeAll();
    subscribedRobotsRef.current.clear();
  }, [selectedBusinessId]);

  // 2. Handle real-time robot updates (incremental sync)
  useEffect(() => {
    if (!selectedBusinessId) return;

    // Connect socket if not already connected (only if we have robots to track)
    if (robots.length > 0) {
      if (!robotStateSocket.isConnected()) {
        robotStateSocket.connect();
      }

      if (!taskStateSocket.isConnected()) {
        taskStateSocket.connect();
      }
    }

    const currentSubscribed = subscribedRobotsRef.current;
    const robotIdsInList = new Set(robots.map((r) => r.robotId));

    // 1. Unsubscribe robots that are no longer in the list
    currentSubscribed.forEach((robotId) => {
      if (!robotIdsInList.has(robotId)) {
        robotStateSocket.unsubscribe(robotId);
        taskStateSocket.unsubscribe(robotId);
        currentSubscribed.delete(robotId);
      }
    });

    // 2. Sync subscriptions for robots in the list
    robots.forEach((robot: Robot) => {
      const isForCurrentBusiness = robot.businessId === selectedBusinessId;
      const shouldBeSubscribed = isForCurrentBusiness && robot.isOnLine;

      if (shouldBeSubscribed && !currentSubscribed.has(robot.robotId)) {
        robotStateSocket.subscribe(robot.robotId);
        taskStateSocket.subscribe(robot.robotId);
        currentSubscribed.add(robot.robotId);
      } else if (!shouldBeSubscribed && currentSubscribed.has(robot.robotId)) {
        robotStateSocket.unsubscribe(robot.robotId);
        taskStateSocket.unsubscribe(robot.robotId);
        currentSubscribed.delete(robot.robotId);
      }
    });
  }, [robots, selectedBusinessId]);
}
