import Graph from 'graphology';
import { Transaction } from '@/app/types/transaction';
import Sigma from 'sigma';
import { NodeType, EdgeType } from '@/app/types/graph';

const DEFAULT_COLOUR = 'grey';
const CONTRACT_COLOUR = 'blue';


class GraphHandler {
  public static addNode(sigma: Sigma<NodeType, EdgeType>, node: string, attributes: any): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    const colour = attributes.isContract ? CONTRACT_COLOUR : DEFAULT_COLOUR;
    if (!graph.hasNode(node)) {
      graph.addNode(node, { label: node, x: Math.random(), y: Math.random(), size: 4, color: colour, data: { ...attributes } });
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
      this.setNodeColour(sigma, node, 'green');
    }
    else if (netBalance < 0) {
      this.setNodeColour(sigma, node, 'red');
    }
    else {
      return;
    }
  }
}

export default GraphHandler