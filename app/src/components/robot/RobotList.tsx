import {
  Bot,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Robot } from "@/lib/types/RobotTypes";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store";
import { getRobot } from "@/lib/slices/RobotSlice";
import { useTranslation } from "react-i18next";

interface RobotListProps {
  robots: Robot[];
  selectedRobotId?: string;
  onViewRobot: (robot: Robot) => void;
}

export function RobotList({ robots, selectedRobotId, onViewRobot }: RobotListProps) {
  const dispatch = useAppDispatch();

  const { t } = useTranslation();

  const handleViewRobot = async (robot: Robot) => {
    await dispatch(getRobot(robot.robotId));

    onViewRobot(robot);
  };

  return (
    <Card className="border border-slate-200 shadow-none rounded-xl h-[50vh] min-h-[320px] lg:h-[460px] flex flex-col">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-slate-600">
          <Bot className="h-4 w-4" />
          {t('robots.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-200">
          {robots && robots.length === 0 ? (
            <div className="p-4 text-slate-400 text-sm text-center">
              {t('robots.noRobots')}
            </div>
          ) : (
            robots.map((robot) => {
              return (
                <div
                  key={robot.robotId}
                  className={cn(
                    "border-b transition-all cursor-pointer p-4 flex justify-between items-center",
                    selectedRobotId === robot.robotId ? "bg-blue-50" : "hover:bg-slate-50"
                  )}
                  onClick={() => handleViewRobot(robot)}
                >
                  <div>
                    <p className="font-medium text-sm">{robot.name || robot.robotId}</p>
                    <p className="text-xs text-slate-500">{robot.isOnLine ? t('robots.status.online') : t('robots.status.offline')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{robot.battery}%</span>
                    <div className={`w-2 h-2 rounded-full ${robot.isOnLine ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
