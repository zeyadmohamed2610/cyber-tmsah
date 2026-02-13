import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Construction } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const navLinks = [
  { label: "الجدول الدراسي", path: "/schedule" },
  { label: "المواد الدراسية", path: "/materials" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  const handleComingSoon = (label: string) => {
    toast({
      title: `🚧 ${label}`,
      description: "هذا القسم قيد التطوير حالياً، ترقبوا التحديثات القادمة!",
    });
  };

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-[60] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
      >
        تخطي إلى المحتوى
      </a>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl" role="navigation" aria-label="التنقل الرئيسي">
        <div className="section-container flex items-center justify-between py-4">
          {/* Logo - Ultra Premium Cyber Style */}
        <Link to="/" className="group relative flex items-center" dir="ltr">
          {/* CYBER Part */}
          <span className="relative text-2xl md:text-3xl font-black tracking-widest">
            <span 
              className="bg-gradient-to-r from-cyan-400 via-primary to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
              style={{
                textShadow: '0 0 20px hsl(174 72% 50% / 0.6), 0 0 40px hsl(174 72% 50% / 0.4), 0 0 60px hsl(174 72% 50% / 0.2)'
              }}
            >
              CYBER
            </span>
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-primary to-cyan-400 shadow-[0_0_10px_hsl(var(--primary))]"></span>
          </span>
          
          {/* Animated Separator */}
          <span className="text-primary text-3xl md:text-4xl font-thin mx-2 animate-pulse">⟡</span>
          
          {/* TMSAH Part */}
          <span className="relative text-2xl md:text-3xl font-black tracking-widest">
            <span className="text-foreground group-hover:text-primary transition-all duration-500 ease-out group-hover:drop-shadow-[0_0_15px_hsl(var(--primary)/0.8)]">
              TMSAH
            </span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary via-cyan-400 to-primary group-hover:w-full transition-all duration-700 ease-out shadow-[0_0_10px_hsl(var(--primary))]"></span>
          </span>
          
          {/* Background Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-cyan-400/5 to-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10 blur-xl"></div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = link.path && location.pathname === link.path;

            if (!link.path) {
              return (
                <button
                  key={link.label}
                  onClick={() => handleComingSoon(link.label)}
                  className="group relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-1.5">
                    {link.label}
                    <Construction className="h-3.5 w-3.5 opacity-50" />
                  </span>
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full group-hover:w-2/3 transition-all duration-300" />
                </button>
              );
            }

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`group relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden ${
                  isActive
                    ? "text-primary-foreground bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                {!isActive && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-100" />
                )}
                <span className="relative z-10">{link.label}</span>
                {!isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full group-hover:w-2/3 transition-all duration-300" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-up">
          <div className="section-container flex flex-col gap-4 py-6">
            {navLinks.map((link) =>
              link.path ? (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className={`text-base font-medium transition-colors ${
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.label}
                  onClick={() => { handleComingSoon(link.label); setOpen(false); }}
                  className="text-base font-medium text-muted-foreground transition-colors text-right flex items-center gap-2"
                >
                  {link.label}
                  <Construction className="h-3.5 w-3.5 opacity-50" />
                </button>
              )
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar;
