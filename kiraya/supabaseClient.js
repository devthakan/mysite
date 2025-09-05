// supabaseClient.js
// ⛳️ अपनी प्रोजेक्ट वैल्यू भरें:
const SUPABASE_URL = "https://sjfglhxjdyvcygunijvz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmdsaHhqZHl2Y3lndW5panZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMDcsImV4cCI6MjA3MDgyNTIwN30.HduOuf_wdZ4iHHNN26ECilX_ALCHfnPPC07gYPN2tsM";

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
