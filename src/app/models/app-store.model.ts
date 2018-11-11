import { StatusesState } from "./statuses.model";


// Todo check for elvis operator. Is required?
export interface AppStore {
  currentClient?: string;
  currentBusiness?: string;
  orders?: any;
  customers?: any;
  services?: any;
  statuses?: StatusesState;
}
