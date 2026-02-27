/* ============================================================
   THE WITCH'S WEATHER GLASS — script.js
   ============================================================ */

const API_KEY = "f299a5114970c339b29accfb86e8b629";

// ── DOM REFS ──────────────────────────────────────────────────
const inputEl       = document.querySelector("#user-input");
const searchForm    = document.querySelector("#search-form");
const geoBtn        = document.querySelector("#geo-btn");
const searchHistEl  = document.querySelector("#search-history");
const dashboard     = document.querySelector("#dashboard");
const emptyState    = document.querySelector("#empty-state");
const currentInner  = document.querySelector("#current-inner");
const moonSymbolEl  = document.querySelector("#moon-symbol");
const moonNameEl    = document.querySelector("#moon-phase-name");
const moonFlavorEl  = document.querySelector("#moon-flavor");
const constInner    = document.querySelector("#constellation-inner");
const forecastInner = document.querySelector("#forecast-inner");

// ── STATE ─────────────────────────────────────────────────────
let searchHistory = JSON.parse(localStorage.getItem("weather-search-history")) || [];
let useCelsius    = false;
let lastTempK     = null;   // store raw Kelvin so we can toggle units without re-fetching
let lastForecast  = [];     // store raw forecast list

// ── WITCHY FLAVOR TEXT ────────────────────────────────────────
const weatherFlavor = {
  Thunderstorm: ["The heavens wage war tonight.", "Thunder echoes through the astral plane.", "Zeus hurls his fury earthward."],
  Drizzle:      ["A gentle hex falls from above.", "The sky weeps softly, as if in mourning.", "Sprites dance in the silver mist."],
  Rain:         ["The veil between worlds grows thin.", "Raindrops carry old spells downward.", "The earth drinks deep of sky-magic."],
  Snow:         ["Winter spirits cloak the world in silence.", "The frost fae leave their crystalline marks.", "Bone-white silence settles over all."],
  Mist:         ["Shapes move in the murk — watch carefully.", "The mist conceals what the sun reveals.", "Ghosts walk in weather like this."],
  Fog:          ["Vision clouds as the Veil descends.", "Even the crows have lost their way.", "All paths lead inward in this fog."],
  Clear:        ["The stars burn bright and unobstructed.", "A clear sky — the heavens are watching.", "Fortune favors those who walk under open skies."],
  Clouds:       ["The sky keeps its secrets behind grey curtains.", "Spirits travel unseen through overcast skies.", "What brews behind those clouds?"],
  Default:      ["The skies whisper of things to come.", "Read the winds carefully today.", "The atmosphere stirs with possibility."]
};

