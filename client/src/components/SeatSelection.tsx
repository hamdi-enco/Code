import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import type { Trip, Route, Bus, BookedSeat } from "@shared/schema";

interface TripWithDetails extends Trip {
  route: Route;
  bus: Bus;
}

interface SeatSelectionProps {
  trip: TripWithDetails;
  onBookingComplete: (bookingId: string) => void;
  onBack: () => void;
}

export function SeatSelection({ trip, onBookingComplete, onBack }: SeatSelectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);

  // Generate seat layout based on bus capacity
  const generateSeatLayout = () => {
    const seats: string[] = [];
    const rows = Math.ceil(trip.bus.capacity / 4);
    
    for (let row = 1; row <= rows; row++) {
      const rowLetter = String.fromCharCode(64 + row); // A, B, C, etc.
      seats.push(`${rowLetter}1`, `${rowLetter}2`, `${rowLetter}3`, `${rowLetter}4`);
    }
    
    return seats.slice(0, trip.bus.capacity);
  };

  const allSeats = generateSeatLayout();

  // Fetch booked seats for this trip
  useEffect(() => {
    const fetchBookedSeats = async () => {
      try {
        const response = await apiRequest('GET', `/api/trips/${trip.id}/seats`);
        const bookedSeatsData: BookedSeat[] = await response.json();
        setBookedSeats(bookedSeatsData.map(seat => seat.seatNumber));
      } catch (error) {
        console.error('Error fetching booked seats:', error);
      } finally {
        setIsLoadingSeats(false);
      }
    };

    fetchBookedSeats();
  }, [trip.id]);

  const validatePromoMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/promotions/validate', { promoCode: code });
      return await response.json();
    },
    onSuccess: (promotion) => {
      const tripPrice = parseFloat(trip.price);
      const discountAmount = promotion.discountType === 'percentage' 
        ? (tripPrice * parseFloat(promotion.discountValue)) / 100
        : parseFloat(promotion.discountValue);
      
      setDiscount(Math.min(discountAmount, tripPrice));
      toast({
        title: "Promo code applied!",
        description: `You saved ${discountAmount} ${t('currency.sar')}`,
      });
    },
    onError: () => {
      toast({
        title: "Invalid promo code",
        description: "Please check the code and try again.",
        variant: "destructive",
      });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return await response.json();
    },
    onSuccess: (booking) => {
      onBookingComplete(booking.id);
    },
    onError: (error) => {
      toast({
        title: "Booking failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSeatClick = (seatNumber: string) => {
    if (bookedSeats.includes(seatNumber)) return;
    
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      // For now, limit to 1 seat per booking
      setSelectedSeats([seatNumber]);
    }
  };

  const handlePromoCodeApply = () => {
    if (promoCode.trim()) {
      validatePromoMutation.mutate(promoCode.trim());
    }
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) return;
    
    const ticketPrice = parseFloat(trip.price);
    const serviceFee = 10; // SAR
    const totalAmount = ticketPrice + serviceFee;
    const finalAmount = totalAmount - discount;
    
    const bookingData = {
      tripId: trip.id,
      totalAmount: totalAmount.toFixed(2),
      discountAmount: discount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      selectedSeats: selectedSeats.map(seat => ({
        seatNumber: seat,
        passengerName: 'Passenger', // This would come from a form
      })),
    };
    
    createBookingMutation.mutate(bookingData);
  };

  const getSeatStatus = (seatNumber: string) => {
    if (bookedSeats.includes(seatNumber)) return 'occupied';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  const getSeatStyles = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-gray-400 cursor-not-allowed text-white';
      case 'selected':
        return 'bg-haramain-green text-white';
      case 'available':
      default:
        return 'bg-green-500 hover:bg-green-600 text-white cursor-pointer';
    }
  };

  const ticketPrice = parseFloat(trip.price);
  const serviceFee = 10;
  const totalAmount = (ticketPrice + serviceFee) * selectedSeats.length;
  const finalAmount = totalAmount - discount;

  if (isLoadingSeats) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-haramain-green mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Booking Progress */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-haramain-green text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <span className="text-sm font-medium text-haramain-green">{t('seat.selectSeats')}</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <span className="text-sm font-medium text-gray-600">Passenger Details</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <span className="text-sm font-medium text-gray-600">Payment</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{t('seat.selectSeats')}</h2>
          <p className="text-gray-600">
            {trip.bus.model} • {trip.route.originCity} → {trip.route.destinationCity} • 
            {new Date(trip.departureTime).toLocaleDateString()} {new Date(trip.departureTime).toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-haramain-gray">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Layout</h3>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>{t('seat.available')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-haramain-green rounded"></div>
                    <span>{t('seat.selected')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span>{t('seat.occupied')}</span>
                  </div>
                </div>
              </div>

              <Card className="p-4">
                {/* Driver Section */}
                <div className="flex justify-between items-center mb-6">
                  <div className="w-12 h-8 bg-gray-600 rounded text-white text-xs flex items-center justify-center">DRIVER</div>
                  <div className="text-xs text-gray-500">Front</div>
                </div>

                {/* Seat Grid */}
                <div className="space-y-3">
                  {Array.from({ length: Math.ceil(allSeats.length / 4) }, (_, rowIndex) => (
                    <div key={rowIndex} className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {allSeats.slice(rowIndex * 4, rowIndex * 4 + 2).map(seatNumber => {
                          const status = getSeatStatus(seatNumber);
                          return (
                            <button
                              key={seatNumber}
                              onClick={() => handleSeatClick(seatNumber)}
                              disabled={status === 'occupied'}
                              className={`w-10 h-10 rounded text-xs font-semibold transition-colors ${getSeatStyles(status)}`}
                            >
                              {seatNumber}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs text-gray-500">{rowIndex + 1}</span>
                      <div className="flex space-x-2">
                        {allSeats.slice(rowIndex * 4 + 2, rowIndex * 4 + 4).map(seatNumber => {
                          if (!seatNumber) return <div key={`empty-${rowIndex}`} className="w-10 h-10"></div>;
                          const status = getSeatStatus(seatNumber);
                          return (
                            <button
                              key={seatNumber}
                              onClick={() => handleSeatClick(seatNumber)}
                              disabled={status === 'occupied'}
                              className={`w-10 h-10 rounded text-xs font-semibold transition-colors ${getSeatStyles(status)}`}
                            >
                              {seatNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('seat.bookingSummary')}</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('seat.selectedSeats')}</span>
                  <span className="font-medium">{selectedSeats.join(', ') || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('seat.ticketPrice')}</span>
                  <span className="font-medium">{ticketPrice} {t('currency.sar')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('seat.serviceFee')}</span>
                  <span className="font-medium">{serviceFee} {t('currency.sar')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{discount.toFixed(2)} {t('currency.sar')}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('seat.total')}</span>
                  <span className="text-haramain-green">{finalAmount.toFixed(2)} {t('currency.sar')}</span>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mt-6 space-y-3">
                <Label className="text-sm font-medium text-gray-700">{t('seat.promoCode')}</Label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder={t('seat.enterPromoCode')}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handlePromoCodeApply}
                    disabled={!promoCode.trim() || validatePromoMutation.isPending}
                    variant="outline"
                  >
                    {validatePromoMutation.isPending ? '...' : t('seat.apply')}
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Button
                  onClick={handleBooking}
                  disabled={selectedSeats.length === 0 || createBookingMutation.isPending}
                  className="w-full bg-haramain-green text-white hover:bg-green-700"
                >
                  {createBookingMutation.isPending ? 'Processing...' : t('seat.continueToPassenger')}
                </Button>
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="w-full"
                >
                  Back to Search
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
