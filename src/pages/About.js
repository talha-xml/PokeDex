import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiBarChart2,
  FiRepeat,
  FiBookOpen,
  FiShield,
  FiArrowLeft
} from 'react-icons/fi';
import '../styles/about.css';

function About() {
  return (
    <main className="about-container">
      {/* Hero */}
      <section className="about-hero">
        <span className="about-label">FAN-MADE ENCYCLOPAEDIA</span>
        <h1>
          About <span>PokéDex</span>
        </h1>
        <p>
          A fast, modern, and responsive web application designed for exploring,
          discovering, and learning about Pokémon across every generation.
        </p>
      </section>

      {/* About the Project */}
      <section className="about-card">
        <h2>About The Project</h2>
        <p>
          This Pokédex is an interactive web encyclopedia engineered with React.
          It interfaces directly with the open-source PokéAPI REST service to
          deliver comprehensive Pokémon statistics, evolutionary trees, official
          artwork, and historical game descriptions.
        </p>
        <p>
          Designed with performance and responsiveness in mind, this project
          features request caching to minimize network overhead, concurrent data
          loading with error fallbacks, seamless pagination across all 1,000+
          Pokémon, and flexible filtering by region and type.
        </p>

        {/* 2x2 Feature Grid with React Icons */}
        <div className="about-features-grid">
          <div className="feature-box">
            <div className="feature-box-icon">
              <FiSearch />
            </div>
            <h3>Real-Time Search & Filters</h3>
            <p>
              Instantly find Pokémon by name or ID, and filter down by region and
              elemental types concurrently.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-box-icon">
              <FiBarChart2 />
            </div>
            <h3>Visual Base Stats</h3>
            <p>
              Stat breakdown with dynamic color-coded progress bars and total base
              stat calculations.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-box-icon">
              <FiRepeat />
            </div>
            <h3>Evolution Chains</h3>
            <p>
              Interactive evolution pathways highlighting evolution methods,
              levels, stones, and friendship requirements.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-box-icon">
              <FiBookOpen />
            </div>
            <h3>Generational Lore</h3>
            <p>
              Historical Pokédex descriptions selectable across game releases
              from Red/Blue to Scarlet/Violet.
            </p>
          </div>
        </div>
      </section>

      {/* Data Source & Technology */}
      <section className="about-card">
        <h2>Data Source & Credits</h2>
        <p>
          All Pokémon data, species information, base stats, and sprite resources
          are provided courtesy of{' '}
          <a
            href="https://pokeapi.co/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)', fontWeight: 600 }}
          >
            PokéAPI
          </a>
          , a free community-supported RESTful Pokémon API.
        </p>
      </section>

      {/* Legal Disclaimer */}
      <section className="about-card disclaimer-card">
        <h2>
          <FiShield style={{ verticalAlign: 'middle' }} /> Legal Disclaimer
        </h2>
        <p>
          Pokémon and Pokémon character names are trademarks and intellectual
          property of their respective owners, including Nintendo, The Pokémon
          Company, Game Freak and Creatures Inc. This is an unofficial,
          non-commercial fan project. It is not affiliated with, endorsed by, or
          sponsored by these companies. All rights to their respective
          intellectual property are reserved by their owners.
        </p>
      </section>

      <div className="about-actions">
        <Link to="/" className="about-btn">
          <FiArrowLeft /> Explore Pokémon
        </Link>
      </div>
    </main>
  );
}

export default About;

