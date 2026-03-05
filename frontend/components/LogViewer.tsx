import React, { useEffect, useState, useCallback } from 'react';
import {
  getLogs,
  getLogStats,
  clearLogs,
  getRiskControlLogs,
  getAdminLogs,
  getLoginLogs,
  getUserSetting,
  setUserSetting,
  LogStats,
  RiskControlLog,
  LoginLog
} from '../services/api';
import {
  FileText,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Info,
  XCircle,
  Bug,
  Search,
  Loader2,
  Settings,
  Activity,
  LogIn
} from 'lucide-react';

type LogLevel = 'all' | 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

interface ParsedLog {
  time: string;
  level: string;
  source: string;
  message: string;
  raw: string;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [riskLogs, setRiskLogs] = useState<RiskControlLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'admin' | 'risk' | 'login'>('system');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [loginActionFilter, setLoginActionFilter] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 解析日志 - 后端返回的是字典格式
  const parseLogEntry = (entry: any): ParsedLog => {
    if (typeof entry === 'object' && entry !== null) {
      // 字典格式: {timestamp, level, source, function, line, message}
      return {
        time: entry.timestamp || '',
        level: entry.level || 'UNKNOWN',
        source: entry.source || 'unknown',
        message: entry.message || '',
        raw: JSON.stringify(entry)
      };
    }
    // 字符串格式（备用）
    const line = String(entry);
    const match = line.match(/^(\d{4}-\d{2}-\d{2}T?\s*\d{2}:\d{2}:\d{2}[\d.]*)\s*\|\s*(\w+)\s*\|\s*([^|]*)\s*\|\s*(.*)$/);
    if (match) {
      return {
        time: match[1],
        level: match[2],
        source: match[3].trim(),
        message: match[4],
        raw: line
      };
    }
    return {
      time: line.substring(0, 19),
      level: 'UNKNOWN',
      source: 'unknown',
      message: line,
      raw: line
    };
  };

  // 获取日志级别颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-500';
      case 'WARNING': return 'text-yellow-500';
      case 'ERROR': return 'text-red-500';
      case 'DEBUG': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  // 获取日志级别图标
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'INFO': return <Info className="w-4 h-4 text-blue-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'ERROR': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'DEBUG': return <Bug className="w-4 h-4 text-gray-500" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  // 加载日志
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      // 获取日志统计（仅系统日志需要）
      if (activeTab === 'system' || activeTab === 'admin') {
        const statsRes = await getLogStats();
        if (statsRes.success) {
          setStats(statsRes.stats);
          setIsAdmin(statsRes.is_admin);
        }
      } else {
        // 对于其他 tab，设置 isAdmin 为 true 因为需要管理员权限
        setIsAdmin(true);
      }

