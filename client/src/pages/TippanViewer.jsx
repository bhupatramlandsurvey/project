import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import MapboxDraw from "maplibre-gl-draw";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion } from "framer-motion";
import "maplibre-gl-draw/dist/mapbox-gl-draw.css";
import { useNavigate } from "react-router-dom";
import { MapPinIcon, ArrowLeftIcon  } from "@heroicons/react/24/outline";
import { Protocol } from "pmtiles";

export default function TippanViewer() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const userMarkerRef = useRef(null);
const watchIdRef = useRef(null);
const [showRecenter, setShowRecenter] = useState(false);
const lastUserLocation = useRef(null);
const CLOSE_DISTANCE_METERS = 1.5; // or even 1

const STORAGE_KEY = "tippan_drawn_features";
const selectedFeatureIdRef = useRef(null);

const saveDrawings = () => {
  if (!drawRef.current) return;
  const data = drawRef.current.getAll();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadDrawings = () => {
  if (!drawRef.current) return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const geo = JSON.parse(raw);
    if (geo?.features?.length) {
      drawRef.current.set(geo);

      // re-lock loaded features
     geo.features.forEach((f) => {
  // lock ONLY polygons, allow lines to be selectable
  if (f.geometry?.type === "Polygon") {
    drawRef.current.setFeatureProperty(f.id, "locked", true);
  }
});

if (geo.features.length) {
  const f = geo.features[0];
  selectedFeatureIdRef.current = f.id;
  updateSegmentAndAreaLabels(f);
}

      setShowMeasureBtn(true);
      updateSegmentAndAreaLabels();
      updateMeasurementPanel();
    }
  } catch (e) {
    console.warn("Failed to load drawings", e);
  }
};

const metersBetween = (a, b) =>
  turf.distance(turf.point(a), turf.point(b), { units: "kilometers" }) * 1000;


  const navigate = useNavigate();

  // markers for KMZ points (if any)
  const markersRef = useRef([]);

  // markers used for segment labels and area label
  const segmentMarkersRef = useRef([]);
  const areaLabelMarkerRef = useRef(null);
  const liveCursorMarkerRef = useRef(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [measurement, setMeasurement] = useState(null);
  const [kmzVisible, setKmzVisible] = useState(true);

  // show bottom Get Measurement button as soon as user places any vertex
  const [showMeasureBtn, setShowMeasureBtn] = useState(false);

  const typingTimeout = useRef(null);
  const LOCATIONIQ_KEY = "pk.edd1d1cc8b297c95f63273f032beaa41";
  const MAPTILER_KEY = "YTvj1DFCOtOcx48jpOdj";



  // ---------- KMZ load ----------

// ---------- OPTIMIZED GEOJSON load ----------


  // ---------- map + draw init ----------
  useEffect(() => {
mapRef.current = new maplibregl.Map({
  container: mapContainer.current,
  style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
  center: [78.9629, 20.5937],
  zoom: 5,

  // 🔥 ADD THIS
  pixelRatio: window.devicePixelRatio || 2,
});


    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-left");

drawRef.current = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    polygon: true,
    line_string: true,
    trash: true,
  },

  userProperties: true,
  clickBuffer: 2,
touchBuffer: 8,


  modes: MapboxDraw.modes,

  finishOnDoubleClick: false,
 styles: [
  // polygon fill
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": "#F54927",
      "fill-opacity": 0.2
    }
  },

  // polygon outline
  {
    id: "gl-draw-polygon-stroke",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: {
      "line-color": "#2563eb",
      "line-width": 2
    }
  },

  // line string
  {
    id: "gl-draw-line",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"]],
    paint: {
      "line-color": "#2563eb",
      "line-width": 2
    }
  },

  // hide vertex handles
 {
  id: "gl-draw-vertex",
  type: "circle",
  filter: ["all", ["==", "meta", "vertex"]],
  paint: {
    "circle-radius": 6,
    "circle-color": "#2563eb",
    "circle-stroke-width": 2,
    "circle-stroke-color": "#fff"
  }
}

]

});


    mapRef.current.on("dragstart", () => setShowRecenter(true));
    mapRef.current.on("zoomstart", () => setShowRecenter(true));

    mapRef.current.addControl(drawRef.current);
    mapRef.current.once("load", () => {
  loadDrawings();
});

    // prevent moving locked polygons
