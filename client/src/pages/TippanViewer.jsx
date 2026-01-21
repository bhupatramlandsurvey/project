import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import MapboxDraw from "maplibre-gl-draw";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion } from "framer-motion";
import "maplibre-gl-draw/dist/mapbox-gl-draw.css";
import { useNavigate } from "react-router-dom";
import { MapPinIcon, ArrowLeftIcon  } from "@heroicons/react/24/outline";

export default function TippanViewer() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  const navigate = useNavigate();

  // markers for KMZ points (if any)
  const markersRef = useRef([]);

  // markers used for segment labels and area label
  const segmentMarkersRef = useRef([]);
  const areaLabelMarkerRef = useRef(null);
  const liveCursorMarkerRef = useRef(null);

  const [geoJson, setGeoJson] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [measurement, setMeasurement] = useState(null);
  const [kmzVisible, setKmzVisible] = useState(true);

  // show bottom Get Measurement button as soon as user places any vertex
  const [showMeasureBtn, setShowMeasureBtn] = useState(false);

  const typingTimeout = useRef(null);
  const LOCATIONIQ_KEY = "pk.edd1d1cc8b297c95f63273f032beaa41";
  const MAPTILER_KEY = "sxcW0yqySXYuMWtjZglU";



  // ---------- KMZ load ----------

