import Graph from 'graphology';
import { Transaction } from '@/app/types/transaction';
import Sigma from 'sigma';

type NodeType = { x: number; y: number; label: string; size: number };
type EdgeType = { label: string };

class GraphHandler {
  public static addTransaction(sigma: Sigma<NodeType, EdgeType>, tx: Transaction): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }
    console.log("Size: ", graph.order);

    const x = graph.order;

    if (!graph.hasNode(tx.from)) {
      graph.addNode(tx.from, { label: x, x: Math.random(), y: Math.random(), size: 4 });
    }
    if (!graph.hasNode(tx.to)) {
      graph.addNode(tx.to, { label: x+1, x: Math.random(), y: Math.random(), size: 4 });
    }
    if (!graph.hasEdge(tx.from, tx.to)) {
      graph.addEdge(tx.from, tx.to);
    }
  }

  public static updateNodeColour(sigma: Sigma<NodeType, EdgeType>, tx: Transaction, netBalance: number, is_sender: boolean): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    const node = is_sender ? tx.from : tx.to;

    if (!graph.hasNode(node)) {
      return;
    }

    if (netBalance > 0) {
      graph.setNodeAttribute(node, 'color', 'green');
    } 
    else if (netBalance < 0) {
      graph.setNodeAttribute(node, 'color', 'red');
    }
    else {
      return;
    }
  }
}

export default GraphHandler