mapRef.current.on("mousemove", (e) => {
  const draw = drawRef.current;
  if (!draw) return;

  const selected = draw.getSelectedIds();
  if (!selected.length) return;

  const f = draw.get(selected[0]);
  if (f?.properties?.locked) {
    draw.changeMode("simple_select", { featureIds: [] });
  }
});

const cancelIfLocked = (point) => {
  const draw = drawRef.current;
  if (!draw) return;

  const features = mapRef.current.queryRenderedFeatures(point);
  if (!features.length) return;

  for (const f of features) {
    const id = f.properties?.id;
    if (!id) continue;

    const df = draw.get(id);
    if (df?.properties?.locked) {
      draw.changeMode("simple_select", { featureIds: [] });
      return;
    }
  }
};

mapRef.current.on("mousedown", (e) => cancelIfLocked(e.point));

mapRef.current.on("touchstart", (e) => {
  const pt = e.point || e.points?.[0];
  if (pt) cancelIfLocked(pt);
});

mapRef.current.on("touchmove", (e) => {
  const draw = drawRef.current;
  if (!draw) return;

  const selected = draw.getSelectedIds();
  if (!selected.length) return;

  const f = draw.get(selected[0]);
  if (f?.properties?.locked) {
    draw.changeMode("simple_select", { featureIds: [] });
  }
});

    // Show Get Measurement button when user creates/updates shapes (any vertex)
mapRef.current.on("draw.create", (e) => {
  const f = e.features[0];

  // drawRef.current.setFeatureProperty(f.id, "locked", true);

  selectedFeatureIdRef.current = f.id;

  updateSegmentAndAreaLabels(f);
  saveDrawings();
});


mapRef.current.on("draw.update", (e) => {
  setShowMeasureBtn(true);

  const f = e.features?.[0];
  if (f) {
    updateSegmentAndAreaLabels(f);
  }

  // 🔥 recompute distance / area live
  updateMeasurementPanel();

  saveDrawings();
});

mapRef.current.on("draw.delete", () => {
  setShowMeasureBtn(false);
  setMeasurement(null);
  clearSegmentMarkers();
  clearAreaLabel();

  saveDrawings();
});




    // While drawing, show live labels: listen mousemove on map
    const mouseMoveHandler = (e) => {
      if (!drawRef.current) return;
      const mode = drawRef.current.getMode();
      if (!mode) return;

      // only when actively drawing a line or polygon
      if (mode === "draw_line_string" || mode === "draw_polygon") {
        // show measure button as soon as user clicks first vertex (the draw.create above handles that)
        setShowMeasureBtn(true);

        // update live labels using last feature (in-progress)
        updateLiveLabelsWithCursor(e.lngLat);
      }
    };

    mapRef.current.on("mousemove", mouseMoveHandler);
    mapRef.current.on("click", (e) => {
  const draw = drawRef.current;
  if (!draw) return;

  const mode = draw.getMode();

  // ===== DRAW POLYGON =====
  if (mode === "draw_polygon") {
    const data = draw.getAll();
    if (!data.features.length) return;

    const f = data.features[data.features.length - 1];
    if (!f?.geometry) return;

    const ring = f.geometry.coordinates[0];
    if (!ring || ring.length < 4) return;

    const first = ring[0];
    const clicked = [e.lngLat.lng, e.lngLat.lat];

    const dist = metersBetween(first, clicked);

    if (dist < CLOSE_DISTANCE_METERS) {
      ring[ring.length - 1] = first;
      draw.setFeatureCoordinates(f.id, [ring]);

      draw.changeMode("simple_select", { featureIds: [f.id] });

      updateSegmentAndAreaLabels(f);
      updateMeasurementPanel();
    }

    return;
  }

  // ===== SELECT EXISTING POLYGON =====
const pt = e.point || mapRef.current.project(e.lngLat);
const features = mapRef.current.queryRenderedFeatures(pt);

  for (const ft of features) {
    const id = ft.properties?.id;
    if (!id) continue;

    const feature = draw.get(id);
    if (!feature) continue;

    selectedFeatureIdRef.current = id;

    draw.changeMode("direct_select", { featureId: id });

    updateSegmentAndAreaLabels(feature);

if (feature.geometry.type === "Polygon") {
  const area = turf.area(feature);
  if (area > 0.5) {
    setMeasurement({
      type: "area",
      valueText: formatArea(area),
    });
  }
}

if (feature.geometry.type === "LineString") {
  const line = turf.lineString(feature.geometry.coordinates);
  const meters = turf.length(line, { units: "kilometers" }) * 1000;

  setMeasurement({
    type: "distance",
    valueText: formatDistance(meters),
  });
}


    return;
  }
});

