import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LiveChat } from "@/components/LiveChat";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "./lib/queryClient";
import "./lib/i18n";

// Pages
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import Payment from "@/pages/payment";
import BookingConfirmation from "@/pages/booking-confirmation";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/payment" component={Payment} />
            <Route path="/booking-confirmation" component={BookingConfirmation} />
            <Route path="/routes" component={() => <div className="p-8 text-center">Routes page coming soon</div>} />
            <Route path="/about" component={() => <div className="p-8 text-center">About page coming soon</div>} />
            <Route path="/support" component={() => <div className="p-8 text-center">Support page coming soon</div>} />
            <Route component={NotFound} />
          </Switch>
        </main>

        <Footer />
        <LiveChat />
      </div>
    </LanguageProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
