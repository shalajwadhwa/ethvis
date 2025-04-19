# EthVis - Ethereum Blockchain Visualization

EthVis is a Next.js application designed to visualize Ethereum blockchain data in an intuitive and interactive way. The project aims to make blockchain data more accessible and understandable for developers, analysts, and crypto enthusiasts.

## Features

- Real-time Ethereum blockchain data visualization
- User-friendly interface for exploring smart contracts
- Mempool Visualisation
- Historic Timestamp Range Visualisation

## Tech Stack

- [Next.js](https://nextjs.org) - React framework for the frontend
- [TypeScript](https://www.typescriptlang.org/) - For type-safe code
- [react-sigma](https://sim51.github.io/react-sigma/) - Graph visualization library based on Sigma.js
- [Alchemy SDK](https://docs.alchemy.com/reference/alchemy-sdk-quickstart) - Enhanced API for Ethereum data access

## Getting Started

### Prerequisites

- Docker and Docker Compose
- An Alchemy API key (project is currently only compatible with Alchemy)
- You can create one for free at [https://dashboard.alchemy.com/signup](https://dashboard.alchemy.com/signup)

### Installation

#### Option 1: Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/shalajwadhwa/ethvis.git
   cd ethvis
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory:
   ```
   ALCHEMY_API_KEY="{ALCHEMY API KEY}"
   NEXT_PUBLIC_ETHVIS="localhost:8080"
   ```

3. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```
   This will start:
   - EthVis on port 8080
   - eth-labels on port 3000 (internally, not exposed by default)

4. Access the application at [http://localhost:8080](http://localhost:8080)

#### Option 2: Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/shalajwadhwa/ethvis.git
   cd ethvis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with your API keys:
   ```
   ALCHEMY_API_KEY="{ALCHEMY API KEY}"
   NEXT_PUBLIC_ETHVIS="localhost:8080"
   ```

4. Set up eth-labels (required for address labeling):
   ```bash
   # In a separate terminal
   git clone https://github.com/shalajwadhwa/eth-labels.git
   cd eth-labels
   bun install
   bun run start
   ```
   This will start eth-labels on port 3000.
   Note: This version of eth-labels is compatible with EthVis without additional changes.

5. Run the development server:
   ```bash
   npm run dev
   ```
   This will start EthVis on port 8080.

Open [http://localhost:8080](http://localhost:8080) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [eth-labels](https://github.com/dawsbot/eth-labels) - Ethereum address labels and metadata
- [Etherscan](https://etherscan.io/) for reference data