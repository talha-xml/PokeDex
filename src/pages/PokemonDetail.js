import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getPokemonDetails,
  getPokemonSpecies,
  getEvolutionChain
} from '../services/pokeApi';
import '../styles/detail.css';
import '../styles/pokemoncard.css';

const STAT_CONFIG = [
  { key: 'hp', label: 'HP', max: 255 },
  { key: 'attack', label: 'Attack', max: 255 },
  { key: 'defense', label: 'Defense', max: 255 },
  { key: 'special-attack', label: 'Sp. Atk', max: 255 },
  { key: 'special-defense', label: 'Sp. Def', max: 255 },
  { key: 'speed', label: 'Speed', max: 255 }
];

const cleanFlavorText = (text) =>
  text
    ? text
        .replace(/[\f\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

const formatId = (id) => String(id).padStart(4, '0');

const formatName = (str) =>
  str ? str.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : '';

const getIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
};

const getArtwork = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const formatEvolutionTrigger = (details) => {
  if (!details || details.length === 0) return 'Base';
  const d = details[0];
  if (d.min_level) return `Level ${d.min_level}`;
  if (d.item?.name) return `Use ${formatName(d.item.name)}`;
  if (d.min_happiness) {
    if (d.time_of_day) return `Friendship (${formatName(d.time_of_day)})`;
    return 'High Friendship';
  }
  if (d.held_item?.name) return `Hold ${formatName(d.held_item.name)}`;
  if (d.known_move?.name) return `Knows ${formatName(d.known_move.name)}`;
  if (d.location?.name) return `At ${formatName(d.location.name)}`;
  if (d.trigger?.name === 'trade') {
    if (d.held_item?.name) return `Trade holding ${formatName(d.held_item.name)}`;
    return 'Trade';
  }
  if (d.time_of_day) return `${formatName(d.time_of_day)}`;
  return 'Special';
};

function parseEvolutionStages(chainNode, currentStage = 0, stages = []) {
  if (!chainNode || !chainNode.species) return stages;

  const id = getIdFromUrl(chainNode.species.url);
  const nodeData = {
    id,
    name: chainNode.species.name,
    condition: formatEvolutionTrigger(chainNode.evolution_details)
  };

  if (!stages[currentStage]) {
    stages[currentStage] = [];
  }
  stages[currentStage].push(nodeData);

  if (chainNode.evolves_to && chainNode.evolves_to.length > 0) {
    chainNode.evolves_to.forEach((nextChild) => {
      parseEvolutionStages(nextChild, currentStage + 1, stages);
    });
  }

  return stages;
}

function PokemonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pokemon, setPokemon] = useState(null);
  const [species, setSpecies] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Scroll to top whenever ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const pokemonData = await getPokemonDetails(id);
        if (!active) return;
        setPokemon(pokemonData);

        // Fetch Species
        const speciesIdentifier = pokemonData.species?.name || pokemonData.id;
        const speciesData = await getPokemonSpecies(speciesIdentifier);
        if (!active) return;
        setSpecies(speciesData);

        // Set initial selected version for description
        const englishEntries = (speciesData.flavor_text_entries || []).filter(
          (entry) => entry.language.name === 'en'
        );
        if (englishEntries.length > 0) {
          setSelectedVersion(englishEntries[englishEntries.length - 1].version.name);
        }

        // Fetch Evolution Chain if available
        if (speciesData.evolution_chain?.url) {
          const evoData = await getEvolutionChain(speciesData.evolution_chain.url);
          if (active) {
            setEvolutionChain(evoData);
          }
        }
      } catch (err) {
        if (active) {
          setError('Unable to load Pokémon details. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  // Height & Weight formatting
  const heightFormatted = useMemo(() => {
    if (!pokemon) return '';
    const meters = (pokemon.height / 10).toFixed(1);
    const totalInches = Math.round(pokemon.height * 3.937);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${meters} m (${feet}'${inches}")`;
  }, [pokemon]);

  const weightFormatted = useMemo(() => {
    if (!pokemon) return '';
    const kg = (pokemon.weight / 10).toFixed(1);
    const lbs = (pokemon.weight * 0.220462).toFixed(1);
    return `${kg} kg (${lbs} lbs)`;
  }, [pokemon]);

  // English category
  const category = useMemo(() => {
    if (!species || !species.genera) return '';
    const enGenus = species.genera.find((g) => g.language.name === 'en');
    return enGenus ? enGenus.genus : '';
  }, [species]);

  // Gender Information
  const genderInfo = useMemo(() => {
    if (!species || species.gender_rate === undefined) return null;
    if (species.gender_rate === -1) {
      return <span className="gender-none">Genderless</span>;
    }
    const female = (species.gender_rate / 8) * 100;
    const male = 100 - female;
    return (
      <div className="gender-ratio">
        <span className="gender-male">♂ {male}%</span>
        <span className="gender-female">♀ {female}%</span>
      </div>
    );
  }, [species]);

  // English Flavor Text Entries
  const flavorEntries = useMemo(() => {
    if (!species || !species.flavor_text_entries) return [];
    return species.flavor_text_entries
      .filter((entry) => entry.language.name === 'en')
      .map((entry) => ({
        version: entry.version.name,
        text: cleanFlavorText(entry.flavor_text)
      }));
  }, [species]);

  // Current selected entry text
  const currentVersionText = useMemo(() => {
    if (flavorEntries.length === 0) return '';
    const match = flavorEntries.find((e) => e.version === selectedVersion);
    return match ? match.text : flavorEntries[flavorEntries.length - 1].text;
  }, [flavorEntries, selectedVersion]);

  // Primary overview description
  const primaryDescription = useMemo(() => {
    if (flavorEntries.length === 0) return '';
    return flavorEntries[flavorEntries.length - 1].text;
  }, [flavorEntries]);

  // Evolution Stages
  const evolutionStages = useMemo(() => {
    if (!evolutionChain || !evolutionChain.chain) return [];
    return parseEvolutionStages(evolutionChain.chain);
  }, [evolutionChain]);

  // Base Stats and Total
  const statsMap = useMemo(() => {
    if (!pokemon || !pokemon.stats) return {};
    const map = {};
    pokemon.stats.forEach((s) => {
      map[s.stat.name] = s.base_stat;
    });
    return map;
  }, [pokemon]);

  const statTotal = useMemo(() => {
    return Object.values(statsMap).reduce((acc, curr) => acc + curr, 0);
  }, [statsMap]);

  const getStatColor = (value) => {
    if (value >= 120) return '#10b981'; // vibrant green
    if (value >= 90) return '#22c55e'; // green
    if (value >= 70) return '#06b6d4'; // cyan
    if (value >= 50) return '#eab308'; // amber/yellow
    return '#ef4444'; // red
  };

  if (loading) {
    return (
      <main className="detail-container">
        <div className="detail-loading-state">
          <div className="detail-spinner" />
          <p>Loading Pokémon details...</p>
        </div>
      </main>
    );
  }

  if (error || !pokemon) {
    return (
      <main className="detail-container">
        <div className="detail-error-state">
          <h3>Oops!</h3>
          <p>{error || 'Pokémon not found.'}</p>
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Pokédex
          </button>
        </div>
      </main>
    );
  }

  const currentId = pokemon.id;
  const prevId = currentId > 1 ? currentId - 1 : null;
  const nextId = currentId < 1025 ? currentId + 1 : null;

  const artwork =
    pokemon.sprites.other?.['official-artwork']?.front_default ||
    pokemon.sprites.front_default ||
    getArtwork(currentId);

  return (
    <main className="detail-container">
      {/* 1. Top Navigation Bar */}
      <nav className="detail-top-nav">
        <button className="back-button" onClick={() => navigate('/')}>
          &larr; Back to Pokédex
        </button>

        <div className="nav-adjacent-group">
          {prevId ? (
            <Link to={`/pokemon/${prevId}`} className="nav-adjacent-btn">
              &larr; #{formatId(prevId)}
            </Link>
          ) : (
            <span className="nav-adjacent-btn disabled">&larr; First</span>
          )}

          {nextId ? (
            <Link to={`/pokemon/${nextId}`} className="nav-adjacent-btn">
              #{formatId(nextId)} &rarr;
            </Link>
          ) : (
            <span className="nav-adjacent-btn disabled">Last &rarr;</span>
          )}
        </div>
      </nav>

      {/* 2. Pokémon Header Card */}
      <section className="detail-header-card">
        <div className="artwork-column">
          <img src={artwork} alt={pokemon.name} className="artwork-image" />
        </div>

        <div className="header-info-column">
          <div className="header-meta-row">
            <span className="detail-id">#{formatId(pokemon.id)}</span>
            {category && <span className="detail-category">{category}</span>}
          </div>

          <h1 className="detail-name">{formatName(pokemon.name)}</h1>

          <div className="detail-types">
            {pokemon.types.map((item) => (
              <span
                key={item.type.name}
                className={`type-badge type-${item.type.name}`}
              >
                {item.type.name}
              </span>
            ))}
          </div>

          {primaryDescription && (
            <p className="header-primary-desc">"{primaryDescription}"</p>
          )}
        </div>
      </section>

      {/* 3. Basic Information & Base Stats Grid */}
      <div className="detail-grid-row">
        {/* Basic Information */}
        <section className="detail-card">
          <h2 className="card-title">Basic Information</h2>

          <div className="basic-info-grid">
            <div className="info-item">
              <span className="info-label">Height</span>
              <span className="info-value">{heightFormatted}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Weight</span>
              <span className="info-value">{weightFormatted}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Category</span>
              <span className="info-value">{category || 'Unknown'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Gender Ratio</span>
              <div className="info-value">{genderInfo}</div>
            </div>

            <div className="info-item full-width">
              <span className="info-label">Abilities</span>
              <div className="abilities-wrap">
                {pokemon.abilities.map((item) => (
                  <span
                    key={item.ability.name}
                    className={`ability-tag ${item.is_hidden ? 'hidden' : ''}`}
                  >
                    {formatName(item.ability.name)}
                    {item.is_hidden && (
                      <span className="hidden-badge">Hidden</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Base Stats */}
        <section className="detail-card">
          <h2 className="card-title">Base Stats</h2>

          <div className="stats-list">
            {STAT_CONFIG.map(({ key, label, max }) => {
              const val = statsMap[key] || 0;
              const percent = Math.min(100, Math.round((val / max) * 100));
              const barColor = getStatColor(val);

              return (
                <div key={key} className="stat-row">
                  <span className="stat-label">{label}</span>
                  <span className="stat-num">{val}</span>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: barColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="stat-total-row">
            <span className="stat-total-label">Total Stats</span>
            <span className="stat-total-num">{statTotal}</span>
          </div>
        </section>
      </div>

      {/* 4. Evolution Chain */}
      {evolutionStages.length > 0 && (
        <section className="detail-card" style={{ marginBottom: '32px' }}>
          <h2 className="card-title">Evolution Chain</h2>

          <div className="evolution-chain-wrap">
            {evolutionStages.map((stagePokemonList, stageIdx) => (
              <React.Fragment key={`stage-${stageIdx}`}>
                {stageIdx > 0 && (
                  <div className="evolution-arrow-block">
                    <span className="evolution-condition">
                      {stagePokemonList[0]?.condition || 'Evolution'}
                    </span>
                    <span className="evolution-arrow-icon">&rarr;</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    justifyContent: 'center'
                  }}
                >
                  {stagePokemonList.map((evo) => {
                    const isCurrent = evo.id === pokemon.id;
                    return (
                      <Link
                        key={evo.id}
                        to={`/pokemon/${evo.id}`}
                        className="evolution-card-link"
                      >
                        <div
                          className={`evolution-card ${
                            isCurrent ? 'current' : ''
                          }`}
                        >
                          <div className="evolution-img-wrap">
                            <img
                              src={getArtwork(evo.id)}
                              alt={evo.name}
                              loading="lazy"
                            />
                          </div>
                          <span className="evolution-id">
                            #{formatId(evo.id)}
                          </span>
                          <span className="evolution-name">
                            {formatName(evo.name)}
                          </span>
                          {isCurrent && (
                            <span className="current-badge">Current</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {/* 5. Pokédex Description & Game Entries */}
      <section className="detail-card">
        <h2 className="card-title">Pokédex Description & Ecology</h2>

        {flavorEntries.length > 0 && (
          <>
            {/* Version pills */}
            <div className="desc-version-pills">
              {flavorEntries.slice(-12).map((item) => (
                <button
                  key={item.version}
                  className={`version-pill-btn ${
                    selectedVersion === item.version ? 'active' : ''
                  }`}
                  onClick={() => setSelectedVersion(item.version)}
                >
                  {formatName(item.version)}
                </button>
              ))}
            </div>

            {/* Selected Version Text */}
            <div className="version-entry-display">
              <div className="version-entry-header">
                <span className="version-entry-tag">
                  Version: {formatName(selectedVersion)}
                </span>
              </div>
              <p className="version-entry-text">{currentVersionText}</p>
            </div>
          </>
        )}

        {/* Ecology / Habitat / Growth */}
        {species && (
          <div className="ecology-grid">
            <div className="info-item">
              <span className="info-label">Habitat</span>
              <span className="info-value">
                {species.habitat?.name
                  ? formatName(species.habitat.name)
                  : 'Various / Unknown'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Growth Rate</span>
              <span className="info-value">
                {species.growth_rate?.name
                  ? formatName(species.growth_rate.name)
                  : 'Medium Fast'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Base Friendship</span>
              <span className="info-value">
                {species.base_happiness ?? 50} / 255
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Capture Rate</span>
              <span className="info-value">
                {species.capture_rate ?? 45} / 255 (
                {Math.round(((species.capture_rate ?? 45) / 255) * 100)}%)
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default PokemonDetail;

