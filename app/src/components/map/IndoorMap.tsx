import React, { useMemo, useRef, useEffect } from 'react';
import Map, {
  Source,
  Layer,
  NavigationControl,
  Popup,
  type MapRef,
  type LngLatBoundsLike
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapMouseEvent, type StyleSpecification } from 'mapbox-gl';
import { type PointOfInterest, type MapMeta } from "@/lib/types/MapTypes";
import type { Robot } from '@/lib/types/RobotTypes';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, MapIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector, type RootState } from "@/store";
import { setSelectedAreaId } from "@/lib/slices/mapSlice";

interface MapCanvasProps {
  base64Image: string;
  mapMeta: MapMeta;
  points: PointOfInterest[];
  robots: Robot[];
  mapboxToken: string;
  onRobotSend: (poi: PointOfInterest) => void;
}

const darkEmptyStyle: StyleSpecification = {
  version: 8,
  name: 'DarkEmpty',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#888888' }
    }
  ]
};

// Use a fixed world origin as a reference for meter-to-coordinate conversion
const worldLng = -122.4150;
const worldLat = 37.7750;
const metersPerLat = 111320;
const metersPerLng = 111320 * Math.cos(worldLat * Math.PI / 180);

const MapCanvas: React.FC<MapCanvasProps> = ({ base64Image, points, mapMeta, robots, mapboxToken, onRobotSend }) => {
  const { t } = useTranslation();
  const mapRef = useRef<MapRef>(null);

  const [cursor, setCursor] = React.useState<string>('grab');
  const [isDragging, setIsDragging] = React.useState(false);

  const onMouseEnter = () => setCursor('pointer');
  const onMouseLeave = () => setCursor('grab');

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const currentCursor = isDragging ? 'grabbing' : cursor;

  const [selectedPoi, setSelectedPoi] = React.useState<{
    poi: PointOfInterest;
    coordinates: [number, number];
  } | null>(null);

  // Calculate coordinates based on map metadata
  const { dynamicCoordinates, center, bounds } = useMemo(() => {
    if (!mapMeta) {
      return {
        dynamicCoordinates: [[0, 0], [0, 0], [0, 0], [0, 0]] as [[number, number], [number, number], [number, number], [number, number]],
        center: { lng: worldLng, lat: worldLat },
        bounds: undefined
      };
    }

    const { originX, originY, pixelWidth, pixelHeight, resolution } = mapMeta;

    const convert = (x: number, y: number): [number, number] => [
      worldLng + x / metersPerLng,
      worldLat + y / metersPerLat
    ];

    // Mapbox image coordinates: [top-left, top-right, bottom-right, bottom-left]
    const coords: [[number, number], [number, number], [number, number], [number, number]] = [
      convert(originX, originY + pixelHeight * resolution),
      convert(originX + pixelWidth * resolution, originY + pixelHeight * resolution),
      convert(originX + pixelWidth * resolution, originY),
      convert(originX, originY)
    ];

    const minLng = Math.min(...coords.map(c => c[0]));
    const maxLng = Math.max(...coords.map(c => c[0]));
    const minLat = Math.min(...coords.map(c => c[1]));
    const maxLat = Math.max(...coords.map(c => c[1]));

    const padding = 0.0001; // Smaller padding to keep it centered
    const mapBounds: LngLatBoundsLike = [
      [minLng - padding, minLat - padding],
      [maxLng + padding, maxLat + padding]
    ];

    return {
      dynamicCoordinates: coords,
      center: { lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 },
      bounds: mapBounds
    };
  }, [mapMeta]);

  // Handle auto-fitting bounds when map or dimensions change
  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: 40, duration: 1000 });
    }
  }, [bounds]);

  const poiData = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: (points || []).map((poi: PointOfInterest) => {
        const [x, y] = poi.coordinate;

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [
              worldLng + x / metersPerLng,
              worldLat + y / metersPerLat
            ]
          },
          properties: {
            name: poi.name || `Point ${poi.type}`,
            id: poi.id,
            yaw: poi.yaw
          }
        };
      })
    };
  }, [points]);

  // Convert Robots to map coordinates
  const robotData = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: (robots || []).map((robot: Robot) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [
            worldLng + robot.x / metersPerLng,
            worldLat + robot.y / metersPerLat
          ]
        },
        properties: {
          name: robot.name || robot.robotId,
          id: robot.robotId,
          yaw: (robot.yaw * 180) / Math.PI, // Mapbox expects degrees
          battery: robot.battery,
          status: robot.isOnLine ? 'Online' : 'Offline'
        }
      }))
    };
  }, [robots]);

  const imageUrl = base64Image.startsWith('data:image')
    ? base64Image
    : `data:image/png;base64,${base64Image}`;

  const handleMapClick = (event: MapMouseEvent) => {
    const features = event.target.queryRenderedFeatures(event.point);
    const feature = features[0];

    if (!feature || feature.geometry.type !== "Point") {
      setSelectedPoi(null);
      return;
    }

    const props = feature.properties as { id: string };
    const originalPoi = points.find(p => p.id === props.id);

    if (originalPoi) {
      setSelectedPoi({
        poi: originalPoi,
        coordinates: feature.geometry.coordinates as [number, number],
      });
    }
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        ...center,
        zoom: 19,
        pitch: 0,
        bearing: 0
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={darkEmptyStyle}
      mapboxAccessToken={mapboxToken}
      cursor={currentCursor}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleMapClick}
      interactiveLayerIds={['poi-circles']}
      attributionControl={false}
      maxBounds={bounds}
      maxPitch={0}
      minZoom={14}
      maxZoom={22}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {/* Map Image */}
      <Source
        key={imageUrl.slice(-20)}
        id="map-source"
        type="image"
        url={imageUrl}
        coordinates={dynamicCoordinates}
      >
        <Layer
          id="map-layer"
          type="raster"
          paint={{
            'raster-opacity': 1,
            'raster-resampling': 'linear'
          }}
        />
      </Source>

      {/* POI Layer */}
      <Source id="pois-source" type="geojson" data={poiData}>
        <Layer
          id="poi-circles"
          type="circle"
          paint={{
            'circle-radius': ['case', ['==', ['get', 'id'], selectedPoi?.poi.id || ''], 8, 5],
            'circle-color': ['case', ['==', ['get', 'id'], selectedPoi?.poi.id || ''], '#ef4444', '#3b82f6'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }}
        />
        <Layer
          id="poi-labels"
          type="symbol"
          layout={{
            'text-field': ['get', 'name'],
            'text-offset': [0, -1.5],
            'text-anchor': 'bottom',
            'text-size': 10,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
          }}
          paint={{ 'text-color': '#ffffff', 'text-halo-color': '#334155', 'text-halo-width': 1.5 }}
        />
      </Source>

      {/* Robots Layer */}
      <Source id="robots-source" type="geojson" data={robotData}>
        {/* Robot Triangle/Arrow for Heading */}
        <Layer
          id="robot-arrows"
          type="symbol"
          layout={{
            'icon-image': 'triangle-15', // Standard Mapbox triangle
            'icon-size': 1.2,
            'icon-rotate': ['get', 'yaw'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }}
          paint={{ 'icon-color': '#10b981' }}
        />

        {/* Robot Indicator Dot */}
        <Layer
          id="robot-circles"
          type="circle"
          paint={{
            'circle-radius': 5,
            'circle-color': '#10b981',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.8
          }}
        />

        {/* Robot Labels */}
        <Layer
          id="robot-labels"
          type="symbol"
          layout={{
            'text-field': ['get', 'name'],
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-size': 10,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
          }}
          paint={{ 'text-color': '#10b981', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 }}
        />
      </Source>

      {selectedPoi && (
        <Popup
          longitude={selectedPoi.coordinates[0]}
          latitude={selectedPoi.coordinates[1]}
          anchor="bottom"
          onClose={() => setSelectedPoi(null)}
          closeOnClick={false}
          offset={15}
          className="min-w-[160px] rounded-lg border bg-popover text-popover-foreground shadow-md outline-none"
        >
          <div className="flex flex-col space-y-1.5">
            <Label className="font-semibold">{selectedPoi.poi.name}</Label>
          </div>
          <div className="my-2 h-[1px] bg-border" />
          <Button
            size="sm"
            className="w-full h-7 hover:cursor-pointer text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all active:scale-95"
            onClick={() => onRobotSend(selectedPoi.poi)}
          >
            {t('robots.call')}
          </Button>
        </Popup>
      )}
    </Map>
  );
};

