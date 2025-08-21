import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, Clock, Users, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Trip, Route, Bus as BusType } from "@shared/schema";

interface TripWithDetails extends Trip {
  route: Route;
  bus: BusType;
  availableSeats: number;
}

interface SearchResultsProps {
  trips: TripWithDetails[];
  searchParams: {
    from: string;
    to: string;
    date: string;
  };
  onSelectTrip: (trip: TripWithDetails) => void;
}

export function SearchResults({ trips, searchParams, onSelectTrip }: SearchResultsProps) {
  const { t } = useTranslation();

  if (trips.length === 0) {
    return (
      <section className="py-16 bg-haramain-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No buses found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or select a different date.</p>
          </div>
        </div>
      </section>
    );
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCityName = (cityKey: string) => {
    return t(`city.${cityKey}`);
  };

  return (
    <section className="py-16 bg-haramain-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('search.availableBuses')}</h2>
          <p className="text-gray-600">
            {getCityName(searchParams.from)} → {getCityName(searchParams.to)} • {formatDate(searchParams.date)} • {trips.length} buses found
          </p>
        </div>

        <div className="space-y-4">
          {trips.map((trip) => (
            <Card key={trip.id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-haramain-green p-3 rounded-lg">
                        <Bus className="text-white h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{trip.bus.model || 'Premium Express'}</h3>
                        <p className="text-gray-600">
                          Bus #{trip.bus.busNumber} • {trip.bus.capacity} seats • 
                          {trip.bus.amenities && typeof trip.bus.amenities === 'object' && (
                            <>
                              {(trip.bus.amenities as any).ac && ' AC,'}
                              {(trip.bus.amenities as any).wifi && ' WiFi,'}
                              {(trip.bus.amenities as any).restroom && ' Restroom,'}
                              {(trip.bus.amenities as any).power_outlet && ' Power Outlets'}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">{t('search.departure')}</p>
                        <p className="font-semibold text-gray-900">{formatTime(trip.departureTime)}</p>
                        <p className="text-gray-600 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {getCityName(trip.route.originCity)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('search.arrival')}</p>
                        <p className="font-semibold text-gray-900">{formatTime(trip.arrivalTime)}</p>
                        <p className="text-gray-600 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {getCityName(trip.route.destinationCity)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('search.duration')}</p>
                        <p className="font-semibold text-gray-900 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {trip.route.estimatedDurationMinutes ? 
                            `${Math.floor(trip.route.estimatedDurationMinutes / 60)}h ${trip.route.estimatedDurationMinutes % 60}m` : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('search.availableSeats')}</p>
                        <p className={`font-semibold flex items-center ${
                          trip.availableSeats > 10 ? 'text-green-600' : 
                          trip.availableSeats > 5 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          <Users className="h-3 w-3 mr-1" />
                          {trip.availableSeats} seats
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 lg:mt-0 lg:ml-6 text-center lg:text-right">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-haramain-green">{trip.price}</span>
                      <span className="text-lg text-gray-600 ml-1">{t('currency.sar')}</span>
                    </div>
                    <Button 
                      onClick={() => onSelectTrip(trip)}
                      className="w-full lg:w-auto bg-haramain-green text-white hover:bg-green-700"
                      disabled={trip.availableSeats === 0}
                    >
                      {trip.availableSeats === 0 ? 'Sold Out' : t('search.selectSeats')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