// mobile tap → behave like click
mapRef.current.on("touchend", (e) => {
  if (e.point) mapRef.current.fire("click", e);
});




    return () => {
      if (mapRef.current) {
        mapRef.current.off("mousemove", mouseMoveHandler);
        mapRef.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
useEffect(() => {
  if (!mapRef.current) return;

  if (!navigator.geolocation) return alert("Geolocation not supported");

  let accuracyCircle = null;

  watchIdRef.current = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;

      const lngLat = [longitude, latitude];
      lastUserLocation.current = lngLat;

      // ===== BLUE DOT ELEMENT =====
      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "gm-blue-dot";

        userMarkerRef.current = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat(lngLat)
          .addTo(mapRef.current);

        mapRef.current.flyTo({
          center: lngLat,
          zoom: 16,
        });
      } else {
        userMarkerRef.current.setLngLat(lngLat);
      }

      // ===== ACCURACY CIRCLE =====
      // Google-style capped + smoothed accuracy
const radius = Math.min(Math.max(accuracy * 0.4, 12), 60); // meters

const circleGeo = turf.circle(lngLat, radius / 1000, {
  steps: 64,
  units: "kilometers",
});

if (mapRef.current.getSource("accuracy")) {
  mapRef.current.getSource("accuracy").setData(circleGeo);
} else {
  mapRef.current.addSource("accuracy", {
    type: "geojson",
    data: circleGeo,
  });

  mapRef.current.addLayer({
    id: "accuracy-fill",
    type: "fill",
    source: "accuracy",
    paint: {
      "fill-color": "#2563eb",
      "fill-opacity": 0.15,
    },
  });

  mapRef.current.addLayer({
    id: "accuracy-outline",
    type: "line",
    source: "accuracy",
    paint: {
      "line-color": "#2563eb",
      "line-width": 2,
    },
  });
}

    },
    () => alert("Unable to fetch location"),
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );

  return () => {
    if (watchIdRef.current)
      navigator.geolocation.clearWatch(watchIdRef.current);
  };
}, []);


  // ---------- Add KMZ layers + markers ----------
// ---------- Add KMZ layers + markers ----------
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  map.once("load", () => {
    map.addSource("kmzSource", {
  type: "vector",
  url:
    "pmtiles://" +
    import.meta.env.VITE_BACKEND_URL +
    "important/parcels.pmtiles",

  promoteId: {
    GEOJSON_4326: "Parcel_num", // 👈 MUST match your layer + property
  },
});

    console.log("PMTiles source added");


    // fill (hidden)
    map.addLayer({
      id: "kmz-fill",
      type: "fill",
      source: "kmzSource",
      "source-layer": "GEOJSON_4326",

     paint: {
  "fill-color": "#ffe100",   // yellow fill
  "fill-opacity": 0,      // soft transparent yellow
},

    });

    // outline
    map.addLayer({
      id: "kmz-outline",
      type: "line",
      source: "kmzSource",
"source-layer": "GEOJSON_4326",

      paint: {
        "line-color": "#ffe100",
        "line-width": 2,
      },
    });

    // ✅ parcel numbers
map.addLayer({
  id: "kmz-labels",
  type: "symbol",
  source: "kmzSource",
  "source-layer": "GEOJSON_4326",

  minzoom: 14,

  layout: {
    "symbol-placement": "point",
    "text-field": ["get", "Parcel_num"],
    "text-size": 12,
    "text-anchor": "center",
    "text-allow-overlap": false,
    "text-ignore-placement": false,
  },

  paint: {
    "text-color": "#ffe100",
    "text-halo-color": "#000",
    "text-halo-width": 2,
  },
});


console.log("KMZ layers added");

  });
  map.on("click", "kmz-outline", (e) => {
  console.log(e.features[0].properties);
});

}, []);



  // ---------- Measurement helpers ----------
  const formatDistance = (meters) => {
    if (meters < 1) return `${(meters * 100).toFixed(1)} cm`;
    if (meters < 1000) return `${meters.toFixed(2)} m`;
    return `${(meters / 1000).toFixed(3)} km`;
  };

