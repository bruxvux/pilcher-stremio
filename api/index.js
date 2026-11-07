const { addonBuilder, getRouter: sdkGetRouter } = require('stremio-addon-sdk');
const axios = require('axios');

// ============================================================================
// 1. MANIFEST CONFIGURATION (v2.2.0 - BILINGUAL CZ/DE, DOWNLOADS & TV-SAFE)
// ============================================================================
const manifest = {
  id: 'community.rosamunde-pilcher-zdf',
  version: '2.2.0',
  name: 'Rosamunde Pilcher (⚡ ZDF, ▶ YT & ⬇ Downloads)',
  description: 'Komplette Rosamunde Pilcher Sammlung (169 Verfilmungen) s českými a německými názvy. ⬇ = Vlastní stažené / Downloads, ⚡ = ZDFmediathek 1080p, ▶ = YouTube.',
  resources: ['catalog', 'meta', 'stream'],
  types: ['series', 'movie'],
  idPrefixes: ['tt0907694', 'tt', 'rp_'],
  catalogs: [
    {
      type: 'series',
      id: 'rp_zdf_series_catalog',
      name: 'Rosamunde Pilcher (Komplette Serie ⚡▶⬇)',
      extra: [
        { name: 'search', isRequired: false }
      ]
    },
    {
      type: 'movie',
      id: 'rp_zdf_catalog',
      name: 'Rosamunde Pilcher (Einzelfilme ⚡▶⬇)',
      extra: [
        { name: 'search', isRequired: false }
      ]
    }
  ]
};

// ============================================================================
// 2. DOWNLOADS INTEGRATION (LOCAL & REMOTE GITHUB RAW WITH AUTO-SYNC)
// ============================================================================
let downloadsCache = {
  data: {},
  lastFetch: 0
};

