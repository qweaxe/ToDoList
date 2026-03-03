import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          ToDo List
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 日视图入口 */}
          <Link 
            href="/day"
            className="glass-card p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-2">📅 日视图</h2>
            <p className="text-gray-600">查看和管理今天的任务</p>
          </Link>
          
          {/* 周视图入口 */}
          <Link 
            href="/week"
            className="glass-card p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-2">📊 周视图</h2>
            <p className="text-gray-600">查看本周任务概览</p>
          </Link>
          
          {/* 月视图入口 */}
          <Link 
            href="/month"
            className="glass-card p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-2">🗓️ 月视图</h2>
            <p className="text-gray-600">日历形式查看整月任务</p>
          </Link>
          
          {/* 季度视图入口 */}
          <Link 
            href="/quarter"
            className="glass-card p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-2">🎯 季度视图</h2>
            <p className="text-gray-600">查看季度里程碑</p>
          </Link>
          
          {/* 年度视图入口 */}
          <Link 
            href="/year"
            className="glass-card p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-2">📈 年度视图</h2>
            <p className="text-gray-600">年度热力图和统计</p>
          </Link>
          
          {/* 设置入口 */}
          <Link 
            href="/settings"
            className="glass-card p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-2">⚙️ 设置</h2>
            <p className="text-gray-600">管理分类和等级</p>
          </Link>
        </div>
      </div>
    </main>
  );
}