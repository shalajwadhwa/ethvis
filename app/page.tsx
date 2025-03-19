"use client";
import React from 'react'
import { VisualisationType } from '@/app/lib/types';
import dynamic from 'next/dynamic';

const VisualisationComponent = dynamic(() => import('@/app/components/Visualisation'), { ssr: false });

const VisualisePage = () => {
  const [visualisationType, setVisualisationType] = React.useState<VisualisationType>(VisualisationType.DEFAULT);

  return (
    <VisualisationComponent visualisationType={visualisationType} setVisualisationType={setVisualisationType} />
  )
}

export default VisualisePage