import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ productId, quantity = 1 }, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart', { productId, quantity });
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartItemQty = createAsyncThunk('cart/update', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/cart/${productId}`, { quantity });
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeCartItem = createAsyncThunk('cart/remove', async (productId, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/cart/${productId}`);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart');
    return { items: [] };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    clearCartLocal: (state) => { state.items = []; },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      state.loading = false;
      state.items = action.payload?.items || [];
    };
    [fetchCart, addToCart, updateCartItemQty, removeCartItem, clearCart].forEach((thunk) => {
      builder.addCase(thunk.pending, (state) => { state.loading = true; state.error = null; });
      builder.addCase(thunk.fulfilled, setCart);
      builder.addCase(thunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    });
  },
});

// Selectors
export const selectCartItemCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => {
    const price = item.product?.discountPrice || item.product?.regularPrice || 0;
    return sum + price * item.quantity;
  }, 0);

export const { clearCartLocal } = cartSlice.actions;
export default cartSlice.reducer;
