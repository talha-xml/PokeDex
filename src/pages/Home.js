import React, { useEffect, useMemo, useState } from 'react';

import SearchFilter from '../components/SearchFilter';
import PokemonGrid from '../components/PokemonGrid';
import Pagination from '../components/Pagination';
import CustomSelect from '../components/CustomSelect';

import {
  getPokemonIndex,
  getPokemonDetails,
  getRegionPokemon,
  getPokemonTypeMap,
  getPokemonStatsMap
} from '../services/pokeApi';

import '../styles/home.css';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'id-asc', label: 'ID: Low to High' },
  { value: 'id-desc', label: 'ID: High to Low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'stats-desc', label: 'High Stats' },
  { value: 'stats-asc', label: 'Low Stats' }
];

function Home() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All Regions');
  const [type1, setType1] = useState('All Types');
  const [type2, setType2] = useState('All Types');

  const [pokemonIndex, setPokemonIndex] = useState([]);
  const [pokemonDetails, setPokemonDetails] = useState({});
  const [pokemonStatsMap, setPokemonStatsMap] = useState(null);

  const [regionNames, setRegionNames] = useState(null);
  const [pokemonTypeMap, setPokemonTypeMap] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('id-asc');

  const [loadingIndex, setLoadingIndex] = useState(true);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [error, setError] = useState('');

  // Fetch the complete Pokémon index and stats map
  useEffect(() => {
    const loadIndex = async () => {
      try {
        const [indexData, statsData] = await Promise.all([
          getPokemonIndex(),
          getPokemonStatsMap().catch(() => null)
        ]);
        setPokemonIndex(indexData);
        if (statsData) {
          setPokemonStatsMap(statsData);
        }
      } catch (error) {
        setError('Unable to load Pokémon. Please try again.');
      } finally {
        setLoadingIndex(false);
      }
    };

    loadIndex();
  }, []);

  // Fetch selected region and pokemon type map
  useEffect(() => {
    let active = true;

    const loadFilters = async () => {
      setLoadingFilter(true);
      setError('');

      try {
        const [regionData, typeMap] = await Promise.all([
          region === 'All Regions'
            ? Promise.resolve(null)
            : getRegionPokemon(region),

          getPokemonTypeMap()
        ]);

        if (active) {
          setRegionNames(regionData ? new Set(regionData) : null);
          setPokemonTypeMap(typeMap);
        }
      } catch (error) {
        if (active) {
          setError('Unable to load filter data.');
        }
      } finally {
        if (active) {
          setLoadingFilter(false);
        }
      }
    };

    loadFilters();

    return () => {
      active = false;
    };
  }, [region]);

  // Apply search, filters, and sorting
  const filteredPokemon = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = pokemonIndex.filter((pokemon) => {
      const matchesSearch = pokemon.name.includes(query) || String(pokemon.id).includes(query);
      if (!matchesSearch) return false;

      const matchesRegion = !regionNames || regionNames.has(pokemon.name);
      if (!matchesRegion) return false;

      if (!pokemonTypeMap) return true;

      const types = pokemonTypeMap[pokemon.name] || new Set();

      const t1 = type1.toLowerCase();
      const t2 = type2.toLowerCase();

      // Check Type 1
      if (type1 !== 'All Types' && !types.has(t1)) {
        return false;
      }

      // Check Type 2
      if (type2 === 'N/A') {
        // Must be pure single-type Pokémon only!
        if (types.size !== 1) {
          return false;
        }
      } else if (type2 !== 'All Types') {
        // Must also have type 2
        if (!types.has(t2)) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'id-desc':
          return b.id - a.id;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'stats-desc': {
          const statA = pokemonStatsMap ? pokemonStatsMap[a.id] || 0 : 0;
          const statB = pokemonStatsMap ? pokemonStatsMap[b.id] || 0 : 0;
          return statB - statA || a.id - b.id;
        }
        case 'stats-asc': {
          const statA = pokemonStatsMap ? pokemonStatsMap[a.id] || 9999 : 9999;
          const statB = pokemonStatsMap ? pokemonStatsMap[b.id] || 9999 : 9999;
          return statA - statB || a.id - b.id;
        }
        case 'id-asc':
        default:
          return a.id - b.id;
      }
    });
  }, [pokemonIndex, search, regionNames, pokemonTypeMap, pokemonStatsMap, type1, type2, sortBy]);

  const totalPages = Math.ceil(filteredPokemon.length / PAGE_SIZE) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * PAGE_SIZE;

  // Get currently visible Pokémon for the current page
  const visiblePokemon = useMemo(
    () => filteredPokemon.slice(startIndex, startIndex + PAGE_SIZE),
    [filteredPokemon, startIndex]
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setError('');
    const section = document.querySelector('.pokemon-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch details for visible Pokémon
  useEffect(() => {
    let active = true;

    const loadDetails = async () => {
      const missingPokemon = visiblePokemon.filter(
        (pokemon) => !pokemonDetails[pokemon.name] && !pokemonDetails[pokemon.id]
      );

      if (missingPokemon.length === 0) {
        setLoadingDetails(false);
        setError('');
        return;
      }

      setLoadingDetails(true);

      try {
        const results = await Promise.allSettled(
          missingPokemon.map((pokemon) => getPokemonDetails(pokemon.id || pokemon.name))
        );

        if (active) {
          let hasSuccess = false;
          let hasFailure = false;

          setPokemonDetails((previous) => {
            const updated = { ...previous };

            results.forEach((res, index) => {
              const req = missingPokemon[index];
              if (res.status === 'fulfilled' && res.value) {
                hasSuccess = true;
                const pokemonData = res.value;
                if (req) {
                  updated[req.name] = pokemonData;
                  updated[req.id] = pokemonData;
                }
                updated[pokemonData.name] = pokemonData;
                updated[pokemonData.id] = pokemonData;
              } else {
                hasFailure = true;
              }
            });

            return updated;
          });

          if (hasFailure && !hasSuccess) {
            setError('Unable to load Pokémon details.');
          } else {
            setError('');
          }
        }
      } catch (error) {
        if (active) {
          setError('Unable to load Pokémon details.');
        }
      } finally {
        if (active) {
          setLoadingDetails(false);
        }
      }
    };

    loadDetails();

    return () => {
      active = false;
    };
  }, [visiblePokemon, pokemonDetails]);

  const displayedPokemon = visiblePokemon
    .map((pokemon) => pokemonDetails[pokemon.name] || pokemonDetails[pokemon.id])
    .filter(Boolean);

  const clearFilters = () => {
    setSearch('');
    setRegion('All Regions');
    setType1('All Types');
    setType2('All Types');
    setSortBy('id-asc');
    setCurrentPage(1);
    setError('');
  };

  return (
    <main className="home-container">
      <section className="hero-section">
        <span className="hero-label">THE ULTIMATE POKÉMON DATABASE</span>

        <h1>
          Discover the world
          <br />
          of <span>Pokémon.</span>
        </h1>

        <p>Explore, discover and learn about Pokémon from every generation.</p>

        <SearchFilter
          search={search}
          setSearch={(value) => {
            setSearch(value);
            setCurrentPage(1);
            setError('');
          }}
          region={region}
          setRegion={(value) => {
            setRegion(value);
            setCurrentPage(1);
            setError('');
          }}
          type1={type1}
          setType1={(value) => {
            setType1(value);
            setCurrentPage(1);
            setError('');
          }}
          type2={type2}
          setType2={(value) => {
            setType2(value);
            setCurrentPage(1);
            setError('');
          }}
          onClear={clearFilters}
        />
      </section>

      <section className="pokemon-section">
        <div className="section-heading">
          <div>
            <span className="section-label">EXPLORE THE DATABASE</span>

            <div className="heading-title-row">
              <h2>Pokémon Collection</h2>

              <div className="sort-container">
                <span className="sort-label">Sort by:</span>
                <CustomSelect
                  value={sortBy}
                  onChange={(value) => {
                    setSortBy(value);
                    setCurrentPage(1);
                    setError('');
                  }}
                  options={SORT_OPTIONS}
                  className="sort-select-custom"
                />
              </div>
            </div>
          </div>

          <span className="pokemon-count">
            {filteredPokemon.length} Pokémon found {filteredPokemon.length > 0 && `• Page ${validPage} of ${totalPages}`}
          </span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loadingIndex || loadingFilter ? (
          <p className="status-message">Loading Pokémon...</p>
        ) : filteredPokemon.length === 0 ? (
          <div className="empty-state">
            <h3>No Pokémon found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <>
            <PokemonGrid pokemon={displayedPokemon} loading={loadingDetails} />

            <Pagination
              currentPage={validPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={loadingDetails}
            />
          </>
        )}
      </section>
    </main>
  );
}

export default Home;
