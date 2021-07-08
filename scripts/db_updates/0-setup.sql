-- creating SNOWFLAKE domain
CREATE DOMAIN SNOWFLAKE AS
  VARCHAR(20)
  NOT NULL
  CHECK (value ~ '^\d{1,20}$');

-- creating guilds table
CREATE TABLE guilds (
  id SNOWFLAKE PRIMARY KEY,
  prefix VARCHAR(16)
);