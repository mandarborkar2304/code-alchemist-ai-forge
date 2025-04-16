
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Header = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isEditorPage = location.pathname === "/editor";

  return (
    <header className="border-b border-border/40 backdrop-blur-sm bg-background/90 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">CodeAlchemist</span>
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink className={navigationMenuTriggerStyle()} active={isHomePage}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/editor">
                <NavigationMenuLink className={navigationMenuTriggerStyle()} active={isEditorPage}>
                  Code Editor
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
          <Button size="sm">
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