      // 获取日志列表
      if (activeTab === 'system') {
        const logsRes = await getLogs(200, levelFilter === 'all' ? undefined : levelFilter);
        if (logsRes && logsRes.logs) {
          const parsed = logsRes.logs.map(parseLogEntry);
          setLogs(parsed);
        }
      } else if (activeTab === 'admin') {
        const logsRes = await getAdminLogs(200, levelFilter === 'all' ? undefined : levelFilter);
        if (logsRes && logsRes.logs) {
          const parsed = logsRes.logs.map(parseLogEntry);
          setLogs(parsed);
        }
      } else if (activeTab === 'risk') {
        // 风控日志
        const riskRes = await getRiskControlLogs(undefined, 100, 0);
        if (riskRes.success) {
          setRiskLogs(riskRes.data);
        }
      } else if (activeTab === 'login') {
        // 登录日志
        const loginRes = await getLoginLogs(undefined, loginActionFilter === 'all' ? undefined : loginActionFilter, 100, 0);
        if (loginRes.success) {
          setLoginLogs(loginRes.data);
        }
      }
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, levelFilter, loginActionFilter]);

  // 加载刷新间隔配置
  useEffect(() => {
    getUserSetting('log_refresh_interval').then(res => {
      if (res.success && res.value) {
        setRefreshInterval(parseInt(res.value, 10));
      }
    });
  }, []);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // 刷新触发
  useEffect(() => {
    loadLogs();
  }, [loadLogs, refreshKey]);

  // 处理刷新间隔变更
  const handleIntervalChange = async (value: number) => {
    setRefreshInterval(value);
    await setUserSetting('log_refresh_interval', String(value));
  };

  // 清空日志
  const handleClearLogs = async () => {
    if (!window.confirm('确定要清空所有日志吗？此操作不可恢复。')) return;
    try {
      const res = await clearLogs();
      if (res.success) {
        alert('日志已清空');
        loadLogs();
      } else {
        alert(res.message || '清空失败');
      }
    } catch (error) {
      alert('清空失败: ' + (error as Error).message);
    }
  };

  // 过滤日志
  const filteredLogs = levelFilter === 'all'
    ? logs
    : logs.filter(log => log.level === levelFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">系统日志</h2>
            <p className="text-sm text-gray-500">
              {isAdmin ? '管理员视图 - 查看全部日志' : '仅显示与您相关的操作日志'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 刷新按钮 */}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>

          {/* 清空日志按钮 - 仅管理员 */}
          {isAdmin && (
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空日志
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-800">{stats.total_logs}</div>
            <div className="text-sm text-gray-500">总日志数</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-500">{stats.level_counts?.INFO || 0}</div>
            <div className="text-sm text-gray-500">INFO</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-yellow-500">{stats.level_counts?.WARNING || 0}</div>
            <div className="text-sm text-gray-500">WARNING</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-red-500">{stats.level_counts?.ERROR || 0}</div>
            <div className="text-sm text-gray-500">ERROR</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-500">{stats.level_counts?.DEBUG || 0}</div>
            <div className="text-sm text-gray-500">DEBUG</div>
          </div>
        </div>
      )}

      {/* Tab 切换 - 管理员 */}
      {isAdmin && (
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            系统日志
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            管理员日志
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'login' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LogIn className="w-4 h-4 inline mr-2" />
            登录日志
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'risk' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            风控日志
          </button>
        </div>
      )}

      {/* 筛选和设置栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          {/* 级别筛选 */}
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部级别</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            共 {activeTab === 'risk' ? riskLogs.length : filteredLogs.length} 条日志
          </div>
        </div>

        {/* 自动刷新设置 */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            自动刷新
          </label>

          {autoRefresh && (
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <select
                value={refreshInterval}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30">30秒</option>
                <option value="60">60秒</option>
                <option value="120">2分钟</option>
                <option value="300">5分钟</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : activeTab === 'login' ? (
          // 登录日志表格
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-gray-100">
              <select
                value={loginActionFilter}
                onChange={(e) => setLoginActionFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部操作</option>
                <option value="login">登录</option>
                <option value="logout">登出</option>
                <option value="login_failed">登录失败</option>
              </select>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">账号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP地址</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loginLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无登录日志</td>
                  </tr>
                ) : (
                  loginLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{log.created_at}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{log.username}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.action === 'login' ? 'bg-green-100 text-green-700' :
                          log.action === 'logout' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.action === 'login' ? '登录' : log.action === 'logout' ? '登出' : '登录失败'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.status === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.ip_address || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={log.user_agent}>
                        {log.user_agent ? log.user_agent.substring(0, 50) + (log.user_agent.length > 50 ? '...' : '') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'risk' ? (
          // 风控日志表格
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">账号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">事件类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">消息</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {riskLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无风控日志</td>
                  </tr>
                ) : (
                  riskLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{log.created_at}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.cookie_id}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">{log.event_type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{log.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // 系统日志表格
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">级别</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">来源</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">内容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无日志</td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-500 font-mono">{log.time}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <span className={`text-sm font-medium ${getLevelColor(log.level)}`}>{log.level}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{log.source}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 font-mono whitespace-pre-wrap break-all">{log.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
