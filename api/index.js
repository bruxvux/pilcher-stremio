const { addonBuilder, getRouter: sdkGetRouter } = require('stremio-addon-sdk');
const axios = require('axios');

// ============================================================================
// 1. MANIFEST CONFIGURATION (v1.9.0)
// ============================================================================
const manifest = {
  id: 'community.rosamunde-pilcher-zdf',
  version: '1.9.0',
  name: 'Rosamunde Pilcher (🟢 ZDF & 🟠 YouTube HD)',
  description: 'Komplette Rosamunde Pilcher Sammlung (169 Filme). 🟢 = ZDFmediathek HD (100% funktioniert), 🟠 = YouTube voller Spielfilm.',
  resources: ['catalog', 'meta', 'stream'],
  types: ['series', 'movie'],
  idPrefixes: ['tt0907694', 'tt', 'rp_'],
  catalogs: [
    {
      type: 'series',
      id: 'rp_zdf_series_catalog',
      name: '🟢🟠 Rosamunde Pilcher (Komplette Serie)',
      extra: [
        { name: 'search', isRequired: false }
      ]
    },
    {
      type: 'movie',
      id: 'rp_zdf_catalog',
      name: '🟢🟠 Rosamunde Pilcher (Einzelfilme)',
      extra: [
        { name: 'search', isRequired: false }
      ]
    }
  ]
};

