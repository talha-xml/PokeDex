import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pokemoncard.css';

function PokemonCard({ pokemon }) {
  const artwork =
    pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default;
  const formatId = (id) => String(id).padStart(3, '0');

  return (
    <Link to={`/pokemon/${pokemon.id}`} className="pokemon-card-link">
      <article className="pokemon-card">
        <span className="pokemon-id">#{formatId(pokemon.id)}</span>

        <div className="pokemon-image">
          <img src={artwork || pokemon.sprites.front_default} alt={pokemon.name} loading="lazy" />
        </div>

        <div className="pokemon-info">
          <h3>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>

          <div className="pokemon-types">
            {pokemon.types.map((item) => (
              <span key={item.type.name} className={`type-badge type-${item.type.name}`}>
                {item.type.name}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default PokemonCard;
