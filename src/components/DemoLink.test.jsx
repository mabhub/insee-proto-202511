import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import DemoLink from './DemoLink';

const renderLink = (props) =>
  render(
    <MemoryRouter>
      <DemoLink to="/x" label="Label" description="Desc" {...props} />
    </MemoryRouter>,
  );

describe('DemoLink', () => {
  it('renders the button label and the description', () => {
    renderLink();
    expect(screen.getByRole('link', { name: /Label/ })).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });

  it('forwards extra props (className, data-*) to the root element', () => {
    renderLink({ className: 'custom-root', 'data-testid': 'demo-root' });
    const root = screen.getByTestId('demo-root');
    expect(root).toHaveClass('custom-root');
    // La racine doit rester le conteneur (le lien est un enfant).
    expect(root.querySelector('a')).toBeInTheDocument();
  });
});
