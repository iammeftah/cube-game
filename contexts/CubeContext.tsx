import { CUBE_TYPES, CubeDefinition, DEFAULT_CUBE_TYPE } from '@/utils/cubeDefinition';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface CubeContextType {
  selectedCube: CubeDefinition;
  setSelectedCube: (cube: CubeDefinition) => void;
  availableCubes: CubeDefinition[];
}

const CubeContext = createContext<CubeContextType | undefined>(undefined);

interface CubeProviderProps {
  children: ReactNode;
}

export const CubeProvider: React.FC<CubeProviderProps> = ({ children }) => {
  const [selectedCube, setSelectedCube] = useState<CubeDefinition>(DEFAULT_CUBE_TYPE);
  
  const availableCubes = Object.values(CUBE_TYPES);

  return (
    <CubeContext.Provider value={{ selectedCube, setSelectedCube, availableCubes }}>
      {children}
    </CubeContext.Provider>
  );
};

export const useCubeContext = (): CubeContextType => {
  const context = useContext(CubeContext);
  if (!context) {
    throw new Error('useCubeContext must be used within CubeProvider');
  }
  return context;
};
