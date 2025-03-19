import Graph from 'graphology';
import GraphHandler from '../GraphHandler';
import { Transaction } from '../types';

// Mock Sigma completely to avoid WebGL dependency
jest.mock('sigma', () => {
  return {
    __esModule: true,
    default: class MockSigma {
      private graph: Graph;
      
      constructor(graph: Graph) {
        this.graph = graph;
      }
      
      getGraph(): Graph {
        return this.graph;
      }
      
      // Add any other needed Sigma methods used by GraphHandler
    }
  };
});

// Mock EthereumApiClient
jest.mock('../EthereumApiClient', () => {
    const mockInstance = {
        getInfo: jest.fn().mockResolvedValue(null),
        isCode: jest.fn().mockResolvedValue(false)
    };

    return {
        __esModule: true,
        default: {
            getInstance: jest.fn().mockReturnValue(mockInstance)
        }
    };
});

// Mock event emitter
jest.mock('../EventEmitter', () => {
    return {
        __esModule: true,
        default: {
            emit: jest.fn()
        }
    };
});

describe('GraphHandler', () => {
    let sigma: any;
    let graphHandler: GraphHandler;
    let graph: Graph;
    const dummyTx: Transaction = {
        from: 'addr1',
        to: 'addr2',
        hash: 'txhash1',
        value: '1000000000000000000' // 1 ether in wei
    };

    beforeEach(() => {
        graph = new Graph();
        sigma = { getGraph: () => graph };
        graphHandler = new GraphHandler(sigma);
    });

    test('updateGraph should add nodes and edge for a new transaction', async () => {
        // Initially, graph should be empty
        expect(graph.order).toBe(0);
        await graphHandler.updateGraph(dummyTx);
        // Both nodes should have been added
        expect(graph.hasNode(dummyTx.from)).toBe(true);
        expect(graph.hasNode(dummyTx.to)).toBe(true);
        // Edge between nodes should exist
        expect(graph.hasEdge(dummyTx.from, dummyTx.to)).toBe(true);
        // Check that the edge contains the tx hash in pendingTx
        const edgeAttrs = graph.getEdgeAttributes(dummyTx.from, dummyTx.to);
        expect(edgeAttrs.pendingTx).toContain(dummyTx.hash);
    });

    test('resetHandler should clear the graph and reset counters', () => {
        // Add nodes manually
        graph.addNode('node1', { netBalance: 0, numTransactions: 1, isContract: false, color: 'grey', type: "circle", size: 4 });
        expect(graph.order).toBe(1);
        graphHandler.resetHandler();
        expect(graph.order).toBe(0);
        // Optionally, check counters if exposed via getters.
        expect(graphHandler.getNumContracts()).toBe(0);
        expect(graphHandler.getContractExecutions()).toBe(0);
    });

    test('selectNode should update highlight and node attributes', () => {
        // Setup two nodes.
        graph.addNode('node1', { netBalance: 0, numTransactions: 1, isContract: false, color: 'grey', type: "circle", size: 4 });
        graph.addNode('node2', { netBalance: 0, numTransactions: 1, isContract: false, color: 'grey', type: "circle", size: 4 });
        // Select node1.
        graphHandler.selectNode('node1');
        let n1Attrs = graph.getNodeAttributes('node1');
        expect(n1Attrs.color).toBe('orange');
        expect(n1Attrs.size).toBe(8);
        // Now select node2; node1 should be unhighlighted.
        graphHandler.selectNode('node2');
        n1Attrs = graph.getNodeAttributes('node1');
        expect(n1Attrs.size).toBe(4);
        const n2Attrs = graph.getNodeAttributes('node2');
        expect(n2Attrs.color).toBe('orange');
        expect(n2Attrs.size).toBe(8);
    });
});