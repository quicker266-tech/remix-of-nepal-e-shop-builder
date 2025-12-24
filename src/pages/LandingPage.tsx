import { Store, ShoppingBag, BarChart3, Package, Users, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">PasalHub</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Built for Nepali Entrepreneurs
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Launch Your Online
              <span className="block text-gradient-primary">Store in Nepal</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              PasalHub is the complete e-commerce platform designed for Nepal. 
              Create your store, manage products, and grow your business with ease.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                  View Demo Store
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Hero Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '1,000+', label: 'Active Stores' },
              { value: 'रु 50M+', label: 'Transactions' },
              { value: '77', label: 'Districts Covered' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 shadow-lg text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Sell Online
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for the Nepali market
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: 'Product Management',
                description: 'Easily add, edit, and organize your products with variants, categories, and inventory tracking.',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Track sales, revenue, and customer behavior with real-time analytics and reports.',
              },
              {
                icon: Users,
                title: 'Customer Management',
                description: 'Build customer relationships with profiles, order history, and personalized communication.',
              },
              {
                icon: Globe,
                title: 'Multi-City Delivery',
                description: 'Integrated delivery options across all 77 districts of Nepal with local courier partners.',
              },
              {
                icon: Shield,
                title: 'Secure & Reliable',
                description: 'Enterprise-grade security with SSL encryption and 99.9% uptime guarantee.',
              },
              {
                icon: Store,
                title: 'Beautiful Storefronts',
                description: 'Customizable themes and designs to make your store stand out from the competition.',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-dark rounded-3xl p-12 text-center shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Start Your Online Business?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of Nepali entrepreneurs who are growing their business with PasalHub.
            </p>
            <Link to="/auth?mode=signup">
              <Button variant="accent" size="xl">
                Create Your Store Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">PasalHub Nepal</span>
            </div>
            
            <p className="text-muted-foreground text-sm">
              © 2024 PasalHub. Made with ❤️ in Nepal
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
