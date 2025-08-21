import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  BarChart3, 
  Bus, 
  Route, 
  Tag, 
  Plus, 
  TrendingUp, 
  Users, 
  DollarSign 
} from "lucide-react";

interface AdminStats {
  totalBookings: number;
  revenueToday: string;
  activeRoutes: number;
  fleetSize: number;
}

interface RecentBooking {
  id: string;
  bookingReference: string;
  route: {
    originCity: string;
    destinationCity: string;
  };
  passengerName: string;
  amount: string;
  status: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    staleTime: 30 * 1000, // 30 seconds
  });

  const { data: recentBookings = [] } = useQuery<RecentBooking[]>({
    queryKey: ["/api/admin/bookings"],
    staleTime: 10 * 1000, // 10 seconds
  });

  const getCityName = (cityKey: string) => {
    return t(`city.${cityKey}`);
  };

  return (
    <div className="min-h-screen bg-haramain-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.dashboard')}</h1>
          <p className="text-gray-600">{t('admin.manageOperations')}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.totalBookings')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalBookings.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-haramain-green p-3 rounded-lg">
                <Users className="text-white h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.revenueToday')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.revenueToday || '0'} {t('currency.sar')}
                </p>
              </div>
              <div className="bg-haramain-gold p-3 rounded-lg">
                <DollarSign className="text-white h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.activeRoutes')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activeRoutes || 0}
                </p>
              </div>
              <div className="bg-haramain-blue p-3 rounded-lg">
                <Route className="text-white h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.fleetSize')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.fleetSize || 0}
                </p>
              </div>
              <div className="bg-green-600 p-3 rounded-lg">
                <Bus className="text-white h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.quickActions')}</h2>
            <div className="space-y-3">
              <Button className="w-full bg-haramain-green text-white hover:bg-green-700 justify-start">
                <Plus className="h-5 w-5 mr-3" />
                {t('admin.addRoute')}
              </Button>
              <Button className="w-full bg-haramain-blue text-white hover:bg-blue-700 justify-start">
                <Bus className="h-5 w-5 mr-3" />
                {t('admin.addBus')}
              </Button>
              <Button className="w-full bg-haramain-gold text-white hover:bg-yellow-600 justify-start">
                <Tag className="h-5 w-5 mr-3" />
                {t('admin.createPromotion')}
              </Button>
              <Button className="w-full bg-gray-600 text-white hover:bg-gray-700 justify-start">
                <BarChart3 className="h-5 w-5 mr-3" />
                {t('admin.viewReports')}
              </Button>
            </div>
          </Card>

          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.recentBookings')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-900">Booking ID</th>
                      <th className="text-left py-3 font-medium text-gray-900">Route</th>
                      <th className="text-left py-3 font-medium text-gray-900">Passenger</th>
                      <th className="text-left py-3 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No recent bookings found
                        </td>
                      </tr>
                    ) : (
                      recentBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="py-3 font-medium">{booking.bookingReference}</td>
                          <td className="py-3">
                            {getCityName(booking.route.originCity)} → {getCityName(booking.route.destinationCity)}
                          </td>
                          <td className="py-3">{booking.passengerName}</td>
                          <td className="py-3">{booking.amount} {t('currency.sar')}</td>
                          <td className="py-3">
                            <Badge 
                              className={
                                booking.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {booking.status === 'confirmed' && 'Confirmed'}
                              {booking.status === 'pending' && 'Pending'}
                              {booking.status === 'cancelled' && 'Cancelled'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Route Management Form (Simple Example) */}
        <Card className="mt-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Route</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Origin City</Label>
              <Input placeholder="Select origin city" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Destination City</Label>
              <Input placeholder="Select destination city" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Duration (minutes)</Label>
              <Input type="number" placeholder="150" />
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-haramain-green text-white hover:bg-green-700">
                Add Route
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
