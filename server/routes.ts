import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertRouteSchema, insertBusSchema, insertTripSchema, insertBookingSchema, insertPromotionSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Routes API
  app.get('/api/routes', async (req, res) => {
    try {
      const routes = await storage.getRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.post('/api/routes', isAuthenticated, async (req, res) => {
    try {
      const routeData = insertRouteSchema.parse(req.body);
      const route = await storage.createRoute(routeData);
      res.json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create route" });
    }
  });

  // Buses API
  app.get('/api/buses', async (req, res) => {
    try {
      const buses = await storage.getBuses();
      res.json(buses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch buses" });
    }
  });

  app.post('/api/buses', isAuthenticated, async (req, res) => {
    try {
      const busData = insertBusSchema.parse(req.body);
      const bus = await storage.createBus(busData);
      res.json(bus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bus data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bus" });
    }
  });

  // Trips API
  app.get('/api/trips/search', async (req, res) => {
    try {
      const { originCity, destinationCity, date } = req.query;
      if (!originCity || !destinationCity || !date) {
        return res.status(400).json({ message: "Missing required search parameters" });
      }
      
      const trips = await storage.searchTrips({
        originCity: originCity as string,
        destinationCity: destinationCity as string,
        date: new Date(date as string),
      });
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: "Failed to search trips" });
    }
  });

  app.get('/api/trips/:tripId/seats', async (req, res) => {
    try {
      const { tripId } = req.params;
      const seats = await storage.getTripSeats(tripId);
      res.json(seats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seat availability" });
    }
  });

  app.post('/api/trips', isAuthenticated, async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  // Bookings API
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId,
      });
      
      const booking = await storage.createBooking(bookingData, req.body.selectedSeats);
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings/:bookingId', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user.claims.sub;
      const booking = await storage.getBookingById(bookingId, userId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Promotions API
  app.post('/api/promotions/validate', async (req, res) => {
    try {
      const { promoCode } = req.body;
      if (!promoCode) {
        return res.status(400).json({ message: "Promo code is required" });
      }
      
      const promotion = await storage.validatePromoCode(promoCode);
      if (!promotion) {
        return res.status(404).json({ message: "Invalid promo code" });
      }
      
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });

  app.post('/api/promotions', isAuthenticated, async (req, res) => {
    try {
      const promotionData = insertPromotionSchema.parse(req.body);
      const promotion = await storage.createPromotion(promotionData);
      res.json(promotion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid promotion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create promotion" });
    }
  });

  // Admin API
  app.get('/api/admin/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/bookings', isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all bookings" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { amount, bookingId } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: bookingId,
          userId: req.user.claims.sub,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/confirm-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId, bookingId } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update booking status to confirmed
        const booking = await storage.confirmBookingPayment(bookingId, userId, paymentIntentId);
        res.json({ success: true, booking });
      } else {
        res.status(400).json({ message: "Payment not successful" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error confirming payment: " + error.message });
    }
  });

  // Social Links API
  app.get('/api/social-links', async (req, res) => {
    try {
      const socialLinks = await storage.getSocialLinks();
      res.json(socialLinks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social links" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time seat availability
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join_trip') {
          // Join trip room for real-time seat updates
          ws.send(JSON.stringify({
            type: 'joined_trip',
            tripId: message.tripId
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
