// Locaties van de bekende recreatieparken (op plaatsniveau), zodat we woningen
// op de kaart bij hun park kunnen plaatsen i.p.v. alleen op provinciecentrum.
// Match op trefwoord in de parknaam (dekt naamvarianten als "TopParken …",
// "EuroParcs …", "Résidence/Residence …"). Meer specifieke trefwoorden eerst.
type ParkGeo = { match: string; coord: [number, number]; plaats: string };

const PARKEN: ParkGeo[] = [
  { match: "scheleberg", coord: [52.107, 5.611], plaats: "Lunteren" },
  { match: "waterparc", coord: [52.451, 5.658], plaats: "Biddinghuizen" },
  { match: "zuiderzee", coord: [52.447, 5.641], plaats: "Biddinghuizen" },
  { match: "leuvert", coord: [51.663, 5.245], plaats: "Cromvoirt" },
  { match: "utrechtse heuvelrug", coord: [52.078, 5.395], plaats: "Maarsbergen" },
  { match: "lichtenvoorde", coord: [51.988, 6.568], plaats: "Lichtenvoorde" },
  { match: "valkenburg", coord: [50.865, 5.831], plaats: "Valkenburg" },
  { match: "bosvallei", coord: [52.062, 5.702], plaats: "Ede" },
  { match: "bospark ede", coord: [52.045, 5.688], plaats: "Ede" },
  { match: "soal", coord: [52.973, 5.428], plaats: "Workum" },
  { match: "westerkogge", coord: [52.629, 4.938], plaats: "Berkhout" },
  { match: "resort veluwe", coord: [52.227, 5.693], plaats: "Garderen" },
  { match: "beekbergen", coord: [52.153, 6.030], plaats: "Beekbergen" },
  { match: "kaatsheuvel", coord: [51.657, 5.048], plaats: "Kaatsheuvel" },
  { match: "gelloo", coord: [52.278, 5.627], plaats: "Ermelo" },
  { match: "parc du soleil", coord: [52.238, 4.451], plaats: "Noordwijk" },
  { match: "buitenhuizen", coord: [52.427, 4.730], plaats: "Spaarnwoude" },
  { match: "spaarnwoude", coord: [52.427, 4.730], plaats: "Spaarnwoude" },
  { match: "lage vuursche", coord: [52.199, 5.223], plaats: "Lage Vuursche" },
  { match: "ijssel eilanden", coord: [52.555, 5.911], plaats: "Kampen" },
  { match: "havezate", coord: [52.190, 6.130], plaats: "Hall" },
  { match: "hoophuizen", coord: [52.335, 5.756], plaats: "Hulshorst" },
  { match: "brabantse kempen", coord: [51.372, 5.302], plaats: "Hapert" },
  { match: "ruinen", coord: [52.762, 6.353], plaats: "Ruinen" },
  { match: "enkhuiz", coord: [52.703, 5.291], plaats: "Enkhuizen" },
  { match: "wiltershaar", coord: [51.933, 6.664], plaats: "Winterswijk" },
  { match: "hooge veluwe", coord: [52.030, 5.858], plaats: "Arnhem" },
  { match: "marina strandbad", coord: [52.340, 5.744], plaats: "Hulshorst" },
  { match: "veluwemeer", coord: [52.335, 5.740], plaats: "Hulshorst" },
  { match: "esmeer", coord: [51.757, 5.245], plaats: "Aalst" },
  { match: "loosdrecht", coord: [52.194, 5.099], plaats: "Loosdrecht" },
  { match: "maasduinen", coord: [51.303, 6.105], plaats: "Belfeld" },
  { match: "markermeer", coord: [52.421, 5.078], plaats: "Uitdam" },
  { match: "de rijp", coord: [52.553, 4.847], plaats: "De Rijp" },
  { match: "maasmeren", coord: [51.150, 5.870], plaats: "Ohé en Laak" },
  { match: "poort van amsterdam", coord: [52.527, 4.712], plaats: "Uitgeest" },
  { match: "ijmuiden", coord: [52.458, 4.610], plaats: "IJmuiden" },
  { match: "europarcs limburg", coord: [51.063, 5.849], plaats: "Susteren" },
  { match: "reestervallei", coord: [52.598, 6.271], plaats: "Balkbrug" },
];

export function findParkCoord(park?: string): { coord: [number, number]; plaats: string } | null {
  if (!park) return null;
  const p = park.toLowerCase();
  for (const item of PARKEN) {
    if (p.includes(item.match)) return { coord: item.coord, plaats: item.plaats };
  }
  return null;
}