async function getDownloadsMap() {
  const now = Date.now();
  if (now - downloadsCache.lastFetch < 60000 && Object.keys(downloadsCache.data).length > 0) {
    return downloadsCache.data;
  }

  // 1. Remote raw GitHub
  const githubUrl = process.env.DOWNLOADS_URL || 'https://raw.githubusercontent.com/bruxvux/pilcher-stremio/main/downloads.json';
  try {
    const res = await axios.get(githubUrl, {
      timeout: 3000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.data && typeof res.data === 'object') {
      downloadsCache = { data: res.data, lastFetch: now };
      return res.data;
    }
  } catch (err) {
    // fallback to local file
  }

  // 2. Local filesystem
  try {
    const fs = require('fs');
    const path = require('path');
    const candidates = [
      path.join(__dirname, '..', 'downloads.json'),
      path.join(__dirname, 'downloads.json'),
      path.join(process.cwd(), 'downloads.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        downloadsCache = { data: parsed, lastFetch: now };
        return parsed;
      }
    }
  } catch (err) {
    // fallback
  }

  return downloadsCache.data || {};
}

function normalizeKey(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findDownload(epNum, deTitle, csTitle, downloads) {
  if (!downloads) return null;

  if (Array.isArray(downloads)) {
    for (const item of downloads) {
      if (!item) continue;
      if (item.episode === epNum || item.ep === epNum || item.number === epNum) return item;
      if (item.title) {
        const itemNorm = normalizeKey(item.title);
        if (deTitle && itemNorm.includes(normalizeKey(deTitle))) return item;
        if (csTitle && itemNorm.includes(normalizeKey(csTitle))) return item;
      }
    }
    return null;
  }

  if (typeof downloads === 'object') {
    const normDe = normalizeKey(deTitle);
    const normCs = normalizeKey(csTitle);
    const epNumStr = String(epNum);
    const epNumPad2 = epNumStr.padStart(2, '0');

    if (downloads[epNumStr]) return downloads[epNumStr];
    if (downloads[epNumPad2]) return downloads[epNumPad2];
    if (downloads[`E${epNumStr}`]) return downloads[`E${epNumStr}`];
    if (downloads[`E${epNumPad2}`]) return downloads[`E${epNumPad2}`];
    if (downloads[`EP${epNumPad2}`]) return downloads[`EP${epNumPad2}`];

    if (deTitle && downloads[deTitle]) return downloads[deTitle];
    if (csTitle && downloads[csTitle]) return downloads[csTitle];

    for (const [key, val] of Object.entries(downloads)) {
      if (key.startsWith('_')) continue;
      const kNorm = normalizeKey(key);
      if (normDe && (kNorm === normDe || kNorm.includes(normDe))) return val;
      if (normCs && (kNorm === normCs || kNorm.includes(normCs))) return val;

      const epPatterns = [
        new RegExp(`(^|[^0-9])e0*${epNum}([^0-9]|$)`, 'i'),
        new RegExp(`(^|[^0-9])ep0*${epNum}([^0-9]|$)`, 'i'),
        new RegExp(`(^|[^0-9])0*${epNum}([^0-9]|$)`, 'i')
      ];
      if (key.toLowerCase().includes('rosamunde') || key.toLowerCase().includes('pilcher')) {
        for (const pat of epPatterns) {
          if (pat.test(key)) return val;
        }
      }
    }
  }

  return null;
}

// ============================================================================
// 3. ENRICHED BILINGUAL METADATA DATABASES (169 EPISODES)
// ============================================================================
const SERIES_VIDEOS = [
  {
    "id": "tt0907694:1:1",
    "name": "Bouřlivé setkání / Stürmische Begegnung",
    "title": "Bouřlivé setkání / Stürmische Begegnung",
    "titleDe": "Stürmische Begegnung",
    "titleCs": "Bouřlivé setkání",
    "season": 1,
    "number": 1,
    "episode": 1,
    "released": "1993-10-30T00:00:00.000Z",
    "firstAired": "1993-10-30T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0108240/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1993). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:2",
    "name": "Divoký tymián / Wilder Thymian",
    "title": "Divoký tymián / Wilder Thymian",
    "titleDe": "Wilder Thymian",
    "titleCs": "Divoký tymián",
    "season": 1,
    "number": 2,
    "episode": 2,
    "released": "1994-10-23T00:00:00.000Z",
    "firstAired": "1994-10-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0111721/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:3",
    "name": "▶ Kolotoč života / Karussell des Lebens",
    "title": "▶ Kolotoč života / Karussell des Lebens",
    "titleDe": "Karussell des Lebens",
    "titleCs": "Kolotoč života",
    "season": 1,
    "number": 3,
    "episode": 3,
    "released": "1994-11-13T00:00:00.000Z",
    "firstAired": "1994-11-13T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0110245/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:4",
    "name": "Milostná rošáda / Wechselspiel der Liebe",
    "title": "Milostná rošáda / Wechselspiel der Liebe",
    "titleDe": "Wechselspiel der Liebe",
    "titleCs": "Milostná rošáda",
    "season": 1,
    "number": 4,
    "episode": 4,
    "released": "1995-01-15T00:00:00.000Z",
    "firstAired": "1995-01-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0114903/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.1",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:5",
    "name": "▶ Konec jednoho léta / Das Ende eines Sommers",
    "title": "▶ Konec jednoho léta / Das Ende eines Sommers",
    "titleDe": "Das Ende eines Sommers",
    "titleCs": "Konec jednoho léta",
    "season": 1,
    "number": 5,
    "episode": 5,
    "released": "1995-02-05T00:00:00.000Z",
    "firstAired": "1995-02-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0123821/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:6",
    "name": "▶ Léto u moře / Sommer am Meer",
    "title": "▶ Léto u moře / Sommer am Meer",
    "titleDe": "Sommer am Meer",
    "titleCs": "Léto u moře",
    "season": 1,
    "number": 6,
    "episode": 6,
    "released": "1995-10-15T00:00:00.000Z",
    "firstAired": "1995-10-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0114498/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.2",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:7",
    "name": "▶ Spící tygr / Schlafender Tiger",
    "title": "▶ Spící tygr / Schlafender Tiger",
    "titleDe": "Schlafender Tiger",
    "titleCs": "Spící tygr",
    "season": 1,
    "number": 7,
    "episode": 7,
    "released": "1995-11-05T00:00:00.000Z",
    "firstAired": "1995-11-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0114353/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.1",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:8",
    "name": "▶ Mraky na obzoru / Wolken am Horizont",
    "title": "▶ Mraky na obzoru / Wolken am Horizont",
    "titleDe": "Wolken am Horizont",
    "titleCs": "Mraky na obzoru",
    "season": 1,
    "number": 8,
    "episode": 8,
    "released": "1995-01-01T00:00:00.000Z",
    "firstAired": "1995-01-01T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0126124/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:9",
    "name": "Jarní vánice / Schneesturm im Frühling",
    "title": "Jarní vánice / Schneesturm im Frühling",
    "titleDe": "Schneesturm im Frühling",
    "titleCs": "Jarní vánice",
    "season": 1,
    "number": 9,
    "episode": 9,
    "released": "1996-02-04T00:00:00.000Z",
    "firstAired": "1996-02-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0117564/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:10",
    "name": "▶ Hra světel / Lichterspiele",
    "title": "▶ Hra světel / Lichterspiele",
    "titleDe": "Lichterspiele",
    "titleCs": "Hra světel",
    "season": 1,
    "number": 10,
    "episode": 10,
    "released": "1996-03-03T00:00:00.000Z",
    "firstAired": "1996-03-03T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0116870/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.1",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:11",
    "name": "Září: Část 1 / September: Teil 1",
    "title": "Září: Část 1 / September: Teil 1",
    "titleDe": "September: Teil 1",
    "titleCs": "Září: Část 1",
    "season": 1,
    "number": 11,
    "episode": 11,
    "released": "1996-04-07T00:00:00.000Z",
    "firstAired": "1996-04-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15729598/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:12",
    "name": "Září: Část 2 / September: Teil 2",
    "title": "Září: Část 2 / September: Teil 2",
    "titleDe": "September: Teil 2",
    "titleCs": "Září: Část 2",
    "season": 1,
    "number": 12,
    "episode": 12,
    "released": "1996-04-08T00:00:00.000Z",
    "firstAired": "1996-04-08T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15741176/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:13",
    "name": "▶ Dům na pobřeží / Das Haus an der Küste",
    "title": "▶ Dům na pobřeží / Das Haus an der Küste",
    "titleDe": "Das Haus an der Küste",
    "titleCs": "Dům na pobřeží",
    "season": 1,
    "number": 13,
    "episode": 13,
    "released": "1996-11-03T00:00:00.000Z",
    "firstAired": "1996-11-03T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0116498/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:14",
    "name": "Zvláštní láska / Eine besondere Liebe",
    "title": "Zvláštní láska / Eine besondere Liebe",
    "titleDe": "Eine besondere Liebe",
    "titleCs": "Zvláštní láska",
    "season": 1,
    "number": 14,
    "episode": 14,
    "released": "1996-12-25T00:00:00.000Z",
    "firstAired": "1996-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0115659/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.1",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:15",
    "name": "Vítr naděje / Wind der Hoffnung",
    "title": "Vítr naděje / Wind der Hoffnung",
    "titleDe": "Wind der Hoffnung",
    "titleCs": "Vítr naděje",
    "season": 1,
    "number": 15,
    "episode": 15,
    "released": "1997-02-16T00:00:00.000Z",
    "firstAired": "1997-02-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0120517/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:16",
    "name": "▶ Zbloudilá srdce / Irrwege des Herzens",
    "title": "▶ Zbloudilá srdce / Irrwege des Herzens",
    "titleDe": "Irrwege des Herzens",
    "titleCs": "Zbloudilá srdce",
    "season": 1,
    "number": 16,
    "episode": 16,
    "released": "1997-03-09T00:00:00.000Z",
    "firstAired": "1997-03-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0119384/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.5",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:17",
    "name": "Hodina rozhodnutí / Stunden der Entscheidung",
    "title": "Hodina rozhodnutí / Stunden der Entscheidung",
    "titleDe": "Stunden der Entscheidung",
    "titleCs": "Hodina rozhodnutí",
    "season": 1,
    "number": 17,
    "episode": 17,
    "released": "1997-03-30T00:00:00.000Z",
    "firstAired": "1997-03-30T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0120234/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:18",
    "name": "▶ Druhá šance / Die zweite Chance",
    "title": "▶ Druhá šance / Die zweite Chance",
    "titleDe": "Die zweite Chance",
    "titleCs": "Druhá šance",
    "season": 1,
    "number": 18,
    "episode": 18,
    "released": "1997-10-12T00:00:00.000Z",
    "firstAired": "1997-10-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0128860/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.7",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:19",
    "name": "▶ Dvě sestry / Zwei Schwestern",
    "title": "▶ Dvě sestry / Zwei Schwestern",
    "titleDe": "Zwei Schwestern",
    "titleCs": "Dvě sestry",
    "season": 1,
    "number": 19,
    "episode": 19,
    "released": "1997-11-16T00:00:00.000Z",
    "firstAired": "1997-11-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0135071/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.1",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:20",
    "name": "▶ Cena lásky / Der Preis der Liebe",
    "title": "▶ Cena lásky / Der Preis der Liebe",
    "titleDe": "Der Preis der Liebe",
    "titleCs": "Cena lásky",
    "season": 1,
    "number": 20,
    "episode": 20,
    "released": "1998-02-15T00:00:00.000Z",
    "firstAired": "1998-02-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0146041/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:21",
    "name": "Návrat domů: Část 1 / Heimkehr: Teil 1",
    "title": "Návrat domů: Část 1 / Heimkehr: Teil 1",
    "titleDe": "Heimkehr: Teil 1",
    "titleCs": "Návrat domů: Část 1",
    "season": 1,
    "number": 21,
    "episode": 21,
    "released": "1998-06-01T00:00:00.000Z",
    "firstAired": "1998-06-01T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15729564/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:22",
    "name": "Návrat domů: Část 2 / Heimkehr: Teil 2",
    "title": "Návrat domů: Část 2 / Heimkehr: Teil 2",
    "titleDe": "Heimkehr: Teil 2",
    "titleCs": "Návrat domů: Část 2",
    "season": 1,
    "number": 22,
    "episode": 22,
    "released": "1998-06-07T00:00:00.000Z",
    "firstAired": "1998-06-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15729560/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:23",
    "name": "▶ Návrat do ráje / Rückkehr ins Paradies",
    "title": "▶ Návrat do ráje / Rückkehr ins Paradies",
    "titleDe": "Rückkehr ins Paradies",
    "titleCs": "Návrat do ráje",
    "season": 1,
    "number": 23,
    "episode": 23,
    "released": "1998-09-20T00:00:00.000Z",
    "firstAired": "1998-09-20T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0170520/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:24",
    "name": "▶ Trny v údolí květin / Dornen im Tal der Blumen",
    "title": "▶ Trny v údolí květin / Dornen im Tal der Blumen",
    "titleDe": "Dornen im Tal der Blumen",
    "titleCs": "Trny v údolí květin",
    "season": 1,
    "number": 24,
    "episode": 24,
    "released": "1998-12-13T00:00:00.000Z",
    "firstAired": "1998-12-13T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0177180/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:25",
    "name": "▶ Hudba v srdcích / Melodie der Herzen",
    "title": "▶ Hudba v srdcích / Melodie der Herzen",
    "titleDe": "Melodie der Herzen",
    "titleCs": "Hudba v srdcích",
    "season": 1,
    "number": 25,
    "episode": 25,
    "released": "1998-12-25T00:00:00.000Z",
    "firstAired": "1998-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0181794/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:26",
    "name": "▶ Kouzlo lásky / Magie der Liebe",
    "title": "▶ Kouzlo lásky / Magie der Liebe",
    "titleDe": "Magie der Liebe",
    "titleCs": "Kouzlo lásky",
    "season": 1,
    "number": 26,
    "episode": 26,
    "released": "1999-01-17T00:00:00.000Z",
    "firstAired": "1999-01-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0184868/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:27",
    "name": "▶ Růže v bouři / Rosen im Sturm",
    "title": "▶ Růže v bouři / Rosen im Sturm",
    "titleDe": "Rosen im Sturm",
    "titleCs": "Růže v bouři",
    "season": 1,
    "number": 27,
    "episode": 27,
    "released": "1999-02-14T00:00:00.000Z",
    "firstAired": "1999-02-14T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0188183/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:28",
    "name": "▶ Nancherrow: Část 1 / Das große Erbe: Teil 1",
    "title": "▶ Nancherrow: Část 1 / Das große Erbe: Teil 1",
    "titleDe": "Das große Erbe: Teil 1",
    "titleCs": "Nancherrow: Část 1",
    "season": 1,
    "number": 28,
    "episode": 28,
    "released": "1999-05-23T00:00:00.000Z",
    "firstAired": "1999-05-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15740730/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:29",
    "name": "▶ Nancherrow: Část 2 / Das große Erbe: Teil 2",
    "title": "▶ Nancherrow: Část 2 / Das große Erbe: Teil 2",
    "titleDe": "Das große Erbe: Teil 2",
    "titleCs": "Nancherrow: Část 2",
    "season": 1,
    "number": 29,
    "episode": 29,
    "released": "1999-05-24T00:00:00.000Z",
    "firstAired": "1999-05-24T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15740738/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:30",
    "name": "▶ Útesy lásky / Klippen der Liebe",
    "title": "▶ Útesy lásky / Klippen der Liebe",
    "titleDe": "Klippen der Liebe",
    "titleCs": "Útesy lásky",
    "season": 1,
    "number": 30,
    "episode": 30,
    "released": "1999-09-19T00:00:00.000Z",
    "firstAired": "1999-09-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0217605/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.7",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:31",
    "name": "Rackové ve větru / Möwen im Wind",
    "title": "Rackové ve větru / Möwen im Wind",
    "titleDe": "Möwen im Wind",
    "titleCs": "Rackové ve větru",
    "season": 1,
    "number": 31,
    "episode": 31,
    "released": "1999-11-28T00:00:00.000Z",
    "firstAired": "1999-11-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0222330/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:32",
    "name": "▶ Květ života / Blüte des Lebens",
    "title": "▶ Květ života / Blüte des Lebens",
    "titleDe": "Blüte des Lebens",
    "titleCs": "Květ života",
    "season": 1,
    "number": 32,
    "episode": 32,
    "released": "1999-12-12T00:00:00.000Z",
    "firstAired": "1999-12-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0226390/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.5",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:33",
    "name": "Dlouhá cesta ke štěstí / Der lange Weg zum Glück",
    "title": "Dlouhá cesta ke štěstí / Der lange Weg zum Glück",
    "titleDe": "Der lange Weg zum Glück",
    "titleCs": "Dlouhá cesta ke štěstí",
    "season": 1,
    "number": 33,
    "episode": 33,
    "released": "2000-01-16T00:00:00.000Z",
    "firstAired": "2000-01-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0230712/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.8",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:34",
    "name": "Čas poznání / Zeit der Erkenntnis",
    "title": "Čas poznání / Zeit der Erkenntnis",
    "titleDe": "Zeit der Erkenntnis",
    "titleCs": "Čas poznání",
    "season": 1,
    "number": 34,
    "episode": 34,
    "released": "2000-04-23T00:00:00.000Z",
    "firstAired": "2000-04-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0244176/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:35",
    "name": "Rozervaná srdce / Zerrissene Herzen",
    "title": "Rozervaná srdce / Zerrissene Herzen",
    "titleDe": "Zerrissene Herzen",
    "titleCs": "Rozervaná srdce",
    "season": 1,
    "number": 35,
    "episode": 35,
    "released": "2000-10-15T00:00:00.000Z",
    "firstAired": "2000-10-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0262737/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:36",
    "name": "Volání minulosti / Ruf der Vergangenheit",
    "title": "Volání minulosti / Ruf der Vergangenheit",
    "titleDe": "Ruf der Vergangenheit",
    "titleCs": "Volání minulosti",
    "season": 1,
    "number": 36,
    "episode": 36,
    "released": "2000-11-12T00:00:00.000Z",
    "firstAired": "2000-11-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0266913/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:37",
    "name": "▶ Ve svitu ohně / Im Licht des Feuers",
    "title": "▶ Ve svitu ohně / Im Licht des Feuers",
    "titleDe": "Im Licht des Feuers",
    "titleCs": "Ve svitu ohně",
    "season": 1,
    "number": 37,
    "episode": 37,
    "released": "2000-12-17T00:00:00.000Z",
    "firstAired": "2000-12-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0271760/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:38",
    "name": "Růže z Kerrymoru / Die Rose von Kerrymore",
    "title": "Růže z Kerrymoru / Die Rose von Kerrymore",
    "titleDe": "Die Rose von Kerrymore",
    "titleCs": "Růže z Kerrymoru",
    "season": 1,
    "number": 38,
    "episode": 38,
    "released": "2001-01-07T00:00:00.000Z",
    "firstAired": "2001-01-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0272817/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:39",
    "name": "Pobřeží snů / Küste der Träume",
    "title": "Pobřeží snů / Küste der Träume",
    "titleDe": "Küste der Träume",
    "titleCs": "Pobřeží snů",
    "season": 1,
    "number": 39,
    "episode": 39,
    "released": "2001-02-04T00:00:00.000Z",
    "firstAired": "2001-02-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0275637/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:40",
    "name": "Děti štěstěny / Kinder des Glücks",
    "title": "Děti štěstěny / Kinder des Glücks",
    "titleDe": "Kinder des Glücks",
    "titleCs": "Děti štěstěny",
    "season": 1,
    "number": 40,
    "episode": 40,
    "released": "2002-01-27T00:00:00.000Z",
    "firstAired": "2002-01-27T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0300428/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:41",
    "name": "Vítr nad řekou / Wind über dem Fluss",
    "title": "Vítr nad řekou / Wind über dem Fluss",
    "titleDe": "Wind über dem Fluss",
    "titleCs": "Vítr nad řekou",
    "season": 1,
    "number": 41,
    "episode": 41,
    "released": "2001-11-11T00:00:00.000Z",
    "firstAired": "2001-11-11T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0301782/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:42",
    "name": "▶ Květiny v dešti / Blumen im Regen",
    "title": "▶ Květiny v dešti / Blumen im Regen",
    "titleDe": "Blumen im Regen",
    "titleCs": "Květiny v dešti",
    "season": 1,
    "number": 42,
    "episode": 42,
    "released": "2001-12-16T00:00:00.000Z",
    "firstAired": "2001-12-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0304642/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.9",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:43",
    "name": "To hlavní je láska / Wenn nur noch Liebe zählt",
    "title": "To hlavní je láska / Wenn nur noch Liebe zählt",
    "titleDe": "Wenn nur noch Liebe zählt",
    "titleCs": "To hlavní je láska",
    "season": 1,
    "number": 43,
    "episode": 43,
    "released": "2002-02-10T00:00:00.000Z",
    "firstAired": "2002-02-10T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0310081/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:44",
    "name": "Šťastná náhoda / Morgen träumen wir gemeinsam",
    "title": "Šťastná náhoda / Morgen träumen wir gemeinsam",
    "titleDe": "Morgen träumen wir gemeinsam",
    "titleCs": "Šťastná náhoda",
    "season": 1,
    "number": 44,
    "episode": 44,
    "released": "2002-04-01T00:00:00.000Z",
    "firstAired": "2002-04-01T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0316507/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:45",
    "name": "Očima lásky / Mit den Augen der Liebe",
    "title": "Očima lásky / Mit den Augen der Liebe",
    "titleDe": "Mit den Augen der Liebe",
    "titleCs": "Očima lásky",
    "season": 1,
    "number": 45,
    "episode": 45,
    "released": "2002-09-15T00:00:00.000Z",
    "firstAired": "2002-09-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0337119/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:46",
    "name": "▶ Až na konec světa / Bis ans Ende der Welt",
    "title": "▶ Až na konec světa / Bis ans Ende der Welt",
    "titleDe": "Bis ans Ende der Welt",
    "titleCs": "Až na konec světa",
    "season": 1,
    "number": 46,
    "episode": 46,
    "released": "2002-12-08T00:00:00.000Z",
    "firstAired": "2002-12-08T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0345873/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:47",
    "name": "Padající hvězda / Sternschnuppen im August",
    "title": "Padající hvězda / Sternschnuppen im August",
    "titleDe": "Sternschnuppen im August",
    "titleCs": "Padající hvězda",
    "season": 1,
    "number": 47,
    "episode": 47,
    "released": "2003-01-05T00:00:00.000Z",
    "firstAired": "2003-01-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0348739/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:48",
    "name": "Ráj snů / Paradies der Träume",
    "title": "Ráj snů / Paradies der Träume",
    "titleDe": "Paradies der Träume",
    "titleCs": "Ráj snů",
    "season": 1,
    "number": 48,
    "episode": 48,
    "released": "2003-02-02T00:00:00.000Z",
    "firstAired": "2003-02-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0353957/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:49",
    "name": "Plamen lásky / Flamme der Liebe",
    "title": "Plamen lásky / Flamme der Liebe",
    "titleDe": "Flamme der Liebe",
    "titleCs": "Plamen lásky",
    "season": 1,
    "number": 49,
    "episode": 49,
    "released": "2003-03-09T00:00:00.000Z",
    "firstAired": "2003-03-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0357109/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:50",
    "name": "Srdce se nemýlí / Gewissheit des Herzens",
    "title": "Srdce se nemýlí / Gewissheit des Herzens",
    "titleDe": "Gewissheit des Herzens",
    "titleCs": "Srdce se nemýlí",
    "season": 1,
    "number": 50,
    "episode": 50,
    "released": "2003-11-09T00:00:00.000Z",
    "firstAired": "2003-11-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0386755/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:51",
    "name": "Zimní slunovrat / Wintersonne (1+2)",
    "title": "Zimní slunovrat / Wintersonne (1+2)",
    "titleDe": "Wintersonne (1+2)",
    "titleCs": "Zimní slunovrat",
    "season": 1,
    "number": 51,
    "episode": 51,
    "released": "2003-12-25T00:00:00.000Z",
    "firstAired": "2003-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15727968/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:52",
    "name": "Pírka ve větru / Federn im Wind",
    "title": "Pírka ve větru / Federn im Wind",
    "titleDe": "Federn im Wind",
    "titleCs": "Pírka ve větru",
    "season": 1,
    "number": 52,
    "episode": 52,
    "released": "2004-01-04T00:00:00.000Z",
    "firstAired": "2004-01-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0396843/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:53",
    "name": "Cesty lásky / Wege der Liebe",
    "title": "Cesty lásky / Wege der Liebe",
    "titleDe": "Wege der Liebe",
    "titleCs": "Cesty lásky",
    "season": 1,
    "number": 53,
    "episode": 53,
    "released": "2004-01-18T00:00:00.000Z",
    "firstAired": "2004-01-18T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0393657/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:54",
    "name": "Dokud jsi tady / Solange es dich gibt",
    "title": "Dokud jsi tady / Solange es dich gibt",
    "titleDe": "Solange es dich gibt",
    "titleCs": "Dokud jsi tady",
    "season": 1,
    "number": 54,
    "episode": 54,
    "released": "2004-03-28T00:00:00.000Z",
    "firstAired": "2004-03-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0433629/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:55",
    "name": "Láska ve hře / Liebe im Spiel",
    "title": "Láska ve hře / Liebe im Spiel",
    "titleDe": "Liebe im Spiel",
    "titleCs": "Láska ve hře",
    "season": 1,
    "number": 55,
    "episode": 55,
    "released": "2004-04-25T00:00:00.000Z",
    "firstAired": "2004-04-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0410534/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:56",
    "name": "Sen jednoho léta / Traum eines Sommers",
    "title": "Sen jednoho léta / Traum eines Sommers",
    "titleDe": "Traum eines Sommers",
    "titleCs": "Sen jednoho léta",
    "season": 1,
    "number": 56,
    "episode": 56,
    "released": "2004-09-19T00:00:00.000Z",
    "firstAired": "2004-09-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450119/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:57",
    "name": "Pouto lásky / Tiefe der Gefühle",
    "title": "Pouto lásky / Tiefe der Gefühle",
    "titleDe": "Tiefe der Gefühle",
    "titleCs": "Pouto lásky",
    "season": 1,
    "number": 57,
    "episode": 57,
    "released": "2004-12-05T00:00:00.000Z",
    "firstAired": "2004-12-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0432346/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:58",
    "name": "▶ Tak blízko nebi / Dem Himmel so nah",
    "title": "▶ Tak blízko nebi / Dem Himmel so nah",
    "titleDe": "Dem Himmel so nah",
    "titleCs": "Tak blízko nebi",
    "season": 1,
    "number": 58,
    "episode": 58,
    "released": "2004-12-25T00:00:00.000Z",
    "firstAired": "2004-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450116/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.6",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:59",
    "name": "Odkaz lásky / Vermächtnis der Liebe",
    "title": "Odkaz lásky / Vermächtnis der Liebe",
    "titleDe": "Vermächtnis der Liebe",
    "titleCs": "Odkaz lásky",
    "season": 1,
    "number": 59,
    "episode": 59,
    "released": "2005-01-02T00:00:00.000Z",
    "firstAired": "2005-01-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450120/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:60",
    "name": "Královna noci / Königin der Nacht",
    "title": "Královna noci / Königin der Nacht",
    "titleDe": "Königin der Nacht",
    "titleCs": "Královna noci",
    "season": 1,
    "number": 60,
    "episode": 60,
    "released": "2005-02-06T00:00:00.000Z",
    "firstAired": "2005-02-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450117/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:61",
    "name": "Plachetnice lásky / Segel der Liebe",
    "title": "Plachetnice lásky / Segel der Liebe",
    "titleDe": "Segel der Liebe",
    "titleCs": "Plachetnice lásky",
    "season": 1,
    "number": 61,
    "episode": 61,
    "released": "2005-03-28T00:00:00.000Z",
    "firstAired": "2005-03-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450118/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:62",
    "name": "▶ Nad oblaky / Über den Wolken",
    "title": "▶ Nad oblaky / Über den Wolken",
    "titleDe": "Über den Wolken",
    "titleCs": "Nad oblaky",
    "season": 1,
    "number": 62,
    "episode": 62,
    "released": "2005-10-02T00:00:00.000Z",
    "firstAired": "2005-10-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0491128/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.5",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:63",
    "name": "Letní slunovrat / Zauber der Liebe (1+2)",
    "title": "Letní slunovrat / Zauber der Liebe (1+2)",
    "titleDe": "Zauber der Liebe (1+2)",
    "titleCs": "Letní slunovrat",
    "season": 1,
    "number": 63,
    "episode": 63,
    "released": "2005-12-25T00:00:00.000Z",
    "firstAired": "2005-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15727726/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:64",
    "name": "Cornwallská romance / Der Himmel über Cornwall",
    "title": "Cornwallská romance / Der Himmel über Cornwall",
    "titleDe": "Der Himmel über Cornwall",
    "titleCs": "Cornwallská romance",
    "season": 1,
    "number": 64,
    "episode": 64,
    "released": "2005-12-28T00:00:00.000Z",
    "firstAired": "2005-12-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0777270/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:65",
    "name": "Rodný statek / Land der Sehnsucht",
    "title": "Rodný statek / Land der Sehnsucht",
    "titleDe": "Land der Sehnsucht",
    "titleCs": "Rodný statek",
    "season": 1,
    "number": 65,
    "episode": 65,
    "released": "2006-01-22T00:00:00.000Z",
    "firstAired": "2006-01-22T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0497438/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:66",
    "name": "Kouzelné léto / Sommer des Erwachens",
    "title": "Kouzelné léto / Sommer des Erwachens",
    "titleDe": "Sommer des Erwachens",
    "titleCs": "Kouzelné léto",
    "season": 1,
    "number": 66,
    "episode": 66,
    "released": "2006-02-05T00:00:00.000Z",
    "firstAired": "2006-02-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0499557/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.1",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:67",
    "name": "Kde začala láska / Wo die Liebe begann",
    "title": "Kde začala láska / Wo die Liebe begann",
    "titleDe": "Wo die Liebe begann",
    "titleCs": "Kde začala láska",
    "season": 1,
    "number": 67,
    "episode": 67,
    "released": "2006-09-17T00:00:00.000Z",
    "firstAired": "2006-09-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0857260/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:68",
    "name": "Láska jejího života / Die Liebe ihres Lebens",
    "title": "Láska jejího života / Die Liebe ihres Lebens",
    "titleDe": "Die Liebe ihres Lebens",
    "titleCs": "Láska jejího života",
    "season": 1,
    "number": 68,
    "episode": 68,
    "released": "2006-10-08T00:00:00.000Z",
    "firstAired": "2006-10-08T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0872156/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:69",
    "name": "▶ A najednou to byla láska / Und plötzlich war es Liebe",
    "title": "▶ A najednou to byla láska / Und plötzlich war es Liebe",
    "titleDe": "Und plötzlich war es Liebe",
    "titleCs": "A najednou to byla láska",
    "season": 1,
    "number": 69,
    "episode": 69,
    "released": "2006-12-03T00:00:00.000Z",
    "firstAired": "2006-12-03T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0903964/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:71",
    "name": "Vítr nad řekou / Wiedersehen am Fluss",
    "title": "Vítr nad řekou / Wiedersehen am Fluss",
    "titleDe": "Wiedersehen am Fluss",
    "titleCs": "Vítr nad řekou",
    "season": 1,
    "number": 71,
    "episode": 71,
    "released": "2007-02-04T00:00:00.000Z",
    "firstAired": "2007-02-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0943113/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:72",
    "name": "Sommer der Liebe",
    "title": "Sommer der Liebe",
    "titleDe": "Sommer der Liebe",
    "titleCs": null,
    "season": 1,
    "number": 72,
    "episode": 72,
    "released": "2007-04-09T00:00:00.000Z",
    "firstAired": "2007-04-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0988802/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:73",
    "name": "Křídla naděje / Flügel der Hoffnung",
    "title": "Křídla naděje / Flügel der Hoffnung",
    "titleDe": "Flügel der Hoffnung",
    "titleCs": "Křídla naděje",
    "season": 1,
    "number": 73,
    "episode": 73,
    "released": "2007-04-15T00:00:00.000Z",
    "firstAired": "2007-04-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0988801/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:74",
    "name": "Muž mých snů / Der Mann meiner Träume",
    "title": "Muž mých snů / Der Mann meiner Träume",
    "titleDe": "Der Mann meiner Träume",
    "titleCs": "Muž mých snů",
    "season": 1,
    "number": 74,
    "episode": 74,
    "released": "2007-09-23T00:00:00.000Z",
    "firstAired": "2007-09-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1096981/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:75",
    "name": "Vítězství lásky / Sieg der Liebe",
    "title": "Vítězství lásky / Sieg der Liebe",
    "titleDe": "Sieg der Liebe",
    "titleCs": "Vítězství lásky",
    "season": 1,
    "number": 75,
    "episode": 75,
    "released": "2007-10-07T00:00:00.000Z",
    "firstAired": "2007-10-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1106607/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:76",
    "name": "Mlha nad zámkem Kilrush / Nebel über Schloss Kilrush",
    "title": "Mlha nad zámkem Kilrush / Nebel über Schloss Kilrush",
    "titleDe": "Nebel über Schloss Kilrush",
    "titleCs": "Mlha nad zámkem Kilrush",
    "season": 1,
    "number": 76,
    "episode": 76,
    "released": "2007-11-11T00:00:00.000Z",
    "firstAired": "2007-11-11T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1125243/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:77",
    "name": "▶ Láska nepomíjí / Aus Liebe und Leidenschaft",
    "title": "▶ Láska nepomíjí / Aus Liebe und Leidenschaft",
    "titleDe": "Aus Liebe und Leidenschaft",
    "titleCs": "Láska nepomíjí",
    "season": 1,
    "number": 77,
    "episode": 77,
    "released": "2007-12-02T00:00:00.000Z",
    "firstAired": "2007-12-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1140926/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:78",
    "name": "▶ Mraky nad mořem / Wind über der See",
    "title": "▶ Mraky nad mořem / Wind über der See",
    "titleDe": "Wind über der See",
    "titleCs": "Mraky nad mořem",
    "season": 1,
    "number": 78,
    "episode": 78,
    "released": "2007-12-23T00:00:00.000Z",
    "firstAired": "2007-12-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1150986/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:79",
    "name": "Šípy lásky / Pfeile der Liebe",
    "title": "Šípy lásky / Pfeile der Liebe",
    "titleDe": "Pfeile der Liebe",
    "titleCs": "Šípy lásky",
    "season": 1,
    "number": 79,
    "episode": 79,
    "released": "2008-03-09T00:00:00.000Z",
    "firstAired": "2008-03-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1177749/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.1",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:80",
    "name": "Melodie lásky / Melodie der Liebe",
    "title": "Melodie lásky / Melodie der Liebe",
    "titleDe": "Melodie der Liebe",
    "titleCs": "Melodie lásky",
    "season": 1,
    "number": 80,
    "episode": 80,
    "released": "2008-09-14T00:00:00.000Z",
    "firstAired": "2008-09-14T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178398/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.1",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:81",
    "name": "▶ Srdce ve větru / Herzen im Wind",
    "title": "▶ Srdce ve větru / Herzen im Wind",
    "titleDe": "Herzen im Wind",
    "titleCs": "Srdce ve větru",
    "season": 1,
    "number": 81,
    "episode": 81,
    "released": "2008-12-21T00:00:00.000Z",
    "firstAired": "2008-12-21T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178399/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.3",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:84",
    "name": "Příliv lásky / Gezeiten der Liebe",
    "title": "Příliv lásky / Gezeiten der Liebe",
    "titleDe": "Gezeiten der Liebe",
    "titleCs": "Příliv lásky",
    "season": 1,
    "number": 84,
    "episode": 84,
    "released": "2009-01-04T00:00:00.000Z",
    "firstAired": "2009-01-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178400/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:85",
    "name": "▶ Roztoužená srdce / Herzenssehnsucht",
    "title": "▶ Roztoužená srdce / Herzenssehnsucht",
    "titleDe": "Herzenssehnsucht",
    "titleCs": "Roztoužená srdce",
    "season": 1,
    "number": 85,
    "episode": 85,
    "released": "2009-01-14T00:00:00.000Z",
    "firstAired": "2009-01-14T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178401/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:86",
    "name": "Podzim lásky / Eine Liebe im Herbst",
    "title": "Podzim lásky / Eine Liebe im Herbst",
    "titleDe": "Eine Liebe im Herbst",
    "titleCs": "Podzim lásky",
    "season": 1,
    "number": 86,
    "episode": 86,
    "released": "2009-03-04T00:00:00.000Z",
    "firstAired": "2009-03-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178402/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:87",
    "name": "Ať rozhodne srdce / Entscheidung des Herzens",
    "title": "Ať rozhodne srdce / Entscheidung des Herzens",
    "titleDe": "Entscheidung des Herzens",
    "titleCs": "Ať rozhodne srdce",
    "season": 1,
    "number": 87,
    "episode": 87,
    "released": "2009-04-13T00:00:00.000Z",
    "firstAired": "2009-04-13T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178403/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:88",
    "name": "⚡ Láska navzdory celému světu / Liebe gegen den Rest der Welt",
    "title": "⚡ Láska navzdory celému světu / Liebe gegen den Rest der Welt",
    "titleDe": "Liebe gegen den Rest der Welt",
    "titleCs": "Láska navzdory celému světu",
    "season": 1,
    "number": 88,
    "episode": 88,
    "released": "2009-09-16T00:00:00.000Z",
    "firstAired": "2009-09-16T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/liebe-gegen-den-rest-der-welt-102~1920x1080?cb=1747395872987",
    "overview": "[OFFICIAL] Rachel Wilson kehrt nach zwei Jahren in das kleine Dorf Kingscove in Cornwall zurück, das sie eigentlich für immer verlassen wollte.",
    "rating": "4.7",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:89",
    "name": "⚡ Shledání v Rose Abbey / Wiedersehen in Rose Abbey",
    "title": "⚡ Shledání v Rose Abbey / Wiedersehen in Rose Abbey",
    "titleDe": "Wiedersehen in Rose Abbey",
    "titleCs": "Shledání v Rose Abbey",
    "season": 1,
    "number": 89,
    "episode": 89,
    "released": "2009-10-25T00:00:00.000Z",
    "firstAired": "2009-10-25T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/wiedersehen-in-rose-abbey-100~1920x1080?cb=1746798390082",
    "overview": "[OFFICIAL] Roseanne Brix, Studentin aus Chicago, kommt nach dem Tod ihrer Mutter nach England, um ihren leiblichen Vater zu suchen. Ihr einziger Hinweis ist ein altes Foto ihrer Mutter.",
    "rating": "4.5",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:90",
    "name": "⚡ Dej, ať je to láska / Lass es Liebe sein",
    "title": "⚡ Dej, ať je to láska / Lass es Liebe sein",
    "titleDe": "Lass es Liebe sein",
    "titleCs": "Dej, ať je to láska",
    "season": 1,
    "number": 90,
    "episode": 90,
    "released": "2009-11-29T00:00:00.000Z",
    "firstAired": "2009-11-29T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/lass-es-liebe-sein-100~1920x1080?cb=1746450048706",
    "overview": "[OFFICIAL] Eine kurze, schicksalhafte Begegnung zwischen Tom und Natalie, einer jungen Studentin aus Georgien, wird das Leben beider für immer verändern: Sie verlieben sich ineinander.",
    "rating": "5.3",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:93",
    "name": "Presumpce lásky / Im Zweifel für die Liebe",
    "title": "Presumpce lásky / Im Zweifel für die Liebe",
    "titleDe": "Im Zweifel für die Liebe",
    "titleCs": "Presumpce lásky",
    "season": 1,
    "number": 93,
    "episode": 93,
    "released": "2010-01-17T00:00:00.000Z",
    "firstAired": "2010-01-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1545888/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:94",
    "name": "Ať půjdeš kamkoli / Wohin du auch gehst",
    "title": "Ať půjdeš kamkoli / Wohin du auch gehst",
    "titleDe": "Wohin du auch gehst",
    "titleCs": "Ať půjdeš kamkoli",
    "season": 1,
    "number": 94,
    "episode": 94,
    "released": "2010-03-14T00:00:00.000Z",
    "firstAired": "2010-03-14T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1545890/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:95",
    "name": "Láska na obzoru / Liebe am Horizont",
    "title": "Láska na obzoru / Liebe am Horizont",
    "titleDe": "Liebe am Horizont",
    "titleCs": "Láska na obzoru",
    "season": 1,
    "number": 95,
    "episode": 95,
    "released": "2010-05-09T00:00:00.000Z",
    "firstAired": "2010-05-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1545889/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:96",
    "name": "▶ Když srdce pláče / Wenn das Herz zerbricht",
    "title": "▶ Když srdce pláče / Wenn das Herz zerbricht",
    "titleDe": "Wenn das Herz zerbricht",
    "titleCs": "Když srdce pláče",
    "season": 1,
    "number": 96,
    "episode": 96,
    "released": "2010-10-06T00:00:00.000Z",
    "firstAired": "2010-10-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1670117/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:97",
    "name": "Na křídlech lásky / Flügel der Liebe",
    "title": "Na křídlech lásky / Flügel der Liebe",
    "titleDe": "Flügel der Liebe",
    "titleCs": "Na křídlech lásky",
    "season": 1,
    "number": 97,
    "episode": 97,
    "released": "2010-11-28T00:00:00.000Z",
    "firstAired": "2010-11-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1702299/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:98",
    "name": "Sňatek z rozumu / Lords lügen nicht",
    "title": "Sňatek z rozumu / Lords lügen nicht",
    "titleDe": "Lords lügen nicht",
    "titleCs": "Sňatek z rozumu",
    "season": 1,
    "number": 98,
    "episode": 98,
    "released": "2010-12-19T00:00:00.000Z",
    "firstAired": "2010-12-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1729996/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.8",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:99",
    "name": "▶ Zeptej se srdce / Herzensfragen",
    "title": "▶ Zeptej se srdce / Herzensfragen",
    "titleDe": "Herzensfragen",
    "titleCs": "Zeptej se srdce",
    "season": 1,
    "number": 99,
    "episode": 99,
    "released": "2011-01-02T00:00:00.000Z",
    "firstAired": "2011-01-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1794473/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:100",
    "name": "Cesta za štěstím / Sonntagskinder",
    "title": "Cesta za štěstím / Sonntagskinder",
    "titleDe": "Sonntagskinder",
    "titleCs": "Cesta za štěstím",
    "season": 1,
    "number": 100,
    "episode": 100,
    "released": "2011-01-23T00:00:00.000Z",
    "firstAired": "2011-01-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1804980/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:103",
    "name": "⚡ Zmatená láska / Verlobt, verliebt, verwirrt",
    "title": "⚡ Zmatená láska / Verlobt, verliebt, verwirrt",
    "titleDe": "Verlobt, verliebt, verwirrt",
    "titleCs": "Zmatená láska",
    "season": 1,
    "number": 103,
    "episode": 103,
    "released": "2011-09-07T00:00:00.000Z",
    "firstAired": "2011-09-07T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/verlobt-verliebt-verwirrt-100~1920x1080?cb=1745830743700",
    "overview": "[OFFICIAL] Emma Waters überredet ihre Freundin Julia Adams, einen Junggesellinnenabschied zu machen. Als Julia einen Kuss versteigern soll, kann sie nicht glauben, wer der Gewinner ist.",
    "rating": "5.2",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:104",
    "name": "▶ Ukradené léto / Der gestohlene Sommer",
    "title": "▶ Ukradené léto / Der gestohlene Sommer",
    "titleDe": "Der gestohlene Sommer",
    "titleCs": "Ukradené léto",
    "season": 1,
    "number": 104,
    "episode": 104,
    "released": "2011-09-28T00:00:00.000Z",
    "firstAired": "2011-09-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2050247/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:105",
    "name": "⚡▶ Ve víně je láska / Englischer Wein",
    "title": "⚡▶ Ve víně je láska / Englischer Wein",
    "titleDe": "Englischer Wein",
    "titleCs": "Ve víně je láska",
    "season": 1,
    "number": 105,
    "episode": 105,
    "released": "2011-11-20T00:00:00.000Z",
    "firstAired": "2011-11-20T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-englischer-wein-104~1920x1080?cb=1744711026467",
    "overview": "[BOTH] Die ehrgeizige Winzerin Hannah Powell, die lange in Frankreich gelebt hat, erhält die Chance ihres Lebens: Sie soll ein Weingut in ihrer Heimat Südengland auf Vordermann bringen.",
    "rating": "5.4",
    "hasZdf": true,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:106",
    "name": "Nebezpečný příboj / Gefährliche Brandung",
    "title": "Nebezpečný příboj / Gefährliche Brandung",
    "titleDe": "Gefährliche Brandung",
    "titleCs": "Nebezpečný příboj",
    "season": 1,
    "number": 106,
    "episode": 106,
    "released": "2011-12-18T00:00:00.000Z",
    "firstAired": "2011-12-18T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2122084/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:109",
    "name": "⚡ Dokonalé štěstí / Ungezügelt ins Glück",
    "title": "⚡ Dokonalé štěstí / Ungezügelt ins Glück",
    "titleDe": "Ungezügelt ins Glück",
    "titleCs": "Dokonalé štěstí",
    "season": 1,
    "number": 109,
    "episode": 109,
    "released": "2012-01-15T00:00:00.000Z",
    "firstAired": "2012-01-15T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/ungezuegelt-ins-glueck-100~1920x1080?cb=1744907251956",
    "overview": "[OFFICIAL] Lord Brooks stellt nach langer Abwesenheit entsetzt fest, dass seine Mutter das Familienanwesen in ein Pferdeasyl verwandelt hat. Er muss sich nun um die Rettung des Erbes kümmern.",
    "rating": "5.6",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:110",
    "name": "⚡ Tajemství starého panství / Das Geheimnis der weißen Taube",
    "title": "⚡ Tajemství starého panství / Das Geheimnis der weißen Taube",
    "titleDe": "Das Geheimnis der weißen Taube",
    "titleCs": "Tajemství starého panství",
    "season": 1,
    "number": 110,
    "episode": 110,
    "released": "2012-04-04T00:00:00.000Z",
    "firstAired": "2012-04-04T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/das-geheimnis-der-weissen-taube-100~1920x1080?cb=1746022269147",
    "overview": "[OFFICIAL] Auktionatorin Stella liebt die alten Schätze, die sie verkauft. Doch im Auktionshaus der Familie ihres Mannes Peter kriselt es seit neustem – und das nicht nur bei ihrer Arbeit.",
    "rating": "5.2",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:111",
    "name": "⚡▶ Falešná jeptiška / Die falsche Nonne",
    "title": "⚡▶ Falešná jeptiška / Die falsche Nonne",
    "titleDe": "Die falsche Nonne",
    "titleCs": "Falešná jeptiška",
    "season": 1,
    "number": 111,
    "episode": 111,
    "released": "2012-09-19T00:00:00.000Z",
    "firstAired": "2012-09-19T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-die-falsche-nonne-104~1920x1080?cb=1793023905964",
    "overview": "[BOTH] Bei einem Undercover-Einsatz lernt Polizistin Sabrina Tom kennen.",
    "rating": "5.4",
    "hasZdf": true,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:112",
    "name": "⚡ Nový začátek / In der Mitte eines Lebens",
    "title": "⚡ Nový začátek / In der Mitte eines Lebens",
    "titleDe": "In der Mitte eines Lebens",
    "titleCs": "Nový začátek",
    "season": 1,
    "number": 112,
    "episode": 112,
    "released": "2012-10-10T00:00:00.000Z",
    "firstAired": "2012-10-10T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/in-der-mitte-des-lebens-100~1920x1080?cb=1578559755191",
    "overview": "[OFFICIAL] Ella Dempsey muss nach einem Vorfall ihr ganzes Leben überdenken.",
    "rating": "5.8",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:113",
    "name": "Dvojí život: Část 1 / Die andere Frau, Teil 1",
    "title": "Dvojí život: Část 1 / Die andere Frau, Teil 1",
    "titleDe": "Die andere Frau, Teil 1",
    "titleCs": "Dvojí život: Část 1",
    "season": 1,
    "number": 113,
    "episode": 113,
    "released": "2012-12-23T00:00:00.000Z",
    "firstAired": "2012-12-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3959970/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:114",
    "name": "Dvojí život: Část 2 / Die andere Frau, Teil 2",
    "title": "Dvojí život: Část 2 / Die andere Frau, Teil 2",
    "titleDe": "Die andere Frau, Teil 2",
    "titleCs": "Dvojí život: Část 2",
    "season": 1,
    "number": 114,
    "episode": 114,
    "released": "2012-12-25T00:00:00.000Z",
    "firstAired": "2012-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2169404/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:115",
    "name": "▶ Otázka cti / Eine Frage der Ehre",
    "title": "▶ Otázka cti / Eine Frage der Ehre",
    "titleDe": "Eine Frage der Ehre",
    "titleCs": "Otázka cti",
    "season": 1,
    "number": 115,
    "episode": 115,
    "released": "2013-01-13T00:00:00.000Z",
    "firstAired": "2013-01-13T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2592426/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:116",
    "name": "⚡ Láska nad propastí / Die Frau auf der Klippe",
    "title": "⚡ Láska nad propastí / Die Frau auf der Klippe",
    "titleDe": "Die Frau auf der Klippe",
    "titleCs": "Láska nad propastí",
    "season": 1,
    "number": 116,
    "episode": 116,
    "released": "2013-03-27T00:00:00.000Z",
    "firstAired": "2013-03-27T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/die-frau-auf-der-klippe-100~1920x1080?cb=1793023515200",
    "overview": "[OFFICIAL] Owen erbt das Herrenhaus seines verstorbenen Großonkels in Cornwall.",
    "rating": "5.5",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:117",
    "name": "Zahrada rajských pokušení / Schlangen im Paradies",
    "title": "Zahrada rajských pokušení / Schlangen im Paradies",
    "titleDe": "Schlangen im Paradies",
    "titleCs": "Zahrada rajských pokušení",
    "season": 1,
    "number": 117,
    "episode": 117,
    "released": "2013-04-28T00:00:00.000Z",
    "firstAired": "2013-04-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2831116/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:118",
    "name": "⚡ Zaslíbená nevěsta / Die versprochene Braut",
    "title": "⚡ Zaslíbená nevěsta / Die versprochene Braut",
    "titleDe": "Die versprochene Braut",
    "titleCs": "Zaslíbená nevěsta",
    "season": 1,
    "number": 118,
    "episode": 118,
    "released": "2013-09-08T00:00:00.000Z",
    "firstAired": "2013-09-08T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3128154/img",
    "overview": "[OFFICIAL] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:119",
    "name": "Stará láska nerezaví / Alte Herzen rosten nicht",
    "title": "Stará láska nerezaví / Alte Herzen rosten nicht",
    "titleDe": "Alte Herzen rosten nicht",
    "titleCs": "Stará láska nerezaví",
    "season": 1,
    "number": 119,
    "episode": 119,
    "released": "2013-11-17T00:00:00.000Z",
    "firstAired": "2013-11-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3293750/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:120",
    "name": "▶ Láska z nebes / Zu hoch geflogen",
    "title": "▶ Láska z nebes / Zu hoch geflogen",
    "titleDe": "Zu hoch geflogen",
    "titleCs": "Láska z nebes",
    "season": 1,
    "number": 120,
    "episode": 120,
    "released": "2013-12-22T00:00:00.000Z",
    "firstAired": "2013-12-22T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3443090/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:121",
    "name": "První nebo druhá / Besetzte Herzen",
    "title": "První nebo druhá / Besetzte Herzen",
    "titleDe": "Besetzte Herzen",
    "titleCs": "První nebo druhá",
    "season": 1,
    "number": 121,
    "episode": 121,
    "released": "2014-01-12T00:00:00.000Z",
    "firstAired": "2014-01-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3332888/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:122",
    "name": "Stíny minulosti / Evitas Rache",
    "title": "Stíny minulosti / Evitas Rache",
    "titleDe": "Evitas Rache",
    "titleCs": "Stíny minulosti",
    "season": 1,
    "number": 122,
    "episode": 122,
    "released": "2014-03-16T00:00:00.000Z",
    "firstAired": "2014-03-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3132252/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:123",
    "name": "Mé srdce patří tobě / Mein unbekanntes Herz",
    "title": "Mé srdce patří tobě / Mein unbekanntes Herz",
    "titleDe": "Mein unbekanntes Herz",
    "titleCs": "Mé srdce patří tobě",
    "season": 1,
    "number": 123,
    "episode": 123,
    "released": "2014-04-19T00:00:00.000Z",
    "firstAired": "2014-04-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3954226/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:124",
    "name": "Čekání na duhu / Anwälte küsst man nicht",
    "title": "Čekání na duhu / Anwälte küsst man nicht",
    "titleDe": "Anwälte küsst man nicht",
    "titleCs": "Čekání na duhu",
    "season": 1,
    "number": 124,
    "episode": 124,
    "released": "2014-09-21T00:00:00.000Z",
    "firstAired": "2014-09-21T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3954140/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:125",
    "name": "Zrada a láska / Vertrauen ist gut, verlieben ist besser",
    "title": "Zrada a láska / Vertrauen ist gut, verlieben ist besser",
    "titleDe": "Vertrauen ist gut, verlieben ist besser",
    "titleCs": "Zrada a láska",
    "season": 1,
    "number": 125,
    "episode": 125,
    "released": "2014-11-16T00:00:00.000Z",
    "firstAired": "2014-11-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3901820/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:126",
    "name": "▶ Síla lásky / Ghostwriter",
    "title": "▶ Síla lásky / Ghostwriter",
    "titleDe": "Ghostwriter",
    "titleCs": "Síla lásky",
    "season": 1,
    "number": 126,
    "episode": 126,
    "released": "2015-01-11T00:00:00.000Z",
    "firstAired": "2015-01-11T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5921002/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:127",
    "name": "Kandidáti na lásku / Wahlversprechen und andere Lügen",
    "title": "Kandidáti na lásku / Wahlversprechen und andere Lügen",
    "titleDe": "Wahlversprechen und andere Lügen",
    "titleCs": "Kandidáti na lásku",
    "season": 1,
    "number": 127,
    "episode": 127,
    "released": "2015-02-20T00:00:00.000Z",
    "firstAired": "2015-02-20T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt6058140/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.3",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:128",
    "name": "Valentýnský polibek / Ein einziger Kuss",
    "title": "Valentýnský polibek / Ein einziger Kuss",
    "titleDe": "Ein einziger Kuss",
    "titleCs": "Valentýnský polibek",
    "season": 1,
    "number": 128,
    "episode": 128,
    "released": "2015-04-06T00:00:00.000Z",
    "firstAired": "2015-04-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt18155194/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:129",
    "name": "⚡ Vůně vanilky / Rundum glücklich",
    "title": "⚡ Vůně vanilky / Rundum glücklich",
    "titleDe": "Rundum glücklich",
    "titleCs": "Vůně vanilky",
    "season": 1,
    "number": 129,
    "episode": 129,
    "released": "2015-05-17T00:00:00.000Z",
    "firstAired": "2015-05-17T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rundum-gluecklich-100~1920x1080?cb=1738935862085",
    "overview": "[OFFICIAL] Die junge Bäckerin Betty Hunter sucht den Mann ihrer Träume.",
    "rating": "5.2",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:130",
    "name": "▶ Nečekaná láska / Vollkommen unerwartet",
    "title": "▶ Nečekaná láska / Vollkommen unerwartet",
    "titleDe": "Vollkommen unerwartet",
    "titleCs": "Nečekaná láska",
    "season": 1,
    "number": 130,
    "episode": 130,
    "released": "2015-10-04T00:00:00.000Z",
    "firstAired": "2015-10-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5376696/img",
    "overview": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9",
    "hasZdf": false,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:131",
    "name": "⚡ Láska, zloděj a diamanty / Liebe, Diebe, Diamanten",
    "title": "⚡ Láska, zloděj a diamanty / Liebe, Diebe, Diamanten",
    "titleDe": "Liebe, Diebe, Diamanten",
    "titleCs": "Láska, zloděj a diamanty",
    "season": 1,
    "number": 131,
    "episode": 131,
    "released": "2015-11-22T00:00:00.000Z",
    "firstAired": "2015-11-22T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-liebe-diebe-diamanten-102~1920x1080?cb=1793024107343",
    "overview": "[OFFICIAL] Richard Johnson kehrt zur Hochzeit der Tochter zurück nach Cornwall.",
    "rating": "5.6",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:132",
    "name": "Argentinské tango / Argentinischer Tango",
    "title": "Argentinské tango / Argentinischer Tango",
    "titleDe": "Argentinischer Tango",
    "titleCs": "Argentinské tango",
    "season": 1,
    "number": 132,
    "episode": 132,
    "released": "2016-01-10T00:00:00.000Z",
    "firstAired": "2016-01-10T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt4837404/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:133",
    "name": "⚡▶ Láska s výhodami / Lizenz zum Seitensprung",
    "title": "⚡▶ Láska s výhodami / Lizenz zum Seitensprung",
    "titleDe": "Lizenz zum Seitensprung",
    "titleCs": "Láska s výhodami",
    "season": 1,
    "number": 133,
    "episode": 133,
    "released": "2016-02-07T00:00:00.000Z",
    "firstAired": "2016-02-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5295330/img",
    "overview": "[BOTH] Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.5",
    "hasZdf": true,
    "hasYt": true
  },
  {
    "id": "tt0907694:1:134",
    "name": "Anděl strážný / Schutzengel",
    "title": "Anděl strážný / Schutzengel",
    "titleDe": "Schutzengel",
    "titleCs": "Anděl strážný",
    "season": 1,
    "number": 134,
    "episode": 134,
    "released": "2016-03-27T00:00:00.000Z",
    "firstAired": "2016-03-27T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5580156/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.3",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:135",
    "name": "⚡ Muž s velkým srdcem / Ein Doktor & drei Frauen",
    "title": "⚡ Muž s velkým srdcem / Ein Doktor & drei Frauen",
    "titleDe": "Ein Doktor & drei Frauen",
    "titleCs": "Muž s velkým srdcem",
    "season": 1,
    "number": 135,
    "episode": 135,
    "released": "2016-04-24T00:00:00.000Z",
    "firstAired": "2016-04-24T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/doktor-und-drei-frauen-100~1920x1080?cb=1766147846819",
    "overview": "[OFFICIAL] Dem idyllischen Örtchen St. Mark droht kurz vor der bevorstehenden 500-Jahr-Feier der schleichende Tod. Jetzt verabschiedet sich auch noch der einzige Arzt in den Ruhestand.",
    "rating": "5.3",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:136",
    "name": "⚡ Znovunalezená láska / Ex & Liebe",
    "title": "⚡ Znovunalezená láska / Ex & Liebe",
    "titleDe": "Ex & Liebe",
    "titleCs": "Znovunalezená láska",
    "season": 1,
    "number": 136,
    "episode": 136,
    "released": "2016-10-02T00:00:00.000Z",
    "firstAired": "2016-10-02T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-ex-und-liebe-102~1920x1080?cb=1680097215435",
    "overview": "[OFFICIAL] Auf dem Weg zu seiner Mutter hat Bruno mit seinem Oldtimer eine Panne, die sein Leben verändern wird. Sophie, die einstige Liebe seines Lebens, steht plötzlich vor ihm.",
    "rating": "5.7",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:137",
    "name": "⚡ Láska mezi jahodami / Erdbeeren im Frühling",
    "title": "⚡ Láska mezi jahodami / Erdbeeren im Frühling",
    "titleDe": "Erdbeeren im Frühling",
    "titleCs": "Láska mezi jahodami",
    "season": 1,
    "number": 137,
    "episode": 137,
    "released": "2016-11-12T00:00:00.000Z",
    "firstAired": "2016-11-12T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/erdbeeren-im-fruehling-106~1920x1080?cb=1696515866401",
    "overview": "[OFFICIAL] Als die junge Journalistin und Millionenerbin Lilly zur Beerdigung ihres Vaters nach Cornwall zurückkehrt, bricht ihre bisherige Lebensplanung wie ein Kartenhaus zusammen.",
    "rating": "5.7",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:138",
    "name": "Dotek kouzla / Haustausch mit Hindernissen",
    "title": "Dotek kouzla / Haustausch mit Hindernissen",
    "titleDe": "Haustausch mit Hindernissen",
    "titleCs": "Dotek kouzla",
    "season": 1,
    "number": 138,
    "episode": 138,
    "released": "2016-12-18T00:00:00.000Z",
    "firstAired": "2016-12-18T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt6426868/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:139",
    "name": "Jako z daleké hvězdy / Wie von einem anderen Stern",
    "title": "Jako z daleké hvězdy / Wie von einem anderen Stern",
    "titleDe": "Wie von einem anderen Stern",
    "titleCs": "Jako z daleké hvězdy",
    "season": 1,
    "number": 139,
    "episode": 139,
    "released": "2017-01-03T00:00:00.000Z",
    "firstAired": "2017-01-03T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5940862/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:140",
    "name": "⚡ Navždy svoji / Fast noch verheiratet",
    "title": "⚡ Navždy svoji / Fast noch verheiratet",
    "titleDe": "Fast noch verheiratet",
    "titleCs": "Navždy svoji",
    "season": 1,
    "number": 140,
    "episode": 140,
    "released": "2017-02-26T00:00:00.000Z",
    "firstAired": "2017-02-26T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/fast-verheiratet-100~1920x1080?cb=1575469007851",
    "overview": "[OFFICIAL] Siennas Traummann macht ihr einen Heiratsantrag – doch sie zögert.",
    "rating": "6.1",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:141",
    "name": "Tenkrát po maturitě / Nie wieder Klassentreffen",
    "title": "Tenkrát po maturitě / Nie wieder Klassentreffen",
    "titleDe": "Nie wieder Klassentreffen",
    "titleCs": "Tenkrát po maturitě",
    "season": 1,
    "number": 141,
    "episode": 141,
    "released": "2017-08-20T00:00:00.000Z",
    "firstAired": "2017-08-20T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7294684/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:142",
    "name": "Duch z Cassley / Das Gespenst von Cassley",
    "title": "Duch z Cassley / Das Gespenst von Cassley",
    "titleDe": "Das Gespenst von Cassley",
    "titleCs": "Duch z Cassley",
    "season": 1,
    "number": 142,
    "episode": 142,
    "released": "2017-10-22T00:00:00.000Z",
    "firstAired": "2017-10-22T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7565710/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:143",
    "name": "Talisman lásky / Wenn Fische lächeln",
    "title": "Talisman lásky / Wenn Fische lächeln",
    "titleDe": "Wenn Fische lächeln",
    "titleCs": "Talisman lásky",
    "season": 1,
    "number": 143,
    "episode": 143,
    "released": "2017-11-19T00:00:00.000Z",
    "firstAired": "2017-11-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7652188/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:144",
    "name": "Vůně orchidejí / Geerbtes Glück",
    "title": "Vůně orchidejí / Geerbtes Glück",
    "titleDe": "Geerbtes Glück",
    "titleCs": "Vůně orchidejí",
    "season": 1,
    "number": 144,
    "episode": 144,
    "released": "2018-01-07T00:00:00.000Z",
    "firstAired": "2018-01-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7858832/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:145",
    "name": "Otcovo dědictví / Das Vermächtnis unseres Vaters",
    "title": "Otcovo dědictví / Das Vermächtnis unseres Vaters",
    "titleDe": "Das Vermächtnis unseres Vaters",
    "titleCs": "Otcovo dědictví",
    "season": 1,
    "number": 145,
    "episode": 145,
    "released": "2018-02-04T00:00:00.000Z",
    "firstAired": "2018-02-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt8103280/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:146",
    "name": "Hledá se chůva / Nanny verzweifelt gesucht",
    "title": "Hledá se chůva / Nanny verzweifelt gesucht",
    "titleDe": "Nanny verzweifelt gesucht",
    "titleCs": "Hledá se chůva",
    "season": 1,
    "number": 146,
    "episode": 146,
    "released": "2018-05-20T00:00:00.000Z",
    "firstAired": "2018-05-20T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7771608/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:147",
    "name": "Kam tvé srdce patří / Wo Dein Herz wohnt",
    "title": "Kam tvé srdce patří / Wo Dein Herz wohnt",
    "titleDe": "Wo Dein Herz wohnt",
    "titleCs": "Kam tvé srdce patří",
    "season": 1,
    "number": 147,
    "episode": 147,
    "released": "2018-10-07T00:00:00.000Z",
    "firstAired": "2018-10-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt9089702/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:148",
    "name": "⚡ Tajemství květinového ostrova / Das Geheimnis der Blumeninsel",
    "title": "⚡ Tajemství květinového ostrova / Das Geheimnis der Blumeninsel",
    "titleDe": "Das Geheimnis der Blumeninsel",
    "titleCs": "Tajemství květinového ostrova",
    "season": 1,
    "number": 148,
    "episode": 148,
    "released": "2018-12-09T00:00:00.000Z",
    "firstAired": "2018-12-09T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-das-geheimnis-der-blumeninsel-102~1920x1080?cb=1544345904588",
    "overview": "[OFFICIAL] Amy Harding hat einen großen Traum. Sie will die verwahrloste Blumenfarm ihrer Großeltern auf den Scilly Islands wieder zum Blühen bringen.",
    "rating": "5.6",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:149",
    "name": "Bouřlivá rána, šťastné konce / Morgens stürmisch, abends Liebe",
    "title": "Bouřlivá rána, šťastné konce / Morgens stürmisch, abends Liebe",
    "titleDe": "Morgens stürmisch, abends Liebe",
    "titleCs": "Bouřlivá rána, šťastné konce",
    "season": 1,
    "number": 149,
    "episode": 149,
    "released": "2019-01-06T00:00:00.000Z",
    "firstAired": "2019-01-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt9401344/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:150",
    "name": "Nevěsta mého bratra / Die Braut meines Bruders",
    "title": "Nevěsta mého bratra / Die Braut meines Bruders",
    "titleDe": "Die Braut meines Bruders",
    "titleCs": "Nevěsta mého bratra",
    "season": 1,
    "number": 150,
    "episode": 150,
    "released": "2019-02-10T00:00:00.000Z",
    "firstAired": "2019-02-10T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt9740242/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:151",
    "name": "⚡ Program na lásku / Schwiegertöchter",
    "title": "⚡ Program na lásku / Schwiegertöchter",
    "titleDe": "Schwiegertöchter",
    "titleCs": "Program na lásku",
    "season": 1,
    "number": 151,
    "episode": 151,
    "released": "2019-05-26T00:00:00.000Z",
    "firstAired": "2019-05-26T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-schwiegertoechter-102~1920x1080?cb=1749544149996",
    "overview": "[OFFICIAL] Lynette will den letzten Wunsch ihres verstorbenen Mannes erfüllen und eine Stiftung in seinem Namen gründen. Dafür muss sie aber die Leitung ihrer eigenen Firma abgeben.",
    "rating": "5",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:152",
    "name": "⚡ Pralinky k snídani / Pralinen zum Frühstück",
    "title": "⚡ Pralinky k snídani / Pralinen zum Frühstück",
    "titleDe": "Pralinen zum Frühstück",
    "titleCs": "Pralinky k snídani",
    "season": 1,
    "number": 152,
    "episode": 152,
    "released": "2019-09-01T00:00:00.000Z",
    "firstAired": "2019-09-01T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/pralinen-zum-fruehstueck-102~1920x1080?cb=1781704277805",
    "overview": "[OFFICIAL] Annabelle hat ihr Hobby zum Beruf gemacht: Auf Flughäfen ersteigert sie gestrandete und besitzlose Koffer, um sie dann in ihrer Fernsehsendung öffnen zu lassen.",
    "rating": "5.6",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:153",
    "name": "Raus in den Sturm",
    "title": "Raus in den Sturm",
    "titleDe": "Raus in den Sturm",
    "titleCs": null,
    "season": 1,
    "number": 153,
    "episode": 153,
    "released": "2019-09-15T00:00:00.000Z",
    "firstAired": "2019-09-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt10974400/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:154",
    "name": "⚡ Magický autobus / Der magische Bus",
    "title": "⚡ Magický autobus / Der magische Bus",
    "titleDe": "Der magische Bus",
    "titleCs": "Magický autobus",
    "season": 1,
    "number": 154,
    "episode": 154,
    "released": "2019-12-01T00:00:00.000Z",
    "firstAired": "2019-12-01T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/magisch-bus-100~1920x1080?cb=1572876710440",
    "overview": "[OFFICIAL] Olivia macht sich trotz aller Warnungen ihrer Freunde und Kollegen in einem Vintage-Bus selbstständig. Doch schon bei der ersten Reise kommt der erste Rückschlag.",
    "rating": "6",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:155",
    "name": "Má sestřenice, láska a já / Meine Cousine, die Liebe und ich",
    "title": "Má sestřenice, láska a já / Meine Cousine, die Liebe und ich",
    "titleDe": "Meine Cousine, die Liebe und ich",
    "titleCs": "Má sestřenice, láska a já",
    "season": 1,
    "number": 155,
    "episode": 155,
    "released": "2019-12-29T00:00:00.000Z",
    "firstAired": "2019-12-29T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt11097478/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:156",
    "name": "Láska s chutí čaje / Von Tee und Liebe",
    "title": "Láska s chutí čaje / Von Tee und Liebe",
    "titleDe": "Von Tee und Liebe",
    "titleCs": "Láska s chutí čaje",
    "season": 1,
    "number": 156,
    "episode": 156,
    "released": "2020-01-12T00:00:00.000Z",
    "firstAired": "2020-01-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt11494832/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2020). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.8",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:157",
    "name": "⚡ Falešný život, pravá láska / Falsches Leben, wahre Liebe",
    "title": "⚡ Falešný život, pravá láska / Falsches Leben, wahre Liebe",
    "titleDe": "Falsches Leben, wahre Liebe",
    "titleCs": "Falešný život, pravá láska",
    "season": 1,
    "number": 157,
    "episode": 157,
    "released": "2020-03-01T00:00:00.000Z",
    "firstAired": "2020-03-01T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/falschesleben-102~1920x1080?cb=1696515723171",
    "overview": "[OFFICIAL] Bill Pexton, ein junger Marineleutnant, freundet sich bei den Vorbereitungen auf die Aufnahmeprüfung bei den Kampftauchern mit seinem Kameraden Mo Miller an.",
    "rating": "5.3",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:158",
    "name": "Stadt, Land, Kuss",
    "title": "Stadt, Land, Kuss",
    "titleDe": "Stadt, Land, Kuss",
    "titleCs": null,
    "season": 1,
    "number": 158,
    "episode": 158,
    "released": "2021-01-17T00:00:00.000Z",
    "firstAired": "2021-01-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt13625812/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:159",
    "name": "⚡ Svůdná věštba / Wie verhext",
    "title": "⚡ Svůdná věštba / Wie verhext",
    "titleDe": "Wie verhext",
    "titleCs": "Svůdná věštba",
    "season": 1,
    "number": 159,
    "episode": 159,
    "released": "2021-05-02T00:00:00.000Z",
    "firstAired": "2021-05-02T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/wie-verhext-102~1920x1080?cb=1751274370663",
    "overview": "[OFFICIAL] Im Kino ihres Vaters hat Grace Kent bereits als Sechsjährige jeden Film gesehen, der dort vorgeführt wurde. Kein Wunder, dass sie schon als junge Frau Kostümbildnerin werden will.",
    "rating": "5.1",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:160",
    "name": "⚡ Vášnivá srdce / Herzensläufe",
    "title": "⚡ Vášnivá srdce / Herzensläufe",
    "titleDe": "Herzensläufe",
    "titleCs": "Vášnivá srdce",
    "season": 1,
    "number": 160,
    "episode": 160,
    "released": "2021-09-05T00:00:00.000Z",
    "firstAired": "2021-09-05T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/herzenslaeufe-100~1920x1080?cb=1790922946174",
    "overview": "[OFFICIAL] Für Jacky Davies ist das Gin-Brennen in der traditionellen Familiendestillerie mehr als nur ein Handwerk: Es ist die Passion der jungen Frau und eine Besessenheit.",
    "rating": "5.3",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:161",
    "name": "Vyšívané sny / Der Stoff, aus dem Träume sind",
    "title": "Vyšívané sny / Der Stoff, aus dem Träume sind",
    "titleDe": "Der Stoff, aus dem Träume sind",
    "titleCs": "Vyšívané sny",
    "season": 1,
    "number": 161,
    "episode": 161,
    "released": "2021-10-31T00:00:00.000Z",
    "firstAired": "2021-10-31T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15478660/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:162",
    "name": "⚡ V sedmém nebi / Im Siebten Himmel",
    "title": "⚡ V sedmém nebi / Im Siebten Himmel",
    "titleDe": "Im Siebten Himmel",
    "titleCs": "V sedmém nebi",
    "season": 1,
    "number": 162,
    "episode": 162,
    "released": "2021-12-05T00:00:00.000Z",
    "firstAired": "2021-12-05T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-im-siebten-himmel-102~1920x1080?cb=1638535290427",
    "overview": "[OFFICIAL] Rebecca \"Becky\" Taylor ist frisch ordinierte Jung-Vikarin der Anglikanischen Gemeinschaft. Vor ihrem offiziellen Dienstantritt besucht sie die ihr zugeteilte Gemeinde in Cornwall.",
    "rating": "4.7",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:163",
    "name": "⚡ Láska mezi květinami / Vier Luftballons und ein Todesfall",
    "title": "⚡ Láska mezi květinami / Vier Luftballons und ein Todesfall",
    "titleDe": "Vier Luftballons und ein Todesfall",
    "titleCs": "Láska mezi květinami",
    "season": 1,
    "number": 163,
    "episode": 163,
    "released": "2022-01-02T00:00:00.000Z",
    "firstAired": "2022-01-02T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/vier-luftballons-und-ein-todesfall-100~1920x1080?cb=1790581314387",
    "overview": "[OFFICIAL] Floristin Gwen ist Angestellte in einem Blumengroßhandel und wird von ihrem sympathischen Chef Joey umgarnt. Was der jungen Frau nicht unangenehm ist - ganz im Gegenteil.",
    "rating": "5.7",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:164",
    "name": "Láska na pevnině / Die Elster und der Kapitän",
    "title": "Láska na pevnině / Die Elster und der Kapitän",
    "titleDe": "Die Elster und der Kapitän",
    "titleCs": "Láska na pevnině",
    "season": 1,
    "number": 164,
    "episode": 164,
    "released": "2022-02-26T00:00:00.000Z",
    "firstAired": "2022-02-26T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt18377966/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.8",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:165",
    "name": "Algoritmus lásky / Liebe ist unberechenbar",
    "title": "Algoritmus lásky / Liebe ist unberechenbar",
    "titleDe": "Liebe ist unberechenbar",
    "titleCs": "Algoritmus lásky",
    "season": 1,
    "number": 165,
    "episode": 165,
    "released": "2022-05-15T00:00:00.000Z",
    "firstAired": "2022-05-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt20124474/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:166",
    "name": "⚡ Láska a jiné poklady / Liebe und andere Schätze",
    "title": "⚡ Láska a jiné poklady / Liebe und andere Schätze",
    "titleDe": "Liebe und andere Schätze",
    "titleCs": "Láska a jiné poklady",
    "season": 1,
    "number": 166,
    "episode": 166,
    "released": "2022-09-11T00:00:00.000Z",
    "firstAired": "2022-09-11T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/liebe-und-andere-schaetze-100~1920x1080?cb=1779100936024",
    "overview": "[OFFICIAL] Kuratorin Mia Barlow ist praktisch in einem Museum groß geworden, seit Direktor Trevor Murphy und seine Frau, die Restauratorin Hannah, sie als Pflegekind bei sich aufgenommen haben.",
    "rating": "5.6",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:167",
    "name": "Hochzeitstag",
    "title": "Hochzeitstag",
    "titleDe": "Hochzeitstag",
    "titleCs": null,
    "season": 1,
    "number": 167,
    "episode": 167,
    "released": "2022-10-02T00:00:00.000Z",
    "firstAired": "2022-10-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt22038482/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:168",
    "name": "Liebe ist die beste Therapie",
    "title": "Liebe ist die beste Therapie",
    "titleDe": "Liebe ist die beste Therapie",
    "titleCs": null,
    "season": 1,
    "number": 168,
    "episode": 168,
    "released": "2023-02-25T00:00:00.000Z",
    "firstAired": "2023-02-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt26767892/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:169",
    "name": "Wenn ich dich wiederfinde",
    "title": "Wenn ich dich wiederfinde",
    "titleDe": "Wenn ich dich wiederfinde",
    "titleCs": null,
    "season": 1,
    "number": 169,
    "episode": 169,
    "released": "2023-03-25T00:00:00.000Z",
    "firstAired": "2023-03-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt27349270/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:170",
    "name": "Schlagzeile Liebe",
    "title": "Schlagzeile Liebe",
    "titleDe": "Schlagzeile Liebe",
    "titleCs": null,
    "season": 1,
    "number": 170,
    "episode": 170,
    "released": "2023-09-24T00:00:00.000Z",
    "firstAired": "2023-09-24T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt28565529/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:171",
    "name": "Amys Wunschkind",
    "title": "Amys Wunschkind",
    "titleDe": "Amys Wunschkind",
    "titleCs": null,
    "season": 1,
    "number": 171,
    "episode": 171,
    "released": "2023-11-05T00:00:00.000Z",
    "firstAired": "2023-11-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt29716178/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:172",
    "name": "Frühstück bei Tessa",
    "title": "Frühstück bei Tessa",
    "titleDe": "Frühstück bei Tessa",
    "titleCs": null,
    "season": 1,
    "number": 172,
    "episode": 172,
    "released": "2024-01-07T00:00:00.000Z",
    "firstAired": "2024-01-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt30783580/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:173",
    "name": "Verliebt in einen Butler",
    "title": "Verliebt in einen Butler",
    "titleDe": "Verliebt in einen Butler",
    "titleCs": null,
    "season": 1,
    "number": 173,
    "episode": 173,
    "released": "2024-10-06T00:00:00.000Z",
    "firstAired": "2024-10-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt33086345/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:174",
    "name": "Jahrestag",
    "title": "Jahrestag",
    "titleDe": "Jahrestag",
    "titleCs": null,
    "season": 1,
    "number": 174,
    "episode": 174,
    "released": "2025-01-12T00:00:00.000Z",
    "firstAired": "2025-01-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt34824149/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:175",
    "name": "Wer immer du bist",
    "title": "Wer immer du bist",
    "titleDe": "Wer immer du bist",
    "titleCs": null,
    "season": 1,
    "number": 175,
    "episode": 175,
    "released": "2025-09-06T00:00:00.000Z",
    "firstAired": "2025-09-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt38098292/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5",
    "hasZdf": false,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:176",
    "name": "⚡ Einspruch für die Liebe",
    "title": "⚡ Einspruch für die Liebe",
    "titleDe": "Einspruch für die Liebe",
    "titleCs": null,
    "season": 1,
    "number": 176,
    "episode": 176,
    "released": "2026-01-04T00:00:00.000Z",
    "firstAired": "2026-01-04T00:00:00.000Z",
    "thumbnail": "https://epg-image.zdf.de/fotobase-webdelivery/images/14639eee-55be-4062-8284-904f5faf3e73?layout=768x432",
    "overview": "[OFFICIAL] Unter dem Motto \"Harte Arbeit zahlt sich aus\" hat sich Anwalt Bill Reynolds eine renommierte Kanzlei aufgebaut und den Ruf erarbeitet, fast alle Verfahren vor Gericht zu gewinnen.",
    "rating": "5.9",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:177",
    "name": "⚡ Wo Liebe aufhört und wo sie beginnt",
    "title": "⚡ Wo Liebe aufhört und wo sie beginnt",
    "titleDe": "Wo Liebe aufhört und wo sie beginnt",
    "titleCs": null,
    "season": 1,
    "number": 177,
    "episode": 177,
    "released": "2026-04-12T00:00:00.000Z",
    "firstAired": "2026-04-12T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/hero-pilcher-wo-die-liebe-aufhoert-100~1920x1080?cb=1776694369640",
    "overview": "[OFFICIAL] Kate liebt die Arbeit in ihrem kleinen Café, das sie mit ihrer Freundin Polly betreibt. Ihr großer Traum: Ein eigenes Literaturcafé. Doch aus Liebe zu ihrem Mann stellt sie diesen zurück.",
    "rating": "5.1",
    "hasZdf": true,
    "hasYt": false
  },
  {
    "id": "tt0907694:1:178",
    "name": "⚡ Die Glücksbringerin",
    "title": "⚡ Die Glücksbringerin",
    "titleDe": "Die Glücksbringerin",
    "titleCs": null,
    "season": 1,
    "number": 178,
    "episode": 178,
    "released": "2026-09-06T00:00:00.000Z",
    "firstAired": "2026-09-06T00:00:00.000Z",
    "thumbnail": "https://epg-image.zdf.de/fotobase-webdelivery/images/45cdebaf-8fbe-498c-aafd-57730994f4d4?layout=768x432",
    "overview": "[OFFICIAL] Schornsteinfegerin Clare Ridley gilt als Glücksbringerin in ihrem Ort. Doch plötzlich wird sie des Diebstahls verdächtigt, selbst von ihrer Jugendliebe Josh Harding.",
    "rating": "4.9",
    "hasZdf": true,
    "hasYt": false
  }
];

const EPISODES = [
  {
    "id": "rp_001",
    "type": "movie",
    "name": "Bouřlivé setkání / Stürmische Begegnung",
    "searchTitle": "Stürmische Begegnung",
    "titleDe": "Stürmische Begegnung",
    "titleCs": "Bouřlivé setkání",
    "episode": 1,
    "poster": "https://images.metahub.space/poster/medium/tt0108240/img",
    "description": "Rosamunde Pilcher Liebesfilm (1993). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_002",
    "type": "movie",
    "name": "Divoký tymián / Wilder Thymian",
    "searchTitle": "Wilder Thymian",
    "titleDe": "Wilder Thymian",
    "titleCs": "Divoký tymián",
    "episode": 2,
    "poster": "https://images.metahub.space/poster/medium/tt0111721/img",
    "description": "Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_003",
    "type": "movie",
    "name": "▶ Kolotoč života / Karussell des Lebens",
    "searchTitle": "Karussell des Lebens",
    "titleDe": "Karussell des Lebens",
    "titleCs": "Kolotoč života",
    "episode": 3,
    "poster": "https://images.metahub.space/poster/medium/tt0110245/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_004",
    "type": "movie",
    "name": "Milostná rošáda / Wechselspiel der Liebe",
    "searchTitle": "Wechselspiel der Liebe",
    "titleDe": "Wechselspiel der Liebe",
    "titleCs": "Milostná rošáda",
    "episode": 4,
    "poster": "https://images.metahub.space/poster/medium/tt0114903/img",
    "description": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_005",
    "type": "movie",
    "name": "▶ Konec jednoho léta / Das Ende eines Sommers",
    "searchTitle": "Das Ende eines Sommers",
    "titleDe": "Das Ende eines Sommers",
    "titleCs": "Konec jednoho léta",
    "episode": 5,
    "poster": "https://images.metahub.space/poster/medium/tt0123821/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_006",
    "type": "movie",
    "name": "▶ Léto u moře / Sommer am Meer",
    "searchTitle": "Sommer am Meer",
    "titleDe": "Sommer am Meer",
    "titleCs": "Léto u moře",
    "episode": 6,
    "poster": "https://images.metahub.space/poster/medium/tt0114498/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_007",
    "type": "movie",
    "name": "▶ Spící tygr / Schlafender Tiger",
    "searchTitle": "Schlafender Tiger",
    "titleDe": "Schlafender Tiger",
    "titleCs": "Spící tygr",
    "episode": 7,
    "poster": "https://images.metahub.space/poster/medium/tt0114353/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_008",
    "type": "movie",
    "name": "▶ Mraky na obzoru / Wolken am Horizont",
    "searchTitle": "Wolken am Horizont",
    "titleDe": "Wolken am Horizont",
    "titleCs": "Mraky na obzoru",
    "episode": 8,
    "poster": "https://images.metahub.space/poster/medium/tt0126124/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_009",
    "type": "movie",
    "name": "Jarní vánice / Schneesturm im Frühling",
    "searchTitle": "Schneesturm im Frühling",
    "titleDe": "Schneesturm im Frühling",
    "titleCs": "Jarní vánice",
    "episode": 9,
    "poster": "https://images.metahub.space/poster/medium/tt0117564/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_010",
    "type": "movie",
    "name": "▶ Hra světel / Lichterspiele",
    "searchTitle": "Lichterspiele",
    "titleDe": "Lichterspiele",
    "titleCs": "Hra světel",
    "episode": 10,
    "poster": "https://images.metahub.space/poster/medium/tt0116870/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_011",
    "type": "movie",
    "name": "Září: Část 1 / September: Teil 1",
    "searchTitle": "September: Teil 1",
    "titleDe": "September: Teil 1",
    "titleCs": "Září: Část 1",
    "episode": 11,
    "poster": "https://images.metahub.space/poster/medium/tt15729598/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_012",
    "type": "movie",
    "name": "Září: Část 2 / September: Teil 2",
    "searchTitle": "September: Teil 2",
    "titleDe": "September: Teil 2",
    "titleCs": "Září: Část 2",
    "episode": 12,
    "poster": "https://images.metahub.space/poster/medium/tt15741176/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_013",
    "type": "movie",
    "name": "▶ Dům na pobřeží / Das Haus an der Küste",
    "searchTitle": "Das Haus an der Küste",
    "titleDe": "Das Haus an der Küste",
    "titleCs": "Dům na pobřeží",
    "episode": 13,
    "poster": "https://images.metahub.space/poster/medium/tt0116498/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_014",
    "type": "movie",
    "name": "Zvláštní láska / Eine besondere Liebe",
    "searchTitle": "Eine besondere Liebe",
    "titleDe": "Eine besondere Liebe",
    "titleCs": "Zvláštní láska",
    "episode": 14,
    "poster": "https://images.metahub.space/poster/medium/tt0115659/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_015",
    "type": "movie",
    "name": "Vítr naděje / Wind der Hoffnung",
    "searchTitle": "Wind der Hoffnung",
    "titleDe": "Wind der Hoffnung",
    "titleCs": "Vítr naděje",
    "episode": 15,
    "poster": "https://images.metahub.space/poster/medium/tt0120517/img",
    "description": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_016",
    "type": "movie",
    "name": "▶ Zbloudilá srdce / Irrwege des Herzens",
    "searchTitle": "Irrwege des Herzens",
    "titleDe": "Irrwege des Herzens",
    "titleCs": "Zbloudilá srdce",
    "episode": 16,
    "poster": "https://images.metahub.space/poster/medium/tt0119384/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_017",
    "type": "movie",
    "name": "Hodina rozhodnutí / Stunden der Entscheidung",
    "searchTitle": "Stunden der Entscheidung",
    "titleDe": "Stunden der Entscheidung",
    "titleCs": "Hodina rozhodnutí",
    "episode": 17,
    "poster": "https://images.metahub.space/poster/medium/tt0120234/img",
    "description": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_018",
    "type": "movie",
    "name": "▶ Druhá šance / Die zweite Chance",
    "searchTitle": "Die zweite Chance",
    "titleDe": "Die zweite Chance",
    "titleCs": "Druhá šance",
    "episode": 18,
    "poster": "https://images.metahub.space/poster/medium/tt0128860/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_019",
    "type": "movie",
    "name": "▶ Dvě sestry / Zwei Schwestern",
    "searchTitle": "Zwei Schwestern",
    "titleDe": "Zwei Schwestern",
    "titleCs": "Dvě sestry",
    "episode": 19,
    "poster": "https://images.metahub.space/poster/medium/tt0135071/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_020",
    "type": "movie",
    "name": "▶ Cena lásky / Der Preis der Liebe",
    "searchTitle": "Der Preis der Liebe",
    "titleDe": "Der Preis der Liebe",
    "titleCs": "Cena lásky",
    "episode": 20,
    "poster": "https://images.metahub.space/poster/medium/tt0146041/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_021",
    "type": "movie",
    "name": "Návrat domů: Část 1 / Heimkehr: Teil 1",
    "searchTitle": "Heimkehr: Teil 1",
    "titleDe": "Heimkehr: Teil 1",
    "titleCs": "Návrat domů: Část 1",
    "episode": 21,
    "poster": "https://images.metahub.space/poster/medium/tt15729564/img",
    "description": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_022",
    "type": "movie",
    "name": "Návrat domů: Část 2 / Heimkehr: Teil 2",
    "searchTitle": "Heimkehr: Teil 2",
    "titleDe": "Heimkehr: Teil 2",
    "titleCs": "Návrat domů: Část 2",
    "episode": 22,
    "poster": "https://images.metahub.space/poster/medium/tt15729560/img",
    "description": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_023",
    "type": "movie",
    "name": "▶ Návrat do ráje / Rückkehr ins Paradies",
    "searchTitle": "Rückkehr ins Paradies",
    "titleDe": "Rückkehr ins Paradies",
    "titleCs": "Návrat do ráje",
    "episode": 23,
    "poster": "https://images.metahub.space/poster/medium/tt0170520/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_024",
    "type": "movie",
    "name": "▶ Trny v údolí květin / Dornen im Tal der Blumen",
    "searchTitle": "Dornen im Tal der Blumen",
    "titleDe": "Dornen im Tal der Blumen",
    "titleCs": "Trny v údolí květin",
    "episode": 24,
    "poster": "https://images.metahub.space/poster/medium/tt0177180/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_025",
    "type": "movie",
    "name": "▶ Hudba v srdcích / Melodie der Herzen",
    "searchTitle": "Melodie der Herzen",
    "titleDe": "Melodie der Herzen",
    "titleCs": "Hudba v srdcích",
    "episode": 25,
    "poster": "https://images.metahub.space/poster/medium/tt0181794/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_026",
    "type": "movie",
    "name": "▶ Kouzlo lásky / Magie der Liebe",
    "searchTitle": "Magie der Liebe",
    "titleDe": "Magie der Liebe",
    "titleCs": "Kouzlo lásky",
    "episode": 26,
    "poster": "https://images.metahub.space/poster/medium/tt0184868/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_027",
    "type": "movie",
    "name": "▶ Růže v bouři / Rosen im Sturm",
    "searchTitle": "Rosen im Sturm",
    "titleDe": "Rosen im Sturm",
    "titleCs": "Růže v bouři",
    "episode": 27,
    "poster": "https://images.metahub.space/poster/medium/tt0188183/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_028",
    "type": "movie",
    "name": "▶ Nancherrow: Část 1 / Das große Erbe: Teil 1",
    "searchTitle": "Das große Erbe: Teil 1",
    "titleDe": "Das große Erbe: Teil 1",
    "titleCs": "Nancherrow: Část 1",
    "episode": 28,
    "poster": "https://images.metahub.space/poster/medium/tt15740730/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_029",
    "type": "movie",
    "name": "▶ Nancherrow: Část 2 / Das große Erbe: Teil 2",
    "searchTitle": "Das große Erbe: Teil 2",
    "titleDe": "Das große Erbe: Teil 2",
    "titleCs": "Nancherrow: Část 2",
    "episode": 29,
    "poster": "https://images.metahub.space/poster/medium/tt15740738/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_030",
    "type": "movie",
    "name": "▶ Útesy lásky / Klippen der Liebe",
    "searchTitle": "Klippen der Liebe",
    "titleDe": "Klippen der Liebe",
    "titleCs": "Útesy lásky",
    "episode": 30,
    "poster": "https://images.metahub.space/poster/medium/tt0217605/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_031",
    "type": "movie",
    "name": "Rackové ve větru / Möwen im Wind",
    "searchTitle": "Möwen im Wind",
    "titleDe": "Möwen im Wind",
    "titleCs": "Rackové ve větru",
    "episode": 31,
    "poster": "https://images.metahub.space/poster/medium/tt0222330/img",
    "description": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_032",
    "type": "movie",
    "name": "▶ Květ života / Blüte des Lebens",
    "searchTitle": "Blüte des Lebens",
    "titleDe": "Blüte des Lebens",
    "titleCs": "Květ života",
    "episode": 32,
    "poster": "https://images.metahub.space/poster/medium/tt0226390/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_033",
    "type": "movie",
    "name": "Dlouhá cesta ke štěstí / Der lange Weg zum Glück",
    "searchTitle": "Der lange Weg zum Glück",
    "titleDe": "Der lange Weg zum Glück",
    "titleCs": "Dlouhá cesta ke štěstí",
    "episode": 33,
    "poster": "https://images.metahub.space/poster/medium/tt0230712/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_034",
    "type": "movie",
    "name": "Čas poznání / Zeit der Erkenntnis",
    "searchTitle": "Zeit der Erkenntnis",
    "titleDe": "Zeit der Erkenntnis",
    "titleCs": "Čas poznání",
    "episode": 34,
    "poster": "https://images.metahub.space/poster/medium/tt0244176/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_035",
    "type": "movie",
    "name": "Rozervaná srdce / Zerrissene Herzen",
    "searchTitle": "Zerrissene Herzen",
    "titleDe": "Zerrissene Herzen",
    "titleCs": "Rozervaná srdce",
    "episode": 35,
    "poster": "https://images.metahub.space/poster/medium/tt0262737/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_036",
    "type": "movie",
    "name": "Volání minulosti / Ruf der Vergangenheit",
    "searchTitle": "Ruf der Vergangenheit",
    "titleDe": "Ruf der Vergangenheit",
    "titleCs": "Volání minulosti",
    "episode": 36,
    "poster": "https://images.metahub.space/poster/medium/tt0266913/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_037",
    "type": "movie",
    "name": "▶ Ve svitu ohně / Im Licht des Feuers",
    "searchTitle": "Im Licht des Feuers",
    "titleDe": "Im Licht des Feuers",
    "titleCs": "Ve svitu ohně",
    "episode": 37,
    "poster": "https://images.metahub.space/poster/medium/tt0271760/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_038",
    "type": "movie",
    "name": "Růže z Kerrymoru / Die Rose von Kerrymore",
    "searchTitle": "Die Rose von Kerrymore",
    "titleDe": "Die Rose von Kerrymore",
    "titleCs": "Růže z Kerrymoru",
    "episode": 38,
    "poster": "https://images.metahub.space/poster/medium/tt0272817/img",
    "description": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_039",
    "type": "movie",
    "name": "Pobřeží snů / Küste der Träume",
    "searchTitle": "Küste der Träume",
    "titleDe": "Küste der Träume",
    "titleCs": "Pobřeží snů",
    "episode": 39,
    "poster": "https://images.metahub.space/poster/medium/tt0275637/img",
    "description": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_040",
    "type": "movie",
    "name": "Děti štěstěny / Kinder des Glücks",
    "searchTitle": "Kinder des Glücks",
    "titleDe": "Kinder des Glücks",
    "titleCs": "Děti štěstěny",
    "episode": 40,
    "poster": "https://images.metahub.space/poster/medium/tt0300428/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_041",
    "type": "movie",
    "name": "Vítr nad řekou / Wind über dem Fluss",
    "searchTitle": "Wind über dem Fluss",
    "titleDe": "Wind über dem Fluss",
    "titleCs": "Vítr nad řekou",
    "episode": 41,
    "poster": "https://images.metahub.space/poster/medium/tt0301782/img",
    "description": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_042",
    "type": "movie",
    "name": "▶ Květiny v dešti / Blumen im Regen",
    "searchTitle": "Blumen im Regen",
    "titleDe": "Blumen im Regen",
    "titleCs": "Květiny v dešti",
    "episode": 42,
    "poster": "https://images.metahub.space/poster/medium/tt0304642/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_043",
    "type": "movie",
    "name": "To hlavní je láska / Wenn nur noch Liebe zählt",
    "searchTitle": "Wenn nur noch Liebe zählt",
    "titleDe": "Wenn nur noch Liebe zählt",
    "titleCs": "To hlavní je láska",
    "episode": 43,
    "poster": "https://images.metahub.space/poster/medium/tt0310081/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_044",
    "type": "movie",
    "name": "Šťastná náhoda / Morgen träumen wir gemeinsam",
    "searchTitle": "Morgen träumen wir gemeinsam",
    "titleDe": "Morgen träumen wir gemeinsam",
    "titleCs": "Šťastná náhoda",
    "episode": 44,
    "poster": "https://images.metahub.space/poster/medium/tt0316507/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_045",
    "type": "movie",
    "name": "Očima lásky / Mit den Augen der Liebe",
    "searchTitle": "Mit den Augen der Liebe",
    "titleDe": "Mit den Augen der Liebe",
    "titleCs": "Očima lásky",
    "episode": 45,
    "poster": "https://images.metahub.space/poster/medium/tt0337119/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_046",
    "type": "movie",
    "name": "▶ Až na konec světa / Bis ans Ende der Welt",
    "searchTitle": "Bis ans Ende der Welt",
    "titleDe": "Bis ans Ende der Welt",
    "titleCs": "Až na konec světa",
    "episode": 46,
    "poster": "https://images.metahub.space/poster/medium/tt0345873/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_047",
    "type": "movie",
    "name": "Padající hvězda / Sternschnuppen im August",
    "searchTitle": "Sternschnuppen im August",
    "titleDe": "Sternschnuppen im August",
    "titleCs": "Padající hvězda",
    "episode": 47,
    "poster": "https://images.metahub.space/poster/medium/tt0348739/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_048",
    "type": "movie",
    "name": "Ráj snů / Paradies der Träume",
    "searchTitle": "Paradies der Träume",
    "titleDe": "Paradies der Träume",
    "titleCs": "Ráj snů",
    "episode": 48,
    "poster": "https://images.metahub.space/poster/medium/tt0353957/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_049",
    "type": "movie",
    "name": "Plamen lásky / Flamme der Liebe",
    "searchTitle": "Flamme der Liebe",
    "titleDe": "Flamme der Liebe",
    "titleCs": "Plamen lásky",
    "episode": 49,
    "poster": "https://images.metahub.space/poster/medium/tt0357109/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_050",
    "type": "movie",
    "name": "Srdce se nemýlí / Gewissheit des Herzens",
    "searchTitle": "Gewissheit des Herzens",
    "titleDe": "Gewissheit des Herzens",
    "titleCs": "Srdce se nemýlí",
    "episode": 50,
    "poster": "https://images.metahub.space/poster/medium/tt0386755/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_051",
    "type": "movie",
    "name": "Zimní slunovrat / Wintersonne (1+2)",
    "searchTitle": "Wintersonne (1+2)",
    "titleDe": "Wintersonne (1+2)",
    "titleCs": "Zimní slunovrat",
    "episode": 51,
    "poster": "https://images.metahub.space/poster/medium/tt15727968/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_052",
    "type": "movie",
    "name": "Pírka ve větru / Federn im Wind",
    "searchTitle": "Federn im Wind",
    "titleDe": "Federn im Wind",
    "titleCs": "Pírka ve větru",
    "episode": 52,
    "poster": "https://images.metahub.space/poster/medium/tt0396843/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_053",
    "type": "movie",
    "name": "Cesty lásky / Wege der Liebe",
    "searchTitle": "Wege der Liebe",
    "titleDe": "Wege der Liebe",
    "titleCs": "Cesty lásky",
    "episode": 53,
    "poster": "https://images.metahub.space/poster/medium/tt0393657/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_054",
    "type": "movie",
    "name": "Dokud jsi tady / Solange es dich gibt",
    "searchTitle": "Solange es dich gibt",
    "titleDe": "Solange es dich gibt",
    "titleCs": "Dokud jsi tady",
    "episode": 54,
    "poster": "https://images.metahub.space/poster/medium/tt0433629/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_055",
    "type": "movie",
    "name": "Láska ve hře / Liebe im Spiel",
    "searchTitle": "Liebe im Spiel",
    "titleDe": "Liebe im Spiel",
    "titleCs": "Láska ve hře",
    "episode": 55,
    "poster": "https://images.metahub.space/poster/medium/tt0410534/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_056",
    "type": "movie",
    "name": "Sen jednoho léta / Traum eines Sommers",
    "searchTitle": "Traum eines Sommers",
    "titleDe": "Traum eines Sommers",
    "titleCs": "Sen jednoho léta",
    "episode": 56,
    "poster": "https://images.metahub.space/poster/medium/tt0450119/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_057",
    "type": "movie",
    "name": "Pouto lásky / Tiefe der Gefühle",
    "searchTitle": "Tiefe der Gefühle",
    "titleDe": "Tiefe der Gefühle",
    "titleCs": "Pouto lásky",
    "episode": 57,
    "poster": "https://images.metahub.space/poster/medium/tt0432346/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_058",
    "type": "movie",
    "name": "▶ Tak blízko nebi / Dem Himmel so nah",
    "searchTitle": "Dem Himmel so nah",
    "titleDe": "Dem Himmel so nah",
    "titleCs": "Tak blízko nebi",
    "episode": 58,
    "poster": "https://images.metahub.space/poster/medium/tt0450116/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_059",
    "type": "movie",
    "name": "Odkaz lásky / Vermächtnis der Liebe",
    "searchTitle": "Vermächtnis der Liebe",
    "titleDe": "Vermächtnis der Liebe",
    "titleCs": "Odkaz lásky",
    "episode": 59,
    "poster": "https://images.metahub.space/poster/medium/tt0450120/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_060",
    "type": "movie",
    "name": "Královna noci / Königin der Nacht",
    "searchTitle": "Königin der Nacht",
    "titleDe": "Königin der Nacht",
    "titleCs": "Královna noci",
    "episode": 60,
    "poster": "https://images.metahub.space/poster/medium/tt0450117/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_061",
    "type": "movie",
    "name": "Plachetnice lásky / Segel der Liebe",
    "searchTitle": "Segel der Liebe",
    "titleDe": "Segel der Liebe",
    "titleCs": "Plachetnice lásky",
    "episode": 61,
    "poster": "https://images.metahub.space/poster/medium/tt0450118/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_062",
    "type": "movie",
    "name": "▶ Nad oblaky / Über den Wolken",
    "searchTitle": "Über den Wolken",
    "titleDe": "Über den Wolken",
    "titleCs": "Nad oblaky",
    "episode": 62,
    "poster": "https://images.metahub.space/poster/medium/tt0491128/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_063",
    "type": "movie",
    "name": "Letní slunovrat / Zauber der Liebe (1+2)",
    "searchTitle": "Zauber der Liebe (1+2)",
    "titleDe": "Zauber der Liebe (1+2)",
    "titleCs": "Letní slunovrat",
    "episode": 63,
    "poster": "https://images.metahub.space/poster/medium/tt15727726/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_064",
    "type": "movie",
    "name": "Cornwallská romance / Der Himmel über Cornwall",
    "searchTitle": "Der Himmel über Cornwall",
    "titleDe": "Der Himmel über Cornwall",
    "titleCs": "Cornwallská romance",
    "episode": 64,
    "poster": "https://images.metahub.space/poster/medium/tt0777270/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_065",
    "type": "movie",
    "name": "Rodný statek / Land der Sehnsucht",
    "searchTitle": "Land der Sehnsucht",
    "titleDe": "Land der Sehnsucht",
    "titleCs": "Rodný statek",
    "episode": 65,
    "poster": "https://images.metahub.space/poster/medium/tt0497438/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_066",
    "type": "movie",
    "name": "Kouzelné léto / Sommer des Erwachens",
    "searchTitle": "Sommer des Erwachens",
    "titleDe": "Sommer des Erwachens",
    "titleCs": "Kouzelné léto",
    "episode": 66,
    "poster": "https://images.metahub.space/poster/medium/tt0499557/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_067",
    "type": "movie",
    "name": "Kde začala láska / Wo die Liebe begann",
    "searchTitle": "Wo die Liebe begann",
    "titleDe": "Wo die Liebe begann",
    "titleCs": "Kde začala láska",
    "episode": 67,
    "poster": "https://images.metahub.space/poster/medium/tt0857260/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_068",
    "type": "movie",
    "name": "Láska jejího života / Die Liebe ihres Lebens",
    "searchTitle": "Die Liebe ihres Lebens",
    "titleDe": "Die Liebe ihres Lebens",
    "titleCs": "Láska jejího života",
    "episode": 68,
    "poster": "https://images.metahub.space/poster/medium/tt0872156/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_069",
    "type": "movie",
    "name": "▶ A najednou to byla láska / Und plötzlich war es Liebe",
    "searchTitle": "Und plötzlich war es Liebe",
    "titleDe": "Und plötzlich war es Liebe",
    "titleCs": "A najednou to byla láska",
    "episode": 69,
    "poster": "https://images.metahub.space/poster/medium/tt0903964/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_070",
    "type": "movie",
    "name": "Vítr nad řekou / Wiedersehen am Fluss",
    "searchTitle": "Wiedersehen am Fluss",
    "titleDe": "Wiedersehen am Fluss",
    "titleCs": "Vítr nad řekou",
    "episode": 71,
    "poster": "https://images.metahub.space/poster/medium/tt0943113/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_071",
    "type": "movie",
    "name": "Sommer der Liebe",
    "searchTitle": "Sommer der Liebe",
    "titleDe": "Sommer der Liebe",
    "titleCs": null,
    "episode": 72,
    "poster": "https://images.metahub.space/poster/medium/tt0988802/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_072",
    "type": "movie",
    "name": "Křídla naděje / Flügel der Hoffnung",
    "searchTitle": "Flügel der Hoffnung",
    "titleDe": "Flügel der Hoffnung",
    "titleCs": "Křídla naděje",
    "episode": 73,
    "poster": "https://images.metahub.space/poster/medium/tt0988801/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_073",
    "type": "movie",
    "name": "Muž mých snů / Der Mann meiner Träume",
    "searchTitle": "Der Mann meiner Träume",
    "titleDe": "Der Mann meiner Träume",
    "titleCs": "Muž mých snů",
    "episode": 74,
    "poster": "https://images.metahub.space/poster/medium/tt1096981/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_074",
    "type": "movie",
    "name": "Vítězství lásky / Sieg der Liebe",
    "searchTitle": "Sieg der Liebe",
    "titleDe": "Sieg der Liebe",
    "titleCs": "Vítězství lásky",
    "episode": 75,
    "poster": "https://images.metahub.space/poster/medium/tt1106607/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_075",
    "type": "movie",
    "name": "Mlha nad zámkem Kilrush / Nebel über Schloss Kilrush",
    "searchTitle": "Nebel über Schloss Kilrush",
    "titleDe": "Nebel über Schloss Kilrush",
    "titleCs": "Mlha nad zámkem Kilrush",
    "episode": 76,
    "poster": "https://images.metahub.space/poster/medium/tt1125243/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_076",
    "type": "movie",
    "name": "▶ Láska nepomíjí / Aus Liebe und Leidenschaft",
    "searchTitle": "Aus Liebe und Leidenschaft",
    "titleDe": "Aus Liebe und Leidenschaft",
    "titleCs": "Láska nepomíjí",
    "episode": 77,
    "poster": "https://images.metahub.space/poster/medium/tt1140926/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_077",
    "type": "movie",
    "name": "▶ Mraky nad mořem / Wind über der See",
    "searchTitle": "Wind über der See",
    "titleDe": "Wind über der See",
    "titleCs": "Mraky nad mořem",
    "episode": 78,
    "poster": "https://images.metahub.space/poster/medium/tt1150986/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_078",
    "type": "movie",
    "name": "Šípy lásky / Pfeile der Liebe",
    "searchTitle": "Pfeile der Liebe",
    "titleDe": "Pfeile der Liebe",
    "titleCs": "Šípy lásky",
    "episode": 79,
    "poster": "https://images.metahub.space/poster/medium/tt1177749/img",
    "description": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_079",
    "type": "movie",
    "name": "Melodie lásky / Melodie der Liebe",
    "searchTitle": "Melodie der Liebe",
    "titleDe": "Melodie der Liebe",
    "titleCs": "Melodie lásky",
    "episode": 80,
    "poster": "https://images.metahub.space/poster/medium/tt1178398/img",
    "description": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_080",
    "type": "movie",
    "name": "▶ Srdce ve větru / Herzen im Wind",
    "searchTitle": "Herzen im Wind",
    "titleDe": "Herzen im Wind",
    "titleCs": "Srdce ve větru",
    "episode": 81,
    "poster": "https://images.metahub.space/poster/medium/tt1178399/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_081",
    "type": "movie",
    "name": "Příliv lásky / Gezeiten der Liebe",
    "searchTitle": "Gezeiten der Liebe",
    "titleDe": "Gezeiten der Liebe",
    "titleCs": "Příliv lásky",
    "episode": 84,
    "poster": "https://images.metahub.space/poster/medium/tt1178400/img",
    "description": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_082",
    "type": "movie",
    "name": "▶ Roztoužená srdce / Herzenssehnsucht",
    "searchTitle": "Herzenssehnsucht",
    "titleDe": "Herzenssehnsucht",
    "titleCs": "Roztoužená srdce",
    "episode": 85,
    "poster": "https://images.metahub.space/poster/medium/tt1178401/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_083",
    "type": "movie",
    "name": "Podzim lásky / Eine Liebe im Herbst",
    "searchTitle": "Eine Liebe im Herbst",
    "titleDe": "Eine Liebe im Herbst",
    "titleCs": "Podzim lásky",
    "episode": 86,
    "poster": "https://images.metahub.space/poster/medium/tt1178402/img",
    "description": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_084",
    "type": "movie",
    "name": "Ať rozhodne srdce / Entscheidung des Herzens",
    "searchTitle": "Entscheidung des Herzens",
    "titleDe": "Entscheidung des Herzens",
    "titleCs": "Ať rozhodne srdce",
    "episode": 87,
    "poster": "https://images.metahub.space/poster/medium/tt1178403/img",
    "description": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_085",
    "type": "movie",
    "name": "⚡ Láska navzdory celému světu / Liebe gegen den Rest der Welt",
    "searchTitle": "Liebe gegen den Rest der Welt",
    "titleDe": "Liebe gegen den Rest der Welt",
    "titleCs": "Láska navzdory celému světu",
    "episode": 88,
    "poster": "https://www.zdf.de/assets/liebe-gegen-den-rest-der-welt-102~1920x1080?cb=1747395872987",
    "description": "[OFFICIAL] Rachel Wilson kehrt nach zwei Jahren in das kleine Dorf Kingscove in Cornwall zurück, das sie eigentlich für immer verlassen wollte."
  },
  {
    "id": "rp_086",
    "type": "movie",
    "name": "⚡ Shledání v Rose Abbey / Wiedersehen in Rose Abbey",
    "searchTitle": "Wiedersehen in Rose Abbey",
    "titleDe": "Wiedersehen in Rose Abbey",
    "titleCs": "Shledání v Rose Abbey",
    "episode": 89,
    "poster": "https://www.zdf.de/assets/wiedersehen-in-rose-abbey-100~1920x1080?cb=1746798390082",
    "description": "[OFFICIAL] Roseanne Brix, Studentin aus Chicago, kommt nach dem Tod ihrer Mutter nach England, um ihren leiblichen Vater zu suchen. Ihr einziger Hinweis ist ein altes Foto ihrer Mutter."
  },
  {
    "id": "rp_087",
    "type": "movie",
    "name": "⚡ Dej, ať je to láska / Lass es Liebe sein",
    "searchTitle": "Lass es Liebe sein",
    "titleDe": "Lass es Liebe sein",
    "titleCs": "Dej, ať je to láska",
    "episode": 90,
    "poster": "https://www.zdf.de/assets/lass-es-liebe-sein-100~1920x1080?cb=1746450048706",
    "description": "[OFFICIAL] Eine kurze, schicksalhafte Begegnung zwischen Tom und Natalie, einer jungen Studentin aus Georgien, wird das Leben beider für immer verändern: Sie verlieben sich ineinander."
  },
  {
    "id": "rp_088",
    "type": "movie",
    "name": "Presumpce lásky / Im Zweifel für die Liebe",
    "searchTitle": "Im Zweifel für die Liebe",
    "titleDe": "Im Zweifel für die Liebe",
    "titleCs": "Presumpce lásky",
    "episode": 93,
    "poster": "https://images.metahub.space/poster/medium/tt1545888/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_089",
    "type": "movie",
    "name": "Ať půjdeš kamkoli / Wohin du auch gehst",
    "searchTitle": "Wohin du auch gehst",
    "titleDe": "Wohin du auch gehst",
    "titleCs": "Ať půjdeš kamkoli",
    "episode": 94,
    "poster": "https://images.metahub.space/poster/medium/tt1545890/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_090",
    "type": "movie",
    "name": "Láska na obzoru / Liebe am Horizont",
    "searchTitle": "Liebe am Horizont",
    "titleDe": "Liebe am Horizont",
    "titleCs": "Láska na obzoru",
    "episode": 95,
    "poster": "https://images.metahub.space/poster/medium/tt1545889/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_091",
    "type": "movie",
    "name": "▶ Když srdce pláče / Wenn das Herz zerbricht",
    "searchTitle": "Wenn das Herz zerbricht",
    "titleDe": "Wenn das Herz zerbricht",
    "titleCs": "Když srdce pláče",
    "episode": 96,
    "poster": "https://images.metahub.space/poster/medium/tt1670117/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_092",
    "type": "movie",
    "name": "Na křídlech lásky / Flügel der Liebe",
    "searchTitle": "Flügel der Liebe",
    "titleDe": "Flügel der Liebe",
    "titleCs": "Na křídlech lásky",
    "episode": 97,
    "poster": "https://images.metahub.space/poster/medium/tt1702299/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_093",
    "type": "movie",
    "name": "Sňatek z rozumu / Lords lügen nicht",
    "searchTitle": "Lords lügen nicht",
    "titleDe": "Lords lügen nicht",
    "titleCs": "Sňatek z rozumu",
    "episode": 98,
    "poster": "https://images.metahub.space/poster/medium/tt1729996/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_094",
    "type": "movie",
    "name": "▶ Zeptej se srdce / Herzensfragen",
    "searchTitle": "Herzensfragen",
    "titleDe": "Herzensfragen",
    "titleCs": "Zeptej se srdce",
    "episode": 99,
    "poster": "https://images.metahub.space/poster/medium/tt1794473/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_095",
    "type": "movie",
    "name": "Cesta za štěstím / Sonntagskinder",
    "searchTitle": "Sonntagskinder",
    "titleDe": "Sonntagskinder",
    "titleCs": "Cesta za štěstím",
    "episode": 100,
    "poster": "https://images.metahub.space/poster/medium/tt1804980/img",
    "description": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_096",
    "type": "movie",
    "name": "⚡ Zmatená láska / Verlobt, verliebt, verwirrt",
    "searchTitle": "Verlobt, verliebt, verwirrt",
    "titleDe": "Verlobt, verliebt, verwirrt",
    "titleCs": "Zmatená láska",
    "episode": 103,
    "poster": "https://www.zdf.de/assets/verlobt-verliebt-verwirrt-100~1920x1080?cb=1745830743700",
    "description": "[OFFICIAL] Emma Waters überredet ihre Freundin Julia Adams, einen Junggesellinnenabschied zu machen. Als Julia einen Kuss versteigern soll, kann sie nicht glauben, wer der Gewinner ist."
  },
  {
    "id": "rp_097",
    "type": "movie",
    "name": "▶ Ukradené léto / Der gestohlene Sommer",
    "searchTitle": "Der gestohlene Sommer",
    "titleDe": "Der gestohlene Sommer",
    "titleCs": "Ukradené léto",
    "episode": 104,
    "poster": "https://images.metahub.space/poster/medium/tt2050247/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_098",
    "type": "movie",
    "name": "⚡▶ Ve víně je láska / Englischer Wein",
    "searchTitle": "Englischer Wein",
    "titleDe": "Englischer Wein",
    "titleCs": "Ve víně je láska",
    "episode": 105,
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-englischer-wein-104~1920x1080?cb=1744711026467",
    "description": "[BOTH] Die ehrgeizige Winzerin Hannah Powell, die lange in Frankreich gelebt hat, erhält die Chance ihres Lebens: Sie soll ein Weingut in ihrer Heimat Südengland auf Vordermann bringen."
  },
  {
    "id": "rp_099",
    "type": "movie",
    "name": "Nebezpečný příboj / Gefährliche Brandung",
    "searchTitle": "Gefährliche Brandung",
    "titleDe": "Gefährliche Brandung",
    "titleCs": "Nebezpečný příboj",
    "episode": 106,
    "poster": "https://images.metahub.space/poster/medium/tt2122084/img",
    "description": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_100",
    "type": "movie",
    "name": "⚡ Dokonalé štěstí / Ungezügelt ins Glück",
    "searchTitle": "Ungezügelt ins Glück",
    "titleDe": "Ungezügelt ins Glück",
    "titleCs": "Dokonalé štěstí",
    "episode": 109,
    "poster": "https://www.zdf.de/assets/ungezuegelt-ins-glueck-100~1920x1080?cb=1744907251956",
    "description": "[OFFICIAL] Lord Brooks stellt nach langer Abwesenheit entsetzt fest, dass seine Mutter das Familienanwesen in ein Pferdeasyl verwandelt hat. Er muss sich nun um die Rettung des Erbes kümmern."
  },
  {
    "id": "rp_101",
    "type": "movie",
    "name": "⚡ Tajemství starého panství / Das Geheimnis der weißen Taube",
    "searchTitle": "Das Geheimnis der weißen Taube",
    "titleDe": "Das Geheimnis der weißen Taube",
    "titleCs": "Tajemství starého panství",
    "episode": 110,
    "poster": "https://www.zdf.de/assets/das-geheimnis-der-weissen-taube-100~1920x1080?cb=1746022269147",
    "description": "[OFFICIAL] Auktionatorin Stella liebt die alten Schätze, die sie verkauft. Doch im Auktionshaus der Familie ihres Mannes Peter kriselt es seit neustem – und das nicht nur bei ihrer Arbeit."
  },
  {
    "id": "rp_102",
    "type": "movie",
    "name": "⚡▶ Falešná jeptiška / Die falsche Nonne",
    "searchTitle": "Die falsche Nonne",
    "titleDe": "Die falsche Nonne",
    "titleCs": "Falešná jeptiška",
    "episode": 111,
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-die-falsche-nonne-104~1920x1080?cb=1793023905964",
    "description": "[BOTH] Bei einem Undercover-Einsatz lernt Polizistin Sabrina Tom kennen."
  },
  {
    "id": "rp_103",
    "type": "movie",
    "name": "⚡ Nový začátek / In der Mitte eines Lebens",
    "searchTitle": "In der Mitte eines Lebens",
    "titleDe": "In der Mitte eines Lebens",
    "titleCs": "Nový začátek",
    "episode": 112,
    "poster": "https://www.zdf.de/assets/in-der-mitte-des-lebens-100~1920x1080?cb=1578559755191",
    "description": "[OFFICIAL] Ella Dempsey muss nach einem Vorfall ihr ganzes Leben überdenken."
  },
  {
    "id": "rp_104",
    "type": "movie",
    "name": "Dvojí život: Část 1 / Die andere Frau, Teil 1",
    "searchTitle": "Die andere Frau, Teil 1",
    "titleDe": "Die andere Frau, Teil 1",
    "titleCs": "Dvojí život: Část 1",
    "episode": 113,
    "poster": "https://images.metahub.space/poster/medium/tt3959970/img",
    "description": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_105",
    "type": "movie",
    "name": "Dvojí život: Část 2 / Die andere Frau, Teil 2",
    "searchTitle": "Die andere Frau, Teil 2",
    "titleDe": "Die andere Frau, Teil 2",
    "titleCs": "Dvojí život: Část 2",
    "episode": 114,
    "poster": "https://images.metahub.space/poster/medium/tt2169404/img",
    "description": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_106",
    "type": "movie",
    "name": "▶ Otázka cti / Eine Frage der Ehre",
    "searchTitle": "Eine Frage der Ehre",
    "titleDe": "Eine Frage der Ehre",
    "titleCs": "Otázka cti",
    "episode": 115,
    "poster": "https://images.metahub.space/poster/medium/tt2592426/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_107",
    "type": "movie",
    "name": "⚡ Láska nad propastí / Die Frau auf der Klippe",
    "searchTitle": "Die Frau auf der Klippe",
    "titleDe": "Die Frau auf der Klippe",
    "titleCs": "Láska nad propastí",
    "episode": 116,
    "poster": "https://www.zdf.de/assets/die-frau-auf-der-klippe-100~1920x1080?cb=1793023515200",
    "description": "[OFFICIAL] Owen erbt das Herrenhaus seines verstorbenen Großonkels in Cornwall."
  },
  {
    "id": "rp_108",
    "type": "movie",
    "name": "Zahrada rajských pokušení / Schlangen im Paradies",
    "searchTitle": "Schlangen im Paradies",
    "titleDe": "Schlangen im Paradies",
    "titleCs": "Zahrada rajských pokušení",
    "episode": 117,
    "poster": "https://images.metahub.space/poster/medium/tt2831116/img",
    "description": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_109",
    "type": "movie",
    "name": "⚡ Zaslíbená nevěsta / Die versprochene Braut",
    "searchTitle": "Die versprochene Braut",
    "titleDe": "Die versprochene Braut",
    "titleCs": "Zaslíbená nevěsta",
    "episode": 118,
    "poster": "https://images.metahub.space/poster/medium/tt3128154/img",
    "description": "[OFFICIAL] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_110",
    "type": "movie",
    "name": "Stará láska nerezaví / Alte Herzen rosten nicht",
    "searchTitle": "Alte Herzen rosten nicht",
    "titleDe": "Alte Herzen rosten nicht",
    "titleCs": "Stará láska nerezaví",
    "episode": 119,
    "poster": "https://images.metahub.space/poster/medium/tt3293750/img",
    "description": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_111",
    "type": "movie",
    "name": "▶ Láska z nebes / Zu hoch geflogen",
    "searchTitle": "Zu hoch geflogen",
    "titleDe": "Zu hoch geflogen",
    "titleCs": "Láska z nebes",
    "episode": 120,
    "poster": "https://images.metahub.space/poster/medium/tt3443090/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_112",
    "type": "movie",
    "name": "První nebo druhá / Besetzte Herzen",
    "searchTitle": "Besetzte Herzen",
    "titleDe": "Besetzte Herzen",
    "titleCs": "První nebo druhá",
    "episode": 121,
    "poster": "https://images.metahub.space/poster/medium/tt3332888/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_113",
    "type": "movie",
    "name": "Stíny minulosti / Evitas Rache",
    "searchTitle": "Evitas Rache",
    "titleDe": "Evitas Rache",
    "titleCs": "Stíny minulosti",
    "episode": 122,
    "poster": "https://images.metahub.space/poster/medium/tt3132252/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_114",
    "type": "movie",
    "name": "Mé srdce patří tobě / Mein unbekanntes Herz",
    "searchTitle": "Mein unbekanntes Herz",
    "titleDe": "Mein unbekanntes Herz",
    "titleCs": "Mé srdce patří tobě",
    "episode": 123,
    "poster": "https://images.metahub.space/poster/medium/tt3954226/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_115",
    "type": "movie",
    "name": "Čekání na duhu / Anwälte küsst man nicht",
    "searchTitle": "Anwälte küsst man nicht",
    "titleDe": "Anwälte küsst man nicht",
    "titleCs": "Čekání na duhu",
    "episode": 124,
    "poster": "https://images.metahub.space/poster/medium/tt3954140/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_116",
    "type": "movie",
    "name": "Zrada a láska / Vertrauen ist gut, verlieben ist besser",
    "searchTitle": "Vertrauen ist gut, verlieben ist besser",
    "titleDe": "Vertrauen ist gut, verlieben ist besser",
    "titleCs": "Zrada a láska",
    "episode": 125,
    "poster": "https://images.metahub.space/poster/medium/tt3901820/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_117",
    "type": "movie",
    "name": "▶ Síla lásky / Ghostwriter",
    "searchTitle": "Ghostwriter",
    "titleDe": "Ghostwriter",
    "titleCs": "Síla lásky",
    "episode": 126,
    "poster": "https://images.metahub.space/poster/medium/tt5921002/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_118",
    "type": "movie",
    "name": "Kandidáti na lásku / Wahlversprechen und andere Lügen",
    "searchTitle": "Wahlversprechen und andere Lügen",
    "titleDe": "Wahlversprechen und andere Lügen",
    "titleCs": "Kandidáti na lásku",
    "episode": 127,
    "poster": "https://images.metahub.space/poster/medium/tt6058140/img",
    "description": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_119",
    "type": "movie",
    "name": "Valentýnský polibek / Ein einziger Kuss",
    "searchTitle": "Ein einziger Kuss",
    "titleDe": "Ein einziger Kuss",
    "titleCs": "Valentýnský polibek",
    "episode": 128,
    "poster": "https://images.metahub.space/poster/medium/tt18155194/img",
    "description": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_120",
    "type": "movie",
    "name": "⚡ Vůně vanilky / Rundum glücklich",
    "searchTitle": "Rundum glücklich",
    "titleDe": "Rundum glücklich",
    "titleCs": "Vůně vanilky",
    "episode": 129,
    "poster": "https://www.zdf.de/assets/rundum-gluecklich-100~1920x1080?cb=1738935862085",
    "description": "[OFFICIAL] Die junge Bäckerin Betty Hunter sucht den Mann ihrer Träume."
  },
  {
    "id": "rp_121",
    "type": "movie",
    "name": "▶ Nečekaná láska / Vollkommen unerwartet",
    "searchTitle": "Vollkommen unerwartet",
    "titleDe": "Vollkommen unerwartet",
    "titleCs": "Nečekaná láska",
    "episode": 130,
    "poster": "https://images.metahub.space/poster/medium/tt5376696/img",
    "description": "[YOUTUBE] Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_122",
    "type": "movie",
    "name": "⚡ Láska, zloděj a diamanty / Liebe, Diebe, Diamanten",
    "searchTitle": "Liebe, Diebe, Diamanten",
    "titleDe": "Liebe, Diebe, Diamanten",
    "titleCs": "Láska, zloděj a diamanty",
    "episode": 131,
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-liebe-diebe-diamanten-102~1920x1080?cb=1793024107343",
    "description": "[OFFICIAL] Richard Johnson kehrt zur Hochzeit der Tochter zurück nach Cornwall."
  },
  {
    "id": "rp_123",
    "type": "movie",
    "name": "Argentinské tango / Argentinischer Tango",
    "searchTitle": "Argentinischer Tango",
    "titleDe": "Argentinischer Tango",
    "titleCs": "Argentinské tango",
    "episode": 132,
    "poster": "https://images.metahub.space/poster/medium/tt4837404/img",
    "description": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_124",
    "type": "movie",
    "name": "⚡▶ Láska s výhodami / Lizenz zum Seitensprung",
    "searchTitle": "Lizenz zum Seitensprung",
    "titleDe": "Lizenz zum Seitensprung",
    "titleCs": "Láska s výhodami",
    "episode": 133,
    "poster": "https://images.metahub.space/poster/medium/tt5295330/img",
    "description": "[BOTH] Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_125",
    "type": "movie",
    "name": "Anděl strážný / Schutzengel",
    "searchTitle": "Schutzengel",
    "titleDe": "Schutzengel",
    "titleCs": "Anděl strážný",
    "episode": 134,
    "poster": "https://images.metahub.space/poster/medium/tt5580156/img",
    "description": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_126",
    "type": "movie",
    "name": "⚡ Muž s velkým srdcem / Ein Doktor & drei Frauen",
    "searchTitle": "Ein Doktor & drei Frauen",
    "titleDe": "Ein Doktor & drei Frauen",
    "titleCs": "Muž s velkým srdcem",
    "episode": 135,
    "poster": "https://www.zdf.de/assets/doktor-und-drei-frauen-100~1920x1080?cb=1766147846819",
    "description": "[OFFICIAL] Dem idyllischen Örtchen St. Mark droht kurz vor der bevorstehenden 500-Jahr-Feier der schleichende Tod. Jetzt verabschiedet sich auch noch der einzige Arzt in den Ruhestand."
  },
  {
    "id": "rp_127",
    "type": "movie",
    "name": "⚡ Znovunalezená láska / Ex & Liebe",
    "searchTitle": "Ex & Liebe",
    "titleDe": "Ex & Liebe",
    "titleCs": "Znovunalezená láska",
    "episode": 136,
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-ex-und-liebe-102~1920x1080?cb=1680097215435",
    "description": "[OFFICIAL] Auf dem Weg zu seiner Mutter hat Bruno mit seinem Oldtimer eine Panne, die sein Leben verändern wird. Sophie, die einstige Liebe seines Lebens, steht plötzlich vor ihm."
  },
  {
    "id": "rp_128",
    "type": "movie",
    "name": "⚡ Láska mezi jahodami / Erdbeeren im Frühling",
    "searchTitle": "Erdbeeren im Frühling",
    "titleDe": "Erdbeeren im Frühling",
    "titleCs": "Láska mezi jahodami",
    "episode": 137,
    "poster": "https://www.zdf.de/assets/erdbeeren-im-fruehling-106~1920x1080?cb=1696515866401",
    "description": "[OFFICIAL] Als die junge Journalistin und Millionenerbin Lilly zur Beerdigung ihres Vaters nach Cornwall zurückkehrt, bricht ihre bisherige Lebensplanung wie ein Kartenhaus zusammen."
  },
  {
    "id": "rp_129",
    "type": "movie",
    "name": "Dotek kouzla / Haustausch mit Hindernissen",
    "searchTitle": "Haustausch mit Hindernissen",
    "titleDe": "Haustausch mit Hindernissen",
    "titleCs": "Dotek kouzla",
    "episode": 138,
    "poster": "https://images.metahub.space/poster/medium/tt6426868/img",
    "description": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_130",
    "type": "movie",
    "name": "Jako z daleké hvězdy / Wie von einem anderen Stern",
    "searchTitle": "Wie von einem anderen Stern",
    "titleDe": "Wie von einem anderen Stern",
    "titleCs": "Jako z daleké hvězdy",
    "episode": 139,
    "poster": "https://images.metahub.space/poster/medium/tt5940862/img",
    "description": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_131",
    "type": "movie",
    "name": "⚡ Navždy svoji / Fast noch verheiratet",
    "searchTitle": "Fast noch verheiratet",
    "titleDe": "Fast noch verheiratet",
    "titleCs": "Navždy svoji",
    "episode": 140,
    "poster": "https://www.zdf.de/assets/fast-verheiratet-100~1920x1080?cb=1575469007851",
    "description": "[OFFICIAL] Siennas Traummann macht ihr einen Heiratsantrag – doch sie zögert."
  },
  {
    "id": "rp_132",
    "type": "movie",
    "name": "Tenkrát po maturitě / Nie wieder Klassentreffen",
    "searchTitle": "Nie wieder Klassentreffen",
    "titleDe": "Nie wieder Klassentreffen",
    "titleCs": "Tenkrát po maturitě",
    "episode": 141,
    "poster": "https://images.metahub.space/poster/medium/tt7294684/img",
    "description": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_133",
    "type": "movie",
    "name": "Duch z Cassley / Das Gespenst von Cassley",
    "searchTitle": "Das Gespenst von Cassley",
    "titleDe": "Das Gespenst von Cassley",
    "titleCs": "Duch z Cassley",
    "episode": 142,
    "poster": "https://images.metahub.space/poster/medium/tt7565710/img",
    "description": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_134",
    "type": "movie",
    "name": "Talisman lásky / Wenn Fische lächeln",
    "searchTitle": "Wenn Fische lächeln",
    "titleDe": "Wenn Fische lächeln",
    "titleCs": "Talisman lásky",
    "episode": 143,
    "poster": "https://images.metahub.space/poster/medium/tt7652188/img",
    "description": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_135",
    "type": "movie",
    "name": "Vůně orchidejí / Geerbtes Glück",
    "searchTitle": "Geerbtes Glück",
    "titleDe": "Geerbtes Glück",
    "titleCs": "Vůně orchidejí",
    "episode": 144,
    "poster": "https://images.metahub.space/poster/medium/tt7858832/img",
    "description": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_136",
    "type": "movie",
    "name": "Otcovo dědictví / Das Vermächtnis unseres Vaters",
    "searchTitle": "Das Vermächtnis unseres Vaters",
    "titleDe": "Das Vermächtnis unseres Vaters",
    "titleCs": "Otcovo dědictví",
    "episode": 145,
    "poster": "https://images.metahub.space/poster/medium/tt8103280/img",
    "description": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_137",
    "type": "movie",
    "name": "Hledá se chůva / Nanny verzweifelt gesucht",
    "searchTitle": "Nanny verzweifelt gesucht",
    "titleDe": "Nanny verzweifelt gesucht",
    "titleCs": "Hledá se chůva",
    "episode": 146,
    "poster": "https://images.metahub.space/poster/medium/tt7771608/img",
    "description": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_138",
    "type": "movie",
    "name": "Kam tvé srdce patří / Wo Dein Herz wohnt",
    "searchTitle": "Wo Dein Herz wohnt",
    "titleDe": "Wo Dein Herz wohnt",
    "titleCs": "Kam tvé srdce patří",
    "episode": 147,
    "poster": "https://images.metahub.space/poster/medium/tt9089702/img",
    "description": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_139",
    "type": "movie",
    "name": "⚡ Tajemství květinového ostrova / Das Geheimnis der Blumeninsel",
    "searchTitle": "Das Geheimnis der Blumeninsel",
    "titleDe": "Das Geheimnis der Blumeninsel",
    "titleCs": "Tajemství květinového ostrova",
    "episode": 148,
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-das-geheimnis-der-blumeninsel-102~1920x1080?cb=1544345904588",
    "description": "[OFFICIAL] Amy Harding hat einen großen Traum. Sie will die verwahrloste Blumenfarm ihrer Großeltern auf den Scilly Islands wieder zum Blühen bringen."
  },
  {
    "id": "rp_140",
    "type": "movie",
    "name": "Bouřlivá rána, šťastné konce / Morgens stürmisch, abends Liebe",
    "searchTitle": "Morgens stürmisch, abends Liebe",
    "titleDe": "Morgens stürmisch, abends Liebe",
    "titleCs": "Bouřlivá rána, šťastné konce",
    "episode": 149,
    "poster": "https://images.metahub.space/poster/medium/tt9401344/img",
    "description": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_141",
    "type": "movie",
    "name": "Nevěsta mého bratra / Die Braut meines Bruders",
    "searchTitle": "Die Braut meines Bruders",
    "titleDe": "Die Braut meines Bruders",
    "titleCs": "Nevěsta mého bratra",
    "episode": 150,
    "poster": "https://images.metahub.space/poster/medium/tt9740242/img",
    "description": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_142",
    "type": "movie",
    "name": "⚡ Program na lásku / Schwiegertöchter",
    "searchTitle": "Schwiegertöchter",
    "titleDe": "Schwiegertöchter",
    "titleCs": "Program na lásku",
    "episode": 151,
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-schwiegertoechter-102~1920x1080?cb=1749544149996",
    "description": "[OFFICIAL] Lynette will den letzten Wunsch ihres verstorbenen Mannes erfüllen und eine Stiftung in seinem Namen gründen. Dafür muss sie aber die Leitung ihrer eigenen Firma abgeben."
  },
  {
    "id": "rp_143",
    "type": "movie",
    "name": "⚡ Pralinky k snídani / Pralinen zum Frühstück",
    "searchTitle": "Pralinen zum Frühstück",
    "titleDe": "Pralinen zum Frühstück",
    "titleCs": "Pralinky k snídani",
    "episode": 152,
    "poster": "https://www.zdf.de/assets/pralinen-zum-fruehstueck-102~1920x1080?cb=1781704277805",
    "description": "[OFFICIAL] Annabelle hat ihr Hobby zum Beruf gemacht: Auf Flughäfen ersteigert sie gestrandete und besitzlose Koffer, um sie dann in ihrer Fernsehsendung öffnen zu lassen."
  },
  {
    "id": "rp_144",
    "type": "movie",
    "name": "Raus in den Sturm",
    "searchTitle": "Raus in den Sturm",
    "titleDe": "Raus in den Sturm",
    "titleCs": null,
    "episode": 153,
    "poster": "https://images.metahub.space/poster/medium/tt10974400/img",
    "description": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_145",
    "type": "movie",
    "name": "⚡ Magický autobus / Der magische Bus",
    "searchTitle": "Der magische Bus",
    "titleDe": "Der magische Bus",
    "titleCs": "Magický autobus",
    "episode": 154,
    "poster": "https://www.zdf.de/assets/magisch-bus-100~1920x1080?cb=1572876710440",
    "description": "[OFFICIAL] Olivia macht sich trotz aller Warnungen ihrer Freunde und Kollegen in einem Vintage-Bus selbstständig. Doch schon bei der ersten Reise kommt der erste Rückschlag."
  },
  {
    "id": "rp_146",
    "type": "movie",
    "name": "Má sestřenice, láska a já / Meine Cousine, die Liebe und ich",
    "searchTitle": "Meine Cousine, die Liebe und ich",
    "titleDe": "Meine Cousine, die Liebe und ich",
    "titleCs": "Má sestřenice, láska a já",
    "episode": 155,
    "poster": "https://images.metahub.space/poster/medium/tt11097478/img",
    "description": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_147",
    "type": "movie",
    "name": "Láska s chutí čaje / Von Tee und Liebe",
    "searchTitle": "Von Tee und Liebe",
    "titleDe": "Von Tee und Liebe",
    "titleCs": "Láska s chutí čaje",
    "episode": 156,
    "poster": "https://images.metahub.space/poster/medium/tt11494832/img",
    "description": "Rosamunde Pilcher Liebesfilm (2020). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_148",
    "type": "movie",
    "name": "⚡ Falešný život, pravá láska / Falsches Leben, wahre Liebe",
    "searchTitle": "Falsches Leben, wahre Liebe",
    "titleDe": "Falsches Leben, wahre Liebe",
    "titleCs": "Falešný život, pravá láska",
    "episode": 157,
    "poster": "https://www.zdf.de/assets/falschesleben-102~1920x1080?cb=1696515723171",
    "description": "[OFFICIAL] Bill Pexton, ein junger Marineleutnant, freundet sich bei den Vorbereitungen auf die Aufnahmeprüfung bei den Kampftauchern mit seinem Kameraden Mo Miller an."
  },
  {
    "id": "rp_149",
    "type": "movie",
    "name": "Stadt, Land, Kuss",
    "searchTitle": "Stadt, Land, Kuss",
    "titleDe": "Stadt, Land, Kuss",
    "titleCs": null,
    "episode": 158,
    "poster": "https://images.metahub.space/poster/medium/tt13625812/img",
    "description": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_150",
    "type": "movie",
    "name": "⚡ Svůdná věštba / Wie verhext",
    "searchTitle": "Wie verhext",
    "titleDe": "Wie verhext",
    "titleCs": "Svůdná věštba",
    "episode": 159,
    "poster": "https://www.zdf.de/assets/wie-verhext-102~1920x1080?cb=1751274370663",
    "description": "[OFFICIAL] Im Kino ihres Vaters hat Grace Kent bereits als Sechsjährige jeden Film gesehen, der dort vorgeführt wurde. Kein Wunder, dass sie schon als junge Frau Kostümbildnerin werden will."
  },
  {
    "id": "rp_151",
    "type": "movie",
    "name": "⚡ Vášnivá srdce / Herzensläufe",
    "searchTitle": "Herzensläufe",
    "titleDe": "Herzensläufe",
    "titleCs": "Vášnivá srdce",
    "episode": 160,
    "poster": "https://www.zdf.de/assets/herzenslaeufe-100~1920x1080?cb=1790922946174",
    "description": "[OFFICIAL] Für Jacky Davies ist das Gin-Brennen in der traditionellen Familiendestillerie mehr als nur ein Handwerk: Es ist die Passion der jungen Frau und eine Besessenheit."
  },
  {
    "id": "rp_152",
    "type": "movie",
    "name": "Vyšívané sny / Der Stoff, aus dem Träume sind",
    "searchTitle": "Der Stoff, aus dem Träume sind",
    "titleDe": "Der Stoff, aus dem Träume sind",
    "titleCs": "Vyšívané sny",
    "episode": 161,
    "poster": "https://images.metahub.space/poster/medium/tt15478660/img",
    "description": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_153",
    "type": "movie",
    "name": "⚡ V sedmém nebi / Im Siebten Himmel",
    "searchTitle": "Im Siebten Himmel",
    "titleDe": "Im Siebten Himmel",
    "titleCs": "V sedmém nebi",
    "episode": 162,
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-im-siebten-himmel-102~1920x1080?cb=1638535290427",
    "description": "[OFFICIAL] Rebecca \"Becky\" Taylor ist frisch ordinierte Jung-Vikarin der Anglikanischen Gemeinschaft. Vor ihrem offiziellen Dienstantritt besucht sie die ihr zugeteilte Gemeinde in Cornwall."
  },
  {
    "id": "rp_154",
    "type": "movie",
    "name": "⚡ Láska mezi květinami / Vier Luftballons und ein Todesfall",
    "searchTitle": "Vier Luftballons und ein Todesfall",
    "titleDe": "Vier Luftballons und ein Todesfall",
    "titleCs": "Láska mezi květinami",
    "episode": 163,
    "poster": "https://www.zdf.de/assets/vier-luftballons-und-ein-todesfall-100~1920x1080?cb=1790581314387",
    "description": "[OFFICIAL] Floristin Gwen ist Angestellte in einem Blumengroßhandel und wird von ihrem sympathischen Chef Joey umgarnt. Was der jungen Frau nicht unangenehm ist - ganz im Gegenteil."
  },
  {
    "id": "rp_155",
    "type": "movie",
    "name": "Láska na pevnině / Die Elster und der Kapitän",
    "searchTitle": "Die Elster und der Kapitän",
    "titleDe": "Die Elster und der Kapitän",
    "titleCs": "Láska na pevnině",
    "episode": 164,
    "poster": "https://images.metahub.space/poster/medium/tt18377966/img",
    "description": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_156",
    "type": "movie",
    "name": "Algoritmus lásky / Liebe ist unberechenbar",
    "searchTitle": "Liebe ist unberechenbar",
    "titleDe": "Liebe ist unberechenbar",
    "titleCs": "Algoritmus lásky",
    "episode": 165,
    "poster": "https://images.metahub.space/poster/medium/tt20124474/img",
    "description": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_157",
    "type": "movie",
    "name": "⚡ Láska a jiné poklady / Liebe und andere Schätze",
    "searchTitle": "Liebe und andere Schätze",
    "titleDe": "Liebe und andere Schätze",
    "titleCs": "Láska a jiné poklady",
    "episode": 166,
    "poster": "https://www.zdf.de/assets/liebe-und-andere-schaetze-100~1920x1080?cb=1779100936024",
    "description": "[OFFICIAL] Kuratorin Mia Barlow ist praktisch in einem Museum groß geworden, seit Direktor Trevor Murphy und seine Frau, die Restauratorin Hannah, sie als Pflegekind bei sich aufgenommen haben."
  },
  {
    "id": "rp_158",
    "type": "movie",
    "name": "Hochzeitstag",
    "searchTitle": "Hochzeitstag",
    "titleDe": "Hochzeitstag",
    "titleCs": null,
    "episode": 167,
    "poster": "https://images.metahub.space/poster/medium/tt22038482/img",
    "description": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_159",
    "type": "movie",
    "name": "Liebe ist die beste Therapie",
    "searchTitle": "Liebe ist die beste Therapie",
    "titleDe": "Liebe ist die beste Therapie",
    "titleCs": null,
    "episode": 168,
    "poster": "https://images.metahub.space/poster/medium/tt26767892/img",
    "description": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_160",
    "type": "movie",
    "name": "Wenn ich dich wiederfinde",
    "searchTitle": "Wenn ich dich wiederfinde",
    "titleDe": "Wenn ich dich wiederfinde",
    "titleCs": null,
    "episode": 169,
    "poster": "https://images.metahub.space/poster/medium/tt27349270/img",
    "description": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_161",
    "type": "movie",
    "name": "Schlagzeile Liebe",
    "searchTitle": "Schlagzeile Liebe",
    "titleDe": "Schlagzeile Liebe",
    "titleCs": null,
    "episode": 170,
    "poster": "https://images.metahub.space/poster/medium/tt28565529/img",
    "description": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_162",
    "type": "movie",
    "name": "Amys Wunschkind",
    "searchTitle": "Amys Wunschkind",
    "titleDe": "Amys Wunschkind",
    "titleCs": null,
    "episode": 171,
    "poster": "https://images.metahub.space/poster/medium/tt29716178/img",
    "description": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_163",
    "type": "movie",
    "name": "Frühstück bei Tessa",
    "searchTitle": "Frühstück bei Tessa",
    "titleDe": "Frühstück bei Tessa",
    "titleCs": null,
    "episode": 172,
    "poster": "https://images.metahub.space/poster/medium/tt30783580/img",
    "description": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_164",
    "type": "movie",
    "name": "Verliebt in einen Butler",
    "searchTitle": "Verliebt in einen Butler",
    "titleDe": "Verliebt in einen Butler",
    "titleCs": null,
    "episode": 173,
    "poster": "https://images.metahub.space/poster/medium/tt33086345/img",
    "description": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_165",
    "type": "movie",
    "name": "Jahrestag",
    "searchTitle": "Jahrestag",
    "titleDe": "Jahrestag",
    "titleCs": null,
    "episode": 174,
    "poster": "https://images.metahub.space/poster/medium/tt34824149/img",
    "description": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_166",
    "type": "movie",
    "name": "Wer immer du bist",
    "searchTitle": "Wer immer du bist",
    "titleDe": "Wer immer du bist",
    "titleCs": null,
    "episode": 175,
    "poster": "https://images.metahub.space/poster/medium/tt38098292/img",
    "description": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_167",
    "type": "movie",
    "name": "⚡ Einspruch für die Liebe",
    "searchTitle": "Einspruch für die Liebe",
    "titleDe": "Einspruch für die Liebe",
    "titleCs": null,
    "episode": 176,
    "poster": "https://epg-image.zdf.de/fotobase-webdelivery/images/14639eee-55be-4062-8284-904f5faf3e73?layout=768x432",
    "description": "[OFFICIAL] Unter dem Motto \"Harte Arbeit zahlt sich aus\" hat sich Anwalt Bill Reynolds eine renommierte Kanzlei aufgebaut und den Ruf erarbeitet, fast alle Verfahren vor Gericht zu gewinnen."
  },
  {
    "id": "rp_168",
    "type": "movie",
    "name": "⚡ Wo Liebe aufhört und wo sie beginnt",
    "searchTitle": "Wo Liebe aufhört und wo sie beginnt",
    "titleDe": "Wo Liebe aufhört und wo sie beginnt",
    "titleCs": null,
    "episode": 177,
    "poster": "https://www.zdf.de/assets/hero-pilcher-wo-die-liebe-aufhoert-100~1920x1080?cb=1776694369640",
    "description": "[OFFICIAL] Kate liebt die Arbeit in ihrem kleinen Café, das sie mit ihrer Freundin Polly betreibt. Ihr großer Traum: Ein eigenes Literaturcafé. Doch aus Liebe zu ihrem Mann stellt sie diesen zurück."
  },
  {
    "id": "rp_169",
    "type": "movie",
    "name": "⚡ Die Glücksbringerin",
    "searchTitle": "Die Glücksbringerin",
    "titleDe": "Die Glücksbringerin",
    "titleCs": null,
    "episode": 178,
    "poster": "https://epg-image.zdf.de/fotobase-webdelivery/images/45cdebaf-8fbe-498c-aafd-57730994f4d4?layout=768x432",
    "description": "[OFFICIAL] Schornsteinfegerin Clare Ridley gilt als Glücksbringerin in ihrem Ort. Doch plötzlich wird sie des Diebstahls verdächtigt, selbst von ihrer Jugendliebe Josh Harding."
  }
];

const SERIES_MAP = {
  "rp_series_complete:1:1": {
    "name": "Stürmische Begegnung",
    "titleCs": "Bouřlivé setkání",
    "episode": 1,
    "imdb_id": "tt0108240"
  },
  "tt0907694:1:1": {
    "name": "Stürmische Begegnung",
    "titleCs": "Bouřlivé setkání",
    "episode": 1,
    "imdb_id": "tt0108240"
  },
  "rp_series_complete:1:2": {
    "name": "Wilder Thymian",
    "titleCs": "Divoký tymián",
    "episode": 2,
    "imdb_id": "tt0111721"
  },
  "tt0907694:1:2": {
    "name": "Wilder Thymian",
    "titleCs": "Divoký tymián",
    "episode": 2,
    "imdb_id": "tt0111721"
  },
  "rp_series_complete:1:3": {
    "name": "Karussell des Lebens",
    "titleCs": "Kolotoč života",
    "episode": 3,
    "imdb_id": "tt0110245"
  },
  "tt0907694:1:3": {
    "name": "Karussell des Lebens",
    "titleCs": "Kolotoč života",
    "episode": 3,
    "imdb_id": "tt0110245"
  },
  "rp_series_complete:1:4": {
    "name": "Wechselspiel der Liebe",
    "titleCs": "Milostná rošáda",
    "episode": 4,
    "imdb_id": "tt0114903"
  },
  "tt0907694:1:4": {
    "name": "Wechselspiel der Liebe",
    "titleCs": "Milostná rošáda",
    "episode": 4,
    "imdb_id": "tt0114903"
  },
  "rp_series_complete:1:5": {
    "name": "Das Ende eines Sommers",
    "titleCs": "Konec jednoho léta",
    "episode": 5,
    "imdb_id": "tt0123821"
  },
  "tt0907694:1:5": {
    "name": "Das Ende eines Sommers",
    "titleCs": "Konec jednoho léta",
    "episode": 5,
    "imdb_id": "tt0123821"
  },
  "rp_series_complete:1:6": {
    "name": "Sommer am Meer",
    "titleCs": "Léto u moře",
    "episode": 6,
    "imdb_id": "tt0114498"
  },
  "tt0907694:1:6": {
    "name": "Sommer am Meer",
    "titleCs": "Léto u moře",
    "episode": 6,
    "imdb_id": "tt0114498"
  },
  "rp_series_complete:1:7": {
    "name": "Schlafender Tiger",
    "titleCs": "Spící tygr",
    "episode": 7,
    "imdb_id": "tt0114353"
  },
  "tt0907694:1:7": {
    "name": "Schlafender Tiger",
    "titleCs": "Spící tygr",
    "episode": 7,
    "imdb_id": "tt0114353"
  },
  "rp_series_complete:1:8": {
    "name": "Wolken am Horizont",
    "titleCs": "Mraky na obzoru",
    "episode": 8,
    "imdb_id": "tt0126124"
  },
  "tt0907694:1:8": {
    "name": "Wolken am Horizont",
    "titleCs": "Mraky na obzoru",
    "episode": 8,
    "imdb_id": "tt0126124"
  },
  "rp_series_complete:1:9": {
    "name": "Schneesturm im Frühling",
    "titleCs": "Jarní vánice",
    "episode": 9,
    "imdb_id": "tt0117564"
  },
  "tt0907694:1:9": {
    "name": "Schneesturm im Frühling",
    "titleCs": "Jarní vánice",
    "episode": 9,
    "imdb_id": "tt0117564"
  },
  "rp_series_complete:1:10": {
    "name": "Lichterspiele",
    "titleCs": "Hra světel",
    "episode": 10,
    "imdb_id": "tt0116870"
  },
  "tt0907694:1:10": {
    "name": "Lichterspiele",
    "titleCs": "Hra světel",
    "episode": 10,
    "imdb_id": "tt0116870"
  },
  "rp_series_complete:1:11": {
    "name": "September: Teil 1",
    "titleCs": "Září: Část 1",
    "episode": 11,
    "imdb_id": "tt15729598"
  },
  "tt0907694:1:11": {
    "name": "September: Teil 1",
    "titleCs": "Září: Část 1",
    "episode": 11,
    "imdb_id": "tt15729598"
  },
  "rp_series_complete:1:12": {
    "name": "September: Teil 2",
    "titleCs": "Září: Část 2",
    "episode": 12,
    "imdb_id": "tt15741176"
  },
  "tt0907694:1:12": {
    "name": "September: Teil 2",
    "titleCs": "Září: Část 2",
    "episode": 12,
    "imdb_id": "tt15741176"
  },
  "rp_series_complete:1:13": {
    "name": "Das Haus an der Küste",
    "titleCs": "Dům na pobřeží",
    "episode": 13,
    "imdb_id": "tt0116498"
  },
  "tt0907694:1:13": {
    "name": "Das Haus an der Küste",
    "titleCs": "Dům na pobřeží",
    "episode": 13,
    "imdb_id": "tt0116498"
  },
  "rp_series_complete:1:14": {
    "name": "Eine besondere Liebe",
    "titleCs": "Zvláštní láska",
    "episode": 14,
    "imdb_id": "tt0115659"
  },
  "tt0907694:1:14": {
    "name": "Eine besondere Liebe",
    "titleCs": "Zvláštní láska",
    "episode": 14,
    "imdb_id": "tt0115659"
  },
  "rp_series_complete:1:15": {
    "name": "Wind der Hoffnung",
    "titleCs": "Vítr naděje",
    "episode": 15,
    "imdb_id": "tt0120517"
  },
  "tt0907694:1:15": {
    "name": "Wind der Hoffnung",
    "titleCs": "Vítr naděje",
    "episode": 15,
    "imdb_id": "tt0120517"
  },
  "rp_series_complete:1:16": {
    "name": "Irrwege des Herzens",
    "titleCs": "Zbloudilá srdce",
    "episode": 16,
    "imdb_id": "tt0119384"
  },
  "tt0907694:1:16": {
    "name": "Irrwege des Herzens",
    "titleCs": "Zbloudilá srdce",
    "episode": 16,
    "imdb_id": "tt0119384"
  },
  "rp_series_complete:1:17": {
    "name": "Stunden der Entscheidung",
    "titleCs": "Hodina rozhodnutí",
    "episode": 17,
    "imdb_id": "tt0120234"
  },
  "tt0907694:1:17": {
    "name": "Stunden der Entscheidung",
    "titleCs": "Hodina rozhodnutí",
    "episode": 17,
    "imdb_id": "tt0120234"
  },
  "rp_series_complete:1:18": {
    "name": "Die zweite Chance",
    "titleCs": "Druhá šance",
    "episode": 18,
    "imdb_id": "tt0128860"
  },
  "tt0907694:1:18": {
    "name": "Die zweite Chance",
    "titleCs": "Druhá šance",
    "episode": 18,
    "imdb_id": "tt0128860"
  },
  "rp_series_complete:1:19": {
    "name": "Zwei Schwestern",
    "titleCs": "Dvě sestry",
    "episode": 19,
    "imdb_id": "tt0135071"
  },
  "tt0907694:1:19": {
    "name": "Zwei Schwestern",
    "titleCs": "Dvě sestry",
    "episode": 19,
    "imdb_id": "tt0135071"
  },
  "rp_series_complete:1:20": {
    "name": "Der Preis der Liebe",
    "titleCs": "Cena lásky",
    "episode": 20,
    "imdb_id": "tt0146041"
  },
  "tt0907694:1:20": {
    "name": "Der Preis der Liebe",
    "titleCs": "Cena lásky",
    "episode": 20,
    "imdb_id": "tt0146041"
  },
  "rp_series_complete:1:21": {
    "name": "Heimkehr: Teil 1",
    "titleCs": "Návrat domů: Část 1",
    "episode": 21,
    "imdb_id": "tt15729564"
  },
  "tt0907694:1:21": {
    "name": "Heimkehr: Teil 1",
    "titleCs": "Návrat domů: Část 1",
    "episode": 21,
    "imdb_id": "tt15729564"
  },
  "rp_series_complete:1:22": {
    "name": "Heimkehr: Teil 2",
    "titleCs": "Návrat domů: Část 2",
    "episode": 22,
    "imdb_id": "tt15729560"
  },
  "tt0907694:1:22": {
    "name": "Heimkehr: Teil 2",
    "titleCs": "Návrat domů: Část 2",
    "episode": 22,
    "imdb_id": "tt15729560"
  },
  "rp_series_complete:1:23": {
    "name": "Rückkehr ins Paradies",
    "titleCs": "Návrat do ráje",
    "episode": 23,
    "imdb_id": "tt0170520"
  },
  "tt0907694:1:23": {
    "name": "Rückkehr ins Paradies",
    "titleCs": "Návrat do ráje",
    "episode": 23,
    "imdb_id": "tt0170520"
  },
  "rp_series_complete:1:24": {
    "name": "Dornen im Tal der Blumen",
    "titleCs": "Trny v údolí květin",
    "episode": 24,
    "imdb_id": "tt0177180"
  },
  "tt0907694:1:24": {
    "name": "Dornen im Tal der Blumen",
    "titleCs": "Trny v údolí květin",
    "episode": 24,
    "imdb_id": "tt0177180"
  },
  "rp_series_complete:1:25": {
    "name": "Melodie der Herzen",
    "titleCs": "Hudba v srdcích",
    "episode": 25,
    "imdb_id": "tt0181794"
  },
  "tt0907694:1:25": {
    "name": "Melodie der Herzen",
    "titleCs": "Hudba v srdcích",
    "episode": 25,
    "imdb_id": "tt0181794"
  },
  "rp_series_complete:1:26": {
    "name": "Magie der Liebe",
    "titleCs": "Kouzlo lásky",
    "episode": 26,
    "imdb_id": "tt0184868"
  },
  "tt0907694:1:26": {
    "name": "Magie der Liebe",
    "titleCs": "Kouzlo lásky",
    "episode": 26,
    "imdb_id": "tt0184868"
  },
  "rp_series_complete:1:27": {
    "name": "Rosen im Sturm",
    "titleCs": "Růže v bouři",
    "episode": 27,
    "imdb_id": "tt0188183"
  },
  "tt0907694:1:27": {
    "name": "Rosen im Sturm",
    "titleCs": "Růže v bouři",
    "episode": 27,
    "imdb_id": "tt0188183"
  },
  "rp_series_complete:1:28": {
    "name": "Das große Erbe: Teil 1",
    "titleCs": "Nancherrow: Část 1",
    "episode": 28,
    "imdb_id": "tt15740730"
  },
  "tt0907694:1:28": {
    "name": "Das große Erbe: Teil 1",
    "titleCs": "Nancherrow: Část 1",
    "episode": 28,
    "imdb_id": "tt15740730"
  },
  "rp_series_complete:1:29": {
    "name": "Das große Erbe: Teil 2",
    "titleCs": "Nancherrow: Část 2",
    "episode": 29,
    "imdb_id": "tt15740738"
  },
  "tt0907694:1:29": {
    "name": "Das große Erbe: Teil 2",
    "titleCs": "Nancherrow: Část 2",
    "episode": 29,
    "imdb_id": "tt15740738"
  },
  "rp_series_complete:1:30": {
    "name": "Klippen der Liebe",
    "titleCs": "Útesy lásky",
    "episode": 30,
    "imdb_id": "tt0217605"
  },
  "tt0907694:1:30": {
    "name": "Klippen der Liebe",
    "titleCs": "Útesy lásky",
    "episode": 30,
    "imdb_id": "tt0217605"
  },
  "rp_series_complete:1:31": {
    "name": "Möwen im Wind",
    "titleCs": "Rackové ve větru",
    "episode": 31,
    "imdb_id": "tt0222330"
  },
  "tt0907694:1:31": {
    "name": "Möwen im Wind",
    "titleCs": "Rackové ve větru",
    "episode": 31,
    "imdb_id": "tt0222330"
  },
  "rp_series_complete:1:32": {
    "name": "Blüte des Lebens",
    "titleCs": "Květ života",
    "episode": 32,
    "imdb_id": "tt0226390"
  },
  "tt0907694:1:32": {
    "name": "Blüte des Lebens",
    "titleCs": "Květ života",
    "episode": 32,
    "imdb_id": "tt0226390"
  },
  "rp_series_complete:1:33": {
    "name": "Der lange Weg zum Glück",
    "titleCs": "Dlouhá cesta ke štěstí",
    "episode": 33,
    "imdb_id": "tt0230712"
  },
  "tt0907694:1:33": {
    "name": "Der lange Weg zum Glück",
    "titleCs": "Dlouhá cesta ke štěstí",
    "episode": 33,
    "imdb_id": "tt0230712"
  },
  "rp_series_complete:1:34": {
    "name": "Zeit der Erkenntnis",
    "titleCs": "Čas poznání",
    "episode": 34,
    "imdb_id": "tt0244176"
  },
  "tt0907694:1:34": {
    "name": "Zeit der Erkenntnis",
    "titleCs": "Čas poznání",
    "episode": 34,
    "imdb_id": "tt0244176"
  },
  "rp_series_complete:1:35": {
    "name": "Zerrissene Herzen",
    "titleCs": "Rozervaná srdce",
    "episode": 35,
    "imdb_id": "tt0262737"
  },
  "tt0907694:1:35": {
    "name": "Zerrissene Herzen",
    "titleCs": "Rozervaná srdce",
    "episode": 35,
    "imdb_id": "tt0262737"
  },
  "rp_series_complete:1:36": {
    "name": "Ruf der Vergangenheit",
    "titleCs": "Volání minulosti",
    "episode": 36,
    "imdb_id": "tt0266913"
  },
  "tt0907694:1:36": {
    "name": "Ruf der Vergangenheit",
    "titleCs": "Volání minulosti",
    "episode": 36,
    "imdb_id": "tt0266913"
  },
  "rp_series_complete:1:37": {
    "name": "Im Licht des Feuers",
    "titleCs": "Ve svitu ohně",
    "episode": 37,
    "imdb_id": "tt0271760"
  },
  "tt0907694:1:37": {
    "name": "Im Licht des Feuers",
    "titleCs": "Ve svitu ohně",
    "episode": 37,
    "imdb_id": "tt0271760"
  },
  "rp_series_complete:1:38": {
    "name": "Die Rose von Kerrymore",
    "titleCs": "Růže z Kerrymoru",
    "episode": 38,
    "imdb_id": "tt0272817"
  },
  "tt0907694:1:38": {
    "name": "Die Rose von Kerrymore",
    "titleCs": "Růže z Kerrymoru",
    "episode": 38,
    "imdb_id": "tt0272817"
  },
  "rp_series_complete:1:39": {
    "name": "Küste der Träume",
    "titleCs": "Pobřeží snů",
    "episode": 39,
    "imdb_id": "tt0275637"
  },
  "tt0907694:1:39": {
    "name": "Küste der Träume",
    "titleCs": "Pobřeží snů",
    "episode": 39,
    "imdb_id": "tt0275637"
  },
  "rp_series_complete:1:40": {
    "name": "Kinder des Glücks",
    "titleCs": "Děti štěstěny",
    "episode": 40,
    "imdb_id": "tt0300428"
  },
  "tt0907694:1:40": {
    "name": "Kinder des Glücks",
    "titleCs": "Děti štěstěny",
    "episode": 40,
    "imdb_id": "tt0300428"
  },
  "rp_series_complete:1:41": {
    "name": "Wind über dem Fluss",
    "titleCs": "Vítr nad řekou",
    "episode": 41,
    "imdb_id": "tt0301782"
  },
  "tt0907694:1:41": {
    "name": "Wind über dem Fluss",
    "titleCs": "Vítr nad řekou",
    "episode": 41,
    "imdb_id": "tt0301782"
  },
  "rp_series_complete:1:42": {
    "name": "Blumen im Regen",
    "titleCs": "Květiny v dešti",
    "episode": 42,
    "imdb_id": "tt0304642"
  },
  "tt0907694:1:42": {
    "name": "Blumen im Regen",
    "titleCs": "Květiny v dešti",
    "episode": 42,
    "imdb_id": "tt0304642"
  },
  "rp_series_complete:1:43": {
    "name": "Wenn nur noch Liebe zählt",
    "titleCs": "To hlavní je láska",
    "episode": 43,
    "imdb_id": "tt0310081"
  },
  "tt0907694:1:43": {
    "name": "Wenn nur noch Liebe zählt",
    "titleCs": "To hlavní je láska",
    "episode": 43,
    "imdb_id": "tt0310081"
  },
  "rp_series_complete:1:44": {
    "name": "Morgen träumen wir gemeinsam",
    "titleCs": "Šťastná náhoda",
    "episode": 44,
    "imdb_id": "tt0316507"
  },
  "tt0907694:1:44": {
    "name": "Morgen träumen wir gemeinsam",
    "titleCs": "Šťastná náhoda",
    "episode": 44,
    "imdb_id": "tt0316507"
  },
  "rp_series_complete:1:45": {
    "name": "Mit den Augen der Liebe",
    "titleCs": "Očima lásky",
    "episode": 45,
    "imdb_id": "tt0337119"
  },
  "tt0907694:1:45": {
    "name": "Mit den Augen der Liebe",
    "titleCs": "Očima lásky",
    "episode": 45,
    "imdb_id": "tt0337119"
  },
  "rp_series_complete:1:46": {
    "name": "Bis ans Ende der Welt",
    "titleCs": "Až na konec světa",
    "episode": 46,
    "imdb_id": "tt0345873"
  },
  "tt0907694:1:46": {
    "name": "Bis ans Ende der Welt",
    "titleCs": "Až na konec světa",
    "episode": 46,
    "imdb_id": "tt0345873"
  },
  "rp_series_complete:1:47": {
    "name": "Sternschnuppen im August",
    "titleCs": "Padající hvězda",
    "episode": 47,
    "imdb_id": "tt0348739"
  },
  "tt0907694:1:47": {
    "name": "Sternschnuppen im August",
    "titleCs": "Padající hvězda",
    "episode": 47,
    "imdb_id": "tt0348739"
  },
  "rp_series_complete:1:48": {
    "name": "Paradies der Träume",
    "titleCs": "Ráj snů",
    "episode": 48,
    "imdb_id": "tt0353957"
  },
  "tt0907694:1:48": {
    "name": "Paradies der Träume",
    "titleCs": "Ráj snů",
    "episode": 48,
    "imdb_id": "tt0353957"
  },
  "rp_series_complete:1:49": {
    "name": "Flamme der Liebe",
    "titleCs": "Plamen lásky",
    "episode": 49,
    "imdb_id": "tt0357109"
  },
  "tt0907694:1:49": {
    "name": "Flamme der Liebe",
    "titleCs": "Plamen lásky",
    "episode": 49,
    "imdb_id": "tt0357109"
  },
  "rp_series_complete:1:50": {
    "name": "Gewissheit des Herzens",
    "titleCs": "Srdce se nemýlí",
    "episode": 50,
    "imdb_id": "tt0386755"
  },
  "tt0907694:1:50": {
    "name": "Gewissheit des Herzens",
    "titleCs": "Srdce se nemýlí",
    "episode": 50,
    "imdb_id": "tt0386755"
  },
  "rp_series_complete:1:51": {
    "name": "Wintersonne (1+2)",
    "titleCs": "Zimní slunovrat",
    "episode": 51,
    "imdb_id": "tt15727968"
  },
  "tt0907694:1:51": {
    "name": "Wintersonne (1+2)",
    "titleCs": "Zimní slunovrat",
    "episode": 51,
    "imdb_id": "tt15727968"
  },
  "rp_series_complete:1:52": {
    "name": "Federn im Wind",
    "titleCs": "Pírka ve větru",
    "episode": 52,
    "imdb_id": "tt0396843"
  },
  "tt0907694:1:52": {
    "name": "Federn im Wind",
    "titleCs": "Pírka ve větru",
    "episode": 52,
    "imdb_id": "tt0396843"
  },
  "rp_series_complete:1:53": {
    "name": "Wege der Liebe",
    "titleCs": "Cesty lásky",
    "episode": 53,
    "imdb_id": "tt0393657"
  },
  "tt0907694:1:53": {
    "name": "Wege der Liebe",
    "titleCs": "Cesty lásky",
    "episode": 53,
    "imdb_id": "tt0393657"
  },
  "rp_series_complete:1:54": {
    "name": "Solange es dich gibt",
    "titleCs": "Dokud jsi tady",
    "episode": 54,
    "imdb_id": "tt0433629"
  },
  "tt0907694:1:54": {
    "name": "Solange es dich gibt",
    "titleCs": "Dokud jsi tady",
    "episode": 54,
    "imdb_id": "tt0433629"
  },
  "rp_series_complete:1:55": {
    "name": "Liebe im Spiel",
    "titleCs": "Láska ve hře",
    "episode": 55,
    "imdb_id": "tt0410534"
  },
  "tt0907694:1:55": {
    "name": "Liebe im Spiel",
    "titleCs": "Láska ve hře",
    "episode": 55,
    "imdb_id": "tt0410534"
  },
  "rp_series_complete:1:56": {
    "name": "Traum eines Sommers",
    "titleCs": "Sen jednoho léta",
    "episode": 56,
    "imdb_id": "tt0450119"
  },
  "tt0907694:1:56": {
    "name": "Traum eines Sommers",
    "titleCs": "Sen jednoho léta",
    "episode": 56,
    "imdb_id": "tt0450119"
  },
  "rp_series_complete:1:57": {
    "name": "Tiefe der Gefühle",
    "titleCs": "Pouto lásky",
    "episode": 57,
    "imdb_id": "tt0432346"
  },
  "tt0907694:1:57": {
    "name": "Tiefe der Gefühle",
    "titleCs": "Pouto lásky",
    "episode": 57,
    "imdb_id": "tt0432346"
  },
  "rp_series_complete:1:58": {
    "name": "Dem Himmel so nah",
    "titleCs": "Tak blízko nebi",
    "episode": 58,
    "imdb_id": "tt0450116"
  },
  "tt0907694:1:58": {
    "name": "Dem Himmel so nah",
    "titleCs": "Tak blízko nebi",
    "episode": 58,
    "imdb_id": "tt0450116"
  },
  "rp_series_complete:1:59": {
    "name": "Vermächtnis der Liebe",
    "titleCs": "Odkaz lásky",
    "episode": 59,
    "imdb_id": "tt0450120"
  },
  "tt0907694:1:59": {
    "name": "Vermächtnis der Liebe",
    "titleCs": "Odkaz lásky",
    "episode": 59,
    "imdb_id": "tt0450120"
  },
  "rp_series_complete:1:60": {
    "name": "Königin der Nacht",
    "titleCs": "Královna noci",
    "episode": 60,
    "imdb_id": "tt0450117"
  },
  "tt0907694:1:60": {
    "name": "Königin der Nacht",
    "titleCs": "Královna noci",
    "episode": 60,
    "imdb_id": "tt0450117"
  },
  "rp_series_complete:1:61": {
    "name": "Segel der Liebe",
    "titleCs": "Plachetnice lásky",
    "episode": 61,
    "imdb_id": "tt0450118"
  },
  "tt0907694:1:61": {
    "name": "Segel der Liebe",
    "titleCs": "Plachetnice lásky",
    "episode": 61,
    "imdb_id": "tt0450118"
  },
  "rp_series_complete:1:62": {
    "name": "Über den Wolken",
    "titleCs": "Nad oblaky",
    "episode": 62,
    "imdb_id": "tt0491128"
  },
  "tt0907694:1:62": {
    "name": "Über den Wolken",
    "titleCs": "Nad oblaky",
    "episode": 62,
    "imdb_id": "tt0491128"
  },
  "rp_series_complete:1:63": {
    "name": "Zauber der Liebe (1+2)",
    "titleCs": "Letní slunovrat",
    "episode": 63,
    "imdb_id": "tt15727726"
  },
  "tt0907694:1:63": {
    "name": "Zauber der Liebe (1+2)",
    "titleCs": "Letní slunovrat",
    "episode": 63,
    "imdb_id": "tt15727726"
  },
  "rp_series_complete:1:64": {
    "name": "Der Himmel über Cornwall",
    "titleCs": "Cornwallská romance",
    "episode": 64,
    "imdb_id": "tt0777270"
  },
  "tt0907694:1:64": {
    "name": "Der Himmel über Cornwall",
    "titleCs": "Cornwallská romance",
    "episode": 64,
    "imdb_id": "tt0777270"
  },
  "rp_series_complete:1:65": {
    "name": "Land der Sehnsucht",
    "titleCs": "Rodný statek",
    "episode": 65,
    "imdb_id": "tt0497438"
  },
  "tt0907694:1:65": {
    "name": "Land der Sehnsucht",
    "titleCs": "Rodný statek",
    "episode": 65,
    "imdb_id": "tt0497438"
  },
  "rp_series_complete:1:66": {
    "name": "Sommer des Erwachens",
    "titleCs": "Kouzelné léto",
    "episode": 66,
    "imdb_id": "tt0499557"
  },
  "tt0907694:1:66": {
    "name": "Sommer des Erwachens",
    "titleCs": "Kouzelné léto",
    "episode": 66,
    "imdb_id": "tt0499557"
  },
  "rp_series_complete:1:67": {
    "name": "Wo die Liebe begann",
    "titleCs": "Kde začala láska",
    "episode": 67,
    "imdb_id": "tt0857260"
  },
  "tt0907694:1:67": {
    "name": "Wo die Liebe begann",
    "titleCs": "Kde začala láska",
    "episode": 67,
    "imdb_id": "tt0857260"
  },
  "rp_series_complete:1:68": {
    "name": "Die Liebe ihres Lebens",
    "titleCs": "Láska jejího života",
    "episode": 68,
    "imdb_id": "tt0872156"
  },
  "tt0907694:1:68": {
    "name": "Die Liebe ihres Lebens",
    "titleCs": "Láska jejího života",
    "episode": 68,
    "imdb_id": "tt0872156"
  },
  "rp_series_complete:1:69": {
    "name": "Und plötzlich war es Liebe",
    "titleCs": "A najednou to byla láska",
    "episode": 69,
    "imdb_id": "tt0903964"
  },
  "tt0907694:1:69": {
    "name": "Und plötzlich war es Liebe",
    "titleCs": "A najednou to byla láska",
    "episode": 69,
    "imdb_id": "tt0903964"
  },
  "rp_series_complete:1:71": {
    "name": "Wiedersehen am Fluss",
    "titleCs": "Vítr nad řekou",
    "episode": 71,
    "imdb_id": "tt0943113"
  },
  "tt0907694:1:71": {
    "name": "Wiedersehen am Fluss",
    "titleCs": "Vítr nad řekou",
    "episode": 71,
    "imdb_id": "tt0943113"
  },
  "rp_series_complete:1:72": {
    "name": "Sommer der Liebe",
    "titleCs": null,
    "episode": 72,
    "imdb_id": "tt0988802"
  },
  "tt0907694:1:72": {
    "name": "Sommer der Liebe",
    "titleCs": null,
    "episode": 72,
    "imdb_id": "tt0988802"
  },
  "rp_series_complete:1:73": {
    "name": "Flügel der Hoffnung",
    "titleCs": "Křídla naděje",
    "episode": 73,
    "imdb_id": "tt0988801"
  },
  "tt0907694:1:73": {
    "name": "Flügel der Hoffnung",
    "titleCs": "Křídla naděje",
    "episode": 73,
    "imdb_id": "tt0988801"
  },
  "rp_series_complete:1:74": {
    "name": "Der Mann meiner Träume",
    "titleCs": "Muž mých snů",
    "episode": 74,
    "imdb_id": "tt1096981"
  },
  "tt0907694:1:74": {
    "name": "Der Mann meiner Träume",
    "titleCs": "Muž mých snů",
    "episode": 74,
    "imdb_id": "tt1096981"
  },
  "rp_series_complete:1:75": {
    "name": "Sieg der Liebe",
    "titleCs": "Vítězství lásky",
    "episode": 75,
    "imdb_id": "tt1106607"
  },
  "tt0907694:1:75": {
    "name": "Sieg der Liebe",
    "titleCs": "Vítězství lásky",
    "episode": 75,
    "imdb_id": "tt1106607"
  },
  "rp_series_complete:1:76": {
    "name": "Nebel über Schloss Kilrush",
    "titleCs": "Mlha nad zámkem Kilrush",
    "episode": 76,
    "imdb_id": "tt1125243"
  },
  "tt0907694:1:76": {
    "name": "Nebel über Schloss Kilrush",
    "titleCs": "Mlha nad zámkem Kilrush",
    "episode": 76,
    "imdb_id": "tt1125243"
  },
  "rp_series_complete:1:77": {
    "name": "Aus Liebe und Leidenschaft",
    "titleCs": "Láska nepomíjí",
    "episode": 77,
    "imdb_id": "tt1140926"
  },
  "tt0907694:1:77": {
    "name": "Aus Liebe und Leidenschaft",
    "titleCs": "Láska nepomíjí",
    "episode": 77,
    "imdb_id": "tt1140926"
  },
  "rp_series_complete:1:78": {
    "name": "Wind über der See",
    "titleCs": "Mraky nad mořem",
    "episode": 78,
    "imdb_id": "tt1150986"
  },
  "tt0907694:1:78": {
    "name": "Wind über der See",
    "titleCs": "Mraky nad mořem",
    "episode": 78,
    "imdb_id": "tt1150986"
  },
  "rp_series_complete:1:79": {
    "name": "Pfeile der Liebe",
    "titleCs": "Šípy lásky",
    "episode": 79,
    "imdb_id": "tt1177749"
  },
  "tt0907694:1:79": {
    "name": "Pfeile der Liebe",
    "titleCs": "Šípy lásky",
    "episode": 79,
    "imdb_id": "tt1177749"
  },
  "rp_series_complete:1:80": {
    "name": "Melodie der Liebe",
    "titleCs": "Melodie lásky",
    "episode": 80,
    "imdb_id": "tt1178398"
  },
  "tt0907694:1:80": {
    "name": "Melodie der Liebe",
    "titleCs": "Melodie lásky",
    "episode": 80,
    "imdb_id": "tt1178398"
  },
  "rp_series_complete:1:81": {
    "name": "Herzen im Wind",
    "titleCs": "Srdce ve větru",
    "episode": 81,
    "imdb_id": "tt1178399"
  },
  "tt0907694:1:81": {
    "name": "Herzen im Wind",
    "titleCs": "Srdce ve větru",
    "episode": 81,
    "imdb_id": "tt1178399"
  },
  "rp_series_complete:1:84": {
    "name": "Gezeiten der Liebe",
    "titleCs": "Příliv lásky",
    "episode": 84,
    "imdb_id": "tt1178400"
  },
  "tt0907694:1:84": {
    "name": "Gezeiten der Liebe",
    "titleCs": "Příliv lásky",
    "episode": 84,
    "imdb_id": "tt1178400"
  },
  "rp_series_complete:1:85": {
    "name": "Herzenssehnsucht",
    "titleCs": "Roztoužená srdce",
    "episode": 85,
    "imdb_id": "tt1178401"
  },
  "tt0907694:1:85": {
    "name": "Herzenssehnsucht",
    "titleCs": "Roztoužená srdce",
    "episode": 85,
    "imdb_id": "tt1178401"
  },
  "rp_series_complete:1:86": {
    "name": "Eine Liebe im Herbst",
    "titleCs": "Podzim lásky",
    "episode": 86,
    "imdb_id": "tt1178402"
  },
  "tt0907694:1:86": {
    "name": "Eine Liebe im Herbst",
    "titleCs": "Podzim lásky",
    "episode": 86,
    "imdb_id": "tt1178402"
  },
  "rp_series_complete:1:87": {
    "name": "Entscheidung des Herzens",
    "titleCs": "Ať rozhodne srdce",
    "episode": 87,
    "imdb_id": "tt1178403"
  },
  "tt0907694:1:87": {
    "name": "Entscheidung des Herzens",
    "titleCs": "Ať rozhodne srdce",
    "episode": 87,
    "imdb_id": "tt1178403"
  },
  "rp_series_complete:1:88": {
    "name": "Liebe gegen den Rest der Welt",
    "titleCs": "Láska navzdory celému světu",
    "episode": 88,
    "imdb_id": null
  },
  "tt0907694:1:88": {
    "name": "Liebe gegen den Rest der Welt",
    "titleCs": "Láska navzdory celému světu",
    "episode": 88,
    "imdb_id": null
  },
  "rp_series_complete:1:89": {
    "name": "Wiedersehen in Rose Abbey",
    "titleCs": "Shledání v Rose Abbey",
    "episode": 89,
    "imdb_id": null
  },
  "tt0907694:1:89": {
    "name": "Wiedersehen in Rose Abbey",
    "titleCs": "Shledání v Rose Abbey",
    "episode": 89,
    "imdb_id": null
  },
  "rp_series_complete:1:90": {
    "name": "Lass es Liebe sein",
    "titleCs": "Dej, ať je to láska",
    "episode": 90,
    "imdb_id": null
  },
  "tt0907694:1:90": {
    "name": "Lass es Liebe sein",
    "titleCs": "Dej, ať je to láska",
    "episode": 90,
    "imdb_id": null
  },
  "rp_series_complete:1:93": {
    "name": "Im Zweifel für die Liebe",
    "titleCs": "Presumpce lásky",
    "episode": 93,
    "imdb_id": "tt1545888"
  },
  "tt0907694:1:93": {
    "name": "Im Zweifel für die Liebe",
    "titleCs": "Presumpce lásky",
    "episode": 93,
    "imdb_id": "tt1545888"
  },
  "rp_series_complete:1:94": {
    "name": "Wohin du auch gehst",
    "titleCs": "Ať půjdeš kamkoli",
    "episode": 94,
    "imdb_id": "tt1545890"
  },
  "tt0907694:1:94": {
    "name": "Wohin du auch gehst",
    "titleCs": "Ať půjdeš kamkoli",
    "episode": 94,
    "imdb_id": "tt1545890"
  },
  "rp_series_complete:1:95": {
    "name": "Liebe am Horizont",
    "titleCs": "Láska na obzoru",
    "episode": 95,
    "imdb_id": "tt1545889"
  },
  "tt0907694:1:95": {
    "name": "Liebe am Horizont",
    "titleCs": "Láska na obzoru",
    "episode": 95,
    "imdb_id": "tt1545889"
  },
  "rp_series_complete:1:96": {
    "name": "Wenn das Herz zerbricht",
    "titleCs": "Když srdce pláče",
    "episode": 96,
    "imdb_id": "tt1670117"
  },
  "tt0907694:1:96": {
    "name": "Wenn das Herz zerbricht",
    "titleCs": "Když srdce pláče",
    "episode": 96,
    "imdb_id": "tt1670117"
  },
  "rp_series_complete:1:97": {
    "name": "Flügel der Liebe",
    "titleCs": "Na křídlech lásky",
    "episode": 97,
    "imdb_id": "tt1702299"
  },
  "tt0907694:1:97": {
    "name": "Flügel der Liebe",
    "titleCs": "Na křídlech lásky",
    "episode": 97,
    "imdb_id": "tt1702299"
  },
  "rp_series_complete:1:98": {
    "name": "Lords lügen nicht",
    "titleCs": "Sňatek z rozumu",
    "episode": 98,
    "imdb_id": "tt1729996"
  },
  "tt0907694:1:98": {
    "name": "Lords lügen nicht",
    "titleCs": "Sňatek z rozumu",
    "episode": 98,
    "imdb_id": "tt1729996"
  },
  "rp_series_complete:1:99": {
    "name": "Herzensfragen",
    "titleCs": "Zeptej se srdce",
    "episode": 99,
    "imdb_id": "tt1794473"
  },
  "tt0907694:1:99": {
    "name": "Herzensfragen",
    "titleCs": "Zeptej se srdce",
    "episode": 99,
    "imdb_id": "tt1794473"
  },
  "rp_series_complete:1:100": {
    "name": "Sonntagskinder",
    "titleCs": "Cesta za štěstím",
    "episode": 100,
    "imdb_id": "tt1804980"
  },
  "tt0907694:1:100": {
    "name": "Sonntagskinder",
    "titleCs": "Cesta za štěstím",
    "episode": 100,
    "imdb_id": "tt1804980"
  },
  "rp_series_complete:1:103": {
    "name": "Verlobt, verliebt, verwirrt",
    "titleCs": "Zmatená láska",
    "episode": 103,
    "imdb_id": null
  },
  "tt0907694:1:103": {
    "name": "Verlobt, verliebt, verwirrt",
    "titleCs": "Zmatená láska",
    "episode": 103,
    "imdb_id": null
  },
  "rp_series_complete:1:104": {
    "name": "Der gestohlene Sommer",
    "titleCs": "Ukradené léto",
    "episode": 104,
    "imdb_id": "tt2050247"
  },
  "tt0907694:1:104": {
    "name": "Der gestohlene Sommer",
    "titleCs": "Ukradené léto",
    "episode": 104,
    "imdb_id": "tt2050247"
  },
  "rp_series_complete:1:105": {
    "name": "Englischer Wein",
    "titleCs": "Ve víně je láska",
    "episode": 105,
    "imdb_id": null
  },
  "tt0907694:1:105": {
    "name": "Englischer Wein",
    "titleCs": "Ve víně je láska",
    "episode": 105,
    "imdb_id": null
  },
  "rp_series_complete:1:106": {
    "name": "Gefährliche Brandung",
    "titleCs": "Nebezpečný příboj",
    "episode": 106,
    "imdb_id": "tt2122084"
  },
  "tt0907694:1:106": {
    "name": "Gefährliche Brandung",
    "titleCs": "Nebezpečný příboj",
    "episode": 106,
    "imdb_id": "tt2122084"
  },
  "rp_series_complete:1:109": {
    "name": "Ungezügelt ins Glück",
    "titleCs": "Dokonalé štěstí",
    "episode": 109,
    "imdb_id": null
  },
  "tt0907694:1:109": {
    "name": "Ungezügelt ins Glück",
    "titleCs": "Dokonalé štěstí",
    "episode": 109,
    "imdb_id": null
  },
  "rp_series_complete:1:110": {
    "name": "Das Geheimnis der weißen Taube",
    "titleCs": "Tajemství starého panství",
    "episode": 110,
    "imdb_id": null
  },
  "tt0907694:1:110": {
    "name": "Das Geheimnis der weißen Taube",
    "titleCs": "Tajemství starého panství",
    "episode": 110,
    "imdb_id": null
  },
  "rp_series_complete:1:111": {
    "name": "Die falsche Nonne",
    "titleCs": "Falešná jeptiška",
    "episode": 111,
    "imdb_id": null
  },
  "tt0907694:1:111": {
    "name": "Die falsche Nonne",
    "titleCs": "Falešná jeptiška",
    "episode": 111,
    "imdb_id": null
  },
  "rp_series_complete:1:112": {
    "name": "In der Mitte eines Lebens",
    "titleCs": "Nový začátek",
    "episode": 112,
    "imdb_id": null
  },
  "tt0907694:1:112": {
    "name": "In der Mitte eines Lebens",
    "titleCs": "Nový začátek",
    "episode": 112,
    "imdb_id": null
  },
  "rp_series_complete:1:113": {
    "name": "Die andere Frau, Teil 1",
    "titleCs": "Dvojí život: Část 1",
    "episode": 113,
    "imdb_id": "tt3959970"
  },
  "tt0907694:1:113": {
    "name": "Die andere Frau, Teil 1",
    "titleCs": "Dvojí život: Část 1",
    "episode": 113,
    "imdb_id": "tt3959970"
  },
  "rp_series_complete:1:114": {
    "name": "Die andere Frau, Teil 2",
    "titleCs": "Dvojí život: Část 2",
    "episode": 114,
    "imdb_id": "tt2169404"
  },
  "tt0907694:1:114": {
    "name": "Die andere Frau, Teil 2",
    "titleCs": "Dvojí život: Část 2",
    "episode": 114,
    "imdb_id": "tt2169404"
  },
  "rp_series_complete:1:115": {
    "name": "Eine Frage der Ehre",
    "titleCs": "Otázka cti",
    "episode": 115,
    "imdb_id": "tt2592426"
  },
  "tt0907694:1:115": {
    "name": "Eine Frage der Ehre",
    "titleCs": "Otázka cti",
    "episode": 115,
    "imdb_id": "tt2592426"
  },
  "rp_series_complete:1:116": {
    "name": "Die Frau auf der Klippe",
    "titleCs": "Láska nad propastí",
    "episode": 116,
    "imdb_id": null
  },
  "tt0907694:1:116": {
    "name": "Die Frau auf der Klippe",
    "titleCs": "Láska nad propastí",
    "episode": 116,
    "imdb_id": null
  },
  "rp_series_complete:1:117": {
    "name": "Schlangen im Paradies",
    "titleCs": "Zahrada rajských pokušení",
    "episode": 117,
    "imdb_id": "tt2831116"
  },
  "tt0907694:1:117": {
    "name": "Schlangen im Paradies",
    "titleCs": "Zahrada rajských pokušení",
    "episode": 117,
    "imdb_id": "tt2831116"
  },
  "rp_series_complete:1:118": {
    "name": "Die versprochene Braut",
    "titleCs": "Zaslíbená nevěsta",
    "episode": 118,
    "imdb_id": "tt3128154"
  },
  "tt0907694:1:118": {
    "name": "Die versprochene Braut",
    "titleCs": "Zaslíbená nevěsta",
    "episode": 118,
    "imdb_id": "tt3128154"
  },
  "rp_series_complete:1:119": {
    "name": "Alte Herzen rosten nicht",
    "titleCs": "Stará láska nerezaví",
    "episode": 119,
    "imdb_id": "tt3293750"
  },
  "tt0907694:1:119": {
    "name": "Alte Herzen rosten nicht",
    "titleCs": "Stará láska nerezaví",
    "episode": 119,
    "imdb_id": "tt3293750"
  },
  "rp_series_complete:1:120": {
    "name": "Zu hoch geflogen",
    "titleCs": "Láska z nebes",
    "episode": 120,
    "imdb_id": "tt3443090"
  },
  "tt0907694:1:120": {
    "name": "Zu hoch geflogen",
    "titleCs": "Láska z nebes",
    "episode": 120,
    "imdb_id": "tt3443090"
  },
  "rp_series_complete:1:121": {
    "name": "Besetzte Herzen",
    "titleCs": "První nebo druhá",
    "episode": 121,
    "imdb_id": "tt3332888"
  },
  "tt0907694:1:121": {
    "name": "Besetzte Herzen",
    "titleCs": "První nebo druhá",
    "episode": 121,
    "imdb_id": "tt3332888"
  },
  "rp_series_complete:1:122": {
    "name": "Evitas Rache",
    "titleCs": "Stíny minulosti",
    "episode": 122,
    "imdb_id": "tt3132252"
  },
  "tt0907694:1:122": {
    "name": "Evitas Rache",
    "titleCs": "Stíny minulosti",
    "episode": 122,
    "imdb_id": "tt3132252"
  },
  "rp_series_complete:1:123": {
    "name": "Mein unbekanntes Herz",
    "titleCs": "Mé srdce patří tobě",
    "episode": 123,
    "imdb_id": "tt3954226"
  },
  "tt0907694:1:123": {
    "name": "Mein unbekanntes Herz",
    "titleCs": "Mé srdce patří tobě",
    "episode": 123,
    "imdb_id": "tt3954226"
  },
  "rp_series_complete:1:124": {
    "name": "Anwälte küsst man nicht",
    "titleCs": "Čekání na duhu",
    "episode": 124,
    "imdb_id": "tt3954140"
  },
  "tt0907694:1:124": {
    "name": "Anwälte küsst man nicht",
    "titleCs": "Čekání na duhu",
    "episode": 124,
    "imdb_id": "tt3954140"
  },
  "rp_series_complete:1:125": {
    "name": "Vertrauen ist gut, verlieben ist besser",
    "titleCs": "Zrada a láska",
    "episode": 125,
    "imdb_id": "tt3901820"
  },
  "tt0907694:1:125": {
    "name": "Vertrauen ist gut, verlieben ist besser",
    "titleCs": "Zrada a láska",
    "episode": 125,
    "imdb_id": "tt3901820"
  },
  "rp_series_complete:1:126": {
    "name": "Ghostwriter",
    "titleCs": "Síla lásky",
    "episode": 126,
    "imdb_id": "tt5921002"
  },
  "tt0907694:1:126": {
    "name": "Ghostwriter",
    "titleCs": "Síla lásky",
    "episode": 126,
    "imdb_id": "tt5921002"
  },
  "rp_series_complete:1:127": {
    "name": "Wahlversprechen und andere Lügen",
    "titleCs": "Kandidáti na lásku",
    "episode": 127,
    "imdb_id": "tt6058140"
  },
  "tt0907694:1:127": {
    "name": "Wahlversprechen und andere Lügen",
    "titleCs": "Kandidáti na lásku",
    "episode": 127,
    "imdb_id": "tt6058140"
  },
  "rp_series_complete:1:128": {
    "name": "Ein einziger Kuss",
    "titleCs": "Valentýnský polibek",
    "episode": 128,
    "imdb_id": "tt18155194"
  },
  "tt0907694:1:128": {
    "name": "Ein einziger Kuss",
    "titleCs": "Valentýnský polibek",
    "episode": 128,
    "imdb_id": "tt18155194"
  },
  "rp_series_complete:1:129": {
    "name": "Rundum glücklich",
    "titleCs": "Vůně vanilky",
    "episode": 129,
    "imdb_id": null
  },
  "tt0907694:1:129": {
    "name": "Rundum glücklich",
    "titleCs": "Vůně vanilky",
    "episode": 129,
    "imdb_id": null
  },
  "rp_series_complete:1:130": {
    "name": "Vollkommen unerwartet",
    "titleCs": "Nečekaná láska",
    "episode": 130,
    "imdb_id": "tt5376696"
  },
  "tt0907694:1:130": {
    "name": "Vollkommen unerwartet",
    "titleCs": "Nečekaná láska",
    "episode": 130,
    "imdb_id": "tt5376696"
  },
  "rp_series_complete:1:131": {
    "name": "Liebe, Diebe, Diamanten",
    "titleCs": "Láska, zloděj a diamanty",
    "episode": 131,
    "imdb_id": null
  },
  "tt0907694:1:131": {
    "name": "Liebe, Diebe, Diamanten",
    "titleCs": "Láska, zloděj a diamanty",
    "episode": 131,
    "imdb_id": null
  },
  "rp_series_complete:1:132": {
    "name": "Argentinischer Tango",
    "titleCs": "Argentinské tango",
    "episode": 132,
    "imdb_id": "tt4837404"
  },
  "tt0907694:1:132": {
    "name": "Argentinischer Tango",
    "titleCs": "Argentinské tango",
    "episode": 132,
    "imdb_id": "tt4837404"
  },
  "rp_series_complete:1:133": {
    "name": "Lizenz zum Seitensprung",
    "titleCs": "Láska s výhodami",
    "episode": 133,
    "imdb_id": "tt5295330"
  },
  "tt0907694:1:133": {
    "name": "Lizenz zum Seitensprung",
    "titleCs": "Láska s výhodami",
    "episode": 133,
    "imdb_id": "tt5295330"
  },
  "rp_series_complete:1:134": {
    "name": "Schutzengel",
    "titleCs": "Anděl strážný",
    "episode": 134,
    "imdb_id": "tt5580156"
  },
  "tt0907694:1:134": {
    "name": "Schutzengel",
    "titleCs": "Anděl strážný",
    "episode": 134,
    "imdb_id": "tt5580156"
  },
  "rp_series_complete:1:135": {
    "name": "Ein Doktor & drei Frauen",
    "titleCs": "Muž s velkým srdcem",
    "episode": 135,
    "imdb_id": null
  },
  "tt0907694:1:135": {
    "name": "Ein Doktor & drei Frauen",
    "titleCs": "Muž s velkým srdcem",
    "episode": 135,
    "imdb_id": null
  },
  "rp_series_complete:1:136": {
    "name": "Ex & Liebe",
    "titleCs": "Znovunalezená láska",
    "episode": 136,
    "imdb_id": null
  },
  "tt0907694:1:136": {
    "name": "Ex & Liebe",
    "titleCs": "Znovunalezená láska",
    "episode": 136,
    "imdb_id": null
  },
  "rp_series_complete:1:137": {
    "name": "Erdbeeren im Frühling",
    "titleCs": "Láska mezi jahodami",
    "episode": 137,
    "imdb_id": null
  },
  "tt0907694:1:137": {
    "name": "Erdbeeren im Frühling",
    "titleCs": "Láska mezi jahodami",
    "episode": 137,
    "imdb_id": null
  },
  "rp_series_complete:1:138": {
    "name": "Haustausch mit Hindernissen",
    "titleCs": "Dotek kouzla",
    "episode": 138,
    "imdb_id": "tt6426868"
  },
  "tt0907694:1:138": {
    "name": "Haustausch mit Hindernissen",
    "titleCs": "Dotek kouzla",
    "episode": 138,
    "imdb_id": "tt6426868"
  },
  "rp_series_complete:1:139": {
    "name": "Wie von einem anderen Stern",
    "titleCs": "Jako z daleké hvězdy",
    "episode": 139,
    "imdb_id": "tt5940862"
  },
  "tt0907694:1:139": {
    "name": "Wie von einem anderen Stern",
    "titleCs": "Jako z daleké hvězdy",
    "episode": 139,
    "imdb_id": "tt5940862"
  },
  "rp_series_complete:1:140": {
    "name": "Fast noch verheiratet",
    "titleCs": "Navždy svoji",
    "episode": 140,
    "imdb_id": null
  },
  "tt0907694:1:140": {
    "name": "Fast noch verheiratet",
    "titleCs": "Navždy svoji",
    "episode": 140,
    "imdb_id": null
  },
  "rp_series_complete:1:141": {
    "name": "Nie wieder Klassentreffen",
    "titleCs": "Tenkrát po maturitě",
    "episode": 141,
    "imdb_id": "tt7294684"
  },
  "tt0907694:1:141": {
    "name": "Nie wieder Klassentreffen",
    "titleCs": "Tenkrát po maturitě",
    "episode": 141,
    "imdb_id": "tt7294684"
  },
  "rp_series_complete:1:142": {
    "name": "Das Gespenst von Cassley",
    "titleCs": "Duch z Cassley",
    "episode": 142,
    "imdb_id": "tt7565710"
  },
  "tt0907694:1:142": {
    "name": "Das Gespenst von Cassley",
    "titleCs": "Duch z Cassley",
    "episode": 142,
    "imdb_id": "tt7565710"
  },
  "rp_series_complete:1:143": {
    "name": "Wenn Fische lächeln",
    "titleCs": "Talisman lásky",
    "episode": 143,
    "imdb_id": "tt7652188"
  },
  "tt0907694:1:143": {
    "name": "Wenn Fische lächeln",
    "titleCs": "Talisman lásky",
    "episode": 143,
    "imdb_id": "tt7652188"
  },
  "rp_series_complete:1:144": {
    "name": "Geerbtes Glück",
    "titleCs": "Vůně orchidejí",
    "episode": 144,
    "imdb_id": "tt7858832"
  },
  "tt0907694:1:144": {
    "name": "Geerbtes Glück",
    "titleCs": "Vůně orchidejí",
    "episode": 144,
    "imdb_id": "tt7858832"
  },
  "rp_series_complete:1:145": {
    "name": "Das Vermächtnis unseres Vaters",
    "titleCs": "Otcovo dědictví",
    "episode": 145,
    "imdb_id": "tt8103280"
  },
  "tt0907694:1:145": {
    "name": "Das Vermächtnis unseres Vaters",
    "titleCs": "Otcovo dědictví",
    "episode": 145,
    "imdb_id": "tt8103280"
  },
  "rp_series_complete:1:146": {
    "name": "Nanny verzweifelt gesucht",
    "titleCs": "Hledá se chůva",
    "episode": 146,
    "imdb_id": "tt7771608"
  },
  "tt0907694:1:146": {
    "name": "Nanny verzweifelt gesucht",
    "titleCs": "Hledá se chůva",
    "episode": 146,
    "imdb_id": "tt7771608"
  },
  "rp_series_complete:1:147": {
    "name": "Wo Dein Herz wohnt",
    "titleCs": "Kam tvé srdce patří",
    "episode": 147,
    "imdb_id": "tt9089702"
  },
  "tt0907694:1:147": {
    "name": "Wo Dein Herz wohnt",
    "titleCs": "Kam tvé srdce patří",
    "episode": 147,
    "imdb_id": "tt9089702"
  },
  "rp_series_complete:1:148": {
    "name": "Das Geheimnis der Blumeninsel",
    "titleCs": "Tajemství květinového ostrova",
    "episode": 148,
    "imdb_id": null
  },
  "tt0907694:1:148": {
    "name": "Das Geheimnis der Blumeninsel",
    "titleCs": "Tajemství květinového ostrova",
    "episode": 148,
    "imdb_id": null
  },
  "rp_series_complete:1:149": {
    "name": "Morgens stürmisch, abends Liebe",
    "titleCs": "Bouřlivá rána, šťastné konce",
    "episode": 149,
    "imdb_id": "tt9401344"
  },
  "tt0907694:1:149": {
    "name": "Morgens stürmisch, abends Liebe",
    "titleCs": "Bouřlivá rána, šťastné konce",
    "episode": 149,
    "imdb_id": "tt9401344"
  },
  "rp_series_complete:1:150": {
    "name": "Die Braut meines Bruders",
    "titleCs": "Nevěsta mého bratra",
    "episode": 150,
    "imdb_id": "tt9740242"
  },
  "tt0907694:1:150": {
    "name": "Die Braut meines Bruders",
    "titleCs": "Nevěsta mého bratra",
    "episode": 150,
    "imdb_id": "tt9740242"
  },
  "rp_series_complete:1:151": {
    "name": "Schwiegertöchter",
    "titleCs": "Program na lásku",
    "episode": 151,
    "imdb_id": null
  },
  "tt0907694:1:151": {
    "name": "Schwiegertöchter",
    "titleCs": "Program na lásku",
    "episode": 151,
    "imdb_id": null
  },
  "rp_series_complete:1:152": {
    "name": "Pralinen zum Frühstück",
    "titleCs": "Pralinky k snídani",
    "episode": 152,
    "imdb_id": null
  },
  "tt0907694:1:152": {
    "name": "Pralinen zum Frühstück",
    "titleCs": "Pralinky k snídani",
    "episode": 152,
    "imdb_id": null
  },
  "rp_series_complete:1:153": {
    "name": "Raus in den Sturm",
    "titleCs": null,
    "episode": 153,
    "imdb_id": "tt10974400"
  },
  "tt0907694:1:153": {
    "name": "Raus in den Sturm",
    "titleCs": null,
    "episode": 153,
    "imdb_id": "tt10974400"
  },
  "rp_series_complete:1:154": {
    "name": "Der magische Bus",
    "titleCs": "Magický autobus",
    "episode": 154,
    "imdb_id": null
  },
  "tt0907694:1:154": {
    "name": "Der magische Bus",
    "titleCs": "Magický autobus",
    "episode": 154,
    "imdb_id": null
  },
  "rp_series_complete:1:155": {
    "name": "Meine Cousine, die Liebe und ich",
    "titleCs": "Má sestřenice, láska a já",
    "episode": 155,
    "imdb_id": "tt11097478"
  },
  "tt0907694:1:155": {
    "name": "Meine Cousine, die Liebe und ich",
    "titleCs": "Má sestřenice, láska a já",
    "episode": 155,
    "imdb_id": "tt11097478"
  },
  "rp_series_complete:1:156": {
    "name": "Von Tee und Liebe",
    "titleCs": "Láska s chutí čaje",
    "episode": 156,
    "imdb_id": "tt11494832"
  },
  "tt0907694:1:156": {
    "name": "Von Tee und Liebe",
    "titleCs": "Láska s chutí čaje",
    "episode": 156,
    "imdb_id": "tt11494832"
  },
  "rp_series_complete:1:157": {
    "name": "Falsches Leben, wahre Liebe",
    "titleCs": "Falešný život, pravá láska",
    "episode": 157,
    "imdb_id": null
  },
  "tt0907694:1:157": {
    "name": "Falsches Leben, wahre Liebe",
    "titleCs": "Falešný život, pravá láska",
    "episode": 157,
    "imdb_id": null
  },
  "rp_series_complete:1:158": {
    "name": "Stadt, Land, Kuss",
    "titleCs": null,
    "episode": 158,
    "imdb_id": "tt13625812"
  },
  "tt0907694:1:158": {
    "name": "Stadt, Land, Kuss",
    "titleCs": null,
    "episode": 158,
    "imdb_id": "tt13625812"
  },
  "rp_series_complete:1:159": {
    "name": "Wie verhext",
    "titleCs": "Svůdná věštba",
    "episode": 159,
    "imdb_id": null
  },
  "tt0907694:1:159": {
    "name": "Wie verhext",
    "titleCs": "Svůdná věštba",
    "episode": 159,
    "imdb_id": null
  },
  "rp_series_complete:1:160": {
    "name": "Herzensläufe",
    "titleCs": "Vášnivá srdce",
    "episode": 160,
    "imdb_id": null
  },
  "tt0907694:1:160": {
    "name": "Herzensläufe",
    "titleCs": "Vášnivá srdce",
    "episode": 160,
    "imdb_id": null
  },
  "rp_series_complete:1:161": {
    "name": "Der Stoff, aus dem Träume sind",
    "titleCs": "Vyšívané sny",
    "episode": 161,
    "imdb_id": "tt15478660"
  },
  "tt0907694:1:161": {
    "name": "Der Stoff, aus dem Träume sind",
    "titleCs": "Vyšívané sny",
    "episode": 161,
    "imdb_id": "tt15478660"
  },
  "rp_series_complete:1:162": {
    "name": "Im Siebten Himmel",
    "titleCs": "V sedmém nebi",
    "episode": 162,
    "imdb_id": null
  },
  "tt0907694:1:162": {
    "name": "Im Siebten Himmel",
    "titleCs": "V sedmém nebi",
    "episode": 162,
    "imdb_id": null
  },
  "rp_series_complete:1:163": {
    "name": "Vier Luftballons und ein Todesfall",
    "titleCs": "Láska mezi květinami",
    "episode": 163,
    "imdb_id": null
  },
  "tt0907694:1:163": {
    "name": "Vier Luftballons und ein Todesfall",
    "titleCs": "Láska mezi květinami",
    "episode": 163,
    "imdb_id": null
  },
  "rp_series_complete:1:164": {
    "name": "Die Elster und der Kapitän",
    "titleCs": "Láska na pevnině",
    "episode": 164,
    "imdb_id": "tt18377966"
  },
  "tt0907694:1:164": {
    "name": "Die Elster und der Kapitän",
    "titleCs": "Láska na pevnině",
    "episode": 164,
    "imdb_id": "tt18377966"
  },
  "rp_series_complete:1:165": {
    "name": "Liebe ist unberechenbar",
    "titleCs": "Algoritmus lásky",
    "episode": 165,
    "imdb_id": "tt20124474"
  },
  "tt0907694:1:165": {
    "name": "Liebe ist unberechenbar",
    "titleCs": "Algoritmus lásky",
    "episode": 165,
    "imdb_id": "tt20124474"
  },
  "rp_series_complete:1:166": {
    "name": "Liebe und andere Schätze",
    "titleCs": "Láska a jiné poklady",
    "episode": 166,
    "imdb_id": null
  },
  "tt0907694:1:166": {
    "name": "Liebe und andere Schätze",
    "titleCs": "Láska a jiné poklady",
    "episode": 166,
    "imdb_id": null
  },
  "rp_series_complete:1:167": {
    "name": "Hochzeitstag",
    "titleCs": null,
    "episode": 167,
    "imdb_id": "tt22038482"
  },
  "tt0907694:1:167": {
    "name": "Hochzeitstag",
    "titleCs": null,
    "episode": 167,
    "imdb_id": "tt22038482"
  },
  "rp_series_complete:1:168": {
    "name": "Liebe ist die beste Therapie",
    "titleCs": null,
    "episode": 168,
    "imdb_id": "tt26767892"
  },
  "tt0907694:1:168": {
    "name": "Liebe ist die beste Therapie",
    "titleCs": null,
    "episode": 168,
    "imdb_id": "tt26767892"
  },
  "rp_series_complete:1:169": {
    "name": "Wenn ich dich wiederfinde",
    "titleCs": null,
    "episode": 169,
    "imdb_id": "tt27349270"
  },
  "tt0907694:1:169": {
    "name": "Wenn ich dich wiederfinde",
    "titleCs": null,
    "episode": 169,
    "imdb_id": "tt27349270"
  },
  "rp_series_complete:1:170": {
    "name": "Schlagzeile Liebe",
    "titleCs": null,
    "episode": 170,
    "imdb_id": "tt28565529"
  },
  "tt0907694:1:170": {
    "name": "Schlagzeile Liebe",
    "titleCs": null,
    "episode": 170,
    "imdb_id": "tt28565529"
  },
  "rp_series_complete:1:171": {
    "name": "Amys Wunschkind",
    "titleCs": null,
    "episode": 171,
    "imdb_id": "tt29716178"
  },
  "tt0907694:1:171": {
    "name": "Amys Wunschkind",
    "titleCs": null,
    "episode": 171,
    "imdb_id": "tt29716178"
  },
  "rp_series_complete:1:172": {
    "name": "Frühstück bei Tessa",
    "titleCs": null,
    "episode": 172,
    "imdb_id": "tt30783580"
  },
  "tt0907694:1:172": {
    "name": "Frühstück bei Tessa",
    "titleCs": null,
    "episode": 172,
    "imdb_id": "tt30783580"
  },
  "rp_series_complete:1:173": {
    "name": "Verliebt in einen Butler",
    "titleCs": null,
    "episode": 173,
    "imdb_id": "tt33086345"
  },
  "tt0907694:1:173": {
    "name": "Verliebt in einen Butler",
    "titleCs": null,
    "episode": 173,
    "imdb_id": "tt33086345"
  },
  "rp_series_complete:1:174": {
    "name": "Jahrestag",
    "titleCs": null,
    "episode": 174,
    "imdb_id": "tt34824149"
  },
  "tt0907694:1:174": {
    "name": "Jahrestag",
    "titleCs": null,
    "episode": 174,
    "imdb_id": "tt34824149"
  },
  "rp_series_complete:1:175": {
    "name": "Wer immer du bist",
    "titleCs": null,
    "episode": 175,
    "imdb_id": "tt38098292"
  },
  "tt0907694:1:175": {
    "name": "Wer immer du bist",
    "titleCs": null,
    "episode": 175,
    "imdb_id": "tt38098292"
  },
  "rp_series_complete:1:176": {
    "name": "Einspruch für die Liebe",
    "titleCs": null,
    "episode": 176,
    "imdb_id": null
  },
  "tt0907694:1:176": {
    "name": "Einspruch für die Liebe",
    "titleCs": null,
    "episode": 176,
    "imdb_id": null
  },
  "rp_series_complete:1:177": {
    "name": "Wo Liebe aufhört und wo sie beginnt",
    "titleCs": null,
    "episode": 177,
    "imdb_id": null
  },
  "tt0907694:1:177": {
    "name": "Wo Liebe aufhört und wo sie beginnt",
    "titleCs": null,
    "episode": 177,
    "imdb_id": null
  },
  "rp_series_complete:1:178": {
    "name": "Die Glücksbringerin",
    "titleCs": null,
    "episode": 178,
    "imdb_id": null
  },
  "tt0907694:1:178": {
    "name": "Die Glücksbringerin",
    "titleCs": null,
    "episode": 178,
    "imdb_id": null
  }
};

// ============================================================================
// 4. CATALOG & META HANDLERS
// ============================================================================
const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  // 1. Series Catalog
  if (type === 'series' && id === 'rp_zdf_series_catalog') {
    return {
      metas: [
        {
          id: 'rp_series_complete',
          type: 'series',
          name: 'Rosamunde Pilcher (Komplette Serie ⚡▶⬇)',
          poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
          background: 'https://images.metahub.space/background/medium/tt0907694/img',
          description: 'Komplette Rosamunde Pilcher Sammlung (169 Verfilmungen / dílů). ⬇ = Vlastní stažené • ⚡ = ZDFmediathek 1080p • ▶ = YouTube.',
          releaseInfo: '1993-',
          genres: ['Drama', 'Romance']
        }
      ]
    };
  }

  // 2. Movies Catalog
  if (type === 'movie' && id === 'rp_zdf_catalog') {
    const downloads = await getDownloadsMap();
    let results = EPISODES.map(ep => {
      const epNum = ep.episode || parseInt((ep.id.match(/\d+/) || [0])[0], 10);
      const downloadEntry = findDownload(epNum, ep.searchTitle, ep.titleCs, downloads);
      const hasDownload = Boolean(downloadEntry);
      const prefix = hasDownload ? '⬇' + (ep.name.startsWith('⚡') || ep.name.startsWith('▶') ? '' : ' ') : '';
      return {
        ...ep,
        name: prefix + ep.name
      };
    });

    if (extra && extra.search) {
      const q = extra.search.toLowerCase().trim();
      const qNorm = normalizeKey(q);
      results = results.filter(ep => {
        const nameMatch = ep.name.toLowerCase().includes(q);
        const normMatch = normalizeKey(ep.name).includes(qNorm);
        const csMatch = ep.titleCs && (ep.titleCs.toLowerCase().includes(q) || normalizeKey(ep.titleCs).includes(qNorm));
        return nameMatch || normMatch || csMatch;
      });
    }

    return {
      metas: results.map(ep => ({
        id: ep.id,
        type: ep.type,
        name: ep.name,
        poster: ep.poster,
        description: ep.description
      }))
    };
  }

  return { metas: [] };
});

