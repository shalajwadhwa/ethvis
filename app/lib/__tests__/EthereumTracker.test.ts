import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Define mockGraphHandlerInstance before mocking
const mockGraphHandlerInstance = {
  updateGraph: jest.fn().mockResolvedValue(undefined),
  colourMinedTransaction: jest.fn().mockResolvedValue(undefined),
  resetHandler: jest.fn(),
  selectNode: jest.fn(),
  getNumContracts: jest.fn().mockReturnValue(5),
  getContractExecutions: jest.fn().mockReturnValue(10),
  getGraphOrder: jest.fn().mockReturnValue(15),
  getGraphSize: jest.fn().mockReturnValue(20),
  getNodeAttributes: jest.fn().mockReturnValue({ label: 'node', x: 0, y: 0 }),
  getTopNodes: jest.fn().mockReturnValue(['0x123', '0x456'])
};

// Mock the module imports with proper default export mocking
jest.mock('../GraphHandler', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockGraphHandlerInstance)
  };
});
jest.mock('../EventEmitter');
jest.mock('alchemy-sdk');

// Add declarations for async-mutex mocks at module scope
let mockMutex: any;
let mockMutexRelease: jest.Mock;

// Update the async-mutex mock factory:
jest.mock('async-mutex', () => ({
  Mutex: jest.fn().mockImplementation(() => {
    mockMutexRelease = jest.fn();
    mockMutex = {
      acquire: jest.fn().mockResolvedValue(mockMutexRelease),
      release: jest.fn(),
      isLocked: jest.fn(),
      waitForUnlock: jest.fn(),
      runExclusive: jest.fn(async (callback) => await callback())
    };
    return mockMutex;
  })
}));

// Now import after mocking
import GraphHandler from '../GraphHandler';
import eventEmitter from '../EventEmitter';
import { Mutex } from 'async-mutex';
import EthereumTracker from '../EthereumTracker';
import { Transaction, EventType, VisualisationType, MinedTransactionResponse } from '../types';

