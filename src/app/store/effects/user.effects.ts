import { Authenticated, AuthError, ClearBusinesses, GetUser, LoadBusiness, Logout, NotAuthenticated, PasswordLogin } from '@actions/*';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { UserActionTypes } from '@constants/*';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { User } from 'firebase/app';
import { defer, from, Observable, of } from 'rxjs';
import { catchError, map, pluck, switchMap, tap } from 'rxjs/operators';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private router: Router
  ) {}

  @Effect()
  getUser: Observable<Action | {}> = this.actions$.pipe(
    ofType(UserActionTypes.GetUser),
    map((action: GetUser) => action),
    switchMap(_ => this.afAuth.authState),
    switchMap((authData: User) => {
      if (authData) {
        let first_name, last_name, displayName;
        if (authData.displayName) {
          const fullName = authData.displayName.split(' ').filter(e => e);
          if (fullName.length > 1) {
            first_name = fullName[0];
            last_name = fullName[0];
            displayName = authData.displayName;
          } else {
            first_name = fullName[0];
            last_name = null;
            displayName = first_name;
          }
        } else {
          first_name = null;
          last_name = null;
          displayName = 'NoName';
        }
        const currentUser = {
          first_name: first_name,
          last_name: last_name,
          displayName: displayName,
          email: authData.email,
          phoneNumber: authData.phoneNumber,
          photoURL: authData.photoURL,
          providerId: authData.providerId,
          uid: authData.uid
        };
        const userListRef = this.db.object('/clients/' + authData.uid);
        userListRef.update(currentUser);
        return userListRef.valueChanges();
      }
      return of(null);
    }),
    map(user => {
      if (user) {
        return new Authenticated({ user });
      } else {
        return new NotAuthenticated();
      }
    }),
    catchError(err => of(new AuthError({ error: err.message })))
  );

  @Effect()
  authenticated$ = this.actions$.pipe(
    ofType<Authenticated>(UserActionTypes.Authenticated),
    tap(_ => {
      this.router.navigate(['select-business']);
      // return from([
      //   new LoadStatuses(),
      //   new LoadOrders(),
      //   new LoadServices(),
      //   new LoadCustomers(),
      //   new LoadBusiness()
      // ]);
    }),
    map(() => new LoadBusiness()),
    catchError(err => {
      console.log('authenticatedError', err);
      return err;
    })
  );
  @Effect()
  notAuthenticated$ = this.actions$.pipe(
    ofType<NotAuthenticated>(UserActionTypes.NotAuthenticated),
    tap(_ => this.router.navigate([''])),
    map(_ => {
      return new ClearBusinesses();
      // return from([
        // new ClearStatuses(),
        // new ClearOrders(),
        // new ClearServices(),
        // new ClearCustomers(),
        // new ClearBusinesses()
      // ]);
    }),
    catchError(err => {
      console.log('notAuthenticatedError', err);
      return err;
    })
  );
  @Effect({ dispatch: false })
  logout: Observable<Action> = this.actions$.pipe(
    ofType(UserActionTypes.Logout),
    map((action: Logout) => action.payload),
    switchMap(_ => {
      return of(this.afAuth.auth.signOut());
    }),
    map(_ => {
      return new NotAuthenticated();
    }),
    catchError(error => {
      return of(new AuthError({ error }));
    })
  );

  @Effect()
  loginPassword: Observable<Action> = this.actions$.pipe(
    ofType<PasswordLogin>(UserActionTypes.EmailPasswordLogin),
    pluck('payload'),
    // map((action: PasswordLogin) => action.payload),
    switchMap(loginData => {
      console.log('loginData', loginData);
      return this.signInWithEmailAndPassword(loginData);
    }),
    switchMap(_ => of(new GetUser())),
    catchError(error => of(new AuthError({ error: error.message })))
  );

  @Effect()
  init$: Observable<Action> = defer(() => {
    return of(new GetUser());
  });

  private signInWithEmailAndPassword(data): Observable<firebase.auth.UserCredential> {
    console.log('PasswordLogin', data);
    return from(
      this.afAuth.auth.signInWithEmailAndPassword(data.email, data.password)
    );
  }
}
