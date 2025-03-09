import Graph from 'graphology';
import { Transaction } from '@/app/types/transaction';
import Sigma from 'sigma';
import { NodeType, EdgeType } from '@/app/types/graph';
import Values from 'values.js';
import { EventType } from '@/app/types/event';
import eventEmitter from '@/app/lib/EventEmitter';
import { MinedTransactionResponse } from '@/app/types/response';

const DEFAULT_SHAPE = "circle";
const CONTRACT_SHAPE = "square";

const DEFAULT_COLOUR = 'grey';
const CONTRACT_COLOUR = 'blue';
const NEGATIVE_COLOUR = 'red';
const POSITIVE_COLOUR = 'green';

// no transactions validated
const DEFAULT_EDGE_COLOUR = 'grey';
// some transactions validated
const SEMI_MINED_EDGE = 'green';
// all transactions validated
const MINED_EDGE_COLOUR = 'purple';

// todo: implement additional edge colours
// some transactions removed
// const SEMI_REMOVED_EDGE = 'red';
// all transactions removed - flicker node

const NUM_COLOUR_BINS = 5;
const MAX_TRANSACTION_VALUE = 4 * 1e18;
const BIN_INTERVAL = MAX_TRANSACTION_VALUE / NUM_COLOUR_BINS;

const negativeScale = new Values(NEGATIVE_COLOUR).shades(NUM_COLOUR_BINS);
const positiveScale = new Values(POSITIVE_COLOUR).shades(NUM_COLOUR_BINS);


class GraphHandler {
  public static sigma: Sigma<NodeType, EdgeType>;

  public constructor(sigma: Sigma<NodeType, EdgeType>) {
    GraphHandler.sigma = sigma;

    eventEmitter.on(
      EventType.NewMinedTransaction,
      (response) => GraphHandler.colourMinedTransaction(sigma, response)
    )
  }

  public static resetHandler(): void {
    const graph: Graph = GraphHandler.sigma.getGraph();
    if (!graph) {
      return;
    }

    graph.clear();
  }

  public static addNode(node: string, isContract: boolean): void {
    const graph: Graph = GraphHandler.sigma.getGraph();
    if (!graph) {
      return;
    }

    const colour = isContract ? CONTRACT_COLOUR : DEFAULT_COLOUR;
    const shape = isContract ? CONTRACT_SHAPE : DEFAULT_SHAPE;
    if (!graph.hasNode(node)) {
      graph.addNode(node, { label: node, x: Math.random(), y: Math.random(), size: 4, color: colour, isContract: isContract, type: shape });
    }
  }

  public static removeNode(node: string): void {
    const graph: Graph = GraphHandler.sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasNode(node)) {
      graph.dropNode(node);
    }
  }

  public static addEdge(from: string, to: string, hash: string): void {
    const graph: Graph = GraphHandler.sigma.getGraph();
    if (!graph) {
      return;
    }

    const edge = graph.hasEdge(from, to);
    if (edge) {
      const attributes = graph.getEdgeAttributes(from, to);
      attributes.pendingTx.push(hash);
      graph.setEdgeAttribute(from, to, 'pendingTx', attributes.pendingTx);
      if (attributes.color === MINED_EDGE_COLOUR) {
        this.setEdgeColour(from, to, SEMI_MINED_EDGE);
      }
    } else {
      graph.addEdge(from, to, { color: DEFAULT_EDGE_COLOUR, pendingTx: [hash], minedTx: [] });
    }
  }

  public static removeEdge(sigma: Sigma<NodeType, EdgeType>, from: string, to: string, hash: string): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    const edge = graph.hasEdge(from, to);
    if (edge) {
      const attributes = graph.getEdgeAttributes(from, to);
      const pendingTx = attributes.pendingTx;

      const minedTx = attributes.minedTx;
      const index = minedTx.indexOf(hash);
      if (index > -1) {
        minedTx.splice(index, 1);
      }

      if (minedTx.length === 0 && pendingTx.length === 0) {
        graph.dropEdge(from, to);
      } else {
        graph.setEdgeAttribute(from, to, 'pendingTx', pendingTx);
        graph.setEdgeAttribute(from, to, 'minedTx', minedTx);
      }
      // todo: flicker when trying to remove a pending transaction?
    }
  }

  public static addTransaction(tx: Transaction): void {
    this.addEdge(tx.from, tx.to, tx.hash);
  }

  private static setNodeColour(node: string, colour: string): void {
    const graph: Graph = GraphHandler.sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasNode(node)) {
      graph.setNodeAttribute(node, 'color', colour);
    }
  }

  public static updateNodeColour(node: string, netBalance: number): void {
    const isContract = GraphHandler.sigma.getGraph().getNodeAttribute(node, 'isContract');
    if (isContract) {
      return;
    }

    if (netBalance > 0) {
      let interval = Math.floor(netBalance / BIN_INTERVAL);
      if (interval >= NUM_COLOUR_BINS) {
        interval = NUM_COLOUR_BINS - 1;
      }
      const colour = positiveScale[interval] ? positiveScale[interval].hexString() : POSITIVE_COLOUR;
      this.setNodeColour(node, colour);
    }
    else if (netBalance < 0) {
      let interval = Math.floor(-netBalance / BIN_INTERVAL);
      if (interval >= NUM_COLOUR_BINS) {
        interval = NUM_COLOUR_BINS - 1;
      }
      const colour = negativeScale[interval] ? negativeScale[interval].hexString() : NEGATIVE_COLOUR;
      this.setNodeColour(node, colour);
    }
    else {
      return;
    }
  }

  private static setEdgeColour(from: string, to: string, colour: string): void {
    const graph: Graph = GraphHandler.sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasEdge(from, to)) {
      graph.setEdgeAttribute(from, to, 'color', colour);
    }
  }

  private static colourMinedTransaction(sigma: Sigma<NodeType, EdgeType>, response: MinedTransactionResponse): void {
    const tx = response.transaction;

    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    const edge = graph.hasEdge(tx.from, tx.to);
    if (edge) {
      const attributes = graph.getEdgeAttributes(tx.from, tx.to);
      const minedTx = attributes.minedTx;
      const pendingTx = attributes.pendingTx;

      if (pendingTx.includes(tx.hash)) {
        pendingTx.splice(pendingTx.indexOf(tx.hash), 1);
        minedTx.push(tx.hash);     
        graph.setEdgeAttribute(tx.from, tx.to, 'pendingTx', pendingTx);
        graph.setEdgeAttribute(tx.from, tx.to, 'minedTx', minedTx);   
      }

      console.log("COLOUR_MINED_TRANSACTION", pendingTx, minedTx);

      if (pendingTx.length === 0 && minedTx.length > 0) {
        this.setEdgeColour(tx.from, tx.to, MINED_EDGE_COLOUR);
      } 
      else if (pendingTx.length > 0 && minedTx.length > 0) {
        console.log("SEMI_MINED_EDGE", pendingTx, minedTx);
        this.setEdgeColour(tx.from, tx.to, SEMI_MINED_EDGE);
      }
    }
  }
}

export default GraphHandler