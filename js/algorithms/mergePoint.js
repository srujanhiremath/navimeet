const MergePointCalculator = {

    /**
     * Calculate optimal merge point for group
     * @param {Array} participants - Array of {id, name, location: {lat, lng}, mode: string}
     * @param {Object} destination - {lat, lng}
     * @returns {Promise} Best merge point with routes
     */
    async calculate(participants, destination) {
        // Step 1: Find centroid of all participant locations
        const centroid = this.calculateCentroid(participants.map(p => p.location));
        
        // Step 2: Find transit hubs near centroid
        const searchRadius = this.calculateSearchRadius(participants, centroid);
        const transitHubs = await PlacesService.findTransitStations(centroid, searchRadius);
        
        // Step 3: Add centroid as candidate (for car-only scenarios)
        const candidates = [
            { name: 'Geographic Center', location: centroid, type: 'centroid' },
            ...transitHubs
        ];

        // Step 4: Score each candidate
        const scoredCandidates = await this.scoreCandidates(candidates, participants, destination);
        
        // Step 5: Return top 3 options
        return scoredCandidates.slice(0, 3);
    },

    calculateCentroid(locations) {
        const sum = locations.reduce(
            (acc, loc) => ({ lat: acc.lat + loc.lat, lng: acc.lng + loc.lng }),
            { lat: 0, lng: 0 }
        );
        return {
            lat: sum.lat / locations.length,
            lng: sum.lng / locations.length
        };
    },

    calculateSearchRadius(participants, centroid) {
        // Max distance from any participant to centroid
        let maxDist = 0;
        participants.forEach(p => {
            const dist = Helpers.haversineDistance(p.location, centroid);
            if (dist > maxDist) maxDist = dist;
        });
        return Math.min(maxDist * 0.5, 5000); // Cap at 5km
    },

    async scoreCandidates(candidates, participants, destination) {
        const scored = [];

        for (const candidate of candidates) {
            // Get travel times from all participants to this candidate
            const origins = participants.map(p => p.location);
            const matrix = await DistanceMatrixService.getMatrix(
                origins,
                [candidate.location],
                'driving' // Use driving for initial calculation
            );

            // Calculate times to candidate
            const timesToCandidate = matrix.map((row, i) => ({
                participant: participants[i],
                duration: row[0].duration,
                distance: row[0].distance
            }));

            // Get time from candidate to destination (transit)
            const toDestMatrix = await DistanceMatrixService.getMatrix(
                [candidate.location],
                [destination],
                'transit'
            );

            const timeToDestination = toDestMatrix[0][0].duration;

            // Calculate score
            const totalTime = timesToCandidate.reduce((sum, t) => sum + t.duration, 0);
            const maxTime = Math.max(...timesToCandidate.map(t => t.duration));
            const avgTime = totalTime / participants.length;

            // Lower score = better
            const score = (CONFIG.WEIGHTS.TIME * avgTime) + 
                         (CONFIG.WEIGHTS.EQUITY * maxTime) +
                         (timeToDestination * 0.5);

            scored.push({
                ...candidate,
                score,
                avgTimeToHub: avgTime,
                maxTimeToHub: maxTime,
                timeToDestination,
                participantRoutes: timesToCandidate
            });
        }

        // Sort by score (ascending)
        return scored.sort((a, b) => a.score - b.score);
    }
};