describe('EthereumTracker', () => {
  // Mock instances
  let mockSigma: any;
  let tracker: EthereumTracker;
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock graph
    const mockGraph = {
      order: 15,
      size: 20,
      hasNode: jest.fn().mockReturnValue(true),
      getNodeAttributes: jest.fn(),
      clear: jest.fn(),
      hasEdge: jest.fn().mockReturnValue(true),
      getEdgeAttributes: jest.fn().mockReturnValue({
        pendingTx: [],
        minedTx: [],
        color: 'grey'
      }),
      setEdgeAttribute: jest.fn(),
      addEdge: jest.fn(),
      dropEdge: jest.fn(),
      setNodeAttribute: jest.fn(),
      dropNode: jest.fn(),
      addNode: jest.fn()
    };
    
    // Create mock sigma
    mockSigma = {
      getGraph: jest.fn().mockReturnValue(mockGraph)
    };
    
    // Reset mock functions to ensure they're fresh
    mockGraphHandlerInstance.updateGraph.mockClear();
    mockGraphHandlerInstance.colourMinedTransaction.mockClear();
    mockGraphHandlerInstance.resetHandler.mockClear();
    mockGraphHandlerInstance.selectNode.mockClear();
    mockGraphHandlerInstance.getNodeAttributes.mockClear();
    
    // Setup EventEmitter mock
    (eventEmitter.on as jest.Mock) = jest.fn();
    (eventEmitter.off as jest.Mock) = jest.fn();
    (eventEmitter.emit as jest.Mock) = jest.fn();
    
    // Create tracker instance with our mocked graph handler
    tracker = new EthereumTracker(mockSigma, VisualisationType.DEFAULT);
    
    // Access and replace the graph handler directly
    Object.defineProperty(tracker, '_graphHandler', {
      value: mockGraphHandlerInstance,
      writable: true
    });
  });

  // Tests
  describe('constructor', () => {
    it('should initialize with DEFAULT visualization type', () => {
      expect(GraphHandler).toHaveBeenCalled();
      expect(eventEmitter.on).toHaveBeenCalledWith(EventType.NewPendingTransaction, expect.any(Function));
      expect(eventEmitter.on).toHaveBeenCalledWith(EventType.NewMinedTransaction, expect.any(Function));
    });

    it('should initialize with RANGE visualization type', () => {
      jest.clearAllMocks();
      tracker = new EthereumTracker(mockSigma, VisualisationType.RANGE);
      
      // Reset the graph handler to our mock
      Object.defineProperty(tracker, '_graphHandler', {
        value: mockGraphHandlerInstance,
        writable: true
      });
      
      expect(eventEmitter.on).toHaveBeenCalledWith(EventType.TransactionFromBlock, expect.any(Function));
    });
  });

  describe('append', () => {
    it('should add transaction to mempool and update graph', async () => {
      const tx: Transaction = { hash: '0x123', from: '0xabc', to: '0xdef', value: '1000000000000000000' }; // 1 ether in wei
      
      await (tracker as any).append(tx);
      
      expect(mockGraphHandlerInstance.updateGraph).toHaveBeenCalledWith(tx);
      expect(mockMutexRelease).toHaveBeenCalled();
      expect(tracker.getNumTransactions()).toBe(1);
    });

    it('should remove oldest transaction when mempool is full', async () => {
      // Set a small maxMempoolSize for testing
      (tracker as any).maxMempoolSize = 2;
      
      const tx1: Transaction = { hash: '0x1', from: '0xa', to: '0xb', value: '1000000000000000000' }; // 1 ether in wei
      const tx2: Transaction = { hash: '0x2', from: '0xc', to: '0xd', value: '2000000000000000000' }; // 2 ether in wei
      const tx3: Transaction = { hash: '0x3', from: '0xe', to: '0xf', value: '3000000000000000000' }; // 3 ether in wei
      
      await (tracker as any).append(tx1);
      await (tracker as any).append(tx2);
      
      // Clear the mock to only track the last call
      mockGraphHandlerInstance.updateGraph.mockClear();
      
      await (tracker as any).append(tx3);
      
      // Verify tx1 was removed
      expect(mockGraphHandlerInstance.updateGraph).toHaveBeenCalledWith(tx1, true);
      expect(tracker.getNumTransactions()).toBe(2);
    });
  });

  describe('colourMinedTransaction', () => {
    it('should call graphHandler.colourMinedTransaction', async () => {
      const tx: Transaction = { hash: '0x123', from: '0xabc', to: '0xdef', value: '1000000000000000000' }; // 1 ether in wei
      const response: MinedTransactionResponse = { 
        hash: '0x123', 
        blockNumber: 123,
        transaction: tx,
        isRemoved: false
      };
      
      await (tracker as any).colourMinedTransaction(response);
      
      expect(mockGraphHandlerInstance.colourMinedTransaction).toHaveBeenCalledWith(response);
    });
  });

  describe('selectNode', () => {
    it('should call graphHandler.selectNode', () => {
      tracker.selectNode('0x123');
      expect(mockGraphHandlerInstance.selectNode).toHaveBeenCalledWith('0x123');
    });
  });

  describe('getter methods', () => {
    it('should return correct values from graphHandler', () => {
      expect(tracker.getNumContracts()).toBe(5);
      expect(tracker.getNumContractExecutions()).toBe(10);
      expect(tracker.getGraphOrder()).toBe(15);
      expect(tracker.getGraphSize()).toBe(20);
      expect(tracker.getTopNodes()).toEqual(['0x123', '0x456']);
    });
  });

  describe('changeVisualisation', () => {
    it('should reset when changing visualization type', () => {
      // Change from DEFAULT to RANGE
      tracker.changeVisualisation(VisualisationType.RANGE);
      
      expect(eventEmitter.off).toHaveBeenCalledWith(EventType.NewPendingTransaction, expect.any(Function));
      expect(eventEmitter.off).toHaveBeenCalledWith(EventType.NewMinedTransaction, expect.any(Function));
      expect(mockGraphHandlerInstance.resetHandler).toHaveBeenCalled();
      expect(eventEmitter.on).toHaveBeenCalledWith(EventType.TransactionFromBlock, expect.any(Function));
    });
    
    it('should not reset if visualization type is unchanged', () => {
      jest.clearAllMocks();
      
      // Same visualization type
      tracker.changeVisualisation(VisualisationType.DEFAULT);
      
      expect(eventEmitter.off).toHaveBeenCalled();
      expect(eventEmitter.on).toHaveBeenCalled();
      expect(mockGraphHandlerInstance.resetHandler).not.toHaveBeenCalled();
    });
  });

  describe('getNodeAttributes', () => {
    it('should call graphHandler.getNodeAttributes', () => {
      const result = tracker.getNodeAttributes('0x123');
      expect(mockGraphHandlerInstance.getNodeAttributes).toHaveBeenCalledWith('0x123');
      expect(result).toEqual({ label: 'node', x: 0, y: 0 });
    });
  });
});
