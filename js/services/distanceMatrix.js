const DistanceMatrixService = {
    service: null,

    init() {
        this.service = new google.maps.DistanceMatrixService();
    },

    /**
     * Get distances from multiple origins to multiple destinations
     * @param {Array} origins - Array of {lat, lng} objects
     * @param {Array} destinations - Array of {lat, lng} objects
     * @param {string} mode - Travel mode (driving, transit, walking, bicycling)
     * @returns {Promise} Matrix of distances and durations
     */
    async getMatrix(origins, destinations, mode = 'driving') {
        return new Promise((resolve, reject) => {
            this.service.getDistanceMatrix(
                {
                    origins: origins.map(o => new google.maps.LatLng(o.lat, o.lng)),
                    destinations: destinations.map(d => new google.maps.LatLng(d.lat, d.lng)),
                    travelMode: google.maps.TravelMode[mode.toUpperCase()],
                    transitOptions: mode === 'transit' ? {
                        departureTime: new Date(),
                        modes: ['BUS', 'RAIL', 'SUBWAY', 'TRAIN', 'TRAM']
                    } : undefined
                },
                (response, status) => {
                    if (status === 'OK') {
                        resolve(this.parseResponse(response));
                    } else {
                        reject(new Error(`Distance Matrix failed: ${status}`));
                    }
                }
            );
        });
    },

    parseResponse(response) {
        const results = [];
        response.rows.forEach((row, i) => {
            results[i] = [];
            row.elements.forEach((element, j) => {
                results[i][j] = {
                    distance: element.distance ? element.distance.value : null, // meters
                    duration: element.duration ? element.duration.value : null, // seconds
                    status: element.status
                };
            });
        });
        return results;
    }
};