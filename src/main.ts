// css
import './style.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import L from 'leaflet';
import 'leaflet-draw';

// Import Terra Draw
import { TerraDraw, TerraDrawLeafletAdapter, TerraDrawFreehandMode } from 'terra-draw';

import * as turf from '@turf/turf';
import { MockGeoJson } from './mock/mock-geo-json';

// https://github.com/jeancochrane/philly-fliers/blob/2f2e3b9f4511933dbf1501701b54754ee524a1e6/app/src/components/Map.vue#L14

L.Icon.Default.imagePath = 'img/icon/';

const basemaps = {
    'Open Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),
    'Google Satellite': L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 18,
    }),
    'Esri Satellite': L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            maxZoom: 18,
        }
    ),
    'Open Cycle Map': L.tileLayer('https://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {
        maxZoom: 18,
    }),
};

const overlayMaps = {
    'Big Circle': L.circle([40.4204, -91.9548], { radius: 5000 }),
    'Big Square': L.polygon([
        [40.8, -91.55],
        [40.9, -91.55],
        [40.9, -91.7],
        [40.8, -91.7],
    ]),
};

// - initialize the map
const map = L.map('map', {
    center: new L.LatLng(40.4204, -91.9548),
    // layers: [osm, osmHOT],
    zoom: 15,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: true,
    closePopupOnClick: true,
    attributionControl: !L.Browser.touch,
    zoomAnimation: true,
});

L.control.layers(basemaps, overlayMaps).addTo(map);

// initialize the FeatureGroup to store editable layers
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// set up the Leaflet Draw control
const drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
        remove: true,
    },
    draw: {
        rectangle: <any>{ showArea: false },
        // polygon: true,
        // circle: false,
        // polyline: true,
        // marker: true
    },
});
map.addControl(drawControl);

// handle the creation of new shapes
map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);

    // log GeoJSON of the drawn shape to console
    console.log(layer.toGeoJSON());

    // calculate area using Turf.js in square meters
    const areaSqMeters = turf.area(layer.toGeoJSON());

    // convert square meters to acres
    const areaInAcres = areaSqMeters / 4046.86;

    console.log(`Area: ${areaInAcres.toFixed(2)} acres`);

    // optionally display the area in a popup or alert
    alert(`The area of the polygon is ${areaInAcres.toFixed(2)} acres`);
});

// Define the style for unselected features
const defaultStyle = {
    color: '#3388ff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.2,
};

// Define the style for highlighted features on hover
const hoverStyle = {
    color: '#ff7800',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.5,
};

// Define the style for selected features
const selectedStyle = {
    color: '#32CD32',
    weight: 3,
    opacity: 1,
    fillOpacity: 0.6,
};

let selectedFeature = null; // Variable to track the selected feature

// Function to reset the style to default
function resetStyle(e) {
    geojsonLayer.resetStyle(e.target);
}

// Function to highlight the feature on mouseover
function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle(hoverStyle);
}

// Function to handle click and select the feature
function selectFeature(e) {
    if (selectedFeature) {
        // Reset the previously selected feature's style
        geojsonLayer.resetStyle(selectedFeature);
    }

    // Set the new selected feature's style
    selectedFeature = e.target;
    selectedFeature.setStyle(selectedStyle);
}

// Function to handle mouseout event
function resetHighlight(e) {
    if (selectedFeature !== e.target) {
        // Reset only if the feature is not selected
        resetStyle(e);
    }
}

// Handling events using onEachFeature
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: selectFeature,
    });
}

const popups = [];

// Adding the GeoJSON layer to the map
const geojsonLayer = L.geoJSON(MockGeoJson, {
    style: function () {
        return {
            color: 'red',
            weight: 10,
            dashArray: '5,5',
            fillColor: 'red',
            fillOpacity: 0,
        };
    },
    onEachFeature: function (t, e) {
        const popup = new L.Popup(
            {
                closeButton: !0,
            },
            undefined
        );

        popup.setContent(t.properties.label?.replace(',', '<br>'));

        popup.setLatLng(e.getBounds().getCenter());

        popups.push({
            popup: popup,
            layer: e,
        });

        t.properties.color = 'red';
    },
}).addTo(map);

// Create Terra Draw
const draw = new TerraDraw({
    adapter: new TerraDrawLeafletAdapter({
        lib: L,
        map,
    }),
    modes: [new TerraDrawFreehandMode()],
});

