"use client";
import React from 'react'
import Visualisation from '@/app/components/Visualisation'
import { VisualisationType } from '@/app/lib/types';

const VisualisePage = () => {
  const [visualisationType, setVisualisationType] = React.useState<VisualisationType>(VisualisationType.DEFAULT);

  return (
    <Visualisation visualisationType={visualisationType} setVisualisationType={setVisualisationType} />
  )
}

export default VisualisePage