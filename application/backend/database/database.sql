CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_role VARCHAR(255) NOT NULL,
    organisations VARCHAR(255)[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (first_name, email, user_role, organisations)
VALUES ('John', 'johndoe@example.com', 'Admin', '{"Company A", "Company B"}'),
    ('Jane', 'janesmith@example.com', 'User', '{"Company C"}'),
    ('Alice', 'alicejohnson@example.com', 'Guest', '{"Company D", "Company E"}'),
    ('Bob', 'bobbrown@example.com', 'Admin', '{"Company F"}'),
    ('Emily', 'emilydavis@example.com', 'User', '{"Company G", "Company H"}'),
    ('Michael', 'michaelwilson@example.com', 'Guest', '{"Company I"}');