builder.defineMetaHandler(async ({ type, id }) => {
  // 1. Complete Series Details (both rp_series_complete and official tt0907694)
  if (type === 'series' && (id === 'rp_series_complete' || id === 'tt0907694')) {
    const downloads = await getDownloadsMap();
    const videos = SERIES_VIDEOS.map(v => {
      const epNum = v.number || v.episode;
      const deTitle = v.titleDe || cleanCoreTitle(v.title);
      const csTitle = v.titleCs || null;

      const downloadEntry = findDownload(epNum, deTitle, csTitle, downloads);
      const hasDownload = Boolean(downloadEntry);
      const hasZdf = v.hasZdf;
      const hasYt = v.hasYt;

      let prefix = '';
      if (hasDownload) prefix += '⬇';
      if (hasZdf && hasYt) prefix += '⚡▶ ';
      else if (hasZdf) prefix += '⚡ ';
      else if (hasYt) prefix += '▶ ';
      else if (hasDownload) prefix += ' ';

      const displayName = csTitle ? `${prefix}${csTitle} / ${deTitle}` : `${prefix}${deTitle}`;

      let tagPrefix = '';
      if (hasDownload) tagPrefix += '[DOWNLOADED] ';
      if (hasZdf && hasYt) tagPrefix += '[BOTH] ';
      else if (hasZdf) tagPrefix += '[OFFICIAL] ';
      else if (hasYt) tagPrefix += '[YOUTUBE] ';

      const baseOverview = (v.overview || '')
        .replace(/^\[(DOWNLOADED|OFFICIAL|YOUTUBE|BOTH)\]\s*/g, '')
        .replace(/^\[(DOWNLOADED|OFFICIAL|YOUTUBE|BOTH)\]\s*/g, '')
        .trim();

      return {
        ...v,
        name: displayName,
        title: displayName,
        overview: tagPrefix + baseOverview
      };
    });

    return {
      meta: {
        id: id,
        type: 'series',
        name: 'Rosamunde Pilcher',
        genres: ['Drama', 'Romance'],
        poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
        background: 'https://images.metahub.space/background/medium/tt0907694/img',
        description: 'Herzkino-Reihe nach Rosamunde Pilcher (169 Verfilmungen / dílů). ⬇ = Vlastní stažené • ⚡ = ZDFmediathek 1080p • ▶ = YouTube.',
        releaseInfo: '1993-',
        videos: videos
      }
    };
  }

  // 2. Individual Movie Catalog Items (rp_xxx)
  if (type === 'movie' && id.startsWith('rp_')) {
    const episode = EPISODES.find(ep => ep.id === id);
    if (episode) {
      const downloads = await getDownloadsMap();
      const epNum = episode.episode || parseInt((episode.id.match(/\d+/) || [0])[0], 10);
      const downloadEntry = findDownload(epNum, episode.searchTitle, episode.titleCs, downloads);
      const hasDownload = Boolean(downloadEntry);
      const prefix = hasDownload ? '⬇' + (episode.name.startsWith('⚡') || episode.name.startsWith('▶') ? '' : ' ') : '';
      return {
        meta: {
          id: episode.id,
          type: episode.type,
          name: prefix + episode.name,
          poster: episode.poster,
          description: (hasDownload ? '[DOWNLOADED] ' : '') + episode.description
        }
      };
    }
  }

  return { meta: null };
});

