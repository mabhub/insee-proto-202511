import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MapLegendChoropleth from './MapLegendChoropleth';

describe('MapLegendChoropleth', () => {
  it('renders nothing when minValue is null', () => {
    const { container } = render(<MapLegendChoropleth minValue={null} maxValue={10} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when maxValue is null', () => {
    const { container } = render(<MapLegendChoropleth minValue={5} maxValue={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when both values are null', () => {
    const { container } = render(<MapLegendChoropleth minValue={null} maxValue={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the legend title', () => {
    render(<MapLegendChoropleth minValue={5} maxValue={10} />);
    expect(screen.getByText(/Part des 80 ans et plus/)).toBeInTheDocument();
  });

  it('renders exactly 5 color classes', () => {
    render(<MapLegendChoropleth minValue={5} maxValue={10} />);
    // Each class label contains a "%"
    const percentTexts = screen.getAllByText(/%/);
    expect(percentTexts).toHaveLength(5);
  });

  it('displays the minimum value in the first class label', () => {
    render(<MapLegendChoropleth minValue={5} maxValue={10} />);
    expect(screen.getByText(/5\.0 %/)).toBeInTheDocument();
  });

  it('renders 4 range labels with "–" and 1 open-ended label with "+"', () => {
    render(<MapLegendChoropleth minValue={0} maxValue={10} />);
    const rangeLabels = screen.getAllByText(/–/);
    const openLabel = screen.getAllByText(/\+/);
    expect(rangeLabels).toHaveLength(4);
    expect(openLabel).toHaveLength(1);
  });

  it('computes equal-amplitude breaks between min and max', () => {
    render(<MapLegendChoropleth minValue={0} maxValue={10} />);
    // step = 2, breaks at 0, 2, 4, 6, 8
    expect(screen.getByText(/0\.0 % – 2\.0 %/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 % – 4\.0 %/)).toBeInTheDocument();
  });

  it('marks the last class with a "+" suffix', () => {
    render(<MapLegendChoropleth minValue={0} maxValue={10} />);
    expect(screen.getByText(/8\.0 %\+/)).toBeInTheDocument();
  });
});
