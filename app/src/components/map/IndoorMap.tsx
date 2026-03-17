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

interface IndoorMapProps {
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

export const IndoorMap: React.FC<IndoorMapProps> = ({ base64Image, points, mapMeta, robots, mapboxToken, onRobotSend }) => {
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

  // Convert SLAM POIs to map coordinates
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
            'circle-radius': [
              'case',
              ['==', ['get', 'id'], selectedPoi?.poi.id || ''],
              8,
              5
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'id'], selectedPoi?.poi.id || ''],
              '#ef4444',
              '#3b82f6'
            ],
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
          paint={{
            'text-color': '#ffffff',
            'text-halo-color': '#334155',
            'text-halo-width': 1.5
          }}
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
          paint={{
            'icon-color': '#10b981' // Green for robots
          }}
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
          paint={{
            'text-color': '#10b981',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5
          }}
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
            <div className="flex items-center justify-between gap-4">
              <Label className="font-semibold">
                {selectedPoi.poi.name}
              </Label>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              ID: {selectedPoi.poi.id}
            </p>
          </div>

          <div className="my-2 h-[1px] bg-border" />

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              className="w-full h-8 text-xs hover:cursor-pointer bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onRobotSend(selectedPoi.poi)}
            >
              {t('robots.call')}
            </Button>
          </div>
        </Popup>
      )}
    </Map>
  );
};