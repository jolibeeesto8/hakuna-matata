import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqexktlbepcnvqhnlhwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZXhrdGxiZXBjbnZxaG5saHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDI2MTYsImV4cCI6MjA3NjY3ODYxNn0.Trjup-XhWozjG2M4cqTsepiaL8U-goOSWVaa_RiZ22o';

const supabase = createClient(supabaseUrl, supabaseKey);

const admins = [
  { email: 'eliudmaina1@gmail.com', password: 'eliud342', fullName: 'Admin 1', country: 'Kenya' },
  { email: 'admin2@hmos.com', password: 'admin123', fullName: 'Admin 2', country: 'United States' },
  { email: 'admin3@hmos.com', password: 'admin456', fullName: 'Admin 3', country: 'United Kingdom' }
];

async function createAdmins() {
  for (const admin of admins) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: admin.email,
        password: admin.password,
      });

      if (authError) {
        console.log(`Error creating ${admin.email}:`, authError.message);
        continue;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: admin.fullName,
            country: admin.country,
            role: 'admin',
            status: 'active',
          });

        if (profileError) {
          console.log(`Error creating profile for ${admin.email}:`, profileError.message);
        } else {
          const { error: walletError } = await supabase
            .from('wallets')
            .upsert({
              user_id: authData.user.id,
            });

          if (walletError) {
            console.log(`Error creating wallet for ${admin.email}:`, walletError.message);
          } else {
            console.log(`✓ Created admin: ${admin.email}`);
          }
        }
      }
    } catch (error: any) {
      console.log(`Error with ${admin.email}:`, error.message);
    }
  }
}

createAdmins();
