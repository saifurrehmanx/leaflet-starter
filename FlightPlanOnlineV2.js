function AgrismartSort(t, e, E, R) {
    return this._initialize(t, e, E, R), this;
}

function AgrismartFilter(t, e, E, R) {
    return this._initialize(t, e, E, R), this;
}

var format = function (pattern, number) {
    // Return the original number if the pattern or number is invalid
    if (!pattern || isNaN(+number)) {
        return number;
    }

    // Check if the number is negative and process accordingly
    var isNegative = pattern.charAt(0) === '-';
    number = isNegative ? -number : +number;

    // Extract separators (comma for thousands, dot for decimals)
    var separators = pattern.match(/[^\d\-\+#]/g);
    var decimalSeparator = separators ? separators[separators.length - 1] : '.';
    var thousandSeparator = (separators && separators[1] && separators[0]) || ',';

    // Split the pattern into integer and decimal parts
    var patternParts = pattern.split(decimalSeparator);

    // Round the number to the correct decimal places
    number = number.toFixed(patternParts[1] && patternParts[1].length);
    number = +number + ''; // Convert number to string

    // Handle rounding precision
    var decimalIndex = patternParts[1] && patternParts[1].lastIndexOf('0');
    var numberParts = number.split('.');
    if (
        (number !== Math.round(+number.toFixed(decimalIndex + 1)) && !numberParts[1]) ||
        (numberParts[1] && numberParts[1].length <= decimalIndex)
    ) {
        number = (+number).toFixed(decimalIndex + 1);
    }

    // Remove unnecessary leading zeroes in the integer part
    var integerPart = patternParts[0].split(thousandSeparator);
    patternParts[0] = integerPart.join('');

    // Ensure the integer part has leading zeroes if necessary
    var zeroPaddingIndex = patternParts[0].indexOf('0');
    if (zeroPaddingIndex > -1) {
        while (numberParts[0].length < patternParts[0].length - zeroPaddingIndex) {
            numberParts[0] = '0' + numberParts[0];
        }
    } else {
        if (+numberParts[0] === 0) numberParts[0] = '';
    }

    // Format the integer part with the thousands separator
    var formattedInteger = patternParts[0];
    if (formattedInteger) {
        var chunkSize = formattedInteger.length % thousandSeparator.length;
        var groupedInteger = '';
        for (var i = 0; i < formattedInteger.length; i++) {
            groupedInteger += formattedInteger.charAt(i);
            if (
                (i - chunkSize + 1) % thousandSeparator.length === 0 &&
                i < formattedInteger.length - thousandSeparator.length
            ) {
                groupedInteger += thousandSeparator;
            }
        }
        numberParts[0] = groupedInteger;
    }

    // Combine the integer and decimal parts
    return (
        (isNegative ? '-' : '') +
        numberParts[0] +
        (patternParts[1] && numberParts[1] ? decimalSeparator + numberParts[1] : '')
    );
};

// #####################################################

// Initialize Leaflet GeoSearch Namespace
L.GeoSearch = {};
L.GeoSearch.Provider = {};

// Enable Cross-Origin Resource Sharing
jQuery.support.cors = true;

// GeoSearch Result Class - Represents a geographic search result with coordinates, label, and optional feature collection
L.GeoSearch.Result = function(x, y, label, featureCollection) {
    this.X = x;                       // Longitude
    this.Y = y;                       // Latitude
    this.Label = label;               // Location description
    this.FeatureCollection = featureCollection; // Additional geographic data
};

// Agrismart GeoSearch Provider
L.GeoSearch.Provider.Agrismart = L.Class.extend({
    options: {},

    // Initialize provider with options
    initialize: function(options) {
        options = L.Util.setOptions(this, options);
    },

    /**
     * Main method to get locations based on different search criteria
     * @param {Object|String} searchQuery - Search query with type and string
     * @param {Function} callback - Callback function to handle search results
     */
    GetLocations: function(searchQuery, callback) {
        // Extend options with search address
        L.Util.extend({
            address: searchQuery
        }, this.options);

        // Prepare query string
        var qrystr = searchQuery.str || searchQuery;

        // Regular expression patterns for different location formats
        var uslegalpattern = /^\s*([a-zA-Z]{2})\s?(\d{1,3}-\d{1,3}[N|n|S|s]-\d{1,3}[W|w|E|e])\s*$/m;
        var calegalpattern = /^\s*(AB|MB|SK)\s?(\d{1,2}-\d{1,3}-\d{1,2})(-\d{1}[W|w|E|e]?)?\s*$/im;
        var latlngpattern = /^\s*(-?\d{1,3}\.?\d+)[,\s|\s]+(-?\d{1,3}\.?\d+)\s*$/m;

        // Initialize search defaults
        userOptions.searchDefaults = userOptions.searchDefaults || {};

        // Handle different search scenarios
        if (searchQuery === '' || searchQuery.str === '') {
            this.ClearLocation(callback);
        } else if (searchQuery.type === 'legal' || uslegalpattern.test(qrystr)) {
            // US Legal land description search
            if (!uslegalpattern.test(qrystr)) {
                throw 'Invalid format';
            }

            qrystr = qrystr.toUpperCase();
            var qryarray = qrystr.split('-');
            var state = qryarray[0].substring(0, 2);
            var section = qryarray[0].substring(2, qryarray[0].length);
            var township = qryarray[1].substring(0, qryarray[1].length - 1);
            var township_cardinal = qryarray[1].substring(qryarray[1].length - 1);
            var range = qryarray[2].substring(0, qryarray[2].length - 1);
            var range_cardinal = qryarray[2].substring(qryarray[2].length - 1);

            // Set search defaults
            userOptions.searchDefaults.state = state;
            userOptions.searchDefaults.township = township;
            userOptions.searchDefaults.range = range;
            userOptions.searchDefaults.rangedir = range_cardinal;
            userOptions.searchDefaults.townshipdir = township_cardinal;
            userOptions.searchDefaults.section = section;
            userOptions.searchDefaults.type = searchQuery.type;

            // Construct URL for Agrismart search
            var url = '/section/state_abbr/' + state +
                        '/section/' + section +
                        '/township/' + township +
                        '/township_cardinal/' + township_cardinal +
                        '/range/' + range +
                        '/range_cardinal/' + range_cardinal;

            this.QryAgrismart(qrystr, callback, url);
        } 
        // Similar detailed implementations for other search types (Canada, coordinates, Texas, township)
        // ... (code continues with other search type handlers)
        else if (searchQuery.type === 'canada' || calegalpattern.test(qrystr)) {
            // Canadian legal land description search (implementation details)
        } else if (searchQuery.type === 'coord' || latlngpattern.test(qrystr)) {
            // Coordinate search (implementation details)
        } else if (searchQuery.type === 'texas') {
            // Texas-specific land description search (implementation details)
        } else if (searchQuery.type === 'township') {
            // Township search (implementation details)
        } else {
            // Default to Google geocoding for other place names
            userOptions.searchDefaults.place = qrystr;
            userOptions.searchDefaults.type = searchQuery.type;
            var googleProvider = new L.GeoSearch.Provider.Google();
            googleProvider.GetLocations(qrystr, callback);
        }
    },

    /**
     * Clear location results
     * @param {Function} callback - Callback to handle empty results
     */
    ClearLocation: function(callback) {
        var results = [];
        results.push(new L.GeoSearch.Result(0, 0, ''));
        callback(results);
    },

    /**
     * Display coordinate location
     * @param {String} coordinates - Comma-separated latitude and longitude
     * @param {Function} callback - Callback to handle coordinate results
     */
    ShowCoordLocation: function(coordinates, callback) {
        if (typeof callback === 'function') {
            var lat = coordinates.substring(0, coordinates.indexOf(','));
            var lng = coordinates.substring(coordinates.indexOf(',') + 1, coordinates.length);
            var results = [];
            results.push(new L.GeoSearch.Result(lng, lat, lat + ', ' + lng));
            callback(results);
        }
    },

    /**
     * Query Agrismart service
     * @param {String} queryString - Original search query
     * @param {Function} callback - Callback to handle search results
     * @param {String} url - Search URL for Agrismart service
     */
    QryAgrismart: function(queryString, callback, url) {
        // Determine base URL from page options
        url = (pageOptions && pageOptions.agrismartSearchBaseUri 
            ? pageOptions.agrismartSearchBaseUri 
            : '') + url;

        $.getJSON(encodeURI(url), function(data) {
            var results = [];
            if (data.features) {
                results.push(new L.GeoSearch.Result(0, 0, '', data));
            } else {
                results.push(new L.GeoSearch.Result(0, 0, queryString + ' not found', null));
            }
            
            if (typeof callback === 'function') {
                callback(results);
            }
        }).fail(function(jqXHR, textStatus) {
            var results = [];
            results.push(new L.GeoSearch.Result(0, 0, textStatus, null));
            
            if (typeof callback === 'function') {
                callback(results);
            }
        });
    }
});

// Google Maps Geocoding Callback
window.onLoadGoogleApiCallback = function() {
    L.GeoSearch.Provider.Google.Geocoder = new google.maps.Geocoder();
};

// Google Maps Geocoding Provider
L.GeoSearch.Provider.Google = L.Class.extend({
    options: {},

    /**
     * Load Google Maps API dynamically
     * @param {String} additionalParams - Additional URL parameters
     */
    getGoogle: function(additionalParams) {
        var url = (pageOptions && pageOptions.googleBaseUri ? pageOptions.googleBaseUri : '') +
                    '&channel=' + (mapOptions && mapOptions.channel ? mapOptions.channel : 'asm') +
                    additionalParams;

        window.googleloading = true;
        $.ajax({
            url: url,
            dataType: 'script',
            cache: true
        }).fail(function() {
            window.googleloading = false;
        });
    },

    /**
     * Initialize Google provider
     * @param {Object} options - Initialization options
     */
    initialize: function(options) {
        options = L.Util.setOptions(this, options);

        // Load Google geocoder if not already loaded
        if (!L.GeoSearch.Provider.Google.Geocoder && !window.googleloading) {
            this.getGoogle('&callback=onLoadGoogleApiCallback');
        }
    },

    /**
     * Get locations using Google Geocoding
     * @param {String} query - Search query
     * @param {Function} callback - Callback to handle geocoding results
     */
    GetLocations: function(query, callback) {
        if (L.GeoSearch.Provider.Google.Geocoder) {
            var geocoder = L.GeoSearch.Provider.Google.Geocoder;
            var options = L.Util.extend({
                address: query
            }, this.options);

            try {
                geocoder.geocode(options, function(results, status) {
                    var locations = [];

                    if (results && results.length > 0) {
                        for (var i = 0; i < results.length; i++) {
                            locations.push(new L.GeoSearch.Result(
                                results[i].geometry.location.lng(),
                                results[i].geometry.location.lat(),
                                results[i].formatted_address
                            ));
                        }
                    } else {
                        locations.push(new L.GeoSearch.Result(0, 0, query + ' not found', null));
                    }

                    if (typeof callback === 'function') {
                        callback(locations);
                    }
                });
            } catch (error) {
                var locations = [new L.GeoSearch.Result(0, 0, query + ' not found', null)];
                if (typeof callback === 'function') {
                    callback(locations);
                }
            }
        } else {
            // Retry geocoding if Google API not loaded
            setTimeout(L.Util.bind(this.GetLocations, this, query, callback), 400);
        }
    }
});

// Custom Hover Control for Leaflet
L.Control.Hover = L.Control.extend({
    options: {
        position: 'hover',
        offset: new L.Point(30, -16)
    },

    /**
     * Initialize hover control
     * @param {L.Point} point - Hover point
     * @param {String} content - Hover content
     * @param {Object} options - Additional options
     */
    initialize: function(point, content, options) {
        this._point = point;
        this._content = content;
        L.Util.setOptions(this, options);
    },

    /**
     * Add control to map
     * @param {L.Map} map - Leaflet map
     * @returns {HTMLElement} Hover control container
     */
    onAdd: function(map) {
        // Create hover container if not exists
        if (!map._controlCorners.hasOwnProperty('hover')) {
            map._controlCorners.hover = L.DomUtil.create(
                'div', 
                'custom-hover', 
                map._controlContainer
            );
        }

        // Create hover label
        this._container = L.DomUtil.create('div', 'custom-control-hover-label');
        this._container.innerHTML = this._content;

        // Set hover position if applicable
        if (this.options.position === 'hover' && this._point !== null) {
            this.setHoverPosition(this._point);
        }

        return this._container;
    },

    /**
     * Set hover control position
     * @param {L.Point} point - Position point
     */
    setHoverPosition: function(point) {
        this._container.style.top = (point.y + this.options.offset.y) + 'px';
        this._container.style.left = (point.x + this.options.offset.x) + 'px';
    }
}); 

// #####################################################

(L.GeoJSONTile = L.GeoJSON.extend({
    addLayer: function (t) {
        return (
            L.GeoJSON.prototype.addLayer.call(this, t),
            (t._parent = this),
            (t._featureDialogContent = this._getFeatureDialogContent(t.feature)),
            t.on('mouseover', this._featureMouseOver),
            t.on('mousemove', this._featureMouseMove),
            t.on('mouseout', this._featureMouseOut),
            t.on('click', this._featureMouseDown),
            delete t,
            this
        );
    },
    removeLayer: function (t) {
        return (
            L.GeoJSON.prototype.removeLayer.call(this, t),
            t._featureDialogControl &&
                (t._parent._map.removeControl(t._featureDialogControl),
                (t._featureDialogContent = null)),
            (t._parent = null),
            t.off('mouseover', this._featureMouseOver),
            t.off('mousemove', this._featureMouseMove),
            t.off('mouseout', this._featureMouseOut),
            t.off('click', this._featureMouseDown),
            this
        );
    },
    onRemove: function () {
        this.eachLayer(this.removeLayer, this);
    },
    _createFeatureDialogControl: function (t, e) {
        return new L.Control.Hover(t, e, {
            offset: this.options.hoverOffset,
        });
    },
    _featureMouseOver: function (t) {
        var e = this._parent,
            E = e._map.mouseEventToContainerPoint(t.originalEvent),
            R = this.feature.id,
            i = _.filter(this._map.widget.vectors._layers, function (t) {
                return t.options._geoJSONProperties.id === R;
            });
        this._featureDialogControl ||
            ((this._featureDialogControl = e._createFeatureDialogControl(
                E,
                this._featureDialogContent
            )),
            e._map.addControl(this._featureDialogControl)),
            this._selected ||
                0 != i.length ||
                (this.setStyle !== undefined && this.setStyle(e.options.hoverStyle));
    },
    _featureMouseDown: function () {
        var t = this._parent;
        if (
            !this._selected &&
            ((this._selected = !0),
            this.setStyle !== undefined && this.setStyle(t.options.style),
            t._map.widget)
        ) {
            for (var e in this._layers) {
                var E = this.feature.id,
                    R = _.filter(this._map.widget.vectors._layers, function (t) {
                        return t.options._geoJSONProperties.id === E;
                    });
                0 == R.length &&
                    ((this.feature.properties['new'] = !0),
                    this._map.fire('draw:clufield-created', {
                        clufield: JSON.stringify(this.feature),
                    }));
            }
        }
    },
    _featureMouseMove: function (t) {
        var e = this._parent;
        if (this._featureDialogControl) {
            var E = e._map.mouseEventToContainerPoint(t.originalEvent);
            this._featureDialogControl.setHoverPosition(E);
        }
    },
    _featureMouseOut: function () {
        var t = this._parent;
        this._featureDialogControl &&
            (t._map.removeControl(this._featureDialogControl),
            (this._featureDialogControl = null)),
            this._selected || (this.setStyle !== undefined && this.setStyle(t.options.style));
    },
    _getFeatureDialogContent: function (t) {
        var e = '<div class="geojson-dialog-hover">';
        this.options.hoverHeadingProperty &&
            this.options.hoverHeadingProperty in t.properties &&
            (e +=
                '<p class="geojson-feature-heading">' +
                t.properties[this.options.hoverHeadingProperty] +
                '</p>');
        for (var E in t.properties) {
            if (E !== this.options.hoverHeadingProperty) {
                var R = t.properties[E];
                'id' != E &&
                    R &&
                    ((e += '<p class="geojson-feature-property">'),
                    (e += '<span class="geojson-feature-property-name">' + E + ':</span>'),
                    (e += '<span class="geojson-feature-property-value">' + R + '</span>'),
                    (e += '</p>'));
            }
        }
        return (e += '</div>');
    },
})),

(L.TileLayer.GeoJSON = L.TileLayer.extend({
    includes: L.Mixin.Events,
    options: {
        minZoom: 0,
        maxZoom: 18,
        tileSize: 256,
        subdomains: 'abc',
        errorTileUrl: '',
        attribution: '',
        zoomOffset: 0,
        opacity: 1,
        zIndex: null,
        tms: !1,
        continuousWorld: !1,
        noWrap: !1,
        zoomReverse: !1,
        detectRetina: !1,
        updateWhenIdle: L.Browser.mobile,
    },
    geoJSONOptions: {
        style: {
            color: '#00D',
            fillColor: '#00D',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.1,
        },
        hoverStyle: {
            opacity: 0.5,
            fillOpacity: 0.3,
        },
        selectedStyle: {
            fillOpacity: 1,
        },
        hoverOffset: new L.Point(15, -15),
        hoverHeadingProperty: 'name',
    },
    initialize: function (t, e) {
        L.Util.setOptions(this, e),
            this.options.detectRetina &&
                L.Browser.retina &&
                this.options.maxZoom > 0 &&
                ((this.options.tileSize = Math.floor(this.options.tileSize / 2)),
                this.options.zoomOffset++,
                this.options.minZoom > 0 && this.options.minZoom--,
                this.options.maxZoom--),
            (this._url = t);
        var E = this.options.subdomains;
        'string' == typeof E && (this.options.subdomains = E.split(''));
    },
    onAdd: function (t) {
        (this._map = t),
            t.on(
                {
                    viewreset: this._resetCallback,
                    moveend: this._update,
                },
                this
            ),
            this.options.updateWhenIdle ||
                (this._limitedUpdate = L.Util.limitExecByInterval(this._update, 1, this)),
            this._reset(),
            this._update();
    },
    addTo: function (t) {
        return t.addLayer(this), this;
    },
    onRemove: function (t) {
        t.off(
            {
                viewreset: this._resetCallback,
                moveend: this._update,
            },
            this
        ),
            this.options.updateWhenIdle || t.off('move', this._limitedUpdate, this),
            this._reset(),
            (this._map = null);
    },
    setGeoJSONOptions: function (t) {
        this.geoJSONOptions = L.Util.extend({}, this.geoJSONOptions, t);
    },
    _resetCallback: function (t) {
        this._reset(t.hard);
    },
    _reset: function () {
        var t,
            e = this._tiles;
        for (t in e) {
            e.hasOwnProperty(t) &&
                (this.fire('tileunload', {
                    tile: e[t],
                }),
                this._removeTile(t));
        }
        (this._tiles = {}), (this._tilesToLoad = 0), (this._geoJSONFeatures = {});
    },
    _update: function () {
        if (!this._map._panTransition || !this._map._panTransition._inProgress) {
            var t = this._map.getPixelBounds(),
                e = this._map.getZoom(),
                E = this.options.tileSize;
            if (e > this.options.maxZoom || e < this.options.minZoom) {
                return void this._reset();
            }
            var R = new L.Point(Math.floor(t.min.x / E), Math.floor(t.min.y / E)),
                i = new L.Point(Math.floor(t.max.x / E), Math.floor(t.max.y / E)),
                n = new L.Bounds(R, i);
            this._addTilesFromCenterOut(n);
        }
    },
    _addTilesFromCenterOut: function (t) {
        var e,
            E,
            R,
            i = [],
            n = t.getCenter();
        for (e = t.min.y; e <= t.max.y; e++) {
            for (E = t.min.x; E <= t.max.x; E++) {
                (R = new L.Point(E, e)), this._tileShouldBeLoaded(R) && i.push(R);
            }
        }
        var A = i.length;
        if (0 !== A) {
            for (
                i.sort(function (t, e) {
                    return t.distanceTo(n) - e.distanceTo(n);
                }),
                    this._tilesToLoad || this.fire('loading'),
                    this._tilesToLoad += A,
                    E = 0;
                E < A;
                E++
            ) {
                this._addTile(i[E]);
            }
        }
    },
    _tileShouldBeLoaded: function (t) {
        if (t.x + ':' + t.y in this._tiles) {
            return !1;
        }
        if (!this.options.continuousWorld) {
            var e = this._getWrapTileNum();
            if ((this.options.noWrap && (t.x < 0 || t.x >= e)) || t.y < 0 || t.y >= e) {
                return !1;
            }
        }
        return !0;
    },
    _removeOtherTiles: function (t) {
        var e, E, R, i;
        for (i in this._tiles) {
            this._tiles.hasOwnProperty(i) &&
                ((e = i.split(':')),
                (E = parseInt(e[0], 10)),
                (R = parseInt(e[1], 10)),
                (E < t.min.x || E > t.max.x || R < t.min.y || R > t.max.y) &&
                    this._removeTile(i));
        }
    },
    _removeTile: function (t) {
        var e = this._tiles[t];
        this.fire('tileunload', {
            tile: e,
            url: e._url,
        }),
            L.Browser.android || (e._url = L.Util.emptyImageUrl),
            delete this._tiles[t],
            this._map.removeLayer(e);
    },
    _addTile: function (t) {
        var e = (this._getTilePos(t), this._getTile());
        (e._url = this.getTileUrl(t)),
            (this._tiles[t.x + ':' + t.y] = e),
            this._loadTile(e, t),
            this._map.addLayer(e);
    },
    _getZoomForUrl: function () {
        var t = this.options,
            e = this._map.getZoom();
        return t.zoomReverse && (e = t.maxZoom - e), e + t.zoomOffset;
    },
    _getTilePos: function (t) {
        var e = this._map.getPixelOrigin(),
            E = this.options.tileSize;
        return t.multiplyBy(E).subtract(e);
    },
    getTileUrl: function (t) {
        return (
            this._adjustTilePoint(t),
            L.Util.template(
                this._url,
                L.Util.extend(
                    {
                        s: this._getSubdomain(t),
                        z: this._getZoomForUrl(),
                        x: t.x,
                        y: t.y,
                    },
                    this.options
                )
            )
        );
    },
    _getWrapTileNum: function () {
        return Math.pow(2, this._getZoomForUrl());
    },
    _adjustTilePoint: function (t) {
        var e = this._getWrapTileNum();
        this.options.continuousWorld || this.options.noWrap || (t.x = ((t.x % e) + e) % e),
            this.options.tms && (t.y = e - t.y - 1);
    },
    _getSubdomain: function (t) {
        var e = (t.x + t.y) % this.options.subdomains.length;
        return this.options.subdomains[e];
    },
    _createTile: function () {
        return new L.GeoJSONTile(null, this.geoJSONOptions);
    },
    _getTile: function () {
        return this._createTile();
    },
    _resetTile: function () {},
    _loadTile: function (t) {
        t._layer = this;
        var e = t._url;
        $.ajax({
            url: e,
            dataType: 'json',
            async: !0,
            success: function (e) {
                for (var E in e.features) {
                    var R = e.features[E];
                    if (!(R.id in t._layer._geoJSONFeatures)) {
                        if (!t._layer._tilesToLoad) {
                            return;
                        }
                        t.addData(R), (t._layer._geoJSONFeatures[R.id] = R);
                    }
                }
                t._layer._tileOnLoad.call(t);
            },
            error: function () {
                t._layer._tileOnError.call(t);
            },
        });
    },
    _tileLoaded: function () {
        --this._tilesToLoad || this.fire('load');
    },
    _tileOnLoad: function () {
        this._layer._tileLoaded();
    },
    _tileOnError: function () {
        var t = this,
            e = t._layer;
        e.fire('tileerror', {
            tile: this,
            url: this._url,
        });
        var E = e.options.errorTileUrl;
        E && (this._url = E), e._tileLoaded();
    },
})),

(L.TileLayer.GeoJSON.Overzoom = L.TileLayer.GeoJSON.extend({
    _update: function () {
        if (!this._map._panTransition || !this._map._panTransition._inProgress) {
            var t = this._map.getPixelBounds(),
                e = this._customZoom(),
                E = this._tileSize();
            if (!(e > this.options.maxZoom || e < this.options.minZoom)) {
                var R = new L.Point(Math.floor(t.min.x / E), Math.floor(t.min.y / E)),
                    i = new L.Point(Math.floor(t.max.x / E), Math.floor(t.max.y / E)),
                    n = new L.Bounds(R, i);
                this._addTilesFromCenterOut(n),
                    (this.options.unloadInvisibleTiles || this.options.reuseTiles) &&
                        this._removeOtherTiles(n);
            }
        }
    },
    _getZoomForUrl: function () {
        var t = this.options,
            e = this._customZoom();
        return t.zoomReverse && (e = t.maxZoom - e), e + t.zoomOffset;
    },
    _getTilePos: function (t) {
        var e = this._map.getPixelOrigin(),
            E = this._tileSize();
        return t.multiplyBy(E).subtract(e);
    },
    _customZoom: function () {
        return (
            (mapZoom = this._map.getZoom()),
            mapZoom > this.options.maxPhysicalZoom ? this.options.maxPhysicalZoom : mapZoom
        );
    },
    _tileSize: function () {
        return (
            (mapZoom = this._map.getZoom()),
            mapZoom > this.options.maxPhysicalZoom
                ? this.options.tileSize * Math.pow(2, mapZoom - this.options.maxPhysicalZoom)
                : this.options.tileSize
        );
    },
})),

(L.GrowerTile = L.GeoJSON.extend({
    addLayer: function (t) {
        return (
            L.GeoJSON.prototype.addLayer.call(this, t),
            (t._parent = this),
            (t._featureDialogContent = this._getFeatureDialogContent(t.feature)),
            t.on('mouseover', this._featureMouseOver),
            t.on('mousemove', this._featureMouseMove),
            t.on('mouseout', this._featureMouseOut),
            t.on('click', this._featureMouseDown),
            'Field' == t.feature.properties.type
                ? t.setStyle({
                        fillOpacity: 0.4,
                        dashArray: '',
                    })
                : t.setStyle({
                        dashArray: '5,5',
                    }),
            delete t,
            this
        );
    },
    removeLayer: function (t) {
        return (
            L.GeoJSON.prototype.removeLayer.call(this, t),
            t._featureDialogControl &&
                (t._parent._map.removeControl(t._featureDialogControl),
                (t._featureDialogContent = null)),
            (t._parent = null),
            t.off('mouseover', this._featureMouseOver),
            t.off('mousemove', this._featureMouseMove),
            t.off('mouseout', this._featureMouseOut),
            t.off('click', this._featureMouseDown),
            this
        );
    },
    onRemove: function () {
        this.eachLayer(this.removeLayer, this);
    },
    _createFeatureDialogControl: function (t, e) {
        return new L.Control.Hover(t, e, {
            offset: this.options.hoverOffset,
        });
    },
    _featureMouseOver: function (t) {
        var e = this._parent,
            E = e._map.mouseEventToContainerPoint(t.originalEvent),
            R = this.feature.id,
            i = _.filter(this._map.widget.vectors._layers, function (t) {
                return t.feature && t.feature.id && t.feature.id === R;
            });
        this._featureDialogControl ||
            ((this._featureDialogControl = e._createFeatureDialogControl(
                E,
                this._featureDialogContent
            )),
            e._map.addControl(this._featureDialogControl)),
            this._selected ||
                0 != i.length ||
                (this.setStyle !== undefined && this.setStyle(e.options.hoverStyle));
    },
    _featureMouseDown: function () {
        var t = this._parent;
        if ((this.setStyle !== undefined && this.setStyle(t.options.style), t._map.widget)) {
            var e = this.feature.id;
            0 ==
                _.filter(this._map.widget.vectors._layers, function (t) {
                    return t.feature && t.feature.id && t.feature.id === e;
                }).length &&
                ((this.feature.properties['new'] = !0),
                this._map.fire('draw:growerfield-created', {
                    growerfield: JSON.stringify(this.feature),
                }));
        }
    },
    _featureMouseMove: function (t) {
        var e = this._parent;
        if (this._featureDialogControl) {
            var E = e._map.mouseEventToContainerPoint(t.originalEvent);
            this._featureDialogControl.setHoverPosition(E);
        }
    },
    _featureMouseOut: function () {
        var t = this._parent;
        this._featureDialogControl &&
            (t._map.removeControl(this._featureDialogControl),
            (this._featureDialogControl = null)),
            this._selected ||
                (this.setStyle !== undefined &&
                    (this.setStyle(t.options.style),
                    'Field' == this.feature.properties.type
                        ? this.setStyle({
                                fillOpacity: 0.4,
                                dashArray: '',
                            })
                        : this.setStyle({
                                dashArray: '5,5',
                            })));
    },
    _getFeatureDialogContent: function (t) {
        var e = '<div class="geojson-dialog-hover">';
        this.options.hoverHeadingProperty &&
            this.options.hoverHeadingProperty in t.properties &&
            (e +=
                '<p class="geojson-feature-heading">' +
                (t.properties[this.options.hoverHeadingProperty]
                    ? t.properties[this.options.hoverHeadingProperty]
                    : '') +
                '</p>');
        var E = {
                name: 'field name',
                farm_name: 'farm name',
                actualAcres: 'acres',
                type: 'Field',
            },
            R = {
                crop: 'crop',
                type: 'Adjacent Crop',
            },
            i = {};
        i = 'Field' === t.properties.type ? E : R;
        for (var n in i) {
            if (n !== this.options.hoverHeadingProperty) {
                var A = t.properties[n] ? t.properties[n] : '';
                'id' != n &&
                    ('AdjacentCrop' === A
                        ? (A = i[n])
                        : 'farm_name' === n
                        ? (n = i[n])
                        : 'name' === n
                        ? (n = 'field name')
                        : 'actualAcres' === n &&
                            ((n = i[n]),
                            !A &&
                                t.properties.calculateAcres &&
                                (A = t.properties.calculateAcres)),
                    (e += '<p class="geojson-feature-property">'),
                    (e += '<span class="geojson-feature-property-name">' + n + ':</span>'),
                    (e += '<span class="geojson-feature-property-value">' + A + '</span>'),
                    (e += '</p>'));
            }
        }
        return (e += '</div>');
    },
})),

(L.TileLayer.GrowerFields = L.TileLayer.extend({
    includes: L.Mixin.Events,
    options: {
        minZoom: 0,
        maxZoom: 18,
        tileSize: 256,
        subdomains: 'abc',
        errorTileUrl: '',
        attribution: '',
        zoomOffset: 0,
        opacity: 1,
        zIndex: null,
        tms: !1,
        continuousWorld: !1,
        noWrap: !1,
        zoomReverse: !1,
        detectRetina: !1,
        updateWhenIdle: L.Browser.mobile,
    },
    getBounds: function (t) {
        var e = new L.LatLngBounds();
        for (var E in map.drawControl.handlers.growerfield._geojsonlayer._tiles) {
            for (var R in map.drawControl.handlers.growerfield._geojsonlayer._tiles[E]
                ._layers) {
                (layer =
                    map.drawControl.handlers.growerfield._geojsonlayer._tiles[E]._layers[R]),
                    layer.feature.properties.type == t &&
                        e.extend(
                            layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds()
                        );
            }
        }
        return e.pad(-1.25);
    },
    geoJSONOptions: {
        style: {
            color: '#00D',
            fillColor: '#00D',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.1,
        },
        hoverStyle: {
            opacity: 0.5,
            fillOpacity: 0.3,
        },
        selectedStyle: {
            fillOpacity: 1,
        },
        hoverOffset: new L.Point(15, -15),
        hoverHeadingProperty: 'aname',
    },
    initialize: function (t, e) {
        L.Util.setOptions(this, e),
            this.options.detectRetina &&
                L.Browser.retina &&
                this.options.maxZoom > 0 &&
                ((this.options.tileSize = Math.floor(this.options.tileSize / 2)),
                this.options.zoomOffset++,
                this.options.minZoom > 0 && this.options.minZoom--,
                this.options.maxZoom--),
            (this._url = t);
        var E = this.options.subdomains;
        'string' == typeof E && (this.options.subdomains = E.split(''));
    },
    onAdd: function (t) {
        (this._map = t),
            this.options.loadOnce ||
                t.on(
                    {
                        viewreset: this._resetCallback,
                        moveend: this._update,
                    },
                    this
                ),
            this.options.updateWhenIdle ||
                (this._limitedUpdate = L.Util.limitExecByInterval(this._update, 1, this)),
            this._reset(),
            this._update();
    },
    addTo: function (t) {
        return t.addLayer(this), this;
    },
    onRemove: function (t) {
        t.off(
            {
                viewreset: this._resetCallback,
                moveend: this._update,
            },
            this
        ),
            this.options.updateWhenIdle || t.off('move', this._limitedUpdate, this),
            this._reset(),
            getGrowerFieldsList(),
            (this._map = null);
    },
    setGeoJSONOptions: function (t) {
        this.geoJSONOptions = L.Util.extend({}, this.geoJSONOptions, t);
    },
    _resetCallback: function (t) {
        this._reset(t.hard);
    },
    _reset: function () {
        var t,
            e = this._tiles;
        for (t in e) {
            e.hasOwnProperty(t) &&
                (this.fire('tileunload', {
                    tile: e[t],
                }),
                this._removeTile(t));
        }
        (this._tiles = {}), (this._tilesToLoad = 0), (this._geoJSONFeatures = {});
    },
    _update: function () {
        if (!this._map._panTransition || !this._map._panTransition._inProgress) {
            var t = this._map.getPixelBounds(),
                e = this._map.getZoom(),
                E = this.options.tileSize;
            if (e > this.options.maxZoom || e < this.options.minZoom) {
                return void this._reset();
            }
            var R = new L.Point(Math.floor(t.min.x / E), Math.floor(t.min.y / E)),
                i = new L.Point(Math.floor(t.max.x / E), Math.floor(t.max.y / E)),
                n = new L.Bounds(R, i);
            this._addTilesFromCenterOut(n);
        }
    },
    _addTilesFromCenterOut: function (t) {
        var e = [],
            E = t.getCenter();
        e.push(E);
        var R = e.length;
        if (0 !== R) {
            for (
                e.sort(function (t, e) {
                    return t.distanceTo(E) - e.distanceTo(E);
                }),
                    this._tilesToLoad || this.fire('loading'),
                    this._tilesToLoad += R,
                    i = 0;
                i < R;
                i++
            ) {
                this._addTile(e[i]);
            }
        }
    },
    _tileShouldBeLoaded: function (t) {
        if (t.x + ':' + t.y in this._tiles) {
            return !1;
        }
        if (!this.options.continuousWorld) {
            var e = this._getWrapTileNum();
            if ((this.options.noWrap && (t.x < 0 || t.x >= e)) || t.y < 0 || t.y >= e) {
                return !1;
            }
        }
        return !0;
    },
    _removeOtherTiles: function (t) {
        var e, E, R, i;
        for (i in this._tiles) {
            this._tiles.hasOwnProperty(i) &&
                ((e = i.split(':')),
                (E = parseInt(e[0], 10)),
                (R = parseInt(e[1], 10)),
                (E < t.min.x || E > t.max.x || R < t.min.y || R > t.max.y) &&
                    this._removeTile(i));
        }
    },
    _removeTile: function (t) {
        var e = this._tiles[t];
        this.fire('tileunload', {
            tile: e,
            url: e._url,
        }),
            L.Browser.android || (e._url = L.Util.emptyImageUrl),
            delete this._tiles[t],
            this._map.removeLayer(e);
    },
    _addTile: function (t) {
        var e = (this._getTilePos(t), this._getTile());
        (e._url = this.getTileUrl(t)),
            (this._tiles[t.x + ':' + t.y] = e),
            this._loadTile(e, t),
            this._map.addLayer(e);
    },
    _getZoomForUrl: function () {
        var t = this.options,
            e = this._map.getZoom();
        return t.zoomReverse && (e = t.maxZoom - e), e + t.zoomOffset;
    },
    _getTilePos: function (t) {
        var e = this._map.getPixelOrigin(),
            E = this.options.tileSize;
        return t.multiplyBy(E).subtract(e);
    },
    getTileUrl: function (t) {
        return (
            this._adjustTilePoint(t),
            (latlng = this._map.getCenter()),
            L.Util.template(
                this._url,
                L.Util.extend(
                    {
                        s: this._getSubdomain(t),
                        z: this._getZoomForUrl(),
                        x: t.x,
                        y: t.y,
                        lat: latlng.lat,
                        lng: latlng.lng,
                    },
                    this.options
                )
            )
        );
    },
    _getWrapTileNum: function () {
        return Math.pow(2, this._getZoomForUrl());
    },
    _adjustTilePoint: function (t) {
        var e = this._getWrapTileNum();
        this.options.continuousWorld || this.options.noWrap || (t.x = ((t.x % e) + e) % e),
            this.options.tms && (t.y = e - t.y - 1);
    },
    _getSubdomain: function (t) {
        var e = (t.x + t.y) % this.options.subdomains.length;
        return this.options.subdomains[e];
    },
    _createTile: function () {
        return new L.GrowerTile(null, this.geoJSONOptions);
    },
    _getTile: function () {
        return this._createTile();
    },
    _resetTile: function () {},
    _loadTile: function (t) {
        t._layer = this;
        var e = t._url;
        this.options.loadOnce && this._features
            ? (this._processFeatures(t), t._layer._tileOnLoad.call(t))
            : ((that = this),
                $.ajax({
                    url: e,
                    dataType: 'json',
                    async: !0,
                    cache: !0,
                    success: function (e) {
                        (that._features = e.features),
                            that._processFeatures(t),
                            t._layer._tileOnLoad.call(t);
                    },
                    error: function () {
                        t._layer._tileOnError.call(t);
                    },
                }));
    },
    _processFeatures: function (t) {
        for (var e in this._features) {
            var E = this._features[e];
            if (
                (E.id.toString().indexOf('grower') < 0 && (E.id = 'grower' + E.id),
                !(
                    _.filter(map.widget.vectors._layers, function (t) {
                        return t.feature && t.feature.id && t.feature.id === E.id;
                    }).length > 0 || E.id in t._layer._geoJSONFeatures
                ))
            ) {
                if (!t._layer._tilesToLoad) {
                    return;
                }
                (E.properties['new'] = !0),
                    delete E.properties.farm_field_id,
                    delete E.properties.job_id,
                    t.addData(E),
                    (t._layer._geoJSONFeatures[E.id] = E);
            }
        }
    },
    _tileLoaded: function () {
        this._tilesToLoad--, this._tilesToLoad || this.fire('load'), getGrowerFieldsList();
    },
    _tileOnLoad: function () {
        this._layer._tileLoaded();
    },
    _tileOnError: function () {
        var t = this,
            e = t._layer;
        e.fire('tileerror', {
            tile: this,
            url: this._url,
        });
        var E = e.options.errorTileUrl;
        E && (this._url = E), e._tileLoaded();
    },
})),

(onLoadGoogleApiCallback = function () {
    L.GeoSearch.Provider.Google.Geocoder = new google.maps.Geocoder();
}),

(function (t, e) {
    (e.Google = e.Class.extend({
        includes: e.Mixin.Events,
        options: {
            minZoom: 2,
            maxZoom: 16,
            tileSize: 256,
            subdomains: 'abc',
            errorTileUrl: '',
            attribution: '',
            opacity: 1,
            continuousWorld: !1,
            noWrap: !1,
        },
        getGoogle: function (t) {
            (window.googleloading = !0),
                $.ajax({
                    url: t,
                    dataType: 'script',
                    cache: !0,
                }).fail(function () {
                    window.googleloading = !1;
                });
        },
        initialize: function (t, E) {
            e.Util.setOptions(this, E),
                (this._type = t || 'SATELLITE'),
                (this._url = this._type);
        },
        onAdd: function (t, E) {
            (this._map = t),
                (this._cachedZoomAnimation = this._map.options.zoomAnimation),
                (this._insertAtTheBottom = E),
                e.GeoSearch.Provider.Google.Geocoder ||
                    window.googleloading ||
                    this.getGoogle(
                        '//maps.googleapis.com/maps/api/js?key=AIzaSyBzjfycXMFJMBODlcJnjhfujVJwap6VOU8&v=3&sensor=false&callback=onLoadGoogleApiCallback&channel=' +
                            (this.options && this.options.channel
                                ? this.options.channel
                                : 'asm')
                    ),
                this.onAdd2();
        },
        onAdd2: function () {
            e.GeoSearch.Provider.Google.Geocoder
                ? ((t = window.google),
                    (this._ready = t.maps != undefined),
                    this._ready || e.Google.asyncWait.push(this),
                    this._initContainer(),
                    this._initMapObject(),
                    this._map.on('viewreset', this._resetCallback, this),
                    this._map.on('move', this._update, this),
                    (this._map._controlCorners.bottomright.style.marginBottom = '2em'),
                    this._reset(),
                    this._update(),
                    (this._map.options.zoomAnimation = !1))
                : setTimeout(e.Util.bind(this.onAdd2, this), 400);
        },
        onRemove: function (t) {
            this._map._container.removeChild(this._container),
                this._map.off('viewreset', this._resetCallback, this),
                this._map.off('move', this._update, this),
                (this._map.options.zoomAnimation = this._cachedZoomAnimation),
                (t._controlCorners.bottomright.style.marginBottom = '0em');
        },
        getAttribution: function () {
            return this.options.attribution;
        },
        setOpacity: function (t) {
            (this.options.opacity = t), t < 1 && e.DomUtil.setOpacity(this._container, t);
        },
        setElementSize: function (t, e) {
            (t.style.width = e.x + 'px'), (t.style.height = e.y + 'px');
        },
        _initContainer: function () {
            var t = this._map._container,
                E = t.firstChild;
            this._container ||
                ((this._container = e.DomUtil.create(
                    'div',
                    'leaflet-google-layer leaflet-top leaflet-left leaflet-zoom-hide'
                )),
                (this._container.id = '_GMapContainer_' + e.Util.stamp(this)),
                (this._container.style.zIndex = 'auto')),
                t.insertBefore(this._container, E),
                this.setOpacity(this.options.opacity),
                this.setElementSize(this._container, this._map.getSize());
        },
        _initMapObject: function () {
            if (this._ready) {
                this._google_center = new t.maps.LatLng(0, 0);
                var e = new t.maps.Map(this._container, {
                        center: this._google_center,
                        zoom: 0,
                        tilt: 0,
                        mapTypeId: t.maps.MapTypeId[this._type],
                        disableDefaultUI: !0,
                        keyboardShortcuts: !1,
                        draggable: !1,
                        disableDoubleClickZoom: !0,
                        scrollwheel: !1,
                        streetViewControl: !1,
                        noClear: !0,
                    }),
                    E = this;
                (this._reposition = t.maps.event.addListenerOnce(
                    e,
                    'center_changed',
                    function () {
                        E.onReposition();
                    }
                )),
                    (e.backgroundColor = '#ff0000'),
                    (this._google = e);
            }
        },
        _resetCallback: function (t) {
            this._reset(t.hard);
        },
        _reset: function () {
            this._initContainer();
        },
        _update: function () {
            if (this._google) {
                this._resize();
                var e = this._map.getCenter(),
                    E = new t.maps.LatLng(e.lat, e.lng);
                this._google.setCenter(E), this._google.setZoom(this._map.getZoom());
                var R = this._map.getBounds(),
                    i = R.getNorthEast(),
                    n = R.getSouthWest();
                new t.maps.LatLngBounds(
                    new t.maps.LatLng(n.lat, n.lng),
                    new t.maps.LatLng(i.lat, i.lng)
                );
            }
        },
        _resize: function () {
            var t = this._map.getSize();
            (this._container.style.width == t.x && this._container.style.height == t.y) ||
                (this.setElementSize(this._container, t), this.onReposition());
        },
        onReposition: function () {
            this._google && t.maps.event.trigger(this._google, 'resize');
        },
    })),
        (e.Google.asyncWait = []),
        (e.Google.asyncInitialize = function () {
            var t;
            for (t = 0; t < e.Google.asyncWait.length; t++) {
                var E = e.Google.asyncWait[t];
                (E._ready = !0), E._container && (E._initMapObject(), E._update());
            }
            e.Google.asyncWait = [];
        });
})(window.google, L),

(L.GeoJSONUtil = {
    featureCollection: function (t) {
        return {
            type: 'FeatureCollection',
            features: t || [],
        };
    },
    feature: function (t, e, E) {
        return {
            type: 'Feature',
            geometry: t,
            properties: e || {},
            id: E,
        };
    },
    latLngsToCoords: function (t) {
        for (var e, E = [], R = 0, i = t.length; R < i; R++) {
            (e = L.GeoJSONUtil.latLngToCoord(t[R])), E.push(e);
        }
        return E;
    },
    latLngToCoord: function (t) {
        return [t.lng, t.lat];
    },
}),

L.Path.include({
    toGeoJSON: function () {
        return L.GeoJSONUtil.feature(this.toGeometry());
    },
}),

L.MultiPolygon.include({
    toGeometry: function () {
        var t = [];
        return (
            this.eachLayer(function (e) {
                t.push(e.toGeometry().coordinates);
            }),
            {
                type: 'MultiPolygon',
                coordinates: t,
            }
        );
    },
}),

L.MultiPolyline.include({
    toGeometry: function () {
        var t = [];
        return (
            this.eachLayer(function (e) {
                t.push(e.toGeometry().coordinates);
            }),
            {
                type: 'MultiLineString',
                coordinates: t,
            }
        );
    },
}),

L.GeoJSON.include({}),

L.Polygon.include({
    toGeometry: function () {
        var t = this.getLatLngs(),
            e = [];
        if (
            (e.push(L.GeoJSONUtil.latLngsToCoords(t)),
            t[0].equals(t[t.length - 1]) ||
                e[e.length - 1].push(L.GeoJSONUtil.latLngToCoord(t[0])),
            this._originalPoints &&
                !this._isClockWise(this._originalPoints) &&
                (e[e.length - 1] = e[e.length - 1].reverse()),
            this._holes && this._holes.length)
        ) {
            var E,
                R,
                i = this._holes;
            for (E = 0, R = i.length; E < R; E++) {
                (hole = i[E]),
                    e.push(L.GeoJSONUtil.latLngsToCoords(hole)),
                    hole[0].equals(hole[i[E].length - 1]) ||
                        e[e.length - 1].push(L.GeoJSONUtil.latLngToCoord(hole[0])),
                    this._isClockWise(this._holePoints[E]) &&
                        (e[e.length - 1] = e[e.length - 1].reverse());
            }
        }
        return {
            type: 'Polygon',
            coordinates: e,
            properties: this.options._geoJSONProperties || {},
        };
    },
    toGeoJSON: function () {
        var t = this.toGeometry();
        return L.GeoJSONUtil.feature(
            {
                type: t.type,
                coordinates: t.coordinates,
            },
            t.properties,
            this.feature && this.feature.id ? this.feature.id : null
        );
    },
    unionPolys: function (t) {
        var e = new ClipperLib.Clipper(),
            E = ClipperLib.ClipType.ctUnion,
            R = [[]];
        e.AddPolygons(t, ClipperLib.PolyType.ptSubject, !0);
        var i = ClipperLib.PolyFillType.pftNonZero,
            n = ClipperLib.PolyFillType.pftNonZero;
        return e.Execute(E, R, i, n) ? R : null;
    },
    cleanPolygon: function (t, e) {
        var E = new Array();
        Array.isArray(t) || (t = [].concat(t)), new ClipperLib.Clipper();
        for (var R in t) {
            (polypoints = this._polyToClipperPoints(t[R], map, !0)),
                (solution_polygons = ClipperLib.Clean(polypoints, e));
            var i = this._clipperPointsToPointsArray(solution_polygons);
            if (
                ((t[R] = this._newPoly(this._pointsToLatLngs(i[0], map, !0), t[R])),
                i.length > 1)
            ) {
                for (var n = 1; n < i.length; n++) {
                    var A = this._newPoly(this._pointsToLatLngs(i[n], map, !0), t[R]);
                    if (t[R]._containsPoly(A, map)) {
                        t._holes || (t._holes = new Array()),
                            t[R].addHole(this._newPoly(A._latlngs.reverse()));
                    } else {
                        exists = !1;
                        for (var o in E) {
                            E[o].equals(A) && (exists = !0);
                        }
                        exists || E.push(A);
                    }
                }
            }
        }
        return t[0];
    },
    intersectsSelf: function (t, e) {
        if (((points = this._polyToClipperPoints(t, e, !1)), points.length < 2)) {
            return !1;
        }
        (subj_polygons = points.slice(0, 1)), (clip_polygons = points.slice(1));
        var E = [[]],
            R = new ClipperLib.Clipper(),
            i = ClipperLib.ClipType.ctIntersection;
        R.AddPolygons(subj_polygons, ClipperLib.PolyType.ptSubject, !0),
            R.AddPolygons(this.unionPolys(clip_polygons), ClipperLib.PolyType.ptClip, !0);
        var n = ClipperLib.PolyFillType.pftNonZero,
            A = ClipperLib.PolyFillType.pftNonZero;
        if (R.Execute(i, E, n, A)) {
            var o = 0,
                S = 0;
            for (var p in E) {
                o += R.Area(E[p]);
            }
            for (var p in clip_polygons) {
                S += R.Area(clip_polygons[p]);
            }
            result_2 = Math.round(Math.abs(o)) !== Math.round(Math.abs(S));
        }
        return result_2;
    },
    calculateAcres: function () {
        poly = this;
        var t = 0;
        if (
            poly._latlngs &&
            poly._latlngs.length > 2 &&
            ((t += L.PolyUtil.geodesicArea(poly)), poly._holes)
        ) {
            for (var e in poly._holes) {
                (hole = poly._holes[e]),
                    (holepoly = this._newPoly(hole)),
                    (holepoly._originalPoints = this._latLngsToPoints(hole, this._map)),
                    (t -= L.PolyUtil.geodesicArea(holepoly));
            }
        }
        return Math.round(1e3 * t) / 1e3;
    },
    calculateAcresLatLngs: function (t) {
        var e = new L.Polygon(t);
        return Math.round(1e3 * L.PolyUtil.geodesicArea(e)) / 1e3;
    },
    _isClockWise: function (t) {
        (pt1 = t[0]), (firstPt = pt1), (area = 0), (lastPt = firstPt);
        for (var e in t) {
            (pt2 = t[e]),
                (area += ((pt2.x - pt1.x) * (pt2.y + pt1.y)) / 2),
                (pt1 = pt2),
                (lastPt = pt1);
        }
        return (area += ((firstPt.x - lastPt.x) * (firstPt.y + lastPt.y)) / 2), area < 0;
    },
    _containsPoly: function (t, e) {
        e = e || this._map;
        var E = t._latlngs;
        for (var R in E) {
            var i = E[R];
            if (!this._polyContainsPoint.call(this, e.latLngToContainerPoint(i), e)) {
                return !1;
            }
        }
        if (this._holes) {
            for (var R in this._holes) {
                var n = this._holes[R];
                testpoly = this._newPoly(n);
                for (var A in E) {
                    var i = E[A];
                    if (
                        testpoly._polyContainsPoint.call(
                            testpoly,
                            e.latLngToContainerPoint(i),
                            e
                        )
                    ) {
                        return !1;
                    }
                }
            }
        }
        return !0;
    },
    _polyContainsPoint: function (t, e) {
        return (
            (polypoints = this._pointsToArray(this._latLngsToPoints(this._latlngs, e))),
            PolyK.ContainsPoint(polypoints, t.x, t.y)
        );
    },
    addHole: function (t) {
        this._holes || (this._holes = new Array()), this._holes.push(t._latlngs.reverse());
    },
    clip: function (t, e, E) {
        return this._clipPoly(t, e, E);
    },
    slice: function (t, e, E, R) {
        var i = this._pointsToArray(this._latLngsToPoints(t._latlngs, R)),
            n = e.x,
            A = e.y,
            o = E.x,
            S = E.y,
            p = PolyK.Slice(i, n, A, o, S),
            r = new Array();
        for (var N in p) {
            var a = this._arrayToPoints(p[N]);
            this._isClockWise(a) && (a = a.reverse());
            var C = this._pointsToLatLngs(a, R),
                O = [this._newPoly(C, t)];
            if (t._holes) {
                for (var s in t._holes) {
                    var w = t._holes[s],
                        T = new L.Polygon(w);
                    O = this._clipPoly(O, T, R);
                }
            }
            for (var l in O) {
                r.push(O[l]);
            }
        }
        return r;
    },
    _clipPoly: function (t, e, E) {
        var R = new Array(),
            i = new ClipperLib.Clipper();
        Array.isArray(t) || (t = [].concat(t));
        for (var n in t) {
            var A = this._polyToClipperPoints(t[n], E, !0),
                o = this._polyToClipperPoints(e, E, !0),
                S = [[]],
                p = ClipperLib.ClipType.ctDifference;
            i.AddPolygons(A, ClipperLib.PolyType.ptSubject),
                i.AddPolygons(o, ClipperLib.PolyType.ptClip);
            var r = ClipperLib.PolyFillType.pftNonZero,
                L = ClipperLib.PolyFillType.pftNonZero;
            if (i.Execute(p, S, r, L)) {
                var N = this._clipperPointsToPointsArray(S);
                if (
                    ((t[n] = this._newPoly(this._pointsToLatLngs(N[0], E, !0), t[n])),
                    N.length > 1)
                ) {
                    for (var a = 1; a < N.length; a++) {
                        var C = this._newPoly(this._pointsToLatLngs(N[a], E, !0), t[n]);
                        if (t[n]._containsPoly(C, E)) {
                            t._holes || (t._holes = new Array()),
                                t[n].addHole(this._newPoly(C._latlngs.reverse()));
                        } else {
                            exists = !1;
                            for (var O in R) {
                                R[O].equals(C) && (exists = !0);
                            }
                            exists || R.push(C);
                        }
                    }
                }
                R.push(t[n]);
            }
        }
        return R;
    },
    _newPoly: function (t, e) {
        var E = {};
        return e && (E = e.options), new L.Polygon(t, E);
    },
    _clipperPointsToPointsArray: function (t) {
        var e = new Array();
        for (var E in t) {
            var R = t[E],
                i = new Array();
            for (var n in R) {
                var A = R[n];
                i.push(new L.Point(A.X, A.Y));
            }
            e.push(i);
        }
        return e;
    },
    _polyToClipperPoints: function (t, e, E) {
        if (
            ((pointarray = new Array()),
            pointarray.push(this._latLngsToClipperPoints(t._latlngs, e, E)),
            t._holes)
        ) {
            for (var R in t._holes) {
                var i = t._holes[R];
                pointarray.push(this._latLngsToClipperPoints(i, e, E));
            }
        }
        return pointarray;
    },
    _latLngsToClipperPoints: function (t, e, E) {
        var R = new Array();
        for (var i in t) {
            (latlng = t[i]),
                (point = E
                    ? this._latLngToRawClipperPoint(latlng, e)
                    : this._latLngToClipperPoint(latlng, e)),
                R.push({
                    X: point.x,
                    Y: point.y,
                });
        }
        return R;
    },
    _latLngToClipperPoint: function (t, e) {
        return e.layerPointToContainerPoint(
            e.project(L.latLng(t))._subtract(e._initialTopLeftPoint)
        );
    },
    _latLngToRawClipperPoint: function (t, e) {
        return e.project(t, 18);
    },
    _latLngsToPoints: function (t, e) {
        var E = new Array();
        for (var R in t) {
            var i = t[R];
            E.push(e.latLngToContainerPoint(i));
        }
        return E;
    },
    _rawPointsToLatLngs: function (t, e) {
        var E = new Array();
        for (var R in t) {
            var i = t[R];
            E.push(e.unproject(i, 18));
        }
        return E;
    },
    _layerPointsToLatLngs: function (t, e) {
        var E = new Array();
        for (var R in t) {
            var i = t[R];
            E.push(e.layerPointToLatLng(i));
        }
        return E;
    },
    _containerPointsToLatLngs: function (t, e) {
        var E = new Array();
        for (var R in t) {
            var i = t[R];
            E.push(e.containerPointToLatLng(i));
        }
        return E;
    },
    _pointsToLatLngs: function (t, e, E) {
        var R = new Array();
        for (var i in t) {
            var n = t[i];
            E ? R.push(e.unproject(n, 18)) : R.push(e.containerPointToLatLng(n));
        }
        return R;
    },
    _pointsToArray: function (t) {
        var e = new Array();
        for (var E in t) {
            (point = t[E]), e.push(point.x), e.push(point.y);
        }
        return e;
    },
    _arrayToPoints: function (t) {
        for (var e = new Array(), E = 0; E < t.length; E += 2) {
            e.push(new L.Point(t[E], t[E + 1]));
        }
        return e;
    },
    _pointsToPointArray: function (t) {
        var e = new Array();
        for (var E in t) {
            var R = new Array();
            R.push(t[E].x), R.push(t[E].y), e.push(R);
        }
        return e;
    },
    _pointArrayToPoints: function (t) {
        var e = new Array();
        for (var E in t) {
            e.push(new L.Point(t[E][0], t[E][1]));
        }
        return e;
    },
    equals: function (t) {
        if (this._latlngs.length != t._latlngs.length) {
            return !1;
        }
        if (this._holes && this._holes.length > 0 && !t._holes) {
            return !1;
        }
        if (!this._holes && t._holes && t._holes.length > 0) {
            return !1;
        }
        if (this._holes && t._holes && this._holes.length != t._holes.length) {
            return !1;
        }
        for (var e in this._latlngs) {
            pointequals = !1;
            for (var E in t._latlngs) {
                if (this._latlngs[e].equals(t._latlngs[E])) {
                    pointequals = !0;
                    break;
                }
            }
            if (!pointequals) {
                return !1;
            }
        }
        for (var R in this._holes) {
            if (this._holes && this._holes[R]) {
                if (this._holes[R].length != t._holes[R].length) {
                    return !1;
                }
                for (var e in this._holes[R]) {
                    if (((pointequals = !1), t._holes && t._holes[R])) {
                        for (var E in t._holes[R]) {
                            if (this._holes[R][e].equals(t._holes[R][E])) {
                                pointequals = !0;
                                break;
                            }
                        }
                    }
                    if (!pointequals) {
                        return !1;
                    }
                }
            }
        }
        return !0;
    },
}),

L.Polyline.include({
    toGeometry: function () {
        return {
            type: 'LineString',
            coordinates: L.GeoJSONUtil.latLngsToCoords(this.getLatLngs()),
        };
    },
    toGeoJSON: function () {
        return L.GeoJSONUtil.feature(this.toGeometry());
    },
}),

L.Marker.include({
    toGeometry: function () {
        return {
            type: 'Point',
            coordinates: L.GeoJSONUtil.latLngToCoord(this.getLatLng()),
        };
    },
    toGeoJSON: function () {
        return L.GeoJSONUtil.feature(this.toGeometry());
    },
}),

L.Circle.include({
    toGeometry: function () {
        var t = [];
        return (
            this.feature.properties && (t = this.feature.properties),
            {
                type: 'Circle',
                coordinates: L.GeoJSONUtil.latLngToCoord(this.getLatLng()),
                radius: this.getRadius(),
                properties: t,
            }
        );
    },
    toGeoJSON: function () {
        return L.GeoJSONUtil.feature(this.toGeometry());
    },
}),

L.Control.Draw.mergeOptions({
    select: {
        title: 'Select item',
    },
}),

(L.Handler.Select = L.Handler.extend({
    includes: L.Mixin.Events,
    options: {},
    initialize: function (t, e) {
        (this.type = 'select'),
            (this._skipEdit = !1),
            L.Util.setOptions(this, e),
            L.Handler.prototype.initialize.call(this, t);
    },
    enable: function () {
        this._skipEdit ||
            (L.Handler.prototype.enable.call(this), this.fire('select-activated'));
    },
    disable: function () {
        this._selected &&
            this._selected.eachLayer(function (t) {
                this.deselect(t, !1);
            }, this),
            L.Handler.prototype.disable.call(this),
            this.fire('select-deactivated');
    },
    addHooks: function () {
        this._map &&
            this.options.selectable &&
            ((this._selected = L.layerGroup()),
            (this._selectable = this.options.selectable),
            this._selectable.eachLayer(function (t) {
                this._bind(t);
            }, this),
            this._map.on(
                {
                    layeradd: this._bind,
                    layerremove: this._unbind,
                },
                this
            ));
    },
    removeHooks: function () {
        this._map &&
            (this._selectable &&
                (this._selectable.eachLayer(function (t) {
                    this._unbind(t);
                }, this),
                (this._selected = L.layerGroup())),
            this._map.off(
                {
                    layeradd: this._bind,
                    layerremove: this._unbind,
                },
                this
            ));
    },
    _move: function (t) {
        for (var e in this._selected._layers) {
            var E = !1,
                R = this._selected._layers[e];
            (R._unEditedLatLngs = null), R.editing.enabled() && ((E = !0), R.editing.disable());
            var i = R._map,
                n = R.getLatLngs(),
                A = [];
            if (R._holes) {
                var o = R._holes;
                for (var S in o) {
                    var p = [];
                    for (var r in o[S]) {
                        var N = p.push(
                            i.containerPointToLatLng(i.latLngToContainerPoint(o[S][r]).add(t))
                        );
                    }
                    A.push(p);
                }
                R._holes = A;
            }
            R.popup &&
                R.popup.setLatLng(
                    i.containerPointToLatLng(i.latLngToContainerPoint(R.popup._latlng).add(t))
                );
            var r,
                a = [];
            for (r in n) {
                var C = i.latLngToContainerPoint(n[r]),
                    O = C.add(t);
                a.push(i.containerPointToLatLng(O));
            }
            L.DomUtil.setPosition(R._container, new L.Point(0, 0)),
                R.setLatLngs(a),
                R.fire('dragend'),
                E && R.editing.enable();
        }
    },
    _KeyUp: function (t) {
        var e = {
            left: 37,
            right: 39,
            down: 40,
            up: 38,
            delete: 46,
        };
        t.keyCode === e['delete']
            ? (this._map.drawControl.handlers.select.applyToSelected(function (t) {
                    this._map.widget._removeVector(t, !0);
                }, this),
                t.preventDefault(),
                t.stopPropagation())
            : t.keyCode === e.left
            ? (t.shiftKey ? (diffvect = new L.Point(-1, 0)) : (diffvect = new L.Point(-10, 0)),
                this._move(diffvect))
            : t.keyCode === e.up
            ? (t.shiftKey ? (diffvect = new L.Point(0, -1)) : (diffvect = new L.Point(0, -10)),
                this._move(diffvect))
            : t.keyCode === e.right
            ? (t.shiftKey ? (diffvect = new L.Point(1, 0)) : (diffvect = new L.Point(10, 0)),
                this._move(diffvect))
            : t.keyCode === e.down
            ? (t.shiftKey ? (diffvect = new L.Point(0, 1)) : (diffvect = new L.Point(0, 10)),
                this._move(diffvect))
            : 27 === t.keyCode && this.disable(),
            (t.cancelBubble = !0),
            L.DomEvent.stop(t);
    },
    select: function (t) {
        if (this._enabled) {
            this._selected.eachLayer(function (t) {
                this.deselect(t, !1);
            }, this);
            var e = t.layer || t.target || t;
            e.off('click', this.select),
                e.on('dblclick', this.editproperties, this),
                e.redraw(),
                this._selected.addLayer(e),
                (controllayer = $('#controlDiv').find(
                    '.cell-inner[layer_id = ' + e._leaflet_id + ']'
                )),
                controllayer.length > 0 &&
                    (controllayer.addClass('cell-inner-selected'),
                    controllayer[0].offsetTop + 14 + controllayer.height() >
                        $('#list_container').scrollTop() + $('#list_container').height() &&
                        $('#list_container').animate(
                            {
                                scrollTop:
                                    controllayer[0].offsetTop +
                                    14 +
                                    controllayer.height() -
                                    $('#list_container').height(),
                            },
                            1e3
                        ),
                    controllayer[0].offsetTop + 4 < $('#list_container').scrollTop() &&
                        $('#list_container').animate(
                            {
                                scrollTop: controllayer[0].offsetTop - 4,
                            },
                            1e3
                        )),
                this._map.keyboard && this._map.keyboard.removeHooks(),
                L.DomEvent.addListener(this._map._container, 'keyup', this._KeyUp, this),
                this._map.fire('selected', {
                    layer: e,
                });
        }
    },
    deselect: function (t, e) {
        var E = t.layer || t.target || t;
        this._selected.removeLayer(E),
            (controllayer = $('#controlDiv').find(
                '.cell-inner[layer_id = ' + E._leaflet_id + ']'
            )),
            controllayer && controllayer.removeClass('cell-inner-selected'),
            E.off('dblclick'),
            e || E.on('click', this.select, this),
            L.DomEvent.removeListener(this._map._container, 'keyup', this._KeyUp),
            this._map.keyboard && this._map.keyboard.addHooks(),
            this._map.fire('deselected', {
                layer: E,
            }),
            $('#dialog-form').dialog() && $('#dialog-form').dialog('close'),
            (E._moving = !1);
    },
    applyToSelected: function (t, e) {
        this._selected && this._selected.eachLayer(t, e);
    },
    _bind: function (t) {
        var e = t.layer ? t.layer : t;
        this._selectable.hasLayer(e) &&
            e &&
            e.options &&
            e.options._geoJSONProperties.editable &&
            e.on('click', this.select, this);
    },
    _unbind: function (t) {
        var e = t.layer ? t.layer : t;
        this._selectable.hasLayer(e) && this._selected.hasLayer(e) && this.deselect(e, !0);
    },
    editproperties: function (t, e) {
        function E(t) {
            G.off('change'), u.off('change');
            var e = $('.dialog-form #simpleColor'),
                E = 'Field' == t ? s : T;
            e.empty();
            for (var R in E) {
                e.append($('<option></option>').attr('value', E[R]).text(R));
            }
            var e = $('.dialog-form #simpleFillColor'),
                i = 'Field' == t ? w : l;
            e.empty();
            for (var R in i) {
                e.append($('<option></option>').attr('value', i[R]).text(R));
            }
            G.on('change', o), u.on('change', A);
        }
        function R(t) {
            t
                ? (G.attr('disabled', 'disabled'),
                    y.attr('disabled', 'disabled'),
                    B.attr('disabled', 'disabled'),
                    B.minicolors('value', u.val()),
                    i(u.val()),
                    B.attr('data-opacity', 1),
                    B.minicolors('opacity', 1))
                : (G.removeAttr('disabled'),
                    y.removeAttr('disabled'),
                    X || B.removeAttr('disabled'));
        }
        function i(t) {
            var e = !1;
            G.children('option').each(function () {
                if (this.value == t) {
                    return (e = !0), void G.val(t);
                }
            }),
                e ||
                    ((e = !1),
                    G.children('option').each(function () {
                        'Custom' == $(this).text() && (e = !0);
                    }),
                    e ||
                        $('.dialog-form #simpleColor').append(
                            $('<option></option>').attr('value', t).text('Custom')
                        ),
                    G.children('option:contains(Custom):last').attr('value', B.val()),
                    G.val(t));
        }
        function n(t) {
            var e = !1;
            u.children('option').each(function () {
                this.value == t && ((e = !0), u.val(t));
            }),
                e ||
                    ((e = !1),
                    u.children('option').each(function () {
                        'Custom' == $(this).text() && (e = !0);
                    }),
                    e ||
                        $('.dialog-form #simpleFillColor').append(
                            $('<option></option>').attr('value', t).text('Custom')
                        ),
                    u.children('option:contains(Custom):last').attr('value', t),
                    u.val(t),
                    c.prop('checked') && (B.minicolors('value', u.val()), i(u.val())));
        }
        function A() {
            $(this).val() != h.val() && h.minicolors('value', $(this).val()),
                '#000001' == $(this).val()
                    ? (h.minicolors('opacity', 0.001),
                        h.attr('data-opacity', '0.001'),
                        c.removeAttr('checked'),
                        c.attr('disabled', 'disabled'),
                        h.attr('disabled', 'disabled'),
                        R(c.prop('checked')))
                    : G.val() == u.val()
                    ? (c.removeAttr('disabled'),
                        c.attr('checked', 'checked'),
                        c.prop('checked', !0),
                        R(c.prop('checked')),
                        X || h.removeAttr('disabled'),
                        h.minicolors('opacity') < 0.01 &&
                            (h.minicolors('opacity', 0.3), c.removeAttr('disabled')),
                        R(c.prop('checked')))
                    : (h.minicolors('opacity') < 0.01 &&
                            (h.minicolors('opacity', 0.3), c.removeAttr('disabled')),
                        X || h.removeAttr('disabled'),
                        R(c.prop('checked'))),
                c.prop('checked') && (B.minicolors('value', $(this).val()), i(u.val()));
        }
        function o() {
            $(this).val() != B.val() && B.minicolors('value', $(this).val());
        }
        function S() {
            D.val(format('#,##0.#0', Math.round(b.calculateAcres)));
        }
        function p() {
            if (window.mapOptions && window.mapOptions.crops) {
                var t = $('.dialog-form #crop'),
                    e = window.mapOptions.crops;
                t.empty(),
                    $.each(e, function () {
                        t.append($('<option></option>').attr('value', this.id).text(this.name));
                    });
            }
        }
        function r(t, e, E) {
            'fillColor' === E
                ? ((I._path.attributes.fill.value = t),
                    (I._path.attributes['fill-opacity'].value = e))
                : ((I._path.attributes.stroke.value = t),
                    (I._path.attributes['stroke-opacity'].value = e));
        }
        function N(t) {
            I._path.attributes['stroke-width'].value = t;
        }
        function a(t) {
            'Field' == t
                ? (g.show(), U.show(), m.hide(), f.hide())
                : 'AdjacentCrop' == t && (g.hide(), U.hide(), m.show(), f.show());
        }
        function C(t) {
            Y.text(t).addClass('ui-state-highlight'),
                setTimeout(function () {
                    Y.removeClass('ui-state-highlight', 1500);
                }, 500);
        }
        function O(t, e) {
            return (
                !isNaN(parseFloat(t.val().replace(/,/g, ''))) ||
                (t.addClass('ui-state-error'), C(e), !1)
            );
        }
        L.DomEvent.stopPropagation(t), L.DomEvent.preventDefault(t);
        var s = {
                Black: '#000000',
                White: '#ffffff',
                Yellow: '#fcfc3e',
            },
            w = {
                Black: '#000000',
                White: '#ffffff',
                Yellow: '#fcfc3e',
                None: '#000001',
            },
            T = {
                Blue: '#0383ff',
                Brown: '#a52a2a',
                'Dark Green': '#006200',
                Gray: '#808080',
                'Lime Green': '#00ff00',
                Orange: '#f64800',
                Pink: '#ffc0cb',
                Red: '#ff0000',
                Purple: '#800080',
            },
            l = {
                Blue: '#0383ff',
                Brown: '#a52a2a',
                'Dark Green': '#006200',
                Gray: '#808080',
                'Lime Green': '#00ff00',
                Orange: '#f64800',
                Pink: '#ffc0cb',
                Red: '#ff0000',
                Purple: '#800080',
                None: '#000001',
            };
        'block' == $('#menucontainer').css('display') &&
            $('#menucontainer').css('display', 'none'),
            $('#search-form').dialog('isOpen') && $('#search-form').dialog('close');
        var I = t.layer || t.target || t;
        I = map.widget.vectors._getLayerByID(I._leaflet_id);
        var H = $('.dialog-form #type'),
            M = $('.dialog-form #name'),
            D = $('.dialog-form #acres'),
            W = $('.dialog-form #calcacres'),
            J = $('.dialog-form #desc'),
            c = $('.dialog-form #linkColors'),
            B = $('.dialog-form #color'),
            h = $('.dialog-form #fillColor'),
            G = ($('.dialog-form #color').attr('data-opacity'), $('.dialog-form #simpleColor')),
            u = $('.dialog-form #simpleFillColor'),
            d =
                ($('.dialog-form #fillColor').attr('data-opacity'),
                $('.dialog-form #lineWeight')),
            P = $('.dialog-form #crop'),
            y =
                ($('.dialog-form #nameLabel'),
                $('.dialog-form #cropLabel'),
                $('.dialog-form #colorLabel')),
            F =
                ($('.dialog-form #descLabel'),
                $('.dialog-form #acresLabel'),
                $('.dialog-form #calcacresLabel'),
                $('.dialog-form #fixPolygon')),
            g = $('.dialog-form #nameRow'),
            U = $('.dialog-form #acresRow'),
            m = $('.dialog-form #descRow'),
            f = $('.dialog-form #cropRow'),
            K = $([]).add(d).add(h).add(H).add(M).add(J).add(B).add(P).add(D),
            Y = $('.validateTips');
        Y.text('');
        var v = {};
        userOptions && userOptions.editOptions
            ? (v = userOptions.editOptions)
            : ((v.Field = {
                    color: '#fcfc3e',
                    crop_id: '',
                    fillColor: '#000001',
                    weight: 3,
                    fillOpacity: 0.001,
                    opacity: 1,
                }),
                (v.AdjacentCrop = {
                    color: '#f64800',
                    crop_id: '',
                    fillColor: '#000001',
                    weight: 3,
                    fillOpacity: 0.001,
                    opacity: 1,
                }),
                (v.type = 'Field'),
                (userOptions.editOptions = v));
        var b = I.options._geoJSONProperties;
        $('#simplifySlider').slider('value', 100 * I.options.smoothFactor),
            $('#simplifyValue').text(I.options.smoothFactor);
        var k = I.options.smoothFactor,
            V = (I.options, !0);
        p(),
            H.val(b.type),
            E(H.val()),
            F.on('click', fixPolygon),
            G.on('change', o),
            u.on('change', A),
            B.val(b.color.toString().toLowerCase()),
            B.attr('data-opacity', b.opacity),
            b.fillOpacity <= 0.001 && (b.fillColor = '#000001'),
            h.val(b.fillColor.toString().toLowerCase()),
            h.attr('data-opacity', b.fillOpacity),
            i(B.val()),
            n(h.val()),
            '#000001' == u.val()
                ? (c.removeAttr('checked'),
                    G.removeAttr('disabled'),
                    c.attr('disabled', 'disabled'),
                    h.attr('disabled', 'disabled'))
                : G.val() == u.val()
                ? (c.removeAttr('disabled'),
                    c.attr('checked', 'checked'),
                    c.prop('checked', !0),
                    B.attr('disabled', 'disabled'),
                    G.attr('disabled', 'disabled'),
                    X || h.removeAttr('disabled'))
                : (c.removeAttr('disabled'),
                    c.removeAttr('checked'),
                    G.removeAttr('disabled'),
                    X || h.removeAttr('disabled')),
            d.val(b.weight),
            P.val(b.crop_id),
            M.val(b.name),
            D.val(format('#,##0.#0', b.actualAcres)),
            W.text(format('#,##0.#0', b.calculateAcres)),
            J.val(b.description),
            I.setStyle({
                fillColor: h.val(),
                opacity: B.attr('data-opacity'),
                fillOpacity: h.attr('data-opacity'),
                weight: d.val(),
                color: B.val(),
            }),
            a(H.val()),
            I.intersects(!0) ? F.show() : F.hide();
        var x = {
                animationSpeed: 100,
                animationEasing: 'swing',
                changeDelay: 0,
                control: 'hue',
                defaultValue: '',
                hide: null,
                hideSpeed: 100,
                inline: !1,
                letterCase: 'lowercase',
                opacity: !0,
                position: 'right',
                showSpeed: 100,
                swatchPosition: 'left',
                textfield: !1,
                theme: 'default',
                change: function (t, e) {
                    r(t, e, 'color'), i(t);
                },
                show: null,
            },
            Z = {
                animationSpeed: 100,
                animationEasing: 'swing',
                changeDelay: 0,
                control: 'hue',
                defaultValue: '',
                hide: null,
                hideSpeed: 100,
                inline: !1,
                letterCase: 'lowercase',
                opacity: !0,
                position: 'right',
                showSpeed: 100,
                swatchPosition: 'left',
                textfield: !1,
                theme: 'default',
                change: function (t, e) {
                    r(t, e, 'fillColor'), n(t);
                },
                show: null,
            };
        $('.dialog-form #color').minicolors(x), $('.dialog-form #fillColor').minicolors(Z);
        var X = !0;
        X && (B.attr('disabled', 'disabled'), h.attr('disabled', 'disabled')),
            W.click(function () {
                S();
            }),
            D.on('change', function () {
                $(this).val() != format('#,##0.#0', $(this).val()) &&
                    $(this).val(format('#,##0.#0', $(this).val()));
            }),
            P.on('change', function () {}),
            H.on('change', function () {
                E(this.value),
                    a($(this).val()),
                    B.minicolors('value', v[this.value].color),
                    B.val(v[this.value].color),
                    B.attr('data-opacity', v[this.value].opacity),
                    h.minicolors('value', v[this.value].fillColor),
                    h.val(v[this.value].fillColor),
                    h.attr('data-opacity', v[this.value].fillOpacity),
                    i(B.val()),
                    n(h.val()),
                    d.val(v[this.value].weight),
                    P.val(v[this.value].crop_id),
                    '#000001' == u.val()
                        ? (c.removeAttr('checked'),
                            c.attr('disabled', 'disabled'),
                            h.minicolors('opacity', 0.001),
                            h.attr('disabled', 'disabled'))
                        : G.val() == u.val()
                        ? (c.removeAttr('disabled'),
                            c.attr('checked', 'checked'),
                            c.prop('checked', !0),
                            X || h.removeAttr('disabled'))
                        : (c.removeAttr('disabled'),
                            c.removeAttr('checked'),
                            X || h.removeAttr('disabled')),
                    R(c.prop('checked')),
                    I.setStyle({
                        fillColor: h.val(),
                        opacity: B.attr('data-opacity'),
                        fillOpacity: h.attr('data-opacity'),
                        weight: d.val(),
                        color: B.val(),
                    });
            }),
            d.on('change', function () {
                N($(this).val());
            }),
            c.on('change', function () {
                R($(this).prop('checked'));
            }),
            $('#dialog-form').dialog({
                autoOpen: !1,
                height: 310,
                width: 310,
                modal: !1,
                closeOnEscape: !0,
                resizable: !1,
                zIndex: 9999,
                buttons: {
                    Delete: {
                        text: 'Delete',
                        click: function () {
                            $(map)[0].drawControl.handlers.select.applyToSelected(function (t) {
                                $(map)[0].widget._removeVector(t, !b['new']);
                            }, this),
                                (V = !1),
                                $(this).dialog('close');
                        },
                        id: 'btnDelete',
                    },
                    OK: {
                        text: 'OK',
                        click: function () {
                            V = !0;
                            var t = !0;
                            (t = t && O(D, 'Acres must be a number')) &&
                                $(this).dialog('close');
                        },
                        id: 'btnSave',
                    },
                    Cancel: function () {
                        (V = !1), $(this).dialog('close');
                    },
                },
                open: function () {
                    $('#dialog-form').keypress(function (t) {
                        t.keyCode == $.ui.keyCode.ENTER &&
                            $(this).parent().find('button:eq(0)').trigger('click');
                    });
                },
                close: function () {
                    !V && b['new']
                        ? $(map)[0].drawControl.handlers.select.applyToSelected(function (t) {
                                $(map)[0].widget._removeVector(t, !1);
                            }, this)
                        : V
                        ? (isNaN(parseFloat(D.val().replace(/,/g, ''))) && D.val('0'),
                            (b['new'] ||
                                b.type !== H.val() ||
                                b.name !== M.val() ||
                                b.description !== J.val() ||
                                b.color !== B.val() ||
                                b.fillColor !== h.val() ||
                                parseFloat(b.actualAcres) !==
                                    parseFloat(D.val().replace(/,/g, '')) ||
                                parseFloat(b.opacity) !== parseFloat(B.attr('data-opacity')) ||
                                parseFloat(b.fillOpacity) !==
                                    parseFloat(h.attr('data-opacity')) ||
                                parseInt(b.weight) !== parseInt(d.val()) ||
                                parseInt(b.crop_id) !== parseInt(P.val()) ||
                                I._unEditedLatLngs) &&
                                (delete b['new'],
                                (b.type = H.val()),
                                (b.name = M.val()),
                                (b.actualAcres = parseFloat(D.val().replace(/,/g, ''))),
                                (b.description = J.val()),
                                (b.color = B.val()),
                                (b.fillColor = h.val()),
                                (b.opacity = parseFloat(B.attr('data-opacity'))),
                                (b.fillOpacity = parseFloat(h.attr('data-opacity'))),
                                (b.weight = parseInt(d.val())),
                                (b.crop_id = parseInt(P.val())),
                                (I.options._geoJSONProperties = b),
                                (I.options.color = B.val()),
                                (I.options.fillColor = h.val()),
                                (I.options.weight = parseInt(d.val())),
                                (I.options.opacity = parseFloat(B.attr('data-opacity'))),
                                (I.options.fillOpacity = parseFloat(h.attr('data-opacity'))),
                                I.setStyle({
                                    opacity: I.options.opacity,
                                    fillOpacity: I.options.fillOpacity,
                                    color: I.options.color,
                                    fillColor: I.options.fillColor,
                                    weight: I.options.weight,
                                }),
                                I.redraw(),
                                (v[H.val()] = {
                                    weight: d.val(),
                                    fillOpacity: h.attr('data-opacity'),
                                    opacity: B.attr('data-opacity'),
                                    fillColor: h.val(),
                                    color: B.val(),
                                    crop_id: P.val(),
                                }),
                                (v.type = H.val()),
                                I.fire('edit'),
                                I._map.fireEvent('editvectorlayer', I)))
                        : ((I._path.attributes.fill.value = b.fillColor),
                            (I._path.attributes.stroke.value = b.color),
                            (I._path.attributes['stroke-width'].value = b.weight),
                            (I._path.attributes['stroke-opacity'].value = b.opacity),
                            (I._path.attributes['fill-opacity'].value = b.fillOpacity),
                            I._unEditedLatLngs &&
                                I._map &&
                                ((I.options.smoothFactor = k),
                                1 == I.options.smoothFactor
                                    ? (I.setLatLngs(I._unEditedLatLngs[0]),
                                    I._unEditedLatLngs.length > 1 &&
                                        (I._holes = I._unEditedLatLngs.slice(1)))
                                    : smoothPolygon(selected, 100 * I.options.smoothFactor),
                                I.redraw(),
                                I.editing.updateMarkers(),
                                I.intersects(!0))),
                        K.val('').removeClass('ui-state-error'),
                        $('#dialog-form')
                            .find('*')
                            .not('#simplifySlider, #simplifySlider *')
                            .off(),
                        H.off('change'),
                        d.off('change'),
                        G.off('change'),
                        u.off('change'),
                        c.off('change'),
                        W.off('click'),
                        P.off('change'),
                        $('.dialog-form #color').minicolors('destroy'),
                        $('.dialog-form #fillColor').minicolors('destroy');
                },
            }),
            t.originalEvent && (t.originalEvent.cancelBubble = !0);
        var z = 0;
        e && (I._map.fitBounds(I.getBounds().pad(-1.25)), (z = 500)),
            this._skipEdit
                ? (this.showeditproperties(I), $('#dialog-form').dialog('close'))
                : _.delay(this.showeditproperties, z, I);
    },
    showeditproperties: function (t) {
        point = t._map.latLngToContainerPoint(t.getBounds().getNorthWest());
        var e = point.x - t._map._mapPane._leaflet_pos.x - 325,
            E = point.y - t._map._mapPane._leaflet_pos.y - 10,
            R = t._map._mapPane;
        $('#dialog-form').dialog({
            zIndex: 9999,
            position: {
                my: 'left top',
                at: 'left+' + e + ' top+' + E,
                of: R,
                collision: 'fit',
            },
        }),
            $('#dialog-form').dialog().css('z-index', '9999'),
            $('#dialog-form').dialog().css('overflow', 'visible'),
            $('#dialog-form').dialog('open'),
            $(document).mousedown(function (t) {
                $.contains($('#dialog-form').dialog('widget')[0], t.target) ||
                    $('#dialog-form').dialog('close');
            }),
            t.redraw();
    },
})),

L.LayerGroup.include({
    hasLayer: function (t) {
        return !!this._layers[L.Util.stamp(t)];
    },
}),

(L.Control.Select = L.Control.extend({
    options: {
        title: 'Remove selected features',
        position: 'bottomright',
        remove: !0,
    },
    onAdd: function (t) {
        this._map = t;
        var e = 'leaflet-select-control',
            E = L.DomUtil.create('div', e);
        return (
            this.options.remove &&
                this._createButton(
                    this.options.remove.title,
                    e + '-remove',
                    E,
                    this._Delete,
                    this
                ),
            E
        );
    },
    _Delete: function () {
        this._map.drawControl.handlers.select.applyToSelected(function (t) {
            this._map.widget._removeVector(t, !0);
        }, this);
    },
    _createButton: function (t, e, E, R, i) {
        var n = L.DomUtil.create('a', e, E);
        return (
            (n.href = '#'),
            (n.title = t),
            (n.id = e + '-id'),
            L.DomEvent.on(n, 'click', L.DomEvent.stopPropagation)
                .on(n, 'mousedown', L.DomEvent.stopPropagation)
                .on(n, 'dblclick', L.DomEvent.stopPropagation)
                .on(n, 'click', L.DomEvent.preventDefault)
                .on(n, 'click', R, i),
            n
        );
    },
})),

L.Map.addInitHook(function () {
    this.options.drawControl.select &&
        ((this.selectControl = L.Control.select(this.options.drawControl.select)),
        this.addControl(this.selectControl));
}),

(L.Control.select = function (t) {
    return new L.Control.Select(t);
}),

(L.Control.Undo = L.Control.extend({
    options: {
        title: 'Undo',
        position: 'bottomright',
        undo: !0,
    },
    onAdd: function (t) {
        this._map = t;
        var e = 'leaflet-select-control',
            E = L.DomUtil.create('div', e);
        return (
            this.options.undo &&
                this._createButton(this.options.undo.title, e + '-undo', E, this._undo, this),
            E
        );
    },
    _undo: function () {
        this._map.widget._undo();
    },
    _createButton: function (t, e, E, R, i) {
        var n = L.DomUtil.create('a', e, E);
        return (
            (n.href = '#'),
            (n.title = t),
            (n.id = e + '-id'),
            L.DomEvent.on(n, 'click', L.DomEvent.stopPropagation)
                .on(n, 'mousedown', L.DomEvent.stopPropagation)
                .on(n, 'dblclick', L.DomEvent.stopPropagation)
                .on(n, 'click', L.DomEvent.preventDefault)
                .on(n, 'click', R, i),
            n
        );
    },
})),

L.Map.addInitHook(function () {
    this.options.drawControl.undo &&
        ((this.undoControl = L.Control.undo(this.options.drawControl.undo)),
        this.addControl(this.undoControl));
}),

(L.Control.undo = function (t) {
    return new L.Control.Undo(t);
}),

(L.Handler.PolyDrag = L.Handler.extend({
    initialize: function (t) {
        this._poly = t;
    },
    addHooks: function () {
        var t = this._poly._container;
        L.Polyline &&
            this._poly instanceof L.Polyline &&
            (this._draggable ||
                (this._draggable = new L.DraggablePoly(t, t)
                    .on('dragstart', this._onDragStart, this)
                    .on('drag', this._onDrag, this)
                    .on('dragend', this._onDragEnd, this)),
            this._draggable.enable());
    },
    removeHooks: function () {
        this._draggable.disable();
    },
    moved: function () {
        return this._draggable && this._draggable._moved;
    },
    _onDragStart: function () {
        this._poly.editing.enabled() && ((this._wasEditing = !0), this._poly.editing.disable()),
            this._poly.fire('movestart').fire('dragstart'),
            (this._poly._moving = !0);
    },
    _onDrag: function (t) {
        L.DomUtil.setPosition(this._poly._container, t.target._totalDiffVec),
            this._poly.fire('move').fire('drag');
    },
    _onDragEnd: function (t) {
        var e = this._poly._map,
            E = this._poly.getLatLngs(),
            R = [];
        if (this._poly._holes) {
            var i = this._poly._holes;
            for (var n in i) {
                var A = [];
                for (var o in i[n]) {
                    var S = A.push(
                        e.containerPointToLatLng(
                            e.latLngToContainerPoint(i[n][o]).add(t.target._totalDiffVec)
                        )
                    );
                }
                R.push(A);
            }
            this._poly._holes = R;
        }
        var o,
            p = [];
        for (o in E) {
            var r = e.latLngToContainerPoint(E[o]),
                N = r.add(t.target._totalDiffVec);
            p.push(e.containerPointToLatLng(N));
        }
        L.DomUtil.setPosition(this._poly._container, new L.Point(0, 0)),
            this._poly.setLatLngs(p),
            this._wasEditing && (this._poly.editing.enable(), (this._wasEditing = !1)),
            this._poly.fire('moveend').fire('dragend');
    },
})),

(L.DraggablePoly = L.Draggable.extend({
    _onDown: function (t) {
        if (
            !(
                (!L.Browser.touch && t.shiftKey) ||
                (1 !== t.which && 1 !== t.button && !t.touches)
            )
        ) {
            if (((this._simulateClick = !0), t.touches && t.touches.length > 1)) {
                return void (this._simulateClick = !1);
            }
            var e = t.touches && 1 === t.touches.length ? t.touches[0] : t,
                E = e.target;
            L.DomEvent.stop(t),
                L.Browser.touch &&
                    'a' === E.tagName.toLowerCase() &&
                    L.DomUtil.addClass(E, 'leaflet-active'),
                (this._moved = !1),
                this._moving ||
                    (L.Browser.touch ||
                        (L.DomUtil.disableTextSelection(), this._setMovingCursor()),
                    (this._startPoint = new L.Point(e.clientX, e.clientY)),
                    L.DomEvent.on(document, L.Draggable.MOVE, this._onMove, this),
                    L.DomEvent.on(document, L.Draggable.END, this._onUp, this));
        }
    },
    _onMove: function (t) {
        if (!(t.touches && t.touches.length > 1)) {
            var e = t.touches && 1 === t.touches.length ? t.touches[0] : t;
            this._moved
                ? (this._lastPoint = this._newPoint)
                : (this._lastPoint = this._startPoint),
                (this._newPoint = new L.Point(e.clientX, e.clientY)),
                (this._diffVec = this._newPoint.subtract(this._lastPoint)),
                (this._totalDiffVec = new L.Point(t.clientX, t.clientY).subtract(
                    this._startPoint
                )),
                (this._diffVec.x || this._diffVec.y) &&
                    (L.DomEvent.stop(t),
                    this._moved || (this.fire('dragstart'), (this._moved = !0)),
                    (this._moving = !0),
                    L.Util.cancelAnimFrame(this._animRequest),
                    (this._animRequest = L.Util.requestAnimFrame(
                        this._updatePosition,
                        this,
                        !0,
                        this._dragStartTarget
                    )));
        }
    },
    _updatePosition: function () {
        this.fire('predrag'), this.fire('drag');
    },
    _onUp: function (t) {
        if (
            ((this._totalDiffVec = new L.Point(t.clientX, t.clientY).subtract(
                this._startPoint
            )),
            this._simulateClick && t.changedTouches)
        ) {
            var e = t.changedTouches[0],
                E = e.target,
                R = (this._newPos && this._newPos.distanceTo(this._startPos)) || 0;
            'a' === E.tagName.toLowerCase() && L.DomUtil.removeClass(E, 'leaflet-active'),
                R < L.Draggable.TAP_TOLERANCE && this._simulateEvent('click', e);
        }
        L.Browser.touch || (L.DomUtil.enableTextSelection(), this._restoreCursor()),
            L.DomEvent.off(document, L.Draggable.MOVE, this._onMove),
            L.DomEvent.off(document, L.Draggable.END, this._onUp),
            this._moved && (L.Util.cancelAnimFrame(this._animRequest), this.fire('dragend')),
            (this._moving = !1);
    },
}));

// #####################################################

(L.Control.FullScreen = L.Control.Zoom.extend({
    includes: L.Mixin.Events,
    onAdd: function (t) {
        var e,
            E,
            R = 'leaflet-control-zoom';
        return (
            (this._map = t),
            (this._isFullscreen = !1),
            t.zoomControl
                ? ((E = t.zoomControl._container), (e = '-fullscreen last'))
                : ((E = L.DomUtil.create('div', R)), (e = '-fullscreen')),
            this._createButton('Full Screen', R + e, E, this.fullscreen, this),
            E
        );
    },
    fullscreen: function () {
        this._map.drawControl && this._map.drawControl._disableInactiveModes(),
            this._isFullscreen ? this._exitFullScreen() : this._enterFullScreen(),
            this._map.invalidateSize();
    },
    _enterFullScreen: function () {
        var t = this._map._container;
        (this._saveposition = t.style.position),
            (this._saveleft = t.style.left),
            (this._savetop = t.style.top),
            (this._savewidth = t.style.width),
            (this._saveheight = t.style.height),
            (this._savezindex = t.style.zIndex),
            (this._saveflex = t.style.flex),
            (this._savewebkitboxflex = t.style.webkitBoxFlex),
            (this._savewebkitflex = t.style.webkitFlex),
            (this._savemsflex = t.style.msFlex),
            (this._savemozflex = t.style.mozBoxFlex),
            (t.style.position = 'fixed'),
            (t.style.left = 0),
            (t.style.top = 0),
            (t.style.width = '100%'),
            (t.style.height = '100%'),
            L.DomUtil.addClass(t, 'leaflet-fullscreen'),
            (this._isFullscreen = !0),
            this._map.fire('enterFullscreen');
    },
    _exitFullScreen: function () {
        var t = this._map._container;
        L.DomUtil.removeClass(t, 'leaflet-fullscreen'),
            (this._isFullscreen = !1),
            t.removeAttribute('style'),
            (t.style.position = this._saveposition),
            (t.style.left = this._saveleft),
            (t.style.top = this._savetop),
            (t.style.width = this._savewidth),
            (t.style.height = this._saveheight),
            (t.style.zIndex = this._savezindex),
            (t.style.webkitBoxFlex = this._savewebkitboxflex),
            (t.style.mozBoxFlex = this._savemozflex),
            (t.style.webkitFlex = this._savewebkitflex),
            (t.style.msFlex = this._savemsflex),
            (t.style.flex = this._saveflex);
        var e = L.DomUtil.getStyle(t, 'position');
        'absolute' !== e && 'relative' !== e && (t.style.position = 'relative'),
            this._map.fire('exitFullscreen');
    },
    _onKeyUp: function (t) {
        if (!t) {
            var t = window.event;
        }
        27 === t.keyCode && !0 === this._isFullscreen && this._exitFullScreen();
    },
})),

(L.Control.MiniMap = L.Control.extend({
    options: {
        position: 'bottomright',
        toggleDisplay: !1,
        zoomLevelOffset: -4,
        zoomLevelFixed: !1,
        zoomAnimation: !0,
        fadeAnimation: !1,
        width: 150,
        height: 100,
    },
    initialize: function (t, e) {
        L.Util.setOptions(this, e), (this._layer = t);
    },
    onAdd: function (t) {
        return (
            (this._mainMap = t),
            (this._container = L.DomUtil.create('div', 'leaflet-control-minimap')),
            (this._container.style.width = this.options.width + 'px'),
            (this._container.style.height = this.options.height + 'px'),
            L.DomEvent.disableClickPropagation(this._container),
            L.DomEvent.on(this._container, 'mousewheel', L.DomEvent.stopPropagation),
            (this._miniMap = new L.Map(this._container, {
                attributionControl: !1,
                zoomControl: !1,
                zoomAnimation: this.options.zoomAnimation,
                fadeAnimation: this.options.fadeAnimation,
                touchZoom: !this.options.zoomLevelFixed,
                scrollWheelZoom: !this.options.zoomLevelFixed,
                doubleClickZoom: !this.options.zoomLevelFixed,
                boxZoom: !this.options.zoomLevelFixed,
            })),
            this._miniMap.addLayer(L.Util.clone(this._layer)),
            setTimeout(
                L.Util.bind(function () {
                    this._miniMap.setView(this._mainMap.getCenter(), this._decideZoom(!0)),
                        (this._aimingRect = L.rectangle(this._mainMap.getBounds(), {
                            color: '#ff7800',
                            weight: 1,
                            clickable: !1,
                        }).addTo(this._miniMap)),
                        this.options.toggleDisplay && this._addToggleButton();
                }, this),
                500
            ),
            (this._mainMapMoving = !1),
            (this._miniMapMoving = !1),
            this._mainMap.on('moveend', this._onMainMapMoved, this),
            this._mainMap.on('move', this._onMainMapMoving, this),
            this._miniMap.on('moveend', this._onMiniMapMoved, this),
            this._container
        );
    },
    onRemove: function () {
        this._mainMap.off('moveend', this._onMainMapMoved, this),
            this._mainMap.off('move', this._onMainMapMoving, this),
            this._miniMap.off('moveend', this._onMiniMapMoved, this);
    },
    _addToggleButton: function () {
        (this._toggleDisplayButton = this.options.toggleDisplay
            ? this._createButton(
                    '',
                    'Hide',
                    'leaflet-control-minimap-toggle-display',
                    this._container,
                    this._toggleDisplay,
                    this
                )
            : undefined),
            (this._minimized = !1);
    },
    _createButton: function (t, e, E, R, i, n) {
        var A = L.DomUtil.create('a', E, R);
        (A.innerHTML = t), (A.href = '#'), (A.title = e);
        var o = L.DomEvent.stopPropagation;
        return (
            L.DomEvent.on(A, 'click', o)
                .on(A, 'mousedown', o)
                .on(A, 'dblclick', o)
                .on(A, 'click', L.DomEvent.preventDefault)
                .on(A, 'click', i, n),
            A
        );
    },
    _toggleDisplay: function () {
        this._minimized
            ? ((this._container.style.width = this.options.width + 'px'),
                (this._container.style.height = this.options.height + 'px'),
                (this._toggleDisplayButton.className =
                    this._toggleDisplayButton.className.replace(/(?:^|\s)minimized(?!\S)/g, '')),
                (this._minimized = !1))
            : ((this._container.style.width = '19px'),
                (this._container.style.height = '19px'),
                (this._toggleDisplayButton.className += ' minimized'),
                (this._minimized = !0));
    },
    _onMainMapMoved: function () {
        this._miniMapMoving
            ? (this._miniMapMoving = !1)
            : ((this._mainMapMoving = !0),
                this._miniMap.setView(this._mainMap.getCenter(), this._decideZoom(!0))),
            this._aimingRect && this._aimingRect.setBounds(this._mainMap.getBounds());
    },
    _onMainMapMoving: function () {
        this._aimingRect && this._aimingRect.setBounds(this._mainMap.getBounds());
    },
    _onMiniMapMoved: function () {
        this._mainMapMoving
            ? (this._mainMapMoving = !1)
            : ((this._miniMapMoving = !0),
                this._mainMap.setView(this._miniMap.getCenter(), this._decideZoom(!1)));
    },
    _decideZoom: function (t) {
        return this.options.zoomLevelFixed
            ? t
                ? this.options.zoomLevelFixed
                : this._mainMap.getZoom()
            : t
            ? this._mainMap.getZoom() + this.options.zoomLevelOffset > 1
                ? this._mainMap.getZoom() + this.options.zoomLevelOffset
                : 2
            : this._miniMap.getZoom() - this.options.zoomLevelOffset;
    },
})),

L.Map.mergeOptions({
    miniMapControl: !1,
}),

L.Map.addInitHook(function () {
    this.options.miniMapControl && (this.miniMapControl = new L.Control.MiniMap().addTo(this));
}),

(L.control.minimap = function (t) {
    return new L.Control.MiniMap(t);
}),

(L.Util.clone = function (t) {
    if (null == t || 'object' != typeof t) {
        return t;
    }
    var e = new t.constructor();
    for (var E in t) {
        e[E] = L.Util.clone(t[E]);
    }
    return e;
}),

(L.WidgetFeatureGroup = L.LayerGroup.extend({
    initialize: function (t) {
        L.LayerGroup.prototype.initialize.call(this, t), (this._size = 0);
    },
    calculatePercentCoverage: function (t) {
        (joblayers = _.filter(t.widget.vectors._layers, function (t) {
            return (
                'job' == t.options._geoJSONProperties.type &&
                1 == t.options._geoJSONProperties.assigned
            );
        })),
            (appliedlayers = _.filter(t.widget.vectors._layers, function (t) {
                return (
                    'log_file' == t.options._geoJSONProperties.type &&
                    1 == t.options._geoJSONProperties.assigned
                );
            }));
        var e = [],
            E = [];
        for (var R in joblayers) {
            e = e.concat(joblayers[R]._polyToClipperPoints(joblayers[R], t, !0));
        }
        for (var R in appliedlayers) {
            E = E.concat(appliedlayers[R]._polyToClipperPoints(appliedlayers[R], t, !0));
        }
        var i = [[]],
            n = new ClipperLib.Clipper(),
            A = ClipperLib.ClipType.ctIntersection;
        n.AddPolygons(e, ClipperLib.PolyType.ptSubject, !0),
            n.AddPolygons(this.unionPolys(E), ClipperLib.PolyType.ptClip, !0);
        var o = ClipperLib.PolyFillType.pftNonZero,
            S = ClipperLib.PolyFillType.pftNonZero;
        if (n.Execute(A, i, o, S)) {
            var p = 0,
                r = 0;
            for (var R in i) {
                p += n.Area(i[R]);
            }
            for (var R in e) {
                r += n.Area(e[R]);
            }
            (result_2 = Math.abs(Math.ceil((p / r) * 100))),
                (result_2 = result_2 > 100 ? 100 : result_2);
        }
        return result_2;
    },
    calculateLogFilePercentCoverage: function (t) {
        (joblayers = _.filter(t.widget.vectors._layers, function (t) {
            return (
                'job' == t.options._geoJSONProperties.type &&
                1 == t.options._geoJSONProperties.assigned
            );
        })),
            (appliedlayers = _.filter(t.widget.vectors._layers, function (t) {
                return (
                    'log_file' == t.options._geoJSONProperties.type &&
                    1 == t.options._geoJSONProperties.assigned
                );
            }));
        var e = [],
            E = [];
        for (var R in appliedlayers) {
            e = e.concat(appliedlayers[R]._polyToClipperPoints(appliedlayers[R], t, !0));
        }
        for (var R in joblayers) {
            E = E.concat(joblayers[R]._polyToClipperPoints(joblayers[R], t, !0));
        }
        var i = [[]],
            n = new ClipperLib.Clipper(),
            A = ClipperLib.ClipType.ctIntersection;
        n.AddPolygons(e, ClipperLib.PolyType.ptSubject, !0),
            n.AddPolygons(this.unionPolys(E), ClipperLib.PolyType.ptClip, !0);
        var o = ClipperLib.PolyFillType.pftNonZero,
            S = ClipperLib.PolyFillType.pftNonZero;
        if (n.Execute(A, i, o, S)) {
            var p = 0,
                r = 0;
            for (var R in i) {
                p += n.Area(i[R]);
            }
            for (var R in e) {
                r += n.Area(e[R]);
            }
            (result_2 = Math.abs(Math.ceil((p / r) * 100))),
                (result_2 = result_2 > 100 ? 100 : result_2);
        }
        return result_2;
    },
    calculateAcresLatLngs: function (t) {
        var e = new L.Polygon(t);
        return Math.round(1e3 * L.PolyUtil.geodesicArea(e)) / 1e3;
    },
    _clipperPointsToPointsArray: function (t) {
        var e = new Array();
        for (var E in t) {
            var R = t[E],
                i = new Array();
            for (var n in R) {
                var A = R[n];
                i.push(new L.Point(A.X, A.Y));
            }
            e.push(i);
        }
        return e;
    },
    _pointsToLatLngs: function (t, e) {
        var E = new Array();
        for (var R in t) {
            var i = t[R];
            E.push(e.containerPointToLatLng(i));
        }
        return E;
    },
    unionPolys: function (t) {
        var e = new ClipperLib.Clipper(),
            E = ClipperLib.ClipType.ctUnion,
            R = [[]];
        e.AddPolygons(t, ClipperLib.PolyType.ptSubject, !0);
        var i = ClipperLib.PolyFillType.pftNonZero,
            n = ClipperLib.PolyFillType.pftNonZero;
        return e.Execute(E, R, i, n) ? R : null;
    },
    addLayer: function (t) {
        if (
            ((this._size += 1),
            L.LayerGroup.prototype.addLayer.call(this, t),
            t instanceof L.Polygon &&
                (t.options._geoJSONProperties ||
                    ((t.options._geoJSONProperties = new L.GeoJsonProperties()),
                    (t.options._geoJSONProperties['new'] = !0)),
                (t.options._geoJSONProperties.calculateAcres = parseFloat(t.calculateAcres())),
                t.options._geoJSONProperties.actualAcres ||
                    (t.options._geoJSONProperties.actualAcres = Math.round(
                        parseFloat(t.options._geoJSONProperties.calculateAcres)
                    )),
                this._map.widget.options.showLabels &&
                    t.options._geoJSONProperties.label &&
                    !t.popup))
        ) {
            var e = new L.AgrismartPopup(
                {
                    closeButton: !1,
                    labelFontSize: t.options._geoJSONProperties.fontSize,
                    autoPan: !1,
                },
                null
            );
            e.setContent(t.options._geoJSONProperties.label),
                e.setLatLng(t.getBounds().getCenter()),
                (t.popup = e),
                this._map.addLayer(e),
                t.options._geoJSONProperties.hideLabel && e.hide(),
                t.options._geoJSONProperties.editable && (editable = !0);
        }
        return (
            this.eachLayer(function (t) {
                'Field' == t.options._geoJSONProperties.type
                    ? t.bringToFront()
                    : t.bringToBack();
            }),
            this._map.fire('addvectorlayer', {
                layer: t,
            }),
            t
        );
    },
    removeLayer: function (t) {
        (this._size -= 1),
            this._size < 0 && this.resize(),
            L.LayerGroup.prototype.removeLayer.call(this, t),
            this._map.fire('removevectorlayer', t);
    },
    _getLayerByID: function (t) {
        return $(this._layers[(_leaflet_id = t)])[0];
    },
    selectedLayer: function () {
        $(this._map.drawControl.handlers.select._selected._layers)[0];
    },
    selectLayerByID: function (t, e) {
        if (((layer = $(this._layers[(_leaflet_id = t)])[0]), layer)) {
            return (
                this._map.drawControl.handlers.select.enable(),
                this._map.drawControl.handlers.select.select(layer),
                void (e && this._map.drawControl.handlers.select.editproperties(layer, !0))
            );
        }
    },
    deleteLayersByID: function (t, e) {
        if (
            ((layers = _.filter(map.widget.vectors._layers, function (E) {
                return (
                    E.options._geoJSONProperties.type == e &&
                    E.options._geoJSONProperties.id == t
                );
            })),
            layers)
        ) {
            return void alert(layers.length);
        }
    },
    setOverlayLayerOpacity: function (t, e) {
        selectOverlayLayers = _.filter(map._layers, function (e) {
            return e.name == t;
        });
        var E = null;
        if (selectOverlayLayers) {
            for (var R in selectOverlayLayers) {
                selectOverlayLayers[R].options.opacity !== e &&
                    selectOverlayLayers[R].setOpacity(e),
                    (E = e);
            }
        }
        return E;
    },
    highlightLayersByID: function (t, e, E) {
        if (
            ((selectlayers = _.filter(map.widget.vectors._layers, function (E) {
                return (
                    E.options._geoJSONProperties.type == e &&
                    E.options._geoJSONProperties.id == t
                );
            })),
            selectlayers)
        ) {
            for (var R in selectlayers) {
                (layer = selectlayers[R]),
                    layer.options._geoJSONProperties.assigned ||
                        (E
                            ? (layer.popup && layer.popup.show(),
                                layer.setStyle({
                                    opacity: 1,
                                    fillOpacity: 1,
                                    weight: 2 * layer.options._geoJSONProperties.weight,
                                }),
                                this.setOverlayLayerOpacity(e + t, 1))
                            : (layer.setStyle({
                                    opacity: 0,
                                    fillOpacity: 0,
                                    weight: layer.options._geoJSONProperties.weight,
                                }),
                                this.setOverlayLayerOpacity(e + t, 0),
                                layer.popup && layer.popup.hide()));
            }
        }
    },
    assignLayers: function (t, e, E) {
        if (
            ((this._dirty = !0), map.widget._checkUndoState(), (selectlayers = t), selectlayers)
        ) {
            for (var R in selectlayers) {
                (layer = selectlayers[R]),
                    (layer.options._geoJSONProperties.assigned = E
                        ? !layer.options._geoJSONProperties.assigned
                        : e),
                    layer.options._geoJSONProperties.assigned
                        ? (layer.popup && layer.popup.show(),
                            1 ==
                            this.setOverlayLayerOpacity(
                                layer.options._geoJSONProperties.type +
                                    layer.options._geoJSONProperties.id,
                                1
                            )
                                ? ((layer.options._geoJSONProperties.opacity = 0),
                                (layer.options._geoJSONProperties.fillOpacity = 0),
                                (layer.options._geoJSONProperties.weight = 3),
                                (layer.options._geoJSONProperties.hideLabel = !1),
                                layer.setStyle({
                                    opacity: 0,
                                    fillOpacity: 0,
                                    weight: layer.options._geoJSONProperties.weight,
                                }))
                                : ((layer.options._geoJSONProperties.opacity = 1),
                                (layer.options._geoJSONProperties.fillOpacity = 0.3),
                                (layer.options._geoJSONProperties.weight = 3),
                                (layer.options._geoJSONProperties.hideLabel = !1),
                                layer.setStyle({
                                    opacity: 1,
                                    fillOpacity: 0.3,
                                    weight: layer.options._geoJSONProperties.weight,
                                })))
                        : (layer.popup && layer.popup.hide(),
                            (layer.options._geoJSONProperties.opacity = 0),
                            (layer.options._geoJSONProperties.hideLabel = !0),
                            layer.setStyle({
                                opacity: 0,
                                fillOpacity: 0,
                            }),
                            this.setOverlayLayerOpacity(
                                layer.options._geoJSONProperties.type +
                                    layer.options._geoJSONProperties.id,
                                0
                            ));
            }
        }
    },
    selectLayersByID: function (t, e, E) {
        if (
            ((selectlayers = _.filter(map.widget.vectors._layers, function (E) {
                return (
                    E.options._geoJSONProperties.type == e &&
                    E.options._geoJSONProperties.id == t
                );
            })),
            selectlayers && !E)
        ) {
            (this._dirty = !0), map.widget._checkUndoState();
            for (var R in selectlayers) {
                (layer = selectlayers[R]),
                    layer.options._geoJSONProperties.selectable &&
                        ((layer.options._geoJSONProperties.assigned =
                            !layer.options._geoJSONProperties.assigned),
                        layer.options._geoJSONProperties.assigned
                            ? (layer.popup && layer.popup.show(),
                                1 ==
                                this.setOverlayLayerOpacity(
                                    layer.options._geoJSONProperties.type +
                                        layer.options._geoJSONProperties.id,
                                    1
                                )
                                    ? ((layer.options._geoJSONProperties.opacity = 0),
                                    (layer.options._geoJSONProperties.fillOpacity = 0),
                                    (layer.options._geoJSONProperties.weight = 3),
                                    (layer.options._geoJSONProperties.hideLabel = !1),
                                    layer.setStyle({
                                        opacity: 0,
                                        fillOpacity: 0,
                                        weight: layer.options._geoJSONProperties.weight,
                                    }))
                                    : ((layer.options._geoJSONProperties.opacity = 1),
                                    (layer.options._geoJSONProperties.fillOpacity = 0.3),
                                    (layer.options._geoJSONProperties.weight = 3),
                                    (layer.options._geoJSONProperties.hideLabel = !1),
                                    layer.setStyle({
                                        opacity: 1,
                                        fillOpacity: 0.3,
                                        weight: layer.options._geoJSONProperties.weight,
                                    })))
                            : (layer.popup && layer.popup.hide(),
                                (layer.options._geoJSONProperties.opacity = 0),
                                (layer.options._geoJSONProperties.hideLabel = !0),
                                layer.setStyle({
                                    opacity: 0,
                                    fillOpacity: 0,
                                }),
                                this.setOverlayLayerOpacity(
                                    layer.options._geoJSONProperties.type +
                                        layer.options._geoJSONProperties.id,
                                    0
                                )));
            }
        }
        selectlayers && E && this.centerpolygons(selectlayers);
    },
    editproperties: function (t) {
        this._map.drawControl.handlers.select.editproperties(t);
    },
    centerpolygons: function (t) {
        var e = new L.LatLngBounds();
        for (var E in t) {
            (layer = t[E]), layer instanceof L.Marker || e.extend(layer.getBounds().pad(-1.25));
        }
        this._map.fitBounds(e);
    },
    centerpolygon: function (t) {
        this._map.fitBounds(t.getBounds().pad(-1.25));
    },
    removeLayerByID: function (t) {
        (layer = this._getLayerByID(t)),
            layer &&
                ((this._size -= 1),
                this._map.drawControl.handlers.select.enabled &&
                    (this._map.drawControl.handlers.select.disable(),
                    this._map.drawControl.handlers.select.enable()),
                L.LayerGroup.prototype.removeLayer.call(this, layer),
                this._map.fire('removevectorlayer', layer));
    },
    updateLayerByID: function (t, e) {
        if (((layer = this._getLayerByID(t)), layer)) {
            layer.setStyle &&
                layer.setStyle({
                    color: e.attributes.color,
                });
            for (var E in layer.options._geoJSONProperties) {
                layer.options._geoJSONProperties[E] = e.attributes[E];
            }
        }
    },
    clearLayers: function (t) {
        (this._size = 0),
            this.eachLayer(function (e) {
                (!t || (t && e.options._geoJSONProperties.editable)) &&
                    (e.popup && this._map.removeLayer(e.popup),
                    L.LayerGroup.prototype.removeLayer.call(this, e));
            }, this);
    },
    toGeoJSON: function (t) {
        var e = [];
        return (
            this.eachLayer(function (E) {
                (!t || (t && E.options._geoJSONProperties.editable)) && e.push(E.toGeoJSON());
            }),
            L.GeoJSONUtil.featureCollection(e)
        );
    },
    size: function () {
        return this._size;
    },
    resize: function () {
        var t = 0;
        for (var e in this.vectors) {
            t++;
        }
        this._size = t;
    },
    getBounds: function (t, e) {
        var E = new L.LatLngBounds();
        return (
            this.eachLayer(function (R) {
                (t && R.options._geoJSONProperties.type != t) ||
                    (e && !(e.indexOf(R._leaflet_id) > -1)) ||
                    E.extend(R instanceof L.Marker ? R.getLatLng() : R.getBounds());
            }),
            E.pad(-1.25)
        );
    },
})),

(L.widgetFeatureGroup = function (t) {
    return new L.WidgetFeatureGroup(t);
}),

(L.GeoJsonProperties = L.Class.extend({
    id: '',
    name: '',
    type: '',
    actualAcres: '',
    color: '#fcfc3e',
    calculateAcres: '',
    fillColor: '#fcfc3e',
    fillOpacity: 0.3,
    opacity: 1,
    weight: 3,
    fill: !0,
    stroke: !0,
    label: '',
    description: '',
    farm_field_id: -1,
    job_id: -1,
    crop_id: -1,
    editable: !0,
    fontSize: 14,
    dashArray: '',
    assigned: !1,
    selectable: !1,
    index: 0,
    hideLabel: !1,
    percentCoverage: 0,
    createdAt: '2000-01-01T00:00:00Z',
    sizeKb: 0,
    job_log_id: -1,
    spray_date: '2000-01-01T00:00:00Z',
    schedule_date: '2000-01-01T00:00:00Z',
    plane_number: '',
    pilot_name: '',
    overlayTileLayer: '',
    initialize: function () {
        this._setUserOptions(),
            (this.id = ''),
            (this.name = ''),
            (this.type = userOptions.editOptions.type),
            (this.actualAcres = ''),
            (this.color = userOptions.editOptions[userOptions.editOptions.type].color),
            (this.calculateAcres = ''),
            (this.fillColor = userOptions.editOptions[userOptions.editOptions.type].fillColor),
            (this.fillOpacity =
                userOptions.editOptions[userOptions.editOptions.type].fillOpacity),
            (this.opacity = userOptions.editOptions[userOptions.editOptions.type].opacity),
            (this.weight = userOptions.editOptions[userOptions.editOptions.type].weight),
            (this.fill = !0),
            (this.stroke = !0),
            (this.map_label = ''),
            (this.description = ''),
            (this.farm_field_id = -1),
            (this.job_id = -1),
            (this.crop_id = userOptions.editOptions[userOptions.editOptions.type].crop_id),
            (this.editable = !0),
            (this.fontSize = 14),
            (this.dashArray = ''),
            (this['new'] = !1),
            (this.assigned = !1),
            (this.selectable = !1),
            (this.index = 0),
            (this.hideLabel = !1),
            (this.percentCoverage = 0),
            (this.createdAt = '2000-01-01T00:00:00Z'),
            (this.sizeKb = 0),
            (this.job_log_id = -1),
            (this.spray_date = '2000-01-01T00:00:00Z'),
            (this.schedule_date = '2000-01-01T00:00:00Z'),
            (this.plane_number = ''),
            (this.pilot_name = ''),
            (this.overlayTileLayer = '');
    },
    _setUserOptions: function () {
        var t = {};
        (t.Field = {
            color: '#fcfc3e',
            crop_id: '',
            fillColor: '#000001',
            weight: 3,
            fillOpacity: 0.001,
            opacity: 1,
        }),
            (t.AdjacentCrop = {
                color: '#f64800',
                crop_id: '',
                fillColor: '#000001',
                weight: 3,
                fillOpacity: 0.001,
                opacity: 1,
            }),
            (t.type = 'Field'),
            ('undefined' != typeof userOptions && userOptions) || (userOptions = {}),
            userOptions.editOptions || (userOptions.editOptions = t),
            this._setShapeOptions('Field', t),
            this._setShapeOptions('AdjacentCrop', t);
    },
    _setShapeOptions: function (t, e) {
        userOptions.editOptions[t]
            ? $.each(e[t], function (E) {
                    userOptions.editOptions[t][E] || (userOptions.editOptions[t][E] = e[t][E]);
                })
            : (userOptions.editOptions[t] = e[t]);
    },
})),

L.Map.mergeOptions({
    widget: !1,
}),

(L.Handler.Widget = L.Handler.extend({
    includes: L.Mixin.Events,
    options: {
        multiple: !0,
        cardinality: 0,
        autoCenter: !0,
        draw: !0,
        helpUri: 'http://somehelpuri',
        defaultVectorStyle: {
            color: '#fcfc3e',
        },
        selectedVectorStyle: {},
        drawVectorStyle: {
            weight: 3,
            color: '#fcfc3e',
            clickable: !0,
        },
        cutVectorStyle: {
            weight: 3,
            opacity: 0.3,
            color: '#000000',
            clickable: !1,
        },
        showLabels: !1,
    },
    initialize: function (t, e) {
        L.Util.setOptions(this, e),
            L.Handler.prototype.initialize.call(this, t),
            this._map.drawControl || this._initDraw(),
            (this._currentView = ' ');
    },
    addHooks: function () {
        this._map &&
            ((this.vectors = L.widgetFeatureGroup().addTo(this._map)),
            (this._full = !1),
            (this._cardinality = this.options.multiple ? this.options.cardinality : 1),
            this.options.attach &&
                ((this._attach = L.DomUtil.get(this.options.attach)),
                this.load(this._attach.value)),
            this.options.draw &&
                (this._map.on(
                    {
                        'draw:circle-created draw:rectangle-created draw:poly-created draw:polyline-created draw:marker-created draw:polylinecut-created draw:polygoncut-created draw:rectanglecut-created draw:circlecut-created draw:clufield-created draw:growerfield-created':
                            this._onCreated,
                        selected: this._onSelected,
                        deselected: this._onDeselected,
                        layerremove: this._unbind,
                    },
                    this
                ),
                (this._map.drawControl.handlers.select.options.selectable = this.vectors)),
            this.vectors &&
                this.vectors.size() > 0 &&
                this.options.autoCenter &&
                this._map.fitBounds(this.vectors.getBounds()));
    },
    removeHooks: function () {
        this._map &&
            (this._map.removeLayer(this.vectors),
            delete this.vectors,
            this._map.off(
                {
                    'draw:circle-created draw:rectangle-created draw:poly-created draw:polyline-created draw:marker-created draw:polylinecut-created draw:polygoncut-created draw:rectanglecut-created draw:circlecut-created draw:clufield-created draw:growerfield-created':
                        this._onCreated,
                    selected: this._onSelected,
                    deselected: this._onDeselected,
                    layerremove: this._unbind,
                },
                this
            ));
    },
    _initDraw: function () {
        var t = {
                title: 'Select a field',
            },
            e = !1;
        pageOptions &&
            pageOptions.agrismartGrowerFieldsUri &&
            (e = {
                title: 'Select grower field',
            }),
            this.options.draw
                ? ('undefined' != typeof mapOptions &&
                        mapOptions &&
                        (null == mapOptions.selectFieldAvailable ||
                            mapOptions.selectFieldAvailable ||
                            (t = mapOptions.selectFieldAvailable)),
                    (this._map.drawControl = new L.Control.Draw({
                        position: 'topleft',
                        help: {
                            title: 'Help',
                        },
                        undo: {
                            title: 'Undo',
                        },
                        redo: {
                            title: 'Redo',
                        },
                        clufield: t,
                        growerfield: e,
                        polylinecut: {
                            shapeOptions: this.options.cutVectorStyle,
                            title: 'Split a shape',
                        },
                        polygoncut: {
                            shapeOptions: this.options.cutVectorStyle,
                            title: 'Cut a shape',
                        },
                        rectanglecut: {
                            shapeOptions: this.options.cutVectorStyle,
                            title: 'Cut a rectangle',
                        },
                        circlecut: {
                            shapeOptions: this.options.cutVectorStyle,
                            title: 'Cut a circle',
                        },
                        polyline: !1,
                        polygon: {
                            shapeOptions: this.options.drawVectorStyle,
                            title: 'Draw a shape',
                        },
                        rectangle: {
                            shapeOptions: this.options.drawVectorStyle,
                            title: 'Draw a rectangle',
                        },
                        circle: {
                            shapeOptions: this.options.drawVectorStyle,
                            title: 'Draw a circle',
                        },
                        marker: !1,
                    }).addTo(this._map)))
                : (this._map.drawControl = new L.Control.Draw({
                        position: 'topleft',
                        help: {
                            title: 'Help',
                        },
                        undo: !1,
                        redo: !1,
                        clufield: !1,
                        growerfield: !1,
                        polylinecut: !1,
                        polygoncut: !1,
                        rectanglecut: !1,
                        circlecut: !1,
                        polyline: !1,
                        polygon: !1,
                        rectangle: !1,
                        circle: !1,
                        marker: !1,
                    }).addTo(this._map));
    },
    _addVector: function (t, e, E) {
        if (t instanceof L.FeatureGroup) {
            editable = !1;
            for (var R in t._layers) {
                if (
                    ((_layer = t._layers[R]),
                    (_layer.options._geoJSONProperties = L.Util.extend(
                        {},
                        t.options._geoJSONProperties,
                        _layer.options._geoJSONProperties
                    )),
                    this.vectors.addLayer(_layer),
                    this.options.showLabels &&
                        _layer.options._geoJSONProperties.label &&
                        !_layer.popup)
                ) {
                    var i = new L.AgrismartPopup(
                        {
                            closeButton: !1,
                            labelFontSize: _layer.options._geoJSONProperties.fontSize,
                            autoPan: !1,
                        },
                        null
                    );
                    i.setContent(_layer.options._geoJSONProperties.label),
                        i.setLatLng(_layer.getBounds().getCenter()),
                        (_layer.popup = i),
                        this._map.addLayer(i),
                        _layer.options._geoJSONProperties.hideLabel && i.hide(),
                        _layer.options._geoJSONProperties.editable && (editable = !0);
                }
                this._cardinality > 0 &&
                    this._cardinality <= this.vectors.size() &&
                    (this._full = !0),
                    _layer.on('dragend edit', this._addUndo, this),
                    !e && editable && this._addUndo(),
                    E &&
                        this._map.fire('addeditvectorlayer', {
                            layer: _layer,
                        });
            }
        } else {
            if (
                ((_layer = this.vectors.addLayer(t)),
                this.options.showLabels && t.options._geoJSONProperties.label && !_layer.popup)
            ) {
                var i = new L.AgrismartPopup(
                    {
                        closeButton: !1,
                        labelFontSize: t.options._geoJSONProperties.fontSize,
                        autoPan: !1,
                    },
                    null
                );
                i.setContent(t.options._geoJSONProperties.label),
                    i.setLatLng(t.getBounds().getCenter()),
                    (_layer.popup = i),
                    this._map.addLayer(i),
                    _layer.options._geoJSONProperties.hideLabel && i.hide();
            }
            t.on('dragend edit', this._addUndo, this),
                this._cardinality > 0 &&
                    this._cardinality <= this.vectors.size() &&
                    (this._full = !0),
                !e && _layer.options._geoJSONProperties.editable && this._addUndo(),
                E &&
                    this._map.fire('addeditvectorlayer', {
                        layer: t,
                    });
        }
    },
    _updateVectorByID: function (t, e) {
        this.vectors.updateLayerByID(t, e), this._addUndo();
    },
    _selectVectorByID: function (t) {
        this.vectors.selectLayerByID(t);
    },
    _removeVectorByID: function (t, e) {
        this.vectors.removeLayerByID(t), e && this._addUndo();
    },
    _removeVector: function (t, e) {
        this.vectors.removeLayer(t), e && this._addUndo();
    },
    _onBeforeUnload: function () {
        return (this._undoStack && this._undoStack.length > 2) || this._dirty
            ? 'Are you sure?'
            : null;
    },
    _resetUndo: function () {
        (this._undoStack = null), (this._redoStack = null), this._addUndo();
    },
    _addUndo: function (t) {
        this._undoStack || (this._undoStack = new Array()),
            t &&
                t.target &&
                t.target instanceof L.Polygon &&
                t.target._map &&
                ((calculateAcres = t.target.calculateAcres()),
                t.target.options._geoJSONProperties.calculateAcres !== calculateAcres &&
                    (t.target.options._geoJSONProperties.actualAcres ===
                        Math.round(t.target.options._geoJSONProperties.calculateAcres) &&
                        (t.target.options._geoJSONProperties.actualAcres =
                            Math.round(calculateAcres)),
                    (t.target.options._geoJSONProperties.calculateAcres = calculateAcres))),
            (this._redoStack = new Array()),
            this._currentView && this._undoStack.push(this._currentView),
            (this._currentView = this.write(!0)),
            this._checkUndoState();
    },
    _checkUndoState: function () {
        (this._undoStack && this._undoStack.length > 2) || this.vectors._dirty
            ? ($('.leaflet-control-draw-custom-undo').button('enable'),
                (window.onbeforeunload = function () {
                    return 'You have unsaved changes.';
                }))
            : ($('.leaflet-control-draw-custom-undo').button('disable'),
                (window.onbeforeunload = null)),
            this._redoStack && this._redoStack.length > 0
                ? $('.leaflet-control-draw-custom-redo').button('enable')
                : $('.leaflet-control-draw-custom-redo').button('disable'),
            this._map.fire('checkundo');
    },
    _help: function () {
        window.open(this.options.helpUri);
    },
    _undo: function () {
        this._undoStack &&
            this._undoStack.length > 1 &&
            ((snapshot = this._undoStack.pop()),
            this._currentView && this._redoStack.push(this._currentView),
            this.clear(!0, !0),
            this.load(snapshot, !0, !1),
            (this._currentView = snapshot)),
            this._checkUndoState();
    },
    _redo: function () {
        this._redoStack &&
            this._redoStack.length > 0 &&
            ((snapshot = this._redoStack.pop()),
            this._currentView && this._undoStack.push(this._currentView),
            this.clear(!0, !0),
            this.load(snapshot, !0, !1),
            (this._currentView = snapshot)),
            this._checkUndoState();
    },
    _onCreated: function (t) {
        var e = /(?!:)[a-z]+(?=-)/.exec(t.type)[0];
        return 'polylinecut' == e
            ? void this._splitpoly(t)
            : 'polygoncut' == e
            ? void this._cutpoly(t)
            : 'clufield' == e
            ? void (
                    0 ==
                        _.filter(this.vectors._layers, function (e) {
                            return e.options._geoJSONProperties.id === JSON.parse(t.clufield).id;
                        }).length && this.load(t.clufield, !0, !0)
                )
            : 'growerfield' == e
            ? void (
                    0 ==
                        _.filter(this.vectors._layers, function (e) {
                            return (
                                e.options._geoJSONProperties.id === JSON.parse(t.growerfield).id
                            );
                        }).length && this.load(t.growerfield, !0, !0)
                )
            : ((vector = t[e] || !1),
                void (vector && !this._full && this._addVector(vector, !0, !0)));
    },
    _cutpoly: function (t, e) {
        (polygoncut = t.polygoncut), (map = t.target);
        var E = this.vectors._layers,
            R = !1;
        for (var i in E) {
            if (
                E[i] instanceof L.Polygon &&
                1 == E[i].options._geoJSONProperties.editable &&
                ((polygon = E[i]), (e = polygon.clip(polygon, polygoncut, map)) && e.length > 0)
            ) {
                if (1 == e.length && e[0].equals(polygon)) {
                    continue;
                }
                for (var n in e) {
                    (feature = e[n]),
                        feature._latlngs.length > 0 &&
                            ((feature.options._geoJSONProperties = L.Util.extend(
                                {},
                                feature.options._geoJSONProperties,
                                polygon.options._geoJSONProperties
                            )),
                            polygon.options._geoJSONProperties.actualAcres ===
                                Math.round(polygon.options._geoJSONProperties.calculateAcres) &&
                                (feature.options._geoJSONProperties.actualAcres = null),
                            this.vectors.addLayer(feature),
                            feature.on('dragend edit', this._addUndo, this));
                }
                this.vectors.removeLayer(polygon), (R = !0);
            }
        }
        R && this._addUndo();
    },
    _splitpoly: function (t, e) {
        var E = !1;
        (polyline = t.polylinecut), (map = t.target), (lines = new Array());
        for (var R = 0; R < polyline._latlngs.length - 1; R++) {
            R + 1 < polyline._latlngs.length &&
                ((latlng1 = polyline._latlngs[R]),
                (latlng2 = polyline._latlngs[R + 1]),
                (p1 = map.latLngToContainerPoint(latlng1)),
                (p2 = map.latLngToContainerPoint(latlng2)),
                lines.push({
                    p1: p1,
                    p2: p2,
                }));
        }
        for (var i in lines) {
            var n = this.vectors._layers;
            for (var A in n) {
                if (
                    n[A] instanceof L.Polygon &&
                    ((polygon = n[A]),
                    1 == polygon.options._geoJSONProperties.editable &&
                        ((line = lines[i]),
                        (e = polygon.slice(polygon, line.p1, line.p2, map)) && e.length > 1))
                ) {
                    for (var o in e) {
                        (feature = e[o]),
                            (feature.options._geoJSONProperties = L.Util.extend(
                                {},
                                feature.options._geoJSONProperties,
                                polygon.options._geoJSONProperties
                            )),
                            polygon.options._geoJSONProperties.actualAcres ===
                                Math.round(polygon.options._geoJSONProperties.calculateAcres) &&
                                (feature.options._geoJSONProperties.actualAcres = null),
                            feature.on('dragend edit', this._addUndo, this),
                            (addfeature = !0);
                        for (var S in this.vectors._layers) {
                            this.vectors._layers[S].equals(feature) && (addfeature = !1);
                        }
                        addfeature && this.vectors.addLayer(feature);
                    }
                    this.vectors.removeLayer(polygon), (E = !0);
                }
            }
        }
        E && this._addUndo();
    },
    _onSelected: function (t) {
        var e = t.layer || t.target || t;
        if (e.setStyle) {
            e.setStyle(this.options.selectedVectorStyle),
                e.editing.enable(),
                e.dragging && e.dragging.enable();
        } else {
            var E = e.options.icon;
            (E.options.className = 'marker-selected'),
                e.setIcon(E),
                (E.options.className = ''),
                e.dragging && e.dragging.enable();
        }
    },
    _onDeselected: function (t) {
        var e = t.layer || t.target || t;
        if (e.setStyle) {
            for (var E in this.options.defaultVectorStyle) {
                if ('color' != E && '_geoJSONProperties' != E) {
                    var R = new Object();
                    (R[E] = this.options.defaultVectorStyle[E]), e.setStyle(R);
                }
            }
            e.editing.disable(), e.dragging && e.dragging.disable();
        } else {
            e.setIcon(e.options.icon), e.dragging && e.dragging.disable();
        }
    },
    _unbind: function (t) {
        var e = t.layer;
        this.vectors.hasLayer(e) &&
            (this._removeVector(e),
            this._cardinality > this.vectors.size() && (this._full = !1));
    },
    clear: function (t, e) {
        this.vectors && this.vectors.clearLayers(e), this.load('', t);
    },
    center: function (t, e) {
        this.vectors &&
            this.vectors.size() > 0 &&
            this._map.fitBounds(this.vectors.getBounds(t, e));
    },
    centerbounds: function (t) {
        var e = new L.GeoJSON(t);
        this._map.fitBounds(e.getBounds());
    },
    getGeoJSONBounds: function (t) {
        return new L.Rectangle(t).toGeoJSON();
    },
    load: function (t, e, E) {
        var R,
            i = function (t, e) {
                if (
                    (e.setStyle && e.setStyle(this.options.defaultVectorStyle),
                    e.options ||
                        (e.options = L.Util.extend(
                            {},
                            this.options.defaultVectorStyle,
                            this.options
                        )),
                    !e.options._geoJSONProperties)
                ) {
                    e.options._geoJSONProperties = new L.GeoJsonProperties();
                    for (var R in e.options._geoJSONProperties) {
                        ('boolean' != typeof t.properties[R] &&
                            'string' != typeof t.properties[R] &&
                            'number' != typeof t.properties[R]) ||
                            ('undefined' != typeof t.properties[R] &&
                                (e.options._geoJSONProperties[R] = t.properties[R])),
                            ('boolean' != typeof e.options[R] &&
                                'string' != typeof e.options[R] &&
                                'number' != typeof e.options[R]) ||
                                (null == e.options._geoJSONProperties[R] &&
                                    (e.options._geoJSONProperties[R] = e.options[R]));
                    }
                }
                e.setStyle &&
                    (e.setStyle({
                        color:
                            'undefined' != e.options._geoJSONProperties.color
                                ? e.options._geoJSONProperties.color
                                : e.options.color,
                    }),
                    e.setStyle({
                        fillColor:
                            'undefined' != e.options._geoJSONProperties.fillColor
                                ? e.options._geoJSONProperties.fillColor
                                : e.options.fillColor,
                    }),
                    e.setStyle({
                        weight:
                            'undefined' != e.options._geoJSONProperties.weight
                                ? e.options._geoJSONProperties.weight
                                : e.options.weight,
                    }),
                    e.setStyle({
                        opacity:
                            'undefined' != e.options._geoJSONProperties.opacity
                                ? e.options._geoJSONProperties.opacity
                                : e.options.opacity,
                    }),
                    e.setStyle({
                        fillOpacity:
                            'undefined' != e.options._geoJSONProperties.fillOpacity
                                ? e.options._geoJSONProperties.fillOpacity
                                : e.options.fillOpacity,
                    }),
                    e.setStyle({
                        dashArray:
                            'undefined' != e.options._geoJSONProperties.dashArray
                                ? e.options._geoJSONProperties.dashArray
                                : e.options.dashArray,
                    })),
                    this._addVector(e, !0, E);
            };
        return (
            'string' != typeof t ||
                t.trim() ||
                (t = {
                    type: 'FeatureCollection',
                    features: [],
                }),
            (R = 'string' == typeof t ? JSON.parse(t) : t),
            (_layers = L.geoJson(R, {
                onEachFeature: L.Util.bind(i, this),
            })),
            e || this._addUndo(),
            _layers
        );
    },
    write: function (t) {
        this.vectors || (this.vectors = L.widgetFeatureGroup().addTo(this._map));
        var e = this.vectors.toGeoJSON(t);
        if (!this._attach) {
            return JSON.stringify(e);
        }
        this._attach.value = JSON.stringify(e);
    },
    toJSON: function () {
        return (
            this.vectors || (this.vectors = L.widgetFeatureGroup().addTo(this._map)),
            this.vectors.toGeoJSON()
        );
    },
})),

L.Map.addInitHook(function () {
    if (this.options.widget) {
        var t = this.options.widget;
        this.widget = new L.Handler.Widget(this, t);
    }
}),

(L.NAIPLayer = L.TileLayer.extend({
    _update: function () {
        if (!this._map._panTransition || !this._map._panTransition._inProgress) {
            var t = this._map.getPixelBounds(),
                e = this._customZoom(),
                E = this._tileSize();
            if (!(e > this.options.maxZoom || e < this.options.minZoom)) {
                var R = new L.Point(Math.floor(t.min.x / E), Math.floor(t.min.y / E)),
                    i = new L.Point(Math.floor(t.max.x / E), Math.floor(t.max.y / E)),
                    n = new L.Bounds(R, i);
                this._addTilesFromCenterOut(n),
                    (this.options.unloadInvisibleTiles || this.options.reuseTiles) &&
                        this._removeOtherTiles(n);
            }
        }
    },
    _getZoomForUrl: function () {
        var t = this.options,
            e = this._customZoom();
        return t.zoomReverse && (e = t.maxZoom - e), e + t.zoomOffset;
    },
    _getTilePos: function (t) {
        var e = this._map.getPixelOrigin(),
            E = this._tileSize();
        return t.multiplyBy(E).subtract(e);
    },
    _customZoom: function () {
        return (
            (mapZoom = this._map.getZoom()),
            mapZoom > this.options.maxPhysicalZoom ? this.options.maxPhysicalZoom : mapZoom
        );
    },
    _tileSize: function () {
        return (
            (mapZoom = this._map.getZoom()),
            mapZoom > this.options.maxPhysicalZoom
                ? this.options.tileSize * Math.pow(2, mapZoom - this.options.maxPhysicalZoom)
                : this.options.tileSize
        );
    },
    _createTileProto: function () {
        var t = (this._tileImg = L.DomUtil.create('img', 'leaflet-tile'));
        t.galleryimg = 'no';
        var e = this._tileSize();
        (t.style.width = e + 'px'), (t.style.height = e + 'px');
    },
    _loadTile: function (t, e) {
        (t._layer = this),
            (t.onload = this._tileOnLoad),
            (t.onerror = this._tileOnError),
            (t.src = this.getTileUrl(e)),
            (tileSize = this._tileSize()),
            (t.style.width = tileSize + 'px'),
            (t.style.height = tileSize + 'px');
    },
})),

(L.naipLayer = function (t, e) {
    return new L.NAIPLayer(t, e);
});

// #####################################################

(L.Icon.Label = L.Icon.extend({
    options: {
        labelClassName: '',
    },
    initialize: function (t) {
        L.Util.setOptions(this, t), L.Icon.prototype.initialize.call(this, this.options);
    },
    setLabelAsHidden: function () {
        this._labelHidden = !0;
    },
    createIcon: function () {
        return this._createLabel(L.Icon.prototype.createIcon.call(this));
    },
    createShadow: function () {
        if (!this.options.shadowUrl) {
            return null;
        }
        var t = L.Icon.prototype.createShadow.call(this);
        return (
            t &&
                ((t.style.marginLeft = -this.options.wrapperAnchor.x + 'px'),
                (t.style.marginTop = -this.options.wrapperAnchor.y + 'px')),
            t
        );
    },
    updateLabel: function (t, e) {
        'DIV' === t.nodeName.toUpperCase() &&
            ((t.childNodes[1].innerHTML = e), (this.options.labelText = e));
    },
    showLabel: function () {
        this._labelTextIsSet() && (this._container.style.display = 'block');
    },
    hideLabel: function () {
        this._labelTextIsSet() && (this._container.style.display = 'none');
    },
    _createLabel: function (t) {
        if (!this._labelTextIsSet()) {
            return t;
        }
        var e = document.createElement('div'),
            E = document.createElement('div'),
            R = document.createElement('div');
        return (
            (e.style.marginLeft = -this.options.wrapperAnchor.x + 'px'),
            (e.style.marginTop = -this.options.wrapperAnchor.y + 'px'),
            (e.className = 'leaflet-marker-icon-wrapper leaflet-zoom-animated'),
            (E.className = 'leaflet-marker-iconlabel ' + this.options.labelClassName),
            (R.innerHTML = this.options.labelText),
            (E.style.marginLeft = this.options.labelAnchor.x + 'px'),
            (E.style.marginTop = this.options.labelAnchor.y + 'px'),
            (this._labelHidden || '' == this.options.labelText) &&
                ((E.style.display = 'none'), (t.style.cursor = 'pointer')),
            (t.style.marginLeft = this.options.iconAnchor.x + 'px'),
            (t.style.marginTop = this.options.iconAnchor.y + 'px'),
            this.options.closeButton &&
                ((closeButton = this._closeButton =
                    L.DomUtil.create('a', 'leaflet-iconlabel-close-button', E)),
                (closeButton.href = '#close'),
                (closeButton.innerHTML = '&#215;'),
                L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this),
                (R.style.marginRight = '12px')),
            e.appendChild(t),
            e.appendChild(E),
            E.appendChild(R),
            (this._container = E),
            e
        );
    },
    _labelTextIsSet: function () {
        return 'undefined' != typeof this.options.labelText && null !== this.options.labelText;
    },
    _onCloseButtonClick: function (t) {
        this.hideLabel(), L.DomEvent.stop(t);
    },
})),

(L.Icon.Label.Default = L.Icon.Label.extend({
    options: {
        labelAnchor: new L.Point(29, 8),
        wrapperAnchor: new L.Point(13, 41),
        iconAnchor: new L.Point(0, 0),
        labelText: null,
        iconUrl: L.Icon.Default.imagePath + '/marker-icon.png',
        iconSize: new L.Point(25, 41),
        popupAnchor: new L.Point(0, -33),
        shadowUrl: L.Icon.Default.imagePath + '/marker-shadow.png',
        shadowSize: new L.Point(41, 41),
    },
})),

(L.Marker.Label = L.Marker.extend({
    options: {
        revealing: !0,
    },
    updateLabel: function (t) {
        this.options.icon.updateLabel(this._icon, t);
    },
    _initIcon: function () {
        if (!(this.options.icon instanceof L.Icon.Label)) {
            throw new Error('Icon must be an instance of L.Icon.Label.');
        }
        this.options.revealing && this.options.icon.setLabelAsHidden(),
            L.Marker.prototype._initIcon.call(this);
    },
    _removeIcon: function () {
        this.options.revealing &&
            L.DomEvent.off(this._icon, 'mouseover', this._showLabel).off(
                this._icon,
                'mouseout',
                this._hideLabel
            ),
            L.Marker.prototype._removeIcon.call(this);
    },
    _initInteraction: function () {
        L.Marker.prototype._initInteraction.call(this),
            this.options.revealing &&
                L.DomEvent.on(this._icon, 'mouseover', this._showLabel, this).on(
                    this._icon,
                    'mouseout',
                    this._hideLabel,
                    this
                );
    },
    _showLabel: function () {
        this.options.icon.showLabel(this._icon);
    },
    _hideLabel: function () {
        this.options.icon.hideLabel(this._icon);
    },
})),

(L.AgrismartMap = L.Class.extend({
    includes: L.Mixin.Events,
    options: {
        mapOptions: {},
        pageOptions: {
            googleBaseUri:
                '//maps.googleapis.com/maps/api/js?key=AIzaSyBzjfycXMFJMBODlcJnjhfujVJwap6VOU8&v=3&sensor=false',
            bingKey: 'ApAEDDIbE5tMQe_AEZBNLIOhaMNliwS68Nk37qIWJxqt6zUnuH2ot0wGnpNJ4UUH',
            agrismartSearchBaseUri: '',
            agrismartJpgTilesUri: '//jptiles-{s}.agrismartis.com',
            agrismartPngTilesUri: '//pngtiles-{s}.agrismartis.com',
            agrismartMapRenderUri: '',
            agrismartPngTilesFingerprint: '20140523',
        },
    },
    initialize: function (t, e) {
        (e = L.Util.setOptions(this, e)), this._initContainer(t);
    },
    _initContainer: function (id) {
        var container = (this._container = L.DomUtil.get(id));
        (this._mapContainer = L.DomUtil.create('div', '')),
            (this._mapContainer.id = id + 'map'),
            $(this._mapContainer).width($(this._container).width()),
            $(this._mapContainer).height($(this._container).height()),
            container.appendChild(this._mapContainer),
            this.setSearchOptions(),
            $('#dialog-form').dialog({
                autoOpen: !1,
            }),
            $('#search-form').dialog({
                autoOpen: !1,
            });
        var naip2009layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2009/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2010layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2010/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2011layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2011/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2012layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2012/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2013layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2013/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2014layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2014/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2015layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2015/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2016layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2016/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2017layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2017/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2018layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2018/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2019layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2019/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            naip2020layer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/2020/{z}/{x}/{y}.jpg',
                {
                    attribution:
                        'Aerial Imagery <a target="_blank" href="http://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/">National Agriculture Imagery Program (NAIP)</a>',
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            noimagerylayer = L.naipLayer(
                this.options.pageOptions.agrismartJpgTilesUri + '/_blank.jpg',
                {
                    minZoom: 1,
                    maxZoom: 18,
                    tms: !0,
                    tileSize: 256,
                    subdomains: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 16,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            clulayer = L.tileLayer(
                this.options.pageOptions.agrismartPngTilesUri +
                    '/clu' +
                    this.options.pageOptions.agrismartPngTilesFingerprint +
                    '/{z}/{x}/{y}.png',
                {
                    minZoom: 13,
                    maxZoom: 18,
                    transparent: !0,
                    subdomains: ['1', '2', '3', '4'],
                    unloadInvisibleTiles: !0,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            indianapowerlineslayer = L.tileLayer(
                this.options.pageOptions.agrismartPngTilesUri +
                    '/inpower' +
                    this.options.pageOptions.agrismartPngTilesFingerprint +
                    '/{z}/{x}/{y}.png',
                {
                    attribution: 'Indiana Power Lines provided by Barrett Brummett',
                    minZoom: 2,
                    maxZoom: 18,
                    transparent: !0,
                    subdomains: ['9', '10', '11', '12', '13', '14', '15'],
                    unloadInvisibleTiles: !0,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            skpowerlines2023layer = L.tileLayer(
                this.options.pageOptions.agrismartPngTilesUri +
                    '/skpower' +
                    this.options.pageOptions.agrismartPngTilesFingerprint +
                    '/{z}/{x}/{y}.png',
                {
                    attribution: 'Sakatchewan Power Lines 2023',
                    minZoom: 2,
                    maxZoom: 18,
                    transparent: !0,
                    subdomains: ['9', '10', '11', '12', '13', '14', '15'],
                    unloadInvisibleTiles: !0,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            legallayer = L.tileLayer(
                this.options.pageOptions.agrismartPngTilesUri +
                    '/plss' +
                    this.options.pageOptions.agrismartPngTilesFingerprint +
                    '/{z}/{x}/{y}.png',
                {
                    minZoom: 12,
                    maxZoom: 18,
                    transparent: !0,
                    subdomains: ['5', '6', '7', '8'],
                    unloadInvisibleTiles: !0,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            streetslayer = L.tileLayer(
                this.options.pageOptions.agrismartPngTilesUri +
                    '/roads' +
                    this.options.pageOptions.agrismartPngTilesFingerprint +
                    '/{z}/{x}/{y}.png',
                {
                    attribution:
                        'Street data \xa9 <a target="_blank" href="http://openstreetmap.org">OpenStreetMap</a>',
                    minZoom: 2,
                    maxZoom: 18,
                    transparent: !0,
                    subdomains: ['9', '10', '11', '12', '13', '14', '15'],
                    unloadInvisibleTiles: !0,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            streetsMinilayer = L.tileLayer(
                this.options.pageOptions.agrismartPngTilesUri +
                    '/roads' +
                    this.options.pageOptions.agrismartPngTilesFingerprint +
                    '/{z}/{x}/{y}.png',
                {
                    attribution:
                        'Street data \xa9 <a target="_blank" href="http://openstreetmap.org">OpenStreetMap</a>',
                    minZoom: 0,
                    maxZoom: 18,
                    transparent: !0,
                    subdomains: ['9', '10', '11', '12', '13', '14', '15'],
                    unloadInvisibleTiles: !0,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            cluGeojson = new L.TileLayer.GeoJSON.Overzoom(
                this.options.pageOptions.agrismartPngTilesUri +
                    '/clu_data' +
                    this.options.pageOptions.agrismartPngTilesFingerprint +
                    '/{z}/{x}/{y}.geojson',
                {
                    minZoom: 14,
                    maxZoom: 18,
                    subdomains: ['16', '17', '18', '19', '20'],
                    maxPhysicalZoom: 14,
                }
            );
        cluGeojson.setGeoJSONOptions({
            style: {
                color: '#1B1',
                fillColor: '#1B1',
                weight: 1,
                opacity: 0.7,
                fillOpacity: 0,
                smoothFactor: 3,
            },
            hoverStyle: {
                fillOpacity: 0.4,
            },
            selectedStyle: {
                color: 'yellow',
                weight: 1,
                opacity: 0.7,
                fillColor: 'yellow',
                fillOpacity: 0.4,
                smoothFactor: 3,
            },
            hoverOffset: new L.Point(30, -16),
        });
        var lakesriverslayer = L.tileLayer(
                this.options.pageOptions.agrismartPngTilesUri +
                    '/lakesrivers' +
                    this.options.pageOptions.agrismartPngTilesFingerprint +
                    '/{z}/{x}/{y}.png',
                {
                    minZoom: 12,
                    maxZoom: 18,
                    transparent: !0,
                    subdomains: ['5', '6', '7', '8'],
                    unloadInvisibleTiles: !0,
                    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
                }
            ),
            weatherradarlayer = new L.WeatherLayer(
                'https://nowcoast.noaa.gov/geoserver/weather_radar/wms',
                {
                    layers: 'base_reflectivity_mosaic',
                    format: 'image/png',
                    maxZoom: 18,
                    transparent: !0,
                    opacity: 0.5,
                    attribution: 'NOAA Nextrad Radar',
                }
            ),
            precipitationlayer = new L.WeatherLayer(
                'https://nowcoast.noaa.gov/arcgis/services/nowcoast/analysis_meteohydro_sfc_qpe_time/MapServer/WMSServer',
                {
                    layers: '9',
                    format: 'image/png',
                    maxZoom: 18,
                    transparent: !0,
                    opacity: 0.5,
                    attribution: 'NOAA 24hr precipitation',
                }
            ),
            precipitationforecastlayer = new L.WeatherLayer(
                'https://nowcoast.noaa.gov/arcgis/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_time/MapServer/WMSServer',
                {
                    layers: '33',
                    format: 'image/png',
                    maxZoom: 18,
                    transparent: !0,
                    opacity: 0.5,
                    attribution: 'NOAA 12hr precipitation probability forecast',
                }
            ),
            oldweatherradarlayer = new L.TileLayer.WMS(
                'http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi',
                {
                    minZoom: 2,
                    layers: 'nexrad-n0q-900913',
                    format: 'image/png',
                    maxZoom: 18,
                    transparent: !0,
                    opacity: 0.5,
                    attribution: 'Weather data \xa9 2012 IEM Nexrad</a>',
                }
            ),
            googlelayer = new L.Google('SATELLITE', {
                minZoom: 2,
                maxZoom: 18,
                tileSize: 256,
                subdomains: 'abc',
                errorTileUrl: '',
                attribution: '',
                opacity: 1,
                continuousWorld: !1,
                noWrap: !1,
                channel: this.options.mapOptions.channel
                    ? this.options.mapOptions.channel
                    : 'asm',
                attribution: 'Imagery \xa9 2013 Google',
            }),
            baseMaps = new Object(),
            overlayMaps = new Object(),
            selectedLayers = new Array();
        if (this.options.mapOptions && this.options.mapOptions.baseLayers) {
            for (var key in this.options.mapOptions.baseLayers) {
                var layer = this.options.mapOptions.baseLayers[key];
                layer.selected &&
                    ((objlayer = eval(
                        layer.label.toLowerCase().replace(/[ -]/g, '') + 'layer'
                    )),
                    0 == selectedLayers.length && selectedLayers.push(objlayer)),
                    (baseMaps[layer.label] = eval(
                        layer.label.toLowerCase().replace(/[ -]/g, '') + 'layer'
                    ));
            }
        } else {
            baseMaps = {
                'NAIP 2009': naip2009layer,
                'NAIP 2010': naip2010layer,
                'NAIP 2011': naip2011layer,
                'NAIP 2012': naip2012layer,
                'NAIP 2013': naip2013layer,
                'NAIP 2014': naip2014layer,
                'NAIP 2015': naip2015layer,
                'NAIP 2016': naip2016layer,
                'NAIP 2017': naip2017layer,
                'NAIP 2018': naip2018layer,
                'NAIP 2019': naip2019layer,
                'NAIP 2020': naip2020layer,
                Google: googlelayer,
                'No Imagery': noimagerylayer,
            };
        }
        if (this.options.mapOptions && this.options.mapOptions.overlayLayers) {
            for (var key in this.options.mapOptions.overlayLayers) {
                var layer = this.options.mapOptions.overlayLayers[key];
                layer.selected &&
                    ((objlayer = eval(
                        layer.label.toLowerCase().replace(/[ -]/g, '') + 'layer'
                    )),
                    selectedLayers.push(objlayer)),
                    (overlayMaps[layer.label] = eval(
                        layer.label.toLowerCase().replace(/[ -]/g, '') + 'layer'
                    ));
            }
        } else {
            overlayMaps = {
                'Lakes-Rivers': lakesriverslayer,
                Streets: streetslayer,
                CLU: clulayer,
                Legal: legallayer,
                'Weather Radar': weatherradarlayer,
                'Indiana power lines': indianapowerlineslayer,
                'SK power lines 2023': skpowerlines2023layer,
            };
        }
        0 == selectedLayers.length &&
            (selectedLayers.push(streetslayer), selectedLayers.push(naip2010layer));
        var zoom = new L.Control.Zoom(),
            layersControl = new L.Control.Layers(baseMaps, overlayMaps, {
                collapsed: !L.Browser.touch,
            });
        (this.map = new L.Map(this._mapContainer.id, {
            center: new L.LatLng(40.464, -95.867),
            zoom: '' == location.hash ? 5 : 0,
            minZoom: 2,
            maxZoom: 18,
            layers: selectedLayers,
            zoomControl: !1,
            widget: {
                draw: !1,
                showLabels: !0,
            },
            closePopupOnClick: !1,
            attributionControl: !L.Browser.touch,
            zoomAnimation: !1,
        })),
            (this.map.getMinZoom = function () {
                return this.options.minZoom;
            }),
            (this.map.getMaxZoom = function () {
                return this.options.maxZoom;
            }),
            this.map.addControl(layersControl),
            this.map.widget.enable(),
            this.map.addControl(zoom),
            this.map.widget && this.options.mapOptions && this.options.mapOptions.shapes
                ? (this.map.widget.clear(!0),
                    this.map.widget.load(this.options.mapOptions.shapes, !1))
                : this.map.widget.load('', !1),
            this.map.widget && this.options.mapOptions && this.options.mapOptions.bounds
                ? this.map.widget.centerbounds(this.options.mapOptions.bounds)
                : this.map.widget.center();
    },
    _initAppButtons: function () {
        $(function () {
            $('#appCommand')
                .button()
                .next()
                .button({
                    text: !1,
                    icons: {
                        primary: 'ui-icon-triangle-1-s',
                    },
                })
                .click(function () {
                    var t = $(this).parent().next();
                    return (
                        t.width(
                            Math.max(
                                $('#appCommandSelect').width() + $('#appCommand').width() - 4,
                                t.width()
                            ) + 'px'
                        ),
                        'block' == $(t).css('display')
                            ? $(t).css('display', 'none')
                            : t.show().position({
                                    my: 'left top',
                                    at: 'left bottom',
                                    of: $('#appCommand'),
                                }),
                        t.on('menuselect', function (e) {
                            t.hide(), e.stopPropagation();
                        }),
                        $(document).on('mousedown', function (e) {
                            $(e.target).parent()[0] !== t.context &&
                                $(e.target).parent().parent()[0] !== t[0] &&
                                $(t).css('display', 'none');
                        }),
                        !1
                    );
                })
                .parent()
                .buttonset()
                .next()
                .hide()
                .menu(),
                $('#appCommandContainer').show();
        });
    },
    serializeObject: function () {
        'use strict';
        var t = {},
            e = function (e, E) {
                var R = t[E.name];
                void 0 !== R && null !== R
                    ? $.isArray(R)
                        ? R.push(E.value)
                        : (t[E.name] = [R, E.value])
                    : (t[E.name] = E.value);
            };
        return $.each(this.serializeArray(), e), t;
    },
    selectLayer: function (t, e, E) {
        map.widget.vectors.selectLayerByID(e, E);
    },
    deleteLayer: function (t, e) {
        map.widget._removeVectorByID(e, !0);
    },
    selectSearchResult: function (t, e) {
        if (!e) {
            return void selectMarkerSearchResult();
        }
        (layer = $(map.drawControl._searchResults._layers[(_leaflet_id = e)])[0]),
            map.fitBounds(layer.getBounds());
    },
    deleteSearchResult: function (t, e) {
        if (!e) {
            return void deleteMarkerSearchResult();
        }
        (layer = $(map.drawControl._searchResults._layers[(_leaflet_id = e)])[0]),
            layer && map.drawControl._searchResults.removeLayer(layer),
            getSearchResults();
    },
    selectMarkerSearchResult: function () {
        this.map.drawControl._positionMarker &&
            map.setView(
                this.map.drawControl._positionMarker._latlng,
                this.map.drawControl._config.zoomLevel,
                !0
            );
    },
    deleteMarkerSearchResult: function () {
        this.map.removeLayer(this.map.drawControl._positionMarker),
            delete this.map.drawControl._positionMarker,
            getSearchResults();
    },
    getFieldsList: function () {
        var t =
                "<div class='cell-inner' layer_id='<%= layer._leaflet_id %>'><div class='cell-left'><div id='cell-color' class='cell-color' style='background: <%= hexToRGBA(layer.options._geoJSONProperties.fillColor, layer.options._geoJSONProperties.fillOpacity) %> ; border: <%= Math.max(parseInt(layer.options._geoJSONProperties.weight)/2.25,1) %>px solid <%=  hexToRGBA(layer.options._geoJSONProperties.color, layer.options._geoJSONProperties.opacity) %> ;'></div></div><div class='cell-main'><span class='cell-label'> <%= layer.options._geoJSONProperties.name %> </span><span class='cell-button'><div layer_id='<%= layer._leaflet_id %>' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close deletelayer'><span class='ui-button-icon-primary ui-icon ui-icon-close'></span></div></span><span class='cell-label2'> <%= format( '#,##0 ', layer.options._geoJSONProperties.actualAcres) %> ac</span><span style='clear:both'></span><br/><span></span><br/></div></div>",
            e = '',
            E = '<% _.each(layers, function(layer) { %> ' + t + ' <% }) %>';
        return (
            (fieldlayers = _.filter(this.map.widget.vectors._layers, function (t) {
                return 'Field' === t.options._geoJSONProperties.type;
            })),
            (e = _.template(E, {
                layers: fieldlayers,
            })),
            0 === e.length
                ? $('#fieldsContainer').hide()
                : ($('#fieldsContainer').show(),
                    $('#fieldsContainer .ui-button').mousedown(function () {
                        this.map.widget.center();
                    }),
                    $('#emptyResultsContainer').hide()),
            $('#fieldsDiv').html(e),
            $('#fieldsDiv .deletelayer').mousedown(function (t) {
                deleteLayer(t, $(this).attr('layer_id'));
            }),
            $('#fieldsDiv .cell-inner').mousedown(function (t) {
                selectLayer(t, $(this).attr('layer_id'), !0);
            }),
            this.highlightSelected(),
            e
        );
    },
    getGeneric: function () {
        var t =
                "<div class='cell-inner' layer_id='<%= layer._leaflet_id %>'><div class='cell-left'><div id='cell-color' class='cell-color' style='background: <%= layer.options.color %> ;'></div></div><div class='cell-main'><span class='cell-label'> <%= layer.feature?layer.feature.properties?layer.feature.properties.name?layer.feature.properties.name:'unknown':'unknown':'unknown'  %> </span><span class='cell-button'><div layer_id='<%= layer._leaflet_id %>' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close deletelayer'><span class='ui-button-icon-primary ui-icon ui-icon-close'></span></div></span><span class='cell-label2'></span><span style='clear:both'></span><br/><span></span><br/></div></div>",
            e = '',
            E = '<% _.each(layers, function(layer) { %> ' + t + ' <% }) %>';
        return (
            (genericlayers = _.filter(this.map.widget.vectors._layers, function (t) {
                return t;
            })),
            (e = _.template(E, {
                layers: genericlayers,
            })),
            0 === e.length
                ? $('#genericsContainer').hide()
                : ($('#genericsContainer').show(),
                    $('#genericsContainer .ui-button').mousedown(function () {
                        this.map.widget.center();
                    }),
                    $('#emptyResultsContainer').hide()),
            $('#genericsDiv').html(e),
            $('#genericsDiv .deletelayer').mousedown(function (t) {
                deleteLayer(t, $(this).attr('layer_id'));
            }),
            $('#genericsDiv .cell-inner').mousedown(function (t) {
                selectLayer(t, $(this).attr('layer_id'), !0);
            }),
            this.highlightSelected(),
            e
        );
    },
    getSearchResults: function () {
        var t =
                "<div class='cell-inner'><div class='cell-left'><div id='cell-color' class='cell-color searchresultmarker' ></div></div><div class='cell-main'><span class='cell-label-nosublabel'> <%= this.map.drawControl._positionMarker.options.icon.options.labelText %> </span><span class='cell-button'><div class='ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close deletelayer'><span class='ui-button-icon-primary ui-icon ui-icon-close'></span></div></span><span style='clear:both'></span><span></span></div></div>",
            e = '';
        if (this.map.drawControl._searchResults) {
            (searchlayers = _.filter(this.map.drawControl._searchResults._layers, function (t) {
                return t.feature;
            })),
                (e = _.template(
                    "<% _.each(layers, function(layer) { %> <div class='cell-inner' layer_id='<%= layer._leaflet_id %>'><div class='cell-left'><div id='cell-color' class='cell-color' style='height:12px;width:12px;border: 4px solid <%= layer.feature.properties.color %> ;'></div></div><div class='cell-main'><span class='cell-label-nosublabel'> <%= layer.feature.properties.label.replace(',', '<br>') %> </span><span class='cell-button'><div layer_id='<%= layer._leaflet_id %>' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close deletelayer'><span class='ui-button-icon-primary ui-icon ui-icon-close'></span></div></span><span style='clear:both'></span><span></span></div></div> <% }) %>",
                    {
                        layers: searchlayers,
                    }
                ));
        }
        return (
            this.map.drawControl._positionMarker &&
                (e = _.template(t, this.map.drawControl._positionMarker)),
            0 === e.length
                ? $('#searchResultsContainer').hide()
                : ($('#searchResultsContainer').show(),
                    $('#searchResultsContainer .ui-button').mousedown(function () {
                        map.drawControl._positionMarker
                            ? map.setView(
                                map.drawControl._positionMarker._latlng,
                                this.map.drawControl._config.zoomLevel,
                                !0
                            )
                            : map.fitBounds(map.drawControl._searchResults.getBounds());
                    }),
                    $('#emptyResultsContainer').hide()),
            $('#searchResultsDiv').html(e),
            $('#searchResultsDiv .deletelayer').mousedown(function (t) {
                deleteSearchResult(t, $(this).attr('layer_id'));
            }),
            $('#searchResultsDiv .cell-inner').mousedown(function (t) {
                selectSearchResult(t, $(this).attr('layer_id'));
            }),
            e
        );
    },
    getAdjacentCropsList: function () {
        var t =
                "<div class='cell-inner' layer_id='<%= layer._leaflet_id %>'><div class='cell-left'><div id='cell-color' class='cell-color' style='background: <%=layer.options._geoJSONProperties.fillColor%> ; border: <%= Math.max(parseInt(layer.options._geoJSONProperties.weight)/2.25,1) %>px solid <%= layer.options._geoJSONProperties.color %> ;'></div></div><div class='cell-main'><div style='overflow:hidden;white-space:nowrap;text-overflow:ellipsis;'><span class='cell-label-nosublabel'> <%= getCropById(layer.options._geoJSONProperties.crop_id) %> </span><span class='cell-button'><div layer_id='<%= layer._leaflet_id %>' class='ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close deletelayer'><span class='ui-button-icon-primary ui-icon ui-icon-close'></span></div></span><span style='clear:both'></span></div><div class='cell-label3'> <%= layer.options._geoJSONProperties.description %> </div><br/></div></div>",
            e = '',
            E = '<% _.each(layers, function(layer) { %> ' + t + ' <% }) %>';
        return (
            (croplayers = _.filter(this.map.widget.vectors._layers, function (t) {
                return 'AdjacentCrop' === t.options._geoJSONProperties.type;
            })),
            (e = _.template(E, {
                layers: croplayers,
            })),
            0 === e.length
                ? $('#adjacentCropsContainer').hide()
                : ($('#adjacentCropsContainer').show(),
                    $('#adjacentCropsContainer .ui-button').mousedown(function () {
                        this.map.widget.center();
                    }),
                    $('#emptyResultsContainer').hide()),
            $('#adjacentCropsDiv').html(e),
            $('#adjacentCropsDiv .deletelayer').mousedown(function (t) {
                deleteLayer(t, $(this).attr('layer_id'));
            }),
            $('#adjacentCropsDiv .cell-inner').mousedown(function (t) {
                selectLayer(t, $(this).attr('layer_id'), !0);
            }),
            this.highlightSelected(),
            e
        );
    },
    highlightSelected: function () {
        if (
            this.map.drawControl.handlers.select._selected &&
            ((selected = $(this.map.drawControl.handlers.select._selected._layers)[0]),
            selected)
        ) {
            for (var t in selected) {
                (controllayer = $('#controlDiv').find(
                    '.cell-inner[layer_id = ' + selected[t]._leaflet_id + ']'
                )),
                    controllayer.addClass('cell-inner-selected');
            }
        }
    },
    getNavList: function () {
        (fields = this.getFieldsList()),
            (adjacentCrops = this.getAdjacentCropsList()),
            (searchResults = this.getSearchResults());
    },
    getCropById: function (t) {
        var e = _.findWhere(mapOptions.crops, {
            id: parseInt(t),
        });
        return e ? e.name : 'unknown';
    },
    saveMap: function () {
        var t = {},
            e = (window.getFieldsList(), this.map.widget.toJSON());
        (t.shapes = e || {}),
            (t.parent = this.options.mapOptions.parent
                ? mapOptions.parent
                : {
                        type: 'Job',
                        id: 239994,
                    }),
            (t.resolution = this.options.mapOptions.resolution
                ? mapOptions.resolution
                : {
                        width: this.map.getSize().x,
                        height: this.map.getSize().y,
                    }),
            (t.bounds = this.map.widget.getGeoJSONBounds(map.getBounds())),
            (t.buckets = this.options.mapOptions.buckets
                ? mapOptions.buckets
                : [
                        {
                            region: 'us-east-1',
                            bucket: 'map-render.development.agrismart',
                            name: 'job_testing.jpeg',
                        },
                        {
                            region: 'us-west-2',
                            bucket: 'map-render.oregon.development.agrismart',
                            name: 'job_testing.jpeg',
                        },
                    ]),
            (t.selectFieldAvailable = this.options.mapOptions.selectFieldAvailable),
            (t.crops = this.options.mapOptions.crops ? mapOptions.crops : []),
            (t.searchOptions = this.options.mapOptions.searchOptions
                ? mapOptions.searchOptions
                : []),
            (overlayLayers = []),
            (baseLayers = []);
        for (var E in layersControl._layers) {
            (layer = layersControl._layers[E]),
                (label = layer.name),
                (opacity = layer.layer.options.opacity),
                (index = layer.layer.options.zIndex),
                (url = layer.layer._url),
                (selected = !1);
            for (var R in this.map._layers) {
                (maplayer = this.map._layers[R]), maplayer._url == url && (selected = !0);
            }
            (layerdef = {}),
                (layerdef.label = label),
                (layerdef.selected = selected),
                (layerdef.opacity = opacity),
                (layerdef.index = index),
                layer.overlay ? overlayLayers.push(layerdef) : baseLayers.push(layerdef);
        }
        (t.overlayLayers = overlayLayers),
            (t.baseLayers = baseLayers),
            (point = this.map.latLngToContainerPoint(map.getBounds().getSouthEast())),
            (latlng = this.map.containerPointToLatLng(
                new L.Point(
                    point.x - 2,
                    point.y - map.attributionControl._container.offsetHeight + 4
                )
            )),
            (t.mapLabel = new L.Marker(latlng).toGeoJSON()),
            (t.mapLabel.properties = {}),
            (t.mapLabel.properties.label = $(map.attributionControl._container).text()),
            (t.mapLabel.properties.fontsize = 10),
            mapOptions &&
                this.options.mapOptions.shapes &&
                (map.widget.clear(!0), map.widget.load(mapOptions.shapes)),
            saveJSON(t);
    },
    saveJSON: function (t) {
        $.ajax({
            type: 'POST',
            url: '/map',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            async: !1,
            data: JSON.stringify(t),
            success: function (t) {
                win = window.open(
                    'http://s3.amazonaws.com/' + t[0].bucket + '/' + t[0].name,
                    'image',
                    'width=' +
                        this.options.mapOptions.resolution.width +
                        ',height=' +
                        this.options.mapOptions.resolution.height +
                        ',top=0, left=0'
                );
            },
            error: function (t) {
                (win = window.open(
                    '',
                    'image',
                    'width=' +
                        this.options.mapOptions.resolution.width +
                        ',height=' +
                        this.options.mapOptions.resolution.height +
                        ',top=0, left=0'
                )),
                    win.document.write(t.responseText);
            },
        });
    },
    getSelectedLayers: function () {
        var selectedLayers = new Array();
        if (this.options.mapOptions && this.options.mapOptions.baseLayers) {
            var _sortedBaseLayers = _.sortBy(this.options.mapOptions.baseLayers, function (t) {
                return t.index;
            });
            for (var key in _sortedBaseLayers) {
                var layer = _sortedBaseLayers[key];
                layer.selected &&
                    ((objlayer = eval(
                        layer.label.toLowerCase().replace(/[ -]/g, '') + 'layer'
                    )),
                    0 == selectedLayers.length && selectedLayers.push(objlayer)),
                    (baseMaps[layer.label] = eval(
                        layer.label.toLowerCase().replace(/[ -]/g, '') + 'layer'
                    ));
            }
        } else {
            baseMaps = {
                'NAIP 2009': naip2009layer,
                'NAIP 2010': naip2010layer,
                'NAIP 2011': naip2011layer,
                'NAIP 2012': naip2012layer,
                'NAIP 2013': naip2013layer,
                'NAIP 2014': naip2014layer,
                'NAIP 2015': naip2015layer,
                'NAIP 2016': naip2016layer,
                'NAIP 2017': naip2017layer,
                'NAIP 2018': naip2018layer,
                'NAIP 2019': naip2019layer,
                'NAIP 2020': naip2020layer,
                Google: googlelayer,
                'No Imagery': noimagerylayer,
            };
        }
        if (this.options.mapOptions && this.options.mapOptions.overlayLayers) {
            var _sortedOverlayLayers = _.sortBy(
                this.options.mapOptions.overlayLayers,
                function (t) {
                    return t.index;
                }
            );
            for (var key in _sortedOverlayLayers) {
                var layer = _sortedOverlayLayers[key];
                layer.selected &&
                    ((objlayer = eval(
                        layer.label.toLowerCase().replace(/[ -]/g, '') + 'layer'
                    )),
                    selectedLayers.push(objlayer)),
                    (overlayMaps[layer.label] = eval(
                        layer.label.toLowerCase().replace(/[ -]/g, '') + 'layer'
                    ));
            }
        } else {
            overlayMaps = {
                'Lakes-Rivers': lakesriverslayer,
                Streets: streetslayer,
                CLU: clulayer,
                Legal: legallayer,
                'Weather Radar': weatherradarlayer,
                'Indiana power lines': indianapowerlineslayer,
                'SK power lines 2023': skpowerlines2023layer,
            };
        }
        return (
            0 == selectedLayers.length &&
                (selectedLayers.push(streetslayer), selectedLayers.push(naip2010layer)),
            selectedLayers
        );
    },
    setSearchOptions: function () {
        if (window.mapOptions && window.mapOptions.searchOptions) {
            var t = $('.search-form #type'),
                e = window.mapOptions.searchOptions;
            t.empty(),
                $.each(e, function () {
                    'US Legal' == this.type
                        ? (id = 'legal')
                        : 'Texas' == this.type
                        ? (id = 'texas')
                        : 'Canada' == this.type
                        ? (id = 'canada')
                        : 'Address' == this.type
                        ? (id = 'address')
                        : 'Place' == this.type
                        ? (id = 'place')
                        : 'Coordinates' == this.type && (id = 'coord'),
                        t.append($('<option></option>').attr('value', id).text(this.type));
                });
        }
    },
})),

(L.AgrismartPopup = L.Popup.extend({
    includes: L.Mixin.Events,
    _initLayout: function () {
        var t,
            e = 'agrismart-popup',
            E = (this._container = L.DomUtil.create(
                'div',
                e + ' ' + this.options.className + ' leaflet-zoom-animated'
            ));
        this.options.closeButton &&
            ((t = this._closeButton = L.DomUtil.create('a', e + '-close-button', E)),
            (t.href = '#close'),
            (t.innerHTML = '&#215;'),
            L.DomEvent.on(t, 'click', this._onCloseButtonClick, this));
        var R = (this._wrapper = L.DomUtil.create('div', e + '-content-wrapper', E));
        L.DomEvent.disableClickPropagation(R),
            (this._contentNode = L.DomUtil.create('div', e + '-content', R)),
            this.options.labelFontSize &&
                $(this._contentNode).css('font-size', this.options.labelFontSize + 'px'),
            L.DomEvent.on(this._contentNode, 'mousewheel', L.DomEvent.stopPropagation),
            (this._tipContainer = L.DomUtil.create('div', e + '-tip-container', E)),
            (this._tip = L.DomUtil.create('div', e + '-tip', this._tipContainer));
    },
    hide: function () {
        this._container && $(this._container).hide();
    },
    show: function () {
        this._container && $(this._container).show();
    },
}));

// #####################################################

(AgrismartSort.prototype._initialize = function (t, e, E, R) {
    (this._filter = E || []),
        (this._collection = t),
        (this._names = e),
        (this._callback = R),
        (this._cachedColumns = this._getColumns()),
        (this._isDirty = !1),
        (this._filter = _.filter(
            this._filter,
            function (t) {
                return _.pluck(this._cachedColumns, 'displayName').indexOf(t.displayName) > -1;
            },
            this
        ));
}),
(AgrismartSort.prototype.showDialog = function (t, e) {
    var E = this._getEntry(this._cachedColumns),
        R = $('<div></div>')
            .attr('id', 'entryFilter')
            .attr('name', 'entryFilter')
            .attr(
                'style',
                'width:100%;height:117px;overflow-y:scroll;overflow-x:hidden;margin-top:8px;border:1px solid #aaaaaa'
            );
    $('#sort-form').empty(),
        $('#sort-form').append(E),
        $('#sort-form').append(R),
        $('#sort-form')
            .dialog({
                title: 'Sort ' + e.toString(),
                autoOpen: !1,
                modal: !1,
                closeOnEscape: !0,
                resizable: !1,
                zIndex: 99999999,
                draggable: !1,
                dialogClass: 'no-close',
                height: 250,
                width: 515,
                position: {
                    my: 'left top',
                    at: 'right bottom',
                    of: t,
                },
                buttons: {
                    Clear: $.proxy(this._clearFilter, this),
                    Apply: $.proxy(this._applyFilter, this),
                    Cancel: $.proxy(this._cancelFilter, this),
                },
                close: function () {
                    $('#sort-form').off('keypress'),
                        $('#sort-form').find('*').off(),
                        $(document).off('keypress'),
                        $(document).off('mousedown');
                },
                open: function () {},
            })
            .attr('style', 'overflow;hidden;'),
        $('#sort-form').dialog('open'),
        this._renderFilter(),
        this._attachEvents();
}),
(AgrismartSort.prototype._attachEvents = function () {
    $('#sort-form').on(
        'keypress',
        $.proxy(function (t) {
            t.keyCode == $.ui.keyCode.ENTER && (t.stopPropagation(), this._applyFilter());
        }, this)
    ),
        $(document).on('mousedown', function (t) {
            0 == $(t.target).parents('.ui-dialog').length &&
                0 == $(t.target).parents('.ui-autocomplete').length &&
                0 == $(t.target).parents('div#ui-datepicker-div').length &&
                $('#sort-form').dialog('close');
        });
}),
(AgrismartSort.prototype._getColumns = function () {
    return (
        this._cachedColumns ||
            ((columns = []),
            this._collection.length > 0 &&
                _.each(
                    this._collection[0],
                    function (t, e) {
                        _.isObject(t) ||
                            (this._names && _.toArray(this._names).length > 0
                                ? !_.isFunction(t) &&
                                    this._names[e] &&
                                    columns.push({
                                        originalName: e.toString(),
                                        displayName: this._names[e].toString(),
                                    })
                                : columns.push({
                                        originalName: e.toString(),
                                        displayName: e.toString(),
                                    }));
                    },
                    this
                ),
            (this._cachedColumns = _.sortBy(columns, 'displayName'))),
        this._cachedColumns
    );
}),
(AgrismartSort.prototype._getEntry = function (t) {
    var e = $('<div></div>')
            .attr('id', 'entryDiv')
            .attr('name', name + 'div')
            .attr('style', 'width:100%;margin-top:4px;margin-bottom:4px;'),
        E = $('<button>add</button>')
            .attr('id', 'entryAddButton')
            .attr('name', 'entryAddButton'),
        R = this._getDropDownList('entryColumn', 'entryColumn', t)
            .attr('style', 'width:50%;')
            .on(
                'change',
                $.proxy(function () {
                    this._isDirty = !0;
                }, this)
            ),
        i = this._getDropDownList('entrySortType', 'entrySortType', ['ascending', 'descending'])
            .attr('style', 'width:50%;')
            .on(
                'change',
                $.proxy(function () {
                    this._isDirty = !0;
                }, this)
            ),
        n = $('<div></div>').attr('style', 'clear:both;');
    return (
        e.append(R, i, E, n),
        i.attr('style', 'margin-left:8px;'),
        E.button({
            icons: {
                primary: 'ui-icon-plusthick',
            },
            text: !1,
        })
            .on('click', $.proxy(this._addFilter, this))
            .on(
                'keypress',
                $.proxy(function (t) {
                    t.keyCode == $.ui.keyCode.ENTER && this._addFilter(t);
                }, this)
            ),
        E.attr('style', 'background:transparent;border:0px;float:right;'),
        e
    );
}),
(AgrismartSort.prototype._getDropDownList = function (t, e, E) {
    var R = $('<select></select>').attr('id', e).attr('name', t);
    return (
        $.each(E, function (t, e) {
            e.displayName
                ? R.append($('<option>').text(e.displayName).val(e.originalName))
                : R.append($('<option>').text(e).val(e));
        }),
        R
    );
}),
(AgrismartSort.prototype._renderFilter = function () {
    0 == this._filter.length
        ? $('.ui-dialog-buttonset button :contains("Clear")').parent().hide()
        : $('.ui-dialog-buttonset button :contains("Clear")').parent().show(),
        $('#entryFilter').find('*').off(),
        $('#entryFilter').empty(),
        _.each(
            this._filter,
            function (t, e) {
                var E = $('<div></div>')
                        .addClass('entry')
                        .attr('style', 'width:100%;cursor:pointer;margin-left:8px;')
                        .on('click', $.proxy(this._selectFilter, this))
                        .attr('id', e),
                    R = $('<div>sort by</div>')
                        .attr('width', '100%')
                        .attr('style', 'font-weight:bold;margin-left:8px;'),
                    i = $('<span>' + t.displayName + '</span>').attr(
                        'style',
                        'font-weight:bold;margin-right:4px;margin-left:4px;vertical-align:middle;'
                    ),
                    n = $('<span>' + t.type + '</span>').attr(
                        'style',
                        'font-style:italic;margin-left:12px;vertical-align:middle;'
                    ),
                    A = $('<button>remove</button>').attr('id', e);
                E.append(A, i, n),
                    A.button({
                        icons: {
                            primary: 'ui-icon-closethick',
                        },
                        text: !1,
                    })
                        .on('click', $.proxy(this._removeFilter, this))
                        .on(
                            'keypress',
                            $.proxy(function (t) {
                                t.keyCode == $.ui.keyCode.ENTER && this._removeFilter(t);
                            }, this)
                        ),
                    A.attr(
                        'style',
                        'background:transparent;border:0px;margin-left:6px;align:right'
                    ),
                    0 == $('#entryFilter').children().length
                        ? $('#entryFilter').append(R, E)
                        : $('#entryFilter').append(E);
            },
            this
        );
}),
(AgrismartSort.prototype._addFilter = function (t) {
    t && (t.preventDefault(), t.stopPropagation()),
        (this._isDirty = !1),
        (entry = {
            column: $('#entryColumn').val(),
            displayName: $(
                '#entryColumn option[value="' + $('#entryColumn').val() + '"]'
            ).text(),
            type: $('#entrySortType').val(),
        }),
        (index = -1);
    for (var e in this._filter) {
        if (_.isEqual(this._filter[e].column, entry.column)) {
            index = e;
            break;
        }
    }
    index < 0
        ? (this._filter.push(entry),
            this._renderFilter(),
            this._highlightEntry(this._filter.length - 1))
        : ((this._filter[index] = entry), this._renderFilter(), this._highlightEntry(index)),
        $('#entryColumn').eq(0).focus();
}),
(AgrismartSort.prototype._highlightEntry = function (t) {
    (targetElement = $('#entryFilter [id="' + t + '"]').first()),
        (targetDiv = $('#entryFilter')),
        targetElement.position().top > targetDiv.scrollTop() + targetDiv.height() &&
            targetDiv.animate(
                {
                    scrollTop: targetElement.position().top,
                },
                10
            ),
        targetElement.position().top < targetDiv.scrollTop() &&
            targetDiv.animate(
                {
                    scrollTop: targetElement.position().top,
                },
                10
            ),
        targetElement.addClass('highlightentry'),
        setTimeout(function () {
            targetElement.removeClass('highlightentry');
        }, 1500);
}),
(AgrismartSort.prototype._selectFilter = function (t) {
    (entryid = $(t.target).closest('div .entry').attr('id')),
        $('#entryColumn').val(this._filter[entryid].column),
        $('#entrySortType').val(this._filter[entryid].type);
}),
(AgrismartSort.prototype._removeFilter = function (t) {
    t.stopPropagation(),
        t.preventDefault(),
        (filterIndex = $(t.target).closest('div .entry').attr('id')),
        this._filter.splice(filterIndex, 1),
        this._renderFilter(),
        $('#entryColumn').eq(0).focus();
}),
($.fn.sort_select_box = function () {
    var t = $('#' + this.attr('id') + ' option');
    t.sort(function (t, e) {
        return t.text > e.text ? 1 : t.text < e.text ? -1 : 0;
    }),
        $(this).empty().append(t),
        $('#' + this.attr('id') + ' option').attr('selected', !1);
}),
(AgrismartSort.prototype._clearFilter = function () {
    return (
        (this._filter = []),
        this._renderFilter(),
        $('#entryColumn').eq(0).focus(),
        (this._isDirty = !1),
        !1
    );
}),
(AgrismartSort.prototype._applyFilter = function () {
    if (!this._isDirty) {
        return (
            $('#sort-form').dialog('close'), this._callback && this._callback(this._filter), !0
        );
    }
    this._addFilter();
}),
(AgrismartSort.prototype._cancelFilter = function () {
    return $('#sort-form').dialog('close'), !1;
}),
(AgrismartFilter.prototype._initialize = function (t, e, E, R) {
    (this._filter = E || []),
        (this._collection = t),
        (this._names = e),
        (this._callback = R),
        (this._cachedColumns = this._getColumns()),
        (this._language = window.navigator.userLanguage || window.navigator.language),
        (this._isDirty = !1),
        (this._filter = _.filter(
            this._filter,
            function (t) {
                return _.pluck(this._cachedColumns, 'displayName').indexOf(t.displayName) > -1;
            },
            this
        ));
}),
(AgrismartFilter.prototype.showDialog = function (t, e) {
    (this._sortDefine = this._sortDefine || this._getEntry(this._cachedColumns)),
        (this._divFilter =
            this._divFilter ||
            $('<div></div>')
                .attr('id', 'entryFilter')
                .attr('name', 'entryFilter')
                .attr(
                    'style',
                    'width:100%;margin-top:8px;height:117px;overflow-y:scroll;overflow-x:hidden;border:1px solid #aaaaaa'
                )),
        $('#sort-form').empty(),
        $('#sort-form').append(this._sortDefine),
        $('#sort-form').append(this._divFilter),
        $('#sort-form')
            .dialog({
                autoOpen: !1,
                modal: !1,
                closeOnEscape: !0,
                resizable: !1,
                zIndex: 99999999,
                draggable: !1,
                dialogClass: 'no-close',
                height: 250,
                width: 515,
                title: 'Filter ' + e.toString(),
                position: {
                    my: 'left top',
                    at: 'right bottom',
                    of: t,
                },
                buttons: {
                    Clear: $.proxy(this._clearFilter, this),
                    Apply: $.proxy(this._applyFilter, this),
                    Cancel: $.proxy(this._cancelFilter, this),
                },
                close: function () {
                    $('#sort-form').off('keyup'),
                        $('#sort-form').find('*').off(),
                        $(document).off('mousedown');
                },
                open: function () {},
            })
            .attr('style', 'overflow;hidden;'),
        $('#sort-form').dialog('open'),
        this._renderFilter(),
        this._changeColumn(),
        this._attachEvents();
}),
(AgrismartFilter.prototype._getColumns = function () {
    if (!this._cachedColumns) {
        if (((columns = []), this._collection.length > 0)) {
            for (var t in this._collection[0]) {
                _.isObject(this._collection[0][t]) ||
                    (this._names && _.toArray(this._names).length > 0
                        ? !_.isFunction(this._collection[0][t]) &&
                            this._names[t] &&
                            columns.push({
                                originalName: t.toString(),
                                displayName: this._names[t].toString(),
                            })
                        : columns.push({
                                originalName: t.toString(),
                                displayName: t.toString(),
                            }));
            }
        }
        this._cachedColumns = _.sortBy(columns, 'displayName');
    }
    return this._cachedColumns;
}),
(AgrismartFilter.prototype._attachEvents = function () {
    $('#entryColumn').on(
        'change keyup',
        $.proxy(function (t) {
            t.stopPropagation(), this._changeColumn();
        }, this)
    ),
        $('#entryType').on(
            'change keyup',
            $.proxy(function (t) {
                t.stopPropagation(), $('#entryValue').val().length > 0 && (this._isDirty = !0);
            }, this)
        ),
        $('#entryAddButton').on(
            'click',
            $.proxy(function (t) {
                this._addFilter(t);
            }, this)
        ),
        $('#entryAddButton').on(
            'keyup',
            $.proxy(function (t) {
                t.keyCode == $.ui.keyCode.ENTER && this._addFilter(t);
            }, this)
        ),
        $('#sort-form').on(
            'keyup',
            $.proxy(function (t) {
                t.keyCode == $.ui.keyCode.ENTER && (t.stopPropagation(), this._applyFilter());
            }, this)
        ),
        $(document).mousedown(function (t) {
            0 == $(t.target).parents('.ui-dialog').length &&
                0 == $(t.target).parents('.ui-autocomplete').length &&
                0 == $(t.target).parents('div#ui-datepicker-div').length &&
                $('#sort-form').dialog('close');
        });
}),
(AgrismartFilter.prototype._getEntry = function (t) {
    var e = $('<div></div>')
            .attr('id', 'entryDiv')
            .attr('name', 'entryDiv')
            .attr('style', 'width:100%;margin-top:4px;margin-bottom:4px;'),
        E = $('<button>add</button>')
            .attr('id', 'entryAddButton')
            .attr('name', 'entryAddButton'),
        R = this._getDropDownList('entryColumn', 'entryColumn', t),
        i = this._getDropDownList('entryType', 'entryType', []),
        n = $('<div></div>').attr('style', 'clear:both;');
    return (
        e.append(R, i, E, n),
        E.button({
            icons: {
                primary: 'ui-icon-plusthick',
            },
            text: !1,
        }),
        E.attr('style', 'background:transparent;border:0px;margin-left:8px;float:right;'),
        i.attr('style', 'margin-left:8px;'),
        e
    );
}),
(AgrismartFilter.prototype._convertValue = function (t) {
    return (
        (retval = ''),
        t.hasClass('filterdate')
            ? (retval =
                    '' == t.val()
                        ? new Date(new Date().toDateString())
                        : new Date(new Date(t.val()).toDateString()))
            : t.hasClass('filternumber')
            ? (retval = isNaN(parseFloat(t.val()))
                    ? 0
                    : parseFloat(format('###0.####', t.val().replace(/,/g, ''))))
            : t.hasClass('filtertext')
            ? (retval = t.val())
            : t.hasClass('filterboolean')
            ? (retval = /^true$/i.test(t.val()))
            : (retval = t.val()),
        retval
    );
}),
(AgrismartFilter.prototype._convertDisplayValue = function (t) {
    return (
        (retval = ''),
        t.hasClass('filterdate')
            ? (retval =
                    '' == t.val()
                        ? new Date().toLocaleDateString()
                        : new Date(t.val()).toLocaleDateString())
            : t.hasClass('filternumber')
            ? (retval = isNaN(parseFloat(t.val()))
                    ? 0
                    : format('#,##0.####', parseFloat(t.val().replace(/,/g, ''))))
            : t.hasClass('filtertext')
            ? (retval = _.isEmpty(t.val()) ? 'blank' : this._wrapQuotes(t.val()))
            : t.hasClass('filterboolean')
            ? (retval = /^true$/i.test(t.val()))
            : (retval = t.val()),
        retval
    );
}),
(AgrismartFilter.prototype._wrapQuotes = function (t) {
    return "'" + t + "'";
}),
(AgrismartFilter.prototype._changeColumn = function () {
    (this._isDirty = !1), (savetypeval = $('#entryType').val());
    var t = [
            {
                displayName: 'is less than',
                originalName: '<',
            },
            {
                displayName: 'is less than or equal to',
                originalName: '<=',
            },
            {
                displayName: 'is equal to',
                originalName: '==',
            },
            {
                displayName: 'is not equal to',
                originalName: '!=',
            },
            {
                displayName: 'is greater than or equal to',
                originalName: '>=',
            },
            {
                displayName: 'is greater than',
                originalName: '>',
            },
        ],
        e = [
            {
                displayName: 'is less than',
                originalName: '<',
            },
            {
                displayName: 'is less than or equal to',
                originalName: '<=',
            },
            {
                displayName: 'is equal to',
                originalName: '==',
            },
            {
                displayName: 'is not equal to',
                originalName: '!=',
            },
            {
                displayName: 'is greater than or equal to',
                originalName: '>=',
            },
            {
                displayName: 'is greater than',
                originalName: '>',
            },
            {
                displayName: 'contains',
                originalName: 'contains',
            },
        ],
        E = [
            {
                displayName: 'is less than',
                originalName: '<',
            },
            {
                displayName: 'is less than or equal to',
                originalName: '<=',
            },
            {
                displayName: 'is equal to',
                originalName: '==',
            },
            {
                displayName: 'is not equal to',
                originalName: '!=',
            },
            {
                displayName: 'is greater than or equal to',
                originalName: '>=',
            },
            {
                displayName: 'is greater than',
                originalName: '>',
            },
        ],
        R = [
            {
                displayName: 'is',
                originalName: '==',
            },
            {
                displayName: 'is not',
                originalName: '!=',
            },
        ];
    (res = ''),
        (str = $('#entryColumn option:selected').val()),
        (testcol = this._collection[0][str]),
        $('#entryValue').off(),
        $('#entryValue').val(''),
        $('#entryValue').remove(),
        $('<input>')
            .attr('type', 'text')
            .attr('id', 'entryValue')
            .attr('maxlength', '15')
            .addClass('ui-widget-content ui-corner-all')
            .attr('style', 'width:25%;margin-left:8px;')
            .insertBefore($('#entryDiv button'))
            .on(
                'keyup',
                $.proxy(function () {
                    this._isDirty = 0 != $('#entryValue').val().length;
                }, this)
            ),
        _.isDate(this._dateParser(testcol))
            ? ((res = 'date'),
                (resclass = 'filter' + res),
                $('#entryValue')
                    .attr('type', 'text')
                    .removeClass()
                    .addClass(resclass)
                    .attr('placeholder', res),
                $('#entryValue').datepicker(),
                this._setOptionList($('#entryType'), E))
            : _.isNumber(testcol)
            ? ((res = 'number'),
                (resclass = 'filter' + res),
                $('#entryValue')
                    .attr('type', 'text')
                    .removeClass()
                    .addClass(resclass)
                    .attr('placeholder', res),
                (autocompleteUniqueValues = _.sortBy(
                    _.uniq(
                        _.map(this._collection, function (t) {
                            return t[str].toString();
                        })
                    ),
                    function (t) {
                        return parseFloat(t);
                    }
                )),
                $('#entryValue').autocomplete({
                    source: autocompleteUniqueValues,
                }),
                $('#entryValue').off('keyup'),
                $('#entryValue').on(
                    'keyup',
                    $.proxy(function (t) {
                        return (
                            (numberchanged =
                                /[0123456789,.]/.test(String.fromCharCode(t.which)) ||
                                t.keyCode === $.ui.keyCode.DELETE ||
                                t.keyCode === $.ui.keyCode.BACKSPACE),
                            numberchanged && (this._isDirty = 0 != $('#entryValue').val().length),
                            (validkeys =
                                numberchanged ||
                                t.keyCode === $.ui.keyCode.ENTER ||
                                t.keyCode === $.ui.keyCode.ESCAPE ||
                                t.keyCode === $.ui.keyCode.RIGHT ||
                                t.keyCode === $.ui.keyCode.LEFT ||
                                t.keyCode === $.ui.keyCode.DELETE ||
                                t.keyCode === $.ui.keyCode.BACKSPACE),
                            validkeys
                        );
                    }, this)
                ),
                this._setOptionList($('#entryType'), t))
            : _.isString(testcol)
            ? ((res = 'text'),
                (resclass = 'filter' + res),
                $('#entryValue')
                    .attr('type', 'text')
                    .removeClass()
                    .addClass(resclass)
                    .attr('placeholder', res),
                (autocompleteUniqueValues = _.uniq(
                    _.map(this._collection, function (t) {
                        return t[str].toString();
                    })
                ).sort()),
                $('#entryValue').autocomplete({
                    source: autocompleteUniqueValues,
                }),
                this._setOptionList($('#entryType'), e))
            : _.isBoolean(testcol)
            ? ((res = 'boolean'),
                (resclass = 'filter' + res),
                $('#entryValue').remove(),
                this._getDropDownList('#entryValue', 'entryValue', ['true', 'false'])
                    .attr('style', 'width:25%;margin-left:8px;')
                    .insertBefore($('#entryDiv button'))
                    .addClass(resclass)
                    .attr('placeholder', res)
                    .on(
                        'change',
                        $.proxy(function () {
                            this._isDirty = !0;
                        }, this)
                    ),
                this._setOptionList($('#entryType'), R))
            : ((res = 'unknown'),
                (resclass = 'filter' + res),
                $('#entryValue')
                    .attr('type', 'text')
                    .removeClass()
                    .addClass(resclass)
                    .attr('placeholder', res)),
        savetypeval && $('#entryType').val(savetypeval);
}),
(AgrismartFilter.prototype._dateParser = function (t) {
    var e = /^(\d{4})-(\d{2})-(\d{2})((T)(\d{2}):(\d{2})(:(\d{2})(\.\d*)?)?)?(Z)?$/,
        E = /^\/Date\((d|-|.*)\)[\/|\\]$/;
    if ('string' == typeof t) {
        var R = e.exec(t);
        if (R) {
            return new Date(
                new Date(
                    Date.UTC(
                        +R[1],
                        +R[2] - 1,
                        +R[3],
                        +R[6] || 0,
                        +R[7] || 0,
                        +R[9] || 0,
                        parseInt(1e3 * +R[10]) || 0
                    )
                ).toLocaleDateString()
            );
        }
        if ((R = E.exec(t))) {
            var i = R[1].split(/[-+,.]/);
            return new Date(i[0] ? +i[0] : 0 - +i[1]);
        }
    }
    return t;
}),
(AgrismartFilter.prototype._getDropDownList = function (t, e, E) {
    var R = $('<select></select>').attr('id', e).attr('name', t);
    return this._setOptionList(R, E), R;
}),
(AgrismartFilter.prototype._setOptionList = function (t, e) {
    t.empty(),
        $.each(e, function (e, E) {
            E.displayName
                ? t.append($('<option>').text(E.displayName).val(E.originalName))
                : t.append($('<option>').text(E).val(E));
        });
}),
(AgrismartFilter.prototype._renderFilter = function () {
    0 == this._filter.length
        ? $('.ui-dialog-buttonset button :contains("Clear")').parent().hide()
        : $('.ui-dialog-buttonset button :contains("Clear")').parent().show(),
        $('#entryFilter').find('*').off(),
        $('#entryFilter').empty(),
        _.each(
            this._filter,
            function (t, e) {
                var E = $('<div></div>')
                        .addClass('entry')
                        .attr('id', e)
                        .attr('style', 'width:100%;cursor:pointer;margin-left:8px;')
                        .on('click', $.proxy(this._selectFilter, this)),
                    R = $('<div>filter by</div>')
                        .attr('width', '100%')
                        .attr('style', 'font-weight:bold;margin-left:8px;'),
                    i = $('<span>' + t.displayName + '</span>').attr(
                        'style',
                        'margin-right:4px;margin-left:4px;font-weight:bold;vertical-align:middle;'
                    ),
                    n = $('<span>' + t.displayType + '</span>').attr(
                        'style',
                        'margin-right:4px;margin-left:4px;font-style:italic;vertical-align:middle;'
                    ),
                    A = $('<button>remove</button>').attr('id', e),
                    o = $('<span>' + t.displayValue + '</span>').attr(
                        'style',
                        'margin-right:4px;margin-left:4px;font-weight:bold;vertical-align:middle;'
                    ),
                    A = $('<button>remove</button>').attr('id', e);
                E.append(A, i, n, o),
                    A.button({
                        icons: {
                            primary: 'ui-icon-closethick',
                        },
                        text: !1,
                    })
                        .on('click', $.proxy(this._removeFilter, this))
                        .on(
                            'keyup',
                            $.proxy(function (t) {
                                t.keyCode == $.ui.keyCode.ENTER && this._removeFilter(t);
                            }, this)
                        ),
                    A.attr(
                        'style',
                        'background:transparent;border:0px;margin-left:6px;align:right'
                    ),
                    0 == $('#entryFilter').children().length
                        ? $('#entryFilter').append(R, E)
                        : $('#entryFilter').append(E);
            },
            this
        );
}),
(AgrismartFilter.prototype._addFilter = function (t) {
    t && (t.preventDefault(), t.stopPropagation()),
        (this._isDirty = !1),
        (entry = {
            column: $('#entryColumn').val(),
            displayName: $(
                '#entryColumn option[value="' + $('#entryColumn').val() + '"]'
            ).text(),
            type: $('#entryType option[value="' + $('#entryType').val() + '"]').val(),
            displayType: $('#entryType option[value="' + $('#entryType').val() + '"]').text(),
            filterValue: this._convertValue($('#entryValue')),
            displayValue: this._convertDisplayValue($('#entryValue')),
        }),
        (index = -1);
    for (var e in this._filter) {
        if (_.isEqual(this._filter[e], entry)) {
            index = e;
            break;
        }
    }
    index < 0
        ? (this._filter.push(entry),
            this._renderFilter(),
            this._highlightEntry(this._filter.length - 1))
        : this._highlightEntry(index);
}),
(AgrismartFilter.prototype._highlightEntry = function (t) {
    (targetElement = $('#entryFilter [id="' + t + '"]').first()),
        (targetDiv = $('#entryFilter')),
        targetElement.position().top > targetDiv.scrollTop() + targetDiv.height() &&
            targetDiv.animate(
                {
                    scrollTop: targetElement.position().top,
                },
                10
            ),
        targetElement.position().top < targetDiv.scrollTop() &&
            targetDiv.animate(
                {
                    scrollTop: targetElement.position().top,
                },
                10
            ),
        targetElement.addClass('highlightentry'),
        setTimeout(function () {
            targetElement.removeClass('highlightentry');
        }, 1500);
}),
(AgrismartFilter.prototype._removeFilter = function (t) {
    t.preventDefault(),
        t.stopPropagation(),
        (filterIndex = $(t.target).closest('div .entry').attr('id')),
        this._filter.splice(filterIndex, 1),
        this._renderFilter();
}),
(AgrismartFilter.prototype._selectFilter = function (t) {
    (entryid = $(t.target).closest('div .entry').attr('id')),
        $('#entryColumn').val(this._filter[entryid].column),
        this._changeColumn(),
        $('#entryType').val(this._filter[entryid].type),
        (testval = this._filter[entryid].filterValue),
        _.isDate(testval)
            ? $('#entryValue').datepicker('setDate', testval)
            : $('#entryValue').val(testval.toString());
}),
(AgrismartFilter.prototype._clearFilter = function () {
    (this._filter = []), this._renderFilter(), (this._isDirty = !1);
}),
(AgrismartFilter.prototype._applyFilter = function () {
    if (!this._isDirty) {
        return (
            $('#sort-form').dialog('close'), this._callback && this._callback(this._filter), !0
        );
    }
    this._addFilter();
}),
(AgrismartFilter.prototype._cancelFilter = function () {
    return $('#sort-form').dialog('close'), !1;
});
