import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Bus, Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { SocialLink } from "@shared/schema";

export function Footer() {
  const { t } = useTranslation();

  const { data: socialLinks } = useQuery<SocialLink[]>({
    queryKey: ['/api/social-links'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-haramain-green p-2 rounded-lg">
                <Bus className="text-white h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Haramain</h3>
                <p className="text-sm text-gray-400">Premium Bus Travel</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {t('footer.tagline')}
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks?.filter(link => link.isVisible).map((link) => (
                <a
                  key={link.id}
                  href={link.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {getSocialIcon(link.platformName)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors">{t('footer.bookTrip')}</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard">
                  <a className="hover:text-white transition-colors">{t('footer.manageBooking')}</a>
                </Link>
              </li>
              <li>
                <Link href="/schedules">
                  <a className="hover:text-white transition-colors">{t('footer.busSchedules')}</a>
                </Link>
              </li>
              <li>
                <Link href="/routes">
                  <a className="hover:text-white transition-colors">{t('footer.routeMap')}</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/help">
                  <a className="hover:text-white transition-colors">{t('footer.helpCenter')}</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:text-white transition-colors">{t('footer.contactUs')}</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:text-white transition-colors">{t('footer.terms')}</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:text-white transition-colors">{t('footer.privacy')}</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.contactInfo')}</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-haramain-green" />
                <span>+966 11 234 5678</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-haramain-green" />
                <span>support@haramain.sa</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-haramain-green" />
                <span>Riyadh, Saudi Arabia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
