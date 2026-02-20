-- MASTER LOGIN FIX (Fixed Identity Constraint Issue)
DO $$
DECLARE
  _email TEXT := 'osamamuthafar167@gmail.com';
  _pass TEXT := '12345678';
  _uid UUID;
  _id_exists BOOLEAN;
BEGIN
  -- 1. Find the user
  SELECT id INTO _uid FROM auth.users WHERE email = _email;

  IF _uid IS NOT NULL THEN
    -- 2. Force confirm and reset password
    UPDATE auth.users
    SET 
      email_confirmed_at = now(),
      encrypted_password = extensions.crypt(_pass, extensions.gen_salt('bf')),
      updated_at = now()
    WHERE id = _uid;

    -- 3. Ensure Identity exists (Critical for login)
    SELECT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = _uid AND provider = 'email') INTO _id_exists;
    
    IF NOT _id_exists THEN
      INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (_uid, _uid, format('{"sub":"%s","email":"%s"}', _uid, _email)::jsonb, 'email', now(), now(), now());
    END IF;

    RAISE NOTICE 'SUCCESS: Account for % is now confirmed and password is set to %', _email, _pass;
  ELSE
    RAISE NOTICE 'ERROR: User % not found.', _email;
  END IF;
END $$;
