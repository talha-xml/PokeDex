const BASE_URL = 'https://pokeapi.co/api/v2/';
const cache = new Map();
const regionPokedex = {
  Kanto: 2,
  Johto: 3,
  Hoenn: 4,
  Sinnoh: 5,
  Unova: 8,
  Kalos: 12,
  Alola: 16,
  Galar: 27,
  Hisui: 30,
  Paldea: 31
};

const getCachedData = async (url) => {
  if (!cache.has(url)) {
    const request = fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch Pokémon data.');
        }

        return response.json();
      })
      .catch((error) => {
        cache.delete(url);
        throw error;
      });

    cache.set(url, request);
  }

  return cache.get(url);
};

// Fetch the complete Pokémon species index

export const getPokemonIndex = async () => {
  const data = await getCachedData(`${BASE_URL}pokemon-species?limit=2000`);

  return data.results.map((pokemon) => ({
    name: pokemon.name,
    id: Number(pokemon.url.split('/').filter(Boolean).pop())
  }));
};

// Fetch individual Pokémon details
export const getPokemonDetails = async (identifier) => {
  try {
    return await getCachedData(`${BASE_URL}pokemon/${identifier}`);
  } catch (error) {
    if (typeof identifier === 'string') {
      try {
        const species = await getCachedData(`${BASE_URL}pokemon-species/${identifier}`);
        const defaultVariety =
          species.varieties?.find((v) => v.is_default) || species.varieties?.[0];
        if (defaultVariety?.pokemon?.name) {
          return await getCachedData(`${BASE_URL}pokemon/${defaultVariety.pokemon.name}`);
        }
      } catch {
        // ignore species error and rethrow original
      }
    }
    throw error;
  }
};

// Fetch Pokémon species details
export const getPokemonSpecies = async (identifier) => {
  return getCachedData(`${BASE_URL}pokemon-species/${identifier}`);
};

// Fetch evolution chain by full URL or id
export const getEvolutionChain = async (urlOrId) => {
  const url = String(urlOrId).startsWith('http')
    ? urlOrId
    : `${BASE_URL}evolution-chain/${urlOrId}`;
  return getCachedData(url);
};

// Fetch Pokémon belonging to a region
export const getRegionPokemon = async (region) => {
  const pokedexId = regionPokedex[region];
  const data = await getCachedData(`${BASE_URL}pokedex/${pokedexId}`);
  return data.pokemon_entries.map((entry) => entry.pokemon_species.name);
};

const POKEMON_TYPES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy'
];

let pokemonTypeMapPromise = null;

// Build a complete map of Pokémon names to their Set of types
export const getPokemonTypeMap = async () => {
  if (!pokemonTypeMapPromise) {
    pokemonTypeMapPromise = (async () => {
      const typeResponses = await Promise.all(
        POKEMON_TYPES.map((type) => getCachedData(`${BASE_URL}type/${type}`))
      );

      const typeMap = {};

      typeResponses.forEach((res) => {
        const typeName = res.name.toLowerCase();
        res.pokemon.forEach((entry) => {
          const name = entry.pokemon.name.toLowerCase();
          if (!typeMap[name]) {
            typeMap[name] = new Set();
          }
          typeMap[name].add(typeName);

          // Only link standard form variants (not regional variants like alola/galar/hisui/paldea)
          const baseName = name.replace(
            /-(normal|altered|shield|average|50|midday|solo|standard|incarnate|aria|male|female|red-meteor|disguised|amped|ice|full-belly|single-strike)$/,
            ''
          );
          if (baseName && baseName !== name) {
            if (!typeMap[baseName]) {
              typeMap[baseName] = new Set();
            }
            typeMap[baseName].add(typeName);
          }
        });
      });

      return typeMap;
    })().catch((err) => {
      pokemonTypeMapPromise = null;
      throw err;
    });
  }
  return pokemonTypeMapPromise;
};

// Fetch Pokémon belonging to a type
export const getTypePokemon = async (type) => {
  const typeMap = await getPokemonTypeMap();
  const targetType = type.toLowerCase();
  const names = [];

  Object.entries(typeMap).forEach(([name, types]) => {
    if (types.has(targetType)) {
      names.push(name);
    }
  });

  return names;
};

let statsMapPromise = null;

// Fetch and calculate base stat totals for all Pokémon
export const getPokemonStatsMap = async () => {
  if (!statsMapPromise) {
    statsMapPromise = (async () => {
      const response = await fetch(
        'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_stats.csv'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch Pokémon stats data');
      }
      const text = await response.text();
      const lines = text.split('\n');
      const totalMap = {}; // pokemon_id -> total base stat

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [pokemonIdStr, statIdStr, baseStatStr] = line.split(',');
        const pId = Number(pokemonIdStr);
        const sId = Number(statIdStr);
        const val = Number(baseStatStr);

        // Core stats 1 to 6 (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed)
        if (sId >= 1 && sId <= 6 && !isNaN(val)) {
          totalMap[pId] = (totalMap[pId] || 0) + val;
        }
      }

      return totalMap;
    })().catch((err) => {
      statsMapPromise = null;
      throw err;
    });
  }
  return statsMapPromise;
};
