-- Product QR platform schema for PostgreSQL

BEGIN;

CREATE TYPE product_type AS ENUM ('g', 'ml', 'ชิ้น');
CREATE TYPE product_status AS ENUM ('active', 'inactive');

CREATE TABLE users (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    surname         VARCHAR(200) NOT NULL,
    email           VARCHAR(200) NOT NULL UNIQUE,
    hash_password    VARCHAR(500) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products_category (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE products (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku             VARCHAR(200) UNIQUE,
    name            VARCHAR(200),
    category_id     INTEGER REFERENCES products_category(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    price           INTEGER CHECK (price >= 0),
    size            VARCHAR(500),
    type            product_type,
    description     VARCHAR(500),
    how_to_use     VARCHAR(500),
    status          product_status NOT NULL DEFAULT 'active',
    qr_products     TEXT,
    create_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products_photo (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
    photo_url       TEXT NOT NULL
);

CREATE TABLE log_scan (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
    scan_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX products_category_id_idx ON products(category_id);
CREATE INDEX products_status_idx ON products(status);
CREATE INDEX products_photo_product_id_idx ON products_photo(product_id);
CREATE INDEX log_scan_product_id_idx ON log_scan(product_id);
CREATE INDEX log_scan_scan_at_idx ON log_scan(scan_at);

CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_products_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.update_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_users_updated_at();

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_products_updated_at();

COMMIT;