const formatArea = (m2) => {
  return `${m2.toFixed(2)} m²`;   // STRICT sq meters only
};

  // clear segment markers
  const clearSegmentMarkers = () => {
    segmentMarkersRef.current.forEach((m) => {
      try { m.remove(); } catch {}
    });
    segmentMarkersRef.current = [];
  };

  // clear area label
  const clearAreaLabel = () => {
    if (areaLabelMarkerRef.current) {
      try { areaLabelMarkerRef.current.remove(); } catch {}
      areaLabelMarkerRef.current = null;
    }
  };

  // create a white box label element (STYLE A)
const createLabelEl = (text, onDelete) => {
  const el = document.createElement("div");
  el.style.pointerEvents = "auto";
el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: false });
  el.style.cssText = `
    background: rgba(255,255,255,0.95);
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    transform: translate(-50%, -50%);
  `;

  const span = document.createElement("span");
  span.innerText = text;

  el.appendChild(span);

  if (onDelete) {
    const del = document.createElement("span");
    del.innerHTML = "🗑";
    del.style.cursor = "pointer";
    del.style.fontSize = "14px";

   const handleDelete = (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
  onDelete();
};

// desktop
del.addEventListener("click", handleDelete);

// mobile
del.addEventListener("touchstart", handleDelete, { passive: false });


    el.appendChild(del);
  }

  return el;
};


  // update/perhaps recreate segment markers + area label for the *final* geometry (on draw.create/ update)
