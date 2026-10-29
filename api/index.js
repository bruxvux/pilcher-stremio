const { addonBuilder, getRouter: sdkGetRouter } = require('stremio-addon-sdk');
const axios = require('axios');

// ============================================================================
// 1. MANIFEST CONFIGURATION
// ============================================================================
const manifest = {
  id: 'community.rosamunde-pilcher-zdf',
  version: '1.1.0',
  name: 'ZDF Rosamunde Pilcher Collection',
  description: 'Streams Rosamunde Pilcher films directly from ZDFmediathek with distinct covers',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie'],
  idPrefixes: ['rp_'],
  catalogs: [
    {
      type: 'movie',
      id: 'rp_zdf_catalog',
      name: 'Rosamunde Pilcher (ZDF)',
      extra: [
        { name: 'search', isRequired: false }
      ]
    }
  ]
};

// ============================================================================
// 2. EPISODE DATABASE (ALL CURRENT ZDF FILMS WITH DISTINCT HIGH-RES COVERS)
// ============================================================================
const EPISODES = [
  {
    "id": "rp_001",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die Glücksbringerin",
    "searchTitle": "Die Glücksbringerin",
    "poster": "https://epg-image.zdf.de/fotobase-webdelivery/images/45cdebaf-8fbe-498c-aafd-57730994f4d4?layout=768x432",
    "description": "Schornsteinfegerin Clare Ridley gilt als Glücksbringerin in ihrem Ort. Doch plötzlich wird sie des Diebstahls verdächtigt, selbst von ihrer Jugendliebe Josh Harding."
  },
  {
    "id": "rp_002",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wo Liebe aufhört und wo sie beginnt",
    "searchTitle": "Wo Liebe aufhört und wo sie beginnt",
    "poster": "https://www.zdf.de/assets/hero-pilcher-wo-die-liebe-aufhoert-100~1920x1080?cb=1776694369640",
    "description": "Kate liebt die Arbeit in ihrem kleinen Café, das sie mit ihrer Freundin Polly betreibt. Ihr großer Traum: Ein eigenes Literaturcafé. Doch aus Liebe zu ihrem Mann stellt sie diesen zurück."
  },
  {
    "id": "rp_003",
    "type": "movie",
    "name": "Rosamunde Pilcher: Einspruch für die Liebe",
    "searchTitle": "Einspruch für die Liebe",
    "poster": "https://epg-image.zdf.de/fotobase-webdelivery/images/14639eee-55be-4062-8284-904f5faf3e73?layout=768x432",
    "description": "Unter dem Motto \"Harte Arbeit zahlt sich aus\" hat sich Anwalt Bill Reynolds eine renommierte Kanzlei aufgebaut und den Ruf erarbeitet, fast alle Verfahren vor Gericht zu gewinnen."
  },
  {
    "id": "rp_004",
    "type": "movie",
    "name": "Rosamunde Pilcher: Ex & Liebe",
    "searchTitle": "Ex & Liebe",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-ex-und-liebe-102~1920x1080?cb=1680097215435",
    "description": "Auf dem Weg zu seiner Mutter hat Bruno mit seinem Oldtimer eine Panne, die sein Leben verändern wird. Sophie, die einstige Liebe seines Lebens, steht plötzlich vor ihm."
  },
  {
    "id": "rp_005",
    "type": "movie",
    "name": "Rosamunde Pilcher: Fast noch verheiratet",
    "searchTitle": "Fast noch verheiratet",
    "poster": "https://www.zdf.de/assets/fast-verheiratet-100~1920x1080?cb=1575469007851",
    "description": "Siennas Traummann macht ihr einen Heiratsantrag – doch sie zögert."
  },
  {
    "id": "rp_006",
    "type": "movie",
    "name": "Rosamunde Pilcher: Liebe und andere Schätze",
    "searchTitle": "Liebe und andere Schätze",
    "poster": "https://www.zdf.de/assets/liebe-und-andere-schaetze-100~1920x1080?cb=1779100936024",
    "description": "Kuratorin Mia Barlow ist praktisch in einem Museum groß geworden, seit Direktor Trevor Murphy und seine Frau, die Restauratorin Hannah, sie als Pflegekind bei sich aufgenommen haben."
  },
  {
    "id": "rp_007",
    "type": "movie",
    "name": "Rosamunde Pilcher: Der magische Bus",
    "searchTitle": "Der magische Bus",
    "poster": "https://www.zdf.de/assets/magisch-bus-100~1920x1080?cb=1572876710440",
    "description": "Olivia macht sich trotz aller Warnungen ihrer Freunde und Kollegen in einem Vintage-Bus selbstständig. Doch schon bei der ersten Reise kommt der erste Rückschlag."
  },
  {
    "id": "rp_008",
    "type": "movie",
    "name": "Rosamunde Pilcher: Liebe gegen den Rest der Welt",
    "searchTitle": "Liebe gegen den Rest der Welt",
    "poster": "https://www.zdf.de/assets/liebe-gegen-den-rest-der-welt-102~1920x1080?cb=1747395872987",
    "description": "Rachel Wilson kehrt nach zwei Jahren in das kleine Dorf Kingscove in Cornwall zurück, das sie eigentlich für immer verlassen wollte."
  },
  {
    "id": "rp_009",
    "type": "movie",
    "name": "Rosamunde Pilcher: Rundum glücklich",
    "searchTitle": "Rundum glücklich",
    "poster": "https://www.zdf.de/assets/rundum-gluecklich-100~1920x1080?cb=1738935862085",
    "description": "Die junge Bäckerin Betty Hunter sucht den Mann ihrer Träume."
  },
  {
    "id": "rp_010",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die falsche Nonne",
    "searchTitle": "Die falsche Nonne",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-die-falsche-nonne-104~1920x1080?cb=1793023905964",
    "description": "Bei einem Undercover-Einsatz lernt Polizistin Sabrina Tom kennen."
  },
  {
    "id": "rp_011",
    "type": "movie",
    "name": "Rosamunde Pilcher: Ungezügelt ins Glück",
    "searchTitle": "Ungezügelt ins Glück",
    "poster": "https://www.zdf.de/assets/ungezuegelt-ins-glueck-100~1920x1080?cb=1744907251956",
    "description": "Lord Brooks stellt nach langer Abwesenheit entsetzt fest, dass seine Mutter das Familienanwesen in ein Pferdeasyl verwandelt hat. Er muss sich nun um die Rettung des Erbes kümmern."
  },
  {
    "id": "rp_012",
    "type": "movie",
    "name": "Rosamunde Pilcher: Englischer Wein",
    "searchTitle": "Englischer Wein",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-englischer-wein-104~1920x1080?cb=1744711026467",
    "description": "Die ehrgeizige Winzerin Hannah Powell, die lange in Frankreich gelebt hat, erhält die Chance ihres Lebens: Sie soll ein Weingut in ihrer Heimat Südengland auf Vordermann bringen."
  },
  {
    "id": "rp_013",
    "type": "movie",
    "name": "Rosamunde Pilcher: Verlobt, verliebt, verwirrt",
    "searchTitle": "Verlobt, verliebt, verwirrt",
    "poster": "https://www.zdf.de/assets/verlobt-verliebt-verwirrt-100~1920x1080?cb=1745830743700",
    "description": "Emma Waters überredet ihre Freundin Julia Adams, einen Junggesellinnenabschied zu machen. Als Julia einen Kuss versteigern soll, kann sie nicht glauben, wer der Gewinner ist."
  },
  {
    "id": "rp_014",
    "type": "movie",
    "name": "Rosamunde Pilcher: Liebe, Diebe, Diamanten",
    "searchTitle": "Liebe, Diebe, Diamanten",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-liebe-diebe-diamanten-102~1920x1080?cb=1793024107343",
    "description": "Richard Johnson kehrt zur Hochzeit der Tochter zurück nach Cornwall."
  },
  {
    "id": "rp_015",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wiedersehen in Rose Abbey",
    "searchTitle": "Wiedersehen in Rose Abbey",
    "poster": "https://www.zdf.de/assets/wiedersehen-in-rose-abbey-100~1920x1080?cb=1746798390082",
    "description": "Roseanne Brix, Studentin aus Chicago, kommt nach dem Tod ihrer Mutter nach England, um ihren leiblichen Vater zu suchen. Ihr einziger Hinweis ist ein altes Foto ihrer Mutter."
  },
  {
    "id": "rp_016",
    "type": "movie",
    "name": "Rosamunde Pilcher: Lass es Liebe sein",
    "searchTitle": "Lass es Liebe sein",
    "poster": "https://www.zdf.de/assets/lass-es-liebe-sein-100~1920x1080?cb=1746450048706",
    "description": "Eine kurze, schicksalhafte Begegnung zwischen Tom und Natalie, einer jungen Studentin aus Georgien, wird das Leben beider für immer verändern: Sie verlieben sich ineinander."
  },
  {
    "id": "rp_017",
    "type": "movie",
    "name": "Rosamunde Pilcher: Das Geheimnis der Blumeninsel",
    "searchTitle": "Das Geheimnis der Blumeninsel",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-das-geheimnis-der-blumeninsel-102~1920x1080?cb=1544345904588",
    "description": "Amy Harding hat einen großen Traum. Sie will die verwahrloste Blumenfarm ihrer Großeltern auf den Scilly Islands wieder zum Blühen bringen."
  },
  {
    "id": "rp_018",
    "type": "movie",
    "name": "Rosamunde Pilcher: Vier Luftballons und ein Todesfall",
    "searchTitle": "Vier Luftballons und ein Todesfall",
    "poster": "https://www.zdf.de/assets/vier-luftballons-und-ein-todesfall-100~1920x1080?cb=1790581314387",
    "description": "Floristin Gwen ist Angestellte in einem Blumengroßhandel und wird von ihrem sympathischen Chef Joey umgarnt. Was der jungen Frau nicht unangenehm ist - ganz im Gegenteil."
  },
  {
    "id": "rp_019",
    "type": "movie",
    "name": "Rosamunde Pilcher: Im siebten Himmel",
    "searchTitle": "Im siebten Himmel",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-im-siebten-himmel-102~1920x1080?cb=1638535290427",
    "description": "Rebecca \"Becky\" Taylor ist frisch ordinierte Jung-Vikarin der Anglikanischen Gemeinschaft. Vor ihrem offiziellen Dienstantritt besucht sie die ihr zugeteilte Gemeinde in Cornwall."
  },
  {
    "id": "rp_020",
    "type": "movie",
    "name": "Rosamunde Pilcher: Herzensläufe",
    "searchTitle": "Herzensläufe",
    "poster": "https://www.zdf.de/assets/herzenslaeufe-100~1920x1080?cb=1790922946174",
    "description": "Für Jacky Davies ist das Gin-Brennen in der traditionellen Familiendestillerie mehr als nur ein Handwerk: Es ist die Passion der jungen Frau und eine Besessenheit."
  },
  {
    "id": "rp_021",
    "type": "movie",
    "name": "Rosamunde Pilcher: Schwiegertöchter",
    "searchTitle": "Schwiegertöchter",
    "poster": "https://www.zdf.de/assets/rosamunde-pilcher-schwiegertoechter-102~1920x1080?cb=1749544149996",
    "description": "Lynette will den letzten Wunsch ihres verstorbenen Mannes erfüllen und eine Stiftung in seinem Namen gründen. Dafür muss sie aber die Leitung ihrer eigenen Firma abgeben."
  },
  {
    "id": "rp_022",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wie verhext",
    "searchTitle": "Wie verhext",
    "poster": "https://www.zdf.de/assets/wie-verhext-102~1920x1080?cb=1751274370663",
    "description": "Im Kino ihres Vaters hat Grace Kent bereits als Sechsjährige jeden Film gesehen, der dort vorgeführt wurde. Kein Wunder, dass sie schon als junge Frau Kostümbildnerin werden will."
  },
  {
    "id": "rp_023",
    "type": "movie",
    "name": "Rosamunde Pilcher: Erdbeeren im Frühling",
    "searchTitle": "Erdbeeren im Frühling",
    "poster": "https://www.zdf.de/assets/erdbeeren-im-fruehling-106~1920x1080?cb=1696515866401",
    "description": "Als die junge Journalistin und Millionenerbin Lilly zur Beerdigung ihres Vaters nach Cornwall zurückkehrt, bricht ihre bisherige Lebensplanung wie ein Kartenhaus zusammen."
  },
  {
    "id": "rp_024",
    "type": "movie",
    "name": "Rosamunde Pilcher: Ein Doktor & drei Frauen",
    "searchTitle": "Ein Doktor & drei Frauen",
    "poster": "https://www.zdf.de/assets/doktor-und-drei-frauen-100~1920x1080?cb=1766147846819",
    "description": "Dem idyllischen Örtchen St. Mark droht kurz vor der bevorstehenden 500-Jahr-Feier der schleichende Tod. Jetzt verabschiedet sich auch noch der einzige Arzt in den Ruhestand."
  },
  {
    "id": "rp_025",
    "type": "movie",
    "name": "Rosamunde Pilcher: Falsches Leben, wahre Liebe",
    "searchTitle": "Falsches Leben, wahre Liebe",
    "poster": "https://www.zdf.de/assets/falschesleben-102~1920x1080?cb=1696515723171",
    "description": "Bill Pexton, ein junger Marineleutnant, freundet sich bei den Vorbereitungen auf die Aufnahmeprüfung bei den Kampftauchern mit seinem Kameraden Mo Miller an."
  },
  {
    "id": "rp_026",
    "type": "movie",
    "name": "Rosamunde Pilcher: Die Frau auf der Klippe",
    "searchTitle": "Die Frau auf der Klippe",
    "poster": "https://www.zdf.de/assets/die-frau-auf-der-klippe-100~1920x1080?cb=1793023515200",
    "description": "Owen erbt das Herrenhaus seines verstorbenen Großonkels in Cornwall."
  },
  {
    "id": "rp_027",
    "type": "movie",
    "name": "Rosamunde Pilcher: In der Mitte eines Lebens",
    "searchTitle": "In der Mitte eines Lebens",
    "poster": "https://www.zdf.de/assets/in-der-mitte-des-lebens-100~1920x1080?cb=1578559755191",
    "description": "Ella Dempsey muss nach einem Vorfall ihr ganzes Leben überdenken."
  },
  {
    "id": "rp_028",
    "type": "movie",
    "name": "Rosamunde Pilcher: Pralinen zum Frühstück",
    "searchTitle": "Pralinen zum Frühstück",
    "poster": "https://www.zdf.de/assets/pralinen-zum-fruehstueck-102~1920x1080?cb=1781704277805",
    "description": "Annabelle hat ihr Hobby zum Beruf gemacht: Auf Flughäfen ersteigert sie gestrandete und besitzlose Koffer, um sie dann in ihrer Fernsehsendung öffnen zu lassen."
  },
  {
    "id": "rp_029",
    "type": "movie",
    "name": "Rosamunde Pilcher: Das Geheimnis der weißen Taube",
    "searchTitle": "Das Geheimnis der weißen Taube",
    "poster": "https://www.zdf.de/assets/das-geheimnis-der-weissen-taube-100~1920x1080?cb=1746022269147",
    "description": "Auktionatorin Stella liebt die alten Schätze, die sie verkauft. Doch im Auktionshaus der Familie ihres Mannes Peter kriselt es seit neustem – und das nicht nur bei ihrer Arbeit."
  }
];

