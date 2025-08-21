import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bus, Menu, User as UserIcon } from "lucide-react";

export function Navigation() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { user, isAuthenticated } = useAuth() as { user: User | null; isAuthenticated: boolean };
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="bg-haramain-green p-2 rounded-lg">
                <Bus className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-haramain-green">Haramain</h1>
                <p className="text-xs text-gray-500">Premium Bus Travel</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <a className="text-gray-700 hover:text-haramain-green font-medium transition-colors">
                {t('nav.home')}
              </a>
            </Link>
            <Link href="/routes">
              <a className="text-gray-700 hover:text-haramain-green font-medium transition-colors">
                {t('nav.routes')}
              </a>
            </Link>
            <Link href="/about">
              <a className="text-gray-700 hover:text-haramain-green font-medium transition-colors">
                {t('nav.about')}
              </a>
            </Link>
            <Link href="/support">
              <a className="text-gray-700 hover:text-haramain-green font-medium transition-colors">
                {t('nav.support')}
              </a>
            </Link>
          </div>

          {/* Language Toggle and Auth */}
          <div className="flex items-center space-x-4">
            <LanguageToggle />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {user?.fullName || user?.firstName || user?.email || 'User'}
                  </Button>
                </Link>
                <Button asChild variant="ghost" size="sm">
                  <a href="/api/logout">{t('nav.signout')}</a>
                </Button>
              </div>
            ) : (
              <Button asChild className="bg-haramain-green text-white hover:bg-green-700">
                <a href="/api/login">
                  <UserIcon className="h-4 w-4 mr-2" />
                  {t('nav.signin')}
                </a>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "left" : "right"}>
                <div className="flex flex-col space-y-4 pt-6">
                  <Link href="/">
                    <a className="text-gray-700 hover:text-haramain-green font-medium">
                      {t('nav.home')}
                    </a>
                  </Link>
                  <Link href="/routes">
                    <a className="text-gray-700 hover:text-haramain-green font-medium">
                      {t('nav.routes')}
                    </a>
                  </Link>
                  <Link href="/about">
                    <a className="text-gray-700 hover:text-haramain-green font-medium">
                      {t('nav.about')}
                    </a>
                  </Link>
                  <Link href="/support">
                    <a className="text-gray-700 hover:text-haramain-green font-medium">
                      {t('nav.support')}
                    </a>
                  </Link>
                  
                  {isAuthenticated ? (
                    <>
                      <Link href="/dashboard">
                        <a className="text-gray-700 hover:text-haramain-green font-medium">
                          Dashboard
                        </a>
                      </Link>
                      <a href="/api/logout" className="text-gray-700 hover:text-haramain-green font-medium">
                        {t('nav.signout')}
                      </a>
                    </>
                  ) : (
                    <a href="/api/login" className="text-gray-700 hover:text-haramain-green font-medium">
                      {t('nav.signin')}
                    </a>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
