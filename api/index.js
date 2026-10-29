const { addonBuilder, getRouter: sdkGetRouter } = require('stremio-addon-sdk');
const axios = require('axios');

// ============================================================================
// 1. MANIFEST CONFIGURATION
// ============================================================================
const manifest = {
  id: 'community.rosamunde-pilcher-zdf',
  version: '1.0.0',
  name: 'ZDF Rosamunde Pilcher Collection',
  description: 'Streams Rosamunde Pilcher films directly from ZDFmediathek',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie'],
  idPrefixes: ['rp_'],
  catalogs: [
    {
      type: 'movie',
      id: 'rp_zdf_catalog',
      name: 'Rosamunde Pilcher (ZDF)'
    }
  ]
};

// ============================================================================
// 2. EPISODE DATABASE
// ============================================================================
// HOW TO EXPAND THIS DATABASE (120+ EPISODES):
// Simply append new objects to this array.
// - id: Must begin with 'rp_' followed by a unique number or slug (e.g. 'rp_006', 'rp_007').
// - type: Always 'movie' so Stremio treats each film as a standalone TV-movie.
// - name: The exact German title as indexed in ZDF / ZDFmediathek.
// - poster: A poster image URL (or a placeholder).
// - description: Synopsis or storyline.
// ============================================================================
const EPISODES = [
  {
    id: 'rp_001',
    type: 'movie',
    name: 'Rosamunde Pilcher: Herzensläufe',
    poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
    description: 'Alice steht kurz vor dem Einzug mit ihrem Verlobten Oliver. Doch die unerwartete Begegnung mit dem Architekten Robin stellt ihr gesamtes Lebens- und Liebeskonzept auf den Kopf.'
  },
  {
    id: 'rp_002',
    type: 'movie',
    name: 'Rosamunde Pilcher: Amys Wasserfall',
    poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
    description: 'Amy kehrt in ihr idyllisches Heimatdorf in Cornwall zurück, um das Erbe ihrer Großmutter anzutreten. Dabei begegnet sie ihrer Jugendliebe und lüftet ein lang gehütetes Familiengeheimnis.'
  },
  {
    id: 'rp_003',
    type: 'movie',
    name: 'Rosamunde Pilcher: Wo Liebe aufhört und wo sie beginnt',
    poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
    description: 'Kate liebt die Arbeit in ihrem kleinen Café, das sie mit ihrer Freundin Polly betreibt. Ihr großer Traum ist ein eigenes Literaturcafé, doch die Liebe zu ihrem Mann stellt sie vor eine schwere Entscheidung.'
  },
  {
    id: 'rp_004',
    type: 'movie',
    name: 'Rosamunde Pilcher: Die Glücksbringerin',
    poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
    description: 'Goldschmiedin Emily findet durch einen alten Familienring nicht nur berufliche Inspiration, sondern schlittert an der malerischen Küste Cornwalls geradewegs in eine neue Liebe.'
  },
  {
    id: 'rp_005',
    type: 'movie',
    name: 'Rosamunde Pilcher: Einspruch für die Liebe',
    poster: 'https://images.metahub.space/poster/medium/tt0907694/img',
    description: 'Zwei engagierte Anwälte fechten im Gerichtssaal einen erbitterten Erbstreit aus. Doch abseits der juristischen Paragrafen sprühen zwischen beiden bald unverhoffte Funken.'
  }
];

// Initialize Stremio Addon Builder
const builder = new addonBuilder(manifest);

// ============================================================================
// 3. CATALOG HANDLER
// ============================================================================
// Exposes the static catalog to appear as a dedicated row in Stremio's Discover section.
builder.defineCatalogHandler(async ({ type, id }) => {
  if (type === 'movie' && id === 'rp_zdf_catalog') {
    return {
      metas: EPISODES.map(ep => ({
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

// ============================================================================
// 4. META HANDLER
// ============================================================================
// Returns detailed metadata when a user clicks on a movie card.
builder.defineMetaHandler(async ({ type, id }) => {
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
// 5. DYNAMIC STREAM HANDLER
// ============================================================================
// Dynamically fetches the direct .m3u8 / .mp4 video stream from ZDF via MediathekViewWeb
builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== 'movie' || !id.startsWith('rp_')) {
    return { streams: [] };
  }

  const episode = EPISODES.find(ep => ep.id === id);
  if (!episode) {
    return { streams: [] };
  }

  try {
    const MEDIATHEK_API_URL = 'https://mediathekviewweb.de/api/query';

    // 1. Primary query using the exact film title
    const payload = {
      queries: [
        {
          fields: ['title'],
          query: episode.name
        },
        {
          fields: ['channel'],
          query: 'ZDF'
        }
      ],
      sortBy: 'timestamp',
      sortOrder: 'desc',
      future: false
    };

    let response = await axios.post(MEDIATHEK_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    let results = response.data?.result?.results || [];

    // Fallback: If ZDF indexed the film by subtitle only (without "Rosamunde Pilcher:"),
    // retry the query using only the subtitle portion.
    if (results.length === 0 && episode.name.includes(':')) {
      const subTitle = episode.name.split(':')[1].trim();
      const fallbackPayload = {
        queries: [
          {
            fields: ['title'],
            query: subTitle
          },
          {
            fields: ['channel'],
            query: 'ZDF'
          }
        ],
        sortBy: 'timestamp',
        sortOrder: 'desc',
        future: false
      };

      response = await axios.post(MEDIATHEK_API_URL, fallbackPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      results = response.data?.result?.results || [];
    }

    if (!results || results.length === 0) {
      console.warn(`[Rosamunde Pilcher] No stream found in ZDFmediathek for: "${episode.name}"`);
      return { streams: [] };
    }

    // Filter out short preview teasers / trailers and Audiodeskription (AD) if regular feature exists
    const fullMovie = results.find(item => {
      const titleLower = (item.title || '').toLowerCase();
      const isAd = titleLower.includes('audiodeskription');
      const isTrailer = titleLower.includes('trailer') || titleLower.includes('darum geht');
      return !isAd && !isTrailer;
    });

    // Select the best match, or fall back to the first available result
    const selectedItem = fullMovie || results[0];

    // Extract the HD stream URL, falling back to standard video URL if needed
    const streamUrl = selectedItem.url_video_hd || selectedItem.url_video;
    if (!streamUrl) {
      return { streams: [] };
    }

    return {
      streams: [
        {
          name: 'ZDFmediathek',
          title: 'ZDFmediathek (HD German)',
          url: streamUrl,
          behaviorHints: {
            notWebReady: false
          }
        }
      ]
    };
  } catch (error) {
    console.error(`[Rosamunde Pilcher] Error querying MediathekViewWeb for "${episode.name}":`, error.message);
    return { streams: [] };
  }
});

// ============================================================================
// 6. VERCEL SERVERLESS EXPORT
// ============================================================================
// Polyfill createRouter() if not natively attached to builder.getInterface() in the SDK
const addonInterface = builder.getInterface();
if (typeof addonInterface.createRouter !== 'function') {
  addonInterface.createRouter = () => sdkGetRouter(addonInterface);
}

const getRouter = builder.getInterface().createRouter();
module.exports = (req, res) => {
    getRouter(req, res, () => {
        res.statusCode = 404;
        res.end();
    });
};
