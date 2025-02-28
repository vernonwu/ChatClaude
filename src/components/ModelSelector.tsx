import { useStore } from '@/lib/store';

const models = [
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    description: 'Most capable model, ideal for complex tasks',
  },
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet',
    description: 'Excellent balance of intelligence and speed',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Legacy model with proven reliability',
  },
] as const;

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useStore();
  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <select
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
      className="text-sm rounded-lg border border-[var(--claude-dark-300)] bg-[var(--claude-dark-50)] text-[var(--foreground)] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--claude-purple)] focus:border-[var(--claude-purple)]"
    >
      {models.map((model) => (
        <option key={model.id} value={model.id} className="bg-[var(--claude-dark-50)]">
          {model.name}
        </option>
      ))}
    </select>
  );
} 