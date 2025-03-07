import Graph from 'graphology';
import { Transaction } from '@/app/types/transaction';
import Sigma from 'sigma';
import { NodeType, EdgeType } from '@/app/types/graph';
import Values from 'values.js';
import { EventType } from '@/app/types/event';
import eventEmitter from '@/app/lib/EventEmitter';

const DEFAULT_SHAPE = "circle";
const CONTRACT_SHAPE = "square";

const DEFAULT_COLOUR = 'grey';
const CONTRACT_COLOUR = 'blue';
const NEGATIVE_COLOUR = 'red';
const POSITIVE_COLOUR = 'green';

const NUM_COLOUR_BINS = 5;
const MAX_TRANSACTION_VALUE = 4 * 1e18;
const BIN_INTERVAL = MAX_TRANSACTION_VALUE / NUM_COLOUR_BINS;

const negativeScale = new Values(NEGATIVE_COLOUR).shades(NUM_COLOUR_BINS);
const positiveScale = new Values(POSITIVE_COLOUR).shades(NUM_COLOUR_BINS);


class GraphHandler {
  private sigma: Sigma<NodeType, EdgeType>;

  public constructor(sigma: Sigma<NodeType, EdgeType>) {
    this.sigma = sigma;

    eventEmitter.on(
      EventType.AddAddressToGraph,
      (address, isContract) => GraphHandler.addNode(sigma, address, isContract)
    );
    eventEmitter.on(
      EventType.RemoveAddressFromGraph,
      (address) => GraphHandler.removeNode(sigma, address)
    );
    eventEmitter.on(
      EventType.AddTransactionToGraph,
      (tx) => GraphHandler.addTransaction(sigma, tx)
    );
    eventEmitter.on(
      EventType.UpdateNodeNetBalance,
      (node, netBalance) => GraphHandler.updateNodeColour(sigma, node, netBalance)
    );
    eventEmitter.on(
      EventType.NewMinedTransaction,
      (tx) => GraphHandler.colourMinedTransaction(sigma, tx)
    )
  }

  public resetHandler(): void {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

    graph.clear();
  }

  public static addNode(sigma: Sigma<NodeType, EdgeType>, node: string, isContract: boolean): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    const colour = isContract ? CONTRACT_COLOUR : DEFAULT_COLOUR;
    const shape = isContract ? CONTRACT_SHAPE : DEFAULT_SHAPE;
    if (!graph.hasNode(node)) {
      graph.addNode(node, { label: node, x: Math.random(), y: Math.random(), size: 4, color: colour, isContract: isContract, type: shape });
    }
  }

  public static removeNode(sigma: Sigma<NodeType, EdgeType>, node: string): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasNode(node)) {
      graph.dropNode(node);
    }
  }

  public static addEdge(sigma: Sigma<NodeType, EdgeType>, from: string, to: string): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    if (!graph.hasEdge(from, to)) {
      graph.addEdge(from, to);
    }
  }

  public static addTransaction(sigma: Sigma<NodeType, EdgeType>, tx: Transaction): void {
    this.addEdge(sigma, tx.from, tx.to);
  }

  private static setNodeColour(sigma: Sigma<NodeType, EdgeType>, node: string, colour: string): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasNode(node)) {
      graph.setNodeAttribute(node, 'color', colour);
      if (colour === "purple") {
        console.log('Setting node colour to purple:', node);
      }
    }
  }

  public static updateNodeColour(sigma: Sigma<NodeType, EdgeType>, node: string, netBalance: number): void {
    const isContract = sigma.getGraph().getNodeAttribute(node, 'isContract');
    if (isContract) {
      return;
    }

    if (netBalance > 0) {
      let interval = Math.floor(netBalance / BIN_INTERVAL);
      if (interval >= NUM_COLOUR_BINS) {
        interval = NUM_COLOUR_BINS - 1;
      }
      const colour = positiveScale[interval] ? positiveScale[interval].hexString() : POSITIVE_COLOUR;
      this.setNodeColour(sigma, node, colour);
    }
    else if (netBalance < 0) {
      let interval = Math.floor(-netBalance / BIN_INTERVAL);
      if (interval >= NUM_COLOUR_BINS) {
        interval = NUM_COLOUR_BINS - 1;
      }
      const colour = negativeScale[interval] ? negativeScale[interval].hexString() : NEGATIVE_COLOUR;
      this.setNodeColour(sigma, node, colour);
    }
    else {
      return;
    }
  }

  private static colourMinedTransaction(sigma: Sigma<NodeType, EdgeType>, tx: Transaction): void {
    console.log('Mined transaction:', tx);
    this.setNodeColour(sigma, tx.from, "purple");
    this.setNodeColour(sigma, tx.to, "purple");
  }
}

export default GraphHandler