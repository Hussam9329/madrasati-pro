'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LoginPageProps {
  onLogin: (user: { id: string; username: string; name: string; role: string }, token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ في تسجيل الدخول');
        return;
      }

      onLogin(
        {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          role: data.user.role,
        },
        data.token
      );
    } catch {
      setError('تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #059669 50%, #047857 100%)',
      }}
      dir="rtl"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'white' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'white' }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full opacity-5"
          style={{ background: 'white' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #0d9488, #059669)',
              }}
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl font-bold" style={{ color: '#0d9488' }}>
                مدرستي Pro
              </CardTitle>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardDescription className="text-base mt-2 text-gray-600">
                نظام إدارة المدرسة
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="h-12 text-base border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
                  required
                  disabled={loading}
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="h-12 text-base border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 pl-12"
                    required
                    disabled={loading}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #059669)',
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mt-6 pt-4 border-t border-gray-100"
            >
              <p className="text-xs text-gray-400">من تطوير Vision</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
