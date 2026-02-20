-- Create Osama as a normal user (Fixed Constraint Error)
DO $$
DECLARE
  _uid UUID;
  _email TEXT := 'osamamuthafar167@gmail.com';
  _pass TEXT := '12345678';
BEGIN
  -- 1. Check if user already exists
  SELECT id INTO _uid FROM auth.users WHERE email = _email;

  IF _uid IS NULL THEN
    _uid := gen_random_uuid();
    
    -- 2. Create User in auth.users
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, instance_id)
    VALUES (_uid, _email, extensions.crypt(_pass, extensions.gen_salt('bf')), now(), 'authenticated', '00000000-0000-0000-0000-000000000000');

    -- 3. Link Email Identity
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (_uid, _uid, format('{"sub":"%s","email":"%s"}', _uid, _email)::jsonb, 'email', now(), now(), now());

    -- 4. Add to Public Profile
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (_uid, 'Osama');

    RAISE NOTICE 'User created with ID: %', _uid;
  ELSE
    RAISE NOTICE 'User already exists with ID: %', _uid;
  END IF;
END $$;
