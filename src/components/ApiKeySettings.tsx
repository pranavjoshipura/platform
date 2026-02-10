import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Key, Eye, EyeOff, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeySettings = ({ open, onOpenChange }: ApiKeySettingsProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Load API key from localStorage on mount
    const savedKey = localStorage.getItem('anthropic_api_key') || '';
    setApiKey(savedKey);
  }, [open]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem('anthropic_api_key');
      toast.success('API key cleared');
    } else if (!apiKey.startsWith('sk-ant-')) {
      toast.error('Invalid API key format. Should start with "sk-ant-"');
      return;
    } else {
      localStorage.setItem('anthropic_api_key', apiKey.trim());
      toast.success('API key saved successfully');
    }
    onOpenChange(false);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('anthropic_api_key');
    toast.success('API key cleared');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Settings
          </DialogTitle>
          <DialogDescription>
            Enter your Anthropic API key to enable AI features in this demo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Anthropic API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">How to get your API key:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Visit the Anthropic Console</li>
                  <li>Go to "API Keys" section</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it here</li>
                </ol>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-2"
                >
                  Open Anthropic Console
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleSave}>
              Save API Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySettings;
