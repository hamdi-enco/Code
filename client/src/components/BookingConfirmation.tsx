import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Download, Share2, QrCode, User, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Booking, Trip, Route, Bus, BookedSeat } from "@shared/schema";

interface BookingWithDetails extends Booking {
  trip: Trip & {
    route: Route;
    bus: Bus;
  };
  bookedSeats: BookedSeat[];
}

interface BookingConfirmationProps {
  bookingId: string;
  onNewBooking: () => void;
}

export function BookingConfirmation({ bookingId, onNewBooking }: BookingConfirmationProps) {
  const { t } = useTranslation();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await apiRequest('GET', `/api/bookings/${bookingId}`);
        const bookingData = await response.json();
        setBooking(bookingData);
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCityName = (cityKey: string) => {
    return t(`city.${cityKey}`);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-haramain-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-haramain-green mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="py-16 bg-haramain-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Booking not found'}</p>
            <Button onClick={onNewBooking} className="bg-haramain-green text-white hover:bg-green-700">
              Return to Search
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-haramain-gray">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 border-b border-green-100 p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-white h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">{t('booking.confirmed')}</h2>
            <p className="text-green-600">{t('booking.successMessage')}</p>
          </div>

          <div className="p-6">
            {/* Booking Reference */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-haramain-gray px-4 py-2 rounded-lg">
                <span className="text-gray-600">{t('booking.reference')}</span>
                <span className="font-bold text-haramain-green">{booking.bookingReference}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Trip Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('booking.tripDetails')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.route')}</span>
                      <span className="font-medium">
                        {getCityName(booking.trip.route.originCity)} → {getCityName(booking.trip.route.destinationCity)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.date')}</span>
                      <span className="font-medium">{formatDate(booking.trip.departureTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('search.departure')}</span>
                      <span className="font-medium">{formatTime(booking.trip.departureTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.seat')}</span>
                      <span className="font-medium">{booking.bookedSeats.map(s => s.seatNumber).join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.bus')}</span>
                      <span className="font-medium">{booking.trip.bus.model} ({booking.trip.bus.busNumber})</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('booking.passenger')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('common.name')}</span>
                      <span className="font-medium">{booking.bookedSeats[0]?.passengerName || 'Passenger'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('booking.payment')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('common.method')}</span>
                      <span className="font-medium">{booking.paymentMethod || 'Mada Card'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('common.amount')}</span>
                      <span className="font-medium text-haramain-green">{booking.finalAmount} {t('currency.sar')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('common.status')}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        {t('common.paid')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('booking.digitalTicket')}</h3>
                <Card className="p-6 mb-4">
                  {/* QR Code placeholder - In real implementation, use a QR code library */}
                  <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto">
                    <div className="text-center">
                      <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">QR Code</p>
                      <p className="text-xs text-gray-400">{booking.bookingReference}</p>
                    </div>
                  </div>
                </Card>
                <p className="text-sm text-gray-600 mb-6">{t('booking.showQR')}</p>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button className="w-full bg-haramain-green text-white hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    {t('booking.downloadPDF')}
                  </Button>
                  <Button variant="outline" className="w-full bg-haramain-blue text-white hover:bg-blue-700">
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('booking.shareTicket')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  {t('booking.viewBookings')}
                </Button>
              </Link>
              <Button onClick={onNewBooking} className="flex-1 bg-haramain-green text-white hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('booking.bookAnother')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
