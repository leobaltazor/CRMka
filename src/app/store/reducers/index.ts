import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer
} from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { AppStore } from 'src/app/models';
import { reducerServices } from './services.reducer';

import { ordersReducer } from '../reducers/order.reducer';

export const reducers: ActionReducerMap<AppStore> = {
  services: reducerServices,
  orders: ordersReducer,
};


export const metaReducers: MetaReducer<AppStore>[] = !environment.production ? [] : [];
