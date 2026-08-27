-- Suspicious hero / wallet marking
-- Manually curated lists used to warn buyers about heroes suspected of being
-- obtained through fraud or a hacked account (usually dumped at a low price).
-- Apply on both the bsc and polygon schemas.

BEGIN;

CREATE TABLE IF NOT EXISTS bsc.suspicious_heroes (
    id bigserial PRIMARY KEY,
    token_id bigint NOT NULL UNIQUE,
    reason character varying(64) DEFAULT 'fraud'::character varying NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS bsc.suspicious_wallets (
    id bigserial PRIMARY KEY,
    wallet_address public.citext NOT NULL UNIQUE,
    reason character varying(64) DEFAULT 'fraud'::character varying NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS polygon.suspicious_heroes (
    id bigserial PRIMARY KEY,
    token_id bigint NOT NULL UNIQUE,
    reason character varying(64) DEFAULT 'fraud'::character varying NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS polygon.suspicious_wallets (
    id bigserial PRIMARY KEY,
    wallet_address public.citext NOT NULL UNIQUE,
    reason character varying(64) DEFAULT 'fraud'::character varying NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMIT;
