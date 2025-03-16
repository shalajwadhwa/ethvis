"use client";
import React from 'react'
import Visualisation from '@/app/components/Visualisation'

const VisualisePage = () => {
  const [visualisationType, setVisualisationType] = React.useState<string>('default')

  return (
    <Visualisation visualisationType={visualisationType} setVisualisationType={setVisualisationType} />
  )
}

export default VisualisePage