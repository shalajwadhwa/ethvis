import Graph from 'graphology';
import { Transaction } from '@/app/types/transaction';
import Sigma from 'sigma';
import { NodeType, EdgeType } from '@/app/types/graph';
import Values from 'values.js';
import { EventType } from '@/app/types/event';
import eventEmitter from '@/app/lib/EventEmitter';

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
  public constructor(sigma: Sigma<NodeType, EdgeType>) {
    eventEmitter.on(
      EventType.AddAddressToGraph,
      (address, isContract) => GraphHandler.addNode(sigma, address, isContract)
    );
    eventEmitter.on(
      EventType.AddTransactionToGraph,
      (tx) => GraphHandler.addTransaction(sigma, tx)
    );
    eventEmitter.on(
      EventType.UpdateNodeNetBalance,
      (tx, netBalance, is_sender) => GraphHandler.updateNodeColour(sigma, tx, netBalance, is_sender)
    );
  }

  public static addNode(sigma: Sigma<NodeType, EdgeType>, node: string, isContract: boolean): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    const colour = isContract ? CONTRACT_COLOUR : DEFAULT_COLOUR;
    if (!graph.hasNode(node)) {
      graph.addNode(node, { label: node, x: Math.random(), y: Math.random(), size: 4, color: colour, isContract: isContract });
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

  public static setNodeColour(sigma: Sigma<NodeType, EdgeType>, node: string, colour: string): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasNode(node)) {
      graph.setNodeAttribute(node, 'color', colour);
    }
  }

  public static updateNodeColour(sigma: Sigma<NodeType, EdgeType>, tx: Transaction, netBalance: number, is_sender: boolean): void {
    const node = is_sender ? tx.from : tx.to;
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
}

export default GraphHandler