const updateSegmentAndAreaLabels = (feature) => {
  if (!feature || !feature.geometry) return;

  clearSegmentMarkers();
  clearAreaLabel();

  const f = feature;

  if (f.geometry.type !== "Polygon" && f.geometry.type !== "LineString") return;

  const coords =
    f.geometry.type === "Polygon"
      ? f.geometry.coordinates[0]
      : f.geometry.coordinates;

  const len = coords.length - (f.geometry.type === "Polygon" ? 1 : 0);
if (len < 2) return;

  for (let i = 0; i < len - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

    const segMeters =
      turf.length(turf.lineString([a, b]), { units: "kilometers" }) * 1000;

    const el = createLabelEl(formatDistance(segMeters));

    const m = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat(mid)
      .addTo(mapRef.current);

    segmentMarkersRef.current.push(m);
  }

  if (f.geometry.type === "Polygon") {

  const ring = f.geometry.coordinates[0];

  // must be closed + minimum 4 coords
  if (!ring || ring.length < 4) return;

  const first = ring[0];
  const last = ring[ring.length - 1];

  // not closed yet
  if (first[0] !== last[0] || first[1] !== last[1]) return;

    const area = turf.area(f);

// ignore garbage tiny areas
if (area < 0.5) return;

    const centroid = turf.pointOnFeature(f).geometry.coordinates;

    const el = createLabelEl("", () => {

      drawRef.current.delete(f.id);
      clearSegmentMarkers();
      clearAreaLabel();
      setMeasurement(null);
      saveDrawings();
    });

    areaLabelMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat(centroid)
      .addTo(mapRef.current); 
  }
};


  // update live labels during drawing using pointer lngLat
  const updateLiveLabelsWithCursor = (cursorLngLat) => {
    // keep last feature only (in-progress)
    const data = drawRef.current.getAll();
    if (!data || !data.features || data.features.length === 0) {
      // clear live markers
      clearSegmentMarkers();
      clearAreaLabel();
      return;
    }
    const f = data.features[data.features.length - 1];
    if (!f || !f.geometry) return;

    // We'll compute temporary/preview coordinates including cursor as last point
    if (f.geometry.type === "LineString" || f.geometry.type === "Polygon") {
      clearSegmentMarkers();
      clearAreaLabel();

      let coords = f.geometry.coordinates.slice();
      // For polygon drawing, Mapbox Draw includes the ring; when drawing, the latest coordinate might not include cursor, so append cursor as last
      // We'll append cursor to last coordinate for live preview
      // Cursor is a maplibregl.LngLat object with lng, lat
      const cursorPoint = [cursorLngLat.lng, cursorLngLat.lat];

      if (f.geometry.type === "Polygon") {
        // polygon coords are array of rings; take outer ring
        coords = coords[0].slice();
        // append cursor as a potential moving vertex
        // ensure last point (closing) is removed if identical
        // Append cursor (but don't close polygon for preview)
        coords.push(cursorPoint);
      } else {
        // LineString: append cursor
        coords.push(cursorPoint);
      }

      // draw segment labels for each segment (use midpoints)
      for (let i = 0; i < coords.length - 1; i++) {
        const a = coords[i];
        const b = coords[i + 1];
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const segLine = turf.lineString([a, b]);
        const segMeters = turf.length(segLine, { units: "kilometers" }) * 1000;
        const label = formatDistance(segMeters);

        const el = createLabelEl(label);
        const m = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([mid[0], mid[1]])
          .addTo(mapRef.current);
        segmentMarkersRef.current.push(m);
      }

      // live area preview if polygon (compute area from coords + projected closing if needed)
      if (f.geometry.type === "Polygon") {
        // make polygon ring closing
        const polyCoords = coords.slice();
        if (
          polyCoords.length > 2 &&
          (polyCoords[0][0] !== polyCoords[polyCoords.length - 1][0] ||
            polyCoords[0][1] !== polyCoords[polyCoords.length - 1][1])
        ) {
          polyCoords.push(polyCoords[0]);
        }
        const poly = turf.polygon([polyCoords]);
        const area = turf.area(poly);
        const centroid = turf.centroid(poly).geometry.coordinates;
        const el = createLabelEl(`Area: ${formatArea(area)}`);

        areaLabelMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([centroid[0], centroid[1]])
          .addTo(mapRef.current);
      }
    }
  };

  // ---------- Measurement (Get Measurement button) ----------
  const updateMeasurementPanel = () => {
    // compute final measurement from last drawn feature
    const data = drawRef.current.getAll();
    if (!data || !data.features || data.features.length === 0) {
      setMeasurement(null);
      return;
    }
    const f = data.features[data.features.length - 1];
    if (!f || !f.geometry) {
      setMeasurement(null);
      return;
    }

    if (f.geometry.type === "LineString") {
      const line = turf.lineString(f.geometry.coordinates);
      const km = turf.length(line, { units: "kilometers" });
      setMeasurement({ type: "distance", valueText: `${km.toFixed(3)} km` });
      // ensure final labels are present
      updateSegmentAndAreaLabels();
      return;
    }

    if (f.geometry.type === "Polygon") {
      const areaM2 = turf.area(f);

setMeasurement({
  type: "area",
  valueText: `${areaM2.toFixed(2)} m²`,
});

      // ensure final labels are present
      updateSegmentAndAreaLabels();
      return;
    }

    setMeasurement(null);
  };

  // ---------- Toggle KMZ ----------