export const IndoorMap: React.FC<{
  mapboxToken: string | null;
  onRobotSend: (poi: PointOfInterest) => void
}> = ({ mapboxToken, onRobotSend }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const {
    areas,
    areasLoading,
    mapLoading,
    baseMap,
    mapMeta,
    selectedAreaId,
    pointsOfInterest
  } = useAppSelector((state: RootState) => state.map);
  const robots = useAppSelector((state: RootState) => state.robot.robots);
  const selectedBusinessId = useAppSelector((state: RootState) => state.business.selectedBusinessId);

  const selectedAreaRobots = robots.filter((r) => r.businessId === selectedBusinessId && r.areaId === selectedAreaId);
  const selectedAreaPoints = pointsOfInterest.filter((poi) => !selectedAreaId || poi.areaId === selectedAreaId);

  return (
    <Card className="flex flex-col w-full border border-slate-100 rounded-3xl bg-white overflow-hidden min-h-[550px] shadow-none">
      <CardHeader className="border-b border-slate-50 pt-2 pb-2 shrink-0">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 hover:bg-transparent hover:cursor-pointer flex items-center gap-2 group">
                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {selectedAreaId ? areas.find(a => a.id === selectedAreaId)?.name : t('maps.viewport')}
                </CardTitle>
                <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 mt-2 rounded-xl shadow-xl border-slate-100 p-2">
              {areas.map((area) => (
                <DropdownMenuItem
                  key={area.id}
                  className={cn(
                    "rounded-xl cursor-pointer py-3 px-4 mb-1 transition-all",
                    selectedAreaId === area.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-slate-50 text-slate-600"
                  )}
                  onClick={() => dispatch(setSelectedAreaId(area.id))}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{area.name}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-60">Floor {area.floorName}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative bg-slate-50/30 overflow-hidden">
        {(mapLoading || areasLoading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 z-20 animate-in fade-in">
            <Loader variant="container" />
          </div>
        )}

        {!mapLoading && selectedAreaId && baseMap ? (
          <div className="absolute inset-0 w-full h-full animate-in fade-in duration-500">
            {mapMeta && mapboxToken ? (
              <MapCanvas
                mapMeta={mapMeta}
                base64Image={baseMap}
                points={selectedAreaPoints}
                robots={selectedAreaRobots}
                mapboxToken={mapboxToken}
                onRobotSend={onRobotSend}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 z-20">
                <Loader variant="container" />
              </div>
            )}
          </div>
        ) : !mapLoading && !areasLoading && !selectedAreaId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-white p-10 rounded-[2.5rem] mb-8 transform transition-transform hover:scale-105 border border-slate-100">
              <MapIcon className="h-20 w-20 text-slate-100" strokeWidth={1} />
            </div>
            <h3 className="text-xl font-bold text-slate-400 tracking-tight">{t('maps.noAreaSelected')}</h3>
            <p className="text-sm text-slate-400 font-medium mt-2 max-w-xs">{t('maps.pickAreaDescription')}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};