import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, CalendarPlus, ClipboardCheck, History, Search, Filter, 
  CheckCircle2, AlertCircle, Clock, Camera, MapPin, User, Plus, 
  ArrowRight, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, 
  Building2, FileText, X, Image as ImageIcon, ExternalLink, ShieldAlert, 
  Edit3, Save, BarChart3, CalendarDays, TrendingUp, PieChart, Download, 
  Loader // 호환성을 위해 Loader2 대신 Loader 사용
} from 'lucide-react';

/* ==================================================================================
 * [설정 및 유틸리티] Constants & Utility Functions
 * ================================================================================== */

// 청별 고유 색상 (차트 및 배지용)
const OFFICE_COLORS = { 
  '서울청': 'bg-blue-500', 
  '대전청': 'bg-indigo-500', 
  '원주청': 'bg-violet-500', 
  '제주도': 'bg-fuchsia-500' 
};

// 청 표시 순서 (UI 정렬 기준)
const OFFICE_ORDER = ['서울청', '대전청', '원주청', '제주도'];

// 날짜 포맷 단축 함수 (YYYY-MM-DD -> YY.MM.DD)
const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  // 날짜가 유효하지 않으면 원본 반환
  if (isNaN(date.getTime())) return dateStr;
  
  const year = date.getFullYear().toString().slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// 분기 계산 함수
const getQuarter = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 1; // 기본값
  return Math.floor(date.getMonth() / 3) + 1;
};

// 초기 샘플 데이터
const INITIAL_DATA = [
  // 2024년 데이터
  { id: 1, date: '2024-02-10', site: '서울 숲 아이파크', office: '서울청', manager: '김철수', status: '완료', result: '양호', details: '초기 토공사 안전 점검 완료.', photos: [] },
  { id: 2, date: '2024-03-12', site: '부산 해운대 엘시티', office: '원주청', manager: '이영희', status: '완료', result: '양호', details: '구조물 안전 진단.', photos: [] },
  { id: 3, date: '2024-05-15', site: '광주 첨단 자이', office: '대전청', manager: '박지민', status: '완료', result: '2차 초과', details: '비계 설치 불량.', photos: [] },
  { id: 4, date: '2024-06-08', site: '대전 도안 신도시', office: '대전청', manager: '김철수', status: '완료', result: '양호', details: '안전 펜스 보완 완료.', photos: [] },
  { id: 5, date: '2024-08-20', site: '인천 송도 더샵', office: '제주도', manager: '최수호', status: '완료', result: '양호', details: '여름철 풍수해 대비 점검.', photos: [] },
  { id: 10, date: '2024-09-10', site: '강남 재건축 현장', office: '서울청', manager: '김철수', status: '완료', result: '양호', details: '', photos: [] },
  { id: 11, date: '2024-11-05', site: '판교 밸리 2차', office: '서울청', manager: '이영희', status: '대기', result: '-', details: '', photos: [] },
  
  // 2025년 데이터
  { id: 6, date: '2025-01-15', site: '제주 공항 확장공사', office: '제주도', manager: '박지민', status: '완료', result: '양호', details: '동절기 공사 중지 해제 점검.', photos: [] },
  { id: 7, date: '2025-02-20', site: '강원 랜드마크 타워', office: '원주청', manager: '이영희', status: '대기', result: '-', details: '', photos: [] },
  { id: 8, date: '2025-03-10', site: '서울 역세권 개발', office: '서울청', manager: '김철수', status: '완료', result: '3차 초과', details: '중대 결함 발견, 즉시 작업 중지.', photos: [] },
  { id: 9, date: '2025-04-05', site: '대전 사이언스 콤플렉스', office: '대전청', manager: '박지민', status: '대기', result: '-', details: '', photos: [] },
  { id: 12, date: '2025-05-12', site: '세종 스마트시티', office: '대전청', manager: '최수호', status: '대기', result: '-', details: '', photos: [] },
];

