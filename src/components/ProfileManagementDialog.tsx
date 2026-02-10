import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Code, Award } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEVELOPER_PROFILES = [
  {
    id: "kevin-backend",
    name: "Kevin Johnson",
    experience: "intermediate",
    team: "Backend",
    techStack: ["Python", "Kubernetes", "PostgreSQL"],
    role: "Software Engineer",
    color: "bg-blue-500"
  },
  {
    id: "sarah-senior",
    name: "Sarah Chen",
    experience: "advanced",
    team: "Platform",
    techStack: ["Terraform", "AWS", "Docker", "Kubernetes"],
    role: "Sr. Software Engineer",
    color: "bg-purple-500"
  },
  {
    id: "mike-frontend",
    name: "Mike Rodriguez",
    experience: "intermediate",
    team: "Frontend",
    techStack: ["React", "TypeScript", "GraphQL", "Next.js"],
    role: "Front-end Engineer",
    color: "bg-green-500"
  },
  {
    id: "priya-platform",
    name: "Priya Sharma",
    experience: "expert",
    team: "Platform",
    techStack: ["Kubernetes", "Prometheus", "Grafana", "Istio"],
    role: "Platform Engineer",
    color: "bg-orange-500"
  },
  {
    id: "emma-mobile",
    name: "Emma Davis",
    experience: "advanced",
    team: "Mobile",
    techStack: ["Kotlin", "Swift", "React Native", "Firebase"],
    role: "Mobile Engineer",
    color: "bg-pink-500"
  },
  {
    id: "james-ios",
    name: "James Park",
    experience: "intermediate",
    team: "Mobile (iOS)",
    techStack: ["Swift", "SwiftUI", "Core Data", "Combine"],
    role: "iOS Engineer",
    color: "bg-indigo-500"
  },
  {
    id: "lisa-android",
    name: "Lisa Wang",
    experience: "advanced",
    team: "Mobile (Android)",
    techStack: ["Kotlin", "Jetpack Compose", "Room", "Coroutines"],
    role: "Android Engineer",
    color: "bg-teal-500"
  },
  {
    id: "tom-junior",
    name: "Tom Wilson",
    experience: "beginner",
    team: "Backend",
    techStack: ["Node.js", "MongoDB", "Express"],
    role: "Junior Software Engineer",
    color: "bg-yellow-500"
  },
  {
    id: "alex-fullstack",
    name: "Alex Kumar",
    experience: "advanced",
    team: "Full Stack",
    techStack: ["Go", "React", "PostgreSQL", "Redis", "Docker"],
    role: "Full Stack Engineer",
    color: "bg-cyan-500"
  },
];

const getExperienceBadgeColor = (experience: string) => {
  switch (experience) {
    case "beginner":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "intermediate":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "advanced":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "expert":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const ProfileManagementDialog = ({ open, onOpenChange }: ProfileManagementDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Developer Profiles</DialogTitle>
          <DialogDescription>
            View and manage all developer profiles in the platform
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid gap-4">
            {DEVELOPER_PROFILES.map((profile) => (
              <Card key={profile.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${profile.color} flex items-center justify-center text-white font-semibold`}>
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{profile.name}</h3>
                        <p className="text-sm text-muted-foreground">{profile.role}</p>
                      </div>
                      <Badge className={getExperienceBadgeColor(profile.experience)}>
                        {profile.experience.charAt(0).toUpperCase() + profile.experience.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Team:</span>
                        <span className="font-medium">{profile.team}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-mono text-xs">{profile.id}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Tech Stack:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.techStack.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileManagementDialog;
