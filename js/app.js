let map;
let markers = [];
let participants = [];
let destination = null;

function initApp() {
    // Initialize map
    map = new google.maps.Map(document.getElementById('map'), {
        center: CONFIG.DEFAULT_CENTER,
        zoom: CONFIG.DEFAULT_ZOOM
    });

    // Initialize services
    DistanceMatrixService.init();
    PlacesService.init(map);
    DirectionsService.init();

    // Setup UI handlers
    setupEventListeners();
}

function setupEventListeners() {
    // Mode selector
    document.querySelectorAll('#mode-selector button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#mode-selector button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            switchMode(e.target.dataset.mode);
        });
    });

    // Add participant
    document.getElementById('add-participant').addEventListener('click', addParticipant);

    // Calculate merge
    document.getElementById('calculate-merge').addEventListener('click', calculateMerge);
}

function switchMode(mode) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`${mode}-panel`).classList.add('active');
    clearMap();
}

function addParticipant() {
    const id = Date.now();
    const div = document.createElement('div');
    div.className = 'participant-entry';
    div.innerHTML = `
        <input type="text" placeholder="Name" data-id="${id}" data-field="name">
        <input type="text" placeholder="Location" data-id="${id}" data-field="location" class="location-input">
        <select data-id="${id}" data-field="mode">
            <option value="driving">Car/Bike</option>
            <option value="transit">Public Transit</option>
            <option value="walking">Walking</option>
        </select>
        <button onclick="removeParticipant(${id})">X</button>
    `;
    document.getElementById('participants-list').appendChild(div);
    
    // Initialize autocomplete
    const locationInput = div.querySelector('.location-input');
    new google.maps.places.Autocomplete(locationInput);
}

function removeParticipant(id) {
    document.querySelector(`[data-id="${id}"]`).closest('.participant-entry').remove();
}

async function calculateMerge() {
    // Gather participants
    const entries = document.querySelectorAll('.participant-entry');
    participants = [];
    
    for (const entry of entries) {
        const name = entry.querySelector('[data-field="name"]').value;
        const locationText = entry.querySelector('[data-field="location"]').value;
        const mode = entry.querySelector('[data-field="mode"]').value;
        
        // Geocode location
        const location = await geocodeAddress(locationText);
        if (location) {
            participants.push({ id: Date.now(), name, location, mode });
        }
    }

    // Geocode destination
    const destText = document.getElementById('destination').value;
    destination = await geocodeAddress(destText);

    if (participants.length < 2 || !destination) {
        alert('Need at least 2 participants and a destination');
        return;
    }

    // Calculate
    const results = await MergePointCalculator.calculate(participants, destination);
    displayResults(results);
}

async function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve) => {
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK') {
                resolve({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                });
            } else {
                resolve(null);
            }
        });
    });
}

function displayResults(results) {
    clearMap();
    
    // Show merge point options
    const panel = document.getElementById('results-panel');
    panel.innerHTML = '<h3>Merge Point Options</h3>';
    
    results.forEach((result, i) => {
        // Add marker
        const marker = new google.maps.Marker({
            position: result.location,
            map: map,
            label: `${i + 1}`,
            title: result.name
        });
        markers.push(marker);

        // Add to panel
        const div = document.createElement('div');
        div.className = 'result-option';
        div.innerHTML = `
            <strong>${i + 1}. ${result.name}</strong>
            <p>Avg time to hub: ${Math.round(result.avgTimeToHub / 60)} min</p>
            <p>Time to destination: ${Math.round(result.timeToDestination / 60)} min</p>
            <button onclick="selectMergePoint(${i})">Select</button>
        `;
        panel.appendChild(div);
    });

    // Add participant markers
    participants.forEach(p => {
        markers.push(new google.maps.Marker({
            position: p.location,
            map: map,
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            title: p.name
        }));
    });

    // Add destination marker
    markers.push(new google.maps.Marker({
        position: destination,
        map: map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        title: 'Destination'
    }));

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(m => bounds.extend(m.getPosition()));
    map.fitBounds(bounds);
}

function clearMap() {
    markers.forEach(m => m.setMap(null));
    markers = [];
}