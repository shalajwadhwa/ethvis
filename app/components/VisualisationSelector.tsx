import React from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VisualisationType } from '@/app/lib/types';

const VisualisationSelector = ({ 
  visualisationType, 
  setVisualisationType,
  setIsRunning
} : { 
  visualisationType?: string;
  setVisualisationType: React.Dispatch<React.SetStateAction<string>>,
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>> 
}) => {
  const switchType = (type: string) => {
    setVisualisationType(type);
    setIsRunning(false);
  }

  return (
    <div className="absolute top-4 right-4 z-10 graph-overlay">
            <Select onValueChange={(value) => switchType(value)} value={visualisationType}>
              <SelectTrigger className="w">
                <SelectValue placeholder="Settings" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Settings</SelectLabel>
                  <SelectItem value={ VisualisationType.DEFAULT }>{ VisualisationType.DEFAULT }</SelectItem>
                  <SelectItem value={ VisualisationType.RANGE }>{ VisualisationType.RANGE }</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
  )
}

export default VisualisationSelector