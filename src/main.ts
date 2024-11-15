// css
import './style.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import L from 'leaflet';
import 'leaflet-draw';

import * as turf from '@turf/turf';

// https://github.com/jeancochrane/philly-fliers/blob/2f2e3b9f4511933dbf1501701b54754ee524a1e6/app/src/components/Map.vue#L14

L.Icon.Default.imagePath = 'img/icon/';

// - initialize the map
const map = L.map('map', {
    center: new L.LatLng(40.464, -95.867),
    zoom: 15,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: true,
    closePopupOnClick: true,
    attributionControl: !L.Browser.touch,
    zoomAnimation: true,
});

// add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// initialize the FeatureGroup to store editable layers
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// set up the Leaflet Draw control
const drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
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
