import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    cartDrawerOpen: false,
    searchOpen: false,
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    toggleCartDrawer: (state) => { state.cartDrawerOpen = !state.cartDrawerOpen; },
    setCartDrawerOpen: (state, action) => { state.cartDrawerOpen = action.payload; },
    toggleSearch: (state) => { state.searchOpen = !state.searchOpen; },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleCartDrawer, setCartDrawerOpen, toggleSearch } = uiSlice.actions;
export default uiSlice.reducer;
