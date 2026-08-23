CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "node_name_trgm" ON "Node" USING gin ("name" gin_trgm_ops);