/**
 * Core Schema Tables
 * Base tables that other schemas depend on
 * Separated to avoid circular dependencies
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * Coffee Groves Table
 */
export const coffeeGroves = sqliteTable("coffee_groves", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    groveName: text("grove_name").unique().notNull(),
    farmerAddress: text("farmer_address").notNull(),
    tokenAddress: text("token_address"),
    tokenSymbol: text("token_symbol"),
    location: text("location").notNull(),
    coordinatesLat: text("coordinates_lat"),
    coordinatesLng: text("coordinates_lng"),
    treeCount: integer("tree_count").notNull(),
    coffeeVariety: text("coffee_variety").notNull(),
    plantingDate: integer("planting_date"),
    expectedYieldPerTree: integer("expected_yield_per_tree"),
    totalTokensIssued: integer("total_tokens_issued"),
    tokensSold: integer("tokens_sold").default(0),
    tokensPerTree: integer("tokens_per_tree").default(10),
    verificationStatus: text("verification_status").default("pending"),
    currentHealthScore: integer("current_health_score"),
    isTokenized: integer("is_tokenized", { mode: 'boolean' }).default(false),
    tokenizedAt: integer("tokenized_at"),
    createdAt: integer("created_at").default(Date.now()),
    updatedAt: integer("updated_at").default(Date.now())
}, (table) => {
    return {
        farmerAddressIdx: index("coffee_groves_farmer_idx").on(table.farmerAddress),
        tokenAddressIdx: index("coffee_groves_token_idx").on(table.tokenAddress),
        verificationStatusIdx: index("coffee_groves_verification_idx").on(table.verificationStatus)
    }
});

/**
 * Harvest Records Table
 */
export const harvestRecords = sqliteTable("harvest_records", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    groveId: integer("grove_id").notNull().references(() => coffeeGroves.id),
    farmerAddress: text("farmer_address").notNull(),
    harvestDate: integer("harvest_date").notNull(),
    quantityKg: integer("quantity_kg").notNull(),
    qualityGrade: text("quality_grade"),
    pricePerKg: integer("price_per_kg"),
    totalRevenue: integer("total_revenue"),
    distributionStatus: text("distribution_status").default("pending"),
    distributedAt: integer("distributed_at"),
    transactionHash: text("transaction_hash"),
    notes: text("notes"),
    createdAt: integer("created_at").default(Date.now()),
    updatedAt: integer("updated_at").default(Date.now())
}, (table) => {
    return {
        groveIdIdx: index("harvest_records_grove_idx").on(table.groveId),
        farmerAddressIdx: index("harvest_records_farmer_idx").on(table.farmerAddress),
        harvestDateIdx: index("harvest_records_date_idx").on(table.harvestDate),
        distributionStatusIdx: index("harvest_records_distribution_idx").on(table.distributionStatus)
    }
});
