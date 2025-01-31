import Graph from 'graphology';
import { Transaction } from '@/app/VisualisationTypes';
import forceAtlas2 from 'graphology-layout-forceatlas2';

export function addTransactionsToGraph(graph: Graph, transactions: Transaction[]): Graph {
  let x = graph.order;
  for (const t of transactions) {
    if (!graph.hasNode(t.from)) {
      graph.addNode(t.from, { label: x, x: Math.random() * 100, y: Math.random() * 100 });
    }
    if (!graph.hasNode(t.to)) {
      graph.addNode(t.to, { label: x+1, x: Math.random() * 100, y: Math.random() * 100 });
    }
    if (!graph.hasEdge(t.from, t.to)) {
      graph.addEdge(t.from, t.to);
    }
    x += 2
  }

  return graph;
}

export function runFA2(graph: Graph) {
  const settings = {
    linLogMode: false,
    outboundAttractionDistribution: false,
    adjustSizes: false,
    edgeWeightInfluence: 1,
    scalingRatio: 0.01,
    strongGravityMode: true,
    gravity: 1,
    barnesHutOptimize: true,
    barnesHutTheta: 0.9,
    slowDown: 20,
    startingIterations: 1,
    iterationsPerRender: 1,
    worker: true,
    iterations: 50
  };

  forceAtlas2.assign(graph, settings);

  return graph;
}