import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Mail, Lock, User, KeyRound, ShieldCheck } from 'lucide-react';
import { register, sendVerificationCode, getGeetestConfig } from '../services/api';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    verificationCode: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordPattern, setPasswordPattern] = useState('(?=.*[0-9])(?=.*[a-zA-Z]).{8,20}');
  const [passwordHint, setPasswordHint] = useState('8-20位，含字母和数字');
  const [geetestLoaded, setGeetestLoaded] = useState(false);
  const [geetestChallenge, setGeetestChallenge] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 加载密码规则和极验配置
  useEffect(() => {
    loadPasswordPattern();
    loadGeetestConfig();
  }, []);

  const loadPasswordPattern = async () => {
    try {
      const res = await fetch('/system-settings/password_pattern');
      if (res.ok) {
        const data = await res.json();
        if (data.value) {
          setPasswordPattern(data.value);
        }
      }
      // 加载密码提示
      const hintRes = await fetch('/system-settings/password_hint');
      if (hintRes.ok) {
        const hintData = await hintRes.json();
        if (hintData.value) {
          setPasswordHint(hintData.value);
        }
      }
    } catch (e) {
      // 使用默认值
    }
  };

  const loadGeetestConfig = async () => {
    try {
      const res = await getGeetestConfig();
      if (res.success && res.data) {
        // 动态加载极验 JS
        const script = document.createElement('script');
        script.src = 'https://static.geetest.com/static/js/gt.js';
        script.onload = () => setGeetestLoaded(true);
        document.head.appendChild(script);
      }
    } catch (e) {
      console.error('加载极验失败', e);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 用户名验证：3-20字符，字母数字下划线
    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = '用户名长度需为3-20字符';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '仅支持字母、数字、下划线';
    }

    // 邮箱验证
    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 验证码验证
    if (!formData.verificationCode) {
      newErrors.verificationCode = '请输入验证码';
    } else if (!/^\d{6}$/.test(formData.verificationCode)) {
      newErrors.verificationCode = '验证码为6位数字';
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else {
      try {
        const regex = new RegExp(passwordPattern);
        if (!regex.test(formData.password)) {
          newErrors.password = '密码格式不符合要求';
        }
      } catch (e) {
        newErrors.password = '密码格式不正确';
      }
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    if (!formData.email) {
      setErrors({ ...errors, email: '请先输入邮箱' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ ...errors, email: '请输入有效的邮箱地址' });
      return;
    }

    setSendingCode(true);
    try {
      const res = await sendVerificationCode(formData.email, 'register');
      if (res.success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (e) {
      setErrors({ ...errors, email: '发送验证码失败' });
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        verification_code: formData.verificationCode,
      });

      if (res.success) {
        alert('注册成功！请登录');
        onSwitchToLogin();
      } else {
        setErrors({ submit: res.message || '注册失败' });
      }
    } catch (e: any) {
      setErrors({ submit: e.message || '注册失败，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] p-4 relative overflow-hidden font-sans">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-yellow-200/40 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-200/30 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="bg-white/80 backdrop-blur-3xl p-8 md:p-12 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] w-full max-w-lg border border-white relative z-10 animate-fade-in">

        {/* Back to Login */}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="absolute left-6 top-6 flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">返回登录</span>
        </button>

        {/* Header with Logo */}
        <div className="text-center mb-10 mt-4">
           <div className="w-24 h-24 bg-[#FFE815] rounded-[2rem] flex items-center justify-center shadow-xl shadow-yellow-200 mx-auto mb-6 transform rotate-[-6deg] hover:rotate-0 transition-all duration-500 cursor-pointer group">
              <span className="text-black font-extrabold text-5xl group-hover:scale-110 transition-transform">闲</span>
           </div>
           <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">创建账号</h2>
           <p className="text-gray-500 font-medium">闲鱼智能自动发货与管家系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">用户名</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                placeholder="3-20位字母、数字、下划线"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                maxLength={20}
                className={`w-full ios-input pl-14 pr-6 py-4.5 rounded-2xl text-base h-14 ${errors.username ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs ml-1">{errors.username}</p>}
          </div>

          {/* 邮箱 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">邮箱</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
              <input
                type="email"
                placeholder="用于接收验证码"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full ios-input pl-14 pr-6 py-4.5 rounded-2xl text-base h-14 ${errors.email ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0 || sendingCode}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#FFE815] text-black text-sm font-medium rounded-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
            {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email}</p>}
          </div>

          {/* 验证码 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">邮箱验证码</label>
            <div className="relative group">
              <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                placeholder="6位数字验证码"
                value={formData.verificationCode}
                onChange={(e) => handleChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className={`w-full ios-input pl-14 pr-6 py-4.5 rounded-2xl text-base h-14 ${errors.verificationCode ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.verificationCode && <p className="text-red-500 text-xs ml-1">{errors.verificationCode}</p>}
          </div>

          {/* 密码 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">密码</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
              <input
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full ios-input pl-14 pr-6 py-4.5 rounded-2xl text-base h-14 ${errors.password ? 'border-red-500' : ''}`}
              />
            </div>
            <p className="text-xs text-gray-400">密码规则：{passwordHint}</p>
            {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password}</p>}
          </div>

          {/* 确认密码 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">确认密码</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
              <input
                type="password"
                placeholder="再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={`w-full ios-input pl-14 pr-6 py-4.5 rounded-2xl text-base h-14 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs ml-1">{errors.confirmPassword}</p>}
          </div>

          {/* 错误提示 */}
          {errors.submit && (
            <div className="p-3 rounded-xl bg-red-50 text-red-500 text-sm text-center font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {errors.submit}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full ios-btn-primary h-14 rounded-2xl text-lg shadow-xl shadow-yellow-200 mt-4 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>创建账号</>}
          </button>

          {/* 切换登录 */}
          <div className="mt-4 text-center">
            <span className="text-gray-500">已有账号？</span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#FFE815] font-medium hover:underline ml-1"
            >
              立即登录
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
           <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">
              Xianyu Auto-Dispatch Pro v2.5
           </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
