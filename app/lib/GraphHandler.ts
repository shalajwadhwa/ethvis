import Graph from 'graphology';
import { Transaction } from '@/app/types/transaction';
import Sigma from 'sigma';

export function updateNodeColour(graph: Graph, tx: Transaction, netBalanceTo: number, netBalanceFrom: number): Graph {
  if (netBalanceTo > 0) {
    graph.setNodeAttribute(tx.to, 'color', 'green');
  } else {
    graph.setNodeAttribute(tx.to, 'color', 'red');
  }

  if (netBalanceFrom > 0) {
    graph.setNodeAttribute(tx.from, 'color', 'green');
  } else {
    graph.setNodeAttribute(tx.from, 'color', 'red');
  }

  return graph;
}

type NodeType = { x: number; y: number; label: string; size: number };
type EdgeType = { label: string };

class GraphHandler {
  public static addTransaction(sigma: Sigma<NodeType, EdgeType>, tx: Transaction): void {
    const graph: Graph = sigma.getGraph();
    if (!graph) {
      return;
    }

    const x = graph.order;

    if (!graph.hasNode(tx.from)) {
      graph.addNode(tx.from, { label: x, x: Math.random(), y: Math.random() });
    }
    if (!graph.hasNode(tx.to)) {
      graph.addNode(tx.to, { label: x+1, x: Math.random(), y: Math.random() });
    }
    if (!graph.hasEdge(tx.from, tx.to)) {
      graph.addEdge(tx.from, tx.to);
    }
  }
}

export default GraphHandler