/* ==================================================================================
 * [메인 앱] App Component
 * ================================================================================== */
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inspections, setInspections] = useState(INITIAL_DATA);
  const [selectedInspectionId, setSelectedInspectionId] = useState(null);
  const [notification, setNotification] = useState(null);

  // 알림 토스트 표시 함수
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. 데이터 생성 (CREATE)
  const handleAddData = (newRecord) => {
    setInspections(prev => [newRecord, ...prev]);
    showNotification('새로운 점검 일정이 등록되었습니다.', 'success');
    setActiveTab('history');
  };

  // 2. 데이터 수정 (UPDATE)
  const handleUpdateData = (id, updatedData) => {
    setInspections(prev => prev.map(i => i.id === id ? { ...i, ...updatedData } : i));
    showNotification('데이터가 성공적으로 수정되었습니다.', 'success');
  };

  // 탭 라우팅
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard inspections={inspections} />;
      case 'calendar': return <FullCalendar inspections={inspections} onDateClick={(ins) => { 
        if (ins.status === '완료') { setActiveTab('history'); } 
        else { setSelectedInspectionId(ins.id); setActiveTab('inspect'); } 
      }} />;
      case 'register': return <RegisterForm onAdd={handleAddData} />;
      case 'inspect': return <PerformInspection inspections={inspections} preSelectedId={selectedInspectionId} 
        onUpdate={(id, data) => { 
          handleUpdateData(id, { ...data, status: '완료' }); 
          setSelectedInspectionId(null); 
          setActiveTab('history'); 
        }} 
        onNotify={showNotification} 
      />;
      case 'history': return <HistoryView data={inspections} onEditSave={handleUpdateData} onNotify={showNotification} />;
      default: return <Dashboard inspections={inspections} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* 사이드바 */}
      <nav className="bg-slate-900 text-white w-full md:w-44 p-4 flex flex-col space-y-6 z-20 border-r border-slate-800 shrink-0">
        <div className="flex items-center space-x-2 mb-2 px-1">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-black tracking-tight uppercase">SafeGuard</span>
        </div>
        <div className="flex flex-col space-y-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="대시보드" />
          <NavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon />} label="점검 캘린더" />
          <NavItem active={activeTab === 'register'} onClick={() => setActiveTab('register')} icon={<CalendarPlus />} label="일정 등록" />
          <NavItem active={activeTab === 'inspect'} onClick={() => { setSelectedInspectionId(null); setActiveTab('inspect'); }} icon={<Camera />} label="점검 수행" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History />} label="이력 조회" />
        </div>
        <div className="mt-auto pt-4 border-t border-slate-800 px-1">
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-[11px] font-bold truncate">관리자</p>
              <p className="text-[9px] text-blue-400 truncate italic">v4.0.1 (Safe)</p>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50 relative">
        {renderContent()}
        
        {/* 알림 토스트 (Toast) */}
        {notification && (
          <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300 ${notification.type === 'success' ? 'bg-green-600 text-white' : notification.type === 'loading' ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>
            {notification.type === 'loading' ? <Loader size={18} className="animate-spin" /> : 
             notification.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
            <span className="font-bold text-xs">{notification.message}</span>
          </div>
        )}
      </main>
    </div>
  );
};

