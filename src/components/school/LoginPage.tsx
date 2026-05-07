'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Loader2, Shield, School, Sparkles } from 'lucide-react';
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
  const [typedText, setTypedText] = useState('');
  const welcomeText = 'مرحباً بك';

  // Typing animation for welcome text
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= welcomeText.length) {
        setTypedText(welcomeText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 120);
    return () => clearInterval(timer);
  }, []);

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

  // Floating shapes data
  const floatingShapes = [
    { type: 'circle', size: 60, x: '10%', y: '15%', delay: 0, duration: 8 },
    { type: 'square', size: 40, x: '85%', y: '20%', delay: 1, duration: 10 },
    { type: 'circle', size: 30, x: '70%', y: '70%', delay: 2, duration: 7 },
    { type: 'square', size: 50, x: '20%', y: '75%', delay: 0.5, duration: 9 },
    { type: 'circle', size: 25, x: '50%', y: '85%', delay: 1.5, duration: 11 },
    { type: 'square', size: 35, x: '90%', y: '50%', delay: 3, duration: 8.5 },
    { type: 'circle', size: 45, x: '40%', y: '10%', delay: 2.5, duration: 9.5 },
    { type: 'square', size: 20, x: '15%', y: '55%', delay: 0.8, duration: 7.5 },
  ];

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 40%, #1e40af 100%)',
        }}
      >
        {/* Gradient mesh background */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.4) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-20 right-1/4 w-[350px] h-[350px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-10 left-1/3 w-[200px] h-[200px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(110,231,183,0.3) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/3 right-10 w-[250px] h-[250px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }} />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />
        </div>

        {/* Floating geometric shapes */}
        {floatingShapes.map((shape, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: shape.x, top: shape.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.15, 0.1, 0.15],
              scale: [0.8, 1, 0.9, 1],
              y: [0, -20, 10, -20],
              x: [0, 10, -5, 10],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: shape.delay,
            }}
          >
            {shape.type === 'circle' ? (
              <div
                className="rounded-full border-2 border-white/20"
                style={{ width: shape.size, height: shape.size }}
              />
            ) : (
              <div
                className="rounded-md border-2 border-white/15"
                style={{ width: shape.size, height: shape.size }}
              />
            )}
          </motion.div>
        ))}

        <div className="relative z-10 text-center text-white max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-24 h-24 rounded-2xl mx-auto mb-8 flex items-center justify-center bg-white/15 backdrop-blur-sm shadow-xl border border-white/20">
              <School className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 tracking-tight">مدرستي</h1>
            {/* Typing animation for welcome text */}
            <div className="h-10 flex items-center justify-center mb-4">
              <span className="text-2xl font-light text-white/90">
                {typedText}
              </span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-0.5 h-7 bg-white/70 mr-1"
              />
            </div>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              حضور ذكي بالـ QR · درجات دقيقة · جدول بدون تضاربات
            </p>
            {/* Glassmorphism feature badges */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Shield className="w-4 h-4 text-emerald-300" />
                <span className="text-white/90 font-medium">آمن</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                </span>
                <GraduationCap className="w-4 h-4 text-teal-300" />
                <span className="text-white/90 font-medium">ذكي</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span className="text-white/90 font-medium">سريع</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right login form panel - with gradient mesh background */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        {/* Gradient mesh behind login card */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-30 dark:opacity-10" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] opacity-25 dark:opacity-10" style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20 dark:opacity-5" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 60%)' }} />
        </div>

        {/* Floating shapes on right panel */}
        <motion.div
          className="absolute top-[15%] right-[10%] w-16 h-16 rounded-full border border-blue-200/30 dark:border-blue-700/20"
          animate={{ y: [0, -15, 0], rotate: [0, 90, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[20%] left-[8%] w-12 h-12 rounded-md border border-blue-200/30 dark:border-blue-700/20"
          animate={{ y: [0, 12, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-[60%] right-[5%] w-8 h-8 rounded-full bg-blue-100/20 dark:bg-blue-900/10"
          animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              <School className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#2563eb' }}>مدرستي</h2>
            <p className="text-sm text-muted-foreground mt-1">نظام إدارة المدرسة</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl relative overflow-hidden">
            {/* Gradient top accent */}
            <div className="absolute top-0 inset-x-0 h-1" style={{ background: 'linear-gradient(90deg, #2563eb, #1d4ed8, #2563eb)' }} />
            
            {/* Shimmer effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                width: '50%',
              }}
            />
            <CardHeader className="text-center pb-2 pt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  تسجيل الدخول
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardDescription className="text-base mt-1 dark:text-gray-400">
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
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">⚠️</span>
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                    اسم المستخدم
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      autoComplete="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      className="h-12 text-base border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl pr-4 pl-10 dark:bg-gray-800/50 dark:text-gray-100"
                      required
                      disabled={loading}
                      dir="rtl"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      autoComplete="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="h-12 text-base border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl pr-4 pl-12 dark:bg-gray-800/50 dark:text-gray-100"
                      required
                      disabled={loading}
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Enhanced login button with shimmer */}
                <div className="relative overflow-hidden rounded-xl">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold text-white transition-all duration-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] rounded-xl relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 relative z-10">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري تسجيل الدخول...
                      </span>
                    ) : (
                      <span className="relative z-10">تسجيل الدخول</span>
                    )}
                    {/* Shimmer/loading effect on button */}
                    {loading && (
                      <motion.div
                        className="absolute inset-0"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          width: '50%',
                        }}
                      />
                    )}
                  </Button>
                </div>

                {/* Quick access hints */}
                <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-2">للتجربة السريعة:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <div>المدير: <code className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-300">admin</code></div>
                    <div>كلمة المرور: <code className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-300">admin123</code></div>
                  </div>
                </div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-800"
              >
                <p className="text-xs text-muted-foreground mb-1">من تطوير</p>
                <p className="text-base font-extrabold tracking-[0.2em]" style={{ color: '#2563eb' }}>
                  مدرستي
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
