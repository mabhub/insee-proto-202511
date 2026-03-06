import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MapLegendProportional from './MapLegendProportional';

describe('MapLegendProportional', () => {
  it('renders the legend title', () => {
    render(<MapLegendProportional minValue={1000} maxValue={2000000} territoryCount={96} />);
    expect(screen.getByText('Population 2022')).toBeInTheDocument();
  });

  it('displays min and max values formatted in French locale', () => {
    render(<MapLegendProportional minValue={1000} maxValue={2000000} territoryCount={96} />);
    expect(screen.getByText(/1\s000.*2\s000\s000 hab\./)).toBeInTheDocument();
  });

  it('displays the territory count when greater than 0', () => {
    render(<MapLegendProportional minValue={1000} maxValue={2000000} territoryCount={96} />);
    expect(screen.getByText('96 départements')).toBeInTheDocument();
  });

  it('does not display territory count when 0', () => {
    render(<MapLegendProportional minValue={1000} maxValue={2000000} territoryCount={0} />);
    expect(screen.queryByText(/départements/)).not.toBeInTheDocument();
  });

  it('renders SVG circles for min and max', () => {
    const { container } = render(
      <MapLegendProportional minValue={1000} maxValue={2000000} territoryCount={10} />,
    );
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  it('handles undefined values gracefully', () => {
    render(<MapLegendProportional minValue={undefined} maxValue={undefined} territoryCount={0} />);
    expect(screen.getByText('Population 2022')).toBeInTheDocument();
  });
});