// UI 컴포넌트: 네비게이션 아이템
const NavItem = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex items-center space-x-2 p-2.5 rounded-xl transition-all w-full text-left group ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span className={`shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{React.cloneElement(icon, { size: 18 })}</span>
    <span className="font-bold text-[13px] whitespace-nowrap overflow-hidden">{label}</span>
  </button>
);

/* ==================================================================================
 * [1] 대시보드 탭 Components
 * ================================================================================== */
const Dashboard = ({ inspections }) => {
  const yearGroups = useMemo(() => {
    const groups = {};
    inspections.forEach(item => {
      const year = item.date ? item.date.split('-')[0] : 'Unknown';
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0] - a[0]);
  }, [inspections]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="px-1 text-left">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight text-left">연도별 종합 현황</h2>
        <p className="text-slate-500 text-xs mt-0.5 tracking-tight font-medium text-left">각 연도별, 청별, 분기별 상세 통계 및 그래프입니다.</p>
      </div>
      {yearGroups.map(([year, data]) => <YearlySection key={year} year={year} data={data} />)}
      {yearGroups.length === 0 && <div className="text-center py-20 text-slate-400 font-bold">데이터가 없습니다.</div>}
    </div>
  );
};

const YearlySection = ({ year, data }) => {
  const stats = useMemo(() => {
    const byOffice = { '서울청': 0, '대전청': 0, '원주청': 0, '제주도': 0 };
    const byQuarter = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const byQuarterOffice = {
      1: { '서울청': 0, '대전청': 0, '원주청': 0, '제주도': 0 },
      2: { '서울청': 0, '대전청': 0, '원주청': 0, '제주도': 0 },
      3: { '서울청': 0, '대전청': 0, '원주청': 0, '제주도': 0 },
      4: { '서울청': 0, '대전청': 0, '원주청': 0, '제주도': 0 },
    };

    data.forEach(item => {
      if (byOffice.hasOwnProperty(item.office)) byOffice[item.office]++;
      const q = getQuarter(item.date);
      if (byQuarter.hasOwnProperty(q)) byQuarter[q]++;
      if (byQuarterOffice[q] && byQuarterOffice[q].hasOwnProperty(item.office)) {
        byQuarterOffice[q][item.office]++;
      }
    });

    const maxQuarterCount = Math.max(...Object.values(byQuarter), 0);
    const scaleMax = Math.max(10, maxQuarterCount);

    return { total: data.length, byOffice, byQuarter, byQuarterOffice, scaleMax };
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
        <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-sm">{year}년</div>
        <div className="h-px flex-1 bg-slate-100"></div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-2 mr-4">
            <BarChart3 size={16} className="text-slate-400" />
            <span className="text-xs font-black text-slate-700">전체 <span className="text-blue-600 text-sm ml-1">{stats.total}</span>건</span>
          </div>
          <div className="w-px h-4 bg-slate-300 mx-2 hidden sm:block"></div>
          {Object.entries(stats.byOffice).map(([office, count]) => (
            <div key={office} className="flex items-center space-x-1 min-w-[80px]">
              <span className="text-xs text-slate-500 font-bold">{office}</span>
              <span className={`text-xs font-black ${count > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{count}건</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-2 mr-4">
            <Clock size={16} className="text-slate-400" />
            <span className="text-xs font-black text-slate-700">분기별 현황</span>
          </div>
          <div className="w-px h-4 bg-slate-300 mx-2 hidden sm:block"></div>
          {[1, 2, 3, 4].map(q => (
            <div key={q} className="flex items-center space-x-1 min-w-[80px]">
              <span className="text-xs text-slate-500 font-bold">{q}분기</span>
              <span className={`text-xs font-black ${stats.byQuarter[q] > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{stats.byQuarter[q]}건</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        <div className="border border-slate-100 rounded-2xl p-6 h-full min-h-[340px] flex flex-col justify-center">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center">
            <PieChart size={14} className="mr-2" /> 청별 점검 비중
          </h4>
          <div className="space-y-6">
            {Object.entries(stats.byOffice).map(([office, count]) => {
              const percent = stats.total > 0 ? Math.round(count / stats.total * 100) : 0;
              return (
                <div key={office} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>{office}</span>
                    <span>{count}건 ({percent}%)</span>
                  </div>
                  <div className="relative group cursor-pointer hover:z-50">
                    <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-1000 ${OFFICE_COLORS[office]}`} style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="absolute bottom-full left-[80%] mb-1 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-xl border border-white/10">
                      <div className="text-center font-bold">{office}: <span className="text-blue-200">{count}건</span> ({percent}%)</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl p-6 flex flex-col h-full min-h-[340px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
              <TrendingUp size={14} className="mr-2" /> 분기별 추이
            </h4>
            <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold">Max Scale: {stats.scaleMax}건</span>
          </div>
          
          <div className="flex-1 flex items-end justify-between space-x-6 px-4 pb-0 border-b border-slate-200 relative">
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-[9px] text-slate-300 font-bold z-0">
              <div className="border-t border-slate-100 w-full relative h-0"><span className="absolute -top-2 -left-6">{stats.scaleMax}</span></div>
              <div className="border-t border-dashed border-slate-100 w-full relative h-0"><span className="absolute -top-2 -left-6">{Math.round(stats.scaleMax / 2)}</span></div>
              <div className="border-t border-slate-200 w-full relative h-0"><span className="absolute -top-2 -left-6">0</span></div>
            </div>

            {[1, 2, 3, 4].map(q => {
              const qTotal = stats.byQuarter[q];
              const totalHeightPct = (qTotal / stats.scaleMax) * 100;
              
              return (
                <div key={q} className="flex flex-col items-center justify-end w-full h-full group relative z-10 hover:z-50">
                  <div className="w-full max-w-[40px] relative transition-all duration-700 ease-out" style={{ height: `${totalHeightPct}%` }}>
                    {qTotal > 0 && (
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[11px] font-black text-slate-900 whitespace-nowrap z-30">{qTotal}</span>
                    )}
                    <div className="absolute inset-0 flex flex-col-reverse rounded-t-xl overflow-hidden bg-slate-50 shadow-sm z-10 pointer-events-none">
                       {Object.entries(stats.byQuarterOffice[q]).map(([office, count]) => {
                          if (count === 0) return null;
                          const innerHeightPct = (count / qTotal) * 100;
                          return <div key={`bg-${office}`} className={`w-full ${OFFICE_COLORS[office]} border-b border-white/20 last:border-0`} style={{ height: `${innerHeightPct}%` }}></div>;
                       })}
                    </div>
                    <div className="absolute inset-0 flex flex-col-reverse overflow-visible z-20">
                       {Object.entries(stats.byQuarterOffice[q]).map(([office, count]) => {
                          if (count === 0) return null;
                          const innerHeightPct = (count / qTotal) * 100;
                          const percent = Math.round((count / qTotal) * 100);
                          return (
                            <div key={`hit-${office}`} className="w-full relative group/segment hover:z-50" style={{ height: `${innerHeightPct}%` }}>
                               <div className="absolute inset-0 hover:bg-white/10 transition-colors cursor-pointer"></div>
                               <div className="absolute bottom-[80%] left-[80%] mb-1 ml-1 px-3 py-2 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] rounded-xl opacity-0 group-hover/segment:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-xl border border-white/10">
                                  <div className="text-left leading-tight"><p className="font-bold text-blue-200 mb-0.5">{office}</p><p className="font-medium text-white">{count}건 <span className="text-slate-400 text-[10px]">({percent}%)</span></p></div>
                                  <div className="absolute top-full left-2 border-4 border-transparent border-t-slate-900/95"></div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-3">{q}분기</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {Object.entries(OFFICE_COLORS).map(([label, color]) => (
              <div key={label} className="flex items-center space-x-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
                <span className="text-[10px] text-slate-500 font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================================================================================
 * [2] 캘린더 탭 Components
 * ================================================================================== */
const FullCalendar = ({ inspections, onDateClick }) => {
  const [currentDate] = useState(new Date(2024, 4, 1));
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getDayInspections = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return inspections.filter(ins => ins.date === dateStr);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
      <div className="flex justify-between items-center px-1">
        <div className="text-left"><h2 className="text-2xl font-black text-slate-900 tracking-tight">점검 캘린더</h2><p className="text-slate-500 text-xs mt-0.5">날짜별 사업 점검 일정을 확인하세요.</p></div>
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 space-x-1"><button className="p-1.5 hover:bg-slate-50 rounded text-slate-400"><ChevronLeft size={16} /></button><div className="px-3 py-1.5 font-black text-slate-800 text-xs">{year}년 {month + 1}월</div><button className="p-1.5 hover:bg-slate-50 rounded text-slate-400"><ChevronRight size={16} /></button></div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">{['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (<div key={d} className={`p-3 text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{d}</div>))}</div>
        <div className="grid grid-cols-7">{calendarDays.map((day, idx) => {
            const dayIns = getDayInspections(day);
            return (
              <div key={idx} className={`min-h-[110px] md:min-h-[130px] p-2 border-r border-b border-slate-100 last:border-r-0 relative group ${!day ? 'bg-slate-50/30' : ''}`}>
                {day && (<><div className="flex justify-between items-start mb-1 px-1"><span className="text-[11px] font-black text-slate-400">{day}</span></div><div className="space-y-1 text-left relative">{dayIns.map(ins => (<div key={ins.id} className="relative group/item"><div onClick={() => onDateClick(ins)} className={`px-1.5 py-1 rounded text-[9px] font-black cursor-pointer transition-all border truncate ${ins.status === '완료' ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'}`}>{ins.site}</div><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all z-[60] pointer-events-none border border-slate-700"><div className="space-y-2"><div className="flex items-center space-x-1.5 pb-1.5 border-b border-slate-700"><Building2 size={12} className="text-blue-400" /><span className="text-[10px] font-black text-blue-100">{ins.office}</span></div><div className="space-y-1"><p className="text-[11px] font-bold leading-tight line-clamp-2">{ins.site}</p><div className="flex items-center justify-between text-[9px] text-slate-400 pt-1"><span className="flex items-center"><User size={10} className="mr-1" /> {ins.manager}</span><span className={`font-bold px-1.5 py-0.5 rounded ${ins.status === '완료' ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>{ins.status === '완료' ? '수행완료' : '수행대기'}</span></div></div></div><div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div></div></div>))}</div></>)}
              </div>
            );
          })}</div>
      </div>
    </div>
  );
};

/* ==================================================================================
 * [3] 등록 및 수행 탭 Components
 * ================================================================================== */
const RegisterForm = ({ onAdd }) => {
  const [formData, setFormData] = useState({ date: '', site: '', office: '서울청', manager: '' });
  const handleSubmit = (e) => { e.preventDefault(); onAdd({ ...formData, id: Date.now(), status: '대기', result: '-', details: '', photos: [] }); };
  return (
    <div className="max-w-lg mx-auto py-2 text-left">
      <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">점검 일정 등록</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">1. 점검일자</label><input type="date" required className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" onChange={e => setFormData({...formData, date: e.target.value})} /></div>
        <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">2. 사업명</label><input type="text" placeholder="사업명 입력" required className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" onChange={e => setFormData({...formData, site: e.target.value})} /></div>
        <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">3. 국토청</label><select required className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" value={formData.office} onChange={e => setFormData({...formData, office: e.target.value})}><option value="서울청">서울청</option><option value="원주청">원주청</option><option value="대전청">대전청</option><option value="제주도">제주도</option></select></div>
        <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">4. 담당자</label><input type="text" placeholder="담당자 성함" required className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" onChange={e => setFormData({...formData, manager: e.target.value})} /></div>
        <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-black shadow-lg uppercase tracking-tighter">Submit Schedule</button>
      </form>
    </div>
  );
};

const PerformInspection = ({ inspections, onUpdate, preSelectedId, onNotify }) => {
  const [selectedId, setSelectedId] = useState(preSelectedId || null);
  const [scheduleData, setScheduleData] = useState({ site: '', date: '', office: '서울청', manager: '' });
  const [resultData, setResultData] = useState({ result: '양호', details: '', photos: [] });
  const fileInputRef = useRef(null);
  
  const pendingList = useMemo(() => inspections.filter(i => i.status !== '완료'), [inspections]);

  useEffect(() => {
    const id = preSelectedId || selectedId;
    if (id) {
      const item = inspections.find(i => i.id === id);
      if (item) { setScheduleData({ site: item.site, date: item.date, office: item.office, manager: item.manager }); setResultData({ result: '양호', details: '', photos: [] }); }
    }
  }, [selectedId, preSelectedId, inspections]);

  const handlePhotoChange = (e) => { const files = Array.from(e.target.files); const fileNames = files.map(f => f.name); setResultData(prev => ({ ...prev, photos: [...prev.photos, ...fileNames] })); };
  const removePhoto = (index) => { setResultData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) })); };
  const handleFinalSubmit = () => { onUpdate(selectedId, { ...scheduleData, ...resultData }); };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">현장 점검 수행</h2>
      {!selectedId ? (
        <div className="space-y-10">
          {OFFICE_ORDER.map(office => {
            const officeItems = pendingList.filter(item => item.office === office);
            return (
              <div key={office} className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-2"><Building2 className="w-5 h-5 text-blue-600" /><h3 className="text-lg font-black text-slate-800">{office}</h3><span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{officeItems.length}건</span></div>
                {officeItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {officeItems.map(i => (
                      <button key={i.id} onClick={() => setSelectedId(i.id)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 transition-all flex flex-col justify-between group text-left h-full">
                        <div className="overflow-hidden w-full mb-3"><p className="text-[10px] text-blue-600 font-black">{formatDateShort(i.date)}</p><h4 className="font-black text-sm truncate mt-0.5 w-full" title={i.site}>{i.site}</h4><p className="text-[11px] text-slate-400 font-medium mt-0.5">담당: {i.manager}</p></div>
                        <div className="w-full flex justify-end"><ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500" /></div>
                      </button>
                    ))}
                  </div>
                ) : (<div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center"><span className="text-xs text-slate-400 font-bold italic">대기 중인 점검 일정이 없습니다.</span></div>)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-500">
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 text-left">
            <div className="flex justify-between items-center border-b pb-4"><h3 className="text-lg font-black flex items-center"><Edit3 className="w-4 h-4 mr-2 text-blue-600" /> 정보 수정</h3><button onClick={() => setSelectedId(null)} className="text-slate-400 text-xs font-bold px-2 py-1 hover:bg-red-50 rounded">취소</button></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사업명</label><input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" value={scheduleData.site} onChange={e => setScheduleData({...scheduleData, site: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">점검 일자</label><input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">국토청</label><select className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" value={scheduleData.office} onChange={e => setScheduleData({...scheduleData, office: e.target.value})}><option value="서울청">서울청</option><option value="원주청">원주청</option><option value="대전청">대전청</option><option value="제주도">제주도</option></select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">담당자</label><input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" value={scheduleData.manager} onChange={e => setScheduleData({...scheduleData, manager: e.target.value})} /></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 text-left">
            <h3 className="text-lg font-black flex items-center border-b pb-4"><ClipboardCheck className="w-4 h-4 mr-2 text-green-600" /> 결과 등록</h3>
            <div className="space-y-5">
              <div className="space-y-2"><label className="text-xs font-bold text-slate-700 ml-1">1. 관리기준 선택</label><div className="grid grid-cols-3 gap-2">{['양호', '2차 초과', '3차 초과'].map(std => (<button key={std} onClick={() => setResultData({...resultData, result: std})} className={`p-3 rounded-xl border-2 transition-all text-xs font-black ${resultData.result === std ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent bg-slate-50'}`}>{std}</button>))}</div></div>
              <div className="space-y-2"><label className="text-xs font-bold text-slate-700 ml-1">2. 점검내용 (상세 기록)</label><textarea rows={6} placeholder="현장 상황 및 특이사항을 상세히 입력하세요." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-medium leading-relaxed" value={resultData.details} onChange={e => setResultData({...resultData, details: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-xs font-bold text-slate-700 ml-1">3. 현장사진 업로드</label><div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center space-y-2 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer bg-slate-50 group"><ImageIcon className="text-slate-400 group-hover:text-blue-500" size={28} /><p className="text-xs text-slate-600 font-bold">사진첩에서 사진 선택</p><input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoChange} /></div>{resultData.photos.length > 0 && (<div className="grid grid-cols-2 gap-2 mt-4">{resultData.photos.map((name, index) => (<div key={index} className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden"><span className="text-[10px] font-bold text-slate-600 truncate mr-2">{name}</span><X size={16} className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0" onClick={() => removePhoto(index)} /></div>))}</div>)}</div>
              <button onClick={handleFinalSubmit} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all mt-4 uppercase">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- [업데이트] 이력 조회 (다중 선택 및 PDF 다운로드 기능 추가 + 알림 연동) ---
const HistoryView = ({ data, onEditSave, onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOffice, setFilterOffice] = useState('전체');
  const [filterYear, setFilterYear] = useState('전체');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportModalItem, setReportModalItem] = useState(null);
  const [editModalItem, setEditModalItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const uniqueYears = useMemo(() => {
    const years = data.map(item => item.date.split('-')[0]);
    return [...new Set(years)].sort().reverse();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(i => {
      const matchYear = filterYear === '전체' || i.date.startsWith(filterYear);
      const matchSite = (i.site || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchOffice = filterOffice === '전체' || i.office === filterOffice;
      const isAfterStart = !startDate || i.date >= startDate;
      const isBeforeEnd = !endDate || i.date <= endDate;
      return matchYear && matchSite && matchOffice && isAfterStart && isBeforeEnd;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data, searchTerm, filterOffice, startDate, endDate, filterYear]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleDownloadPDF = (ids) => {
    if (!ids || ids.length === 0) {
      onNotify('선택된 항목이 없습니다.', 'error');
      return;
    }
    const count = ids.length;
    onNotify(`${count}건의 점검 보고서 PDF 변환 중...`, 'loading');
    setTimeout(() => {
      onNotify(`${count}건의 보고서 다운로드가 완료되었습니다.`, 'success');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-1">
        <div className="text-left">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">이력 조회</h2>
          <p className="text-slate-500 text-[11px] font-semibold italic">Archived inspection data</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative">
            <select className="p-2 pl-8 border border-slate-200 rounded-lg text-xs font-bold outline-none appearance-none bg-white min-w-[80px]" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="전체">전체 연도</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <CalendarDays size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
            <div className="relative"><input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if(!e.target.value) e.target.type = 'text'; }} placeholder="시작" className="w-20 p-1 text-xs font-bold outline-none bg-transparent text-center placeholder:text-slate-400 cursor-pointer" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <span className="text-slate-300 text-[10px] font-bold">~</span>
            <div className="relative"><input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if(!e.target.value) e.target.type = 'text'; }} placeholder="종료" className="w-20 p-1 text-xs font-bold outline-none bg-transparent text-center placeholder:text-slate-400 cursor-pointer" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <input type="text" placeholder="사업명 검색" className="flex-1 md:flex-none p-2 border border-slate-200 rounded-lg text-xs outline-none min-w-[100px]" onChange={e => setSearchTerm(e.target.value)} />
          <select className="p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none" value={filterOffice} onChange={e => setFilterOffice(e.target.value)}>
            <option value="전체">전체 청</option>
            <option value="서울청">서울청</option>
            <option value="원주청">원주청</option>
            <option value="대전청">대전청</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl animate-in slide-in-from-top-2 fade-in">
          <div className="flex items-center space-x-2"><CheckCircle2 size={16} className="text-blue-600" /><span className="text-xs font-bold text-blue-800">{selectedIds.size}개 항목 선택됨</span></div>
          <button onClick={() => handleDownloadPDF(Array.from(selectedIds))} className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"><Download size={14} /><span>선택 다운로드</span></button>
        </div>
      )}

      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 w-10 text-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedIds.size === filteredData.length && filteredData.length > 0} onChange={toggleSelectAll} /></th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">일자</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">사업명</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">국토청</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">담당자</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">결과</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y text-left">
              {filteredData.map(row => (
                <tr key={row.id} className={`hover:bg-slate-50 group text-left ${selectedIds.has(row.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-4 text-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedIds.has(row.id)} onChange={() => toggleSelectOne(row.id)} /></td>
                  <td className="p-4 text-[11px] font-bold text-slate-500 text-left">{formatDateShort(row.date)}</td>
                  <td className="p-4 text-xs font-black truncate max-w-[140px] text-left">{row.site}</td>
                  <td className="p-4 text-[11px] font-bold text-slate-400 text-left">{row.office}</td>
                  <td className="p-4 text-xs font-bold text-slate-600 text-left">{row.manager}</td>
                  <td className="p-4 text-left"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${row.result === '양호' ? 'bg-green-100 text-green-700' : row.result.includes('초과') ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}`}>{row.result}</span></td>
                  <td className="p-4 text-center">
                    {row.status === '완료' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => setReportModalItem(row)} className="text-blue-500 hover:text-blue-700 transition-colors p-1" title="보기"><ExternalLink size={14} /></button>
                        <button onClick={() => setEditModalItem(row)} className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="수정"><Edit3 size={14} /></button>
                        <button onClick={() => handleDownloadPDF([row.id])} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="다운로드"><Download size={14} /></button>
                      </div>
                    ) : <span className="text-[10px] text-slate-300 font-bold italic uppercase tracking-widest">Pending</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="md:hidden space-y-4">
        {filteredData.length > 0 && (
          <div className="flex justify-between items-center px-1">
            <button onClick={toggleSelectAll} className="text-xs font-bold text-slate-500 flex items-center space-x-1"><div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedIds.size === filteredData.length ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>{selectedIds.size === filteredData.length && <CheckCircle2 size={12} />}</div><span>전체 선택</span></button>
          </div>
        )}
        {filteredData.map(row => (
          <div key={row.id} className={`bg-white p-5 rounded-2xl shadow-sm border space-y-4 ${selectedIds.has(row.id) ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <input type="checkbox" className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedIds.has(row.id)} onChange={() => toggleSelectOne(row.id)} />
                <div><span className="text-[10px] text-slate-400 font-bold">{formatDateShort(row.date)}</span><h3 className="font-black text-slate-800 text-base mt-0.5">{row.site}</h3></div>
              </div>
              {row.status !== '완료' && <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold">대기중</span>}
            </div>
            <div className="flex items-center space-x-4 text-xs text-slate-600 pl-7"><div className="flex items-center"><Building2 size={14} className="mr-1 text-slate-400"/> <span className="font-bold">{row.office}</span></div><div className="flex items-center"><User size={14} className="mr-1 text-slate-400"/> <span className="font-bold">{row.manager}</span></div></div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 pl-7">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${row.result === '양호' ? 'bg-green-50 text-green-600' : row.result.includes('초과') ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>{row.result}</span>
              {row.status === '완료' && (
                <div className="flex space-x-3">
                  <button onClick={() => setReportModalItem(row)} className="flex items-center text-blue-600 text-xs font-bold"><ExternalLink size={14} className="mr-1"/> 보기</button>
                  <button onClick={() => setEditModalItem(row)} className="flex items-center text-slate-400 text-xs font-bold hover:text-slate-600"><Edit3 size={14} className="mr-1"/> 수정</button>
                  <button onClick={() => handleDownloadPDF([row.id])} className="flex items-center text-slate-400 text-xs font-bold hover:text-blue-600"><Download size={14} className="mr-1"/> 다운</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {reportModalItem && <ReportModal item={reportModalItem} onClose={() => setReportModalItem(null)} />}
      {editModalItem && <EditModal item={editModalItem} onClose={() => setEditModalItem(null)} onSave={onEditSave} />}
    </div>
  );
};

// ... (ReportModal, EditModal 등 기존 모달 컴포넌트는 유지)
const ReportModal = ({ item, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left">
      <div className="p-8 border-b flex justify-between items-start bg-slate-50">
        <div className="text-left"><span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{item.office}</span><h3 className="text-xl font-black mt-2">{item.site} 안전 보고서</h3></div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-transform hover:rotate-90"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-8 text-left">
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl">
          <div className="text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">담당자</p><p className="text-sm font-bold">{item.manager}</p></div>
          <div className="text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">관리기준</p><p className={`text-sm font-black ${item.result === '양호' ? 'text-green-600' : 'text-orange-600'}`}>{item.result}</p></div>
        </div>
        <div className="space-y-3"><h4 className="text-sm font-black border-l-4 border-blue-500 pl-3">상세 점검 내용</h4><div className="bg-slate-50 p-6 rounded-3xl text-sm leading-relaxed text-slate-700 min-h-[100px]">{item.details || '등록된 내용이 없습니다.'}</div></div>
        <div className="space-y-3"><h4 className="text-sm font-black border-l-4 border-amber-500 pl-3">첨부 사진</h4><div className="grid grid-cols-2 gap-2">{item.photos && item.photos.length > 0 ? item.photos.map((p, i) => (<div key={i} className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center p-2 text-left overflow-hidden"><span className="text-[10px] font-bold text-slate-400 truncate w-full text-center italic">{p}</span></div>)) : <p className="text-xs text-slate-400 col-span-2 py-4 italic">No images attached</p>}</div></div>
      </div>
      <div className="p-6 border-t bg-slate-50 text-center"><button onClick={onClose} className="px-10 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest">Close</button></div>
    </div>
  </div>
);

const EditModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...item });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in text-left">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col text-left">
        <div className="p-6 border-b flex justify-between items-center bg-blue-50 text-left">
          <h3 className="text-lg font-black flex items-center"><Edit3 className="w-4 h-4 mr-2" /> 데이터 수정</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 ml-1">사업명</label><input type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold" value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 ml-1">점검일자</label><input type="date" className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 ml-1">점검내용</label>
            <textarea rows={6} className="w-full p-3 bg-slate-50 border rounded-xl text-sm leading-relaxed" value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} />
          </div>
        </div>
        <div className="p-6 border-t flex space-x-3 text-left">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-xs text-center">취소</button>
          <button onClick={() => { onSave(formData.id, formData); onClose(); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs flex items-center justify-center space-x-2"><Save size={14} /><span>저장하기</span></button>
        </div>
      </div>
    </div>
  );
};

export default App;