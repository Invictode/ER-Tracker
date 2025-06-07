// --- YOUR FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyC4gBqQlYh3vQ2wbfySpG-4z6Dk4dJ5hoc",
    authDomain: "er-handover-c245b.firebaseapp.com",
    projectId: "er-handover-c245b",
    storageBucket: "er-handover-c245b.appspot.com",
    messagingSenderId: "867309153832",
    appId: "1:867309153832:web:a3a915736ac98709080f1d",
    measurementId: "G-0TGFDX9CWN"
};

// --- INITIALIZE FIREBASE ---
let db, auth;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
} catch (e) {
    console.error("Firebase initialization failed.", e);
}

// --- AUTHENTICATION CHECK ---
auth.onAuthStateChanged(user => {
    if (user) {
        initializeApp();
    } else {
        window.location.href = 'login.html';
    }
});

// --- MAIN APP FUNCTION ---
function initializeApp() {

    // --- DOM ELEMENTS ---
    const erBoard = document.getElementById('er-board');
    const signOutBtn = document.getElementById('sign-out-btn');
    const modals = {
        patient: document.getElementById('patient-modal'),
        admit: document.getElementById('admit-modal'),
        transfer: document.getElementById('transfer-modal'),
    };
    const forms = {
        patient: document.getElementById('patient-form'),
        admit: document.getElementById('admit-form'),
        transfer: document.getElementById('transfer-form'),
    };
    const views = {};
    const navButtons = {};
    const tableBodies = {};
    const searchBars = {};

    // Helper to populate view/nav/table/search objects
    ['board', 'discharged', 'admitted', 'transfer', 'lama'].forEach(key => {
        views[key] = document.getElementById(`${key}-view`) || document.getElementById('er-board');
        navButtons[key] = document.getElementById(`nav-${key}`);
        if (key !== 'board') {
            tableBodies[key] = document.querySelector(`#${key}-table tbody`);
            searchBars[key] = document.getElementById(`search-${key}`);
        }
    });

    // --- ER CONFIGURATION & STATE ---
    const bedsConfig = [ { number: 1, zone: 'resus-zone' }, { number: 2, zone: 'red-zone' }, { number: 3, zone: 'red-zone' }, { number: 4, zone: 'red-zone' }, { number: 5, zone: 'yellow-zone' }, { number: 6, zone: 'yellow-zone' }, { number: 7, zone: 'yellow-zone' }, { number: 8, zone: 'yellow-zone' }, { number: 9, zone: 'yellow-zone' }, { number: 10, zone: 'yellow-zone' }, { number: 11, zone: 'yellow-zone' }, { number: 12, zone: 'yellow-zone' }, { number: 13, zone: 'holding-bay' }, { number: 14, zone: 'holding-bay' } ];
    let allData = {
        active: [],
        discharged: [],
        admitted: [],
        transfer: [],
        lama: [],
    };

    // --- VIEW SWITCHING LOGIC ---
    function showView(viewName) {
        Object.values(views).forEach(view => view.style.display = 'none');
        Object.values(navButtons).forEach(btn => btn.classList.remove('active'));
        views[viewName].style.display = 'block';
        navButtons[viewName].classList.add('active');
    }

    // --- DATA RENDERING FUNCTIONS ---
    function drawInitialBedLayout() {
        erBoard.innerHTML = '';
        const zones = {};
        bedsConfig.forEach(bed => {
            if (!zones[bed.zone]) zones[bed.zone] = [];
            zones[bed.zone].push(bed);
        });
        for (const zoneName in zones) {
            const bedsInZone = zones[zoneName];
            const zoneContainer = document.createElement('div');
            zoneContainer.className = 'zone-container';
            const zoneTitle = document.createElement('h2');
            zoneTitle.className = 'zone-title';
            zoneTitle.textContent = zoneName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            zoneContainer.appendChild(zoneTitle);
            const bedGrid = document.createElement('div');
            bedGrid.className = 'bed-grid';
            bedsInZone.forEach(bedConfig => {
                const bedDiv = document.createElement('div');
                bedDiv.id = `bed-${bedConfig.number}`;
                bedDiv.classList.add('bed', bedConfig.zone, 'vacant');
                bedDiv.dataset.bedNumber = bedConfig.number;
                bedDiv.innerHTML = `<div class="bed-header">Bed ${bedConfig.number}</div><div class="bed-info"><p><i class="fa-solid fa-bed-pulse"></i> Vacant</p></div><div class="action-buttons"></div>`;
                bedGrid.appendChild(bedDiv);
            });
            zoneContainer.appendChild(bedGrid);
            erBoard.appendChild(zoneContainer);
        }
    }

    function updateBedsWithData(patients) {
        allData.active = patients;
        document.querySelectorAll('.bed').forEach(bedDiv => {
            bedDiv.classList.add('vacant');
            bedDiv.querySelector('.bed-info').innerHTML = '<p><i class="fa-solid fa-bed-pulse"></i> Vacant</p>';
            bedDiv.querySelector('.action-buttons').innerHTML = '';
        });
        patients.forEach(patient => {
            const bedDiv = document.getElementById(`bed-${patient.bedNumber}`);
            if (bedDiv) {
                bedDiv.classList.remove('vacant');
                bedDiv.querySelector('.bed-info').innerHTML = `<p><i class="fa-solid fa-user"></i> <strong>Name:</strong> ${patient.name||''}</p><p><i class="fa-solid fa-id-card"></i> <strong>ID:</strong> ${patient.idCardNumber||''}</p><p><i class="fa-solid fa-clock"></i> <strong>Arrival:</strong> ${new Date(patient.arrivalTime).toLocaleTimeString()}</p><p><i class="fa-solid fa-user-nurse"></i> <strong>Nurse:</strong> ${patient.assignedNurse||''}</p><p><i class="fa-solid fa-user-doctor"></i> <strong>Doctor:</strong> ${patient.assignedDoctor||''}</p><p><i class="fa-solid fa-file-medical"></i> <strong>Dx:</strong> ${patient.diagnosis||''}</p><p><i class="fa-solid fa-clipboard-list"></i> <strong>Plan:</strong> ${patient.plan||''}</p>`;
                bedDiv.querySelector('.action-buttons').innerHTML = `<button class="action-btn discharge" data-patient-id="${patient.id}" title="Discharge"><i class="fa-solid fa-house-medical-circle-check"></i></button><button class="action-btn admit" data-patient-id="${patient.id}" title="Admit"><i class="fa-solid fa-hospital-user"></i></button><button class="action-btn transfer" data-patient-id="${patient.id}" title="Transfer"><i class="fa-solid fa-truck-medical"></i></button><button class="action-btn lama" data-patient-id="${patient.id}" title="Left Against Medical Advice"><i class="fa-solid fa-person-walking-arrow-right"></i> LAMA</button><button class="action-btn dor" data-patient-id="${patient.id}" title="Discharge on Request"><i class="fa-solid fa-person-walking-arrow-right"></i> DOR</button>`;
            }
        });
    }

    function renderList(key) {
        const tbody = tableBodies[key];
        const items = allData[key];
        const renderRowFunc = getRowRenderer(key);
        const searchTerm = (searchBars[key] ? searchBars[key].value : '').toLowerCase();
        
        tbody.innerHTML = '';
        const filteredItems = items.filter(item => 
            (item.name && item.name.toLowerCase().includes(searchTerm)) || 
            (item.idCardNumber && item.idCardNumber.toLowerCase().includes(searchTerm))
        );

        if (filteredItems.length === 0) {
            const row = document.createElement('tr');
            const colspan = tbody.parentElement.querySelector('thead tr').childElementCount;
            row.innerHTML = `<td colspan="${colspan}" style="text-align: center; padding: 20px;">${searchTerm ? 'No matching patients found.' : 'No patients in this list.'}</td>`;
            tbody.appendChild(row);
            return;
        }
        filteredItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = renderRowFunc(item);
            tbody.appendChild(row);
        });
    }
    
    function getRowRenderer(key) {
        const formatTime = (isoString) => new Date(isoString).toLocaleString();
        switch (key) {
            case 'discharged': return item => `<td>${item.name}</td><td>${item.idCardNumber}</td><td>${formatTime(item.arrivalTime)}</td><td>${formatTime(item.dischargeTime)}</td><td>${item.diagnosis}</td>`;
            case 'admitted':   return item => `<td>${item.name}</td><td>${item.idCardNumber}</td><td>${formatTime(item.arrivalTime)}</td><td>${formatTime(item.admissionTime)}</td><td>${item.admittedToWard}</td><td>${item.admittedToBed}</td>`;
            case 'transfer':   return item => `<td>${item.name}</td><td>${item.idCardNumber}</td><td>${item.transferredTo}</td><td>${item.transferReason}</td><td>${formatTime(item.transferTime)}</td>`;
            case 'lama':       return item => `<td>${item.name}</td><td>${item.idCardNumber}</td><td>${item.status}</td><td>${formatTime(item.eventTime)}</td><td>${item.diagnosis}</td>`;
            default:           return () => '';
        }
    }

    // --- REAL-TIME LISTENERS ---
    function setupAllListeners() {
        db.collection('patients').orderBy('bedNumber', 'asc').onSnapshot(snapshot => {
            const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateBedsWithData(patients);
        });
        
        const createListener = (collection, orderField, key) => {
            db.collection(collection).orderBy(orderField, 'desc').onSnapshot(snapshot => {
                allData[key] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderList(key);
            });
        };
        
        createListener('discharged_patients', 'dischargeTime', 'discharged');
        createListener('admitted_patients', 'admissionTime', 'admitted');
        createListener('transferred_patients', 'transferTime', 'transfer');
        createListener('lama_dor_patients', 'eventTime', 'lama');
    }

    // --- MODAL & FORM LOGIC ---
    function openModal(modalName, data) {
        const modal = modals[modalName];
        if (!modal) return;
        
        if (modalName === 'patient') {
            const bedNumber = data.bedNumber;
            const patient = allData.active.find(p => p.id === data.id);
            document.getElementById('modal-bed-number').textContent = bedNumber;
            forms.patient.elements['modal-bed-id'].value = bedNumber;
            forms.patient.elements['modal-bed-id'].dataset.patientId = patient ? patient.id : '';
            if (patient) {
                forms.patient.elements['patient-name'].value = patient.name || '';
                forms.patient.elements['patient-id'].value = patient.idCardNumber || '';
                forms.patient.elements['assigned-nurse'].value = patient.assignedNurse || '';
                forms.patient.elements['assigned-doctor'].value = patient.assignedDoctor || '';
                forms.patient.elements['diagnosis'].value = patient.diagnosis || '';
                forms.patient.elements['plan'].value = patient.plan || '';
            } else {
                forms.patient.reset();
            }
        } else { // admit or transfer
            document.getElementById(`${modalName}-patient-name`).textContent = data.name;
            document.getElementById(`${modalName}-patient-id`).value = data.id;
        }
        modal.style.display = 'block';
    }

    function closeModal(modalName) {
        modals[modalName].style.display = 'none';
        forms[modalName].reset();
    }
    
    document.querySelectorAll('.modal .close-button').forEach(btn => {
        btn.onclick = () => btn.closest('.modal').style.display = 'none';
    });
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
    
    // --- EVENT LISTENERS ---
    erBoard.addEventListener('click', (e) => {
        const bedDiv = e.target.closest('.bed');
        if (!bedDiv) return;

        const actionButton = e.target.closest('.action-btn');
        const bedNumber = parseInt(bedDiv.dataset.bedNumber);
        const patient = allData.active.find(p => p.bedNumber === bedNumber);
        
        if (!patient && !actionButton) {
            openModal('patient', { bedNumber });
            return;
        }

        if (!actionButton) {
             openModal('patient', patient);
             return;
        }
        
        const patientId = actionButton.dataset.patientId;
        const patientToActOn = allData.active.find(p => p.id === patientId);
        
        const archiveAndRemove = (collectionName, additionalData) => {
            if (patientToActOn) {
                db.collection(collectionName).add({ ...patientToActOn, ...additionalData })
                    .then(() => db.collection('patients').doc(patientId).delete())
                    .catch(err => console.error(`Error: ${collectionName}`, err));
            }
        };

        if (actionButton.classList.contains('admit')) openModal('admit', patientToActOn);
        else if (actionButton.classList.contains('transfer')) openModal('transfer', patientToActOn);
        else if (actionButton.classList.contains('discharge') && confirm(`Discharge ${patientToActOn.name}?`)) archiveAndRemove('discharged_patients', { dischargeTime: new Date().toISOString() });
        else if (actionButton.classList.contains('lama') && confirm(`${patientToActOn.name} is LAMA?`)) archiveAndRemove('lama_dor_patients', { status: 'LAMA', eventTime: new Date().toISOString() });
        else if (actionButton.classList.contains('dor') && confirm(`${patientToActOn.name} is DOR?`)) archiveAndRemove('lama_dor_patients', { status: 'DOR', eventTime: new Date().toISOString() });
    });

    forms.patient.addEventListener('submit', (e) => {
        e.preventDefault();
        const bedNumber = parseInt(forms.patient.elements['modal-bed-id'].value);
        const patientId = forms.patient.elements['modal-bed-id'].dataset.patientId;
        const patientData = { bedNumber, name: forms.patient.elements['patient-name'].value, idCardNumber: forms.patient.elements['patient-id'].value, assignedNurse: forms.patient.elements['assigned-nurse'].value, assignedDoctor: forms.patient.elements['assigned-doctor'].value, diagnosis: forms.patient.elements['diagnosis'].value, plan: forms.patient.elements['plan'].value };
        if (patientId) {
            db.collection('patients').doc(patientId).update(patientData);
        } else {
            patientData.arrivalTime = new Date().toISOString();
            db.collection('patients').add(patientData);
        }
        closeModal('patient');
    });

    forms.admit.addEventListener('submit', (e) => {
        e.preventDefault();
        const patientId = forms.admit.elements['admit-patient-id'].value;
        const patient = allData.active.find(p => p.id === patientId);
        if (patient) {
            const data = { admittedToWard: forms.admit.elements['admit-ward'].value, admittedToBed: forms.admit.elements['admit-bed'].value, admissionTime: new Date().toISOString() };
            db.collection('admitted_patients').add({ ...patient, ...data })
              .then(() => db.collection('patients').doc(patientId).delete());
        }
        closeModal('admit');
    });

    forms.transfer.addEventListener('submit', (e) => {
        e.preventDefault();
        const patientId = forms.transfer.elements['transfer-patient-id'].value;
        const patient = allData.active.find(p => p.id === patientId);
        if (patient) {
            const data = { transferredTo: forms.transfer.elements['transfer-hospital'].value, transferReason: forms.transfer.elements['transfer-reason'].value, transferTime: new Date().toISOString() };
            db.collection('transferred_patients').add({ ...patient, ...data })
              .then(() => db.collection('patients').doc(patientId).delete());
        }
        closeModal('transfer');
    });

    Object.keys(navButtons).forEach(key => navButtons[key].addEventListener('click', () => showView(key)));
    signOutBtn.addEventListener('click', () => auth.signOut().catch(err => console.error("Sign out error:", err)));
    Object.keys(searchBars).forEach(key => {
        searchBars[key].addEventListener('input', () => renderList(key));
    });
    
    // --- INITIAL APP START ---
    drawInitialBedLayout();
    setupAllListeners();
    showView('board');
}
