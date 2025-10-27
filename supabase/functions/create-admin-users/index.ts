import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AdminUser {
  email: string;
  password: string;
  fullName: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const adminUsers: AdminUser[] = [
      {
        email: 'admin@hmos-platform.com',
        password: 'Admin@HMOS2024!Secure',
        fullName: 'Primary Administrator',
      },
      {
        email: 'chiefadmin@hmos-platform.com',
        password: 'ChiefAdmin@HMOS2024!Secure',
        fullName: 'Chief Administrator',
      },
      {
        email: 'superadmin@hmos-platform.com',
        password: 'SuperAdmin@HMOS2024!Secure',
        fullName: 'Super Administrator',
      },
    ];

    const results = [];

    for (const admin of adminUsers) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser?.users.find((u) => u.email === admin.email);

      if (!userExists) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
        });

        if (authError) {
          results.push({ email: admin.email, status: 'error', message: authError.message });
          continue;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: admin.fullName,
            email: admin.email,
            role: 'admin',
            status: 'active',
            email_verified: true,
            country: 'Global',
          });

        if (profileError) {
          results.push({ email: admin.email, status: 'error', message: profileError.message });
          continue;
        }

        results.push({ email: admin.email, status: 'created', userId: authData.user.id });
      } else {
        results.push({ email: admin.email, status: 'already_exists' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
