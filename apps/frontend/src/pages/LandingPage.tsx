import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Lightbulb,
  Search,
  Shield,
  Clock,
  Users,
  ArrowRight,
  GraduationCap,
  Building2,
  Bus,
  Home,
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Submit Complaints',
      description: 'Report issues related to academics, hostel, transport, or administration with ease.',
    },
    {
      icon: Lightbulb,
      title: 'Share Suggestions',
      description: 'Contribute ideas to improve campus life and educational experience.',
    },
    {
      icon: Search,
      title: 'Track Progress',
      description: 'Monitor the status of your complaints with real-time updates.',
    },
    {
      icon: Shield,
      title: 'Anonymous Option',
      description: 'Submit feedback anonymously if you prefer privacy.',
    },
    {
      icon: Clock,
      title: 'SLA Guarantee',
      description: 'Assured response times based on priority and category.',
    },
    {
      icon: Users,
      title: 'Direct Routing',
      description: 'Your concerns reach the right authority automatically.',
    },
  ];

  const colleges = [
    { name: 'BBD University', code: 'BBDU', icon: GraduationCap },
    { name: 'BBD NITM', code: 'BBD-NITM', icon: Building2 },
    { name: 'BBD NIIT', code: 'BBD-NIIT', icon: Building2 },
    { name: 'BBD Dental College', code: 'BBD-DENTAL', icon: Building2 },
  ];

  const categories = [
    { name: 'Academic', description: 'Classes, faculty, exams, labs', icon: GraduationCap, color: 'bg-emerald-500' },
    { name: 'Transport', description: 'Bus routes, timing, conditions', icon: Bus, color: 'bg-cyan-500' },
    { name: 'Hostel', description: 'Rooms, food, facilities', icon: Home, color: 'bg-violet-500' },
    { name: 'Administrative', description: 'Fees, documents, office', icon: Building2, color: 'bg-amber-500' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 mb-6 text-sm">
              <span className="text-primary font-medium">BBD Educational Group</span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-muted-foreground">Student Portal</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl animate-in slide-in">
              Your Voice{' '}
              <span className="text-primary">Matters</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Submit complaints, share suggestions, and track resolutions across 
              BBD University, BBD NITM, BBD NIIT, and BBD Dental College. 
              We're committed to making your campus experience better.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/submit">
                  Submit Complaint
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/track">Track Your Ticket</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Categories We Handle</h2>
            <p className="mt-2 text-muted-foreground">
              Select the appropriate category when submitting your complaint
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.name} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className={`absolute top-0 left-0 w-1 h-full ${category.color}`} />
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg ${category.color}/10 flex items-center justify-center mb-4`}>
                    <category.icon className={`h-6 w-6 ${category.color.replace('bg-', 'text-')}`} />
                  </div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              Our system ensures your feedback reaches the right people and gets resolved efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none shadow-none bg-transparent">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Colleges Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Our Institutions</h2>
            <p className="mt-2 text-muted-foreground">
              Serving all colleges under BBD Educational Group
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {colleges.map((college) => (
              <Card key={college.code} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <college.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">{college.name}</h3>
                  <p className="text-sm text-muted-foreground">{college.code}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Share Your Feedback?</h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                Whether it's a complaint that needs immediate attention or a suggestion to improve 
                campus life, we're here to listen and act.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/submit">Submit Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
                  <Link to="/suggestions">View Suggestions Board</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

