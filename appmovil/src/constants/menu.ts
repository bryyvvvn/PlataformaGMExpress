/** Menu data structure and weekly meal options for the demo */

export interface NutritionInfo {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface MenuItemType {
  dayName: string;
  dateDisplay: string;
  dishName: string;
  description: string;
  isAutoAssigned: boolean;
  nutrition: NutritionInfo;
  imageUrl: string;
}

/**
 * Weekly menu data for GM Express demo.
 * In production, this would be fetched from an API.
 */
export const WEEKLY_MENU: Record<number, MenuItemType> = {
  0: {
    dayName: 'Lunes',
    dateDisplay: '14 de Abril',
    dishName: 'Pollo a la plancha con arroz',
    description: 'Pechuga de pollo grillada con arroz integral y mix de vegetales.',
    isAutoAssigned: true,
    nutrition: {
      calories: 450,
      protein: '35g',
      carbs: '40g',
      fat: '12g',
    },
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=300&auto=format&fit=crop',
  },
  1: {
    dayName: 'Martes',
    dateDisplay: '15 de Abril',
    dishName: 'Lasaña de Boloñesa',
    description: 'Lasaña casera con carne magra, salsa pomodoro y queso bajo en grasa.',
    isAutoAssigned: false,
    nutrition: {
      calories: 620,
      protein: '28g',
      carbs: '55g',
      fat: '22g',
    },
    imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?q=80&w=300&auto=format&fit=crop',
  },
  2: {
    dayName: 'Miércoles',
    dateDisplay: '16 de Abril',
    dishName: 'Pescado al Horno',
    description: 'Filete de reineta al horno con finas hierbas y puré de papas rústico.',
    isAutoAssigned: false,
    nutrition: {
      calories: 380,
      protein: '32g',
      carbs: '30g',
      fat: '8g',
    },
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=300&auto=format&fit=crop',
  },
  3: {
    dayName: 'Jueves',
    dateDisplay: '17 de Abril',
    dishName: 'Porotos Granados',
    description: 'Guiso tradicional chileno con porotos, zapallo y choclo fresco.',
    isAutoAssigned: true,
    nutrition: {
      calories: 510,
      protein: '18g',
      carbs: '75g',
      fat: '10g',
    },
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=300&auto=format&fit=crop',
  },
  4: {
    dayName: 'Viernes',
    dateDisplay: '18 de Abril',
    dishName: 'Hamburguesa Gourmet',
    description: 'Carne de vacuno seleccionada, pan brioche artesanal y papas horneadas.',
    isAutoAssigned: false,
    nutrition: {
      calories: 750,
      protein: '40g',
      carbs: '60g',
      fat: '30g',
    },
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop',
  },
};