// ---------- OPTIMIZED GEOJSON load ----------
useEffect(() => {
  const loadGeoJSON = async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URL + "important/optimized.geojson",
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("GeoJSON fetch failed");
      const geo = await res.json();
      setGeoJson(geo);
    } catch (err) {
      console.error("GeoJSON load error:", err);
    }
  };
  loadGeoJSON();
}, []);

  // ---------- map + draw init ----------
  useEffect(() => {
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
      center: [78.9629, 20.5937],
      zoom: 5,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-left");

    drawRef.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { line_string: true, polygon: true, trash: true },
    });
    mapRef.current.addControl(drawRef.current);

    // Show Get Measurement button when user creates/updates shapes (any vertex)
    mapRef.current.on("draw.create", () => {
      setShowMeasureBtn(true);
      // update labels for the newly created feature
      updateSegmentAndAreaLabels();
    });
    mapRef.current.on("draw.update", () => {
      setShowMeasureBtn(true);
      updateSegmentAndAreaLabels();
    });
    mapRef.current.on("draw.delete", () => {
      setShowMeasureBtn(false);
      setMeasurement(null);
      clearSegmentMarkers();
      clearAreaLabel();
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

    return () => {
      if (mapRef.current) {
        mapRef.current.off("mousemove", mouseMoveHandler);
        mapRef.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Add KMZ layers + markers ----------
useEffect(() => {
  const map = mapRef.current;
  if (!map || !geoJson) return;

  const applyLayers = () => {
    // cleanup old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    try { if (map.getLayer("kmz-fill")) map.removeLayer("kmz-fill"); } catch {}
    try { if (map.getLayer("kmz-outline")) map.removeLayer("kmz-outline"); } catch {}
    try { if (map.getSource("kmzSource")) map.removeSource("kmzSource"); } catch {}

    const nonPoint = {
      type: "FeatureCollection",
      features: geoJson.features.filter(
        (f) => f.geometry && f.geometry.type !== "Point"
      ),
    };

    if (nonPoint.features.length > 0) {
      map.addSource("kmzSource", { type: "geojson", data: nonPoint,generateId: true });

      map.addLayer({
        id: "kmz-fill",
        type: "fill",
        source: "kmzSource",
        paint: { "fill-color": "#ffffff", "fill-opacity": 0.12 },
      });

      map.addLayer({
        id: "kmz-outline",
        type: "line",
        source: "kmzSource",
        paint: { "line-color": "#ffffff", "line-width": 2 },
      });
    }

    // add point markers
    const pointFeatures = geoJson.features.filter(
      (f) => f.geometry && f.geometry.type === "Point"
    );

    pointFeatures.forEach((feat, idx) => {
      const [lng, lat] = feat.geometry.coordinates;

      const el = document.createElement("div");
      el.className = "survey-label";
      el.style.background = "white";
      el.style.padding = "4px 6px";
      el.style.borderRadius = "6px";
      el.innerText =
        feat.properties?.name ||
        feat.properties?.Name ||
        feat.properties?.description ||
        `${idx + 1}`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // fit bounds
    try {
      const bbox = turf.bbox(geoJson);
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 40 }
      );
    } catch {}
  };

  if (map.isStyleLoaded()) {
    applyLayers();
  } else {
    map.once("load", applyLayers);
  }
}, [geoJson]);


  // ---------- Measurement helpers ----------
  const formatDistance = (meters) => {
    if (meters < 1) return `${(meters * 100).toFixed(1)} cm`;
    if (meters < 1000) return `${meters.toFixed(2)} m`;
    return `${(meters / 1000).toFixed(3)} km`;
  };

  const formatArea = (m2) => {
    if (m2 < 1_000) return `${m2.toFixed(2)} m²`;
    if (m2 < 1_000_000) return `${(m2 / 1000).toFixed(2)} sq.m`;
    return `${(m2 / 1_000_000).toFixed(4)} sq.km`;
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
  const createLabelEl = (text) => {
    const el = document.createElement("div");
    el.style.cssText = `
      background: rgba(255,255,255,0.95);
      padding: 4px 6px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      white-space: nowrap;
      transform: translate(-50%, -50%);
    `;
    el.innerText = text;
    return el;
  };

  // update/perhaps recreate segment markers + area label for the *final* geometry (on draw.create/ update)
  const updateSegmentAndAreaLabels = () => {
    const data = drawRef.current.getAll();
    if (!data || !data.features || data.features.length === 0) {
      clearSegmentMarkers();
      clearAreaLabel();
      return;
    }

    // use last feature
    const f = data.features[data.features.length - 1];
    if (!f || !f.geometry) return;

    clearSegmentMarkers();
    clearAreaLabel();

    if (f.geometry.type === "LineString" || f.geometry.type === "Polygon") {
      // for polygon, use the outer ring coordinates
      const coords = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates;
      // if polygon, last coord equals first; ignore last when computing segments
      const len = coords.length - (f.geometry.type === "Polygon" ? 1 : 0);

      for (let i = 0; i < len - 1; i++) {
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

      // area label for polygon
      if (f.geometry.type === "Polygon") {
        const area = turf.area(f); // in m2
        const centroid = turf.centroid(f).geometry.coordinates;
        const el = createLabelEl(`Area: ${formatArea(area)}`);
        areaLabelMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([centroid[0], centroid[1]])
          .addTo(mapRef.current);
      }
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
      const areaKm2 = areaM2 / 1_000_000;
      setMeasurement({ type: "area", valueText: `${areaKm2.toFixed(4)} sq.km` });
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
        if (map.getLayer("kmz-fill")) map.setLayoutProperty("kmz-fill", "visibility", show ? "visible" : "none");
        if (map.getLayer("kmz-outline")) map.setLayoutProperty("kmz-outline", "visibility", show ? "visible" : "none");
        markersRef.current.forEach((m) => {
          const el = m.getElement();
          el.style.display = show ? "" : "none";
        });
      } catch (e) {
        console.warn("toggleKmz error", e);
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
  const showMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15, duration: 800 });
        new maplibregl.Marker({ color: "red" }).setLngLat([longitude, latitude]).addTo(mapRef.current);
      },
      () => alert("Unable to fetch location")
    );
  };

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
              className="border p-2 pl-10 rounded w-full"
              placeholder="Search village..."
              value={query}
              onChange={(e) => {
                const text = e.target.value;
                setQuery(text);
                clearTimeout(typingTimeout.current);
                typingTimeout.current = setTimeout(() => fetchSuggestions(text), 350);
              }}
            />
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

        {/* My Location (HeroIcon) */}
        <button onClick={showMyLocation} className="absolute bottom-4 right-4 z-50 bg-white p-3 rounded-full shadow-lg">
          <MapPinIcon className="h-6 w-6 text-blue-600" />
        </button>

        {/* measurement panel */}
        {measurement && (
          <div className="absolute bottom-4 left-4 z-50 bg-white p-3 rounded shadow">
            <div className="text-sm font-medium">
              {measurement.type === "distance" ? "Distance" : "Area"}
            </div>
            <div className="text-lg font-bold">{measurement.valueText}</div>
          </div>
        )}

        <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden shadow" />
      </div>
    </div>
  );
}
