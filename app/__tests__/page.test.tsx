import type { FC } from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../page';
import '@testing-library/jest-dom';

describe('Home', () => {
    it('renders the main heading', () => {
        render(<Home />);
        const heading = screen.getByRole('heading', { name: /Ethereum Transactions and Pattern Visualisation/i });
        expect(heading).toBeInTheDocument();
    });

    it('renders the Visualise link', () => {
        render(<Home />);
        const link = screen.getByRole('link', { name: /Visualise/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/visualise');
    });
});