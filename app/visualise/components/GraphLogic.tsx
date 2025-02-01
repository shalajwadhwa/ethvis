import Graph from 'graphology';
import { Transaction } from '@/app/VisualisationTypes';

export function addTransactionsToGraph(graph: Graph, transactions: Transaction[]): Graph {
  let x = graph.order;
  for (const t of transactions) {
    if (!graph.hasNode(t.from)) {
      graph.addNode(t.from, { label: x, x: Math.random(), y: Math.random() });
    }
    if (!graph.hasNode(t.to)) {
      graph.addNode(t.to, { label: x+1, x: Math.random(), y: Math.random() });
    }
    if (!graph.hasEdge(t.from, t.to)) {
      graph.addEdge(t.from, t.to);
    }
    x += 2
  }

  return graph;
}