function getWeatherFlavor(condition) {
  const key = Object.keys(weatherFlavor).find(k => condition.includes(k)) || "Default";
  const arr = weatherFlavor[key];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── TEMPERATURE CONVERSION ────────────────────────────────────
function kelvinToF(k) { return ((k - 273.15) * 9/5 + 32).toFixed(1); }
function kelvinToC(k) { return (k - 273.15).toFixed(1); }
function formatTemp(k) {
  return useCelsius ? `${kelvinToC(k)}°C` : `${kelvinToF(k)}°F`;
}

// ── MOON PHASE ────────────────────────────────────────────────
// Algorithm: known new moon reference date, then calc days elapsed → phase
const MOON_DATA = [
  { name: "New Moon",        symbol: "🌑", flavor: "A time of new beginnings and hidden magic. Set your intentions." },
  { name: "Waxing Crescent", symbol: "🌒", flavor: "The moon swells with growing power. Manifest your desires." },
  { name: "First Quarter",   symbol: "🌓", flavor: "Half-light, half-shadow. A night for decisions and action." },
  { name: "Waxing Gibbous",  symbol: "🌔", flavor: "Power builds toward fullness. Your spells gain strength." },
  { name: "Full Moon",       symbol: "🌕", flavor: "The Witch's lantern burns at its brightest. All magic amplified." },
  { name: "Waning Gibbous",  symbol: "🌖", flavor: "Release what no longer serves you under this grateful moon." },
  { name: "Last Quarter",    symbol: "🌗", flavor: "Balance tips toward darkness. Reflect and let go." },
  { name: "Waning Crescent", symbol: "🌘", flavor: "The moon retreats. Rest, cleanse, and prepare for rebirth." },
];

function getMoonPhase() {
  const knownNewMoon = new Date("2000-01-06T18:14:00Z"); // known new moon
  const now          = new Date();
  const elapsed      = (now - knownNewMoon) / 1000 / 60 / 60 / 24; // days
  const cycleLength  = 29.53058867;
  const position     = ((elapsed % cycleLength) + cycleLength) % cycleLength;
  const index        = Math.floor((position / cycleLength) * 8) % 8;
  return MOON_DATA[index];
}

function renderMoon() {
  const phase = getMoonPhase();
  moonSymbolEl.textContent = phase.symbol;
  moonNameEl.textContent   = phase.name;
  moonFlavorEl.textContent = phase.flavor;
}

// ── CONSTELLATIONS ────────────────────────────────────────────
// Visible constellations by month + hemisphere
const CONSTELLATIONS = {
  north: {
    0:  [{ name: "Orion",        glyph: "⊹", myth: "The great hunter, eternal in the winter sky." },
         { name: "Gemini",       glyph: "⊹", myth: "Castor and Pollux, immortal twins." },
         { name: "Taurus",       glyph: "⊹", myth: "The bull that Zeus became for Europa." }],
    1:  [{ name: "Orion",        glyph: "⊹", myth: "The great hunter, eternal in the winter sky." },
         { name: "Auriga",       glyph: "⊹", myth: "The charioteer who bore the goat goddess." },
         { name: "Canis Major",  glyph: "⊹", myth: "Orion's faithful hound, bearing Sirius." }],
    2:  [{ name: "Leo",          glyph: "⊹", myth: "The Nemean lion slain by Heracles." },
         { name: "Cancer",       glyph: "⊹", myth: "The crab sent by Hera to distract Heracles." },
         { name: "Hydra",        glyph: "⊹", myth: "The nine-headed serpent of Lerna." }],
    3:  [{ name: "Leo",          glyph: "⊹", myth: "The Nemean lion, pride of the spring sky." },
         { name: "Virgo",        glyph: "⊹", myth: "Demeter mourning her daughter Persephone." },
         { name: "Boötes",       glyph: "⊹", myth: "The herdsman who drives the Great Bear." }],
    4:  [{ name: "Virgo",        glyph: "⊹", myth: "The goddess of harvest and justice." },
         { name: "Boötes",       glyph: "⊹", myth: "The herdsman, bearing bright Arcturus." },
         { name: "Corvus",       glyph: "⊹", myth: "Apollo's raven, keeper of cursed secrets." }],
    5:  [{ name: "Scorpius",     glyph: "⊹", myth: "The scorpion that slew Orion — forever chasing him." },
         { name: "Libra",        glyph: "⊹", myth: "The scales of Astraea, goddess of justice." },
         { name: "Hercules",     glyph: "⊹", myth: "The divine hero, knelt in eternal labor." }],
    6:  [{ name: "Scorpius",     glyph: "⊹", myth: "Antares burns red at the scorpion's heart." },
         { name: "Sagittarius",  glyph: "⊹", myth: "The archer-centaur who guards the galactic core." },
         { name: "Lyra",         glyph: "⊹", myth: "Orpheus's lyre, placed among stars by the Muses." }],
    7:  [{ name: "Aquila",       glyph: "⊹", myth: "Zeus's eagle, carrier of divine thunderbolts." },
         { name: "Cygnus",       glyph: "⊹", myth: "Zeus disguised, or Orpheus ascending." },
         { name: "Lyra",         glyph: "⊹", myth: "Orpheus's lyre weeps across the summer sky." }],
    8:  [{ name: "Pegasus",      glyph: "⊹", myth: "The winged horse born from Medusa's blood." },
         { name: "Andromeda",    glyph: "⊹", myth: "The princess chained for her mother's vanity." },
         { name: "Aquarius",     glyph: "⊹", myth: "Ganymede pouring the waters of immortality." }],
    9:  [{ name: "Perseus",      glyph: "⊹", myth: "The hero who freed Andromeda from the sea-beast." },
         { name: "Aries",        glyph: "⊹", myth: "The golden ram that carried Phrixus to safety." },
         { name: "Pisces",       glyph: "⊹", myth: "Aphrodite and Eros, escaped as fish." }],
    10: [{ name: "Orion",        glyph: "⊹", myth: "The hunter returns at winter's edge." },
         { name: "Perseus",      glyph: "⊹", myth: "Still bearing the Gorgon's severed head." },
         { name: "Cassiopeia",   glyph: "⊹", myth: "The vain queen, forever circling the pole." }],
    11: [{ name: "Orion",        glyph: "⊹", myth: "The great hunter, at his peak in winter cold." },
         { name: "Gemini",       glyph: "⊹", myth: "The twins ascend as winter deepens." },
         { name: "Canis Minor",  glyph: "⊹", myth: "Orion's smaller hound, bearing bright Procyon." }],
  },
  south: {
    0:  [{ name: "Centaurus",    glyph: "⊹", myth: "Chiron, wisest of centaurs, tutor of heroes." },
         { name: "Vela",         glyph: "⊹", myth: "The sail of the Argo, Jason's fabled ship." },
         { name: "Crux",         glyph: "⊹", myth: "The Southern Cross, a navigator's sacred compass." }],
    1:  [{ name: "Crux",         glyph: "⊹", myth: "The Southern Cross burns bright in autumn skies." },
         { name: "Centaurus",    glyph: "⊹", myth: "Alpha and Beta Centauri point the way." },
         { name: "Carina",       glyph: "⊹", myth: "The keel of the Argo, bearing Canopus." }],
    2:  [{ name: "Crux",         glyph: "⊹", myth: "The Southern Cross reaches its zenith." },
         { name: "Virgo",        glyph: "⊹", myth: "Spica pierces the southern autumn sky." },
         { name: "Hydra",        glyph: "⊹", myth: "The serpent stretches across the heavens." }],
    3:  [{ name: "Scorpius",     glyph: "⊹", myth: "The scorpion rises high in southern winter." },
         { name: "Lupus",        glyph: "⊹", myth: "The wolf, sacrificed by the Centaur." },
         { name: "Centaurus",    glyph: "⊹", myth: "The wise centaur reaches his highest arc." }],
    4:  [{ name: "Scorpius",     glyph: "⊹", myth: "Antares blazes at the heart of the scorpion." },
         { name: "Sagittarius",  glyph: "⊹", myth: "The archer aims toward the galactic center." },
         { name: "Corona Aus.",  glyph: "⊹", myth: "The southern crown, wreath of ancient mystery." }],
    5:  [{ name: "Sagittarius",  glyph: "⊹", myth: "The galactic core blazes behind the archer." },
         { name: "Scorpius",     glyph: "⊹", myth: "The scorpion at its proud southern peak." },
         { name: "Ara",          glyph: "⊹", myth: "The altar where the gods swore their oath." }],
    6:  [{ name: "Pavo",         glyph: "⊹", myth: "Hera's sacred peacock, eyes in its feathers." },
         { name: "Grus",         glyph: "⊹", myth: "The crane, wading through the winter Milky Way." },
         { name: "Tucana",       glyph: "⊹", myth: "Keeper of the Small Magellanic Cloud." }],
    7:  [{ name: "Piscis Aus.",  glyph: "⊹", myth: "The fish drinking from Aquarius's endless stream." },
         { name: "Phoenix",      glyph: "⊹", myth: "The bird reborn from its own sacred ashes." },
         { name: "Sculptor",     glyph: "⊹", myth: "The workshop of Pygmalion, maker of Galatea." }],
    8:  [{ name: "Eridanus",     glyph: "⊹", myth: "The great river Phaethon fell into from the sun." },
         { name: "Fornax",       glyph: "⊹", myth: "The furnace of the ancient alchemist stars." },
         { name: "Phoenix",      glyph: "⊹", myth: "Still rising from flame in the southern skies." }],
    9:  [{ name: "Orion",        glyph: "⊹", myth: "The hunter walks upside-down in southern skies." },
         { name: "Lepus",        glyph: "⊹", myth: "The hare forever fleeing Orion's pursuit." },
         { name: "Columba",      glyph: "⊹", myth: "The dove that guided Noah, set among stars." }],
    10: [{ name: "Canis Major",  glyph: "⊹", myth: "Sirius blazes fierce in southern summer heat." },
         { name: "Puppis",       glyph: "⊹", myth: "The stern of the great Argo sails on." },
         { name: "Pictor",       glyph: "⊹", myth: "The painter's easel, resting near Canopus." }],
    11: [{ name: "Vela",         glyph: "⊹", myth: "The Argo's sails catch the summer solstice wind." },
         { name: "Centaurus",    glyph: "⊹", myth: "Chiron returns to prominence in late summer." },
         { name: "Crux",         glyph: "⊹", myth: "The Southern Cross begins its slow ascent." }],
  }
};

function getConstellations(lat) {
  const month  = new Date().getMonth();
  const hemi   = lat >= 0 ? "north" : "south";
  return CONSTELLATIONS[hemi][month];
}

function renderConstellations(lat) {
  const list = getConstellations(lat);
  constInner.innerHTML = `<ul class="constellation-list">` +
    list.map(c => `
      <li class="constellation-item">
        <span class="constellation-glyph">${c.glyph}</span>
        <div>
          <span class="constellation-name">${c.name}</span>
          <span class="constellation-myth">${c.myth}</span>
        </div>
      </li>`).join("") +
    `</ul>`;
}

// ── STARFIELD CANVAS ──────────────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById("starfield");
  const ctx    = canvas.getContext("2d");
  let stars    = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars(n) {
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        r:       Math.random() * 1.2 + 0.2,
        alpha:   Math.random(),
        speed:   Math.random() * 0.005 + 0.002,
        phase:   Math.random() * Math.PI * 2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() / 1000;
    stars.forEach(s => {
      const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.speed * 10 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 213, 163, ${a * 0.7})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); createStars(200); });
  resize();
  createStars(200);
  draw();
}

