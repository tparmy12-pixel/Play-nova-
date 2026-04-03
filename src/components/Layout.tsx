import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";

interface LayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  hideBottomNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, onSearch, showSearch = false, hideBottomNav = false }) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="shrink-0">
            <span className="font-display text-lg font-black gradient-neon-text">bs Store</span>
          </Link>

          {showSearch && (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 h-9 bg-muted/50 border-border/50"
                  onChange={(e) => onSearch?.(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-neon-pink hover:text-neon-pink">
                    <Shield className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" className="gradient-neon text-primary-foreground neon-glow" onClick={() => navigate("/login")}>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNav />}

      {/* Footer - only on pages without bottom nav */}
      {hideBottomNav && (
        <footer className="border-t border-border/50 py-6">
          <div className="container mx-auto px-4 text-center space-y-3">
            <p className="font-display text-sm gradient-neon-text font-bold">bs Store</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <Link to="/contact" className="text-muted-foreground hover:text-primary">Contact Us</Link>
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary">Terms</Link>
              <Link to="/feedback" className="text-muted-foreground hover:text-primary">Feedback</Link>
            </div>
            <p className="text-muted-foreground text-xs">© 2026 bs Store</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
