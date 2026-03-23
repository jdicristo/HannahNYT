import { catchError, map } from 'rxjs/operators';
import { CONFIG } from '../app.config';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DictionaryService {

  constructor(private http: HttpClient) {
  }

  validateWord(word: string) {
    const url = `${CONFIG.dictionary_base_url}api/v2/entries/en/${word.toLowerCase()}`;
    console.log(`Validating word: ${word} with URL: ${url}`);
    return this.http.get(url).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}