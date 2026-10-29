const { addonBuilder, getRouter: sdkGetRouter } = require('stremio-addon-sdk');
const axios = require('axios');

// ============================================================================
// 1. MANIFEST CONFIGURATION
// ============================================================================
const manifest = {
  id: 'community.rosamunde-pilcher-zdf',
  version: '1.4.0',
  name: 'ZDF Rosamunde Pilcher Collection',
  description: 'Streams Rosamunde Pilcher films directly from German public broadcasters (ZDF, 3sat, ORF) in official HD broadcast quality',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie'],
  idPrefixes: ['rp_'],
  catalogs: [
    {
      type: 'movie',
      id: 'rp_zdf_catalog',
      name: 'Rosamunde Pilcher (ZDF & Mediathek)',
      extra: [
        { name: 'search', isRequired: false }
      ]
    }
  ]
};

// ============================================================================
// 2. COMPLETE EPISODE DATABASE (169 FILMS)
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
    "name": "Rosamunde Pilcher: Karussell des Lebens",
    "searchTitle": "Karussell des Lebens",
    "poster": "https://images.metahub.space/poster/medium/tt0110245/img",
    "description": "Rosamunde Pilcher Liebesfilm (1994). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Das Ende eines Sommers",
    "searchTitle": "Das Ende eines Sommers",
    "poster": "https://images.metahub.space/poster/medium/tt0123821/img",
    "description": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_035",
    "type": "movie",
    "name": "Rosamunde Pilcher: Sommer am Meer",
    "searchTitle": "Sommer am Meer",
    "poster": "https://images.metahub.space/poster/medium/tt0114498/img",
    "description": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_036",
    "type": "movie",
    "name": "Rosamunde Pilcher: Schlafender Tiger",
    "searchTitle": "Schlafender Tiger",
    "poster": "https://images.metahub.space/poster/medium/tt0114353/img",
    "description": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_037",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wolken am Horizont",
    "searchTitle": "Wolken am Horizont",
    "poster": "https://images.metahub.space/poster/medium/tt0126124/img",
    "description": "Rosamunde Pilcher Liebesfilm (1995). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Lichterspiele",
    "searchTitle": "Lichterspiele",
    "poster": "https://images.metahub.space/poster/medium/tt0116870/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Das Haus an der Küste",
    "searchTitle": "Das Haus an der Küste",
    "poster": "https://images.metahub.space/poster/medium/tt0116498/img",
    "description": "Rosamunde Pilcher Liebesfilm (1996). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Irrwege des Herzens",
    "searchTitle": "Irrwege des Herzens",
    "poster": "https://images.metahub.space/poster/medium/tt0119384/img",
    "description": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Die zweite Chance",
    "searchTitle": "Die zweite Chance",
    "poster": "https://images.metahub.space/poster/medium/tt0128860/img",
    "description": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_048",
    "type": "movie",
    "name": "Rosamunde Pilcher: Zwei Schwestern",
    "searchTitle": "Zwei Schwestern",
    "poster": "https://images.metahub.space/poster/medium/tt0135071/img",
    "description": "Rosamunde Pilcher Liebesfilm (1997). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_049",
    "type": "movie",
    "name": "Rosamunde Pilcher: Der Preis der Liebe",
    "searchTitle": "Der Preis der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0146041/img",
    "description": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Rückkehr ins Paradies",
    "searchTitle": "Rückkehr ins Paradies",
    "poster": "https://images.metahub.space/poster/medium/tt0170520/img",
    "description": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_053",
    "type": "movie",
    "name": "Rosamunde Pilcher: Dornen im Tal der Blumen",
    "searchTitle": "Dornen im Tal der Blumen",
    "poster": "https://images.metahub.space/poster/medium/tt0177180/img",
    "description": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_054",
    "type": "movie",
    "name": "Rosamunde Pilcher: Melodie der Herzen",
    "searchTitle": "Melodie der Herzen",
    "poster": "https://images.metahub.space/poster/medium/tt0181794/img",
    "description": "Rosamunde Pilcher Liebesfilm (1998). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_055",
    "type": "movie",
    "name": "Rosamunde Pilcher: Magie der Liebe",
    "searchTitle": "Magie der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0184868/img",
    "description": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_056",
    "type": "movie",
    "name": "Rosamunde Pilcher: Rosen im Sturm",
    "searchTitle": "Rosen im Sturm",
    "poster": "https://images.metahub.space/poster/medium/tt0188183/img",
    "description": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_057",
    "type": "movie",
    "name": "Rosamunde Pilcher: Das große Erbe: Teil 1",
    "searchTitle": "Das große Erbe: Teil 1",
    "poster": "https://images.metahub.space/poster/medium/tt15740730/img",
    "description": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_058",
    "type": "movie",
    "name": "Rosamunde Pilcher: Das große Erbe: Teil 2",
    "searchTitle": "Das große Erbe: Teil 2",
    "poster": "https://images.metahub.space/poster/medium/tt15740738/img",
    "description": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_059",
    "type": "movie",
    "name": "Rosamunde Pilcher: Klippen der Liebe",
    "searchTitle": "Klippen der Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0217605/img",
    "description": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Blüte des Lebens",
    "searchTitle": "Blüte des Lebens",
    "poster": "https://images.metahub.space/poster/medium/tt0226390/img",
    "description": "Rosamunde Pilcher Liebesfilm (1999). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Im Licht des Feuers",
    "searchTitle": "Im Licht des Feuers",
    "poster": "https://images.metahub.space/poster/medium/tt0271760/img",
    "description": "Rosamunde Pilcher Liebesfilm (2000). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Blumen im Regen",
    "searchTitle": "Blumen im Regen",
    "poster": "https://images.metahub.space/poster/medium/tt0304642/img",
    "description": "Rosamunde Pilcher Liebesfilm (2001). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Bis ans Ende der Welt",
    "searchTitle": "Bis ans Ende der Welt",
    "poster": "https://images.metahub.space/poster/medium/tt0345873/img",
    "description": "Rosamunde Pilcher Liebesfilm (2002). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Dem Himmel so nah",
    "searchTitle": "Dem Himmel so nah",
    "poster": "https://images.metahub.space/poster/medium/tt0450116/img",
    "description": "Rosamunde Pilcher Liebesfilm (2004). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Über den Wolken",
    "searchTitle": "Über den Wolken",
    "poster": "https://images.metahub.space/poster/medium/tt0491128/img",
    "description": "Rosamunde Pilcher Liebesfilm (2005). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Und plötzlich war es Liebe",
    "searchTitle": "Und plötzlich war es Liebe",
    "poster": "https://images.metahub.space/poster/medium/tt0903964/img",
    "description": "Rosamunde Pilcher Liebesfilm (2006). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Aus Liebe und Leidenschaft",
    "searchTitle": "Aus Liebe und Leidenschaft",
    "poster": "https://images.metahub.space/poster/medium/tt1140926/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
  },
  {
    "id": "rp_106",
    "type": "movie",
    "name": "Rosamunde Pilcher: Wind über der See",
    "searchTitle": "Wind über der See",
    "poster": "https://images.metahub.space/poster/medium/tt1150986/img",
    "description": "Rosamunde Pilcher Liebesfilm (2007). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Herzen im Wind",
    "searchTitle": "Herzen im Wind",
    "poster": "https://images.metahub.space/poster/medium/tt1178399/img",
    "description": "Rosamunde Pilcher Liebesfilm (2008). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Herzenssehnsucht",
    "searchTitle": "Herzenssehnsucht",
    "poster": "https://images.metahub.space/poster/medium/tt1178401/img",
    "description": "Rosamunde Pilcher Liebesfilm (2009). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Wenn das Herz zerbricht",
    "searchTitle": "Wenn das Herz zerbricht",
    "poster": "https://images.metahub.space/poster/medium/tt1670117/img",
    "description": "Rosamunde Pilcher Liebesfilm (2010). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Herzensfragen",
    "searchTitle": "Herzensfragen",
    "poster": "https://images.metahub.space/poster/medium/tt1794473/img",
    "description": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Der gestohlene Sommer",
    "searchTitle": "Der gestohlene Sommer",
    "poster": "https://images.metahub.space/poster/medium/tt2050247/img",
    "description": "Rosamunde Pilcher Liebesfilm (2011). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Eine Frage der Ehre",
    "searchTitle": "Eine Frage der Ehre",
    "poster": "https://images.metahub.space/poster/medium/tt2592426/img",
    "description": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Die versprochene Braut",
    "searchTitle": "Die versprochene Braut",
    "poster": "https://images.metahub.space/poster/medium/tt3128154/img",
    "description": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Zu hoch geflogen",
    "searchTitle": "Zu hoch geflogen",
    "poster": "https://images.metahub.space/poster/medium/tt3443090/img",
    "description": "Rosamunde Pilcher Liebesfilm (2013). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Ghostwriter",
    "searchTitle": "Ghostwriter",
    "poster": "https://images.metahub.space/poster/medium/tt5921002/img",
    "description": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Vollkommen unerwartet",
    "searchTitle": "Vollkommen unerwartet",
    "poster": "https://images.metahub.space/poster/medium/tt5376696/img",
    "description": "Rosamunde Pilcher Liebesfilm (2015). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
    "name": "Rosamunde Pilcher: Lizenz zum Seitensprung",
    "searchTitle": "Lizenz zum Seitensprung",
    "poster": "https://images.metahub.space/poster/medium/tt5295330/img",
    "description": "Rosamunde Pilcher Liebesfilm (2016). Romantische Verwicklungen und große Gefühle vor der malerischen Kulisse Südenglands."
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
// 5. DYNAMIC STREAM HANDLER (OFFICIAL BROADCASTER HD STREAMS ONLY)
// ============================================================================
builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== 'movie' || !id.startsWith('rp_')) {
    return { streams: [] };
  }

  const episode = EPISODES.find(ep => ep.id === id);
  if (!episode) {
    return { streams: [] };
  }

  const searchTerm = episode.searchTitle || episode.name.replace(/^Rosamunde Pilcher:\s*/i, '');

  try {
    const MEDIATHEK_API_URL = 'https://mediathekviewweb.de/api/query';
    const payload = {
      queries: [
        {
          fields: ['title'],
          query: searchTerm
        }
      ],
      sortBy: 'timestamp',
      sortOrder: 'desc',
      future: false
    };

    let response = await axios.post(MEDIATHEK_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 6000
    });

    let results = response.data?.result?.results || [];

    // Fallback: search with topic "Rosamunde Pilcher" + title
    if (results.length === 0) {
      const fallbackPayload = {
        queries: [
          { fields: ['topic'], query: 'Rosamunde Pilcher' },
          { fields: ['title'], query: searchTerm }
        ],
        sortBy: 'timestamp',
        sortOrder: 'desc',
        future: false
      };

      response = await axios.post(MEDIATHEK_API_URL, fallbackPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 6000
      });

      results = response.data?.result?.results || [];
    }

    if (!results || results.length === 0) {
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

    const channelName = selectedItem.channel || 'ZDF';

    return {
      streams: [
        {
          name: `${channelName}mediathek`,
          title: `${channelName}mediathek (HD German)`,
          url: streamUrl,
          behaviorHints: {
            notWebReady: false
          }
        }
      ]
    };
  } catch (err) {
    console.warn(`[MediathekView] Query error for "${searchTerm}":`, err.message);
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
    const manifestUrl = `https://${host}/manifest.json`;
    const stremioUrl = `stremio://${host}/manifest.json`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZDF Rosamunde Pilcher Collection</title>
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
    <h1>ZDF Rosamunde Pilcher Collection</h1>
    <p>Streams all 169 Rosamunde Pilcher films directly from German public broadcaster servers (ZDF, 3sat, ORF) in official 1080p HD quality.</p>
    <a class="btn" href="${stremioUrl}">Install in Stremio</a>
    <div class="manifest">
      Manifest URL: <br><br><code>${manifestUrl}</code>
    </div>
    <div class="info-box">
      <h3>🟢 29 Films Live & Downloadable Right Now</h3>
      ZDF rotates films based on their weekly TV broadcast schedule. Whenever an episode airs on ZDF, ZDFneo, or 3sat, it automatically unlocks in your add-on for 30–90 days.
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
