import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideIcon, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface DemoCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  problem: string;
  solution: string;
  pythonFile: string;
  onSelect: () => void;
  isSelected: boolean;
}

const DemoCard = ({
  title,
  description,
  icon: Icon,
  color,
  problem,
  solution,
  onSelect,
  isSelected,
}: DemoCardProps) => {
  const colorClasses = {
    primary: "text-primary border-primary/50 bg-primary/10",
    "tech-cyan": "text-tech-cyan border-tech-cyan/50 bg-tech-cyan/10",
    accent: "text-accent border-accent/50 bg-accent/10",
    "tech-orange": "text-tech-orange border-tech-orange/50 bg-tech-orange/10",
  };

  return (
    <Card
      className={`p-6 transition-all duration-300 hover:shadow-glow cursor-pointer ${
        isSelected ? "ring-2 ring-primary shadow-glow" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-lg border ${
            colorClasses[color as keyof typeof colorClasses]
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="group"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            setTimeout(() => {
              document.getElementById('demo-runner-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        >
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-destructive mb-1">Problem:</p>
            <p className="text-sm text-muted-foreground">{problem}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-success mb-1">Solution:</p>
            <p className="text-sm text-muted-foreground">{solution}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <Badge variant="secondary" className="text-xs">
          Python + Claude API
        </Badge>
      </div>
    </Card>
  );
};

export default DemoCard;
