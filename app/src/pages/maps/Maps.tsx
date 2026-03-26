import { Loader } from "@/components/ui/loader";
import { getBaseMap, listAreas, listPointsOfInterest } from "@/lib/slices/mapSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { useEffect, useState } from "react";
import { MapIcon, ChevronRight, ArrowLeft, Map as MapIcon2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS, ROUTES } from "@/config/routes";
import { useTranslation } from "react-i18next";
import { IndoorMap } from "@/components/map/IndoorMap";
import { listRobots } from "@/lib/slices/RobotSlice";

import api from '@/lib/api/axios';
import type { PointOfInterest } from "@/lib/types/MapTypes";
import { handleCreateTask } from "@/lib/tasks/taskHandlers";
import type { Robot } from "@/lib/types/RobotTypes";

export default function Maps() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const selectedBusinessId = useAppSelector((state) => state.business.selectedBusinessId);
  const { robots } = useAppSelector((state) => state.robot);
  const { areas, pointsOfInterest, areasLoading, mapLoading, baseMap, mapMeta } = useAppSelector((state) => state.map);

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Reset selected area when business changes
  const [prevBusinessId, setPrevBusinessId] = useState(selectedBusinessId);
  if (selectedBusinessId !== prevBusinessId) {
    setPrevBusinessId(selectedBusinessId);
    setSelectedAreaId(null);
  }

  const selectedBusinessPoints = pointsOfInterest.filter((poi: PointOfInterest) => poi.areaId === selectedAreaId);
  const selectedBusinessRobots = robots.filter((robot: Robot) => robot.areaId === selectedAreaId);

  useEffect(() => {
    api.get(API_ENDPOINTS.CONFIG.MAPBOX_TOKEN)
      .then(res => {
        setMapboxToken(res.data.token);
      })
      .catch(err => {
        console.error('Failed to fetch mapbox token:', err);
      });
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;

    const getAreas = async () => {
      if (!selectedBusinessId) return;
      try {
        await dispatch(listAreas(selectedBusinessId));
      } catch (error) {
        console.error('Error fetching areas:', error);
      }
    };

    const getPointsOfInterest = async () => {
      try {
        await dispatch(listPointsOfInterest(selectedBusinessId));
      } catch (error) {
        console.error('Error fetching points of interest:', error);
      }
    };

    const getRobots = async () => {
      try {
        await dispatch(listRobots());
      } catch (error) {
        console.error('Error fetching robots:', error);
      }
    }


    getAreas();
    getPointsOfInterest();
    getRobots();
  }, [selectedBusinessId, dispatch]);

  const handleViewMap = async (id: string) => {
    setSelectedAreaId(id);
    try {
      await dispatch(getBaseMap(id));
    } catch (error) {
      console.error('Error fetching map:', error);
    }
  };

  const handleCallRobot = async (poi: PointOfInterest, robotId?: string) => {
    handleCreateTask({
      dispatch: dispatch,
      businessId: selectedBusinessId!,
      poi: poi,
      robotId: robotId || "",
      execute: true,
      priority: robotId ? true : false,
      isV3: true
    });
  };

  return (
    <div key={selectedBusinessId} className="h-full overflow-y-auto bg-slate-50/50 pb-12">
      <div className="max-w-[1600px] mx-auto relative px-4 md:px-10">

        {/* Back Button */}
        <div className="hidden md:block py-6 flex justify-start">
          <Button
            variant="ghost"
            className="hover:cursor-pointer text-slate-500  hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl font-bold"
            onClick={() => navigate(ROUTES.DASHBOARD.HOME)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('profile.back')}
          </Button>
        </div>

        {/* Grid Container forced to stretch */}
        <div className="grid grid-cols-1 pt-4 lg:grid-cols-4 gap-8 items-stretch h-full min-h-[700px]">

          {/* LEFT: Areas Selection Card (lg:col-span-1 for smaller width) */}
          <div className="lg:col-span-1 flex">
            <Card className="flex flex-col w-full border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-100 p-6 shrink-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                  <MapIcon className="h-4 w-4" />
                  {t('maps.areas')}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0 flex-1 overflow-y-auto relative custom-scrollbar">
                {areasLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 animate-in fade-in duration-300">
                    <Loader variant="container" />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {areas.length === 0 ? (
                      <div className="p-8 text-slate-400 text-sm text-center italic font-medium">
                        {t('maps.noAreasFound')}
                      </div>
                    ) : (
                      areas.map((area) => {
                        const isActive = selectedAreaId === area.id;

                        return (
                          <div
                            key={area.id}
                            onClick={() => handleViewMap(area.id)}
                            className={`cursor-pointer transition-all duration-200 group ${isActive
                              ? "bg-slate-100 border-l-4 border-primary"
                              : "hover:bg-slate-50 border-l-4 border-transparent"
                              }`}
                          >
                            <div className="p-5 flex justify-between items-center">
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-slate-700 truncate">
                                  {area.name || t('maps.unnamedArea')}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-wider">
                                  {t('maps.floor')} {area.floorName}
                                </p>
                              </div>
                              <ChevronRight
                                className={`h-4 w-4 transition-all ${isActive
                                  ? "text-primary translate-x-1"
                                  : "text-slate-300 group-hover:text-slate-400"
                                  }`}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Map Viewport Card (lg:col-span-3 for larger width) */}
          <div className="lg:col-span-3 flex">
            <Card className="flex flex-col w-full border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white overflow-hidden min-h-[600px]">
              <CardHeader className="border-b border-slate-50 pb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                      <MapIcon2 size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        {selectedAreaId ? areas.find(a => a.id === selectedAreaId)?.name : t('maps.viewport')}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 relative bg-slate-50/30 overflow-hidden">
                {/* STATE 1: Loaders */}
                {(mapLoading) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 z-20 animate-in fade-in">
                    <Loader variant="container" />
                  </div>
                )}

                {/* STATE 2: Area Selected & Map Ready */}
                {!mapLoading && selectedAreaId && baseMap ? (
                  <div className="absolute inset-0 w-full h-full animate-in fade-in duration-500">
                    {mapMeta && mapboxToken ? (
                      <IndoorMap
                        mapMeta={mapMeta}
                        base64Image={baseMap}
                        points={selectedBusinessPoints}
                        robots={selectedBusinessRobots}
                        mapboxToken={mapboxToken}
                        onRobotSend={handleCallRobot}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 z-20">
                        <Loader variant="container" />
                      </div>
                    )}
                  </div>
                ) : !mapLoading && !areasLoading && !selectedAreaId ? (
                  /* STATE 3: No Area Selected */
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 mb-8 transform transition-transform hover:scale-105">
                      <MapIcon2 className="h-20 w-20 text-slate-100" strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 tracking-tight">{t('maps.noAreaSelected')}</h3>
                    <p className="text-sm text-slate-400 font-medium mt-2 max-w-xs">
                      {t('maps.pickAreaDescription')}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}