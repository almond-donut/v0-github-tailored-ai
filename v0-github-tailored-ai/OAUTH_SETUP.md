# GitHub OAuth Setup dengan Supabase

## Masalah yang Diperbaiki

Aplikasi ini sebelumnya menggunakan implementasi OAuth kustom yang menyebabkan error "The redirect_uri is not associated with this application." Sekarang telah diperbaiki untuk menggunakan built-in OAuth Supabase.

## Konfigurasi yang Diperlukan

### 1. Supabase Dashboard
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Authentication** > **Providers**
4. Aktifkan **GitHub** provider
5. Masukkan:
   - **Client ID**: `Ov23liaOcBS8zuFJCGyG` (dari screenshot)
   - **Client Secret**: `b5e2c958fe8415f477d90afc9482d3329b6e552` (dari screenshot)

### 2. GitHub OAuth App Settings
1. Buka [GitHub Developer Settings](https://github.com/settings/developers)
2. Pilih OAuth App Anda
3. Update **Authorization callback URL** menjadi:
   ```
   https://qhoqcuvdgueeisqhkqio.supabase.co/auth/v1/callback
   ```
   
   **PENTING**: URL callback harus menggunakan format Supabase, bukan `/api/github/callback` seperti sebelumnya.

### 3. Environment Variables
Buat file `.env.local` dengan:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qhoqcuvdgueeisqhkqio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob3FjdXZkZ3VlZWlzcWhrcWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDkxMTksImV4cCI6MjA2ODY4NTExOX0.e5ibUs6zWfPQ1et1BCWx22KWdw5Q1hhAyiLnCxQchzI
```

## Perubahan yang Dilakukan

### 1. HomePage (`app/page.tsx`)
- ✅ Mengganti implementasi OAuth kustom dengan `supabase.auth.signInWithOAuth()`
- ✅ Menghapus logika manual untuk membuat URL GitHub OAuth
- ✅ Menggunakan `redirectTo: '/dashboard'` untuk redirect otomatis

### 2. AuthProvider (`components/auth-provider.tsx`)
- ✅ Membuat context untuk mengelola state authentication
- ✅ Menangani `onAuthStateChange` untuk update otomatis
- ✅ Membuat/update user profile otomatis saat login berhasil

### 3. Layout (`app/layout.tsx`)
- ✅ Menambahkan `AuthProvider` wrapper

### 4. Endpoint Cleanup
- ✅ Menghapus `/api/github/callback` yang tidak diperlukan
- ✅ Supabase menangani callback secara otomatis

## Testing OAuth Flow

1. Jalankan aplikasi: `npm run dev`
2. Buka `http://localhost:3000`
3. Klik tombol "Connect GitHub"
4. Anda akan diarahkan ke GitHub untuk authorization
5. Setelah approve, akan redirect ke `/dashboard`

## Troubleshooting

### Error: "The redirect_uri is not associated with this application"
- Pastikan callback URL di GitHub OAuth App adalah: `https://qhoqcuvdgueeisqhkqio.supabase.co/auth/v1/callback`
- Jangan gunakan `http://localhost:3001/api/github/callback`

### Error: "Invalid client_id"
- Pastikan Client ID di Supabase Dashboard sama dengan yang di GitHub OAuth App

### User tidak ter-create di database
- Periksa tabel `user_profiles` di Supabase
- AuthProvider akan otomatis membuat profile saat login pertama kali

## Database Schema

Pastikan tabel `user_profiles` memiliki struktur:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  github_username TEXT,
  github_id BIGINT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
