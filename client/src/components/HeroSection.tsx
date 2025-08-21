import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchFormData {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  passengers: number;
  tripType: 'oneWay' | 'roundTrip';
}

interface HeroSectionProps {
  onSearch: (searchData: SearchFormData) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const { t } = useTranslation();
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    from: '',
    to: '',
    date: '',
    returnDate: '',
    passengers: 1,
    tripType: 'oneWay'
  });

  const cities = [
    { value: 'riyadh', label: t('city.riyadh') },
    { value: 'jeddah', label: t('city.jeddah') },
    { value: 'makkah', label: t('city.makkah') },
    { value: 'madinah', label: t('city.madinah') },
    { value: 'dammam', label: t('city.dammam') },
  ];

  const handleSearch = () => {
    if (searchForm.from && searchForm.to && searchForm.date) {
      if (searchForm.tripType === 'roundTrip' && !searchForm.returnDate) {
        return;
      }
      onSearch(searchForm);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <section className="relative overflow-hidden">
      {/* Background with Saudi cultural imagery */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 81, 50, 0.7), rgba(15, 81, 50, 0.7)), url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')`
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center text-white mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('hero.title')} <span className="text-haramain-gold">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
            {/* Trip Type Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSearchForm({...searchForm, tripType: 'oneWay', returnDate: ''})}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchForm.tripType === 'oneWay'
                      ? 'bg-haramain-green text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('hero.oneWay')}
                </button>
                <button
                  onClick={() => setSearchForm({...searchForm, tripType: 'roundTrip'})}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchForm.tripType === 'roundTrip'
                      ? 'bg-haramain-green text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('hero.roundTrip')}
                </button>
              </div>
            </div>
            
            <div className={`grid gap-4 md:gap-6 ${
              searchForm.tripType === 'roundTrip' 
                ? 'grid-cols-1 md:grid-cols-5' 
                : 'grid-cols-1 md:grid-cols-4'
            }`}>
              {/* From City */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('hero.from')}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10" />
                  <Select value={searchForm.from} onValueChange={(value) => setSearchForm({...searchForm, from: value})}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder={t('city.riyadh')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* To City */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('hero.to')}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10" />
                  <Select value={searchForm.to} onValueChange={(value) => setSearchForm({...searchForm, to: value})}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder={t('city.makkah')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Travel Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('hero.travelDate')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    type="date"
                    min={minDate}
                    value={searchForm.date}
                    onChange={(e) => setSearchForm({...searchForm, date: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Return Date - only show for round trip */}
              {searchForm.tripType === 'roundTrip' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">{t('hero.returnDate')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10" />
                    <Input
                      type="date"
                      min={searchForm.date || minDate}
                      value={searchForm.returnDate}
                      onChange={(e) => setSearchForm({...searchForm, returnDate: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Passengers */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('hero.passengers')}</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10" />
                  <Select 
                    value={searchForm.passengers.toString()} 
                    onValueChange={(value) => setSearchForm({...searchForm, passengers: parseInt(value)})}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? t('hero.passenger') : t('hero.passengers')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="absolute right-3 top-3.5 text-xs text-gray-500">
                    {t('hero.fullTicketNote')}
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-transparent">Search</Label>
                <Button 
                  onClick={handleSearch}
                  className="w-full bg-haramain-green text-white hover:bg-green-700 h-12 text-lg font-semibold shadow-lg"
                  disabled={!searchForm.from || !searchForm.to || !searchForm.date || (searchForm.tripType === 'roundTrip' && !searchForm.returnDate)}
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t('hero.showBusTrips')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
