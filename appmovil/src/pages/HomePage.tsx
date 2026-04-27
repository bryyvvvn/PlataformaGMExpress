import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, AlertCircle, Info, Zap, Utensils, Flame } from 'lucide-react';
import { THEME, DEADLINE_HOUR } from '../constants/theme';
import { WEEKLY_MENU, MenuItemType } from '../constants/menu';

/**
 * HomePage: Weekly meal selection interface
 * Displays current day's menu with countdown to order deadline.
 * Supports menu exploration, nutritional info, and order status tracking.
 */
const HomePage: React.FC = () => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);

  const currentMenu: MenuItemType = WEEKLY_MENU[selectedDayIndex];

  /**
   * Calculate remaining time until daily order deadline (10:00 AM).
   * Updates every second.
   */
  useEffect(() => {
    const updateCountdown = (): void => {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(DEADLINE_HOUR, 0, 0, 0);

      const diffMs = deadline.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Plazo Cerrado');
        setIsDeadlinePassed(true);
      } else {
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const seconds = Math.floor((diffMs / 1000) % 60);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        setIsDeadlinePassed(false);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: THEME.colors.background }}>
      <div className="p-6 text-white rounded-b-4xl shadow-lg" style={{ backgroundColor: THEME.colors.secondary }}>
        <h2 className="text-lg font-bold opacity-90 tracking-tight">Bienvenido, Matías</h2>
      </div>

      {/* Order Deadline Countdown */}
      <div className="mx-6 -mt-5 p-4 rounded-2xl shadow-xl bg-white border-b-4" style={{ borderBottomColor: isDeadlinePassed ? THEME.colors.error : THEME.colors.primary }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDeadlinePassed ? 'bg-red-50' : 'bg-green-50'}`}>
              <Clock size={20} className={isDeadlinePassed ? 'text-red-500' : 'text-green-600'} />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Tiempo para pedir</p>
              <p className="text-xl font-black tracking-tight" style={{ color: THEME.colors.secondary }}>
                {timeRemaining}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly day selector */}
      <section className="mt-8 px-6">
        <div className="flex justify-between gap-2">
          {['L', 'M', 'M', 'J', 'V'].map((dayAbbr, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedDayIndex(index);
                setShowNutritionDetails(false);
              }}
              className="flex-1 flex flex-col items-center p-3 rounded-2xl border-2 transition-all active:scale-95"
              style={{
                borderColor: selectedDayIndex === index ? THEME.colors.primary : 'transparent',
                backgroundColor: selectedDayIndex === index ? `${THEME.colors.primary}15` : 'white',
              }}
            >
              <span className="text-[10px] font-bold text-gray-500">{dayAbbr}</span>
              <span className="text-lg font-black" style={{ color: selectedDayIndex === index ? THEME.colors.secondary : '#9CA3AF' }}>
                {14 + index}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Meal card */}
      <section className="mt-6 px-6">
        <div
          onClick={() => setShowNutritionDetails(!showNutritionDetails)}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:bg-gray-50 transition-colors"
        >
          {/* Meal image */}
          <div className="h-40 w-full relative overflow-hidden bg-gray-200">
            <img src={currentMenu.imageUrl} alt={currentMenu.dishName} className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <CheckCircle size={14} style={{ color: THEME.colors.primary }} />
              <span className="text-[10px] font-bold" style={{ color: THEME.colors.secondary }}>
                PEDIDO CONFIRMADO
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase" style={{ color: THEME.colors.primary }}>
                  {currentMenu.dayName} {currentMenu.dateDisplay}
                </p>
                <h3 className="text-xl font-black leading-tight" style={{ color: THEME.colors.secondary }}>
                  {currentMenu.dishName}
                </h3>
              </div>
              <div className="p-2 rounded-xl" style={{ backgroundColor: `${THEME.colors.secondary}10` }}>
                <Info size={18} style={{ color: THEME.colors.secondary }} />
              </div>
            </div>

            {/* Expandable nutrition details */}
            {showNutritionDetails && (
              <div className="mt-5 pt-5 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{currentMenu.description}</p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-orange-50 p-3 rounded-2xl flex flex-col items-center">
                    <Flame size={16} className="text-orange-500 mb-1" />
                    <span className="text-xs font-black" style={{ color: THEME.colors.secondary }}>
                      {currentMenu.nutrition.calories}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">kcal</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-2xl flex flex-col items-center">
                    <Utensils size={16} className="text-blue-500 mb-1" />
                    <span className="text-xs font-black" style={{ color: THEME.colors.secondary }}>
                      {currentMenu.nutrition.protein}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">proteína</span>
                  </div>
                  <div className="bg-green-50 p-3 rounded-2xl flex flex-col items-center">
                    <Zap size={16} className="text-green-500 mb-1" />
                    <span className="text-xs font-black" style={{ color: THEME.colors.secondary }}>
                      {currentMenu.nutrition.carbs}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">carbs</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg">
                  <AlertCircle size={12} />
                  <span>Basado en porción estándar de servicio.</span>
                </div>
              </div>
            )}

            {!showNutritionDetails && (
              <p className="mt-3 text-xs font-bold flex items-center gap-1" style={{ color: THEME.colors.primary }}>
                Toca para ver detalles nutricionales...
              </p>
            )}
          </div>
        </div>

        {/* Order status badge */}
        <div
          className="mt-4 p-4 rounded-2xl flex items-center gap-3"
          style={{
            backgroundColor: currentMenu.isAutoAssigned ? '#EFF6FF' : '#F0FDF4',
            color: currentMenu.isAutoAssigned ? '#1E40AF' : '#166534',
          }}
        >
          <AlertCircle size={16} />
          <p className="text-[10px] leading-tight font-medium uppercase tracking-tight">
            {currentMenu.isAutoAssigned ? 'Asignado automáticamente por el sistema.' : 'Seleccionado por el usuario.'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;