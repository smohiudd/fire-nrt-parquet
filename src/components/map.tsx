import { useMemo, useRef } from "react";
import { Map as MaplibreMap, useControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import { Table } from "apache-arrow";

import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";

interface Props {
  data?: Table;
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export default function Map({ data}: Props) {
  const mapRef = useRef<MapRef>(null);

  const layers = useMemo(() => {
    return [
      data && new GeoArrowPolygonLayer({
        id: `geoarrow-polygons`,
        stroked: false,
        filled: true,
        data,
        getFillColor: [255, 0, 0, 160],
        getLineColor: [0, 255, 0],
        lineWidthMinPixels: 1,
      }),
    ];
  }, [data]);


  return (
    <div>
      <MaplibreMap
        ref={mapRef}
        initialViewState={{
          longitude: -123.113889,
          latitude: 49.261111,
          zoom: 2
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        <DeckGLOverlay layers={layers} />
      </MaplibreMap>
    </div>
  );
}
