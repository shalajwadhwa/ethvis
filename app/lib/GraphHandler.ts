import Graph from 'graphology';
import { Transaction } from '@/app/types/transaction';
import Sigma from 'sigma';
import { AddressInfo, AddressInfoResponse, Attributes, EdgeType } from '@/app/types/graph';
import Values from 'values.js';
import { EventType } from '@/app/types/event';
import eventEmitter from '@/app/lib/EventEmitter';
import { MinedTransactionResponse } from '@/app/types/response';
import EthereumApiClient from './EthereumApiClient';
import { Utils } from 'alchemy-sdk';

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

const HIGHLIGHTED_NODE_COLOUR = 'orange';
const HIGHLIGHTED_NODE_SIZE = 8;

// todo: implement additional edge colours
// some transactions removed
// const SEMI_REMOVED_EDGE = 'red';
// all transactions removed - flicker node

const NUM_COLOUR_BINS = 5;
const MAX_TRANSACTION_VALUE = 4 * 1e18;
const BIN_INTERVAL = MAX_TRANSACTION_VALUE / NUM_COLOUR_BINS;

const negativeScale = new Values(NEGATIVE_COLOUR).shades(NUM_COLOUR_BINS);
const positiveScale = new Values(POSITIVE_COLOUR).shades(NUM_COLOUR_BINS);

enum ATTRIBUTES {
  LABEL = 'label',
  NAME = 'name',
  WEBSITE = 'website',
  NAMETAG = 'nameTag',
  SYMBOL = 'symbol',
}

class GraphHandler {
  public sigma: Sigma<Attributes, EdgeType>;
  public highlightNode: string | null = null;
  private originalNodeAttributes: { color?: string, size?: number } = {};

  constructor(sigma: Sigma<Attributes, EdgeType>) {
    this.sigma = sigma;
    
    eventEmitter.on(
      EventType.NewMinedTransaction,
      (response) => this.colourMinedTransaction(response)
    )
    // todo: create event type
    eventEmitter.on("staticVisualisation", (tx) => this.updateGraph(tx));
  }

  public getNodeAttributes(node: string): Attributes | undefined {
    const graph: Graph = this.sigma.getGraph();
    if (!graph || !node ||!graph.hasNode(node)) {
      return;
    }

    return graph.getNodeAttributes(node) as Attributes;
  }

  public resetHandler(): void {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

    graph.clear();
  }

  public selectNode(node: string | null): void {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

    if (this.highlightNode && graph.hasNode(this.highlightNode)) {      
      if (this.originalNodeAttributes.color) {
        // todo: update node with new colour if new transactions have been received in the mempool
        graph.setNodeAttribute(this.highlightNode, "color", this.originalNodeAttributes.color);
      }

      if (this.originalNodeAttributes.size !== undefined) {
        graph.setNodeAttribute(this.highlightNode, "size", this.originalNodeAttributes.size);
      }
    }

    this.originalNodeAttributes = {};
    this.highlightNode = null;

    if (node !== null && graph.hasNode(node)) {
      const nodeAttrs = graph.getNodeAttributes(node);
      this.originalNodeAttributes = {
        color: nodeAttrs.color,
        size: nodeAttrs.size
      };
            
      graph.setNodeAttribute(node, "color", HIGHLIGHTED_NODE_COLOUR);
      graph.setNodeAttribute(node, "size", HIGHLIGHTED_NODE_SIZE);
      this.highlightNode = node;
    }
  }

  public async updateGraph(tx: Transaction, remove: boolean = false): Promise<void> {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

    if (!remove) {
      await this.addTransaction(graph, tx);
    } else {
      await this.removeTransaction(graph, tx);
    }
  }

  private async addTransaction(graph: Graph, tx: Transaction): Promise<void> {
    await this.mempoolUpdate(graph, tx);

    const edge = graph.hasEdge(tx.from, tx.to);
    if (edge) {
      const attributes = graph.getEdgeAttributes(tx.from, tx.to);
      attributes.pendingTx.push(tx.hash);
      graph.setEdgeAttribute(tx.from, tx.to, 'pendingTx', attributes.pendingTx);

      if (attributes.color === MINED_EDGE_COLOUR) {
        graph.setEdgeAttribute(tx.from, tx.to, 'color', SEMI_MINED_EDGE);
      }
    } 
    else {
      graph.addEdge(tx.from, tx.to, { color: DEFAULT_EDGE_COLOUR, pendingTx: [tx.hash], minedTx: [] });
    }
  }

  private async mempoolUpdate(graph: Graph, tx: Transaction, remove: boolean = false): Promise<void> {
    if (!remove) {
      await this.addNodesFromTransaction(graph, tx);
    }

    // todo: fix ghost nodes issue (nodes without transactions)
    this.updateNodesFromTransaction(graph, tx, remove);
  }

  private updateNodesFromTransaction(graph:Graph, tx: Transaction, remove: boolean = false) {
    const reverse_tx_multiplier = remove ? -1 : 1;

    this.updateNode(graph, tx.to, -parseFloat(Utils.formatEther(tx.value)) * reverse_tx_multiplier, remove);
    this.updateNode(graph, tx.from, parseFloat(Utils.formatEther(tx.value)) * reverse_tx_multiplier, remove);
  }

