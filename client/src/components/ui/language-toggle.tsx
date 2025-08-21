import { Button } from "@/components/ui/button";
import { Globe, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 border-none"
    >
      <Globe className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        {language.toUpperCase()}
      </span>
      <ChevronDown className="h-3 w-3 text-gray-500" />
    </Button>
  );
}
