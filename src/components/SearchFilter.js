import React from 'react';
import CustomSelect from './CustomSelect';
import '../styles/searchfilter.css';

const regions = [
  'All Regions',
  'Kanto',
  'Johto',
  'Hoenn',
  'Sinnoh',
  'Unova',
  'Kalos',
  'Alola',
  'Galar',
  'Hisui',
  'Paldea'
];

// All Pokémon types in strict alphabetical order
const ALL_TYPES = [
  'Bug',
  'Dark',
  'Dragon',
  'Electric',
  'Fairy',
  'Fighting',
  'Fire',
  'Flying',
  'Ghost',
  'Grass',
  'Ground',
  'Ice',
  'Normal',
  'Poison',
  'Psychic',
  'Rock',
  'Steel',
  'Water'
];

function SearchFilter({
  search,
  setSearch,
  region,
  setRegion,
  type1,
  setType1,
  type2,
  setType2,
  onClear
}) {
  // If a type is selected, it vanishes from the other dropdown
  const type1Options = ALL_TYPES.filter((item) => item !== type2);
  const type2Options = ALL_TYPES.filter((item) => item !== type1);

  return (
    <section className="search-filter">
      <div className="search-box">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          placeholder="Search Pokémon by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            ×
          </button>
        )}
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label>REGION</label>
          <CustomSelect
            value={region}
            onChange={setRegion}
            options={regions}
            isGrid={true}
          />
        </div>

        <div className="filter-group">
          <label>TYPE 1</label>
          <CustomSelect
            value={type1}
            onChange={setType1}
            options={['All Types', ...type1Options]}
            isGrid={true}
          />
        </div>

        <div className="filter-group">
          <label>TYPE 2</label>
          <CustomSelect
            value={type2}
            onChange={setType2}
            options={['All Types', 'N/A', ...type2Options]}
            isGrid={true}
            alignRight={true}
          />
        </div>

        <button className="clear-filters" onClick={onClear}>
          Clear Filters
        </button>
      </div>
    </section>
  );
}

export default SearchFilter;
