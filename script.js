class TourTracker {
    constructor() {
        // 🗓 Stage dates mapped to stage numbers
        this.stageMap = {
            '2025-07-05': 1, '2025-07-06': 2, '2025-07-07': 3, '2025-07-08': 4,
            '2025-07-09': 5, '2025-07-10': 6, '2025-07-11': 7, '2025-07-12': 8,
            '2025-07-13': 9, '2025-07-14': 10, '2025-07-16': 11, '2025-07-17': 12,
            '2025-07-18': 13, '2025-07-19': 14, '2025-07-20': 15, '2025-07-22': 16,
            '2025-07-23': 17, '2025-07-24': 18, '2025-07-25': 19, '2025-07-26': 20,
            '2025-07-27': 21
        };
        
        // Dummy data for fallback when live data isn't available
        this.dummyData = [
            {
                "position": "1",
                "timeGap": "+0:00",
                "riders": [
                    "YATES Simon",
                    "HEALY Ben",
                    "SIMMONS Quinn",
                    "VAN DER POEL Mathieu",
                    "STORER Michael",
                    "DUNBAR Eddie",
                    "BARTA Will",
                    "TEJADA Harold"
                ]
            },
            {
                "position": "P",
                "timeGap": "+3:07",
                "riders": []
            },
            {
                "position": "-",
                "timeGap": "+11:55",
                "riders": [
                    "MERLIER Tim",
                    "GIRMAY Biniam",
                    "MEEUS Jordi",
                    "MILAN Jonathan",
                    "GROENEWEGEN Dylan"
                ]
            }
        ];
        
        this.owner = null;
        this.riders = [];
        this.raceData = null;
        this.lastUpdate = null;
        this.updateInterval = null;
        this.currentStage = null;
        this.allTeams = null;
        
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.determineCurrentStage();
        this.updateDisplay();
        this.startDataFetching();
        this.loadAllTeams();
    }

    setupEventListeners() {
        const editBtn = document.getElementById('editBtn');
        const saveBtn = document.getElementById('saveBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const toggleTeamsBtn = document.getElementById('toggleTeamsBtn');

        editBtn.addEventListener('click', () => this.showEditForm());
        saveBtn.addEventListener('click', () => this.saveTeam());
        cancelBtn.addEventListener('click', () => this.hideEditForm());
        toggleTeamsBtn.addEventListener('click', () => this.toggleAllTeams());

        // Auto-save on input changes
        const riderInputs = document.querySelectorAll('.rider-input');
        riderInputs.forEach(input => {
            input.addEventListener('input', () => this.validateForm());
        });

        document.getElementById('ownerName').addEventListener('input', () => this.validateForm());
    }

    determineCurrentStage() {
        const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
        this.currentStage = this.stageMap[today];
        
        if (!this.currentStage) {
            // If today is not a race day, find the most recent stage
            const raceDates = Object.keys(this.stageMap).sort();
            const todayDate = new Date(today);
            
            // Find the most recent race date that's not in the future
            for (let i = raceDates.length - 1; i >= 0; i--) {
                const raceDate = new Date(raceDates[i]);
                if (raceDate <= todayDate) {
                    this.currentStage = this.stageMap[raceDates[i]];
                    break;
                }
            }
        }
        
        // Fallback to stage 1 if no stage found
        if (!this.currentStage) {
            this.currentStage = 1;
        }
        
        console.log(`Current stage determined: ${this.currentStage}`);
    }

    loadStoredData() {
        const stored = localStorage.getItem('tourTracker');
        if (stored) {
            const data = JSON.parse(stored);
            this.owner = data.owner;
            this.riders = data.riders || [];
        }
    }

    saveStoredData() {
        localStorage.setItem('tourTracker', JSON.stringify({
            owner: this.owner,
            riders: this.riders
        }));
    }

    showEditForm() {
        const form = document.getElementById('ownerForm');
        const display = document.getElementById('ownerDisplay');
        
        form.classList.remove('hidden');
        display.classList.add('hidden');

        // Populate form with current data
        if (this.owner) {
            document.getElementById('ownerName').value = this.owner;
        }

        const riderInputs = document.querySelectorAll('.rider-input');
        riderInputs.forEach((input, index) => {
            input.value = this.riders[index] || '';
        });
    }

    hideEditForm() {
        const form = document.getElementById('ownerForm');
        const display = document.getElementById('ownerDisplay');
        
        form.classList.add('hidden');
        display.classList.remove('hidden');
    }

    validateForm() {
        const ownerName = document.getElementById('ownerName').value.trim();
        const riderInputs = document.querySelectorAll('.rider-input');
        const saveBtn = document.getElementById('saveBtn');
        
        let validRiders = 0;
        riderInputs.forEach(input => {
            if (input.value.trim()) validRiders++;
        });

        saveBtn.disabled = !ownerName || validRiders === 0;
    }

    saveTeam() {
        const ownerName = document.getElementById('ownerName').value.trim();
        const riderInputs = document.querySelectorAll('.rider-input');
        
        if (!ownerName) {
            alert('Please enter an owner name');
            return;
        }

        this.owner = ownerName;
        this.riders = [];

        riderInputs.forEach(input => {
            const riderName = input.value.trim();
            if (riderName) {
                // Normalize rider name format to match API data
                this.riders.push(riderName.toUpperCase());
            }
        });

        if (this.riders.length === 0) {
            alert('Please enter at least one rider');
            return;
        }

        this.saveStoredData();
        this.updateDisplay();
        this.hideEditForm();
    }

    updateDisplay() {
        const displayOwnerName = document.getElementById('displayOwnerName');
        const ridersList = document.getElementById('ridersList');
        const headerTitle = document.getElementById('headerTitle');

        if (this.owner && this.riders.length > 0) {
            displayOwnerName.textContent = `${this.owner}'s Team`;
            
            ridersList.innerHTML = '';
            this.riders.forEach(rider => {
                const riderCard = document.createElement('div');
                riderCard.className = 'rider-card';
                riderCard.textContent = this.formatRiderName(rider);
                ridersList.appendChild(riderCard);
            });
        } else {
            displayOwnerName.textContent = 'Register your team to get started';
            ridersList.innerHTML = '';
        }
        
        // Update header with current stage info
        if (this.currentStage) {
            headerTitle.textContent = `🚴‍♂️ Tour de France Stage ${this.currentStage} - Breakaway Tracker`;
        }
    }

    /**
     * Convert a "+m:ss" or "+h:mm:ss" gap to pure seconds.
     * Anything that can’t be parsed returns Infinity so it is
     * pushed far to the right.
     */
    parseTimeGap(timeGap) {
        if (!timeGap || timeGap[0] !== '+') return Infinity;

        const nums = timeGap.slice(1).split(':').map(Number);   // drop ‘+’
        let seconds = 0;

        // 1-part → mm
        // 2-part → mm:ss
        // 3-part → hh:mm:ss
        nums.forEach(n => { seconds = seconds * 60 + n; });

        return seconds;
    }

formatRiderName(rider) {
    const words = rider.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1));

    const firstName = words.pop();        // Last word is the first name
    words.unshift(firstName);             // Move it to the front

    return words.join(' ');
}


    async startDataFetching() {
        // Fetch immediately
        await this.fetchRaceData();
        
        // Then fetch every 30 seconds
        this.updateInterval = setInterval(() => {
            this.fetchRaceData();
        }, 30000);
    }

    async fetchRaceData() {
        try {
            if (!this.currentStage) {
                throw new Error('Unable to determine current stage');
            }
            
            // Construct URL for latest.json in current stage folder
            const url = `https://cycling-scrapes.s3.us-east-1.amazonaws.com/stage-${this.currentStage}/latest.json`;
            console.log(`Fetching race data from: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch race data: ${response.status} ${response.statusText}`);
            }

            this.raceData = await response.json();
            this.lastUpdate = new Date();
            
            console.log(`Race data updated for stage ${this.currentStage}:`, this.raceData);
            
            this.displayRaceData();
            this.checkBreakaway();
            
        } catch (error) {
            console.error(`Error fetching race data for stage ${this.currentStage}:`, error);
            this.useDummyData();
        }
    }

    displayRaceData() {
        const raceDataContainer = document.getElementById('raceData');
        const lastUpdateElement = document.getElementById('lastUpdate');
        
        if (!this.raceData) {
            raceDataContainer.innerHTML = '<div class="loading">No race data available</div>';
            this.displayVisualRace();
            return;
        }

        lastUpdateElement.textContent = this.lastUpdate.toLocaleTimeString();

        let html = '';
        this.raceData.forEach(group => {
            const positionLabel = this.getPositionLabel(group.position);
            
            html += `
                <div class="position-group">
                    <div class="position-header">
                        <span class="position-number">${positionLabel}</span>
                        <span class="time-gap">${group.timeGap}</span>
                    </div>
                    <div class="riders-in-position">
                        ${this.renderRiders(group.riders)}
                    </div>
                </div>
            `;
        });

        raceDataContainer.innerHTML = html;
        this.displayVisualRace();
    }

    displayVisualRace() {
    const raceGroupsContainer = document.getElementById('raceGroups');

    if (!this.raceData) {
        raceGroupsContainer.innerHTML =
            '<div class="loading-visual">Waiting for race data...</div>';
        return;
    }

    /* 🔽  NEW ORDER  🔽
       – convert the “+m:ss” string to seconds
       – bigger gap first ➜ will be rendered *right-most*
         because the flex row is `row-reverse` in CSS   */
    const sortedGroups = [...this.raceData].sort((a, b) =>
        this.parseTimeGap(b.timeGap) - this.parseTimeGap(a.timeGap)
    );

    // build the DOM exactly as before
    let html = '';
    sortedGroups.forEach(group => {
        const positionLabel = this.getPositionLabel(group.position);
        const groupClass    = this.getGroupClass(group.position);

        html += `
            <div class="race-group ${groupClass}">
                <div class="group-info">
                    <div class="group-position">${positionLabel}</div>
                    <div class="group-time">${group.timeGap}</div>
                </div>
                <div class="group-riders-list">
                    ${this.renderRidersList(group.riders)}
                </div>
            </div>
        `;
    });

    raceGroupsContainer.innerHTML = html;
}


    getGroupClass(position) {
        switch(position) {
            case 'P': return 'peloton-group';
            case '-': return 'trailing-group';
            default: return 'breakaway-group';
        }
    }

    renderRidersList(riders) {
        if (riders.length === 0) {
            return '<div class="no-riders">No riders in this group</div>';
        }
        
        return riders.map(rider => {
            const isOwnerRider = this.riders.includes(rider.toUpperCase());
            const ownerClass = isOwnerRider ? ' owner-rider' : '';
            const ownerNames = this.getOwnerNamesForRider(rider);
            const ownerNamesHtml = ownerNames.length > 0 ? 
                `<div class="rider-owners">${ownerNames.join(', ')}</div>` : '';
            
            return `
                <div class="rider-name-visual${ownerClass}">
                    ${this.formatRiderName(rider)}
                    ${ownerNamesHtml}
                </div>
            `;
        }).join('');
    }

    getPositionLabel(position) {
        switch(position) {
            case 'P': return 'Peloton';
            case '-': return 'Behind';
            default: return `Position ${position}`;
        }
    }

    renderRiders(riders) {
        if (riders.length === 0) {
            return '<span class="rider-name">No riders</span>';
        }

        return riders.map(rider => {
            const isOwnerRider = this.riders.includes(rider.toUpperCase());
            const className = isOwnerRider ? 'rider-name owner-rider' : 'rider-name';
            return `<span class="${className}">${this.formatRiderName(rider)}</span>`;
        }).join('');
    }

    checkBreakaway() {
        if (!this.raceData || !this.riders.length) return;

        const breakawayRiders = [];
        
        // Check positions 1 and 2 (and any position that's not P or -)
        this.raceData.forEach(group => {
            if (group.position !== 'P' && group.position !== '-') {
                group.riders.forEach(rider => {
                    if (this.riders.includes(rider.toUpperCase())) {
                        breakawayRiders.push(rider);
                    }
                });
            }
        });

        this.displayBreakawayAlert(breakawayRiders);
        this.highlightBreakawayRiders(breakawayRiders);
        
        // Update all teams display if it's visible
        const allTeamsContent = document.getElementById('allTeamsContent');
        if (!allTeamsContent.classList.contains('hidden')) {
            this.displayAllTeams();
        }
    }

    displayBreakawayAlert(breakawayRiders) {
        const alertElement = document.getElementById('breakawayAlert');
        const ridersElement = document.getElementById('breakawayRiders');

        if (breakawayRiders.length > 0) {
            ridersElement.innerHTML = breakawayRiders.map(rider => 
                `<span class="breakaway-rider">${this.formatRiderName(rider)}</span>`
            ).join('');
            alertElement.style.display = 'block';
        } else {
            alertElement.style.display = 'none';
        }
    }

    highlightBreakawayRiders(breakawayRiders) {
        const riderCards = document.querySelectorAll('.rider-card');
        riderCards.forEach(card => {
            const riderName = card.textContent.toUpperCase();
            const isInBreakaway = breakawayRiders.some(rider => 
                rider.toUpperCase() === riderName
            );
            
            if (isInBreakaway) {
                card.classList.add('in-breakaway');
            } else {
                card.classList.remove('in-breakaway');
            }
        });
    }

    useDummyData() {
        console.log('Using dummy data as fallback');
        this.raceData = this.dummyData;
        this.lastUpdate = new Date();
        
        this.displayRaceData();
        this.checkBreakaway();
        
        // Show a subtle indicator that we're using dummy data
        const lastUpdateElement = document.getElementById('lastUpdate');
        lastUpdateElement.innerHTML = `${this.lastUpdate.toLocaleTimeString()} <span style="color: #F59E0B; font-size: 0.8em;">(Demo Data)</span>`;
    }

    async loadAllTeams() {
        try {
            const response = await fetch('https://cycling-scrapes.s3.us-east-1.amazonaws.com/teams.json');
            if (!response.ok) {
                throw new Error('Failed to load teams data');
            }
            this.allTeams = await response.json();
            console.log('All teams loaded:', this.allTeams);
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    }

    toggleAllTeams() {
        const content = document.getElementById('allTeamsContent');
        const button = document.getElementById('toggleTeamsBtn');
        
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            button.textContent = 'Hide Teams';
            this.displayAllTeams();
        } else {
            content.classList.add('hidden');
            button.textContent = 'Show Teams';
        }
    }

    displayAllTeams() {
        const container = document.getElementById('allTeamsList');
        
        if (!this.allTeams) {
            container.innerHTML = '<div class="loading">Teams data not available</div>';
            return;
        }

        let html = '';
        this.allTeams.owners.forEach(owner => {
            html += `
                <div class="team-card">
                    <div class="team-owner">${owner.name}</div>
                    <div class="team-riders">
                        ${owner.riders.map(rider => {
                            const isInBreakaway = this.isRiderInBreakaway(rider);
                            const breakawayClass = isInBreakaway ? ' in-breakaway' : '';
                            return `<div class="team-rider${breakawayClass}">${rider}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    isRiderInBreakaway(riderName) {
        if (!this.raceData) return false;
        
        // Check if rider is in any breakaway position (not P or -)
        return this.raceData.some(group => {
            if (group.position === 'P' || group.position === '-') return false;
            return group.riders.some(rider => 
                rider.toUpperCase() === riderName.toUpperCase()
            );
        });
    }

    getOwnerNamesForRider(riderName) {
        if (!this.allTeams) return [];
        
        console.log(`Looking for owners of rider: ${riderName}`); // Debug log
        
        const ownerNames = [];
        this.allTeams.owners.forEach(owner => {
            const hasRider = owner.riders.some(rider => {
                // For race data format "BURGAUDEAU Mathieu", extract "BURGAUDEAU"
                // For teams.json format "Mathieu Burgaudeau", extract "Burgaudeau"
                const raceRiderLastName = riderName.split(' ')[0].toUpperCase(); // First word in race data
                const teamRiderLastName = rider.split(' ').pop().toUpperCase(); // Last word in teams data
                console.log(`Comparing race rider "${raceRiderLastName}" with team rider "${teamRiderLastName}"`); // Debug log
                return raceRiderLastName === teamRiderLastName;
            });
            if (hasRider) {
                console.log(`Found match! Owner: ${owner.name}`); // Debug log
                ownerNames.push(owner.name);
            }
        });
        
        return ownerNames;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TourTracker();
});