// Initialize Stremio Addon Builder
const builder = new addonBuilder(manifest);

// ============================================================================
// 3. CATALOG HANDLER
// ============================================================================
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  if (type === 'movie' && id === 'rp_zdf_catalog') {
    let list = EPISODES;
    if (extra && extra.search) {
      const q = extra.search.toLowerCase();
      list = list.filter(ep => ep.name.toLowerCase().includes(q) || (ep.description && ep.description.toLowerCase().includes(q)));
    }
    return {
      metas: list.map(ep => ({
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
    const searchTerm = episode.searchTitle || episode.name.replace(/^Rosamunde Pilcher:\s*/i, '');

    const payload = {
      queries: [
        {
          fields: ['title'],
          query: searchTerm
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

    // Fallback: search with full name if not found
    if (results.length === 0) {
      const fallbackPayload = {
        queries: [
          {
            fields: ['title', 'topic'],
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
      const isTrailer = titleLower.includes('trailer') || titleLower.includes('darum geht') || item.duration < 1800;
      return !isAd && !isTrailer;
    });

    const selectedItem = fullMovie || results[0];
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
  // If user visits the root URL in a browser, render a clean landing page with an install button
  if (!req.url || req.url === '/' || req.url === '/index.html') {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'pilcher-stremio-tfd7.vercel.app';
    const manifestUrl = `https://${host}/manifest.json`;
    const stremioUrl = `stremio://${host}/manifest.json`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZDF Rosamunde Pilcher Collection - Stremio Add-on</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f1015; color: #f0f0f0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
    .card { background: #1a1c23; border: 1px solid #2d3139; border-radius: 12px; padding: 36px 28px; max-width: 500px; width: 100%; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    h1 { color: #8a5cf6; margin-top: 0; font-size: 1.6rem; }
    p { color: #a0a5b5; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: block; background: #8a5cf6; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 1rem; transition: background 0.2s; margin-bottom: 20px; }
    .btn:hover { background: #7c4ee8; }
    .manifest { font-size: 0.85rem; color: #707585; word-break: break-all; }
    code { background: #252833; padding: 4px 8px; border-radius: 4px; color: #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ZDF Rosamunde Pilcher Collection</h1>
    <p>Streams ${EPISODES.length} Rosamunde Pilcher TV-movies directly from ZDFmediathek into Stremio with distinct covers.</p>
    <a class="btn" href="${stremioUrl}">Install in Stremio</a>
    <div class="manifest">
      Manifest URL: <br><br><code>${manifestUrl}</code>
    </div>
  </div>
</body>
</html>`);
    return;
  }

  // Handle all Stremio API endpoints (/manifest.json, /catalog/..., /meta/..., /stream/...)
  getRouter(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
  });
};
