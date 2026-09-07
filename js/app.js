/* ==========================================================================
   PORTAL BMKG BANJARBARU - LIVE DATA ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMap();
  fetchLiveEarthquake();
  fetchBanjarbaruWeather();
});

/* --------------------------------------------------------------------------
   1. REAL-TIME CLOCK (WITA)
   -------------------------------------------------------------------------- */
function initClock() {
  const clockElement = document.getElementById('realtime-clock');

  function updateTime() {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Makassar',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    const timeString = new Intl.DateTimeFormat('id-ID', options).format(now);
    clockElement.textContent = `${timeString.replace(/\./g, ':')} WITA`;
  }

  updateTime();
  setInterval(updateTime, 1000);
}

/* --------------------------------------------------------------------------
   2. LEAFLET INTERACTIVE MAP (FOKUS BANJARBARU)
   -------------------------------------------------------------------------- */
let map;

function initMap() {
  const defaultLat = -3.4402;
  const defaultLng = 114.8306;
  const zoomLevel = 11;

  map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([defaultLat, defaultLng], zoomLevel);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  addStationMarkers();
}

function addStationMarkers() {
  // Stasiun Klimatologi Banjarbaru
  const stasiunBanjarbaru = L.marker([-3.4475, 114.8315]).addTo(map);
  stasiunBanjarbaru.bindPopup(`
    <div style="color: #0f172a; font-family: sans-serif;">
      <strong style="font-size: 14px;">Stasiun Klimatologi Banjarbaru</strong><br>
      <span style="font-size: 12px; color: #475569;">BMKG Kalimantan Selatan</span>
    </div>
  `);

  // Stasiun Syamsudin Noor
  const stasiunBandara = L.marker([-3.4422, 114.7555]).addTo(map);
  stasiunBandara.bindPopup(`
    <div style="color: #0f172a; font-family: sans-serif;">
      <strong style="font-size: 14px;">Stameteo Syamsudin Noor</strong><br>
      <span style="font-size: 12px; color: #475569;">Area Bandara Internasional</span>
    </div>
  `);
}

/* --------------------------------------------------------------------------
   3. FETCH LIVE DATA GEMPA BUMI TERKINI (API BMKG)
   -------------------------------------------------------------------------- */
async function fetchLiveEarthquake() {
  try {
    const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
    const data = await response.json();
    const gempa = data.Infogempa.gempa;

    // Update elemen UI
    document.getElementById('eq-mag').textContent = gempa.Magnitude;
    document.getElementById('eq-time').textContent = `${gempa.Tanggal}, ${gempa.Jam}`;
    document.getElementById('eq-loc').textContent = gempa.Wilayah;
    document.getElementById('eq-depth').textContent = gempa.Kedalaman;

    // Plot koordinat gempa ke peta jika ada
    const [lat, lng] = gempa.Coordinates.split(',');
    const eqIcon = L.divIcon({
      className: 'custom-eq-icon',
      html: `<div style="background: #EF4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 12px #EF4444;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    L.marker([parseFloat(lat), parseFloat(lng)], { icon: eqIcon })
      .addTo(map)
      .bindPopup(`<b>⚠️ Gempa Terkini M ${gempa.Magnitude}</b><br>${gempa.Wilayah}`);

  } catch (error) {
    console.error('Gagal mengambil data gempa:', error);
  }
}

/* --------------------------------------------------------------------------
   4. FETCH PRAKIRAAN CUACA & ISPU BANJARBARU (API OPEN-METEO/BMKG)
   -------------------------------------------------------------------------- */
async function fetchBanjarbaruWeather() {
  try {
    // Menggunakan Open-Meteo API berbasis koordinat presisi Banjarbaru (-3.44, 114.83)
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=-3.4402&longitude=114.8306&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia%2FMakassar';
    const airQualityUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-3.4402&longitude=114.8306&current=us_aqi&timezone=Asia%2FMakassar';

    // Fetch Cuaca & ISPU secara paralel
    const [resWeather, resAir] = await Promise.all([fetch(weatherUrl), fetch(airQualityUrl)]);
    const dataWeather = await resWeather.json();
    const dataAir = await resAir.json();

    // 1. Update Cuaca Utama
    const current = dataWeather.current;
    document.getElementById('temperature').textContent = Math.round(current.temperature_2m);
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(current.wind_speed_10m)} km/jam`;
    document.getElementById('wind-dir').textContent = getWindDirection(current.wind_direction_10m);

    // 2. Update Kualitas Udara (ISPU/AQI)
    const aqi = Math.round(dataAir.current.us_aqi);
    const ispuValEl = document.querySelector('.ispu-val');
    const ispuLabelEl = document.querySelector('.ispu-label');
    const ispuContainer = document.querySelector('.ispu-status');

    ispuValEl.textContent = aqi;

    // Evaluasi Indeks ISPU
    if (aqi <= 50) {
      ispuLabelEl.textContent = 'BAIK';
      ispuContainer.className = 'ispu-status good';
    } else if (aqi <= 100) {
      ispuLabelEl.textContent = 'SEDANG';
      ispuContainer.className = 'ispu-status moderate';
    } else {
      ispuLabelEl.textContent = 'TIDAK SEHAT';
      ispuContainer.className = 'ispu-status unhealthy';
    }

  } catch (error) {
    console.error('Gagal mengambil data cuaca/ISPU:', error);
  }
}

// Helper: Konversi derajat arah angin ke mata angin
function getWindDirection(degree) {
  const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  return directions[Math.round(degree / 45) % 8];
}

