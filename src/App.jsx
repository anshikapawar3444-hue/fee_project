import React, { useState, useEffect } from 'react';
import './App.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import QRCode from 'qrcode';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// Custom leaflet icons
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
  return null;
}

export default function App() {
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [currentView, setCurrentView] = useState('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ambulanceDispatched, setAmbulanceDispatched] = useState(false);
  const [ambulanceStatus, setAmbulanceStatus] = useState('Vehicle AMB-01 assigned. Driver: Officer R. Sharma. ETA: 3 Minutes.');

  const [incidents, setIncidents] = useState([
    { id: 'INC-8821', type: 'Medical', severity: 'Critical', desc: 'Fall down stairs, concussion.', lat: 30.902, lng: 75.856, status: 'In Progress', unit: 'AMB-01', time: '10 mins ago' },
    { id: 'INC-8819', type: 'Fire', severity: 'High', desc: 'Lab chemical fire contained.', lat: 30.899, lng: 75.859, status: 'Resolved', unit: 'SEC-04', time: '1 hour ago' },
    { id: 'INC-8815', type: 'Crime/Security', severity: 'Medium', desc: 'Unauthorized access near dorms.', lat: 30.904, lng: 75.855, status: 'Resolved', unit: 'SEC-02', time: '3 hours ago' }
  ]);

  const [contacts, setContacts] = useState([
    { id: 1, name: 'Dr. Sarah Jenkins', rel: 'Mother', phone: '+1 (555) 0129-883' },
    { id: 2, name: 'Campus Safety Hot-Desk', rel: 'Institutional', phone: '+1 (555) 000-HELP' }
  ]);

  const [mapFilter, setMapFilter] = useState('all');

  const [reportForm, setReportForm] = useState({
    type: 'Medical',
    severity: 'Critical',
    desc: '',
    lat: 30.9010,
    lng: 75.8573
  });

  const [contactForm, setContactForm] = useState({ name: '', rel: '', phone: '' });

  // Sync data with localhost Express server
  useEffect(() => {
    fetch('http://localhost:5000/api/incidents')
      .then(res => res.json())
      .then(data => setIncidents(data))
      .catch(() => console.info('Local server offline: using active local state.'));

    fetch('http://localhost:5000/api/contacts')
      .then(res => res.json())
      .then(data => setContacts(data))
      .catch(() => console.info('Local server offline: using active local state.'));

    QRCode.toDataURL('https://resqcampus.internal/token/RESQ-2026-9921', { width: 160 })
      .then(url => setQrDataUrl(url));
  }, []);

  const toggleRole = () => {
    if (role === 'user') {
      setRole('admin');
      setCurrentView('admin-dash');
    } else {
      setRole('user');
      setCurrentView('dashboard');
    }
  };

  const handleEmergencySubmit = (e) => {
    e.preventDefault();
    const newInc = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      type: reportForm.type,
      severity: reportForm.severity,
      desc: reportForm.desc,
      lat: reportForm.lat,
      lng: reportForm.lng,
      status: 'In Progress',
      unit: 'Auto-Dispatching...',
      time: 'Just now'
    };

    fetch('http://localhost:5000/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInc)
    }).catch(() => {});

    setIncidents([newInc, ...incidents]);
    alert(`🚨 Incident Reported! ID: ${newInc.id}`);
    setReportForm({ ...reportForm, desc: '' });
    setCurrentView('dashboard');
  };

  const handleAmbulanceSubmit = (e) => {
    e.preventDefault();
    setAmbulanceDispatched(true);
    setTimeout(() => {
      setAmbulanceStatus('Vehicle AMB-01 arrived at your quadrant. Paramedic contact initiated.');
    }, 4000);
    alert('Ambulance successfully dispatched to your location.');
  };

  const handleResolveIncident = (id) => {
    fetch(`http://localhost:5000/api/incidents/${id}/resolve`, { method: 'PATCH' }).catch(() => {});
    setIncidents(incidents.map(i => (i.id === id ? { ...i, status: 'Resolved' } : i)));
    alert(`Incident ${id} marked as RESOLVED.`);
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    const newContact = { id: Date.now(), ...contactForm };
    fetch('http://localhost:5000/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact)
    }).catch(() => {});

    setContacts([...contacts, newContact]);
    setContactForm({ name: '', rel: '', phone: '' });
    setIsModalOpen(false);
  };

  const handleDeleteContact = (id) => {
    fetch(`http://localhost:5000/api/contacts/${id}`, { method: 'DELETE' }).catch(() => {});
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div id="root">
      {/* Sidebar Navigation */}
      <aside id="sidebar" className={isSidebarOpen ? 'open' : ''}>
        <div className="brand-container">
          <div className="brand-icon"><i className="fa-solid fa-shield-halved"></i></div>
          <div>
            <div className="brand-title">ResQ Campus</div>
            <div className="brand-sub">Smart Emergency System</div>
          </div>
        </div>

        <div className="nav-group">
          <span className="nav-label">Core View</span>
          <button className={`nav-item ${currentView === 'landing' ? 'active' : ''}`} onClick={() => setCurrentView('landing')}><i className="fa-solid fa-house"></i> Public Portal</button>
          <button className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}><i className="fa-solid fa-user-shield"></i> User Dashboard</button>
          <button className={`nav-item ${currentView === 'report' ? 'active' : ''}`} onClick={() => setCurrentView('report')}><i className="fa-solid fa-triangle-exclamation"></i> Report Emergency</button>
          <button className={`nav-item ${currentView === 'map' ? 'active' : ''}`} onClick={() => setCurrentView('map')}><i className="fa-solid fa-map-location-dot"></i> Live Map</button>
          <button className={`nav-item ${currentView === 'ambulance' ? 'active' : ''}`} onClick={() => setCurrentView('ambulance')}><i className="fa-solid fa-truck-medical"></i> Ambulance Dispatch</button>
          <button className={`nav-item ${currentView === 'services' ? 'active' : ''}`} onClick={() => setCurrentView('services')}><i className="fa-solid fa-hospital"></i> Nearby Services</button>
          <button className={`nav-item ${currentView === 'qrid' ? 'active' : ''}`} onClick={() => setCurrentView('qrid')}><i className="fa-solid fa-qrcode"></i> QR Emergency ID</button>
          <button className={`nav-item ${currentView === 'contacts' ? 'active' : ''}`} onClick={() => setCurrentView('contacts')}><i className="fa-solid fa-address-book"></i> SOS Contacts</button>

          <span className="nav-label">Administration</span>
          <button className={`nav-item ${currentView === 'admin-dash' ? 'active' : ''}`} onClick={() => setCurrentView('admin-dash')}><i className="fa-solid fa-chart-pie"></i> Admin Analytics</button>
          <button className={`nav-item ${currentView === 'incidents' ? 'active' : ''}`} onClick={() => setCurrentView('incidents')}><i className="fa-solid fa-clipboard-list"></i> Incidents Console</button>
          <button className={`nav-item ${currentView === 'vehicles' ? 'active' : ''}`} onClick={() => setCurrentView('vehicles')}><i className="fa-solid fa-car"></i> Fleet Logistics</button>
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={toggleRole}>
            <i className="fa-solid fa-repeat"></i> {role === 'user' ? 'Switch to Admin View' : 'Switch to User View'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div id="main-content">
        <header>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>ResQ Operational Terminal</span>
          </div>
          <div className="header-right">
            <span className={`role-badge ${role}`}>
              <i className={role === 'admin' ? 'fa-solid fa-user-gear' : 'fa-solid fa-id-badge'}></i>
              {role === 'admin' ? ' Admin / Dispatcher' : ' Student / User'}
            </span>
            <button className="btn-sos" onClick={() => setCurrentView('report')}>
              <i className="fa-solid fa-bell"></i> 🚨 SOS
            </button>
          </div>
        </header>

        {/* VIEW: Landing */}
        {currentView === 'landing' && (
          <div className="view-port">
            <div className="hero-banner">
              <span className="badge-tag">Smart Emergency Response</span>
              <h1 className="hero-title">Help Is Just One Tap Away.</h1>
              <p className="hero-desc">Real-time incident reporting, GPS-synchronized responder routing, and direct campus security telemetry unified into a single terminal.</p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setCurrentView('report')}><i className="fa-solid fa-triangle-exclamation"></i> Report Emergency</button>
                <button className="btn btn-secondary" onClick={() => setCurrentView('map')}><i className="fa-solid fa-map-location-dot"></i> Live Map</button>
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ textAlign: 'center', marginBottom: 28 }}>Incident Dispatch Architecture</div>
              <div className="dispatch-steps">
                <div>
                  <div className="step-icon step-icon-red"><i className="fa-solid fa-satellite-dish"></i></div>
                  <h4 style={{ fontWeight: 700, marginBottom: 6 }}>1. Trigger SOS</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GPS coordinates and incident details are captured automatically.</p>
                </div>
                <div>
                  <div className="step-icon step-icon-yellow"><i className="fa-solid fa-tower-broadcast"></i></div>
                  <h4 style={{ fontWeight: 700, marginBottom: 6 }}>2. Triage</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Incident routed instantly to Central Emergency Command.</p>
                </div>
                <div>
                  <div className="step-icon step-icon-blue"><i className="fa-solid fa-truck-fast"></i></div>
                  <h4 style={{ fontWeight: 700, marginBottom: 6 }}>3. Auto-Dispatch</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nearest available ambulance, responder, or officer is deployed.</p>
                </div>
                <div>
                  <div className="step-icon step-icon-green"><i className="fa-solid fa-circle-check"></i></div>
                  <h4 style={{ fontWeight: 700, marginBottom: 6 }}>4. Live Tracking</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full telemetry status visible with auto-SMS to emergency contacts.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Dashboard */}
        {currentView === 'dashboard' && (
          <div className="view-port">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="icon-tag" style={{ background: '#fee2e2', color: 'var(--primary)' }}><i className="fa-solid fa-shield-heart"></i></div>
                <span className="title">System State</span>
                <span className="value" style={{ color: 'var(--success)', fontSize: '1.4rem' }}>MONITORED</span>
                <span className="subtext">Campus Telemetry Active</span>
              </div>
              <div className="metric-card">
                <div className="icon-tag" style={{ background: '#e0f2fe', color: 'var(--info)' }}><i className="fa-solid fa-location-crosshairs"></i></div>
                <span className="title">Your Node Location</span>
                <span className="value" style={{ fontSize: '1.2rem', fontFamily: 'JetBrains Mono' }}>30.9010° N, 75.8573° E</span>
                <span className="subtext">Academic Block 4, North Quad</span>
              </div>
              <div className="metric-card">
                <div className="icon-tag" style={{ background: '#fef3c7', color: 'var(--warning)' }}><i className="fa-solid fa-truck-medical"></i></div>
                <span className="title">Ambulance Readiness</span>
                <span className="value">3 Ready</span>
                <span className="subtext">Est. Response: 4.2 mins</span>
              </div>
            </div>

            <div className="dash-split-actions">
              <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Trigger Incident SOS</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Medical trauma, active fire, accident, or security incident.</p>
                <button className="btn btn-primary" onClick={() => setCurrentView('report')} style={{ width: '100%' }}>Create Live Report</button>
              </div>
              <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Request Direct Transport</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Deploy paramedical ambulance directly to your coordinates.</p>
                <button className="btn btn-secondary" onClick={() => setCurrentView('ambulance')} style={{ width: '100%' }}>Deploy Vehicle</button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Activity Logs</div>
                <span className="badge badge-active">{incidents.length} Tracked</span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr key={inc.id}>
                        <td><strong>#{inc.id}</strong></td>
                        <td>{inc.type}</td>
                        <td>{inc.desc}</td>
                        <td><span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                        <td><span className={`badge ${inc.status === 'In Progress' ? 'badge-active' : 'badge-resolved'}`}>{inc.status}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{inc.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Report Emergency */}
        {currentView === 'report' && (
          <div className="view-port">
            <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
              <div className="card-title" style={{ fontSize: '1.4rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-triangle-exclamation"></i> Emergency Incident Report Form
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24 }}>Alerts Central Command and dispatches automated notices to SOS contacts.</p>

              <form onSubmit={handleEmergencySubmit}>
                <div className="form-group">
                  <label>Emergency Classification *</label>
                  <select value={reportForm.type} onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}>
                    <option value="Medical">Medical Emergency / Paramedic Needed</option>
                    <option value="Fire">Active Fire Hazard</option>
                    <option value="Accident">Severe Accident / Structural Collapse</option>
                    <option value="Crime/Security">Hostile Person / Threat / Assault</option>
                    <option value="Natural Disaster">Severe Weather / Earthquake / Flooding</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Severity Level *</label>
                  <select value={reportForm.severity} onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}>
                    <option value="Critical">Critical (Immediate threat to life)</option>
                    <option value="High">High (Serious hazard)</option>
                    <option value="Medium">Medium (Urgent assistance required)</option>
                    <option value="Low">Low (Informational alert)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Incident Details & Observations *</label>
                  <textarea required rows={3} placeholder="Describe room numbers, hazards, conditions..." value={reportForm.desc} onChange={(e) => setReportForm({ ...reportForm, desc: e.target.value })}></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Detected Latitude</label>
                    <input type="text" readOnly value={reportForm.lat} style={{ background: '#f8fafc', fontFamily: 'JetBrains Mono' }} />
                  </div>
                  <div className="form-group">
                    <label>Detected Longitude</label>
                    <input type="text" readOnly value={reportForm.lng} style={{ background: '#f8fafc', fontFamily: 'JetBrains Mono' }} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14 }}>
                  <i className="fa-solid fa-paper-plane"></i> Broadcast Incident Notification
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: Live Map */}
        {currentView === 'map' && (
          <div className="view-port">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Campus GIS Geolocation Network</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telemetry nodes, ambulances, and active incident markers.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setMapFilter('all')}>All</button>
                  <button className="btn btn-secondary" onClick={() => setMapFilter('incidents')}>Emergencies</button>
                  <button className="btn btn-secondary" onClick={() => setMapFilter('ambulances')}>Ambulances</button>
                </div>
              </div>
              <div className="map-container-box">
                <MapContainer center={[30.9010, 75.8573]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <InvalidateSizeOnMount />
                  <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {/* User Location */}
                  <Marker position={[30.9010, 75.8573]} icon={blueIcon}>
                    <Popup><strong>Your Current Node</strong><br/>Academic Block 4</Popup>
                  </Marker>

                  {/* Incidents */}
                  {(mapFilter === 'all' || mapFilter === 'incidents') && incidents.map((inc) => (
                    <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={redIcon}>
                      <Popup><strong>{inc.type} Incident (#{inc.id})</strong><br/>{inc.desc}<br/>Status: {inc.status}</Popup>
                    </Marker>
                  ))}

                  {/* Fleet */}
                  {(mapFilter === 'all' || mapFilter === 'ambulances') && (
                    <Marker position={[30.9035, 75.8600]} icon={greenIcon}>
                      <Popup><strong>Paramedic Unit AMB-01</strong><br/>Status: En Route</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Ambulance Dispatch */}
        {currentView === 'ambulance' && (
          <div className="view-port">
            <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="fa-solid fa-truck-medical" style={{ color: 'var(--primary)' }}></i> Direct Ambulance Dispatch
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>Fleet dispatch with automated campus gate clearance.</p>

              {ambulanceDispatched && (
                <div className="alert-banner">
                  <h4 style={{ color: '#065f46', fontSize: '0.95rem', marginBottom: 4 }}><i className="fa-solid fa-circle-notch fa-spin"></i> Ambulance Dispatched & En Route</h4>
                  <p style={{ fontSize: '0.8rem', color: '#047857' }}>{ambulanceStatus}</p>
                </div>
              )}

              <form onSubmit={handleAmbulanceSubmit}>
                <div className="form-group">
                  <label>Pickup Location</label>
                  <input type="text" defaultValue="Academic Complex East Gate, Block B" required />
                </div>
                <div className="form-group">
                  <label>Target Medical Facility</label>
                  <select>
                    <option>Campus Health Center (Clinic A)</option>
                    <option>City Trauma & General Hospital</option>
                    <option>St. Jude Memorial Emergency Wing</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Dispatch Nearest Unit</button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: Emergency Services */}
        {currentView === 'services' && (
          <div className="view-port">
            <div className="card-title" style={{ marginBottom: 16 }}>Emergency Facilities Directory</div>
            <div className="services-grid">
              <div className="card">
                <span className="badge badge-resolved" style={{ marginBottom: 10 }}>Open 24/7</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Campus Infirmary & Urgent Care</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 12px' }}>North Quad Ground Floor | 0.2 miles away</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Phone: +1 (555) 019-2831</p>
                <button className="btn btn-secondary" style={{ marginTop: 14, width: '100%' }} onClick={() => alert('Dialing +1 (555) 019-2831')}>
                  <i className="fa-solid fa-phone"></i> Direct Call
                </button>
              </div>
              <div className="card">
                <span className="badge badge-resolved" style={{ marginBottom: 10 }}>Level 1 Trauma</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Metropolitan University Hospital</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 12px' }}>West Campus Blvd | 1.1 miles away</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Phone: +1 (555) 911-2000</p>
                <button className="btn btn-secondary" style={{ marginTop: 14, width: '100%' }} onClick={() => alert('Dialing +1 (555) 911-2000')}>
                  <i className="fa-solid fa-phone"></i> Direct Call
                </button>
              </div>
              <div className="card">
                <span className="badge badge-active" style={{ marginBottom: 10 }}>Patrol Response</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Campus Police Command HQ</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 12px' }}>Admin Tower, Gate 1 | 0.4 miles away</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Phone: +1 (555) 000-HELP</p>
                <button className="btn btn-secondary" style={{ marginTop: 14, width: '100%' }} onClick={() => alert('Connecting to Campus Police Command...')}>
                  <i className="fa-solid fa-phone"></i> Direct Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: QR Emergency ID */}
        {currentView === 'qrid' && (
          <div className="view-port">
            <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
              <div className="card-title">Digital Emergency Identity Token</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '8px 0 20px' }}>
                First responders scan this token for immediate access to medical directives, allergy tags, and emergency points of contact.
              </p>
              <div className="qr-container">
                {qrDataUrl && <img src={qrDataUrl} alt="Emergency ID QR" />}
              </div>
              <div className="qr-info-card">
                <div><strong>ID:</strong> RESQ-2026-9921</div>
                <div><strong>Blood Profile:</strong> O-Positive (O+)</div>
                <div><strong>Pre-existing Conditions:</strong> Asthma (Inhaler)</div>
                <div><strong>Emergency Contact:</strong> Dr. Sarah Jenkins (Mother) - +1 555-0129</div>
              </div>
              <button className="btn btn-primary" onClick={() => window.print()}><i className="fa-solid fa-print"></i> Print / Export ID Badge</button>
            </div>
          </div>
        )}

        {/* VIEW: SOS Contacts */}
        {currentView === 'contacts' && (
          <div className="view-port">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Primary SOS Contacts</div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><i className="fa-solid fa-plus"></i> Add New Contact</button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Relationship</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.rel}</td>
                        <td style={{ fontFamily: 'JetBrains Mono' }}>{c.phone}</td>
                        <td><span className="badge badge-resolved">Verified</span></td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', marginRight: 6 }} onClick={() => alert(`Calling ${c.phone}`)}>
                            <i className="fa-solid fa-phone"></i> Call
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--primary)' }} onClick={() => handleDeleteContact(c.id)}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Admin Analytics */}
        {currentView === 'admin-dash' && (
          <div className="view-port">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="icon-tag" style={{ background: '#fee2e2', color: 'var(--primary)' }}><i className="fa-solid fa-triangle-exclamation"></i></div>
                <span className="title">Active Incidents</span>
                <span className="value">{incidents.filter(i => i.status === 'In Progress').length}</span>
                <span className="subtext">2 Critical / High</span>
              </div>
              <div className="metric-card">
                <div className="icon-tag" style={{ background: '#fef3c7', color: 'var(--warning)' }}><i className="fa-solid fa-truck-medical"></i></div>
                <span className="title">Fleet Utilization</span>
                <span className="value">2 / 5</span>
                <span className="subtext">40% active load</span>
              </div>
              <div className="metric-card">
                <div className="icon-tag" style={{ background: '#dcfce7', color: 'var(--success)' }}><i className="fa-solid fa-stopwatch"></i></div>
                <span className="title">Mean Response Time</span>
                <span className="value">4.1m</span>
                <span className="subtext">-18s vs previous week</span>
              </div>
            </div>

            <div className="admin-charts-grid">
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}>Incidents by Classification</div>
                <Doughnut
                  data={{
                    labels: ['Medical', 'Fire', 'Accident', 'Security', 'Disaster'],
                    datasets: [{
                      data: [45, 12, 18, 20, 5],
                      backgroundColor: ['#dc2626', '#ea580c', '#f59e0b', '#0284c7', '#64748b']
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
                />
              </div>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}>Weekly Response Trends (Mins)</div>
                <Line
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                      label: 'Avg Response Minutes',
                      data: [5.2, 4.8, 4.3, 4.9, 4.1, 3.8, 4.2],
                      borderColor: '#dc2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      fill: true,
                      tension: 0.35
                    }]
                  }}
                  options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Admin Incidents Console */}
        {currentView === 'incidents' && (
          <div className="view-port">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Live Incident Operations Board</div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Assigned Unit</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr key={inc.id}>
                        <td><strong>#{inc.id}</strong></td>
                        <td>{inc.type}</td>
                        <td><span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                        <td>{inc.unit}</td>
                        <td><span className={`badge ${inc.status === 'In Progress' ? 'badge-active' : 'badge-resolved'}`}>{inc.status}</span></td>
                        <td>{inc.time}</td>
                        <td>
                          {inc.status === 'In Progress' ? (
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleResolveIncident(inc.id)}>
                              Resolve
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Vehicles */}
        {currentView === 'vehicles' && (
          <div className="view-port">
            <div className="card">
              <div className="card-title" style={{ marginBottom: 18 }}>Emergency Vehicle Telemetry</div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle Unit</th>
                      <th>Type</th>
                      <th>Responder Driver</th>
                      <th>Status</th>
                      <th>Active Sector</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>AMB-01</strong></td>
                      <td>Advanced Life Support (ALS)</td>
                      <td>R. Sharma</td>
                      <td><span className="badge badge-active">En Route</span></td>
                      <td>North Quad</td>
                    </tr>
                    <tr>
                      <td><strong>AMB-02</strong></td>
                      <td>Basic Life Support (BLS)</td>
                      <td>M. Alvarez</td>
                      <td><span className="badge badge-resolved">Available</span></td>
                      <td>Base Infirmary</td>
                    </tr>
                    <tr>
                      <td><strong>SEC-04</strong></td>
                      <td>Patrol Interceptor</td>
                      <td>Lt. Vance</td>
                      <td><span className="badge badge-resolved">Patrolling</span></td>
                      <td>West Campus</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add Contact */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ marginBottom: 14, fontWeight: 700 }}>Add Emergency Contact</h3>
            <form onSubmit={handleAddContact}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" required placeholder="e.g. Jane Doe" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <input type="text" required placeholder="e.g. Mother, Guardian, Roommate" value={contactForm.rel} onChange={(e) => setContactForm({ ...contactForm, rel: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" required placeholder="e.g. +1 (555) 234-5678" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}