// const m_mono = L.tileLayer(
//     'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
//     {
//         attribution:
//             '&copy; Esri &mdash; Sources: Esri, DigitalGlobe, Earthstar Geographics, CNES/Airbus DS, GeoEye, USDA FSA, USGS, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community',
//     }
// );

// basemaps = {
//     'Google Satellite': folium.TileLayer(
//         tiles = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
//         attr = 'Google',
//         name = 'Google Satellite',
//         overlay = True,
//         control = True
//     ),
//     'ESRI': folium.TileLayer(
//         'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
//         attr = 'Esri',
//         name = 'Esri Satellite',
//         overlay = False,
//         control = True
//     ),
//     'MB': folium.TileLayer(
//         'https://api.mapbox.com/v4/mapbox.naip/{z}/{x}/{y}@2x.png?access_token=' + str(mbToken),
//         attr = 'Mapbox',
//         name = 'Mapbox',
//         overlay = False,
//         control = False
//     )
// }
// "NAIP Imagery": folium.WmsTileLayer(
//     url="https://services.nationalmap.gov/arcgis/services/USGSNAIPImagery/ImageServer/WMSServer?",
//     layers="0",
//     attr="USGS",
//     name="NAIP Imagery",
//     overlay=True,
//     control=True,
// ),

// Initialize Leaflet Draw component for drawing geometries.