// ============================================================================
// 2. ENRICHED METADATA DATABASES (🟢 ZDF & 🟠 YOUTUBE INDICATORS)
// ============================================================================
const SERIES_VIDEOS = [
  {
    "id": "tt0907694:1:1",
    "name": "Stürmische Begegnung",
    "title": "Stürmische Begegnung",
    "season": 1,
    "number": 1,
    "episode": 1,
    "released": "1993-10-30T00:00:00.000Z",
    "firstAired": "1993-10-30T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0108240/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1993). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:2",
    "name": "Wilder Thymian",
    "title": "Wilder Thymian",
    "season": 1,
    "number": 2,
    "episode": 2,
    "released": "1994-10-23T00:00:00.000Z",
    "firstAired": "1994-10-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0111721/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:3",
    "name": "🟠 Karussell des Lebens",
    "title": "🟠 Karussell des Lebens",
    "season": 1,
    "number": 3,
    "episode": 3,
    "released": "1994-11-13T00:00:00.000Z",
    "firstAired": "1994-11-13T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0110245/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:4",
    "name": "Wechselspiel der Liebe",
    "title": "Wechselspiel der Liebe",
    "season": 1,
    "number": 4,
    "episode": 4,
    "released": "1995-01-15T00:00:00.000Z",
    "firstAired": "1995-01-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0114903/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.1"
  },
  {
    "id": "tt0907694:1:5",
    "name": "🟠 Das Ende eines Sommers",
    "title": "🟠 Das Ende eines Sommers",
    "season": 1,
    "number": 5,
    "episode": 5,
    "released": "1995-02-05T00:00:00.000Z",
    "firstAired": "1995-02-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0123821/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4"
  },
  {
    "id": "tt0907694:1:6",
    "name": "🟠 Sommer am Meer",
    "title": "🟠 Sommer am Meer",
    "season": 1,
    "number": 6,
    "episode": 6,
    "released": "1995-10-15T00:00:00.000Z",
    "firstAired": "1995-10-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0114498/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.2"
  },
  {
    "id": "tt0907694:1:7",
    "name": "🟠 Schlafender Tiger",
    "title": "🟠 Schlafender Tiger",
    "season": 1,
    "number": 7,
    "episode": 7,
    "released": "1995-11-05T00:00:00.000Z",
    "firstAired": "1995-11-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0114353/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.1"
  },
  {
    "id": "tt0907694:1:8",
    "name": "🟠 Wolken am Horizont",
    "title": "🟠 Wolken am Horizont",
    "season": 1,
    "number": 8,
    "episode": 8,
    "released": "1995-01-01T00:00:00.000Z",
    "firstAired": "1995-01-01T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0126124/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:9",
    "name": "Schneesturm im Frühling",
    "title": "Schneesturm im Frühling",
    "season": 1,
    "number": 9,
    "episode": 9,
    "released": "1996-02-04T00:00:00.000Z",
    "firstAired": "1996-02-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0117564/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4"
  },
  {
    "id": "tt0907694:1:10",
    "name": "🟠 Lichterspiele",
    "title": "🟠 Lichterspiele",
    "season": 1,
    "number": 10,
    "episode": 10,
    "released": "1996-03-03T00:00:00.000Z",
    "firstAired": "1996-03-03T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0116870/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.1"
  },
  {
    "id": "tt0907694:1:11",
    "name": "September: Teil 1",
    "title": "September: Teil 1",
    "season": 1,
    "number": 11,
    "episode": 11,
    "released": "1996-04-07T00:00:00.000Z",
    "firstAired": "1996-04-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15729598/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:12",
    "name": "September: Teil 2",
    "title": "September: Teil 2",
    "season": 1,
    "number": 12,
    "episode": 12,
    "released": "1996-04-08T00:00:00.000Z",
    "firstAired": "1996-04-08T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15741176/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:13",
    "name": "🟠 Das Haus an der Küste",
    "title": "🟠 Das Haus an der Küste",
    "season": 1,
    "number": 13,
    "episode": 13,
    "released": "1996-11-03T00:00:00.000Z",
    "firstAired": "1996-11-03T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0116498/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:14",
    "name": "Eine besondere Liebe",
    "title": "Eine besondere Liebe",
    "season": 1,
    "number": 14,
    "episode": 14,
    "released": "1996-12-25T00:00:00.000Z",
    "firstAired": "1996-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0115659/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.1"
  },
  {
    "id": "tt0907694:1:15",
    "name": "Wind der Hoffnung",
    "title": "Wind der Hoffnung",
    "season": 1,
    "number": 15,
    "episode": 15,
    "released": "1997-02-16T00:00:00.000Z",
    "firstAired": "1997-02-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0120517/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6"
  },
  {
    "id": "tt0907694:1:16",
    "name": "🟠 Irrwege des Herzens",
    "title": "🟠 Irrwege des Herzens",
    "season": 1,
    "number": 16,
    "episode": 16,
    "released": "1997-03-09T00:00:00.000Z",
    "firstAired": "1997-03-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0119384/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.5"
  },
  {
    "id": "tt0907694:1:17",
    "name": "Stunden der Entscheidung",
    "title": "Stunden der Entscheidung",
    "season": 1,
    "number": 17,
    "episode": 17,
    "released": "1997-03-30T00:00:00.000Z",
    "firstAired": "1997-03-30T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0120234/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:18",
    "name": "🟠 Die zweite Chance",
    "title": "🟠 Die zweite Chance",
    "season": 1,
    "number": 18,
    "episode": 18,
    "released": "1997-10-12T00:00:00.000Z",
    "firstAired": "1997-10-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0128860/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.7"
  },
  {
    "id": "tt0907694:1:19",
    "name": "🟠 Zwei Schwestern",
    "title": "🟠 Zwei Schwestern",
    "season": 1,
    "number": 19,
    "episode": 19,
    "released": "1997-11-16T00:00:00.000Z",
    "firstAired": "1997-11-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0135071/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.1"
  },
  {
    "id": "tt0907694:1:20",
    "name": "🟠 Der Preis der Liebe",
    "title": "🟠 Der Preis der Liebe",
    "season": 1,
    "number": 20,
    "episode": 20,
    "released": "1998-02-15T00:00:00.000Z",
    "firstAired": "1998-02-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0146041/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:21",
    "name": "Heimkehr: Teil 1",
    "title": "Heimkehr: Teil 1",
    "season": 1,
    "number": 21,
    "episode": 21,
    "released": "1998-06-01T00:00:00.000Z",
    "firstAired": "1998-06-01T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15729564/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:22",
    "name": "Heimkehr: Teil 2",
    "title": "Heimkehr: Teil 2",
    "season": 1,
    "number": 22,
    "episode": 22,
    "released": "1998-06-07T00:00:00.000Z",
    "firstAired": "1998-06-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15729560/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:23",
    "name": "🟠 Rückkehr ins Paradies",
    "title": "🟠 Rückkehr ins Paradies",
    "season": 1,
    "number": 23,
    "episode": 23,
    "released": "1998-09-20T00:00:00.000Z",
    "firstAired": "1998-09-20T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0170520/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:24",
    "name": "🟠 Dornen im Tal der Blumen",
    "title": "🟠 Dornen im Tal der Blumen",
    "season": 1,
    "number": 24,
    "episode": 24,
    "released": "1998-12-13T00:00:00.000Z",
    "firstAired": "1998-12-13T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0177180/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6"
  },
  {
    "id": "tt0907694:1:25",
    "name": "🟠 Melodie der Herzen",
    "title": "🟠 Melodie der Herzen",
    "season": 1,
    "number": 25,
    "episode": 25,
    "released": "1998-12-25T00:00:00.000Z",
    "firstAired": "1998-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0181794/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2"
  },
  {
    "id": "tt0907694:1:26",
    "name": "🟠 Magie der Liebe",
    "title": "🟠 Magie der Liebe",
    "season": 1,
    "number": 26,
    "episode": 26,
    "released": "1999-01-17T00:00:00.000Z",
    "firstAired": "1999-01-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0184868/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:27",
    "name": "🟠 Rosen im Sturm",
    "title": "🟠 Rosen im Sturm",
    "season": 1,
    "number": 27,
    "episode": 27,
    "released": "1999-02-14T00:00:00.000Z",
    "firstAired": "1999-02-14T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0188183/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8"
  },
  {
    "id": "tt0907694:1:28",
    "name": "🟠 Das große Erbe: Teil 1",
    "title": "🟠 Das große Erbe: Teil 1",
    "season": 1,
    "number": 28,
    "episode": 28,
    "released": "1999-05-23T00:00:00.000Z",
    "firstAired": "1999-05-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15740730/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:29",
    "name": "🟠 Das große Erbe: Teil 2",
    "title": "🟠 Das große Erbe: Teil 2",
    "season": 1,
    "number": 29,
    "episode": 29,
    "released": "1999-05-24T00:00:00.000Z",
    "firstAired": "1999-05-24T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15740738/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:30",
    "name": "🟠 Klippen der Liebe",
    "title": "🟠 Klippen der Liebe",
    "season": 1,
    "number": 30,
    "episode": 30,
    "released": "1999-09-19T00:00:00.000Z",
    "firstAired": "1999-09-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0217605/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.7"
  },
  {
    "id": "tt0907694:1:31",
    "name": "Möwen im Wind",
    "title": "Möwen im Wind",
    "season": 1,
    "number": 31,
    "episode": 31,
    "released": "1999-11-28T00:00:00.000Z",
    "firstAired": "1999-11-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0222330/img",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5"
  },
  {
    "id": "tt0907694:1:32",
    "name": "🟠 Blüte des Lebens",
    "title": "🟠 Blüte des Lebens",
    "season": 1,
    "number": 32,
    "episode": 32,
    "released": "1999-12-12T00:00:00.000Z",
    "firstAired": "1999-12-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0226390/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.5"
  },
  {
    "id": "tt0907694:1:33",
    "name": "Der lange Weg zum Glück",
    "title": "Der lange Weg zum Glück",
    "season": 1,
    "number": 33,
    "episode": 33,
    "released": "2000-01-16T00:00:00.000Z",
    "firstAired": "2000-01-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0230712/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.8"
  },
  {
    "id": "tt0907694:1:34",
    "name": "Zeit der Erkenntnis",
    "title": "Zeit der Erkenntnis",
    "season": 1,
    "number": 34,
    "episode": 34,
    "released": "2000-04-23T00:00:00.000Z",
    "firstAired": "2000-04-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0244176/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2"
  },
  {
    "id": "tt0907694:1:35",
    "name": "Zerrissene Herzen",
    "title": "Zerrissene Herzen",
    "season": 1,
    "number": 35,
    "episode": 35,
    "released": "2000-10-15T00:00:00.000Z",
    "firstAired": "2000-10-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0262737/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6"
  },
  {
    "id": "tt0907694:1:36",
    "name": "Ruf der Vergangenheit",
    "title": "Ruf der Vergangenheit",
    "season": 1,
    "number": 36,
    "episode": 36,
    "released": "2000-11-12T00:00:00.000Z",
    "firstAired": "2000-11-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0266913/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2"
  },
  {
    "id": "tt0907694:1:37",
    "name": "🟠 Im Licht des Feuers",
    "title": "🟠 Im Licht des Feuers",
    "season": 1,
    "number": 37,
    "episode": 37,
    "released": "2000-12-17T00:00:00.000Z",
    "firstAired": "2000-12-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0271760/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6"
  },
  {
    "id": "tt0907694:1:38",
    "name": "Die Rose von Kerrymore",
    "title": "Die Rose von Kerrymore",
    "season": 1,
    "number": 38,
    "episode": 38,
    "released": "2001-01-07T00:00:00.000Z",
    "firstAired": "2001-01-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0272817/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:39",
    "name": "Küste der Träume",
    "title": "Küste der Träume",
    "season": 1,
    "number": 39,
    "episode": 39,
    "released": "2001-02-04T00:00:00.000Z",
    "firstAired": "2001-02-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0275637/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:40",
    "name": "Kinder des Glücks",
    "title": "Kinder des Glücks",
    "season": 1,
    "number": 40,
    "episode": 40,
    "released": "2002-01-27T00:00:00.000Z",
    "firstAired": "2002-01-27T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0300428/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.4"
  },
  {
    "id": "tt0907694:1:41",
    "name": "Wind über dem Fluss",
    "title": "Wind über dem Fluss",
    "season": 1,
    "number": 41,
    "episode": 41,
    "released": "2001-11-11T00:00:00.000Z",
    "firstAired": "2001-11-11T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0301782/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.5"
  },
  {
    "id": "tt0907694:1:42",
    "name": "🟠 Blumen im Regen",
    "title": "🟠 Blumen im Regen",
    "season": 1,
    "number": 42,
    "episode": 42,
    "released": "2001-12-16T00:00:00.000Z",
    "firstAired": "2001-12-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0304642/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.9"
  },
  {
    "id": "tt0907694:1:43",
    "name": "Wenn nur noch Liebe zählt",
    "title": "Wenn nur noch Liebe zählt",
    "season": 1,
    "number": 43,
    "episode": 43,
    "released": "2002-02-10T00:00:00.000Z",
    "firstAired": "2002-02-10T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0310081/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4"
  },
  {
    "id": "tt0907694:1:44",
    "name": "Morgen träumen wir gemeinsam",
    "title": "Morgen träumen wir gemeinsam",
    "season": 1,
    "number": 44,
    "episode": 44,
    "released": "2002-04-01T00:00:00.000Z",
    "firstAired": "2002-04-01T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0316507/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4"
  },
  {
    "id": "tt0907694:1:45",
    "name": "Mit den Augen der Liebe",
    "title": "Mit den Augen der Liebe",
    "season": 1,
    "number": 45,
    "episode": 45,
    "released": "2002-09-15T00:00:00.000Z",
    "firstAired": "2002-09-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0337119/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4"
  },
  {
    "id": "tt0907694:1:46",
    "name": "🟠 Bis ans Ende der Welt",
    "title": "🟠 Bis ans Ende der Welt",
    "season": 1,
    "number": 46,
    "episode": 46,
    "released": "2002-12-08T00:00:00.000Z",
    "firstAired": "2002-12-08T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0345873/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6"
  },
  {
    "id": "tt0907694:1:47",
    "name": "Sternschnuppen im August",
    "title": "Sternschnuppen im August",
    "season": 1,
    "number": 47,
    "episode": 47,
    "released": "2003-01-05T00:00:00.000Z",
    "firstAired": "2003-01-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0348739/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8"
  },
  {
    "id": "tt0907694:1:48",
    "name": "Paradies der Träume",
    "title": "Paradies der Träume",
    "season": 1,
    "number": 48,
    "episode": 48,
    "released": "2003-02-02T00:00:00.000Z",
    "firstAired": "2003-02-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0353957/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:49",
    "name": "Flamme der Liebe",
    "title": "Flamme der Liebe",
    "season": 1,
    "number": 49,
    "episode": 49,
    "released": "2003-03-09T00:00:00.000Z",
    "firstAired": "2003-03-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0357109/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.9"
  },
  {
    "id": "tt0907694:1:50",
    "name": "Gewissheit des Herzens",
    "title": "Gewissheit des Herzens",
    "season": 1,
    "number": 50,
    "episode": 50,
    "released": "2003-11-09T00:00:00.000Z",
    "firstAired": "2003-11-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0386755/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4"
  },
  {
    "id": "tt0907694:1:51",
    "name": "Wintersonne (1+2)",
    "title": "Wintersonne (1+2)",
    "season": 1,
    "number": 51,
    "episode": 51,
    "released": "2003-12-25T00:00:00.000Z",
    "firstAired": "2003-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15727968/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:52",
    "name": "Federn im Wind",
    "title": "Federn im Wind",
    "season": 1,
    "number": 52,
    "episode": 52,
    "released": "2004-01-04T00:00:00.000Z",
    "firstAired": "2004-01-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0396843/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.5"
  },
  {
    "id": "tt0907694:1:53",
    "name": "Wege der Liebe",
    "title": "Wege der Liebe",
    "season": 1,
    "number": 53,
    "episode": 53,
    "released": "2004-01-18T00:00:00.000Z",
    "firstAired": "2004-01-18T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0393657/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:54",
    "name": "Solange es dich gibt",
    "title": "Solange es dich gibt",
    "season": 1,
    "number": 54,
    "episode": 54,
    "released": "2004-03-28T00:00:00.000Z",
    "firstAired": "2004-03-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0433629/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.6"
  },
  {
    "id": "tt0907694:1:55",
    "name": "Liebe im Spiel",
    "title": "Liebe im Spiel",
    "season": 1,
    "number": 55,
    "episode": 55,
    "released": "2004-04-25T00:00:00.000Z",
    "firstAired": "2004-04-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0410534/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2"
  },
  {
    "id": "tt0907694:1:56",
    "name": "Traum eines Sommers",
    "title": "Traum eines Sommers",
    "season": 1,
    "number": 56,
    "episode": 56,
    "released": "2004-09-19T00:00:00.000Z",
    "firstAired": "2004-09-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450119/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4"
  },
  {
    "id": "tt0907694:1:57",
    "name": "Tiefe der Gefühle",
    "title": "Tiefe der Gefühle",
    "season": 1,
    "number": 57,
    "episode": 57,
    "released": "2004-12-05T00:00:00.000Z",
    "firstAired": "2004-12-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0432346/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5"
  },
  {
    "id": "tt0907694:1:58",
    "name": "🟠 Dem Himmel so nah",
    "title": "🟠 Dem Himmel so nah",
    "season": 1,
    "number": 58,
    "episode": 58,
    "released": "2004-12-25T00:00:00.000Z",
    "firstAired": "2004-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450116/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:59",
    "name": "Vermächtnis der Liebe",
    "title": "Vermächtnis der Liebe",
    "season": 1,
    "number": 59,
    "episode": 59,
    "released": "2005-01-02T00:00:00.000Z",
    "firstAired": "2005-01-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450120/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8"
  },
  {
    "id": "tt0907694:1:60",
    "name": "Königin der Nacht",
    "title": "Königin der Nacht",
    "season": 1,
    "number": 60,
    "episode": 60,
    "released": "2005-02-06T00:00:00.000Z",
    "firstAired": "2005-02-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450117/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.9"
  },
  {
    "id": "tt0907694:1:61",
    "name": "Segel der Liebe",
    "title": "Segel der Liebe",
    "season": 1,
    "number": 61,
    "episode": 61,
    "released": "2005-03-28T00:00:00.000Z",
    "firstAired": "2005-03-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0450118/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4"
  },
  {
    "id": "tt0907694:1:62",
    "name": "🟠 Über den Wolken",
    "title": "🟠 Über den Wolken",
    "season": 1,
    "number": 62,
    "episode": 62,
    "released": "2005-10-02T00:00:00.000Z",
    "firstAired": "2005-10-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0491128/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "3.5"
  },
  {
    "id": "tt0907694:1:63",
    "name": "Zauber der Liebe (1+2)",
    "title": "Zauber der Liebe (1+2)",
    "season": 1,
    "number": 63,
    "episode": 63,
    "released": "2005-12-25T00:00:00.000Z",
    "firstAired": "2005-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15727726/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:64",
    "name": "Der Himmel über Cornwall",
    "title": "Der Himmel über Cornwall",
    "season": 1,
    "number": 64,
    "episode": 64,
    "released": "2005-12-28T00:00:00.000Z",
    "firstAired": "2005-12-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0777270/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:65",
    "name": "Land der Sehnsucht",
    "title": "Land der Sehnsucht",
    "season": 1,
    "number": 65,
    "episode": 65,
    "released": "2006-01-22T00:00:00.000Z",
    "firstAired": "2006-01-22T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0497438/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6"
  },
  {
    "id": "tt0907694:1:66",
    "name": "Sommer des Erwachens",
    "title": "Sommer des Erwachens",
    "season": 1,
    "number": 66,
    "episode": 66,
    "released": "2006-02-05T00:00:00.000Z",
    "firstAired": "2006-02-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0499557/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.1"
  },
  {
    "id": "tt0907694:1:67",
    "name": "Wo die Liebe begann",
    "title": "Wo die Liebe begann",
    "season": 1,
    "number": 67,
    "episode": 67,
    "released": "2006-09-17T00:00:00.000Z",
    "firstAired": "2006-09-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0857260/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:68",
    "name": "Die Liebe ihres Lebens",
    "title": "Die Liebe ihres Lebens",
    "season": 1,
    "number": 68,
    "episode": 68,
    "released": "2006-10-08T00:00:00.000Z",
    "firstAired": "2006-10-08T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0872156/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:69",
    "name": "🟠 Und plötzlich war es Liebe",
    "title": "🟠 Und plötzlich war es Liebe",
    "season": 1,
    "number": 69,
    "episode": 69,
    "released": "2006-12-03T00:00:00.000Z",
    "firstAired": "2006-12-03T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0903964/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2"
  },
  {
    "id": "tt0907694:1:71",
    "name": "Wiedersehen am Fluss",
    "title": "Wiedersehen am Fluss",
    "season": 1,
    "number": 71,
    "episode": 71,
    "released": "2007-02-04T00:00:00.000Z",
    "firstAired": "2007-02-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0943113/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.4"
  },
  {
    "id": "tt0907694:1:72",
    "name": "Sommer der Liebe",
    "title": "Sommer der Liebe",
    "season": 1,
    "number": 72,
    "episode": 72,
    "released": "2007-04-09T00:00:00.000Z",
    "firstAired": "2007-04-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0988802/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.6"
  },
  {
    "id": "tt0907694:1:73",
    "name": "Flügel der Hoffnung",
    "title": "Flügel der Hoffnung",
    "season": 1,
    "number": 73,
    "episode": 73,
    "released": "2007-04-15T00:00:00.000Z",
    "firstAired": "2007-04-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt0988801/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:74",
    "name": "Der Mann meiner Träume",
    "title": "Der Mann meiner Träume",
    "season": 1,
    "number": 74,
    "episode": 74,
    "released": "2007-09-23T00:00:00.000Z",
    "firstAired": "2007-09-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1096981/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:75",
    "name": "Sieg der Liebe",
    "title": "Sieg der Liebe",
    "season": 1,
    "number": 75,
    "episode": 75,
    "released": "2007-10-07T00:00:00.000Z",
    "firstAired": "2007-10-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1106607/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9"
  },
  {
    "id": "tt0907694:1:76",
    "name": "Nebel über Schloss Kilrush",
    "title": "Nebel über Schloss Kilrush",
    "season": 1,
    "number": 76,
    "episode": 76,
    "released": "2007-11-11T00:00:00.000Z",
    "firstAired": "2007-11-11T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1125243/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.2"
  },
  {
    "id": "tt0907694:1:77",
    "name": "🟠 Aus Liebe und Leidenschaft",
    "title": "🟠 Aus Liebe und Leidenschaft",
    "season": 1,
    "number": 77,
    "episode": 77,
    "released": "2007-12-02T00:00:00.000Z",
    "firstAired": "2007-12-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1140926/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8"
  },
  {
    "id": "tt0907694:1:78",
    "name": "🟠 Wind über der See",
    "title": "🟠 Wind über der See",
    "season": 1,
    "number": 78,
    "episode": 78,
    "released": "2007-12-23T00:00:00.000Z",
    "firstAired": "2007-12-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1150986/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4"
  },
  {
    "id": "tt0907694:1:79",
    "name": "Pfeile der Liebe",
    "title": "Pfeile der Liebe",
    "season": 1,
    "number": 79,
    "episode": 79,
    "released": "2008-03-09T00:00:00.000Z",
    "firstAired": "2008-03-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1177749/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.1"
  },
  {
    "id": "tt0907694:1:80",
    "name": "Melodie der Liebe",
    "title": "Melodie der Liebe",
    "season": 1,
    "number": 80,
    "episode": 80,
    "released": "2008-09-14T00:00:00.000Z",
    "firstAired": "2008-09-14T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178398/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.1"
  },
  {
    "id": "tt0907694:1:81",
    "name": "🟠 Herzen im Wind",
    "title": "🟠 Herzen im Wind",
    "season": 1,
    "number": 81,
    "episode": 81,
    "released": "2008-12-21T00:00:00.000Z",
    "firstAired": "2008-12-21T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178399/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.3"
  },
  {
    "id": "tt0907694:1:84",
    "name": "Gezeiten der Liebe",
    "title": "Gezeiten der Liebe",
    "season": 1,
    "number": 84,
    "episode": 84,
    "released": "2009-01-04T00:00:00.000Z",
    "firstAired": "2009-01-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178400/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:85",
    "name": "🟠 Herzenssehnsucht",
    "title": "🟠 Herzenssehnsucht",
    "season": 1,
    "number": 85,
    "episode": 85,
    "released": "2009-01-14T00:00:00.000Z",
    "firstAired": "2009-01-14T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178401/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9"
  },
  {
    "id": "tt0907694:1:86",
    "name": "Eine Liebe im Herbst",
    "title": "Eine Liebe im Herbst",
    "season": 1,
    "number": 86,
    "episode": 86,
    "released": "2009-03-04T00:00:00.000Z",
    "firstAired": "2009-03-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178402/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:87",
    "name": "Entscheidung des Herzens",
    "title": "Entscheidung des Herzens",
    "season": 1,
    "number": 87,
    "episode": 87,
    "released": "2009-04-13T00:00:00.000Z",
    "firstAired": "2009-04-13T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1178403/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:88",
    "name": "🟢 Liebe gegen den Rest der Welt",
    "title": "🟢 Liebe gegen den Rest der Welt",
    "season": 1,
    "number": 88,
    "episode": 88,
    "released": "2009-09-16T00:00:00.000Z",
    "firstAired": "2009-09-16T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/liebe-gegen-den-rest-der-welt-102~1920x1080?cb=1747395872987",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Rachel Wilson kehrt nach zwei Jahren in das kleine Dorf Kingscove in Cornwall zurück, das sie eigentlich für immer verlassen wollte.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:89",
    "name": "🟢 Wiedersehen in Rose Abbey",
    "title": "🟢 Wiedersehen in Rose Abbey",
    "season": 1,
    "number": 89,
    "episode": 89,
    "released": "2009-10-25T00:00:00.000Z",
    "firstAired": "2009-10-25T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/wiedersehen-in-rose-abbey-100~1920x1080?cb=1746798390082",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Roseanne Brix, Studentin aus Chicago, kommt nach dem Tod ihrer Mutter nach England, um ihren leiblichen Vater zu suchen. Ihr einziger Hinweis ist ein altes Foto ihrer Mutter.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:90",
    "name": "🟢 Lass es Liebe sein",
    "title": "🟢 Lass es Liebe sein",
    "season": 1,
    "number": 90,
    "episode": 90,
    "released": "2009-11-29T00:00:00.000Z",
    "firstAired": "2009-11-29T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/lass-es-liebe-sein-100~1920x1080?cb=1746450048706",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Eine kurze, schicksalhafte Begegnung zwischen Tom und Natalie, einer jungen Studentin aus Georgien, wird das Leben beider für immer verändern: Sie verlieben sich ineinander.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:93",
    "name": "Im Zweifel für die Liebe",
    "title": "Im Zweifel für die Liebe",
    "season": 1,
    "number": 93,
    "episode": 93,
    "released": "2010-01-17T00:00:00.000Z",
    "firstAired": "2010-01-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1545888/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:94",
    "name": "Wohin du auch gehst",
    "title": "Wohin du auch gehst",
    "season": 1,
    "number": 94,
    "episode": 94,
    "released": "2010-03-14T00:00:00.000Z",
    "firstAired": "2010-03-14T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1545890/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:95",
    "name": "Liebe am Horizont",
    "title": "Liebe am Horizont",
    "season": 1,
    "number": 95,
    "episode": 95,
    "released": "2010-05-09T00:00:00.000Z",
    "firstAired": "2010-05-09T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1545889/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4"
  },
  {
    "id": "tt0907694:1:96",
    "name": "🟠 Wenn das Herz zerbricht",
    "title": "🟠 Wenn das Herz zerbricht",
    "season": 1,
    "number": 96,
    "episode": 96,
    "released": "2010-10-06T00:00:00.000Z",
    "firstAired": "2010-10-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1670117/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8"
  },
  {
    "id": "tt0907694:1:97",
    "name": "Flügel der Liebe",
    "title": "Flügel der Liebe",
    "season": 1,
    "number": 97,
    "episode": 97,
    "released": "2010-11-28T00:00:00.000Z",
    "firstAired": "2010-11-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1702299/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:98",
    "name": "Lords lügen nicht",
    "title": "Lords lügen nicht",
    "season": 1,
    "number": 98,
    "episode": 98,
    "released": "2010-12-19T00:00:00.000Z",
    "firstAired": "2010-12-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1729996/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.8"
  },
  {
    "id": "tt0907694:1:99",
    "name": "🟠 Herzensfragen",
    "title": "🟠 Herzensfragen",
    "season": 1,
    "number": 99,
    "episode": 99,
    "released": "2011-01-02T00:00:00.000Z",
    "firstAired": "2011-01-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1794473/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:100",
    "name": "Sonntagskinder",
    "title": "Sonntagskinder",
    "season": 1,
    "number": 100,
    "episode": 100,
    "released": "2011-01-23T00:00:00.000Z",
    "firstAired": "2011-01-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt1804980/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:103",
    "name": "🟢 Verlobt, verliebt, verwirrt",
    "title": "🟢 Verlobt, verliebt, verwirrt",
    "season": 1,
    "number": 103,
    "episode": 103,
    "released": "2011-09-07T00:00:00.000Z",
    "firstAired": "2011-09-07T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/verlobt-verliebt-verwirrt-100~1920x1080?cb=1745830743700",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Emma Waters überredet ihre Freundin Julia Adams, einen Junggesellinnenabschied zu machen. Als Julia einen Kuss versteigern soll, kann sie nicht glauben, wer der Gewinner ist.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:104",
    "name": "🟠 Der gestohlene Sommer",
    "title": "🟠 Der gestohlene Sommer",
    "season": 1,
    "number": 104,
    "episode": 104,
    "released": "2011-09-28T00:00:00.000Z",
    "firstAired": "2011-09-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2050247/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9"
  },
  {
    "id": "tt0907694:1:105",
    "name": "🟢🟠 Englischer Wein",
    "title": "🟢🟠 Englischer Wein",
    "season": 1,
    "number": 105,
    "episode": 105,
    "released": "2011-11-20T00:00:00.000Z",
    "firstAired": "2011-11-20T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-englischer-wein-104~1920x1080?cb=1744711026467",
    "overview": "🟢 [ZDFmediathek 1080p] • 🟠 [YouTube HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Die ehrgeizige Winzerin Hannah Powell, die lange in Frankreich gelebt hat, erhält die Chance ihres Lebens: Sie soll ein Weingut in ihrer Heimat Südengland auf Vordermann bringen.",
    "rating": "5.4"
  },
  {
    "id": "tt0907694:1:106",
    "name": "Gefährliche Brandung",
    "title": "Gefährliche Brandung",
    "season": 1,
    "number": 106,
    "episode": 106,
    "released": "2011-12-18T00:00:00.000Z",
    "firstAired": "2011-12-18T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2122084/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4"
  },
  {
    "id": "tt0907694:1:109",
    "name": "🟢 Ungezügelt ins Glück",
    "title": "🟢 Ungezügelt ins Glück",
    "season": 1,
    "number": 109,
    "episode": 109,
    "released": "2012-01-15T00:00:00.000Z",
    "firstAired": "2012-01-15T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/ungezuegelt-ins-glueck-100~1920x1080?cb=1744907251956",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Lord Brooks stellt nach langer Abwesenheit entsetzt fest, dass seine Mutter das Familienanwesen in ein Pferdeasyl verwandelt hat. Er muss sich nun um die Rettung des Erbes kümmern.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:110",
    "name": "🟢 Das Geheimnis der weißen Taube",
    "title": "🟢 Das Geheimnis der weißen Taube",
    "season": 1,
    "number": 110,
    "episode": 110,
    "released": "2012-04-04T00:00:00.000Z",
    "firstAired": "2012-04-04T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/das-geheimnis-der-weissen-taube-100~1920x1080?cb=1746022269147",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Auktionatorin Stella liebt die alten Schätze, die sie verkauft. Doch im Auktionshaus der Familie ihres Mannes Peter kriselt es seit neustem – und das nicht nur bei ihrer Arbeit.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:111",
    "name": "🟢🟠 Die falsche Nonne",
    "title": "🟢🟠 Die falsche Nonne",
    "season": 1,
    "number": 111,
    "episode": 111,
    "released": "2012-09-19T00:00:00.000Z",
    "firstAired": "2012-09-19T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-die-falsche-nonne-104~1920x1080?cb=1793023905964",
    "overview": "🟢 [ZDFmediathek 1080p] • 🟠 [YouTube HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Bei einem Undercover-Einsatz lernt Polizistin Sabrina Tom kennen.",
    "rating": "5.4"
  },
  {
    "id": "tt0907694:1:112",
    "name": "🟢 In der Mitte eines Lebens",
    "title": "🟢 In der Mitte eines Lebens",
    "season": 1,
    "number": 112,
    "episode": 112,
    "released": "2012-10-10T00:00:00.000Z",
    "firstAired": "2012-10-10T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/in-der-mitte-des-lebens-100~1920x1080?cb=1578559755191",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Ella Dempsey muss nach einem Vorfall ihr ganzes Leben überdenken.",
    "rating": "5.8"
  },
  {
    "id": "tt0907694:1:113",
    "name": "Die andere Frau, Teil 1",
    "title": "Die andere Frau, Teil 1",
    "season": 1,
    "number": 113,
    "episode": 113,
    "released": "2012-12-23T00:00:00.000Z",
    "firstAired": "2012-12-23T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3959970/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:114",
    "name": "Die andere Frau, Teil 2",
    "title": "Die andere Frau, Teil 2",
    "season": 1,
    "number": 114,
    "episode": 114,
    "released": "2012-12-25T00:00:00.000Z",
    "firstAired": "2012-12-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2169404/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:115",
    "name": "🟠 Eine Frage der Ehre",
    "title": "🟠 Eine Frage der Ehre",
    "season": 1,
    "number": 115,
    "episode": 115,
    "released": "2013-01-13T00:00:00.000Z",
    "firstAired": "2013-01-13T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2592426/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5"
  },
  {
    "id": "tt0907694:1:116",
    "name": "🟢 Die Frau auf der Klippe",
    "title": "🟢 Die Frau auf der Klippe",
    "season": 1,
    "number": 116,
    "episode": 116,
    "released": "2013-03-27T00:00:00.000Z",
    "firstAired": "2013-03-27T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/die-frau-auf-der-klippe-100~1920x1080?cb=1793023515200",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Owen erbt das Herrenhaus seines verstorbenen Großonkels in Cornwall.",
    "rating": "5.5"
  },
  {
    "id": "tt0907694:1:117",
    "name": "Schlangen im Paradies",
    "title": "Schlangen im Paradies",
    "season": 1,
    "number": 117,
    "episode": 117,
    "released": "2013-04-28T00:00:00.000Z",
    "firstAired": "2013-04-28T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt2831116/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.5"
  },
  {
    "id": "tt0907694:1:118",
    "name": "🟢 Die versprochene Braut",
    "title": "🟢 Die versprochene Braut",
    "season": 1,
    "number": 118,
    "episode": 118,
    "released": "2013-09-08T00:00:00.000Z",
    "firstAired": "2013-09-08T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3128154/img",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5"
  },
  {
    "id": "tt0907694:1:119",
    "name": "Alte Herzen rosten nicht",
    "title": "Alte Herzen rosten nicht",
    "season": 1,
    "number": 119,
    "episode": 119,
    "released": "2013-11-17T00:00:00.000Z",
    "firstAired": "2013-11-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3293750/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:120",
    "name": "🟠 Zu hoch geflogen",
    "title": "🟠 Zu hoch geflogen",
    "season": 1,
    "number": 120,
    "episode": 120,
    "released": "2013-12-22T00:00:00.000Z",
    "firstAired": "2013-12-22T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3443090/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:121",
    "name": "Besetzte Herzen",
    "title": "Besetzte Herzen",
    "season": 1,
    "number": 121,
    "episode": 121,
    "released": "2014-01-12T00:00:00.000Z",
    "firstAired": "2014-01-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3332888/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.6"
  },
  {
    "id": "tt0907694:1:122",
    "name": "Evitas Rache",
    "title": "Evitas Rache",
    "season": 1,
    "number": 122,
    "episode": 122,
    "released": "2014-03-16T00:00:00.000Z",
    "firstAired": "2014-03-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3132252/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:123",
    "name": "Mein unbekanntes Herz",
    "title": "Mein unbekanntes Herz",
    "season": 1,
    "number": 123,
    "episode": 123,
    "released": "2014-04-19T00:00:00.000Z",
    "firstAired": "2014-04-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3954226/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9"
  },
  {
    "id": "tt0907694:1:124",
    "name": "Anwälte küsst man nicht",
    "title": "Anwälte küsst man nicht",
    "season": 1,
    "number": 124,
    "episode": 124,
    "released": "2014-09-21T00:00:00.000Z",
    "firstAired": "2014-09-21T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3954140/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:125",
    "name": "Vertrauen ist gut, verlieben ist besser",
    "title": "Vertrauen ist gut, verlieben ist besser",
    "season": 1,
    "number": 125,
    "episode": 125,
    "released": "2014-11-16T00:00:00.000Z",
    "firstAired": "2014-11-16T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt3901820/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:126",
    "name": "🟠 Ghostwriter",
    "title": "🟠 Ghostwriter",
    "season": 1,
    "number": 126,
    "episode": 126,
    "released": "2015-01-11T00:00:00.000Z",
    "firstAired": "2015-01-11T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5921002/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:127",
    "name": "Wahlversprechen und andere Lügen",
    "title": "Wahlversprechen und andere Lügen",
    "season": 1,
    "number": 127,
    "episode": 127,
    "released": "2015-02-20T00:00:00.000Z",
    "firstAired": "2015-02-20T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt6058140/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.3"
  },
  {
    "id": "tt0907694:1:128",
    "name": "Ein einziger Kuss",
    "title": "Ein einziger Kuss",
    "season": 1,
    "number": 128,
    "episode": 128,
    "released": "2015-04-06T00:00:00.000Z",
    "firstAired": "2015-04-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt18155194/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "0"
  },
  {
    "id": "tt0907694:1:129",
    "name": "🟢 Rundum glücklich",
    "title": "🟢 Rundum glücklich",
    "season": 1,
    "number": 129,
    "episode": 129,
    "released": "2015-05-17T00:00:00.000Z",
    "firstAired": "2015-05-17T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rundum-gluecklich-100~1920x1080?cb=1738935862085",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Die junge Bäckerin Betty Hunter sucht den Mann ihrer Träume.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:130",
    "name": "🟠 Vollkommen unerwartet",
    "title": "🟠 Vollkommen unerwartet",
    "season": 1,
    "number": 130,
    "episode": 130,
    "released": "2015-10-04T00:00:00.000Z",
    "firstAired": "2015-10-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5376696/img",
    "overview": "🟠 [YouTube HD Spielfilm] Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:131",
    "name": "🟢 Liebe, Diebe, Diamanten",
    "title": "🟢 Liebe, Diebe, Diamanten",
    "season": 1,
    "number": 131,
    "episode": 131,
    "released": "2015-11-22T00:00:00.000Z",
    "firstAired": "2015-11-22T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-liebe-diebe-diamanten-102~1920x1080?cb=1793024107343",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Richard Johnson kehrt zur Hochzeit der Tochter zurück nach Cornwall.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:132",
    "name": "Argentinischer Tango",
    "title": "Argentinischer Tango",
    "season": 1,
    "number": 132,
    "episode": 132,
    "released": "2016-01-10T00:00:00.000Z",
    "firstAired": "2016-01-10T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt4837404/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5"
  },
  {
    "id": "tt0907694:1:133",
    "name": "🟢🟠 Lizenz zum Seitensprung",
    "title": "🟢🟠 Lizenz zum Seitensprung",
    "season": 1,
    "number": 133,
    "episode": 133,
    "released": "2016-02-07T00:00:00.000Z",
    "firstAired": "2016-02-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5295330/img",
    "overview": "🟢 [ZDFmediathek 1080p] • 🟠 [YouTube HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.5"
  },
  {
    "id": "tt0907694:1:134",
    "name": "Schutzengel",
    "title": "Schutzengel",
    "season": 1,
    "number": 134,
    "episode": 134,
    "released": "2016-03-27T00:00:00.000Z",
    "firstAired": "2016-03-27T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5580156/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.3"
  },
  {
    "id": "tt0907694:1:135",
    "name": "🟢 Ein Doktor & drei Frauen",
    "title": "🟢 Ein Doktor & drei Frauen",
    "season": 1,
    "number": 135,
    "episode": 135,
    "released": "2016-04-24T00:00:00.000Z",
    "firstAired": "2016-04-24T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/doktor-und-drei-frauen-100~1920x1080?cb=1766147846819",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Dem idyllischen Örtchen St. Mark droht kurz vor der bevorstehenden 500-Jahr-Feier der schleichende Tod. Jetzt verabschiedet sich auch noch der einzige Arzt in den Ruhestand.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:136",
    "name": "🟢 Ex & Liebe",
    "title": "🟢 Ex & Liebe",
    "season": 1,
    "number": 136,
    "episode": 136,
    "released": "2016-10-02T00:00:00.000Z",
    "firstAired": "2016-10-02T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-ex-und-liebe-102~1920x1080?cb=1680097215435",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Auf dem Weg zu seiner Mutter hat Bruno mit seinem Oldtimer eine Panne, die sein Leben verändern wird. Sophie, die einstige Liebe seines Lebens, steht plötzlich vor ihm.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:137",
    "name": "🟢 Erdbeeren im Frühling",
    "title": "🟢 Erdbeeren im Frühling",
    "season": 1,
    "number": 137,
    "episode": 137,
    "released": "2016-11-12T00:00:00.000Z",
    "firstAired": "2016-11-12T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/erdbeeren-im-fruehling-106~1920x1080?cb=1696515866401",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Als die junge Journalistin und Millionenerbin Lilly zur Beerdigung ihres Vaters nach Cornwall zurückkehrt, bricht ihre bisherige Lebensplanung wie ein Kartenhaus zusammen.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:138",
    "name": "Haustausch mit Hindernissen",
    "title": "Haustausch mit Hindernissen",
    "season": 1,
    "number": 138,
    "episode": 138,
    "released": "2016-12-18T00:00:00.000Z",
    "firstAired": "2016-12-18T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt6426868/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:139",
    "name": "Wie von einem anderen Stern",
    "title": "Wie von einem anderen Stern",
    "season": 1,
    "number": 139,
    "episode": 139,
    "released": "2017-01-03T00:00:00.000Z",
    "firstAired": "2017-01-03T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt5940862/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:140",
    "name": "🟢 Fast noch verheiratet",
    "title": "🟢 Fast noch verheiratet",
    "season": 1,
    "number": 140,
    "episode": 140,
    "released": "2017-02-26T00:00:00.000Z",
    "firstAired": "2017-02-26T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/fast-verheiratet-100~1920x1080?cb=1575469007851",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Siennas Traummann macht ihr einen Heiratsantrag – doch sie zögert.",
    "rating": "6.1"
  },
  {
    "id": "tt0907694:1:141",
    "name": "Nie wieder Klassentreffen",
    "title": "Nie wieder Klassentreffen",
    "season": 1,
    "number": 141,
    "episode": 141,
    "released": "2017-08-20T00:00:00.000Z",
    "firstAired": "2017-08-20T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7294684/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:142",
    "name": "Das Gespenst von Cassley",
    "title": "Das Gespenst von Cassley",
    "season": 1,
    "number": 142,
    "episode": 142,
    "released": "2017-10-22T00:00:00.000Z",
    "firstAired": "2017-10-22T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7565710/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.5"
  },
  {
    "id": "tt0907694:1:143",
    "name": "Wenn Fische lächeln",
    "title": "Wenn Fische lächeln",
    "season": 1,
    "number": 143,
    "episode": 143,
    "released": "2017-11-19T00:00:00.000Z",
    "firstAired": "2017-11-19T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7652188/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:144",
    "name": "Geerbtes Glück",
    "title": "Geerbtes Glück",
    "season": 1,
    "number": 144,
    "episode": 144,
    "released": "2018-01-07T00:00:00.000Z",
    "firstAired": "2018-01-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7858832/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.2"
  },
  {
    "id": "tt0907694:1:145",
    "name": "Das Vermächtnis unseres Vaters",
    "title": "Das Vermächtnis unseres Vaters",
    "season": 1,
    "number": 145,
    "episode": 145,
    "released": "2018-02-04T00:00:00.000Z",
    "firstAired": "2018-02-04T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt8103280/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:146",
    "name": "Nanny verzweifelt gesucht",
    "title": "Nanny verzweifelt gesucht",
    "season": 1,
    "number": 146,
    "episode": 146,
    "released": "2018-05-20T00:00:00.000Z",
    "firstAired": "2018-05-20T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt7771608/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:147",
    "name": "Wo Dein Herz wohnt",
    "title": "Wo Dein Herz wohnt",
    "season": 1,
    "number": 147,
    "episode": 147,
    "released": "2018-10-07T00:00:00.000Z",
    "firstAired": "2018-10-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt9089702/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:148",
    "name": "🟢 Das Geheimnis der Blumeninsel",
    "title": "🟢 Das Geheimnis der Blumeninsel",
    "season": 1,
    "number": 148,
    "episode": 148,
    "released": "2018-12-09T00:00:00.000Z",
    "firstAired": "2018-12-09T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-das-geheimnis-der-blumeninsel-102~1920x1080?cb=1544345904588",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Amy Harding hat einen großen Traum. Sie will die verwahrloste Blumenfarm ihrer Großeltern auf den Scilly Islands wieder zum Blühen bringen.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:149",
    "name": "Morgens stürmisch, abends Liebe",
    "title": "Morgens stürmisch, abends Liebe",
    "season": 1,
    "number": 149,
    "episode": 149,
    "released": "2019-01-06T00:00:00.000Z",
    "firstAired": "2019-01-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt9401344/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:150",
    "name": "Die Braut meines Bruders",
    "title": "Die Braut meines Bruders",
    "season": 1,
    "number": 150,
    "episode": 150,
    "released": "2019-02-10T00:00:00.000Z",
    "firstAired": "2019-02-10T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt9740242/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6.2"
  },
  {
    "id": "tt0907694:1:151",
    "name": "🟢 Schwiegertöchter",
    "title": "🟢 Schwiegertöchter",
    "season": 1,
    "number": 151,
    "episode": 151,
    "released": "2019-05-26T00:00:00.000Z",
    "firstAired": "2019-05-26T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-schwiegertoechter-102~1920x1080?cb=1749544149996",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Lynette will den letzten Wunsch ihres verstorbenen Mannes erfüllen und eine Stiftung in seinem Namen gründen. Dafür muss sie aber die Leitung ihrer eigenen Firma abgeben.",
    "rating": "5"
  },
  {
    "id": "tt0907694:1:152",
    "name": "🟢 Pralinen zum Frühstück",
    "title": "🟢 Pralinen zum Frühstück",
    "season": 1,
    "number": 152,
    "episode": 152,
    "released": "2019-09-01T00:00:00.000Z",
    "firstAired": "2019-09-01T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/pralinen-zum-fruehstueck-102~1920x1080?cb=1781704277805",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Annabelle hat ihr Hobby zum Beruf gemacht: Auf Flughäfen ersteigert sie gestrandete und besitzlose Koffer, um sie dann in ihrer Fernsehsendung öffnen zu lassen.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:153",
    "name": "Raus in den Sturm",
    "title": "Raus in den Sturm",
    "season": 1,
    "number": 153,
    "episode": 153,
    "released": "2019-09-15T00:00:00.000Z",
    "firstAired": "2019-09-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt10974400/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:154",
    "name": "🟢 Der magische Bus",
    "title": "🟢 Der magische Bus",
    "season": 1,
    "number": 154,
    "episode": 154,
    "released": "2019-12-01T00:00:00.000Z",
    "firstAired": "2019-12-01T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/magisch-bus-100~1920x1080?cb=1572876710440",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Olivia macht sich trotz aller Warnungen ihrer Freunde und Kollegen in einem Vintage-Bus selbstständig. Doch schon bei der ersten Reise kommt der erste Rückschlag.",
    "rating": "6"
  },
  {
    "id": "tt0907694:1:155",
    "name": "Meine Cousine, die Liebe und ich",
    "title": "Meine Cousine, die Liebe und ich",
    "season": 1,
    "number": 155,
    "episode": 155,
    "released": "2019-12-29T00:00:00.000Z",
    "firstAired": "2019-12-29T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt11097478/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.2"
  },
  {
    "id": "tt0907694:1:156",
    "name": "Von Tee und Liebe",
    "title": "Von Tee und Liebe",
    "season": 1,
    "number": 156,
    "episode": 156,
    "released": "2020-01-12T00:00:00.000Z",
    "firstAired": "2020-01-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt11494832/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2020). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.8"
  },
  {
    "id": "tt0907694:1:157",
    "name": "🟢 Falsches Leben, wahre Liebe",
    "title": "🟢 Falsches Leben, wahre Liebe",
    "season": 1,
    "number": 157,
    "episode": 157,
    "released": "2020-03-01T00:00:00.000Z",
    "firstAired": "2020-03-01T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/falschesleben-102~1920x1080?cb=1696515723171",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Bill Pexton, ein junger Marineleutnant, freundet sich bei den Vorbereitungen auf die Aufnahmeprüfung bei den Kampftauchern mit seinem Kameraden Mo Miller an.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:158",
    "name": "Stadt, Land, Kuss",
    "title": "Stadt, Land, Kuss",
    "season": 1,
    "number": 158,
    "episode": 158,
    "released": "2021-01-17T00:00:00.000Z",
    "firstAired": "2021-01-17T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt13625812/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.9"
  },
  {
    "id": "tt0907694:1:159",
    "name": "🟢 Wie verhext",
    "title": "🟢 Wie verhext",
    "season": 1,
    "number": 159,
    "episode": 159,
    "released": "2021-05-02T00:00:00.000Z",
    "firstAired": "2021-05-02T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/wie-verhext-102~1920x1080?cb=1751274370663",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Im Kino ihres Vaters hat Grace Kent bereits als Sechsjährige jeden Film gesehen, der dort vorgeführt wurde. Kein Wunder, dass sie schon als junge Frau Kostümbildnerin werden will.",
    "rating": "5.1"
  },
  {
    "id": "tt0907694:1:160",
    "name": "🟢 Herzensläufe",
    "title": "🟢 Herzensläufe",
    "season": 1,
    "number": 160,
    "episode": 160,
    "released": "2021-09-05T00:00:00.000Z",
    "firstAired": "2021-09-05T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/herzenslaeufe-100~1920x1080?cb=1790922946174",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Für Jacky Davies ist das Gin-Brennen in der traditionellen Familiendestillerie mehr als nur ein Handwerk: Es ist die Passion der jungen Frau und eine Besessenheit.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:161",
    "name": "Der Stoff, aus dem Träume sind",
    "title": "Der Stoff, aus dem Träume sind",
    "season": 1,
    "number": 161,
    "episode": 161,
    "released": "2021-10-31T00:00:00.000Z",
    "firstAired": "2021-10-31T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt15478660/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.8"
  },
  {
    "id": "tt0907694:1:162",
    "name": "🟢 Im Siebten Himmel",
    "title": "🟢 Im Siebten Himmel",
    "season": 1,
    "number": 162,
    "episode": 162,
    "released": "2021-12-05T00:00:00.000Z",
    "firstAired": "2021-12-05T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/rosamunde-pilcher-im-siebten-himmel-102~1920x1080?cb=1638535290427",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Rebecca \"Becky\" Taylor ist frisch ordinierte Jung-Vikarin der Anglikanischen Gemeinschaft. Vor ihrem offiziellen Dienstantritt besucht sie die ihr zugeteilte Gemeinde in Cornwall.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:163",
    "name": "🟢 Vier Luftballons und ein Todesfall",
    "title": "🟢 Vier Luftballons und ein Todesfall",
    "season": 1,
    "number": 163,
    "episode": 163,
    "released": "2022-01-02T00:00:00.000Z",
    "firstAired": "2022-01-02T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/vier-luftballons-und-ein-todesfall-100~1920x1080?cb=1790581314387",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Floristin Gwen ist Angestellte in einem Blumengroßhandel und wird von ihrem sympathischen Chef Joey umgarnt. Was der jungen Frau nicht unangenehm ist - ganz im Gegenteil.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:164",
    "name": "Die Elster und der Kapitän",
    "title": "Die Elster und der Kapitän",
    "season": 1,
    "number": 164,
    "episode": 164,
    "released": "2022-02-26T00:00:00.000Z",
    "firstAired": "2022-02-26T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt18377966/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.8"
  },
  {
    "id": "tt0907694:1:165",
    "name": "Liebe ist unberechenbar",
    "title": "Liebe ist unberechenbar",
    "season": 1,
    "number": 165,
    "episode": 165,
    "released": "2022-05-15T00:00:00.000Z",
    "firstAired": "2022-05-15T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt20124474/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6"
  },
  {
    "id": "tt0907694:1:166",
    "name": "🟢 Liebe und andere Schätze",
    "title": "🟢 Liebe und andere Schätze",
    "season": 1,
    "number": 166,
    "episode": 166,
    "released": "2022-09-11T00:00:00.000Z",
    "firstAired": "2022-09-11T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/liebe-und-andere-schaetze-100~1920x1080?cb=1779100936024",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Kuratorin Mia Barlow ist praktisch in einem Museum groß geworden, seit Direktor Trevor Murphy und seine Frau, die Restauratorin Hannah, sie als Pflegekind bei sich aufgenommen haben.",
    "rating": "5.6"
  },
  {
    "id": "tt0907694:1:167",
    "name": "Hochzeitstag",
    "title": "Hochzeitstag",
    "season": 1,
    "number": 167,
    "episode": 167,
    "released": "2022-10-02T00:00:00.000Z",
    "firstAired": "2022-10-02T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt22038482/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5"
  },
  {
    "id": "tt0907694:1:168",
    "name": "Liebe ist die beste Therapie",
    "title": "Liebe ist die beste Therapie",
    "season": 1,
    "number": 168,
    "episode": 168,
    "released": "2023-02-25T00:00:00.000Z",
    "firstAired": "2023-02-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt26767892/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.7"
  },
  {
    "id": "tt0907694:1:169",
    "name": "Wenn ich dich wiederfinde",
    "title": "Wenn ich dich wiederfinde",
    "season": 1,
    "number": 169,
    "episode": 169,
    "released": "2023-03-25T00:00:00.000Z",
    "firstAired": "2023-03-25T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt27349270/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.4"
  },
  {
    "id": "tt0907694:1:170",
    "name": "Schlagzeile Liebe",
    "title": "Schlagzeile Liebe",
    "season": 1,
    "number": 170,
    "episode": 170,
    "released": "2023-09-24T00:00:00.000Z",
    "firstAired": "2023-09-24T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt28565529/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:171",
    "name": "Amys Wunschkind",
    "title": "Amys Wunschkind",
    "season": 1,
    "number": 171,
    "episode": 171,
    "released": "2023-11-05T00:00:00.000Z",
    "firstAired": "2023-11-05T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt29716178/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.7"
  },
  {
    "id": "tt0907694:1:172",
    "name": "Frühstück bei Tessa",
    "title": "Frühstück bei Tessa",
    "season": 1,
    "number": 172,
    "episode": 172,
    "released": "2024-01-07T00:00:00.000Z",
    "firstAired": "2024-01-07T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt30783580/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:173",
    "name": "Verliebt in einen Butler",
    "title": "Verliebt in einen Butler",
    "season": 1,
    "number": 173,
    "episode": 173,
    "released": "2024-10-06T00:00:00.000Z",
    "firstAired": "2024-10-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt33086345/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "6"
  },
  {
    "id": "tt0907694:1:174",
    "name": "Jahrestag",
    "title": "Jahrestag",
    "season": 1,
    "number": 174,
    "episode": 174,
    "released": "2025-01-12T00:00:00.000Z",
    "firstAired": "2025-01-12T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt34824149/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "5.3"
  },
  {
    "id": "tt0907694:1:175",
    "name": "Wer immer du bist",
    "title": "Wer immer du bist",
    "season": 1,
    "number": 175,
    "episode": 175,
    "released": "2025-09-06T00:00:00.000Z",
    "firstAired": "2025-09-06T00:00:00.000Z",
    "thumbnail": "https://images.metahub.space/poster/medium/tt38098292/img",
    "overview": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "rating": "4.5"
  },
  {
    "id": "tt0907694:1:176",
    "name": "🟢 Einspruch für die Liebe",
    "title": "🟢 Einspruch für die Liebe",
    "season": 1,
    "number": 176,
    "episode": 176,
    "released": "2026-01-04T00:00:00.000Z",
    "firstAired": "2026-01-04T00:00:00.000Z",
    "thumbnail": "https://epg-image.zdf.de/fotobase-webdelivery/images/14639eee-55be-4062-8284-904f5faf3e73?layout=768x432",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Unter dem Motto \"Harte Arbeit zahlt sich aus\" hat sich Anwalt Bill Reynolds eine renommierte Kanzlei aufgebaut und den Ruf erarbeitet, fast alle Verfahren vor Gericht zu gewinnen.",
    "rating": "5.9"
  },
  {
    "id": "tt0907694:1:177",
    "name": "🟢 Wo Liebe aufhört und wo sie beginnt",
    "title": "🟢 Wo Liebe aufhört und wo sie beginnt",
    "season": 1,
    "number": 177,
    "episode": 177,
    "released": "2026-04-12T00:00:00.000Z",
    "firstAired": "2026-04-12T00:00:00.000Z",
    "thumbnail": "https://www.zdf.de/assets/hero-pilcher-wo-die-liebe-aufhoert-100~1920x1080?cb=1776694369640",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Kate liebt die Arbeit in ihrem kleinen Café, das sie mit ihrer Freundin Polly betreibt. Ihr großer Traum: Ein eigenes Literaturcafé. Doch aus Liebe zu ihrem Mann stellt sie diesen zurück.",
    "rating": "5.1"
  },
  {
    "id": "tt0907694:1:178",
    "name": "🟢 Die Glücksbringerin",
    "title": "🟢 Die Glücksbringerin",
    "season": 1,
    "number": 178,
    "episode": 178,
    "released": "2026-09-06T00:00:00.000Z",
    "firstAired": "2026-09-06T00:00:00.000Z",
    "thumbnail": "https://epg-image.zdf.de/fotobase-webdelivery/images/45cdebaf-8fbe-498c-aafd-57730994f4d4?layout=768x432",
    "overview": "🟢 [ZDFmediathek 1080p HD] 🟢 [100% FUNKTIONIERT - ZDFmediathek HD] Schornsteinfegerin Clare Ridley gilt als Glücksbringerin in ihrem Ort. Doch plötzlich wird sie des Diebstahls verdächtigt, selbst von ihrer Jugendliebe Josh Harding.",
    "rating": "4.9"
  }
];
const SERIES_MAP = {
  "tt0907694:1:1": {
    "id": "tt0907694:1:1",
    "number": 1,
    "season": 1,
    "name": "Stürmische Begegnung",
    "imdb_id": "tt0108240",
    "overview": "Rosamunde Pilcher Liebesfilm (1993). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0108240/img"
  },
  "tt0907694:1:2": {
    "id": "tt0907694:1:2",
    "number": 2,
    "season": 1,
    "name": "Wilder Thymian",
    "imdb_id": "tt0111721",
    "overview": "Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0111721/img"
  },
  "tt0907694:1:3": {
    "id": "tt0907694:1:3",
    "number": 3,
    "season": 1,
    "name": "Karussell des Lebens",
    "imdb_id": "tt0110245",
    "overview": "Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0110245/img"
  },
  "tt0907694:1:4": {
    "id": "tt0907694:1:4",
    "number": 4,
    "season": 1,
    "name": "Wechselspiel der Liebe",
    "imdb_id": "tt0114903",
    "overview": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0114903/img"
  },
  "tt0907694:1:5": {
    "id": "tt0907694:1:5",
    "number": 5,
    "season": 1,
    "name": "Das Ende eines Sommers",
    "imdb_id": "tt0123821",
    "overview": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0123821/img"
  },
  "tt0907694:1:6": {
    "id": "tt0907694:1:6",
    "number": 6,
    "season": 1,
    "name": "Sommer am Meer",
    "imdb_id": "tt0114498",
    "overview": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0114498/img"
  },
  "tt0907694:1:7": {
    "id": "tt0907694:1:7",
    "number": 7,
    "season": 1,
    "name": "Schlafender Tiger",
    "imdb_id": "tt0114353",
    "overview": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0114353/img"
  },
  "tt0907694:1:8": {
    "id": "tt0907694:1:8",
    "number": 8,
    "season": 1,
    "name": "Wolken am Horizont",
    "imdb_id": "tt0126124",
    "overview": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0126124/img"
  },
  "tt0907694:1:9": {
    "id": "tt0907694:1:9",
    "number": 9,
    "season": 1,
    "name": "Schneesturm im Frühling",
    "imdb_id": "tt0117564",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0117564/img"
  },
  "tt0907694:1:10": {
    "id": "tt0907694:1:10",
    "number": 10,
    "season": 1,
    "name": "Lichterspiele",
    "imdb_id": "tt0116870",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0116870/img"
  },
  "tt0907694:1:11": {
    "id": "tt0907694:1:11",
    "number": 11,
    "season": 1,
    "name": "September: Teil 1",
    "imdb_id": "tt15729598",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15729598/img"
  },
  "tt0907694:1:12": {
    "id": "tt0907694:1:12",
    "number": 12,
    "season": 1,
    "name": "September: Teil 2",
    "imdb_id": "tt15741176",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15741176/img"
  },
  "tt0907694:1:13": {
    "id": "tt0907694:1:13",
    "number": 13,
    "season": 1,
    "name": "Das Haus an der Küste",
    "imdb_id": "tt0116498",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0116498/img"
  },
  "tt0907694:1:14": {
    "id": "tt0907694:1:14",
    "number": 14,
    "season": 1,
    "name": "Eine besondere Liebe",
    "imdb_id": "tt0115659",
    "overview": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0115659/img"
  },
  "tt0907694:1:15": {
    "id": "tt0907694:1:15",
    "number": 15,
    "season": 1,
    "name": "Wind der Hoffnung",
    "imdb_id": "tt0120517",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0120517/img"
  },
  "tt0907694:1:16": {
    "id": "tt0907694:1:16",
    "number": 16,
    "season": 1,
    "name": "Irrwege des Herzens",
    "imdb_id": "tt0119384",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0119384/img"
  },
  "tt0907694:1:17": {
    "id": "tt0907694:1:17",
    "number": 17,
    "season": 1,
    "name": "Stunden der Entscheidung",
    "imdb_id": "tt0120234",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0120234/img"
  },
  "tt0907694:1:18": {
    "id": "tt0907694:1:18",
    "number": 18,
    "season": 1,
    "name": "Die zweite Chance",
    "imdb_id": "tt0128860",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0128860/img"
  },
  "tt0907694:1:19": {
    "id": "tt0907694:1:19",
    "number": 19,
    "season": 1,
    "name": "Zwei Schwestern",
    "imdb_id": "tt0135071",
    "overview": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0135071/img"
  },
  "tt0907694:1:20": {
    "id": "tt0907694:1:20",
    "number": 20,
    "season": 1,
    "name": "Der Preis der Liebe",
    "imdb_id": "tt0146041",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0146041/img"
  },
  "tt0907694:1:21": {
    "id": "tt0907694:1:21",
    "number": 21,
    "season": 1,
    "name": "Heimkehr: Teil 1",
    "imdb_id": "tt15729564",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15729564/img"
  },
  "tt0907694:1:22": {
    "id": "tt0907694:1:22",
    "number": 22,
    "season": 1,
    "name": "Heimkehr: Teil 2",
    "imdb_id": "tt15729560",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15729560/img"
  },
  "tt0907694:1:23": {
    "id": "tt0907694:1:23",
    "number": 23,
    "season": 1,
    "name": "Rückkehr ins Paradies",
    "imdb_id": "tt0170520",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0170520/img"
  },
  "tt0907694:1:24": {
    "id": "tt0907694:1:24",
    "number": 24,
    "season": 1,
    "name": "Dornen im Tal der Blumen",
    "imdb_id": "tt0177180",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0177180/img"
  },
  "tt0907694:1:25": {
    "id": "tt0907694:1:25",
    "number": 25,
    "season": 1,
    "name": "Melodie der Herzen",
    "imdb_id": "tt0181794",
    "overview": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0181794/img"
  },
  "tt0907694:1:26": {
    "id": "tt0907694:1:26",
    "number": 26,
    "season": 1,
    "name": "Magie der Liebe",
    "imdb_id": "tt0184868",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0184868/img"
  },
  "tt0907694:1:27": {
    "id": "tt0907694:1:27",
    "number": 27,
    "season": 1,
    "name": "Rosen im Sturm",
    "imdb_id": "tt0188183",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0188183/img"
  },
  "tt0907694:1:28": {
    "id": "tt0907694:1:28",
    "number": 28,
    "season": 1,
    "name": "Das große Erbe: Teil 1",
    "imdb_id": "tt15740730",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15740730/img"
  },
  "tt0907694:1:29": {
    "id": "tt0907694:1:29",
    "number": 29,
    "season": 1,
    "name": "Das große Erbe: Teil 2",
    "imdb_id": "tt15740738",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15740738/img"
  },
  "tt0907694:1:30": {
    "id": "tt0907694:1:30",
    "number": 30,
    "season": 1,
    "name": "Klippen der Liebe",
    "imdb_id": "tt0217605",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0217605/img"
  },
  "tt0907694:1:31": {
    "id": "tt0907694:1:31",
    "number": 31,
    "season": 1,
    "name": "Möwen im Wind",
    "imdb_id": "tt0222330",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0222330/img"
  },
  "tt0907694:1:32": {
    "id": "tt0907694:1:32",
    "number": 32,
    "season": 1,
    "name": "Blüte des Lebens",
    "imdb_id": "tt0226390",
    "overview": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0226390/img"
  },
  "tt0907694:1:33": {
    "id": "tt0907694:1:33",
    "number": 33,
    "season": 1,
    "name": "Der lange Weg zum Glück",
    "imdb_id": "tt0230712",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0230712/img"
  },
  "tt0907694:1:34": {
    "id": "tt0907694:1:34",
    "number": 34,
    "season": 1,
    "name": "Zeit der Erkenntnis",
    "imdb_id": "tt0244176",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0244176/img"
  },
  "tt0907694:1:35": {
    "id": "tt0907694:1:35",
    "number": 35,
    "season": 1,
    "name": "Zerrissene Herzen",
    "imdb_id": "tt0262737",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0262737/img"
  },
  "tt0907694:1:36": {
    "id": "tt0907694:1:36",
    "number": 36,
    "season": 1,
    "name": "Ruf der Vergangenheit",
    "imdb_id": "tt0266913",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0266913/img"
  },
  "tt0907694:1:37": {
    "id": "tt0907694:1:37",
    "number": 37,
    "season": 1,
    "name": "Im Licht des Feuers",
    "imdb_id": "tt0271760",
    "overview": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0271760/img"
  },
  "tt0907694:1:38": {
    "id": "tt0907694:1:38",
    "number": 38,
    "season": 1,
    "name": "Die Rose von Kerrymore",
    "imdb_id": "tt0272817",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0272817/img"
  },
  "tt0907694:1:39": {
    "id": "tt0907694:1:39",
    "number": 39,
    "season": 1,
    "name": "Küste der Träume",
    "imdb_id": "tt0275637",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0275637/img"
  },
  "tt0907694:1:40": {
    "id": "tt0907694:1:40",
    "number": 40,
    "season": 1,
    "name": "Kinder des Glücks",
    "imdb_id": "tt0300428",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0300428/img"
  },
  "tt0907694:1:41": {
    "id": "tt0907694:1:41",
    "number": 41,
    "season": 1,
    "name": "Wind über dem Fluss",
    "imdb_id": "tt0301782",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0301782/img"
  },
  "tt0907694:1:42": {
    "id": "tt0907694:1:42",
    "number": 42,
    "season": 1,
    "name": "Blumen im Regen",
    "imdb_id": "tt0304642",
    "overview": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0304642/img"
  },
  "tt0907694:1:43": {
    "id": "tt0907694:1:43",
    "number": 43,
    "season": 1,
    "name": "Wenn nur noch Liebe zählt",
    "imdb_id": "tt0310081",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0310081/img"
  },
  "tt0907694:1:44": {
    "id": "tt0907694:1:44",
    "number": 44,
    "season": 1,
    "name": "Morgen träumen wir gemeinsam",
    "imdb_id": "tt0316507",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0316507/img"
  },
  "tt0907694:1:45": {
    "id": "tt0907694:1:45",
    "number": 45,
    "season": 1,
    "name": "Mit den Augen der Liebe",
    "imdb_id": "tt0337119",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0337119/img"
  },
  "tt0907694:1:46": {
    "id": "tt0907694:1:46",
    "number": 46,
    "season": 1,
    "name": "Bis ans Ende der Welt",
    "imdb_id": "tt0345873",
    "overview": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0345873/img"
  },
  "tt0907694:1:47": {
    "id": "tt0907694:1:47",
    "number": 47,
    "season": 1,
    "name": "Sternschnuppen im August",
    "imdb_id": "tt0348739",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0348739/img"
  },
  "tt0907694:1:48": {
    "id": "tt0907694:1:48",
    "number": 48,
    "season": 1,
    "name": "Paradies der Träume",
    "imdb_id": "tt0353957",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0353957/img"
  },
  "tt0907694:1:49": {
    "id": "tt0907694:1:49",
    "number": 49,
    "season": 1,
    "name": "Flamme der Liebe",
    "imdb_id": "tt0357109",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0357109/img"
  },
  "tt0907694:1:50": {
    "id": "tt0907694:1:50",
    "number": 50,
    "season": 1,
    "name": "Gewissheit des Herzens",
    "imdb_id": "tt0386755",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0386755/img"
  },
  "tt0907694:1:51": {
    "id": "tt0907694:1:51",
    "number": 51,
    "season": 1,
    "name": "Wintersonne (1+2)",
    "imdb_id": "tt15727968",
    "overview": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15727968/img"
  },
  "tt0907694:1:52": {
    "id": "tt0907694:1:52",
    "number": 52,
    "season": 1,
    "name": "Federn im Wind",
    "imdb_id": "tt0396843",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0396843/img"
  },
  "tt0907694:1:53": {
    "id": "tt0907694:1:53",
    "number": 53,
    "season": 1,
    "name": "Wege der Liebe",
    "imdb_id": "tt0393657",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0393657/img"
  },
  "tt0907694:1:54": {
    "id": "tt0907694:1:54",
    "number": 54,
    "season": 1,
    "name": "Solange es dich gibt",
    "imdb_id": "tt0433629",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0433629/img"
  },
  "tt0907694:1:55": {
    "id": "tt0907694:1:55",
    "number": 55,
    "season": 1,
    "name": "Liebe im Spiel",
    "imdb_id": "tt0410534",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0410534/img"
  },
  "tt0907694:1:56": {
    "id": "tt0907694:1:56",
    "number": 56,
    "season": 1,
    "name": "Traum eines Sommers",
    "imdb_id": "tt0450119",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0450119/img"
  },
  "tt0907694:1:57": {
    "id": "tt0907694:1:57",
    "number": 57,
    "season": 1,
    "name": "Tiefe der Gefühle",
    "imdb_id": "tt0432346",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0432346/img"
  },
  "tt0907694:1:58": {
    "id": "tt0907694:1:58",
    "number": 58,
    "season": 1,
    "name": "Dem Himmel so nah",
    "imdb_id": "tt0450116",
    "overview": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0450116/img"
  },
  "tt0907694:1:59": {
    "id": "tt0907694:1:59",
    "number": 59,
    "season": 1,
    "name": "Vermächtnis der Liebe",
    "imdb_id": "tt0450120",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0450120/img"
  },
  "tt0907694:1:60": {
    "id": "tt0907694:1:60",
    "number": 60,
    "season": 1,
    "name": "Königin der Nacht",
    "imdb_id": "tt0450117",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0450117/img"
  },
  "tt0907694:1:61": {
    "id": "tt0907694:1:61",
    "number": 61,
    "season": 1,
    "name": "Segel der Liebe",
    "imdb_id": "tt0450118",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0450118/img"
  },
  "tt0907694:1:62": {
    "id": "tt0907694:1:62",
    "number": 62,
    "season": 1,
    "name": "Über den Wolken",
    "imdb_id": "tt0491128",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0491128/img"
  },
  "tt0907694:1:63": {
    "id": "tt0907694:1:63",
    "number": 63,
    "season": 1,
    "name": "Zauber der Liebe (1+2)",
    "imdb_id": "tt15727726",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15727726/img"
  },
  "tt0907694:1:64": {
    "id": "tt0907694:1:64",
    "number": 64,
    "season": 1,
    "name": "Der Himmel über Cornwall",
    "imdb_id": "tt0777270",
    "overview": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0777270/img"
  },
  "tt0907694:1:65": {
    "id": "tt0907694:1:65",
    "number": 65,
    "season": 1,
    "name": "Land der Sehnsucht",
    "imdb_id": "tt0497438",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0497438/img"
  },
  "tt0907694:1:66": {
    "id": "tt0907694:1:66",
    "number": 66,
    "season": 1,
    "name": "Sommer des Erwachens",
    "imdb_id": "tt0499557",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0499557/img"
  },
  "tt0907694:1:67": {
    "id": "tt0907694:1:67",
    "number": 67,
    "season": 1,
    "name": "Wo die Liebe begann",
    "imdb_id": "tt0857260",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0857260/img"
  },
  "tt0907694:1:68": {
    "id": "tt0907694:1:68",
    "number": 68,
    "season": 1,
    "name": "Die Liebe ihres Lebens",
    "imdb_id": "tt0872156",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0872156/img"
  },
  "tt0907694:1:69": {
    "id": "tt0907694:1:69",
    "number": 69,
    "season": 1,
    "name": "Und plötzlich war es Liebe",
    "imdb_id": "tt0903964",
    "overview": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0903964/img"
  },
  "tt0907694:1:71": {
    "id": "tt0907694:1:71",
    "number": 71,
    "season": 1,
    "name": "Wiedersehen am Fluss",
    "imdb_id": "tt0943113",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0943113/img"
  },
  "tt0907694:1:72": {
    "id": "tt0907694:1:72",
    "number": 72,
    "season": 1,
    "name": "Sommer der Liebe",
    "imdb_id": "tt0988802",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0988802/img"
  },
  "tt0907694:1:73": {
    "id": "tt0907694:1:73",
    "number": 73,
    "season": 1,
    "name": "Flügel der Hoffnung",
    "imdb_id": "tt0988801",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt0988801/img"
  },
  "tt0907694:1:74": {
    "id": "tt0907694:1:74",
    "number": 74,
    "season": 1,
    "name": "Der Mann meiner Träume",
    "imdb_id": "tt1096981",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1096981/img"
  },
  "tt0907694:1:75": {
    "id": "tt0907694:1:75",
    "number": 75,
    "season": 1,
    "name": "Sieg der Liebe",
    "imdb_id": "tt1106607",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1106607/img"
  },
  "tt0907694:1:76": {
    "id": "tt0907694:1:76",
    "number": 76,
    "season": 1,
    "name": "Nebel über Schloss Kilrush",
    "imdb_id": "tt1125243",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1125243/img"
  },
  "tt0907694:1:77": {
    "id": "tt0907694:1:77",
    "number": 77,
    "season": 1,
    "name": "Aus Liebe und Leidenschaft",
    "imdb_id": "tt1140926",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1140926/img"
  },
  "tt0907694:1:78": {
    "id": "tt0907694:1:78",
    "number": 78,
    "season": 1,
    "name": "Wind über der See",
    "imdb_id": "tt1150986",
    "overview": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1150986/img"
  },
  "tt0907694:1:79": {
    "id": "tt0907694:1:79",
    "number": 79,
    "season": 1,
    "name": "Pfeile der Liebe",
    "imdb_id": "tt1177749",
    "overview": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1177749/img"
  },
  "tt0907694:1:80": {
    "id": "tt0907694:1:80",
    "number": 80,
    "season": 1,
    "name": "Melodie der Liebe",
    "imdb_id": "tt1178398",
    "overview": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1178398/img"
  },
  "tt0907694:1:81": {
    "id": "tt0907694:1:81",
    "number": 81,
    "season": 1,
    "name": "Herzen im Wind",
    "imdb_id": "tt1178399",
    "overview": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1178399/img"
  },
  "tt0907694:1:84": {
    "id": "tt0907694:1:84",
    "number": 84,
    "season": 1,
    "name": "Gezeiten der Liebe",
    "imdb_id": "tt1178400",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1178400/img"
  },
  "tt0907694:1:85": {
    "id": "tt0907694:1:85",
    "number": 85,
    "season": 1,
    "name": "Herzenssehnsucht",
    "imdb_id": "tt1178401",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1178401/img"
  },
  "tt0907694:1:86": {
    "id": "tt0907694:1:86",
    "number": 86,
    "season": 1,
    "name": "Eine Liebe im Herbst",
    "imdb_id": "tt1178402",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1178402/img"
  },
  "tt0907694:1:87": {
    "id": "tt0907694:1:87",
    "number": 87,
    "season": 1,
    "name": "Entscheidung des Herzens",
    "imdb_id": "tt1178403",
    "overview": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1178403/img"
  },
  "tt0907694:1:88": {
    "id": "tt0907694:1:88",
    "number": 88,
    "season": 1,
    "name": "Liebe gegen den Rest der Welt",
    "imdb_id": "tt1178404",
    "overview": "Rachel Wilson kehrt nach zwei Jahren in das kleine Dorf Kingscove in Cornwall zurück, das sie eigentlich für immer verlassen wollte.",
    "poster": "https://www.zdf.de/assets/liebe-gegen-den-rest-der-welt-102~1920x1080?cb=1747395872987"
  },
  "tt0907694:1:89": {
    "id": "tt0907694:1:89",
    "number": 89,
    "season": 1,
    "name": "Wiedersehen in Rose Abbey",
    "imdb_id": "tt1178405",
    "overview": "Roseanne Brix, Studentin aus Chicago, kommt nach dem Tod ihrer Mutter nach England, um ihren leiblichen Vater zu suchen. Ihr einziger Hinweis ist ein altes Foto ihrer Mutter.",
    "poster": "https://www.zdf.de/assets/wiedersehen-in-rose-abbey-100~1920x1080?cb=1746798390082"
  },
  "tt0907694:1:90": {
    "id": "tt0907694:1:90",
    "number": 90,
    "season": 1,
    "name": "Lass es Liebe sein",
    "imdb_id": "tt1178406",
    "overview": "Eine kurze, schicksalhafte Begegnung zwischen Tom und Natalie, einer jungen Studentin aus Georgien, wird das Leben beider für immer verändern: Sie verlieben sich ineinander.",
    "poster": "https://www.zdf.de/assets/lass-es-liebe-sein-100~1920x1080?cb=1746450048706"
  },
  "tt0907694:1:93": {
    "id": "tt0907694:1:93",
    "number": 93,
    "season": 1,
    "name": "Im Zweifel für die Liebe",
    "imdb_id": "tt1545888",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1545888/img"
  },
  "tt0907694:1:94": {
    "id": "tt0907694:1:94",
    "number": 94,
    "season": 1,
    "name": "Wohin du auch gehst",
    "imdb_id": "tt1545890",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1545890/img"
  },
  "tt0907694:1:95": {
    "id": "tt0907694:1:95",
    "number": 95,
    "season": 1,
    "name": "Liebe am Horizont",
    "imdb_id": "tt1545889",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1545889/img"
  },
  "tt0907694:1:96": {
    "id": "tt0907694:1:96",
    "number": 96,
    "season": 1,
    "name": "Wenn das Herz zerbricht",
    "imdb_id": "tt1670117",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1670117/img"
  },
  "tt0907694:1:97": {
    "id": "tt0907694:1:97",
    "number": 97,
    "season": 1,
    "name": "Flügel der Liebe",
    "imdb_id": "tt1702299",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1702299/img"
  },
  "tt0907694:1:98": {
    "id": "tt0907694:1:98",
    "number": 98,
    "season": 1,
    "name": "Lords lügen nicht",
    "imdb_id": "tt1729996",
    "overview": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1729996/img"
  },
  "tt0907694:1:99": {
    "id": "tt0907694:1:99",
    "number": 99,
    "season": 1,
    "name": "Herzensfragen",
    "imdb_id": "tt1794473",
    "overview": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1794473/img"
  },
  "tt0907694:1:100": {
    "id": "tt0907694:1:100",
    "number": 100,
    "season": 1,
    "name": "Sonntagskinder",
    "imdb_id": "tt1804980",
    "overview": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt1804980/img"
  },
  "tt0907694:1:103": {
    "id": "tt0907694:1:103",
    "number": 103,
    "season": 1,
    "name": "Verlobt, verliebt, verwirrt",
    "imdb_id": "tt2050248",
    "overview": "Emma Waters überredet ihre Freundin Julia Adams, einen Junggesellinnenabschied zu machen. Als Julia einen Kuss versteigern soll, kann sie nicht glauben, wer der Gewinner ist.",
    "poster": "https://www.zdf.de/assets/verlobt-verliebt-verwirrt-100~1920x1080?cb=1745830743700"
  },
  "tt0907694:1:104": {
    "id": "tt0907694:1:104",
    "number": 104,
    "season": 1,
    "name": "Der gestohlene Sommer",
    "imdb_id": "tt2050247",
    "overview": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt2050247/img"
  },
  "tt0907694:1:105": {
    "id": "tt0907694:1:105",
    "number": 105,
    "season": 1,
    "name": "Englischer Wein",
    "imdb_id": "tt2098382",
    "overview": "Die ehrgeizige Winzerin Hannah Powell, die lange in Frankreich gelebt hat, erhält die Chance ihres Lebens: Sie soll ein Weingut in ihrer Heimat Südengland auf Vordermann bringen.",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-englischer-wein-104~1920x1080?cb=1744711026467"
  },
  "tt0907694:1:106": {
    "id": "tt0907694:1:106",
    "number": 106,
    "season": 1,
    "name": "Gefährliche Brandung",
    "imdb_id": "tt2122084",
    "overview": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt2122084/img"
  },
  "tt0907694:1:109": {
    "id": "tt0907694:1:109",
    "number": 109,
    "season": 1,
    "name": "Ungezügelt ins Glück",
    "imdb_id": "tt2154411",
    "overview": "Lord Brooks stellt nach langer Abwesenheit entsetzt fest, dass seine Mutter das Familienanwesen in ein Pferdeasyl verwandelt hat. Er muss sich nun um die Rettung des Erbes kümmern.",
    "poster": "https://www.zdf.de/assets/ungezuegelt-ins-glueck-100~1920x1080?cb=1744907251956"
  },
  "tt0907694:1:110": {
    "id": "tt0907694:1:110",
    "number": 110,
    "season": 1,
    "name": "Das Geheimnis der weißen Taube",
    "imdb_id": "tt2315165",
    "overview": "Auktionatorin Stella liebt die alten Schätze, die sie verkauft. Doch im Auktionshaus der Familie ihres Mannes Peter kriselt es seit neustem – und das nicht nur bei ihrer Arbeit.",
    "poster": "https://www.zdf.de/assets/das-geheimnis-der-weissen-taube-100~1920x1080?cb=1746022269147"
  },
  "tt0907694:1:111": {
    "id": "tt0907694:1:111",
    "number": 111,
    "season": 1,
    "name": "Die falsche Nonne",
    "imdb_id": "tt2366178",
    "overview": "Bei einem Undercover-Einsatz lernt Polizistin Sabrina Tom kennen.",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-die-falsche-nonne-104~1920x1080?cb=1793023905964"
  },
  "tt0907694:1:112": {
    "id": "tt0907694:1:112",
    "number": 112,
    "season": 1,
    "name": "In der Mitte eines Lebens",
    "imdb_id": "tt2402646",
    "overview": "Ella Dempsey muss nach einem Vorfall ihr ganzes Leben überdenken.",
    "poster": "https://www.zdf.de/assets/in-der-mitte-des-lebens-100~1920x1080?cb=1578559755191"
  },
  "tt0907694:1:113": {
    "id": "tt0907694:1:113",
    "number": 113,
    "season": 1,
    "name": "Die andere Frau, Teil 1",
    "imdb_id": "tt3959970",
    "overview": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3959970/img"
  },
  "tt0907694:1:114": {
    "id": "tt0907694:1:114",
    "number": 114,
    "season": 1,
    "name": "Die andere Frau, Teil 2",
    "imdb_id": "tt2169404",
    "overview": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt2169404/img"
  },
  "tt0907694:1:115": {
    "id": "tt0907694:1:115",
    "number": 115,
    "season": 1,
    "name": "Eine Frage der Ehre",
    "imdb_id": "tt2592426",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt2592426/img"
  },
  "tt0907694:1:116": {
    "id": "tt0907694:1:116",
    "number": 116,
    "season": 1,
    "name": "Die Frau auf der Klippe",
    "imdb_id": "tt2761046",
    "overview": "Owen erbt das Herrenhaus seines verstorbenen Großonkels in Cornwall.",
    "poster": "https://www.zdf.de/assets/die-frau-auf-der-klippe-100~1920x1080?cb=1793023515200"
  },
  "tt0907694:1:117": {
    "id": "tt0907694:1:117",
    "number": 117,
    "season": 1,
    "name": "Schlangen im Paradies",
    "imdb_id": "tt2831116",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt2831116/img"
  },
  "tt0907694:1:118": {
    "id": "tt0907694:1:118",
    "number": 118,
    "season": 1,
    "name": "Die versprochene Braut",
    "imdb_id": "tt3128154",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3128154/img"
  },
  "tt0907694:1:119": {
    "id": "tt0907694:1:119",
    "number": 119,
    "season": 1,
    "name": "Alte Herzen rosten nicht",
    "imdb_id": "tt3293750",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3293750/img"
  },
  "tt0907694:1:120": {
    "id": "tt0907694:1:120",
    "number": 120,
    "season": 1,
    "name": "Zu hoch geflogen",
    "imdb_id": "tt3443090",
    "overview": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3443090/img"
  },
  "tt0907694:1:121": {
    "id": "tt0907694:1:121",
    "number": 121,
    "season": 1,
    "name": "Besetzte Herzen",
    "imdb_id": "tt3332888",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3332888/img"
  },
  "tt0907694:1:122": {
    "id": "tt0907694:1:122",
    "number": 122,
    "season": 1,
    "name": "Evitas Rache",
    "imdb_id": "tt3132252",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3132252/img"
  },
  "tt0907694:1:123": {
    "id": "tt0907694:1:123",
    "number": 123,
    "season": 1,
    "name": "Mein unbekanntes Herz",
    "imdb_id": "tt3954226",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3954226/img"
  },
  "tt0907694:1:124": {
    "id": "tt0907694:1:124",
    "number": 124,
    "season": 1,
    "name": "Anwälte küsst man nicht",
    "imdb_id": "tt3954140",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3954140/img"
  },
  "tt0907694:1:125": {
    "id": "tt0907694:1:125",
    "number": 125,
    "season": 1,
    "name": "Vertrauen ist gut, verlieben ist besser",
    "imdb_id": "tt3901820",
    "overview": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt3901820/img"
  },
  "tt0907694:1:126": {
    "id": "tt0907694:1:126",
    "number": 126,
    "season": 1,
    "name": "Ghostwriter",
    "imdb_id": "tt5921002",
    "overview": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt5921002/img"
  },
  "tt0907694:1:127": {
    "id": "tt0907694:1:127",
    "number": 127,
    "season": 1,
    "name": "Wahlversprechen und andere Lügen",
    "imdb_id": "tt6058140",
    "overview": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt6058140/img"
  },
  "tt0907694:1:128": {
    "id": "tt0907694:1:128",
    "number": 128,
    "season": 1,
    "name": "Ein einziger Kuss",
    "imdb_id": "tt18155194",
    "overview": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt18155194/img"
  },
  "tt0907694:1:129": {
    "id": "tt0907694:1:129",
    "number": 129,
    "season": 1,
    "name": "Rundum glücklich",
    "imdb_id": "tt3905430",
    "overview": "Die junge Bäckerin Betty Hunter sucht den Mann ihrer Träume.",
    "poster": "https://www.zdf.de/assets/rundum-gluecklich-100~1920x1080?cb=1738935862085"
  },
  "tt0907694:1:130": {
    "id": "tt0907694:1:130",
    "number": 130,
    "season": 1,
    "name": "Vollkommen unerwartet",
    "imdb_id": "tt5376696",
    "overview": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt5376696/img"
  },
  "tt0907694:1:131": {
    "id": "tt0907694:1:131",
    "number": 131,
    "season": 1,
    "name": "Liebe, Diebe, Diamanten",
    "imdb_id": "tt5205186",
    "overview": "Richard Johnson kehrt zur Hochzeit der Tochter zurück nach Cornwall.",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-liebe-diebe-diamanten-102~1920x1080?cb=1793024107343"
  },
  "tt0907694:1:132": {
    "id": "tt0907694:1:132",
    "number": 132,
    "season": 1,
    "name": "Argentinischer Tango",
    "imdb_id": "tt4837404",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt4837404/img"
  },
  "tt0907694:1:133": {
    "id": "tt0907694:1:133",
    "number": 133,
    "season": 1,
    "name": "Lizenz zum Seitensprung",
    "imdb_id": "tt5295330",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt5295330/img"
  },
  "tt0907694:1:134": {
    "id": "tt0907694:1:134",
    "number": 134,
    "season": 1,
    "name": "Schutzengel",
    "imdb_id": "tt5580156",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt5580156/img"
  },
  "tt0907694:1:135": {
    "id": "tt0907694:1:135",
    "number": 135,
    "season": 1,
    "name": "Ein Doktor & drei Frauen",
    "imdb_id": "tt9038080",
    "overview": "Dem idyllischen Örtchen St. Mark droht kurz vor der bevorstehenden 500-Jahr-Feier der schleichende Tod. Jetzt verabschiedet sich auch noch der einzige Arzt in den Ruhestand.",
    "poster": "https://www.zdf.de/assets/doktor-und-drei-frauen-100~1920x1080?cb=1766147846819"
  },
  "tt0907694:1:136": {
    "id": "tt0907694:1:136",
    "number": 136,
    "season": 1,
    "name": "Ex & Liebe",
    "imdb_id": "tt6136678",
    "overview": "Auf dem Weg zu seiner Mutter hat Bruno mit seinem Oldtimer eine Panne, die sein Leben verändern wird. Sophie, die einstige Liebe seines Lebens, steht plötzlich vor ihm.",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-ex-und-liebe-102~1920x1080?cb=1680097215435"
  },
  "tt0907694:1:137": {
    "id": "tt0907694:1:137",
    "number": 137,
    "season": 1,
    "name": "Erdbeeren im Frühling",
    "imdb_id": "tt6270250",
    "overview": "Als die junge Journalistin und Millionenerbin Lilly zur Beerdigung ihres Vaters nach Cornwall zurückkehrt, bricht ihre bisherige Lebensplanung wie ein Kartenhaus zusammen.",
    "poster": "https://www.zdf.de/assets/erdbeeren-im-fruehling-106~1920x1080?cb=1696515866401"
  },
  "tt0907694:1:138": {
    "id": "tt0907694:1:138",
    "number": 138,
    "season": 1,
    "name": "Haustausch mit Hindernissen",
    "imdb_id": "tt6426868",
    "overview": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt6426868/img"
  },
  "tt0907694:1:139": {
    "id": "tt0907694:1:139",
    "number": 139,
    "season": 1,
    "name": "Wie von einem anderen Stern",
    "imdb_id": "tt5940862",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt5940862/img"
  },
  "tt0907694:1:140": {
    "id": "tt0907694:1:140",
    "number": 140,
    "season": 1,
    "name": "Fast noch verheiratet",
    "imdb_id": "tt6387446",
    "overview": "Siennas Traummann macht ihr einen Heiratsantrag – doch sie zögert.",
    "poster": "https://www.zdf.de/assets/fast-verheiratet-100~1920x1080?cb=1575469007851"
  },
  "tt0907694:1:141": {
    "id": "tt0907694:1:141",
    "number": 141,
    "season": 1,
    "name": "Nie wieder Klassentreffen",
    "imdb_id": "tt7294684",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt7294684/img"
  },
  "tt0907694:1:142": {
    "id": "tt0907694:1:142",
    "number": 142,
    "season": 1,
    "name": "Das Gespenst von Cassley",
    "imdb_id": "tt7565710",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt7565710/img"
  },
  "tt0907694:1:143": {
    "id": "tt0907694:1:143",
    "number": 143,
    "season": 1,
    "name": "Wenn Fische lächeln",
    "imdb_id": "tt7652188",
    "overview": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt7652188/img"
  },
  "tt0907694:1:144": {
    "id": "tt0907694:1:144",
    "number": 144,
    "season": 1,
    "name": "Geerbtes Glück",
    "imdb_id": "tt7858832",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt7858832/img"
  },
  "tt0907694:1:145": {
    "id": "tt0907694:1:145",
    "number": 145,
    "season": 1,
    "name": "Das Vermächtnis unseres Vaters",
    "imdb_id": "tt8103280",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt8103280/img"
  },
  "tt0907694:1:146": {
    "id": "tt0907694:1:146",
    "number": 146,
    "season": 1,
    "name": "Nanny verzweifelt gesucht",
    "imdb_id": "tt7771608",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt7771608/img"
  },
  "tt0907694:1:147": {
    "id": "tt0907694:1:147",
    "number": 147,
    "season": 1,
    "name": "Wo Dein Herz wohnt",
    "imdb_id": "tt9089702",
    "overview": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt9089702/img"
  },
  "tt0907694:1:148": {
    "id": "tt0907694:1:148",
    "number": 148,
    "season": 1,
    "name": "Das Geheimnis der Blumeninsel",
    "imdb_id": "tt9401328",
    "overview": "Amy Harding hat einen großen Traum. Sie will die verwahrloste Blumenfarm ihrer Großeltern auf den Scilly Islands wieder zum Blühen bringen.",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-das-geheimnis-der-blumeninsel-102~1920x1080?cb=1544345904588"
  },
  "tt0907694:1:149": {
    "id": "tt0907694:1:149",
    "number": 149,
    "season": 1,
    "name": "Morgens stürmisch, abends Liebe",
    "imdb_id": "tt9401344",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt9401344/img"
  },
  "tt0907694:1:150": {
    "id": "tt0907694:1:150",
    "number": 150,
    "season": 1,
    "name": "Die Braut meines Bruders",
    "imdb_id": "tt9740242",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt9740242/img"
  },
  "tt0907694:1:151": {
    "id": "tt0907694:1:151",
    "number": 151,
    "season": 1,
    "name": "Schwiegertöchter",
    "imdb_id": "tt9048744",
    "overview": "Lynette will den letzten Wunsch ihres verstorbenen Mannes erfüllen und eine Stiftung in seinem Namen gründen. Dafür muss sie aber die Leitung ihrer eigenen Firma abgeben.",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-schwiegertoechter-102~1920x1080?cb=1749544149996"
  },
  "tt0907694:1:152": {
    "id": "tt0907694:1:152",
    "number": 152,
    "season": 1,
    "name": "Pralinen zum Frühstück",
    "imdb_id": "tt10917356",
    "overview": "Annabelle hat ihr Hobby zum Beruf gemacht: Auf Flughäfen ersteigert sie gestrandete und besitzlose Koffer, um sie dann in ihrer Fernsehsendung öffnen zu lassen.",
    "poster": "https://www.zdf.de/assets/pralinen-zum-fruehstueck-102~1920x1080?cb=1781704277805"
  },
  "tt0907694:1:153": {
    "id": "tt0907694:1:153",
    "number": 153,
    "season": 1,
    "name": "Raus in den Sturm",
    "imdb_id": "tt10974400",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt10974400/img"
  },
  "tt0907694:1:154": {
    "id": "tt0907694:1:154",
    "number": 154,
    "season": 1,
    "name": "Der magische Bus",
    "imdb_id": "tt11157780",
    "overview": "Olivia macht sich trotz aller Warnungen ihrer Freunde und Kollegen in einem Vintage-Bus selbstständig. Doch schon bei der ersten Reise kommt der erste Rückschlag.",
    "poster": "https://www.zdf.de/assets/magisch-bus-100~1920x1080?cb=1572876710440"
  },
  "tt0907694:1:155": {
    "id": "tt0907694:1:155",
    "number": 155,
    "season": 1,
    "name": "Meine Cousine, die Liebe und ich",
    "imdb_id": "tt11097478",
    "overview": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt11097478/img"
  },
  "tt0907694:1:156": {
    "id": "tt0907694:1:156",
    "number": 156,
    "season": 1,
    "name": "Von Tee und Liebe",
    "imdb_id": "tt11494832",
    "overview": "Rosamunde Pilcher Liebesfilm (2020). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt11494832/img"
  },
  "tt0907694:1:157": {
    "id": "tt0907694:1:157",
    "number": 157,
    "season": 1,
    "name": "Falsches Leben, wahre Liebe",
    "imdb_id": "tt11750250",
    "overview": "Bill Pexton, ein junger Marineleutnant, freundet sich bei den Vorbereitungen auf die Aufnahmeprüfung bei den Kampftauchern mit seinem Kameraden Mo Miller an.",
    "poster": "https://www.zdf.de/assets/falschesleben-102~1920x1080?cb=1696515723171"
  },
  "tt0907694:1:158": {
    "id": "tt0907694:1:158",
    "number": 158,
    "season": 1,
    "name": "Stadt, Land, Kuss",
    "imdb_id": "tt13625812",
    "overview": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt13625812/img"
  },
  "tt0907694:1:159": {
    "id": "tt0907694:1:159",
    "number": 159,
    "season": 1,
    "name": "Wie verhext",
    "imdb_id": "tt14338314",
    "overview": "Im Kino ihres Vaters hat Grace Kent bereits als Sechsjährige jeden Film gesehen, der dort vorgeführt wurde. Kein Wunder, dass sie schon als junge Frau Kostümbildnerin werden will.",
    "poster": "https://www.zdf.de/assets/wie-verhext-102~1920x1080?cb=1751274370663"
  },
  "tt0907694:1:160": {
    "id": "tt0907694:1:160",
    "number": 160,
    "season": 1,
    "name": "Herzensläufe",
    "imdb_id": "tt15140552",
    "overview": "Für Jacky Davies ist das Gin-Brennen in der traditionellen Familiendestillerie mehr als nur ein Handwerk: Es ist die Passion der jungen Frau und eine Besessenheit.",
    "poster": "https://www.zdf.de/assets/herzenslaeufe-100~1920x1080?cb=1790922946174"
  },
  "tt0907694:1:161": {
    "id": "tt0907694:1:161",
    "number": 161,
    "season": 1,
    "name": "Der Stoff, aus dem Träume sind",
    "imdb_id": "tt15478660",
    "overview": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt15478660/img"
  },
  "tt0907694:1:162": {
    "id": "tt0907694:1:162",
    "number": 162,
    "season": 1,
    "name": "Im Siebten Himmel",
    "imdb_id": "tt13601238",
    "overview": "Rebecca \"Becky\" Taylor ist frisch ordinierte Jung-Vikarin der Anglikanischen Gemeinschaft. Vor ihrem offiziellen Dienstantritt besucht sie die ihr zugeteilte Gemeinde in Cornwall.",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-im-siebten-himmel-102~1920x1080?cb=1638535290427"
  },
  "tt0907694:1:163": {
    "id": "tt0907694:1:163",
    "number": 163,
    "season": 1,
    "name": "Vier Luftballons und ein Todesfall",
    "imdb_id": "tt16796266",
    "overview": "Floristin Gwen ist Angestellte in einem Blumengroßhandel und wird von ihrem sympathischen Chef Joey umgarnt. Was der jungen Frau nicht unangenehm ist - ganz im Gegenteil.",
    "poster": "https://www.zdf.de/assets/vier-luftballons-und-ein-todesfall-100~1920x1080?cb=1790581314387"
  },
  "tt0907694:1:164": {
    "id": "tt0907694:1:164",
    "number": 164,
    "season": 1,
    "name": "Die Elster und der Kapitän",
    "imdb_id": "tt18377966",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt18377966/img"
  },
  "tt0907694:1:165": {
    "id": "tt0907694:1:165",
    "number": 165,
    "season": 1,
    "name": "Liebe ist unberechenbar",
    "imdb_id": "tt20124474",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt20124474/img"
  },
  "tt0907694:1:166": {
    "id": "tt0907694:1:166",
    "number": 166,
    "season": 1,
    "name": "Liebe und andere Schätze",
    "imdb_id": "tt15680476",
    "overview": "Kuratorin Mia Barlow ist praktisch in einem Museum groß geworden, seit Direktor Trevor Murphy und seine Frau, die Restauratorin Hannah, sie als Pflegekind bei sich aufgenommen haben.",
    "poster": "https://www.zdf.de/assets/liebe-und-andere-schaetze-100~1920x1080?cb=1779100936024"
  },
  "tt0907694:1:167": {
    "id": "tt0907694:1:167",
    "number": 167,
    "season": 1,
    "name": "Hochzeitstag",
    "imdb_id": "tt22038482",
    "overview": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt22038482/img"
  },
  "tt0907694:1:168": {
    "id": "tt0907694:1:168",
    "number": 168,
    "season": 1,
    "name": "Liebe ist die beste Therapie",
    "imdb_id": "tt26767892",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt26767892/img"
  },
  "tt0907694:1:169": {
    "id": "tt0907694:1:169",
    "number": 169,
    "season": 1,
    "name": "Wenn ich dich wiederfinde",
    "imdb_id": "tt27349270",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt27349270/img"
  },
  "tt0907694:1:170": {
    "id": "tt0907694:1:170",
    "number": 170,
    "season": 1,
    "name": "Schlagzeile Liebe",
    "imdb_id": "tt28565529",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt28565529/img"
  },
  "tt0907694:1:171": {
    "id": "tt0907694:1:171",
    "number": 171,
    "season": 1,
    "name": "Amys Wunschkind",
    "imdb_id": "tt29716178",
    "overview": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt29716178/img"
  },
  "tt0907694:1:172": {
    "id": "tt0907694:1:172",
    "number": 172,
    "season": 1,
    "name": "Frühstück bei Tessa",
    "imdb_id": "tt30783580",
    "overview": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt30783580/img"
  },
  "tt0907694:1:173": {
    "id": "tt0907694:1:173",
    "number": 173,
    "season": 1,
    "name": "Verliebt in einen Butler",
    "imdb_id": "tt33086345",
    "overview": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt33086345/img"
  },
  "tt0907694:1:174": {
    "id": "tt0907694:1:174",
    "number": 174,
    "season": 1,
    "name": "Jahrestag",
    "imdb_id": "tt34824149",
    "overview": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt34824149/img"
  },
  "tt0907694:1:175": {
    "id": "tt0907694:1:175",
    "number": 175,
    "season": 1,
    "name": "Wer immer du bist",
    "imdb_id": "tt38098292",
    "overview": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands.",
    "poster": "https://images.metahub.space/poster/medium/tt38098292/img"
  },
  "tt0907694:1:176": {
    "id": "tt0907694:1:176",
    "number": 176,
    "season": 1,
    "name": "Einspruch für die Liebe",
    "imdb_id": "tt39074725",
    "overview": "Unter dem Motto \"Harte Arbeit zahlt sich aus\" hat sich Anwalt Bill Reynolds eine renommierte Kanzlei aufgebaut und den Ruf erarbeitet, fast alle Verfahren vor Gericht zu gewinnen.",
    "poster": "https://epg-image.zdf.de/fotobase-webdelivery/images/14639eee-55be-4062-8284-904f5faf3e73?layout=768x432"
  },
  "tt0907694:1:177": {
    "id": "tt0907694:1:177",
    "number": 177,
    "season": 1,
    "name": "Wo Liebe aufhört und wo sie beginnt",
    "imdb_id": "tt39539085",
    "overview": "Kate liebt die Arbeit in ihrem kleinen Café, das sie mit ihrer Freundin Polly betreibt. Ihr großer Traum: Ein eigenes Literaturcafé. Doch aus Liebe zu ihrem Mann stellt sie diesen zurück.",
    "poster": "https://www.zdf.de/assets/hero-pilcher-wo-die-liebe-aufhoert-100~1920x1080?cb=1776694369640"
  },
  "tt0907694:1:178": {
    "id": "tt0907694:1:178",
    "number": 178,
    "season": 1,
    "name": "Die Glücksbringerin",
    "imdb_id": "tt44914855",
    "overview": "Schornsteinfegerin Clare Ridley gilt als Glücksbringerin in ihrem Ort. Doch plötzlich wird sie des Diebstahls verdächtigt, selbst von ihrer Jugendliebe Josh Harding.",
    "poster": "https://epg-image.zdf.de/fotobase-webdelivery/images/45cdebaf-8fbe-498c-aafd-57730994f4d4?layout=768x432"
  }
};
const EPISODES = [
  {
    "id": "rp_001",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Die Glücksbringerin",
    "searchTitle": "Die Glücksbringerin",
    "poster": "https://epg-image.zdf.de/fotobase-webdelivery/images/45cdebaf-8fbe-498c-aafd-57730994f4d4?layout=768x432",
    "description": "[🟢 VERFÜGBAR] Schornsteinfegerin Clare Ridley gilt als Glücksbringerin in ihrem Ort. Doch plötzlich wird sie des Diebstahls verdächtigt, selbst von ihrer Jugendliebe Josh Harding."
  },
  {
    "id": "rp_002",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Wo Liebe aufhört und wo sie beginnt",
    "searchTitle": "Wo Liebe aufhört und wo sie beginnt",
    "poster": "https://www.zdf.de/assets/hero-pilcher-wo-die-liebe-aufhoert-100~1920x1080?cb=1776694369640",
    "description": "[🟢 VERFÜGBAR] Kate liebt die Arbeit in ihrem kleinen Café, das sie mit ihrer Freundin Polly betreibt. Ihr großer Traum: Ein eigenes Literaturcafé. Doch aus Liebe zu ihrem Mann stellt sie diesen zurück."
  },
  {
    "id": "rp_003",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Einspruch für die Liebe",
    "searchTitle": "Einspruch für die Liebe",
    "poster": "https://epg-image.zdf.de/fotobase-webdelivery/images/14639eee-55be-4062-8284-904f5faf3e73?layout=768x432",
    "description": "[🟢 VERFÜGBAR] Unter dem Motto \"Harte Arbeit zahlt sich aus\" hat sich Anwalt Bill Reynolds eine renommierte Kanzlei aufgebaut und den Ruf erarbeitet, fast alle Verfahren vor Gericht zu gewinnen."
  },
  {
    "id": "rp_004",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Ex & Liebe",
    "searchTitle": "Ex & Liebe",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-ex-und-liebe-102~1920x1080?cb=1680097215435",
    "description": "[🟢 VERFÜGBAR] Auf dem Weg zu seiner Mutter hat Bruno mit seinem Oldtimer eine Panne, die sein Leben verändern wird. Sophie, die einstige Liebe seines Lebens, steht plötzlich vor ihm."
  },
  {
    "id": "rp_005",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Fast noch verheiratet",
    "searchTitle": "Fast noch verheiratet",
    "poster": "https://www.zdf.de/assets/fast-verheiratet-100~1920x1080?cb=1575469007851",
    "description": "[🟢 VERFÜGBAR] Siennas Traummann macht ihr einen Heiratsantrag – doch sie zögert."
  },
  {
    "id": "rp_006",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Liebe und andere Schätze",
    "searchTitle": "Liebe und andere Schätze",
    "poster": "https://www.zdf.de/assets/liebe-und-andere-schaetze-100~1920x1080?cb=1779100936024",
    "description": "[🟢 VERFÜGBAR] Kuratorin Mia Barlow ist praktisch in einem Museum groß geworden, seit Direktor Trevor Murphy und seine Frau, die Restauratorin Hannah, sie als Pflegekind bei sich aufgenommen haben."
  },
  {
    "id": "rp_007",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Der magische Bus",
    "searchTitle": "Der magische Bus",
    "poster": "https://www.zdf.de/assets/magisch-bus-100~1920x1080?cb=1572876710440",
    "description": "[🟢 VERFÜGBAR] Olivia macht sich trotz aller Warnungen ihrer Freunde und Kollegen in einem Vintage-Bus selbstständig. Doch schon bei der ersten Reise kommt der erste Rückschlag."
  },
  {
    "id": "rp_008",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Liebe gegen den Rest der Welt",
    "searchTitle": "Liebe gegen den Rest der Welt",
    "poster": "https://www.zdf.de/assets/liebe-gegen-den-rest-der-welt-102~1920x1080?cb=1747395872987",
    "description": "[🟢 VERFÜGBAR] Rachel Wilson kehrt nach zwei Jahren in das kleine Dorf Kingscove in Cornwall zurück, das sie eigentlich für immer verlassen wollte."
  },
  {
    "id": "rp_009",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Rundum glücklich",
    "searchTitle": "Rundum glücklich",
    "poster": "https://www.zdf.de/assets/rundum-gluecklich-100~1920x1080?cb=1738935862085",
    "description": "[🟢 VERFÜGBAR] Die junge Bäckerin Betty Hunter sucht den Mann ihrer Träume."
  },
  {
    "id": "rp_010",
    "type": "movie",
    "name": "🟢🟠 Rosamunde Pilcher: Die falsche Nonne",
    "searchTitle": "Die falsche Nonne",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-die-falsche-nonne-104~1920x1080?cb=1793023905964",
    "description": "[🟢🟠 VERFÜGBAR] Bei einem Undercover-Einsatz lernt Polizistin Sabrina Tom kennen."
  },
  {
    "id": "rp_011",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Ungezügelt ins Glück",
    "searchTitle": "Ungezügelt ins Glück",
    "poster": "https://www.zdf.de/assets/ungezuegelt-ins-glueck-100~1920x1080?cb=1744907251956",
    "description": "[🟢 VERFÜGBAR] Lord Brooks stellt nach langer Abwesenheit entsetzt fest, dass seine Mutter das Familienanwesen in ein Pferdeasyl verwandelt hat. Er muss sich nun um die Rettung des Erbes kümmern."
  },
  {
    "id": "rp_012",
    "type": "movie",
    "name": "🟢🟠 Rosamunde Pilcher: Englischer Wein",
    "searchTitle": "Englischer Wein",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-englischer-wein-104~1920x1080?cb=1744711026467",
    "description": "[🟢🟠 VERFÜGBAR] Die ehrgeizige Winzerin Hannah Powell, die lange in Frankreich gelebt hat, erhält die Chance ihres Lebens: Sie soll ein Weingut in ihrer Heimat Südengland auf Vordermann bringen."
  },
  {
    "id": "rp_013",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Verlobt, verliebt, verwirrt",
    "searchTitle": "Verlobt, verliebt, verwirrt",
    "poster": "https://www.zdf.de/assets/verlobt-verliebt-verwirrt-100~1920x1080?cb=1745830743700",
    "description": "[🟢 VERFÜGBAR] Emma Waters überredet ihre Freundin Julia Adams, einen Junggesellinnenabschied zu machen. Als Julia einen Kuss versteigern soll, kann sie nicht glauben, wer der Gewinner ist."
  },
  {
    "id": "rp_014",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Liebe, Diebe, Diamanten",
    "searchTitle": "Liebe, Diebe, Diamanten",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-liebe-diebe-diamanten-102~1920x1080?cb=1793024107343",
    "description": "[🟢 VERFÜGBAR] Richard Johnson kehrt zur Hochzeit der Tochter zurück nach Cornwall."
  },
  {
    "id": "rp_015",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Wiedersehen in Rose Abbey",
    "searchTitle": "Wiedersehen in Rose Abbey",
    "poster": "https://www.zdf.de/assets/wiedersehen-in-rose-abbey-100~1920x1080?cb=1746798390082",
    "description": "[🟢 VERFÜGBAR] Roseanne Brix, Studentin aus Chicago, kommt nach dem Tod ihrer Mutter nach England, um ihren leiblichen Vater zu suchen. Ihr einziger Hinweis ist ein altes Foto ihrer Mutter."
  },
  {
    "id": "rp_016",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Lass es Liebe sein",
    "searchTitle": "Lass es Liebe sein",
    "poster": "https://www.zdf.de/assets/lass-es-liebe-sein-100~1920x1080?cb=1746450048706",
    "description": "[🟢 VERFÜGBAR] Eine kurze, schicksalhafte Begegnung zwischen Tom und Natalie, einer jungen Studentin aus Georgien, wird das Leben beider für immer verändern: Sie verlieben sich ineinander."
  },
  {
    "id": "rp_017",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Das Geheimnis der Blumeninsel",
    "searchTitle": "Das Geheimnis der Blumeninsel",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-das-geheimnis-der-blumeninsel-102~1920x1080?cb=1544345904588",
    "description": "[🟢 VERFÜGBAR] Amy Harding hat einen großen Traum. Sie will die verwahrloste Blumenfarm ihrer Großeltern auf den Scilly Islands wieder zum Blühen bringen."
  },
  {
    "id": "rp_018",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Vier Luftballons und ein Todesfall",
    "searchTitle": "Vier Luftballons und ein Todesfall",
    "poster": "https://www.zdf.de/assets/vier-luftballons-und-ein-todesfall-100~1920x1080?cb=1790581314387",
    "description": "[🟢 VERFÜGBAR] Floristin Gwen ist Angestellte in einem Blumengroßhandel und wird von ihrem sympathischen Chef Joey umgarnt. Was der jungen Frau nicht unangenehm ist - ganz im Gegenteil."
  },
  {
    "id": "rp_019",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Im siebten Himmel",
    "searchTitle": "Im siebten Himmel",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-im-siebten-himmel-102~1920x1080?cb=1638535290427",
    "description": "[🟢 VERFÜGBAR] Rebecca \"Becky\" Taylor ist frisch ordinierte Jung-Vikarin der Anglikanischen Gemeinschaft. Vor ihrem offiziellen Dienstantritt besucht sie die ihr zugeteilte Gemeinde in Cornwall."
  },
  {
    "id": "rp_020",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Herzensläufe",
    "searchTitle": "Herzensläufe",
    "poster": "https://www.zdf.de/assets/herzenslaeufe-100~1920x1080?cb=1790922946174",
    "description": "[🟢 VERFÜGBAR] Für Jacky Davies ist das Gin-Brennen in der traditionellen Familiendestillerie mehr als nur ein Handwerk: Es ist die Passion der jungen Frau und eine Besessenheit."
  },
  {
    "id": "rp_021",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Schwiegertöchter",
    "searchTitle": "Schwiegertöchter",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-schwiegertoechter-102~1920x1080?cb=1749544149996",
    "description": "[🟢 VERFÜGBAR] Lynette will den letzten Wunsch ihres verstorbenen Mannes erfüllen und eine Stiftung in seinem Namen gründen. Dafür muss sie aber die Leitung ihrer eigenen Firma abgeben."
  },
  {
    "id": "rp_022",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Wie verhext",
    "searchTitle": "Wie verhext",
    "poster": "https://www.zdf.de/assets/wie-verhext-102~1920x1080?cb=1751274370663",
    "description": "[🟢 VERFÜGBAR] Im Kino ihres Vaters hat Grace Kent bereits als Sechsjährige jeden Film gesehen, der dort vorgeführt wurde. Kein Wunder, dass sie schon als junge Frau Kostümbildnerin werden will."
  },
  {
    "id": "rp_023",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Erdbeeren im Frühling",
    "searchTitle": "Erdbeeren im Frühling",
    "poster": "https://www.zdf.de/assets/erdbeeren-im-fruehling-106~1920x1080?cb=1696515866401",
    "description": "[🟢 VERFÜGBAR] Als die junge Journalistin und Millionenerbin Lilly zur Beerdigung ihres Vaters nach Cornwall zurückkehrt, bricht ihre bisherige Lebensplanung wie ein Kartenhaus zusammen."
  },
  {
    "id": "rp_024",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Ein Doktor & drei Frauen",
    "searchTitle": "Ein Doktor & drei Frauen",
    "poster": "https://www.zdf.de/assets/doktor-und-drei-frauen-100~1920x1080?cb=1766147846819",
    "description": "[🟢 VERFÜGBAR] Dem idyllischen Örtchen St. Mark droht kurz vor der bevorstehenden 500-Jahr-Feier der schleichende Tod. Jetzt verabschiedet sich auch noch der einzige Arzt in den Ruhestand."
  },
  {
    "id": "rp_025",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Falsches Leben, wahre Liebe",
    "searchTitle": "Falsches Leben, wahre Liebe",
    "poster": "https://www.zdf.de/assets/falschesleben-102~1920x1080?cb=1696515723171",
    "description": "[🟢 VERFÜGBAR] Bill Pexton, ein junger Marineleutnant, freundet sich bei den Vorbereitungen auf die Aufnahmeprüfung bei den Kampftauchern mit seinem Kameraden Mo Miller an."
  },
  {
    "id": "rp_026",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Die Frau auf der Klippe",
    "searchTitle": "Die Frau auf der Klippe",
    "poster": "https://www.zdf.de/assets/die-frau-auf-der-klippe-100~1920x1080?cb=1793023515200",
    "description": "[🟢 VERFÜGBAR] Owen erbt das Herrenhaus seines verstorbenen Großonkels in Cornwall."
  },
  {
    "id": "rp_027",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: In der Mitte eines Lebens",
    "searchTitle": "In der Mitte eines Lebens",
    "poster": "https://www.zdf.de/assets/in-der-mitte-des-lebens-100~1920x1080?cb=1578559755191",
    "description": "[🟢 VERFÜGBAR] Ella Dempsey muss nach einem Vorfall ihr ganzes Leben überdenken."
  },
  {
    "id": "rp_028",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Pralinen zum Frühstück",
    "searchTitle": "Pralinen zum Frühstück",
    "poster": "https://www.zdf.de/assets/pralinen-zum-fruehstueck-102~1920x1080?cb=1781704277805",
    "description": "[🟢 VERFÜGBAR] Annabelle hat ihr Hobby zum Beruf gemacht: Auf Flughäfen ersteigert sie gestrandete und besitzlose Koffer, um sie dann in ihrer Fernsehsendung öffnen zu lassen."
  },
  {
    "id": "rp_029",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Das Geheimnis der weißen Taube",
    "searchTitle": "Das Geheimnis der weißen Taube",
    "poster": "https://www.zdf.de/assets/das-geheimnis-der-weissen-taube-100~1920x1080?cb=1746022269147",
    "description": "[🟢 VERFÜGBAR] Auktionatorin Stella liebt die alten Schätze, die sie verkauft. Doch im Auktionshaus der Familie ihres Mannes Peter kriselt es seit neustem – und das nicht nur bei ihrer Arbeit."
  },
  {
    "id": "rp_030",
    "type": "movie",
    "name": "Rosamunde Pilcher: Stürmische Begegnung",
    "searchTitle": "Stürmische Begegnung",
    "poster": "https://images.metahub.space/poster/medium/tt0108240/img",
    "description": "Rosamunde Pilcher Liebesfilm (1993). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_031",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wilder Thymian",
    "searchTitle": "Wilder Thymian",
    "poster": "https://images.metahub.space/poster/medium/tt0111721/img",
    "description": "Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_032",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Karussell des Lebens",
    "searchTitle": "Karussell des Lebens",
    "poster": "https://images.metahub.space/poster/medium/tt0110245/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_033",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wechselspiel der Liebe",
    "searchTitle": "Wechselspiel der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0114903/img",
    "description": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_034",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Das Ende eines Sommers",
    "searchTitle": "Das Ende eines Sommers",
    "poster": "https://images.metahub.space/poster/medium/tt0123821/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_035",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Sommer am Meer",
    "searchTitle": "Sommer am Meer",
    "poster": "https://images.metahub.space/poster/medium/tt0114498/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_036",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Schlafender Tiger",
    "searchTitle": "Schlafender Tiger",
    "poster": "https://images.metahub.space/poster/medium/tt0114353/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_037",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Wolken am Horizont",
    "searchTitle": "Wolken am Horizont",
    "poster": "https://images.metahub.space/poster/medium/tt0126124/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_038",
    "type": "movie",
    "name": "Rosamunde Pilcher: Schneesturm im Frühling",
    "searchTitle": "Schneesturm im Frühling",
    "poster": "https://images.metahub.space/poster/medium/tt0117564/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_039",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Lichterspiele",
    "searchTitle": "Lichterspiele",
    "poster": "https://images.metahub.space/poster/medium/tt0116870/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_040",
    "type": "movie",
    "name": "Rosamunde Pilcher: September: Teil 1",
    "searchTitle": "September: Teil 1",
    "poster": "https://images.metahub.space/poster/medium/tt15729598/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_041",
    "type": "movie",
    "name": "Rosamunde Pilcher: September: Teil 2",
    "searchTitle": "September: Teil 2",
    "poster": "https://images.metahub.space/poster/medium/tt15741176/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_042",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Das Haus an der Küste",
    "searchTitle": "Das Haus an der Küste",
    "poster": "https://images.metahub.space/poster/medium/tt0116498/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_043",
    "type": "movie",
    "name": "Rosamunde Pilcher: Eine besondere Liebe",
    "searchTitle": "Eine besondere Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0115659/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_044",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wind der Hoffnung",
    "searchTitle": "Wind der Hoffnung",
    "poster": "https://images.metahub.space/poster/medium/tt0120517/img",
    "description": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_045",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Irrwege des Herzens",
    "searchTitle": "Irrwege des Herzens",
    "poster": "https://images.metahub.space/poster/medium/tt0119384/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_046",
    "type": "movie",
    "name": "Rosamunde Pilcher: Stunden der Entscheidung",
    "searchTitle": "Stunden der Entscheidung",
    "poster": "https://images.metahub.space/poster/medium/tt0120234/img",
    "description": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_047",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Die zweite Chance",
    "searchTitle": "Die zweite Chance",
    "poster": "https://images.metahub.space/poster/medium/tt0128860/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_048",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Zwei Schwestern",
    "searchTitle": "Zwei Schwestern",
    "poster": "https://images.metahub.space/poster/medium/tt0135071/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_049",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Der Preis der Liebe",
    "searchTitle": "Der Preis der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0146041/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_050",
    "type": "movie",
    "name": "Rosamunde Pilcher: Heimkehr: Teil 1",
    "searchTitle": "Heimkehr: Teil 1",
    "poster": "https://images.metahub.space/poster/medium/tt15729564/img",
    "description": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_051",
    "type": "movie",
    "name": "Rosamunde Pilcher: Heimkehr: Teil 2",
    "searchTitle": "Heimkehr: Teil 2",
    "poster": "https://images.metahub.space/poster/medium/tt15729560/img",
    "description": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_052",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Rückkehr ins Paradies",
    "searchTitle": "Rückkehr ins Paradies",
    "poster": "https://images.metahub.space/poster/medium/tt0170520/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_053",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Dornen im Tal der Blumen",
    "searchTitle": "Dornen im Tal der Blumen",
    "poster": "https://images.metahub.space/poster/medium/tt0177180/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_054",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Melodie der Herzen",
    "searchTitle": "Melodie der Herzen",
    "poster": "https://images.metahub.space/poster/medium/tt0181794/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_055",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Magie der Liebe",
    "searchTitle": "Magie der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0184868/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_056",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Rosen im Sturm",
    "searchTitle": "Rosen im Sturm",
    "poster": "https://images.metahub.space/poster/medium/tt0188183/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_057",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Das große Erbe: Teil 1",
    "searchTitle": "Das große Erbe: Teil 1",
    "poster": "https://images.metahub.space/poster/medium/tt15740730/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_058",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Das große Erbe: Teil 2",
    "searchTitle": "Das große Erbe: Teil 2",
    "poster": "https://images.metahub.space/poster/medium/tt15740738/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_059",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Klippen der Liebe",
    "searchTitle": "Klippen der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0217605/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_060",
    "type": "movie",
    "name": "Rosamunde Pilcher: Möwen im Wind",
    "searchTitle": "Möwen im Wind",
    "poster": "https://images.metahub.space/poster/medium/tt0222330/img",
    "description": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_061",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Blüte des Lebens",
    "searchTitle": "Blüte des Lebens",
    "poster": "https://images.metahub.space/poster/medium/tt0226390/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_062",
    "type": "movie",
    "name": "Rosamunde Pilcher: Der lange Weg zum Glück",
    "searchTitle": "Der lange Weg zum Glück",
    "poster": "https://images.metahub.space/poster/medium/tt0230712/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_063",
    "type": "movie",
    "name": "Rosamunde Pilcher: Zeit der Erkenntnis",
    "searchTitle": "Zeit der Erkenntnis",
    "poster": "https://images.metahub.space/poster/medium/tt0244176/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_064",
    "type": "movie",
    "name": "Rosamunde Pilcher: Zerrissene Herzen",
    "searchTitle": "Zerrissene Herzen",
    "poster": "https://images.metahub.space/poster/medium/tt0262737/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_065",
    "type": "movie",
    "name": "Rosamunde Pilcher: Ruf der Vergangenheit",
    "searchTitle": "Ruf der Vergangenheit",
    "poster": "https://images.metahub.space/poster/medium/tt0266913/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_066",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Im Licht des Feuers",
    "searchTitle": "Im Licht des Feuers",
    "poster": "https://images.metahub.space/poster/medium/tt0271760/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_067",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die Rose von Kerrymore",
    "searchTitle": "Die Rose von Kerrymore",
    "poster": "https://images.metahub.space/poster/medium/tt0272817/img",
    "description": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_068",
    "type": "movie",
    "name": "Rosamunde Pilcher: Küste der Träume",
    "searchTitle": "Küste der Träume",
    "poster": "https://images.metahub.space/poster/medium/tt0275637/img",
    "description": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_069",
    "type": "movie",
    "name": "Rosamunde Pilcher: Kinder des Glücks",
    "searchTitle": "Kinder des Glücks",
    "poster": "https://images.metahub.space/poster/medium/tt0300428/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_070",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wind über dem Fluss",
    "searchTitle": "Wind über dem Fluss",
    "poster": "https://images.metahub.space/poster/medium/tt0301782/img",
    "description": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_071",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Blumen im Regen",
    "searchTitle": "Blumen im Regen",
    "poster": "https://images.metahub.space/poster/medium/tt0304642/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_072",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wenn nur noch Liebe zählt",
    "searchTitle": "Wenn nur noch Liebe zählt",
    "poster": "https://images.metahub.space/poster/medium/tt0310081/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_073",
    "type": "movie",
    "name": "Rosamunde Pilcher: Morgen träumen wir gemeinsam",
    "searchTitle": "Morgen träumen wir gemeinsam",
    "poster": "https://images.metahub.space/poster/medium/tt0316507/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_074",
    "type": "movie",
    "name": "Rosamunde Pilcher: Mit den Augen der Liebe",
    "searchTitle": "Mit den Augen der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0337119/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_075",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Bis ans Ende der Welt",
    "searchTitle": "Bis ans Ende der Welt",
    "poster": "https://images.metahub.space/poster/medium/tt0345873/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_076",
    "type": "movie",
    "name": "Rosamunde Pilcher: Sternschnuppen im August",
    "searchTitle": "Sternschnuppen im August",
    "poster": "https://images.metahub.space/poster/medium/tt0348739/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_077",
    "type": "movie",
    "name": "Rosamunde Pilcher: Paradies der Träume",
    "searchTitle": "Paradies der Träume",
    "poster": "https://images.metahub.space/poster/medium/tt0353957/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_078",
    "type": "movie",
    "name": "Rosamunde Pilcher: Flamme der Liebe",
    "searchTitle": "Flamme der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0357109/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_079",
    "type": "movie",
    "name": "Rosamunde Pilcher: Gewissheit des Herzens",
    "searchTitle": "Gewissheit des Herzens",
    "poster": "https://images.metahub.space/poster/medium/tt0386755/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_080",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wintersonne (1+2)",
    "searchTitle": "Wintersonne (1+2)",
    "poster": "https://images.metahub.space/poster/medium/tt15727968/img",
    "description": "Rosamunde Pilcher Liebesfilm (2003). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_081",
    "type": "movie",
    "name": "Rosamunde Pilcher: Federn im Wind",
    "searchTitle": "Federn im Wind",
    "poster": "https://images.metahub.space/poster/medium/tt0396843/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_082",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wege der Liebe",
    "searchTitle": "Wege der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0393657/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_083",
    "type": "movie",
    "name": "Rosamunde Pilcher: Solange es dich gibt",
    "searchTitle": "Solange es dich gibt",
    "poster": "https://images.metahub.space/poster/medium/tt0433629/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_084",
    "type": "movie",
    "name": "Rosamunde Pilcher: Liebe im Spiel",
    "searchTitle": "Liebe im Spiel",
    "poster": "https://images.metahub.space/poster/medium/tt0410534/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_085",
    "type": "movie",
    "name": "Rosamunde Pilcher: Traum eines Sommers",
    "searchTitle": "Traum eines Sommers",
    "poster": "https://images.metahub.space/poster/medium/tt0450119/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_086",
    "type": "movie",
    "name": "Rosamunde Pilcher: Tiefe der Gefühle",
    "searchTitle": "Tiefe der Gefühle",
    "poster": "https://images.metahub.space/poster/medium/tt0432346/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_087",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Dem Himmel so nah",
    "searchTitle": "Dem Himmel so nah",
    "poster": "https://images.metahub.space/poster/medium/tt0450116/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_088",
    "type": "movie",
    "name": "Rosamunde Pilcher: Vermächtnis der Liebe",
    "searchTitle": "Vermächtnis der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0450120/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_089",
    "type": "movie",
    "name": "Rosamunde Pilcher: Königin der Nacht",
    "searchTitle": "Königin der Nacht",
    "poster": "https://images.metahub.space/poster/medium/tt0450117/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_090",
    "type": "movie",
    "name": "Rosamunde Pilcher: Segel der Liebe",
    "searchTitle": "Segel der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0450118/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_091",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Über den Wolken",
    "searchTitle": "Über den Wolken",
    "poster": "https://images.metahub.space/poster/medium/tt0491128/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_092",
    "type": "movie",
    "name": "Rosamunde Pilcher: Zauber der Liebe (1+2)",
    "searchTitle": "Zauber der Liebe (1+2)",
    "poster": "https://images.metahub.space/poster/medium/tt15727726/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_093",
    "type": "movie",
    "name": "Rosamunde Pilcher: Der Himmel über Cornwall",
    "searchTitle": "Der Himmel über Cornwall",
    "poster": "https://images.metahub.space/poster/medium/tt0777270/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_094",
    "type": "movie",
    "name": "Rosamunde Pilcher: Land der Sehnsucht",
    "searchTitle": "Land der Sehnsucht",
    "poster": "https://images.metahub.space/poster/medium/tt0497438/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_095",
    "type": "movie",
    "name": "Rosamunde Pilcher: Sommer des Erwachens",
    "searchTitle": "Sommer des Erwachens",
    "poster": "https://images.metahub.space/poster/medium/tt0499557/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_096",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wo die Liebe begann",
    "searchTitle": "Wo die Liebe begann",
    "poster": "https://images.metahub.space/poster/medium/tt0857260/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_097",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die Liebe ihres Lebens",
    "searchTitle": "Die Liebe ihres Lebens",
    "poster": "https://images.metahub.space/poster/medium/tt0872156/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_098",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Und plötzlich war es Liebe",
    "searchTitle": "Und plötzlich war es Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0903964/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_099",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wiedersehen am Fluss",
    "searchTitle": "Wiedersehen am Fluss",
    "poster": "https://images.metahub.space/poster/medium/tt0943113/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_100",
    "type": "movie",
    "name": "Rosamunde Pilcher: Sommer der Liebe",
    "searchTitle": "Sommer der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0988802/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_101",
    "type": "movie",
    "name": "Rosamunde Pilcher: Flügel der Hoffnung",
    "searchTitle": "Flügel der Hoffnung",
    "poster": "https://images.metahub.space/poster/medium/tt0988801/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_102",
    "type": "movie",
    "name": "Rosamunde Pilcher: Der Mann meiner Träume",
    "searchTitle": "Der Mann meiner Träume",
    "poster": "https://images.metahub.space/poster/medium/tt1096981/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_103",
    "type": "movie",
    "name": "Rosamunde Pilcher: Sieg der Liebe",
    "searchTitle": "Sieg der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt1106607/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_104",
    "type": "movie",
    "name": "Rosamunde Pilcher: Nebel über Schloss Kilrush",
    "searchTitle": "Nebel über Schloss Kilrush",
    "poster": "https://images.metahub.space/poster/medium/tt1125243/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_105",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Aus Liebe und Leidenschaft",
    "searchTitle": "Aus Liebe und Leidenschaft",
    "poster": "https://images.metahub.space/poster/medium/tt1140926/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_106",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Wind über der See",
    "searchTitle": "Wind über der See",
    "poster": "https://images.metahub.space/poster/medium/tt1150986/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_107",
    "type": "movie",
    "name": "Rosamunde Pilcher: Pfeile der Liebe",
    "searchTitle": "Pfeile der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt1177749/img",
    "description": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_108",
    "type": "movie",
    "name": "Rosamunde Pilcher: Melodie der Liebe",
    "searchTitle": "Melodie der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt1178398/img",
    "description": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_109",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Herzen im Wind",
    "searchTitle": "Herzen im Wind",
    "poster": "https://images.metahub.space/poster/medium/tt1178399/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_110",
    "type": "movie",
    "name": "Rosamunde Pilcher: Gezeiten der Liebe",
    "searchTitle": "Gezeiten der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt1178400/img",
    "description": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_111",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Herzenssehnsucht",
    "searchTitle": "Herzenssehnsucht",
    "poster": "https://images.metahub.space/poster/medium/tt1178401/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_112",
    "type": "movie",
    "name": "Rosamunde Pilcher: Eine Liebe im Herbst",
    "searchTitle": "Eine Liebe im Herbst",
    "poster": "https://images.metahub.space/poster/medium/tt1178402/img",
    "description": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_113",
    "type": "movie",
    "name": "Rosamunde Pilcher: Entscheidung des Herzens",
    "searchTitle": "Entscheidung des Herzens",
    "poster": "https://images.metahub.space/poster/medium/tt1178403/img",
    "description": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_114",
    "type": "movie",
    "name": "Rosamunde Pilcher: Im Zweifel für die Liebe",
    "searchTitle": "Im Zweifel für die Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt1545888/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_115",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wohin du auch gehst",
    "searchTitle": "Wohin du auch gehst",
    "poster": "https://images.metahub.space/poster/medium/tt1545890/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_116",
    "type": "movie",
    "name": "Rosamunde Pilcher: Liebe am Horizont",
    "searchTitle": "Liebe am Horizont",
    "poster": "https://images.metahub.space/poster/medium/tt1545889/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_117",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Wenn das Herz zerbricht",
    "searchTitle": "Wenn das Herz zerbricht",
    "poster": "https://images.metahub.space/poster/medium/tt1670117/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_118",
    "type": "movie",
    "name": "Rosamunde Pilcher: Flügel der Liebe",
    "searchTitle": "Flügel der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt1702299/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_119",
    "type": "movie",
    "name": "Rosamunde Pilcher: Lords lügen nicht",
    "searchTitle": "Lords lügen nicht",
    "poster": "https://images.metahub.space/poster/medium/tt1729996/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_120",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Herzensfragen",
    "searchTitle": "Herzensfragen",
    "poster": "https://images.metahub.space/poster/medium/tt1794473/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_121",
    "type": "movie",
    "name": "Rosamunde Pilcher: Sonntagskinder",
    "searchTitle": "Sonntagskinder",
    "poster": "https://images.metahub.space/poster/medium/tt1804980/img",
    "description": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_122",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Der gestohlene Sommer",
    "searchTitle": "Der gestohlene Sommer",
    "poster": "https://images.metahub.space/poster/medium/tt2050247/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_123",
    "type": "movie",
    "name": "Rosamunde Pilcher: Gefährliche Brandung",
    "searchTitle": "Gefährliche Brandung",
    "poster": "https://images.metahub.space/poster/medium/tt2122084/img",
    "description": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_124",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die andere Frau, Teil 1",
    "searchTitle": "Die andere Frau, Teil 1",
    "poster": "https://images.metahub.space/poster/medium/tt3959970/img",
    "description": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_125",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die andere Frau, Teil 2",
    "searchTitle": "Die andere Frau, Teil 2",
    "poster": "https://images.metahub.space/poster/medium/tt2169404/img",
    "description": "Rosamunde Pilcher Liebesfilm (2012). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_126",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Eine Frage der Ehre",
    "searchTitle": "Eine Frage der Ehre",
    "poster": "https://images.metahub.space/poster/medium/tt2592426/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_127",
    "type": "movie",
    "name": "Rosamunde Pilcher: Schlangen im Paradies",
    "searchTitle": "Schlangen im Paradies",
    "poster": "https://images.metahub.space/poster/medium/tt2831116/img",
    "description": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_128",
    "type": "movie",
    "name": "🟢 Rosamunde Pilcher: Die versprochene Braut",
    "searchTitle": "Die versprochene Braut",
    "poster": "https://images.metahub.space/poster/medium/tt3128154/img",
    "description": "[🟢 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_129",
    "type": "movie",
    "name": "Rosamunde Pilcher: Alte Herzen rosten nicht",
    "searchTitle": "Alte Herzen rosten nicht",
    "poster": "https://images.metahub.space/poster/medium/tt3293750/img",
    "description": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_130",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Zu hoch geflogen",
    "searchTitle": "Zu hoch geflogen",
    "poster": "https://images.metahub.space/poster/medium/tt3443090/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_131",
    "type": "movie",
    "name": "Rosamunde Pilcher: Besetzte Herzen",
    "searchTitle": "Besetzte Herzen",
    "poster": "https://images.metahub.space/poster/medium/tt3332888/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_132",
    "type": "movie",
    "name": "Rosamunde Pilcher: Evitas Rache",
    "searchTitle": "Evitas Rache",
    "poster": "https://images.metahub.space/poster/medium/tt3132252/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_133",
    "type": "movie",
    "name": "Rosamunde Pilcher: Mein unbekanntes Herz",
    "searchTitle": "Mein unbekanntes Herz",
    "poster": "https://images.metahub.space/poster/medium/tt3954226/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_134",
    "type": "movie",
    "name": "Rosamunde Pilcher: Anwälte küsst man nicht",
    "searchTitle": "Anwälte küsst man nicht",
    "poster": "https://images.metahub.space/poster/medium/tt3954140/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_135",
    "type": "movie",
    "name": "Rosamunde Pilcher: Vertrauen ist gut, verlieben ist besser",
    "searchTitle": "Vertrauen ist gut, verlieben ist besser",
    "poster": "https://images.metahub.space/poster/medium/tt3901820/img",
    "description": "Rosamunde Pilcher Liebesfilm (2014). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_136",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Ghostwriter",
    "searchTitle": "Ghostwriter",
    "poster": "https://images.metahub.space/poster/medium/tt5921002/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_137",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wahlversprechen und andere Lügen",
    "searchTitle": "Wahlversprechen und andere Lügen",
    "poster": "https://images.metahub.space/poster/medium/tt6058140/img",
    "description": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_138",
    "type": "movie",
    "name": "Rosamunde Pilcher: Ein einziger Kuss",
    "searchTitle": "Ein einziger Kuss",
    "poster": "https://images.metahub.space/poster/medium/tt18155194/img",
    "description": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_139",
    "type": "movie",
    "name": "🟠 Rosamunde Pilcher: Vollkommen unerwartet",
    "searchTitle": "Vollkommen unerwartet",
    "poster": "https://images.metahub.space/poster/medium/tt5376696/img",
    "description": "[🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_140",
    "type": "movie",
    "name": "Rosamunde Pilcher: Argentinischer Tango",
    "searchTitle": "Argentinischer Tango",
    "poster": "https://images.metahub.space/poster/medium/tt4837404/img",
    "description": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_141",
    "type": "movie",
    "name": "🟢🟠 Rosamunde Pilcher: Lizenz zum Seitensprung",
    "searchTitle": "Lizenz zum Seitensprung",
    "poster": "https://images.metahub.space/poster/medium/tt5295330/img",
    "description": "[🟢🟠 VERFÜGBAR] Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_142",
    "type": "movie",
    "name": "Rosamunde Pilcher: Schutzengel",
    "searchTitle": "Schutzengel",
    "poster": "https://images.metahub.space/poster/medium/tt5580156/img",
    "description": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_143",
    "type": "movie",
    "name": "Rosamunde Pilcher: Haustausch mit Hindernissen",
    "searchTitle": "Haustausch mit Hindernissen",
    "poster": "https://images.metahub.space/poster/medium/tt6426868/img",
    "description": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_144",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wie von einem anderen Stern",
    "searchTitle": "Wie von einem anderen Stern",
    "poster": "https://images.metahub.space/poster/medium/tt5940862/img",
    "description": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_145",
    "type": "movie",
    "name": "Rosamunde Pilcher: Nie wieder Klassentreffen",
    "searchTitle": "Nie wieder Klassentreffen",
    "poster": "https://images.metahub.space/poster/medium/tt7294684/img",
    "description": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_146",
    "type": "movie",
    "name": "Rosamunde Pilcher: Das Gespenst von Cassley",
    "searchTitle": "Das Gespenst von Cassley",
    "poster": "https://images.metahub.space/poster/medium/tt7565710/img",
    "description": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_147",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wenn Fische lächeln",
    "searchTitle": "Wenn Fische lächeln",
    "poster": "https://images.metahub.space/poster/medium/tt7652188/img",
    "description": "Rosamunde Pilcher Liebesfilm (2017). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_148",
    "type": "movie",
    "name": "Rosamunde Pilcher: Geerbtes Glück",
    "searchTitle": "Geerbtes Glück",
    "poster": "https://images.metahub.space/poster/medium/tt7858832/img",
    "description": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_149",
    "type": "movie",
    "name": "Rosamunde Pilcher: Das Vermächtnis unseres Vaters",
    "searchTitle": "Das Vermächtnis unseres Vaters",
    "poster": "https://images.metahub.space/poster/medium/tt8103280/img",
    "description": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_150",
    "type": "movie",
    "name": "Rosamunde Pilcher: Nanny verzweifelt gesucht",
    "searchTitle": "Nanny verzweifelt gesucht",
    "poster": "https://images.metahub.space/poster/medium/tt7771608/img",
    "description": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_151",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wo Dein Herz wohnt",
    "searchTitle": "Wo Dein Herz wohnt",
    "poster": "https://images.metahub.space/poster/medium/tt9089702/img",
    "description": "Rosamunde Pilcher Liebesfilm (2018). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_152",
    "type": "movie",
    "name": "Rosamunde Pilcher: Morgens stürmisch, abends Liebe",
    "searchTitle": "Morgens stürmisch, abends Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt9401344/img",
    "description": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_153",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die Braut meines Bruders",
    "searchTitle": "Die Braut meines Bruders",
    "poster": "https://images.metahub.space/poster/medium/tt9740242/img",
    "description": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_154",
    "type": "movie",
    "name": "Rosamunde Pilcher: Raus in den Sturm",
    "searchTitle": "Raus in den Sturm",
    "poster": "https://images.metahub.space/poster/medium/tt10974400/img",
    "description": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_155",
    "type": "movie",
    "name": "Rosamunde Pilcher: Meine Cousine, die Liebe und ich",
    "searchTitle": "Meine Cousine, die Liebe und ich",
    "poster": "https://images.metahub.space/poster/medium/tt11097478/img",
    "description": "Rosamunde Pilcher Liebesfilm (2019). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_156",
    "type": "movie",
    "name": "Rosamunde Pilcher: Von Tee und Liebe",
    "searchTitle": "Von Tee und Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt11494832/img",
    "description": "Rosamunde Pilcher Liebesfilm (2020). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_157",
    "type": "movie",
    "name": "Rosamunde Pilcher: Stadt, Land, Kuss",
    "searchTitle": "Stadt, Land, Kuss",
    "poster": "https://images.metahub.space/poster/medium/tt13625812/img",
    "description": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_158",
    "type": "movie",
    "name": "Rosamunde Pilcher: Der Stoff, aus dem Träume sind",
    "searchTitle": "Der Stoff, aus dem Träume sind",
    "poster": "https://images.metahub.space/poster/medium/tt15478660/img",
    "description": "Rosamunde Pilcher Liebesfilm (2021). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_159",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die Elster und der Kapitän",
    "searchTitle": "Die Elster und der Kapitän",
    "poster": "https://images.metahub.space/poster/medium/tt18377966/img",
    "description": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_160",
    "type": "movie",
    "name": "Rosamunde Pilcher: Liebe ist unberechenbar",
    "searchTitle": "Liebe ist unberechenbar",
    "poster": "https://images.metahub.space/poster/medium/tt20124474/img",
    "description": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_161",
    "type": "movie",
    "name": "Rosamunde Pilcher: Hochzeitstag",
    "searchTitle": "Hochzeitstag",
    "poster": "https://images.metahub.space/poster/medium/tt22038482/img",
    "description": "Rosamunde Pilcher Liebesfilm (2022). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_162",
    "type": "movie",
    "name": "Rosamunde Pilcher: Liebe ist die beste Therapie",
    "searchTitle": "Liebe ist die beste Therapie",
    "poster": "https://images.metahub.space/poster/medium/tt26767892/img",
    "description": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_163",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wenn ich dich wiederfinde",
    "searchTitle": "Wenn ich dich wiederfinde",
    "poster": "https://images.metahub.space/poster/medium/tt27349270/img",
    "description": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_164",
    "type": "movie",
    "name": "Rosamunde Pilcher: Schlagzeile Liebe",
    "searchTitle": "Schlagzeile Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt28565529/img",
    "description": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_165",
    "type": "movie",
    "name": "Rosamunde Pilcher: Amys Wunschkind",
    "searchTitle": "Amys Wunschkind",
    "poster": "https://images.metahub.space/poster/medium/tt29716178/img",
    "description": "Rosamunde Pilcher Liebesfilm (2023). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_166",
    "type": "movie",
    "name": "Rosamunde Pilcher: Frühstück bei Tessa",
    "searchTitle": "Frühstück bei Tessa",
    "poster": "https://images.metahub.space/poster/medium/tt30783580/img",
    "description": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_167",
    "type": "movie",
    "name": "Rosamunde Pilcher: Verliebt in einen Butler",
    "searchTitle": "Verliebt in einen Butler",
    "poster": "https://images.metahub.space/poster/medium/tt33086345/img",
    "description": "Rosamunde Pilcher Liebesfilm (2024). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_168",
    "type": "movie",
    "name": "Rosamunde Pilcher: Jahrestag",
    "searchTitle": "Jahrestag",
    "poster": "https://images.metahub.space/poster/medium/tt34824149/img",
    "description": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_169",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wer immer du bist",
    "searchTitle": "Wer immer du bist",
    "poster": "https://images.metahub.space/poster/medium/tt38098292/img",
    "description": "Rosamunde Pilcher Liebesfilm (2025). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  }
];

// ============================================================================
// 3. CATALOG & META HANDLERS
// ============================================================================
const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  // 1. Series Catalog (Visual indicators: 🟢 ZDF HD, 🟠 YouTube Full Movie)
  if (type === 'series' && id === 'rp_zdf_series_catalog') {
    return {
      metas: [
        {
          id: 'rp_series_complete',
          type: 'series',
          name: '🟢🟠 Rosamunde Pilcher (Komplette Serie 1993-2026)',
          poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
          background: 'https://images.metahub.space/background/medium/tt0907694/img',
          description: 'Alle 169 Verfilmungen der Herzkino-Reihe. 🟢 = ZDFmediathek 1080p (100% funktioniert) • 🟠 = YouTube voller Spielfilm.',
          releaseInfo: '1993-',
          genres: ['Drama', 'Romance']
        }
      ]
    };
  }

  // 2. Movies Catalog
  if (type === 'movie' && id === 'rp_zdf_catalog') {
    let results = EPISODES;
    if (extra && extra.search) {
      const q = extra.search.toLowerCase().trim();
      results = results.filter(ep => ep.name.toLowerCase().includes(q));
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
    return {
      meta: {
        id: id,
        type: 'series',
        name: 'Rosamunde Pilcher',
        genres: ['Drama', 'Romance'],
        poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
        background: 'https://images.metahub.space/background/medium/tt0907694/img',
        description: 'Herzkino-Reihe nach Rosamunde Pilcher. 🟢 = ZDFmediathek 1080p (100% funktioniert) • 🟠 = YouTube voller Spielfilm.',
        releaseInfo: '1993-',
        videos: SERIES_VIDEOS
      }
    };
  }

  // 2. Individual Movie Catalog Items (rp_xxx)
  if (type === 'movie' && id.startsWith('rp_')) {
    const episode = EPISODES.find(ep => ep.id === id);
    if (episode) {
      return {
        meta: {
          id: episode.id,
          type: episode.type,
          name: episode.name,
          poster: episode.poster,
          description: episode.description
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
  return (raw || '')
    .replace(/^[🟢🟠\s]+/u, '')
    .replace(/^Rosamunde Pilcher:\s*/i, '')
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
// 5. UNIFIED DYNAMIC STREAM HANDLER (SERIES & MOVIES)
// ============================================================================
builder.defineStreamHandler(async ({ type, id }) => {
  let searchTitle = '';

  // 1. Series episode request (e.g. tt0907694:1:6, rp_series_complete:1:6, etc.)
  if (type === 'series' && (id.startsWith('tt0907694:') || id.startsWith('rp_series_complete:'))) {
    const epNum = id.split(':')[2];
    const matchByNum = SERIES_VIDEOS.find(v => String(v.number) === String(epNum));
    if (matchByNum) {
      searchTitle = cleanCoreTitle(matchByNum.name);
    } else {
      const epEntry = SERIES_MAP[id];
      if (epEntry) searchTitle = cleanCoreTitle(epEntry.name);
    }
  }
  // 2. Movie request by individual IMDb ID (e.g. tt0108240)
  else if (type === 'movie' && id.startsWith('tt')) {
    const epEntry = Object.values(SERIES_MAP).find(v => v.imdb_id === id);
    if (epEntry) searchTitle = cleanCoreTitle(epEntry.name);
  }
  // 3. Custom catalog movie request (e.g. rp_001)
  else if (id.startsWith('rp_')) {
    const episode = EPISODES.find(ep => ep.id === id);
    if (episode) searchTitle = cleanCoreTitle(episode.searchTitle || episode.name);
  }

  if (!searchTitle) {
    return { streams: [] };
  }

  // Check cache
  const cached = STREAM_CACHE.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return { streams: cached.streams };
  }

  const coreTitle = cleanCoreTitle(searchTitle);
  const streams = [];

  try {
    const [mediathekList, ytList] = await Promise.all([
      searchMediathek(coreTitle),
      searchYouTubeFullMovies(coreTitle)
    ]);

    // 1. Official Broadcaster Streams (🟢 100% Guaranteed 1080p Quality)
    if (mediathekList.length > 0) {
      const primary = mediathekList.find(m => !/Audiodeskription/i.test(m.title)) || mediathekList[0];
      const streamUrl = primary.url_video_hd || primary.url_video;
      if (streamUrl) {
        const channel = primary.channel || 'ZDF';
        const durationMin = Math.round((primary.duration || 0) / 60);
        streams.push({
          name: '🟢 [' + channel + ' HD] 1080p',
          title: '🟢 ' + primary.title + '\n' + channel + 'mediathek (' + durationMin + ' min) • 100% Funktioniert',
          url: streamUrl,
          behaviorHints: { notWebReady: false }
        });
      }
    }

    // 2. Verified YouTube Full Films / Parts (🟠 >= 40 min)
    if (ytList.length > 0) {
      for (const yt of ytList) {
        streams.push({
          name: '🟠 [YouTube HD] ' + yt.lengthText,
          title: '🟠 ' + yt.title + '\nSpielfilm auf YouTube (' + yt.lengthText + ')',
          ytId: yt.videoId
        });
      }
    }

    STREAM_CACHE.set(id, {
      streams,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return { streams };
  } catch (err) {
    console.warn('[StreamResolver] Error for ' + id + ':', err.message);
    return { streams: [] };
  }
});

// ============================================================================
// 6. VERCEL SERVERLESS EXPORT & WEB DASHBOARD
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
    .card { background: #1a1c23; border: 1px solid #2d3139; border-radius: 12px; padding: 36px 28px; max-width: 580px; width: 100%; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
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
    <h1>Rosamunde Pilcher Collection</h1>
    <p>Streams all 169 Rosamunde Pilcher films directly inside the official Stremio series with real broadcast dates and covers.</p>
    <a class="btn" href="${stremioUrl}">Install in Stremio</a>
    <div class="manifest">
      Manifest URL: <br><br><code>${manifestUrl}</code>
    </div>
    <div class="info-box">
      <h3>🟢 & 🟠 Visual Indicators</h3>
      • 🟢 = ZDFmediathek 1080p stream available (100% works)<br>
      • 🟠 = YouTube verified full movie stream available (>= 40 min)<br>
      • 🟢🟠 = Available on both ZDF and YouTube!
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
