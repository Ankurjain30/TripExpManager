// Trip Expense Manager PWA Logic (Local-Only Version)
document.addEventListener('DOMContentLoaded', () => {
    // Recalculate and update spends on startup
    recalculateTripTotals();
    loadTrips();

    // Visual selection handler for Trip Nature radio buttons
    const natureLabels = document.querySelectorAll('.nature-label');
    natureLabels.forEach(label => {
        label.addEventListener('click', () => {
            // Remove highlight from all labels
            natureLabels.forEach(l => {
                l.classList.remove('bg-[#212529]', 'text-white', 'border-[#212529]');
                l.classList.add('border-gray-200', 'text-gray-700');
            });
            // Highlight the clicked label
            label.classList.remove('border-gray-200', 'text-gray-700');
            label.classList.add('bg-[#212529]', 'text-white', 'border-[#212529]');
            
            // Check the internal radio input
            const radio = label.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    // Setup Create Trip Button
    const createTripBtn = document.getElementById('createtrip');
    if (createTripBtn) {
        createTripBtn.addEventListener('click', () => {
            const destinationInput = document.getElementById('tripdest');
            const destination = destinationInput ? destinationInput.value.trim() : '';
            const selectedRadio = document.querySelector('input[name="nature"]:checked');
            
            if (!destination) {
                alert('Please enter a destination name');
                return;
            }
            if (!selectedRadio) {
                alert('Please select a trip nature (Solo, Family, Group, Official)');
                return;
            }

            const tripNature = selectedRadio.value;
            saveTrip(destination, tripNature);
        });
    }

    // Trip selector dropdown change handler to update active spend instantly
    const tripSpinner = document.getElementById('spinnerTripSelector');
    if (tripSpinner) {
        tripSpinner.addEventListener('change', (e) => {
            const selectedTripId = e.target.value;
            localStorage.setItem('activeTripId', selectedTripId);
            updateDashboardDisplay(selectedTripId);
        });
    }

    // Quick Add Expense button
    const quickAddBtn = document.getElementById('btnQuickAddExpense');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            window.location.href = 'expenses.html';
        });
    }

    // Management & Settings Button Handlers
    document.getElementById('mperson').addEventListener('click', () => {
        window.location.href = 'participants.html';
    });
    
    document.getElementById('mfamily').addEventListener('click', () => {
        window.location.href = 'families.html';
    });

    document.getElementById('mshopc').addEventListener('click', () => {
        window.location.href = 'categories.html';
    });

    document.getElementById('addexp').addEventListener('click', () => {
        window.location.href = 'expenses.html';
    });

    document.getElementById('tripstat').addEventListener('click', () => {
        window.location.href = 'reports.html';
    });

    document.getElementById('refresh').addEventListener('click', () => {
        window.location.href = 'currency.html';
    });

    document.getElementById('share').addEventListener('click', () => {
        window.location.href = 'share.html';
    });

    document.getElementById('btnTripInfo').addEventListener('click', () => {
        window.location.href = 'roster.html';
    });
    
    const clearDataBtn = document.getElementById('btnClearData');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all local trip data?')) {
                localStorage.removeItem('trips');
                localStorage.removeItem('participants');
                localStorage.removeItem('categories');
                localStorage.removeItem('expenses');
                localStorage.removeItem('families');
                localStorage.removeItem('familiesList');
                localStorage.removeItem('preferredCurrency');
                
                loadTrips();
                alert('All data cleared.');
            }
        });
    }
});

// Helper function to recalculate and store totalSpend for each trip locally
function recalculateTripTotals() {
    const trips = getStoredTrips();
    const allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');

    trips.forEach(trip => {
        const tripExpenses = allExpenses.filter(e => Number(e.tripId) === Number(trip.id) || !e.tripId);
        trip.totalSpend = tripExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    });

    localStorage.setItem('trips', JSON.stringify(trips));
}

// LocalStorage Management for Trips
function getStoredTrips() {
    const data = localStorage.getItem('trips');
    return data ? JSON.parse(data) : [];
}

function saveTrip(destination, nature) {
    const trips = getStoredTrips();
    const newTrip = {
        id: Date.now(),
        destination: destination,
        nature: nature,
        totalSpend: 0.0
    };
    trips.push(newTrip);
    localStorage.setItem('trips', JSON.stringify(trips));
    
    // Store active trip ID for family/participant mapping context
    localStorage.setItem('activeTripId', newTrip.id);
    
    // Reset form inputs safely
    document.getElementById('tripdest').value = '';
    document.querySelectorAll('input[name="nature"]').forEach(r => r.checked = false);
    
    // Clear visual highlights on labels
    document.querySelectorAll('.nature-label').forEach(l => {
        l.classList.remove('bg-[#212529]', 'text-white', 'border-[#212529]');
        l.classList.add('border-gray-200', 'text-gray-700');
    });
    
    loadTrips();
    
    // Prompt user to pick people from participant directory or family directory
    const choice = prompt(
        'Trip created successfully!\nHow would you like to add members to this trip?\n\n1. Pick from Participant Directory\n2. Pick from Family Directory\n\nEnter 1 or 2:',
        '1'
    );

    if (choice === '1') {
        window.location.href = `participants.html?tripId=${newTrip.id}`;
    } else if (choice === '2') {
        window.location.href = `families.html?tripId=${newTrip.id}`;
    } else {
        window.location.href = 'index.html';
    }
}

function loadTrips() {
    recalculateTripTotals(); // Ensure totals are updated before loading
    const trips = getStoredTrips();
    const spinner = document.getElementById('spinnerTripSelector');
    if (!spinner) return;
    
    spinner.innerHTML = '';

    if (trips.length > 0) {
        trips.forEach((trip) => {
            const option = document.createElement('option');
            option.value = trip.id;
            option.textContent = trip.destination + ' (' + trip.nature + ')' + (trip.isClosed ? ' [CLOSED]' : '');
            spinner.appendChild(option);
        });
        
        // Select active trip or default to the first one
        const activeId = localStorage.getItem('activeTripId') || trips[0].id;
        spinner.value = activeId;
        localStorage.setItem('activeTripId', spinner.value);

        updateDashboardDisplay(spinner.value);
    } else {
        const option = document.createElement('option');
        option.textContent = 'No Open Trip Available';
        spinner.appendChild(option);
        
        const activeSpend = document.getElementById('activeTripSpend');
        const activeType = document.getElementById('activeTripType');
        if (activeSpend) activeSpend.textContent = '₹0.00';
        if (activeType) activeType.textContent = '-- Setup Trip --';
    }
}

function updateDashboardDisplay(tripId) {
    const trips = getStoredTrips();
    const currentTrip = trips.find(t => t.id == tripId);
    if (!currentTrip) return;

    recalculateTripTotals();
    const updatedTrips = getStoredTrips();
    const refreshedTrip = updatedTrips.find(t => t.id == tripId);
    const totalSpend = refreshedTrip ? refreshedTrip.totalSpend : 0;

    const activeSpend = document.getElementById('activeTripSpend');
    const activeType = document.getElementById('activeTripType');

    if (activeSpend) activeSpend.textContent = `₹${totalSpend.toFixed(2)}`;
    if (activeType) activeType.textContent = currentTrip.nature;
}