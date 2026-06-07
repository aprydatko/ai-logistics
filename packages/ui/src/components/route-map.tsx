'use client';

import type { Feature, LineString } from 'geojson';
import { Truck } from 'lucide-react';
import {
  GeolocateControl,
  Layer,
  Map,
  Marker,
  NavigationControl,
  Source,
} from 'react-map-gl/maplibre';

import { cn } from '@repo/ui/lib/utils';

type Coordinates = [longitude: number, latitude: number];
type RouteMarkerTone = 'danger' | 'success' | 'warning';

export type RouteMapMarker = {
  coordinates: Coordinates;
  id: string;
  label: string;
  tone?: RouteMarkerTone;
};

type RouteMapProps = {
  center: Coordinates;
  className?: string;
  markers: RouteMapMarker[];
  route: Coordinates[];
  zoom?: number;
};

const markerToneStyles: Record<RouteMarkerTone, string> = {
  danger: 'bg-danger',
  success: 'bg-teal-600',
  warning: 'bg-orange-500',
};

export function RouteMap({
  center,
  className,
  markers,
  route,
  zoom = 8,
}: RouteMapProps): React.JSX.Element {
  const routeFeature: Feature<LineString> = {
    geometry: {
      coordinates: route,
      type: 'LineString',
    },
    properties: {},
    type: 'Feature',
  };

  return (
    <div
      aria-label="Active loads route map"
      className={cn(
        'h-72 min-h-64 overflow-hidden rounded-xl border border-border bg-surface-100',
        className
      )}
      role="region"
    >
      <Map
        attributionControl={false}
        initialViewState={{
          latitude: center[1],
          longitude: center[0],
          zoom,
        }}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
        maxZoom={16}
        minZoom={5}
        scrollZoom={false}
      >
        <Source data={routeFeature} id="active-load-route" type="geojson">
          <Layer
            id="active-load-route-line"
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': '#0891b2',
              'line-opacity': 0.9,
              'line-width': 3,
            }}
            type="line"
          />
        </Source>

        {markers.map((marker) => (
          <Marker
            anchor="center"
            key={marker.id}
            latitude={marker.coordinates[1]}
            longitude={marker.coordinates[0]}
          >
            <span
              aria-label={marker.label}
              className={cn(
                'grid size-9 place-items-center rounded-full border-[3px] border-white text-white shadow-md',
                markerToneStyles[marker.tone ?? 'success']
              )}
              role="img"
              title={marker.label}
            >
              <Truck className="size-4" />
            </span>
          </Marker>
        ))}

        <NavigationControl position="bottom-right" showCompass={false} />
        <GeolocateControl position="bottom-right" />
      </Map>
    </div>
  );
}