// ── RENDER CURRENT WEATHER ────────────────────────────────────
function renderCurrent(data, lat) {
  lastTempK = data.list[0].main.temp;
  const city    = data.city.name;
  const country = data.city.country;
  const rawDate = data.list[0].dt_txt;
  const date    = new Date(rawDate).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
  const icon    = data.list[0].weather[0].icon;
  const cond    = data.list[0].weather[0].main;
  const desc    = data.list[0].weather[0].description;
  const humidity  = data.list[0].main.humidity;
  const windMs    = data.list[0].wind.speed;
  const windMph   = (windMs * 2.237).toFixed(1);
  const flavor    = getWeatherFlavor(cond);

  currentInner.innerHTML = `
    <div class="current-city">${city}, ${country}</div>
    <div class="current-date">${date}</div>
    <div class="current-main">
      <img class="current-icon" 
           src="https://openweathermap.org/img/wn/${icon}@2x.png" 
           alt="${desc}" />
      <div>
        <div class="current-temp" id="current-temp-display">${formatTemp(lastTempK)}</div>
        <button class="temp-toggle" id="temp-toggle">Switch to ${useCelsius ? '°F' : '°C'}</button>
      </div>
    </div>
    <div class="current-desc">"${flavor}"</div>
    <div class="current-stats">
      <div class="stat"><span>Condition</span>${desc}</div>
      <div class="stat"><span>Humidity</span>${humidity}%</div>
      <div class="stat"><span>Wind</span>${windMph} mph</div>
      <div class="stat"><span>Feels Like</span>${formatTemp(data.list[0].main.feels_like)}</div>
    </div>
  `;

  // temp toggle
  document.getElementById("temp-toggle").addEventListener("click", () => {
    useCelsius = !useCelsius;
    document.getElementById("current-temp-display").textContent = formatTemp(lastTempK);
    document.getElementById("temp-toggle").textContent = `Switch to ${useCelsius ? '°F' : '°C'}`;
    renderForecast(); // re-render forecast with new units
  });

  // render moon (always current date)
  renderMoon();

  // render constellations based on city lat
  renderConstellations(lat);
}

