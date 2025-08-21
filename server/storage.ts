import {
  users,
  admins,
  buses,
  routes,
  trips,
  bookings,
  bookedSeats,
  promotions,
  socialLinks,
  type User,
  type UpsertUser,
  type Route,
  type Bus,
  type Trip,
  type Booking,
  type BookedSeat,
  type Promotion,
  type SocialLink,
  type InsertRoute,
  type InsertBus,
  type InsertTrip,
  type InsertBooking,
  type InsertPromotion,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, count, sql, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Route operations
  getRoutes(): Promise<Route[]>;
  createRoute(routeData: InsertRoute): Promise<Route>;
  
  // Bus operations
  getBuses(): Promise<Bus[]>;
  createBus(busData: InsertBus): Promise<Bus>;
  
  // Trip operations
  searchTrips(params: { originCity: string; destinationCity: string; date: Date }): Promise<any[]>;
  getTripSeats(tripId: string): Promise<BookedSeat[]>;
  createTrip(tripData: InsertTrip): Promise<Trip>;
  
  // Booking operations
  getUserBookings(userId: string): Promise<any[]>;
  createBooking(bookingData: InsertBooking, selectedSeats: { seatNumber: string; passengerName: string }[]): Promise<Booking>;
  getBookingById(bookingId: string, userId: string): Promise<any>;
  getAllBookings(): Promise<any[]>;
  confirmBookingPayment(bookingId: string, userId: string, paymentGatewayId: string): Promise<any>;
  
  // Promotion operations
  validatePromoCode(promoCode: string): Promise<Promotion | null>;
  createPromotion(promotionData: InsertPromotion): Promise<Promotion>;
  
  // Social Links operations
  getSocialLinks(): Promise<SocialLink[]>;
  
  // Admin operations
  getAdminStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Route operations
  async getRoutes(): Promise<Route[]> {
    return await db.select().from(routes).where(eq(routes.isActive, true));
  }

  async createRoute(routeData: InsertRoute): Promise<Route> {
    const [route] = await db.insert(routes).values(routeData).returning();
    return route;
  }

  // Bus operations
  async getBuses(): Promise<Bus[]> {
    return await db.select().from(buses);
  }

  async createBus(busData: InsertBus): Promise<Bus> {
    const [bus] = await db.insert(buses).values(busData).returning();
    return bus;
  }

  // Trip operations
  async searchTrips(params: { originCity: string; destinationCity: string; date: Date }): Promise<any[]> {
    const startDate = new Date(params.date);
    const endDate = new Date(params.date);
    endDate.setDate(endDate.getDate() + 1);

    const tripsWithDetails = await db
      .select({
        trip: trips,
        route: routes,
        bus: buses,
      })
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .where(
        and(
          eq(routes.originCity, params.originCity),
          eq(routes.destinationCity, params.destinationCity),
          gte(trips.departureTime, startDate),
          lte(trips.departureTime, endDate),
          eq(trips.status, 'scheduled')
        )
      );

    // Calculate available seats for each trip
    const tripsWithAvailability = await Promise.all(
      tripsWithDetails.map(async (tripData) => {
        const [bookedSeatsResult] = await db
          .select({ count: count() })
          .from(bookedSeats)
          .where(eq(bookedSeats.tripId, tripData.trip.id));

        const bookedCount = bookedSeatsResult?.count || 0;
        const availableSeats = tripData.bus.capacity - bookedCount;

        return {
          ...tripData.trip,
          route: tripData.route,
          bus: tripData.bus,
          availableSeats,
        };
      })
    );

    return tripsWithAvailability;
  }

  async getTripSeats(tripId: string): Promise<BookedSeat[]> {
    return await db.select().from(bookedSeats).where(eq(bookedSeats.tripId, tripId));
  }

  async createTrip(tripData: InsertTrip): Promise<Trip> {
    const [trip] = await db.insert(trips).values(tripData).returning();
    return trip;
  }

  // Booking operations
  async getUserBookings(userId: string): Promise<any[]> {
    const userBookings = await db
      .select({
        booking: bookings,
        trip: trips,
        route: routes,
        bus: buses,
        seats: bookedSeats,
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .leftJoin(bookedSeats, eq(bookings.id, bookedSeats.bookingId))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));

    // Group seats by booking
    const bookingsMap = new Map();
    userBookings.forEach((row) => {
      const bookingId = row.booking.id;
      if (!bookingsMap.has(bookingId)) {
        bookingsMap.set(bookingId, {
          ...row.booking,
          trip: {
            ...row.trip,
            route: row.route,
            bus: row.bus,
          },
          bookedSeats: [],
        });
      }
      if (row.seats) {
        bookingsMap.get(bookingId).bookedSeats.push(row.seats);
      }
    });

    return Array.from(bookingsMap.values());
  }

  async createBooking(
    bookingData: InsertBooking,
    selectedSeats: { seatNumber: string; passengerName: string }[]
  ): Promise<Booking> {
    // Generate booking reference
    const bookingReference = `HRM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${randomUUID().slice(0, 6).toUpperCase()}`;

    const [booking] = await db
      .insert(bookings)
      .values({
        ...bookingData,
        bookingReference,
        status: 'confirmed', // Auto-confirm for now
      })
      .returning();

    // Insert booked seats
    if (selectedSeats.length > 0) {
      await db.insert(bookedSeats).values(
        selectedSeats.map((seat) => ({
          bookingId: booking.id,
          tripId: bookingData.tripId,
          seatNumber: seat.seatNumber,
          passengerName: seat.passengerName,
        }))
      );
    }

    return booking;
  }

  async getBookingById(bookingId: string, userId: string): Promise<any> {
    const bookingResult = await db
      .select({
        booking: bookings,
        trip: trips,
        route: routes,
        bus: buses,
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(buses, eq(trips.busId, buses.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
      .limit(1);

    if (bookingResult.length === 0) {
      return null;
    }

    const seats = await db
      .select()
      .from(bookedSeats)
      .where(eq(bookedSeats.bookingId, bookingId));

    return {
      ...bookingResult[0].booking,
      trip: {
        ...bookingResult[0].trip,
        route: bookingResult[0].route,
        bus: bookingResult[0].bus,
      },
      bookedSeats: seats,
    };
  }

  async getAllBookings(): Promise<any[]> {
    const allBookings = await db
      .select({
        booking: bookings,
        trip: trips,
        route: routes,
        user: users,
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.createdAt))
      .limit(50);

    return allBookings.map((row) => ({
      id: row.booking.id,
      bookingReference: row.booking.bookingReference,
      route: {
        originCity: row.route.originCity,
        destinationCity: row.route.destinationCity,
      },
      passengerName: row.user.firstName && row.user.lastName 
        ? `${row.user.firstName} ${row.user.lastName}` 
        : row.user.email,
      amount: row.booking.finalAmount,
      status: row.booking.status,
    }));
  }

  // Promotion operations
  async validatePromoCode(promoCode: string): Promise<Promotion | null> {
    const now = new Date();
    const [promotion] = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.promoCode, promoCode),
          eq(promotions.isActive, true),
          lte(promotions.startDate, now),
          gte(promotions.endDate, now)
        )
      );

    return promotion || null;
  }

  async createPromotion(promotionData: InsertPromotion): Promise<Promotion> {
    const [promotion] = await db.insert(promotions).values(promotionData).returning();
    return promotion;
  }

  // Social Links operations
  async getSocialLinks(): Promise<SocialLink[]> {
    return await db.select().from(socialLinks).where(eq(socialLinks.isVisible, true));
  }

  // Admin operations
  async getAdminStats(): Promise<any> {
    const [totalBookingsResult] = await db
      .select({ count: count() })
      .from(bookings);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayRevenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${bookings.finalAmount} as DECIMAL)), 0)` 
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, today),
          lte(bookings.createdAt, tomorrow),
          eq(bookings.status, 'confirmed')
        )
      );

    const [activeRoutesResult] = await db
      .select({ count: count() })
      .from(routes)
      .where(eq(routes.isActive, true));

    const [fleetSizeResult] = await db
      .select({ count: count() })
      .from(buses);

    return {
      totalBookings: totalBookingsResult.count,
      revenueToday: todayRevenueResult.total?.toString() || '0',
      activeRoutes: activeRoutesResult.count,
      fleetSize: fleetSizeResult.count,
    };
  }

  async confirmBookingPayment(bookingId: string, userId: string, paymentGatewayId: string): Promise<any> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({
        status: 'confirmed',
        paymentGatewayId: paymentGatewayId,
        paymentMethod: 'stripe'
      })
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.userId, userId)
        )
      )
      .returning();

    if (!updatedBooking) {
      throw new Error('Booking not found or access denied');
    }

    // Fetch complete booking details with trip and route info
    const bookingDetails = await this.getBookingById(bookingId, userId);
    return bookingDetails;
  }
}

export const storage = new DatabaseStorage();
