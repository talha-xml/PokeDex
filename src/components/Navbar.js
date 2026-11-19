import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/navbar.css';

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">P</span>
          <span>
            Poke<span className="brand-highlight">Dex</span>
          </span>
        </Link>
        <nav className="navbar-links">
          <NavLink to="/" end>
            Explore
          </NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
