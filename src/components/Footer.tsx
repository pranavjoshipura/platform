import { Heart, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Inspired by the amazing course and materials from</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.linkedin.com/in/ajaychankramath/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline font-semibold"
            >
              Ajay Chankramath
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <span>Built with</span>
            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
            <span>using React + Claude AI</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} Internal Developer Platform. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
