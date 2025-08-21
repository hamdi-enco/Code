import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  integer,
  boolean,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - updated for Haramain requirements
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").unique(),
  email: varchar("email").unique(),
  fullName: varchar("full_name"),
  socialProvider: varchar("social_provider"),
  socialProviderId: varchar("social_provider_id"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admins table
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  fullName: varchar("full_name").notNull(),
  role: varchar("role").notNull(), // 'super_admin', 'marketing_manager', 'support_agent'
  createdAt: timestamp("created_at").defaultNow(),
});

// OTPs table
export const otps = pgTable("otps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userIdentifier: varchar("user_identifier").notNull(),
  otpCode: varchar("otp_code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Buses table
export const buses = pgTable("buses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  busNumber: varchar("bus_number").unique().notNull(),
  model: varchar("model"),
  capacity: integer("capacity").notNull(),
  amenities: jsonb("amenities"), // {"wifi": true, "ac": true, "power_outlet": false, "restroom": true}
  createdAt: timestamp("created_at").defaultNow(),
});

// Routes table
export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  originCity: varchar("origin_city").notNull(),
  destinationCity: varchar("destination_city").notNull(),
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trips table
export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: uuid("route_id").notNull().references(() => routes.id),
  busId: uuid("bus_id").notNull().references(() => buses.id),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default('scheduled'), // 'scheduled', 'departed', 'arrived', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

// Promotions table
export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  promoCode: varchar("promo_code").unique().notNull(),
  description: text("description"),
  discountType: varchar("discount_type").notNull(), // 'percentage' or 'fixed_amount'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  usageLimit: integer("usage_limit"),
  createdByAdminId: uuid("created_by_admin_id").notNull().references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingReference: varchar("booking_reference").unique().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  tripId: uuid("trip_id").notNull().references(() => trips.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  promotionId: uuid("promotion_id").references(() => promotions.id),
  status: varchar("status").default('pending'), // 'pending', 'confirmed', 'cancelled'
  paymentGatewayId: varchar("payment_gateway_id"),
  paymentMethod: varchar("payment_method"), // 'mada', 'stc_pay', 'visa', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Booked seats table
export const bookedSeats = pgTable("booked_seats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  tripId: uuid("trip_id").notNull().references(() => trips.id),
  seatNumber: varchar("seat_number").notNull(),
  passengerName: varchar("passenger_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social links table
export const socialLinks = pgTable("social_links", {
  id: integer("id").primaryKey(),
  platformName: varchar("platform_name").notNull(),
  profileUrl: varchar("profile_url").notNull(),
  isVisible: boolean("is_visible").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const adminsRelations = relations(admins, ({ many }) => ({
  promotions: many(promotions),
}));

export const routesRelations = relations(routes, ({ many }) => ({
  trips: many(trips),
}));

export const busesRelations = relations(buses, ({ many }) => ({
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  route: one(routes, { fields: [trips.routeId], references: [routes.id] }),
  bus: one(buses, { fields: [trips.busId], references: [buses.id] }),
  bookings: many(bookings),
  bookedSeats: many(bookedSeats),
}));

export const promotionsRelations = relations(promotions, ({ one, many }) => ({
  createdBy: one(admins, { fields: [promotions.createdByAdminId], references: [admins.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  trip: one(trips, { fields: [bookings.tripId], references: [trips.id] }),
  promotion: one(promotions, { fields: [bookings.promotionId], references: [promotions.id] }),
  bookedSeats: many(bookedSeats),
}));

export const bookedSeatsRelations = relations(bookedSeats, ({ one }) => ({
  booking: one(bookings, { fields: [bookedSeats.bookingId], references: [bookings.id] }),
  trip: one(trips, { fields: [bookedSeats.tripId], references: [trips.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertBusSchema = createInsertSchema(buses).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Bus = typeof buses.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookedSeat = typeof bookedSeats.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type Admin = typeof admins.$inferSelect;

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type InsertBus = z.infer<typeof insertBusSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