// Start drawing
draw.start();
draw.setMode('freehand');

interface Tile extends HTMLImageElement {
    _layer: any;
    galleryimg: string;
}

//@ts-ignore
L.NAIPLayer = L.TileLayer.extend({
    _update: function () {
        // Check if the pan transition is not in progress
        if (!this._map._panTransition || !this._map._panTransition._inProgress) {
            // Get the pixel bounds of the current map view
            const bounds = this._map.getPixelBounds();
            const zoomLevel = this._customZoom();
            const tileSize = this._tileSize();

            // Ensure zoom level is within the allowed range
            if (zoomLevel <= this.options.maxZoom && zoomLevel >= this.options.minZoom) {
                const minPoint = new L.Point(
                    Math.floor(bounds.min.x / tileSize),
                    Math.floor(bounds.min.y / tileSize)
                );
                const maxPoint = new L.Point(
                    Math.floor(bounds.max.x / tileSize),
                    Math.floor(bounds.max.y / tileSize)
                );
                const tileBounds = new L.Bounds(minPoint, maxPoint);

                // Add tiles from the center outwards
                this._addTilesFromCenterOut(tileBounds);

                // Remove invisible or unused tiles based on options
                if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
                    this._removeOtherTiles(tileBounds);
                }
            }
        }
    },

    _getZoomForUrl: function () {
        const options = this.options;
        let zoomLevel = this._customZoom();

        // Reverse zoom if needed and apply offset
        if (options.zoomReverse) {
            zoomLevel = options.maxZoom - zoomLevel;
        }

        return zoomLevel + options.zoomOffset;
    },

    _getTilePos: function (tilePoint: L.Point) {
        const pixelOrigin = this._map.getPixelOrigin();
        const tileSize = this._tileSize();

        // Calculate tile position
        return tilePoint.multiplyBy(tileSize).subtract(pixelOrigin);
    },

    _customZoom: function () {
        const mapZoom = this._map.getZoom();

        // Cap zoom level to maxPhysicalZoom
        return mapZoom > this.options.maxPhysicalZoom ? this.options.maxPhysicalZoom : mapZoom;
    },

    _tileSize: function () {
        const mapZoom = this._map.getZoom();

        // Adjust tile size based on zoom level exceeding maxPhysicalZoom
        return mapZoom > this.options.maxPhysicalZoom
            ? this.options.tileSize * Math.pow(2, mapZoom - this.options.maxPhysicalZoom)
            : this.options.tileSize;
    },

    _createTileProto: function () {
        // Create a prototype tile image element
        const tileImg = L.DomUtil.create('img', 'leaflet-tile') as Tile;
        tileImg.galleryimg = 'no'; // Disable image gallery
        this._tileImg = tileImg;

        const tileSize = this._tileSize();
        tileImg.style.width = `${tileSize}px`;
        tileImg.style.height = `${tileSize}px`;
    },

    _loadTile: function (tile: Tile, tilePoint: L.Point) {
        // Set tile attributes and load URL
        tile._layer = this;
        tile.onload = this._tileOnLoad;
        tile.onerror = this._tileOnError;
        tile.src = this.getTileUrl(tilePoint);

        const tileSize = this._tileSize();
        tile.style.width = `${tileSize}px`;
        tile.style.height = `${tileSize}px`;
    },
});

//@ts-ignore
// Factory method to create an instance of NAIPLayer
L.naipLayer = function (options, config) {
    //@ts-ignore
    return new L.NAIPLayer(options, config);
};

// scale (bottom left)
// const scale = L.control
//     .scale({
//         imperial: false,
//         maxWidth: 300,
//     })
//     .addTo(map);

// // marker
// const marker = L.marker([51.518, -0.11]) //
//     .addTo(map);

// // circle
// const circle = L.circle([51.508, -0.11], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.5,
//     radius: 500,
// }).addTo(map);

// // polygon
// const polygon = L.polygon([
//     [51.509, -0.08],
//     [51.503, -0.06],
//     [51.51, -0.047],
// ]).addTo(map);

// marker.bindPopup('<b>Hello world!</b><br>I am a popup.').openPopup();
// circle.bindPopup('I am a circle.');
// polygon.bindPopup('I am a polygon.');

// popup
// const popup = L.popup();

// map.on('click', (e) => {
//     popup
//         .setLatLng(e.latlng)
//         .setContent('You clicked the map at ' + e.latlng.toString())
//         .openOn(map);
// });
