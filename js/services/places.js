const PlacesService = {
    service: null,

    init(map) {
        this.service = new google.maps.places.PlacesService(map);
    },

    /**
     * Find transit stations near a location
     * @param {Object} location - {lat, lng}
     * @param {number} radius - Search radius in meters
     * @returns {Promise} Array of transit stations
     */
    async findTransitStations(location, radius = 2000) {
        const types = ['transit_station', 'subway_station', 'bus_station', 'train_station'];
        const allResults = [];

        for (const type of types) {
            try {
                const results = await this.nearbySearch(location, radius, type);
                allResults.push(...results);
            } catch (e) {
                console.warn(`No ${type} found`);
            }
        }

        // Deduplicate by place_id
        const unique = [...new Map(allResults.map(r => [r.place_id, r])).values()];
        return unique;
    },

    nearbySearch(location, radius, type) {
        return new Promise((resolve, reject) => {
            this.service.nearbySearch(
                {
                    location: new google.maps.LatLng(location.lat, location.lng),
                    radius: radius,
                    type: type
                },
                (results, status) => {
                    if (status === 'OK') {
                        resolve(results.map(r => ({
                            place_id: r.place_id,
                            name: r.name,
                            location: {
                                lat: r.geometry.location.lat(),
                                lng: r.geometry.location.lng()
                            },
                            type: type,
                            rating: r.rating || 0
                        })));
                    } else if (status === 'ZERO_RESULTS') {
                        resolve([]);
                    } else {
                        reject(new Error(status));
                    }
                }
            );
        });
    }
};