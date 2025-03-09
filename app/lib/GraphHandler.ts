import Graph from 'graphology';
import { Transaction } from '@/app/types/transaction';
import Sigma from 'sigma';
import { AddressInfo, AddressInfoResponse, Attributes, EdgeType } from '@/app/types/graph';
import Values from 'values.js';
import { EventType } from '@/app/types/event';
import eventEmitter from '@/app/lib/EventEmitter';
import { MinedTransactionResponse } from '@/app/types/response';
import EthereumApiClient from './EthereumApiClient';

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

enum ATTRIBUTES {
  LABEL = 'label',
  NAME = 'name',
  WEBSITE = 'website',
  NAMETAG = 'nameTag',
  SYMBOL = 'symbol',
}

class GraphHandler {
  private static instance: GraphHandler;
  public sigma: Sigma<Attributes, EdgeType>;

  public constructor(sigma: Sigma<Attributes, EdgeType>) {
    this.sigma = sigma;
    GraphHandler.instance = this;

    eventEmitter.on(
      EventType.NewMinedTransaction,
      (response) => this.colourMinedTransaction(response)
    )
  }

  public static getInstance(): GraphHandler {
    if (!GraphHandler.instance) {
      throw new Error('GraphHandler not instantiated');
    }

    return GraphHandler.instance;
  }

  public getNodeAttributes(node: string): Attributes | undefined {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
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

  public handleNewTransaction(tx: Transaction): void {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

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

  public async mempoolUpdate(tx: Transaction, remove: boolean = false) {
    await this.addNodesFromTransaction(tx);
    // todo: fix ghost nodes issue (nodes without transactions)
    this.updateNodesFromTransaction(tx, remove);
  }

  private updateNodesFromTransaction(tx: Transaction, remove: boolean = false) {
    const reverse_tx_multiplier = remove ? -1 : 1;

    this.updateNode(tx.to, -Number(tx.value) * reverse_tx_multiplier, remove);
    this.updateNode(tx.from, Number(tx.value) * reverse_tx_multiplier, remove);
  }

  private addNode(node: string, attributes: Attributes): void {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

    const colour = attributes.isContract ? CONTRACT_COLOUR : DEFAULT_COLOUR;
    const shape = attributes.isContract ? CONTRACT_SHAPE : DEFAULT_SHAPE;
    attributes.color = colour;
    attributes.type = shape;
    attributes.size = 4;

    if (!graph.hasNode(node)) {
      graph.addNode(node, { x: Math.random(), y: Math.random(), ...attributes });
    }
  }

  private removeNode(node: string): void {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasNode(node)) {
      graph.dropNode(node);
    }
  }

  private removeEdge(from: string, to: string, hash: string): void {
    const graph: Graph = this.sigma.getGraph();
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

  private setNodeColour(node: string, colour: string): void {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasNode(node)) {
      graph.setNodeAttribute(node, 'color', colour);
    }
  }

  // todo: fix types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private updateNodeAttribute(node: string, attribute: string, value: any): void {
    const graph: Graph = this.sigma.getGraph();
    if (!graph) {
      return;
    }

    if (graph.hasNode(node)) {
      graph.setNodeAttribute(node, attribute, value);
    }
  }

  private updateNodeColour(node: string, netBalance: number): void {
    const isContract = this.sigma.getGraph().getNodeAttribute(node, 'isContract');
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

      console.log("COLOUR_MINED_TRANSACTION", pendingTx, minedTx);

      if (pendingTx.length === 0 && minedTx.length > 0) {
        graph.setEdgeAttribute(tx.from, tx.to, 'color', MINED_EDGE_COLOUR);
      } 
      else if (pendingTx.length > 0 && minedTx.length > 0) {
        graph.setEdgeAttribute(tx.from, tx.to, 'color', SEMI_MINED_EDGE);
      }
    }
  }

  private async addNodesFromTransaction(tx: Transaction) {
    await this.addNewAddress(tx.from);
    await this.addNewAddress(tx.to, true);
  }

  private async addNewAddress(address: string, isTo=false): Promise<void> {
    if (this.sigma.getGraph().hasNode(address)) {
        return;
    }

    const nodeAttributes: AddressInfoResponse = await EthereumApiClient.getInstance().getInfo(address);

    let isContract = false;
    if (isTo) {
        const contract = await EthereumApiClient.getInstance().isCode(address);
        if (contract !== '0x') {
            isContract = true; 
        }
    }

    const attributes: Attributes = this.simplifyAttributes(address, nodeAttributes, isContract);

    this.addNode(address, attributes);
  }

  private simplifyAttributes(address: string, response: AddressInfoResponse, isContract: boolean): Attributes {
    const result: Attributes = { address: address, isContract, netBalance: 0, numTransactions: 0 };

    if (!response) {
        return result;
    }

    for (const entry of response) {
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

  private updateNode(node: string, value: number, remove: boolean): void {
    const attributes: Attributes | undefined = this.getNodeAttributes(node);
    
    if (!attributes) return;
    
    attributes.numTransactions += remove ? -1 : 1;
    
    if (attributes.numTransactions === 0) {
        this.removeNode(node);
        return;
    }
    
    const newBalance = attributes.netBalance + value;
    this.updateNodeAttribute(node, 'netBalance', newBalance);
    this.updateNodeColour(node, newBalance);
  }
}

export default GraphHandler