'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Loader2, Shield, School } from 'lucide-react';
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
    <div className="min-h-screen flex" dir="rtl">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #059669 40%, #047857 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 bg-white" />
          <div className="absolute top-1/3 -left-16 w-64 h-64 rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-10 right-1/4 w-40 h-40 rounded-full opacity-5 bg-white" />
          <div className="absolute top-10 left-1/3 w-24 h-24 rounded-full opacity-8 bg-white" />
          <div className="absolute bottom-1/3 right-10 w-32 h-32 rounded-full opacity-5 bg-white" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />
        </div>

        <div className="relative z-10 text-center text-white max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-24 h-24 rounded-2xl mx-auto mb-8 flex items-center justify-center bg-white/15 backdrop-blur-sm shadow-xl">
              <School className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 tracking-tight">مدرستي Pro</h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              نظام إدارة مدرسية متكامل
              <br />
              حضور ذكي · درجات دقيقة · تقارير شاملة
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>آمن</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>ذكي</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>سريع</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right login form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
            >
              <School className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#0d9488' }}>مدرستي Pro</h2>
            <p className="text-sm text-muted-foreground mt-1">نظام إدارة المدرسة</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="text-2xl font-bold text-gray-800">
                  تسجيل الدخول
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardDescription className="text-base mt-1">
                  أدخل بياناتك للوصول إلى النظام
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">⚠️</span>
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 font-medium text-sm">
                    اسم المستخدم
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      className="h-12 text-base border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 rounded-xl pr-4 pl-10"
                      required
                      disabled={loading}
                      dir="rtl"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="h-12 text-base border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 rounded-xl pr-4 pl-12"
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
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] rounded-xl"
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

                {/* Quick access hints */}
                <div className="mt-4 p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                  <p className="text-xs text-teal-700 font-medium mb-2">للتجربة السريعة:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-teal-600">
                    <div>المدير: <code className="bg-teal-100 px-1 rounded">admin</code></div>
                    <div>كلمة المرور: <code className="bg-teal-100 px-1 rounded">admin123</code></div>
                  </div>
                </div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center mt-6 pt-4 border-t border-gray-100"
              >
                <p className="text-xs text-muted-foreground">من تطوير</p>
                <p className="text-sm font-bold tracking-wider" style={{ color: '#0d9488' }}>
                  Vision
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
