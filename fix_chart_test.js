import fs from 'fs';
const netWorthChartTest = `
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NetWorthChart } from '../components/charts/NetWorthChart';
import '@testing-library/jest-dom';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div>Area</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

describe('NetWorthChart', () => {
  it('renders correctly', () => {
    const mockPortfolio = {
      id: '1',
      title: 'test',
      currency: 'USD' as any,
      initialCreationDate: '2023-01-01',
      items: [
        { id: 'i1', name: 'cash', value: 100, type: 'asset', category: 'Cash', lastUpdated: '2023-01-01' }
      ],
      history: []
    };
    render(<NetWorthChart portfolio={mockPortfolio} currency="USD" />);
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
  });
});
`;
fs.writeFileSync('src/__tests__/NetWorthChart.test.tsx', netWorthChartTest);