  private addNode(graph: Graph, node: string, attributes: Attributes): void {
    const colour = attributes.isContract ? CONTRACT_COLOUR : DEFAULT_COLOUR;
    const shape = attributes.isContract ? CONTRACT_SHAPE : DEFAULT_SHAPE;
    attributes.color = colour;
    attributes.type = shape;
    attributes.size = 4;

    if (!graph.hasNode(node)) {
      graph.addNode(node, { x: Math.random(), y: Math.random(), ...attributes });
    }
  }

  private removeNode(graph: Graph, node: string): void {
    if (graph.hasNode(node)) {
      graph.dropNode(node);
    }
  }

  private async removeTransaction(graph: Graph, tx: Transaction): Promise<void> {
    await this.mempoolUpdate(graph, tx, true);

    const edge = graph.hasEdge(tx.from, tx.to);
    if (edge) {
      const attributes = graph.getEdgeAttributes(tx.from, tx.to);
      const pendingTx = attributes.pendingTx;

      const minedTx = attributes.minedTx;
      const index = minedTx.indexOf(tx.hash);
      if (index > -1) {
        minedTx.splice(index, 1);
      }

      if (minedTx.length === 0 && pendingTx.length === 0) {
        graph.dropEdge(tx.from, tx.to);
      } else {
        graph.setEdgeAttribute(tx.from, tx.to, 'pendingTx', pendingTx);
        graph.setEdgeAttribute(tx.from, tx.to, 'minedTx', minedTx);
      }
      // todo: flicker when trying to remove a pending transaction?
    }
  }

  private setNodeColour(graph: Graph, node: string, colour: string): void {
    if (graph.hasNode(node)) {
      graph.setNodeAttribute(node, 'color', colour);
    }
  }

  // todo: fix types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private updateNodeAttribute(graph: Graph, node: string, attribute: string, value: any): void {
    if (graph.hasNode(node)) {
      graph.setNodeAttribute(node, attribute, value);
    }
  }

  private updateNodeColour(graph: Graph, node: string, netBalance: number): void {
    const isContract = graph.getNodeAttribute(node, 'isContract');
    if (isContract) {
      return;
    }

    if (netBalance > 0) {
      let interval = Math.floor(netBalance / BIN_INTERVAL);
      if (interval >= NUM_COLOUR_BINS) {
        interval = NUM_COLOUR_BINS - 1;
      }
      const colour = positiveScale[interval] ? positiveScale[interval].hexString() : POSITIVE_COLOUR;
      this.setNodeColour(graph, node, colour);
    }
    else if (netBalance < 0) {
      let interval = Math.floor(-netBalance / BIN_INTERVAL);
      if (interval >= NUM_COLOUR_BINS) {
        interval = NUM_COLOUR_BINS - 1;
      }
      const colour = negativeScale[interval] ? negativeScale[interval].hexString() : NEGATIVE_COLOUR;
      this.setNodeColour(graph, node, colour);
    }
    else {
      return;
    }
  }

  private colourMinedTransaction(response: MinedTransactionResponse): void {
    const tx = response.transaction;

    const graph: Graph = this.sigma.getGraph();
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

      if (pendingTx.length === 0 && minedTx.length > 0) {
        graph.setEdgeAttribute(tx.from, tx.to, 'color', MINED_EDGE_COLOUR);
      } 
      else if (pendingTx.length > 0 && minedTx.length > 0) {
        graph.setEdgeAttribute(tx.from, tx.to, 'color', SEMI_MINED_EDGE);
      }
    }
  }

  private async addNodesFromTransaction(graph: Graph, tx: Transaction): Promise<void> {
    await this.addNewAddress(graph, tx.from);
    await this.addNewAddress(graph, tx.to, true);
  }

  private async addNewAddress(graph: Graph, address: string, isTo=false): Promise<void> {
    const nodeAttributes: AddressInfoResponse | null = await EthereumApiClient.getInstance().getInfo(address)
      .then(
        (response) => response)
      .catch(
        (error) => {
            console.log("Error fetching address info", error);
            return null;
        }
    );

    const isContract = isTo && await EthereumApiClient.getInstance().isCode(address)
      .then(
        (response) => response !== '0x' ? true : false)
      .catch(
        (error) => {
            console.log("Error fetching contract info", error);
            return false;
        }
    );

    const attributes: Attributes = this.simplifyAttributes(address, nodeAttributes, isContract);
    this.addNode(graph, address, attributes);
  }

  private simplifyAttributes(address: string, response: AddressInfoResponse | null, isContract: boolean): Attributes {
    const result: Attributes = { address: address, isContract, netBalance: 0, numTransactions: 0 };

    if (!response) {
        return result;
    }

    const entries = Array.isArray(response) ? response : [response];    
    for (const entry of entries) {
        for (const attribute of Object.values(ATTRIBUTES)) {
            const value = entry[attribute as keyof AddressInfo];
            if (value) {
                if (!result[attribute]) {
                    result[attribute] = new Set();
                }
                if (typeof value === 'string') {
                    result[attribute].add(value);
                }
            }
        }
    }

    return result;
  }

  private updateNode(graph:Graph, node: string, value: number, remove: boolean): void {
    const attributes: Attributes | undefined = this.getNodeAttributes(node);
    
    if (!attributes) return;
    
    attributes.numTransactions += remove ? -1 : 1;
    
    if (attributes.numTransactions === 0) {
        this.removeNode(graph, node);
        return;
    }
    
    const newBalance = attributes.netBalance + value;
    this.updateNodeAttribute(graph, node, 'netBalance', newBalance);
    this.updateNodeColour(graph, node, newBalance);
    // todo: emit event to update top nodes
    eventEmitter.emit("topNodes", node);
  }
}

export default GraphHandler