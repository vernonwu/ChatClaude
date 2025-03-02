import { useStore } from '@/lib/store';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

const models = [
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    shortName: 'Opus',
    description: 'Legacy model with proven reliability',
  },
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet',
    shortName: '3.5 Sonnet',
    description: 'Excellent balance of intelligence and speed',
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    shortName: '3.7 Sonnet',
    description: 'Most capable model, ideal for complex tasks',
  }
] as const;

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const currentModel = models.find(model => model.id === selectedModel);
  const displayName = isMobile ? currentModel?.shortName : currentModel?.name;

  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
        className="appearance-none pl-2 md:pl-3 pr-7 md:pr-9 py-1.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--claude-dark-100)] text-gray-200 hover:border-[var(--claude-purple-light)] focus:border-[var(--claude-purple-light)] focus:outline-none transition-all duration-200 cursor-pointer"
        aria-label="Select AI model"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id} className="bg-[var(--claude-dark-200)]">
            {isMobile ? model.shortName : model.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 md:px-2 text-gray-400">
        <ChevronDownIcon className="h-4 w-4" />
      </div>
    </div>
  );
}