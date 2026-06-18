import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import Home from '../components/Home';

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>);

describe('home component', () => {
  it('renders the demonstrations heading', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: /Démonstrations/i })).toBeInTheDocument();
  });

  it('renders navigation links to demo pages', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /Sélecteur de jeux de données/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Démonstrations API/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cartographie/i })).toBeInTheDocument();
  });

  it('renders map demo links', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /Carte statique/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Carte IGN/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ronds proportionnels/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Choroplèthe ratio 80\+/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Choroplèthe configurable/i })).toBeInTheDocument();
  });

  it('renders the Melodi healthcheck link', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /Healthcheck Melodi/i })).toBeInTheDocument();
  });
});
