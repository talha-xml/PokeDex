import React from 'react';
import PokemonCard from './PokemonCard';
import '../styles/pokemongrid.css';

function PokemonGrid({ pokemon, loading }) {
  return (
    <div className="pokemon-grid">
      {pokemon.map((item) => (
        <PokemonCard key={item.id} pokemon={item} />
      ))}

      {loading &&
        Array.from({ length: 4 }).map((_, index) => (
          <div className="pokemon-skeleton" key={index} />
        ))}
    </div>
  );
}

export default PokemonGrid;
