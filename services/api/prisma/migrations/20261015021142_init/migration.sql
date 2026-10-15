-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "clientId" TEXT NOT NULL,
    "symbol" TEXT,
    "interval" TEXT,
    "showAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("clientId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_name_key" ON "Watchlist"("name");

-- CreateIndex
CREATE INDEX "WatchlistItem_watchlistId_position_idx" ON "WatchlistItem"("watchlistId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_watchlistId_baseAsset_quoteAsset_key" ON "WatchlistItem"("watchlistId", "baseAsset", "quoteAsset");

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