const toggleKmz = () => {
  const map = mapRef.current;

  setKmzVisible((v) => {
    const show = !v;

    try {
      // 🔥 Toggle ONLY MapboxDraw layers (custom drawings)
      const style = map.getStyle();

      style.layers.forEach((layer) => {
        if (layer.id.startsWith("gl-draw")) {
          map.setLayoutProperty(
            layer.id,
            "visibility",
            show ? "visible" : "none"
          );
        }
      });

      // 🔥 Toggle ONLY measurement markers (segments + area)
      segmentMarkersRef.current.forEach((m) => {
        m.getElement().style.display = show ? "" : "none";
      });

      if (areaLabelMarkerRef.current) {
        areaLabelMarkerRef.current.getElement().style.display = show ? "" : "none";
      }

    } catch (e) {
      console.warn("toggle draw polygons error", e);
    }

    return show;
  });
};





  // ---------- LocationIQ helpers ----------
  const fetchSuggestions = async (text) => {
    if (!text.trim()) return setSuggestions([]);
    try {
      const url = `https://api.locationiq.com/v1/search.php?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(text)}&format=json&countrycodes=in&addressdetails=1&limit=8`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Suggestion error", err);
      setSuggestions([]);
    }
  };

  const searchLocation = async () => {
    if (!query.trim()) return;
    try {
      const url = `https://api.locationiq.com/v1/search.php?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(query)}&format=json&countrycodes=in&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return alert("Not found");
      const { lat, lon } = data[0];
      mapRef.current.flyTo({ center: [parseFloat(lon), parseFloat(lat)], zoom: 15, duration: 800 });
      setSuggestions([]);
    } catch (err) {
      console.error("Search error", err);
    }
  };

  // ---------- My location ----------

  return (
    <div className="p-4">
        <motion.button
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-5 left-6 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg z-50 transition"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </motion.button>
      <h1 className="font-bold text-lg  text-center mb-4">Map Viewer</h1>

      {/* Search */}
      <div className="relative mb-4">
        <div className="flex gap-2 items-center">
          <div className="relative w-64">
            <input
  className="border p-2 pl-10 pr-8 rounded w-full"
  placeholder="Search village..."
  value={query}
  onChange={(e) => {
    const text = e.target.value;
    setQuery(text);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => fetchSuggestions(text), 350);
  }}
/>

{/* ❌ Clear input button */}
{query && (
  <button
    onClick={() => {
      setQuery("");
      setSuggestions([]);
    }}
    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-700"
  >
    ✕
  </button>
)}

            {/* Search Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
            </svg>
          </div>

          <button onClick={searchLocation} className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>

          {/* Toggle KMZ */}
          <button onClick={toggleKmz} className="ml-2 bg-white border px-3 rounded shadow">
            {kmzVisible ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
              </svg>
              
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M10 10a3 3 0 014 4M2.458 12A10 10 0 0112 5a10 10 0 019.542 7A10 10 0 0112 19a10 10 0 01-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute bg-white border w-80 mt-1 z-50 shadow max-h-60 overflow-y-auto">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setQuery(s.display_name);
                  setSuggestions([]);
                  mapRef.current.flyTo({ center: [parseFloat(s.lon), parseFloat(s.lat)], zoom: 15, duration: 800 });
                }}
              >
                {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* map */}
      <div className="relative w-full h-[650px]">
               
        {/* Bottom-center Get Measurement button */}
        {showMeasureBtn && (
          <button
            onClick={() => {
              updateMeasurementPanel();
            }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-white px-5 py-2 rounded-lg shadow font-semibold"
          >
            Get Measurement
          </button>
        )}

        {/* measurement panel */}
        {measurement && (
          <div className="absolute bottom-4 left-4 z-50 bg-white p-3 rounded shadow">
            <div className="text-sm font-medium">
              {measurement.type === "distance" ? "Distance" : "Area"}
            </div>
            <div className="text-lg font-bold">{measurement.valueText}</div>
          </div>
        )}
{/* Google Maps style current location button */}
<button
  onClick={() => {
    if (!lastUserLocation.current) return;

    mapRef.current.flyTo({
      center: lastUserLocation.current,
      zoom: 17,
      duration: 800,
    });
  }}
  className="absolute bottom-125 right-2.5 z-50 bg-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition"
>
 <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 576 512"
  className="w-4.5 h-4.5"
  fill="#2563eb"
>
  <path d="M288-16c17.7 0 32 14.3 32 32l0 18.3c98.1 14 175.7 91.6 189.7 189.7l18.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-18.3 0c-14 98.1-91.6 175.7-189.7 189.7l0 18.3c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-18.3C157.9 463.7 80.3 386.1 66.3 288L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l18.3 0C80.3 125.9 157.9 48.3 256 34.3L256 16c0-17.7 14.3-32 32-32zM128 256a160 160 0 1 0 320 0 160 160 0 1 0 -320 0zm160-96a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" />
</svg>
</button>

        <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden shadow" />


      </div>
    </div>
  );
}







