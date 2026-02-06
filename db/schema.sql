--
-- PostgreSQL database dump
--

\restrict VB15RbISxfSDsw8h7DJL6PR73N9Xx1iLTgxRu41cdxh45WhlwxUbGFUDOc2n7ld

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: bsc; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA bsc;


--
-- Name: polygon; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA polygon;


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: fn_has_any_transaction(character varying, timestamp with time zone); Type: FUNCTION; Schema: bsc; Owner: -
--

CREATE FUNCTION bsc.fn_has_any_transaction(_wallet character varying, _min_time timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    result boolean;
BEGIN
    _wallet := lower(_wallet);
    SELECT EXISTS(SELECT 1
                  FROM bsc.hero_orders
                  WHERE (lower(buyer_wallet_address) = _wallet
                      OR lower(seller_wallet_address) = _wallet)
                    AND created_at >= _min_time)
    INTO result;

    IF result = TRUE THEN
        RETURN TRUE;
    END IF;

    SELECT EXISTS(SELECT 1
                  FROM bsc.house_orders
                  WHERE (lower(buyer_wallet_address) = _wallet
                      OR lower(seller_wallet_address) = _wallet)
                    AND created_at >= _min_time)
    INTO result;

    IF result = TRUE THEN
        RETURN TRUE;
    END IF;

    SELECT EXISTS(SELECT 1
                  FROM polygon.hero_orders
                  WHERE (lower(buyer_wallet_address) = _wallet
                      OR lower(seller_wallet_address) = _wallet)
                    AND created_at >= _min_time)
    INTO result;

    IF result = TRUE THEN
        RETURN TRUE;
    END IF;

    SELECT EXISTS(SELECT 1
                  FROM polygon.house_orders
                  WHERE (lower(buyer_wallet_address) = _wallet
                      OR lower(seller_wallet_address) = _wallet)
                    AND created_at >= _min_time)
    INTO result;

    RETURN result;

END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: hero_abilities; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.hero_abilities (
    id integer NOT NULL,
    hero_token_id bigint,
    ability_token_id smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: hero_abilities_id_seq; Type: SEQUENCE; Schema: bsc; Owner: -
--

CREATE SEQUENCE bsc.hero_abilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hero_abilities_id_seq; Type: SEQUENCE OWNED BY; Schema: bsc; Owner: -
--

ALTER SEQUENCE bsc.hero_abilities_id_seq OWNED BY bsc.hero_abilities.id;


--
-- Name: hero_orders; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.hero_orders (
    id bigint NOT NULL,
    tx_hash public.citext NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    nft_block_number bigint NOT NULL,
    buyer_wallet_address public.citext DEFAULT ''::public.citext,
    seller_wallet_address public.citext,
    status character varying(255) DEFAULT 'listing'::character varying,
    amount numeric(78,0) DEFAULT 0,
    token_id bigint NOT NULL,
    rarity bigint,
    level smallint,
    color smallint,
    skin smallint,
    stamina smallint,
    speed smallint,
    bomb_skin smallint,
    bomb_count smallint,
    bomb_power smallint,
    bomb_range smallint,
    abilities character varying(255),
    ability_1 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%1%'::text)) STORED,
    ability_2 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%2%'::text)) STORED,
    ability_3 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%3%'::text)) STORED,
    ability_4 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%4%'::text)) STORED,
    ability_5 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%5%'::text)) STORED,
    ability_6 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%6%'::text)) STORED,
    ability_7 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%7%'::text)) STORED,
    abilities_hero_s character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false NOT NULL,
    pay_token character varying(255) DEFAULT ''::character varying
);


--
-- Name: hero_orders_id_seq; Type: SEQUENCE; Schema: bsc; Owner: -
--

CREATE SEQUENCE bsc.hero_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hero_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: bsc; Owner: -
--

ALTER SEQUENCE bsc.hero_orders_id_seq OWNED BY bsc.hero_orders.id;


--
-- Name: hero_s_abilities; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.hero_s_abilities (
    id integer NOT NULL,
    hero_token_id bigint,
    ability_token_id smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: hero_s_abilities_id_seq; Type: SEQUENCE; Schema: bsc; Owner: -
--

CREATE SEQUENCE bsc.hero_s_abilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hero_s_abilities_id_seq; Type: SEQUENCE OWNED BY; Schema: bsc; Owner: -
--

ALTER SEQUENCE bsc.hero_s_abilities_id_seq OWNED BY bsc.hero_s_abilities.id;


--
-- Name: hero_subscriber_block_number; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.hero_subscriber_block_number (
    id boolean NOT NULL,
    block_number bigint NOT NULL
);


--
-- Name: hero_subscriber_failed_blocks; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.hero_subscriber_failed_blocks (
    block_number bigint NOT NULL,
    failure smallint DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: house_orders; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.house_orders (
    id bigint NOT NULL,
    tx_hash public.citext NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    nft_block_number bigint NOT NULL,
    buyer_wallet_address public.citext DEFAULT ''::public.citext,
    seller_wallet_address public.citext,
    status character varying(255) DEFAULT 'listing'::character varying,
    amount numeric(78,0) DEFAULT 0,
    token_id bigint NOT NULL,
    rarity smallint,
    recovery smallint,
    capacity smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false NOT NULL,
    pay_token character varying(255) DEFAULT ''::character varying
);


--
-- Name: house_orders_id_seq; Type: SEQUENCE; Schema: bsc; Owner: -
--

CREATE SEQUENCE bsc.house_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: bsc; Owner: -
--

ALTER SEQUENCE bsc.house_orders_id_seq OWNED BY bsc.house_orders.id;


--
-- Name: house_subscriber_block_number; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.house_subscriber_block_number (
    id boolean NOT NULL,
    block_number bigint NOT NULL
);


--
-- Name: house_subscriber_failed_blocks; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.house_subscriber_failed_blocks (
    block_number bigint NOT NULL,
    failure smallint DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subs_transfer; Type: TABLE; Schema: bsc; Owner: -
--

CREATE TABLE bsc.subs_transfer (
    id character varying NOT NULL,
    last_block bigint,
    last_checked_id bigint DEFAULT 0
);


--
-- Name: hero_abilities; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.hero_abilities (
    id integer NOT NULL,
    hero_token_id bigint,
    ability_token_id smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: hero_abilities_id_seq; Type: SEQUENCE; Schema: polygon; Owner: -
--

CREATE SEQUENCE polygon.hero_abilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hero_abilities_id_seq; Type: SEQUENCE OWNED BY; Schema: polygon; Owner: -
--

ALTER SEQUENCE polygon.hero_abilities_id_seq OWNED BY polygon.hero_abilities.id;


--
-- Name: hero_orders; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.hero_orders (
    id bigint NOT NULL,
    tx_hash public.citext NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    nft_block_number bigint NOT NULL,
    buyer_wallet_address public.citext DEFAULT ''::public.citext,
    seller_wallet_address public.citext,
    status character varying(255) DEFAULT 'listing'::character varying,
    amount numeric(78,0) DEFAULT 0,
    token_id bigint NOT NULL,
    rarity bigint,
    level smallint,
    color smallint,
    skin smallint,
    stamina smallint,
    speed smallint,
    bomb_skin smallint,
    bomb_count smallint,
    bomb_power smallint,
    bomb_range smallint,
    abilities character varying(255),
    ability_1 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%1%'::text)) STORED,
    ability_2 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%2%'::text)) STORED,
    ability_3 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%3%'::text)) STORED,
    ability_4 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%4%'::text)) STORED,
    ability_5 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%5%'::text)) STORED,
    ability_6 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%6%'::text)) STORED,
    ability_7 boolean GENERATED ALWAYS AS (((abilities)::text ~~ '%7%'::text)) STORED,
    abilities_hero_s character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false NOT NULL,
    pay_token character varying(255) DEFAULT ''::character varying
);


--
-- Name: hero_orders_id_seq; Type: SEQUENCE; Schema: polygon; Owner: -
--

CREATE SEQUENCE polygon.hero_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hero_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: polygon; Owner: -
--

ALTER SEQUENCE polygon.hero_orders_id_seq OWNED BY polygon.hero_orders.id;


--
-- Name: hero_s_abilities; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.hero_s_abilities (
    id integer NOT NULL,
    hero_token_id bigint,
    ability_token_id smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: hero_s_abilities_id_seq; Type: SEQUENCE; Schema: polygon; Owner: -
--

CREATE SEQUENCE polygon.hero_s_abilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hero_s_abilities_id_seq; Type: SEQUENCE OWNED BY; Schema: polygon; Owner: -
--

ALTER SEQUENCE polygon.hero_s_abilities_id_seq OWNED BY polygon.hero_s_abilities.id;


--
-- Name: hero_subscriber_block_number; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.hero_subscriber_block_number (
    id boolean NOT NULL,
    block_number bigint NOT NULL
);


--
-- Name: hero_subscriber_failed_blocks; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.hero_subscriber_failed_blocks (
    block_number bigint NOT NULL,
    failure smallint DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: house_orders; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.house_orders (
    id bigint NOT NULL,
    tx_hash public.citext NOT NULL,
    block_number bigint NOT NULL,
    block_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    nft_block_number bigint NOT NULL,
    buyer_wallet_address public.citext DEFAULT ''::public.citext,
    seller_wallet_address public.citext,
    status character varying(255) DEFAULT 'listing'::character varying,
    amount numeric(78,0) DEFAULT 0,
    token_id bigint NOT NULL,
    rarity smallint,
    recovery smallint,
    capacity smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false NOT NULL,
    pay_token character varying(255) DEFAULT ''::character varying
);


--
-- Name: house_orders_id_seq; Type: SEQUENCE; Schema: polygon; Owner: -
--

CREATE SEQUENCE polygon.house_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: house_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: polygon; Owner: -
--

ALTER SEQUENCE polygon.house_orders_id_seq OWNED BY polygon.house_orders.id;


--
-- Name: house_subscriber_block_number; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.house_subscriber_block_number (
    id boolean NOT NULL,
    block_number bigint NOT NULL
);


--
-- Name: house_subscriber_failed_blocks; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.house_subscriber_failed_blocks (
    block_number bigint NOT NULL,
    failure smallint DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subs_transfer; Type: TABLE; Schema: polygon; Owner: -
--

CREATE TABLE polygon.subs_transfer (
    id character varying NOT NULL,
    last_block bigint,
    last_checked_id bigint DEFAULT 0
);


--
-- Name: hero_abilities id; Type: DEFAULT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_abilities ALTER COLUMN id SET DEFAULT nextval('bsc.hero_abilities_id_seq'::regclass);


--
-- Name: hero_orders id; Type: DEFAULT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_orders ALTER COLUMN id SET DEFAULT nextval('bsc.hero_orders_id_seq'::regclass);


--
-- Name: hero_s_abilities id; Type: DEFAULT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_s_abilities ALTER COLUMN id SET DEFAULT nextval('bsc.hero_s_abilities_id_seq'::regclass);


--
-- Name: house_orders id; Type: DEFAULT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.house_orders ALTER COLUMN id SET DEFAULT nextval('bsc.house_orders_id_seq'::regclass);


--
-- Name: hero_abilities id; Type: DEFAULT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_abilities ALTER COLUMN id SET DEFAULT nextval('polygon.hero_abilities_id_seq'::regclass);


--
-- Name: hero_orders id; Type: DEFAULT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_orders ALTER COLUMN id SET DEFAULT nextval('polygon.hero_orders_id_seq'::regclass);


--
-- Name: hero_s_abilities id; Type: DEFAULT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_s_abilities ALTER COLUMN id SET DEFAULT nextval('polygon.hero_s_abilities_id_seq'::regclass);


--
-- Name: house_orders id; Type: DEFAULT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.house_orders ALTER COLUMN id SET DEFAULT nextval('polygon.house_orders_id_seq'::regclass);


--
-- Name: hero_abilities hero_abilities_hero_token_id_ability_token_id_key; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_abilities
    ADD CONSTRAINT hero_abilities_hero_token_id_ability_token_id_key UNIQUE (hero_token_id, ability_token_id);


--
-- Name: hero_abilities hero_abilities_pkey; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_abilities
    ADD CONSTRAINT hero_abilities_pkey PRIMARY KEY (id);


--
-- Name: hero_orders hero_orders_pkey; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_orders
    ADD CONSTRAINT hero_orders_pkey PRIMARY KEY (id);


--
-- Name: hero_orders hero_orders_tx_hash_key; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_orders
    ADD CONSTRAINT hero_orders_tx_hash_key UNIQUE (tx_hash);


--
-- Name: hero_s_abilities hero_s_abilities_hero_token_id_ability_token_id_key; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_s_abilities
    ADD CONSTRAINT hero_s_abilities_hero_token_id_ability_token_id_key UNIQUE (hero_token_id, ability_token_id);


--
-- Name: hero_s_abilities hero_s_abilities_pkey; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_s_abilities
    ADD CONSTRAINT hero_s_abilities_pkey PRIMARY KEY (id);


--
-- Name: hero_subscriber_block_number hero_subscriber_block_number_pkey; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_subscriber_block_number
    ADD CONSTRAINT hero_subscriber_block_number_pkey PRIMARY KEY (id);


--
-- Name: hero_subscriber_failed_blocks hero_subscriber_failed_blocks_pkey; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.hero_subscriber_failed_blocks
    ADD CONSTRAINT hero_subscriber_failed_blocks_pkey PRIMARY KEY (block_number);


--
-- Name: house_orders house_orders_pkey; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.house_orders
    ADD CONSTRAINT house_orders_pkey PRIMARY KEY (id);


--
-- Name: house_orders house_orders_tx_hash_key; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.house_orders
    ADD CONSTRAINT house_orders_tx_hash_key UNIQUE (tx_hash);


--
-- Name: house_subscriber_block_number house_subscriber_block_number_pkey; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.house_subscriber_block_number
    ADD CONSTRAINT house_subscriber_block_number_pkey PRIMARY KEY (id);


--
-- Name: house_subscriber_failed_blocks house_subscriber_failed_blocks_pkey; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.house_subscriber_failed_blocks
    ADD CONSTRAINT house_subscriber_failed_blocks_pkey PRIMARY KEY (block_number);


--
-- Name: subs_transfer newtable_pk; Type: CONSTRAINT; Schema: bsc; Owner: -
--

ALTER TABLE ONLY bsc.subs_transfer
    ADD CONSTRAINT newtable_pk PRIMARY KEY (id);


--
-- Name: hero_abilities hero_abilities_hero_token_id_ability_token_id_key; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_abilities
    ADD CONSTRAINT hero_abilities_hero_token_id_ability_token_id_key UNIQUE (hero_token_id, ability_token_id);


--
-- Name: hero_abilities hero_abilities_pkey; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_abilities
    ADD CONSTRAINT hero_abilities_pkey PRIMARY KEY (id);


--
-- Name: hero_orders hero_orders_pkey; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_orders
    ADD CONSTRAINT hero_orders_pkey PRIMARY KEY (id);


--
-- Name: hero_orders hero_orders_tx_hash_key; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_orders
    ADD CONSTRAINT hero_orders_tx_hash_key UNIQUE (tx_hash);


--
-- Name: hero_s_abilities hero_s_abilities_hero_token_id_ability_token_id_key; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_s_abilities
    ADD CONSTRAINT hero_s_abilities_hero_token_id_ability_token_id_key UNIQUE (hero_token_id, ability_token_id);


--
-- Name: hero_s_abilities hero_s_abilities_pkey; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_s_abilities
    ADD CONSTRAINT hero_s_abilities_pkey PRIMARY KEY (id);


--
-- Name: hero_subscriber_block_number hero_subscriber_block_number_pkey; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_subscriber_block_number
    ADD CONSTRAINT hero_subscriber_block_number_pkey PRIMARY KEY (id);


--
-- Name: hero_subscriber_failed_blocks hero_subscriber_failed_blocks_pkey; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.hero_subscriber_failed_blocks
    ADD CONSTRAINT hero_subscriber_failed_blocks_pkey PRIMARY KEY (block_number);


--
-- Name: house_orders house_orders_pkey; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.house_orders
    ADD CONSTRAINT house_orders_pkey PRIMARY KEY (id);


--
-- Name: house_orders house_orders_tx_hash_key; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.house_orders
    ADD CONSTRAINT house_orders_tx_hash_key UNIQUE (tx_hash);


--
-- Name: house_subscriber_block_number house_subscriber_block_number_pkey; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.house_subscriber_block_number
    ADD CONSTRAINT house_subscriber_block_number_pkey PRIMARY KEY (id);


--
-- Name: house_subscriber_failed_blocks house_subscriber_failed_blocks_pkey; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.house_subscriber_failed_blocks
    ADD CONSTRAINT house_subscriber_failed_blocks_pkey PRIMARY KEY (block_number);


--
-- Name: subs_transfer newtable_pk; Type: CONSTRAINT; Schema: polygon; Owner: -
--

ALTER TABLE ONLY polygon.subs_transfer
    ADD CONSTRAINT newtable_pk PRIMARY KEY (id);


--
-- Name: hero_orders_amount_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_amount_index ON bsc.hero_orders USING btree (amount) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_block_timestamp_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_block_timestamp_index ON bsc.hero_orders USING btree (block_timestamp) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_bomb_power_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_bomb_power_index ON bsc.hero_orders USING btree (updated_at) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_buyer_wallet_address_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_buyer_wallet_address_index ON bsc.hero_orders USING btree (buyer_wallet_address);


--
-- Name: hero_orders_rarity_amount_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_rarity_amount_index ON bsc.hero_orders USING btree (rarity, amount) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_rarity_level_amount_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_rarity_level_amount_index ON bsc.hero_orders USING btree (rarity, level, amount) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_rarity_token_id_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_rarity_token_id_index ON bsc.hero_orders USING btree (rarity, token_id) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_seller_wallet_address_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_seller_wallet_address_index ON bsc.hero_orders USING btree (seller_wallet_address);


--
-- Name: hero_orders_status_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_status_index ON bsc.hero_orders USING btree (status) WHERE (deleted = false);


--
-- Name: hero_orders_updated_at_index; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX hero_orders_updated_at_index ON bsc.hero_orders USING btree (updated_at) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: idx_hero_abilities_hero_skill; Type: INDEX; Schema: bsc; Owner: -
--

CREATE UNIQUE INDEX idx_hero_abilities_hero_skill ON bsc.hero_abilities USING btree (hero_token_id, ability_token_id) WHERE (NOT deleted);


--
-- Name: idx_hero_orders_buyer_wallet_address; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_hero_orders_buyer_wallet_address ON bsc.hero_orders USING btree (lower((buyer_wallet_address)::text));


--
-- Name: idx_hero_orders_level; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_hero_orders_level ON bsc.hero_orders USING btree (level) WHERE (NOT deleted);


--
-- Name: idx_hero_orders_rarity; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_hero_orders_rarity ON bsc.hero_orders USING btree (rarity) WHERE (NOT deleted);


--
-- Name: idx_hero_orders_seller_wallet_address; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_hero_orders_seller_wallet_address ON bsc.hero_orders USING btree (lower((seller_wallet_address)::text));


--
-- Name: idx_hero_orders_token_id; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_hero_orders_token_id ON bsc.hero_orders USING btree (token_id) WHERE (NOT deleted);


--
-- Name: idx_hero_orders_tx_hash; Type: INDEX; Schema: bsc; Owner: -
--

CREATE UNIQUE INDEX idx_hero_orders_tx_hash ON bsc.hero_orders USING btree (lower((tx_hash)::text)) WHERE (NOT deleted);


--
-- Name: idx_house_orders_buyer_wallet_address; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_house_orders_buyer_wallet_address ON bsc.house_orders USING btree (lower((buyer_wallet_address)::text));


--
-- Name: idx_house_orders_capacity; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_house_orders_capacity ON bsc.house_orders USING btree (capacity) WHERE (NOT deleted);


--
-- Name: idx_house_orders_rarity; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_house_orders_rarity ON bsc.house_orders USING btree (rarity) WHERE (NOT deleted);


--
-- Name: idx_house_orders_seller_wallet_address; Type: INDEX; Schema: bsc; Owner: -
--

CREATE INDEX idx_house_orders_seller_wallet_address ON bsc.house_orders USING btree (lower((seller_wallet_address)::text));


--
-- Name: idx_house_orders_tx_hash; Type: INDEX; Schema: bsc; Owner: -
--

CREATE UNIQUE INDEX idx_house_orders_tx_hash ON bsc.house_orders USING btree (lower((tx_hash)::text)) WHERE (NOT deleted);


--
-- Name: hero_orders_amount_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_amount_index ON polygon.hero_orders USING btree (amount) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_block_timestamp_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_block_timestamp_index ON polygon.hero_orders USING btree (block_timestamp) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_bomb_power_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_bomb_power_index ON polygon.hero_orders USING btree (updated_at) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_buyer_wallet_address_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_buyer_wallet_address_index ON polygon.hero_orders USING btree (buyer_wallet_address);


--
-- Name: hero_orders_rarity_amount_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_rarity_amount_index ON polygon.hero_orders USING btree (rarity, amount) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_rarity_level_amount_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_rarity_level_amount_index ON polygon.hero_orders USING btree (rarity, level, amount) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_rarity_token_id_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_rarity_token_id_index ON polygon.hero_orders USING btree (rarity, token_id) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: hero_orders_seller_wallet_address_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_seller_wallet_address_index ON polygon.hero_orders USING btree (seller_wallet_address);


--
-- Name: hero_orders_status_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_status_index ON polygon.hero_orders USING btree (status) WHERE (deleted = false);


--
-- Name: hero_orders_updated_at_index; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX hero_orders_updated_at_index ON polygon.hero_orders USING btree (updated_at) WHERE (((status)::text = 'listing'::text) AND (deleted = false));


--
-- Name: idx_hero_abilities_hero_skill; Type: INDEX; Schema: polygon; Owner: -
--

CREATE UNIQUE INDEX idx_hero_abilities_hero_skill ON polygon.hero_abilities USING btree (hero_token_id, ability_token_id) WHERE (NOT deleted);


--
-- Name: idx_hero_orders_buyer_wallet_address; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_hero_orders_buyer_wallet_address ON polygon.hero_orders USING btree (lower((buyer_wallet_address)::text));


--
-- Name: idx_hero_orders_level; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_hero_orders_level ON polygon.hero_orders USING btree (level) WHERE (NOT deleted);


--
-- Name: idx_hero_orders_rarity; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_hero_orders_rarity ON polygon.hero_orders USING btree (rarity) WHERE (NOT deleted);


--
-- Name: idx_hero_orders_seller_wallet_address; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_hero_orders_seller_wallet_address ON polygon.hero_orders USING btree (lower((seller_wallet_address)::text));


--
-- Name: idx_hero_orders_token_id; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_hero_orders_token_id ON polygon.hero_orders USING btree (token_id) WHERE (NOT deleted);


--
-- Name: idx_hero_orders_tx_hash; Type: INDEX; Schema: polygon; Owner: -
--

CREATE UNIQUE INDEX idx_hero_orders_tx_hash ON polygon.hero_orders USING btree (lower((tx_hash)::text)) WHERE (NOT deleted);


--
-- Name: idx_house_orders_buyer_wallet_address; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_house_orders_buyer_wallet_address ON polygon.house_orders USING btree (lower((buyer_wallet_address)::text));


--
-- Name: idx_house_orders_capacity; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_house_orders_capacity ON polygon.house_orders USING btree (capacity) WHERE (NOT deleted);


--
-- Name: idx_house_orders_rarity; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_house_orders_rarity ON polygon.house_orders USING btree (rarity) WHERE (NOT deleted);


--
-- Name: idx_house_orders_seller_wallet_address; Type: INDEX; Schema: polygon; Owner: -
--

CREATE INDEX idx_house_orders_seller_wallet_address ON polygon.house_orders USING btree (lower((seller_wallet_address)::text));


--
-- Name: idx_house_orders_tx_hash; Type: INDEX; Schema: polygon; Owner: -
--

CREATE UNIQUE INDEX idx_house_orders_tx_hash ON polygon.house_orders USING btree (lower((tx_hash)::text)) WHERE (NOT deleted);


--
-- PostgreSQL database dump complete
--

\unrestrict VB15RbISxfSDsw8h7DJL6PR73N9Xx1iLTgxRu41cdxh45WhlwxUbGFUDOc2n7ld

