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
    harvestDate: integer("harvest_date").notNull(),
    yieldKg: integer("yield_kg").notNull(),
    qualityGrade: integer("quality_grade").notNull(),
    salePricePerKg: integer("sale_price_per_kg").notNull(),
    totalRevenue: integer("total_revenue").notNull(),
    farmerShare: integer("farmer_share").notNull(),
    investorShare: integer("investor_share").notNull(),
    revenueDistributed: integer("revenue_distributed", { mode: 'boolean' }).default(false),
    transactionHash: text("transaction_hash"),
    createdAt: integer("created_at").default(Date.now())
}, (table) => {
    return {
        groveIdIdx: index("harvest_records_grove_id_idx").on(table.groveId),
        harvestDateIdx: index("harvest_records_date_idx").on(table.harvestDate),
        revenueDistributedIdx: index("harvest_records_distributed_idx").on(table.revenueDistributed)
    }
});