// ── RENDER FORECAST ───────────────────────────────────────────
function renderForecast() {
  forecastInner.innerHTML = "";
  lastForecast.forEach(item => {
    const date    = new Date(item.dt_txt).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
    const icon    = item.weather[0].icon;
    const desc    = item.weather[0].description;
    const humidity = item.main.humidity;
    const windMph  = (item.wind.speed * 2.237).toFixed(1);
    const card = document.createElement("div");
    card.classList.add("forecast-card");
    card.innerHTML = `
      <div class="forecast-date">${date}</div>
      <img class="forecast-icon" 
           src="https://openweathermap.org/img/wn/${icon}@2x.png" 
           alt="${desc}" />
      <div class="forecast-temp">${formatTemp(item.main.temp)}</div>
      <div class="forecast-desc">${desc}</div>
      <div class="forecast-stats">💧 ${humidity}% &nbsp; 🜁 ${windMph}mph</div>
    `;
    forecastInner.appendChild(card);
  });
}

// ── FETCH WEATHER ─────────────────────────────────────────────
function fetchWeather(cityOrCoords) {
  // cityOrCoords: string (city name) or {lat, lon}
  let url;
  let displayCity;

  if (typeof cityOrCoords === "string") {
    displayCity = cityOrCoords;
    url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityOrCoords)}&cnt=40&appid=${API_KEY}`;
  } else {
    const { lat, lon } = cityOrCoords;
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=40&appid=${API_KEY}`;
  }

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("City not found or API error");
      return res.json();
    })
    .then(data => {
      const cityName = data.city.name;
      const lat      = data.city.coord.lat;

      // save to history (avoid duplicates)
      if (!searchHistory.includes(cityName)) {
        searchHistory.push(cityName);
        if (searchHistory.length > 8) searchHistory.shift(); // cap at 8
        localStorage.setItem("weather-search-history", JSON.stringify(searchHistory));
        addHistoryButton(cityName);
      }

      // pick forecast items at ~24hr intervals (every 8th item starting at index 7)
      lastForecast = [];
      for (let i = 7; i < data.list.length; i += 8) {
        lastForecast.push(data.list[i]);
        if (lastForecast.length === 5) break;
      }

      // show dashboard
      emptyState.classList.add("hidden");
      dashboard.classList.remove("hidden");

      renderCurrent(data, lat);
      renderForecast();
    })
    .catch(err => {
      alert(`✦ The crystal ball is clouded: ${err.message}`);
    });
}

// ── SEARCH HISTORY ────────────────────────────────────────────
function addHistoryButton(city) {
  const btn = document.createElement("button");
  btn.classList.add("history-btn");
  btn.textContent = city;
  btn.addEventListener("click", () => fetchWeather(city));
  searchHistEl.appendChild(btn);
}

function loadSearchHistory() {
  searchHistEl.innerHTML = "";
  searchHistory.forEach(city => addHistoryButton(city));
}

// ── EVENT LISTENERS ───────────────────────────────────────────
searchForm.addEventListener("submit", e => {
  e.preventDefault();
  const city = inputEl.value.trim();
  if (!city) return;
  fetchWeather(city);
  inputEl.value = "";
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("✦ Your browser does not support geolocation.");
    return;
  }
  geoBtn.textContent = "⊕ Divining your location...";
  navigator.geolocation.getCurrentPosition(
    pos => {
      geoBtn.textContent = "⊕ Use My Location";
      fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    },
    () => {
      geoBtn.textContent = "⊕ Use My Location";
      alert("✦ The spirits could not locate you. Please check your browser permissions.");
    }
  );
});

// ── INIT ──────────────────────────────────────────────────────
initStarfield();
loadSearchHistory();