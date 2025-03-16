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

const VisualisationSelector = ({ 
  visualisationType, 
  setVisualisationType 
} : { 
  visualisationType?: string;
  setVisualisationType: React.Dispatch<React.SetStateAction<string>> 
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 graph-overlay">
            <Select onValueChange={(value) => setVisualisationType(value)} value={visualisationType}>
              <SelectTrigger className="w">
                <SelectValue placeholder="Settings" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Settings</SelectLabel>
                  <SelectItem value="default">Real-time (default)</SelectItem>
                  <SelectItem value="static">Timestamp Range</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
  )
}

export default VisualisationSelector