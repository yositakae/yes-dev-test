BEGIN;

-- Invalid Excel rows are retained for admin correction, so these fields may be NULL.
ALTER TABLE products
    ALTER COLUMN sku DROP NOT NULL,
    ALTER COLUMN name DROP NOT NULL,
    ALTER COLUMN category_id DROP NOT NULL,
    ALTER COLUMN price DROP NOT NULL,
    ALTER COLUMN type DROP NOT NULL;

COMMIT;