// ============================================================================
// 4. STREAM RESOLVER HELPERS (STRICT DURATION & TITLE MATCHING)
// ============================================================================
const STREAM_CACHE = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const STOPWORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
  'und', 'oder', 'aber', 'mit', 'von', 'aus', 'bei', 'nach', 'in', 'im', 'am', 'an', 'auf',
  'für', 'fuer', 'ueber', 'über', 'unter', 'vor', 'zu', 'zum', 'zur', 'als', 'wie'
]);

function normalizeGerman(str) {
  return (str || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCoreTitle(raw) {
  let title = (raw || '');
  if (title.includes('/')) {
    const parts = title.split('/');
    title = parts[parts.length - 1];
  }
  return title
    .replace(/^(\[(DOWNLOADED|OFFICIAL|YOUTUBE|BOTH)\]|[⬇⚡▶🟢🟠]|\s)+/u, '')
    .replace(/^Rosamunde\s*Pilcher(ová)?\s*[:\-–]?\s*/i, '')
    .replace(/\s*-\s*Nach der Kurzgeschichte.*$/i, '')
    .replace(/\s*-\s*Aus der Herzkino.*$/i, '')
    .replace(/\(S\d+\/E\d+\)/gi, '')
    .replace(/\(Audiodeskription\)/gi, '')
    .trim();
}

function isStrictTitleMatch(searchTitle, ytTitle) {
  const normYT = normalizeGerman(ytTitle);
  if (!normYT.includes('pilcher') && !normYT.includes('rosamunde')) return false;

  const normSearch = normalizeGerman(searchTitle);
  const keywords = normSearch.split(' ').filter(w => w.length >= 2 && !STOPWORDS.has(w));
  if (keywords.length === 0) return false;

  return keywords.every(kw => {
    const reg = new RegExp('(^|\\s)' + kw + '(\\s|$)', 'i');
    return reg.test(normYT);
  });
}

function parseDurationSeconds(text) {
  if (!text) return 0;
  const parts = text.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function findVideoRenderers(obj, results = []) {
  if (!obj || typeof obj !== 'object') return results;
  if (obj.videoRenderer) {
    const vr = obj.videoRenderer;
    const videoId = vr.videoId;
    const title = vr.title?.runs?.map(r => r.text).join('') || vr.title?.simpleText || '';
    const lengthText = vr.lengthText?.simpleText || vr.lengthText?.runs?.map(r => r.text).join('') || '';
    const seconds = parseDurationSeconds(lengthText);
    results.push({ videoId, title, lengthText, seconds });
  }
  for (const key of Object.keys(obj)) {
    findVideoRenderers(obj[key], results);
  }
  return results;
}

async function searchMediathek(searchTitle) {
  const MEDIATHEK_API_URL = 'https://mediathekviewweb.de/api/query';
  try {
    const payload = {
      queries: [
        { fields: ['topic'], query: 'Rosamunde Pilcher' },
        { fields: ['title'], query: searchTitle }
      ],
      sortBy: 'timestamp',
      sortOrder: 'desc',
      future: false,
      size: 8
    };

    const resp = await axios.post(MEDIATHEK_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    const results = resp.data?.result?.results || [];
    return results.filter(r => (r.duration || 0) > 2400);
  } catch (err) {
    return [];
  }
}

async function searchYouTubeFullMovies(searchTitle) {
  const query = 'Rosamunde Pilcher ' + searchTitle;
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
  try {
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
      },
      timeout: 6000
    });

    const html = resp.data;
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const videos = findVideoRenderers(data);

    // Filter only actual full films / parts (at least 40 minutes = 2400s)
    const longVideos = videos.filter(v => v.seconds >= 2400);
    if (longVideos.length === 0) return [];

    const matched = longVideos.filter(v => isStrictTitleMatch(searchTitle, v.title));
    return matched.slice(0, 3);
  } catch (err) {
    return [];
  }
}



// ============================================================================
// 6. UNIFIED DYNAMIC STREAM HANDLER (DOWNLOADS, MEDIATHEK & YOUTUBE)
// ============================================================================
builder.defineStreamHandler(async ({ type, id }) => {
  let searchTitle = '';
  let epNumber = null;
  let csTitleFound = null;

  if (type === 'series' && (id.startsWith('tt0907694:') || id.startsWith('rp_series_complete:'))) {
    const epNum = parseInt(id.split(':')[2], 10);
    epNumber = epNum;
    const matchByNum = SERIES_VIDEOS.find(v => Number(v.number || v.episode) === epNum);
    if (matchByNum) {
      searchTitle = matchByNum.titleDe || cleanCoreTitle(matchByNum.name);
      csTitleFound = matchByNum.titleCs || null;
    } else {
      const epEntry = SERIES_MAP[id];
      if (epEntry) {
        searchTitle = cleanCoreTitle(epEntry.name);
      }
    }
  } else if (type === 'movie' && id.startsWith('tt')) {
    const epEntry = Object.values(SERIES_MAP).find(v => v.imdb_id === id);
    if (epEntry) {
      searchTitle = cleanCoreTitle(epEntry.name);
      epNumber = epEntry.episode;
    }
  } else if (id.startsWith('rp_')) {
    const episode = EPISODES.find(ep => ep.id === id);
    if (episode) {
      searchTitle = episode.searchTitle || cleanCoreTitle(episode.name);
      epNumber = episode.episode;
      csTitleFound = episode.titleCs || null;
    }
  }

  if (!searchTitle) {
    return { streams: [] };
  }

  // Load downloads map
  const downloads = await getDownloadsMap();
  const downloadEntry = epNumber ? findDownload(epNumber, searchTitle, csTitleFound, downloads) : null;

  const coreTitle = cleanCoreTitle(searchTitle);
  const streams = [];

  // 1. TOP STREAM: User Download (⬇ [DOWNLOADED HD])
  if (downloadEntry) {
    let downloadUrl = '';
    let downloadTitle = '';
    let downloadName = '⬇ [DOWNLOADED HD]';

    if (typeof downloadEntry === 'string') {
      downloadUrl = downloadEntry;
      downloadTitle = '[DOWNLOADED] ' + (csTitleFound ? csTitleFound + ' / ' : '') + coreTitle + '\nDirect User Stream / File';
    } else if (typeof downloadEntry === 'object' && downloadEntry.url) {
      downloadUrl = downloadEntry.url;
      downloadName = downloadEntry.name || '⬇ [DOWNLOADED HD]';
      const rawTitle = downloadEntry.title || (csTitleFound ? csTitleFound + ' / ' : '') + coreTitle;
      downloadTitle = rawTitle.startsWith('[DOWNLOADED] ') ? rawTitle : '[DOWNLOADED] ' + rawTitle;
    }

    if (downloadUrl) {
      streams.push({
        name: downloadName,
        title: downloadTitle,
        url: downloadUrl,
        behaviorHints: { notWebReady: false }
      });
    }
  }

  // Check cache for Mediathek / YouTube
  const cacheKey = id;
  const cached = STREAM_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { streams: [...streams, ...cached.streams] };
  }

  try {
    const [mediathekList, ytList] = await Promise.all([
      searchMediathek(coreTitle),
      searchYouTubeFullMovies(coreTitle)
    ]);

    const remoteStreams = [];

    // 2. Official Broadcaster Streams (⚡ [OFFICIAL])
    if (mediathekList.length > 0) {
      const primary = mediathekList.find(m => !/Audiodeskription/i.test(m.title)) || mediathekList[0];
      const streamUrl = primary.url_video_hd || primary.url_video;
      if (streamUrl) {
        const channel = primary.channel || 'ZDF';
        const durationMin = Math.round((primary.duration || 0) / 60);
        remoteStreams.push({
          name: '⚡ [OFFICIAL ' + channel + ' HD] 1080p',
          title: '[OFFICIAL] ' + primary.title + '\n' + channel + 'mediathek (' + durationMin + ' min) • 100% Funktioniert',
          url: streamUrl,
          behaviorHints: { notWebReady: false }
        });
      }
    }

    // 3. YouTube Full Films (▶ [YOUTUBE])
    if (ytList.length > 0) {
      for (const yt of ytList) {
        remoteStreams.push({
          name: '▶ [YOUTUBE HD] ' + yt.lengthText,
          title: '[YOUTUBE] ' + yt.title + '\nSpielfilm auf YouTube (' + yt.lengthText + ')',
          ytId: yt.videoId
        });
      }
    }

    STREAM_CACHE.set(cacheKey, {
      streams: remoteStreams,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return { streams: [...streams, ...remoteStreams] };
  } catch (err) {
    console.warn('[StreamResolver] Error for ' + id + ':', err.message);
    return { streams };
  }
});

// ============================================================================
// 7. VERCEL SERVERLESS EXPORT & WEB DASHBOARD
// ============================================================================
const addonInterface = builder.getInterface();
const proto = Object.getPrototypeOf(addonInterface);
if (proto && typeof proto.createRouter !== 'function') {
  proto.createRouter = function () {
    return sdkGetRouter(this);
  };
}
if (typeof addonInterface.createRouter !== 'function') {
  addonInterface.createRouter = () => sdkGetRouter(addonInterface);
}

const getRouter = builder.getInterface().createRouter();

module.exports = (req, res) => {
  if (!req.url || req.url === '/' || req.url === '/index.html') {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'pilcher-stremio-tfd7.vercel.app';
    const manifestUrl = 'https://' + host + '/manifest.json';
    const stremioUrl = 'stremio://' + host + '/manifest.json';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rosamunde Pilcher - Stremio Addon</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f1015; color: #f0f0f0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
    .card { background: #1a1c23; border: 1px solid #2d3139; border-radius: 12px; padding: 36px 28px; max-width: 600px; width: 100%; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    h1 { color: #8a5cf6; margin-top: 0; font-size: 1.6rem; }
    p { color: #a0a5b5; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: inline-block; background: #8a5cf6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 1rem; transition: background 0.2s; margin-bottom: 20px; }
    .btn:hover { background: #7c4ee8; }
    .manifest { font-size: 0.85rem; color: #707585; word-break: break-all; margin-bottom: 20px; }
    code { background: #252833; padding: 4px 8px; border-radius: 4px; color: #e2e8f0; }
    .info-box { background: #14161c; border: 1px solid #22252e; border-radius: 8px; padding: 16px; text-align: left; font-size: 0.85rem; color: #94a3b8; line-height: 1.6; }
    .info-box h3 { color: #e2e8f0; margin-top: 0; margin-bottom: 8px; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Rosamunde Pilcher Collection (v2.2.0)</h1>
    <p>Streams all 169 Rosamunde Pilcher films directly inside the official Stremio series with Czech & German titles, broadcast dates and covers.</p>
    <a class="btn" href="${stremioUrl}">Install in Stremio</a>
    <div class="manifest">
      Manifest URL: <br><br><code>${manifestUrl}</code>
    </div>
    <div class="info-box">
      <h3>⚡ Visual Indicators (Samsung TV & PC safe)</h3>
      • ⬇ = Vlastní stažené / Downloaded file link (Top priority stream)<br>
      • ⚡ = ZDFmediathek 1080p stream available (100% works)<br>
      • ▶ = YouTube verified full movie (>= 40 min)<br>
      • ⚡▶ = Available on both ZDF and YouTube!<br>
      • Česky / Deutsch: Bilingvní názvy pro vyhledávání v češtině i němčině.
    </div>
  </div>
</body>
</html>`);
    return;
  }

  getRouter(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
  });
};
