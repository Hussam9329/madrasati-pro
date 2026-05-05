import { create } from 'zustand';

export type PageKey = 
  | 'dashboard' 
  | 'students' 
  | 'teachers' 
  | 'subjects' 
  | 'attendance' 
  | 'grades' 
  | 'reports' 
  | 'settings'
  | 'users'
  | 'notices'
  | 'schedule'
  | 'activity';

export interface AuthState {
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AppState {
  // Auth
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
  logout: () => void;

  // Navigation
  activePage: PageKey;
  setActivePage: (page: PageKey) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Selected items
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  
  selectedTeacherId: string | null;
  setSelectedTeacherId: (id: string | null) => void;

  // Loading
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
  },
  setAuth: (auth) => set({ auth }),
  logout: () => set({
    auth: { user: null, token: null, isAuthenticated: false },
    activePage: 'dashboard',
  }),

  // Navigation
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Selected items
  selectedStudentId: null,
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  
  selectedTeacherId: null,
  setSelectedTeacherId: (id) => set({ selectedTeacherId: id }),

  // Loading
  loading: false,
  setLoading: (loading) => set({ loading }),
}));
