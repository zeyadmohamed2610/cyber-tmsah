import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingBlogButton from "./FloatingBlogButton";

/**
 * Layout Component
 * Wraps all pages with consistent layout including navbar, footer, and floating button
 * Includes skip-to-content accessibility feature
 */
const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col font-cairo">
    <Navbar />
    <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
      {children}
    </main>
    <Footer />
    <FloatingBlogButton />
  </div>
);

export default Layout;
