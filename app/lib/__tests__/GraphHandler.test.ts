import GraphHandler from "@/app/lib/GraphHandler";
import { NodeType, EdgeType } from "@/app/types/graph";
import { Transaction } from "@/app/types/transaction";
import Sigma from "sigma";
import Graph from "graphology";

jest.mock('sigma');
jest.mock('graphology');
jest.mock('values.js', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      all: jest.fn().mockReturnValue([
        { hexString: () => '#123456' },
        { hexString: () => '#123456' },
        { hexString: () => '#123456' },
        { hexString: () => '#123456' },
        { hexString: () => '#123456' }
      ])
    }))
  };
});

// Mock hexString function for test assertions
const mockHexString = jest.fn().mockReturnValue('#123456');

describe('GraphHandler', () => {
  // Define mock objects
  let mockGraph: jest.Mocked<Graph>;
  let mockSigma: jest.Mocked<Sigma<NodeType, EdgeType>>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock graph
    mockGraph = {
      hasNode: jest.fn(),
      addNode: jest.fn(),
      hasEdge: jest.fn(),
      addEdge: jest.fn(),
      setNodeAttribute: jest.fn(),
      getNodeAttribute: jest.fn()
    } as unknown as jest.Mocked<Graph>;
    
    // Setup mock sigma
    mockSigma = {
      getGraph: jest.fn().mockReturnValue(mockGraph)
    } as unknown as jest.Mocked<Sigma<NodeType, EdgeType>>;
  });
  
  describe('addNode', () => {
    it('should not do anything if graph is null', () => {
      mockSigma.getGraph.mockReturnValueOnce(null as any);
      GraphHandler.addNode(mockSigma, '0x123', false);
      
      expect(mockGraph.hasNode).not.toHaveBeenCalled();
      expect(mockGraph.addNode).not.toHaveBeenCalled();
    });
    
    it('should add a non-contract node with default color if node does not exist', () => {
      mockGraph.hasNode.mockReturnValueOnce(false);
      
      GraphHandler.addNode(mockSigma, '0x123', false);
      
      expect(mockGraph.hasNode).toHaveBeenCalledWith('0x123');
      expect(mockGraph.addNode).toHaveBeenCalledWith('0x123', {
        label: '0x123',
        x: expect.any(Number),
        y: expect.any(Number),
        size: 4,
        color: 'grey',
        isContract: false
      });
    });
    
    it('should add a contract node with blue color if node does not exist', () => {
      mockGraph.hasNode.mockReturnValueOnce(false);
      
      GraphHandler.addNode(mockSigma, '0x123', true);
      
      expect(mockGraph.hasNode).toHaveBeenCalledWith('0x123');
      expect(mockGraph.addNode).toHaveBeenCalledWith('0x123', {
        label: '0x123',
        x: expect.any(Number),
        y: expect.any(Number),
        size: 4,
        color: 'blue',
        isContract: true
      });
    });
    
    it('should not add node if it already exists', () => {
      mockGraph.hasNode.mockReturnValueOnce(true);
      
      GraphHandler.addNode(mockSigma, '0x123', false);
      
      expect(mockGraph.hasNode).toHaveBeenCalledWith('0x123');
      expect(mockGraph.addNode).not.toHaveBeenCalled();
    });
  });

  describe('addEdge', () => {
    it('should not do anything if graph is null', () => {
      mockSigma.getGraph.mockReturnValueOnce(null as any);
      GraphHandler.addEdge(mockSigma, '0x123', '0x456');
      
      expect(mockGraph.hasEdge).not.toHaveBeenCalled();
      expect(mockGraph.addEdge).not.toHaveBeenCalled();
    });
    
    it('should add edge if it does not exist', () => {
      mockGraph.hasEdge.mockReturnValueOnce(false);
      
      GraphHandler.addEdge(mockSigma, '0x123', '0x456');
      
      expect(mockGraph.hasEdge).toHaveBeenCalledWith('0x123', '0x456');
      expect(mockGraph.addEdge).toHaveBeenCalledWith('0x123', '0x456');
    });
    
    it('should not add edge if it already exists', () => {
      mockGraph.hasEdge.mockReturnValueOnce(true);
      
      GraphHandler.addEdge(mockSigma, '0x123', '0x456');
      
      expect(mockGraph.hasEdge).toHaveBeenCalledWith('0x123', '0x456');
      expect(mockGraph.addEdge).not.toHaveBeenCalled();
    });
  });
  
  describe('addTransaction', () => {
    it('should call addEdge with transaction from and to addresses', () => {
      const transaction: Transaction = {
        from: '0x123',
        to: '0x456',
        value: 1000
      };
      
      const addEdgeSpy = jest.spyOn(GraphHandler, 'addEdge');
      
      GraphHandler.addTransaction(mockSigma, transaction);
      
      expect(addEdgeSpy).toHaveBeenCalledWith(mockSigma, '0x123', '0x456');
      
      addEdgeSpy.mockRestore();
    });
  });
  
  describe('setNodeColour', () => {
    it('should not do anything if graph is null', () => {
      mockSigma.getGraph.mockReturnValueOnce(null as any);
      GraphHandler.setNodeColour(mockSigma, '0x123', 'red');
      
      expect(mockGraph.hasNode).not.toHaveBeenCalled();
      expect(mockGraph.setNodeAttribute).not.toHaveBeenCalled();
    });
    
    it('should set node color if node exists', () => {
      mockGraph.hasNode.mockReturnValueOnce(true);
      
      GraphHandler.setNodeColour(mockSigma, '0x123', 'red');
      
      expect(mockGraph.hasNode).toHaveBeenCalledWith('0x123');
      expect(mockGraph.setNodeAttribute).toHaveBeenCalledWith('0x123', 'color', 'red');
    });
    
    it('should not set node color if node does not exist', () => {
      mockGraph.hasNode.mockReturnValueOnce(false);
      
      GraphHandler.setNodeColour(mockSigma, '0x123', 'red');
      
      expect(mockGraph.hasNode).toHaveBeenCalledWith('0x123');
      expect(mockGraph.setNodeAttribute).not.toHaveBeenCalled();
    });
  });
  
  describe('updateNodeColour', () => {
    const transaction: Transaction = {
      from: '0xsender',
      to: '0xreceiver',
      value: 1000
    };
    
    it('should not update color for contract nodes', () => {
      mockGraph.getNodeAttribute.mockReturnValueOnce(true); // isContract = true
      
      const setNodeColourSpy = jest.spyOn(GraphHandler, 'setNodeColour');
      
      GraphHandler.updateNodeColour(mockSigma, transaction, 1000, true);
      
      expect(mockGraph.getNodeAttribute).toHaveBeenCalledWith('0xsender', 'isContract');
      expect(setNodeColourSpy).not.toHaveBeenCalled();
      
      setNodeColourSpy.mockRestore();
    });
    
    it('should set positive color for positive net balance', () => {
      mockGraph.getNodeAttribute.mockReturnValueOnce(false); // isContract = false
      
      const setNodeColourSpy = jest.spyOn(GraphHandler, 'setNodeColour').mockImplementation();
      
      GraphHandler.updateNodeColour(mockSigma, transaction, 2 * 1e18, false); // receiver with positive balance
      
      expect(mockGraph.getNodeAttribute).toHaveBeenCalledWith('0xreceiver', 'isContract');
      expect(setNodeColourSpy).toHaveBeenCalledWith(mockSigma, '0xreceiver', expect.any(String));
      
      setNodeColourSpy.mockRestore();
    });
    
    it('should set negative color for negative net balance', () => {
      mockGraph.getNodeAttribute.mockReturnValueOnce(false); // isContract = false
      
      const setNodeColourSpy = jest.spyOn(GraphHandler, 'setNodeColour').mockImplementation();
      
      GraphHandler.updateNodeColour(mockSigma, transaction, -2 * 1e18, true); // sender with negative balance
      
      expect(mockGraph.getNodeAttribute).toHaveBeenCalledWith('0xsender', 'isContract');
      expect(setNodeColourSpy).toHaveBeenCalledWith(mockSigma, '0xsender', expect.any(String));
      
      setNodeColourSpy.mockRestore();
    });
    
    it('should not update color when net balance is 0', () => {
      mockGraph.getNodeAttribute.mockReturnValueOnce(false); // isContract = false
      
      const setNodeColourSpy = jest.spyOn(GraphHandler, 'setNodeColour');
      
      GraphHandler.updateNodeColour(mockSigma, transaction, 0, true);
      
      expect(mockGraph.getNodeAttribute).toHaveBeenCalledWith('0xsender', 'isContract');
      expect(setNodeColourSpy).not.toHaveBeenCalled();
      
      setNodeColourSpy.mockRestore();
    });
    
    it('should handle max positive values with color scale limits', () => {
      mockGraph.getNodeAttribute.mockReturnValueOnce(false); // isContract = false
      
      const setNodeColourSpy = jest.spyOn(GraphHandler, 'setNodeColour').mockImplementation();
      
      GraphHandler.updateNodeColour(mockSigma, transaction, 10 * 1e18, false); // Above MAX_TRANSACTION_VALUE
      
      expect(mockGraph.getNodeAttribute).toHaveBeenCalledWith('0xreceiver', 'isContract');
      expect(setNodeColourSpy).toHaveBeenCalled();
      
      setNodeColourSpy.mockRestore();
    });
    
    it('should handle max negative values with color scale limits', () => {
      mockGraph.getNodeAttribute.mockReturnValueOnce(false); // isContract = false
      
      const setNodeColourSpy = jest.spyOn(GraphHandler, 'setNodeColour').mockImplementation();
      
      GraphHandler.updateNodeColour(mockSigma, transaction, -10 * 1e18, true); // Below -MAX_TRANSACTION_VALUE
      
      expect(mockGraph.getNodeAttribute).toHaveBeenCalledWith('0xsender', 'isContract');
      expect(setNodeColourSpy).toHaveBeenCalled();
      
      setNodeColourSpy.mockRestore();
    });
  });
});